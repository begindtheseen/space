---
id: l10-flight-code-architecture
title: One implementation, a C++ core and a Python layer
minutes: 20
covers:
  - C++ flight core with a Python analysis and plotting layer over it, sharing exactly one implementation of the algorithms
---

Every lesson so far in this module has been about an algorithm meeting another algorithm. This one is about something that sounds like a purely practical, almost administrative concern — which language the flight code is written in, and how the analysis tools that study it are built — and turns out to be exactly as capable of quietly costing a mission as any of the joins this module has already shown. A programme that maintains two implementations of the same algorithm, one flying and one used to analyse and verify it, has not built two views onto one truth. It has built two things that will disagree with each other, on a timescale set only by how long it takes the next person to edit one of them without noticing the other exists.

## Why a second implementation is not a safety net

The instinct behind a second implementation is usually a reasonable one: a Python re-implementation of the guidance law is faster to iterate on, easier to plot from, and does not require a C++ toolchain for an analyst who only wants to study trajectories. None of that is wrong. What is wrong is the conclusion that follows from it — that the Python version is a convenience layered on top of the flight code, rather than a second, independently maintained copy of exactly the logic the flight code is supposed to embody. From the moment the two are written, every fix, every constant, every edge-case handling decision has to be applied twice, by two people, on two schedules, and there is no mechanism — none — that keeps them in step except discipline that has to hold perfectly, forever, across every future change.

::: key The one-implementation rule
The C++ flight core is the single implementation of every algorithm in this module. The Python layer calls into it — through a binding, not a rewrite — for analysis, plotting and campaign orchestration, and owns none of the algorithms itself. There is exactly one place a guidance law, a filter update or a control law is expressed in code, and everything downstream of it, in any language, runs that same code rather than a second description of it.
:::

## Binding, not reimplementing

The mechanism that makes this more than a promise is a binding layer — this module's own resource list points to pybind11 as the standard tool — that exposes the compiled C++ functions directly to Python, so that a Python call is not a second implementation calling the first for comparison; it is the *same* compiled function, executing the same machine code, reached from a different caller.

::: example What the binding actually looks like
A C++ function computing the closed-form guidance law,

```cpp
Eigen::Vector3d zem_zev_accel(const Eigen::Vector3d& r, const Eigen::Vector3d& v,
                               const Eigen::Vector3d& r_f, const Eigen::Vector3d& v_f,
                               const Eigen::Vector3d& g, double t_go, double t_go_floor);
```

exposed to Python with a few lines of binding code rather than a Python rewrite:

```cpp
m.def("zem_zev_accel", &zem_zev_accel,
      py::arg("r"), py::arg("v"), py::arg("r_f"), py::arg("v_f"),
      py::arg("g"), py::arg("t_go"), py::arg("t_go_floor") = 0.5);
```

A Python analysis script calling `capstone_core.zem_zev_accel(r, v, r_f, v_f, g, t_go)` is not calling a Python re-implementation that happens to produce similar numbers — it is calling the identical compiled routine the flight computer runs, with NumPy arrays converted to and from Eigen vectors at the boundary and nothing about the algorithm itself re-expressed anywhere.
:::

## What a second implementation actually costs, measured

The risk of two implementations is not hypothetical, and it does not require a large or dramatic mistake to matter. A single physical constant, rounded slightly differently in two places, is enough.

::: example A rounding difference small enough to hide in every test's tolerance
Flying this module's reference landing burn with the standard gravitational constant $g_0=9.80665\,\mathrm{m/s^2}$ throughout, against an otherwise identical run using a second implementation that rounds the same constant to $g_0=9.81\,\mathrm{m/s^2}$ — a difference of $0.0034\%$, the kind of rounding a well-meaning engineer might introduce without a second thought while transcribing a formula — the two runs' touchdown states diverge by about $0.23\,\mathrm{cm}$ in position and $68\,\mathrm{mm/s}$ in vertical velocity. Both numbers are small enough to vanish inside almost any reasonable unit-test tolerance on their own. That smallness is exactly the danger, not a reassurance: a discrepancy too small for any single test to flag is also too small for a code reviewer skimming a diff to notice, and it costs nothing to introduce, compounding silently with every other such difference two independently maintained copies accumulate over a programme's lifetime.
:::

The same category of accidental discrepancy does not always stay small, and nothing about how the mistake is introduced predicts which kind it will be.

::: example The same category of mistake, with a very different size
Converting a commanded thrust acceleration into a pointing angle uses `atan2`, and `atan2` takes its two arguments in a specific order — $\operatorname{atan2}(a_x, a_z)$ for the convention this module uses throughout. Swapping the argument order, $\operatorname{atan2}(a_z, a_x)$ instead — a change indistinguishable at a glance from the correct call, and exactly the kind of transcription slip a second, independently typed implementation is free to make — turns this module's own $-15.12^\circ$ ignition-time commanded angle into $+105.12^\circ$, a difference of $120.2^\circ$. The two mistakes in this lesson's two examples are the same *kind* of error — one line, differing between two copies of the same function, introduced without any intent to change behaviour — and one of them costs a fraction of a millimetre per second while the other points the vehicle in a direction that shares almost nothing with where it should be pointed. A reviewer who has learned to relax around "it's only a rounding difference" has learned exactly the wrong lesson from the first example to protect against the second.
:::

::: warning A binding does not remove the need for the C++ core itself to be correct
This lesson's rule prevents the Python layer from becoming a second, drifting implementation. It does nothing at all to verify that the single implementation binding replaces is correct in the first place — that is the entire job of the unit, integration and Monte-Carlo verification this module builds elsewhere. One implementation that is wrong is still only one bug to find and fix; two implementations, one of them wrong, is a bug that first has to be noticed as a *disagreement* before anyone can even start asking which side is right.
:::

::: warning "The Python version is only for plots" is where this usually starts
Nobody sets out to build two competing implementations of a guidance law. It starts with a Python function written to make a plot look right for one meeting, kept because it was convenient, extended the next time a similar plot was needed, and eventually trusted for a campaign result without anyone deciding, at any single point, "we now maintain two implementations of this algorithm." The discipline this lesson argues for is deciding, once, structurally, that the Python layer never owns an algorithm at all — not a policy to be re-applied by judgement every time a quick script would be easier to write from scratch.
:::

## Check yourself

::: check
Explain, in terms of what actually executes, why a pybind11 binding is not merely a faster or more convenient version of writing the same algorithm twice.
:::

::: answer
A binding does not contain a second expression of the algorithm at all — it exposes the already-compiled C++ function to a Python caller, converting arguments at the boundary, so that calling it from Python executes the identical machine code the flight computer runs. Writing the algorithm a second time in Python, however carefully, produces a second, independent piece of source code that must be kept correct on its own; a binding has no second source to keep correct, because there is only one implementation for either caller to reach.
:::

::: check
This lesson's two divergence examples both came from a single, small, plausible one-line difference between two implementations. Why does the lesson treat the small-consequence example ($g_0$ rounding) as an equally important warning to the large-consequence one (the swapped `atan2` arguments), rather than dwelling on the more dramatic one alone?
:::

::: answer
The two examples are meant to show that the *size* of an accidental discrepancy's consequence cannot be predicted from how the mistake looks on the page — both are a single, innocuous-looking one-line change, and nothing about reading either line in isolation reveals which category of consequence it belongs to. A warning built only around the dramatic example risks teaching the lesson "watch out for big, visibly wrong-looking changes," which is exactly the wrong lesson, since the small, easy-to-dismiss discrepancy is the one most likely to survive a casual review precisely because it looks harmless.
:::

::: check
A team maintains a Python re-implementation of the guidance law "only for generating plots," and argues this is safe because plots are never used to make a flight decision. What is the flaw in that argument, based on how this lesson describes such a re-implementation actually growing?
:::

::: answer
The lesson's warning describes exactly this starting point — a plotting convenience — as the common origin of a drifting second implementation, not a safe endpoint that stays contained to plotting forever. Once a Python function that computes guidance behaviour exists and is convenient, it tends to get reused for the next similar need — a quick sensitivity check, then a small campaign, then a result someone cites — with no single moment at which anyone decided to trust it for something consequential; the risk is not that today's plot is trusted, it is that nothing structural prevents tomorrow's decision from quietly relying on the same undisciplined function.
:::

::: check
Why does this lesson insist that a pybind11 binding "does nothing to verify that the single implementation is correct in the first place," when the whole point of this lesson is trustworthy flight code?
:::

::: answer
Binding solves a specific, narrow problem — preventing a *second* implementation from silently drifting away from the first — and that is a different problem from whether the *one* implementation that remains is itself a correct algorithm. A single, well-bound implementation of a genuinely wrong formula is still wrong every time it runs; the one-implementation rule guarantees that when a bug is eventually found, there is exactly one place to fix it and no risk of fixing only one of two disagreeing copies, but it says nothing about how that one implementation was verified to be right, which is the job of the unit and Monte-Carlo verification the rest of this module builds.
:::

::: check
Suppose a programme discovers, during a Monte-Carlo campaign, that its Python-computed sensitivity analysis disagrees with its C++ flight core's own logged telemetry for the same simulated cases. Using this lesson's architecture, what does that disagreement most likely indicate, and what would confirming it look like?
:::

::: answer
Under the one-implementation architecture this lesson builds, the Python analysis layer calls the bound C++ core directly rather than recomputing anything itself, so a disagreement of this kind most likely indicates that somewhere the analysis layer has, against the architecture's own rule, reimplemented a piece of logic instead of calling the core for it — exactly the anti-pattern this lesson warns tends to creep in through a plotting convenience. Confirming it means searching the Python analysis code for any place a guidance, navigation or control calculation is expressed directly in Python rather than obtained by calling into the bound core, and replacing that calculation with a call to the single implementation.
:::

## Summary

| Item | Statement |
| --- | --- |
| The rule | Exactly one implementation, in the C++ core; the Python layer calls it through a binding, never reimplements it |
| Mechanism | pybind11 (or equivalent) exposes compiled C++ functions directly to Python — the same executing code, not a second description of it |
| Small divergence, measured | A $0.0034\%$ difference in $g_0$ (`9.80665` vs `9.81`) costs $\approx0.23\,\mathrm{cm}$ miss, $\approx68\,\mathrm{mm/s}$ touchdown velocity — small enough to hide in most test tolerances |
| Large divergence, same category of mistake | A swapped `atan2` argument order costs $120.2^\circ$ of pointing error from one otherwise-identical line |
| What binding does not do | Verify the single implementation is correct — that is the job of the rest of this module's verification |
| Where it usually starts | A Python function written "only for a plot," kept, reused, and eventually trusted without anyone deciding to trust it |

The architecture in this lesson is what makes every number in the rest of this module honest: when the final lesson's Monte-Carlo campaign reports a result, it is a result about the one implementation that is actually going to fly, not a result about a Python approximation of it. That campaign, and the written report built from it, is where this module closes.
