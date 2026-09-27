---
id: l11-scope-lifetime-and-storage
title: Scope, lifetime, and where objects live
minutes: 24
covers:
  - Scope, lifetime, and stack vs heap vs static storage
---

Think about three kinds of writing at school. Notes on the classroom whiteboard are wiped at the end of every lesson, whether you copied them or not. A library book is yours from the day you check it out until the day you return it — and if you never return it, the library has lost it. The trophy case in the front hall was filled before you arrived and will still be there after you leave.

A C++ program keeps its objects in the same three ways. Some live on the **stack** and vanish at the end of the block that made them, like the whiteboard. Some live on the **heap**, from the moment you ask for them until the moment you give them back, like the library book. And some live in **static storage** for the whole run of the program, like the trophy case.

In Python you never ask when an object dies. The interpreter counts how many names refer to each object, and a **[[garbage collector|garbage-collector]]** tidies up the rest at moments it chooses. That removes a whole family of bugs, at the cost of work that can happen at a moment you did not choose — one reason Python is not what closes the control loop on a vehicle.

C++ makes the opposite trade. Every object's lifetime is decided by where you declared it. The rules are few, they cover every case, and nothing runs behind your back. The price is that you must know the rules. A pointer or reference to an object that has already died is undefined behavior, and nothing warns you at the moment you use it.

This lesson makes one of the module's goals reachable: read a small program and say where every object lives and when it dies. That skill is also the foundation of the next module, which is all about ownership.

## Scope is not lifetime

Two words sound alike here and mean different things.

- **Scope** belongs to a *name*. It is the stretch of source code where that name can be used.
- **Lifetime** belongs to an *object*. It is the stretch of time while the program runs during which the object exists.

Think of a name tag and the person wearing it: the tag can come off while the person carries on. Usually the two line up. The bugs live where they do not.

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

Read `Tracer*` as "pointer to Tracer": `p` holds the address of an object, not the object. The keyword **`new`** makes an object on the heap and hands back its address. When the block ends, the *name* `p` disappears — but the object it pointed at is still there, with nothing left that knows where it is.

Scopes nest inside each other: a block inside a function, a function inside a namespace, and the whole file at the outside. A name declared in an inner scope can **shadow** — hide — the same name from an outer scope. That is legal, and usually a mistake:

```cpp
double dt = 0.01;
double step() {
    double dt = 0.02;      // shadows the global
    return dt;
}
```

```text
shadow.cpp:3:12: warning: declaration of 'dt' shadows a global declaration [-Wshadow]
    3 |     double dt = 0.02;      // shadows the global
      |            ^~
shadow.cpp:1:8: note: shadowed declaration is here
```

g++ printed that only because the build used `-Wshadow`. That flag is *not* part of `-Wall` or `-Wextra` — with those alone, g++ 13.3.0 says nothing. Add it to your project's flags yourself.

## The three storage durations

Every object has exactly one **storage duration**: the rule that decides when it is born and when it dies. There are three you must know. (A fourth, `thread_local`, behaves like static but gives each thread its own copy.)

| Duration | Where it lives | Created | Destroyed |
| --- | --- | --- | --- |
| **Automatic** | the stack | when control reaches the declaration | at the end of the enclosing block, in reverse order of construction |
| **Static** | a fixed area of memory, set up when the program loads | namespace-scope objects before `main`; function-scope `static` on first execution of the declaration | after `main` returns, in reverse order of construction |
| **Dynamic** | the heap | at `new` | at `delete`, and not before |

The best way to believe a table like this is to watch it happen. The program below uses a small struct that prints a line when it is created and another when it is destroyed. The function that runs at destruction is the **[[destructor|destructor]]**, written `~Tracer()` — read the `~` as "tilde".

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

Every rule in the table shows up in that output. Read it line by line:

1. `g_static` was constructed before `main` printed anything.
2. `blk` died at its closing brace, before `inner` was even called.
3. Inside `inner`, `b` died before `a` — reverse order, like taking plates off a pile.
4. `s` was constructed on the *first* call to `with_static_local`, and not on the second.
5. The heap object was destroyed exactly at `delete`, at a moment the program chose.
6. After `main` finished, `m`, then `s`, then `g_static` were destroyed — reverse order of construction again.

The destructor running by itself at the end of a scope is the most important single mechanism in C++. It is what makes a file close, a lock release and a buffer free without anyone remembering to do it. The next module builds its whole ownership vocabulary on it.

::: key
Automatic (stack) objects live until the end of their enclosing scope; dynamic (heap) objects live until explicitly destroyed; static and thread-local objects live for the whole program or thread. Knowing which applies is how you reason about dangling references.
:::

## The stack

Picture the pile of trays in a cafeteria. You add to the top and take from the top, never the middle. The **stack** is a region of memory used the same way. Each time a function is called, a new **[[frame|stack-frame]]** goes on top, holding that call's parameters, its local objects, some saved processor registers and the address to return to. When the function returns, its frame comes off. Making room is one subtraction from a register called the **stack pointer**, which is why automatic objects cost almost nothing to create.

Two facts about the stack matter on a vehicle.

**The stack has a fixed size, chosen before the program runs.** On this Linux machine you can ask for the limit:

```bash
ulimit -s
```

```text
8192
```

That number is in kibibytes, so the default is 8 **[[MiB|mebibyte]]**. On a flight processor the stack is set per task and is often only tens of kilobytes. Going past the end is a **stack overflow**. The language promises nothing about what happens then. In practice it is a crash or, worse, silent damage to whatever sits next in memory.

**So every path through the code must use a bounded amount of stack.** That is why flight coding standards — JPL's **[[Power of Ten|power-of-ten]]** rules among them — ban recursion and demand a fixed limit on every loop. Both rules make the deepest possible stack computable by reading the code. A local `std::array<double, 100000>` is $100\,000 \times 8 = 800\,000$ bytes, about 800 KB, of stack. It compiles, and it is still a defect. The same array as a namespace-scope or `static` object uses no stack at all.

## Static storage

An object with **static storage duration** lives for the whole run, in a **[[fixed area of memory|memory-layout]]** that is set up when the program loads. There are three ways to make one:

- declare it at namespace scope, outside any function;
- declare it `static` inside a function;
- declare it as a `static` data member of a class.

These objects get their starting values in two phases.

1. **Static initialization** comes first. Every such object is set to zero, and those whose starting value is a constant get that value, before any of your code runs.
2. **Dynamic initialization** comes second. Any starting value that needs a computation — a function call, say — is worked out before `main` starts. Inside one translation unit, this happens top to bottom. *Between* translation units, the order is **unspecified**: the compiler and linker may pick any order, and need not tell you which.

That last rule has a famous name: the **[[static initialization order fiasco|fiasco]]**. It is not a theoretical worry.

::: example Two link orders, two answers
Three files. `mass.cpp` sets a global from a function call. `weight.cpp` sets a global that reads it. `main.cpp` prints both.

```cpp
// mass.cpp
double read_liftoff_mass() { return 549054.0; }   // kg, a Falcon 9 at lift-off
double g_mass_kg = read_liftoff_mass();            // dynamic initialization
```

```cpp
// weight.cpp
extern double g_mass_kg;                           // declared here, defined in mass.cpp
double g_weight_n = g_mass_kg * 9.80665;           // reads another file's global
```

```cpp
// main.cpp
#include <cstdio>
extern double g_mass_kg;
extern double g_weight_n;
int main() {
    std::printf("g_mass_kg  = %.1f\n", g_mass_kg);
    std::printf("g_weight_n = %.1f\n", g_weight_n);
}
```

Compile each file to an object file with `g++ -std=c++20 -Wall -Wextra -c`. Then link them twice. Same compiler, same flags, same object files. Only the order on the link line changes:

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

First, check the good answer by hand. Weight is mass times $g_0$: $549\,054 \times 9.80665 = 5\,384\,380.4\,\mathrm{N}$, about 5.4 meganewtons. The first build is right.

In the second build, `weight.o` came first, so `g_weight_n`'s dynamic initialization ran before `g_mass_kg`'s. At that moment `g_mass_kg` still held the zero that static initialization put there, and $0 \times 9.80665 = 0$. Nothing here is undefined — zeroing is guaranteed to happen first, so reading `g_mass_kg` gives a well-defined 0.0 — and nothing warns. The program is wrong in a way that depends on the order a build system happened to list the files.

There are two fixes. The first is to make the starting value a constant, so it happens during static initialization, where order cannot matter: `constexpr double kMassKg = 549054.0;`. The second is **construct on first use**: put the object inside a function as a `static` local, so it is initialized the first time anyone asks for it:

```cpp
double& mass_kg() {
    static double m = read_liftoff_mass();   // initialized on first call, in order
    return m;
}
```

Anyone who needs the mass calls `mass_kg()`, so it can never be read before it is ready. This version is also thread-safe: since C++11, the language guarantees a function-local `static` is initialized exactly once, even if several threads call at the same moment. The best fix of all, in flight code, is to have no changeable global state — pass each function what it needs.
:::

## The heap

The **heap** is the library. `new` checks a book out: it finds room, then constructs the object there. `delete` returns it: it runs the destructor, then gives the room back. Between those two moments, the lifetime is entirely yours to manage. That is the point, and it is also the problem.

```cpp
Tracer* heap = new Tracer{"heap (dynamic)"};
delete heap;
```

It goes wrong in three ways:

- **Leak** — you never `delete`, so that memory is gone for the rest of the run. A leak is not undefined behavior, but on a vehicle that runs for months it is fatal on a schedule. Leak 24 bytes per cycle in a 100 Hz loop and you lose $24 \times 100 \times 86\,400 = 207\,360\,000$ bytes, about 207 MB, every day.
- **Use after free** — you `delete`, then use the pointer anyway. Undefined behavior.
- **Double free** — you `delete` the same object twice. Undefined behavior.

The tool that finds the last two is **[[AddressSanitizer|asan]]**, switched on with `-fsanitize=address`. Here is its report for a `delete` followed by a read:

```cpp
#include <cstdio>
int main() {
    double* p = new double{3.0};
    delete p;
    std::printf("%f\n", *p);
}
```

```text
ERROR: AddressSanitizer: heap-use-after-free on address 0x502000000010
READ of size 8 at 0x502000000010 thread T0
```

After those two lines comes a list of function calls whose first entry names `main` and the exact line of the read. The real report also starts with the process number, such as `==4003==`, which changes every run.

The reasons flight code avoids the heap are the ones from lesson 09, sharpened.

- **Allocation time is not bounded.** How long a request takes depends on everything the heap has been through before.
- **The heap can [[fragment|fragmentation]].** A request can fail after hours of working fine, because the free space is broken into pieces too small to use.
- **Failure has nowhere to go.** There is no operator to ask for more memory at 30 km altitude.

So the usual rule is: all allocation happens during start-up, before the control loop begins, and nothing is allocated or freed after that.

When you do need an object that outlives a scope, you will not write `new` and `delete` by hand. You will use `std::unique_ptr`, an object that owns the heap object and deletes it in its own destructor — so the heap object's lifetime is tied to an automatic object's scope. That is the next module's subject. What matters now is knowing what problem it solves.

## Reading a program for lifetimes

::: example Where does every object live, and when does it die?
Read this, and answer for each lettered object before you read the list below.

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

- **A `kMaxSamples`** — a `constexpr int`: a compile-time constant with internal linkage. In the machine code it is usually not an object at all, only the value 3 wherever it is used.
- **B `g_history`** — static storage. Zeroed before anything runs, alive for the whole program, destroyed after `main` returns. Its 24 bytes ($3 \times 8$) sit in static memory, not on the stack.
- **C `call_count`** — static storage, function scope. Set to 0 during static initialization, keeps its value between calls, destroyed after `main`. Its *name* works only inside `mean_of`; its *lifetime* is the whole program.
- **D `sum`** — automatic. Created on each call when control reaches the declaration, destroyed when `mean_of` returns. A fresh object every call.
- **E `scratch`** — the `std::vector` object itself is automatic and dies with the call, but its *elements* are on the heap. The vector's destructor frees them, which is why this leaks nothing even though `new` never appears.
- **F `az`** — automatic; lives for all of `main`.
- **G `scaled`** — automatic, and its scope is the loop body, so it is created and destroyed on *every pass*: three constructions, three destructions.

Now check the numbers. The loop stores three values:

- $-9.81 \times 1.00 = -9.81$
- $-9.81 \times 1.01 = -9.9081$
- $-9.81 \times 1.02 = -10.0062$

Their sum is $-29.7243$, the `sum` the program printed. `scratch` holds `n` copies of that sum, so `scratch.front() / n` is $-29.7243 / 3 = -9.9081$. The mean sits between the smallest and largest value, as a mean must. The output agrees with the hand calculation. Printing the in-between value is the habit that, when they disagree, tells you which step went wrong.
:::

::: warning
Returning a pointer or reference to an automatic object is the most common lifetime error, and lesson 06 showed both compilers catching that simple case. Store the address somewhere longer-lived first, and the compilers see less. g++ 13.3.0 warns about `g_latest = &local;` (`-Wdangling-pointer`), but clang++ 18 says nothing, and neither compiler says anything about `g_watch.push_back(&local);` into a global `std::vector`. AddressSanitizer catches the later read as `stack-use-after-return`. If an object must outlive the call that made it, give it static or dynamic storage, or return it by value.
:::

## Check yourself

::: check
In the worked example, `g_history` is 24 bytes and `scratch` holds 3 doubles. Which one costs stack space, which one costs heap, and how much of each?
:::

::: answer
`g_history` costs neither. It has static storage duration, so its 24 bytes are in static memory from before `main` until after it returns. `scratch` costs both, in different amounts. The `std::vector` object itself is automatic, so it takes a slot in the frame for the length of the call — `sizeof(std::vector<double>)` is 24 bytes here, three pointers. Its three `double` elements are a separate $3 \times 8 = 24$-byte heap allocation, made by the constructor and freed by the destructor. So the function does one allocation and one free on every call — a hidden cost a control loop cannot afford. Replacing `scratch` with a `std::array<double, kMaxSamples>` removes the heap traffic entirely.
:::

::: check
`static int call_count = 0;` inside a function. Where can its name be used, how long does the object live, and what changes if you remove `static`?
:::

::: answer
The name can be used only inside that function — `static` does not change scope. The object has static storage duration: it is set to 0 once, before the function is ever called, keeps its value across every call, and is destroyed after `main` returns. Remove `static` and it becomes automatic: created fresh at each call, set to 0 each time, destroyed at the return. The symptom is a counter that always reads 1. Notice the same keyword has three meanings. At namespace scope, `static` means internal linkage (lesson 02). Inside a function, it means static storage duration. Inside a class, it means a member that belongs to the class as a whole rather than to each object.
:::

::: check
A colleague puts `std::array<double, 200000> buffer;` as a local in a function on the flight computer. It works on the laptop. What is the risk, and what is the fix?
:::

::: answer
That array is $200\,000 \times 8 = 1\,600\,000$ bytes, 1.6 MB, of automatic storage — 1.6 MB of stack. The laptop's default stack is 8 MiB, so it fits and nothing looks wrong. Run the same program with the stack limited to 64 KiB (`ulimit -s 64`) and it dies on the first call with `Segmentation fault`, exit status 139. A flight task with a 64 KB stack is in the same position. A crash is the lucky outcome; the unlucky one is quiet damage beyond the stack. The fix is to move the storage out of the frame: make it a namespace-scope or `static` object, make it a member of a long-lived object, or allocate it once at start-up. Teams compute each task's worst-case stack use from the code, which works only if every frame's size is bounded.
:::

::: check
`g_weight_n` was 5384380.4 with one link order and 0.0 with another. Was that undefined behavior? What exactly does the standard promise here?
:::

::: answer
No, it was not undefined behavior. The standard promises that every object with static storage duration is zeroed before any dynamic initialization runs, so reading `g_mass_kg` before its own initializer has run gives a well-defined 0.0. What is *unspecified* is the order of dynamic initialization between translation units: the implementation may choose any order and need not document it, and here the order of files on the link line decided it. In one way that is worse: nothing crashes and no sanitizer fires — it computes quietly with a zero. Avoid the situation: use constant initializers, construct on first use, or no changeable globals.
:::

::: check
`std::vector<double> scratch(n, sum);` is an automatic object whose elements are on the heap, and the function contains no `delete`. Why does it not leak, and what is the mechanism called?
:::

::: answer
The `std::vector` object itself is automatic, so its destructor runs at the closing brace of the function, and that destructor frees the heap buffer the vector owns. The mechanism is called **[[RAII|raii]]**, "resource acquisition is initialization" — more usefully read as *release is destruction*. An automatic object's destructor is guaranteed to run when its scope ends, even when the scope is left because of an exception. So tying a resource to an automatic object makes its release automatic. Every standard container, `std::string`, `std::unique_ptr` and the file streams work this way, which is why well-written modern C++ contains almost no `delete`.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Scope | where a *name* can be used |
| Lifetime | when an *object* exists |
| Automatic storage | the stack; created at the declaration, destroyed at the end of the block, in reverse order |
| Static storage | the whole program; namespace-scope objects before `main`, function `static` on first execution |
| Dynamic storage | the heap; from `new` to `delete`, and no other rule |
| `thread_local` | like static, but one object per thread |
| Zero initialization | every static-duration object, before any dynamic initialization |
| Static initialization order fiasco | dynamic initialization order between translation units is unspecified |
| Construct on first use | a `static` local inside an accessor function; ordered, and thread-safe since C++11 |
| `-Wshadow` | warns when an inner name hides an outer one; not in `-Wall` or `-Wextra` |
| `ulimit -s` | the stack limit in kibibytes; 8192 on this machine |
| RAII | tie a resource to an automatic object so the destructor releases it |

Lesson 12 turns to text: the two ways C++ stores a string — `std::string` and `const char*`, where lifetime matters again — and the ways it prints them, including the one that checks types for you.

::: context garbage-collector How Python decides an object is finished
CPython, the usual Python, keeps a **reference count** on every object: how many names, lists and other objects point at it. When the count drops to zero, the object is freed at once. That misses one case — two objects pointing at each other, with nothing else pointing at either — so a separate **garbage collector** runs now and then to find such cycles and free them. When it runs depends on how many objects have been created, not on your code's timing. For a control loop that must finish every cycle in a fixed time, a pause that arrives on the collector's schedule is exactly what you cannot allow.
:::

::: context destructor The constructor's mirror image
A **destructor** is a member function with the class's name after a tilde, `~Tracer()`. It takes no arguments and returns nothing, and you almost never call it yourself. The language calls it: at the closing brace for an automatic object, at `delete` for a heap object, after `main` for a static one. The tilde was chosen because in C `~` is the "bitwise not" operator, so `~Tracer` reads as "not Tracer" — the undoing of construction. Whatever the constructor acquired, the destructor gives back.
:::

::: context stack-frame A pile of frames
While `inner` is running, called from `main`, the stack holds two frames. On x86-64 Linux the stack grows toward lower addresses, so the newest frame sits lowest:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="20" y="16" font-size="11" fill="#6c7a93">higher addresses</text>
  <rect x="20" y="24" width="180" height="70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="110" y="42" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">main's frame</text>
  <text x="110" y="60" font-size="11" fill="#1f2a44" text-anchor="middle">m and main's other locals</text>
  <text x="110" y="78" font-size="11" fill="#1f2a44" text-anchor="middle">return address into startup</text>
  <rect x="20" y="94" width="180" height="70" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="110" y="112" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">inner's frame</text>
  <text x="110" y="130" font-size="11" fill="#1f2a44" text-anchor="middle">a, b</text>
  <text x="110" y="148" font-size="11" fill="#1f2a44" text-anchor="middle">return address into main</text>
  <line x1="210" y1="164" x2="250" y2="164" stroke="#b4232c" stroke-width="2"/>
  <polygon points="210,164 220,159 220,169" fill="#b4232c"/>
  <text x="256" y="168" font-size="11" fill="#b4232c">stack pointer</text>
  <line x1="300" y1="40" x2="300" y2="120" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="300,130 295,120 305,120" fill="#1d6fd1"/>
  <text x="300" y="30" font-size="11" fill="#1d6fd1" text-anchor="middle">grows down</text>
  <text x="20" y="190" font-size="11" fill="#6c7a93">lower addresses: free stack space</text>
</svg>
```

When `inner` returns, the stack pointer moves back up past its frame, and `a` and `b` are gone. The bytes are not wiped; the next call reuses them.
:::

::: context mebibyte Kibibytes and kilobytes
Computer memory comes in powers of two, so there are two sets of prefixes. A **kilobyte** (kB) is 1,000 bytes; a **kibibyte** (KiB) is $2^{10} = 1024$ bytes. A **mebibyte** (MiB) is $2^{20} = 1\,048\,576$ bytes. `ulimit -s` reports 8192 KiB, which is $8192 \times 1024 = 8\,388\,608$ bytes — exactly 8 MiB, or about 8.4 MB. The two differ by only a few percent at this size, but when you are budgeting a 64 KiB flight stack to the byte, say which one you mean.
:::

::: context power-of-ten Rules written to be checked
In 2006 Gerard Holzmann of NASA's Jet Propulsion Laboratory published ten rules for safety-critical code. Three of them come straight from this lesson. Rule 1 bans recursion, along with `goto`. Rule 2 says every loop must have a fixed upper bound that a tool can check. Rule 3 says no dynamic memory allocation after initialization. Together they mean the worst-case stack depth and the total memory use can be worked out before the software ever flies, rather than discovered during the flight.
:::

::: context memory-layout Where the three kinds live
A running Linux program sees its memory as one long range of addresses, divided up roughly like this:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="10" width="170" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="105" y="30" font-size="12" fill="#1f2a44" text-anchor="middle">stack</text>
  <rect x="20" y="40" width="170" height="60" fill="#fff" stroke="#1f2a44" stroke-dasharray="4 3"/>
  <text x="105" y="74" font-size="11" fill="#6c7a93" text-anchor="middle">unused gap</text>
  <rect x="20" y="100" width="170" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="105" y="120" font-size="12" fill="#1f2a44" text-anchor="middle">heap</text>
  <rect x="20" y="130" width="170" height="24" fill="#fff" stroke="#1f2a44"/>
  <text x="105" y="146" font-size="11" fill="#1f2a44" text-anchor="middle">.data and .bss (statics)</text>
  <rect x="20" y="154" width="170" height="24" fill="#6c7a93" stroke="#1f2a44"/>
  <text x="105" y="170" font-size="11" fill="#fff" text-anchor="middle">.text (machine code)</text>
  <g stroke-width="2">
    <line x1="210" y1="26" x2="210" y2="56" stroke="#1d6fd1"/>
    <line x1="210" y1="114" x2="210" y2="84" stroke="#b4232c"/>
  </g>
  <polygon points="210,62 205,52 215,52" fill="#1d6fd1"/>
  <polygon points="210,78 205,88 215,88" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44">
    <text x="222" y="40">grows down, per call</text>
    <text x="222" y="104">grows up, per new</text>
    <text x="222" y="146">fixed size, whole run</text>
    <text x="222" y="170">fixed, read-only</text>
  </g>
  <text x="20" y="200" font-size="11" fill="#6c7a93">low addresses at the bottom, high at the top</text>
</svg>
```

Statics with a nonzero starting value go in `.data`; zeroed ones, like `g_history`, go in `.bss`, which takes no space in the file on disk — the loader fills it with zeros.
:::

::: context fiasco A name that stuck
The phrase "static initialization order fiasco" was made popular by the C++ FAQ, a long-running collection of answers to common C++ questions. The word "fiasco" is deliberate: the bug usually appears only after an unrelated change — a new file, a reordered Makefile, a different linker — so the code that is wrong has not been touched for months. Within one file there is no fiasco, because dynamic initialization there runs top to bottom. It is only *across* files that the order is up for grabs.
:::

::: context asan A shadow over every byte
AddressSanitizer was built at Google and presented in 2012; g++ and clang++ both ship it. It keeps a **shadow memory**: a small record for every 8 bytes of your program saying whether those bytes may be touched right now. Freed blocks are marked poisoned and held back from reuse for a while, so a read through a stale pointer lands on poisoned bytes and is reported with the line that did it. The cost is roughly double the run time and more memory, so it is for test builds, not the flight build. The next module uses it every day.
:::

::: context fragmentation Plenty free, none usable
Fragmentation is free space broken into pieces. Here the heap has 48 bytes free in total, yet a request for 32 bytes fails, because the largest single hole is only 16 bytes:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="30" width="60" height="34" fill="#8fb8f0"/>
    <rect x="80" y="30" width="40" height="34" fill="#fff"/>
    <rect x="120" y="30" width="60" height="34" fill="#8fb8f0"/>
    <rect x="180" y="30" width="40" height="34" fill="#fff"/>
    <rect x="220" y="30" width="60" height="34" fill="#8fb8f0"/>
    <rect x="280" y="30" width="40" height="34" fill="#fff"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="51">used 24</text><text x="100" y="51">16</text>
    <text x="150" y="51">used 24</text><text x="200" y="51">16</text>
    <text x="250" y="51">used 24</text><text x="300" y="51">16</text>
  </g>
  <text x="20" y="20" font-size="11" fill="#6c7a93">white = free bytes</text>
  <text x="20" y="88" font-size="12" fill="#1f2a44">free: 16 + 16 + 16 = 48 bytes</text>
  <text x="20" y="108" font-size="12" fill="#b4232c">new of 32 bytes: no hole is big enough</text>
</svg>
```

Real allocators are cleverer than this, but no general-purpose allocator can promise it will never happen — which is why flight code allocates once, at start-up.
:::

::: context raii The name everyone agrees is bad
Bjarne Stroustrup, who created C++, coined "resource acquisition is initialization" to describe the idea of tying a resource to an object's lifetime. The name stresses the wrong half: what makes it valuable is that *release* happens in the destructor, automatically, on every path out of the scope. Some people prefer "scope-bound resource management". Whatever it is called, much of the rest of the C++ track is built on it: `std::unique_ptr` for memory, `std::lock_guard` for locks, and your own classes for hardware handles.
:::
