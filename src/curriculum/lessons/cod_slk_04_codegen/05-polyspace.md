---
id: l05-polyspace
title: 'Polyspace: finding bugs and proving they are not there'
minutes: 24
covers:
  - 'Polyspace Bug Finder and Code Prover: proving absence of run-time errors without test cases'
---

Imagine you are checking whether a bridge can carry every truck that will ever cross it. One way is to drive trucks over it: a light one, a heavy one, a few in between. If none of them breaks the bridge, you feel better. But you have only tested the trucks you drove. The other way is to take the bridge's drawings and the legal weight limit, and work out with arithmetic that no truck under the limit, of any shape, can overload any beam. That second way does not drive a single truck, and it covers all of them.

Software testing is the first way. Every test from lessons 1 to 3 runs the code on chosen inputs and checks what happens. Even with full coverage, some input you never tried might still divide by zero or overflow an integer. This lesson is about the second way, applied to C code.

**Polyspace** is a pair of MathWorks tools that read C (and C++) source code without running it. That kind of checking is called **static analysis**: studying the code itself rather than watching it run. **Polyspace Bug Finder** hunts for defects and breaks of coding rules, quickly. **Polyspace Code Prover** goes further: for certain kinds of error, it tries to *prove* they cannot happen on any run, with any input. Both work on hand-written C and on the C that Embedded Coder generates from a model. Lesson 4 checked how the model is built; Polyspace checks the code it turns into.

## Run-time errors: the crashes a compiler lets through

A compiler checks that code follows the grammar of C. It does not check that the code makes sense for every value. These are the errors that happen only when certain values arrive, called **run-time errors**:

- **Overflow**: a result too big for its type. A 32-bit signed integer holds at most 2,147,483,647. One more wraps around, or worse.
- **Division by zero**: dividing by a variable that turns out to be 0.
- **Out-of-bounds access**: reading `table[4]` from an array that only has `table[0]` to `table[3]`.
- **Null pointer dereference**: following a pointer that points at nothing.
- **Uninitialized variable**: reading a variable before anything was stored in it.

In C, most of these are **[[undefined behavior|undefined-behavior]]**: the language standard says nothing about what happens next. The program might crash, give a wrong number, or seem fine until the day it does not. On a flight computer, "the day it does not" is the day the vehicle is in the air.

::: example A test suite that passes and a bug it missed
A wheel encoder counts pulses. This function turns a pulse count over a time window into pulses per second:

```c
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>

int32_t counts_per_s(int32_t count, int32_t dt_ms) {
    if (dt_ms <= 0) {
        return 0;
    }
    return (count * 1000) / dt_ms;
}

int main(int argc, char **argv) {
    printf("%d\n", counts_per_s(250, 10));   /* typical */
    printf("%d\n", counts_per_s(9000, 10));  /* fast */
    printf("%d\n", counts_per_s(125, 0));    /* bad window */
    if (argc > 1) {                          /* an input nobody tested */
        printf("%d\n", counts_per_s(atoi(argv[1]), 10));
    }
    return 0;
}
/* $ gcc -std=c99 -Wall -Wextra -fsanitize=undefined rate.c -o rate
   $ ./rate 3000000
   25000
   900000
   0
   rate.c:9:19: runtime error: signed integer overflow: 3000000 * 1000 cannot be represented in type 'int'
   -129496729                                                   */
```

**Step 1: the tests.** The three test calls give 25,000, 900,000 and 0. All three are right: $250 \times 1000 / 10 = 25000$, $9000 \times 1000 / 10 = 900000$, and a zero window returns 0 instead of dividing by zero. The compiler, with all its warnings on, says nothing.

**Step 2: the input nobody tried.** With a count of 3,000,000, the product $3{,}000{,}000 \times 1000 = 3 \times 10^9$ is larger than 2,147,483,647. The `-fsanitize=undefined` option makes gcc add run-time checks, and it catches the overflow. The printed answer is $-129{,}496{,}729$: a negative speed from a wheel spinning forward.

**Step 3: where the edge is.** The product overflows once `count` passes $2{,}147{,}483{,}647 / 1000 \approx 2{,}147{,}483$. Every test used counts far below that.

**Sanity check.** The sanitizer found the bug only because we fed it the bad input. It is a testing tool: it watches runs. To know the bug exists without guessing the input, you need something that reasons about *all* inputs at once.
:::

## Bug Finder: a very thorough code reviewer

**Polyspace Bug Finder** reads the code the way an expert reviewer would, but tirelessly and in seconds per file. It reports two kinds of finding.

**Defects** are likely bugs: a variable that may be read before it is set, a pointer used without checking it is not null, a division whose divisor may be zero, memory that is allocated and never freed, and **[[data races|data-race]]** between tasks that share a variable. Bug Finder follows the code's paths to find them, but it does not try to cover every path exhaustively. It aims to be fast and to report what is probably wrong.

**Coding-standard violations** are breaks of a rulebook for how C must be written. The best known in aerospace and automotive work is **[[MISRA C|misra]]**, a set of rules that bans or restricts the parts of C most likely to cause trouble. For example, MISRA C:2012 Rule 16.4 says every `switch` statement shall have a `default` label, and Rule 21.3 says the memory allocation functions of `<stdlib.h>`, such as `malloc`, shall not be used. Bug Finder also checks other standards, including CERT C, and computes **code metrics** such as how many paths a function has.

Here is a small file with problems of both kinds:

```c
#include <stdint.h>
#include <stdlib.h>

int32_t gain_for(int32_t mode) {
    int32_t gain;
    switch (mode) {
    case 0: gain = 2; break;
    case 1: gain = 5; break;
    }
    return gain * 3;
}

int32_t *make_buffer(size_t n) {
    int32_t *p = malloc(n * sizeof *p);
    p[0] = 0;
    return p;
}
/* $ gcc -std=c99 -Wall -Wextra -c pick.c
   (no warnings)
   $ gcc -std=c99 -Wall -Wextra -O2 -c pick.c
   pick.c:10:17: warning: 'gain' may be used uninitialized [-Wmaybe-uninitialized] */
```

Read it the way Bug Finder would. In `gain_for`, if `mode` is anything other than 0 or 1, `gain` is never set, and the function multiplies whatever garbage was in memory: an uninitialized-variable defect. The `switch` has no `default`, which breaks Rule 16.4. In `make_buffer`, `malloc` breaks Rule 21.3, and `malloc` can return a null pointer, which `p[0] = 0` would then follow: a possible null dereference. Notice that gcc found the first problem only when optimization was turned on, and never mentioned the other three. For a compiler, warnings are a side job. For Bug Finder, they are the whole job.

::: warning "No defects found" does not mean "no defects"
Bug Finder is built for speed and for few false alarms. To get that, it does not explore every possible path and value. So it can miss real bugs, and a clean Bug Finder report is not a proof of anything. It is a very good review. For a proof, you need Code Prover.
:::

## Code Prover: reasoning about every input at once

Go back to the bridge. The engineer does not try every truck. She works with ranges: "any truck is between 2 and 40 tonnes, so the load on this beam is between this and that". If the whole range is safe, every truck is safe.

**Polyspace Code Prover** does the same with the values in a program. Instead of one number per variable, it tracks the *set* of values each variable could have at each line, for every possible input, and pushes those sets through every operation. The mathematics behind this is called **[[abstract interpretation|abstract-interpretation]]**: running the program on descriptions of values (such as "any integer from 0 to 4095") instead of on single values. Then, at every operation that could fail, it asks: can any value in the set make this operation fail?

::: example Proving a sensor conversion safe by hand
A 12-bit analog-to-digital converter gives `raw`, an integer from 0 to 4095. The code converts it to millivolts for a 3.3 V sensor, then centers it:

```c
int32_t mv = ((int32_t)raw * 3300) / 4095;
int16_t centered = (int16_t)(mv - 1650);
```

Do what Code Prover does: carry the range of every value through every operation. Here `int` is 32 bits, so the largest value is 2,147,483,647.

**Step 1: the multiplication.** `raw` is in $[0, 4095]$ (read "the interval from 0 to 4095"). Times 3300 gives $[0, 13{,}513{,}500]$. The top, about 13.5 million, is far below 2,147,483,647. No overflow is possible: proven safe.

**Step 2: the division.** The divisor is the constant 4095, never zero: proven safe. The result is $[0, 13{,}513{,}500 / 4095] = [0, 3300]$.

**Step 3: the subtraction.** $[0, 3300] - 1650 = [-1650, 1650]$. No 32-bit overflow.

**Step 4: the conversion to 16 bits.** An `int16_t` holds $-32{,}768$ to $32{,}767$. The range $[-1650, 1650]$ fits: proven safe.

**Sanity check.** Here we could also have tested every input, because there are only 4096 of them. That stops working fast. A function of two 32-bit inputs has $2^{64} \approx 1.8 \times 10^{19}$ input pairs. At a billion tests per second, that takes about 585 years. The range argument took four lines and covers every one.
:::

This reasoning has one catch. To stay fast, Code Prover **over-approximates**: its sets are allowed to be a little bigger than the true set of values, never smaller. Suppose a tool that tracks only intervals meets `y = x - x`. The true answer is always 0, but if the tool only knows "x is in $[0, 10]$", interval arithmetic gives $[0, 10] - [0, 10] = [-10, 10]$. (Real analyzers use cleverer descriptions than plain intervals to avoid this simple case, but every analysis has cases like it.) The set is bigger than the truth. That is safe in one direction: if even the bigger set cannot fail, the real values cannot either. This is what makes the analysis **[[sound|sound-analysis]]**: it never calls a failing operation safe. But in the other direction, the bigger set may include a failing value that the real program can never reach, and then the tool cannot decide.

::: key
What does Polyspace Code Prover prove that testing cannot? By abstract interpretation it proves that whole classes of run-time error, such as overflow, division by zero and out-of-bounds access, cannot occur on any execution path with any input, rather than demonstrating their absence on the paths you tested.
:::

## Green, red, gray and orange

Code Prover places a **check** on every operation that could fail: every division, every array index, every arithmetic operation that could overflow, every pointer dereference, every read of a variable that might not be set. Then it gives each check [[a color|color-legend]].

| Color | Meaning | What you do |
|---|---|---|
| **Green** | proven safe: fails for no input on any path | nothing; this is the evidence |
| **Red** | proven error: fails every time the operation runs | fix it |
| **Gray** | unreachable: no input can ever make this code run | find out why; dead code or a logic slip |
| **Orange** | unproven: may fail for some inputs, or the tool could not decide | review each one |

::: key
Code Prover colors: green means proven safe, red means proven error, gray means unreachable, orange means unproven.
:::

Code that can only be reached by passing through a red error usually shows up gray, because the analysis assumes no run survives the error.

::: example Coloring a function by hand
Here is a small function with one of each color. It is written to be analyzed on its own, as a module, so Code Prover treats `mode` and `x` as able to take any `int32_t` value.

```c
#include <stdint.h>

static const int32_t table[4] = {10, 20, 30, 40};

int32_t shaped(int32_t mode, int32_t x) {
    if (mode < 0) { mode = 0; }
    if (mode > 3) { mode = 3; }      /* now mode is in [0, 3]           */
    int32_t y = table[mode];         /* A: array index                  */
    if (mode == 7) {
        y = -1;                      /* B: can this line ever run?      */
    }
    int32_t zero = 0;
    if (x > 1000) {
        y = y / zero;                /* C: division                     */
    }
    return y / x;                    /* D: division                     */
}
/* A test main calling shaped(2, 5) and shaped(9, -8) prints 6 and -5,
   and gcc -Wall -Wextra -O2 gives no warnings for this file.          */
```

**Line A.** After the two `if` statements, `mode` is in $[0, 3]$. The array has indices 0 to 3. Every possible index is inside: **green**.

**Line B.** `mode` is in $[0, 3]$, so `mode == 7` is never true. No input reaches this line: **gray**. That is worth asking about. Either the test is a leftover, or someone meant to write something else, perhaps a check on the mode *before* it was clamped.

**Line C.** Whenever this line runs, `zero` is 0. Every single execution divides by zero: **red**.

**Line D.** Runs that reach here have $x \le 1000$ (the others died at line C). That range includes 0, but also plenty of safe values. Some inputs fail, most do not: **orange**.

**Sanity check.** Both test calls passed, because neither used $x > 1000$ or $x = 0$. The compiler was silent too. Yet the function contains a guaranteed crash and a possible one. This is the gap between "tested" and "proven".
:::

### Working through orange

A real project's first Code Prover run often has hundreds of orange checks. Each is one of three things:

1. **A real bug** for some input. Fix the code, for example by guarding the division.
2. **An input the real system can never send.** Line D is only orange because `x` could be 0 in principle. If the caller guarantees $x \ge 1$, tell Code Prover so, with an **input constraint** on `x`. Code Prover then re-checks with the narrower range, and the check may turn green. The constraint is now an assumption that must itself be justified.
3. **The approximation's fault.** The code is safe, but the ranges got too wide, like `x - x` above. A small rewrite often helps the tool; otherwise an engineer writes a **justification** explaining why the check is safe, and a reviewer signs it off.

For the encoder function earlier, the division is green, because the `if` guarantees `dt_ms` is at least 1. The multiplication `count * 1000` is orange, since `count` could be any `int32_t`. If the encoder hardware can only count up to 65,535 in a window, a constraint `count` in $[0, 65535]$ makes the largest product $65{,}535{,}000$, well under 2,147,483,647, and the check turns green.

::: warning Constraints move the risk, they do not remove it
Every input constraint is a promise about the rest of the system. If the encoder is later replaced by one that counts to a million, the proof silently no longer applies. A reused range assumption is exactly what [[destroyed the first Ariane 5|ariane-501]]. Keep constraints in version control with a comment tracing each one to a requirement or an interface document, so a change to the hardware flags them for review.
:::

::: note Why orange can never be eliminated completely
It would be lovely if a tool could say "safe" or "unsafe" for every check with no "don't know". That is impossible, and not for lack of effort. In 1936 Alan Turing proved that no program can decide, for every program and input, whether it will ever stop. Henry Rice later extended the same reasoning into Rice's theorem: no program can decide *any* interesting property of what every program does. "This division never sees zero" is such a property. So a tool that always answers and is never wrong cannot exist. Code Prover chooses never to be wrong about green, and pays for it with orange.
:::

## Bug Finder or Code Prover?

The two tools answer different questions.

| | Bug Finder | Code Prover |
|---|---|---|
| Question | what is probably wrong here? | can this operation ever fail? |
| Coverage of paths | follows many, not all | all paths, all inputs, by over-approximation |
| Missed bugs | possible | none for the kinds of error it checks, in green code |
| False alarms | few | orange checks that turn out safe |
| Coding standards (MISRA C) | yes | not its job |
| Speed | fast, fits every commit | slower; often run nightly or before a release |
| Typical use | every developer, every day | proof for safety-critical code before review |

Most flight teams run both. Bug Finder on every commit catches defects and rule breaks early. Code Prover on the flight software builds the evidence that the run-time errors it checks are absent. Standards such as DO-178C ask that source code be shown accurate and consistent, and Code Prover's results are one widely used way to supply that evidence.

Both tools must be told about the target, just like the code generator. On a processor where `int` is 16 bits, the multiplication in the sensor example would be analyzed in a different type and could turn orange. The next lesson sets up those target settings.

Polyspace connects to Simulink too. You can run it on the code Embedded Coder generates, directly from the model, and its results link back to the blocks the code came from. It can also take the minimum and maximum set on the model's inputs as its input ranges, so the constraints come from the model instead of being typed twice.

::: warning Green depends on the whole picture
A Code Prover result is only as good as what it analyzed. If a function is analyzed on its own, it is checked against every possible input. If it is analyzed as part of a whole program, it is checked only against the inputs that program sends. Neither is wrong, but they answer different questions. Know which one your report answers before you sign it.
:::

## Check yourself

::: check
Your controller has 100% MC/DC coverage from requirement-based tests, and every test passes. Name one run-time error that could still be present, and explain why coverage did not catch it.
:::

::: answer
An overflow such as `count * 1000` with a large count, or a division by a value that can be zero. Coverage measures which decisions and conditions the tests exercised, not which *values* flowed through each operation. A multiplication can be executed thousands of times with small values and never with the one large value that overflows. Code Prover reasons about the whole range of values, so it would mark that multiplication orange.
:::

::: check
Explain in your own words what green and orange mean, and why an orange check is not the same as a bug.
:::

::: answer
Green means proven safe: the operation cannot fail for any input on any path. Orange means unproven: the tool found that some value in its (possibly too wide) range could make the operation fail, but it could not show that a real input does. Orange may be a real bug for some inputs, an input the system can never send, or the tool's over-approximation. Each needs to be reviewed and then fixed, constrained, or justified.
:::

::: check
A variable `k` is known to be in $[2, 9]$. What range does Code Prover's interval arithmetic give for `10 / (k - 5)`, and what color would the division get?
:::

::: answer
First, $k - 5$ is in $[2 - 5, 9 - 5] = [-3, 4]$. That range contains 0, since $k = 5$ is allowed. So the divisor can be zero for one input and nonzero for the others. The division is orange: it fails for some inputs, not all. If $k$ could never be 5 in the real system, you would have to say so with a constraint or a code change, since an interval cannot express "everything except 5".
:::

::: check
Code Prover marks a line gray. A colleague says "gray is fine, it isn't an error." Why might you still investigate?
:::

::: answer
Gray means no input can ever reach that code. That is not a run-time error, but it is often a sign of a logic mistake: a condition that can never be true, such as testing a value after it has already been clamped out of that range. It may also be code that should be deleted. The coverage lesson makes the same point about dead logic, and DO-178C does not allow unexplained dead code in flight software.
:::

::: check
Which tool would you use for each: (a) checking a new C file against MISRA C before merging it, (b) building evidence that a guidance function can never divide by zero?
:::

::: answer
(a) Bug Finder: it checks coding standards such as MISRA C and runs fast enough for every change. (b) Code Prover: only its sound analysis can show that no input on any path divides by zero, with the division checks green. Bug Finder finding no division-by-zero defect would not be proof.
:::

## Summary

| Idea | Meaning | Key fact |
|---|---|---|
| Static analysis | checking code by reading it, not running it | needs no test cases |
| Run-time error | fails only for some values: overflow, division by zero, out of bounds, null pointer, uninitialized read | most are undefined behavior in C |
| Bug Finder | fast defect hunter and coding-standard checker (MISRA C, CERT C) | can miss bugs; a review, not a proof |
| Code Prover | abstract interpretation over all inputs and paths | proves absence of the errors it checks |
| Over-approximation | tracked ranges may be wider than the truth, never narrower | makes green trustworthy, causes orange |
| Green / red / gray / orange | proven safe / proven error / unreachable / unproven | review every orange |
| Input constraint | a range you promise for an input | must be justified and kept up to date |

The next lesson turns to the code generator itself: Simulink Coder versus Embedded Coder, the hardware settings that tell it how wide an `int` is, and the solver rules a model must meet before any C comes out.

::: context undefined-behavior When the rulebook goes silent
The C standard lists situations where it places no requirement at all on what the program does. Signed integer overflow, division by zero, reading outside an array and dereferencing a null pointer are all on the list. It is not "the program crashes": the compiler may assume these things never happen and optimize on that basis, so the effect can show up far from the bug, or only at a higher optimization level. Unsigned integers are different: their arithmetic is defined to wrap around. That is why the overflow in the encoder example is a real defect, not a curiosity.
:::

::: context data-race Two tasks, one variable
A data race happens when two tasks, such as a 1 kHz sensor task and a 100 Hz control task, use the same variable at the same time and at least one of them writes it. If the fast task is halfway through writing a 64-bit value on a 32-bit processor when the slow task reads it, the reader can get half an old value and half a new one, a "torn" read. The rate-transition lesson of the solvers module showed the model-level version of this problem; Bug Finder looks for it in the code.
:::

::: context misra A rulebook for C that started in cars
MISRA is the Motor Industry Software Reliability Association, a UK group that published its first guidelines for C in 1998, for software in cars. The rules ban or restrict features of C that often lead to bugs, such as dynamic memory, unchecked type conversions and `goto`. Later editions are MISRA C:2004, MISRA C:2012 and MISRA C:2023. Each rule is marked mandatory, required or advisory, and a project may deviate from a required rule only with a written, reviewed justification. Aerospace teams adopted MISRA C widely even though it came from the car industry.
:::

::: context abstract-interpretation Computing with ranges instead of numbers
Abstract interpretation was laid out by Patrick Cousot and Radhia Cousot in a 1977 paper. The idea: pick a simpler "abstract" description of values, such as intervals, and define how each operation acts on those descriptions, in a way that always contains the true result. Then run the program on descriptions. An early industrial use was aerospace: after the Ariane 5 failure in 1996, researchers at the French institute INRIA analyzed the flight code this way, and one of them, Alain Deutsch, co-founded PolySpace Technologies. MathWorks acquired it in 2007.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="40" x2="340" y2="40" stroke="#6c7a93" stroke-width="1"/>
  <text x="20" y="20" font-size="12" fill="#1f2a44">raw in [0, 4095]</text>
  <rect x="20" y="33" width="140" height="14" fill="#8fb8f0" stroke="#1f2a44"/>
  <line x1="20" y1="85" x2="340" y2="85" stroke="#6c7a93" stroke-width="1"/>
  <text x="20" y="67" font-size="12" fill="#1f2a44">raw * 3300 in [0, 13,513,500]</text>
  <rect x="20" y="78" width="60" height="14" fill="#1d6fd1" stroke="#1f2a44"/>
  <line x1="300" y1="72" x2="300" y2="98" stroke="#b4232c" stroke-width="2"/>
  <text x="300" y="112" font-size="11" fill="#b4232c" text-anchor="middle">int32 limit</text>
  <text x="20" y="138" font-size="11" fill="#1f2a44">whole range below the limit: the check is green</text>
</svg>
```

The drawing is not to scale: the limit is about 160 times the top of the range.
:::

::: context sound-analysis What "sound" buys you
A static analyzer is called sound for a kind of error if it never misses one: when it says "safe", the code really is safe, for every input, provided its assumptions hold. Code Prover is designed to be sound for the run-time errors it checks. Bug Finder is not designed to be sound; it trades that for speed and fewer false alarms. The assumptions matter: the analysis must know the target's word sizes, the input ranges and any code it cannot see, such as a hand-written driver called from generated code.
:::

::: context color-legend Four colors on one function
The example's four checks, drawn as Code Prover's colors along the code. Red at line C also explains why line D is only orange, not worse: every path through C stops there, so D sees only $x \le 1000$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="15" width="24" height="18" fill="#2e8b57" stroke="#1f2a44"/>
  <text x="54" y="29" font-size="12" fill="#1f2a44">A  table[mode], mode in [0, 3]: green</text>
  <rect x="20" y="47" width="24" height="18" fill="#6c7a93" stroke="#1f2a44"/>
  <text x="54" y="61" font-size="12" fill="#1f2a44">B  inside if (mode == 7): gray</text>
  <rect x="20" y="79" width="24" height="18" fill="#b4232c" stroke="#1f2a44"/>
  <text x="54" y="93" font-size="12" fill="#1f2a44">C  y / zero, zero is always 0: red</text>
  <rect x="20" y="111" width="24" height="18" fill="#f2b880" stroke="#1f2a44"/>
  <text x="54" y="125" font-size="12" fill="#1f2a44">D  y / x, x may be 0: orange</text>
</svg>
```
:::

::: context ariane-501 A 16-bit overflow that destroyed a rocket
On June 4, 1996, the first Ariane 5 broke up about 37 seconds after launch. Inside its inertial reference system, code reused from Ariane 4 converted a 64-bit floating-point value, the horizontal bias, into a 16-bit signed integer. Ariane 5 flew a faster trajectory, the value exceeded 32,767, and the conversion raised an unhandled exception. The backup unit ran the same software and had failed the same way a moment earlier. With both units down, the flight computer read diagnostic data as flight data, commanded a full nozzle deflection, and the vehicle broke apart. The inquiry found that the conversion had been left unprotected on the assumption that the value could never be that large, an assumption true for Ariane 4 only. That is exactly the kind of range assumption an input constraint must trace to a document.
:::
