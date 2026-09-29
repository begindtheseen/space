---
id: l03-sources-and-sinks
title: 'Sources and sinks: feeding a model and keeping what comes out'
minutes: 19
covers:
  - 'Sources: Step, Ramp, Sine Wave, Clock, Signal Editor'
  - 'Sinks: Scope, Display, To Workspace; the Simulation Data Inspector'
---

Think of testing a new bicycle bell. You need two things besides the bell. You need a way to poke it: a thumb that flicks the lever, gently once, then hard, then over and over. And you need a way to find out what happened: your ear, or better, a phone recording you can play back and compare with the old bell.

A Simulink model needs the same two things. The last lesson built the middle of a model from Constant, Gain, Sum, Product and Integrator blocks. This lesson covers the edges. A **source** is a block with no inputs that makes a signal: the thumb. A **sink** is a block with no outputs that shows or saves a signal: the ear and the recording.

The difference between the ear and the recording is the most important idea in this lesson. A plot on your screen lets you look. Numbers saved in MATLAB let you check, compare and prove. GNC teams live on the second kind. A flight software change is accepted because a test compared saved numbers against a baseline, never because someone said the plot looked fine.

## Sources: the signals that poke a model

All the blocks below live in the Sources sub-library. Each one has a small set of parameters, and each parameter has a default. Knowing the defaults matters, because a block you drop on the canvas and never open runs with them.

### Step

The **Step** block jumps once from one value to another. Its parameters are **Step time** (when the jump happens, default 1 s), **Initial value** (before the jump, default 0) and **Final value** (after the jump, default 1). So the default Step outputs 0 until $t = 1$ s and 1 from then on.

A step is the classic test input: a new command, suddenly. It shows how fast a system responds, how far it overshoots and how long it takes to settle.

::: warning The default Step waits one second
MATLAB's `step` command, from the last module, applies its step at $t = 0$. Simulink's Step block applies it at $t = 1$ s unless you change Step time. Compare the two without noticing, and every point of your model's curve looks one second late. The model is fine; the input is different. When you mean "a step at time zero", type `0` into Step time.
:::

### Ramp

The **Ramp** block outputs a straight line that starts rising at a chosen time. Its parameters are **Slope** (default 1), **Start time** (default 0) and **Initial output** (default 0). Before the start time the output sits at the initial output. After it,

$$
y(t) = \text{Initial output} + \text{Slope} \times (t - \text{Start time}).
$$

A ramp tests how well a system follows a command that keeps moving, such as an antenna tracking a satellite across the sky.

### Sine Wave

The **Sine Wave** block outputs a smooth wave. With its default settings it computes

$$
y(t) = A \sin(\omega t + \phi) + b ,
$$

where $A$ is the **Amplitude** (default 1), $\omega$ (read "omega") is the **Frequency** (default 1), $\phi$ (read "phi") is the **Phase** (default 0) and $b$ is the **Bias** (default 0), a constant added on top. A sine tests how a system responds to shaking at one frequency: a wobble from a sloshing propellant tank, or a vibration from an engine.

::: warning Frequency is in radians per second, not hertz
The Sine Wave's Frequency is in **[[radians per second|rad-per-sec]]**, and its Phase is in radians. A 2 Hz vibration is not `2`. It is `2*pi*2`, about 12.6 rad/s. Type `2` and you get a wave that repeats every $2\pi/2 \approx 3.14$ s instead of every 0.5 s. The Frequency field accepts any MATLAB expression, so write `2*pi*2` and let the arithmetic show your intent.
:::

### Clock

The **Clock** block outputs the simulation time itself. At $t = 3.7$ s it outputs 3.7. That sounds useless until you need a quantity that follows a formula in time, such as a mass that falls at a steady rate or a gain that changes after launch. Feed the Clock into ordinary blocks and you can build any function of time from them.

### Signal Editor

Real test inputs are rarely one clean step. A landing test might need a descent command that holds, then ramps, then holds again, followed by a gust at a precise moment. The **Signal Editor** block plays back signals you draw or type yourself. Its block dialog opens the **Signal Editor** tool, where you create signals point by point or import them. The signals are grouped into **[[scenarios|scenario]]**, and they are saved in a MAT-file alongside the model. The block's **Active scenario** parameter picks which scenario plays in the next run.

That makes one model a test bench for many cases: nominal descent, heavy gust, engine-out, each a scenario, all run through the same diagram. Older models may use a block called **Signal Builder** for the same job. MathWorks recommends Signal Editor for new work.

::: key
Sources have no inputs. Step: Step time (default 1), Initial value, Final value. Ramp: Slope, Start time, Initial output. Sine Wave: $y = A\sin(\omega t + \phi) + b$, frequency in rad/s. Clock: outputs simulation time. Signal Editor: plays back drawn or imported signals, grouped into scenarios chosen by Active scenario.
:::

::: example A mass that shrinks: building a function of time with a Clock
Lesson 2 divided a 900 kN thrust by a 60,000 kg mass with a Product block. Now let the stage burn 300 kg of propellant every second, so its mass is $m(t) = 60{,}000 - 300t$. What acceleration should the model report at $t = 0$, 50 and 100 s?

**Step 1: the mass signal.** Clock outputs $t$. A Gain of `-300` turns it into $-300t$. A Sum with List of signs `++` adds a Constant of `60000`. Out comes $m(t)$.

**Step 2: the acceleration.** A Product with Number of inputs `*/` takes a Constant of `900e3` on port 1 and $m(t)$ on port 2, giving $a(t) = 900{,}000 / m(t)$.

**Step 3: the numbers.** At $t = 0$: $m = 60{,}000$ kg and $a = 15\ \mathrm{m/s^2}$. At $t = 50$ s: $m = 60{,}000 - 15{,}000 = 45{,}000$ kg, so $a = 20\ \mathrm{m/s^2}$. At $t = 100$ s: $m = 30{,}000$ kg, so $a = 30\ \mathrm{m/s^2}$.

**Sanity check.** Half the mass means double the acceleration: 15 at the start, 30 at the halfway mass. Rockets really do speed up faster and faster as they burn, which is why some rockets throttle back or shut down an engine late in a burn to keep the acceleration within limits.
:::

## Sinks: looking versus keeping

Sinks sit at the right-hand end of a model, in the Sinks sub-library. Three of them do most of the work, and they do different jobs.

### Scope

The **Scope** is the oscilloscope-style plot window you met in lesson 1. Double-click it to open the window. It draws its input against simulation time as the run goes, so you can watch a model come to life. A Scope can take several inputs and draw them together, which is handy for a command and a response on the same axes.

A Scope is built for your eyes. You can zoom, pan and put cursors on it. Its job is to answer "does this look right?" in a second.

### Display

The **Display** block shows its input as a number, written right on the block in the canvas. When the run ends, it holds the last value. A Display is perfect for a quick check of one number, such as a final position or a total propellant used, without opening anything. Its format setting chooses how many digits you see.

### To Workspace

The **To Workspace** block saves its input as data that MATLAB can use after the run. Its key parameters:

- **Variable name**: the name the data is saved under. The default is `simout`, which is worth changing to something meaningful, such as `x` or `accel`.
- **Save format**: the shape of the saved data. The default, **Timeseries**, saves a MATLAB **[[timeseries object|timeseries]]** with a `Time` field and a `Data` field. The other choices are Structure With Time, Structure and Array.
- **Limit data points to last**: keeps only the last so many points. The default, `inf`, keeps them all.
- **Decimation**: saves every $n$th point. The default, 1, saves every one.

Where does the data go? When you run a model with `out = sim('mymodel')`, or press Run, the results come back packed in one object, **`out`**, a **[[SimulationOutput object|simulation-output]]** (its full class name is `Simulink.SimulationOutput`). Each To Workspace block's data sits inside it under its Variable name, and the time steps sit in `out.tout`:

```matlab
out = sim('stage_accel');      % run the model; results come back in out
t = out.accel.Time;            % column of time points (s)
a = out.accel.Data;            % column of values, one per time point
a(end)                         % the last logged value
max(abs(a - 900e3./(60e3 - 300*t)))   % compare with the exact formula
```

Packing everything into `out` is controlled by the **Single simulation output** setting in the Data Import/Export pane of Configuration Parameters, which is on for new models. With it on, two runs never overwrite each other's variables. You keep `out1 = sim(...)` and `out2 = sim(...)` side by side and compare them.

The last line of that snippet is the point. With the numbers in MATLAB, you can subtract an exact formula, take the largest difference, and get one number that says whether the model is right. You cannot subtract a picture.

::: key
What does a To Workspace block give you that a Scope does not? Data in the MATLAB workspace that you can compare against an analytic result, assert on in a test, and save as a baseline. A Scope is for looking; To Workspace (or the Data Inspector) is for verifying.
:::

::: warning Timeseries data comes in columns, not rows
`out.accel.Data` for a scalar signal is a column vector, one row per time step, and `out.accel.Time` is a matching column. A 3-element signal gives a matrix with 3 columns. Code that expects a row, or indexes `Data(1,:)` expecting the first signal instead of the first time step, will run and give nonsense. Check with `size(out.accel.Data)` the first time you read any logged signal.
:::

::: example A sine through a lag: reading numbers, not a picture
Feed a Sine Wave with Amplitude 1 and Frequency 1 rad/s into the first-order lag from lesson 2, with time constant $\tau = 2$ s. Log the output with To Workspace, Variable name `y`, and run for 30 s. What should the numbers show once the start-up wobble dies away?

**Step 1: the tool.** A lag responds to a steady sine with a sine of the same frequency, but smaller and later. The last module's frequency response gives both at once: $G(j\omega) = \frac{1}{j\omega\tau + 1}$, where $j$ is the imaginary unit.

**Step 2: how much smaller.** With $\omega\tau = 1 \times 2 = 2$, the size is $\frac{1}{\sqrt{1 + 2^2}} = \frac{1}{\sqrt{5}} = 0.447$.

**Step 3: how much later.** The phase is $-\arctan(2) = -63.4^\circ$, which is $-1.107$ rad. At 1 rad/s that is a delay of 1.107 s.

**Step 4: a peak to find in the data.** The input peaks at $t = \frac{\pi}{2} + 6\pi = 20.42$ s. The output should peak 1.107 s later, at 21.53 s, with height 0.447. In MATLAB, `[ymax, i] = max(out.y.Data(out.y.Time > 20))` finds it.

**Step 5: why wait until 20 s.** The output also carries a start-up part, $0.4e^{-t/2}$, which dies away. At $t = 10$ s it is still 0.0027, big enough to spoil a check to three digits. By $t = 20$ s it is below $2 \times 10^{-5}$.

**Sanity check.** A slow system cannot follow fast shaking, so the output must be smaller than the input and behind it. Both are true. On a Scope the two curves would look "about right" with almost any lag; the numbers pin it down to 0.447 and 1.107 s.
:::

## The Simulation Data Inspector

To Workspace saves one signal per block. The **Simulation Data Inspector** is the bigger tool: a viewer that collects the signals you choose from every run, keeps each run, and compares runs with each other.

Using it takes three moves.

1. **Mark the signals.** Select a line, then click **Log Signals** on the SIMULATION tab (or right-click the line and choose to log it). A small **[[logging badge|logging-badge]]** appears on the line. No extra block is needed.
2. **Run.** Each run is saved in the Data Inspector as a new **run**, holding every logged signal with its time steps. The logged data also comes back in `out.logsout`, as a collection of signals you can read by name.
3. **Open and compare.** Click **Data Inspector** on the SIMULATION tab, or type `Simulink.sdi.view`. Tick a signal to plot it. On the **Compare** view, choose two runs, one as the **[[baseline|baseline]]**. The Data Inspector lines up matching signals, plots each difference, and marks each signal as within or outside the **tolerances** you set: absolute, relative and time.

The runs stay after the model stops. Change a gain, run again, and yesterday's behavior is still there to compare against, cursor by cursor, all plots in step.

::: key
What does the Simulation Data Inspector add over a Scope? Persisted runs you can compare against each other and against a baseline, with tolerances, plus synchronized cursors and export. It is the tool that turns a run into evidence.
:::

::: warning A Scope shows only the run you just did
Each new run replaces what a Scope shows. If you changed a parameter and want to know what changed in the response, a Scope cannot tell you, and your memory of the old plot is not evidence. Log the signal, run twice, and compare the runs in the Data Inspector.
:::

## Check yourself

::: check
A Step block has Step time 2, Initial value 1 and Final value 4. Its output goes through a Gain of 0.5 into a Display. What does the Display show at a stop time of 1 s, and at a stop time of 10 s?
:::

::: answer
At a stop time of 1 s the step has not happened yet, so the Step outputs its Initial value, 1, and the Display shows $0.5 \times 1 = 0.5$. At 10 s the step happened at 2 s, so the Step outputs 4 and the Display shows $0.5 \times 4 = 2$. The Display holds the last value of the run.
:::

::: check
You need to shake a model with a 5 Hz vibration of amplitude 0.2 around a steady value of 3. What goes into the Sine Wave's Amplitude, Bias and Frequency fields?
:::

::: answer
Amplitude `0.2`, Bias `3`, and Frequency `2*pi*5`, which is about 31.4 rad/s, because the block's Frequency is in radians per second. The output then swings between 2.8 and 3.2, five times a second.
:::

::: check
A Ramp with Slope 2, Start time 1 and Initial output 0 feeds an Integrator with Initial condition 0. What is the Integrator's output at $t = 10$ s?
:::

::: answer
The ramp is 0 until 1 s, then $2(t - 1)$. Integrating from 1 to 10 s adds up a triangle under that line: base 9 s, height $2 \times 9 = 18$. The area is $\frac{1}{2} \times 9 \times 18 = 81$. Using the formula, $\int_1^{10} 2(t-1)\,dt = (t-1)^2 \big|_1^{10} = 81$. The output is 81.
:::

::: check
A colleague changes a lag's time constant from 2 s to 2.2 s and says "the step responses look identical." You logged both runs. What would the Data Inspector's comparison show, roughly, and why does it matter?
:::

::: answer
The difference between the two responses is $e^{-t/2} - e^{-t/2.2}$ in size. It is zero at the start, grows to its largest, about 0.035, near $t = 2.1$ s, and then shrinks toward zero. On a Scope, a 3.5 percent difference between two curves of height 1 is hard to see. In the comparison view it is a plain difference plot with a peak of 0.035, and with a tolerance of, say, 0.01 the signal is flagged as outside it. The comparison turns "looks identical" into a measured number.
:::

::: check
Your script runs `out = sim('pitch')` and then `plot(simout.Time, simout.Data)`, and MATLAB says `simout` is undefined. The model has one To Workspace block with default settings. What is wrong?
:::

::: answer
With Single simulation output on, which is the default, the logged data is inside the `out` object, not loose in the workspace. The data is at `out.simout`, so the plot command should be `plot(out.simout.Time, out.simout.Data)`. Better still, rename the Variable name from `simout` to something that says what the signal is.
:::

## Summary

| Block or tool | Job | Settings to know |
|---|---|---|
| Step | A jump from one value to another | Step time (default 1 s), Initial value, Final value |
| Ramp | A straight line starting at a set time | Slope, Start time, Initial output |
| Sine Wave | $A\sin(\omega t + \phi) + b$ | Amplitude, Bias, Frequency in rad/s, Phase in rad |
| Clock | Outputs simulation time | Build any function of time from it |
| Signal Editor | Plays back drawn or imported signals | Scenarios; Active scenario |
| Scope | Plot for looking during a run | Autoscale, several inputs |
| Display | Shows a number on the block | Format |
| To Workspace | Saves data for MATLAB | Variable name (default `simout`), Save format (default Timeseries) |
| `out` | The `Simulink.SimulationOutput` object returned by a run | `out.name.Time`, `out.name.Data`, `out.tout`, `out.logsout` |
| Simulation Data Inspector | Keeps runs, compares them with tolerances | Log Signals, Compare, baseline |

You now have numbers coming out of a model. The next lesson makes the habit that every GNC engineer relies on: compare those numbers against an exact, independent answer, and find out how close is close enough.

::: context rad-per-sec Two ways to count a spin
**Hertz** (Hz) counts full cycles per second. **Radians per second** measures the angle swept per second, and one full cycle is $2\pi \approx 6.28$ radians. So a frequency in hertz, $f$, becomes $\omega = 2\pi f$ in rad/s. Control engineering uses rad/s almost everywhere, because the maths of sines, Laplace transforms and Bode plots comes out cleanest that way. That is also why the Bode plots of the last module label their frequency axis in rad/s.
:::

::: context scenario One diagram, many test cases
A **scenario** is one complete set of input signals for one test case, all on a shared time axis. Test engineers think in scenarios: nominal, worst-case wind, sensor dropout, late engine cutoff. Keeping them as data, rather than as different copies of the model, means every case runs through exactly the same diagram. Scripts can also switch the Active scenario and run each case in turn, which is how a hundred cases get run overnight without anyone touching the mouse.
:::

::: context timeseries A column of times, a column of values
A MATLAB `timeseries` is an object that bundles a column of time points with the matching values.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">Time</text>
  <text x="200" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">Data</text>
  <rect x="50" y="28" width="80" height="112" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <rect x="160" y="28" width="80" height="112" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="90" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="90" y="74" font-size="12" fill="#1f2a44" text-anchor="middle">0.2</text>
  <text x="90" y="98" font-size="12" fill="#1f2a44" text-anchor="middle">0.4</text>
  <text x="90" y="126" font-size="12" fill="#1f2a44" text-anchor="middle">…</text>
  <text x="200" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">15.00</text>
  <text x="200" y="74" font-size="12" fill="#1f2a44" text-anchor="middle">15.02</text>
  <text x="200" y="98" font-size="12" fill="#1f2a44" text-anchor="middle">15.03</text>
  <text x="200" y="126" font-size="12" fill="#1f2a44" text-anchor="middle">…</text>
  <line x1="50" y1="58" x2="240" y2="58" stroke="#6c7a93" stroke-width="1"/>
  <line x1="50" y1="82" x2="240" y2="82" stroke="#6c7a93" stroke-width="1"/>
  <line x1="50" y1="106" x2="240" y2="106" stroke="#6c7a93" stroke-width="1"/>
  <text x="252" y="54" font-size="11" fill="#6c7a93">one row per</text>
  <text x="252" y="68" font-size="11" fill="#6c7a93">time step</text>
</svg>
```

Row $k$ of `Data` is the value at row $k$ of `Time`. A variable-step solver chooses its own steps, so the times are usually unevenly spaced, and lesson 4 shows why that matters when you compare against a formula.
:::

::: context simulation-output One object per run
Before 2019, Simulink scattered a run's results into the base workspace as separate variables, `tout`, `yout` and each To Workspace name, and the next run silently overwrote them. MATLAB R2019a made the single `out` object the default for new models. Besides To Workspace data, it can hold `tout` (time), `yout` (signals reaching the model's Outport blocks), `logsout` (signals logged for the Data Inspector) and information about the run itself. Because it is one object, you can store it, pass it to a function, or keep a whole array of them from a batch of runs.
:::

::: context logging-badge A marked wire
When you log a signal, Simulink draws a small badge on its line, shaped like a radio antenna, so anyone opening the model can see which signals are recorded. Logging is a property of the signal, not a block, so it adds nothing to the diagram's maths. Name every signal you log: the name is what appears in the Data Inspector's list and what you use to read it from `out.logsout`, and "Signal 3" means nothing a week later.
:::

::: context baseline The run you trust
A **baseline** is a saved run that everyone has agreed is correct, perhaps because it was checked against an analytic answer or against flight data. Every later change is compared against it. Signals inside the tolerance band pass. Anything outside is flagged, and someone has to explain it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="130" x2="30" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="336" y="146" font-size="11" fill="#1f2a44" text-anchor="end">time</text>
  <path d="M30,118 C90,40 150,48 200,62 S300,62 340,60" fill="none" stroke="#8fb8f0" stroke-width="14" stroke-opacity="0.6"/>
  <path d="M30,118 C90,40 150,48 200,62 S300,62 340,60" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M30,118 C92,46 150,58 200,74 S300,62 340,60" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <circle cx="200" cy="74" r="5" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="210" y="96" font-size="11" fill="#b4232c">new run leaves the band</text>
  <text x="44" y="30" font-size="11" fill="#1d6fd1">baseline with tolerance band</text>
</svg>
```

Teams keep baselines under version control next to the model, so "did my change break anything?" has a yes-or-no answer.
:::
