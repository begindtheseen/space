---
id: l02-languages-and-the-model-boundary
title: "Where each language lives, and the model-to-flight-code boundary"
minutes: 18
covers:
  - Python for analysis, tooling, pipelines and test infrastructure
  - MATLAB and Simulink as secondary skills and why the curriculum is not MATLAB-first
---

"Which language should I learn first" is one of the first questions anyone teaching themselves this field asks, and it is usually asked as if there were one right answer. There is not, because the question hides an assumption that a GNC codebase is written in one language. It never is. A real GNC pipeline spans at least two languages doing structurally different jobs, and the useful question is not which language is best but which language owns which part of the work — and what has to happen at the seam where one hands off to the other.

This lesson answers that question directly: Python owns analysis, tooling, pipelines and test infrastructure; MATLAB and Simulink appear as real but secondary tools whose footprint varies a great deal by employer; and C++ — covered on its own terms throughout the rest of this module — owns the code that actually flies. The last part of the lesson is the one most self-study plans skip entirely: the boundary between a model, which exists to let you explore and prove an algorithm correct, and the flight code, which is a separate artifact built to a different set of constraints and has to be shown to compute the same thing.

## Python: analysis, tooling, pipelines, and test infrastructure

Four words, four jobs. Analysis is what most people picture already: given a trajectory, a sensor log, or a Monte Carlo campaign's output, write the script that computes the statistic you need, checks a requirement, or produces a number for a report. This is the part of the work coursework already trains reasonably well, because it looks like the homework — load some data, compute something, look at the result.

Tooling is different: a script that exists to make some recurring task faster or less error-prone for other engineers, not to answer a single analysis question once. A script that converts a raw telemetry format into a form a plotting tool can read, a command-line utility that spins up a batch of simulation cases from a configuration file, a small library that every analysis script in a group imports so that unit conversions are done the same way everywhere — these are infrastructure in miniature, written and maintained the same way any other software is, with the expectation that someone other than the author will run them.

Pipelines take that one step further: a chain of stages, usually run unattended, that takes raw inputs — sensor logs from a test, or a batch of simulation output files — through cleaning, transformation and aggregation to a final report or dataset, without a person manually intervening between stages. A dispersion campaign's results do not arrive as a finished percentile table; something has to read thousands of individual run outputs, extract the figure of merit from each, and assemble the distribution, and that something is almost always a Python pipeline.

Test infrastructure is the harness around code written in another language. A control law's reference implementation might be proven out in Python, but the code that flies is C++; the test infrastructure is what drives that C++ code with known inputs — sometimes by calling into it directly through language bindings, sometimes by running a compiled test binary and parsing its output — and checks the results against an independent standard. Writing this harness is squarely Python work even on a project where not one line of the flight software itself is Python.

::: key
Python's role in this field is analysis (answer a question once from data), tooling (a script other engineers rely on repeatedly), pipelines (unattended chains from raw data to a finished result), and test infrastructure (driving and checking code written in another language). None of these four requires Python to be the language the flight software ships in, and in practice it usually is not.
:::

## MATLAB and Simulink: real, but secondary — and why this curriculum sequences around that

MATLAB and Simulink genuinely appear in this field. Control designers use MATLAB's toolboxes for frequency-domain design and analysis; Simulink's block-diagram modelling is a natural fit for laying out a subsystem the way a control engineer already thinks about it, as gains and blocks and signal paths rather than as lines of code; and some employers run high-fidelity simulation environments built on top of one or both. None of that is being dismissed here. What varies enormously, and depends entirely on the employer and even the specific team, is how central that tooling is to the actual production path — some organizations lean on Simulink for decades including auto-generating flight-representative C code from a block diagram, and others build their entire simulation and analysis stack in Python and C++ and never touch it. Neither pattern is universal, and you should expect to find out which one applies at whichever place you end up, rather than assuming either in advance.

Given that spread, this curriculum still has to choose where to put first effort, and it chooses C++ and Python first for two concrete reasons rather than a stylistic preference. First, job postings in this field consistently name C++ and Python as the required, load-bearing languages for a GNC role, with MATLAB and Simulink appearing — when they appear at all — as a secondary or preferred skill rather than a basic qualification; a hiring process built around that language pairing will, at some stage, test your fluency in it directly, most often in a live coding round conducted in C++. Second, MATLAB is commercially licensed, which means a course meant to be followed by anyone, without assuming access to paid software, cannot be built around it the way it can be built around Python and a C++ compiler, both of which are free and available on any machine. Neither reason says MATLAB and Simulink literacy is worthless — being able to read a block diagram and reason about what it produces is a real, useful skill, and worth picking up once the primary two languages are solid. It says the honest first-priority allocation of a beginner's limited time runs through C++ and Python, with MATLAB and Simulink literacy as something to add once that foundation exists, not before it.

::: warning Fluency in one tool is not fluency in the pipeline
A learner who has built real skill in MATLAB and Simulink and none in C++ has not wasted that time, but they have built strength in one stage of a pipeline while leaving the stage most hiring processes actually test — and most flight codebases actually run — untouched. The fix is not to abandon MATLAB; it is to make sure C++ and Python get at least equal, and probably first, priority.
:::

## The boundary between a model and the code that flies

Here is the idea underneath both of the sections above, stated on its own: a model and the flight implementation of the same algorithm are two different artifacts, built to two different sets of requirements, and the fact that they are supposed to compute the same thing has to be demonstrated, not assumed.

A model — whether it is a Python script, a MATLAB function, or a Simulink block diagram — exists to be explored quickly. Its job is to let you change a gain, rerun, and see the effect in seconds; to be read and modified by someone who is thinking about the control problem, not about memory layout or timing; to make it cheap to try five formulations of an idea before choosing one. Flight code exists to satisfy a completely different set of requirements, several of which this module comes back to directly: it has to run in bounded time, every cycle, on real hardware, with no allocation failure, no exception escaping into a control loop, and a behavior that is exactly reproducible from exactly the same inputs. Almost nothing about writing code to be fast to explore also makes it satisfy those constraints, and almost nothing about satisfying those constraints makes code fast to explore. They are different jobs, and treating a model as if it already were the flight implementation — or treating the flight implementation as a formality once the model exists — is a real and common mistake.

Some employers narrow this gap with auto-code generation: a tool takes a Simulink diagram and produces C code directly from it, rather than a human translating the block diagram by hand. Where this is used, it removes one specific source of translation error — a person mistyping a gain during manual porting — but it does not remove the need to test the result against the model's own outputs; generated code still has to be reviewed, still has to pass the same unit tests a hand-written implementation would, and still has to be shown to meet the same timing and resource constraints. Auto-generation changes how the boundary is crossed. It does not remove the boundary.

The concrete practice that makes the boundary crossing checkable, used whether or not code is auto-generated, is comparison against **golden values**: a small, fixed set of test inputs run through the trusted model once, with the outputs recorded and kept. Whatever implementation is meant to replace or reimplement that model — hand-written C++, generated code, a rewrite in a different language — has to reproduce those same recorded outputs, within a stated numerical tolerance, before anyone trusts that the boundary was crossed correctly.

::: example Golden values for a quaternion normalization
A model computes attitude using unit quaternions, and every operation that touches one has to keep it normalized. The reference implementation, trusted because it is short enough to check by hand, is:

```python
import numpy as np

def normalize_q(q):
    q = np.asarray(q, dtype=float)
    return q / np.linalg.norm(q)
```

Running it on three representative inputs produces the golden values that any other implementation of the same operation is required to match:

```python
cases = [
    np.array([0.1, 0.2, 0.3, 0.9]),
    np.array([1.0, 1.0, 1.0, 1.0]),
    np.array([0.0, 0.0, 0.0, 5.0]),
]
for q in cases:
    print(q.tolist(), "->", normalize_q(q).round(8).tolist())
# [0.1, 0.2, 0.3, 0.9] -> [0.10259784, 0.20519567, 0.30779351, 0.92338052]
# [1.0, 1.0, 1.0, 1.0] -> [0.5, 0.5, 0.5, 0.5]
# [0.0, 0.0, 0.0, 5.0] -> [0.0, 0.0, 0.0, 1.0]
```

A C++ implementation of the same function is not trusted because it compiles, and not trusted because it "looks like" a correct port of the Python. It is trusted once it is run on these same three inputs and produces the same four numbers, in the same order, within whatever tolerance — commonly something like $10^{-9}$ for a double-precision computation this simple — the project has agreed counts as a match. That comparison, run automatically every time either side changes, is what keeps the model and the flight code from silently drifting apart.
:::

::: example A block diagram and a hand-written function have to agree on numbers
A second-order system with natural frequency $\omega_n = 2\ \mathrm{rad/s}$ and damping ratio $\zeta = 0.5$ has the transfer function

$$
G(s) = \frac{\omega_n^2}{s^2 + 2\zeta \omega_n s + \omega_n^2}
$$

Whether this system is laid out as a Simulink block diagram, written as a MATLAB transfer-function object, or computed directly, its unit-step response is a specific, checkable sequence of numbers:

```python
import numpy as np
from scipy import signal

wn, zeta = 2.0, 0.5
sys = signal.TransferFunction([wn**2], [1, 2*zeta*wn, wn**2])
t = np.linspace(0.0, 5.0, 11)
_, y = signal.step(sys, T=t)
for ti, yi in zip(t, y):
    print(f"t={ti:4.2f}  y={yi:.6f}")
# t=0.00  y=0.000000
# t=1.00  y=0.849426
# t=2.00  y=1.153123    <- overshoots about 15% before settling
# t=3.00  y=1.002289
# t=5.00  y=1.002170
```

If a control engineer builds this system as a block diagram to design it, and a separate C++ function later implements the same transfer function in the flight code, the diagram is not the specification in any sense that excuses the C++ implementation from being checked — the numbers above are the specification. Whatever tool produced them, the flight implementation is required to reproduce them, and disagreement at, say, $t = 2\,\mathrm{s}$ means one of the two is wrong, not that "the model and the code are different representations, so agreement is not required."
:::

## Check yourself

::: check
Name the four things Python is described as owning in a GNC pipeline, and give one concrete example of each drawn from this lesson.
:::

::: answer
Analysis: computing a statistic or checking a requirement from data, such as extracting a figure of merit from a set of simulation runs. Tooling: a script or small library other engineers rely on repeatedly, such as a shared unit-conversion library or a batch case launcher. Pipelines: an unattended chain from raw inputs to a finished result, such as assembling a dispersion campaign's percentile table from thousands of individual run outputs. Test infrastructure: the harness that drives and checks code written in another language, such as a Python script that runs a compiled C++ test binary and compares its output against golden values.
:::

::: check
MATLAB and Simulink are real tools used in this field. Explain why this curriculum still sequences C++ and Python first, without claiming MATLAB and Simulink are not worth learning.
:::

::: answer
Two concrete reasons, not a stylistic preference: job postings in this field consistently name C++ and Python as required qualifications, with MATLAB and Simulink appearing at most as secondary or preferred skills, so a hiring process — including live coding rounds — is more likely to test C++ and Python directly; and MATLAB is commercially licensed, so a course meant to be followable without assuming access to paid software has to build its core practice around freely available tools. Neither reason implies MATLAB and Simulink literacy is worthless — it is a real, useful skill at many employers — only that it is reasonable to add once the primary two languages are solid rather than before.
:::

::: check
Explain what a "golden value" is and how the quaternion normalization example uses golden values to check the boundary between a Python model and a C++ implementation.
:::

::: answer
A golden value is a recorded output of a trusted reference implementation on a specific, fixed input, kept so that any other implementation of the same computation can be checked against it. In the quaternion example, the Python `normalize_q` function is run on three representative quaternions and its outputs are recorded to eight decimal places; a C++ implementation of the same normalization is considered to correctly cross the model-to-flight-code boundary only once it reproduces those same three outputs, within a stated numerical tolerance, rather than being trusted because it compiles or reads as a faithful translation.
:::

::: check
Some employers auto-generate C code directly from a Simulink diagram. Explain why this does not remove the need to test the generated code against the model's own outputs.
:::

::: answer
Auto-generation removes one specific source of error — a person mistyping a value while manually porting a block diagram to hand-written code — but it does not change what the generated code has to satisfy: bounded execution time, defined behavior at every input, and numerical agreement with the model it came from. The generation tool itself can have bugs, the generated code still has to be reviewed and unit tested like any other flight code, and it still has to be checked against golden values from the model, because the requirement being satisfied is "the flight code produces the same numbers the model does," and that has to be demonstrated regardless of how the code was produced.
:::

::: check
A candidate has strong Simulink and MATLAB experience from university coursework and has written almost no C++. Predict specifically where this gap is likely to surface first when this candidate applies to a GNC role in this field, and state what would close it fastest.
:::

::: answer
It is likely to surface first in a live technical interview conducted in C++, since postings in this field name C++ as a basic qualification and coding rounds are commonly run in the production language rather than in whatever language the candidate is most comfortable with; it would also surface early on the job, reading and modifying an existing C++ codebase rather than building a fresh model. What closes it fastest is not abandoning the existing MATLAB and Simulink skill but deliberately building C++ fluency to the same level — implementing, testing and reasoning about small C++ programs the way this module's exercises require — since that is the language both the interview and the daily codebase are actually in.
:::

## Summary

| Language | Primary role in this field | Typical artifact |
| --- | --- | --- |
| Python | Analysis, tooling, pipelines, test infrastructure | A dispersion-campaign driver; a harness that checks a compiled binary's output |
| MATLAB / Simulink | Secondary; control design and block-diagram modelling, employer-dependent | A frequency-domain design study; a block diagram, sometimes auto-coded to C |
| C++ | Flight code that actually runs on the target | A reviewed, tested, deployed control or guidance function |
| Golden values | The mechanism that checks any model-to-flight-code boundary | A recorded set of trusted inputs and outputs, matched within tolerance |

The next lesson turns from languages to codebases: how to read a large simulation someone else built well enough to find the one model you actually need, before you change anything in it.
