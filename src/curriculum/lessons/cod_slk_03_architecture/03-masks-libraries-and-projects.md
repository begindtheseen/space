---
id: l03-masks-libraries-and-projects
title: Masks, libraries and projects
minutes: 24
covers:
  - 'Masking: parameters, icons, callbacks, self-documenting blocks'
  - Libraries and linked blocks; Simulink Projects under source control
---

Think about a microwave oven. It has a front panel with a few labeled buttons, and you never open the case to heat soup. Now think about a recipe a whole restaurant chain uses. If every kitchen keeps its own handwritten copy, a fix reaches nobody. If every kitchen reads one master card, a fix reaches everyone. And think about the binder that holds the recipes and manuals together, so a new cook gets everything at once.

Simulink has all three. A **mask** is the front panel: it gives a subsystem its own dialog box, icon and help, so people can use it without opening it. A **library** is the master recipe card: one file that holds the master copy of a block, with **linked blocks** in many models that follow it. A **project** is the binder: it keeps every file of a model together, sets up MATLAB when you open it, and connects the whole set to Git.

The last lesson used a mask parameter in passing, to give each thruster in a For Each subsystem its own time constant. This lesson shows how to build a good mask, then how libraries and projects let a GNC team share one vehicle model without stepping on each other.

## Masks: a front panel for a subsystem

A **mask** is a custom user interface laid over a subsystem. Double-click a masked block and you see the mask's dialog, not the blocks inside. To look inside anyway, right-click the block and choose **Look Under Mask** (Ctrl+U). The contents are still there, only **[[covered|mask-name]]**.

You create a mask by right-clicking a subsystem and choosing **Mask > Create Mask** (Ctrl+M). That opens the **Mask Editor**, whose screens differ between releases but always hold the same ingredients:

- **parameters**: the fields in the dialog, each a named value the blocks inside can use;
- **the icon**: what the block looks like on the canvas, drawn by short commands;
- **code**: initialization code that runs when the model is updated, and callbacks that run when a parameter changes;
- **documentation**: the block's type name, a one-line description and a help text.

::: key
What does a mask give a subsystem? A parameter dialog, an icon and documentation, so the block is self-describing and its parameters are scoped to it rather than to the base workspace. It is how a reusable component stops needing a wiki page.
:::

### Parameters and the mask workspace

Each mask parameter has two names. The **prompt** is the label the user reads, such as "Valve time constant (s)". The **name** is the variable the blocks inside use, such as `tau`. A parameter can be an edit box, a checkbox, a popup list, and more.

When the model is updated, Simulink evaluates each parameter's value and stores the result in the mask's own **[[workspace|workspace-order]]**: a private set of named variables that belongs to that one block. A Gain inside the mask can have the value `tau` or `1/tau`, and it finds `tau` in the mask workspace.

Here is the rule that makes masks so useful. When a block inside needs a variable, Simulink searches from the inside out. It looks first in the nearest mask workspace, then in any mask around that one, then in the model workspace, and last in the base workspace (or the model's data dictionary). The first match wins. So two copies of the same masked block, one with `tau = 0.020` and one with `tau = 0.030`, never interfere. Each block carries its own values.

From a script, a mask parameter looks like any other block parameter. The value is text, because it can be an expression:

```matlab
blk = 'vehicle/RCS/ValveLag1';   % path to the masked block
get_param(blk, 'tau')            % returns the text typed in the dialog, e.g. '0.025'
set_param(blk, 'tau', '0.030')   % change it, as if typed into the dialog
```

::: example Whose K is it?
A masked block contains a Gain whose value is `K`. The mask has a parameter named `K`, set to 0.5. Meanwhile a script left `K = 2` in the base workspace. The block's input is 10.

**Step 1: search from the inside out.** The Gain asks for `K`. The nearest workspace is the mask workspace, and it has `K = 0.5`. The search stops there.

**Step 2: compute.** Output $= 0.5 \times 10 = 5$.

**Step 3: someone deletes the mask parameter.** A colleague tidies the dialog and removes `K`, forgetting the Gain uses it. Now the search finds nothing in the mask, goes on outward, and finds `K = 2` in the base workspace. Output $= 2 \times 10 = 20$, four times larger.

**Sanity check.** No error appears in Step 3. The model runs and gives a different answer, because some variable called `K` happened to be lying around: the invisible dependency a mask is meant to remove.
:::

::: warning A mask only scopes what it declares
Any name the mask does not declare falls through to the base workspace, silently. Give every value a block needs a mask parameter, keep short names like `K` or `a` out of the base workspace, and test models in a fresh MATLAB session where no stray variables exist. The data dictionary lesson later in this module removes the base workspace from the picture altogether.
:::

### The icon

A masked block can draw its own face with **icon drawing commands**, such as:

- `disp('text')` to write text in the middle of the icon;
- `text(x, y, 'text')` to write text at a position;
- `port_label('input', 1, 'cmd')` to name a port on the icon;
- `plot(x, y)` to draw lines, for example a little step response;
- `color('blue')` to set the drawing color.

Icon commands can use variables created by the initialization code, so the icon can show the block's actual settings, such as "lag 25 ms".

### Initialization code

**Initialization code** is MATLAB code that runs in the mask workspace whenever Simulink needs the block's parameters: when the model is updated or a simulation starts, and when a parameter is changed and applied. It does two jobs.

1. It computes **derived parameters**: values the blocks inside need that follow from the ones the user typed, stored in the mask workspace.
2. It **validates** the input, and stops with a clear message when a value makes no sense.

::: example A valve block that checks itself
In the last lesson each thruster valve followed the discrete lag $y_{k+1} = y_k + a\,(u_k - y_k)$ with $a = T_s/\tau$. Read $\tau$ as "tau", the valve's time constant, and $T_s$ as "T sub s", the sample time. Now package it as a masked block with two parameters, `tau` and `Ts`, and this initialization code:

```matlab
% Mask initialization code: runs in the mask workspace
if Ts <= 0 || tau <= 0
    error('Ts and tau must be positive.');
end
a = Ts / tau;                  % gain used by the blocks inside
if a >= 1
    error('Ts/tau = %.2f is too large for this valve; it must be below 1.', a);
end
iconText = sprintf('lag %g ms', 1000*tau);   % text for the icon
```

and the icon drawing commands `disp(iconText)`, `port_label('input', 1, 'cmd')` and `port_label('output', 1, 'open')`.

**Step 1: a normal valve.** With $T_s = 0.005\,\mathrm{s}$ and $\tau = 0.025\,\mathrm{s}$: $a = 0.005 / 0.025 = 0.2$. The check passes, and the icon reads "lag 25 ms".

**Step 2: what the block does.** Commanded fully open from rest, the valve moves $0.2$ of the way each step: $y_1 = 0.2$, then $y_2 = 0.2 + 0.2 \times 0.8 = 0.36$, then $y_3 = 0.36 + 0.2 \times 0.64 = 0.488$.

**Step 3: a typo.** Someone types $\tau = 0.004\,\mathrm{s}$ (4 ms instead of 40). Then $a = 0.005/0.004 = 1.25$. The code stops the model with "Ts/tau = 1.25 is too large for this valve; it must be below 1." Without the check, the valve would overshoot fully open on the first step, $y_1 = 1.25$, and ring from then on.

**Sanity check.** Each step closes 20 percent of the remaining gap, so after three steps a bit under half is closed: 0.488. The limit of 1 is where the factor $1 - a$ on the remaining gap turns negative, which is what makes the valve overshoot.
:::

### Parameter callbacks

A **[[callback|callback-word]]** is code that Simulink runs for you when something happens. A **parameter callback** belongs to one mask parameter and runs when the user changes that parameter's value in the dialog. It makes the dialog behave: when a checkbox turns on a rate limit, enable the field for the limit; otherwise gray it out. It can do that through the `Simulink.Mask` object that `Simulink.Mask.get` returns. Keep the jobs apart: initialization code computes and checks values; callbacks shape the dialog.

::: warning No side effects in mask code
Initialization code runs often: every model update, every applied parameter. Code that writes to the base workspace, saves files, or changes other blocks does it again and again, in an order you do not control. Mask code should read its own parameters and write its own mask workspace, nothing else.
:::

### Documentation: a block that explains itself

The documentation pane holds three things. The **type** is the block's name for what it is, such as "RCS valve lag", shown in the dialog's title. The **description** is a sentence or two shown at the top of the dialog. The **help** is the longer text shown when the user presses the dialog's Help button: the equations, the units of each parameter, the valid ranges, and the requirement the block implements.

Put it together and you get a **self-documenting block**: the icon shows its settings, the prompts carry units, the initialization code refuses bad values with a reason, and the help holds the equation. A new engineer can use it without asking anyone, and no separate document drifts out of date.

## Libraries: one master copy

Suppose every model on the program wants that valve block. Copying it into each makes a dozen independent copies, and the day someone finds a bug, a dozen fixes are needed and one will be missed.

A **library** is a Simulink file, saved as `.slx`, that holds master copies of blocks. It cannot be simulated: it is a shelf, not a machine.

Drag a block from a library into a model and you get a **linked block**: a reference to the library block. Its contents come from the library; only its mask parameter values belong to the model. A small **link badge**, an arrow in the corner of the block, shows the link. When the library block changes, every linked block follows it the next time its model loads or updates. For that to work, the library must be on the **[[MATLAB path|matlab-path]]**, the list of folders MATLAB searches for files. If Simulink cannot find the library, it reports the block as an **unresolved link**.

To protect the master copies, a library opens **locked**: you cannot edit it until you unlock it on purpose.

::: key
A library holds master copies of blocks. Blocks copied from it into models are **linked blocks**: they take their contents from the library and keep only their own parameter values, so a fix in the library reaches every model that uses the block.
:::

### Disabling, restoring and breaking links

Sometimes you want to change one linked block by hand: try a fix, or add a probe. The contents of an active linked block belong to the library, so first you **[[disable the link|linked-picture]]** (right-click, Library Link, Disable Link). Depending on the release, Simulink may also do this for you, with a notice, when you start editing inside a linked block. The block becomes a local copy that remembers which library block it came from. Its link status is now **inactive**.

A disabled link should end one of two ways. **Restore** throws away the local edits and takes the library version again. **Push** sends the local edits into the library, so every linked block gets them. Simulink's **Links Tool** lists disabled links and offers those two choices. **Breaking** a link is different: the block becomes a standalone subsystem that forgets its library.

The link status is also a block parameter, which a script can read or set:

| `LinkStatus` value | Meaning |
|---|---|
| `'resolved'` | An active link that Simulink found in its library |
| `'unresolved'` | A link whose library block cannot be found |
| `'inactive'` | A disabled link: a local copy that remembers its library block |
| `'none'` | Not a linked block (or the link was broken) |
| `'restore'` (set only) | Replace the local copy with the library version |
| `'propagate'` (set only) | Push the local copy into the library |

```matlab
blk = 'vehicle/RCS/Thruster07';
get_param(blk, 'LinkStatus')            % e.g. 'inactive'
get_param(blk, 'ReferenceBlock')        % library block it came from
set_param(blk, 'LinkStatus', 'restore') % take the library version again
```

::: example The thruster that missed the fix
A spacecraft model has 12 reaction control thrusters, each a linked block from a library block `RCSThruster`. Each should produce 22 N while on. A typo in the library set the force to 2.2 N. Months ago, an engineer disabled the link on Thruster 7 to add a probe, and never restored it. Today the library is fixed.

**Step 1: the eleven active links.** They pick up the fix when the model next loads. A 50 ms pulse now gives an impulse of $22\,\mathrm{N} \times 0.05\,\mathrm{s} = 1.1\,\mathrm{N\,s}$ (newton-seconds), as it should.

**Step 2: Thruster 7.** Its link is inactive, so it is a local copy with the old force. A 50 ms pulse gives $2.2 \times 0.05 = 0.11\,\mathrm{N\,s}$, ten times too little.

**Step 3: a 20-pulse maneuver on Thruster 7.** It should deliver $20 \times 1.1 = 22\,\mathrm{N\,s}$. It delivers $20 \times 0.11 = 2.2\,\mathrm{N\,s}$. On a 500 kg spacecraft that is a velocity change of $22/500 = 0.044\,\mathrm{m/s}$ expected, $2.2/500 = 0.0044\,\mathrm{m/s}$ simulated.

**Sanity check.** Only one thruster in twelve is wrong, so most tests pass. The fix is one line: restore the link. Better, search every model for inactive links before a release; a script with `get_param` does it in seconds.
:::

::: warning A disabled link is a fork you forgot about
A disabled link looks like its neighbors apart from the badge, and it stops receiving library fixes. Treat every inactive link as unfinished work: restore it or push it before release.
:::

## Projects: the whole set of files, under control

A real vehicle model is dozens of models, libraries, data dictionaries, scripts and tests. Opening the right ones, with the right folders on the path, used to be a page of instructions in a wiki.

A **project** replaces that page. It started life in 2011 as **Simulink Projects**. Since release R2019a it is part of MATLAB itself and is called Projects, or MATLAB Projects. A project is a folder with a project definition file (`.prj`) that records:

- **which files belong** to the project, with labels such as "Design" or "Test" if you want them;
- **the project path**: folders added to the MATLAB path when the project opens and removed when it closes;
- **startup files**: scripts that run when the project opens, for example to load a data dictionary or set a preference;
- **shutdown files**: scripts that run when it closes, to clean up;
- **shortcuts** to the files people open most, and folders for generated files such as build output.

Anyone who clones the repository and opens the project gets the same set-up.

```matlab
proj = openProject('C:\work\launcher_gnc');   % sets the path, runs startup files
proj = currentProject;                        % the project that is open now
updateDependencies(proj);                     % refresh the dependency graph
```

### Source control

A project connects to **[[Git|git-basics]]** (and to Subversion) directly. The project window shows each file's status (modified, added, in conflict), and you can commit, pull, push and switch branches from the Project toolstrip or from the Git command line.

Models need one special care. An `.slx` file is **[[compressed|slx-zip]]**, not plain text, so Git's line-by-line diff and merge cannot read it. Mark model files as binary in the repository's `.gitattributes` file, so Git never tries to merge two versions line by line and corrupt the file. To see what changed, use MATLAB's comparison tools from the project, which show differences as blocks, lines and parameters. Merging two engineers' edits to one model uses Simulink's model merge tools, not Git. Better still, split the model so they do not share a file: that is model reference, two lessons from now.

### Dependency analysis

The **Dependency Analyzer** reads the project's files and draws a **[[graph|dependency-graph]]** of which file needs which. It answers three questions:

- **Impact**: "if I change this library, which models and tests are affected?"
- **Missing files**: a model needs a file that is not in the project.
- **Required products**: which MathWorks toolboxes the project needs to run.

::: key
A project (formerly Simulink Projects) manages a model's files, sets the path and runs startup and shutdown scripts when it opens and closes, integrates with Git so file status, commits and model comparisons live in one place, and analyzes dependencies to show what a change will affect and which files are missing.
:::

::: warning It works on your machine because of your base workspace
The classic failure: a model runs for its author and breaks for everyone else, because it used a variable in the author's base workspace or a folder on a personal path. Open the project in a fresh MATLAB session, run the tests, and check the dependency analysis for missing files.
:::

## Check yourself

::: check
Two copies of the same masked valve block sit side by side, one with `tau` set to 0.020 and the other to 0.030. Why do they not interfere, even though the blocks inside both say `tau`?
:::

::: answer
Each masked block has its own mask workspace. When a block inside needs `tau`, Simulink searches from the inside out and stops at the nearest mask workspace that defines it. So each copy's blocks find their own value, 0.020 or 0.030; nothing is shared through the base workspace.
:::

::: check
Which part of a mask would you use for each job? (a) Stop the model with a clear message if a sample time is negative. (b) Gray out the "rate limit" field unless the "use rate limit" checkbox is ticked. (c) Show the block's gain on its face. (d) Give the block's equation and the units of each parameter.
:::

::: answer
(a) Initialization code, which runs when the model is updated and can call `error` with a message. (b) A parameter callback on the checkbox, which runs when the user changes it and can enable or disable other prompts. (c) Icon drawing commands, for example `disp` with text built by the initialization code. (d) The documentation, specifically the help text (with a short description at the top of the dialog).
:::

::: check
What is the difference between disabling a library link and breaking it? What are the two ways a disabled link should end?
:::

::: answer
A disabled (inactive) link is a local copy that remembers its library block; a broken link forgets it and becomes a standalone subsystem. A disabled link should end with a restore (discard local edits, take the library version) or a push (send the local edits into the library for every linked block).
:::

::: check
A new team member clones the repository, opens the top model directly, and gets errors about missing blocks and undefined variables. The model runs fine for everyone else. What is the likely cause, and what should she do?
:::

::: answer
She opened the model without opening the project, so the library folders are not on the path (unresolved links) and the startup files never loaded the data (undefined variables). She should open the project, for example with `openProject`. If it still fails, dependency analysis shows which files are missing.
:::

::: check
Why should `.slx` files be marked as binary in Git, and how do you then see what changed between two versions?
:::

::: answer
An `.slx` file is compressed, not text, so Git's diff shows nothing useful and a text merge can corrupt it. Marking it binary stops Git trying. To see changes, use MATLAB's comparison tools, which list the differing blocks, lines and parameters.
:::

## Summary

| Idea | Meaning | What to remember |
|---|---|---|
| Mask | Custom dialog, icon and docs over a subsystem | Create with Ctrl+M; Look Under Mask with Ctrl+U |
| Mask parameter | Prompt (label) plus name (variable) | Evaluated into the block's own mask workspace |
| Variable search | Where a block finds a name | Nearest mask, outer masks, model workspace, base workspace or dictionary |
| Icon drawing commands | Draw the block's face | `disp`, `text`, `port_label`, `plot`, `color` |
| Initialization code | Runs when the model updates | Derived parameters and validation; no side effects |
| Parameter callback | Runs when one parameter changes | Shapes the dialog: show, hide, enable |
| Library | File of master blocks | Opens locked; cannot be simulated; must be on the path |
| Linked block | Reference to a library block | Follows library changes; keeps only its own parameter values |
| Disable, restore, push, break | Ways to change a link | Inactive link must be restored or pushed |
| Project | The model's binder, `.prj` | Files, path, startup and shutdown, Git, dependency analysis |

The next lesson turns to the signals between components: `Simulink.Bus` objects that define each interface once, like a header file, so that a mismatch between two engineers' blocks becomes an error instead of a silent rewiring.

::: context mask-name Why it is called a mask
A mask covers a face without removing it. A Simulink mask is the same: the blocks underneath are untouched, still editable, still there when you look under the mask. What changes is what the user meets first. The word also explains the scoping. Behind a mask, the block's inner variable names are private, the way a costume hides who is wearing it.
:::

::: context workspace-order Searching from the inside out
A workspace is a set of named variables, like a labeled shelf. A block inside nested masks searches the nearest shelf first, then each shelf further out, and stops at the first match. That is why a mask parameter "shadows" a base-workspace variable with the same name, and why an undeclared name falls through to the outermost shelf.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="150" rx="6" fill="#fff" stroke="#6c7a93"/>
  <text x="20" y="27" font-size="11" fill="#6c7a93">base workspace or data dictionary</text>
  <rect x="30" y="35" width="300" height="115" rx="6" fill="#fff" stroke="#1f2a44"/>
  <text x="40" y="52" font-size="11" fill="#1f2a44">model workspace</text>
  <rect x="50" y="60" width="260" height="80" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="60" y="77" font-size="11" fill="#1f2a44">mask workspace: tau = 0.025</text>
  <rect x="130" y="95" width="70" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="165" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">Gain: tau</text>
  <line x1="200" y1="110" x2="296" y2="110" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="296,106 304,110 296,114" fill="#b4232c"/>
  <text x="252" y="104" font-size="11" text-anchor="middle" fill="#b4232c">search outward</text>
</svg>
```
:::

::: context callback-word Where "callback" comes from
The word comes from the telephone: you leave your number, and the other person calls you back when they have news. In software you hand a system a piece of code, and the system runs it when an event happens. Simulink has callbacks at several levels: on mask parameters, on blocks (for example when a block is copied or deleted), and on whole models (for example when a model is loaded or before a simulation starts). The same rule holds for all of them: keep them small and free of surprises.
:::

::: context matlab-path How MATLAB finds a file
The MATLAB path is an ordered list of folders. When a model names a library, or code calls a function, MATLAB checks the current folder and then walks the list from the top and uses the first file with that name. Two folders holding a file of the same name is a quiet trap: whichever folder comes first wins, and the other file is "shadowed". Projects help here too, since everyone who opens the project gets the same folders in the same order.
:::

::: context linked-picture One master, many linked copies
Each linked block points back to the library block and takes its contents from it. A disabled link has cut that pointer, so it keeps whatever the library held when the link was cut.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="10" width="100" height="36" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="27" font-size="11" text-anchor="middle" fill="#1f2a44">library block</text>
  <text x="180" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">22 N (fixed)</text>
  <rect x="15" y="105" width="90" height="34" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="60" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">linked: 22 N</text>
  <rect x="135" y="105" width="90" height="34" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">linked: 22 N</text>
  <rect x="255" y="105" width="90" height="34" rx="4" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="300" y="126" font-size="11" text-anchor="middle" fill="#b4232c">inactive: 2.2 N</text>
  <line x1="160" y1="46" x2="60" y2="105" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="46" x2="180" y2="105" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="200" y1="46" x2="243" y2="71" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5,4"/>
  <line x1="262" y1="82" x2="300" y2="105" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5,4"/>
  <text x="300" y="80" font-size="11" text-anchor="middle" fill="#b4232c">link cut</text>
</svg>
```
:::

::: context git-basics Git in one paragraph
Git is a version-control system written by Linus Torvalds in 2005 for the Linux kernel, and now used almost everywhere. It stores a project's history as a chain of snapshots called commits. A branch is a line of work you can switch to and from; a remote, such as a company server or GitHub, is the shared copy everyone pushes to and pulls from. Flight software teams pair it with code review: nothing reaches the main branch until another engineer has looked at the change.
:::

::: context slx-zip What is inside an .slx file
An `.slx` file is a ZIP archive. Rename a copy to `.zip` and you can open it and see XML files describing the blocks and lines, plus other parts. The format arrived in 2012; before it, models were saved as `.mdl` files in a plain-text format. Even the text format merged badly, because a small move of a block changes many lines. That is why Simulink comparison and merge work on the model's structure, not on its text.
:::

::: context dependency-graph A map of who needs whom
The Dependency Analyzer draws files as boxes and "needs" as arrows. Follow the arrows backward from a file you want to change and you find everything that change can affect.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="55" width="90" height="34" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="55" y="76" font-size="11" text-anchor="middle" fill="#1f2a44">vehicle.slx</text>
  <rect x="140" y="10" width="95" height="34" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="187" y="31" font-size="11" text-anchor="middle" fill="#1f2a44">rcs_lib.slx</text>
  <rect x="140" y="55" width="95" height="34" rx="4" fill="#fff" stroke="#1f2a44"/>
  <text x="187" y="76" font-size="11" text-anchor="middle" fill="#1f2a44">params.sldd</text>
  <rect x="140" y="100" width="95" height="34" rx="4" fill="#fff" stroke="#b4232c" stroke-dasharray="5,3"/>
  <text x="187" y="121" font-size="11" text-anchor="middle" fill="#b4232c">missing.m</text>
  <line x1="100" y1="65" x2="136" y2="30" stroke="#1f2a44"/>
  <polygon points="133,27 140,26 138,33" fill="#1f2a44"/>
  <line x1="100" y1="72" x2="135" y2="72" stroke="#1f2a44"/>
  <polygon points="134,68 141,72 134,76" fill="#1f2a44"/>
  <line x1="100" y1="80" x2="136" y2="113" stroke="#b4232c"/>
  <polygon points="132,115 140,117 137,110" fill="#b4232c"/>
  <text x="300" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">arrow = "needs"</text>
  <text x="300" y="121" font-size="11" text-anchor="middle" fill="#b4232c">not in project</text>
</svg>
```
:::
