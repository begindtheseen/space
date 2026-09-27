---
id: l03-reading-linker-errors-and-make
title: Reading a linker error, and a Makefile that prevents them
minutes: 21
covers:
  - 'Reading a linker error: undefined reference, multiple definition'
---

Picture a school play. Every actor has a script, and every script has cues: "when Sam says *the door is locked*, you walk in". On the night, the stage manager checks that every cue has exactly one actor answering it. If a cue has nobody, the scene stops dead. If two actors both walk in on the same cue, the scene stops too. Those are the only two things that can go wrong with cues.

The linker is that stage manager. A compiler error points at a line of your source and usually says something close to what is wrong. A linker error does neither. It names a symbol you did not write, gives a byte offset instead of a line number, and mentions files you have never opened. Engineers who are comfortable with C++ still lose afternoons to these, because nobody told them that the linker knows only two things — what each object file defines and what each one needs — and so can only make two complaints.

This lesson reads both complaints in their real wording and gives you a two-command technique that finds the cause every time. Then it removes most of the reasons for either by writing a **Makefile**. That last part is not a detour. Most undefined references in a beginner's week come from forgetting a file on the command line, and most multiple definitions that appear "out of nowhere" come from a stale object file. A build system fixes both by design. Every message below came from g++ 13.3.0, clang++ 18.1.3, GNU ld 2.42 and GNU Make 4.3. Wording differs between versions, which is exactly why you should read yours rather than one you remember.

## The linker makes exactly two complaints

Lesson 01 gave you the model. Each object file has a symbol table: `T` for what it defines, `U` for what it needs. Linking is matching. So:

- a `U` with no matching definition anywhere is an **undefined reference**;
- two ordinary (non-weak) definitions of one symbol is a **multiple definition**.

There is nothing else. Every linker error you meet this year is one of these two, with different decoration.

Notice who is talking. Both messages below begin `/usr/bin/ld:`, the GNU linker, run by the driver. Only the last line differs by driver. This last line is g++ 13.3.0, reporting through a helper called **[[collect2|collect2]]**:

```text
collect2: error: ld returned 1 exit status
```

clang++ 18.1.3, given the identical object files, ends like this instead:

```text
clang++: error: linker command failed with exit code 1 (use -v to see invocation)
```

The complaint above that line came from `ld` in both cases, so it is word for word the same. Do not expect clang to explain a link failure better than g++. On Linux they are usually the same program talking.

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

- **`main.o: in function 'main'`** — which object file, and which function inside it, *uses* the missing thing. This is always the caller, never the missing thing itself.
- **`main.cpp:(.text+0xb2)`** — a **[[byte offset|text-offset]]** into the code section, where the call instruction sits. It is not a line number.
- **`undefined reference to 'mean_az(ImuSample const*, unsigned long)'`** — the symbol, already turned back into readable C++ for you. Read the signature carefully. It is the whole diagnosis.
- **`collect2: error: ld returned 1 exit status`** — the driver reporting that the linker failed.

The signature carries the information. `mean_az(ImuSample const*, unsigned long)` says the caller wants a function taking a pointer to a `const ImuSample` and a `std::size_t`, which on this platform is **[[unsigned long|size-t-unsigned-long]]**. (Read `ImuSample const*` as "pointer to const ImuSample"; it means the same as `const ImuSample*`.) If the definition you wrote takes a pointer without `const`, that is a different function with a different symbol, and this message is what you get.

::: key
What does "undefined reference to f()" actually mean? The compiler saw a declaration of f and accepted the call, but the linker found no definition in any object file or library. Either the .cpp was not compiled and linked, the signature differs (including const or namespace), or the library was not passed.
:::

### The four causes, and how to tell them apart

**1. The source file is not in the link.** By far the most common, and the one a Makefile removes. You compiled `telem.cpp` yesterday, edited `main.cpp` today, and typed `g++ main.cpp -o app`.

**2. The signature does not match.** The header's declaration and the source's definition have drifted apart. This one is nasty because *both files compile*. Change `telem.cpp` to define `mean_az(ImuSample*, std::size_t)` — one `const` dropped — and g++ compiles it without a word, even with the header included, because the new function is a legal overload. Then the link fails with the same message as above.

**3. The name is in the wrong namespace or class.** A **namespace** is a named family of names, written `gnc::` in front. A header declares `namespace gnc { double clamp_throttle(double); }`, but the source defines `double clamp_throttle(double)` outside any namespace. Those are two unrelated functions:

```text
/usr/bin/ld: main.o: in function `main':
main.cpp:(.text+0x15): undefined reference to `gnc::clamp_throttle(double)'
```

**4. A library is missing, or comes too early on the command line.** A **[[static library|static-archive]]** (a `.a` file) is a bundle of object files. The linker reads its arguments from left to right. When it reaches a library, it takes out only the members that supply symbols it is *currently* missing, and it never goes back. Put the library before the object that needs it, and nothing is missing yet, so it takes nothing. (`-L.` means "also look for libraries in this folder", and `-ltelem` means "use the library `libtelem.a`".)

```bash
g++ -L. -ltelem main.o -o app     # wrong: library scanned before the need arises
```

```text
/usr/bin/ld: main.o: in function `main':
main.cpp:(.text+0xb2): undefined reference to `mean_az(ImuSample const*, unsigned long)'
```

Put it after, and the same files link:

```bash
g++ main.o -L. -ltelem -o app     # right: objects first, then the libraries they need
```

### The technique that settles it

Do not guess among the four. Ask the object files. `nm -C --undefined-only` lists what a file needs, and `nm -C --defined-only` lists what a file supplies. Put the two lists side by side and the cause is visible.

::: example Diagnosing a signature mismatch in two commands
`telem.cpp` was edited so `mean_az` takes a pointer without `const`. Both files compile. The link fails. Ask each object file what it has:

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

Compare line by line.

1. `checksum`: supplied as `(unsigned char const*, unsigned long)`, needed as exactly that. It matches, and would have linked.
2. `mean_az`: supplied as taking `ImuSample*`, needed as taking `ImuSample const*`. One word differs, so these are different symbols.

So it is cause 2, not cause 1, and you know which file to edit — without reading either source file.

What about `__stack_chk_fail`? You never wrote it. It belongs to the **[[stack protector|stack-protector]]** that Ubuntu's g++ switches on by default, and the C runtime supplies it. Unfamiliar `U` entries are normal. Only the ones matching names you wrote are yours to fix.
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

Both files compile without a single warning. The link:

```text
/usr/bin/ld: main.o: in function `clamp_throttle(float)':
main.cpp:(.text+0x0): multiple definition of `clamp_throttle(float)'; control.o:control.cpp:(.text+0x0): first defined here
collect2: error: ld returned 1 exit status
```

The message names both files. The order is worth noticing: the file it complains about is the *second* one it read, and "first defined here" points at the first. Neither is more wrong than the other.

Three causes, and their fixes:

| Cause | Fix |
| --- | --- |
| A function body in a header, no `inline` | mark it `inline`, or move the body to one `.cpp` |
| A variable defined in a header (`int g_count;`) | `inline` it, or declare `extern` in the header and define it in one `.cpp` |
| The same function defined in two different `.cpp` files | delete one, or make the file-local one private with an anonymous namespace |

The third looks unlikely until two people each write a `log_event` helper in their own source files. The linker is blunt about it:

```text
/usr/bin/ld: b.o: in function `log_event(int)':
b.cpp:(.text+0x0): multiple definition of `log_event(int)'; a.o:a.cpp:(.text+0x0): first defined here
```

`inline` fixes the first two because it makes the definitions weak, as lesson 02 showed with `nm`: `W` instead of `T`, and the linker keeps one. An anonymous namespace fixes the third, by making each file's helper a local symbol that the linker never compares.

Here is a question worth asking every time. When you see "multiple definition" for a function you wrote once, ask: *how many object files contain that body?* If the body is in a header, the answer is "every file that includes it".

::: warning
A stale object file — one built from an older version of the source — can produce either error for no visible reason. You rename a function, rebuild only the file you edited, and link against yesterday's `telem.o`, which still defines the old name. The source on disk is correct and the build is wrong. `make clean` is the quick reflex. A build system that tracks real dependencies is the cure.
:::

## The Makefile

Everything so far was typed by hand. That is how you learn what the tools do, not how you work. A **Makefile** is a list of rules. Each rule names a **target** (a file to make), its **prerequisites** (the files it is made from), and a **recipe** (the commands that make it). The program `make` rebuilds a target when any prerequisite is newer than it, and does nothing otherwise — like rebaking a cake only if one of the ingredients changed since you last baked it.

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

Go through it a piece at a time.

- `CXX`, `CXXFLAGS` and `OBJ` are variables. `$(OBJ)` reads as "the value of OBJ". `CXX` and `CXXFLAGS` are the names every C++ Makefile uses.
- `telem_app: $(OBJ)` says the program depends on both object files. The indented line below it is the recipe. `$@` (read "dollar at") means "the target being built".
- `%.o: %.cpp` is a **pattern rule**: any `.o` is built from the `.cpp` with the same name. `$<` (read "dollar less-than") means "the first prerequisite", here the `.cpp`.
- `$(OBJ:.o=.d)` means "the list `OBJ` with each `.o` swapped for `.d`", so `main.d telem.d`. The next section explains those files.
- `.PHONY: clean` says `clean` is a **[[phony|phony]]** target — a command, not a file to be made.

::: warning
Recipe lines must begin with a **[[tab|make-tab]]** character, not spaces. When they do not, GNU Make 4.3 says this, and the message mentions neither tabs nor spaces:

```text
Makefile:2: *** missing separator.  Stop.
```

Set your editor to keep real tabs in Makefiles before you write your first one.
:::

### `-MMD -MP`: the two flags that matter most

The `%.o: %.cpp` rule says an object depends on its source. It says nothing about headers, and that is a real defect. Edit `telem.hpp`, and `make` will happily tell you there is nothing to do. `main.o` stays compiled against the old struct while any rebuilt object uses the new one. That is lesson 02's silent ODR violation, made by your own build system.

`-MMD` asks the compiler — which knows exactly which headers it read — to write a **dependency file** next to each object. `-MP` adds an empty rule for each header, so that deleting a header later does not break the build. After a build, `main.d` contains:

```text
main.o: main.cpp telem.hpp
telem.hpp:
```

That is itself a small Makefile, and the `-include` line pulls it in. The leading dash means "do not fail if the file is not there yet", which is true on the very first build. From then on, `make` knows the real **[[dependency graph|dependency-graph]]**. `-MMD` lists your own headers but not system ones. `-MD` includes the system headers too, which is rarely what you want.

::: example A Makefile session, start to finish
Start from a clean folder and build:

```bash
make
```

```text
g++ -std=c++20 -Wall -Wextra -Wpedantic -Werror -g -O2 -MMD -MP -c main.cpp -o main.o
g++ -std=c++20 -Wall -Wextra -Wpedantic -Werror -g -O2 -MMD -MP -c telem.cpp -o telem.o
g++ main.o telem.o -o telem_app
```

Three commands: compile each source, then link. Run `make` again with nothing changed:

```text
make: 'telem_app' is up to date.
```

Every target is newer than its prerequisites, so there is nothing to do. Now change the header's timestamp (`touch` marks a file as just modified) and run it again:

```bash
touch telem.hpp
make
```

```text
g++ -std=c++20 -Wall -Wextra -Wpedantic -Werror -g -O2 -MMD -MP -c main.cpp -o main.o
g++ -std=c++20 -Wall -Wextra -Wpedantic -Werror -g -O2 -MMD -MP -c telem.cpp -o telem.o
g++ main.o telem.o -o telem_app
```

Both objects were rebuilt, because `main.d` and `telem.d` both list `telem.hpp`. That is the right answer: both files read that header.

Now the control experiment. Delete `-MMD -MP` from `CXXFLAGS`, run `make clean` and `make`, then touch the header again:

```text
make: 'telem_app' is up to date.
```

The program still links and runs. But if that header change had been a new struct field, `main.o` and `telem.o` would now disagree about `struct ImuSample`. That is the failure those two flags prevent.
:::

::: key
Build failures of this kind come in two flavors: an undefined reference means no definition was supplied, and a multiple definition means more than one was. Everything else — signatures, namespaces, library order, stale objects — is a reason one of those two happened.
:::

## When the build is not yours: CMake

Real projects rarely write Makefiles by hand. They generate them. **[[CMake|cmake-generators]]** is the generator you will meet most often, and the same program looks like this:

```cmake
cmake_minimum_required(VERSION 3.20)
project(telem CXX)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
add_executable(telem_app main.cpp telem.cpp)
target_compile_options(telem_app PRIVATE -Wall -Wextra -Wpedantic -Werror)
```

`cmake -S . -B build` writes the build files into a folder called `build`, and `cmake --build build` runs them. You get the same compile and link commands you have been typing, with dependency tracking already switched on. `CMAKE_CXX_EXTENSIONS OFF` matters: without it, CMake 3.28 passes `-std=gnu++20` rather than `-std=c++20`.

You do not need CMake yet, and a later module covers it properly. What you need now is to know it is a Makefile generator, so everything in this lesson still applies underneath. When something goes wrong, `cmake --build build --verbose` shows you the real commands.

## Check yourself

::: check
The message is `undefined reference to 'gnc::integrate(State const&, double)'`. Before opening any file, what three facts do you already know?
:::

::: answer
First, every file in the link compiled, so this is not a syntax or type problem.

Second, the missing function lives in namespace `gnc` and takes a reference to a `const State` and a `double`. So a definition spelled `integrate(State&, double)`, or one written outside `namespace gnc`, would not match.

Third, some translation unit contains a *declaration* of it — otherwise the call would have failed earlier, at compile time, with "not declared in this scope".

So: look for a definition with exactly that signature. If one exists, ask why its object file is not in the link.
:::

::: check
A header declares `std::uint8_t checksum(const std::uint8_t* p, std::size_t n);` and a source defines `std::uint8_t checksum(std::uint8_t* p, std::size_t n)`. Which stage fails, with which message, and why does the source file compile at all — even if it includes the header?
:::

::: answer
The link fails, with an undefined reference to `checksum(unsigned char const*, unsigned long)`.

The source compiles because a function taking `std::uint8_t*` is a perfectly legal function. C++ allows overloading on parameter types, so even with the header included, the compiler sees two different `checksum` functions — one declared, one defined — and has no reason to object. The caller's object file then holds a `U` for the `const` version, the defining object file holds a `T` for the non-`const` version, and the names do not match.

The compiler can catch it if you ask: with `-Wmissing-declarations`, g++ warns that the non-`const` `checksum` was defined with no previous declaration, which points straight at the dropped `const`.
:::

::: check
The linker reports `multiple definition of 'kMaxSamples'`, and a header contains `int kMaxSamples = 256;`. Give two fixes and say what each does to the symbol tables.
:::

::: answer
The header *defines* a variable the linker can see, so every including translation unit emits its own definition — `nm` shows `D kMaxSamples` in each one.

Fix one: write `inline int kMaxSamples = 256;`. Each object file now marks it as a shared "unique" symbol (`nm` shows a lowercase `u`), and the linker keeps one, with one address for the whole program.

Fix two: write `extern int kMaxSamples;` in the header and `int kMaxSamples = 256;` in exactly one `.cpp`. The including files now show `U kMaxSamples`, and the one source shows the single `D` definition.

For a value that never changes, the best fix is usually a third: `inline constexpr int kMaxSamples = 256;`, which can also be used as an array size.
:::

::: check
Why does putting a library before the object files that need it fail on Linux, when putting it after works — even though both commands list the same files?
:::

::: answer
The linker reads its arguments from left to right. From a static library it takes only the members that supply symbols missing *at the moment it reaches the library*.

With the library first, nothing is missing yet, so nothing is taken, and the linker moves on. When `main.o` arrives needing `mean_az`, the library has already been passed and is not read again.

Object files are different: every object file on the command line is always included whole, which is why their order among themselves does not matter. The rule to remember: object files first, then libraries, and a library before any library it depends on.
:::

::: check
Your Makefile has no `-MMD -MP`. You add a field to a struct in a shared header, run `make`, get "up to date", run the program, and it prints plausible but wrong telemetry. Explain the whole chain.
:::

::: answer
`make` compares timestamps against the prerequisites it knows about. Without dependency files, the only prerequisite of `main.o` is `main.cpp`, which you did not touch. So nothing is rebuilt.

Any object compiled before your edit still uses the old struct layout — old size, old positions for each field — while anything rebuilt later uses the new one. The program links, because a type produces no symbol and the linker has nothing to compare. Then one side writes a field where the other expects a different one.

That is the one-definition rule broken by the build system rather than by the source, and it produces exactly the plausible-but-wrong number that costs a week. `-MMD -MP` makes the compiler record every header it read, so `make` rebuilds everything that saw the edited header.
:::

## Summary

| Message or tool | Meaning | Usual causes or use |
| --- | --- | --- |
| `undefined reference to 'f(args)'` | some object needs `f`; no object or library defines it | file not in the link; signature mismatch; wrong namespace; library missing or too early |
| `multiple definition of 'f(args)'` | two non-weak definitions of one symbol | function body in a header without `inline`; variable defined in a header; same function in two sources |
| `nm -C --undefined-only x.o` | what this object needs | compare against the next line |
| `nm -C --defined-only y.o` | what this object supplies | shows which of the four causes applies |
| `collect2: error: ld returned 1 exit status` | g++ reporting that `ld` failed | the line that names the driver |
| `$@`, `$<` | the target, the first prerequisite | Makefile automatic variables |
| `-MMD -MP` | compiler writes header dependencies into `.d` files | without them, editing a header rebuilds nothing |
| `Makefile:2: *** missing separator` | a recipe line starts with spaces | recipes need a real tab |

Lesson 04 leaves the build behind and starts on the language itself: which integer types exist, how wide they are, and how to pick one for a field that will be sent to the ground.

::: context collect2 The helper in the middle
When g++ links, it does not start `ld` directly. It starts `collect2`, a small GCC program that then runs `ld`. The name comes from its original job: on some older systems it *collected* the list of constructor functions that had to run before `main`, and built a table of them. On Linux that job is done differently now, and `collect2` mostly passes everything straight through. Its one lasting habit is printing that last line whenever the linker fails.
:::

::: context text-offset From an offset back to a line
`.text+0xb2` means "0xb2 bytes (178 in decimal) into this object file's code". It is precise, just not human-friendly. Two tricks turn it into a line number. Build with `-g`, and `ld` does it for you: the message becomes `main.cpp:12:(.text+0xb2): undefined reference to ...`. Or ask afterward with `addr2line -e main.o -f -C 0xb2`, which prints the function, `main`, and `main.cpp:12` — the `printf` line that calls `mean_az`. Both rely on the debug information from lesson 01.
:::

::: context size-t-unsigned-long Why size_t shows up as unsigned long
`std::size_t` is not a separate type. It is another name for whichever unsigned integer type the platform uses for sizes. On 64-bit Linux, where `long` is 64 bits, that is `unsigned long`. Names are mangled using the real type, so the linker only ever sees `unsigned long`. On 64-bit Windows, where `long` is 32 bits, the same declaration would show `unsigned long long`. Lesson 04 treats these widths properly.
:::

::: context static-archive A library is a bag of object files
A static library is made with `ar rcs libtelem.a telem.o`: an archive of object files with an index of what each one defines. The linker scans the command line once, left to right, keeping a list of missing symbols.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="16" font-size="11" fill="#b4232c">wrong order: -ltelem main.o</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="10" y="24" width="100" height="26" fill="#f2b880" stroke="#1f2a44"/>
    <text x="60" y="41">libtelem.a</text>
    <rect x="150" y="24" width="80" height="26" fill="#fff" stroke="#1f2a44"/>
    <text x="190" y="41">main.o</text>
  </g>
  <line x1="110" y1="37" x2="144" y2="37" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="150,37 142,33 142,41" fill="#6c7a93"/>
  <text x="240" y="34" font-size="11" fill="#1f2a44">missing list was</text>
  <text x="240" y="48" font-size="11" fill="#1f2a44">empty at the library</text>
  <text x="10" y="84" font-size="11" fill="#1d6fd1">right order: main.o -ltelem</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="10" y="92" width="80" height="26" fill="#fff" stroke="#1f2a44"/>
    <text x="50" y="109">main.o</text>
    <rect x="130" y="92" width="100" height="26" fill="#f2b880" stroke="#1f2a44"/>
    <text x="180" y="109">libtelem.a</text>
  </g>
  <line x1="90" y1="105" x2="124" y2="105" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="130,105 122,101 122,109" fill="#1d6fd1"/>
  <text x="240" y="102" font-size="11" fill="#1f2a44">needs mean_az:</text>
  <text x="240" y="116" font-size="11" fill="#1f2a44">telem.o taken out</text>
  <text x="10" y="142" font-size="11" fill="#6c7a93">the linker reads left to right and never goes back</text>
</svg>
```
:::

::: context stack-protector A tripwire on the stack
The stack protector places a secret value, a **canary**, between a function's local arrays and the address it will return to. Just before returning, the function checks the canary. If a runaway write has overwritten it, the program calls `__stack_chk_fail` and stops at once, instead of jumping to a corrupted address. Ubuntu's compilers switch it on by default for functions with local arrays — `main` has two here. The name comes from the canaries coal miners once carried to warn them of bad air.
:::

::: context phony Targets that are not files
`make` assumes every target is a file. Without `.PHONY: clean`, creating a file that happens to be named `clean` would make `make clean` say "'clean' is up to date" and delete nothing, since the file exists and has no prerequisites. Declaring it phony tells `make` to run the recipe every time it is asked. Other common phony targets are `all`, `test` and `install`.
:::

::: context make-tab Why a tab, of all things
`make` was written by Stuart Feldman at Bell Labs in 1976. He later explained that he chose the tab to mark recipe lines, realized within weeks that it was a poor choice, and kept it anyway because a dozen or so people were already using the program and he did not want to break their files. Decades and millions of users later, the tab remains. GNU Make does let you pick a different character with the `.RECIPEPREFIX` variable, but almost nobody does.
:::

::: context dependency-graph What make is really reading
With the `.d` files included, `make` knows this graph. It walks it from the bottom up and rebuilds anything older than something it points to.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="130" y="10" width="100" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="180" y="27">telem_app</text>
    <rect x="50" y="70" width="90" height="26" rx="4" fill="#fff" stroke="#1f2a44"/>
    <text x="95" y="87">main.o</text>
    <rect x="220" y="70" width="90" height="26" rx="4" fill="#fff" stroke="#1f2a44"/>
    <text x="265" y="87">telem.o</text>
    <rect x="10" y="130" width="90" height="26" rx="4" fill="#fff" stroke="#1f2a44"/>
    <text x="55" y="147">main.cpp</text>
    <rect x="135" y="130" width="90" height="26" rx="4" fill="#f2b880" stroke="#1f2a44"/>
    <text x="180" y="147">telem.hpp</text>
    <rect x="260" y="130" width="90" height="26" rx="4" fill="#fff" stroke="#1f2a44"/>
    <text x="305" y="147">telem.cpp</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="95" y1="70" x2="160" y2="36"/><line x1="265" y1="70" x2="200" y2="36"/>
    <line x1="55" y1="130" x2="85" y2="96"/><line x1="305" y1="130" x2="275" y2="96"/>
  </g>
  <g stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3">
    <line x1="170" y1="130" x2="110" y2="96"/><line x1="190" y1="130" x2="250" y2="96"/>
  </g>
  <text x="180" y="172" font-size="11" fill="#b4232c" text-anchor="middle">red dashed: from .d files</text>
</svg>
```

Without `-MMD -MP` the two red dashed lines are missing, so touching `telem.hpp` rebuilds nothing.
:::

::: context cmake-generators One description, many build tools
CMake does not build anything itself. It reads `CMakeLists.txt` and writes files for another tool: Makefiles by default on Linux, or files for **Ninja**, a faster build tool, if you add `-G Ninja`, or project files for IDEs such as Visual Studio. The same description works on every machine and compiler, which is why large projects, including many flight software and ground systems, use it. Under all of them, the commands that finally run are the `g++ -c` and link lines you have now typed by hand.
:::
