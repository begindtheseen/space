---
id: l05-the-stack
title: The stack: frames, overflow, and why flight code does not recurse
minutes: 20
covers:
  - 'The stack: frames, stack overflow, why deep recursion is banned in flight code'
---

The stack is the cheapest memory in the program and the only memory whose exhaustion is not reported to you. Allocating an automatic object costs one subtraction from a register; freeing it costs one addition; there is no free list, no lock, no fragmentation and no failure path. That is why flight software puts almost everything on it.

The price is that the region is a fixed size chosen before the program starts, and running off the end of it is not an error the language can catch. There is no exception, no `nullptr` return, no `errno`. On a desktop the operating system usually arranges a guard page and the process dies; on a bare-metal flight processor the stack of one task frequently abuts something else, and overflowing it corrupts that something else silently. A telemetry value changes for no reason and nobody can explain it.

This lesson makes the stack measurable. You will see what a frame contains, measure a function's frame size with a compiler flag rather than guessing, predict the maximum recursion depth from that number and check the prediction against the machine, and convert a recursive traversal into one whose worst-case memory is a compile-time constant. That last skill is the point: NASA/JPL's *Power of Ten* rule 1 bans recursion outright, and the reason is not style.

## What a frame contains

Each function call pushes a **frame**: a contiguous block holding that call's saved return address, whichever registers the callee must preserve, its parameters that did not fit in registers, its local objects, and padding to keep the stack pointer correctly aligned — 16 bytes on the x86-64 System V ABI. The frame is popped when the function returns, which is why an automatic object cannot outlive its block.

You do not have to guess the size. g++ writes it out with `-fstack-usage`, which emits a `.su` file listing every function and its frame.

::: example Measuring a frame two ways and getting the same answer
Three nested functions, each with an eight-element `double` scratch array, each recording the address of its first local.

```cpp
#include <cstddef>
#include <cstdio>

const char* outer_marker = nullptr;

void level3() {
    double scratch[8]{};
    const char* here = reinterpret_cast<const char*>(&scratch[0]);
    std::printf("level3 local at %p, %td bytes below level1's\n",
                static_cast<const void*>(here), outer_marker - here);
}

void level2() {
    double scratch[8]{};
    const char* here = reinterpret_cast<const char*>(&scratch[0]);
    std::printf("level2 local at %p, %td bytes below level1's\n",
                static_cast<const void*>(here), outer_marker - here);
    level3();
}

void level1() {
    double scratch[8]{};
    outer_marker = reinterpret_cast<const char*>(&scratch[0]);
    std::printf("level1 local at %p\n", static_cast<const void*>(outer_marker));
    level2();
}

int main() { level1(); return 0; }
```

First, ask the compiler. `g++ -std=c++20 -O0 -fstack-usage -c l05-frames.cpp` writes `l05-frames.su`:

```text
l05-frames.cpp:6:6:void level3()	112	static
l05-frames.cpp:13:6:void level2()	112	static
l05-frames.cpp:21:6:void level1()	96	static
l05-frames.cpp:28:5:int main()	16	static
```

Then run it and measure the addresses (the absolute values differ on every run; the differences do not):

```text
level1 local at 0x7ffd96e4b5e0
level2 local at 0x7ffd96e4b580, 96 bytes below level1's
level3 local at 0x7ffd96e4b510, 208 bytes below level1's
```

The two agree exactly. `level2`'s local sits 96 bytes below `level1`'s, which is `level1`'s reported frame size. `level3`'s sits $96 + 112 = 208$ bytes below, which is `level1`'s frame plus `level2`'s. The addresses *decrease* as the calls nest, because this stack grows downward — the direction is not specified by the standard, but it is downward on every processor you are likely to meet.

Note that a frame is larger than the objects you declared: 64 bytes of `double` scratch, plus the return address, the saved base pointer, the `here` pointer and alignment padding, came to 96 or 112. `-fstack-usage` counts all of it, which is what you want when you are adding up a worst-case path. Note also the word `static` in the fourth column: it means the frame size is a compile-time constant. A function using a variable-length array or `alloca` would be reported as `dynamic` or `bounded`, and a flight codebase rejects those for exactly that reason.
:::

## The limit, and what happens at it

The stack size is set before `main` runs. On this Linux machine `ulimit -s` reports 8192, in kilobytes, so 8 MiB. On a flight target it is set per task in the RTOS configuration and is commonly 8 to 64 KiB — three orders of magnitude less.

Exceeding it is undefined behaviour. What you *observe* is a fact about your operating system, not about C++.

::: example Predicting the overflow depth, then measuring it
A recursive function whose frame is dominated by a 1 KiB scratch buffer:

```cpp
#include <cstdio>

int deeper(int depth) {
    double scratch[128];
    scratch[0] = depth;
    if (depth % 500 == 0) std::fprintf(stderr, "depth %d\n", depth);
    return deeper(depth + 1) + static_cast<int>(scratch[0]);
}

int main() {
    std::fprintf(stderr, "recursing until the stack runs out\n");
    return deeper(1);
}
```

g++ 13.3.0 at `-Wall` spots the shape of it before anything runs:

```text
l05-depth.cpp:4:5: warning: infinite recursion detected [-Winfinite-recursion]
    4 | int deeper(int depth) {
      |     ^~~~~~
l05-depth.cpp:8:18: note: recursive call
    8 |     return deeper(depth + 1) + static_cast<int>(scratch[0]);
      |            ~~~~~~^~~~~~~~~~~
```

(That warning is enabled by `-Wall` and not by `-Wextra` — the reverse of `-Wdangling-reference` from lesson 04. Neither is on by default, which is the argument for a project-wide flag set.)

Now predict. `-fstack-usage` reports `int deeper(int)` at **1072** bytes per frame. The limit is 8 MiB:

$$
\frac{8\,388\,608}{1072} = 7825 \text{ frames.}
$$

Measured, with the print changed to fire at every depth, three runs gave a last successful depth of **7810**, **7811** and **7809**, then `SIGSEGV` (shell status 139). The prediction is high by about 15 frames — roughly the 16 KB that the environment, the argument vector and `main`'s own frame occupy before `deeper` is first called — which is agreement to about 0.2 per cent. The small run-to-run variation is the environment size changing, not the arithmetic being unreliable.

Rebuild with `-fsanitize=address -fno-sanitize-recover=all` and the same program reports the failure properly instead of dying:

```text
==18291==ERROR: AddressSanitizer: stack-overflow on address 0x7ffd13a95e6c (pc 0x55ed27ac927f bp 0x7ffd13a96350 sp 0x7ffd13a95e60 T0)
    #0 0x55ed27ac927f in deeper(int) l05-depth.cpp:4
    #1 0x55ed27ac93bb in deeper(int) l05-depth.cpp:8
    #2 0x55ed27ac93bb in deeper(int) l05-depth.cpp:8
    ...
SUMMARY: AddressSanitizer: stack-overflow l05-depth.cpp:4 in deeper(int)
```

Two details worth keeping. The trace is hundreds of identical frames, which is the signature of runaway recursion and tells you the function's name immediately. And the sanitized build overflowed *sooner* — last depth about 6540 rather than 7810 — because AddressSanitizer inserts redzones around stack objects, so each frame is effectively about $8\,388\,608/6540 = 1283$ bytes. A program that fits its stack with 20% to spare in a normal build can overflow under the sanitizer, which is a reason to give sanitized test runs a larger stack rather than to conclude the code is broken.
:::

::: warning
Everything above is what *this* build on *this* kernel did. The standard says a stack overflow is undefined behaviour and stops there. Linux happens to place an unmapped guard page below the stack, so the first access past the limit faults and you get a clean signal. A bare-metal target with no memory protection unit has no guard page: the write lands in whatever is next in the address map, the program continues, and the corruption surfaces later somewhere unrelated. Never reason from "it crashes if it overflows".
:::

## Why recursion is banned

The rule in flight coding standards is not "recursion is inefficient". It is that recursion makes the worst-case stack depth **undecidable by inspection**.

A loop with a fixed bound uses one frame. A recursive function uses one frame per level, and the number of levels is a property of the input data: the depth of a tree, the length of a path, the number of digits in a value. To certify that the task never overflows its 32 KiB stack you must bound that data, and the bound must hold for every input the vehicle can produce over a decade — including inputs produced by a sensor that has started returning nonsense. Static analysis tools that compute worst-case stack usage give up on any call graph with a cycle in it; they report "unbounded" and the finding blocks the review.

So the discipline is: **no cycles in the call graph.** Where the algorithm is naturally recursive, you make the stack explicit, give it a fixed capacity, and check the capacity.

::: example A fault tree, walked recursively and walked with a bounded stack
The tree is stored in a fixed array, with node `i`'s children at `2i+1` and `2i+2`.

```cpp
constexpr int kNodeCount = 15;              // a complete tree of depth 4
constexpr int kMaxDepth  = 8;               // the bound we will enforce

// Recursive: depth is bounded only by the shape of the data.
double worst_recursive(int i) {
    if (i >= kNodeCount) return 0.0;
    double best = kThreshold[i];
    double l = worst_recursive(2 * i + 1);
    double r = worst_recursive(2 * i + 2);
    if (l > best) best = l;
    if (r > best) best = r;
    return best;
}

// Iterative: one explicit stack of known capacity.
double worst_iterative(int root, int& high_water) {
    int stack[kMaxDepth];
    std::size_t top = 0;
    double best = 0.0;
    high_water = 0;

    stack[top++] = root;
    while (top > 0) {
        if (static_cast<int>(top) > high_water) high_water = static_cast<int>(top);
        int i = stack[--top];
        if (i >= kNodeCount) continue;
        if (kThreshold[i] > best) best = kThreshold[i];
        if (top + 2 > kMaxDepth) return -1.0;    // refuse rather than overrun
        stack[top++] = 2 * i + 1;
        stack[top++] = 2 * i + 2;
    }
    return best;
}
```

```text
recursive: 20.0
iterative: 20.0 (stack high-water 5 of 8 slots)
explicit stack costs 32 bytes of frame
```

Same answer. The difference is what you can say about the memory. `-fstack-usage` reports:

```text
l05-iterative.cpp:14:8:double worst_recursive(int)	64	static
l05-iterative.cpp:25:8:double worst_iterative(int, int&)	112	static
```

The recursive version uses 64 bytes per level and reaches five levels on this tree, so 320 bytes — *for this tree*. Hand it a tree twice as deep and it uses twice as much, and nothing in the function says how deep a tree it will accept. The iterative version uses 112 bytes, full stop, for every input, and the number is in the `.su` file where a build-time check can read it.

Three properties make the iterative version certifiable. The stack has a capacity fixed at compile time, so the frame size is a constant. The overflow case is *handled* — `top + 2 > kMaxDepth` returns a sentinel instead of writing past the array — so the failure is a value you can test for, not undefined behaviour. And the measured high-water mark, 5 of 8 slots, is something the program can report, so a long soak test tells you how much margin you actually have. That is the shape of every "no recursion" refactor: make the worst case a constant, make exceeding it a defined outcome, and measure the margin.
:::

## Large locals

The other way to exhaust a stack is one frame, not many. A `std::array<double, 200000>` local is 1,600,000 bytes — about 1.53 MiB — and it compiles without a word at `-Wall -Wextra -Wpedantic`. Two flags catch it:

```text
chk-bigframe.cpp:3:8: warning: stack usage is 1600080 bytes [-Wstack-usage=]
chk-bigframe.cpp:9:1: warning: the frame size of 1600064 bytes is larger than 16384 bytes [-Wframe-larger-than=]
```

produced by `-Wstack-usage=16384` and `-Wframe-larger-than=16384` respectively. Set them to your task's budget and the build tells you when a frame grows past it. Neither is enabled by any of `-Wall`, `-Wextra` or `-Wpedantic`: you have to ask.

::: key
A stack frame holds a call's return address, saved registers, parameters and locals, and its size is a compile-time constant for a function without variable-length arrays. Measure it with `-fstack-usage`; bound it with `-Wframe-larger-than=`. Stack overflow is undefined behaviour with no diagnostic from the language. Recursion makes worst-case depth data-dependent and so unprovable, which is why *Power of Ten* rule 1 forbids it; replace it with an explicit stack of fixed capacity and a defined behaviour when that capacity is reached.
:::

## Check yourself

::: check
A task on a flight computer has a 32 KiB stack. Its deepest call path is `control_step` (1,200 bytes) to `estimate` (2,400 bytes) to `matrix_solve` (9,600 bytes) to `dot` (128 bytes). Is it safe, and what would you want to know before saying so?
:::

::: answer
The path sums to $1200 + 2400 + 9600 + 128 = 13\,328$ bytes, which is 41% of 32,768 — comfortable on the face of it. Before saying it is safe you would want three more things. First, is this really the deepest path? The sum must be taken over the whole call graph, which is what a stack-analysis tool does and what you cannot do reliably by eye. Second, does anything in the path use a variable-length array, `alloca`, or a recursive call? Any of those makes the number meaningless, and `-fstack-usage` flags them by printing `dynamic` instead of `static`. Third, does the task take interrupts on its own stack? An interrupt frame lands on top of whatever is running, so the budget is the deepest task path plus the deepest interrupt path, and on many targets plus nesting.
:::

::: check
`-fstack-usage` said `deeper` uses 1072 bytes, yet its only declared local is a 1,024-byte array. Where did the other 48 bytes go, and why should you use the tool's number rather than `sizeof` the locals?
:::

::: answer
Into the parts of the frame you did not declare: the saved return address (8 bytes), the saved frame pointer at `-O0` (8), the `depth` parameter spilled to the stack, any registers the ABI requires the callee to preserve, and padding to keep the stack pointer 16-byte aligned. Adding up `sizeof` on your locals undercounts all of that, and the undercount grows with the number of parameters and with optimisation level, which also *moves* objects between registers and the frame. The tool reports what the code generator actually emitted for the settings you built with, which is the only number that means anything. Build your stack budget from `.su` files produced by the same flags as the flight build.
:::

::: check
An engineer argues that recursion is fine here because the tree is only ever four levels deep. What is the counter-argument, and what would make the argument acceptable?
:::

::: answer
The counter-argument is that "only ever four levels" is a claim about the data, enforced nowhere. The function accepts any tree; nothing in it fails, or even notices, if a corrupted index or a future configuration file produces a deeper one. The failure mode when it does is a stack overflow, which is undefined behaviour and on a target without memory protection corrupts adjacent memory silently — so the cost of being wrong is unbounded, while the benefit is a slightly shorter function. It becomes acceptable only if the depth is enforced rather than assumed: pass a remaining-depth counter, refuse and return an error when it hits zero, and now the worst-case stack usage is a constant you can compute and a static analyser can see. At that point you have written the bounded version anyway, with worse ergonomics than an explicit stack.
:::

::: check
The sanitized build of the recursion test overflowed at depth 6540 rather than 7810. Does that mean AddressSanitizer found a bug the normal build does not have?
:::

::: answer
No. Both builds have the same bug — unbounded recursion — and both overflow; the sanitized one simply uses more stack per frame, about 1,283 bytes against 1,072, because it surrounds stack objects with redzones so that an overrun of one local into the next is detectable. What the sanitizer changed is the *reporting*: instead of a bare `SIGSEGV` it printed `stack-overflow` with the repeated frames that name the culprit. The practical consequence is the one to remember: a program sized to fit its stack with a small margin can fail under the sanitizer while being fine in production, so give sanitized runs more stack (`ulimit -s`, or the task's configuration) rather than treating the difference as a finding.
:::

::: check
Why does moving `std::array<double, 200000> window;` from a local to a namespace-scope object remove the stack problem, and what new problem does it create?
:::

::: answer
It changes the storage duration from automatic to static, so the 1.53 MiB lives in the program image for the whole run instead of in a frame, and the function's stack usage drops to almost nothing. The new problem is that there is now exactly one `window` for the whole program: the function is no longer reentrant, two tasks calling it corrupt each other's data with no diagnostic, and a recursive or interrupt-time call does the same. It has also become mutable global state, which is the thing flight-software reviews object to most consistently, because any translation unit can declare `extern` and write to it. The usual resolution is to make the buffer a member of the subsystem object that owns the computation, allocated once during initialisation, and pass a `std::span` into the function — one buffer per subsystem instance, no global, no large frame.
:::

## Summary

| Item | Detail |
| --- | --- |
| frame | return address, saved registers, spilled parameters, locals, alignment padding |
| growth direction | downward on every common target; not specified by the standard |
| `-fstack-usage` | writes a `.su` file: one line per function with its frame size in bytes |
| `static` in a `.su` line | the frame size is a compile-time constant; `dynamic` means it is not |
| `ulimit -s` | 8192 KiB (8 MiB) on this machine; 8 to 64 KiB is typical per flight task |
| observed depth | 1072-byte frames overflowed 8 MiB at depth ≈ 7810; predicted 7825 |
| ASan overhead | redzones raised the effective frame to ≈ 1283 bytes; depth ≈ 6540 |
| `-Winfinite-recursion` | g++ 13.3.0; enabled by `-Wall` |
| `-Wframe-larger-than=N`, `-Wstack-usage=N` | per-function frame budget; neither is on by default |
| *Power of Ten* rule 1 | no recursion, so worst-case stack depth is computable |
| bounded replacement | an explicit stack of fixed capacity, plus a defined action on overflow |

Lesson 06 turns to the other allocator: `new` and `delete`, what each of them actually does, why the array forms have their own spelling, and what placement `new` is for.
