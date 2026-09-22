---
id: l01-object-model-and-storage
title: The object model: storage, lifetime, and the address of a thing
minutes: 17
covers:
  - 'Storage duration: automatic, static, thread-local, dynamic; lifetime and initialisation order'
---

Python has an object model, but you never have to look at it. Everything is an object on a heap you do not manage, every name is a reference to one, and the interpreter keeps each alive exactly as long as some name can reach it. Nothing you write can produce a name that points at a dead object.

C++ has an object model you must look at, because it is the thing you are programming. An object is a region of storage; a name is usually a name for that storage; and the storage can stop being an object while your name is still pointing at it. Every bug in this module is a version of that one sentence. The previous module taught you where objects live in outline — stack, static, heap — because you needed it to reason about a dangling reference. This module needs it exactly, so this lesson restates it as a set of rules with hard edges, and adds the one storage duration the previous module only mentioned.

On a vehicle this is not academic. Flight software allocates its buffers once, before the control loop starts, and then runs for months without a single `new`. To do that you have to be able to say, of every object in the program, where its bytes are, who made them, and when they stop being that object. That is what the next two thousand words are for.

## An object is a region of storage

The standard's word for the thing you manipulate is **object**, and it has a narrow meaning: a region of storage with a type, a value, and a lifetime. It is not "an instance of a class" — an `int` is an object, a `double` is an object, an array is an object that contains objects. Functions are not objects. References are not objects (an implementation may or may not give one storage). Type names, labels and `constexpr` values that never get an address may never become objects at all.

Three operators read the properties of an object directly:

- `sizeof x` is the number of bytes the object occupies, known at compile time.
- `&x` is its address: where its first byte is.
- `alignof(T)` is the address boundary objects of type `T` must start on, which lesson 10 will make into a whole subject.

Everything in C++ that looks mysterious about memory follows from the fact that these three are real, visible, and yours to misuse.

## The address space is one flat array of bytes

An address is a number. `%p` in `printf` prints it in hexadecimal, and the arithmetic you can do on addresses is the subject of lesson 03. What matters first is what the numbers look like:

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
g_static_init          0x5614565f6010
g_bss                  0x5614565f6024
fn_static              0x5614565f6014
string literal         0x5614565f4008
heap object            0x56148993f2b0
local_a                0x7ffd00a5e238
local_b                0x7ffd00a5e23c
```

::: warning
Those numbers are different on every run, and different on your machine. Linux randomises the base of the program image, the heap and the stack at each start — address space layout randomisation — precisely so that an attacker cannot predict where anything is. Running the program above three times here gave heap addresses `0x55bf11f792b0`, `0x5632d61372b0` and `0x55d40ce3f2b0`. What repeats is the *structure*: the relative positions, the fact that two adjacent `int` locals are four bytes apart, and the enormous gap between the stack and everything else. Never write a test that asserts an address.
:::

Read the structure. The three static-duration objects and the string literal sit within a few kilobytes of each other, near `0x5614565f4000`: they are part of the program image, laid out by the linker. The heap object is elsewhere, about 50 MB higher, in a region the allocator asked the kernel for. The two locals are at `0x7ffd…`, a colossal distance away, because the stack is placed near the top of the user address space and grows downward as calls nest.

That is the whole map: **image, heap, stack**, three regions with different managers and different rules. Which one an object lands in is decided by one property of its declaration, and that property is called its storage duration.

::: example Where the four durations put their bytes
Take the address listing above and label each line with the rule that produced it.

- `g_static_init` and `g_bss` are namespace-scope objects: **static storage duration**. Their bytes are in the executable file, and their addresses are fixed relative to the image base before the program starts. `g_static_init` has an initialiser that is a constant, so the value 42 is literally stored in the file; `g_bss` has none, so it is zero-initialised and the file only records that four zero bytes are needed. That is why the two are eighteen bytes apart here rather than four — they are in different sections of the image.
- `fn_static` is a `static` local: also static storage duration, also in the image, and indeed it sits four bytes after `g_static_init`. The `static` keyword inside a function changes the object's storage duration, not the name's scope.
- The string literal `"telemetry"` is an array of ten `const char` with static storage duration, in a read-only section — note that its address, `0x5614565f4008`, is about 8 KB *below* the writable globals. Writing through a `char*` that points at a literal is undefined behaviour, and on this build it faults because the operating system has marked those pages read-only.
- `heap` points at an object with **dynamic storage duration**, created by `new`. Its bytes came from the allocator, and they stay allocated until `delete`.
- `local_a` and `local_b` have **automatic storage duration**. They are in `main`'s stack frame, which exists only while `main` is executing. Four bytes apart here — but the standard does not promise any particular order or spacing for two separate locals, and a build at `-O2` may give them no address at all if it keeps them in registers.

The fourth duration, `thread_local`, does not appear in this program because it has only one thread. It is next.
:::

## Four storage durations

Every object has exactly one storage duration, and it determines when its bytes appear and disappear.

| Duration | Bytes come from | Appear | Disappear |
| --- | --- | --- | --- |
| automatic | the current stack frame | when control reaches the declaration | at the end of the enclosing block |
| static | the program image | before `main` (or at first execution, for a function-local `static`) | after `main` returns |
| thread-local | per-thread storage | when the thread first reaches the declaration | when that thread ends |
| dynamic | the allocator | at `new` | at `delete` |

The first, second and fourth are the ones lesson 11 of the previous module put to work. The third is new and worth a program, because it is the tool you reach for when a logging counter, a scratch buffer or a random-number engine must be per-task and you do not want a mutex.

::: example One counter per thread, one for the program
`g_shared_count` has static storage duration: there is one object. `t_count` is declared `thread_local`: there is one object *per thread*, each independently initialised.

```cpp
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

The shared counter accumulates across all three threads: $3 + 5 + 2 = 10$. Each `t_count` starts from zero in its own thread and is destroyed when that thread ends, so the star-tracker thread sees 5, not 8. The `join()` calls are there so the output order is deterministic; without them the two threads' increments of `g_shared_count` would be a data race, which is undefined behaviour and not something you fix with `volatile` — lesson 12 says why.

The cost is that a `thread_local` access is not always a plain load: the compiler may have to go through the thread's control block to find the object. In a 1 kHz loop that is worth measuring rather than assuming.
:::

## Lifetime is narrower than storage

Here is the distinction the rest of the module depends on. Storage and lifetime are not the same interval. For an object of class type the sequence is:

1. storage is obtained (the frame is entered, `new` returns, the image is mapped);
2. the constructor runs;
3. **the lifetime begins** — the object exists;
4. the destructor runs;
5. **the lifetime ends**;
6. storage is released.

Between 1 and 3 the bytes exist and are not an object. Between 5 and 6 the bytes exist and are not an object either. Reading or writing through a pointer to those bytes, as if the object were there, is undefined behaviour — not "reads garbage", not "usually works", undefined. The compiler is entitled to assume you never do it and to optimise on that assumption.

This is why "but the memory is still mapped, why did it break" is the wrong question about a use-after-free. Whether the bytes are still mapped is a fact about the allocator. Whether the object is there is a fact about the language.

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

Two things to take from that output. First, line A prints before the constructor: `main`'s frame, including the bytes for `s`, was set up on entry, and `s` became an object only when `Sample{1.0}` finished. Second — and this is the C++17 rule worth knowing — `Sample{2.5}` is constructed **once**, not twice. There is one `ctor` line and one `dtor` line for 2.5, even though it looks like the value is built inside `make_one` and then copied into `t`. Since C++17 the language *guarantees* that a prvalue returned this way is constructed directly in the caller's storage. There is no copy to elide, because there was never a second object.

That guarantee is what lets you return large objects by value without cost, and it removes the main reason people used to reach for returning a pointer.
:::

## Initialisation order, precisely

You now know when storage appears. When do values appear in it?

**Automatic objects** are initialised in the order their declarations are reached, and destroyed in exactly the reverse order at the end of the block. No exceptions, no reordering: the compiler may shuffle much else, but this order is observable and is preserved.

**Static-duration objects** are initialised in two passes. First, *constant initialisation*: every static-duration object is zero-initialised, and those whose initialisers are constant expressions get their real value, all before any code runs. Then, *dynamic initialisation*: anything requiring a computation runs before `main`, in order of definition within one translation unit, and in an **unspecified order between translation units**. That last clause is the static initialisation order fiasco the previous module demonstrated with two link orders and two answers. The fix is the same as it was: make the initialiser a constant expression, or use a function-local `static` so the object is built on first use.

**Thread-local objects** are initialised when the thread first reaches the declaration, and destroyed at thread exit in reverse order of construction. A thread that never touches a `thread_local` never constructs it.

**Dynamic objects** are initialised by the `new` expression, at the point you write it. That is the whole rule, and it is also the whole problem: the language will not tell you when to write the matching `delete`.

::: key
Every object has one of four storage durations — automatic, static, thread-local, dynamic — and that choice fixes when its bytes appear and disappear. Lifetime is narrower than storage: it begins when the constructor completes and ends when the destructor starts. Using the bytes outside that interval is undefined behaviour, whatever the allocator happens to have done with them.
:::

::: warning
`static` means three different things depending on where it appears: internal linkage at namespace scope, static storage duration inside a function, and "belongs to the class, not the object" inside a class. Only the middle one is a storage duration. Reading a declaration correctly starts with noticing which of the three you are looking at.
:::

## Check yourself

::: check
In the address listing, `g_static_init` is at `0x5614565f6010` and the string literal is at `0x5614565f4008`, about 8 KB lower. Both have static storage duration. Why are they not next to each other?
:::

::: answer
Static storage duration says *when* the bytes exist, not *where*. The linker groups objects into sections by their access requirements: the string literal is `const`, so it goes into a read-only section that the loader maps without write permission, while `g_static_init` is writable and goes into the initialised-data section. Grouping them lets the operating system set page permissions per region, which is what makes writing through a `char*` into a string literal fault rather than silently corrupt the program's own constants. It also means `&literal < &global` on this build is an accident of section ordering and not something to rely on: the standard gives you no ordering between objects that are not members of the same array or struct.
:::

::: check
A colleague writes `thread_local std::vector<double> scratch;` inside a 200 Hz filter that runs on four worker threads, to avoid a mutex on a shared buffer. Name one thing this gets right and two costs.
:::

::: answer
It gets the data race right: each thread has its own object, so there is no shared mutable state and no lock. The costs are, first, memory — four vectors instead of one, each with its own heap buffer, and the total grows with every thread the system adds. Second, the access is not free: reaching a `thread_local` may require an indirection through the thread's control block or a call to a runtime helper on first use in that thread, where a plain global is a fixed address the compiler can fold into the instruction. There is a third cost specific to this example: the vector allocates on the heap on first use, inside the control loop, which is what lesson 07 says never to do. A `thread_local std::array<double, N>` has no such problem, because its bytes are part of the thread-local block.
:::

::: check
`Sample t = make_one();` produced exactly one constructor call and one destructor call. If you added a copy constructor that printed, how many times would it run, and what rule decides?
:::

::: answer
Zero times. Since C++17 the initialisation of an object from a prvalue of the same type is not a copy at all: the return expression `Sample{2.5}` initialises the caller's object directly, so no second object ever exists and there is nothing to copy. This is guaranteed by the language, not an optimisation the compiler may skip, and it holds even at `-O0` and even if the copy constructor has side effects. It is different from named return value optimisation — `Sample r{2.5}; return r;` creates a named object and the elision there is permitted rather than guaranteed, though in practice every mainstream compiler does it. The practical rule: returning by value is the default, and you do not need to reach for a pointer or a reference to avoid a copy that does not happen.
:::

::: check
An object's storage is obtained, its constructor throws part way through, and the exception propagates. Has the object's lifetime begun? What runs?
:::

::: answer
No. Lifetime begins only when the constructor *completes*, so an object whose constructor threw never existed and its destructor never runs. What does run is the destructor of every member and base that was already fully constructed, in reverse order, and then the storage is released — by the frame unwinding for an automatic object, or by the matching `operator delete` for a `new` expression. This is the reason a constructor that acquires two resources must acquire each through a member that owns it: if the second acquisition throws, the first member's destructor still runs, where a raw pointer member would leak. That is the rule of zero from the other end, and lesson 13 takes it up properly.
:::

::: check
Why is `int* p = new int(4);` two different lifetimes, and which one does the name `p` have?
:::

::: answer
There are two objects. The first is `p` itself: a pointer, an object of type `int*`, eight bytes on this platform, with automatic storage duration in the enclosing frame. The second is the `int` that `new` created: dynamic storage duration, somewhere the allocator chose, with no name at all. `p`'s lifetime ends at the closing brace; the `int`'s lifetime ends at `delete`, and nothing connects the two. That disconnection is the entire source of leaks and use-after-free: if `p` dies first and nothing else holds the address, the `int` is unreachable and leaked; if the `int` dies first and `p` is used again, that is a use-after-free. Lesson 14's `unique_ptr` exists to tie the second lifetime to the first, so that one closing brace ends both.
:::

## Summary

| Term | Meaning |
| --- | --- |
| object | a region of storage with a type, a value and a lifetime |
| `sizeof x` | bytes the object occupies, a compile-time constant |
| `&x` | the address of its first byte |
| automatic storage | the stack frame; declaration to end of block |
| static storage | the program image; before `main` to after `main` |
| thread-local storage | one object per thread; first use to thread exit |
| dynamic storage | the allocator; `new` to `delete` |
| lifetime | constructor completes to destructor starts — narrower than storage |
| constant initialisation | zero, then constant values, before any code runs |
| dynamic initialisation | computed initialisers, before `main`, unspecified order across translation units |
| guaranteed elision (C++17) | returning a prvalue constructs directly in the caller; no copy exists |
| ASLR | addresses differ between runs; never assert one |

Lesson 02 introduces the object whose whole purpose is to hold an address — the pointer — and the four ways `const` can attach to one.
