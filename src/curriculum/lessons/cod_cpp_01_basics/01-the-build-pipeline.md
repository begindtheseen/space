---
id: l01-the-build-pipeline
title: From source to executable: the four build stages
minutes: 18
covers:
  - 'Preprocess, compile, assemble, link: what each stage consumes and emits'
  - g++ and clang++ invocation; -Wall -Wextra -Wpedantic -Werror; -g; -O0 to -O3; -std=c++20
---

In Python you type `python3 sim.py` and the program runs. In C++ four separate programs run before yours exists, each consuming what the previous one produced, and each with its own vocabulary of complaints. A beginner who does not know which of the four is speaking cannot fix its message, and that — not templates, not pointers — is what makes the first week of C++ feel impossible. The module's premise is that most beginner pain is build pain, so this lesson takes the pipeline apart before it teaches a single new language feature.

On a real vehicle this matters beyond the first week. Falcon flight software is hundreds of translation units compiled for a target that is not the machine you edit on, linked against libraries you did not write, with a warning set that the project treats as errors. "It builds on my laptop and not on the build server" is the normal state of affairs until you can say which stage failed and what it was holding at the time.

Everything below was run on the toolchain this module assumes: **g++ 13.3.0** and **clang++ 18.1.3** on x86-64 Linux. Every output quoted is what those programs actually printed. Run the commands yourself as you read; the numbers will be close but not identical, and that is worth seeing too.

## The four stages

| Stage | Consumes | Emits | Flag that stops there |
| --- | --- | --- | --- |
| Preprocessor | your `.cpp` plus every header it includes | one self-contained stream of C++ text (a *translation unit*) | `-E` |
| Compiler | that translation unit | assembly text for one machine, a `.s` file | `-S` |
| Assembler | assembly text | an object file, `.o`: machine code plus a symbol table | `-c` |
| Linker | all the object files and libraries | one executable or shared library | (none — the default) |

`g++` is not a compiler. It is a *driver*: a program that runs the preprocessor, the compiler proper (`cc1plus`), the assembler (`as`) and the linker (`ld`) in order, hands the right files between them, and stops early if you ask. Understanding that one sentence removes a lot of confusion, because when an error message says `cc1plus` or `/usr/bin/ld` it is telling you exactly which stage it came from.

### Preprocess: text in, more text out

The preprocessor handles only lines beginning with `#`. It pastes the contents of an included header in place of the `#include` line, expands macros, and deletes the branches of `#if` that are false. It does not know C++ — it is a text substitution engine that happens to be pointed at C++ source.

Take this thirteen-line program, which computes how far a vehicle travels while decelerating to rest:

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

```bash
g++ -std=c++20 -E stop.cpp -o stop.ii
wc -l stop.cpp stop.ii
```

```text
   13 stop.cpp
 1063 stop.ii
 1076 total
```

Thirteen lines became 1063, and 334 bytes became 25,413, because of one `#include <cstdio>`. That number is the first thing to internalise about C++ build times: the compiler re-reads and re-parses every header for every source file that includes it, so headers are expensive and a header included by everything is expensive everywhere.

The preprocessed file is ordinary C++ text with line markers threaded through it:

```text
# 1 "/usr/include/c++/13/cstdio" 1 3
...
extern int printf (const char *__restrict __format, ...);
```

Those `# 1 "file"` markers are how a later error message can say "line 11 of stop.cpp" when the compiler is actually reading line 1061 of the preprocessed stream. When a macro produces an incomprehensible error, running `-E` and reading the real text is the fastest way to see what the compiler saw.

### Compile: text in, assembly out

The compiler proper parses the translation unit, checks every type, applies optimisations and emits assembly for one particular processor. Nearly every error you will meet — wrong types, unknown name, missing return — comes from here, and so does every warning.

One artefact of this stage explains a whole class of later confusion. C++ allows two functions with the same name and different parameters, so the compiler encodes the parameter types into the symbol it emits. That is *name mangling*:

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

`_Z13stop_distancedd` is `stop_distance` taking two `double`s. Change one parameter to `float` and the symbol changes. Lesson 03 shows what that does to a link.

### Assemble: assembly in, object file out

The assembler turns each instruction into bytes and writes an object file. It almost never fails on compiler-generated input, so you will rarely think about it — but the file it produces is the unit the linker works with, and it is worth looking inside one. `nm` lists a symbol table; adding `-C` demangles the names you just saw raw.

```bash
nm -C stop.o
```

```text
0000000000000000 T stop_distance(double, double)
0000000000000000 r kG0
0000000000000042 T main
                 U printf
```

Read the letters. `T` means the symbol is **defined** here, in the text (code) section. `U` means **undefined**: this object uses `printf` and something else must supply it. A lowercase letter means the symbol is local to this object file and invisible to everything else — `r` tells you `kG0` is read-only data that no other file can name, which is what `constexpr` at file scope does and which lesson 02 comes back to.

That two-letter distinction is the entire mental model you need for linker errors: every `U` in every object file must be matched by exactly one non-local `T` (or equivalent) somewhere in the link.

### Link: object files in, program out

The linker collects the objects and libraries, matches every `U` to a definition, assigns final addresses, and writes the executable. The C++ standard library and the C runtime come in here, which is why `printf` resolves without your doing anything.

```bash
g++ stop.o -o stop
./stop
```

```text
679.8 m
```

::: example One file, four stages, by hand
Run each stage separately and look at what comes out. The sizes are from g++ 13.3.0 on x86-64 Linux; yours will differ by a few bytes.

```bash
g++ -std=c++20 -Wall -Wextra -E stop.cpp -o stop.ii   # preprocess
g++ -std=c++20 -Wall -Wextra -S stop.cpp -o stop.s    # compile
g++ -std=c++20 -Wall -Wextra -c stop.cpp -o stop.o    # assemble
g++ stop.o -o stop                                    # link
```

| File | Bytes | What it is |
| --- | --- | --- |
| `stop.cpp` | 334 | what you wrote |
| `stop.ii` | 25,413 | your code plus all of `cstdio`, as plain text |
| `stop.s` | 1,691 | 103 lines of x86-64 assembly |
| `stop.o` | 1,872 | machine code, symbol table, relocations |
| `stop` | 16,040 | a complete ELF executable |

Check the result by hand: $v^2/(2a) = (200\,\mathrm{m/s})^2 / (2 \times 3 \times 9.80665\,\mathrm{m/s^2}) = 40000/58.8399 = 679.8\,\mathrm{m}$, which is what the program printed. A 200 m/s descent arrested at 3 g needs about 680 m of altitude, before any margin.
:::

## The flags you will type every day

### `-std=c++20`

Selects the language version. Leave it off and you get whatever the compiler's default is, which differs between compilers and between versions of the same compiler — g++ 13 defaults to `gnu++17`. A project that does not pin its standard will eventually fail to build for someone, so pin it.

### `-Wall -Wextra -Wpedantic -Werror`

Most of what the compiler knows about your mistakes it reports as warnings, not errors. `-Wall` is the long-standing default set (the name is historical; it is not all warnings). `-Wextra` adds another useful layer. `-Wpedantic` demands strict standard conformance and rejects compiler extensions, which matters when your code has to build with a different vendor's toolchain later. `-Werror` turns every warning into an error, which is what makes the set worth anything: a warning nobody is forced to read is a warning nobody reads.

Here is a real function with a real bug — `sum` is never initialised, so the loop adds to whatever was in that stack slot:

```cpp
double mean_az(const double* az, int n) {
    double sum;                       // never initialised
    for (int i = 0; i < n; ++i) sum += az[i];
    return sum / n;
}
```

g++ 13.3.0 with `-Wall -Wextra` at `-O0` says **nothing at all**. At `-O2` it says:

```text
warning: 'sum' may be used uninitialized [-Wmaybe-uninitialized]
    5 |     for (int i = 0; i < n; ++i) sum += az[i];
      |                                 ~~~~^~~~~~~~
note: 'sum' was declared here
```

clang++ 18.1.3 reports it at every optimisation level, including `-O0`, with different wording:

```text
warning: variable 'sum' is uninitialized when used here [-Wuninitialized]
note: initialize the variable 'sum' to silence this warning
```

Two lessons in one experiment. First, g++'s uninitialised-variable analysis rides on the optimiser's dataflow, so a debug build can miss a bug that the release build sees — check warnings in an optimised build, not only in the one you debug. Second, the two compilers do not find the same set of bugs, which is the practical argument for building with both.

Add `-Werror` and the same code stops the build with a final line naming the stage:

```text
cc1plus: all warnings being treated as errors
```

### `-g`

Adds debug information: the mapping from machine addresses back to your source lines and variable names, which `gdb` needs. It does not change the generated code. Compare the section sizes of the same program built `-O2` and `-O2 -g`:

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

Identical code; `b` is simply a larger file (20,856 bytes against 16,016) because the debug tables ride along. Ship with `-g`. You cannot debug a crash dump from a build that has no symbols.

### `-O0` through `-O3`

`-O0` is the default: no optimisation, code that corresponds line-for-line to your source, fast compiles, easy debugging. `-O1`, `-O2`, `-O3` ask for progressively more aggressive transformation. `-O2` is the normal release setting. `-O3` adds more vectorisation and inlining and is sometimes slower; measure before believing in it. `-Os` optimises for size instead.

::: example What `-O2` actually did to the arithmetic
Build `stop.cpp` both ways and read `main`. At `-O0` the program calls `stop_distance`, which spills both arguments to the stack, reads them back, multiplies, adds, multiplies and divides: seventeen instructions including the stack frame. At `-O2`:

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

There is no call to `stop_distance` and no arithmetic. The compiler inlined the function, saw that both arguments were literal constants, and computed the answer itself. `.LC1` holds the two words `-1992352874` and `1082474108`, which decoded as a little-endian IEEE-754 `double` is exactly `679.8108086519521`. The entire calculation happened at compile time.

That is what an optimiser is: a machine that is allowed to produce any program with the same observable behaviour as yours. It is also why `-O2` can expose a bug that `-O0` hides. Lesson 05 shows the mechanism.
:::

::: key
`g++` is a driver that runs four tools. `-E` stops after the preprocessor, `-S` after the compiler, `-c` after the assembler; with none of them you get a linked executable. The error prefix tells you the stage: `cc1plus` is the compiler, `/usr/bin/ld` is the linker.
:::

::: key
`T` in `nm` output means defined, `U` means undefined and needing a definition from elsewhere, and a lowercase letter means local to this object file. Every `U` must be matched exactly once at link time.
:::

::: key
The daily flag set is `-std=c++20 -Wall -Wextra -Wpedantic -Werror -g -O2`. `-std` pins the language, the `-W` flags make the compiler your first static analyser, `-g` makes crashes debuggable and does not change the code, `-O` chooses how hard the optimiser works.
:::

::: warning
Warnings are not a weaker kind of error, they are a different kind: the compiler reports something it is *required* to accept but has reason to doubt. Uninitialised reads, signed/unsigned comparisons and unused results are all legal C++ and all bugs. Without `-Werror` they scroll past in a hundred-line build log.
:::

::: warning
`g++ stop.cpp` with no `-o` writes a file called `a.out`, not `stop`. It is a fifty-year-old default and it silently overwrites the `a.out` from your last experiment.
:::

## Two compilers, one habit

g++ and clang++ take almost the same flags, so switching is usually one word on the command line. They do not produce the same diagnostics, and neither is uniformly better: you saw clang++ catch the uninitialised variable that g++ missed at `-O0`, and lesson 02 shows clang++ naming the precise cause of a header error where g++ only reports the symptom. Flight-software projects routinely build the same tree with two compilers for this reason, and it costs you one command:

```bash
clang++ -std=c++20 -Wall -Wextra -Wpedantic -Werror -g -O2 stop.cpp -o stop
```

When a message makes no sense, feed the file to the other compiler before you start guessing.

## Check yourself

::: check
A build fails with a message beginning `/usr/bin/ld:`. Which stage failed, what did it have as input, and what can you conclude about your syntax?
:::

::: answer
The linker. Its inputs are object files and libraries, not source, so every source file in the link compiled and assembled successfully — your syntax and types are fine as far as the compiler is concerned. The failure is about symbols: something is undefined, or defined more than once. Notice what this rules out: re-reading your source for a missing semicolon is wasted effort, because that error would have come from `cc1plus` long before `ld` ran.
:::

::: check
`g++ -std=c++20 -c telem.cpp` produces `telem.o` but no executable, and `g++ -std=c++20 telem.cpp` produces `a.out` but no `telem.o`. Explain both in terms of the pipeline.
:::

::: answer
`-c` means "stop after the assembler", so the driver runs the preprocessor, compiler and assembler and leaves the object file, with no link step and therefore no program. Without `-c` the driver runs all four stages; the object file still exists but as a temporary that the driver deletes when it is done, and the linked output takes the default name `a.out` because no `-o` was given.
:::

::: check
Your thirteen-line source preprocesses to 1063 lines. A colleague adds `#include <vector>` and `#include <string>` at the top of a header that forty source files include. What has that done to the build, and where does the cost land?
:::

::: answer
Each of the forty translation units now contains the full text of both standard headers — tens of thousands of extra lines each — and every one of them is preprocessed, parsed and type-checked separately, because the compiler works one translation unit at a time and shares nothing between them. The cost is forty times the parse, not once. This is why C++ projects work to keep headers thin, include only what they use, and declare rather than define. It is also why a build system that rebuilds every file when one header changes is so painful, and why lesson 03 makes the dependency tracking automatic.
:::

::: check
Why does a lowercase `r` next to `kG0` in the `nm` output mean you cannot get an "undefined reference to kG0" from another file?
:::

::: answer
Lowercase means the symbol is local to this object file: it has internal linkage and no other translation unit can refer to it at all. A name another file cannot refer to can never be an unresolved reference in that file. What you get instead, if another file tries to use `kG0` without its own declaration, is a compile error — "kG0 was not declared in this scope" — from `cc1plus`, one stage earlier.
:::

::: check
A team ships `-O2` builds but debugs and tests only at `-O0`, arguing that `-O0` is "closer to the source". Give two concrete reasons from this lesson that this is a bad policy.
:::

::: answer
First, warnings differ by optimisation level: g++ reported the uninitialised `sum` only at `-O2`, so a team that only ever compiles at `-O0` never sees that diagnostic and ships the bug. Second, the optimiser is licensed to rewrite anything whose observable behaviour is fixed, and `-O2` folded an entire function call into a constant — so the machine code being tested at `-O0` is not the machine code being flown, and a defect that depends on the optimiser's assumptions will appear only in the build that was never tested. Test what you ship, and add instrumented builds on top rather than testing a different configuration instead.
:::

## Summary

| Item | What it is |
| --- | --- |
| Preprocessor (`-E`) | pastes headers, expands macros; emits one translation unit of C++ text |
| Compiler (`-S`) | parses, type-checks, optimises; emits assembly; source of nearly all errors and warnings |
| Assembler (`-c`) | emits an object file: machine code, symbol table, relocations |
| Linker (default) | matches undefined symbols to definitions, assigns addresses, writes the executable |
| `nm -C x.o` | lists symbols; `T` defined, `U` undefined, lowercase local |
| Name mangling | parameter types encoded into the symbol: `_Z13stop_distancedd` |
| `-std=c++20` | pins the language version; never rely on the default |
| `-Wall -Wextra -Wpedantic` | the warning set a professional build uses |
| `-Werror` | makes warnings stop the build |
| `-g` | adds debug information; does not change the generated code |
| `-O0` / `-O2` / `-O3` | no optimisation / the release default / more aggressive, sometimes slower |

Lesson 02 takes the same pipeline to a program of more than one file: what a translation unit really is, why a header is not a module, and the rule that decides how many times a thing may be defined.
