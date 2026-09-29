---
id: l11-legacy-code-and-tool-qualification
title: 'Bringing old C into the model, and trusting your tools'
minutes: 22
covers:
  - S-functions and the Legacy Code Tool for wrapping existing C
  - DO Qualification Kit and what qualifying a tool means
---

Imagine your family has a secret sauce recipe, handed down for three generations. Everybody knows it works. When you open a restaurant with a brand-new kitchen, you do not reinvent the sauce. You bring the old recipe along and make sure the new kitchen follows it exactly.

Flight software teams have secret sauces too: C functions that flew on the last vehicle, such as a gyro calibration routine or a checksum. Each one has flown. Rewriting it as blocks throws that record away and risks new bugs. So the team brings the old C into the model, where it simulates with everything else and is then called from the generated code. The previous lesson put generated code inside a hand-written program. This lesson goes the other way.

The second half asks a quieter question. This whole module leans on tools: a code generator, a coverage tool, a test manager, a static analyzer. When a certification authority is asked to trust flight software partly because a tool said so, how does anyone know the tool is right? That is **tool qualification**.

## Three ways to call C from a model

Simulink offers three doors for existing C code. In all three, the C runs each step in simulation, and the block becomes a call to your function in generated code.

- An **S-function** is a block whose behavior you write yourself, in C, against Simulink's own programming interface. It is the oldest and most powerful door.
- The **Legacy Code Tool** writes that S-function for you, from a one-line description of your C function.
- The **C Caller block** is the newest door. It reads your header and lets you pick a function, with no wrapper code at all.

## S-functions: a block written in C

An **[[S-function|s-function-name]]** is a "system function": a block whose inputs, outputs, states and sample time are defined by code instead of by a diagram. S-functions can be written in MATLAB, C, C++ or Fortran. The kind that matters for flight code is the **C MEX S-function**, written in C and compiled with MATLAB's `mex` command into a **[[MEX file|mex]]**, a compiled library that Simulink loads while it simulates.

The modern form is called **Level-2**. You write a set of **[[callback methods|callbacks]]**: functions with fixed names that Simulink calls at fixed moments in the simulation. Simulink calls them, the way a referee blows a whistle and each player knows what to do.

| Callback | When Simulink calls it | What you do in it |
|---|---|---|
| `mdlInitializeSizes` | once, when the model is compiled | say how many inputs, outputs, states, parameters and sample times |
| `mdlInitializeSampleTimes` | once, right after | say how often the block runs |
| `mdlStart` (optional) | once, before the first step | allocate or set up anything the block needs |
| `mdlOutputs` | every step | compute the outputs from the inputs and states |
| `mdlUpdate` (optional) | every step, after outputs | update discrete states |
| `mdlDerivatives` (optional) | during integration | give derivatives of continuous states |
| `mdlTerminate` | once, at the end | clean up |

`mdlInitializeSizes`, `mdlInitializeSampleTimes`, `mdlOutputs` and `mdlTerminate` must always be present. The others are there when the block needs them. Every callback receives a pointer to the **SimStruct**, the data structure Simulink keeps for the block, and it reads and writes the block's ports through macros whose names start with `ss`.

::: key
A Level-2 C MEX S-function is a block written in C against Simulink's API. Simulink calls its callback methods: mdlInitializeSizes (ports, parameters, sample times), mdlInitializeSampleTimes, optional mdlStart, mdlOutputs every step, optional mdlUpdate and mdlDerivatives for states, and mdlTerminate at the end.
:::

Here is the heritage function the team wants to reuse. It removes a gyro's temperature-dependent bias, the small false rate a gyro reports when it sits still, which drifts as the gyro warms up.

```c
/* gyro_comp.h -- heritage code from an earlier program */
#ifndef GYRO_COMP_H
#define GYRO_COMP_H
double gyro_comp(double rate_dps, double temp_c);
#endif
```

```c
/* gyro_comp.c -- remove the gyro's temperature-dependent bias */
#include "gyro_comp.h"

double gyro_comp(double rate_dps, double temp_c)
{
    const double dT   = temp_c - 25.0;            /* distance from calibration temp */
    const double bias = 0.020 + 0.0015 * dT - 0.00002 * dT * dT;  /* deg/s */
    return rate_dps - bias;
}
```

And here is a hand-written S-function that wraps it: two inputs (rate and temperature), one output (corrected rate). It needs MATLAB's header `simstruc.h` and is built with `mex`, so treat it as a picture of the shape rather than a program to run without MATLAB.

```c
#define S_FUNCTION_NAME  sfun_gyro_comp
#define S_FUNCTION_LEVEL 2
#include "simstruc.h"
#include "gyro_comp.h"

static void mdlInitializeSizes(SimStruct *S)
{
    ssSetNumSFcnParams(S, 0);                      /* no dialog parameters */
    if (ssGetNumSFcnParams(S) != ssGetSFcnParamsCount(S)) return;

    if (!ssSetNumInputPorts(S, 2)) return;         /* rate, temperature */
    ssSetInputPortWidth(S, 0, 1);
    ssSetInputPortWidth(S, 1, 1);
    ssSetInputPortDirectFeedThrough(S, 0, 1);      /* output uses input now */
    ssSetInputPortDirectFeedThrough(S, 1, 1);

    if (!ssSetNumOutputPorts(S, 1)) return;        /* corrected rate */
    ssSetOutputPortWidth(S, 0, 1);

    ssSetNumSampleTimes(S, 1);
}

static void mdlInitializeSampleTimes(SimStruct *S)
{
    ssSetSampleTime(S, 0, INHERITED_SAMPLE_TIME);  /* run at the driving rate */
    ssSetOffsetTime(S, 0, 0.0);
}

static void mdlOutputs(SimStruct *S, int_T tid)
{
    InputRealPtrsType rate = ssGetInputPortRealSignalPtrs(S, 0);
    InputRealPtrsType temp = ssGetInputPortRealSignalPtrs(S, 1);
    real_T *y = ssGetOutputPortRealSignal(S, 0);
    UNUSED_ARG(tid);
    y[0] = gyro_comp(*rate[0], *temp[0]);          /* call the heritage code */
}

static void mdlTerminate(SimStruct *S)
{
    UNUSED_ARG(S);                                 /* nothing to clean up */
}

#ifdef MATLAB_MEX_FILE
#include "simulink.c"      /* glue for the simulation MEX file */
#else
#include "cg_sfun.h"       /* glue for code generation */
#endif
```

The two `#define` lines name the S-function and make it Level-2. `mdlInitializeSizes` declares two scalar inputs, one output and one sample time. **Direct feedthrough** means the output at this step depends on the input at this step, which Simulink needs to know to order the blocks and spot algebraic loops. The inherited sample time means the block runs at whatever rate drives it. `mdlOutputs` calls the heritage function. The last lines pull in Simulink's glue code.

::: example What the block computes
The gyro reads $1.542$ degrees per second while its temperature is $45\,^\circ\mathrm{C}$. What does the block output? (The function was compiled and run with gcc to check.)

**Step 1: distance from calibration.** $\Delta T = 45 - 25 = 20\,^\circ\mathrm{C}$.

**Step 2: the bias.** $0.020 + 0.0015 \times 20 - 0.00002 \times 20^2 = 0.020 + 0.030 - 0.008 = 0.042$ degrees per second.

**Step 3: corrected rate.** $1.542 - 0.042 = 1.500$ degrees per second. The C prints `1.5000`.

**Step 4: two more points.** At $25\,^\circ\mathrm{C}$ the bias is its base value, 0.020, so the output is 1.5220. At $-15\,^\circ\mathrm{C}$, with the gyro sitting still, $\Delta T = -40$ and the bias is $0.020 - 0.060 - 0.032 = -0.072$, so the output is $0 - (-0.072) = 0.0720$ degrees per second.

**Sanity check.** A bias of a few hundredths of a degree per second is typical of a small MEMS gyro, the kind on a chip. At 25 °C the formula collapses to its constant, a good first unit test.
:::

### From simulation to generated code

For Embedded Coder, the code generator also needs to know what C to write where the block sits. The production target expects S-functions to be **inlined**: a **[[TLC file|tlc]]** next to the S-function tells the code generator to emit, in place of the block, a direct call such as `y = gyro_comp(rate, temp);`. Without it, the block cannot become clean production code.

Writing both by hand is slow and error-prone, which is why the next door exists.

::: warning Two wrappers, two chances to disagree
A hand-written S-function and its TLC file are two more pieces of code around the same C. If the TLC file emits a call with the arguments in a different order from `mdlOutputs`, the simulation and the flight code differ even though the C function is identical. The SIL equivalence test catches that. A mistake made the same way in both, such as a wrong data type, it cannot catch: test the block against known values too.
:::

## The Legacy Code Tool: describe the call, get the wrapper

The **Legacy Code Tool** (LCT) is a MATLAB function, `legacy_code`, that generates the S-function, compiles it, builds a block for it, and writes the TLC file for code generation. You describe your C function once, in a MATLAB structure, and the tool does the rest.

```matlab
def = legacy_code('initialize');                 % empty description structure
def.SFunctionName = 'sfun_gyro_comp';
def.OutputFcnSpec = 'double y1 = gyro_comp(double u1, double u2)';
def.HeaderFiles   = {'gyro_comp.h'};
def.SourceFiles   = {'gyro_comp.c'};

legacy_code('sfcn_cmex_generate', def);   % write sfun_gyro_comp.c
legacy_code('compile', def);              % build it into a MEX file
legacy_code('slblock_generate', def);     % make a block that uses it
legacy_code('sfcn_tlc_generate', def);    % write the TLC file for code generation
```

The key line is `OutputFcnSpec`, the **function specification**. It is the C function's prototype, with the arguments renamed by role: `u1`, `u2` are the block's first and second inputs, `y1` is its first output. A parameter typed into the block's dialog would be `p1`. So this line says: "each step, call `gyro_comp` with input 1 and input 2, and put the result on output 1." `HeaderFiles` and `SourceFiles` tell the tool where the function lives.

There is also a shortcut, `legacy_code('generate_for_sim', def)`, which generates and compiles in one call when you only need simulation. Other fields describe code that runs once: `StartFcnSpec` for a function to call at start (an initialization routine) and `TerminateFcnSpec` for one to call at shutdown.

::: key
Legacy Code Tool: def = legacy_code('initialize'); set def.SFunctionName, def.OutputFcnSpec (the C prototype with inputs u1, u2, outputs y1, parameters p1), def.HeaderFiles and def.SourceFiles; then legacy_code('sfcn_cmex_generate', def), legacy_code('compile', def), legacy_code('slblock_generate', def), and legacy_code('sfcn_tlc_generate', def) so generated code calls the C function directly.
:::

::: example Reading a function specification
A heritage checksum routine has the prototype `uint16_t crc16(uint8_t *buf, int32_t len)`: it takes a buffer of bytes and a length and returns a 16-bit checksum. The model sends a 64-byte telemetry frame. Write the spec.

**Step 1: map roles.** The buffer and the length come from the model each step, so they are inputs `u1` and `u2`. The returned checksum is output `y1`.

**Step 2: types.** The spec uses Simulink's type names: `uint8` for an unsigned byte, `int32` for a 32-bit signed integer, `uint16` for the checksum. A vector input carries its size in brackets, so the 64-byte buffer is `uint8 u1[64]`.

**Step 3: the line.** `'uint16 y1 = crc16(uint8 u1[64], int32 u2)'`. The block gets two inputs, a 64-element byte vector and a length, and one output.

**Sanity check.** Count: two `u`s, two input ports; one `y`, one output. Each type matches the C exactly. Had the spec said `uint8 y1`, the top half of every checksum would be cut off in simulation and in code alike, so only a test against a known checksum would notice.
:::

## The C Caller block: no wrapper at all

The **C Caller** block is a newer, lighter door. You tell the model where your code is, in the model's configuration under **Simulation Target**, by listing the header files and source files. Then you drop a C Caller block in and pick `gyro_comp` from a list of the functions Simulink found. The block builds its ports from the function's arguments automatically. It simulates by calling the compiled C, and it generates code that calls the function directly.

The C Caller suits plain functions: inputs in, result out, no internal state that Simulink needs to manage. The Legacy Code Tool handles more cases, such as start and terminate functions and work data kept between steps. A hand-written S-function is the last resort, for needs such as a block with its own continuous states.

::: key
C Caller block: list headers and source files in the model's Simulation Target settings, pick the function, and the block's ports follow its arguments. It simulates and generates code with no hand-written wrapper. Use the Legacy Code Tool when you also need start and terminate functions or persistent work data, and a hand-written S-function only when neither fits.
:::

## Trusting the tools: what qualification means

Every tool in this module can be wrong. A code generator could mistranslate a block; a coverage tool could call a branch covered when it was not. That is harmless while a human re-checks everything. The problem comes when a team says: *we did not review this by hand, because the tool checked it.* Now the tool is doing a job the standard asks for, and the standard wants evidence that it does it right.

In civil aviation, software is certified under **[[DO-178C|do-178c-levels]]**. It grades software by how bad a failure could be, from **Level A** (a failure could be catastrophic, such as loss of the aircraft) down to Level E (no safety effect). The higher the level, the more verification objectives apply, such as MC/DC coverage at Level A. A companion document, **[[DO-330|do-330]]**, "Software Tool Qualification Considerations", says how to qualify tools.

::: key
What does tool qualification mean, and why does it matter? Under DO-330 and DO-178C, if you rely on a tool to replace or reduce a verification activity, you must show the tool does its job correctly. A qualification kit supplies the evidence so that, for example, Embedded Coder output does not have to be re-verified from scratch.
:::

### Development tools and verification tools

The first question is what harm the tool could do. DO-178C sorts tools by three **criteria**:

- **Criteria 1**: the tool's output is part of the flight software, so it could *insert* an error. A code generator or a compiler is the classic case. These are sometimes called development tools.
- **Criteria 2**: the tool automates verification, could *fail to detect* an error, and its output is used to justify dropping or reducing other verification or development work.
- **Criteria 3**: the tool, within its intended use, could *fail to detect* an error. Most verification tools sit here.

Criteria and software level together give a **[[Tool Qualification Level|tql-grid]]**, TQL-1 (most demanding) to TQL-5 (least).

| | Level A | Level B | Level C | Level D |
|---|---|---|---|---|
| Criteria 1 | TQL-1 | TQL-2 | TQL-3 | TQL-4 |
| Criteria 2 | TQL-4 | TQL-4 | TQL-5 | TQL-5 |
| Criteria 3 | TQL-5 | TQL-5 | TQL-5 | TQL-5 |

A tool that can insert an error into Level A software must be qualified to TQL-1, which demands evidence close to what the flight software itself needs. A tool that can only miss an error needs far less.

That asymmetry shapes how teams use code generators. Qualifying one to TQL-1 is a huge effort. So the common route is to leave the generator unqualified and check its output with qualified *verification* tools: a code inspection tool compares each generated file with its model, SIL equivalence tests show the code behaves like the model, and coverage shows the tests exercised it. Those tools sit at Criteria 2 or 3, so they need only TQL-4 or TQL-5. The generated code is still verified; the qualified tools do much of the checking a reviewer would otherwise do line by line.

::: warning A tool is never "qualified" on its own
Qualification is granted for a particular use of a tool, on a particular project, in that project's process. The same coverage tool can need TQL-5 on one program and no qualification at all on another where a human re-checks every result. The certification plan for the project states which tools are relied on, for what, and at which TQL.
:::

### What the DO Qualification Kit provides

MathWorks sells the **DO Qualification Kit** for DO-178C, with similar kits for other standards, such as the IEC Certification Kit for automotive and industrial standards. It covers MathWorks verification tools such as Simulink Check, Simulink Coverage, Simulink Test, Simulink Code Inspector and Polyspace. For each one it provides the qualification documents DO-330 asks for, including the **Tool Operational Requirements**, a precise statement of what the tool is claimed to do, and test cases with expected results and procedures to run them.

The kit does not qualify anything by itself. The applicant, the company seeking certification, does the qualifying:

1. States in its certification plan which tools it relies on and for which objectives.
2. Runs the kit's test cases on its own installation: its version of MATLAB, its operating system, its configuration.
3. Reviews the tool's known bugs for that version and shows none affects its use, or works around them.
4. Collects the results in a summary that the certification authority reviews with the rest of the project.

Change the tool's version or use it for a new purpose, and part of that work is repeated.

::: example Picking TQLs for one project
A team is building Level A flight control software. For each tool, decide the criteria and the TQL.

**Tool 1: Embedded Coder generates the flight code**, and the team plans to verify the code with other tools rather than trust the generator. The generator's output goes into the flight software, so it is Criteria 1. But the team does not claim credit from it; every file is checked downstream. So it is not relied on, and no qualification is needed for it, as long as the downstream checks are qualified.

**Tool 2: a code inspection tool** compares each generated file with the model, and its report replaces the manual line-by-line code review. It could miss an error, and its output is used to drop a verification activity. Criteria 2, Level A: TQL-4.

**Tool 3: Simulink Coverage** reports structural coverage of the model tests. It could miss an uncovered branch. Criteria 3: TQL-5.

**Tool 4: the compiler.** It turns C into machine code, so it could insert an error. Compilers are normally not qualified; instead the object code is tested on the target, which is part of why PIL and HIL exist.

**Sanity check.** The most demanding level, TQL-1, never appears. That is the goal of the whole strategy: build the process so that every tool you lean on can only *miss* an error, and then qualify those cheaper tools with a kit.
:::

## Check yourself

::: check
A C MEX S-function's output at time $t$ depends only on a state updated at the previous step, not on its input at time $t$. Which flag should it set differently from the gyro example, and why does Simulink care?
:::

::: answer
It should declare its input port as not direct feedthrough: `ssSetInputPortDirectFeedThrough(S, 0, 0)`. Simulink uses feedthrough to decide the order in which blocks run and to detect algebraic loops. A block without direct feedthrough can compute its output before its input is known, like a Unit Delay, so it can break a loop. Declaring feedthrough wrongly either creates a false algebraic loop or lets the block read an input that has not been computed yet.
:::

::: check
Write the Legacy Code Tool function specification for `double lookup_thrust(double t_s, double p1_scale)`, where the time comes from the model each step and the scale is set as a block parameter.
:::

::: answer
`'double y1 = lookup_thrust(double u1, double p1)'`. The time is the block's first input, `u1`. The scale is a block parameter, `p1`, set in the block's dialog. The returned thrust is the first output, `y1`. The C argument names do not matter to the spec; only their roles and types do.
:::

::: check
The same version of Polyspace Code Prover is used on two programs. On one, its "no run-time errors proven" result is used to drop some robustness tests at Level A. On the other, every Polyspace finding is re-checked by hand and no credit is taken. What does each program need?
:::

::: answer
The first uses the tool to justify dropping a verification activity, and the tool could fail to detect an error: Criteria 2 at Level A, so TQL-4. That program must qualify the tool, for example with the DO Qualification Kit run on its own installation. The second takes no credit from the tool, so it needs no qualification at all. Same tool, same version, different answers, because qualification belongs to a tool's use in a process, not to the tool.
:::

::: check
Why do teams go to the trouble of qualifying several verification tools instead of qualifying the code generator once?
:::

::: answer
The code generator is Criteria 1, so at Level A it would need TQL-1, with evidence about the tool comparable to what the flight software itself needs. Verification tools can only miss an error, so they need TQL-4 or TQL-5, which kits make practical. Checking the generator's output with qualified tools gives the assurance at a fraction of the cost.
:::

## Summary

| Idea | What it is | Remember |
|---|---|---|
| S-function | A block written in code against Simulink's API | Level-2 C MEX: callbacks such as mdlInitializeSizes, mdlOutputs, mdlTerminate |
| Inlined S-function | A TLC file tells the code generator what C to emit | Needed for clean production code |
| Legacy Code Tool | `legacy_code` generates S-function, MEX, block and TLC | Spec: `y1 = fn(u1, u2, p1)` |
| C Caller block | Picks a function from listed headers and sources | Simplest; for stateless functions |
| DO-178C levels | A (catastrophic) to E (no effect) | More objectives at higher levels |
| Tool criteria | 1: can insert an error; 2 and 3: can fail to detect one | Criteria 1 at Level A is TQL-1 |
| TQL | TQL-1 (hardest) to TQL-5 | Verification tools usually TQL-4 or TQL-5 |
| Qualification kit | Tool Operational Requirements, test cases, procedures | The applicant runs it; qualification is for a use, not a tool |

The last lesson of the module leaves the desk. It puts the flight computer on a bench wired to a real-time computer that plays the vehicle, and asks what that rig finds that no simulation can.

::: context s-function-name Where the S comes from
The S in S-function stands for "system": each one describes a small dynamic system with inputs, states and outputs, which is also what every built-in Simulink block is. Some of the blocks in Simulink's own libraries are S-functions underneath. The structure an S-function receives, the SimStruct, holds everything Simulink knows about that block instance: its port sizes, sample times, states and parameters. The `ss` at the front of every macro name is short for SimStruct.
:::

::: context mex MATLAB's own compiled plug-ins
MEX stands for MATLAB Executable. A MEX file is a compiled shared library with a special entry point that MATLAB can load and call as if it were a MATLAB function. The `mex` command wraps your system's C compiler with the right include paths and libraries. The file extension depends on the platform: `.mexw64` on 64-bit Windows, `.mexa64` on 64-bit Linux, `.mexmaci64` on Intel Macs. That is one reason a model with custom C must be rebuilt when it moves to a new machine.
:::

::: context callbacks The order of the whistles
A simulation run calls an S-function's methods in a fixed pattern. The setup calls happen once when the model is compiled. Then, every step, outputs come first and state updates after, so every block's output for this step is computed from the states of this step before any state moves on. At the end, terminate runs once.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="10" width="200" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="120" y="26" font-size="11" fill="#1f2a44" text-anchor="middle">mdlInitializeSizes</text>
  <rect x="20" y="42" width="200" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="120" y="58" font-size="11" fill="#1f2a44" text-anchor="middle">mdlInitializeSampleTimes</text>
  <rect x="20" y="74" width="200" height="24" fill="#ffffff" stroke="#1f2a44"/>
  <text x="120" y="90" font-size="11" fill="#1f2a44" text-anchor="middle">mdlStart (optional)</text>
  <rect x="20" y="106" width="200" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <text x="120" y="122" font-size="11" fill="#1f2a44" text-anchor="middle">mdlOutputs</text>
  <rect x="20" y="138" width="200" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <text x="120" y="154" font-size="11" fill="#1f2a44" text-anchor="middle">mdlUpdate (optional)</text>
  <rect x="20" y="170" width="200" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="120" y="186" font-size="11" fill="#1f2a44" text-anchor="middle">mdlTerminate</text>
  <path d="M220,150 C265,150 265,118 222,118" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="222,118 230,114 230,122" fill="#1d6fd1"/>
  <text x="272" y="138" font-size="11" fill="#1d6fd1">every step</text>
  <text x="272" y="30" font-size="11" fill="#6c7a93">once, at setup</text>
  <text x="272" y="186" font-size="11" fill="#6c7a93">once, at the end</text>
</svg>
```
:::

::: context tlc The code generator's own language
The Target Language Compiler is the part of Simulink Coder that writes the C. Every block, built-in or custom, has a TLC description that says what code to emit for it. TLC is a small scripting language of its own, with files ending in `.tlc`. The system target file you met in lesson 6, `ert.tlc`, is one too: it sets up the whole production-code build. An inlined S-function supplies its own TLC file so that the generated code contains a direct call instead of a call back into the S-function's simulation machinery.
:::

::: context do-178c-levels How bad could a failure be?
DO-178C's software levels come from the aircraft's safety assessment, which asks what happens if this software misbehaves. Catastrophic (the aircraft could be lost) gives Level A. Hazardous gives B, major gives C, minor gives D, and no safety effect gives E. The number of objectives grows with the level: Level A has 71, Level E none. Launch vehicles are not certified under DO-178C, but many space programs borrow its levels and objectives, and NASA's own software standard uses a similar idea of classifying software by the harm its failure could do.
:::

::: context do-330 A standard of its own for tools
DO-178C and DO-330 were both published by RTCA in December 2011; Europe publishes the same texts through EUROCAE as ED-12C and ED-215. The older standard, DO-178B, handled tools in a few pages and split them into development tools and verification tools. DO-330 is a whole document with its own objectives for tool planning, tool requirements, tool verification and tool configuration management. It is written so that other domains can reuse it, not only airborne software.
:::

::: context tql-grid Where the effort lands
The table in the lesson has a shape worth seeing. Only one row, tools that can insert errors, climbs toward the hardest level. Every tool that can only miss errors stays near the bottom. That shape is why the usual strategy is to put qualified checkers after an unqualified generator.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="110" y="18" font-size="11" fill="#1f2a44" text-anchor="middle">A</text>
  <text x="170" y="18" font-size="11" fill="#1f2a44" text-anchor="middle">B</text>
  <text x="230" y="18" font-size="11" fill="#1f2a44" text-anchor="middle">C</text>
  <text x="290" y="18" font-size="11" fill="#1f2a44" text-anchor="middle">D</text>
  <text x="20" y="48" font-size="11" fill="#1f2a44">Crit. 1</text>
  <text x="20" y="88" font-size="11" fill="#1f2a44">Crit. 2</text>
  <text x="20" y="128" font-size="11" fill="#1f2a44">Crit. 3</text>
  <rect x="80" y="28" width="60" height="32" fill="#b4232c"/>
  <text x="110" y="49" font-size="11" fill="#ffffff" text-anchor="middle">TQL-1</text>
  <rect x="140" y="28" width="60" height="32" fill="#f2b880" stroke="#ffffff"/>
  <text x="170" y="49" font-size="11" fill="#1f2a44" text-anchor="middle">TQL-2</text>
  <rect x="200" y="28" width="60" height="32" fill="#f2b880" stroke="#ffffff"/>
  <text x="230" y="49" font-size="11" fill="#1f2a44" text-anchor="middle">TQL-3</text>
  <rect x="260" y="28" width="60" height="32" fill="#8fb8f0" stroke="#ffffff"/>
  <text x="290" y="49" font-size="11" fill="#1f2a44" text-anchor="middle">TQL-4</text>
  <rect x="80" y="68" width="60" height="32" fill="#8fb8f0" stroke="#ffffff"/>
  <text x="110" y="89" font-size="11" fill="#1f2a44" text-anchor="middle">TQL-4</text>
  <rect x="140" y="68" width="60" height="32" fill="#8fb8f0" stroke="#ffffff"/>
  <text x="170" y="89" font-size="11" fill="#1f2a44" text-anchor="middle">TQL-4</text>
  <rect x="200" y="68" width="60" height="32" fill="#ffffff" stroke="#6c7a93"/>
  <text x="230" y="89" font-size="11" fill="#1f2a44" text-anchor="middle">TQL-5</text>
  <rect x="260" y="68" width="60" height="32" fill="#ffffff" stroke="#6c7a93"/>
  <text x="290" y="89" font-size="11" fill="#1f2a44" text-anchor="middle">TQL-5</text>
  <rect x="80" y="108" width="240" height="32" fill="#ffffff" stroke="#6c7a93"/>
  <text x="200" y="129" font-size="11" fill="#1f2a44" text-anchor="middle">TQL-5 at every level</text>
</svg>
```
:::
