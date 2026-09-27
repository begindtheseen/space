---
id: l03-pointer-arithmetic-and-decay
title: Pointer arithmetic, and the length an array loses at a function boundary
minutes: 20
covers:
  - 'Pointers: dereference, arithmetic, nullptr, pointer-to-const vs const pointer, void*, function pointers'
  - Array-to-pointer decay and why sizeof breaks at a function boundary
---

Picture a row of identical lockers down a school hallway. If you know where locker 0 is, you can find locker 7 without a map: walk past seven lockers. You do not count floor tiles. You count lockers, and the size of one locker decides how far you walk.

C++ arrays work exactly like that row. **[[Subscripting|subscript-word]]** — writing `buf[i]` — is defined by the language as `*(buf + i)`: start at the first element, step forward `i` elements, and look there. Every array access you have ever written in C++ was an addition and a dereference wearing square brackets.

Once you see that, two things stop being mysterious. Indexing past the end has no check, because an addition does not know where the hallway ends. And an array's length vanishes the moment you pass it to a function, because the function receives only "where locker 0 is". Those are really one fact, and together they cause a large share of the memory-corruption bugs in embedded C and C++.

The previous module showed you the symptom — eighty bytes became eight — and told you to prefer `std::array`. This lesson explains the mechanism. It gives the exact rule for when pointer arithmetic is defined, shows AddressSanitizer catching the case a compiler cannot, and shows the two modern ways to carry a length across a function call: a reference to an array, and `std::span`.

The running example is a telemetry buffer, because that is where you will meet this: a fixed block of samples, a pair of pointers marking the live region, and a consumer somewhere else that was handed the block without its length.

## `p + 1` moves by one object, not one byte

**Pointer arithmetic** is adding an integer to a pointer, or subtracting one pointer from another. Its unit is the pointee's size. `p + 1` is the address of the *next object of that type*, so how many bytes it moves depends on the type.

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

(`template <typename T>` makes `step` work for any element type `T`. It measures the step in bytes by viewing both pointers as `char*`, since a `char` is exactly one byte. `%td` prints a pointer difference.)

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

**Adding or subtracting an integer scales by `sizeof(T)`.** `p + n` moves `n * sizeof(T)` bytes. That is why `p + 1` on a `Sample*` moved [[16 bytes|step-sizes]], not 12: the `Sample` holds 4 bytes of `t_ms`, 4 bytes of padding, and 8 bytes of `az`. Lesson 10 explains the padding. It is included in the step because the compiler must be able to walk an array of them.

**Subtracting two pointers gives a count of elements, not bytes.** Its type is **[[std::ptrdiff_t|ptrdiff]]**, a signed integer, 8 bytes here. It is defined only when both pointers point into the same array.

**Subscripting is the same operation.** `d[2]` and `*(d + 2)` printed the same value because, by definition, they are the same expression.

**The half-open range `[begin, end)` is the C++ habit.** Read it "from begin, up to but not including end". It is why `end` is allowed to point **[[one past the last element|half-open]]**. The loop `for (p = begin; p != end; ++p)` visits exactly `end - begin` elements — 4 here — and every standard algorithm takes this shape.

Check the arithmetic in the last line. The loop filled `d[i] = -9.80 - 0.01i`, so the four values are $-9.80, -9.81, -9.82, -9.83$. Their sum is $-39.26$, and $-39.26 / 4 = -9.815\,\mathrm{m/s^2}$. Close to gravity, as samples from a vertical accelerometer at rest should be.

## Where the arithmetic stops being defined

The rule is narrow, and it is not the rule most people assume.

> Pointer arithmetic is defined only within a single array object, and on the one-past-the-end address. Forming any other address is undefined behaviour, and *dereferencing* the one-past-the-end address is undefined behaviour too.

Take `double d[4]`.

- `d + 0` through `d + 4` are all fine to compute and to compare.
- `d + 5` is *already* undefined, even if you never read through it.
- `*(d + 4)` is undefined, even though computing `d + 4` was legal.

The same applies to a single object that is not an array: it counts as an array of one. `&x + 1` is fine to form. `&x + 2` is not.

This is not fussiness that the optimizer ignores. The compiler **[[uses the rule|compiler-uses-rule]]**. Having seen `p + i`, it may assume the result lies inside the same object as `p`, and it will delete bounds checks on that basis.

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

Saved as `l03-oob.cpp` and built with `g++ -std=c++20 -Wall -Wextra -Wpedantic -g -fsanitize=address -fno-sanitize-recover=all`, g++ 13.3.0 compiled it without a single warning. Run in a terminal, the program printed:

```text
end - begin = 4
comparing pointers is fine: begin < end is 1
about to dereference one past the end
=================================================================
==11285==ERROR: AddressSanitizer: stack-buffer-overflow on address 0x7f6ea8000040 at pc 0x56294bb03458 bp 0x7fffc65c4850 sp 0x7fffc65c4840
READ of size 8 at 0x7f6ea8000040 thread T0
    #0 0x56294bb03457 in main l03-oob.cpp:11
    ...

Address 0x7f6ea8000040 is located in stack of thread T0 at offset 64 in frame
    #0 0x56294bb03278 in main l03-oob.cpp:3

  This frame has 1 object(s):
    [32, 64) 'telemetry' (line 4) <== Memory access at offset 64 overflows this variable
HINT: this may be a false positive if your program uses some custom stack unwind mechanism, swapcontext or vfork
      (longjmp and C++ exceptions *are* supported)
SUMMARY: AddressSanitizer: stack-buffer-overflow l03-oob.cpp:11 in main
```

(The `...` marks frames cut here. Below `main` come three library frames, `__libc_start_call_main`, `__libc_start_main_impl` and `_start`, in every report like this. File paths are shortened to the file name. The process id in `==11285==` and every address change on each run. The report goes on with a shadow-memory dump that lesson 09 explains.)

Now read what the report hands you. It is a lot.

1. **The kind of error**: `stack-buffer-overflow`. The object is a local on the stack, not a heap block.
2. **The operation**: `READ of size 8` — one `double`.
3. **The line of the bad access**: line 11, the `*end`.
4. **The object that was overrun, by name**: `telemetry`, declared on line 4.
5. **Its extent in the stack frame**: `[32, 64)`, bytes 32 up to but not including 64. That is $64 - 32 = 32$ bytes, which is $32 / 8 = 4$ doubles.
6. **Where the access landed**: offset 64, the first byte after the object — exactly one element past the end.

That last line is the diagnosis, written out for you. ASan knows the boundaries because it surrounds every local with **[[poisoned guard bytes|redzones]]**.

The three `printf` lines above the report ran first, which tells you the program got that far. With `-fno-sanitize-recover=all` the process stopped at the error and exited with status 1. AddressSanitizer stops on its own anyway. But for the sanitizers that *do* carry on by default, that flag is the difference between a red test and a green one with a warning nobody read.
:::

::: warning A report proves the bug; it does not describe it
The report is evidence that the bug exists, not a description of what the bug "does". `*end` is undefined behavior. On this build, with the sanitizer on, it was caught.

Rebuilt with `-O1` and no sanitizer, the same program on the same machine printed `0.00` and exited 0. It read whatever bytes happened to sit after `telemetry` in the frame and treated them as a `double`, and they happened to be zeros. That is the dangerous outcome, because a reading of zero looks like data.

Neither result is a fact about C++. The fact about C++ is that the compiler may assume the access never happens, and may delete code that would only matter if it did.
:::

## Array-to-pointer decay

An array's type includes its length. `double[10]` and `double[9]` are different types, and `sizeof` on an array object gives all its bytes. But in almost every expression, an array quietly turns into a pointer to its first element. That conversion is called **array-to-pointer [[decay|decay-word]]**, and it throws the length away.

It happens in two places that matter.

- **In an expression.** `double* p = raw;` compiles with no cast, because `raw` decays to `double*`.
- **In a function parameter.** A parameter declared with array type is *rewritten* to a pointer. `void f(double buf[10])`, `void f(double buf[])` and `void f(double* buf)` all declare the *same* function. The `10` is a comment with no effect at all. You can pass a three-element array and nothing complains.

The previous module showed the consequence: `sizeof` gives 80 in the caller and 8 in the callee. g++ warns about that particular use of `sizeof` with `-Wsizeof-array-argument`, which is on by default. Here is the fix rather than the symptom.

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

Go through the output one line at a time.

- In `main`, `raw` is a real array: $10 \times 8 = 80$ bytes, and `std::size` reports 10 elements.
- `takes_pointer` lost everything. It has an address and no length, and nothing it does can recover one. `sizeof(buf)` is the pointer's 8 bytes.
- `takes_array_ref` takes a *reference to an array*, which does not decay. The compiler works out `N` as 10 when it compiles the call, so `sizeof(buf)` is still 80.
- `takes_span` takes a **`std::span`**: a small object holding a pointer *and* a length, 16 bytes on this platform. It knows the size while the program runs: 10 elements, 80 bytes.
- The last line shows the decay done by hand: `p` is 8 bytes, the length gone.

Which should you use?

**`std::span<const double>` is [[the default answer in C++20|span-origin]].** It accepts a raw array, a `std::array`, a `std::vector`, or an explicit pointer and length. It is cheap to pass, and the callee can loop over it with a range-based `for`.

**The array reference** is for when you want the length fixed at compile time, so a `static_assert` can check it. The cost is one copy of the function compiled for each different size.

**The bare pointer** is for a C API boundary and nowhere else. When you must write one, put the length right next to it: `void f(const double* buf, std::size_t n)`.

Note the parentheses in `const double (&buf)[N]`. Without them, `const double& buf[N]` would be an array of references, which C++ does not allow. The parentheses say "reference to an array", the same way they said "pointer to a function" in lesson 02.
:::

::: key
What does array-to-pointer decay break? `sizeof`. Inside a function taking `T*` the size information is gone, so `sizeof` gives the pointer size. Pass `std::array`, `std::span` or an explicit length.
:::

::: key
`buf[i]` means `*(buf + i)`, and pointer arithmetic scales by `sizeof(T)`. It is defined only inside one array and at its one-past-the-end address, and reading that address is still undefined. An array decays to a pointer to its first element in nearly every expression and always in a function parameter, so `sizeof` gives the pointer's size inside the callee. Carry the length with `std::span`, a reference to an array, or an explicit count.
:::

::: warning A span is a view, not an owner
`std::span` does not own anything and does not keep anything alive. A span into a `std::vector` is invalidated by any `push_back` that reallocates, exactly as a pointer or a reference would be. A span built from a temporary dangles as soon as the full expression ends. It is a safer *interface*, not a safer *lifetime*.
:::

## Check yourself

::: check
`void log(double buf[64]);` is called with `double small[4];`. What does the compiler check, and what does it produce?
:::

::: answer
It checks that the argument converts to `double*`, and that is all.

The parameter type `double[64]` was rewritten to `double*` when the function was declared. So the `64` is not part of the function's type and plays no part in choosing overloads, and `log(small)` compiles cleanly at `-Wall -Wextra -Wpedantic`.

Inside `log`, `sizeof(buf)` is 8 (g++ warns about that `sizeof`), and any loop to 64 runs 60 elements off the end of a 4-element array. That is undefined behavior, which AddressSanitizer reports as a stack-buffer-overflow naming `small`.

The fix is to make the length part of the type or of the value: `void log(std::span<const double> buf)` accepts both arrays and reports `buf.size()` as 4.
:::

::: check
For `double d[4]`, which of these are undefined behavior: `d + 4`, `*(d + 4)`, `d + 5`, `d - 1`, `&d[4]`?
:::

::: answer
- `d + 4` is fine. It is the one-past-the-end address, which you may form and compare.
- `*(d + 4)` is undefined. Forming the address is allowed; reading through it is not.
- `d + 5` is undefined the moment you compute it, before any read, because it leaves the array by more than one.
- `d - 1` is undefined for the same reason. There is no "one before the beginning" allowance.
- `&d[4]` gives the same value as `d + 4`, and every mainstream compiler accepts it (clang even accepts it in a constant expression). C says outright that `&*` cancels without reading; C++'s wording on this corner is disputed, so `d + 4` or `std::end(d)` is the cleaner spelling.

The `d - 1` rule is why a reverse loop written `for (p = d + 3; p >= d; --p)` is broken: its final `--p` produces `d - 1`. Write it as `for (p = d + 4; p != d; ) { --p; … }` instead, which steps down *before* each use and stops without ever leaving the array.
:::

::: check
`std::span<const double>` is 16 bytes and `const double*` is 8. Give a reason that is not size for preferring the span at an interface you will maintain for years.
:::

::: answer
The span makes the length part of the contract, so the caller cannot get it wrong and the callee cannot forget to ask for it.

With a pointer and a separate count, the two can disagree. A refactor shrinks the buffer but not the constant. A call site passes `sizeof(buf)` (bytes) where `std::size(buf)` (elements) was meant. Neither the compiler nor the type system notices, because the count is only an integer.

With a span there is no second argument to get wrong. `f(raw)` takes the size from the array's type, and `f(vec)` from the vector.

The span also gives the callee `.size()`, `.empty()`, `.first(n)`, `.subspan(i, n)` and iterators. So the callee can be written with a range-based `for` and no arithmetic at all — and code with no arithmetic has no off-by-one.
:::

::: check
AddressSanitizer said `[32, 64) 'telemetry' (line 4) <== Memory access at offset 64 overflows this variable`, after `READ of size 8`. From those lines alone, how large is `telemetry`, how many elements does it hold, and by how much did the access miss?
:::

::: answer
The half-open range 32 to 64 is the object's extent in the frame, so it is $64 - 32 = 32$ bytes.

The read was `READ of size 8`, one `double`, so the array holds $32 / 8 = 4$ elements.

The access was at offset 64, the first byte after the object, so it missed by exactly one element. That is an off-by-one at the top end — the classic `<=` where `<` was meant.

That is the whole diagnosis, from three lines of a report you can learn to read in an afternoon. What remains is to look at the reported source line and find why the index or pointer went one too far.
:::

::: check
A subsystem hands you `const double* samples` and promises it points at 100 elements. You want to pass the middle fifty to a filter. Write the safest thing you can, and say what you still cannot check.
:::

::: answer
Wrap it once, at the boundary, and never handle the raw pointer again:

```cpp
std::span<const double> all{samples, 100};
auto mid = all.subspan(25, 50);   // elements 25 to 74
filter(mid);
```

From there the length travels with the data, and the filter needs no count parameter. `subspan` is checked when the standard library's assertions are on (`-D_GLIBCXX_ASSERTIONS` with g++): asking for `all.subspan(80, 50)` then stops the program with `Assertion '__offset + __count <= size()' failed`.

What you cannot check is the promise itself. The span constructor takes the 100 on trust. If the subsystem really allocated 80 elements, the span is wrong from birth, and every use of its last 20 is out of bounds. No type-system feature fixes that, because the information is not in the type. **[[Trusting a length someone else stated|trusted-length]]** is a classic route to a serious bug.

What does fix it is not taking the raw pointer in the first place. Have the subsystem hand you a `std::span` or a reference to a `std::array`, so the length comes from whoever knows it, rather than being restated by whoever does not.
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

Lesson 04 returns to references with the precision this module needs: what an lvalue and an rvalue really are, which references bind to which, and the one rule that lets a `const` reference keep a temporary alive.

::: context subscript-word Why square brackets are called subscripts
In mathematics the elements of a list are written with small numbers below the line: $a_0, a_1, a_2$. "Sub-script" means "written below". Early keyboards and printers had no way to lower a character, so programming languages wrote the index in brackets instead, `a[2]`, and kept the old name.

In C and C++ the brackets are nothing more than shorthand for an addition and a dereference. That is why the odd-looking `2[a]` also compiles and means the same as `a[2]`: both are `*(a + 2)`. Never write it; it only proves the point.
:::

::: context step-sizes One step, three sizes
Each tick is one `p + 1`. The same "plus one" walks 1, 8 or 16 bytes depending on what the pointer points at.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1">
    <line x1="20" y1="140" x2="340" y2="140"/>
    <line x1="20" y1="136" x2="20" y2="144"/>
    <line x1="100" y1="136" x2="100" y2="144"/>
    <line x1="180" y1="136" x2="180" y2="144"/>
    <line x1="260" y1="136" x2="260" y2="144"/>
    <line x1="340" y1="136" x2="340" y2="144"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="20" y="160">0</text><text x="100" y="160">8</text><text x="180" y="160">16</text>
    <text x="260" y="160">24</text><text x="340" y="160">32 bytes</text>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="20" width="10" height="20"/><rect x="30" y="20" width="10" height="20"/>
    <rect x="40" y="20" width="10" height="20"/><rect x="50" y="20" width="10" height="20"/>
  </g>
  <text x="70" y="35" font-size="11" fill="#1f2a44">uint8_t: 1 byte per step</text>
  <g fill="#f2b880" stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="58" width="80" height="20"/><rect x="100" y="58" width="80" height="20"/>
    <rect x="180" y="58" width="80" height="20"/><rect x="260" y="58" width="80" height="20"/>
  </g>
  <text x="180" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">double: 8 bytes per step</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="96" width="40" height="20" fill="#8fb8f0"/>
    <rect x="60" y="96" width="40" height="20" fill="#fff"/>
    <rect x="100" y="96" width="80" height="20" fill="#f2b880"/>
    <rect x="180" y="96" width="40" height="20" fill="#8fb8f0"/>
    <rect x="220" y="96" width="40" height="20" fill="#fff"/>
    <rect x="260" y="96" width="80" height="20" fill="#f2b880"/>
  </g>
  <text x="40" y="110" font-size="11" text-anchor="middle" fill="#1f2a44">t_ms</text>
  <text x="80" y="110" font-size="11" text-anchor="middle" fill="#6c7a93">pad</text>
  <text x="140" y="110" font-size="11" text-anchor="middle" fill="#1f2a44">az</text>
  <text x="300" y="110" font-size="11" text-anchor="middle" fill="#1f2a44">Sample: 16</text>
</svg>
```
:::

::: context ptrdiff Why the difference is signed
`q - p` can be negative: if `q` is earlier in the array than `p`, the answer is how many steps *back*. So its type must be signed, unlike `std::size_t`, the unsigned type `sizeof` returns.

On a 64-bit platform `std::ptrdiff_t` is a 64-bit signed integer, `long` on Linux. Print it with `%td` in `printf`, as the example does; the `t` is the length modifier reserved for it.
:::

::: context half-open Four lockers, five marks
The array has four elements, but there are five addresses you may form: one at the start of each element, plus `end`, the mark right after the last one. You may compute and compare `end`, never read through it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="30" y="30" width="60" height="34"/><rect x="90" y="30" width="60" height="34"/>
    <rect x="150" y="30" width="60" height="34"/><rect x="210" y="30" width="60" height="34"/>
  </g>
  <rect x="270" y="30" width="60" height="34" fill="#fff" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="60" y="52">d[0]</text><text x="120" y="52">d[1]</text>
    <text x="180" y="52">d[2]</text><text x="240" y="52">d[3]</text>
  </g>
  <text x="300" y="52" font-size="11" text-anchor="middle" fill="#b4232c">no read</text>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="30" y="84">d</text><text x="90" y="84">d+1</text><text x="150" y="84">d+2</text>
    <text x="210" y="84">d+3</text><text x="270" y="84">d+4 = end</text>
  </g>
  <text x="180" y="110" font-size="11" text-anchor="middle" fill="#6c7a93">begin, up to but not including end</text>
</svg>
```
:::

::: context compiler-uses-rule Where the rule is enforced
In ordinary code, nothing checks the rule while the program runs — that is AddressSanitizer's job. But one part of the compiler does check it: the part that evaluates `constexpr` code while compiling.

Given `constexpr` code that computes `d + 5` for `double d[4]`, clang 18 refuses to compile it, with the note "cannot refer to element 5 of array of 4 elements in a constant expression", and says the same about `d - 1` as "element -1". Undefined behavior is not allowed inside a constant expression, so a compiler that catches it must reject the code. g++ 13.3 happened to accept that `d + 5`, which is a reminder that the checks differ between compilers.
:::

::: context redzones How ASan knew where the array ended
AddressSanitizer keeps a **shadow** map: one shadow byte for every 8 bytes of memory, saying how many of them are valid. It also pads each stack variable with **redzones**, guard bytes marked as poison. In this report, the shadow row around `telemetry` read `f1 f1 f1 f1 00 00 00 00 f3 f3 f3 f3`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="100" height="30" fill="#b4232c" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="120" y="30" width="100" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="220" y="30" width="100" height="30" fill="#b4232c" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="50" font-size="11" text-anchor="middle" fill="#fff">left redzone f1</text>
  <text x="170" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">telemetry 00</text>
  <text x="270" y="50" font-size="11" text-anchor="middle" fill="#fff">right redzone f3</text>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="20" y="78">0</text><text x="120" y="78">32</text><text x="220" y="78">64</text><text x="320" y="78">96</text>
  </g>
  <line x1="220" y1="22" x2="220" y2="8" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="228" y="16" font-size="11" fill="#1f2a44">*end reads here</text>
  <text x="180" y="102" font-size="11" text-anchor="middle" fill="#6c7a93">frame offsets in bytes; each shadow byte covers 8</text>
</svg>
```

Lesson 09 takes this machinery apart.
:::

::: context decay-word Why "decay"
The word suggests something breaking down into a simpler form, and that is what happens: a rich type, "array of 10 doubles", becomes the poorer type "pointer to double". The rule comes from C, where it let arrays be passed to functions cheaply, by address, in the 1970s. C++ kept it for compatibility, which is why the fix is a newer type like `std::span` rather than a change to the rule.
:::

::: context span-origin Where span came from
`std::span` arrived in C++20, but the idea is older. The C++ Core Guidelines, written by Bjarne Stroustrup, Herb Sutter and others, recommended passing a pointer-and-length pair as one object, and their Guidelines Support Library shipped a `gsl::span` for code that could not wait. The standard version grew out of it.

Read `std::span<const double>` as "a view of some doubles I will not change". The `const` belongs to the elements, like the pointee `const` in lesson 02.
:::

::: context trusted-length The bug that trusts a stated length
Heartbleed, disclosed in 2014, was this bug in OpenSSL, software that protects much of the web's traffic. A "heartbeat" message said how long its payload was, and the server copied back that many bytes without checking the claim against the bytes actually received. By claiming a long payload, an attacker got up to about 64 KB of the server's memory per request, which could include passwords and private keys.

The lesson for telemetry code is the same: a length is only as good as whoever produced it.
:::
