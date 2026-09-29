---
id: l04-bus-objects
title: Bus objects, bus blocks and C structs
minutes: 22
covers:
  - 'Simulink.Bus objects as interface contracts; Bus Creator, Selector, Assignment; nested buses'
  - Virtual versus non-virtual buses, and why non-virtual buses become C structs
---

Think about the plug on a phone charger. The charger team and the phone team may never meet. They still build parts that fit, because both work from one written standard: how many pins, which pin carries power, what voltage. If someone builds a plug with the pins swapped, it does not fit. You find out at the shop, not after the phone catches fire.

A big vehicle model has dozens of these plugs. The navigation block hands the guidance block a bundle of signals. The guidance block hands the control block another. In the first Simulink module you met the **bus**, a bundle of named signals, and you saw a first **Simulink.Bus object** written out. This lesson makes that object the written standard between parts of the model: an **interface contract** — a definition both sides must match, checked by the tool rather than by memory.

The first three lessons of this module gave the model structure: atomic and conditional subsystems, masks and libraries. Structure needs interfaces. Here you will define bus objects properly, meet the three blocks that build, read and edit buses, nest one bus inside another, and then learn the one distinction that decides what the flight code looks like: **virtual** versus **nonvirtual** buses. The second kind becomes a C **struct**, and by the end you will compile one.

## A bus object is a contract

A bus drawn only with a Bus Creator takes whatever arrives on its input lines. Rename a line upstream, and the bus quietly changes. Nothing complains until some block downstream cannot find the element it wanted.

A **[[Simulink.Bus object|header-file]]** fixes the contents in one place. It is a MATLAB object, stored in the base workspace or (from lesson 7) a data dictionary. It holds a list of **Simulink.BusElement** objects, one per element. Each element has these properties:

| Property | What it says | Example |
|---|---|---|
| Name | The element's name, used to select it | `'alt'` |
| DataType | Its type: `'double'`, `'single'`, `'uint8'`, `'boolean'`, or another bus as `'Bus: Vec3Bus'` | `'double'` |
| Dimensions | Its size: 1 for a scalar, 3 for a 3-vector, `[3 3]` for a matrix | `3` |
| Unit | Its physical unit, as text | `'m/s'` |

Elements have a few more properties, such as Min, Max and Description, but these four carry the contract. The Unit is easy to skip and worth filling in: a **[[physical unit|units]]** written into the contract is one Simulink can check.

Here is a navigation bus with three elements, built in a script. Read `Simulink.BusElement` aloud as "Simulink dot Bus Element": the dots mean "the BusElement class inside the Simulink package".

```matlab
% Define the elements of the navigation bus
e(1) = Simulink.BusElement;
e(1).Name = 'vel';   e(1).DataType = 'double';
e(1).Dimensions = 3; e(1).Unit = 'm/s';

e(2) = Simulink.BusElement;
e(2).Name = 'alt';   e(2).DataType = 'double';
e(2).Dimensions = 1; e(2).Unit = 'm';

e(3) = Simulink.BusElement;
e(3).Name = 'mode';  e(3).DataType = 'uint8';
e(3).Dimensions = 1;

% Collect them into the bus object
NavBus = Simulink.Bus;
NavBus.Elements = e;
```

After this runs, a variable called `NavBus` sits in the workspace. It is not a signal. It is a type, the way "int" is a type in C. Nothing moves along a line called NavBus until a block says "my output is a NavBus".

You can build the same object without code in the **[[Bus Editor|bus-editor]]**, a window that lists bus objects and their elements in a table you can edit. Type `buseditor` at the MATLAB prompt to open it. In recent releases the same job is done by a broader tool called the Type Editor. Either way, the result is the same object in the workspace.

### Putting the contract on a port

A bus object does nothing until a port uses it. You attach it by typing the bus type into a block's data type field:

- On a **Bus Creator**, set **Output data type** to `Bus: NavBus`.
- On a subsystem's or model's **Inport** or **Outport**, set **Data type** to `Bus: NavBus`.

Read `Bus: NavBus` as "a bus of type NavBus". Simulink writes it with a space after the colon.

Now, when you update the diagram with Ctrl+D, Simulink checks what arrives at that port against the definition. Wrong type: error. Wrong size: error. A missing element: error. An element with the wrong name is reported by a name-mismatch diagnostic, which flight teams set to error. The check happens before the model runs a single step, which is the whole point of a contract.

::: key
Why use Simulink.Bus objects at component interfaces? They are a checked interface contract: each Simulink.BusElement fixes a Name, DataType, Dimensions and Unit, so a mismatch in name, type or dimension is reported as an error when the diagram is updated, rather than being a silent rewiring. Attach one with a data type of `Bus: MyBus` on a Bus Creator, Inport or Outport.
:::

::: warning A bus object in the workspace protects nothing on its own
Defining NavBus and then leaving the ports set to `Inherit: auto` gives you a bus with no contract. Simulink will happily build whatever arrives. The object only guards a port whose data type names it. When you review a model, check the ports, not only the workspace.
:::

## The three bus blocks

Three blocks do nearly all the work with buses. Two of them you met in the first module.

**Bus Creator** bundles its input lines into one bus. With its output data type set to a bus object, the inputs must match that object's elements, in order.

**Bus Selector** takes a bus in and gives out the elements you pick, by name. Its dialog lists every element; you choose, say, `alt` and `mode`, and the block grows one output port per choice.

**Bus Assignment** takes a bus in and gives out the *same* bus with one or more elements replaced. Its first input is the bus. You pick the elements to replace in its dialog, and it grows one extra input port for each. Unpicked elements pass through untouched. The new value must have the same type and size as the element it replaces.

Do not confuse the Bus Assignment block with the plain **[[Assignment|assignment-index]]** block from the Math Operations library. That one overwrites chosen positions of a vector or matrix, by index. The pattern is the same, "copy everything, overwrite a few slots", but Bus Assignment works by element name.

::: example Replacing one element of a bus
A navigation filter outputs a NavBus. At one step it reads `vel` $= [0,\ 0,\ 7.5]\,\mathrm{m/s}$, `alt` $= 12000\,\mathrm{m}$, `mode` $= 2$. A radar altimeter gives a better altitude near the ground, and a blending block computes $11{,}985\,\mathrm{m}$. You want the rest of the model to see the blended altitude, with everything else unchanged.

**Step 1: pick the block.** The job is "same bus, one element swapped". That is a Bus Assignment.

**Step 2: set it up.** Wire the NavBus into its first input. In its dialog, choose `alt` as the element to assign. A second input port appears, labeled with that element. Wire the blended altitude into it.

**Step 3: check the types.** `alt` is a scalar double in the bus object. The blended altitude must be a scalar double too. If the blending block produced a `single`, the update would stop with a data-type mismatch, which is what you want.

**Step 4: read the output.** `vel` $= [0,\ 0,\ 7.5]$, `alt` $= 11985$, `mode` $= 2$. Only `alt` changed.

**Sanity check.** The change is $12000 - 11985 = 15\,\mathrm{m}$, a small correction, as blending two good altitude sources should give. The output is still a NavBus, so nothing downstream needs rewiring.
:::

## Buses inside buses

A position has three parts, x, y and z. So does a velocity. Rather than write six separate elements, you define one small bus for "a 3-vector with named parts", and use it twice inside the navigation bus. That is a **nested bus**: a bus element whose DataType is itself a bus.

```matlab
% A small bus: three named components
c(1) = Simulink.BusElement;  c(1).Name = 'x';
c(2) = Simulink.BusElement;  c(2).Name = 'y';
c(3) = Simulink.BusElement;  c(3).Name = 'z';
Vec3Bus = Simulink.Bus;
Vec3Bus.Elements = c;          % each element defaults to a scalar double

% The outer bus uses Vec3Bus twice
n(1) = Simulink.BusElement;  n(1).Name = 'pos';  n(1).DataType = 'Bus: Vec3Bus';
n(2) = Simulink.BusElement;  n(2).Name = 'vel';  n(2).DataType = 'Bus: Vec3Bus';
n(3) = Simulink.BusElement;  n(3).Name = 'alt';  n(3).Unit = 'm';
n(4) = Simulink.BusElement;  n(4).Name = 'mode'; n(4).DataType = 'uint8';
NavBus = Simulink.Bus;
NavBus.Elements = n;
```

A new BusElement starts out as a scalar double, so elements that are scalar doubles only need a name.

Inside a model you reach a nested element with **[[dot notation|dot-path]]**: `vel.z` means "the z element of the vel element". A Bus Selector shows the nesting as a tree, and it can hand you either a whole inner bus (`vel`, a Vec3Bus) or one leaf of it (`vel.z`, a double). A **leaf** is an element that is not itself a bus.

To build a nested bus with blocks, you build the inner buses first with their own Bus Creators, then feed them into the outer Bus Creator as elements.

::: key
A nested bus is a bus element whose DataType is another bus, such as `'Bus: Vec3Bus'`. Its leaves are reached by dot notation, such as `vel.z`. Define a small bus once and reuse it wherever the same shape appears.
:::

## Virtual and nonvirtual buses

How does a bus exist while the model runs? There are two kinds.

A **virtual bus** is only a way of drawing. It is like the plastic sleeve that holds a bundle of cables behind a desk: the cables are still separate cables, and the sleeve carries no current. When Simulink compiles the model, a virtual bus is taken apart. Each block that reads an element is wired straight to the block that produced it. The elements can sit anywhere in memory, not next to each other. Bus Creators make virtual buses unless you ask for the other kind.

A **nonvirtual bus** is a real object in memory. All its elements are stored side by side in one **[[contiguous|contiguous]]** block, in the order the bus object lists them. It is like a lunchbox with fixed compartments: the whole box can be picked up, handed over, copied or stored as one thing. A nonvirtual bus must have a bus object, because Simulink needs to know the exact layout. On a Bus Creator you ask for one by selecting **Output as nonvirtual bus**; the Signal Conversion block can also turn a virtual bus into a nonvirtual one and back.

| | Virtual bus | Nonvirtual bus |
|---|---|---|
| What it is | A drawing shortcut for separate lines | One block of memory holding every element |
| Bus object needed? | No (but it is still a good idea) | Yes |
| Memory | Elements wherever their sources put them | Contiguous, in bus-object order |
| In generated C | Separate variables; no bus type appears | A `typedef struct`, passed and stored as one thing |
| Cost | Nothing at run time | Copying elements into the struct |

### What the code generator makes of each

When Simulink Coder or Embedded Coder turns the model into C, a virtual bus leaves no trace: there is no type called NavBus, and each reader uses its source's variable directly.

A nonvirtual bus becomes a C **[[struct|c-struct]]**: a C type that groups named fields of different types into one object. Its definition goes in a generated header file (by default one named after the model, such as `model_types.h`), and every place the bus crosses a boundary uses it. That matters in three situations:

- **Crossing a function boundary.** An atomic subsystem packaged as a function (lesson 1) or a referenced model (next lesson) can take the whole bus as one argument, a pointer to the struct, instead of a long list of separate arguments.
- **Being logged or stored.** A struct is one thing with a known size, so it can be copied into a [[telemetry packet|telemetry]] or a log buffer in one move.
- **Talking to hand-written code.** The flight software team can include the same header and use the same struct. A bus object can even name the header, through its HeaderFile property, and its DataScope property can say that the type is defined by hand-written code instead of being generated.

::: key
Why do non-virtual buses matter for code generation? A non-virtual bus becomes an actual C struct with a defined layout, so it can cross a function boundary, be logged, or be shared with hand-written code. A virtual bus exists only in the diagram and disappears in the generated code.
:::

Here is the nested NavBus as C, with a function that takes it the way generated code takes a nonvirtual bus. This is hand-written to show the shape; generated code uses its own type names, such as `real_T` for double and `uint8_T` for an 8-bit unsigned integer, and its own layout of files.

```c
#include <stdio.h>
#include <stddef.h>
#include <stdint.h>

typedef struct {
  double x;
  double y;
  double z;
} Vec3Bus;

typedef struct {
  Vec3Bus pos;     /* m */
  Vec3Bus vel;     /* m/s */
  double  alt;     /* m */
  uint8_t mode;
} NavBus;

/* A guidance step that receives the whole bus through one pointer */
static double climb_rate(const NavBus *nav)
{
  return nav->vel.z;               /* the leaf vel.z */
}

int main(void)
{
  NavBus nav = { {1.0, 2.0, 3.0}, {0.0, 0.0, 7.5}, 12000.0, 2 };
  printf("climb rate      = %.1f m/s\n", climb_rate(&nav));
  printf("sizeof(Vec3Bus) = %zu\n", sizeof(Vec3Bus));
  printf("sizeof(NavBus)  = %zu\n", sizeof(NavBus));
  printf("offsetof(alt)   = %zu\n", offsetof(NavBus, alt));
  printf("offsetof(mode)  = %zu\n", offsetof(NavBus, mode));
  return 0;
}
/* gcc -std=c99 -Wall navbus.c && ./a.out   (x86-64 Linux)
climb rate      = 7.5 m/s
sizeof(Vec3Bus) = 24
sizeof(NavBus)  = 64
offsetof(alt)   = 48
offsetof(mode)  = 56
*/
```

Look at how the model's names carry through. The bus object's element `vel`, of type `Vec3Bus`, is the struct field `vel`. The Bus Selector path `vel.z` is the C expression `nav->vel.z` (read `->` as "the field of the struct this pointer points to"). The contract you wrote in MATLAB is now the contract in C.

::: example Where the 64 bytes come from
Why is NavBus 64 bytes? Count it on a typical 64-bit processor, where a double takes 8 bytes and a `uint8_t` takes 1.

**Step 1: the inner bus.** Vec3Bus holds three doubles: $3 \times 8 = 24$ bytes. The compiler agrees: `sizeof(Vec3Bus) = 24`.

**Step 2: the doubles in NavBus.** `pos` and `vel` are 24 bytes each, and `alt` is 8: $24 + 24 + 8 = 56$ bytes. So `alt` starts at byte $24 + 24 = 48$, matching `offsetof(alt) = 48`, and `mode` starts at byte 56.

**Step 3: the last byte.** `mode` takes 1 byte, bringing the total to 57.

**Step 4: the padding.** A double must start at an address that is a multiple of 8. If you had an array of NavBus structs, the second one would start right after the first. For its doubles to line up, each struct's size must be a multiple of 8. The next multiple of 8 above 57 is 64, so the compiler adds $64 - 57 = 7$ bytes of **[[padding|padding]]**: unused filler.

**Sanity check.** There are eight leaves: six in the two Vec3Buses, plus `alt` and `mode`. Seven are doubles ($7 \times 8 = 56$) and one is a byte, so 57 bytes of real data in a 64-byte struct. About 11 percent is filler. Moving `mode` to the front would not help: the 7 filler bytes would move to sit between `mode` and `pos`, and the size would stay 64. With several small elements, though, where you put them matters (the last Check yourself question shows how much). The order in the bus object is the order in the struct, so it is worth choosing with care.
:::

::: warning Changing a bus object changes a binary interface
Adding, removing or reordering elements in a nonvirtual bus's object changes the struct's layout. Generated code rebuilt from the model will agree with itself. Hand-written code compiled against the old header will not: it will read `mode` from the wrong byte and get garbage, with no error. Treat an edit to a shared bus object the way a C team treats an edit to a shared header: review it, and rebuild everything that includes it.
:::

### When to use which

Inside a component, virtual buses are fine and cost nothing.

At a boundary — between referenced models, into a subsystem that becomes its own function, into a logging or telemetry block, or out to hand-written code — the bus should have a bus object, and it should usually be nonvirtual, so that the boundary exists in the C code as a real type. Some blocks need a nonvirtual bus or a bus object outright. A MATLAB Function block, for example, receives a bus input as a MATLAB structure, and it needs a bus object behind that input to know the fields.

The trade is a copy: Simulink copies each element into the struct's memory. For a handful of doubles at 100 Hz that is nothing; for large buses at high rates on a small processor, it is worth knowing.

## Check yourself

::: check
A bus object's element `quat` has DataType `'double'` and Dimensions `4`. A colleague feeds a 3-element vector into that slot of the Bus Creator. When does she find out, and what would happen without the bus object?
:::

::: answer
With the Bus Creator's output data type set to the bus object, Simulink reports a dimension mismatch when she updates the diagram (Ctrl+D), before any simulation step runs. Without a bus object the Bus Creator would accept the 3-element vector, and the problem would surface later: as an error at some block that needs 4 elements or, worse, as wrong numbers.
:::

::: check
You need the model to see a bus in which only the `mode` element has been forced to 5 during a test. Which block do you use, what are its inputs, and what happens to the other elements?
:::

::: answer
A Bus Assignment block. Its first input is the original bus. In its dialog you select `mode`, which adds a second input; you wire a constant 5 of the same type as `mode` (for example `uint8`) into it. The output is the same bus type with `mode` replaced by 5, and every other element passed through unchanged.
:::

::: check
Write the dot path to the y component of the position inside NavBus, and the C expression that reads the same value through a pointer `nav`.
:::

::: answer
The path is `pos.y`: the element `pos` is a Vec3Bus, and `y` is its second element. In C, with `nav` of type `const NavBus *`, it is `nav->pos.y`.
:::

::: check
A model has a virtual bus with 40 elements feeding four blocks that each read two elements. A teammate converts it to a nonvirtual bus "to make it faster". Will the simulation be faster? What does the change actually buy?
:::

::: answer
No. A virtual bus costs nothing at run time: each reader is wired straight to its source. Making it nonvirtual adds work, because the 40 elements are copied into one struct. What the change buys is a real type: a C struct with a fixed layout that can cross a function or model boundary as one argument, be logged as one object, and be shared with hand-written code. Those are reasons to do it at a boundary, not for speed.
:::

::: check
A struct holds, in this order, a `uint8_t` flag, a double, and another `uint8_t`. On the same processor as the NavBus example, how many bytes is it, and how could you make it smaller?
:::

::: answer
The first flag takes byte 0. The double must start on a multiple of 8, so 7 bytes of padding follow and the double sits in bytes 8 to 15. The second flag takes byte 16, making 17 bytes, and the struct is padded up to the next multiple of 8, which is 24. Putting the double first and the two flags after it gives $8 + 1 + 1 = 10$ bytes, padded to 16. So reordering saves 8 bytes. Compiling both versions with gcc on x86-64 prints 24 and 16.
:::

## Summary

| Idea | Meaning | Remember |
|---|---|---|
| Simulink.Bus | A bus type: the contract for an interface | Holds an array of Simulink.BusElement |
| Simulink.BusElement | One element of the contract | Name, DataType, Dimensions, Unit |
| `Bus: NavBus` | Data type setting on a Bus Creator, Inport or Outport | Turns on checking at that port |
| Bus Editor | Window for creating and editing bus objects | `buseditor`; the Type Editor in recent releases |
| Bus Creator / Bus Selector | Bundle lines into a bus / pick elements by name | Selector can pick a whole inner bus or a leaf |
| Bus Assignment | Same bus out, chosen elements replaced | New value must match type and size |
| Assignment | Array out, chosen indices overwritten | Works by index on vectors and matrices |
| Nested bus | Element of type `Bus: Inner` | Reach leaves by dot path, such as `vel.z` |
| Virtual bus | A drawing of separate lines | Disappears in generated code; no run-time cost |
| Nonvirtual bus | One contiguous block of memory | Needs a bus object; becomes a C struct |
| Padding | Filler bytes for alignment | Element order changes struct size |

The next lesson takes the boundary seriously: it splits a model into separate files with Model blocks, and every Model block's ports are where these bus objects earn their keep.

::: context header-file The same idea as a C header
In C and C++, a function's interface is declared once in a header file: its name, its argument types, the fields of any struct it takes. Every file that calls it includes the header, and the compiler checks each call against the declaration. A Simulink.Bus object does the same job for a Simulink interface. The navigation team and the guidance team both point their ports at one definition, so neither can drift away from it without the tool noticing. When the model becomes C, the bus object literally becomes a declaration in a header.
:::

::: context units Units that the tool can check
The Unit property is not only a comment. Simulink understands unit text such as `m`, `m/s` and `deg`, and when a signal in meters is connected to a port expecting feet, it can report the inconsistency during the diagram update, according to a diagnostic setting you choose. Filling in units costs a few seconds per element and catches exactly the class of mistake that lost the Mars Climate Orbiter.
:::

::: context bus-editor A spreadsheet for interface types
The Bus Editor shows your bus objects in a list, and the elements of the one you pick in a table: one row per element, with columns for its name, data type, dimensions, unit and the other properties. Editing a cell edits the object itself. It is the easiest way to read a large, nested interface, because the nesting shows as a tree. Whatever tool you use to edit it, the definition that matters is the one saved in a file under version control, since that is what a reviewer sees change.
:::

::: context assignment-index By name or by position
The two blocks do the same job on different kinds of container. Bus Assignment reaches into a bus by element name, like replacing the sandwich in the lunchbox's sandwich compartment. Assignment reaches into an array by index, like replacing the third egg in a carton. Its Index mode can be One-based, counting from 1 as MATLAB does, or Zero-based, counting from 0 as C does. Mixing the two up is a classic off-by-one bug, so check the setting before you trust the indices.
:::

::: context dot-path Reading a path through nested buses
A dot path reads like a street address, from the biggest region to the smallest: country, city, street. `vel.z` is "in the NavBus, the vel element; inside that, the z element". MATLAB structures use the same notation, which is why a MATLAB Function block sees a bus as a structure and reads `nav.vel.z` exactly as the Bus Selector names it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="140" y="8" width="80" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="26" font-size="12" fill="#1f2a44" text-anchor="middle">NavBus</text>
  <line x1="180" y1="34" x2="180" y2="48" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="45" y1="48" x2="315" y2="48" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="45" y1="48" x2="45" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="135" y1="48" x2="135" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="225" y1="48" x2="225" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="315" y1="48" x2="315" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="10" y="60" width="70" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="77" font-size="12" fill="#1f2a44" text-anchor="middle">pos</text>
  <rect x="100" y="60" width="70" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="135" y="77" font-size="12" fill="#1f2a44" text-anchor="middle">vel</text>
  <rect x="190" y="60" width="70" height="24" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="225" y="77" font-size="12" fill="#1f2a44" text-anchor="middle">alt</text>
  <rect x="280" y="60" width="70" height="24" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="315" y="77" font-size="12" fill="#1f2a44" text-anchor="middle">mode</text>
  <line x1="135" y1="84" x2="135" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="95" y1="100" x2="175" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="95" y1="100" x2="95" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="135" y1="100" x2="135" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="175" y1="100" x2="175" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="81" y="110" width="28" height="22" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="95" y="126" font-size="12" fill="#1f2a44" text-anchor="middle">x</text>
  <rect x="121" y="110" width="28" height="22" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="135" y="126" font-size="12" fill="#1f2a44" text-anchor="middle">y</text>
  <rect x="161" y="110" width="28" height="22" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
  <text x="175" y="126" font-size="12" fill="#1f2a44" text-anchor="middle">z</text>
  <text x="180" y="156" font-size="12" fill="#b4232c" text-anchor="middle">vel.z : blue boxes are buses, white are leaves</text>
</svg>
```
:::

::: context contiguous Side by side in memory
Contiguous means "touching, with no gaps from other things". Computer memory is one long row of numbered bytes. A contiguous object occupies one unbroken stretch of that row, so its address and its size are enough to copy it, send it or save it. A virtual bus's elements might live at bytes 1000, 5320 and 88; there is no single stretch you could hand to anyone.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">virtual: elements scattered</text>
  <rect x="10" y="28" width="340" height="22" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <rect x="30" y="28" width="30" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="160" y="28" width="30" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="290" y="28" width="30" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="45" y="44" font-size="11" fill="#1f2a44" text-anchor="middle">a</text>
  <text x="175" y="44" font-size="11" fill="#1f2a44" text-anchor="middle">b</text>
  <text x="305" y="44" font-size="11" fill="#1f2a44" text-anchor="middle">c</text>
  <text x="10" y="76" font-size="12" fill="#1f2a44">nonvirtual: one struct, one stretch</text>
  <rect x="10" y="84" width="340" height="22" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <rect x="120" y="84" width="30" height="22" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="150" y="84" width="30" height="22" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="180" y="84" width="30" height="22" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="135" y="100" font-size="11" fill="#fff" text-anchor="middle">a</text>
  <text x="165" y="100" font-size="11" fill="#fff" text-anchor="middle">b</text>
  <text x="195" y="100" font-size="11" fill="#fff" text-anchor="middle">c</text>
</svg>
```
:::

::: context c-struct What a C struct is
A struct is C's way of saying "these values travel together". You declare the fields once, and then a single variable holds all of them. Read a field with a dot, as in `nav.alt`. When you hold a pointer to the struct instead, the arrow does the same job: `nav->alt` is short for `(*nav).alt`, "follow the pointer, then take the field". The C++ module in this track builds on the same idea with classes, which are structs that also carry functions.
:::

::: context telemetry Telemetry packets
Telemetry is the stream of measurements a vehicle sends to the ground: positions, temperatures, modes, fault flags. Flight software packs it into packets with a fixed layout, and ground software unpacks them by that same layout. When navigation data is already one struct, packing it is a single copy of a known number of bytes. Careful teams still write the packet layout down explicitly rather than sending a raw struct, because the ground computer may use different padding or byte order from the flight computer.
:::

::: context padding Why compilers leave gaps
Processors read memory fastest in aligned chunks: an 8-byte double is meant to start at an address divisible by 8. Some processors, including many used in flight computers, cannot load a misaligned double at all without extra work or a fault. So the compiler inserts padding bytes to keep every field aligned, and rounds the struct's size up so an array of them stays aligned too. The rules depend on the processor and compiler, which is one more reason generated code and hand-written code must be built for the same target settings.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">NavBus, 64 bytes, one box = 8 bytes</text>
  <rect x="10" y="30" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="50" y="30" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="90" y="30" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="130" y="30" width="40" height="30" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="170" y="30" width="40" height="30" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="210" y="30" width="40" height="30" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="250" y="30" width="40" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="290" y="30" width="5" height="30" fill="#b4232c" stroke="#1f2a44"/>
  <rect x="295" y="30" width="35" height="30" fill="#fff" stroke="#6c7a93" stroke-dasharray="3 2"/>
  <text x="70" y="78" font-size="11" fill="#1f2a44" text-anchor="middle">pos (0-23)</text>
  <text x="190" y="78" font-size="11" fill="#1f2a44" text-anchor="middle">vel (24-47)</text>
  <text x="270" y="78" font-size="11" fill="#1f2a44" text-anchor="middle">alt</text>
  <text x="292" y="96" font-size="11" fill="#b4232c" text-anchor="middle">mode</text>
  <text x="330" y="96" font-size="11" fill="#6c7a93" text-anchor="middle">7 pad</text>
</svg>
```
:::
