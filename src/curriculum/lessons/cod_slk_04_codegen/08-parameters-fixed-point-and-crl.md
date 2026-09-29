---
id: l08-parameters-fixed-point-and-crl
title: Tunable parameters, fixed-point numbers and code replacement
minutes: 21
covers:
  - Tunable versus inlined parameters; Fixed-Point Designer for MCU targets
  - Code replacement libraries for vendor intrinsics
---

A recipe card can say "add 2 teaspoons of salt" in ink. Or it can say "add salt (see the sticky note)", with the amount on a sticky note you can peel off and change. The ink version is faster to read and can never be smudged, but changing it means rewriting the card. The sticky-note version costs one more glance and one more piece of paper, and you can adjust it between batches without touching the card.

Every gain, limit and table in a controller model faces the same choice when it becomes C. Last lesson set up the data interface: storage classes, entry points and the Code Mappings editor. This lesson looks closely at three things that decide how the numbers themselves appear in flight code. First, whether a parameter is ink or sticky note: **inlined** or **tunable**. Second, how numbers are stored on a small processor that has no hardware for decimals, using **fixed-point** arithmetic. Third, how the generated code can call a chip's own fast instructions through a **code replacement library**.

## Tunable versus inlined parameters

A **parameter** is a value the model reads but never changes while it runs: a gain, a saturation limit, a filter coefficient, a lookup table. When Embedded Coder writes the step function, it has two ways to put a parameter in the code.

- **Inlined.** The value is written into the code as a literal number, like `2.5 * err`. The compiler sees a constant. It can combine it with other constants, a step called **[[constant folding|constant-folding]]**, and it needs no variable in memory to hold it.
- **Tunable.** The value lives in a variable, and the code reads the variable every time, like `pid_P.Kp_Gain * err`. The variable sits at a known address in memory, so a tool can change it while the software runs.

The model-wide switch is the configuration setting **Default parameter behavior**, found with the code-generation optimization settings. It has two values, **Tunable** and **Inlined**. With Tunable, block parameters that have no storage class of their own are collected into one global parameter structure, named `model_P` of type `P_model_T`, with one field per parameter. When the value was typed into the block, the field is named from the block and the parameter, such as `Kp_Gain` for the Gain parameter of a block named `Kp`; when the block refers to a workspace variable, the field usually takes the variable's name. With Inlined, those same parameters become literals.

Either way, you can override it for one parameter. Give a parameter a storage class other than Auto, on its Simulink.Parameter object or in the Code Mappings editor, and it stays a variable even when the default is Inlined. That is how a team inlines everything by default and keeps exactly the gains it plans to tune.

::: key
Tunable versus inlined parameters: A tunable parameter becomes a variable in a parameter struct that can be changed at run time (and via external mode); an inlined one becomes a literal the compiler can fold. Tunability costs RAM and prevents constant folding, so it is a deliberate choice per parameter.
:::

Here is a hand-written sketch of the two shapes, not exact generated code.

```c
#include <stdio.h>
/* Hand-written sketch: the same proportional path generated two ways. */

/* (a) Default parameter behavior = Inlined: the value is a literal. */
double pid_inl_step(double err) {
    return 2.5 * err;                 /* Gain: Kp folded into the code */
}

/* (b) Default parameter behavior = Tunable: a field in the parameter struct. */
typedef struct { double Kp_Gain; } P_pid_T;
P_pid_T pid_P = { 2.5 };              /* lives in RAM, can be rewritten */
double pid_tun_step(double err) {
    return pid_P.Kp_Gain * err;
}

int main(void) {
    printf("inlined: %.3f  tunable: %.3f\n", pid_inl_step(0.4), pid_tun_step(0.4));
    pid_P.Kp_Gain = 1.8;              /* a calibration tool writes new memory */
    printf("inlined: %.3f  tunable: %.3f\n", pid_inl_step(0.4), pid_tun_step(0.4));
    return 0;
}
/* Output (gcc -std=c99 -Wall -O2):
   inlined: 1.000  tunable: 1.000
   inlined: 1.000  tunable: 0.720   */
```

Both give $2.5 \times 0.4 = 1.0$ at first. After the tool writes 1.8, only the tunable one changes: $1.8 \times 0.4 = 0.72$. The inlined version would need a new build.

How does a gain get changed on a running system? On the desk, Simulink's **external mode** connects the model to the running generated code and sends new parameter values down as you edit them. On a test stand or in a vehicle, a **[[calibration tool|calibration]]** writes the variable's memory directly, using the address from the build.

::: example What tunability costs
A thrust-vector controller has 24 gains stored as `double` (8 bytes each) and a gain-schedule table of 11 by 9 breakpoints stored as `single` (4 bytes each). The flight processor has 32 KB of RAM. What does it cost to make all of it tunable?

**Step 1: the gains.** $24 \times 8 = 192$ bytes.

**Step 2: the table.** $11 \times 9 = 99$ entries, and $99 \times 4 = 396$ bytes.

**Step 3: the total.** $192 + 396 = 588$ bytes. One kilobyte here is 1024 bytes, so 32 KB is $32 \times 1024 = 32{,}768$ bytes, and $588 / 32{,}768 \approx 0.018$, about 1.8 percent of the RAM.

**Step 4: the hidden cost.** The memory is not the only price. Each use now loads a value from memory instead of using a constant, and the compiler can no longer fold `Ki * Ts` into one number or drop a multiply by 1. Inlined, the product $0.2 \times 0.01$ becomes the single literal $0.002$ at build time; tunable, the processor multiplies it every step.

**Sanity check.** A few hundred bytes out of tens of thousands is small, which is why teams do keep gains tunable. But on a tiny actuator controller with 2 KB of RAM, the same 588 bytes would be almost 29 percent, and there inlining matters.
:::

::: warning An inlined gain cannot be tuned, and nobody warns you
If the default is Inlined and a gain has storage class Auto, a calibration tool has nothing to write: the gain has no address. Teams discover this on the test stand, the day they want to change it. Decide before code generation which parameters must stay tunable, and give each one a storage class.
:::

## Fixed-point numbers

Many small processors, the **microcontrollers** (MCUs) that run an actuator, a battery charger or a sensor board, have no floating-point unit, the hardware that does arithmetic on numbers like 12.3456. ARM's Cortex-M0 and Cortex-M3 cores are examples; the Cortex-M4F adds a single-precision **[[floating-point unit|fpu]]**. Without one, every `float` operation is done slowly in software. Integers, on the other hand, are fast on every chip.

**Fixed-point** arithmetic stores a number with a fractional part as an integer with an agreed scale. Think of prices in cents. \$12.34 is stored as the integer 1234, with the agreement "divide by 100 to get dollars". The computer only ever adds and multiplies integers; the scale lives in the programmer's head, or in this case in the model.

Computers use powers of 2 instead of 100, because dividing by $2^n$ is a shift of the bits. The rule is

$$
\text{real value} = \text{stored integer} \times 2^{-f}
$$

read "the real value equals the stored integer times two to the minus f", where $f$ is the **fraction length**: how many of the bits sit to the right of the **[[binary point|binary-point]]**.

In Simulink you write a fixed-point type with `fixdt`. The type `fixdt(1,16,10)` has three numbers:

- **1**: signed, so it can hold negative values (0 would mean unsigned);
- **16**: the **word length**, 16 bits in total, so it fits in an `int16_t`;
- **10**: the fraction length, 10 bits after the binary point.

Its **resolution**, the gap between two neighboring values, is $2^{-10} = 0.0009765625$, a little under one thousandth. Its **range** comes from the range of a signed 16-bit integer, $-32{,}768$ to $32{,}767$, times the resolution: from $-32{,}768 \times 2^{-10} = -32$ up to $32{,}767 \times 2^{-10} = 31.9990234375$.

::: key
fixdt(1,16,10): signed, word length 16, fraction length 10. Real value = stored integer × 2^-10. Resolution 2^-10 ≈ 0.000977; range −32 to 31.999. More fraction bits give finer resolution and a smaller range.
:::

That last sentence is the trade you make every time. With 16 bits you can have fine steps or a wide range, not both. `fixdt(1,16,14)` has steps of $2^{-14} \approx 0.000061$ but only reaches about $\pm 2$. `fixdt(1,16,4)` reaches about $\pm 2048$ in steps of $0.0625$. Choosing $f$ for each signal is called **scaling**. Powers of two are the common case; Simulink also supports a general slope and bias, $V = S \times Q + B$ (real value $V$, slope $S$, stored integer $Q$, bias $B$), for signals such as a temperature that sits in an offset range.

### Quantization error

A real value almost never lands exactly on one of the steps. Storing it means rounding to a nearby step, and the difference is **quantization error**. If you round to the nearest step, the error is at most half a step: $2^{-11} \approx 0.00049$ for `fixdt(1,16,10)`. If you round down (**floor**), which is cheaper in hardware and is often what integer shifts do, it can approach one full step.

Store $\pi$: $\pi \times 1024 = 3216.99\ldots$, which rounds to 3217. The stored value means $3217 / 1024 = 3.1416015625$, off by about $8.9 \times 10^{-6}$. That is less than half a step, as it must be.

In MATLAB, Fixed-Point Designer's `fi` object shows this directly. By default it rounds to nearest and saturates:

```matlab
a = fi(pi, 1, 16, 10);   % signed, 16-bit word, 10-bit fraction
storedInteger(a)         % int16: 3217
double(a)                % 3.1416015625
```

::: example A gain in 16-bit fixed point
A rate signal of 12.3456 deg/s is stored as `fixdt(1,16,10)` and multiplied by a gain of 1.3. The exact answer is $12.3456 \times 1.3 = 16.04928$.

**Step 1: store the signal.** $12.3456 \times 1024 = 12{,}641.9$, which rounds to 12,642, meaning $12.345703125$.

**Step 2: store the gain with the same scaling.** $1.3 \times 1024 = 1331.2$, rounds to 1331, meaning $1.2998046875$.

**Step 3: multiply.** Two 16-bit integers multiply into a 32-bit result: $12{,}642 \times 1331 = 16{,}826{,}502$. Multiplying adds the fraction lengths, so this product has $10 + 10 = 20$ fraction bits.

**Step 4: rescale.** To store the result back in `fixdt(1,16,10)`, shift right by 10 bits (divide by 1024, rounding down): $16{,}432$, meaning $16.046875$. The error is about $-0.0024$, around two and a half steps.

**Step 5: find the culprit.** Most of that error came from the gain, not the multiply. The gain was off by $1.3 - 1.2998046875 \approx 0.000195$, and that is multiplied by the signal, about 12.35, giving about $0.0024$. Give the gain its own scaling, `fixdt(1,16,14)`, since it never exceeds 2: it is stored as 21,299, meaning $1.29998779$. Now the product has 24 fraction bits, a shift right by 14 gives 16,434, meaning $16.048828125$, and the error drops to about $-0.00045$, under half a step.

```c
#include <stdio.h>
#include <stdint.h>
/* Hand-written sketch of fixed-point code: signals in fixdt(1,16,10),
   i.e. int16_t holding (real value) * 2^10. */
int main(void) {
    int16_t x   = 12642;                              /* 12.3456 -> 12.345703125 */
    int16_t k10 = 1331;                               /* 1.3 in fixdt(1,16,10)   */
    int16_t k14 = 21299;                              /* 1.3 in fixdt(1,16,14)   */
    int16_t y10 = (int16_t)(((int32_t)x * k10) >> 10);  /* 2^-20 -> 2^-10 */
    int16_t y14 = (int16_t)(((int32_t)x * k14) >> 14);  /* 2^-24 -> 2^-10 */
    printf("y (gain at 2^-10) = %d -> %.9f\n", y10, y10 / 1024.0);
    printf("y (gain at 2^-14) = %d -> %.9f\n", y14, y14 / 1024.0);
    return 0;
}
/* Output (gcc -std=c99 -Wall -O2):
   y (gain at 2^-10) = 16432 -> 16.046875000
   y (gain at 2^-14) = 16434 -> 16.048828125   */
```

**Sanity check.** The answer should be a bit above 16, and both are. Each coefficient deserves a scaling that fits its own range: a small gain can afford 14 fraction bits; a signal that reaches 30 cannot.
:::

### Overflow: saturate or wrap

What happens when a result does not fit? Add 30.0 and 5.0 in `fixdt(1,16,10)`. The stored integers are 30,720 and 5,120, and their sum, 35,840, is bigger than 32,767. There are two ways to handle it.

- **Wrap.** Keep the low 16 bits, the way integer hardware does naturally. The value goes round the circle of **[[two's complement|twos-complement]]** numbers: $35{,}840 - 65{,}536 = -29{,}696$, meaning $-29.0$. A command of "35 degrees" becomes "minus 29 degrees".
- **Saturate.** Clamp to the largest value the type holds: 32,767, meaning $31.999$. The answer is wrong by 3, but it is wrong in the right direction.

Blocks that can overflow have a checkbox, **Saturate on integer overflow**, and a menu for the **rounding mode** (Floor, Nearest, Zero, Convergent and others). Saturation costs a comparison or two per operation, so it is not free, and Fixed-Point Designer's job is to pick ranges wide enough that overflow never happens in the first place. For flight control, where a sign flip can turn a correction into a hard-over command, most teams saturate every operation that could possibly overflow. History has a hard lesson about **[[numbers that do not fit|ariane-overflow]]**.

::: warning Wrap-around is silent
A wrapped result raises no error. The code keeps running with a number of the wrong sign. Fixed-point code must either prove that a value can never overflow, with a range analysis or a tool such as Polyspace from lesson 5, or saturate it.
:::

### Fixed-Point Designer

Picking a scaling for every signal by hand in a model with hundreds of signals would take weeks. **Fixed-Point Designer** is the MathWorks product that helps. Its **Fixed-Point Tool** runs the floating-point model through representative simulations, records each signal's minimum and maximum, can also derive ranges from the Min and Max you declared on data objects, and then proposes a word length and fraction length for each signal with some safety margin. You then simulate the fixed-point model and compare it with the floating-point one, the same equivalence idea as SIL, to see how much quantization error the controller tolerates. Finally, PIL on the real MCU confirms that the target's integer arithmetic gives the same bits.

## Code replacement libraries

Generated code is written in portable C. A product of two 16-bit numbers accumulated into a 32-bit total is written as a multiply and an add. A square root is a call to `sqrtf`. That runs anywhere, but many processors have faster ways. A digital signal processor may do a **multiply-accumulate** (multiply two numbers and add the result to a running total) in one instruction. ARM's Cortex-M4 has `SMLAD`, which does two 16-by-16 multiplies and adds both to a 32-bit total at once. Such special instructions are reached from C through **[[intrinsics|intrinsics]]**: functions the compiler turns into one specific machine instruction, or small vendor library functions that use them.

A **code replacement library** (CRL) tells Embedded Coder: "wherever you would write *this* operation, write *that* call instead". You choose one with the configuration setting **Code replacement libraries**, on the code-generation Interface settings. Several come with hardware support packages, such as libraries for ARM Cortex processors that call ARM's CMSIS functions. You can also write your own.

A CRL is made of **tables**, and each table is a list of **entries**. An entry says two things:

- the **key**: which operation to replace, with its argument types. For example, the function `sqrt` on a `single`, or the operator "multiply" on two `int16` values with a 32-bit result, or a saturating add;
- the **implementation**: the function to call instead, its argument order, and the header file that declares it.

Tables are built with the Code Replacement Tool (`crtool`) or in MATLAB code, and registered so that they appear in the menu. The Code Replacement Viewer (`crviewer`) shows what a library contains, and the code-generation report lists every replacement actually made and which block it came from.

Here is a sketch of the before and after (the replacement name is made up for illustration):

```c
/* Without a CRL: portable C */
y = sqrtf(x);

/* With a CRL entry mapping sqrt(single) to a vendor function */
vendor_sqrt_f32(x, &y);   /* declared in the vendor's header */
```

::: key
Code replacement library: tables of entries that map an operation (function or operator, with its data types) to a target-specific implementation, such as a processor intrinsic or vendor DSP function, so generated code calls the fast version. Selected with the Code replacement libraries setting; replacements are listed in the code-generation report.
:::

::: warning A replacement changes the code under test
A CRL swaps your arithmetic for someone else's. The vendor's square root may round the last bit differently, and an intrinsic may saturate where plain C wrapped. SIL on the host may not even use the real intrinsic. So after choosing a CRL, rerun the equivalence tests, and treat PIL on the real processor as the test that counts.
:::

## Check yourself

::: check
A team's model uses Default parameter behavior = Inlined. They must be able to change the roll gain `K_roll` on the test stand but no other parameter. What do they do, and what happens to every other gain?
:::

::: answer
They give `K_roll` a storage class other than Auto, either on its Simulink.Parameter object (for example ExportedGlobal) or in the Code Mappings editor. It then stays a variable in memory that a calibration tool or external mode can rewrite. Every other parameter keeps storage class Auto and is inlined as a literal, so the compiler can fold it into other constants and it uses no RAM.
:::

::: check
For `fixdt(0,8,4)`, an unsigned 8-bit type with 4 fraction bits, give the resolution and the range, and store the value 3.3.
:::

::: answer
Resolution: $2^{-4} = 0.0625$. Unsigned 8-bit integers run from 0 to 255, so the range is 0 to $255 \times 0.0625 = 15.9375$. To store 3.3: $3.3 \times 16 = 52.8$, which rounds to nearest as 53, meaning $53 / 16 = 3.3125$, an error of $0.0125$, less than half a step ($0.03125$).
:::

::: check
Two signals in `fixdt(1,16,10)` are multiplied into a 32-bit intermediate. How many fraction bits does the product have, and what must happen before it is stored back in `fixdt(1,16,10)`?
:::

::: answer
Fraction lengths add when you multiply: $10 + 10 = 20$. To store the result with 10 fraction bits, shift it right by $20 - 10 = 10$ bits, which divides by $2^{10}$ and rounds (down, for a plain shift). Then check that it fits in 16 bits: saturate or prove it cannot overflow.
:::

::: check
A pitch command in `fixdt(1,16,10)` is 31.5 and the next block adds a trim of 1.0. What does the output read with wrapping, and with saturation?
:::

::: answer
Stored integers: $31.5 \times 1024 = 32{,}256$ and $1.0 \times 1024 = 1024$, sum $33{,}280$, above the maximum of $32{,}767$. Wrapping gives $33{,}280 - 65{,}536 = -32{,}256$, meaning $-31.5$: the command flips sign. Saturating gives $32{,}767$, meaning $31.999$, about half a unit short of the true 32.5 but in the right direction.
:::

::: check
Your controller runs on a Cortex-M4 and spends most of its step in a 16-tap fixed-point filter. What would you ask Embedded Coder for, and what test must you rerun afterwards?
:::

::: answer
Select a code replacement library for that processor (from its hardware support package, or a custom table) whose entries map the filter's multiply-accumulate operations or its filter function to ARM's intrinsics or CMSIS DSP functions. Then check the code-generation report to see which operations were replaced, and rerun the equivalence tests, above all PIL on the real Cortex-M4, since the replacement changed the code and may round or saturate differently.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| Inlined parameter | Value written as a literal | Folds with other constants; no RAM; retune means rebuild |
| Tunable parameter | Value in a variable, `model_P.Block_Param` | Changeable at run time; costs RAM and folding |
| Default parameter behavior | Model-wide Tunable or Inlined | A non-Auto storage class keeps one parameter tunable |
| `fixdt(s,w,f)` | Signed, word length, fraction length | Real value = stored integer × $2^{-f}$ |
| `fixdt(1,16,10)` | 16-bit signed, 10 fraction bits | Resolution $2^{-10}$; range −32 to 31.999 |
| Quantization error | Distance to the nearest step | At most half a step when rounding to nearest |
| Product scaling | Fraction lengths add | Shift right to rescale |
| Saturate versus wrap | Clamp at the limit, or go round the circle | Wrap flips sign silently |
| Fixed-Point Designer | Tools that propose and check scalings | Ranges from simulation or declared Min/Max |
| Code replacement library | Table of operation → implementation entries | Calls vendor intrinsics; rerun SIL/PIL |

The next lesson opens the generated code and reads it: the comments that name each block, the report that jumps between model and code, and the numbers that say how much memory and time the code takes.

::: context constant-folding Doing arithmetic before the flight
Constant folding means the compiler (or the code generator) does arithmetic on known numbers once, while building the program, instead of on every step in flight. If the code says `0.2 * 0.01 * err`, the build can turn it into `0.002 * err`. With a tunable `Ki`, the product `Ki * 0.01` must be computed on the vehicle, because `Ki` might be different by then. Folding also removes whole operations: a gain of exactly 1 or a sum with 0 can disappear.
:::

::: context calibration Tuning a running computer
In the automotive world, where much of this tooling grew up, changing parameters in a running engine controller is called calibration. The build produces a description file (the ASAM standard format is called A2L, and Embedded Coder can generate one) listing each tunable parameter's name, address, type and scaling. A calibration tool reads that file and uses a protocol such as XCP to read and write the memory while the controller runs. Space programs use the same idea on test stands, and sometimes in flight through ground commands that patch a parameter table.
:::

::: context fpu The floating-point unit
A floating-point unit is a block of hardware inside the processor that adds, multiplies and divides numbers stored in the IEEE 754 floating-point format in a few clock cycles. A Cortex-M4F has one for 32-bit `single` values only, so `double` arithmetic there is still done in slow software routines. Big flight computers, such as the radiation-hardened PowerPC and LEON boards used on many spacecraft, do have floating-point hardware, which is why fixed point in space is found mostly on small boards and in FPGAs.
:::

::: context binary-point Where the point sits
In a decimal number the decimal point separates whole units from tenths and hundredths. A binary point does the same in base 2: bits to its left count 1, 2, 4, 8 and so on, bits to its right count one half, one quarter, one eighth. In `fixdt(1,16,10)` the point sits ten bits from the right, leaving five bits for the whole part and one sign bit. In two's complement the top bit counts −32, which is why the range runs from −32 to a hair below +32.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="50" width="20" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="40" y="50" width="20" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="60" y="50" width="20" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="80" y="50" width="20" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="100" y="50" width="20" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="120" y="50" width="20" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="140" y="50" width="20" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="160" y="50" width="20" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="180" y="50" width="20" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="200" y="50" width="20" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="220" y="50" width="20" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="240" y="50" width="20" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="260" y="50" width="20" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="280" y="50" width="20" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="300" y="50" width="20" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="320" y="50" width="20" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <line x1="140" y1="40" x2="140" y2="86" stroke="#b4232c" stroke-width="2.5"/>
  <text x="140" y="34" font-size="11" text-anchor="middle" fill="#b4232c">binary point</text>
  <text x="30" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">sign</text>
  <text x="30" y="112" font-size="11" text-anchor="middle" fill="#6c7a93">−32</text>
  <text x="90" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">5 integer bits</text>
  <text x="90" y="112" font-size="11" text-anchor="middle" fill="#6c7a93">16 … 1</text>
  <text x="240" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">10 fraction bits</text>
  <text x="240" y="112" font-size="11" text-anchor="middle" fill="#6c7a93">1/2 … 1/1024</text>
</svg>
```
:::

::: context twos-complement Numbers on a circle
Signed integers are stored in two's complement. Picture the 65,536 values of a 16-bit word arranged around a circle like a clock face. Counting up from 0 you reach 32,767, and the very next step lands on −32,768. So adding past the top comes out near the bottom, with the opposite sign. That is wrap-around, and it is what the hardware does unless the code checks.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="100" r="70" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="180" cy="170" r="4" fill="#1f2a44"/>
  <text x="180" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <circle cx="180" cy="30" r="4" fill="#b4232c"/>
  <text x="192" y="22" font-size="11" fill="#1d6fd1">32,767</text>
  <text x="168" y="22" font-size="11" text-anchor="end" fill="#b4232c">−32,768</text>
  <text x="258" y="104" font-size="11" fill="#1d6fd1">positive</text>
  <text x="102" y="104" font-size="11" text-anchor="end" fill="#b4232c">negative</text>
  <path d="M 236 58 A 70 70 0 0 0 200 33" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <path d="M 160 33 A 70 70 0 0 0 128 53" fill="none" stroke="#b4232c" stroke-width="3"/>
  <text x="180" y="104" font-size="11" text-anchor="middle" fill="#6c7a93">count up</text>
  <text x="180" y="118" font-size="11" text-anchor="middle" fill="#6c7a93">past the top</text>
</svg>
```
:::

::: context ariane-overflow When a number does not fit
On 4 June 1996, the first Ariane 5 broke up about 37 seconds after launch. Software in its inertial reference system, reused from Ariane 4, converted a 64-bit floating-point value related to horizontal velocity into a 16-bit signed integer. Ariane 5 flew a faster trajectory than Ariane 4, the value no longer fit, and the unprotected conversion raised an error that shut down both inertial reference units. The rocket then acted on diagnostic data as if it were flight data. Range assumptions that were true for one vehicle were never rechecked for the next.
:::

::: context intrinsics Talking to one instruction
An intrinsic looks like a function call in C but is really a request for one particular machine instruction. ARM publishes a standard set for Cortex-M processors in CMSIS, the Common Microcontroller Software Interface Standard, including names like `__SSAT` for saturation and `__SMLAD` for the dual multiply-accumulate, plus a CMSIS-DSP library of filters, matrix routines and math functions. Using them by hand ties code to one chip; a code replacement library lets the model stay portable and the code become chip-specific at build time.
:::
