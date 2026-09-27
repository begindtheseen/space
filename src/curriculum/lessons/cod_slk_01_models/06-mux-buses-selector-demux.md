---
id: l06-mux-buses-selector-demux
title: Mux, buses, Selector and Demux
minutes: 18
covers:
  - Mux versus Bus Creator, and never using Mux for dissimilar signals
  - Selector and Demux
---

Think about an egg carton and a lunchbox. An egg carton holds twelve things that are all the same kind. Nobody labels the slots, because an egg is an egg: you say "the third one" and that is enough. A lunchbox with compartments is different. One part holds a sandwich, one an apple, one a drink. They are different kinds of things, and if someone swapped the drink into the sandwich slot, you would want to know about it before lunch.

Simulink has both containers. When several signals need to travel on one line, you can bundle them with a **Mux** block, which makes an egg carton: a **vector** of numbers known only by position. Or you can bundle them with a **Bus Creator** block, which makes a lunchbox: a **bus** whose parts keep their names and their own types. At the end of the last lesson, a State-Space block handed you position and velocity side by side on one line. That was an egg carton, and for two numbers of the same kind that was fine.

On a real vehicle model, the lines get crowded. A navigation system hands the autopilot altitude, speed, Mach number, attitude, rates and a flight mode. This lesson is about which container each group belongs in, why a Mux is the wrong one for signals of different kinds, and how the **Selector** and **Demux** blocks take a vector apart again.

## Mux: a vector, known by position

The **Mux** block (short for multiplexer) sits in the Signal Routing library and on the Commonly Used Blocks shelf. Its main parameter is **Number of inputs**. Wire three scalar signals into a three-input Mux and out comes one line carrying a three-element vector. The first element is whatever arrives at the top port, the second at the next port down, and so on. Inputs can be vectors themselves: a 3-element vector and a scalar make a 4-element vector.

That is all a Mux does. It does not compute anything. Simulink treats it as a **[[virtual block|virtual]]**: a drawing convenience that says "draw these lines as one", with no work done when the model runs.

What comes out is a **vector**, and a Simulink vector has two properties you must keep in mind.

- **One data type for every element.** A vector of doubles is all doubles. A vector cannot hold a double in slot 1 and an 8-bit integer in slot 2.
- **Elements are known only by number.** Name the input lines `x`, `y` and `z` if you like. After the Mux, they are element 1, element 2 and element 3. The names do not travel with the numbers.

That is exactly right for a group of numbers that are the same kind of thing: the three components of a position in one frame, all in meters; the four parts of a **[[quaternion|quaternion]]**; the speeds of three reaction wheels. You would never want to call $x$ anything but "component 1" anyway, and a vector lets a Gain or a Product work on all three at once.

::: key
A Mux makes a plain vector: every element shares one data type, and the elements are identified only by position, so the signal names are gone. It is the right tool for several components of one quantity, such as the x, y, z of a position.
:::

## Bus Creator: a bundle with names

The **Bus Creator** block, also in Signal Routing, takes several signals and outputs a **bus**: a structured signal that keeps each element's **name**, its own **data type** and its own **size**. An element can be a scalar, a vector, or another bus, so buses can **nest**, like folders inside folders.

The names come from the signal lines coming in. Double-click a line to give it a name, such as `alt`, and that becomes the element's name in the bus. Downstream, a **Bus Selector** block picks elements out **by name**: you tick `mach` in its list, and it outputs the Mach number wherever that element sits in the bus.

On its own, a Bus Creator takes whatever arrives. To fix the bus's contents as a contract, you define a **[[Simulink.Bus object|bus-object]]**: a definition, stored in the workspace or a data dictionary, that lists every element's name, type, size and unit. A navigation bus might be defined like this:

```matlab
elems(1) = Simulink.BusElement;
elems(1).Name = 'alt';     elems(1).DataType = 'double';  elems(1).Unit = 'm';
elems(2) = Simulink.BusElement;
elems(2).Name = 'mach';    elems(2).DataType = 'double';
elems(3) = Simulink.BusElement;
elems(3).Name = 'mode';    elems(3).DataType = 'uint8';
NavBus = Simulink.Bus;
NavBus.Elements = elems;
```

Then set the Bus Creator's **Output data type** to `Bus: NavBus`. From that moment, Simulink checks what arrives against the definition when you update the diagram with Ctrl+D. A signal of the wrong type or the wrong size is an error, reported before anything runs. Flight teams also turn on the checks that report an element whose name does not match, so a renamed or swapped signal cannot slip through. The mode here is a plain `uint8` to keep the example short. Real models often make it an **[[enumeration|enumeration]]** instead, with the element's data type written as `Enum: FlightMode`.

A bus is also what the flight code will see. When Simulink generates C code for a model with a **non-virtual** bus (one stored as a single block of memory), the bus becomes a C **struct**: one named field per element, each with its own type. The NavBus above turns into something like this (generated code uses its own type names, such as `real_T` for double, but the shape is the same):

```c
typedef struct {
  double alt;        /* altitude, m */
  double mach;       /* Mach number, dimensionless */
  unsigned char mode;
} NavBus;
```

The difference between virtual and non-virtual buses, and the full use of bus objects as interfaces between teams, belong to the Simulink architecture module. Here, the point is what the signal is.

::: key
Mux versus Bus Creator: Mux makes a plain vector, so all elements must share a type and the names are gone. A Bus is a structured signal with named, individually typed elements that becomes a C struct in generated code. Use Bus for anything heterogeneous.
:::

## Never use a Mux for dissimilar signals

**Dissimilar** signals are ones that differ in meaning, units or type: an altitude in meters, a Mach number with no units, a flight mode that is an integer code. Bundling those with a Mux is tempting, because a Mux is the first bundling block anyone learns and it works on the first day. Here is what it costs.

- **The names are gone.** Every block downstream has to know that "element 2 means Mach". That knowledge lives only in the heads of the people who wired it.
- **Position is meaning, so order changes break things silently.** Add a signal at the top of the Mux and every element below shifts down one slot. Nothing in Simulink complains, because a vector of four doubles is a perfectly good vector.
- **One type for all.** A mode code or an enumeration cannot share a vector with doubles. Either the model stops with a data-type error where the vector is used, or someone converts everything to double to make the error go away, and the mode loses the type that said what it was.

::: example The Mach number that read 12,000
A navigation subsystem sends the autopilot altitude and Mach number through a two-input Mux: altitude on port 1, Mach on port 2. At one moment in the climb, the vector reads $[12000;\ 0.85]$. Inside the autopilot, a Selector picks element 2 and feeds it to a gain schedule that expects Mach.

**Step 1: the model works.** Element 2 is 0.85. The schedule reads Mach 0.85 and picks the right gains.

**Step 2: a colleague adds a signal.** She needs dynamic pressure, 30,000 Pa, in the autopilot too. She raises the Mux to three inputs and wires dynamic pressure to the top port. The vector is now $[30000;\ 12000;\ 0.85]$.

**Step 3: what the Selector now picks.** Element 2 is 12,000. The gain schedule receives "Mach 12,000". Nothing errors, because every element is a double and the vector's width only grew.

**Step 4: the bus version.** Built as a bus with elements `alt`, `mach` and `qbar`, the autopilot's Bus Selector asks for `mach` by name. Adding `qbar` anywhere in the bus changes nothing downstream: the Selector still gets 0.85.

**Sanity check.** Mach 12,000 is faster than anything that flies through air, so this bug would show up as nonsense the first time someone looked. A subtler swap, say two angles in radians, could fly through every plot. That is why the rule is about structure, not about being careful.
:::

::: warning A Mux around dissimilar signals looks neat
Muxing everything into one fat line makes a diagram look tidy, and the model runs. The [[damage appears months later|interface-lesson]], when the order changes or a type changes. If the signals would need different labels on a plot's axis (meters, a Mach number, a mode), they belong in a bus.
:::

## Taking a vector apart: Demux and Selector

Once a vector exists, you need ways to get its elements back out. Both blocks below work on vectors by position. For a bus, use the Bus Selector, which works by name.

The **Demux** block is a Mux in reverse. Its parameter **Number of outputs** can be:

- a single number $n$: the vector is split into $n$ equal pieces, so a 6-element vector with $n = 6$ gives six scalar lines;
- a vector of widths, such as `[3 3]` or `[1 5]`: the pieces have those sizes, in order, and the widths must add up to the vector's length.

The **Selector** block picks particular elements, in any order you ask for. Its key parameters for a vector are:

| Parameter | Typical setting | Meaning |
|---|---|---|
| Index mode | `One-based` | Element 1 is the first, as in MATLAB. `Zero-based` counts from 0, as in C |
| Index Option | `Index vector (dialog)` | You type the indices into the dialog |
| Index | `[4 5 6]` | Which elements to output, in this order |

The index can reorder (`[3 2 1]` reverses a 3-vector) or repeat (`[1 1]` outputs element 1 twice). The Selector also works on matrices, picking rows or columns, when you set its number of input dimensions to 2.

::: key
Demux splits a vector into pieces by width, in order. Selector picks the elements you list by index, in the order you list them. Both work by position. The Bus Selector picks bus elements by name.
:::

::: example Splitting an IMU sample
An **[[inertial measurement unit|imu]]** delivers one 6-element vector per sample: three accelerations in m/s², then three angular rates in rad/s. One sample reads
$[0.12,\ -0.05,\ 9.79,\ 0.010,\ -0.002,\ 0.003]$.

**Step 1: is this a Mux job?** All six are doubles, from one device, in one frame, and the order is fixed by the sensor's data sheet. A vector is reasonable here.

**Step 2: split it with a Demux.** Number of outputs `[3 3]`. Output 1 is the acceleration $[0.12,\ -0.05,\ 9.79]$ and output 2 the rate $[0.010,\ -0.002,\ 0.003]$.

**Step 3: check the acceleration.** Its size is $\sqrt{0.12^2 + 0.05^2 + 9.79^2} = \sqrt{0.0144 + 0.0025 + 95.844} = \sqrt{95.861} = 9.791\,\mathrm{m/s^2}$.

**Step 4: pick one rate with a Selector.** Index mode One-based, Index `6`. The output is the yaw rate, 0.003 rad/s, which is $0.003 \times 180/\pi = 0.172$ degrees per second.

**Sanity check.** A vehicle sitting still on the pad feels gravity, about 9.81 m/s², and 9.791 is close. The rates are tiny, which fits a vehicle that is not moving. Had you typed Index `3` by mistake, the "yaw rate" would read 9.79, and the size would give it away. Had you typed Index `5`, you would get another tiny rate, $-0.002$ rad/s, and nothing would look wrong. That is why the index settings deserve a second look.
:::

The same blocks pull apart last lesson's State-Space output. With C set to `eye(2)`, the block outputs $[x;\ \dot{x}]$. A Demux with Number of outputs `2` gives position on its first line and velocity on its second, ready for two separate To Workspace blocks.

## Choosing the container

| The signals are… | Use | Take apart with |
|---|---|---|
| Components of one quantity, same type and units (x, y, z; a quaternion) | Mux, or a block that outputs a vector | Demux, Selector |
| Different quantities, units or types (altitude, Mach, mode) | Bus Creator with a Simulink.Bus object | Bus Selector |
| A bus inside a bus (navigation data containing a position vector) | Bus Creator, with the vector as one element | Bus Selector, then Selector on the vector |

The last row shows that the two containers work together. A navigation bus can hold an element `pos` that is itself a 3-element vector. The bus says what the thing is. The vector holds its components.

## Check yourself

::: check
A Mux has three inputs: a 4-element quaternion on port 1, a scalar on port 2, and a 3-element vector on port 3. How wide is its output, and which elements hold the scalar and the 3-vector?
:::

::: answer
$4 + 1 + 3 = 8$ elements. Elements 1 to 4 are the quaternion, element 5 is the scalar, and elements 6 to 8 are the 3-vector. A Demux with Number of outputs `[4 1 3]` would give the three pieces back.
:::

::: check
A Selector has Index mode One-based and Index `[3 1]`. Its input is $[7,\ 8,\ 9]$. What comes out? What would come out with Zero-based index mode and the same Index?
:::

::: answer
One-based: element 3 is 9 and element 1 is 7, so the output is $[9,\ 7]$. Zero-based counts the first element as 0, so index 3 would be a fourth element, which does not exist: Simulink reports an out-of-range index. With Zero-based, the same selection would be written `[2 0]`.
:::

::: check
Your teammate says: "A bus and a Mux both put several signals on one line, so they are the same thing with different icons." Give two differences in what the signal actually is.
:::

::: answer
A Mux output is a vector: one data type for all elements, and elements known only by their position number. A bus output keeps a name for each element, and each element keeps its own type and size, so a double, an integer and even a vector or another bus can travel together. In generated code a non-virtual bus becomes a C struct with named fields, while a vector becomes an array.
:::

::: check
Engine data, chamber pressure in pascals, a valve's open-or-closed flag, and turbopump speed in rad/s must reach a monitoring subsystem on one line. Which block bundles them, and why not the other?
:::

::: answer
A Bus Creator, ideally with a Simulink.Bus object defining the three elements. They are different quantities with different units, and the valve flag is naturally a boolean, not a double. A Mux would need them all in one type and would throw away the names, so the monitor would have to know that "element 2 is the valve", and any reordering upstream would silently break it.
:::

::: check
You need the last two elements of a 5-element vector, in reverse order. Give two ways to get them.
:::

::: answer
A Selector with Index mode One-based and Index `[5 4]`, which picks element 5 then element 4. Or a Demux with Number of outputs `[3 1 1]` followed by a Mux with the two single-element lines wired in the order you want. The Selector is one block and states the intent directly, so it is the better choice.
:::

## Summary

| Block | What it makes or does | Key parameter |
|---|---|---|
| Mux | A vector: one type, elements by position, names lost | Number of inputs |
| Bus Creator | A bus: named elements, each with its own type and size; can nest | Output data type, such as `Bus: NavBus` |
| Simulink.Bus object | The bus's contract: names, types, sizes, units | Its Elements, each a Simulink.BusElement |
| Bus Selector | Picks bus elements by name | The list of chosen elements |
| Demux | Splits a vector into pieces, in order | Number of outputs: $n$ or widths like `[3 3]` |
| Selector | Picks vector elements by index, in any order | Index mode, Index Option, Index |
| Rule | Never Mux dissimilar signals | Different meaning, units or type means a bus |

The next lesson leaves the straight-line world. Saturation, Rate Limiter, Dead Zone and their neighbors model the limits every real actuator has, and the lesson 4 habit of checking against a known answer is what keeps those models honest.

::: context virtual Blocks that exist only in the drawing
Some Simulink blocks do real work when the model runs: a Gain multiplies, an Integrator updates its state. Others are **virtual**: they organize the drawing but vanish when Simulink compiles the model. A Mux, a Demux, and a Bus Creator making an ordinary (virtual) bus only tell Simulink how to route lines, and no copy of the data is made. That is why they cost nothing in a simulation. It also means they add nothing at run time, including no checks, unless a bus object gives Simulink something to check against.
:::

::: context quaternion Four numbers for one attitude
A quaternion is a set of four numbers that describes which way a vehicle is pointing, and flight software uses it because it avoids the singularities that three angles run into. Its four parts only mean something together: you almost never want "element 3" on its own. That makes it a natural vector, and a Mux (or a block that outputs a 4-vector) is the right container. The MATLAB toolbox module covered quaternion conventions, and the order of the four elements, scalar first or scalar last, is exactly the kind of position-is-meaning fact that must be written down.
:::

::: context bus-object A contract between two teams
Picture the navigation team and the autopilot team agreeing, on paper, exactly what the navigation output contains: names, units, types, sizes. A Simulink.Bus object is that agreement in a form Simulink can check. Both teams' models point at the same definition, so a change to it shows up on both sides at once. Large programs keep these definitions in data dictionaries under version control.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="10" width="120" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="30" font-size="12" fill="#1f2a44" text-anchor="middle">NavBus</text>
  <line x1="180" y1="40" x2="180" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="60" x2="300" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="60" x2="60" y2="76" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="60" x2="180" y2="76" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="300" y1="60" x2="300" y2="76" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="15" y="76" width="90" height="46" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="94" font-size="12" fill="#1f2a44" text-anchor="middle">alt</text>
  <text x="60" y="112" font-size="11" fill="#6c7a93" text-anchor="middle">double, m</text>
  <rect x="135" y="76" width="90" height="46" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="94" font-size="12" fill="#1f2a44" text-anchor="middle">mach</text>
  <text x="180" y="112" font-size="11" fill="#6c7a93" text-anchor="middle">double</text>
  <rect x="255" y="76" width="90" height="46" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="94" font-size="12" fill="#1f2a44" text-anchor="middle">mode</text>
  <text x="300" y="112" font-size="11" fill="#6c7a93" text-anchor="middle">uint8</text>
  <text x="180" y="142" font-size="11" fill="#b4232c" text-anchor="middle">each element: its own name, type and unit</text>
</svg>
```

The Simulink architecture module builds these in earnest, including nested buses and the virtual and non-virtual kinds.
:::

::: context enumeration Names for codes
An **enumeration** is a type whose values are a short list of names, each standing for an integer: PAD for 0, ASCENT for 1, COAST for 2. Code that compares the mode with ASCENT is easier to read than code that compares it with 1, and a checker can refuse a value that is not on the list. In Simulink, an enumeration is defined as a small MATLAB class, and a signal of that type cannot be mixed into a vector of doubles without an explicit conversion. That is the type system doing its job.
:::

::: context interface-lesson When an interface fails silently
In September 1999, NASA's Mars Climate Orbiter was lost as it arrived at Mars. One piece of ground software reported thruster impulse in pound-force seconds, and the navigation software that used it expected newton-seconds, a factor of about 4.45. Each number looked like a perfectly good number, so nothing stopped it. The spacecraft's trajectory drifted until it passed far too low through the Martian atmosphere. The lesson engineers took is the one behind the bus rule: the meaning of a signal, including its units, should be carried and checked by the interface, not remembered by people.
:::

::: context imu The sensor package that feels motion
An inertial measurement unit bundles three accelerometers and three gyros at right angles to each other. It reports what the vehicle feels, not where it is, which is why a vehicle sitting on the pad reads about 9.81 m/s² upward: the pad is pushing it up against gravity. Navigation software integrates these readings, many times a second, to track position and attitude. Because the six numbers come from one device in a fixed order, a vector is a fair container for the raw sample, and the split into acceleration and rate happens right away.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="44" width="60" height="36" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="40" y="66" font-size="12" fill="#1f2a44" text-anchor="middle">IMU</text>
  <line x1="70" y1="62" x2="124" y2="62" stroke="#1f2a44" stroke-width="3.5"/>
  <polygon points="130,62 120,56 120,68" fill="#1f2a44"/>
  <text x="98" y="54" font-size="11" fill="#1f2a44" text-anchor="middle">6</text>
  <rect x="130" y="30" width="12" height="64" fill="#1f2a44"/>
  <text x="136" y="110" font-size="11" fill="#1f2a44" text-anchor="middle">Demux [3 3]</text>
  <line x1="142" y1="44" x2="224" y2="44" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="230,44 222,39 222,49" fill="#1d6fd1"/>
  <text x="236" y="48" font-size="11" fill="#1d6fd1">accel, 3</text>
  <line x1="142" y1="80" x2="190" y2="80" stroke="#b4232c" stroke-width="3"/>
  <polygon points="196,80 188,75 188,85" fill="#b4232c"/>
  <text x="170" y="96" font-size="11" fill="#b4232c" text-anchor="middle">rate, 3</text>
  <rect x="196" y="68" width="60" height="24" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="226" y="84" font-size="11" fill="#1f2a44" text-anchor="middle">Selector</text>
  <line x1="256" y1="80" x2="290" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="296,80 288,76 288,84" fill="#1f2a44"/>
  <text x="300" y="84" font-size="11" fill="#1f2a44">yaw rate</text>
</svg>
```

The Selector here has Index `3`, because it sees only the 3-element rate vector: the yaw rate is its third element, even though it was element 6 of the raw sample.
:::
