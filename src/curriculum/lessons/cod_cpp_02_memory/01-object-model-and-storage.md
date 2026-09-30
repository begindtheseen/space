---
id: l01-object-model-and-storage
title: The object model: storage, lifetime, and the address of a thing
minutes: 24
covers:
  - 'Storage duration: automatic, static, thread-local, dynamic; lifetime and initialization order'
---

Think of a hotel. The rooms are there before any guest arrives, and they are still there after the guest checks out. A room has a number on the door, so anyone can find it. But "room 214" and "the guest in room 214" are not the same thing. Once the guest has left, knocking on 214 gets you an empty room — or a stranger.

C++ memory works the same way. The bytes are the rooms. An **object** is the guest: something with a type and a value, living in those bytes for a while. The room number is the object's **address**. And every bug in this module is a version of one sentence: *you knocked on a door after the guest had left.*

Python hides the hotel from you: the interpreter keeps each object alive as long as some name can reach it, so you can never hold a name for a dead object. C++ gives you the keys. So for every object you must know where its bytes are, who made them, and when they stop being that object.

On a vehicle this is daily work. Flight software allocates its buffers once, before the control loop starts, then runs for months without a single `new`. The previous module showed stack, static and heap in outline. This lesson gives the rules hard edges and adds the one storage duration the previous module only mentioned.

## An object is a region of storage

In everyday speech "object" means "an instance of a class". The C++ standard means something narrower and more useful: **an object is a region of storage with a type, a value and a lifetime.**

- An `int` is an object. So is a `double`. An array is an object that holds other objects.
- A function is *not* an object. It has an address, but it is code, not data.
- A reference is not an object. The compiler may or may not give it any bytes.
- A `constexpr` variable is an object, but if nothing ever takes its address, the compiler may never give it any bytes at all.

Three operators read an object's properties directly:

- `sizeof x`, read "size of x", is the number of bytes the object takes up. The compiler knows it before the program runs.
- `&x`, read "address of x", is where the object's first byte is.
- `alignof(T)`, read "align of T", is the address boundary an object of type `T` must start on — a multiple of 4, say. Lesson 10 makes this a whole subject.

Most of what looks mysterious about C++ memory follows from these three being real, visible and yours to misuse.

## The address space is one long row of bytes

Picture every byte your program can touch as a numbered mailbox along one very long street. An address is a mailbox number. `printf` with `%p` prints an address in **[[hexadecimal|hex-addresses]]** (base 16, written with a leading `0x`, read "hex"). Lesson 03 covers the arithmetic you can do on addresses. First, look at what the numbers are:

```cpp
#include <cstdio>

int g_static_init = 42;        // static storage, constant-initialised
int g_bss;                     // static storage, zero-initialised
const char* kMsg = "telemetry";

void print(const char* what, const void* p) {
    std::printf("%-22s %p\n", what, p);
}

int main() {
    int local_a = 1;
    int local_b = 2;
    static int fn_static = 3;
    int* heap = new int(4);

    print("g_static_init", &g_static_init);
    print("g_bss", &g_bss);
    print("fn_static", &fn_static);
    print("string literal", kMsg);
    print("heap object", heap);
    print("local_a", &local_a);
    print("local_b", &local_b);
    delete heap;
    return 0;
}
```

Built with `g++ -std=c++20 -Wall -Wextra -Wpedantic` (g++ 13.3.0) and run once on this machine:

```text
g_static_init          0x562c5cb32010
g_bss                  0x562c5cb32024
fn_static              0x562c5cb32014
string literal         0x562c5cb30004
heap object            0x562c7c90d2b0
local_a                0x7ffcaad09548
local_b                0x7ffcaad0954c
```

::: warning Never test an address
Those numbers change on every run and on every machine. Linux shuffles the starting points of the program, the heap and the stack at each start. This is called **[[address space layout randomization|aslr]]** (ASLR), and it exists so that an attacker cannot predict where anything is. Three more runs here put the heap object at `0x5577e8f202b0`, `0x55fffbef32b0` and `0x55fb7fbc42b0`. What repeats is the *shape*: what sits near what, and the huge gap between the stack and everything else. Never write a test that checks an address.
:::

Now read the shape.

The three static objects and the string literal all sit within about 8 KB of each other, near `0x562c5cb30000`. They are part of the **program image** — the bytes loaded from the executable file, laid out by the linker.

The heap object is about 510 MiB higher, in memory the allocator asked the operating system for while the program ran.

The two locals start with `0x7ffc…`, roughly 42 TiB away from everything else. The stack is placed near the top of the address space and grows downward as function calls nest.

That is the whole map: **[[image, heap, stack|memory-map]]** — three regions, with different managers and different rules. Which region an object lands in is decided by one property of its declaration, called its storage duration.

::: example Where the four durations put their bytes
Take each line of the listing and name the rule that put it there.

- `g_static_init` and `g_bss` are declared outside any function, at namespace scope. That gives them **static storage duration**. Their addresses are fixed relative to the program image before `main` starts. `g_static_init` has a constant initializer, so the value 42 is stored in the executable file itself. `g_bss` has none, so it starts at zero, and the file only records "four zero bytes needed here". The two live in different **[[sections|image-sections]]** of the image, which is why they are 20 bytes apart ($\mathrm{0x24} - \mathrm{0x10} = 36 - 16 = 20$) rather than four.
- `fn_static` is a `static` local. It also has static storage duration and also sits in the image — four bytes after `g_static_init`. Writing `static` inside a function changes where and how long the object lives. It does not change who can see the name.
- The string literal `"telemetry"` is ten `const char` (nine letters plus an ending zero byte), with static storage duration, in a *read-only* section. Writing into a literal through a `char*` is undefined behavior. On this build it crashes with a **segmentation fault** — the operating system stopping a program that touched memory it may not — with exit status 139, because the operating system has marked those pages read-only.
- `heap` points at an object with **dynamic storage duration**, made by `new`. Its bytes came from the allocator, and they stay until `delete`.
- `local_a` and `local_b` have **automatic storage duration**. They live in `main`'s **stack frame** — the block of stack memory a function gets while it runs. Here they are four bytes apart, but the standard promises no order or spacing. At `-O2` the compiler may keep them in registers and give them no address at all.

Sanity check on the gap: $\mathrm{0x562c5cb32010} - \mathrm{0x562c5cb30004} = 8204$ bytes, a little over 8 KB. Read-only and writable data sit on separate 4 KB pages so each can get its own permission, so a gap of a couple of pages is expected.

The fourth duration, thread-local, is missing because this program has only one thread. It is next.
:::

## Four storage durations

Back to the hotel. Some guests stay one night, some live there, some rooms are "one per tour group", and some you rent yourself and must remember to give back. Those are the four storage durations.

The **storage duration** of an object is the rule that decides when its bytes appear and when they disappear. Every object has exactly one.

| Duration | Bytes come from | Appear | Disappear |
| --- | --- | --- | --- |
| automatic | the current stack frame | when the enclosing block is entered | at the end of the block |
| static | the program image | before `main` runs | after `main` returns |
| thread-local | per-thread storage | when the thread starts | when that thread ends |
| dynamic | the allocator | at `new` | at `delete` |

Lesson 11 of the previous module used automatic, static and dynamic. Thread-local is new. It is the tool for a logging counter, a scratch buffer or a random-number generator that must belong to one task, when you do not want to guard a shared one with a lock.

A **[[thread|what-is-a-thread]]** is one line of execution inside a program. A program with several threads runs several pieces of code at once, all sharing the same memory.

::: example One counter per thread, one for the program
`g_shared_count` has static storage duration, so there is exactly one of it. `t_count` is declared `thread_local`, so there is one *per thread*, each starting from its own initial value.

```cpp laptop
#include <cstdio>
#include <thread>

int            g_shared_count = 0;   // one object for the whole program
thread_local int t_count      = 0;   // one object per thread

void log_sample(const char* who, int n) {
    for (int i = 0; i < n; ++i) { ++g_shared_count; ++t_count; }
    std::printf("%s: t_count = %d, g_shared_count = %d\n", who, t_count, g_shared_count);
}

int main() {
    std::thread a([]{ log_sample("imu  thread", 3); });
    a.join();
    std::thread b([]{ log_sample("star thread", 5); });
    b.join();
    log_sample("main thread", 2);
    return 0;
}
```

Built with `g++ -std=c++20 -Wall -Wextra -Wpedantic -pthread`:

```text
imu  thread: t_count = 3, g_shared_count = 3
star thread: t_count = 5, g_shared_count = 8
main thread: t_count = 2, g_shared_count = 10
```

Walk through it. (`++x`, read "plus plus x", adds one to `x`.)

1. The IMU thread adds 1 three times to both counters. Its own `t_count` is 3, and the shared counter is 3.
2. The star-tracker thread adds 1 five times. Its `t_count` started at zero in this new thread, so it reads 5, not 8. The shared counter reads $3 + 5 = 8$.
3. The main thread adds 1 twice. Its own `t_count` is 2. The shared counter reads $8 + 2 = 10$.

Each `t_count` is destroyed when its thread ends. `a.join()` means "wait here until thread `a` has finished". The joins make the output order fixed. Without them, two threads would be changing `g_shared_count` at the same time. That is a **[[data race|data-race]]**, which is undefined behavior, and `volatile` does not fix it — lesson 12 explains why.

The cost: reading a `thread_local` may need a lookup to find this thread's copy. In a 1 kHz loop, measure it before assuming it is free.
:::

## Lifetime is narrower than storage

Here is the distinction the whole module depends on. The room exists before the guest checks in and after the guest checks out. In C++ terms: **storage** (the bytes) and **lifetime** (the time the object exists) are not the same interval.

For an object of class type, the sequence is:

1. storage is obtained (the frame is entered, `new` gets bytes, the image is loaded);
2. the constructor runs;
3. **the lifetime begins** — now the object exists;
4. the destructor runs;
5. **the lifetime ends**;
6. storage is released.

Between steps 1 and 3, the bytes are there but they are not yet an object. Between steps 5 and 6, the bytes are still there but they are no longer an object. Using those bytes as if the object were there is **undefined behavior**: the language makes no promise at all about what happens — not "you read garbage", not "it usually works". The compiler may assume you never do it, and optimizes on that assumption.

So "the memory is still mapped, why did it break?" is the wrong question about a use-after-free. Whether the bytes are still mapped is a fact about the allocator. Whether the object is there is a fact about the language. [[The two timelines|lifetime-timeline]] are different lengths on purpose.

::: example Lifetime begins after the constructor, and only one object is built
```cpp
#include <cstdio>

struct Sample {
    double value;
    explicit Sample(double v) : value(v) { std::printf("  ctor  Sample(%.1f)\n", v); }
    ~Sample() { std::printf("  dtor  Sample(%.1f)\n", value); }
};

Sample make_one() {
    std::printf("make_one: about to construct the return value\n");
    return Sample{2.5};
}

int main() {
    std::printf("A: storage for s is already reserved in main's frame\n");
    Sample s{1.0};
    std::printf("B: s's lifetime has begun; s.value = %.1f\n", s.value);
    {
        Sample t = make_one();
        std::printf("C: t.value = %.1f\n", t.value);
    }
    std::printf("D: t is gone, s is not\n");
    return 0;
}
```

```text
A: storage for s is already reserved in main's frame
  ctor  Sample(1.0)
B: s's lifetime has begun; s.value = 1.0
make_one: about to construct the return value
  ctor  Sample(2.5)
C: t.value = 2.5
  dtor  Sample(2.5)
D: t is gone, s is not
  dtor  Sample(1.0)
```

Line A prints *before* any constructor: `main`'s frame, including the bytes for `s`, was set up when `main` was entered. `s` became an object only when `Sample{1.0}` finished.

Then `make_one` runs, and `Sample{2.5}` is constructed. There is exactly one `ctor` line for 2.5 and one `dtor` line, when `t`'s block closes. It looks as if the value is built inside `make_one` and then copied into `t`, but no copy happens.

That is a C++17 rule worth knowing. When a function returns a **[[prvalue|prvalue]]** — a freshly made temporary value like `Sample{2.5}` — of the same type as the object being initialized, the language *guarantees* that the value is built directly in the caller's storage. There is no copy to skip, because there was never a second object.

Finally `s` dies last, in reverse order of construction. Sanity check: two constructions, two destructions, one of each per value. That guarantee lets you return large objects by value at no cost.
:::

## Initialization order, precisely

You now know when storage appears. When do *values* appear in it?

**Automatic objects** are initialized in the order their declarations are reached. They are destroyed in exactly the reverse order at the end of the block. Think of a stack of plates: last on, first off. The compiler never reorders this, because your program can observe it.

**Static-duration objects** are initialized in two passes.

- First, **constant initialization**. Every static object is set to zero, and those whose initializers are constant expressions get their real value. This happens before any of your code runs.
- Then, **dynamic initialization**. Anything that needs a computation (a function call, say) runs before `main`, in order of definition within one source file, and in an **unspecified order between different source files**.

That last clause is the **[[static initialization order fiasco|init-fiasco]]** the previous module showed with two link orders and two different answers. The fix is the same as before: make the initializer a constant expression, or make the object a `static` local in a function, so it is built when control first passes through its declaration.

**Thread-local objects** get their bytes when the thread starts. Those with constant initializers have their value from the start. Those that need a computation are initialized before their first use in that thread (a block-scope one, when the thread first passes its declaration). A thread that never touches one need not construct it at all. They are destroyed when the thread exits, in reverse order of construction.

**Dynamic objects** are initialized by the `new` expression, where you write it. That is the whole rule — and the whole problem, because nothing tells you where to write the matching `delete`.

::: key
Every object has one of four storage durations — automatic, static, thread-local, dynamic — and that choice fixes when its bytes appear and disappear. Lifetime is narrower than storage: it begins when the constructor completes and ends when the destructor starts. Using the bytes outside that interval is undefined behavior, whatever the allocator happens to have done with them.
:::

::: warning Three meanings of `static`
The word `static` means three different things depending on where you write it:

- at namespace scope (outside any function or class): **internal linkage** — the name is private to this source file;
- inside a function: **static storage duration** — one object that lives for the whole program;
- inside a class: the member **belongs to the class**, not to each object.

Only the middle one is a storage duration. Notice which one you are looking at.
:::

## Check yourself

::: check
In the listing, `g_static_init` is at `0x562c5cb32010` and the string literal is at `0x562c5cb30004`, about 8 KB lower. Both have static storage duration. Why are they not next to each other?
:::

::: answer
Static storage duration says *when* the bytes exist, not *where*. The linker groups objects into sections by how they may be accessed. The string literal is `const`, so it goes into a read-only section (`.rodata`), which the loader maps without write permission. `g_static_init` is writable, so it goes into the initialized-data section (`.data`).

Grouping them this way lets the operating system set permissions for each region as a whole. That is exactly what makes writing into a string literal crash instead of quietly corrupting the program's own constants.

The literal being lower is an accident of section order on this build. The standard gives no ordering between objects that are not in the same array or struct.
:::

::: check
A colleague writes `thread_local std::vector<double> scratch;` inside a 200 Hz filter that runs on four worker threads, to avoid a lock on a shared buffer. Name one thing this gets right and two costs.
:::

::: answer
It gets the data race right: each thread has its own `scratch`, so nothing is shared and no lock is needed.

Cost one is memory: four vectors instead of one, each with its own heap buffer, growing with every thread the system adds.

Cost two is access time. Reaching a `thread_local` may need a lookup through the thread's own bookkeeping, or a call to a runtime helper on first use in that thread. A plain global is a fixed address the compiler can build straight into the instruction.

There is a third cost specific to this example: the vector allocates heap memory on first use, *inside the control loop*, which lesson 07 says never to do. A `thread_local std::array<double, N>` avoids that, because its bytes are part of the thread's own storage block from the start.
:::

::: check
`Sample t = make_one();` produced exactly one constructor call and one destructor call. If you added a copy constructor that printed a line, how many times would it run, and what rule decides?
:::

::: answer
Zero times. Since C++17, initializing an object from a prvalue of the same type is not a copy at all. The return expression `Sample{2.5}` initializes the caller's object `t` directly, so no second object ever exists and there is nothing to copy.

This is a language guarantee, not an optional optimization: it holds even at `-O0`, and even when the copy constructor prints something.

It is different from **named** return value optimization. In `Sample r{2.5}; return r;` a named object `r` exists, and skipping its copy is *permitted* rather than guaranteed — though every mainstream compiler does it. The practical rule: return by value by default.
:::

::: check
An object's storage is obtained, its constructor throws an exception part way through, and the exception propagates out. Has the object's lifetime begun? What runs?
:::

::: answer
No. Lifetime begins only when the constructor *completes*, so an object whose constructor threw never existed, and its destructor never runs.

What does run is the destructor of every member and base class that had already been fully constructed, in reverse order. Then the storage is released — by the frame unwinding, for an automatic object, or by the matching `operator delete`, for a `new` expression.

This is why a constructor that acquires two resources should hold each one in a member that owns it. If the second acquisition throws, the first member's destructor still runs and releases the first resource. A raw pointer member would leak it. That is the rule of zero seen from the other end, and lesson 13 takes it up properly.
:::

::: check
Why does `int* p = new int(4);` involve two different lifetimes, and which one belongs to the name `p`?
:::

::: answer
There are two objects. The first is `p` itself: a pointer, an object of type `int*`, 8 bytes on this platform, with automatic storage duration in the enclosing stack frame.

The second is the `int` that `new` created. It has dynamic storage duration, lives wherever the allocator chose, and has no name at all.

`p`'s lifetime ends at the closing brace. The `int`'s lifetime ends at `delete`. Nothing connects the two. That disconnection is the source of every leak and every use-after-free. If `p` dies first and nothing else holds the address, the `int` can never be reached again: a **leak**. If the `int` dies first and `p` is used again: a **use-after-free**. Lesson 14's `unique_ptr` exists to tie the second lifetime to the first, so that one closing brace ends both.
:::

## Summary

| Term | Meaning |
| --- | --- |
| object | a region of storage with a type, a value and a lifetime |
| `sizeof x` | bytes the object occupies, a compile-time constant |
| `&x` | the address of its first byte |
| automatic storage | the stack frame; enclosing block entered to end of block |
| static storage | the program image; before `main` to after `main` |
| thread-local storage | one object per thread; thread start (or first use) to thread exit |
| dynamic storage | the allocator; `new` to `delete` |
| lifetime | constructor completes to destructor starts — narrower than storage |
| constant initialization | zero, then constant values, before any code runs |
| dynamic initialization | computed initializers, before `main`, unspecified order across translation units |
| guaranteed elision (C++17) | returning a prvalue constructs directly in the caller; no copy exists |
| ASLR | addresses differ between runs; never assert one |

Lesson 02 introduces the object whose whole job is to hold an address — the pointer — and the four ways `const` can attach to one.

::: context hex-addresses Reading an address in hex
Hexadecimal counts in sixteens. After the digits 0 to 9 come the letters a to f for ten to fifteen, so `0x10` is sixteen and `0x24` is thirty-six. Programmers use it for addresses because every hex digit is exactly four bits, so two digits are one byte and the numbers line up with how the hardware counts.

An address like `0x7ffcaad09548` has twelve hex digits, which is 48 bits. That is how many address bits a typical x86-64 processor actually uses, even though a pointer is stored in 64 bits.
:::

::: context aslr Why the addresses move
Many attacks on a program need to know where something is in memory — a function to jump to, or a buffer to overwrite. If every run put everything in the same place, one successful attack would work on every copy of the program.

ASLR moves the program image, the heap, the stack and the shared libraries to random starting points each run. The *layout inside* each region stays the same, which is why the gaps in the listing repeat from run to run while the addresses themselves do not. Linux has turned it on by default for years; a program built as a position-independent executable, which g++ on Ubuntu does by default, gets its image moved too.
:::

::: context memory-map The three regions, not to scale
The real gaps are enormous: in the run shown, the heap is about 510 MiB above the image and the stack about 42 TiB above the heap. The picture keeps only the order and who manages each region.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="20" width="120" height="160" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="20" width="120" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="100" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">stack</text>
  <line x1="100" y1="52" x2="100" y2="72" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="94,66 106,66 100,76" fill="#1d6fd1"/>
  <rect x="40" y="110" width="120" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="100" y="127" font-size="12" text-anchor="middle" fill="#1f2a44">heap</text>
  <rect x="40" y="150" width="120" height="30" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="100" y="169" font-size="12" text-anchor="middle" fill="#fff">program image</text>
  <text x="100" y="95" font-size="11" text-anchor="middle" fill="#6c7a93">huge unused gap</text>
  <text x="172" y="36" font-size="11" fill="#1f2a44">0x7ffc… locals, one frame per call</text>
  <text x="172" y="50" font-size="11" fill="#1f2a44">grows downward</text>
  <text x="172" y="127" font-size="11" fill="#1f2a44">new / delete, the allocator</text>
  <text x="172" y="162" font-size="11" fill="#1f2a44">0x562c… globals, statics,</text>
  <text x="172" y="176" font-size="11" fill="#1f2a44">string literals</text>
  <text x="30" y="24" font-size="11" text-anchor="end" fill="#1f2a44">high</text>
  <text x="30" y="182" font-size="11" text-anchor="end" fill="#1f2a44">low</text>
</svg>
```
:::

::: context image-sections Inside the program image
`readelf -SW` on the program lists its sections. Offsets below are from the start of the image; the loader adds the random base (`0x562c5cb2e000` in the run shown). `.rodata` holds the string literal; `.data` holds variables with a nonzero starting value; `.bss` holds the ones that start at zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="40" width="100" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">.rodata</text>
  <text x="70" y="73" font-size="11" text-anchor="middle" fill="#1f2a44">read-only</text>
  <rect x="140" y="40" width="100" height="40" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">.data</text>
  <text x="190" y="73" font-size="11" text-anchor="middle" fill="#1f2a44">writable</text>
  <rect x="240" y="40" width="100" height="40" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">.bss</text>
  <text x="290" y="73" font-size="11" text-anchor="middle" fill="#1f2a44">zeros, writable</text>
  <text x="20" y="30" font-size="11" fill="#1f2a44">0x2000</text>
  <text x="140" y="30" font-size="11" fill="#1f2a44">0x4000</text>
  <text x="240" y="30" font-size="11" fill="#1f2a44">0x4020</text>
  <text x="70" y="102" font-size="11" text-anchor="middle" fill="#1f2a44">"telemetry"</text>
  <text x="70" y="117" font-size="11" text-anchor="middle" fill="#6c7a93">at 0x2004</text>
  <text x="190" y="102" font-size="11" text-anchor="middle" fill="#1f2a44">g_static_init 0x4010</text>
  <text x="190" y="117" font-size="11" text-anchor="middle" fill="#1f2a44">fn_static 0x4014</text>
  <text x="290" y="102" font-size="11" text-anchor="middle" fill="#1f2a44">g_bss 0x4024</text>
  <text x="180" y="142" font-size="11" text-anchor="middle" fill="#6c7a93">(the linker's own tables fill the page between)</text>
</svg>
```

The odd name `.bss` goes back to an assembler for the IBM 704 computer in the 1950s, and is usually expanded as "Block Started by Symbol".
:::

::: context what-is-a-thread Several cooks, one kitchen
A thread is like a cook in a kitchen. One cook works through one recipe, step by step. Add a second cook and two recipes progress at once — but they share the same counters, fridge and knives, which is where trouble starts.

Flight software is usually built from several threads or tasks: one reads the IMU, one runs the star tracker, one runs guidance, each on its own schedule. They share one memory, which is why the question "is this variable one per program or one per thread?" matters.
:::

::: context data-race Two writers, no rule
A data race is two threads touching the same memory at the same time, at least one of them writing, with nothing to order them. Even `++g_shared_count` is really three steps — read, add one, write back — and two threads can interleave those steps so that one increment is lost.

C++ does not say "you might lose an increment". It says the whole program has undefined behavior. The fixes are `std::atomic` or a mutex, which the C++ concurrency module covers; lesson 12 of this module explains why `volatile` is not one of them.
:::

::: context lifetime-timeline Storage is the outer interval
The two intervals for one class object, in order. Using the object is only defined inside the inner one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="320" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="46" font-size="12" text-anchor="middle" fill="#1f2a44">storage: the bytes exist</text>
  <rect x="100" y="66" width="160" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="82" font-size="12" text-anchor="middle" fill="#1f2a44">lifetime: the object exists</text>
  <line x1="20" y1="100" x2="20" y2="108" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="100" y1="92" x2="100" y2="108" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="260" y1="92" x2="260" y2="108" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="340" y1="100" x2="340" y2="108" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="20" y="122" font-size="11" text-anchor="start" fill="#1f2a44">obtained</text>
  <text x="100" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">ctor done</text>
  <text x="260" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">dtor starts</text>
  <text x="340" y="122" font-size="11" text-anchor="end" fill="#1f2a44">released</text>
  <text x="60" y="20" font-size="11" text-anchor="middle" fill="#b4232c">bytes, no object</text>
  <text x="300" y="20" font-size="11" text-anchor="middle" fill="#b4232c">bytes, no object</text>
</svg>
```
:::

::: context prvalue A "pure" temporary
C++ sorts every expression into **value categories**. A prvalue, short for "pure rvalue", is an expression that makes a brand-new value with no name and no home yet: `Sample{2.5}`, `3 + 4`, or a call to a function that returns by value.

Because a prvalue has no home yet, C++17 lets the place that receives it *be* its home. That is why `Sample t = make_one();` builds one object, not two. Lesson 04 lays out the value categories properly — lvalues, prvalues and xvalues — and shows which references can bind to which.
:::

::: context init-fiasco Two files, two answers
Suppose `a.cpp` defines a global whose initializer calls a function in `b.cpp`, and that function reads a global defined in `b.cpp`. If `b.cpp`'s global has not been dynamically initialized yet, the function reads zero instead of the real value.

Which file goes first is left to the toolchain, and in practice follows the order the object files were given to the linker. So the same source can give different answers with a different build command. That is why flight code makes its globals `constexpr` or constant-initialized wherever it can, so there is no dynamic initialization order to get wrong.
:::
