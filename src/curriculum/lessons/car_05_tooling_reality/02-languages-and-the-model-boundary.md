---
id: l02-languages-and-the-model-boundary
title: "Where each language lives, and the model-to-flight-code boundary"
minutes: 21
covers:
  - Python for analysis, tooling, pipelines and test infrastructure
  - MATLAB and Simulink as secondary skills and why the curriculum is not MATLAB-first
---

A kitchen does not have one tool. The knife is for cutting, the whisk is for mixing, the oven is for baking. Asking "which is the best kitchen tool?" makes no sense. The useful question is which tool owns which job — and what has to happen when food moves from one to the next.

"Which programming language should I learn first?" is one of the first questions anyone teaching themselves this field asks. It is usually asked as if there were one right answer. There is not, because the question assumes a GNC codebase is written in one language. It never is. A real GNC (guidance, navigation and control) pipeline uses at least two languages doing very different jobs. The useful question is which language owns which part of the work, and what has to happen at the **seam** where one hands off to the other.

Here is the short answer, which the rest of the lesson unpacks:

- **Python** owns analysis, tooling, pipelines and test infrastructure.
- **MATLAB** and **Simulink** are real but secondary tools, and how much they are used varies a lot from employer to employer.
- **C++** owns the code that actually flies. The rest of this module covers it on its own terms.

The last part of the lesson is the one most self-study plans skip: the boundary between a **model** — code that exists to let you explore an algorithm and show it is right — and the **flight code**, a separate piece of software built to stricter rules, which has to be *shown* to compute the same thing.

## Python: four jobs

[[Python|python-name]] is a programming language that is quick to write and easy to read. In this field it does four different jobs.

### Analysis

**Analysis** is what most people already picture. You are given a trajectory, a sensor log, or the output of thousands of simulation runs. You write the script that computes the number you need, checks a requirement, or makes a plot for a report. Coursework already trains this fairly well, because it looks like homework: load some data, compute something, look at the result.

### Tooling

**Tooling** is different. A tool is a script that makes a task that keeps coming back faster, or harder to get wrong, for *other* engineers. It is not written to answer one question once. Examples:

- a script that converts a raw telemetry file into a form a plotting program can read;
- a command-line program that launches a batch of simulation cases from a settings file;
- a small shared library that every analysis script imports, so unit conversions are done the same way everywhere.

These are infrastructure in miniature. They are written and maintained like any other software, because someone other than the author will run them.

### Pipelines

A **pipeline** is a chain of steps that runs on its own, without a person stepping in between them. It takes raw inputs — sensor logs from a test, or a pile of simulation output files — and cleans, transforms and combines them into a finished report or dataset.

Think of a car wash: the car goes in dirty at one end and comes out clean at the other, passing through each station in order. A **[[dispersion campaign|dispersion-campaign]]**, which you will meet later in this module, does not hand you a finished results table. Something has to open thousands of separate run outputs, pull the key number out of each one, and assemble the spread of results. That something is almost always a Python pipeline.

### Test infrastructure

**Test infrastructure** is the harness around code written in another language. A control law might first be proven out in Python, but the code that flies is C++. The test infrastructure drives that C++ code with known inputs and checks the outputs against an independent standard. Sometimes it calls into the C++ directly through **[[language bindings|bindings]]**. Sometimes it runs a compiled C++ test program and reads what it prints. Either way, writing this harness is Python work — even on a project where not one line of the flight software is Python.

::: key
Python's role in this field is analysis (answer a question once from data), tooling (a script other engineers rely on repeatedly), pipelines (unattended chains from raw data to a finished result), and test infrastructure (driving and checking code written in another language). None of these four requires Python to be the language the flight software ships in, and in practice it usually is not.
:::

## MATLAB and Simulink: real, but secondary

[[MATLAB|matlab-name]] is a commercial program for numerical work, very popular in universities. **Simulink** is its companion for building models out of **[[block diagrams|block-diagram]]** — boxes joined by arrows, where each box does one operation on a signal — instead of lines of code.

Both genuinely appear in this field. Control designers use MATLAB's add-on toolboxes to design and analyze controllers. Simulink's boxes-and-arrows style matches how a control engineer already thinks: gains, blocks and signal paths. Some employers run high-fidelity simulation environments built on one or both. None of that is being dismissed here.

What varies enormously — by employer, and even by team — is how central these tools are to the path that ends on the vehicle. Some organizations have leaned on Simulink for decades, including generating flight-ready C code directly from a block diagram. Others build their whole simulation and analysis stack in Python and C++ and never touch it. Neither pattern is universal. Expect to find out which one applies wherever you end up, rather than assuming either in advance.

### Why this course puts C++ and Python first

Given that spread, a course still has to choose where to spend a beginner's first effort. This one chooses C++ and Python first, for two concrete reasons.

**First, the postings.** Job postings in this field consistently name C++ and Python as the required languages for a GNC role — the "basic qualifications". MATLAB and Simulink appear, when they appear at all, as secondary or preferred skills. A hiring process built around C++ and Python will test your fluency in them directly, most often in a [[live coding round|coding-round]] conducted in C++.

**Second, cost and access.** MATLAB is commercially licensed. A course meant for anyone, without assuming access to paid software, cannot be built around it. Python and a C++ compiler are free and run on any machine.

Neither reason says MATLAB and Simulink are worthless. Being able to read a block diagram and reason about what it produces is a real, useful skill, worth picking up once the two main languages are solid. The honest first use of a beginner's limited time runs through C++ and Python, with MATLAB and Simulink added after that foundation exists, not before.

::: key
MATLAB is secondary. Some postings mention developing and maintaining high fidelity simulations using C++, Python, and MATLAB, but C++ and Python are the named basic qualifications. A MATLAB-first preparation targets the wrong skill.
:::

::: warning Fluency in one tool is not fluency in the pipeline
A learner with real skill in MATLAB and Simulink and none in C++ has not wasted that time. But they have built strength in one stage of the pipeline while leaving untouched the stage most hiring processes test — and most flight codebases actually run. The fix is not to abandon MATLAB. It is to make sure C++ and Python get at least equal, and probably first, priority.
:::

## The boundary between a model and the code that flies

Here is the idea underneath both sections above. A model and the flight version of the same algorithm are two different things, built for two different sets of rules. They are *supposed* to compute the same thing, and that has to be demonstrated, not assumed.

Think of an architect's cardboard model of a bridge and the real steel bridge. The model is for trying ideas quickly — move a tower, see how it looks. The real bridge must carry trucks for fifty years. Nobody drives across the cardboard, and nobody tries out ten tower positions by rebuilding the steel one.

### What each one is for

A **model** — a Python script, a MATLAB function, or a Simulink diagram — exists to be explored quickly. Its job is to let you change a gain, rerun, and see the effect in seconds. It is read and changed by someone thinking about the control problem, not about memory or timing. It makes it cheap to try five versions of an idea before picking one.

**Flight code** has a completely different set of requirements, several of which later lessons in this module cover in detail. It must:

- finish in a bounded time, every cycle, on real hardware;
- never fail to get memory it needs;
- never let an error escape into the control loop;
- give exactly the same output from exactly the same inputs, every time.

Almost nothing that makes code fast to explore also makes it meet those rules, and almost nothing that meets those rules makes code fast to explore. They are different jobs. Treating a model as if it already were the flight code — or treating the flight code as a formality once the model exists — is a real and common mistake.

### Auto-generated code moves the boundary, it does not remove it

Some employers narrow the gap with **[[auto-code generation|autocode]]**: a tool reads a Simulink diagram and writes C code from it, instead of a person translating the diagram by hand. That removes one specific source of error — a person mistyping a gain while copying it over.

It does not remove the need to test the result. Generated code still has to be reviewed, still has to pass the same unit tests a hand-written version would, still has to meet the same timing and memory rules, and still has to be checked against the model's own outputs. Auto-generation changes *how* the boundary is crossed. It does not remove the boundary.

### Golden values

The practice that makes the crossing checkable — whether the code is generated or hand-written — is comparison against **[[golden values|golden-values]]**. You pick a small, fixed set of test inputs. You run them through the trusted model once. You record the outputs and keep them.

Any implementation meant to replace or re-create that model — hand-written C++, generated code, a rewrite in another language — must reproduce those recorded outputs, within a stated numerical **tolerance** (how close counts as "the same"), before anyone trusts that the boundary was crossed correctly.

::: example Golden values for a quaternion normalization
A model describes the vehicle's orientation with **[[unit quaternions|quaternion]]** — lists of four numbers whose squares add up to $1$. Every operation that touches one has to keep it that way, by **normalizing**: dividing each number by the list's length, $\sqrt{q_1^2 + q_2^2 + q_3^2 + q_4^2}$.

The reference version is short enough to check by hand:

```python
import numpy as np

def normalize_q(q):
    q = np.asarray(q, dtype=float)
    return q / np.linalg.norm(q)
```

Running it on three representative inputs produces the golden values:

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

Check the second case by hand. The length is $\sqrt{1 + 1 + 1 + 1} = \sqrt{4} = 2$, so each entry becomes $1/2 = 0.5$. Check the third: the length is $\sqrt{25} = 5$, and $5/5 = 1$. For the first, the length is $\sqrt{0.01 + 0.04 + 0.09 + 0.81} = \sqrt{0.95} \approx 0.97468$, and $0.9 / 0.97468 \approx 0.92338$. All three agree with the printout.

A C++ version of the same function is not trusted because it compiles. It is not trusted because it "looks like" a faithful copy of the Python. It is trusted once it runs on these same three inputs and produces the same four numbers, in the same order, within the tolerance the project agreed — commonly something like $10^{-9}$ for a double-precision calculation this simple. That comparison, run automatically every time either side changes, is what stops the model and the flight code from quietly drifting apart.
:::

::: example A block diagram and a hand-written function have to agree on numbers
A **second-order system** — think of a car's spring and shock absorber, which bounce and then settle — has a **natural frequency** $\omega_n$ ("omega sub n", how fast it wants to oscillate) and a **damping ratio** $\zeta$ ("zeta", how quickly the bouncing dies away). Take $\omega_n = 2\ \mathrm{rad/s}$ and $\zeta = 0.5$. Its **[[transfer function|transfer-function]]** is

$$
G(s) = \frac{\omega_n^2}{s^2 + 2\zeta \omega_n s + \omega_n^2} = \frac{4}{s^2 + 2s + 4}.
$$

The numbers come from $\omega_n^2 = 2^2 = 4$ and $2\zeta\omega_n = 2 \times 0.5 \times 2 = 2$.

Whether this system is drawn as a Simulink diagram, written as a MATLAB transfer-function object, or computed directly, its **step response** — its output after the input jumps suddenly from $0$ to $1$ — is a specific, checkable list of numbers:

```python
import numpy as np
from scipy import signal

wn, zeta = 2.0, 0.5
sys = signal.TransferFunction([wn**2], [1, 2*zeta*wn, wn**2])
t = np.linspace(0.0, 5.0, 11)
_, y = signal.step(sys, T=t)
for ti, yi in list(zip(t, y))[::2]:
    print(f"t={ti:4.2f}  y={yi:.6f}")
# t=0.00  y=0.000000
# t=1.00  y=0.849426
# t=2.00  y=1.153123    <- above 1: overshoot, near the peak
# t=3.00  y=1.002289
# t=4.00  y=0.979007
# t=5.00  y=1.002170
```

Sanity check: the output starts at $0$, rises past the target of $1$, dips slightly below it, and settles near $1$ — exactly what a lightly damped spring does. The peak overshoot for $\zeta = 0.5$ is $e^{-\pi\zeta/\sqrt{1-\zeta^2}} \approx 0.163$, about $16\%$, reached at $t = \pi / (\omega_n\sqrt{1-\zeta^2}) \approx 1.81\ \mathrm{s}$. The value $1.153$ at $t = 2\ \mathrm{s}$ is just past that peak.

Suppose a control engineer builds this system as a block diagram to design it, and later a C++ function implements the same transfer function in the flight code. The diagram does not excuse the C++ from being checked. The numbers above are the specification. Whatever tool produced them, the flight version must reproduce them. If the two disagree at $t = 2\ \mathrm{s}$, one of them is wrong. "They are different representations, so they need not agree" is not an answer.
:::

## Check yourself

::: check
Name the four things Python owns in a GNC pipeline, and give one concrete example of each from this lesson.
:::

::: answer
Analysis: computing a statistic or checking a requirement from data, such as pulling a key number out of a set of simulation runs. Tooling: a script or small library other engineers rely on repeatedly, such as a shared unit-conversion library or a batch case launcher. Pipelines: an unattended chain from raw inputs to a finished result, such as assembling a dispersion campaign's table of results from thousands of separate run outputs. Test infrastructure: the harness that drives and checks code written in another language, such as a Python script that runs a compiled C++ test program and compares its output against golden values.
:::

::: check
MATLAB and Simulink are real tools used in this field. Explain why this course still puts C++ and Python first, without claiming MATLAB and Simulink are not worth learning.
:::

::: answer
Two concrete reasons, not a matter of taste. First, job postings in this field consistently name C++ and Python as required qualifications, with MATLAB and Simulink appearing at most as secondary or preferred skills, so a hiring process — including live coding rounds — is more likely to test C++ and Python directly. Second, MATLAB is commercially licensed, so a course meant to be followed without paid software has to build its core practice on free tools.

Neither reason makes MATLAB and Simulink literacy worthless. It is a real, useful skill at many employers. It is sensible to add it once the two main languages are solid, rather than before.
:::

::: check
Explain what a golden value is, and how the quaternion example uses golden values to check the boundary between a Python model and a C++ implementation.
:::

::: answer
A golden value is a recorded output of a trusted reference implementation on a specific, fixed input, kept so that any other implementation of the same calculation can be checked against it.

In the quaternion example, the Python `normalize_q` function runs on three representative quaternions and its outputs are recorded to eight decimal places. A C++ version of the same normalization counts as correctly crossing the model-to-flight-code boundary only once it reproduces those three outputs within a stated tolerance — not because it compiles, and not because it reads like a faithful translation.
:::

::: check
Some employers auto-generate C code directly from a Simulink diagram. Explain why this does not remove the need to test the generated code against the model's own outputs.
:::

::: answer
Auto-generation removes one specific source of error: a person mistyping a value while copying a block diagram into hand-written code. It does not change what the generated code must satisfy — bounded execution time, defined behavior for every input, and numerical agreement with the model it came from.

The generator itself can have bugs. The generated code still has to be reviewed and unit tested like any other flight code, and still has to be checked against golden values from the model. The requirement is "the flight code produces the same numbers the model does", and that has to be demonstrated however the code was produced.
:::

::: check
A candidate has strong Simulink and MATLAB experience from university coursework and has written almost no C++. Predict where this gap is likely to show up first when they apply for a GNC role in this field, and what would close it fastest.
:::

::: answer
It is likely to show up first in a live technical interview conducted in C++. Postings in this field name C++ as a basic qualification, and coding rounds are commonly run in the production language rather than whichever language the candidate prefers. It would also show up early in the job, when reading and changing an existing C++ codebase rather than building a fresh model.

What closes it fastest is not abandoning the MATLAB and Simulink skill. It is deliberately building C++ fluency to the same level — implementing, testing and reasoning about small C++ programs the way this module's exercises require — because that is the language both the interview and the daily codebase are in.
:::

## Summary

| Language or idea | Main role in this field | Typical artifact |
| --- | --- | --- |
| Python | Analysis, tooling, pipelines, test infrastructure | A dispersion-campaign driver; a harness that checks a compiled program's output |
| MATLAB / Simulink | Secondary; control design and block-diagram modeling, varies by employer | A controller design study; a block diagram, sometimes auto-coded to C |
| C++ | Flight code that actually runs on the vehicle | A reviewed, tested, deployed guidance or control function |
| Model vs flight code | Two artifacts with different rules that must be shown to agree | A quick-to-change script versus bounded, deterministic code |
| Golden values | The check at any model-to-flight-code boundary | Recorded trusted inputs and outputs, matched within a tolerance |

The next lesson turns from languages to codebases: how to read a large simulation someone else built, well enough to find the one model you actually need before you change anything in it.

::: context python-name A language named after a comedy show
Python was created by the Dutch programmer Guido van Rossum and first released in 1991. He named it after the British comedy group Monty Python, not the snake. Python became the everyday language of science and engineering because its code reads almost like plain English and because of free libraries such as NumPy (fast arrays of numbers) and SciPy (science and engineering math), which the examples in this lesson use.
:::

::: context dispersion-campaign Thousands of slightly different flights
A **dispersion campaign** runs the same simulated flight thousands of times, each time nudging the uncertain inputs — the vehicle's mass, the winds, the engine's thrust, sensor noise — by a random amount within their realistic range. The spread of outcomes shows whether the vehicle meets its requirements in bad luck as well as good. Lesson 6 of this module covers it in full; here the point is that its results arrive as thousands of files that a Python pipeline must turn into one answer.
:::

::: context bindings Letting two languages talk
**Language bindings** are glue code that lets a program in one language call functions written in another. With a binding library such as pybind11, a Python test can call a C++ function as if it were a Python one, pass it numbers, and get numbers back. That lets engineers write quick, readable tests in Python while the thing being tested is the real compiled C++, not a copy of it.
:::

::: context matlab-name Where MATLAB comes from
MATLAB's name is short for "matrix laboratory". Cleve Moler wrote the first version in the 1970s so his students could do matrix math without writing Fortran, and it became a commercial product sold by MathWorks. Because it is licensed software, universities often provide it free to students — which is one reason so many graduates arrive knowing it well. Free programs such as GNU Octave run much of the same code.
:::

::: context block-diagram What a block diagram looks like
In a block diagram, each box does one thing to a signal, and the arrows carry signals between boxes. Below is the classic feedback loop a control engineer draws: compare where you want to be with where you are, turn the difference (the error) into a command, and feed the result back around.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="8" y="44" font-size="11" fill="#1f2a44">target</text>
  <line x1="46" y1="50" x2="86" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="92,50 84,45 84,55" fill="#1f2a44"/>
  <circle cx="104" cy="50" r="12" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="104" y="55" font-size="14" fill="#1f2a44" text-anchor="middle">−</text>
  <line x1="116" y1="50" x2="144" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="150,50 142,45 142,55" fill="#1f2a44"/>
  <text x="132" y="42" font-size="11" fill="#b4232c" text-anchor="middle">error</text>
  <rect x="150" y="32" width="70" height="36" rx="4" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="185" y="55" font-size="12" fill="#1d6fd1" text-anchor="middle">controller</text>
  <line x1="220" y1="50" x2="246" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="252,50 244,45 244,55" fill="#1f2a44"/>
  <rect x="252" y="32" width="64" height="36" rx="4" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="284" y="55" font-size="12" fill="#1d6fd1" text-anchor="middle">vehicle</text>
  <line x1="316" y1="50" x2="350" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <text x="334" y="42" font-size="11" fill="#1f2a44" text-anchor="middle">output</text>
  <path d="M334 50 L334 110 L104 110 L104 68" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="104,62 99,70 109,70" fill="#6c7a93"/>
  <text x="220" y="128" font-size="11" fill="#6c7a93" text-anchor="middle">measured output fed back</text>
</svg>
```
:::

::: context coding-round The live coding round
Many engineering interviews include a **coding round**: you write a small program while an interviewer watches, often in a shared editor over video. For GNC roles the task might be a small numerical routine, a data-structure question, or reasoning about someone else's code, and it is commonly run in the language the team ships — here C++. It tests fluency under mild pressure, which only comes from practice in that language.
:::

::: context autocode Code written by a program
**Auto-code generation** means a program writes the source code for you from a higher-level description. MathWorks sells tools that turn Simulink diagrams into C or C++; some aircraft and car makers use this approach for large parts of their control software. The generated code can be long and hard for a person to read, which is one more reason it is checked against the model's numbers rather than by eye.
:::

::: context golden-values Why "golden"
The name borrows from the idea of a "golden" master copy — the one reference everything else is compared against, like the metal cylinder, kept in a vault near Paris, that defined the kilogram until 2019. Engineers also call these reference outputs "golden files", "expected outputs" or a "golden master". The important part is that they are recorded once from something trusted and then kept fixed, so a later change cannot quietly move the target it is being tested against.
:::

::: context quaternion Four numbers for one orientation
A **quaternion** is a set of four numbers that describes how an object is rotated. Engineers prefer it to three angles because three angles can "lock up" at certain orientations, while a quaternion never does. It describes a rotation only while its length is exactly $1$, and rounding errors slowly push it away from $1$ after many calculations. That is why flight and simulation code renormalize quaternions regularly — and why this module's integrator exercise asks you to test for norm drift.
:::

::: context transfer-function The spring that overshoots
A **transfer function** is a compact recipe that says how a system turns an input signal into an output signal. The letter $s$ comes from a tool called the Laplace transform, which later modules teach. For now, the picture is enough: this system, pushed from $0$ to $1$, rises, overshoots by about $16\%$, and settles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="70" x2="340" y2="70" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,170.0 46,168.1 52,163.1 58,155.5 64,146.3 70,136.0 76,125.1 82,114.3 88,103.8 94,94.0 100,85.1 106,77.2 112,70.6 118,65.1 124,60.8 130,57.6 136,55.4 142,54.2 148,53.7 154,53.9 160,54.7 166,55.9 172,57.3 178,59.0 184,60.8 190,62.5 196,64.3 202,65.9 208,67.4 214,68.7 220,69.8 226,70.7 232,71.4 238,72.0 244,72.3 250,72.6 256,72.7 262,72.6 268,72.5 274,72.3 280,72.1 286,71.8 292,71.5 298,71.3 304,71.0 310,70.7 316,70.5 322,70.2 328,70.1 334,69.9 340,69.8"/>
  <circle cx="148" cy="53.7" r="4" fill="#b4232c"/>
  <text x="158" y="44" font-size="11" fill="#b4232c">peak 1.16 at t = 1.8 s</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="186">0</text><text x="100" y="186">1</text><text x="160" y="186">2</text>
    <text x="220" y="186">3</text><text x="280" y="186">4</text><text x="340" y="186">5</text>
  </g>
  <text x="192" y="198" font-size="11" fill="#6c7a93" text-anchor="middle">time t (s)</text>
  <text x="30" y="74" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="30" y="174" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
</svg>
```
:::
