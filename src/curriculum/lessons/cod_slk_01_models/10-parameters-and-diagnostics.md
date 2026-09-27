---
id: l10-parameters-and-diagnostics
title: Where parameters live, and how to read a model error
minutes: 22
covers:
  - Model parameters in the base workspace versus mask parameters
  - The Diagnostic Viewer and reading a model error
---

Picture a recipe card that says "add the sugar from the jar on the counter". It works perfectly in your kitchen, where you know the jar holds sugar. Take the card to a friend's house and the jar on the counter holds salt. The recipe did not change. The cake is ruined anyway, because the recipe depended on something that was not written on the card.

Every block you have set up in this module has read numbers: a Gain's gain, a Saturation's limits, the breakpoints of a lookup table, a parameter of a MATLAB Function block. Lesson 1 showed that you can type the *name* of a MATLAB variable into any of those fields instead of a number. This lesson asks where that variable should live, because the answer decides whether your model works on a colleague's computer next month. Then it covers the other everyday skill of a Simulink user: reading the message when a model refuses to run.

## How a block finds a value

When you type `Kp` into a Gain block's Gain field, the block does not store a number. It stores the text `Kp`. Each time the model is updated or run, Simulink evaluates that text as a MATLAB expression and looks up every name in it. Where it looks, and in what order, is the key to this whole lesson.

A **workspace** is a place where MATLAB keeps named variables. Simulink searches several of them, from the block outward:

1. The **mask workspaces** of any masked subsystems around the block, innermost first. (Masks are the second half of this lesson.)
2. The **model workspace**, a set of variables stored inside the model file itself.
3. The **data dictionary** linked to the model, if there is one, and the **[[base workspace|base-workspace]]**: the everyday MATLAB workspace that the Command Window and your scripts use.

The first place that has the name wins. If none has it, the model will not run.

::: key
Where do model parameters live, and why does it matter? In the base workspace, a model workspace, a mask, or a data dictionary. Base-workspace parameters are convenient and invisible in the model file, so a model can silently depend on whatever a colleague ran first; dictionaries and mask parameters make the dependency explicit.
:::

## The base workspace: easy and invisible

The simplest setup, and the one most tutorials use, is a script that fills the base workspace before you run:

```matlab
% pitch_params.m  -- run this before opening pitch_loop.slx
Kp    = 2.0;          % proportional gain
tau   = 0.5;          % sensor filter time constant, s
limit = 6;            % gimbal limit, deg
```

The blocks in the model use `Kp`, `tau` and `limit`. It works, and it is easy to change a value and run again. But the model file itself contains only the names. Nothing in the .slx says which script to run, which values it expected, or that it depends on outside variables at all. That is the sugar jar on the counter.

Three things go wrong with it in practice.

- **The missing script.** Someone opens the model without running the script. The names are undefined and the model will not run. This one is at least loud.
- **Stale values.** You change `Kp` at the Command Window to try something, forget, and run a "baseline" the next morning with the experimental value still sitting there. Nothing warns you.
- **[[Name collisions|collision]].** Two models, or two scripts, use the same name for different things. Whichever ran last wins, and the other model quietly runs with the wrong number.

::: example Two models, one name
Your sensor-filter model is a first-order lag $\frac{1}{\tau s + 1}$ (read $\tau$ as "tau", the time constant) whose Transfer Fcn block reads `tau`, set to $0.5\,\mathrm{s}$ by your script. A colleague's actuator model also uses `tau`, set to $2\,\mathrm{s}$ by her script. You run your script, then open and run her model to help her, then go back and rerun yours without rerunning your script.

**Step 1: what you expected.** The unit step response of a first-order lag is $y(t) = 1 - e^{-t/\tau}$. With $\tau = 0.5$ s, at $t = 1$ s: $y = 1 - e^{-2} \approx 0.865$.

**Step 2: what you got.** The base workspace now holds her $\tau = 2$ s. At $t = 1$ s: $y = 1 - e^{-0.5} \approx 0.393$.

**Step 3: how long it takes to settle.** A first-order lag gets within 2% of its final value after about $4\tau$. You expected $4 \times 0.5 = 2$ s and got $4 \times 2 = 8$ s.

**Sanity check.** Both runs finish without an error. The plot is a smooth, believable curve either way. Only a comparison against the number you expected (the lesson 4 habit) shows that the filter is four times too slow. That is why base-workspace collisions are dangerous: they do not fail, they mislead.
:::

There are two common improvements that stay close to this setup. A model can run the script itself from a **[[model callback|callbacks]]**, a piece of MATLAB code stored in the model and run at a set moment, such as when the model loads (`PreLoadFcn`) or at the start of every simulation (`InitFcn`). Then the dependency is at least written inside the model. Or the variables can move into the model workspace, which you can view and edit in the **Model Explorer** (Ctrl+H), so they travel inside the .slx file. For values shared by many models, teams use a **[[data dictionary|data-dictionary]]**, a separate file that the model is linked to; the Simulink architecture module covers it.

::: warning "It works on my machine" usually means the base workspace
When a model runs for you and fails for a colleague with an undefined name, or runs for both of you with different results, suspect a variable that exists in your MATLAB session and not in the model's files. A useful test: type `clear` at the Command Window, then run the model. Whatever breaks was depending on something the model does not carry with it.
:::

## Mask parameters: values that belong to a block

Now picture a TV remote. Inside it are circuits, chips and wiring. On the outside are a few labeled buttons. You never see the inside; you only use the buttons. A **[[mask|mask-name]]** does this for a subsystem. It covers the subsystem with its own dialog box, and that dialog has its own named parameters. The blocks inside use those names.

To make one, right-click a subsystem and choose **Mask**, then **Create Mask**. The **Mask Editor** opens. On its parameters page you add a parameter for each value the user should set. Each parameter has a **Prompt**, the label the user sees, like "Position limit (deg)", and a **Name**, the variable name the blocks inside use, like `lim`. Double-click the masked subsystem after that and you see your dialog instead of the blocks.

Each masked block gets its own **mask workspace** holding its own values. That gives masks their three big strengths:

- **Scope.** A mask parameter is visible only to the blocks inside that subsystem. It cannot leak into another model, and another model's variables cannot replace it.
- **Reuse.** Put two copies of the same masked subsystem in a model and each copy has its own values. One actuator design, used four times with four sets of numbers.
- **Explicit dependency.** The values are stored in the model with the block. Anyone who opens the model sees them in the dialog.

::: example One actuator subsystem, two actuators
Take the actuator from lesson 7: a Saturation followed by a Rate Limiter. Group it into a subsystem and mask it with two parameters: `lim` (prompt "Position limit (deg)") and `rate` (prompt "Rate limit (deg/s)"). Inside, the Saturation's limits are `lim` and `-lim`; the Rate Limiter's slew rates are `rate` and `-rate`.

Place two copies. In the pitch copy's dialog enter $6$ and $20$. In the yaw copy's dialog enter $5$ and $15$. Send both an $8°$ step command.

**Step 1: pitch.** The Saturation clips $8°$ to $6°$. The Rate Limiter ramps at $20\,°/\mathrm{s}$, so the actuator arrives at $6/20 = 0.3$ s.

**Step 2: yaw.** The Saturation clips $8°$ to $5°$. The ramp is $15\,°/\mathrm{s}$, so it arrives at $5/15 \approx 0.333$ s.

**Step 3: what did not happen.** Both copies use the names `lim` and `rate`, yet they do not interfere. Each looks in its own mask workspace first and finds its own values there. If the base workspace also happens to hold a variable called `lim`, it is ignored inside the masks, because the mask workspace is searched first.

**Sanity check.** Yaw has the smaller limit and the slower rate, and it arrives slightly later; with the same rate of $20\,°/\mathrm{s}$ it would have arrived first, at $0.25$ s. Fix one thing in the subsystem, such as adding a Quantizer for the position sensor, and both actuators get the fix.
:::

::: warning A name the mask forgot
The search order has a trap of its own. Suppose a block inside the mask uses `K`, but you never added `K` to the mask's parameters. Simulink does not stop at the mask. It keeps searching outward, and if the base workspace happens to hold a `K`, the block quietly uses that one. The mask looks self-contained and is not. Check that every name used inside a mask is one of its parameters, and test the model after `clear`.
:::

Masks can do much more: draw a custom icon, check that a value is in range, show or hide fields. The architecture module's lesson on masks and libraries covers those. For this module, what matters is the scope: mask parameters are the block's own, base-workspace variables are everybody's.

| Where the value lives | Stored in the .slx? | Who can see it | Typical use |
|---|---|---|---|
| Base workspace | No | Every model and script in the session | Quick experiments |
| Model workspace | Yes | Blocks of that one model | Values specific to one model |
| Mask workspace | Yes, with the block | Blocks inside that masked subsystem | Reusable components with their own settings |
| Data dictionary | In its own file, linked from the model | Every model linked to it | Values shared across a team's models |

## When the model will not run: the Diagnostic Viewer

Sooner or later you press Run and nothing runs. Instead, the **Diagnostic Viewer** opens: a window that lists every error, warning and information message from updating or running the model. Errors are marked in red, warnings in yellow. The messages are grouped by the stage they came from, such as updating the diagram or simulating, and each group is labeled with the model it belongs to. If the window is closed, the status bar at the bottom of the editor offers a link to reopen it.

You can bring errors out early without running: update the diagram with Ctrl+D (lesson 1). That is when Simulink evaluates block parameters, works out sizes and types, and checks the wiring, so most errors appear there.

Each message is written to be read in a certain way.

- **Blue, underlined block paths are links.** Click `pitch_loop/Kp gain` and the editor jumps to that block and highlights it.
- **The top line says what failed. "Caused by" says why.** [[Messages often nest|caused-by]]: a subsystem failed because a block failed because a name was undefined. The deepest "caused by" is usually the one to fix.
- **Some messages offer suggested fixes**, with a button that applies them. Read what a fix does before you press it.

::: key
Reading a model error: find the block path (and click it), then read down to the deepest "caused by" line. The top line says where it failed; the bottom cause usually says why.
:::

::: example Reading two real-looking errors
Here is the kind of message you would see after running `clear` and pressing Ctrl+D on the pitch model. (The exact wording changes a little between releases.)

```text
Error evaluating parameter 'Gain' in 'pitch_loop/Kp gain'
  Caused by:
    Unrecognized function or variable 'Kp'.
```

**Step 1: where.** The path `pitch_loop/Kp gain` names the model and the block. Click it to find the block.

**Step 2: why.** The deepest cause: `Kp` could not be found in any workspace Simulink searched.

**Step 3: the fix.** Not "type 2 into the block". The right fix is to decide where `Kp` should live — a callback, the model workspace, a mask, a dictionary — and put it there, so the next person does not hit the same error.

A second error, after wiring a two-element signal into a Gain whose gain is the three-element vector `[1 2 3]`, set to multiply element by element. The message names the Gain block `pitch_loop/Mix gain` and says that the sizes do not agree: the input has 2 elements and the gain has 3.

**Step 1: where.** The Gain block named in the message.

**Step 2: why.** One side has 2 elements, the other has 3. Element-wise multiplication needs them to match.

**Step 3: the fix.** Decide which is right, the signal or the gain vector. If the signal should carry three values, look upstream at the Mux or Bus from lesson 6 that built it.
:::

Warnings deserve reading too. A warning is Simulink saying "this runs, but I would not trust it". Which conditions count as errors, warnings or nothing is set in Configuration Parameters, on the **[[Diagnostics|diagnostics-pane]]** pane. Flight teams often turn important warnings into errors, so a model with a problem cannot quietly produce a result.

::: warning Do not fix the first line you see
When a model has ten errors, the first one in the list is not always the root. A single undefined variable can make five blocks fail, and the messages about those five can bury the one about the variable. Look for the message that names an undefined name, a missing file or a size mismatch, fix that, and update again. Often the other nine disappear.
:::

## Check yourself

::: check
A block inside a masked subsystem uses the names `gain` and `bias`. The mask defines `gain = 3`. The model workspace defines `bias = 0.1`. The base workspace defines `gain = 5` and `bias = 7`. What values does the block use?
:::

::: answer
Simulink searches the mask workspace first, then the model workspace, then the base workspace, and stops at the first match. `gain` is found in the mask: $3$. `bias` is not in the mask, so the search continues to the model workspace and finds $0.1$. The base-workspace values $5$ and $7$ are never used.
:::

::: check
Your model reads `tau` from the base workspace. You set `tau = 0.5` and get the expected response. You then run `tau = 0.25` to try something and forget about it. What does a unit step response of $\frac{1}{\tau s + 1}$ show at $t = 0.5$ s the next time you run, and how could you have caught it?
:::

::: answer
With $\tau = 0.25$: $y(0.5) = 1 - e^{-2} \approx 0.865$. You expected $1 - e^{-1} \approx 0.632$. The run gives no error. You catch it by comparing against a reference value (the lesson 4 habit), or by keeping `tau` somewhere the Command Window cannot quietly change it, such as a mask parameter or the model workspace.
:::

::: check
Give two reasons to make an actuator a masked subsystem rather than having its blocks read base-workspace variables.
:::

::: answer
Any two of these. Scope: the mask's values are visible only inside that subsystem, so another model's variable with the same name cannot replace them. Reuse: several copies of the subsystem can each have their own limits and rates. Explicitness: the values are saved in the model, visible in the block's dialog, so the model does not depend on a script someone must remember to run.
:::

::: check
The Diagnostic Viewer shows twelve errors. The first says a subsystem could not be compiled, and the last one, several levels of "caused by" down, says `Unrecognized function or variable 'rateLim'`. Where do you start?
:::

::: answer
With the deepest cause: the undefined `rateLim`. The subsystem failure and the other errors are probably consequences of it. Click the block path in that message to find the block that uses `rateLim`, check the spelling and where the variable is supposed to be defined, fix it, and update the diagram again with Ctrl+D. Then see which errors remain.
:::

::: check
Why is `clear` followed by a model run a useful test before you send a model to someone?
:::

::: answer
`clear` empties the base workspace, which is what your colleague's MATLAB session looks like when they open your model. If the model still runs, it does not depend on anything that is only in your session. If it fails, the error names the variable it was secretly relying on, and you can move that value into the model workspace, a mask, a callback or a data dictionary before you send it.
:::

## Summary

| Idea | Meaning | Fact to keep |
|---|---|---|
| Parameter by name | A block field holding a variable name | Evaluated at update and run time |
| Search order | Where Simulink looks for a name | Mask workspaces (innermost first), model workspace, then dictionary and base workspace |
| Base workspace | The Command Window's workspace | Convenient, not saved in the model, shared by everything |
| Mask parameter | A value in a masked subsystem's own dialog | Scoped to that block, reusable, saved in the model |
| Name collision | Two uses of one name | Base-workspace collisions run silently with the wrong value |
| Diagnostic Viewer | The list of errors and warnings | Click the block path; read the deepest "caused by" |
| Update diagram | Ctrl+D | Finds most errors without running |

This module built models whose answers you can check, with honest actuators, real data tables, code where code is clearer, and parameters that travel with the model. The next module, on solvers, opens up the engine that has been quietly stepping all of these models through time, starting with the choice between variable-step and fixed-step solvers.

::: context base-workspace The one you already know
The base workspace is what the Workspace panel in the MATLAB desktop shows, and what `whos` lists. Every variable you create at the Command Window or in a script (not inside a function) lands there. It lives only as long as your MATLAB session, unless you save it to a MAT-file. The picture below shows where it sits in the search order.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="160" rx="6" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="20" y="28" font-size="11" fill="#6c7a93">base workspace / data dictionary (searched last)</text>
  <rect x="30" y="38" width="300" height="120" rx="6" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="40" y="56" font-size="11" fill="#1d6fd1">model workspace</text>
  <rect x="50" y="66" width="260" height="80" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="84" font-size="11" fill="#1f2a44">mask workspace (searched first)</text>
  <rect x="140" y="98" width="80" height="34" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="120" font-size="12" fill="#1f2a44" text-anchor="middle">Gain: K</text>
</svg>
```

The block looks in the innermost box first and works outward until it finds the name.
:::

::: context collision The same word, two meanings
Short names collide most: `K`, `tau`, `dt`, `m`, `g`. On a large team, dozens of models and scripts share one MATLAB session over a day of work, and each may set `dt` to its own step size. Naming conventions such as prefixes (`pitch_Kp`, `act_tau`) reduce collisions but do not remove the underlying problem, which is that the base workspace is one shared space with no owner. That is the reason scoped places for parameters exist at all.
:::

::: context callbacks Code that runs at set moments
A model has a list of callback slots you can fill with MATLAB code, found under the model's properties. `PreLoadFcn` runs before the model loads, `PostLoadFcn` after, `InitFcn` at the start of each simulation, `StopFcn` at the end. A callback that runs the parameter script makes the dependency visible and automatic, but the values still land in the shared base workspace, so collisions remain possible. It is a patch, not a cure.
:::

::: context data-dictionary A shared, versioned parameter file
A data dictionary is a .sldd file holding parameters, signal definitions and types. A model can be linked to it, and several models can share one. Because it is a file of its own, it can go under version control next to the models, with changes reviewed like code. Many flight software teams keep every tunable parameter in dictionaries. The Simulink architecture module covers them, along with the `Simulink.Parameter` objects that carry a value together with its type and units.
:::

::: context caused-by The same chain, from a script
When you run a model with `out = sim('pitch_loop')` from a script, a failure arrives as an ordinary MATLAB error instead of in the Diagnostic Viewer. It is an exception object whose `message` is the top line and whose `cause` property holds the nested causes, the same chain the viewer shows. Wrap the call in `try` and `catch` to log it, and print it with `getReport` to see every level at once. Automated test runs, covered in the verification module, read errors this way.
:::

::: context mask-name Why "mask"
A mask in Simulink is like a mask on a face: it covers what is underneath and shows a simpler face to the world. Look under the mask (right-click, then Mask, then Look Under Mask) and the blocks are still there, unchanged. The mask adds a dialog, an optional icon and a private workspace; it never changes what the blocks compute.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="150" height="110" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="95" y="40" font-size="11" fill="#1f2a44" text-anchor="middle">Pitch actuator</text>
  <text x="32" y="66" font-size="11" fill="#1f2a44">Position limit (deg)</text>
  <rect x="32" y="72" width="120" height="16" fill="#fff" stroke="#6c7a93"/>
  <text x="38" y="84" font-size="11" fill="#1f2a44">6</text>
  <text x="32" y="104" font-size="11" fill="#1f2a44">Rate limit (deg/s)</text>
  <rect x="32" y="108" width="120" height="16" fill="#fff" stroke="#6c7a93"/>
  <text x="38" y="120" font-size="11" fill="#1f2a44">20</text>
  <line x1="176" y1="75" x2="206" y2="75" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="191" y="68" font-size="11" fill="#6c7a93" text-anchor="middle">under</text>
  <rect x="210" y="45" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="240" y="64" font-size="11" fill="#1f2a44" text-anchor="middle">Saturation</text>
  <rect x="210" y="90" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="240" y="109" font-size="11" fill="#1f2a44" text-anchor="middle">Rate Lim.</text>
  <line x1="240" y1="75" x2="240" y2="86" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="278" y="64" font-size="11" fill="#1d6fd1">lim</text>
  <text x="278" y="109" font-size="11" fill="#1d6fd1">rate</text>
</svg>
```

The dialog on the left is what the user sees; the blocks on the right use the names `lim` and `rate`.
:::

::: context diagnostics-pane Choosing what counts as an error
The Diagnostics pane of Configuration Parameters holds dozens of checks, each set to none, warning or error: an algebraic loop, a signal that is never connected, a data type that is silently converted, and so on. The defaults are chosen to let new users get results. Teams that deliver flight code usually tighten them, and tools like the Model Advisor, covered in the verification module, check that the settings match the team's standard.
:::
