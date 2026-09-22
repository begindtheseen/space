---
id: l03-reading-linker-errors-and-make
title: Reading a linker error, and a Makefile that prevents them
minutes: 20
covers:
  - 'Reading a linker error: undefined reference, multiple definition'
---

A compiler error points at a line of your source and usually says something close to what is wrong. A linker error does neither. It names a mangled symbol you did not write, gives a byte offset into a section instead of a line number, and often mentions files you have never opened. Engineers who are perfectly comfortable with C++ still lose afternoons to these, because nobody taught them that the linker only knows two things — what each object file defines and what each one needs — and therefore can only make two complaints.

This lesson reads both complaints in their real wording, gives you the two-command technique that finds the cause every time, and then removes most of the occasions for either by writing a Makefile. That last part is not a detour. Most undefined references in a beginner's week come from forgetting to put a file on the command line, and most multiple-definition errors that appear "out of nowhere" come from a stale object file. A build system fixes both by construction.

Every message below was produced on this toolchain — g++ 13.3.0, clang++ 18.1.3, GNU ld 2.42, GNU Make 4.3 — and copied from the terminal. The wording differs between compilers and between versions, which is exactly why you should read yours rather than a remembered one.

## The linker makes exactly two complaints

Lesson 01 gave you the model: each object file has a symbol table, `T` for what it defines and `U` for what it needs. Linking is matching. So:

- a `U` with no matching definition anywhere is **undefined reference**;
- two non-weak definitions of one symbol is **multiple definition**.

There is nothing else. Every linker error you will see this year is one of these two with different decoration.

Note who is speaking. Both messages below begin `/usr/bin/ld:` — the GNU linker, invoked by the driver. The last line differs by driver, and that is the only part of the message that tells you which compiler you ran:

```text
collect2: error: ld returned 1 exit status
```

is g++ 13.3.0, while clang++ 18.1.3 on the identical object files ends with

```text
clang++: error: linker command failed with exit code 1 (use -v to see invocation)
```

The complaint itself came from `ld` in both cases, so it is word-for-word the same. Do not expect clang to explain a link failure better than g++; on Linux they are usually the same program talking.

## Undefined reference

Take the telemetry program from lesson 02 and link `main.o` without `telem.o`:

```bash
g++ main.o -o telem_app
```

```text
/usr/bin/ld: main.o: in function `main':
main.cpp:(.text+0xb2): undefined reference to `mean_az(ImuSample const*, unsigned long)'
/usr/bin/ld: main.cpp:(.text+0xf0): undefined reference to `checksum(unsigned char const*, unsigned long)'
collect2: error: ld returned 1 exit status
```

Read it in four pieces.

- **`main.o: in function 'main'`** — which object file, and which function inside it, contains the unresolved use. This is the *caller*, never the missing thing.
- **`main.cpp:(.text+0xb2)`** — the offset into the text section where the call instruction sits. Not a line number.
- **`undefined reference to 'mean_az(ImuSample const*, unsigned long)'`** — the symbol, demangled for you by modern `ld`. Read the signature carefully; it is the whole diagnosis.
- **`collect2: error: ld returned 1 exit status`** — the driver reporting that the linker failed.

The signature is where the information is. `mean_az(ImuSample const*, unsigned long)` tells you the caller wants a function taking a pointer to `const ImuSample` and a `std::size_t` (which on this platform *is* `unsigned long`). If the definition you wrote takes a non-const pointer, that is a different function and a different symbol, and this message is what you get.

::: key
"Undefined reference to `f()`" means the compiler saw a declaration of `f` and accepted the call, but the linker found no definition in any object file or library. Either the `.cpp` was not compiled and linked, or the signature differs — including `const` and the namespace — or the library was not passed.
:::

### The four causes, and how to tell them apart

**1. The source file is not in the link.** The commonest by far, and the one the Makefile eliminates. You compiled `telem.cpp` yesterday, edited `main.cpp` today, and typed `g++ main.cpp -o app`.

**2. The signature does not match.** The declaration in the header and the definition in the source have drifted apart. This one is nasty because *both files compile*: the definition is a legal function, merely not the one anybody calls. Change `telem.cpp` to define `mean_az(ImuSample*, std::size_t)` — dropping one `const` — and g++ compiles it silently, then the link fails with the same message as before.

**3. The name is in the wrong namespace or class.** A header declares `namespace gnc { double clamp_throttle(double); }` and the source defines `double clamp_throttle(double)` at global scope. Two unrelated functions:

```text
/usr/bin/ld: ns/main.o: in function `main':
main.cpp:(.text+0x15): undefined reference to `gnc::clamp_throttle(double)'
```

**4. A library is missing, or comes too early on the command line.** A static archive is scanned once, in the order it appears, and the linker takes from it only the members that resolve symbols it is *currently* missing. Put the archive before the object that needs it and there is nothing outstanding yet, so it takes nothing:

```bash
g++ -L. -ltelem main.o -o app     # wrong: library scanned before the need arises
```

```text
/usr/bin/ld: main.o: in function `main':
main.cpp:(.text+0xb2): undefined reference to `mean_az(ImuSample const*, unsigned long)'
```

Put it after and the same command works:

```bash
g++ main.o -L. -ltelem -o app     # right: objects first, then the libraries they need
```

### The technique that settles it

Do not guess between the four. Ask the object files. `nm -C --undefined-only` lists what a file needs; `nm -C --defined-only` lists what a file supplies. Put them side by side and the cause is visible.

::: example Diagnosing a signature mismatch in two commands
`telem.cpp` was edited to take a non-const pointer. Both files compile; the link fails.

```bash
nm -C --defined-only telem.o
nm -C --undefined-only main.o
```

```text
0000000000000000 T mean_az(ImuSample*, unsigned long)
000000000000009f T checksum(unsigned char const*, unsigned long)
```

```text
                 U mean_az(ImuSample const*, unsigned long)
                 U checksum(unsigned char const*, unsigned long)
                 U __stack_chk_fail
                 U printf
```

`checksum` matches exactly and would have linked. `mean_az` does not: the definition takes `ImuSample*`, the use wants `ImuSample const*`. Now you know it is cause 2, not cause 1, and you know which of the two files to edit — and you knew it without reading either of them.

Note `__stack_chk_fail`, which you never wrote. It is the stack-protector check that Ubuntu's g++ enables by default; it resolves from the C runtime. Unfamiliar `U` entries are normal. Only the ones matching names you wrote are yours to fix.
:::

## Multiple definition

Now the other complaint. `limits.hpp` defines a small helper, without `inline`, and both `control.cpp` and `main.cpp` include it:

```cpp
// limits.hpp
#pragma once

// A helper defined in the header, with no inline.
float clamp_throttle(float cmd) {
    if (cmd < 0.0F) return 0.0F;
    if (cmd > 1.0F) return 1.0F;
    return cmd;
}
```

Both files compile without a single diagnostic. The link:

```text
/usr/bin/ld: main.o: in function `clamp_throttle(float)':
main.cpp:(.text+0x0): multiple definition of `clamp_throttle(float)';
control.o:control.cpp:(.text+0x0): first defined here
```

The message names both offenders, and the order is worth noticing: the file it complains about is the *second* one it saw, and "first defined here" points at the first. Neither is more wrong than the other.

Three causes and their fixes:

| Cause | Fix |
| --- | --- |
| A function body in a header, no `inline` | mark it `inline`, or move the body to one `.cpp` |
| A variable defined in a header (`int g_count;`) | `inline` it, or declare `extern` in the header and define it in one `.cpp` |
| The same function defined in two different `.cpp` files | delete one, or give the file-local one internal linkage with an anonymous namespace |

The third looks unlikely until two people independently write a `log_event` helper in their own source files. The linker is unambiguous about it:

```text
/usr/bin/ld: b.cpp:(.text+0x0): multiple definition of `log_event(int)';
a.cpp:(.text+0x0): first defined here
```

`inline` fixes the first two because it makes the definitions weak, as lesson 02 showed with `nm`: `W` instead of `T`, and the linker keeps one. An anonymous namespace fixes the third, by making each file's helper a private symbol that the linker never compares.

::: warning
A stale object file produces both errors for no visible reason. You rename a function, rebuild only the file you edited, and link against yesterday's `telem.o`, which still defines the old name — or still defines the new one twice because you also moved it. The source on disk is correct and the build is wrong. `make clean` is the reflex; a build system with real dependencies is the cure.
:::

## The Makefile

Everything above was typed by hand, which is how you learn what the tools do and not how you work. A Makefile is a list of rules: a *target*, the *prerequisites* it depends on, and the recipe to rebuild it. `make` rebuilds a target when any prerequisite is newer than it, and does nothing otherwise.

```make
CXX      := g++
CXXFLAGS := -std=c++20 -Wall -Wextra -Wpedantic -Werror -g -O2 -MMD -MP
OBJ      := main.o telem.o

telem_app: $(OBJ)
	$(CXX) $(OBJ) -o $@

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

-include $(OBJ:.o=.d)

clean:
	rm -f telem_app $(OBJ) $(OBJ:.o=.d)

.PHONY: clean
```

Line by line. `CXX` and `CXXFLAGS` are variables, by convention the ones every C++ Makefile uses. `telem_app: $(OBJ)` says the program depends on both object files, and the indented line below is how to build it: `$@` is the target being built. `%.o: %.cpp` is a pattern rule — any `.o` is built from the `.cpp` of the same name, where `$<` is the first prerequisite. `.PHONY` tells `make` that `clean` is a command, not a file to be produced.

::: warning
The indented recipe lines must begin with a **tab**, not spaces. GNU Make 4.3 says exactly this when they do not, and the message names neither tabs nor spaces:

```text
Makefile:2: *** missing separator.  Stop.
```

Configure your editor to keep literal tabs in Makefiles before you write your first one.
:::

### `-MMD -MP`: the two flags that matter most

The `%.o: %.cpp` rule says an object depends on its source. It says nothing about headers, and that is a real defect: edit `telem.hpp` and `make` will cheerfully tell you there is nothing to do, leaving `main.o` compiled against the old struct and `telem.o` against the new one. That is the silent ODR violation from lesson 02, manufactured by your own build system.

`-MMD` asks the compiler — which knows exactly which headers it read — to write a dependency file next to each object. `-MP` adds a harmless empty rule for each header so that deleting a header does not break the build. `main.d` after a build contains:

```text
main.o: main.cpp telem.hpp
telem.hpp:
```

That is a Makefile fragment, which the `-include` line pulls in. The leading dash means "do not fail if it is not there yet", which is the case on the very first build. From then on, `make` knows the real dependency graph. `-MMD` lists your headers but not system ones; `-MD` includes system headers too, which is rarely what you want.

::: example A Makefile session, start to finish

```bash
make
```

```text
g++ -std=c++20 -Wall -Wextra -Wpedantic -Werror -g -O2 -MMD -MP -c main.cpp -o main.o
g++ -std=c++20 -Wall -Wextra -Wpedantic -Werror -g -O2 -MMD -MP -c telem.cpp -o telem.o
g++ main.o telem.o -o telem_app
```

Run it again with nothing changed:

```text
make: 'telem_app' is up to date.
```

Now touch the header and run it again:

```bash
touch telem.hpp
make
```

```text
g++ -std=c++20 -Wall -Wextra -Wpedantic -Werror -g -O2 -MMD -MP -c main.cpp -o main.o
g++ -std=c++20 -Wall -Wextra -Wpedantic -Werror -g -O2 -MMD -MP -c telem.cpp -o telem.o
g++ main.o telem.o -o telem_app
```

Both objects rebuilt, because `main.d` and `telem.d` both list `telem.hpp`. Delete `-MMD -MP` from `CXXFLAGS`, rebuild from clean, then touch the header again, and the same command says:

```text
make: 'telem_app' is up to date.
```

The program still links and still runs, and `main.o` and `telem.o` now disagree about `struct ImuSample`. That is the failure mode those seven characters prevent.
:::

::: key
Build failures come in two flavours and one of them is not your code: an undefined reference means no definition was supplied, a multiple definition means more than one was. Everything else — signatures, namespaces, library order, stale objects — is a reason one of those two happened.
:::

## When the build is not yours: CMake

Real projects rarely hand-write Makefiles; they generate them. CMake is what you will meet most often, and the same program looks like this:

```cmake
cmake_minimum_required(VERSION 3.20)
project(telem CXX)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
add_executable(telem_app main.cpp telem.cpp)
target_compile_options(telem_app PRIVATE -Wall -Wextra -Wpedantic -Werror)
```

`cmake -S . -B build && cmake --build build` then produces exactly the compile and link commands you have been typing, with dependency tracking already switched on. You do not need CMake yet, and a later module covers it properly. What you need now is to recognise that it is a Makefile generator, so everything in this lesson still applies underneath it — and that `cmake --build build --verbose` shows you the real commands when something goes wrong.

## Check yourself

::: check
`undefined reference to 'gnc::integrate(State const&, double)'` — before opening any file, what three facts do you already know?
:::

::: answer
That the compile stage succeeded for every file in the link, so the error is not a syntax or type problem. That the missing function lives in namespace `gnc` and takes a reference to a `const State` and a `double` — so a definition spelled `integrate(State&, double)`, or one written outside `namespace gnc`, would not match. And that some translation unit contains a *declaration* of it, otherwise the call would have failed at compile time with "not declared in this scope" instead. So: look for a definition with that exact signature, and if one exists, ask why its object file is not in the link.
:::

::: check
A header declares `std::uint8_t checksum(const std::uint8_t* p, std::size_t n);` and a source defines `std::uint8_t checksum(std::uint8_t* p, std::size_t n)`. Which stage fails, with which message, and why does the source file compile at all?
:::

::: answer
The link fails with an undefined reference to `checksum(unsigned char const*, unsigned long)`. The source compiles because a function taking `std::uint8_t*` is a perfectly legal function — C++ allows overloading on parameter types, so the compiler sees a second, unrelated `checksum` and has no reason to object. The caller's translation unit emits a `U` for the const version, the defining translation unit emits a `T` for the non-const version, and the names do not match. Adding `#include "telem.hpp"` at the top of the defining source would have caught it at compile time, because then both would be in one translation unit and the compiler could see the mismatch.
:::

::: check
`multiple definition of 'kMaxSamples'` where `kMaxSamples` is declared in a header as `int kMaxSamples = 256;`. Give two fixes and say what each does to the symbol table.
:::

::: answer
The header defines a variable with external linkage, so every including translation unit emits a strong definition. Fix one: write `inline int kMaxSamples = 256;`, which makes every definition weak — `nm` shows a unique or weak symbol instead of `B`/`D` — and the linker keeps one, with one address shared by the program. Fix two: write `extern int kMaxSamples;` in the header and `int kMaxSamples = 256;` in exactly one `.cpp`, so the including files emit `U` and the one source emits the single definition. A third and usually better fix for a constant: `inline constexpr int kMaxSamples = 256;`, which also lets it be used as an array bound.
:::

::: check
Why does putting a library before the object files that need it fail on Linux, when putting it after works — given that both commands list the same files?
:::

::: answer
Because the linker processes its arguments left to right and takes members from a static archive only to satisfy symbols that are *undefined at the moment it reaches the archive*. With the archive first, nothing is outstanding yet, so the linker extracts nothing from it and moves on; when `main.o` arrives and declares that it needs `mean_az`, the archive has already been passed and is not reconsidered. Object files are different — every object on the command line is always included in full — which is why order among them does not matter. The rule to remember: objects first, then libraries, and among libraries, a library before the ones it depends on.
:::

::: check
Your Makefile has no `-MMD -MP`. You add a field to a struct in a shared header, run `make`, get "up to date", and run the program, which prints plausible but wrong telemetry. Explain the whole chain.
:::

::: answer
`make` compares timestamps against the prerequisites it knows about, and without generated dependency files the only prerequisite of `main.o` is `main.cpp`, which you did not touch. So no object is rebuilt. The object compiled before your edit still uses the old struct layout — old size, old member offsets — while any object you did rebuild uses the new one. The program links, because a type produces no symbol and the linker has nothing to compare, and then one side writes a field where the other expects a different one. That is the one-definition rule violated by the build system rather than by the source, and it produces exactly the kind of plausible-but-wrong number that costs a week. `-MMD -MP` makes the compiler record the headers it actually read, so `make` rebuilds everything that saw the edited header.
:::

## Summary

| Message | Meaning | Usual causes |
| --- | --- | --- |
| `undefined reference to 'f(args)'` | some object needs `f`, no object or library defines it | file not in the link; signature mismatch; wrong namespace; library missing or too early |
| `multiple definition of 'f(args)'` | two non-weak definitions of one symbol | function body in a header without `inline`; variable defined in a header; same function in two sources |
| `nm -C --undefined-only x.o` | what this object needs | compare against... |
| `nm -C --defined-only y.o` | what this object supplies | ...to see which of the four causes applies |
| `collect2: error: ld returned 1 exit status` | g++ reporting that `ld` failed | the wording that identifies the driver |
| `$@`, `$<` | the target, the first prerequisite | Makefile automatic variables |
| `-MMD -MP` | compiler writes header dependencies into `.d` files | without them, editing a header rebuilds nothing |
| `Makefile:2: *** missing separator` | a recipe line starts with spaces | recipes need a literal tab |

Lesson 04 leaves the build behind and starts on the language: which integer types exist, how wide they are, and how to pick one for a field that will be transmitted to the ground.
