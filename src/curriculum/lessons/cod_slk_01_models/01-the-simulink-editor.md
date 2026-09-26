---
id: l01-the-simulink-editor
title: The Simulink Editor, the Library Browser and block search
minutes: 18
covers:
  - The Simulink Editor, Library Browser and block search
---

Think of a model train set. You do not write down where every train will be at every second. You lay out pieces of track, put a station here and a switch there, connect them, and press go. The trains then do whatever the layout says. If you want to know what happens when you add a siding, you add the siding and press go again.

**Simulink** is a train set for equations. It is a tool from MathWorks, the company that makes MATLAB, that runs on top of MATLAB. Instead of typing a model as code, you draw it as a **[[block diagram|block-diagram]]**: boxes that each do one job, joined by arrows that carry numbers from one box to the next. Then you press Run, and Simulink works out how every number in the drawing changes over time.

In the last module you typed `tf(4, [1 2 4])` and called `step` to watch a system respond. That works beautifully for one tidy linear model. A real launch vehicle's guidance, navigation and control (GNC) software is not one tidy model. It has sensors, filters, a controller, actuators that hit their limits, and a vehicle whose mass changes every second. GNC teams at rocket and spacecraft companies build and test that kind of system as Simulink models, and the models often [[become the flight code itself|flight-code]]. This lesson gets you comfortable in the editor: how to open it, where things live, how to find a block among thousands, and how to run your first model.

## What a Simulink model is

A Simulink **model** is a drawing made of two kinds of things.

- A **block** is a box that does one job. A Gain block multiplies its input by a number. An Integrator block adds up its input over time. A Scope block draws a plot.
- A **signal** is a value that changes over time, drawn as an arrow from one block to another. The arrow's direction matters: information flows from the block that makes the signal to the block that uses it.

When you run the model, Simulink starts a clock at the **start time** (usually 0) and advances it to the **stop time**. At each moment it asks every block for its output, in an order that respects the arrows. Blocks that remember something from moment to moment, like the Integrator, carry a **state**: a number the block keeps between time steps. The part of Simulink that decides how big each time step is and how to move the states forward is the **[[solver|solver]]**. It plays the role of `step` or `lsim` from the last module, but for any diagram you can draw.

::: key
A Simulink model is blocks joined by signal lines. Each line carries one value (or vector of values) as a function of time, from the block that produces it to the blocks that use it. Running the model means the solver advances simulation time from the start time to the stop time and computes every signal along the way.
:::

The time inside a model is **simulation time**, not the time on your wall clock. A model with a stop time of 600 s can finish in half a second of real time, or take ten minutes, depending on how hard the maths is. Nothing waits for a real second to pass.

## Opening Simulink and finding your way around

There are three ordinary ways to start.

- Type `simulink` in the MATLAB Command Window. The **Simulink Start Page** opens, with templates and recent models. Choose **Blank Model**.
- Click the Simulink button on the MATLAB Home tab. It opens the same Start Page.
- Open an existing model file by double-clicking it, or with `open_system('mymodel')`.

A model is saved as a file with the extension **[[.slx|slx-file]]**. You may also meet the older **.mdl** format in long-lived projects. The file name is the model's name, and it must be a valid MATLAB name: it starts with a letter and contains only letters, digits and underscores. So `pitch_loop.slx` is fine, and `pitch loop.slx` or `2nd_try.slx` is not.

A blank model opens in the **[[Simulink Editor|editor-layout]]**. It has a handful of regions worth knowing by name, because every tutorial, forum answer and colleague will use them.

| Region | Where it is | What it is for |
|---|---|---|
| Canvas | The big white area in the middle | Where you place blocks and draw lines |
| Toolstrip | Across the top, with tabs such as SIMULATION, DEBUG, MODELING and FORMAT | Buttons for running, settings, formatting and tools |
| Explorer bar | Just above the canvas | Shows where you are inside a model that has layers, like a folder path |
| Model Browser | A collapsible pane on the left | A tree of the model's layers, to jump between them |
| Property Inspector | A pane on the right | Shows and edits the parameters of whatever you have selected |
| Status bar | Along the bottom | Says whether the model is ready or running, and how far a run has got |

The **SIMULATION** tab is the one you will use most. It holds the **Library Browser** button, the **Stop Time** box, the **Run** button (a green triangle), and the button that opens the **Simulation Data Inspector**, a results viewer that lesson 3 covers. The **MODELING** tab holds **Model Settings**, which opens the **Configuration Parameters** dialog where the solver and its settings live. Ctrl+E opens the same dialog.

::: note Keyboard shortcuts worth learning on day one
Ctrl+T runs the model. Ctrl+D updates the diagram: Simulink checks the wiring, works out every signal's size and type, and reports problems without running anything. The space bar zooms the canvas to fit the whole model. Ctrl+E opens Configuration Parameters. Ctrl+G turns a selected group of blocks into a subsystem, which comes up at the end of this lesson.
:::

## The Library Browser

Every block you can place lives in a **[[library|library]]**: a special read-only model that holds master copies of blocks. The **Library Browser** is a window that shows all the installed libraries as a tree, with a search box at the top. Open it from the SIMULATION tab, or by typing `slLibraryBrowser` in the Command Window.

At the top of the tree is the main **Simulink** library, split into sub-libraries by job. These are the ones this module lives in:

| Sub-library | Typical blocks | Used in |
|---|---|---|
| Commonly Used Blocks | Constant, Gain, Sum, Product, Integrator, Scope, Mux | Everything |
| Sources | Step, Ramp, Sine Wave, Clock, Constant, Signal Editor | Lesson 3 |
| Sinks | Scope, Display, To Workspace, Outport | Lesson 3 |
| Math Operations | Gain, Sum, Product, MinMax, Abs, Trigonometric Function | Lesson 2 |
| Continuous | Integrator, Derivative, Transfer Fcn, State-Space | Lessons 2 and 5 |
| Discontinuities | Saturation, Rate Limiter, Dead Zone, Quantizer, Relay | Lesson 7 |
| Signal Routing | Mux, Demux, Bus Creator, Selector, Switch | Lessons 6 and 7 |
| Lookup Tables | 1-D Lookup Table, n-D Lookup Table | Lesson 8 |
| User-Defined Functions | MATLAB Function, Interpreted MATLAB Function | Lesson 9 |

Below the main library sit the libraries of any other products you have installed, such as the Aerospace Blockset or Simscape. Which ones appear depends on your license.

To place a block, drag it from the Library Browser onto the canvas. What lands on the canvas is a copy. Changing it does not change the library.

::: key
The Library Browser shows every installed block library as a tree with a search box. Drag a block from it onto the canvas to add a copy to your model.
:::

A handy habit: the same block often appears in more than one sub-library. The Gain in Commonly Used Blocks and the Gain in Math Operations are the same block. **Commonly Used Blocks** is a shortcut shelf, not a different version.

## Block search on the canvas

Once you know a block's name, the Library Browser is slow. There is a faster way. **Double-click an empty spot on the canvas** and a small search box appears right there. Type part of a block's name, such as `integ`, and a list of matching blocks drops down. Pick one with the arrow keys and press Enter, and the block is placed where you clicked. MathWorks calls this **quick insert**.

Quick insert searches by name, so it helps to know the exact names. A few that trip people up:

- The block that adds and subtracts is called **Sum**, not "Add" (typing "add" usually finds it anyway, and Add is one of Sum's own variants).
- The block that plots is called **Scope**, not "Plot".
- The block that multiplies two signals is **Product**. The block that multiplies one signal by a fixed number is **Gain**.
- The block for $\frac{1}{s}$ is **Integrator**. It sits in the Continuous library.

::: key
Double-click the canvas and type a block name to search for it and place it in one move (quick insert). The Library Browser is for browsing; quick insert is for when you know what you want.
:::

## Wiring, setting parameters, and running

Every block has **[[ports|ports]]**: small arrowheads on its edges. **Input ports** sit on the left side and **output ports** on the right side, so signals flow left to right unless you rotate a block. To draw a signal line, press on an output port and drag to an input port. A faster trick: click the source block, then hold Ctrl and click the destination block, and Simulink draws the line for you.

A line that is only half connected shows as a red dashed line. That is Simulink telling you the wiring is unfinished.

Each block has **parameters**: the numbers and choices that set what it does. **Double-click a block** to open its **Block Parameters** dialog. A Gain block's dialog has a field called Gain; type `2` there and the block now doubles its input. You can type a number, a MATLAB expression such as `1/0.5`, or the name of a variable in the MATLAB workspace. Where those variables should live is a real engineering question that lesson 10 answers.

Last, set the **Stop Time** on the SIMULATION tab (a new model starts at 10 seconds) and click **Run**.

::: example Your first model: a step through a gain into an integrator
Build this, left to right: a **Step** block, a **Gain** block with Gain `2`, an **Integrator** block, and a **Scope**. Leave the Step and the Integrator at their default settings, keep the Stop Time at 10, and run.

**Step 1: what the Step sends.** A Step block's default settings make its output 0 until $t = 1$ s, then 1 from there on.

**Step 2: what the Gain sends.** It multiplies by 2, so the Integrator receives 0 until $t = 1$ s and 2 afterwards.

**Step 3: what the Integrator sends.** It adds up its input over time, starting from its default initial value of 0. From 0 to 1 s it adds up zeros, so it stays at 0. After that it grows by 2 every second: $y(t) = 2(t - 1)$ for $t \ge 1$.

**Step 4: the value at the end.** At the stop time, $y(10) = 2 \times (10 - 1) = 18$.

Double-click the Scope to open its plot window. You should see a flat line at 0 until $t = 1$ s, then a straight ramp up to 18 at $t = 10$ s.

**Sanity check.** Rate times time: 2 units per second for 9 seconds is 18 units. If your Scope shows the ramp starting at 0 instead of at 1, the Step's Step time was changed; if it ends at 9, the Gain is 1.
:::

::: warning The Scope may not show the whole run
A Scope shows the last stretch of time given by its own time-span setting, and it rescales its axes only when you ask it to. If a plot looks cut off or flat, press the Scope's autoscale button before you decide the model is wrong. A Scope is a window for looking, not a record of the data. Lesson 3 shows how to keep the numbers.
:::

## Building a model from a script

Everything you do with the mouse can also be done with MATLAB commands. Engineers use this to build test models automatically, to change a parameter across a hundred runs, and to make a model's construction repeatable. The core commands are few:

| Command | What it does |
|---|---|
| `new_system('name')` | Creates a new, empty model in memory |
| `open_system('name')` | Opens a model (or a block) in the editor |
| `add_block(source, destination)` | Copies a block from a library into the model |
| `add_line(model, 'Block/1', 'Other/1')` | Draws a line from output port 1 of one block to input port 1 of another |
| `set_param(object, 'Param', 'value')` | Sets a parameter of a block or of the model |
| `get_param(object, 'Param')` | Reads a parameter |
| `out = sim('name')` | Runs the model and returns its results |
| `save_system('name')` | Saves the model to a .slx file |

A block's full name is its path: the model name, a slash, and the block's name, such as `'tank/Fuel'`. Library blocks have paths too, such as `'simulink/Continuous/Integrator'`. Parameter values are always passed as **text**, even numbers: `'30'`, not `30`.

::: example A propellant tank draining at a steady rate
An upper stage starts a burn with 400 kg of propellant in the tank and uses it at a steady 12 kg/s. How much is left after a 30 s burn? Here is the model built entirely from a script:

```matlab
mdl = 'tank';
new_system(mdl);
add_block('simulink/Sources/Constant', [mdl '/Burn rate'], 'Value', '-12');
add_block('simulink/Continuous/Integrator', [mdl '/Fuel'], ...
          'InitialCondition', '400');
add_block('simulink/Sinks/To Workspace', [mdl '/Log'], ...
          'VariableName', 'fuel', 'SaveFormat', 'Timeseries');
add_line(mdl, 'Burn rate/1', 'Fuel/1');
add_line(mdl, 'Fuel/1', 'Log/1');
set_param(mdl, 'StopTime', '30');
out = sim(mdl);
out.fuel.Data(end)       % 40
```

**Step 1: the rate.** The Constant block sends $-12$ at every moment: the fuel mass changes by $-12$ kg every second.

**Step 2: the running total.** The Integrator starts at its Initial condition, 400 kg, and adds up the rate. After $t$ seconds it holds $400 - 12t$.

**Step 3: the answer.** At $t = 30$ s: $400 - 12 \times 30 = 400 - 360 = 40$ kg.

**Step 4: reading it back.** The To Workspace block saves the Integrator's output under the name `fuel` inside the results object `out`, and `out.fuel.Data(end)` is its last value.

**Sanity check.** At 12 kg/s the full 400 kg would last $400/12 \approx 33.3$ s, so after 30 s there should be a little left: 40 kg is a tenth of the tank, which fits. Open the model with `open_system(mdl)` and you will see three blocks in a row, laid out automatically.
:::

::: warning Names with spaces and the port number
Block names can contain spaces (`'Burn rate'`), but the path must then match exactly, including capital letters. In `add_line`, the `/1` after a block name is a port number, not part of the name. Forgetting it is the most common reason a scripted `add_line` fails.
:::

## Big models from small pieces

A real vehicle model can hold thousands of blocks. Nobody reads that as one flat drawing. Simulink lets you group blocks into layers.

A **subsystem** is a block that contains other blocks. Select a group of blocks, press Ctrl+G, and they fold into a single box with ports where the signals used to cross the boundary. Double-click the box to open it. The **explorer bar** above the canvas then shows your path, like `rocket > Autopilot > Pitch`, and clicking a name takes you back up.

Subsystems tidy one file. Real teams go a step further. A **[[referenced model|model-reference]]** is a separate .slx file that another model includes with a Model block. The attitude controller lives in its own file with its own tests, and the vehicle simulation refers to it.

::: key
Teams keep models small and referenced rather than one big diagram. A flat model cannot be reviewed, diffed, tested or built incrementally, and two engineers cannot work on it at once. Model reference gives separate compilation and checked interfaces, which is the same argument as splitting a C++ program into translation units.
:::

You do not need model reference yet. Lesson 5 of the Simulink architecture module builds it properly. For now, the habit to keep is small models that do one job, which is exactly what this module's exercises ask for.

## Check yourself

::: check
A colleague sends you a model that finished a 3,600 s simulation in 2 seconds on your laptop. She is worried something is wrong because "an hour of flight can't run in two seconds." What do you tell her?
:::

::: answer
Nothing is wrong on that account. Simulation time is not wall-clock time. The solver advances a counter from the start time to the stop time as fast as the computer can do the arithmetic. A simple model can cover an hour of simulated flight in seconds, and a complicated one can take longer than real time. Only a model running on special real-time hardware is tied to the clock on the wall.
:::

::: check
You want an Integrator block and you know its name. Describe the fastest way to place one on the canvas, and name the sub-library it lives in.
:::

::: answer
Double-click an empty spot on the canvas, type `integ` into the quick-insert search box, pick Integrator from the list and press Enter. It lives in the Continuous sub-library of the Simulink library (and also appears on the Commonly Used Blocks shelf, which is the same block).
:::

::: check
In the first-model example, you change the Gain to 3 and the Step block's Step time to 4, and keep the stop time at 10. What value does the Scope show at the end?
:::

::: answer
The Integrator now receives 0 until $t = 4$ s and 3 afterwards. So it stays at 0 until 4 s and then grows by 3 per second: $y(10) = 3 \times (10 - 4) = 18$. It happens to be the same final value as before, reached by a steeper ramp that starts later. That is a good reminder to look at the whole curve, not only the last number.
:::

::: check
Which of these can be saved as a Simulink model file: `landing_leg.slx`, `landing-leg.slx`, `LandingLeg2.slx`, `3axis.slx`?
:::

::: answer
`landing_leg.slx` and `LandingLeg2.slx`. A model name must be a valid MATLAB name: a letter first, then only letters, digits and underscores. `landing-leg` contains a dash, which MATLAB would read as a minus sign, and `3axis` starts with a digit.
:::

::: check
In the tank example, what would you change to model a 45 s burn at 8 kg/s, and how much propellant would be left?
:::

::: answer
Set the Constant block's Value to `'-8'` and the model's StopTime to `'45'`. The Integrator still starts at 400 kg, so the result is $400 - 8 \times 45 = 400 - 360 = 40$ kg. In a script: `set_param('tank/Burn rate', 'Value', '-8'); set_param('tank', 'StopTime', '45'); out = sim('tank');`.
:::

## Summary

| Idea | Meaning | Where to find it |
|---|---|---|
| Block | A box that does one job | Library Browser or quick insert |
| Signal line | A value over time, flowing from an output port to an input port | Drag from port to port, or Ctrl+click |
| Simulation time | The model's own clock, from start time to stop time | Stop Time box on the SIMULATION tab |
| Library Browser | Tree of all block libraries with a search box | SIMULATION tab, or `slLibraryBrowser` |
| Quick insert | Search for a block where you want it | Double-click the canvas and type |
| Block parameters | Numbers and choices that set a block's behavior | Double-click the block |
| Configuration Parameters | Model-wide settings, including the solver | MODELING tab → Model Settings, or Ctrl+E |
| Scripted models | `new_system`, `add_block`, `add_line`, `set_param`, `sim` | MATLAB Command Window or a script |
| Subsystem | Blocks folded into one block | Select and press Ctrl+G |

The next lesson opens up the five blocks you will use in nearly every model, Constant, Gain, Sum, Product and Integrator, and wires them into a first-order lag and a mass-spring-damper whose answers you already know.

::: context block-diagram Engineers drew these long before computers ran them
Control engineers have drawn systems as boxes and arrows for most of a century. Each box held a transfer function, each arrow a signal, and the circle with plus and minus signs was a summing point. The drawing was a way of thinking, and solving it meant algebra on paper.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="14" y="52" font-size="12" fill="#1f2a44">r</text>
  <line x1="24" y1="48" x2="66" y2="48" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="70,48 62,44 62,52" fill="#1f2a44"/>
  <circle cx="82" cy="48" r="12" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="62" y="40" font-size="12" fill="#1f2a44">+</text>
  <text x="86" y="74" font-size="13" fill="#b4232c">−</text>
  <line x1="94" y1="48" x2="136" y2="48" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="140,48 132,44 132,52" fill="#1f2a44"/>
  <rect x="140" y="28" width="70" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="175" y="53" font-size="12" fill="#1f2a44" text-anchor="middle">controller</text>
  <line x1="210" y1="48" x2="236" y2="48" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="240,48 232,44 232,52" fill="#1f2a44"/>
  <rect x="240" y="28" width="60" height="40" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="270" y="53" font-size="12" fill="#1f2a44" text-anchor="middle">plant</text>
  <line x1="300" y1="48" x2="346" y2="48" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="350,48 342,44 342,52" fill="#1f2a44"/>
  <text x="340" y="40" font-size="12" fill="#1f2a44">y</text>
  <line x1="322" y1="48" x2="322" y2="104" stroke="#1f2a44" stroke-width="2"/>
  <line x1="322" y1="104" x2="82" y2="104" stroke="#1f2a44" stroke-width="2"/>
  <line x1="82" y1="104" x2="82" y2="66" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="82,60 78,68 86,68" fill="#1f2a44"/>
  <text x="200" y="122" font-size="11" fill="#6c7a93" text-anchor="middle">feedback: the output is measured and subtracted</text>
</svg>
```

Simulink's idea was to make that same drawing executable. MathWorks first released it around 1990 under the name SIMULAB.
:::

::: context flight-code When the drawing becomes the software
This way of working is called **model-based design**. The engineer builds and tests the controller as a model, and a code generator (MathWorks sells Simulink Coder and Embedded Coder for this) turns the tested model into C code for the flight computer. Nobody retypes the controller by hand, so the thing that was tested and the thing that flies come from the same source. The last Simulink module of this track walks the whole path from model to flight code. Everything there rests on the habits started here: small models, clear signals, and results you check.
:::

::: context solver The engine under the hood
A solver is a numerical method for moving a system's states forward in time: the same job as the ODE solvers `ode45` and `ode23` you can call directly in MATLAB. In fact Simulink's default continuous solvers carry those same names. A new model uses an automatic choice that usually picks `ode45` for a continuous model, with a relative tolerance of $10^{-3}$. That is fine for looking at a plot and too loose for checking a model against an exact answer, which lesson 4 deals with. The next Simulink module is entirely about solvers: fixed-step versus variable-step, stiffness, and why flight code needs a fixed step.
:::

::: context slx-file What is inside a .slx file
A .slx file is a compressed package, like a .zip, holding text files that describe every block, line and setting. The older .mdl format was one long text file. The .slx format became the default in 2012 because it is smaller and can carry extra parts. The catch for version control is that Git sees a .slx as one binary file, so an ordinary text diff cannot show what changed. MathWorks provides a comparison tool that shows differences between two versions of a model as a diagram, and small models make those comparisons readable.
:::

::: context editor-layout A map of the editor
The regions from the table, as they sit on the screen. The panes on the left and right can be closed or reopened, so your editor may show fewer of them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="180" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="10" y="10" width="340" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="32" font-size="12" fill="#1f2a44" text-anchor="middle">Toolstrip: SIMULATION · DEBUG · MODELING · FORMAT</text>
  <rect x="10" y="44" width="70" height="126" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">Model</text>
  <text x="45" y="114" font-size="11" fill="#1f2a44" text-anchor="middle">Browser</text>
  <rect x="80" y="44" width="190" height="18" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <text x="175" y="57" font-size="11" fill="#6c7a93" text-anchor="middle">Explorer bar: rocket &gt; Autopilot</text>
  <text x="175" y="118" font-size="13" fill="#1f2a44" text-anchor="middle">Canvas</text>
  <rect x="270" y="44" width="80" height="126" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="310" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">Property</text>
  <text x="310" y="114" font-size="11" fill="#1f2a44" text-anchor="middle">Inspector</text>
  <rect x="10" y="170" width="340" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="184" font-size="11" fill="#6c7a93" text-anchor="middle">Status bar: Ready</text>
</svg>
```
:::

::: context library Libraries are models too
A library is a Simulink file that holds blocks but cannot be run. The Simulink library, the Aerospace Blockset and any in-house library a company builds all work the same way. Teams build their own libraries of standard parts, such as a checked sensor model or an approved actuator model, so that every project uses the same tested block. How those shared blocks stay linked to their master copy is part of the Simulink architecture module.
:::

::: context ports Which way the arrows point
Inputs arrive on a block's left edge and outputs leave from its right edge. A block can have several of each; they are numbered from the top, and that number is what `add_line` means by `/1` or `/2`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="25" width="100" height="70" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="64" font-size="13" fill="#1f2a44" text-anchor="middle">Product</text>
  <line x1="60" y1="45" x2="124" y2="45" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="130,45 122,41 122,49" fill="#1d6fd1"/>
  <line x1="60" y1="75" x2="124" y2="75" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="130,75 122,71 122,79" fill="#1d6fd1"/>
  <text x="56" y="49" font-size="12" fill="#1d6fd1" text-anchor="end">in 1</text>
  <text x="56" y="79" font-size="12" fill="#1d6fd1" text-anchor="end">in 2</text>
  <line x1="230" y1="60" x2="294" y2="60" stroke="#b4232c" stroke-width="2"/>
  <polygon points="300,60 292,56 292,64" fill="#b4232c"/>
  <text x="306" y="64" font-size="12" fill="#b4232c">out 1</text>
  <text x="180" y="112" font-size="11" fill="#6c7a93" text-anchor="middle">signals flow left to right</text>
</svg>
```

An output port can feed many inputs: the line branches. An input port can take only one line, because a block cannot guess which of two values you meant.
:::

::: context model-reference One file per job
Picture a vehicle simulation where the navigation filter, the autopilot, the engine model and the 6-degree-of-freedom dynamics each live in their own .slx file, each owned by a different engineer, each with its own tests. The top model is thin: a few Model blocks and the wires between them. Changing the autopilot rebuilds only the autopilot. Code review looks at one small file. That is how large GNC models are organized in industry.
:::
