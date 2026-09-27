---
id: l07-modules-and-coroutines
title: Modules and coroutines, and why flight code waits
minutes: 24
covers:
  - Why modules adoption is slow and what it will change
  - Why coroutines are rare in flight code
---

Imagine a country switching to a new, safer electrical plug. The plug is the easy part. Every wall socket, every lamp, every phone charger, every hotel and every factory has to change too, and for years the old and the new have to live side by side. The better idea arrives slowly, not because it is bad, but because it touches everything.

Now picture a bookmark. You stop mid-chapter, do something else, and later open the book at exactly the right line. The bookmark is tiny, but it has to live somewhere.

C++20 added two features that match these pictures. **Modules** are the new plug: a better way for one file to use code from another, which needs every compiler, build tool and library to change with it. **Coroutines** are the bookmark: functions that can stop part-way and carry on later. Lesson 06 named both in its tour of C++20. This lesson compiles real examples of each and explains why neither is common yet in flight software.

## Headers: copy and paste, every time

Start with what modules replace. Since the basics module you have written `#include <vector>`. That line is handled by the **[[preprocessor|preprocessor]]** — a text-processing step that runs before the real compiler. It finds the file named `vector` and pastes its whole text into your file, as if you had typed it. This is called **textual inclusion**: the header is not compiled on its own, it is copied into every file that asks for it.

How much text is that? You can ask g++ to stop after the preprocessor with `g++ -E` and count the lines it would hand to the compiler. With g++ 13 and `-std=c++20`:

| One line in your file | Lines the compiler really reads |
| --- | --- |
| `#include <cstdio>` | 432 |
| `#include <vector>` | 19,333 |
| `#include <iostream>` | 29,683 |
| `#include <format>` | 39,340 |

A file with `<vector>`, `<string>`, `<map>`, `<format>` and `<iostream>` and an empty `main` comes to 48,529 lines. On one machine it took about 0.6 s to compile, against about 0.02 s with no includes. Times vary, but almost all the work was reading the library — and every `.cpp` file that includes it reads it again, producing the same result each time.

Pasting text also means everything leaks:

- A **macro** — a `#define` name the preprocessor replaces with text — defined in one header changes the meaning of every header pasted after it. The order of your `#include` lines can matter.
- Each header needs **[[include guards|include-guards]]** so that pasting it twice does no harm.
- Every helper a header declares, even a private one, is visible to every includer.

## Modules: compile the interface once

A module turns this around: the interface is compiled once into a summary, and other files read the summary instead of re-pasting text. Two pieces of syntax do it. `export module units;`, read "export module units", starts a **module interface unit** — a source file that says "I am the module called `units`". Inside it, `export` in front of a declaration makes that declaration visible to users. Anything without `export` stays private to the module. In another file, `import units;`, read "import units", makes the exported names available. There is no `#` in front: `import` is part of the language, not a preprocessor command.

When the compiler builds a module interface unit, it writes a **BMI** — a **built module interface**, a binary file holding the compiled summary of everything exported. Each compiler has its own format: g++ writes `.gcm` files into a folder called `gcm.cache`, clang writes `.pcm` files, and Microsoft's compiler writes `.ifc` files.

::: example Building a tiny module with g++ 13
Here is a module with one exported function and one private helper, in a file `units.cppm`:

```cpp
export module units;

export constexpr double deg_to_rad(double deg) {
    return deg * 3.14159265358979323846 / 180.0;
}

double helper_not_exported(double x) { return x * 2.0; }
```

And a program that uses it, in `main.cpp`:

```cpp
#include <cstdio>
import units;

int main() {
    std::printf("90 deg = %.6f rad\n", deg_to_rad(90.0));
}
```

g++ 13 supports modules only behind the flag `-fmodules-ts` ("modules technical specification", a name left over from before C++20). First, try compiling `main.cpp` on its own, the way you would compile any `.cpp` file:

```text
$ g++ -std=c++20 -fmodules-ts -Wall -Wextra -O2 -c main.cpp
In module imported at main.cpp:2:1:
units: error: failed to read compiled module: No such file or directory
units: note: compiled module file is 'gcm.cache/units.gcm'
units: note: imports must be built before being imported
units: fatal error: returning to the gate for a mechanical issue
```

(Yes, that last line is really what g++ prints.) The message is the whole story of this section: *imports must be built before being imported*. `main.cpp` cannot be compiled until `units.gcm` exists.

So build the module first. The `-x c++` tells g++ to treat the `.cppm` file as C++:

```text
$ g++ -std=c++20 -fmodules-ts -Wall -Wextra -O2 -x c++ -c units.cppm
$ g++ -std=c++20 -fmodules-ts -Wall -Wextra -O2 -c main.cpp
$ g++ main.o units.o -o app
$ ./app
90 deg = 1.570796 rad
```

The first command wrote `units.o` (machine code, 1,328 bytes) and `gcm.cache/units.gcm` (the BMI, 2,000 bytes). The second read the BMI. The third linked, as with ordinary files.

Now try to call the private helper from `main`:

```text
error: 'helper_not_exported' was not declared in this scope
```

The helper exists in `units.o`, but no one outside the module can name it.

Sanity check: $90^\circ$ is a quarter turn, and a quarter turn is $\pi/2 \approx 1.570796$ radians. The number is right, and it came across the module boundary.
:::

::: key
`export module name;` starts a module interface; `export` marks what users may see; `import name;` uses it. Compiling the interface produces a **BMI** (built module interface), a compiler-specific binary. A file that imports a module cannot be compiled until that module's BMI exists.
:::

What does this buy, once it works everywhere?

- **Build time.** Importers read a compact summary, compiled once, instead of tens of thousands of lines of text.
- **Isolation.** Macros do not leak into or out of a module, and the order of `import` lines does not matter.
- **A real public interface.** Only what is exported can be named, so a private helper cannot be called by accident.

## Why adoption is slow

The example shows the catch. With headers, every `.cpp` file compiles on its own, in any order, in parallel. With modules, files need each other's compiled output, so the build system must discover the right order. It cannot guess it from file names: `import units;` could be satisfied by a file with any name. So before compiling anything, the build tool must run a **dependency scan**: read every source file, find each `export module` and `import` line, and draw the graph of who needs whom. The compilers and build tools agreed on a shared file format for reporting what a scan finds, written up in a committee paper numbered **[[P1689|p1689]]**.

Support is still uneven. CMake 3.28 is the first release whose documentation calls module scanning supported rather than experimental. It lists the compilers it can scan with — MSVC toolset 14.34 and newer, Clang 16 and newer, GCC 14 and newer — and only the Ninja and Visual Studio 2022 generators. Here is what CMake 3.28 does with g++ 13, given the same two files and a short `CMakeLists.txt` naming `units.cppm` as a module source:

```text
$ CXX=g++ cmake -S . -B build-gcc -G Ninja
CMake Error in CMakeLists.txt:
  The target named "app" has C++ sources that may use modules, but the
  compiler does not provide a way to discover the import graph dependencies.
```

With clang 18 the same project configures and builds, and you can watch the extra steps:

```text
[1/6] Scanning units.cppm for CXX dependencies
[2/6] Scanning main.cpp for CXX dependencies
[3/6] Generating CXX dyndep file CMakeFiles/app.dir/CXX.dd
[4/6] Building CXX object CMakeFiles/app.dir/units.cppm.o
[5/6] Building CXX object CMakeFiles/app.dir/main.cpp.o
[6/6] Linking CXX executable app
```

Two scans, a step that records the order, then the compiles — module first.

The second problem is that **BMIs are not portable**. A BMI belongs to one compiler, often to one version of it, and can depend on the flags used. Hand g++'s `units.gcm` to clang and it refuses:

```text
fatal error: file 'gcm.cache/units.gcm' is not a valid precompiled module file
```

So a library cannot ship "the compiled module". It ships the interface source, and every user's build compiles its own BMI. Package managers, IDEs and static analysers all have to learn this too.

The third problem is the standard library itself. C++23 adds **`import std;`**, read "import std", which imports the whole standard library as one module. It should be the biggest win of all. Neither toolchain here has it: g++ 13 with `-std=c++23 -fmodules-ts` answers `failed to read compiled module` for `std`, and clang 18 with the libstdc++ 13 library says `module 'std' not found`. The CMake 3.28 documentation also lists "no builtin support for `import std;`" under its known limitations.

::: key
Why module adoption is slow: modules change the build model. Every build system, compiler and dependency in the chain has to support them and agree on how compiled module interfaces (BMIs) are produced and found. The benefit is real but the migration is ecosystem-wide.
:::

For flight software, add one more delay. Flight projects [[pin their compiler|pinned-toolchain]] and change it rarely, because a new compiler means re-running verification on the whole program. A team will not move to modules until its pinned compiler, build system, static analysis tools and coding standard all agree. So for years yet, the flight code you meet will use headers; lesson 09, on the flight subset, takes that for granted.

::: warning
"Compiled once" does not mean "faster in every build". Importers wait for their module's BMI, so a long chain of modules can reduce how many files compile in parallel. Measure your own build before promising a speed-up.
:::

## Coroutines: a function with a bookmark

Back to the bookmark. An ordinary function runs from its first line to its `return` without stopping. Its locals live in its **stack frame** — a slice of the call stack, created at the call and thrown away at the return, as the memory module's lesson on the stack drew it.

A **[[coroutine|coroutine-name]]** is a function that can **suspend** — stop part-way and hand control back to its caller — and later **resume** from exactly that point, with all its local variables as they were. The locals must survive the pause, so they cannot live in a stack frame that is gone once control returns to the caller. They live instead in the **[[coroutine frame|coroutine-frame]]**: a block of memory holding the parameters, the locals, and a note of where to resume.

C++20 makes a function a coroutine if its body uses any of three keywords:

- `co_await x` — read "co-await x" — pause here until `x` says it is ready, then carry on.
- `co_yield v` — read "co-yield v" — hand the value `v` out to the caller and pause.
- `co_return v` — read "co-return v" — finish the coroutine, handing back a final result.

What C++20 did *not* add is any ready-to-use coroutine type. The header `<coroutine>` gives only the machinery: `std::coroutine_handle<P>` (read "coroutine handle of P"), a pointer-like handle to one frame that can `resume()` it, ask `done()`, and `destroy()` it; and two ready-made **awaitables** — types `co_await` knows how to wait on — called `std::suspend_always` (always pause) and `std::suspend_never` (never pause). The rest you write yourself: the coroutine's return type must contain a nested `promise_type`, whose functions the compiler calls when the coroutine starts, yields, returns and finishes.

::: example A generator that hands out throttle commands
A **generator** is the simplest useful coroutine: it produces a sequence one value at a time, only when asked. This one ramps a throttle from 40% to 100% in three steps. Its `promise_type` supplies its own `operator new` and `operator delete`, which the compiler uses for the frame, and prints each call.

```cpp
#include <coroutine>
#include <cstdio>
#include <cstdlib>
#include <exception>
#include <utility>

// A minimal generator: the caller pulls one value at a time.
template <typename T>
class Generator {
public:
    struct promise_type {
        T current{};

        Generator get_return_object() {
            return Generator{std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        std::suspend_always yield_value(T value) noexcept {
            current = value;
            return {};
        }
        void return_void() noexcept {}
        void unhandled_exception() { std::terminate(); }

        // Report every frame allocation, so we can see the heap being used.
        static void* operator new(std::size_t n) {
            std::printf("  [frame allocated: %zu bytes]\n", n);
            return std::malloc(n);
        }
        static void operator delete(void* p) noexcept {
            std::printf("  [frame freed]\n");
            std::free(p);
        }
    };

    explicit Generator(std::coroutine_handle<promise_type> h) : handle_(h) {}
    Generator(Generator&& other) noexcept : handle_(std::exchange(other.handle_, {})) {}
    Generator(const Generator&) = delete;
    Generator& operator=(const Generator&) = delete;
    Generator& operator=(Generator&&) = delete;
    ~Generator() { if (handle_) handle_.destroy(); }

    bool next() {                 // resume; false once the body has finished
        handle_.resume();
        return !handle_.done();
    }
    T value() const { return handle_.promise().current; }

private:
    std::coroutine_handle<promise_type> handle_;
};

// A throttle ramp: from start to end in equal steps, one value per resume.
Generator<double> throttle_ramp(double start, double end, int steps) {
    for (int i = 0; i <= steps; ++i) {
        co_yield start + (end - start) * i / steps;
    }
}

int main() {
    std::printf("creating the coroutine\n");
    Generator<double> ramp = throttle_ramp(0.40, 1.00, 3);
    std::printf("pulling values\n");
    while (ramp.next()) {
        std::printf("throttle %.2f\n", ramp.value());
    }
    std::printf("done\n");
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`, it prints:

```text
creating the coroutine
  [frame allocated: 72 bytes]
pulling values
throttle 0.40
throttle 0.60
throttle 0.80
throttle 1.00
done
  [frame freed]
```

Walk through it:

1. Calling `throttle_ramp(0.40, 1.00, 3)` does not run the loop. The compiler allocates the frame (72 bytes, through our `operator new`), copies the parameters into it, builds the promise there, and calls `get_return_object()` to make the `Generator`.
2. `initial_suspend()` returns `suspend_always`, so the body pauses before its first line. That is why "pulling values" prints before any throttle value.
3. Each `next()` calls `resume()`. The loop runs to `co_yield`, which calls `yield_value`, stores the number in the promise, and pauses.
4. After the last value, the next resume ends the loop and `final_suspend()` pauses the body one last time. `done()` is now true, so `next()` returns false.
5. `ramp`'s destructor calls `destroy()`, freeing the frame — RAII again, and the reason copying is deleted: two owners would free one frame twice.

Sanity check on the values: the step is $(1.00 - 0.40)/3 = 0.20$, so the ramp is $0.40, 0.60, 0.80, 1.00$ — four values for `i` from 0 to 3, as printed.

Now the same file built with clang 18 at `-O2`:

```text
creating the coroutine
pulling values
throttle 0.40
throttle 0.60
throttle 0.80
throttle 1.00
done
```

No allocation at all. Clang could see that the frame never outlives `main`, so it kept the frame in `main`'s own stack frame. At `-O0`, clang allocates too (64 bytes). Same source, same standard, three different answers about the heap.
:::

C++23 adds a ready-made `std::generator<T>` in `<generator>`, which would replace the class above. g++ 13 does not have it (`generator: No such file or directory`); it arrived with GCC 14.

## Why coroutines are rare in flight code

**The frame usually lives on the heap.** The standard says the frame is allocated with `operator new` unless the compiler can prove it is safe not to. Removing that allocation is an optimisation, called **[[heap allocation elision|halo]]**, and the standard never promises it. You saw g++ 13 allocate every time, and clang skip it only when optimising. Flight code usually forbids heap allocation after start-up, because an allocation can fail and its time is not bounded. A feature whose memory behaviour changes with the compiler and the `-O` flag is hard to certify.

A partial fix: `promise_type` may supply an `operator new` that hands out memory from a fixed pool. But the compiler picks the frame's size — 72 bytes with g++, 64 with clang at `-O0`, for the same function — so the pool must be sized by measuring, and re-measured whenever the code or compiler changes.

**The control flow is harder to analyse.** Flight software must prove its **[[worst-case execution time|wcet]]** — the longest any piece of code can take — for every task in every cycle. An ordinary function's path is visible in its source. A coroutine's body is cut into pieces at every `co_await` and `co_yield`, and one call to `resume()` runs whichever piece comes next, according to a saved position inside a frame the compiler generated. Timing tools, coverage tools and human reviewers all find that harder to reason about.

::: key
Why coroutines rarely appear in flight code: the compiler allocates the coroutine frame on the heap unless it can prove elision, and the control flow is harder to analyse for worst-case timing. Both conflict with the no-allocation, analysable-timing rules.
:::

So what do flight programs do instead? They want what coroutines offer — a multi-step sequence spread over many control cycles — but they write it as an explicit **[[state machine|state-machine]]**: an `enum class` saying which step it is on, and a `switch` run once per tick.

::: example The same sequence, both ways
First, a coroutine. `NextTick` is a tiny awaitable that always pauses, so each `co_await NextTick{}` means "wait for the next cycle". The body reads top to bottom like a checklist:

```cpp
#include <coroutine>
#include <cstdio>
#include <exception>

// The coroutine's return type: owns the frame, lets the loop resume it.
struct Sequence {
    struct promise_type {
        Sequence get_return_object() {
            return Sequence{std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        std::suspend_never initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        void return_value(int code) noexcept { result = code; }
        void unhandled_exception() { std::terminate(); }
        int result = -1;
    };
    explicit Sequence(std::coroutine_handle<promise_type> handle) : h(handle) {}
    Sequence(const Sequence&) = delete;             // one owner per frame
    Sequence& operator=(const Sequence&) = delete;
    ~Sequence() { if (h) h.destroy(); }             // RAII: free the frame
    std::coroutine_handle<promise_type> h;
};

// An awaitable: "pause me until the next tick of the loop".
struct NextTick {
    bool await_ready() const noexcept { return false; }        // always pause
    void await_suspend(std::coroutine_handle<>) const noexcept {}
    void await_resume() const noexcept {}
};

// A valve-opening sequence, written top to bottom like a checklist.
Sequence open_valve_sequence() {
    std::puts("  arm igniter");
    co_await NextTick{};
    std::puts("  open valve to 10%");
    co_await NextTick{};
    co_await NextTick{};
    std::puts("  open valve to 100%");
    co_return 0;   // 0 = sequence complete
}

int main() {
    std::puts("tick 0");
    Sequence seq = open_valve_sequence();   // runs until its first co_await
    for (int tick = 1; !seq.h.done(); ++tick) {
        std::printf("tick %d\n", tick);
        seq.h.resume();                     // runs until the next co_await or the end
    }
    std::printf("result %d\n", seq.h.promise().result);
}
```

`co_await` asks the awaitable three questions: `await_ready()` — are you ready already? (always no); `await_suspend(h)` — we are pausing, anything to do? (nothing); `await_resume()` — we are back, what is the result? (nothing). Because `initial_suspend()` is `suspend_never`, the body starts at once and runs to its first `co_await`. The `co_return 0;` calls `return_value(0)`.

Now the flight-style version: the same steps, as a state machine.

```cpp
#include <cstdio>

enum class Step { arm, open_10, wait, done };

struct ValveSequence {
    Step step = Step::arm;
    int waited = 0;

    void tick() {                        // called once per control cycle
        switch (step) {
        case Step::arm:
            std::puts("  arm igniter");
            step = Step::open_10;
            break;
        case Step::open_10:
            std::puts("  open valve to 10%");
            step = Step::wait;
            break;
        case Step::wait:
            if (++waited == 2) {
                std::puts("  open valve to 100%");
                step = Step::done;
            }
            break;
        case Step::done:
            break;
        }
    }
};

int main() {
    ValveSequence seq;
    for (int tick = 0; seq.step != Step::done; ++tick) {
        std::printf("tick %d\n", tick);
        seq.tick();
    }
    std::printf("sizeof(ValveSequence) = %zu bytes\n", sizeof(ValveSequence));
}
```

Both built with `g++ -std=c++20 -Wall -Wextra -O2`. The coroutine prints the left column, the state machine the right:

```text
tick 0                      tick 0
  arm igniter                 arm igniter
tick 1                      tick 1
  open valve to 10%           open valve to 10%
tick 2                      tick 2
tick 3                      tick 3
  open valve to 100%          open valve to 100%
result 0                    sizeof(ValveSequence) = 8 bytes
```

Same behaviour, tick for tick. Check the wait: after "10%" at tick 1, the coroutine pauses twice more (ticks 2 and 3), and the state machine counts `waited` to 2 (ticks 2 and 3). Both open fully at tick 3.

The coroutine reads more naturally; that is its whole appeal. But the state machine is a plain 8-byte object (a 4-byte `enum class` and a 4-byte `int`) that can sit in static storage, and its state is a named variable you can send down in telemetry — not a hidden resume point in a frame the compiler sized.
:::

::: warning
A coroutine copies its parameters into the frame, but a *reference* parameter copies only the reference. If you pass a temporary to a coroutine taking `const std::string&`, the temporary dies at the end of the calling statement while the frame still holds a reference to it. The next `resume()` reads freed memory. Take coroutine parameters by value.
:::

None of this makes coroutines bad. On the ground — a telemetry server juggling thousands of connections — they make asynchronous code far easier to write. The flight rule is narrower: inside a hard real-time task, prefer what you can see.

## Check yourself

::: check
A teammate adds `import telemetry;` to `main.cpp`, but a hand-written Makefile compiles `main.cpp` before `telemetry.cppm`. With g++ 13 and `-fmodules-ts`, what happens, and why did this never happen with headers?
:::

::: answer
The compile of `main.cpp` fails with "failed to read compiled module": `gcm.cache/telemetry.gcm` does not exist yet, and imports must be built before being imported. With headers, `#include` pastes source text, so each `.cpp` compiles on its own in any order. With modules, `main.cpp` needs the BMI that compiling `telemetry.cppm` produces, so the build must know the order — which is what a dependency scan finds.
:::

::: check
A library vendor asks, "Can we ship our module's `.gcm` file instead of source, the way we ship a `.so`?" What do you tell them?
:::

::: answer
Not in general. A BMI is compiler-specific, often version-specific and even flag-specific: clang rejects a g++ `.gcm` as "not a valid precompiled module file". The vendor ships the interface source; each user's build makes its own BMI.
:::

::: check
Name the three C++20 coroutine keywords and what each does. Which header holds `std::coroutine_handle`, and can you use C++23's `std::generator` with g++ 13?
:::

::: answer
`co_await x` pauses until the awaitable `x` is ready; `co_yield v` hands `v` to the caller and pauses; `co_return v` finishes with a final result. Any one of them makes the function a coroutine. `std::coroutine_handle` is in `<coroutine>`, available in g++ 13 with `-std=c++20`. `std::generator` is in `<generator>`, which g++ 13's library does not have; it came with GCC 14.
:::

::: check
The generator allocated 72 bytes with g++ at `-O2` and nothing with clang at `-O2`. So is a coroutine fine in a no-allocation flight task if you build with clang?
:::

::: answer
No. Clang removed the allocation because, in that one program, it could see the frame's whole lifetime. That is an optimisation, not a guarantee: at `-O0` clang allocated 64 bytes for the same code, and storing the generator in a member or passing it elsewhere can make elision impossible. A flight rule needs something true in every build — for example `promise_type::operator new` drawing from a fixed pool sized by measurement, which is extra work to verify.
:::

::: check
Your lead asks why you wrote a thruster warm-up sequence as an `enum class` plus `switch` rather than a coroutine that `co_await`s the next tick. Give two reasons.
:::

::: answer
Memory: the state machine is a small fixed-size object (8 bytes in the example) that can live in static storage, while the coroutine frame comes from `operator new` unless elided, at a size the compiler picks. Analysis: every path through the `switch` is visible, so worst-case time and coverage are straightforward, and the current step is a named variable you can put in telemetry instead of a hidden resume point.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| Textual inclusion | `#include` pastes the header's text | `<vector>` is 19,333 lines on g++ 13, re-read by every `.cpp` |
| Module | a unit with an explicit exported interface | `export module m;`, `export`, `import m;` |
| BMI | built module interface, the compiled summary | compiler-specific; must exist before any importer compiles |
| Dependency scan | finding the import order before compiling | CMake 3.28: MSVC 14.34+, Clang 16+, GCC 14+ |
| `import std;` | the whole standard library as one module | C++23; absent from g++ 13 and clang 18 with libstdc++ 13 |
| Coroutine | a function that can suspend and resume | any of `co_await`, `co_yield`, `co_return` |
| Coroutine frame | where a paused coroutine keeps its state | heap by default; elision is not guaranteed |
| Flight practice | a state machine run once per tick | fixed size, visible state |

The next lesson turns to C++23: `std::expected` from the error-handling lesson, grown up, plus `std::mdspan` and `std::print` — and, once again, an honest look at what g++ 13 actually ships.

::: context preprocessor The step before compiling
The preprocessor is a text tool that runs first and knows nothing about C++ types or functions. It handles every line starting with `#`: `#include` pastes a file, `#define` sets up a text replacement, `#if` keeps or drops lines. Only its output reaches the real compiler. You can see that output with `g++ -E file.cpp`, which is how the line counts in this lesson were measured. Modules are the first big feature designed to take work away from the preprocessor rather than add to it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="90" height="50" fill="#ffffff" stroke="#1f2a44"/>
  <text x="55" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">main.cpp</text>
  <text x="55" y="60" font-size="11" text-anchor="middle" fill="#6c7a93">6 lines</text>
  <rect x="10" y="90" width="90" height="40" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="55" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">5 std headers</text>
  <line x1="100" y1="45" x2="140" y2="70" stroke="#1f2a44"/>
  <line x1="100" y1="110" x2="140" y2="80" stroke="#1f2a44"/>
  <rect x="140" y="50" width="90" height="50" fill="#f2b880" stroke="#1f2a44"/>
  <text x="185" y="72" font-size="12" text-anchor="middle" fill="#1f2a44">preprocessor</text>
  <text x="185" y="89" font-size="11" text-anchor="middle" fill="#1f2a44">pastes text</text>
  <line x1="230" y1="75" x2="260" y2="75" stroke="#1f2a44"/>
  <polygon points="260,70 268,75 260,80" fill="#1f2a44"/>
  <rect x="270" y="30" width="80" height="90" fill="#ffffff" stroke="#b4232c"/>
  <text x="310" y="68" font-size="12" text-anchor="middle" fill="#b4232c">48,529</text>
  <text x="310" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">lines to</text>
  <text x="310" y="101" font-size="11" text-anchor="middle" fill="#1f2a44">compile</text>
</svg>
```
:::

::: context include-guards Why pasting twice would break things
If a header defines a struct and gets pasted twice into one file — say `a.h` and `b.h` both include `vec3.h` — the compiler sees the struct defined twice and stops with an error. An include guard wraps the header in `#ifndef VEC3_H`, `#define VEC3_H` … `#endif`, so the second paste finds the name already defined and skips everything. Most compilers also accept `#pragma once` for the same job. Modules make the problem disappear: importing the same module twice is harmless, because nothing is pasted.
:::

::: context p1689 How committee papers get their names
Proposals to the C++ standards committee are numbered documents. Papers starting with P are proposals, and the number stays the same through revisions, which add a suffix such as R5 for the fifth revision. P1689 describes a small JSON format a compiler can emit after scanning a source file: which module it provides and which it needs. Because compilers and build tools agreed on it, CMake can drive different compilers' scanners the same way. g++ gained a scanner speaking this format in GCC 14, which is why CMake 3.28 lists GCC 14 as its minimum.
:::

::: context pinned-toolchain Why flight teams do not upgrade on a whim
Flight software is verified as a whole: the source, but also the machine code a particular compiler produced from it. A new compiler version can generate different instructions, change timing, or fix and introduce bugs. So a flight project typically chooses one compiler version early, records it in its configuration management, and keeps it for years, changing it only with a deliberate decision and a round of re-verification. Any new language feature has to wait for that decision.
:::

::: context coroutine-name An idea older than C++
The word coroutine is usually credited to Melvin Conway, who used it in 1958 and published the idea in 1963 while describing how to structure a compiler as cooperating pieces that pass control back and forth. The "co" means the routines are partners: neither is the boss that calls the other and waits for it to finish. Languages such as Simula, Lua, Python (generators and `async`) and C# (`yield` and `await`) had forms of coroutines long before C++20.
:::

::: context coroutine-frame Stack frame versus coroutine frame
An ordinary call pushes a stack frame on top of the stack and pops it on return. A coroutine's frame is created once, holds the parameters, the locals, the promise and the resume point, and stays alive across every pause, until someone calls `destroy()`. By default it sits on the heap, with only the small handle on the stack.

Why not on the stack? The stack works because calls nest: the last function called is the first to return. A coroutine breaks that. It returns to its caller while still alive, the caller then pushes new frames where the coroutine's used to be, and the handle may be resumed later from somewhere else entirely. Only when the compiler sees the whole lifetime inside one caller can it keep the frame there.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">stack</text>
  <rect x="30" y="30" width="120" height="34" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="90" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">main: ramp (handle)</text>
  <rect x="30" y="64" width="120" height="34" fill="#ffffff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="90" y="86" font-size="11" text-anchor="middle" fill="#6c7a93">next() comes, goes</text>
  <text x="260" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">heap</text>
  <rect x="200" y="30" width="120" height="120" fill="#f2b880" stroke="#1f2a44"/>
  <text x="260" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">coroutine frame</text>
  <text x="260" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">start, end, steps</text>
  <text x="260" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">local i</text>
  <text x="260" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">promise: current</text>
  <text x="260" y="132" font-size="11" text-anchor="middle" fill="#1f2a44">resume point</text>
  <line x1="150" y1="47" x2="196" y2="47" stroke="#b4232c"/>
  <polygon points="196,42 204,47 196,52" fill="#b4232c"/>
</svg>
```
:::

::: context halo The optimisation with a halo
The committee paper by Gor Nishanov and Richard Smith that argued the frame could usually be kept off the heap nicknamed the optimisation HALO, for heap allocation elision optimisation. The idea: if the compiler can see that the coroutine is created, resumed and destroyed entirely within one caller, it can put the frame in that caller's own stack frame. Clang implements it, as the example showed at `-O2`. The rules for when it applies belong to the compiler, not the language, so code cannot rely on it.
:::

::: context wcet The number every control task must have
Worst-case execution time, WCET, is the longest a piece of code can ever take on a given processor, including slow paths, cache misses and interrupts. A 1 kHz control loop has 1 ms per cycle, so every task scheduled in that millisecond needs a WCET bound that fits, with margin. It is found by measurement under stress plus static analysis of every path. Anything whose path is hidden or data-dependent makes the bound harder to trust. The real-time module later in this track opens with WCET and works with it throughout.
:::

::: context state-machine The shape flight sequences usually take
A state machine is a set of named states and the rules for moving between them. Flight software is full of them: vehicle modes (standby, ascent, coast, entry), engine start sequences, fault responses. Written as an `enum class` and a `switch`, each state's code is short, runs once per tick and returns, so every path is short and visible.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="5" y="35" width="70" height="34" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="40" y="57" font-size="12" text-anchor="middle" fill="#1f2a44">arm</text>
  <rect x="95" y="35" width="70" height="34" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="130" y="57" font-size="12" text-anchor="middle" fill="#1f2a44">open_10</text>
  <rect x="185" y="35" width="70" height="34" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="220" y="57" font-size="12" text-anchor="middle" fill="#1f2a44">wait</text>
  <rect x="280" y="35" width="70" height="34" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="315" y="57" font-size="12" text-anchor="middle" fill="#1f2a44">done</text>
  <line x1="75" y1="52" x2="89" y2="52" stroke="#1f2a44"/>
  <polygon points="89,47 95,52 89,57" fill="#1f2a44"/>
  <line x1="165" y1="52" x2="179" y2="52" stroke="#1f2a44"/>
  <polygon points="179,47 185,52 179,57" fill="#1f2a44"/>
  <line x1="255" y1="52" x2="274" y2="52" stroke="#1f2a44"/>
  <polygon points="274,47 280,52 274,57" fill="#1f2a44"/>
  <text x="267" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">waited = 2</text>
  <path d="M 205 69 C 205 95, 235 95, 235 69" fill="none" stroke="#6c7a93"/>
  <polygon points="231,74 235,67 239,74" fill="#6c7a93"/>
  <text x="220" y="104" font-size="11" text-anchor="middle" fill="#6c7a93">waited &lt; 2</text>
</svg>
```
:::
