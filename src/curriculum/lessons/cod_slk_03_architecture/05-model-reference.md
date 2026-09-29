---
id: l05-model-reference
title: 'Model reference: one vehicle, many files'
minutes: 22
covers:
  - 'Model reference: separate compilation, incremental build, interface checking, accelerator modes'
  - convertToModelReference and the objects it generates
---

Think about how a band records an album today. The drummer records the drums in one room. The singer records the vocals on another day, in another city. Each part is its own track, saved in its own file. If the singer wants to redo one line, nobody calls the drummer back. The engineer re-records that one track and mixes it with the others, which were already done.

Now picture the old way: the whole band in one room, one microphone, one take. One wrong note from anyone and everyone plays the whole song again.

A big Simulink model built as one flat diagram is the one-take recording. This lesson shows the multitrack way. A **referenced model** is a separate model file that another model uses as if it were a block. The environment, the aerodynamics, the engines, the vehicle dynamics, the sensors and the GNC software each live in their own file, owned by their own engineer, and the vehicle simulation plugs them together. The last lesson gave you the plugs: Simulink.Bus objects. This lesson gives you the separate tracks.

## Why one big flat model hurts

In the first Simulink module you met the argument for small models in one paragraph. Here it is in full, because every choice in this lesson answers one of its points.

Picture a launch-vehicle simulation with 300 blocks in one `.slx` file, subsystems folded inside subsystems, but all in one file. Four things go wrong as the team grows.

- **Nobody can work in parallel.** A model file is not plain text. It is a **[[compressed package|slx-file]]** of files, so Git cannot merge two people's changes line by line. If the navigation engineer and the propulsion engineer both edit the file on the same day, one of them has to redo their work by hand.
- **Every change rebuilds everything.** Add one block to the engine model, and the whole 300-block model is compiled again before the next run.
- **The interfaces are implicit.** A line between two subsystems carries whatever the source produces. Rename or resize a signal, and the change ripples through the model with no one checking it.
- **Nothing can be tested alone.** You cannot run the sensor models by themselves with a test input, because they only exist inside the whole.

::: key
Why is a 300-block flat model a problem beyond aesthetics? It cannot be diffed or merged, so two engineers cannot work on it; it rebuilds entirely on every change; its interfaces are implicit, so a signal change ripples silently; and it cannot be unit tested component by component.
:::

## The Model block

The fix is the **Model block**, from the Ports & Subsystems library. On its own it is an empty box. In its dialog you type a **Model name**, such as `GNC`, and the box now stands for the whole model saved in `GNC.slx`. That file is the **referenced model**. The model that holds the Model block is the **parent model**, and the model at the very top, the one you press Run on, is the **top model**. Together they form a **[[model hierarchy|hierarchy]]**.

The Model block's ports come from the referenced model. Each **root-level** Inport block in `GNC.slx` (one sitting on the top level of that model, not inside a subsystem) becomes an input port on the Model block. Each root-level Outport becomes an output port. Open `GNC.slx` on its own and it is a complete model: you can give it test inputs and run it by itself.

So a subsystem and a Model block look alike on the diagram. The difference is where the blocks live:

| | Subsystem | Model block |
|---|---|---|
| Where its contents live | Inside the parent's file | In a separate `.slx` file |
| Can be opened and run alone | No | Yes |
| Compiled | As part of the parent | Separately, as its own unit |
| Interface | Whatever the lines carry | Checked against the referenced model's root ports |
| Used more than once | Each copy is a copy | Every Model block points at one file |

The last row matters for reuse. A spacecraft with four identical reaction wheels can use four Model blocks that all name `ReactionWheel`. Fix a bug in `ReactionWheel.slx` and all four wheels get the fix. Each instance can still differ in a few numbers through **model arguments**, parameters the referenced model declares so that each Model block can set its own value, such as which wheel axis it spins about.

## Separate compilation and incremental build

Before a model runs, Simulink compiles it: it works out every signal's type, size and sample time, sorts the blocks, and for faster modes turns the model into compiled code. For a big model this takes real time, often minutes.

With model reference, each referenced model is compiled on its own. That is **separate compilation**, the same idea as a C program split into several **[[translation units|translation-unit]]** that the compiler handles one at a time. The results are saved in a folder named **[[slprj|slprj-folder]]**, created next to your work, so they can be reused on the next run.

Reuse is the payoff. Before each run, Simulink checks each referenced model: has it, or anything it depends on, changed since its saved build? It keeps a **[[checksum|checksum]]** of each model's structure to answer that. If nothing changed, the saved build is used as is. Only the models that changed are compiled again. That is an **incremental build**.

You control this on the **Model Referencing** pane of the Configuration Parameters, with the **Rebuild** option. The default, **If any changes detected**, is the one to leave on day to day. **Always** forces a full rebuild, useful when you suspect a stale build. **Never** trusts every saved build, which is fast and risky.

::: example How much faster is an incremental build?
A team splits its flat vehicle model into six referenced models. It measures how long each takes to compile, in seconds: environment 40, aerodynamics 55, propulsion 45, dynamics 60, sensors 35, GNC 65. Compiling the thin top model that wires them together takes another 20 s. The flat model took about the same total to compile, since the same blocks must be compiled either way.

**Step 1: the full build.** Add the six: $40 + 55 + 45 + 60 + 35 + 65 = 300\,\mathrm{s}$. Add the top model: $300 + 20 = 320\,\mathrm{s}$, a little over five minutes. The flat model paid this on every change.

**Step 2: touch one component.** An engineer adds a block to the drag calculation in the aerodynamics model. Only aerodynamics and the top model are compiled again: $55 + 20 = 75\,\mathrm{s}$.

**Step 3: the ratio.** $320 / 75 \approx 4.3$. The incremental build is about four times faster.

**Sanity check.** The saving comes from the five models that were not touched: $300 - 55 = 245\,\mathrm{s}$ of compiling skipped, and $320 - 245 = 75$, which matches Step 2. The more components the model has, and the smaller each one, the bigger the ratio. A change to a bus object that all six share would rebuild all six, which is one more reason to keep shared interfaces stable.
:::

::: key
What does model reference buy a team? Separate compilation and incremental rebuild, checked interfaces at the boundary, the ability for several engineers to own different files, and reuse of the same component in several models. It is the Simulink equivalent of splitting a program into libraries.
:::

::: warning Do not commit the build folder
The `slprj` folder holds build products, not sources. It is large, it changes on every build, and each machine regenerates it. Keep it out of version control (list it in `.gitignore`). Committing it causes merge conflicts over files nobody wrote, and can hand a teammate a stale build that does not match the models.
:::

## Interface checking at the boundary

Inside one model, Simulink is generous. An Inport left at "inherit" takes whatever type, size and sample time arrives. A referenced model is different: it is compiled as its own unit, and that build is saved and reused. So its root Inports and Outports are an interface that every parent must match, the way every caller of a C function must match its declaration.

So the root ports are the contract, and Simulink checks the parent against them when it updates the diagram. A signal that reaches a Model block's input must agree with the referenced model's root Inport on:

- **data type**, such as `double`, `single`, `uint8` or `Bus: NavBus`;
- **dimensions**, such as 1 or 3;
- **sample time**, such as 0.01 s;
- **complexity**, real or complex.

Any disagreement is an error, reported before the simulation runs.

This is where the bus objects of the last lesson earn their keep. Set a root Inport's data type to `Bus: NavBus`, and the whole navigation interface, every element's name, type, size and unit, is checked at the boundary. The good practice is to set every root port's type, size and sample time explicitly, rather than leaving them to inherit. Then the file itself says what it needs, and a reviewer can read the interface without opening the parent.

::: warning Hidden paths do not cross the boundary
Some connections that work inside one model cannot cross into a referenced model. A Goto block in the parent cannot reach a From block inside a referenced model. A Data Store Memory block in the parent is not visible to Data Store Read blocks inside a referenced model; sharing a store across models needs a global data store, declared with a Simulink.Signal object (lesson 7). If a subsystem relies on such hidden paths, converting it to a referenced model will fail until each one is made a real port. That work is not a nuisance: it is the implicit interface being written down.
:::

## Simulation modes: how the referenced model runs

Each Model block has a **Simulation mode** parameter. It decides how the model behind it runs during a simulation. There are four choices.

| Simulation mode | What runs | Best for |
|---|---|---|
| Normal | The referenced model's blocks, in Simulink, like the rest of the parent | Developing and debugging: full visibility of every signal |
| Accelerator | Compiled code: Simulink turns the referenced model into a **[[MEX|mex-file]]** file and calls it | Speed, for big or stable components and long test campaigns |
| Software-in-the-loop (SIL) | The production C code generated from the referenced model, compiled for your own computer | Checking that the generated code does what the model does |
| Processor-in-the-loop (PIL) | The same production code, compiled for the flight processor and run on it, or on an **[[instruction set simulator|iss]]** | Checking the code on the real chip and its compiler |

Normal mode is the friendliest. You can open the referenced model, put scopes on its signals and step through it. Accelerator mode costs a build up front and gives you less to look at inside, but each run afterward is faster.

SIL and PIL need Embedded Coder. They turn the Model block into a test fixture for the flight code: the parent model feeds the same inputs as in Normal mode, and you compare the outputs. The code-generation module later in this track builds that comparison properly; for now, know that the modes exist and that they live on the Model block. The top model has its own simulation mode too (Normal, Accelerator or Rapid Accelerator), set separately from its Model blocks.

::: example When does Accelerator mode pay for itself?
A team runs a **[[Monte Carlo|monte-carlo]]** campaign: 500 simulations of a landing, each with slightly different winds and engine performance. The vehicle dynamics model is stable, so they consider putting its Model block in Accelerator mode. With it in Normal mode, one run takes 40 s. In Accelerator mode, one run takes 12 s, after a one-time build of 90 s.

**Step 1: Normal mode.** $500 \times 40 = 20{,}000\,\mathrm{s}$. Divide by 3,600 seconds per hour: about 5.6 hours.

**Step 2: Accelerator mode.** $90 + 500 \times 12 = 90 + 6{,}000 = 6{,}090\,\mathrm{s}$, about 1.7 hours.

**Step 3: the break-even point.** Each run saves $40 - 12 = 28\,\mathrm{s}$. The build costs 90 s. So the build pays for itself after $90 / 28 \approx 3.2$ runs. Check with whole runs: 3 runs cost $3 \times 40 = 120\,\mathrm{s}$ in Normal and $90 + 3 \times 12 = 126\,\mathrm{s}$ in Accelerator, so Normal still wins. At 4 runs it is 160 s against 138 s, and Accelerator wins.

**Sanity check.** For one quick debug run, Normal mode is faster (40 s against 102 s) and lets you see inside. For hundreds of runs, Accelerator saves about four hours. Both answers fit the rule of thumb: debug in Normal, run campaigns in Accelerator.
:::

::: key
Model block simulation modes: Normal (interpreted in Simulink, full visibility), Accelerator (compiled into a MEX simulation target, faster runs after a build), Software-in-the-loop (generated production code on the host computer), Processor-in-the-loop (generated code on the target processor or an instruction set simulator). SIL and PIL require Embedded Coder.
:::

## Converting a subsystem: convertToModelReference

You rarely start with six empty files. Usually a subsystem already exists in a big model, and you want to turn it into a referenced model. Simulink does this for you. In the editor, the conversion is on the subsystem's right-click menu. From a script, it is a function:

```matlab
% Turn the GNC subsystem of VehicleSim into its own model, GNC.slx
open_system('VehicleSim');
ok = Simulink.SubSystem.convertToModelReference( ...
        'VehicleSim/GNC', 'GNC', ...
        'ReplaceSubsystem', true, ...
        'AutoFix', true);
```

Read the call aloud as "Simulink dot SubSystem dot convert-to-model-reference". The first argument is the block path of the subsystem. The second is the name of the new model. `ReplaceSubsystem` set to `true` swaps the subsystem in the parent for a Model block; left `false`, the parent is unchanged and you get only the new model. `AutoFix` set to `true` lets the function repair the problems it knows how to fix, such as making a virtual subsystem atomic. The first output, `ok`, is `true` when the conversion succeeded.

It helps to know exactly what the conversion leaves behind, because each item is something you will review and check in:

- **A new model file**, `GNC.slx`, holding the subsystem's blocks. Its root Inports and Outports come from the subsystem's ports, with their types, sizes and sample times written out, since a referenced model must compile alone. It starts with a copy of the parent's configuration settings.
- **A Model block** in the parent, in the place of the subsystem, with the same ports, when `ReplaceSubsystem` is `true`.
- **Simulink.Bus objects** for any bus that crossed the subsystem's boundary. A plain drawn bus had no object; a model boundary needs one, so the conversion writes one per bus, in the base workspace, or in the model's data dictionary when it has one. Look at their names and element order: they are now contracts, and they deserve better names than a tool would choose.

There is also a `CheckSimulationResults` option that simulates the model before and after the conversion and compares logged signals, which is the check you would want anyway. The results should agree to within solver tolerance.

::: warning The generated bus objects are a first draft
A converted model works, but its new bus objects are named and ordered after whatever lines happened to cross the boundary. Before the new files reach the team, rename the buses, fill in units, and move the objects out of the base workspace into a data dictionary. Otherwise the "contract" is an accident of how the old diagram was drawn.
:::

## Check yourself

::: check
Name the three kinds of model in a model hierarchy, and say which of them you can open and run on its own.
:::

::: answer
The top model is the one you run; a parent model is any model that holds a Model block; a referenced model is the file a Model block names. A model can be both a parent and a referenced model at once, in the middle of the hierarchy. All of them can be opened and run on their own, because each is a complete .slx file with its own root Inports and Outports. That is what lets each component be tested alone.
:::

::: check
In the six-component build example, the sensors engineer and the GNC engineer each change their own model on the same morning. How long does the next build take, and how does that compare with the flat model?
:::

::: answer
Only sensors, GNC and the top model are compiled again: $35 + 65 + 20 = 120\,\mathrm{s}$. The flat model would rebuild everything, $320\,\mathrm{s}$. The ratio is $320 / 120 \approx 2.7$, so still well under half the time, and the two engineers could make their changes in separate files without a merge conflict.
:::

::: check
A referenced model's root Inport is set to `double`, dimensions 3, sample time 0.01 s. The parent feeds it a 3-element `single` signal at 0.01 s. What happens, and when? What would happen if the Inport were left at inherit?
:::

::: answer
Updating the diagram reports a data-type mismatch at the Model block's input, before the simulation runs: the port says `double` and the signal is `single`. With the Inport left at inherit, the referenced model would take whatever type arrives from this parent, so it would compile for `single` here and could compile differently for another parent. The component's interface would then be decided by its caller instead of written in its own file, which is exactly what explicit root ports prevent.
:::

::: check
You are chasing a small difference between two runs, and you need to put scopes on signals inside the aerodynamics model. Which simulation mode should its Model block use, and why might it have been set otherwise?
:::

::: answer
Normal mode, which runs the referenced model's blocks in Simulink with full visibility of its signals. It may have been set to Accelerator for speed during long campaigns, since Accelerator runs compiled code and pays back its build time after a few runs. Switch back to Accelerator when the debugging is done.
:::

::: check
After `Simulink.SubSystem.convertToModelReference` succeeds with `ReplaceSubsystem` set to `true`, list what is new or changed, and what you should still do before sharing the result.
:::

::: answer
New: a model file with the subsystem's blocks and fully specified root Inports and Outports, with a copy of the parent's configuration settings. Changed: the parent, where a Model block now stands in the subsystem's place. New: Simulink.Bus objects for each bus that crossed the boundary. Before sharing: confirm the simulation results match (for example with the CheckSimulationResults option), give the bus objects good names and units, move them into a data dictionary, and check the new file into version control without the slprj folder.
:::

## Summary

| Idea | Meaning | Remember |
|---|---|---|
| Model block | A block that stands for a whole separate model file | Its Model name parameter names the .slx file |
| Top, parent, referenced model | The model you run; a model holding a Model block; the file a Model block names | Every one can be opened and run alone |
| Root Inport and Outport | Ports on the top level of a referenced model | Become the Model block's ports; set type, size and sample time explicitly |
| Separate compilation | Each referenced model compiled on its own | Build products saved in slprj; keep slprj out of Git |
| Incremental build | Only changed models are compiled again | Rebuild option: If any changes detected |
| Interface checking | Parent's signals checked against root ports | Data type, dimensions, sample time, complexity; bus objects at the ports |
| Simulation modes | How a Model block's model runs | Normal, Accelerator, SIL, PIL |
| convertToModelReference | Turns a subsystem into a referenced model | Creates a model file, a Model block, and bus objects for crossing buses |

The next lesson keeps one set of interfaces and lets a single model hold several versions of a component, such as a real IMU driver for flight and a simulated sensor for the bench, with variants.

::: context slx-file What is inside an .slx file
An .slx file is a zip archive. Rename a copy to .zip and open it, and you find folders of XML files describing blocks, lines and settings. Git sees the archive as one opaque binary blob, so it can tell you that the file changed but not what changed, and it cannot merge two edits. MathWorks provides a comparison tool for models (the `visdiff` function opens it), but merging two people's structural edits to one model is still slow, careful work. Small files owned by one person each avoid the problem instead of solving it.
:::

::: context hierarchy A tree of models
A model hierarchy is a tree. The top model sits at the root. Each Model block is a branch to another file, which can hold Model blocks of its own. One file can appear in several places, as the reaction wheel does below, and it is still one file.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="10" width="120" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">VehicleSim (top)</text>
  <line x1="180" y1="40" x2="180" y2="55" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="55" x2="300" y2="55" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="55" x2="60" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="55" x2="180" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="300" y1="55" x2="300" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="15" y="70" width="90" height="28" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="89" font-size="12" text-anchor="middle" fill="#1f2a44">Dynamics</text>
  <rect x="135" y="70" width="90" height="28" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="89" font-size="12" text-anchor="middle" fill="#1f2a44">GNC</text>
  <rect x="255" y="70" width="90" height="28" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="89" font-size="12" text-anchor="middle" fill="#1f2a44">Actuators</text>
  <line x1="300" y1="98" x2="300" y2="112" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="255" y1="112" x2="345" y2="112" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="255" y1="112" x2="255" y2="125" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="285" y1="112" x2="285" y2="125" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="315" y1="112" x2="315" y2="125" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="345" y1="112" x2="345" y2="125" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="245" y="125" width="20" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="275" y="125" width="20" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="305" y="125" width="20" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="335" y="125" width="20" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <text x="300" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">4 Model blocks, 1 file:</text>
  <text x="300" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">ReactionWheel.slx</text>
  <text x="90" y="140" font-size="11" text-anchor="middle" fill="#6c7a93">each box is its own</text>
  <text x="90" y="154" font-size="11" text-anchor="middle" fill="#6c7a93">.slx file</text>
</svg>
```
:::

::: context translation-unit The same trick in C and C++
A C or C++ program is split into source files. The compiler turns each one into an object file on its own, and a linker joins them at the end. Change one source file, and a build tool such as Make or CMake recompiles only that file and relinks. Each source file, with the headers it includes, is called a translation unit. Model reference gives a Simulink model the same shape: each referenced model is a unit, and the bus objects at its ports play the part of the headers.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="180" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">after one change to aerodynamics</text>
  <rect x="10" y="32" width="50" height="30" rx="3" fill="#fff" stroke="#6c7a93"/>
  <text x="35" y="51" font-size="11" text-anchor="middle" fill="#6c7a93">env</text>
  <rect x="68" y="32" width="50" height="30" rx="3" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
  <text x="93" y="51" font-size="11" text-anchor="middle" fill="#1f2a44">aero</text>
  <rect x="126" y="32" width="50" height="30" rx="3" fill="#fff" stroke="#6c7a93"/>
  <text x="151" y="51" font-size="11" text-anchor="middle" fill="#6c7a93">prop</text>
  <rect x="184" y="32" width="50" height="30" rx="3" fill="#fff" stroke="#6c7a93"/>
  <text x="209" y="51" font-size="11" text-anchor="middle" fill="#6c7a93">dyn</text>
  <rect x="242" y="32" width="50" height="30" rx="3" fill="#fff" stroke="#6c7a93"/>
  <text x="267" y="51" font-size="11" text-anchor="middle" fill="#6c7a93">sens</text>
  <rect x="300" y="32" width="50" height="30" rx="3" fill="#fff" stroke="#6c7a93"/>
  <text x="325" y="51" font-size="11" text-anchor="middle" fill="#6c7a93">gnc</text>
  <rect x="110" y="80" width="18" height="14" fill="#f2b880" stroke="#b4232c"/>
  <text x="134" y="92" font-size="11" fill="#1f2a44">compiled again</text>
  <rect x="230" y="80" width="18" height="14" fill="#fff" stroke="#6c7a93"/>
  <text x="254" y="92" font-size="11" fill="#1f2a44">saved build reused</text>
</svg>
```
:::

::: context slprj-folder What lives in slprj
Despite the "prj" in its name, slprj has nothing to do with the Simulink Projects tool from lesson 3. It is a cache: Simulink writes a build for each referenced model there, plus code that several models share, and reuses them next time. Deleting it is safe; the next run rebuilds everything, slowly, once. Where it appears is set by the simulation cache folder and code generation folder in the Simulink preferences.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="20" y="22" font-size="12" fill="#1f2a44">work folder</text>
  <line x1="30" y1="28" x2="30" y2="118" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="30" y1="45" x2="50" y2="45" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="56" y="49" font-size="12" fill="#1d6fd1">VehicleSim.slx, GNC.slx, ...</text>
  <text x="250" y="49" font-size="11" fill="#1f2a44">sources: commit</text>
  <line x1="30" y1="75" x2="50" y2="75" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="56" y="79" font-size="12" fill="#b4232c">slprj/</text>
  <line x1="70" y1="85" x2="70" y2="118" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="70" y1="100" x2="85" y2="100" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="90" y="104" font-size="11" fill="#1f2a44">a build per referenced model</text>
  <line x1="70" y1="118" x2="85" y2="118" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="90" y="122" font-size="11" fill="#1f2a44">shared code</text>
  <text x="250" y="79" font-size="11" fill="#b4232c">cache: ignore</text>
</svg>
```
:::

::: context checksum How Simulink knows what changed
A checksum is a short number computed from a larger thing, such that almost any change to the thing changes the number. Simulink computes one from each referenced model's structure and interface and stores it with the build. Next time, it computes a fresh one and compares. Same number: the saved build is still good. Different number: rebuild. Comparing two short numbers is far cheaper than comparing two whole models.
:::

::: context mex-file MEX files
MEX stands for MATLAB executable. A MEX file is compiled C or C++ code that MATLAB and Simulink can call as if it were a built-in function. In Accelerator mode, Simulink generates C code for the referenced model, compiles it into a MEX file, and calls that on every step instead of working through the blocks one by one. You need a supported C compiler installed for this, which is why a fresh laptop sometimes fails its first Accelerator build.
:::

::: context iss A chip that exists only in software
An instruction set simulator is a program that imitates a particular processor, one machine instruction at a time. PIL testing on one lets a team check code built by the real target compiler before the flight board exists, or when there are too few boards to go around. It gives the processor's exact arithmetic but not its real timing, so a real board is still needed for timing checks.
:::

::: context monte-carlo Why run 500 simulations
A Monte Carlo campaign runs the same simulation many times, each with inputs drawn at random from realistic spreads: winds, engine thrust, sensor noise, mass. Then it counts how often the vehicle does what it should, such as landing inside the target zone. The name comes from the casino in Monaco, since the method runs on chance. Hundreds or thousands of runs are normal, which is why seconds saved per run turn into hours saved per campaign.
:::
