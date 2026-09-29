---
id: l11-std-function-and-callables
title: "std::function, templates and function pointers: three ways to pass a callable"
minutes: 21
covers:
  - std::function versus templates versus function pointers, and its allocation
---

Picture the luggage room at a hotel. You hand over a bag, and the clerk gives you a claim tag. Every tag looks the same, whatever the bag. A small bag goes on the shelf right behind the counter. A big one gets carried down the hall to the storeroom, which takes a trip there when you drop it off and a trip back when you collect it. You never need to know which happened. The tag hides it.

**`std::function`** is that luggage room for callables. It can hold any lambda, function or function object that can be called in a certain way, and it gives you one uniform "tag" type to store and pass around. Small callables sit inside it. Bigger ones go to the heap, which costs an allocation. And every call goes through the tag, never straight to the thing itself.

Last lesson ended with a timer that stored its callback in a `std::function`. This lesson opens that box. You will see the three ways C++ lets a function accept "something callable", measure exactly when `std::function` allocates, time what it costs inside a loop, and meet its newer relatives. In flight software, where the rule after start-up is often "no heap, and bounded time for everything", the choice between these three is a real design decision.

## Three ways to accept a callable

Suppose you are writing `apply_to_samples`, a function that runs some operation over a buffer of sensor readings. The caller supplies the operation. C++ gives you three ways to take it.

### A function pointer

```cpp
void apply_to_samples(double* data, int n, double (*op)(double));
```

Read `double (*op)(double)` as "`op` is a pointer to a function taking a `double` and returning a `double`". A **function pointer** holds the address of a function's machine code. It is 8 bytes on a 64-bit machine and never allocates.

Its limit is that it carries no data. It can point at an ordinary function, or at a lambda that captures nothing — a captureless lambda converts to a function pointer automatically. But `[gain](double x) { return gain * x; }` cannot become a function pointer, because there is nowhere in a bare address to keep `gain`. C interfaces, which cannot take lambdas, pass a separate `void* user_data` alongside the pointer for that reason.

### A template parameter

```cpp
template <typename Op>
void apply_to_samples(double* data, int n, Op op);
```

Read it as "for any type `Op`, a function taking an `Op` called `op`". The compiler writes a separate version of `apply_to_samples` for each callable type it is given. Inside each version, it knows the exact type of `op`. For a lambda, that means it can see the body and **inline** it: paste the body into the loop and optimize the two together. This is how the standard algorithms take their callables, and why `std::sort` with a lambda can be faster than C's `qsort`, which receives a function pointer.

The price is that the callable's type is part of the function's type. You cannot write one member variable that holds "any `Op`", and you cannot put a lambda that captures a gain and one that captures a table into the same `std::vector`. The code must also be visible where it is used, so templates live in headers, and each distinct type adds another copy of the machine code.

### A std::function

```cpp
void apply_to_samples(double* data, int n, const std::function<double(double)>& op);
```

Read `std::function<double(double)>` as "a function wrapper for anything callable with a `double`, returning a `double`". The part in angle brackets, `double(double)`, is a **signature**: the return type, then the parameter types in parentheses.

A `std::function` can hold any **callable** of that signature — a function pointer, a lambda with any captures, a function object like `LowPass` — as long as it can be copied. Its own type does not change with what it holds. So it can be a class member (the timer's callback), an element of a `std::vector` or a `std::map` (a table of command handlers), or a parameter of a non-template function in a `.cpp` file.

It can also be empty. A default-constructed `std::function` holds nothing; testing it with `if (fn)` tells you, and calling an empty one throws `std::bad_function_call`.

::: key
Three ways to take a callable: a function pointer (8 bytes, no state, cannot hold a capturing lambda), a template parameter (exact type known, can be inlined, but the type is baked into the function), and `std::function<R(Args...)>` (holds any copyable callable of that signature behind one type, at a cost).
:::

## How one type holds anything: type erasure

A `std::function<double()>` can hold a 1-byte captureless lambda one moment and a 24-byte lambda the next. How can one type do that? The technique is called **[[type erasure|type-erasure-name]]**: the wrapper forgets the callable's real type on the outside, while remembering on the inside how to deal with it.

In g++'s library (libstdc++), a `std::function` is 32 bytes on a 64-bit machine, laid out like this:

- a 16-byte **buffer**, which holds either the callable itself or a pointer to a heap copy of it;
- a pointer to an **invoker**, a small function the library generated for this exact callable type, which knows how to call it;
- a pointer to a **manager**, another generated function, which knows how to copy it, move it and destroy it.

When you store a lambda, the library fills in those two function pointers with versions written for that lambda's type. When you call the `std::function`, it jumps through the invoker pointer. That is the same idea as the **[[vtable|vtable-bridge]]** of the last module's lesson 11: behavior chosen at run time by following a pointer the object carries. The difference is that you did not have to write a base class; the library made one up for you.

### The small buffer, and when it overflows

Keeping small callables inside the object itself, instead of on the heap, is called the **small-buffer optimization**. In libstdc++ (g++ 13) a callable is stored inside the 16-byte buffer only if all three are true:

1. it is at most 16 bytes;
2. its alignment fits the buffer (anything up to 8-byte alignment on x86-64);
3. it is **[[trivially copyable|trivially-copyable]]** — copying it is a plain byte copy, with no copy constructor of its own to run.

Otherwise the library calls `new` to put the callable on the heap and keeps only a pointer in the buffer.

The standard itself promises very little here. It guarantees that storing a plain function pointer, or a `std::reference_wrapper` (a copyable reference, made with `std::ref`), never allocates. For everything else it only says implementations *should* avoid allocating for small callables. Other standard libraries choose different buffer sizes and different rules, so measure on the library you ship.

::: key
`std::function` is type-erased: calling through it is an indirect call that resists inlining, and it may heap-allocate if the callable does not fit its small buffer. Pass the lambda as a template parameter instead when you control the call site.
:::

## Measuring the allocation

Talk about allocations is cheap. Counting them is better. C++ lets a program **[[replace the global operator new|replace-new]]**: if you define your own `operator new(std::size_t)`, every `new` in the program — including the ones inside the standard library — calls yours instead. Put a counter in it, and you can watch the library allocate.

::: example Counting std::function's allocations
```cpp
#include <cstdio>
#include <cstdlib>
#include <functional>
#include <memory>
#include <new>
#include <utility>

// Replace the global operator new so that every heap allocation is counted.
static int g_allocs = 0;

void* operator new(std::size_t n) {
    ++g_allocs;
    if (void* p = std::malloc(n)) return p;
    throw std::bad_alloc{};
}
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }

// Store a callable in a std::function and report how many allocations that took.
template <typename F>
void measure(const char* label, F f) {
    const int before = g_allocs;
    std::function<double()> fn = f;
    std::printf("%-22s %2zu bytes -> %d allocation(s), fn() = %.1f\n",
                label, sizeof(F), g_allocs - before, fn());
}

int main() {
    std::printf("sizeof(std::function<double()>) = %zu\n", sizeof(std::function<double()>));
    double a = 1.0, b = 2.0, c = 3.0;
    measure("no capture",            [] { return 0.0; });
    measure("one double",            [a] { return a; });
    measure("two doubles",           [a, b] { return a + b; });
    measure("three doubles",         [a, b, c] { return a + b + c; });
    auto sp = std::make_shared<double>(4.0);        // made before any counting starts
    measure("shared_ptr capture",    [sp] { return *sp; });
    double (*fp)() = [] { return 5.0; };
    measure("function pointer",      fp);

    // Copying and moving a std::function whose callable lives on the heap.
    std::function<double()> big = [a, b, c] { return a + b + c; };
    int before = g_allocs;
    std::function<double()> copy = big;
    std::printf("copy: %d allocation(s)\n", g_allocs - before);
    before = g_allocs;
    std::function<double()> moved = std::move(big);
    std::printf("move: %d allocation(s)\n", g_allocs - before);
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2` (g++ 13, libstdc++), it prints:

```
sizeof(std::function<double()>) = 32
no capture              1 bytes -> 0 allocation(s), fn() = 0.0
one double              8 bytes -> 0 allocation(s), fn() = 1.0
two doubles            16 bytes -> 0 allocation(s), fn() = 3.0
three doubles          24 bytes -> 1 allocation(s), fn() = 6.0
shared_ptr capture     16 bytes -> 1 allocation(s), fn() = 4.0
function pointer        8 bytes -> 0 allocation(s), fn() = 5.0
copy: 1 allocation(s)
move: 0 allocation(s)
```

Read it line by line.

1. The wrapper itself is 32 bytes: the 16-byte buffer plus two 8-byte pointers, $16 + 8 + 8 = 32$.
2. Captures of 1, 8 and 16 bytes fit the buffer: no allocation.
3. Three `double`s make a 24-byte closure. $24 > 16$, so the library allocates. **This is the threshold on libstdc++: the 17th byte of capture sends the callable to the heap.**
4. The `shared_ptr` capture is only 16 bytes, yet it allocates. A `shared_ptr` has a real copy constructor — it bumps a reference count — so the closure is not trivially copyable, and rule 3 fails. Size is not the only test.
5. A function pointer never allocates, as the standard promises.
6. Copying a `std::function` whose callable is on the heap allocates again, because the copy needs its own heap copy of the callable. Moving it does not: the move hands the heap pointer over.

Sanity check: every call returned the sum of what it captured ($1 + 2 + 3 = 6$ for three doubles), so the wrapper stored and called each callable correctly; only the storage changed.
:::

::: warning The allocation hides in an innocent line
`handlers[cmd] = [this, cmd, limits] { ... };` looks like an assignment. If the closure is bigger than the buffer, or holds anything with a copy constructor, it is also a heap allocation, and assigning over an existing target also frees the old one. Doing it once during start-up is usually fine. Doing it inside the control loop means calling the allocator at 1 kHz, with its unbounded worst-case time and the fragmentation the memory module warned about.
:::

## What it costs to call

Allocation happens when you store a callable. The other cost is paid on every call. Calling through a `std::function` means loading the invoker pointer and jumping to wherever it points: an **[[indirect call|indirect-call]]**. The jump itself is cheap on a modern processor. What it really costs is what the compiler can no longer do: it cannot see the body, so it cannot inline it, and a loop around the call cannot be optimized as one piece.

A function pointer has exactly the same problem. A template parameter does not.

::: example The same loop, three ways
Each version sums a calibration step, $3x + 7$, over one million raw sensor counts, repeated 100 times.

```cpp
#include <chrono>
#include <cstdint>
#include <cstdio>
#include <functional>
#include <vector>

// Scale each raw sensor count by a calibration step, three ways.
template <typename F>
[[gnu::noipa]] std::int64_t run_template(const std::vector<std::int32_t>& v, F f) {
    std::int64_t acc = 0;
    for (std::int32_t x : v) acc += f(x);
    return acc;
}

[[gnu::noipa]] std::int64_t run_pointer(const std::vector<std::int32_t>& v,
                                        std::int32_t (*f)(std::int32_t)) {
    std::int64_t acc = 0;
    for (std::int32_t x : v) acc += f(x);
    return acc;
}

[[gnu::noipa]] std::int64_t run_function(const std::vector<std::int32_t>& v,
                                         const std::function<std::int32_t(std::int32_t)>& f) {
    std::int64_t acc = 0;
    for (std::int32_t x : v) acc += f(x);
    return acc;
}

std::int32_t calibrate(std::int32_t x) { return 3 * x + 7; }

template <typename Run>
void time_it(const char* name, Run run, std::size_t calls) {
    std::int64_t r = 0;
    const auto t0 = std::chrono::steady_clock::now();
    for (int rep = 0; rep < 100; ++rep) r += run();
    const auto t1 = std::chrono::steady_clock::now();
    const double ns = std::chrono::duration<double, std::nano>(t1 - t0).count();
    std::printf("%-14s %.2f ns per element (checksum %lld)\n",
                name, ns / (100.0 * calls), static_cast<long long>(r));
}

int main() {
    std::vector<std::int32_t> v(1'000'000);
    for (std::size_t i = 0; i < v.size(); ++i) v[i] = static_cast<std::int32_t>(i % 4096);

    auto lam = [](std::int32_t x) { return 3 * x + 7; };
    std::int32_t (*volatile chosen)(std::int32_t) = &calibrate;  // hide the target from the optimiser
    std::function<std::int32_t(std::int32_t)> fn = lam;

    time_it("template",      [&] { return run_template(v, lam); }, v.size());
    time_it("fn pointer",    [&] { return run_pointer(v, chosen); }, v.size());
    time_it("std::function", [&] { return run_function(v, fn); }, v.size());
}
```

Two lines need explaining. `[[gnu::noipa]]` tells g++ not to optimize across the call boundary of that function; without it, g++ noticed that the function pointer only ever pointed at `calibrate` and quietly turned the "pointer" version into the template version. The `volatile` on `chosen` makes the same point from the other side. Real code picks its callback at run time, and the benchmark has to as well.

On one machine, built with `-O2`, three runs gave:

```
template       0.34 ns per element (checksum 614645872000)
fn pointer     1.26 ns per element (checksum 614645872000)
std::function  1.35 ns per element (checksum 614645872000)
template       0.37 ns per element (checksum 614645872000)
fn pointer     1.31 ns per element (checksum 614645872000)
std::function  1.27 ns per element (checksum 614645872000)
template       0.37 ns per element (checksum 614645872000)
fn pointer     1.27 ns per element (checksum 614645872000)
std::function  1.30 ns per element (checksum 614645872000)
```

What it shows:

1. All three checksums agree, so all three computed the same thing.
2. The template version took about 0.35 ns per element. The compiler pasted `3 * x + 7` into the loop — in the assembly it became a single `lea` instruction — so each element costs a load, that one instruction, and an add. No call, no return, no passing arguments.
3. The function pointer and the `std::function` both took about 1.3 ns: roughly four times slower. Each element pays for a real call and return.
4. `std::function` was no slower than the plain function pointer here. Its call path is one extra hop, which this processor hid. The expensive part is the same for both: the body is out of sight.

Rebuilt with `-O3`, the template version dropped to about 0.22 ns per element, because the optimizer could now see the whole loop and rewrote it with **[[vector instructions|simd]]** that handle four elements at once. The other two stayed at about 1.2 ns: they cannot be rewritten that way while the body is out of sight.

Your numbers will differ with the processor and compiler. The shape — template fastest by a wide margin when the body is tiny, pointer and `std::function` close together — is typical. When the body is large (a whole Kalman filter update), the call overhead is a rounding error and the choice is about design, not speed.
:::

## Choosing between them

| You need | Use | Why |
| --- | --- | --- |
| to call a callback in a hot loop, and you control the call site | a template parameter | inlined; zero overhead |
| to store callbacks of different lambda types in one member or container | `std::function` | one type for any callable |
| to talk to C code or an interrupt vector table | a function pointer | the only form C understands |
| a stored callback in code that must not allocate after start-up | a function pointer plus a context pointer, or a fixed-capacity wrapper | bounded size, no heap |

In flight software the last row matters. A common rule, stated plainly in [[JPL's coding rules|jpl-rules]], is no dynamic memory allocation after initialization. `std::function` fits that rule only if every callable stored in it is known to fit the small buffer, or every assignment happens during start-up. Neither is visible at the line where you write the lambda. Some teams therefore write, or borrow, a fixed-capacity wrapper that keeps the callable in an inline buffer of a size they choose and refuses, at compile time, any callable too big for it.

## The newer relatives, honestly

The standard library has been filling the gaps around `std::function`. Check which standard your compiler and your project actually use before reaching for these.

**`std::move_only_function`** (C++23, header `<functional>`) holds callables that can be moved but not copied. Remember last lesson's lambda that owned a `unique_ptr` through an init-capture? `std::function` rejects it, because it demands copyable callables. g++ 13 says:

```
error: static assertion failed: std::function target must be copy-constructible
```

With `-std=c++23`, this compiles and runs on the same g++ 13:

```cpp
auto buf = std::make_unique<double>(9.81);
std::move_only_function<double()> task = [b = std::move(buf)] { return *b; };
// task() returns 9.81
```

It also respects `const` properly, and calling an empty one is undefined behavior instead of a thrown exception. It still type-erases, may still allocate for large callables, and still resists inlining.

**`std::function_ref`** is in C++26, and g++ 13 does not provide it. It does not own the callable at all. It is a reference — in practice, a pointer to the callable plus a pointer to an invoker — so it never allocates and is cheap to pass. It is to callables what `std::span` and `std::string_view` (lesson 4) are to buffers and text. And it has the same hazard: if the callable dies first, the `function_ref` dangles. Use it as a function parameter for a callback used during that call, never as a stored member. C++26 also adds `std::copyable_function`, a tidier version of `std::function`.

::: key
A lambda that owns a `unique_ptr` cannot go in a `std::function`, which requires copyable callables; C++23's `std::move_only_function` holds it. C++26's `std::function_ref` is non-owning and never allocates, and dangles like a `span` if the callable dies first.
:::

## Check yourself

::: check
A lambda is written `[&a, &b, &c] { return a + b + c; }` with three `double` locals. With g++ 13's libstdc++, does storing it in a `std::function<double()>` allocate? What about `[p] { return *p; }` where `p` is a `double*`?
:::

::: answer
The first captures three references. g++ stores each as an 8-byte address, so the closure is $3 \times 8 = 24$ bytes, more than the 16-byte buffer: it allocates, even though it captures only references. The second captures one raw pointer: 8 bytes, trivially copyable (a pointer copy is a byte copy), alignment 8, so it sits in the buffer with no allocation. A closure's size is the size of its captures, not of the things they point at.
:::

::: check
Why can the compiler inline the lambda in `template <typename Op> void apply(double* d, int n, Op op)` but not in `void apply(double* d, int n, const std::function<double(double)>& op)`?
:::

::: answer
In the template version, each call site creates a version of `apply` where `Op` is the lambda's exact closure type, and the compiler can see that type's `operator()` body, so it can paste it into the loop. In the `std::function` version, `apply` is compiled once for every possible callable. Inside it, the only thing known is "some invoker pointer"; the body lives behind that pointer and is chosen at run time, so the compiler cannot see it to inline it.
:::

::: check
A command dispatcher stores `std::vector<std::function<void()>> handlers` and fills it during start-up. The control loop only calls `handlers[i]()`. Does the loop allocate? What would change that?
:::

::: answer
Calling a `std::function` never allocates; allocation happens only when a callable is stored, copied or assigned into it. So a loop that only calls the handlers does not allocate, and any allocations during start-up are acceptable under a "no heap after initialization" rule. It would change if the loop assigned a new lambda to a handler, copied a `std::function` holding a heap-stored callable, or grew the vector — each of those can call `operator new`.
:::

::: check
Your team needs a callback parameter for `for_each_channel(fn)`, which calls `fn` for each of 128 channels and returns. It is not stored. List two good choices and one poor one, with reasons.
:::

::: answer
Good: a template parameter, `template <typename F> void for_each_channel(F fn)` — the lambda is inlined and nothing is stored, so there is no lifetime issue. Also good, if the function must live in a `.cpp` file: C++26's `std::function_ref<void(int)>`, which is non-owning and never allocates; it is safe here because the callable outlives the call. Poor: `std::function<void(int)>` — it may allocate every time a large enough lambda is passed, only to hold something that lives for the call, and it blocks inlining.
:::

::: check
The standard guarantees that storing one kind of callable in a `std::function` never allocates. Which, and why does that not tell you whether your lambda will allocate?
:::

::: answer
Plain function pointers and `std::reference_wrapper` objects (made with `std::ref`): their constructors are not allowed to throw, which rules out allocating. For every other callable, including all capturing lambdas, the standard only recommends avoiding allocation for "small" ones and leaves the buffer size and rules to the library. libstdc++ uses a 16-byte buffer and requires trivially copyable callables; another library may differ. So the only way to know is to measure on the library you ship, as the counting program did.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| function pointer `R (*f)(Args)` | address of a function | 8 bytes, no state; captureless lambdas convert to it |
| template parameter `Op op` | callable of an exact type | inlinable; type baked into the function |
| `std::function<R(Args...)>` | holds any copyable callable of that signature | one type; empty call throws `std::bad_function_call` |
| type erasure | hide the real type behind generated functions | invoker and manager pointers, like a vtable |
| small-buffer optimization | small callables stored inside the object | libstdc++: 32-byte object, 16-byte buffer, trivially copyable only |
| allocation | callable too big or not trivially copyable | copying allocates again; moving does not |
| call cost | indirect call, no inlining | on one machine about 1.3 ns vs 0.35 ns per element at `-O2` |
| `std::move_only_function` | C++23, move-only callables | still type-erased |
| `std::function_ref` | C++26, non-owning | never allocates; can dangle |

The next lesson turns to two parts of the library every flight program leans on: `<chrono>` for time — the period of the control loop and the timestamp on a telemetry packet — and `<random>` for reproducible Monte Carlo runs.

::: context type-erasure-name What gets erased
The "type" in type erasure is the callable's own type — the unique closure class of each lambda. From the outside, every `std::function<double()>` has the same type, whatever it holds, so that information has been erased from the type system. It is not lost, though: it lives on inside the two generated functions, which were written for exactly that closure type. The same trick powers `std::any` and `std::shared_ptr`'s custom deleters.
:::

::: context vtable-bridge A vtable the library writes
In the last module, a class with virtual functions got a vtable: a table of function pointers, one per virtual function, and each object carried a pointer to its class's table. `std::function` does the same job with two function pointers stored directly in the object instead of a pointer to a shared table.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="10" y="16" font-size="12" fill="#1f2a44">std::function (libstdc++), 32 bytes</text>
  <rect x="10" y="26" width="160" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="47" font-size="12" text-anchor="middle" fill="#1f2a44">buffer, 16 bytes</text>
  <rect x="170" y="26" width="85" height="34" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="212" y="47" font-size="12" text-anchor="middle" fill="#1f2a44">manager</text>
  <rect x="255" y="26" width="85" height="34" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="297" y="47" font-size="12" text-anchor="middle" fill="#1f2a44">invoker</text>
  <line x1="90" y1="60" x2="90" y2="104" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="90,110 85,100 95,100" fill="#b4232c"/>
  <rect x="20" y="112" width="140" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="131" font-size="12" text-anchor="middle" fill="#1f2a44">24-byte closure</text>
  <text x="90" y="160" font-size="11" text-anchor="middle" fill="#6c7a93">on the heap if it does not fit</text>
  <text x="255" y="90" font-size="11" text-anchor="middle" fill="#1f2a44">generated for this</text>
  <text x="255" y="105" font-size="11" text-anchor="middle" fill="#1f2a44">closure type:</text>
  <text x="255" y="120" font-size="11" text-anchor="middle" fill="#1f2a44">copy, destroy, call</text>
</svg>
```

The order of the three fields inside the object is the library's business; this drawing shows what is there, not where.
:::

::: context trivially-copyable Copying by bytes
A type is trivially copyable when copying it means copying its bytes and nothing else: no user-written copy constructor, no reference count to bump, no buffer to duplicate. `int`, `double`, raw pointers and structs of them qualify. `std::shared_ptr`, `std::string` and `std::vector` do not. libstdc++ insists on it for the small buffer because the wrapper then may copy or move the stored callable with a plain byte copy, with no code of the callable's own to run.
:::

::: context replace-new One of the few functions you may replace
The global `operator new` and `operator delete` are "replaceable": the standard library supplies default versions, and if your program defines its own with the exact same signatures, the linker uses yours everywhere, including inside the library. Test harnesses use this to count allocations, or to forbid them: an `operator new` that aborts once start-up is over makes any hidden allocation fail loudly. The array forms (`new[]`) and the aligned forms are separate functions; a complete replacement covers them too.
:::

::: context indirect-call A jump to an address in a register
A direct call names its target in the instruction itself, so the processor knows where it is going before it gets there. An indirect call reads the target from memory or a register. Modern processors guess the target from history and are usually right for a callback that always points to the same function, so the jump itself costs little. The larger cost is the lost optimization around it.
:::

::: context simd One instruction, several numbers
SIMD, "single instruction, multiple data", means one machine instruction that works on a short row of values at once. An x86-64 processor with SSE2 has 16-byte registers, room for four 32-bit integers, so a single add can do four additions. When the compiler can see a loop's whole body and finds no dependency that blocks it, it rewrites the loop to use these instructions. A call to an unknown function blocks it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">one instruction: 3x + 7 on four counts</text>
  <rect x="10" y="30" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="70" y="30" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="130" y="30" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="190" y="30" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="100" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="160" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">2</text>
  <text x="220" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">3</text>
  <rect x="10" y="84" width="60" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="70" y="84" width="60" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="130" y="84" width="60" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="190" y="84" width="60" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">7</text>
  <text x="100" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">10</text>
  <text x="160" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">13</text>
  <text x="220" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">16</text>
  <line x1="130" y1="62" x2="130" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="130,84 125,75 135,75" fill="#1f2a44"/>
  <text x="300" y="50" font-size="11" text-anchor="middle" fill="#6c7a93">16-byte register</text>
  <text x="300" y="104" font-size="11" text-anchor="middle" fill="#6c7a93">four results</text>
</svg>
```
:::

::: context jpl-rules The Power of Ten
In 2006 Gerard Holzmann of NASA's Jet Propulsion Laboratory published "The Power of Ten: Rules for Developing Safety-Critical Code", ten short rules for C. Rule 3 forbids dynamic memory allocation after initialization, because allocators have unpredictable timing and can fail. JPL's later institutional C coding standard kept the rule, and many C++ flight projects apply the same principle, which is why a hidden `new` inside a library type is a review question.
:::
