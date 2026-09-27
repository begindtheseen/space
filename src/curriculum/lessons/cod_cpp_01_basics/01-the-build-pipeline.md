---
id: l01-the-build-pipeline
title: From source to executable: the four build stages
minutes: 22
covers:
  - 'Preprocess, compile, assemble, link: what each stage consumes and emits'
  - g++ and clang++ invocation; -Wall -Wextra -Wpedantic -Werror; -g; -O0 to -O3; -std=c++20
---

Think about how a book gets made. The author writes chapters. Someone pastes in the quotes and tables each chapter refers to. The chapters are typeset one at a time, and wherever a chapter says "see page ??", the page number is left blank, because nobody knows it yet. Only at the very end does the binder put all the chapters in order, number the pages, and fill in every blank.

A C++ program is made the same way. In Python you type `python3 sim.py` and the program runs. In C++, four separate programs run before yours even exists. Each one takes what the previous one produced, and each has its own kind of complaint. If you cannot tell which of the four is complaining, you cannot fix its message. That — not templates, not pointers — is what makes the first week of C++ feel impossible. So this lesson takes the **build pipeline** — the chain of tools that turns your text into a program — apart before it teaches any new language feature.

This matters well beyond the first week. Falcon flight software is hundreds of source files, compiled for a flight computer that is not the machine you edit on, linked against libraries you did not write, with warnings treated as errors. "It builds on my laptop but not on the build server" is normal until you can say which stage failed and what it was holding at the time.

Everything below was run on **g++ 13.3.0** and **clang++ 18.1.3** on x86-64 Linux, and every output shown is what those programs printed. Run the commands yourself as you read. Your numbers will be close but not identical, and that is worth seeing too.

## The four stages

| Stage | Takes in | Puts out | Flag that stops there |
| --- | --- | --- | --- |
| Preprocessor | your `.cpp` plus every header it includes | one long stream of C++ text (a *translation unit*) | `-E` |
| Compiler | that translation unit | assembly text for one kind of processor, a `.s` file | `-S` |
| Assembler | assembly text | an object file, `.o`: machine code plus a symbol table | `-c` |
| Linker | all the object files and libraries | one executable (or shared library) | none — linking is the default |

Here is the sentence that clears up the most confusion: `g++` is not a compiler. It is a **[[driver|driver]]** — a program whose job is to run the other programs. It runs the preprocessor, the compiler proper (a program called `cc1plus`), the assembler (`as`) and the linker (`ld`) in order, hands each one the right files, and stops early if you ask. So when an error message starts with `cc1plus` or `/usr/bin/ld`, it is telling you exactly which stage it came from.

### Preprocess: text in, more text out

The **preprocessor** only looks at lines that begin with `#` (read "hash"). It replaces each `#include` line with the full contents of the file named, expands **[[macros|macros]]**, and deletes the parts of `#if` blocks whose condition is false. It does not understand C++. It is a text-pasting machine that happens to be pointed at C++.

Here is a thirteen-line program. It works out how far a vehicle travels while braking from a speed $v$ to a stop, with a steady deceleration of `decel_g` times standard gravity $g_0$ (read "g nought", $9.80665\,\mathrm{m/s^2}$):

```cpp
#include <cstdio>

constexpr double kG0 = 9.80665;  // standard gravity, m/s^2

// Distance covered while decelerating from v to rest at decel_g times g0.
double stop_distance(double v, double decel_g) {
    return v * v / (2.0 * decel_g * kG0);
}

int main() {
    std::printf("%.1f m\n", stop_distance(200.0, 3.0));
    return 0;
}
```

Ask the driver to stop after preprocessing, and count the lines before and after:

```bash
g++ -std=c++20 -E stop.cpp -o stop.ii
wc -l stop.cpp stop.ii
```

```text
   13 stop.cpp
 1063 stop.ii
 1076 total
```

Thirteen lines became 1063, and 334 bytes became 25,413, because of one `#include <cstdio>`. That is the first thing to understand about C++ build times. The compiler reads and checks every header again for every source file that includes it. So headers are expensive, and a header that everything includes is expensive everywhere.

The preprocessed file is ordinary C++ text with **line markers** mixed in:

```text
# 1 "/usr/include/c++/13/cstdio" 1 3
...
extern int printf (const char *__restrict __format, ...);
```

A marker like `# 1 "file"` records which file and line the next text came from. That is how a later error can say "line 11 of stop.cpp" when the compiler is really reading line 1061 of the stream. When a macro produces a baffling error, run `-E` and read the real text. It is the fastest way to see what the compiler saw.

### Compile: text in, assembly out

The **compiler** reads the whole translation unit, checks every type, improves the code, and writes **[[assembly|assembly-language]]** — a human-readable list of instructions for one kind of processor. Nearly every error you will meet comes from here: a wrong type, an unknown name, a missing `return`. So does every warning.

One thing this stage does explains a lot of later confusion. C++ lets two functions share a name as long as their parameters differ. So the compiler builds the parameter types into the name it writes out. That is **[[name mangling|name-mangling]]**. The tool `nm` (from "names") lists the names in an object file, and `c++filt` turns a mangled name back into C++:

```bash
g++ -std=c++20 -c stop.cpp -o stop.o
nm stop.o
echo '_Z13stop_distancedd' | c++filt
```

```text
0000000000000000 T _Z13stop_distancedd
0000000000000000 r _ZL3kG0
0000000000000042 T main
                 U printf
stop_distance(double, double)
```

Read `_Z13stop_distancedd` as: a C++ name (`_Z`), thirteen letters long, `stop_distance`, taking a `double` and a `double` (`dd`). Change one parameter to `float` and the name changes. Lesson 03 shows what that does to a link.

### Assemble: assembly in, object file out

The **assembler** turns each instruction into bytes and writes an **[[object file|object-file]]** — machine code plus a table of names. It almost never fails on what the compiler hands it, so you will rarely think about it. But the object file it writes is the thing the linker works with, so look inside one. Adding `-C` to `nm` "demangles" the names you just saw raw:

```bash
nm -C stop.o
```

```text
0000000000000000 T stop_distance(double, double)
0000000000000000 r kG0
0000000000000042 T main
                 U printf
```

Each line of this **symbol table** is one name, with a letter in front. Learn three of the letters:

- `T` means **defined** here, in the text (code) section. This file supplies it.
- `U` means **undefined**. This file uses `printf`, and something else must supply it.
- A **lowercase** letter means **local**: the name belongs to this object file and nothing else can see it. Here `r` says `kG0` is read-only data no other file can name. A `constexpr` variable at file scope gets that treatment, and lesson 02 explains why.

That is the whole mental model you need for linker errors. Every `U` in every object file must be matched by exactly one visible definition somewhere in the link.

### Link: object files in, program out

The **linker** is the binder from the book. It collects the object files and libraries, matches every `U` to a definition, gives everything its final address, and writes the executable. The C++ standard library and the C runtime come in here too, which is why `printf` gets found without your doing anything.

```bash
g++ stop.o -o stop
./stop
```

```text
679.8 m
```

::: key
`g++` is a driver that runs four tools. `-E` stops after the preprocessor, `-S` after the compiler, `-c` after the assembler; with none of them you get a linked executable. The error prefix tells you the stage: `cc1plus` is the compiler, `/usr/bin/ld` is the linker.
:::

::: key
`T` in `nm` output means defined, `U` means undefined and needing a definition from elsewhere, and a lowercase letter means local to this object file. Every `U` must be matched exactly once at link time.
:::

::: example One file, four stages, by hand
Run each stage on its own and look at what comes out.

```bash
g++ -std=c++20 -Wall -Wextra -E stop.cpp -o stop.ii   # preprocess
g++ -std=c++20 -Wall -Wextra -S stop.cpp -o stop.s    # compile
g++ -std=c++20 -Wall -Wextra -c stop.cpp -o stop.o    # assemble
g++ stop.o -o stop                                    # link
```

Step by step: the first line stops after pasting in `cstdio`. The second goes one stage further and stops with assembly text. The third goes one more and stops with an object file. The fourth hands the object file to the linker. The sizes, from g++ 13.3.0 on x86-64 Linux (yours will differ by a few bytes):

| File | Bytes | What it is |
| --- | --- | --- |
| `stop.cpp` | 334 | what you wrote |
| `stop.ii` | 25,413 | your code plus all of `cstdio`, as plain text |
| `stop.s` | 1,691 | 103 lines of x86-64 assembly |
| `stop.o` | 1,872 | machine code, symbol table, and notes for the linker |
| `stop` | 16,040 | a complete executable in Linux's ELF format |

Now check the printed answer by hand. Braking from speed $v$ to rest at a steady deceleration $a$ covers a distance $v^2 / (2a)$. Here $v = 200\,\mathrm{m/s}$ and $a = 3 \times 9.80665 = 29.42\,\mathrm{m/s^2}$:

$$
d = \frac{(200\,\mathrm{m/s})^2}{2 \times 3 \times 9.80665\,\mathrm{m/s^2}} = \frac{40\,000}{58.8399}\,\mathrm{m} \approx 679.8\,\mathrm{m}.
$$

That matches the program. It also makes sense: a vehicle descending at 200 m/s and braking at 3 g needs about 680 m of altitude, before any safety margin.
:::

## The flags you will type every day

### `-std=c++20`

This picks the version of the C++ language. Leave it off and you get the compiler's default, which differs between compilers and between versions of the same one — g++ 13 defaults to `gnu++17`, which is C++17 plus GNU extras. A project that does not pin its standard will one day fail to build for somebody. So pin it.

### `-Wall -Wextra -Wpedantic -Werror`

A **warning** is the compiler saying "this is legal C++, so I must accept it, but it looks wrong". Most of what the compiler knows about your mistakes, it reports as warnings, not errors.

- `-Wall` turns on the long-standing main set. The name is historical: it is not all warnings.
- `-Wextra` adds another useful layer.
- `-Wpedantic` warns about anything that is not strict standard C++, such as compiler-only extensions. That matters when your code must later build with a different vendor's compiler for a flight processor.
- `-Werror` turns every warning into an error, so the build stops.

`-Werror` is what makes the rest worth anything. A warning nobody is forced to read is a warning nobody reads.

Here is a real function with a real bug. `sum` is never given a starting value, so the loop adds to whatever was left in that **[[stack slot|stack-slot]]**:

```cpp
// mean.cpp
double mean_az(const double* az, int n) {
    double sum;                       // never initialised
    for (int i = 0; i < n; ++i) sum += az[i];
    return sum / n;
}
```

g++ 13.3.0 with `-Wall -Wextra` at `-O0` says **nothing at all**. At `-O2` it says:

```text
warning: 'sum' may be used uninitialized [-Wmaybe-uninitialized]
    4 |     for (int i = 0; i < n; ++i) sum += az[i];
      |                                 ~~~~^~~~~~~~
note: 'sum' was declared here
```

clang++ 18.1.3 reports it at every optimization level, `-O0` included, in different words:

```text
warning: variable 'sum' is uninitialized when used here [-Wuninitialized]
note: initialize the variable 'sum' to silence this warning
```

One experiment, two lessons. First, g++ finds this bug using the same analysis its optimizer uses, so a debug build at `-O0` can miss a bug that the release build sees. Check warnings in an optimized build, not only in the one you debug. Second, the two compilers do not find the same bugs. That is the practical reason to build with both.

Add `-Werror` and the same code stops the build, with a last line that names the stage:

```text
cc1plus: all warnings being treated as errors
```

This is why flight software teams insist on the flag set. Most C++ defects the compiler can see come out as warnings, and only `-Werror` turns the compiler into your first **[[static analyzer|static-analyzer]]** — a tool that finds bugs by reading code instead of running it. A build with no warnings at the pedantic setting is one of NASA JPL's **[[Power of Ten|power-of-ten]]** rules for safety-critical code.

::: key
Why compile with `-Wall -Wextra -Werror`? Most C++ defects the compiler can see are reported as warnings, not errors. Treating them as errors is what turns the compiler into your first static analyzer, and a warning-free pedantic build is a Power-of-Ten requirement.
:::

::: warning
Warnings are not a weaker kind of error. They are a different kind: something the compiler is *required* to accept but has reason to doubt. Uninitialized reads, signed/unsigned comparisons and ignored results are all legal C++, and all bugs. Without `-Werror` they scroll past in a hundred-line build log.
:::

### `-g`

`-g` adds **[[debug information|debug-info]]**: a map from machine addresses back to your source lines and variable names, which the debugger `gdb` needs. It does not change the machine code. Build the same program at `-O2` with and without it and compare the section sizes with `size`:

```bash
g++ -std=c++20 -O2 stop.cpp -o a
g++ -std=c++20 -O2 -g stop.cpp -o b
size a b
```

```text
   text	   data	    bss	    dec	    hex	filename
   1496	    600	      8	   2104	    838	a
   1496	    600	      8	   2104	    838	b
```

`text` is the code, `data` and `bss` are the program's variables. They are identical. Only the file is bigger — 20,864 bytes against 16,016 — because the debug tables ride along. So build your release with `-g` and keep those tables. You cannot debug a crash dump from a build that has no symbols.

### `-O0` through `-O3`

`-O` (capital letter O, for "optimize") picks how hard the optimizer works.

- `-O0` is the default: no optimization. The machine code follows your source line by line, compiles fast and is easy to debug.
- `-O1`, `-O2`, `-O3` ask for more and more aggressive rewriting. `-O2` is the normal release setting.
- `-O3` adds more inlining and vectorization (doing several numbers per instruction). It is sometimes *slower*, so measure before you trust it.
- `-Os` optimizes for small size instead.

::: example What `-O2` did to the arithmetic
Build `stop.cpp` both ways and read the assembly for `main`.

At `-O0`, `main` calls `stop_distance`. That function copies both arguments to the stack, reads them back, multiplies $v \cdot v$, doubles `decel_g` by adding it to itself, multiplies by `kG0`, and divides: seventeen instructions counting the ones that set up and tear down its stack frame.

At `-O2`, all of `main` is this:

```text
main:
	endbr64
	subq	$8, %rsp
	movl	$2, %edi
	movl	$1, %eax
	movsd	.LC1(%rip), %xmm0
	leaq	.LC2(%rip), %rsi
	call	__printf_chk@PLT
```

There is no call to `stop_distance` and no arithmetic at all. Step by step, here is what the compiler did:

1. It **inlined** `stop_distance`: copied its body into `main` in place of the call.
2. It saw that both arguments were fixed numbers, `200.0` and `3.0`.
3. It did the arithmetic itself, while compiling, and stored only the answer at the label `.LC1`.

`.LC1` holds two 32-bit words, `-1992352874` and `1082474108`. Read as the eight bytes of a **[[double|double-bits]]**, low byte first, they are exactly `679.8108086519521` — the answer the program prints as `679.8`. The whole calculation happened at compile time.

That is what an optimizer is: a machine allowed to produce *any* program with the same observable behavior as yours. It is also why `-O2` can expose a bug that `-O0` hides. Lesson 05 shows how.
:::

Optimization settings can change more than speed. They can change which bugs show up, and, on processors with a fused multiply-add instruction, whether `a * b + c` is rounded once or twice, which can change the last digits of a floating-point result. The rule that follows is short: test the configuration you ship.

::: key
The daily flag set is `-std=c++20 -Wall -Wextra -Wpedantic -Werror -g -O2`. `-std` pins the language, the `-W` flags make the compiler your first static analyzer, `-g` makes crashes debuggable and does not change the code, `-O` chooses how hard the optimizer works.
:::

::: warning
`g++ stop.cpp` with no `-o` writes a file called **[[a.out|a-out]]**, not `stop`. It is a fifty-year-old default, and it silently overwrites the `a.out` from your last experiment.
:::

## Two compilers, one habit

g++ and clang++ accept almost the same flags, so switching is one word on the command line. They do not produce the same messages, and neither is always better. You saw clang++ catch the uninitialized variable that g++ missed at `-O0`. Lesson 02 shows clang++ naming the exact cause of a header error where g++ only reports the symptom. Flight software projects often build the same code with two compilers for this reason. It costs you one command:

```bash
clang++ -std=c++20 -Wall -Wextra -Wpedantic -Werror -g -O2 stop.cpp -o stop
```

When a message makes no sense, give the file to the other compiler before you start guessing.

## Check yourself

::: check
A build fails with a message beginning `/usr/bin/ld:`. Which stage failed, what did it have as input, and what does that tell you about your syntax?
:::

::: answer
The linker failed. Its inputs are object files and libraries, not source. So every source file in the build was already compiled and assembled successfully — your syntax and types are fine as far as the compiler is concerned. The problem is about names: something is undefined, or defined more than once.

That rules something out. Re-reading your source for a missing semicolon is wasted effort, because that error would have come from `cc1plus` long before `ld` ever ran.
:::

::: check
`g++ -std=c++20 -c telem.cpp` produces `telem.o` but no program. `g++ -std=c++20 telem.cpp` produces `a.out` but no `telem.o`. Explain both using the pipeline.
:::

::: answer
`-c` means "stop after the assembler". The driver runs the preprocessor, the compiler and the assembler, and leaves the object file. There is no link step, so there is no program.

Without `-c` the driver runs all four stages. An object file is still made, but as a temporary file that the driver deletes when it is done. The linked program gets the default name `a.out`, because no `-o` was given.
:::

::: check
The thirteen-line `stop.cpp` preprocesses to 1063 lines. A colleague adds `#include <vector>` and `#include <string>` to the top of a header that forty source files include. What has that done to the build, and where does the cost land?
:::

::: answer
Each of the forty translation units now contains the full text of both standard headers — tens of thousands of extra lines each. Every one of them is preprocessed, parsed and type-checked separately, because the compiler works on one translation unit at a time and shares nothing between them. So the cost is paid forty times, not once.

That is why C++ projects keep headers thin, include only what they use, and declare things rather than define them in headers. It is also why a build system that rebuilds every file when one header changes is so painful, and why lesson 03 makes that dependency tracking automatic.
:::

::: check
In the `nm` output, `kG0` has a lowercase `r`. Why does that mean you can never get "undefined reference to kG0" from another file?
:::

::: answer
Lowercase means the name is local to this object file. No other translation unit can refer to it at all. A name another file cannot refer to can never be left unresolved in that file.

What you get instead, if another file tries to use `kG0` without declaring it, is a compile error — "'kG0' was not declared in this scope" — from `cc1plus`, one stage earlier.
:::

::: check
A team ships `-O2` builds but debugs and tests only at `-O0`, saying `-O0` is "closer to the source". Give two concrete reasons from this lesson why that is a bad policy.
:::

::: answer
First, warnings depend on the optimization level. g++ reported the uninitialized `sum` only at `-O2`. A team that only ever compiles at `-O0` never sees that warning, and ships the bug.

Second, the optimizer may rewrite anything as long as the observable behavior stays the same, and at `-O2` it turned a whole function call into a stored constant. So the machine code tested at `-O0` is not the machine code that flies. A defect that depends on the optimizer's assumptions shows up only in the build nobody tested. Test what you ship, and add extra checking builds on top, rather than testing a different configuration instead.
:::

## Summary

| Item | What it is |
| --- | --- |
| Preprocessor (`-E`) | pastes headers, expands macros; puts out one translation unit of C++ text |
| Compiler (`-S`) | parses, type-checks, optimizes; puts out assembly; source of nearly all errors and warnings |
| Assembler (`-c`) | puts out an object file: machine code, symbol table, notes for the linker |
| Linker (default) | matches undefined names to definitions, assigns addresses, writes the executable |
| `nm -C x.o` | lists names; `T` defined, `U` undefined, lowercase local |
| Name mangling | parameter types built into the name: `_Z13stop_distancedd` |
| `-std=c++20` | pins the language version; never rely on the default |
| `-Wall -Wextra -Wpedantic` | the warning set a professional build uses |
| `-Werror` | makes warnings stop the build |
| `-g` | adds debug information; does not change the machine code |
| `-O0` / `-O2` / `-O3` | no optimization / the release default / more aggressive, sometimes slower |

Lesson 02 takes the same pipeline to a program of more than one file: what a translation unit really is, why a header is not a Python module, and the rule that decides how many times a thing may be defined.

::: context driver One command, four programs
Ask the driver to show its work with `g++ -v stop.cpp`, and it prints each program it runs: `cc1plus` (which does the preprocessing and the compiling), then `as`, then `collect2`, which runs `ld`. The files between the stages normally go to a temporary folder and are deleted afterward.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="4" y="20" width="56" height="26" rx="4" fill="#fff" stroke="#1f2a44"/>
    <text x="32" y="37">stop.cpp</text>
    <rect x="98" y="20" width="56" height="26" rx="4" fill="#fff" stroke="#1f2a44"/>
    <text x="126" y="37">stop.ii</text>
    <rect x="192" y="20" width="56" height="26" rx="4" fill="#fff" stroke="#1f2a44"/>
    <text x="220" y="37">stop.s</text>
    <rect x="286" y="20" width="56" height="26" rx="4" fill="#fff" stroke="#1f2a44"/>
    <text x="314" y="37">stop.o</text>
    <rect x="268" y="104" width="86" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="311" y="121">stop (program)</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2" fill="none">
    <line x1="60" y1="33" x2="92" y2="33"/><line x1="154" y1="33" x2="186" y2="33"/>
    <line x1="248" y1="33" x2="280" y2="33"/><line x1="314" y1="46" x2="314" y2="98"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="98,33 90,29 90,37"/><polygon points="192,33 184,29 184,37"/>
    <polygon points="286,33 278,29 278,37"/><polygon points="314,104 310,96 318,96"/>
  </g>
  <g font-size="11" fill="#b4232c" text-anchor="middle">
    <text x="79" y="62">-E</text><text x="173" y="62">-S</text><text x="267" y="62">-c</text>
    <text x="330" y="78">link</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="79" y="14">preprocess</text><text x="173" y="14">compile</text><text x="267" y="14">assemble</text>
  </g>
  <text x="10" y="92" font-size="11" fill="#1f2a44">red flag = where g++ stops</text>
  <text x="10" y="110" font-size="11" fill="#1f2a44">other .o files and libraries</text>
  <text x="10" y="124" font-size="11" fill="#1f2a44">join at the link step</text>
</svg>
```
:::

::: context macros Text that rewrites text
A **macro** is a name the preprocessor replaces with other text before the compiler sees anything. After `#define MAX_G 3.0`, every `MAX_G` in the file turns into `3.0`. Macros can take arguments too, and because the preprocessor knows nothing about C++, they can produce strange code: `#define SQ(x) x*x` turns `SQ(a+1)` into `a+1*a+1`. Modern C++ uses `constexpr` constants and ordinary functions instead wherever it can. Macros survive mainly for include guards and for switching code on or off per platform.
:::

::: context assembly-language The processor's own words, spelled out
A processor only runs numbers: each instruction is a few bytes. **Assembly language** writes those instructions as short words a person can read, one per line — `mulsd` means "multiply two doubles", `call` means "jump to a function and come back". Each kind of processor has its own set. The x86-64 assembly here would mean nothing to the ARM or PowerPC chips found in many flight computers, which is one reason flight code is compiled on one machine for another — **cross-compiling**. The site Compiler Explorer (godbolt.org) shows the assembly for any snippet as you type.
:::

::: context name-mangling Why C does not need mangling
In C, two functions cannot share a name, so the symbol for `printf` is plain `printf` — that is why it appeared unmangled in `stop.o`. C++ allows overloads, namespaces and classes, so `stop_distance(double, double)` and a `stop_distance(float, float)` need different symbols, and the compiler builds the difference into the name. On Linux the encoding follows a published scheme called the Itanium C++ ABI, which g++ and clang++ share. That shared scheme is why object files from the two compilers can usually be linked together. To call C code from C++, you write `extern "C"` on its declarations to switch mangling off.
:::

::: context object-file Inside an object file
On Linux an object file uses the **ELF** format (Executable and Linkable Format) — the same format as the finished program. It is divided into **sections**, and `nm`'s letters name them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="10" width="170" height="150" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="20" y="10" width="170" height="24" fill="#6c7a93"/>
  <text x="105" y="26" font-size="11" fill="#fff" text-anchor="middle">ELF header</text>
  <rect x="20" y="34" width="170" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="105" y="53" font-size="11" fill="#1f2a44" text-anchor="middle">.text (code)</text>
  <rect x="20" y="64" width="170" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <text x="105" y="81" font-size="11" fill="#1f2a44" text-anchor="middle">.rodata (read-only data)</text>
  <rect x="20" y="90" width="170" height="24" fill="#fff" stroke="#1f2a44"/>
  <text x="105" y="106" font-size="11" fill="#1f2a44" text-anchor="middle">.data / .bss (variables)</text>
  <rect x="20" y="114" width="170" height="24" fill="#fff" stroke="#1f2a44"/>
  <text x="105" y="130" font-size="11" fill="#1f2a44" text-anchor="middle">symbol table</text>
  <rect x="20" y="138" width="170" height="22" fill="#fff" stroke="#1f2a44"/>
  <text x="105" y="153" font-size="11" fill="#1f2a44" text-anchor="middle">relocations</text>
  <g font-size="11" fill="#1f2a44">
    <text x="200" y="53">T: stop_distance, main</text>
    <text x="200" y="81">r: kG0</text>
    <text x="200" y="106">D / B: global variables</text>
    <text x="200" y="130">U: printf (needed)</text>
    <text x="200" y="153">"fill in address here"</text>
  </g>
</svg>
```

The **relocations** are the blanks from the book analogy: places in the code where an address must be filled in once the linker knows it.
:::

::: context stack-slot What "whatever was there" means
Each time a function runs, it gets a small patch of memory on the **stack** for its local variables. When the function returns, that memory is not cleaned — the next function to run reuses it, old bytes and all. So a local `double sum;` with no starting value holds whatever the last function happened to leave in those eight bytes. It might be zero on your laptop and something else on the flight computer. C++ counts reading it as undefined behavior, a topic lesson 05 treats properly. The fix costs nothing: write `double sum = 0.0;`.
:::

::: context static-analyzer Finding bugs without running the code
A **static analyzer** reads source code and reports likely bugs without running it — "static" as opposed to "dynamic", which means watching the program run. The compiler's warnings are the first, cheapest one: it already understands every type and every path. Flight software teams add dedicated analyzers on top, such as clang-tidy, the Clang Static Analyzer and commercial tools, and run them on every change. None of them is useful if its reports are allowed to pile up unread, which is the whole argument for `-Werror`.
:::

::: context power-of-ten Ten rules from JPL
In 2006 Gerard Holzmann of NASA's Jet Propulsion Laboratory published "The Power of Ten: Rules for Developing Safety-Critical Code". It is ten short rules, written so that a tool can check them: simple control flow, fixed loop bounds, no dynamic memory after startup, short functions, at least two assertions per function, and more. The tenth rule says to compile all code from the first day with every warning enabled at the most pedantic setting, to fix code until it compiles with zero warnings, and to run static analyzers on it every day. You will meet other rules from the list in later lessons of this module.
:::

::: context debug-info What -g actually stores
On Linux, `-g` writes tables in a format called **DWARF** into extra sections of the file. They record which address came from which line, where each variable lives, and the types of everything. `gdb` reads them to show you source instead of raw addresses. Teams often keep a full copy with debug tables on the ground and fly a copy with the tables stripped out (the `strip` command removes them). The machine code is identical, so a crash address from the vehicle can still be looked up in the ground copy.
:::

::: context double-bits Eight bytes that hold 679.81
A `double` is 64 bits: 1 sign bit, 11 exponent bits and 52 fraction bits (the IEEE-754 standard). For 679.81 the sign is 0 (positive), the stored exponent is 1032, meaning $2^{1032 - 1023} = 2^9 = 512$, and the fraction supplies the $1.3277\ldots$ that multiplies it: $512 \times 1.3277 \approx 679.8$. As one hex number the bits are `0x40853E7C893F1B96`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="14" height="30" fill="#b4232c" stroke="#1f2a44"/>
  <rect x="24" y="30" width="70" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="94" y="30" width="256" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="17" y="22">1</text><text x="59" y="22">11 bits</text><text x="222" y="22">52 bits</text>
    <text x="17" y="50" fill="#fff">0</text><text x="59" y="50">1032</text><text x="222" y="50">0x53E7C893F1B96</text>
    <text x="59" y="78">exponent</text><text x="222" y="78">fraction</text>
  </g>
  <text x="10" y="94" font-size="11" fill="#1f2a44">sign</text>
  <text x="10" y="112" font-size="11" fill="#1f2a44">.LC1 low word 0x893F1B96, high word 0x40853E7C</text>
</svg>
```

x86-64 stores the low word first ("little-endian"), which is why the assembly lists `-1992352874` (that is `0x893F1B96` read as a signed number) before `1082474108` (`0x40853E7C`).
:::

::: context a-out Where a.out comes from
The name goes back to the first versions of Unix at Bell Labs around 1970, where it stood for "assembler output": the assembler wrote its result to `a.out`, and for a small program that file was the program. Later the linker took over the job but kept the name. "a.out" also became the name of Unix's old executable format, which Linux replaced with ELF in the 1990s. The file name stayed as the default anyway.
:::
