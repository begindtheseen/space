---
id: l11-scope-lifetime-and-storage
title: Scope, lifetime, and where objects live
minutes: 19
covers:
  - Scope, lifetime, and stack vs heap vs static storage
---

In Python you never ask when an object dies. The interpreter counts references, collects cycles when it feels like it, and an object stays alive exactly as long as something can reach it. That is a real guarantee and it removes a whole class of bugs — at the cost of a collector that can run at a moment you did not choose, which is why Python is not what closes the loop on a vehicle.

C++ makes the opposite trade. Every object's lifetime is decided by where you declared it, the rules are few and total, and nothing runs behind your back. The price is that you have to know the rules, because a reference or pointer to an object that has died is undefined behaviour and nothing warns at the moment of use.

This lesson is the one that makes the module's fifth objective reachable: read a small program and state where every object lives and when it dies. That skill is also the foundation of the next module, which is entirely about ownership.

## Scope is not lifetime

**Scope** is a property of a *name*: the region of source text where that name is visible. **Lifetime** is a property of an *object*: the interval during which it exists. They usually coincide, which is why they get confused, and the cases where they do not are where the bugs live.

```cpp
{
    Tracer t{"t"};     // t's scope and t's lifetime both start here
}                      // both end here
```

versus

```cpp
Tracer* p = new Tracer{"heap"};   // p's scope starts here; the object's lifetime does too
// ... p goes out of scope at the end of the block, the Tracer does not
```

Scopes nest: block, function, class, namespace, and the global scope. An inner declaration *shadows* an outer one of the same name, which is legal and usually a mistake:

```text
shadow.cpp:4:12: warning: declaration of 'dt' shadows a global declaration [-Wshadow]
    4 |     double dt = 0.02;      // shadows the global
      |            ^~
shadow.cpp:2:8: note: shadowed declaration is here
```

`-Wshadow` is not in `-Wall` or `-Wextra`; add it to your project's flags.

## The three storage durations

Every object has exactly one of these. (There is a fourth, `thread_local`, which behaves like static but per thread.)

| Duration | Where it lives | Created | Destroyed |
| --- | --- | --- | --- |
| **Automatic** | the stack | when control reaches the declaration | at the end of the enclosing block, in reverse order of construction |
| **Static** | a fixed area of the image | namespace-scope objects before `main`; function-scope `static` on first execution of the declaration | after `main` returns, in reverse order of construction |
| **Dynamic** | the heap | at `new` | at `delete`, and not before |

One program shows all three:

```cpp
#include <cstdio>

struct Tracer {
    const char* name;
    explicit Tracer(const char* n) : name(n) { std::printf("  construct %s\n", name); }
    ~Tracer() { std::printf("  destroy   %s\n", name); }
};

Tracer g_static{"g_static (static storage)"};

void inner() {
    std::printf("enter inner\n");
    Tracer a{"a (automatic, inner)"};
    Tracer b{"b (automatic, inner)"};
    std::printf("leave inner\n");
}

void with_static_local() {
    static Tracer s{"s (static local, first call only)"};
    std::printf("  with_static_local body\n");
}

int main() {
    std::printf("enter main\n");
    Tracer m{"m (automatic, main)"};

    {
        std::printf("enter block\n");
        Tracer blk{"blk (automatic, block)"};
        std::printf("leave block\n");
    }

    inner();

    with_static_local();
    with_static_local();

    Tracer* heap = new Tracer{"heap (dynamic)"};
    std::printf("heap object exists until delete\n");
    delete heap;

    std::printf("leave main\n");
    return 0;
}
```

```text
  construct g_static (static storage)
enter main
  construct m (automatic, main)
enter block
  construct blk (automatic, block)
leave block
  destroy   blk (automatic, block)
enter inner
  construct a (automatic, inner)
  construct b (automatic, inner)
leave inner
  destroy   b (automatic, inner)
  destroy   a (automatic, inner)
  construct s (static local, first call only)
  with_static_local body
  with_static_local body
  construct heap (dynamic)
heap object exists until delete
  destroy   heap (dynamic)
leave main
  destroy   m (automatic, main)
  destroy   s (static local, first call only)
  destroy   g_static (static storage)
```

Every rule in the table is visible in that output. `g_static` was constructed before `main` printed anything. `blk` died at its closing brace, before `inner` was even called. `b` died before `a` — reverse order. `s` was constructed on the *first* call to `with_static_local` and not the second. The heap object was destroyed exactly at `delete`, at a moment you chose. And `m`, then `s`, then `g_static` were destroyed after `main` returned, in reverse order of construction.

The destructor running automatically at the end of a scope is the most important single mechanism in C++. It is what makes a file handle close, a lock release and a buffer free without anyone remembering to do it, and the next module builds the whole ownership vocabulary on it.

::: key
Automatic (stack) objects live until the end of their enclosing scope; dynamic (heap) objects live until explicitly destroyed; static and thread-local objects live for the whole program or thread. Knowing which applies is how you reason about dangling references.
:::

## The stack

The stack is a contiguous region that grows and shrinks as functions are called and return. Each call pushes a **frame** holding that call's parameters, local objects, saved registers and return address; returning pops it. Allocation is a single subtraction from the stack pointer, which is why automatic objects are effectively free.

Two properties follow that matter on a vehicle.

**The stack is a fixed size, chosen before the program runs.** On this Linux machine the default is 8 MiB:

```bash
ulimit -s
```

```text
8192
```

that is kilobytes. On a flight processor it is set per task and is often tens of kilobytes. Exceeding it is a stack overflow, which is undefined behaviour and in practice a crash or, worse, silent corruption of whatever is next in memory.

**Therefore the stack usage of every path must be bounded.** That is why flight coding standards — the JPL Power of Ten among them — ban unbounded recursion and require fixed loop bounds: both make the worst-case stack depth computable by inspection. A `std::array<double, 100000>` as a local is 800 KB of stack and is a defect, even though it compiles; the same array as a namespace-scope or `static` object costs nothing on the stack.

## Static storage

Objects with static storage duration live in the image for the whole run. There are three ways to get one: a namespace-scope object, a `static` local inside a function, and a `static` data member of a class.

Initialisation happens in two phases. **Static initialisation** comes first: every such object is zero-initialised, and those with constant initialisers get their values, before anything runs. **Dynamic initialisation** — anything requiring a computation — happens after, before `main`, in an order that is defined *within* a translation unit (top to bottom) and **unspecified between** translation units.

That last clause has a name: the static initialisation order fiasco. It is not a theoretical risk.

::: example Two link orders, two answers
Three files. `mass.cpp` defines a global from a function call; `weight.cpp` defines a global that reads it.

```cpp
// mass.cpp
double g_mass_kg = read_dry_mass();
double read_dry_mass() { return 549054.0; }   // kg, roughly a Falcon 9 at lift-off

// weight.cpp
double g_weight_n = g_mass_kg * 9.80665;      // reads another TU's global
```

Same compiler, same flags, same object files. Only the order of the object files on the link line changes:

```bash
g++ mass.o weight.o main.o -o a1 && ./a1
```

```text
g_mass_kg  = 549054.0
g_weight_n = 5384380.4
```

```bash
g++ weight.o mass.o main.o -o a2 && ./a2
```

```text
g_mass_kg  = 549054.0
g_weight_n = 0.0
```

In the second build, `g_weight_n`'s dynamic initialisation ran before `g_mass_kg`'s, so it multiplied by the zero that static initialisation had left there. Nothing is undefined — zero-initialisation is guaranteed to happen first, so reading `g_mass_kg` gives a defined 0.0 — and nothing warns. The program is simply wrong in a way that depends on the order the build system happened to pass object files to the linker.

Check the good answer by hand: $549054 \times 9.80665 = 5\,384\,380.4\,\mathrm{N}$.

Two fixes. Make the initialiser a constant expression, so it happens during static initialisation where order is not an issue: `constexpr double kMassKg = 549054.0;`. Or use the "construct on first use" idiom, where the object is a `static` local inside a function and is therefore initialised the first time anyone asks for it:

```cpp
double& mass_kg() {
    static double m = read_dry_mass();   // initialised on first call, in order
    return m;
}
```

The second is also thread-safe: since C++11 the initialisation of a function-local `static` is guaranteed to happen exactly once even if several threads call at the same time. The best fix of all, in flight code, is to have no mutable global state — pass what a function needs.
:::

## The heap

`new` allocates and constructs; `delete` destroys and frees. The lifetime is entirely yours to manage, which is the point and the problem.

```cpp
Tracer* heap = new Tracer{"heap (dynamic)"};
delete heap;
```

Three ways this goes wrong, all undefined behaviour:

- **Leak** — you never `delete`, and the memory is gone for the run. On a vehicle that runs for months, a leak in a 100 Hz loop is a mission failure with a calculable date.
- **Use after free** — you `delete` and then use the pointer.
- **Double free** — you `delete` twice.

AddressSanitizer finds the second and third immediately. A `delete` followed by a read:

```text
ERROR: AddressSanitizer: heap-use-after-free on address 0x502000000010
READ of size 8 at 0x502000000010 thread T0
```

followed by a stack trace whose first frame names `main` and the line of the read. (Each line really begins with the process id, as `==18842==`, which differs on every run.)

The reasons flight code avoids the heap are the ones from lesson 09, sharpened. Allocation time is not bounded, because a general allocator's work depends on the heap's history. The heap can fragment, so a request can fail after hours of successful operation. And failure has nowhere to go: there is no operator to ask for more memory at 30 km. The usual rule is that all allocation happens during initialisation, before the control loop starts, and nothing is allocated or freed after that.

When you do need dynamic lifetime, you will not write `new` and `delete` by hand — you will use `std::unique_ptr`, which owns the object and deletes it in its destructor, so the heap object's lifetime is tied to an automatic object's scope. That is the next module's subject; what matters now is knowing what it is solving.

## Reading a program for lifetimes

::: example Where does every object live, and when does it die?
Read this and answer for each named object before reading on.

```cpp
#include <array>
#include <cstddef>
#include <cstdio>
#include <vector>

constexpr int kMaxSamples = 3;                   // A

std::array<double, kMaxSamples> g_history{};     // B

double mean_of(int n) {
    static int call_count = 0;                   // C
    ++call_count;
    double sum = 0.0;                            // D
    for (int i = 0; i < n; ++i) sum += g_history[static_cast<std::size_t>(i)];
    std::vector<double> scratch(static_cast<std::size_t>(n), sum);   // E
    std::printf("call %d: sum = %.4f\n", call_count, sum);
    return scratch.front() / n;
}

int main() {
    double az = -9.81;                           // F
    for (int i = 0; i < kMaxSamples; ++i) {
        double scaled = az * (1.0 + 0.01 * i);   // G
        g_history[static_cast<std::size_t>(i)] = scaled;
    }
    std::printf("mean = %.4f\n", mean_of(kMaxSamples));
    return 0;
}
```

```text
call 1: sum = -29.7243
mean = -9.9081
```

- **A `kMaxSamples`** — a `constexpr int`. A compile-time constant with internal linkage; in the generated code it is usually not an object at all, just the value 3 wherever it is used.
- **B `g_history`** — static storage duration. Zero-initialised before anything runs, alive for the whole program, destroyed after `main` returns. Twenty-four bytes in the image, not on the stack.
- **C `call_count`** — static storage duration, function scope. Initialised to 0 during static initialisation, keeps its value between calls, destroyed after `main`. Its *name* is visible only inside `mean_of`; its *lifetime* is the whole program.
- **D `sum`** — automatic. Created each call when control reaches the declaration, destroyed when `mean_of` returns. A fresh object every call.
- **E `scratch`** — the `std::vector` object itself is automatic and dies with the call; its *elements* are on the heap. The vector's destructor frees them, which is why this leaks nothing even though `new` never appears.
- **F `az`** — automatic, lives for all of `main`.
- **G `scaled`** — automatic, and its scope is the loop body, so it is created and destroyed on *every iteration*: three constructions, three destructions.

Check the numbers. The loop stores $-9.81$, $-9.81 \times 1.01 = -9.9081$ and $-9.81 \times 1.02 = -10.0062$, summing to $-29.7243$, which is the `sum` the program printed. `scratch` is filled with `n` copies of that sum, so `scratch.front() / n` is $-29.7243/3 = -9.9081$. The output agrees, which is the point of printing the intermediate value: when the answer and your arithmetic disagree, the printed intermediate says which step is wrong.
:::

::: warning
Returning a pointer or reference to an automatic object is the most common lifetime error, and lesson 06 showed both compilers catching the simple case. They do not catch the case where the address is stored into a longer-lived structure first — `g_latest = &local;` inside a function is accepted silently by both. If an object must outlive the call that made it, it needs static or dynamic storage, or it must be returned by value.
:::

## Check yourself

::: check
In the worked example, `g_history` is 24 bytes and `scratch` holds 3 doubles. Which of the two costs stack space, and which costs heap, and how much of each?
:::

::: answer
`g_history` costs neither: it has static storage duration, so its 24 bytes are part of the program image and are there from before `main` until after it returns. `scratch` costs both, in different amounts. The `std::vector` object itself is automatic, so it occupies a frame slot for the duration of the call — three pointers, 24 bytes on this platform — and its three `double` elements are a separate 24-byte heap allocation made by the constructor and freed by the destructor. So a function that looks like it uses a local array actually performs one allocation and one deallocation per call, which is exactly the kind of hidden cost a control loop cannot afford. Replacing `scratch` with a `std::array<double, kMaxSamples>` removes the heap traffic entirely.
:::

::: check
`static int call_count = 0;` inside a function. Where is its name visible, how long does the object live, and what would change if you removed `static`?
:::

::: answer
The name is visible only inside that function — `static` does not change scope. The object has static storage duration: it is created once, before the function is ever called, zero-initialised, and destroyed after `main` returns, keeping its value across every call. Remove `static` and it becomes an automatic object: created fresh at every call, initialised to 0 each time, destroyed at the return. A counter that always reads 1 is the symptom. Note the third meaning of the same keyword: at namespace scope `static` means internal linkage (lesson 02), inside a function it means static storage duration, and inside a class it means a member that belongs to the class rather than to an object.
:::

::: check
A colleague puts `std::array<double, 200000> buffer;` as a local in a function on the flight computer, and it works on the laptop. What is the risk, and what is the fix?
:::

::: answer
That array is 1.6 MB of automatic storage — 1.6 MB of stack. The laptop's default stack is 8 MiB, so it fits and nothing appears wrong; a flight task with a 64 KB stack overflows on the first call. Stack overflow is undefined behaviour, and its usual manifestation is not a clean error but corruption of whatever lies beyond the stack, which can present as an unrelated variable changing value. The fix is to move the storage out of the frame: make it a namespace-scope or `static` object, make it a member of a long-lived object, or allocate it once during initialisation. The general practice is to compute worst-case stack usage per task from the code, which is only possible if every frame's size is bounded — which is why fixed-size locals and no recursion are rules rather than preferences.
:::

::: check
`g_weight_n` was 5384380.4 with one link order and 0.0 with another. Was that undefined behaviour? What exactly does the standard guarantee here?
:::

::: answer
No, it is not undefined behaviour. The standard guarantees that every object with static storage duration is zero-initialised before any dynamic initialisation runs, so reading `g_mass_kg` before its dynamic initialiser has executed gives a well-defined 0.0. What is *unspecified* is the relative order of dynamic initialisation between translation units — the implementation may choose any order and need not document it, and here the linker's argument order decided it. The practical consequence is worse than undefined behaviour in one respect: the program does not crash and no sanitizer fires, it just computes with a zero. Avoid the situation rather than relying on an order: use constant initialisers, or the construct-on-first-use idiom, or no mutable globals at all.
:::

::: check
`std::vector<double> scratch(n, sum);` is an automatic object whose elements are on the heap, and the function contains no `delete`. Why does it not leak, and what is the name of the mechanism?
:::

::: answer
The `std::vector` object itself — three pointers — is automatic, so its destructor runs at the closing brace, and that destructor frees the heap buffer it owns. The mechanism is RAII: resource acquisition is initialisation, or more usefully stated, *release is destruction*. An automatic object's destructor is guaranteed to run when its scope ends, including when the scope is left by an exception, so tying a resource's lifetime to an automatic object's lifetime makes releasing it automatic. Every standard container, `std::string`, `std::unique_ptr` and the file streams work this way, and it is why well-written modern C++ contains almost no explicit `delete`.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Scope | where a *name* is visible |
| Lifetime | when an *object* exists |
| Automatic storage | the stack; created at the declaration, destroyed at the end of the block, in reverse order |
| Static storage | the whole program; namespace-scope objects before `main`, function `static` on first execution |
| Dynamic storage | the heap; from `new` to `delete`, and no other rule |
| `thread_local` | like static, but one object per thread |
| Zero initialisation | every static-duration object, before any dynamic initialisation |
| Static initialisation order fiasco | dynamic initialisation order between translation units is unspecified |
| Construct on first use | a `static` local inside an accessor function; ordered, and thread-safe since C++11 |
| `-Wshadow` | warns when an inner name hides an outer one; not in `-Wall` or `-Wextra` |
| `ulimit -s` | the stack limit in kilobytes; 8192 on this machine |
| RAII | tie a resource to an automatic object so the destructor releases it |

Lesson 12 covers the two ways C++ represents text and the three ways it prints it, including the one that is actually type-safe.
