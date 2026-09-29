---
id: l05-the-stack
title: The stack: frames, overflow, and why flight code does not recurse
minutes: 22
covers:
  - 'The stack: frames, stack overflow, why deep recursion is banned in flight code'
---

Picture a pile of plates in a kitchen cupboard. You put a clean plate on top, and you take the top one off when you need it. You never pull one from the middle. The cupboard has a shelf above it, so the pile can only get so tall. In a real kitchen you would see the pile hit the shelf. In a computer, nothing stops you: the next plate slides onto your neighbor's shelf and breaks whatever was there.

That pile is the **stack**: the region of memory where a running program keeps each function call's local variables. Every call puts a block on top; every return takes it off. The rule "last on, first off" has a name, **[[LIFO|lifo]]**.

The stack is the cheapest memory in the program. Making room for a function's locals costs one subtraction from a register called the **[[stack pointer|stack-pointer]]**; giving it back costs one addition. There is no search, no lock, no **fragmentation** (free space broken into useless small pieces) and no failure path. That is why flight software puts almost everything on it.

The price is that the stack has a fixed size, chosen before the program starts, and running off the end of it is not an error the language can catch. There is no exception, no `nullptr` return, no error code. On a desktop the operating system usually arranges things so the process dies. On a bare-metal flight processor, one task's stack often sits right next to something else, and overflowing it corrupts that something else silently. A telemetry value changes for no reason, and nobody can explain it.

This lesson makes the stack measurable. You will see what a frame contains, measure a function's frame with a compiler flag, predict how deep recursion can go and check the prediction, and rewrite a recursive search so its worst-case memory is a compile-time constant. That last skill is the point. NASA/JPL's **[[Power of Ten|power-of-ten]]** rules ban recursion outright, and the reason is not style.

## What a frame contains

Each function call pushes a **frame**: one block of stack holding everything that call needs.

- The **return address**: where to continue in the caller when this function finishes.
- Registers the function must save and later restore for its caller.
- Parameters that did not fit in registers.
- The function's local objects.
- **Padding**: unused bytes that keep the stack pointer lined up on a multiple of 16 bytes, which the x86-64 System V ABI (the rulebook for calls on 64-bit Linux) requires at every call.

The frame is popped when the function returns. That is why an automatic object cannot outlive its block, and why lesson 04's reference to a local dangled. The **[[layout of one frame|frame-layout]]** is worth a picture.

You do not have to guess a frame's size. g++ writes it out when you add `-fstack-usage`: it creates a `.su` file (for "stack usage") listing every function and its frame in bytes.

::: example Measuring a frame two ways and getting the same answer
Three nested functions, each with an eight-element `double` scratch array, each printing the address of its first local:

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

**First, ask the compiler.** `g++ -std=c++20 -O0 -fstack-usage -c l05-frames.cpp` writes `l05-frames.su`:

```text
l05-frames.cpp:6:6:void level3()	112	static
l05-frames.cpp:13:6:void level2()	112	static
l05-frames.cpp:21:6:void level1()	96	static
l05-frames.cpp:28:5:int main()	16	static
```

Each line is file, line, column, the function, its frame size in bytes, and a word about that size.

**Then run it and measure.** The absolute addresses change on every run; the differences do not:

```text
level1 local at 0x7ffcda6e0c40
level2 local at 0x7ffcda6e0be0, 96 bytes below level1's
level3 local at 0x7ffcda6e0b70, 208 bytes below level1's
```

The two agree. `level2`'s local sits 96 bytes below `level1`'s, which is `level1`'s reported frame size. `level3`'s sits $96 + 112 = 208$ bytes below: `level1`'s frame plus `level2`'s.

The addresses *decrease* as the calls nest. This stack grows downward, toward smaller addresses. The C++ standard does not specify the direction, but it is downward on every processor you are likely to meet.

Notice that a frame is bigger than the objects you declared. The scratch array is $8 \times 8 = 64$ bytes, yet the frames are 96 and 112. The rest is the return address, the saved base pointer, the `here` pointer and alignment padding. `-fstack-usage` counts all of it, which is what you want when you add up a worst-case path.

Notice also the word `static` in the last column. It means the frame size is a compile-time constant. A function using a **variable-length array** (an array whose size is decided at run time) or `alloca` would be reported as `dynamic` or `bounded`, and a flight codebase rejects those for exactly that reason.
:::

## The limit, and what happens at it

The stack size is set before `main` runs. On the Linux machine used for this lesson, the shell command `ulimit -s` reports `8192`, in **[[kibibytes|kibibytes]]**: 8 MiB. On a flight target the size is set per task in the **[[RTOS|rtos]]** configuration and is commonly 8 to 64 KiB — about a thousand times less.

Running past the limit is **undefined behavior**: the C++ standard says nothing at all about what happens. What you *observe* is a fact about your operating system, not about C++.

::: example Predicting the overflow depth, then measuring it
A function that calls itself forever, with a frame dominated by a 1 KiB scratch buffer ($128 \times 8 = 1024$ bytes):

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
l05-depth.cpp:3:5: warning: infinite recursion detected [-Winfinite-recursion]
    3 | int deeper(int depth) {
      |     ^~~~~~
l05-depth.cpp:7:18: note: recursive call
    7 |     return deeper(depth + 1) + static_cast<int>(scratch[0]);
      |            ~~~~~~^~~~~~~~~~~
```

That warning is turned on by `-Wall` and not by `-Wextra` alone — the reverse of `-Wdangling-reference` in lesson 04. Neither is on by default, which is the argument for one agreed set of flags for the whole project.

**Predict.** `-fstack-usage` reports `int deeper(int)` at **1072** bytes per frame. The limit is 8 MiB, which is $8 \times 1024 \times 1024 = 8\,388\,608$ bytes. Divide:

$$
\frac{8\,388\,608}{1072} \approx 7825 \text{ frames.}
$$

**Measure.** With the print changed to fire at every depth, three runs reached a last depth of **7809**, **7810** and **7811**, then died with `SIGSEGV`, shell status 139 (a **[[segmentation fault|sigsegv]]**).

**Compare.** The prediction is high by about 15 frames. Fifteen frames is about 16 KB, which is roughly what the environment variables, the program's arguments and `main`'s own frame use before `deeper` is first called. That is agreement to about 0.2 percent. The small spread between runs comes from the environment's size changing, not from the arithmetic.

**Now with the sanitizer.** Rebuild with `-fsanitize=address -fno-sanitize-recover=all`, and the program reports the failure instead of dying silently:

```text
==8027==ERROR: AddressSanitizer: stack-overflow on address 0x7ffd744f4e6c (pc 0x564f062d127f bp 0x7ffd744f5350 sp 0x7ffd744f4e60 T0)
    #0 0x564f062d127f in deeper(int) l05-depth.cpp:3
    #1 0x564f062d13bb in deeper(int) l05-depth.cpp:7
    #2 0x564f062d13bb in deeper(int) l05-depth.cpp:7
    ...
SUMMARY: AddressSanitizer: stack-overflow l05-depth.cpp:3 in deeper(int)
```

The topmost frame can vary. With the print at every depth, the overflow often lands inside `printf`, and the report names a frame in the sanitizer's own `printf` code. What never varies is the wall of identical `deeper(int)` frames below it — hundreds of them. That is the signature of runaway recursion, and it names the function at once.

One more detail. The sanitized build overflowed *sooner*: its last depth was about 6540, not 7810. AddressSanitizer puts **[[redzones|redzones]]** around stack objects, so each frame is effectively $8\,388\,608 / 6540 \approx 1283$ bytes. A program that fits its stack with 20% to spare in a normal build can overflow under the sanitizer. That is a reason to give sanitized test runs a bigger stack, not a sign that the code is broken.
:::

::: warning
Everything above is what *this* build on *this* kernel did. The standard says stack overflow is undefined behavior and stops there. Linux happens to leave an unmapped **[[guard page|guard-page]]** below the stack, so the first access past the limit faults and you get a clean signal. A bare-metal target with no memory protection has no guard page. The write lands in whatever is next in memory, the program carries on, and the damage shows up later somewhere unrelated. Never reason from "it crashes if it overflows".
:::

## Why recursion is banned

The rule is not "recursion is slow". It is that recursion makes the worst-case stack depth impossible to decide by reading the code.

A loop with a fixed bound uses one frame. A recursive function uses one frame per level, and the number of levels depends on the input data: the depth of a tree, the length of a path, the number of digits in a value. To certify that a task never overflows its 32 KiB stack, you must bound that data. The bound must hold for every input the vehicle can produce over a decade — including inputs from a sensor that has started returning nonsense.

**[[Tools that compute worst-case stack use|stack-analysis]]** work by adding up frames along every path through the **call graph**, the map of which function calls which. A cycle in that graph has no longest path, so they report "unbounded", and that finding blocks the review.

So the discipline is: **no cycles in the call graph.** When an algorithm is naturally recursive, you make its stack explicit, give it a fixed capacity, and check the capacity.

::: key
Why is deep recursion banned in flight code? Stack depth becomes data-dependent and unbounded, so static stack analysis cannot prove the worst case, and an overflow corrupts memory silently. Rule 1 of the NASA/JPL *Power of Ten* forbids recursion for exactly this reason.
:::

::: example A fault tree, walked recursively and walked with a bounded stack
A **fault tree** here is a small tree of alarm thresholds, and the job is to find the largest one. The tree is stored in a fixed array: node `i` has its children at `2i+1` and `2i+2`, so node 0's children are 1 and 2, node 1's are 3 and 4, and so on.

```cpp
#include <cstddef>
#include <cstdio>

constexpr int kNodeCount = 15;              // a complete tree of depth 4
constexpr int kMaxDepth  = 8;               // the bound we will enforce
constexpr double kThreshold[kNodeCount] = {
    3.0, 7.5, 4.0, 1.0, 12.0, 6.0, 2.5, 9.0,
    0.5, 20.0, 8.0, 5.0, 11.0, 3.5, 7.0};

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

int main() {
    int hw = 0;
    std::printf("recursive: %.1f\n", worst_recursive(0));
    double w = worst_iterative(0, hw);
    std::printf("iterative: %.1f (stack high-water %d of %d slots)\n", w, hw, kMaxDepth);
    std::printf("explicit stack costs %zu bytes of frame\n", sizeof(int) * kMaxDepth);
    return 0;
}
```

In the iterative version, `stack[top++] = x` puts `x` on top and then moves `top` up one; `stack[--top]` moves `top` down one and reads what was there. That is the **[[explicit stack|explicit-stack]]** doing by hand what function calls did before.

```text
recursive: 20.0
iterative: 20.0 (stack high-water 5 of 8 slots)
explicit stack costs 32 bytes of frame
```

Same answer, 20.0, which is the largest value in the table. The difference is what you can say about memory. `-fstack-usage` reports:

```text
l05-iterative.cpp:11:8:double worst_recursive(int)	64	static
l05-iterative.cpp:22:8:double worst_iterative(int, int&)	112	static
```

The recursive version uses 64 bytes per level. On this tree it goes five levels deep — four levels of nodes, plus the calls on the empty children below the leaves — so $5 \times 64 = 320$ bytes, *for this tree*. Hand it a tree twice as deep and it uses twice as much, and nothing in the function says how deep a tree it will accept. The iterative version uses 112 bytes, for every input, and the number sits in the `.su` file where a build-time check can read it.

Three properties make the iterative version certifiable.

1. The stack has a capacity fixed at compile time, so the frame size is a constant.
2. The overflow case is *handled*. `top + 2 > kMaxDepth` returns a marker value instead of writing past the array, so failure is a value you can test for, not undefined behavior.
3. The high-water mark, 5 of 8 slots, is something the program can report, so a long test run tells you how much margin you really have.

That is the shape of every "no recursion" rewrite: make the worst case a constant, make exceeding it a defined outcome, and measure the margin.
:::

## Large locals

The other way to exhaust a stack takes one frame, not many. A local `std::array<double, 200000>` is $200\,000 \times 8 = 1\,600\,000$ bytes — about 1.53 MiB — and it compiles without a word at `-Wall -Wextra -Wpedantic`:

```cpp
#include <array>

double mean_of_window() {
    std::array<double, 200000> window{};
    double sum = 0.0;
    for (double x : window) sum += x;
    return sum / window.size();
}
```

Two flags catch it. With `-Wstack-usage=16384`:

```text
chk-bigframe.cpp: In function 'double mean_of_window()':
chk-bigframe.cpp:3:8: warning: stack usage is 1600080 bytes [-Wstack-usage=]
```

and with `-Wframe-larger-than=16384`:

```text
chk-bigframe.cpp: In function 'double mean_of_window()':
chk-bigframe.cpp:8:1: warning: the frame size of 1600064 bytes is larger than 16384 bytes [-Wframe-larger-than=]
```

Set either number to your task's budget, and the build tells you when a frame grows past it. Neither is turned on by `-Wall`, `-Wextra` or `-Wpedantic`: you have to ask.

::: key
A stack frame holds a call's return address, saved registers, parameters and locals, and its size is a compile-time constant for a function without variable-length arrays. Measure it with `-fstack-usage`; bound it with `-Wframe-larger-than=`. Stack overflow is undefined behavior with no diagnostic from the language. Replace recursion with an explicit stack of fixed capacity and a defined behavior when that capacity is reached.
:::

## Check yourself

::: check
A task on a flight computer has a 32 KiB stack. Its deepest call path is `control_step` (1,200 bytes) to `estimate` (2,400 bytes) to `matrix_solve` (9,600 bytes) to `dot` (128 bytes). Is it safe, and what would you want to know before saying so?
:::

::: answer
Add the frames: $1200 + 2400 + 9600 + 128 = 13\,328$ bytes. The stack is $32 \times 1024 = 32\,768$ bytes, so the path uses about 41% of it. Comfortable, on the face of it.

Before calling it safe, you would want three more things.

1. Is this really the deepest path? The sum must be taken over the whole call graph. A stack-analysis tool does that; your eye cannot do it reliably.
2. Does anything on the path use a variable-length array, `alloca`, or a recursive call? Any of those makes the number meaningless. `-fstack-usage` flags the first two by printing `dynamic` instead of `static`.
3. Do interrupts run on this task's stack? An interrupt handler's frame lands on top of whatever is running. The budget is then the deepest task path plus the deepest interrupt path — and on many processors, plus nested interrupts.
:::

::: check
`-fstack-usage` said `deeper` uses 1072 bytes, yet its only declared local is a 1,024-byte array. Where did the other 48 bytes go, and why should you trust the tool's number over adding up `sizeof` of the locals?
:::

::: answer
Into the parts of the frame you did not declare: the return address (8 bytes), the saved frame pointer at `-O0` (8), the `depth` parameter stored on the stack, any registers the function must preserve, and padding to keep the stack pointer 16-byte aligned. $1072 - 1024 = 48$.

Adding up `sizeof` of your locals misses all of that. The gap grows with the number of parameters and changes with the optimization level, which also *moves* objects between registers and the frame. The tool reports what the compiler actually produced for the flags you built with, and that is the only number that means anything. Build your stack budget from `.su` files made with the same flags as the flight build.
:::

::: check
An engineer argues that recursion is fine here because the tree is only ever four levels deep. What is the counter-argument, and what would make the argument acceptable?
:::

::: answer
"Only ever four levels" is a claim about the data, enforced nowhere. The function accepts any tree. Nothing in it fails, or even notices, if a corrupted index or a future configuration file produces a deeper one. When that happens the result is a stack overflow — undefined behavior, which on a target without memory protection silently corrupts neighboring memory. The cost of being wrong is unlimited; the benefit is a slightly shorter function.

It becomes acceptable only if the depth is *enforced*, not assumed. Pass a remaining-depth counter, refuse and return an error when it reaches zero, and now the worst-case stack use is a constant you can compute and an analysis tool can see. At that point you have written the bounded version anyway — with clumsier code than an explicit stack.
:::

::: check
The sanitized build of the recursion test overflowed at depth 6540 instead of 7810. Does that mean AddressSanitizer found a bug the normal build does not have?
:::

::: answer
No. Both builds have the same bug — unbounded recursion — and both overflow. The sanitized one uses more stack per frame, about 1,283 bytes instead of 1,072, because it surrounds stack objects with redzones so that a local running into its neighbor can be detected.

What the sanitizer changed is the *reporting*. Instead of a bare `SIGSEGV`, it printed `stack-overflow` and the repeated frames that name the culprit. The practical lesson: a program sized to fit its stack with a small margin can fail under the sanitizer while being fine in production. Give sanitized runs more stack (with `ulimit -s`, or in the task's configuration) instead of treating the difference as a finding.
:::

::: check
Why does moving `std::array<double, 200000> window;` from a local to an object at namespace scope (outside any function) remove the stack problem, and what new problem does it create?
:::

::: answer
It changes the storage duration from automatic to static (lesson 01). The 1.53 MiB now lives in the program's own data for the whole run instead of in a frame, and the function's stack use drops to almost nothing.

The new problem is that there is now exactly one `window` for the whole program. The function is no longer **reentrant** — safe to run twice at once. Two tasks calling it corrupt each other's data with no warning, and an interrupt-time call does the same. It has also become mutable global state, which flight-software reviews object to most consistently, because any file can declare it `extern` and write to it.

The usual fix is to make the buffer a member of the subsystem object that owns the computation, created once during initialization, and to pass a `std::span` of it into the function. One buffer per subsystem, no global, no large frame.
:::

## Summary

| Item | Detail |
| --- | --- |
| stack | last on, first off; one frame per active call |
| frame | return address, saved registers, spilled parameters, locals, alignment padding |
| growth direction | downward on every common target; not specified by the standard |
| `-fstack-usage` | writes a `.su` file: one line per function with its frame size in bytes |
| `static` in a `.su` line | the frame size is a compile-time constant; `dynamic` means it is not |
| `ulimit -s` | 8192 KiB (8 MiB) on this machine; 8 to 64 KiB is typical per flight task |
| observed depth | 1072-byte frames overflowed 8 MiB at depth ≈ 7810; predicted 7825 |
| ASan overhead | redzones raised the effective frame to ≈ 1283 bytes; depth ≈ 6540 |
| `-Winfinite-recursion` | g++ 13.3.0; turned on by `-Wall` |
| `-Wframe-larger-than=N`, `-Wstack-usage=N` | per-function frame budget; neither is on by default |
| *Power of Ten* rule 1 | no recursion, so worst-case stack depth is computable |
| bounded replacement | an explicit stack of fixed capacity, plus a defined action on overflow |

Lesson 06 turns to the other place objects can live: `new` and `delete`, what each of them actually does, why the array forms have their own spelling, and what placement `new` is for.

::: context lifo Last in, first out
**LIFO** stands for "last in, first out": the most recent thing added is the first thing removed. A pile of plates works this way, and so does the Undo button in an editor.

Function calls fit it perfectly. If `a` calls `b` and `b` calls `c`, then `c` must finish before `b` can, and `b` before `a`. The frame added last is always the one removed first, so memory for calls never needs to be searched or rearranged — you only ever touch the top.
:::

::: context stack-pointer One register holds the top
The processor keeps the address of the top of the stack in a register, the **stack pointer** — called `rsp` on x86-64 and `sp` on ARM. Making room for a function's locals is, at heart, one instruction: subtract the number of bytes needed from it. Giving the room back is one addition.

That is the whole cost of allocating every local in the function at once. Compare the heap, in lesson 07, where each request is a function call that searches a data structure.
:::

::: context power-of-ten Ten rules from JPL
*The Power of Ten: Rules for Developing Safety-Critical Code* was written by Gerard Holzmann of NASA's Jet Propulsion Laboratory and published in *IEEE Computer* in 2006. It is ten short rules, chosen so that a tool can check each one.

Rule 1 restricts code to simple control flow: no `goto`, no `setjmp`/`longjmp`, and no direct or indirect recursion. Rule 3 forbids dynamic memory allocation after initialization, which is the subject of lessons 06 and 07. JPL built its C coding standard for flight software on these rules.
:::

::: context frame-layout One frame, top to bottom
A frame from this lesson at `-O0`, with higher addresses at the top. The caller's frame sits above; the next call's frame will be pushed below, toward lower addresses.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="90" y="10" width="170" height="24" fill="#ffffff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="175" y="26" font-size="12" fill="#6c7a93" text-anchor="middle">caller's frame</text>
  <rect x="90" y="34" width="170" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <text x="175" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">return address (8 B)</text>
  <rect x="90" y="58" width="170" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="175" y="74" font-size="12" fill="#1f2a44" text-anchor="middle">saved frame pointer (8 B)</text>
  <rect x="90" y="82" width="170" height="54" fill="#ffffff" stroke="#1f2a44"/>
  <text x="175" y="106" font-size="12" fill="#1f2a44" text-anchor="middle">locals and spilled</text>
  <text x="175" y="122" font-size="12" fill="#1f2a44" text-anchor="middle">parameters</text>
  <rect x="90" y="136" width="170" height="20" fill="#ffffff" stroke="#1f2a44" stroke-dasharray="3 3"/>
  <text x="175" y="150" font-size="11" fill="#6c7a93" text-anchor="middle">padding to 16 B</text>
  <line x1="266" y1="156" x2="300" y2="156" stroke="#b4232c" stroke-width="2"/>
  <text x="304" y="160" font-size="11" fill="#b4232c">sp</text>
  <line x1="60" y1="40" x2="60" y2="176" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="60,186 55,176 65,176" fill="#1f2a44"/>
  <text x="54" y="112" font-size="11" fill="#1f2a44" text-anchor="end">grows</text>
  <text x="54" y="126" font-size="11" fill="#1f2a44" text-anchor="end">down</text>
  <text x="175" y="176" font-size="11" fill="#6c7a93" text-anchor="middle">next call's frame goes here</text>
</svg>
```
:::

::: context kibibytes KiB, MiB and the powers of two
Memory sizes use powers of two. A **kibibyte**, KiB, is $2^{10} = 1024$ bytes, and a **mebibyte**, MiB, is $2^{20} = 1\,048\,576$ bytes. So `ulimit -s` reporting 8192 KiB means $8192 \times 1024 = 8\,388\,608$ bytes — exactly 8 MiB.

Plain "kB" and "MB" officially mean 1000 and 1,000,000, and people mix the two all the time. The difference is 2.4% at the kilo scale and 4.9% at the mega scale: small, but it will make a prediction look wrong if you use the wrong one.
:::

::: context rtos Real-time operating systems
A **real-time operating system**, or RTOS, is a small operating system for embedded computers. Its main job is to run several tasks and guarantee that each one gets the processor in time to meet its deadline. FreeRTOS, VxWorks and RTEMS are common examples; VxWorks ran the computers of several NASA Mars landers and rovers, from Pathfinder to Curiosity.

Unlike Linux, an RTOS usually gives each task a fixed stack whose size you write in a configuration file. That number is part of the design, and it is reviewed like any other budget.
:::

::: context sigsegv Signal 11 and status 139
When a Linux program touches memory it is not allowed to, the kernel sends it signal number 11, **SIGSEGV**, a "segmentation violation". Unless the program handles it, the process is killed.

The shell then reports a status of $128 + 11 = 139$: by convention, 128 plus the signal number means "killed by a signal". Status 134 is $128 + 6$, SIGABRT, which is what you see when a program calls `abort()` — for example after a failed `assert`.
:::

::: context redzones Why the sanitized frames are bigger
AddressSanitizer surrounds each stack object with a few dozen bytes of **redzone**: bytes that belong to nobody and are marked as forbidden in the sanitizer's map. A write that runs off the end of one local lands in a redzone and is reported, instead of quietly changing the next local.

The redzones make every frame larger, which is why the same recursion ran out of stack about 1,270 frames earlier under the sanitizer.
:::

::: context guard-page The tripwire below the stack
On Linux the main stack sits near the top of the address space and grows down. Below its limit the kernel leaves a **guard page**: a range of addresses mapped to nothing. The first push past the limit touches it, the hardware faults, and the process gets SIGSEGV.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="12" width="160" height="60" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="38" font-size="12" fill="#1f2a44" text-anchor="middle">stack (8 MiB)</text>
  <text x="180" y="56" font-size="11" fill="#1f2a44" text-anchor="middle">grows down</text>
  <rect x="100" y="72" width="160" height="22" fill="#b4232c" stroke="#1f2a44"/>
  <text x="180" y="87" font-size="12" fill="#ffffff" text-anchor="middle">guard page: faults</text>
  <rect x="100" y="94" width="160" height="40" fill="#ffffff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="180" y="118" font-size="11" fill="#6c7a93" text-anchor="middle">unmapped gap</text>
  <rect x="100" y="134" width="160" height="40" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="158" font-size="12" fill="#1f2a44" text-anchor="middle">heap and program data</text>
  <text x="92" y="22" font-size="11" fill="#1f2a44" text-anchor="end">high</text>
  <text x="92" y="172" font-size="11" fill="#1f2a44" text-anchor="end">low</text>
  <text x="268" y="87" font-size="11" fill="#1f2a44">Linux has it;</text>
  <text x="268" y="101" font-size="11" fill="#1f2a44">bare metal</text>
  <text x="268" y="115" font-size="11" fill="#1f2a44">often does not</text>
</svg>
```

A small processor without a memory protection unit has no way to make such a tripwire, so the overflow writes straight into whatever lies below.
:::

::: context stack-analysis How stack analysis works
A worst-case stack tool reads every function's frame size — from `.su` files, or from the machine code itself — and builds the call graph. It then finds the path from each task's entry point that adds up to the most bytes. AbsInt's StackAnalyzer is one commercial tool that does this from the binary.

That longest-path search only works if the graph has no cycles. With recursion, a path can go round the loop any number of times, so there is no maximum to report. Calls through function pointers are the other thing that makes these tools ask for help, because the target is not visible in the code.
:::

::: context explicit-stack The stack you manage yourself
The iterative search keeps its own small stack: an array of 8 slots and an index `top` that says how many are in use. Pushing writes at `top` and moves it up; popping moves it down and reads.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="40" width="40" height="30" fill="#8fb8f0"/><rect x="60" y="40" width="40" height="30" fill="#8fb8f0"/>
    <rect x="100" y="40" width="40" height="30" fill="#8fb8f0"/><rect x="140" y="40" width="40" height="30" fill="#ffffff"/>
    <rect x="180" y="40" width="40" height="30" fill="#ffffff"/><rect x="220" y="40" width="40" height="30" fill="#ffffff"/>
    <rect x="260" y="40" width="40" height="30" fill="#ffffff"/><rect x="300" y="40" width="40" height="30" fill="#ffffff"/>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="40" y="32">0</text><text x="80" y="32">1</text><text x="120" y="32">2</text><text x="160" y="32">3</text>
    <text x="200" y="32">4</text><text x="240" y="32">5</text><text x="280" y="32">6</text><text x="320" y="32">7</text>
  </g>
  <line x1="140" y1="100" x2="140" y2="76" stroke="#b4232c" stroke-width="2"/>
  <polygon points="140,72 135,82 145,82" fill="#b4232c"/>
  <text x="150" y="104" font-size="12" fill="#b4232c">top = 3</text>
  <text x="20" y="18" font-size="12" fill="#1f2a44">int stack[8]: three slots in use, five free</text>
</svg>
```

Before each push of two children, the code checks `top + 2 > kMaxDepth`. If the answer is yes, it returns $-1$ instead of writing past slot 7.
:::
