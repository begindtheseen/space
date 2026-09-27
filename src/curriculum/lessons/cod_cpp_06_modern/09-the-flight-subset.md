---
id: l09-the-flight-subset
title: The flight subset of C++
minutes: 22
covers:
  - The flight subset: typically C++11/14/17 core, no exceptions, no RTTI, no dynamic allocation after init, restricted standard library
---

Think about packing for a week-long hike in the mountains. Before you leave, you can buy anything: a bigger tent, more food, a better stove. Once you are on the trail, there is no store. Everything you will eat was packed at the start. You also leave things behind on purpose. A cast-iron pan cooks well, but it is heavy. You pack what you can count, weigh and trust.

Flight software is packed the same way. While the computer boots, the program may set up whatever it needs. Once the control loop starts running a thousand times a second, it lives on what it packed. And some parts of the language are left at home — not because they are bad, but because nobody can put a number on how long they take or how much memory they need.

That chosen part of the language is the **flight subset**: the features a project allows inside flight code, written down as rules and checked by tools. The last eight lessons toured C++11 through C++23; this lesson turns the tour into a packing list: the four big cuts — exceptions, **[[RTTI|rtti-records]]**, allocation after start-up, and much of the standard library — a real program that stops itself the moment it breaks the allocation rule, and the published standards behind the rules.

## Modern does not mean unrestricted

Every rule in a flight subset answers one question: *can we bound it?* A 1 kHz control task has 1 ms per cycle, and must finish inside it every time, not on average. So each feature is judged by two numbers: the most time it can take, and the most memory it can need. If a feature has a fixed cost you can read off the source, it stays. If its cost depends on data, on luck, or on what the compiler decided, it is restricted or forbidden.

Here is how the features you have met sort out.

| Kept | Restricted | Forbidden inside the control task |
| --- | --- | --- |
| RAII, references, `const`, `constexpr` | virtual dispatch (bounded, but reviewed) | exceptions: `throw`, `try`, `catch` |
| templates for static dispatch | `std::unique_ptr` for objects built at start-up | RTTI: `dynamic_cast`, `typeid` |
| `std::array`, `std::span`, `std::optional`, `std::variant` | `std::vector` only if reserved at start-up | `new`, `delete` and growth after start-up |
| `enum class`, `override`, `auto`, range-for, lambdas | standard algorithms, one by one | recursion |
| `static_assert`, `if constexpr` | `reinterpret_cast` and `union`, for hardware access only | `std::string`, `std::function`, `std::shared_ptr`, iostreams, coroutines |

Almost everything in the "kept" column costs nothing when the program runs: the compiler does the work. That is why a modern flight codebase can be full of templates and `constexpr` while forbidding things C++98 already had.

::: key The flight subset
Flight teams typically allow the C++11/14/17 core: RAII, references, `const`, `constexpr`, templates for static dispatch, fixed-size containers, no exceptions, no RTTI, no allocation after initialisation, no recursion, and a restricted standard-library whitelist. Modern does not mean unrestricted.
:::

Why C++11/14/17 and not C++20 or 23? Flight projects [[fix one compiler version|qualified-compiler]] for years, and the coding standards they follow were written for C++14 and C++17. A C++20 feature can be approved, but someone has to argue for it.

## No exceptions

The error-handling lesson of the STL module showed what a `throw` costs: a heap allocation for the exception object, tables that tell the unwinder how to clean up every function, and a search up the stack whose length depends on where the handler is. It also showed the flag that turns them off, **`-fno-exceptions`**. With it, `throw`, `try` and `catch` do not compile.

People forget the standard library. Some of its functions report failure only by throwing. Under `-fno-exceptions` that throw cannot be caught, so the program calls `std::terminate` and aborts. Here is `std::stod` ("string to double") asked to read the text `"abc"`, built with `g++ -std=c++20 -O2 -fno-exceptions`:

```text
terminate called after throwing an instance of 'std::invalid_argument'
  what():  stod
Aborted (exit status 134)
```

The same happens with `vector::at` past the end, and with plain `new` when memory runs out (it throws `std::bad_alloc`).

::: warning Code that compiles is not code that is safe
`-fno-exceptions` stops *your* code from writing `throw`. It does not stop you from calling a library function that throws. Those calls compile without a word, then end the program the first time they fail. Keep a list of them, and replace each with a version that returns its error: `std::from_chars` instead of `std::stod`, an index check instead of `at`, `new (std::nothrow)` at start-up instead of plain `new`.
:::

## No RTTI

**RTTI** — run-time type information — is the extra data the compiler stores so the program can ask, while running, "what type is this object really?" Lesson 04 met it through `std::any::type()`. Two language features need it:

- **`dynamic_cast<Gyro*>(s)`**, read "dynamic cast to pointer to Gyro", checks at run time whether the `Sensor*` called `s` really points at a `Gyro`, and gives back `nullptr` if not.
- **`typeid(*s)`**, read "type-id of star s", gives back a record describing the real type of `*s`.

The flag **`-fno-rtti`** removes that data. The compiler then refuses both features. With g++ 13:

```text
error: 'dynamic_cast' not permitted with '-fno-rtti'
error: cannot use 'typeid' with '-fno-rtti'
```

Clang says `use of dynamic_cast requires -frtti`. Two library members vanish too, because libstdc++ declares them only when RTTI is on: `std::any::type()` and `std::function::target_type()`. Asking for either gives "has no member named".

Less breaks than people expect. With `-fno-rtti`, on g++ 13 and clang 18, these all compiled and ran correctly: virtual calls through a `Sensor*`, `static_cast<Gyro*>(s)` when you already know the type, `std::any_cast<double>(a)` (which returns a null pointer when you ask for the wrong type through a pointer), and calling a `std::function`.

What does removing it save? Every class with a virtual function gets two records: a type-info object and its name. In a small test file with a `Sensor` base and four derived sensors, g++ `-O2` emitted 10 type-info symbols — two for each of the five classes. With `-fno-rtti` it emitted none, and the object file's code and data shrank from 1,107 to 963 bytes, a saving of 144 bytes. It grows with every polymorphic class and ends up in the **image** — the program's bytes as loaded into the flight computer's memory — while buying nothing a flight task needs.

Instead of `dynamic_cast`, use what the RAII module recommended: a virtual function that does the right thing for each type, a `kind()` function returning an `enum class`, or a `std::variant` with `std::visit`, which knows its set of types at compile time.

::: key Why -fno-exceptions and -fno-rtti in flight builds
Both add runtime machinery with data-dependent cost and code size: unwinding tables and type-info records. Removing them shrinks the image, removes an unbounded control-flow path and makes static worst-case analysis tractable.
:::

## No allocation after start-up

The general-purpose heap is a shared store with shelves of every size. Asking it for memory means a search, and the search takes longer as the shelves fill with gaps — the problem called **[[fragmentation|fragmentation]]**. The time of one `new` has no small, fixed upper bound. And a `new` can fail: after hours of running, there may be enough free bytes in total but no single gap large enough.

So the rule, in nearly every flight standard, is: **allocate only during initialisation**. Build every buffer, pool and object while the system starts. After that, the heap is closed.

A rule nobody checks is a wish. The cheapest check uses a fact from the memory module: the global `operator new` is **[[replaceable|replaceable-new]]**. If your program defines its own `operator new(std::size_t)`, the linker uses yours instead of the library's, for every `new` in the program and every allocation inside the standard containers. So you can write one that works normally during start-up, and stops the program the moment anything allocates after a flag is set.

::: example A program that aborts on its first late allocation
This program sets up a short history buffer and a status string, closes the heap, then runs six control cycles. Each cycle appends three characters to the status.

```cpp
#include <cstdio>
#include <cstdlib>
#include <new>
#include <string>
#include <vector>

// ---- The allocation trap -------------------------------------------
static bool g_init_done = false;   // flipped once, at the end of init
static long g_allocs = 0;          // allocations seen during init

void* operator new(std::size_t n) {
    if (g_init_done) {
        std::fprintf(stderr, "TRAP: %zu-byte allocation after init\n", n);
        std::abort();
    }
    ++g_allocs;
    if (void* p = std::malloc(n)) return p;
    std::abort();                  // no exceptions: out of memory is fatal
}
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }

// ---- The flight program ----------------------------------------------
int main() {
    std::setvbuf(stdout, nullptr, _IONBF, 0);  // unbuffered: nothing lost at abort

    // Init phase: allocation allowed.
    std::vector<double> history;
    history.reserve(4);                    // room for 4 samples, once
    std::string status;                    // empty: uses its small buffer
    g_init_done = true;
    std::printf("init done, %ld allocation(s)\n", g_allocs);

    // Steady state: one pass per control cycle.
    for (int tick = 1; tick <= 6; ++tick) {
        if (history.size() < history.capacity()) {
            history.push_back(0.1 * tick);  // fits: no allocation
        }
        status += "OK ";                    // 3 more characters per tick
        std::printf("tick %d: status is %zu chars\n", tick, status.size());
    }
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2 -fno-exceptions -fno-rtti` and run:

```text
init done, 1 allocation(s)
tick 1: status is 3 chars
tick 2: status is 6 chars
tick 3: status is 9 chars
tick 4: status is 12 chars
tick 5: status is 15 chars
TRAP: 31-byte allocation after init
Aborted (exit status 134)
```

Walk through it.

1. During start-up, exactly one allocation happened: `reserve(4)` asked for room for four doubles. The empty `std::string` allocated nothing.
2. In ticks 1 to 4, `push_back` filled the reserved room. No allocation, because the capacity was already there.
3. In ticks 1 to 5, the string grew to 3, 6, 9, 12 and 15 characters, all without the heap. A libstdc++ `std::string` is 32 bytes and keeps up to 15 characters inside itself — the **[[small-string buffer|small-string]]**.
4. In tick 6 the string needed 18 characters. That no longer fits, so it asked the heap for a new buffer: 30 characters of room plus one for the terminating zero, 31 bytes. The trap caught it and stopped the program.

Sanity check: $5 \times 3 = 15$ characters is exactly the small-buffer limit, and $6 \times 3 = 18$ is the first length past it, so the trap fired on the first tick it should have. Clang 18 gave the same output.

The `setvbuf` line matters: `abort()` does not flush output, so without it the earlier lines can vanish when output goes to a file.
:::

The code looked harmless, passed five cycles, and allocated on the sixth. The threshold is not even in your code; it belongs to the library.

::: key Why std::string is usually banned in a hard real-time path
It allocates once the content exceeds its small-string buffer, and the threshold is implementation-defined. Fixed-capacity character buffers or `string_view` over static storage give the same capability with bounded behaviour.
:::

::: warning The trap only sees what goes through operator new
A direct `malloc` call, a C library that allocates internally, or an allocation in another language will not trip it. And it only catches allocations your tests actually reach. It is a strong check, not a proof, so run it over the whole test suite.
:::

### What to use instead

There are three standard answers, and the real-time module later builds all three in depth.

- **[[Static pools|static-pools]]**: arrays of fixed-size slots, reserved at start-up, handed out and returned in constant time.
- **Fixed-capacity containers**: a container whose largest size is a template parameter, stored inside the object itself, that refuses to grow and says so.
- **Arenas over a fixed buffer**: C++17's `std::pmr::monotonic_buffer_resource`, read "P-M-R monotonic buffer resource" (pmr is short for polymorphic memory resource), hands out memory from a byte array you give it, moving forward only.

::: example The same loop, packed for flight
Here is the same program with the heap left out. The history is a `std::array` with a count. The status is a tiny fixed-capacity text class. The trap is still installed.

```cpp
#include <array>
#include <cstddef>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <new>
#include <string_view>

// (same operator new trap and operator delete as the last example)

// Text with a fixed capacity, chosen at compile time. Never allocates.
template <std::size_t N>
class FixedText {
public:
    // Appends all of s, or nothing. Returns false if it would not fit.
    bool append(std::string_view s) {
        if (s.size() > N - len_) return false;
        std::memcpy(buf_.data() + len_, s.data(), s.size());
        len_ += s.size();
        return true;
    }
    std::string_view view() const { return {buf_.data(), len_}; }
    std::size_t size() const { return len_; }
private:
    std::array<char, N> buf_{};
    std::size_t len_ = 0;
};

int main() {
    std::setvbuf(stdout, nullptr, _IONBF, 0);

    std::array<double, 4> history{};   // fixed size, no heap
    std::size_t count = 0;
    FixedText<16> status;              // 16 characters, no heap
    int dropped = 0;
    g_init_done = true;
    std::printf("init done, %ld allocation(s)\n", g_allocs);

    for (int tick = 1; tick <= 6; ++tick) {
        if (count < history.size()) history[count++] = 0.1 * tick;
        if (!status.append("OK ")) ++dropped;   // full: count it, carry on
        std::printf("tick %d: status is %zu chars\n", tick, status.size());
    }
    std::printf("history holds %zu, dropped %d, status \"%.*s\"\n", count, dropped,
                static_cast<int>(status.size()), status.view().data());
    std::printf("sizeof(status) = %zu bytes\n", sizeof status);
}
```

Same flags, same trap:

```text
init done, 0 allocation(s)
tick 1: status is 3 chars
tick 2: status is 6 chars
tick 3: status is 9 chars
tick 4: status is 12 chars
tick 5: status is 15 chars
tick 6: status is 15 chars
history holds 4, dropped 1, status "OK OK OK OK OK "
sizeof(status) = 24 bytes
```

The program then exits normally, with status 0.

Step by step: nothing allocated, even at start-up. In tick 6, 15 + 3 = 18 characters would exceed the capacity of 16, so `append` refused, left the text alone, and returned `false`. The loop counted one dropped message and carried on. The object is 24 bytes: 16 for the characters and 8 for the length.

Sanity check: the behaviour when full is now a *decision you wrote* — refuse and count — instead of a heap request nobody saw. The 16-character limit is in the type, where a reviewer can read it.
:::

The standard-library arena looks like this. Its **upstream** — where it goes when the buffer runs out — is `null_memory_resource()`, which refuses every request, so the heap is never touched:

```cpp
#include <cstddef>
#include <cstdio>
#include <memory_resource>
#include <vector>

int main() {
    std::setvbuf(stdout, nullptr, _IONBF, 0);
    alignas(std::max_align_t) static std::byte slab[256];   // the only memory
    std::pmr::monotonic_buffer_resource arena{slab, sizeof slab,
                                              std::pmr::null_memory_resource()};
    std::pmr::vector<double> samples{&arena};
    samples.reserve(16);                 // 16 x 8 = 128 bytes from the slab
    for (int i = 0; i < 16; ++i) samples.push_back(i * 0.5);
    std::printf("16 samples, last %.1f\n", samples.back());
    samples.push_back(8.0);              // needs 32 x 8 = 256 more bytes
    std::puts("never printed");
}
```

With `-fno-exceptions` it prints `16 samples, last 7.5`, then `terminate called after throwing an instance of 'std::bad_alloc'`, and aborts. Growing to 32 doubles needs 256 new bytes, and only $256 - 128 = 128$ remain in the slab. The failure is loud, which is what a test build wants. In flight, you size the slab so it cannot happen.

## A restricted standard library

"No allocation" and "no exceptions" together decide most of the standard-library whitelist. The rest comes from asking what each piece costs.

**Usually allowed:** `std::array`; `std::span` and `std::string_view` over storage that outlives them; `std::optional`, `std::variant`, `std::pair`, `std::tuple`; `std::bitset`; the type traits and `<limits>`; `<cstdint>` and `<cmath>`; `std::chrono` durations and time points as *types*, so that a time in milliseconds cannot be mistaken for one in seconds; and the algorithms that work in place without allocating.

::: key What std::span replaces
`std::span` replaces the pointer-plus-length pair. It cannot be mismatched, it carries its size for bounds checking in debug builds, and it owns nothing, so it introduces no allocation.
:::

**Usually forbidden in the control task:** `std::string`, `std::vector` growth, `std::map` and the unordered containers (a node allocation per insert), `std::function` (it may allocate to store a large callable), `std::shared_ptr` (a heap control block), iostreams, `std::regex`, `std::filesystem`, `std::any`, parallel algorithms, `std::thread` creation, and coroutines.

Even "the algorithms" needs care. With the same trap around three sorts of a `std::array<double, 64>`: `std::sort` and `std::nth_element` finished without allocating, and `std::stable_sort` trapped on a 256-byte request — room for 32 doubles, half the array, a scratch buffer for merging. Nothing in the name warns you, which is why a whitelist names functions one at a time.

## The standards that write it down

These rules are not one team's taste. Several published standards encode them.

- **JSF AV C++** (2005) was written by Lockheed Martin for the F-35's flight software. It forbids exceptions, forbids heap allocation after initialisation, and forbids recursion. It targets C++ as it was in 2005.
- **MISRA C++:2008**, from the MISRA consortium that began in the British car industry, covers C++03. It bans dynamic heap allocation. It does *not* ban exceptions; it has rules on how to use them.
- **AUTOSAR C++14** (2017), from a partnership of carmakers and suppliers, extended the rules to C++14. It too allows exceptions, with rules.
- **MISRA C++:2023** merged the two for C++17 and replaces MISRA C++:2008.
- The **[[JPL Power of Ten|power-of-ten]]** rules are ten short rules for safety-critical code. Rule 3 says: no dynamic memory allocation after initialisation.

So the standards disagree about exceptions. The car-industry rules allow them with restrictions; flight projects, which care most about worst-case timing, usually turn them off. The subset is a project decision; the standards are its starting point.

Two NASA frameworks show the rules in practice. **[[F Prime|f-prime]]**, from JPL, is a C++ framework designed so that its components are set up, memory included, before the system starts running. NASA's **[[core Flight System|cfs]]** is written in C, and its executive offers memory pools that applications set up while they start. The real-time module later spends two lessons on these standards and the tools that check them.

::: note Writing your own subset in one page
A subset statement has three lists — permitted, restricted, forbidden — with one line of reason per entry. The reasons are what reviewers read: "`dynamic_cast` is forbidden because it needs RTTI, which costs image size, and its lookup time depends on the class hierarchy" is an argument; "because it is bad" is not. Say what to use instead, and admit one deliberate exception. A common one: virtual functions are *permitted* in a control task, although some subsets restrict them, because the indirect call has a fixed cost, every override is known at link time, and the alternative, a hand-written `switch`, is easier to get wrong.
:::

::: warning Do not ban what is free
The weak answer to "what would you forbid?" is "nothing" or "everything modern". The strong answer forbids what is unbounded or cannot be analysed — allocation after start-up, exceptions, RTTI, coroutines — and keeps what improves correctness at no run-time cost.
:::

## Check yourself

::: check
A teammate says "we build with `-fno-exceptions`, so nothing in our code can throw". Find the hole, and give two examples.
:::

::: answer
The flag stops you from writing `throw`, `try` and `catch`. It does not stop you from calling standard-library functions whose only error report is a throw. Those still compile, and when they fail the program calls `std::terminate` and aborts. Examples: `std::stod("abc")` (throws `std::invalid_argument`), `v.at(i)` with `i` past the end (throws `std::out_of_range`), and plain `new` when memory is exhausted (throws `std::bad_alloc`). Use the non-throwing forms instead.
:::

::: check
You turn on `-fno-rtti`. Which of these stop compiling: a virtual call through a base pointer, `dynamic_cast<Derived*>(base)`, `static_cast<Derived*>(base)`, `typeid(x)`, `std::any::type()`, `std::any_cast<int>(&a)`?
:::

::: answer
`dynamic_cast` (to check the real type at run time it needs RTTI), `typeid(x)` (it returns the RTTI record itself), and `std::any::type()` (libstdc++ declares it only when RTTI is on) all stop compiling. The virtual call still works: it goes through the vtable, which does not need type-info. `static_cast` still works: it does no run-time check, so it is only safe when you already know the type. `std::any_cast<int>(&a)` still works, and returns a null pointer when `a` does not hold an `int`.
:::

::: check
A status message is built with `std::string` and `+=` inside a 1 kHz loop. It passed a week of testing. Why is that not evidence it never allocates, and what would you change?
:::

::: answer
`std::string` keeps short text inside itself and allocates only past an implementation-defined length — 15 characters in libstdc++. If no test ever produced a longer message, no test ever saw the allocation; a longer message in flight would call the heap in the middle of a control cycle. Replace it with a fixed-capacity buffer whose limit is in its type (like `FixedText<N>`), or a `std::string_view` over static text, and run the tests with the `operator new` trap installed so any late allocation stops the test.
:::

::: check
Your arena is a 512-byte slab with `null_memory_resource()` upstream. A `std::pmr::vector<double>` in it has reserved 32 elements. What happens when the 33rd `push_back` runs, in a `-fno-exceptions` build?
:::

::: answer
32 doubles are $32 \times 8 = 256$ bytes, already taken from the slab. Growing means doubling to 64 doubles, a request for $64 \times 8 = 512$ bytes. Only $512 - 256 = 256$ bytes remain, and a monotonic arena never reuses the old block, so it asks upstream. The null resource refuses by throwing `std::bad_alloc`; with exceptions off, that ends in `std::terminate` and the program aborts. In flight you prevent it by sizing: reserve the largest count the task can ever need at start-up, and never exceed it.
:::

::: check
Write three lines of a subset statement: one permitted, one restricted, one forbidden feature, each with a one-line reason.
:::

::: answer
One good set: **Permitted:** `constexpr` tables — computed by the compiler, zero run-time cost. **Restricted:** `std::vector` — only if `reserve` is called at start-up with the proven maximum, because growth after start-up allocates. **Forbidden:** `std::function` in the control task — it may allocate to store a large callable, and the size at which it does so belongs to the library; use a template parameter or a plain function pointer. Any answer works if each reason names a bound: time, memory or analysability.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| Flight subset | the features a project allows in flight code | C++11/14/17 core, no exceptions, no RTTI, no allocation after init, no recursion, library whitelist |
| `-fno-exceptions` | exceptions switched off | library throws still compile and end in `std::terminate` |
| `-fno-rtti` | no run-time type information | `dynamic_cast`, `typeid`, `any::type()`, `function::target_type()` stop compiling |
| No allocation after init | the heap closes when start-up ends | enforce with a replaced `operator new` that aborts after a flag |
| `std::string` | text that may allocate | libstdc++ holds 15 characters in place, then allocates |
| Replacements | pools, fixed-capacity containers, arenas | `std::pmr::monotonic_buffer_resource` with `null_memory_resource()` upstream |
| Library whitelist | named functions and types | `std::sort` did not allocate; `std::stable_sort` did |
| Standards | JSF AV C++, MISRA C++:2008/2023, AUTOSAR C++14, Power of Ten | differ on exceptions; agree on no late allocation |

The next lesson takes an old C++98 file and moves it toward this subset one safe step at a time — and shows how to convince a reviewer that each step changed nothing it should not have.

::: context rtti-records Where the type information lives
Each class with a virtual function gets a vtable: a table of function addresses, shared by every object of that class. On Linux compilers, the slot immediately before the first function address points to the class's type-info record, which holds the class's name. `dynamic_cast` and `typeid` follow that pointer. With `-fno-rtti` the slot is filled with zero and the records are never emitted; the function slots, which virtual calls use, are unchanged.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">Gyro object</text>
  <rect x="10" y="26" width="80" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="50" y="43" font-size="11" text-anchor="middle" fill="#1f2a44">vptr</text>
  <rect x="10" y="52" width="80" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <text x="50" y="69" font-size="11" text-anchor="middle" fill="#1f2a44">bias</text>
  <text x="130" y="18" font-size="12" fill="#1f2a44">vtable for Gyro</text>
  <rect x="130" y="26" width="110" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <text x="185" y="43" font-size="11" text-anchor="middle" fill="#1f2a44">offset to top</text>
  <rect x="130" y="52" width="110" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <text x="185" y="69" font-size="11" text-anchor="middle" fill="#1f2a44">type-info pointer</text>
  <rect x="130" y="78" width="110" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <text x="185" y="95" font-size="11" text-anchor="middle" fill="#1f2a44">~Gyro (2 slots)</text>
  <rect x="130" y="104" width="110" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <text x="185" y="121" font-size="11" text-anchor="middle" fill="#1f2a44">read()</text>
  <line x1="90" y1="39" x2="126" y2="89" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="128,92 118,88 124,82" fill="#1d6fd1"/>
  <rect x="270" y="52" width="80" height="44" fill="#ffffff" stroke="#b4232c"/>
  <text x="310" y="69" font-size="11" text-anchor="middle" fill="#1f2a44">type-info</text>
  <text x="310" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">"4Gyro"</text>
  <line x1="240" y1="65" x2="266" y2="65" stroke="#b4232c" stroke-width="2"/>
  <polygon points="268,65 259,60 259,70" fill="#b4232c"/>
  <text x="10" y="156" font-size="11" fill="#6c7a93">-fno-rtti: the orange slot becomes 0 and the red record is gone</text>
</svg>
```
:::

::: context qualified-compiler Why the compiler version is frozen
A flight program is verified with one exact compiler: its version, its flags, its standard library. Tests, analysis results and sometimes a review of the generated code all depend on it. A new compiler can generate different code from the same source, so upgrading means repeating much of that work. Teams therefore pick a toolchain early and keep it, often for the life of the mission. The newest language features arrive in flight code years after they arrive in compilers.
:::

::: context fragmentation Enough memory, but not in one piece
After many allocations and frees of different sizes, the heap looks like a parking lot where cars of all lengths have come and gone. The free space is scattered in gaps. A request can fail even when the total free space is larger than the request, because no single gap is long enough. How badly this happens depends on the order of requests, which is why no one can bound it in advance.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">heap: 10 blocks of 16 bytes</text>
  <g stroke="#1f2a44">
    <rect x="10" y="28" width="34" height="30" fill="#8fb8f0"/>
    <rect x="44" y="28" width="34" height="30" fill="#ffffff"/>
    <rect x="78" y="28" width="34" height="30" fill="#8fb8f0"/>
    <rect x="112" y="28" width="34" height="30" fill="#8fb8f0"/>
    <rect x="146" y="28" width="34" height="30" fill="#ffffff"/>
    <rect x="180" y="28" width="34" height="30" fill="#8fb8f0"/>
    <rect x="214" y="28" width="34" height="30" fill="#ffffff"/>
    <rect x="248" y="28" width="34" height="30" fill="#8fb8f0"/>
    <rect x="282" y="28" width="34" height="30" fill="#ffffff"/>
    <rect x="316" y="28" width="34" height="30" fill="#8fb8f0"/>
  </g>
  <text x="10" y="80" font-size="11" fill="#1f2a44">blue: in use (6)   white: free (4 blocks = 64 bytes)</text>
  <rect x="10" y="90" width="68" height="20" fill="#f2b880" stroke="#b4232c"/>
  <text x="90" y="104" font-size="11" fill="#b4232c">a 32-byte request fails: no two free blocks touch</text>
</svg>
```
:::

::: context replaceable-new Why you are allowed to replace operator new
The C++ standard lists a few library functions as replaceable: the global `operator new` and `operator delete` in their various forms. The library ships default versions, and if your program defines one with the same signature, the linker uses yours everywhere. That includes the calls hidden inside `std::vector`, `std::string` and every other container that uses the default allocator. The memory module used the same hook to count allocations; here it becomes an alarm.
:::

::: context small-string Fifteen characters inside the string
A libstdc++ `std::string` is 32 bytes: a pointer to its characters, a length, and a 16-byte buffer. While the text fits in the buffer — 15 characters plus the terminating zero — the pointer points at the string's own buffer, and no heap is used. Longer text moves to a heap block. Other standard libraries choose different sizes, which is why the standard calls the limit implementation-defined.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">std::string in libstdc++ (32 bytes)</text>
  <rect x="10" y="28" width="80" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="50" y="47" font-size="11" text-anchor="middle" fill="#1f2a44">pointer 8</text>
  <rect x="90" y="28" width="80" height="30" fill="#ffffff" stroke="#1f2a44"/>
  <text x="130" y="47" font-size="11" text-anchor="middle" fill="#1f2a44">length 8</text>
  <rect x="170" y="28" width="180" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="260" y="47" font-size="11" text-anchor="middle" fill="#1f2a44">buffer 16: "OK OK OK OK OK "</text>
  <path d="M 50 58 C 50 90, 200 90, 200 62" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="200,60 195,70 205,70" fill="#1d6fd1"/>
  <text x="10" y="102" font-size="11" fill="#6c7a93">up to 15 characters: the pointer points into the object itself</text>
</svg>
```
:::

::: context static-pools Parking spaces painted in advance
A pool is a fixed number of equal-sized slots, reserved when the program starts, like a garage with numbered spaces. Taking a slot and giving one back each take the same few instructions every time, and when the pool is empty you know at once. The real-time module builds one, along with arenas and fixed-capacity containers, and uses the allocation trap to prove a whole control task never touches the heap.
:::

::: context power-of-ten Ten rules small enough to check
Gerard Holzmann of NASA's Jet Propulsion Laboratory published the Power of Ten rules in 2006. There are only ten, so that a person can remember them and a tool can check them: simple control flow with no recursion, a fixed upper bound on every loop, no dynamic allocation after initialisation, short functions, and more. They were written for C but are applied to C++ flight code too. The real-time module walks through all ten.
:::

::: context f-prime A flight framework you can read
F Prime (written F´) is a flight-software framework developed at JPL and released as open source. It flew on the Ingenuity helicopter on Mars. A program is built from components that talk through typed ports, and the components are created and connected before the system starts running. Because the source is public, it is one of the few places you can read real flight C++ written to these rules.
:::

::: context cfs The C framework from Goddard
The core Flight System (cFS) is NASA's reusable flight-software framework, developed at Goddard Space Flight Center and released as open source. It is written in C, not C++. Applications plug into a common executive, message bus and table services, and the executive offers memory pools that an application can create while it starts. Many of the same rules apply, because they come from the same worries: bounded time and no surprises from the heap.
:::
