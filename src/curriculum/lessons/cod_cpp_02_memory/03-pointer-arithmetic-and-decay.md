---
id: l03-pointer-arithmetic-and-decay
title: Pointer arithmetic, and the length an array loses at a function boundary
minutes: 17
covers:
  - 'Pointers: dereference, arithmetic, nullptr, pointer-to-const vs const pointer, void*, function pointers'
  - Array-to-pointer decay and why sizeof breaks at a function boundary
---

Subscripting is pointer arithmetic. `buf[i]` is defined by the language as `*(buf + i)`, so every array access you have ever written in C++ was an addition and a dereference wearing brackets. Once you know that, two things stop being mysterious: why indexing past the end has no check, and why the length of an array vanishes the moment you pass it to a function.

Those two facts are the same fact, and together they are responsible for a large share of the memory-corruption defects in embedded C and C++. The previous module showed you the symptom — eighty bytes became eight — and told you to prefer `std::array`. This lesson explains the mechanism, gives you the precise rule for when pointer arithmetic is defined, shows AddressSanitizer catching the case a compiler cannot, and gives you the two modern ways to carry a length across a function boundary: a reference to an array, and `std::span`.

A telemetry buffer is the running example, because that is where you will meet this: a fixed-size block of samples, a pair of pointers marking the live region, and a consumer somewhere else that was handed the block without its length.

## `p + 1` moves by one object, not one byte

The unit of pointer arithmetic is the pointee's size. `p + 1` is the address of the *next object of that type*, so how far it moves depends on the type.

```cpp
#include <cstddef>
#include <cstdint>
#include <cstdio>

struct Sample { std::uint32_t t_ms; double az; };   // 16 bytes with padding

template <typename T>
void step(const char* name, const T* p) {
    std::printf("%-10s sizeof(T) = %2zu   (p+1) - p = %td bytes\n", name, sizeof(T),
                reinterpret_cast<const char*>(p + 1) - reinterpret_cast<const char*>(p));
}

int main() {
    double   d[4]{};
    std::uint8_t b[4]{};
    Sample   s[4]{};

    step("double",  d);
    step("uint8_t", b);
    step("Sample",  s);

    const double* begin = d;
    const double* end   = d + 4;              // one past the end: legal to form
    std::printf("end - begin = %td elements\n", end - begin);
    std::printf("sizeof(end - begin) = %zu (std::ptrdiff_t)\n", sizeof(end - begin));

    for (int i = 0; i < 4; ++i) d[i] = -9.80 - 0.01 * i;
    std::printf("d[2] = %.2f, *(d + 2) = %.2f\n", d[2], *(d + 2));

    double sum = 0.0;
    for (const double* p = begin; p != end; ++p) sum += *p;
    std::printf("sum = %.2f over %td samples, mean = %.4f\n", sum, end - begin, sum / (end - begin));
    return 0;
}
```

g++ 13.3.0, `-std=c++20 -Wall -Wextra -Wpedantic`:

```text
double     sizeof(T) =  8   (p+1) - p = 8 bytes
uint8_t    sizeof(T) =  1   (p+1) - p = 1 bytes
Sample     sizeof(T) = 16   (p+1) - p = 16 bytes
end - begin = 4 elements
sizeof(end - begin) = 8 (std::ptrdiff_t)
d[2] = -9.82, *(d + 2) = -9.82
sum = -39.26 over 4 samples, mean = -9.8150
```

Four rules are in that output.

**Addition and subtraction of an integer** scale by `sizeof(T)`. This is why `p + 1` on a `Sample*` moved 16 bytes: the padding lesson 10 explains is included, because the compiler must be able to walk an array.

**Subtracting two pointers** gives a *count of elements*, not bytes, with type `std::ptrdiff_t` — a signed integer, 8 bytes here. It is defined only when both point into the same array.

**Subscripting is the same operation.** `d[2]` and `*(d + 2)` printed the same value because they are the same expression by definition.

**The half-open range `[begin, end)` is the C++ idiom** and it is why `end` is allowed to be one past the last element. The loop `for (p = begin; p != end; ++p)` visits exactly `end - begin` elements — 4 here — and this is the shape every standard algorithm takes. Check the arithmetic: $-9.80 - 9.81 - 9.82 - 9.83 = -39.26$, and $-39.26/4 = -9.8150\,\mathrm{m/s^2}$.

## Where the arithmetic stops being defined

The rule is narrow, and it is not the rule most people assume.

> Pointer arithmetic is defined only within a single array object, and on the one-past-the-end address. Forming any other address is undefined behaviour, and *dereferencing* the one-past-the-end address is undefined behaviour too.

So for `double d[4]`: `d + 0` through `d + 4` are all valid addresses to compute and compare, `d + 5` is already undefined even if you never read it, and `*(d + 4)` is undefined even though you computed the address legally. The same applies to a single non-array object, which counts as an array of one: `&x + 1` is fine, `&x + 2` is not.

This is not pedantry the optimiser ignores. The compiler uses the rule: having seen `p + i`, it may assume the result is inside the same object as `p`, and it will fold bounds checks away on that basis.

::: example One past the end: legal to form, undefined to read
```cpp
#include <cstdio>

int main() {
    double telemetry[4]{-9.80, -9.81, -9.82, -9.83};
    const double* begin = telemetry;
    const double* end   = telemetry + 4;      // legal to form

    std::printf("end - begin = %td\n", end - begin);
    std::printf("comparing pointers is fine: begin < end is %d\n", begin < end);
    std::printf("about to dereference one past the end\n");
    std::printf("%.2f\n", *end);              // undefined behaviour
    return 0;
}
```

Built with `g++ -std=c++20 -Wall -Wextra -Wpedantic -g -fsanitize=address -fno-sanitize-recover=all`, g++ 13.3.0 compiled it without a single warning and the program printed:

```text
end - begin = 4
comparing pointers is fine: begin < end is 1
about to dereference one past the end
=================================================================
==13347==ERROR: AddressSanitizer: stack-buffer-overflow on address 0x7faec9600040 at pc 0x559b69f124cb bp 0x7ffc7cac9100 sp 0x7ffc7cac90f0
READ of size 8 at 0x7faec9600040 thread T0
    #0 0x559b69f124ca in main l03-oob.cpp:13
    ...

Address 0x7faec9600040 is located in stack of thread T0 at offset 64 in frame
    #0 0x559b69f12298 in main l03-oob.cpp:4

  This frame has 1 object(s):
    [32, 64) 'telemetry' (line 6) <== Memory access at offset 64 overflows this variable
HINT: this may be a false positive if your program uses some custom stack unwind mechanism, swapcontext or vfork
      (longjmp and C++ exceptions *are* supported)
SUMMARY: AddressSanitizer: stack-buffer-overflow l03-oob.cpp:13 in main
```

(A line of `...` marks frames cut here — below `main` come three library frames, `__libc_start_call_main`, `__libc_start_main_impl` and `_start`, in every one of these reports. The process id in `==13347==` and every address differ on each run, and the report continues with a shadow-memory dump that lesson 09 explains.)

Read what the report gave you and notice how much it is. The kind of error: `stack-buffer-overflow`, so the object is a local, not a heap block. The operation: `READ of size 8`, which is one `double`. The source line of the bad access: line 13. The object that was overrun, **by name**: `telemetry`, declared on line 6, occupying stack offsets 32 to 64 — thirty-two bytes, which is the four doubles — and the access was at offset 64, exactly one element past. That last line is the diagnosis written out for you.

The first two `printf`s ran and their output is above the report, which tells you the program got that far. Because the build used `-fno-sanitize-recover=all`, the process stopped there and exited non-zero; without that flag AddressSanitizer would still abort on this particular check, but for the sanitizers that do recover it is the difference between a red test and a green one with a warning nobody read.
:::

::: warning
The report above is evidence that the bug exists, not a description of what the bug "does". `*end` is undefined behaviour: on this build, with the sanitizer on, it was caught. Rebuilt with `-O1` and no sanitizer, the same program on the same machine printed `0.00` and exited 0 — whatever bytes happened to sit after `telemetry` in the frame, reinterpreted as a `double`, and they happened to be zeros. That is the dangerous outcome, because a reading of zero looks like data. Neither result is a fact about C++. What is a fact about C++ is that the compiler is entitled to assume the access never happens, and to delete code that would only matter if it did.
:::

## Array-to-pointer decay

An array's type carries its length: `double[10]` and `double[9]` are different types, and `sizeof` on an array object gives all its bytes. But in almost every expression, an array converts silently to a pointer to its first element. That conversion is **array-to-pointer decay**, and it throws the length away.

It happens in two places that matter:

- In an expression: `double* p = raw;` compiles with no cast, because `raw` decays to `double*`.
- In a function parameter: a declared parameter of array type is *rewritten* to a pointer. `void f(double buf[10])`, `void f(double buf[])` and `void f(double* buf)` declare the same function. The `10` is documentation with no effect at all — you can pass a three-element array and nothing complains.

The previous module showed the consequence: `sizeof` gives 80 in the caller and 8 in the callee, and g++ warns about that particular use with `-Wsizeof-array-argument`. Here is the fix rather than the symptom.

::: example Three ways to take a buffer, and what survives the call
```cpp
#include <cstddef>
#include <cstdio>
#include <iterator>
#include <span>

void takes_pointer(const double* buf) {
    std::printf("  takes_pointer:  sizeof(buf) = %zu\n", sizeof(buf));
}

template <std::size_t N>
void takes_array_ref(const double (&buf)[N]) {
    std::printf("  takes_array_ref: sizeof(buf) = %zu, N = %zu\n", sizeof(buf), N);
}

void takes_span(std::span<const double> buf) {
    std::printf("  takes_span:      buf.size() = %zu, bytes = %zu\n",
                buf.size(), buf.size_bytes());
}

int main() {
    double raw[10]{};
    std::printf("in main: sizeof(raw) = %zu, std::size(raw) = %zu\n", sizeof(raw), std::size(raw));
    takes_pointer(raw);
    takes_array_ref(raw);
    takes_span(raw);

    const double* p = raw;          // the decay, written out
    std::printf("after decay: sizeof(p) = %zu\n", sizeof(p));
    return 0;
}
```

```text
in main: sizeof(raw) = 80, std::size(raw) = 10
  takes_pointer:  sizeof(buf) = 8
  takes_array_ref: sizeof(buf) = 80, N = 10
  takes_span:      buf.size() = 10, bytes = 80
after decay: sizeof(p) = 8
```

`takes_pointer` lost everything: it has an address and no length, and nothing it does can recover one. `takes_array_ref` takes a *reference to an array*, which does not decay, so `N` is deduced as 10 at compile time and `sizeof(buf)` is still 80. `takes_span` takes a `std::span`, which is a pointer and a length in one small object — 16 bytes on this platform — and it knows the size at run time.

Which to use. `std::span<const double>` is the default answer in C++20: it accepts a raw array, a `std::array`, a `std::vector`, or an explicit pointer-and-length, it is cheap to pass, and the callee can loop over it with a range-based `for`. The array reference is for when you want the length fixed at compile time so `static_assert` can check it, at the cost of a template instantiation per size. The bare pointer is for a C API boundary and nowhere else, and when you must write one, put the length next to it in the signature: `void f(const double* buf, std::size_t n)`.

Note the parentheses in `const double (&buf)[N]`. Without them, `const double& buf[N]` would be an array of references, which does not exist. The parentheses say "reference to an array", the same way they said "pointer to a function" in lesson 02.
:::

::: key
`buf[i]` means `*(buf + i)`, and pointer arithmetic scales by `sizeof(T)`. It is defined only inside one array and at its one-past-the-end address, and reading that address is still undefined. An array decays to a pointer to its first element in nearly every expression and always in a function parameter, so `sizeof` gives the pointer's size inside the callee. Carry the length with `std::span`, a reference to an array, or an explicit count.
:::

::: warning
`std::span` does not own anything and does not keep anything alive. A span into a `std::vector` is invalidated by any `push_back` that reallocates, exactly as a pointer or a reference would be, and a span constructed from a temporary dangles as soon as the full expression ends. It is a safer *interface*, not a safer *lifetime*.
:::

## Check yourself

::: check
`void log(double buf[64]);` is called with `double small[4];`. What does the compiler check, and what does it produce?
:::

::: answer
It checks that the argument is convertible to `double*`, and that is all. The parameter type `double[64]` was rewritten to `double*` at declaration, so the `64` is not part of the function's type and takes no part in overload resolution; `log(small)` compiles cleanly at `-Wall -Wextra -Wpedantic`. Inside `log`, `sizeof(buf)` is 8, and any loop to 64 runs 60 elements off the end of a 4-element array — undefined behaviour that AddressSanitizer would report as a stack-buffer-overflow naming `small`. The fix is to make the length part of the type or of the value: `void log(std::span<const double> buf)` accepts both arrays and reports `buf.size()` as 4.
:::

::: check
For `double d[4]`, which of these are undefined behaviour: `d + 4`, `*(d + 4)`, `d + 5`, `d - 1`, `&d[4]`?
:::

::: answer
`d + 4` is fine: it is the one-past-the-end address, which the standard explicitly allows you to form and compare. `*(d + 4)` is undefined: forming the address is allowed, reading through it is not. `d + 5` is undefined at the moment you compute it, before any dereference, because it leaves the array by more than one. `d - 1` is undefined for the same reason — there is no "one before the beginning" allowance, which is exactly why a reverse loop written as `for (p = d + 3; p >= d; --p)` is broken: the final `--p` produces `d - 1`. `&d[4]` is fine and is the same value as `d + 4`: the standard treats `&*(d + 4)` as not dereferencing, so `&d[4]` is the idiomatic way to write `end`. Write reverse loops as `for (p = d + 4; p != d; ) { --p; … }` instead.
:::

::: check
`std::span<const double>` is 16 bytes and `const double*` is 8. Give a reason that is not size for preferring the span at an interface you will maintain for years.
:::

::: answer
The span makes the length part of the contract, so the caller cannot get it wrong and the callee cannot forget to ask for it. With a pointer and a separate count, the two can disagree — a refactor that shrinks the buffer but not the constant, a call site that passes `sizeof(buf)` where `std::size(buf)` was meant — and neither the compiler nor the type system notices, because the count is just an integer. With a span there is no second argument to get wrong: `f(raw)` deduces the size from the array's type, and `f(vec)` from the vector. The span also gives the callee `.size()`, `.empty()`, `.first(n)`, `.subspan(i, n)` and iterators, which means the callee can be written with a range-based `for` and no arithmetic at all — and code with no arithmetic has no off-by-one.
:::

::: check
AddressSanitizer said `[32, 64) 'telemetry' (line 6) <== Memory access at offset 64 overflows this variable`. From that line alone, how large is `telemetry`, how many elements does it hold, and by how much did the access miss?
:::

::: answer
The half-open range 32 to 64 is the object's extent in the frame, so it is $64 - 32 = 32$ bytes. The read was `READ of size 8`, a `double`, so the array holds $32/8 = 4$ elements. The access was at offset 64, which is the first byte after the object, so it missed by exactly one element — an off-by-one at the top end, the classic `<=` where `<` was meant. That is the whole diagnosis, and it came out of three lines of a report you can learn to read in an afternoon. The remaining work is to look at line 13 and find why the index or pointer went one too far.
:::

::: check
A subsystem hands you `const double* samples` and promises it points at 100 elements. You want to pass the middle fifty to a filter. Write the safest thing you can, and say what you still cannot check.
:::

::: answer
Wrap it once, at the boundary, and never handle the raw pointer again: `std::span<const double> all{samples, 100}; auto mid = all.subspan(25, 50); filter(mid);`. From there the length travels with the data, `subspan` is checked in a debug build, and the filter needs no count parameter. What you cannot check is the promise itself. The span constructor takes the 100 on trust: if the subsystem actually allocated 80 elements, the span is wrong from birth and every use of it is out of bounds. No type system feature fixes that, because the information is not in the type. What does fix it is not taking the pointer in the first place — have the subsystem hand you a `std::span` or a `std::array` reference, so the length is produced by whoever knows it rather than restated by whoever does not.
:::

## Summary

| Fact | Detail |
| --- | --- |
| `buf[i]` | defined as `*(buf + i)`; no bounds check of any kind |
| `p + n` | moves `n * sizeof(T)` bytes |
| `q - p` | a count of elements, type `std::ptrdiff_t` (signed, 8 bytes here) |
| defined range | inside one array, plus the one-past-the-end address |
| `*(d + N)` | undefined, even though `d + N` is a legal address |
| `d - 1` | undefined; do not write a descending loop that forms it |
| decay | an array converts to a pointer to its first element, losing the length |
| parameter rewriting | `T a[10]`, `T a[]` and `T* a` are the same parameter |
| `T (&a)[N]` | reference to an array; does not decay, `N` deduced at compile time |
| `std::span<T>` | pointer plus length, 16 bytes here; the default interface in C++20 |
| `.size_bytes()` | span's byte count, useful when talking to a wire format |
| ASan `stack-buffer-overflow` | names the variable, its extent, and the offset that missed |

Lesson 04 returns to references with the precision this module needs: what an lvalue and an rvalue actually are, which references bind to which, and the one rule that lets a `const` reference keep a temporary alive.
