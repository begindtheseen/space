---
id: l07-data-dictionaries-and-data-objects
title: Data dictionaries and data objects
minutes: 22
covers:
  - Data dictionaries (.sldd) versus the base workspace; per-subsystem dictionaries
  - Simulink.Parameter, Simulink.Signal and storage classes
---

Picture a team kitchen. One way to run it: every cook keeps their own spice jars in their coat pockets, and whoever cooks last leaves their jars on the counter. Another way: one labeled spice rack on the wall, with a sign-out sheet. Each jar says what is inside, how much, and who last refilled it. The food might taste the same on a good day. Only the second kitchen still works when ten cooks share it for a year.

In the first Simulink module you met the pocket version. A script fills the **base workspace**, the everyday MATLAB workspace behind the Command Window, and the blocks read names like `Kp` from it. You saw how that goes wrong: a missing script, a stale value, two models fighting over one name. The last few lessons in this module split a vehicle model into pieces with checked interfaces: bus objects in lesson 4, referenced models in lesson 5, variants in lesson 6. All of those pieces need definitions from somewhere — the bus objects, the gains, the limits, the variant conditions. This lesson is about the spice rack.

It has two halves. First the file that holds the definitions, the **data dictionary**. Then the things inside it: **data objects** that carry a value together with its type, range and units, and the **storage class** that says what each one becomes in flight code.

## The data dictionary

A **data dictionary** is a file, ending in `.sldd`, that holds the named data a model uses: parameters, signal definitions, bus objects, enumerated types (named lists of values, such as the flight modes), and model configurations. You **link** a model to it, which is a setting saved inside the model file. From then on the model looks up names in that dictionary.

Compare it with the base workspace, point by point.

- **Where the data lives.** Base-workspace variables live in the memory of one MATLAB session. Close MATLAB and they are gone. A dictionary is a file on disk, so it persists, and a colleague who opens the model gets the same values you had.
- **Whether the dependency is visible.** A model that reads the base workspace says nothing about where its values come from. A linked model names its dictionary in its own settings, so anyone can see what it depends on.
- **Source control.** A dictionary is a file, so it goes into **[[source control|source-control]]** next to the models. A change to a gain becomes a reviewed change to a file, with an author and a date. MATLAB's Comparison Tool can show two versions of a dictionary side by side, entry by entry.
- **Order.** The base workspace holds whatever the last script left behind, so the result can depend on which script ran first. A dictionary holds one definition per name, whatever order you opened things in.

::: key
Data dictionary versus base workspace: A dictionary is a versioned file that travels with the model and can be scoped per component, so the model dependency is explicit and reviewable. Base-workspace variables are invisible, unversioned and order-dependent.
:::

### Sections

Inside, a dictionary is split into **sections**, like drawers in a cabinet. The one you will use most is **Design Data**: parameters, signal objects, bus objects, data types. The **Configurations** section holds model configuration sets (solver and code-generation settings), so several models can share one. There is also an **Other Data** section for anything else.

You can browse and edit a dictionary in the Model Explorer, which opens when you double-click the `.sldd` file. You can also script it. The commands below create a dictionary, add one entry to Design Data, save, and link a model to it:

```matlab
dd  = Simulink.data.dictionary.create('ascent_gnc.sldd');
sec = getSection(dd, 'Design Data');

addEntry(sec, 'pitch_rate_limit', 5);   % a plain number, deg/s
saveChanges(dd);                        % write the change to the file

set_param('ascent_gnc', 'DataDictionary', 'ascent_gnc.sldd');
```

Edits are held until you call `saveChanges` (or `discardChanges`), like a document before you press save. The link is one model parameter, `DataDictionary`, holding the file name.

A linked model can also be allowed to keep reading the base workspace, through a checkbox named **Enable model access to base workspace** in the model's properties. It exists to help migrate an old model a piece at a time. Once the migration is done, teams clear it, so every name the model uses must come from its dictionary.

::: warning A dictionary does not fix a hidden script
Moving the variables into a dictionary but leaving an `InitFcn` callback that recomputes some of them in the base workspace gives you the worst of both: a reviewer reads the dictionary and believes it, while the model still runs on values the callback made. When you migrate, delete the old script and clear base-workspace access, then run the model from a fresh MATLAB session to prove nothing else is needed.
:::

### Referenced dictionaries and per-component scope

One huge dictionary for a whole launch vehicle is better than a base workspace, but it has the flat-model problem from lesson 5 all over again: everyone edits the same file, and a change for the propulsion team lands in the GNC team's review queue.

The fix is the same as for models: split it. A dictionary can list other dictionaries as **[[referenced dictionaries|dictionary-hierarchy]]**. Everything in a referenced dictionary is visible through the one that references it, as if it were written there. So you build a small tree:

| Dictionary | Owned by | Holds |
|---|---|---|
| `interfaces.sldd` | systems team | bus objects and enumerated types shared by all components |
| `propulsion.sldd` | propulsion team | engine parameters; references `interfaces.sldd` |
| `gnc.sldd` | GNC team | gains, limits, filter constants; references `interfaces.sldd` |
| `vehicle.sldd` | integration | references `propulsion.sldd` and `gnc.sldd` |

Each referenced model from lesson 5 links to its own component's dictionary. The propulsion model sees engine parameters and the shared buses, and cannot see a GNC gain at all. That is what **scoping per component** means: each piece of the vehicle sees exactly the data it is supposed to use, and a name defined for one component cannot leak into another. The top model links `vehicle.sldd` and so sees everything.

A name should be defined in exactly one dictionary of a tree. If the same name turns up twice, Simulink reports the duplicate instead of quietly choosing one.

The link is always made by a model file. An ordinary subsystem inside a model uses its model's dictionary, which is one more reason the unit of ownership in a big program is the referenced model, not the subsystem. When people say "per-subsystem dictionaries", they mean one dictionary per component of the architecture, and those components are usually referenced models.

In a script, a reference is one call on the dictionary object:

```matlab
gnc = Simulink.data.dictionary.open('gnc.sldd');
addDataSource(gnc, 'interfaces.sldd');   % gnc.sldd now sees the shared buses
saveChanges(gnc);
```

::: key
Per-component dictionaries: each component's model links its own dictionary; shared definitions (buses, enumerations) live in a dictionary that the component dictionaries reference. A name is defined once in the tree.
:::

## Simulink.Parameter: a number that knows what it is

A plain number in a dictionary, like `pitch_rate_limit = 5`, has the pocket-jar problem in a smaller form. Five what? Degrees per second, or radians? Stored as a `double` or an 8-bit integer? Is 50 a legal value? The number cannot say.

A **Simulink.Parameter** is a MATLAB **[[object|matlab-objects]]** that wraps a value with the facts about it. Blocks use it exactly like a plain variable: type its name in a Gain block and the block uses its value. The object's main **properties** (named fields, reached with a dot, as in Python) are:

| Property | What it says | Example |
|---|---|---|
| `Value` | the number (or array) itself | `0.10472` |
| `DataType` | how the value is stored: `'double'`, `'single'`, `'int16'`, `'boolean'`, … or `'auto'` to let Simulink decide | `'single'` |
| `Min`, `Max` | the legal range; Simulink checks `Value` against them | `0`, `0.15` |
| `Unit` | the physical unit, used by Simulink's unit checks | `'rad'` |
| `Description` | a sentence for the reviewer | `'engine gimbal limit'` |
| `CoderInfo.StorageClass` | what the parameter becomes in generated code (next section) | `'ExportedGlobal'` |

The storage class sits one level down, inside a property called `CoderInfo`, because it only matters to the code generator.

```matlab
gimbal_limit = Simulink.Parameter(0.10472);   % Value, in radians
gimbal_limit.DataType    = 'single';
gimbal_limit.Min         = 0;
gimbal_limit.Max         = 0.15;
gimbal_limit.Unit        = 'rad';
gimbal_limit.Description = 'Engine gimbal deflection limit';

addEntry(sec, 'gimbal_limit', gimbal_limit);  % into Design Data
```

Choosing `'single'` means the flight computer stores a 32-bit **[[single-precision|single-precision]]** number, the usual choice on flight processors with a 32-bit floating-point unit. The simulation then uses the same rounded value the flight code will.

::: key
Simulink.Parameter: a data object carrying Value, DataType, Min, Max, Unit, Description and a storage class (CoderInfo.StorageClass). Blocks use it by name like a plain variable; Simulink checks the value against Min and Max.
:::

::: example A unit slip caught before flight
An engineer tuning the ascent model reads a requirement: "gimbal limit 6 degrees". She opens the dictionary and sets `gimbal_limit.Value = 6`, forgetting that the parameter is in radians.

**Step 1: what she typed.** $6\,\mathrm{rad}$ is $6 \times \frac{180}{\pi} \approx 344$ degrees. An engine that could gimbal 344 degrees would spin all the way round. As a limit, it means "no limit at all".

**Step 2: what a plain number would do.** With a bare `gimbal_limit = 6`, the Saturation block clamps at $\pm 6\,\mathrm{rad}$, which never binds. The simulation runs, nominal plots look fine, and the limit silently stops existing. Off-nominal runs, where the controller asks for more than the real engine can give, now look too optimistic.

**Step 3: what the parameter object does.** The next time the model is updated, Simulink compares `Value = 6` with `Min = 0` and `Max = 0.15` and stops with an error that names `gimbal_limit` and its range. The mistake costs ten seconds.

**Step 4: the right value.** $6^\circ = 6 \times \frac{\pi}{180} \approx 0.1047\,\mathrm{rad}$.

**Sanity check.** $0.1047$ lies between 0 and 0.15, so it passes the range check. And about 0.1 radian for 6 degrees fits the rule of thumb that one radian is about 57 degrees: $6/57 \approx 0.105$.
:::

The `Unit` property helps in a second way. Simulink can compare the units declared on connected ports and warn when, say, a signal in `deg` feeds a port expecting `rad`. **[[Units|unit-disasters]]** written down can be checked; units kept in someone's head cannot.

## Simulink.Signal: a definition for a line

Parameters are values that stay put during a run. Signals are the values on the lines, which change every step. A **Simulink.Signal** object is a definition for a signal: `DataType`, `Dimensions`, `Min`, `Max`, `Unit`, `InitialValue`, and again a storage class in `CoderInfo`.

```matlab
q_cmd = Simulink.Signal;
q_cmd.DataType   = 'single';
q_cmd.Dimensions = 1;
q_cmd.Min        = -5;       % deg/s
q_cmd.Max        = 5;
q_cmd.Unit       = 'deg/s';
```

To attach it, you name a signal line `q_cmd` and, in the line's Signal Properties, select **Signal name must resolve to Simulink signal object**. Now the line and the object are one thing. If the line's computed type or size does not match the object, the model will not compile.

A Simulink.Signal object is also how you define a global data store, the shared whiteboard from lesson 1: put the object in the dictionary, and Data Store Read and Write blocks anywhere in the model can use its name without a Data Store Memory block.

What about `Min` and `Max` on a signal? The value on a line is computed, so Simulink cannot check it before the run. Instead, with the **Simulation range checking** diagnostic turned on, it checks during simulation and reports the first time a signal leaves its range. A pitch-rate command of 7 deg/s against a declared maximum of 5 is then a report, not a quiet number in a log.

::: key
Simulink.Signal: a data object for a signal line (DataType, Dimensions, Min, Max, Unit, InitialValue, storage class). A line named the same, with "Signal name must resolve to Simulink signal object" selected, takes that definition.
:::

## Storage classes: what the data becomes in C

Recall from lesson 1 that the model will one day be C code on the flight computer. Every parameter and signal has to become *something* in that code: a literal number, a local variable, a global variable. The **storage class** is the instruction that decides which. Here is what you need now; the code-generation module (cod_slk_04) goes much deeper.

| Storage class | What the generated code does | Typical use |
|---|---|---|
| **Auto** | The code generator chooses. A parameter may become a plain number written into the code; a signal may become a local variable or vanish. | Anything nobody outside the model needs to touch |
| **Model default** | Use whatever default the model's code settings give this kind of data | Letting one model-wide setting decide |
| **ExportedGlobal** | The generated code defines a global variable with this name and declares it in a header for others | Values that hand-written code, telemetry or ground tuning must reach |
| **ImportedExtern** | The generated code uses a global with this name but does not define it; **[[your code must|extern]]** | Data owned by the flight software around the model |
| **Const** | A global marked `const` (for parameters), so it can be placed in read-only memory | Tables and limits that must never change in flight |
| **Volatile** | A global marked **[[volatile|volatile]]**, so the compiler never caches it | Data changed by hardware or by another task |

Const and Volatile come with Embedded Coder; the first four work with plain Simulink Coder too. You set the class in the object's `CoderInfo`:

```matlab
Kp_pitch = Simulink.Parameter(0.8);
Kp_pitch.DataType = 'single';
Kp_pitch.CoderInfo.StorageClass = 'ExportedGlobal';
```

Why not always Auto? Because Auto lets the code generator write the value straight into the arithmetic. The code is small and fast, and the value is frozen: changing it means regenerating, recompiling and requalifying the software. Any storage class other than Auto keeps the parameter as a real variable in memory — a **tunable** parameter that a test stand or ground command can change. Lesson 8 of the code-generation module weighs that trade.

::: example Tuning a gain on the test stand
The pitch loop computes a rate command from the pitch error: $q_{cmd} = K_p \, e$, read "q command equals K p times e", with $K_p = 0.8$ (deg/s per degree) and $e$ the pitch error in degrees. Here is a hand-written sketch of the two shapes of code you get (real generated names and types differ):

```c
/* Kp_pitch with storage class Auto, parameters inlined */
q_cmd = 0.8F * e;

/* Kp_pitch with storage class ExportedGlobal */
float Kp_pitch = 0.8F;      /* defined in the model's .c file */
extern float Kp_pitch;      /* declared in the model's .h file */
q_cmd = Kp_pitch * e;
```

On the test stand, the attitude loop rings, and the team wants to try $K_p = 0.65$.

**Step 1: the current command.** For a pitch error of $e = 2.5^\circ$: $q_{cmd} = 0.8 \times 2.5 = 2.0\,\mathrm{deg/s}$.

**Step 2: the new command.** $q_{cmd} = 0.65 \times 2.5 = 1.625\,\mathrm{deg/s}$.

**Step 3: how to get there.** With Auto, the number 0.8 is baked into an instruction; the only way to 0.65 is to change the dictionary, regenerate, recompile and reload. With ExportedGlobal, `Kp_pitch` is a named variable at a known address, so the test tool writes 0.65 into it while the software runs, and the next step already uses it.

**Sanity check.** The new gain is $0.65/0.8 \approx 0.81$ of the old one, and $1.625/2.0 \approx 0.81$ too, as it must be for a gain. Both commands are well inside the $\pm 5\,\mathrm{deg/s}$ range declared on `q_cmd`.
:::

::: warning Storage classes are part of the interface
Renaming a parameter with an ExportedGlobal or ImportedExtern storage class renames a symbol that hand-written C, telemetry lists and ground tools refer to. It is an interface change, like renaming a bus element, and needs the same review. Parameters that nothing outside the model uses should stay Auto, so the code generator is free to optimize them.
:::

## Putting it together for a vehicle model

For this module's refactoring exercise, the plan is short. Bus objects from lesson 4 go into Design Data. Tunable numbers become Simulink.Parameter objects with a type, range and unit. Every model links its dictionary with base-workspace access cleared. The test: clear the base workspace, open the top model, run it. If it runs and matches the old results, the model depends on exactly what the files say.

## Check yourself

::: check
A colleague sends you `pitch_loop.slx` and says "it runs on my machine". On yours, the Gain block reports that `Kd` is undefined. Explain what probably happened, and what the fix is, in data-dictionary terms.
:::

::: answer
The model read `Kd` from your colleague's base workspace, where some script or earlier session had put it. The model file only stores the name, so nothing traveled with it. The fix is to create (or use) a data dictionary, add `Kd` to its Design Data section, preferably as a Simulink.Parameter with a type and range, link the model to the dictionary, clear base-workspace access, and put the `.sldd` under source control next to the model. Then anyone who opens the model gets the same `Kd`.
:::

::: check
The propulsion model in a vehicle project links to `propulsion.sldd`, which references `interfaces.sldd`. A GNC engineer adds a gain `K_roll` to `gnc.sldd`. Can a block in the propulsion model use `K_roll`? Why is that a good thing?
:::

::: answer
No. The propulsion model sees only `propulsion.sldd` and what it references, `interfaces.sldd`; `gnc.sldd` is not in its tree. That is the point of per-component scoping: a propulsion block cannot come to depend on a GNC gain by accident, and a change to GNC data cannot change propulsion behavior. Shared things, like bus objects, go in the dictionary both reference.
:::

::: check
A Simulink.Parameter `max_throttle` has `Min = 0.4`, `Max = 1.0`, and someone sets `Value = 1.05`. When is the problem found, and how does that differ from a Simulink.Signal whose value reaches 1.05 against the same range?
:::

::: answer
The parameter's value is known before the run, so Simulink checks it against Min and Max when the model is updated or compiled, and reports an error before anything simulates. A signal's value is only known as the simulation computes it, so its Min and Max are checked during the run, and only if the Simulation range checking diagnostic is turned on; the report comes at the first step the signal leaves its range.
:::

::: check
The flight software team owns a variable `nav_mode` that their hand-written C defines and updates. The model must read it. Which storage class fits, and what goes wrong if you pick ExportedGlobal instead?
:::

::: answer
ImportedExtern: the generated code declares `nav_mode` as an external global and uses it, but does not define it, because the hand-written code already does. With ExportedGlobal, the generated code would also define `nav_mode`, so the program would contain two definitions of the same global, and linking the two pieces of code together fails with a duplicate-symbol error.
:::

::: check
Why might a team give every gain in its GNC dictionary a storage class other than Auto, even though it makes the code a little bigger?
:::

::: answer
With Auto, the code generator may write each gain's value straight into the arithmetic, so changing a gain means regenerating and recompiling the flight software. With a storage class such as ExportedGlobal, each gain stays a named variable in memory, so it can be tuned on a test stand or by ground command without a rebuild. For gains that are expected to be tuned, that flexibility is worth a few bytes and a memory read.
:::

## Summary

| Idea | Meaning | What to remember |
|---|---|---|
| Base workspace | MATLAB's session variables | Invisible, unversioned, order-dependent |
| Data dictionary (`.sldd`) | A file of named design data linked to a model | Persistent, under source control, explicit dependency |
| Design Data section | Where parameters, signals, buses and types live | Configurations section holds config sets |
| Referenced dictionary | A dictionary visible through another | Build a tree; one definition per name |
| Per-component scope | Each component model links its own dictionary | Shared buses in a common referenced dictionary |
| Simulink.Parameter | Value plus DataType, Min, Max, Unit, storage class | Range checked when the model updates |
| Simulink.Signal | Definition for a signal line or data store | Line must resolve to it; range checked during simulation |
| Storage class | What the data becomes in C | Auto, Model default, ExportedGlobal, ImportedExtern, Const, Volatile |

That finishes the structure of a model: pieces, interfaces and data. The next lesson turns to behavior that blocks express badly — modes. It opens Stateflow, where a launch vehicle's flight phases become states and the rules for moving between them become transitions.

::: context source-control Source control in one paragraph
Source control is a system, usually Git, that keeps every saved version of every file in a project, who changed it, and why. Two engineers can work on different files and merge their work; a bad change can be undone; and a reviewer sees exactly what changed before it is accepted. Flight software programs put everything that shapes the flight code under it — models, dictionaries, scripts and tests — because an unrecorded change to a gain is as dangerous as an unrecorded change to the code.
:::

::: context dictionary-hierarchy A tree of dictionaries
Each arrow means "references": everything in the dictionary at the arrow's head is visible through the one at its tail. The propulsion model sees its own dictionary and the shared interfaces, never the GNC gains. The top model's dictionary reaches everything.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="10" width="100" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">vehicle.sldd</text>
  <rect x="20" y="75" width="120" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="80" y="95" font-size="12" text-anchor="middle" fill="#1f2a44">propulsion.sldd</text>
  <rect x="220" y="75" width="120" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="280" y="95" font-size="12" text-anchor="middle" fill="#1f2a44">gnc.sldd</text>
  <rect x="120" y="140" width="120" height="30" rx="4" fill="#ffffff" stroke="#1f2a44"/>
  <text x="180" y="160" font-size="12" text-anchor="middle" fill="#1f2a44">interfaces.sldd</text>
  <line x1="160" y1="40" x2="96" y2="71" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="96,71 105,70 101,63" fill="#1f2a44"/>
  <line x1="200" y1="40" x2="264" y2="71" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="264,71 259,63 255,70" fill="#1f2a44"/>
  <line x1="95" y1="105" x2="160" y2="136" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="160,136 155,129 151,136" fill="#1f2a44"/>
  <line x1="265" y1="105" x2="200" y2="136" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="200,136 209,136 205,129" fill="#1f2a44"/>
  <text x="10" y="140" font-size="11" fill="#6c7a93">propulsion model</text>
  <text x="258" y="140" font-size="11" fill="#6c7a93">GNC model</text>
</svg>
```
:::

::: context matlab-objects Objects in MATLAB
If you have used Python classes, a MATLAB object will feel familiar. `Simulink.Parameter` is a class; `gimbal_limit = Simulink.Parameter(0.10472)` makes one object of it; `gimbal_limit.Max = 0.15` sets one property with dot notation, like `obj.attr = value` in Python. The dots in the class name are packages: `Simulink.Parameter` is the `Parameter` class inside the `Simulink` package, the way `os.path` sits inside `os`.
:::

::: context single-precision Single versus double
A `double` uses 64 bits and keeps about 16 significant digits. A `single` uses 32 bits and keeps about 7. Most numbers cannot be stored exactly in either: 0.1 as a single is really 0.100000001490116…, and 0.8 is 0.800000011920929…. Declaring the type in the parameter means the simulation uses the same rounded value as the flight code, so a comparison between the two is fair.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="320" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="38" font-size="12" text-anchor="middle" fill="#1f2a44">double: 64 bits, about 16 digits</text>
  <rect x="20" y="62" width="160" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <text x="100" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">single: 32 bits, about 7</text>
  <text x="190" y="80" font-size="11" fill="#6c7a93">half the memory</text>
</svg>
```
:::

::: context unit-disasters Why units get their own property
In 1999 NASA lost the Mars Climate Orbiter. Ground software produced thruster impulse data in pound-force seconds; the navigation software that used it expected newton seconds, which is about 4.45 times larger. Small trajectory errors built up for months, and the spacecraft reached Mars far too low and was lost. The numbers were right; the units were not written where a machine could check them. Declaring a Unit on every parameter and signal is one small defense against that kind of mistake.
:::

::: context extern Defined once, declared everywhere
In C, a global variable must be *defined* in exactly one file (that creates the memory) and may be *declared* with `extern` in any number of others (that only promises it exists). ExportedGlobal means the model's code does the defining. ImportedExtern means the model's code only declares, and some other file must define. Two definitions of one name make the linker, the tool that joins compiled files into one program, stop with an error.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="15" y="15" width="150" height="50" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="90" y="35" font-size="11" text-anchor="middle" fill="#1f2a44">fsw_nav.c (hand-written)</text>
  <text x="90" y="53" font-size="11" text-anchor="middle" fill="#1f2a44">defines nav_mode</text>
  <rect x="195" y="15" width="150" height="50" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="270" y="35" font-size="11" text-anchor="middle" fill="#1f2a44">model.c (generated)</text>
  <text x="270" y="53" font-size="11" text-anchor="middle" fill="#1f2a44">extern nav_mode, reads it</text>
  <line x1="90" y1="65" x2="170" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="270" y1="65" x2="190" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="120" y="100" width="120" height="30" rx="4" fill="#ffffff" stroke="#1f2a44"/>
  <text x="180" y="120" font-size="11" text-anchor="middle" fill="#1f2a44">linker: one program</text>
</svg>
```
:::

::: context volatile What volatile tells the compiler
A compiler that sees a variable read twice with no write in between may read it once and reuse the value. That is a good optimization for ordinary data and a bug for data that something else changes behind the program's back: a hardware register, or a variable written by another task or an interrupt. Marking it `volatile` forces a fresh read every time. The code-generation module returns to it when models meet real flight processors.
:::
