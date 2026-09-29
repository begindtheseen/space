---
id: l03-variadic-templates
title: Templates that take any number of arguments
minutes: 18
covers:
  - Variadic templates, parameter packs, fold expressions
---

Think of a shipping form with the line "list the items in this box". It does not say "exactly three items". You may list one item, or ten, or none at all, and the form still works, because it was designed for "however many there are".

The templates so far had a fixed number of holes: one `T` in `clamp_to`, three in `Matrix<T, R, C>`. A **variadic template** has a hole that holds *any number* of things — zero, one, or twenty — each with its own type. Read "variadic" as "with a varying number of arguments".

You have already leaned on these without seeing inside. `std::tuple<int, double, bool>` holds any list of types. `std::make_unique<Sensor>("imu0", 2, 400.0)` passes any list of arguments to a constructor. `v.emplace_back(…)` does the same for a vector, and the `Pool::acquire` of the memory module's placement-new lesson did it by hand. In flight software the everyday case is a telemetry logger: one `log(tick, temperature, volts, armed)` that accepts whatever fields a packet has, checks their types at compile time, and costs no more than hand-written code.

## Parameter packs

Here is the shape of a variadic function template:

```cpp
template <typename... Ts>
void log(const Ts&... fields);
```

Read `typename... Ts` aloud as "`Ts`, a pack of types". The three dots after `typename` make `Ts` a **template parameter pack**: one name standing for a list of zero or more types. Read `const Ts&... fields` as "`fields`, a pack of const references, one per type in `Ts`". That is a **function parameter pack**: one name standing for a list of zero or more function parameters.

At a call, deduction fills the pack from the arguments, one type per argument. For `log(tick, temp, 28.12f)`, with `tick` a `std::uint32_t` and `temp` a `std::int16_t`, the compiler deduces `Ts = {std::uint32_t, std::int16_t, float}` and writes a real function with exactly three parameters. Call it with two arguments somewhere else, and that is a second instantiation, with two parameters. Every one is fully typed.

You can ask how many elements a pack has with `sizeof...(Ts)`, read "size-of dot dot dot of `Ts`". It is a compile-time constant. It counts elements; it does not measure bytes. `sizeof...(fields)` gives the same count.

::: key
A parameter pack is a single name for a list of zero or more template arguments (`typename... Ts`) or function parameters (`Ts... xs`). `sizeof...(Ts)` is the number of elements, known at compile time.
:::

## Pack expansion: using the whole list

A pack is not a container. You cannot write `fields[0]` or run a `for` loop over it. What you can do is **expand** it: write a pattern that mentions the pack, then `...` after the pattern. The compiler stamps the pattern out once per element, separated by commas.

- `f(xs...)` becomes `f(x0, x1, x2)`: pass them all along.
- `f(g(xs)...)` becomes `f(g(x0), g(x1), g(x2))`: the pattern is `g(xs)`, so `g` is applied to each.
- `f(g(xs...))` becomes `f(g(x0, x1, x2))`: the pattern is only `xs`, so all of them go into one call of `g`.

Where the dots sit decides what repeats. Read the pattern to the left of the `...` as the thing being copied.

Expansions may appear where a comma-separated list is allowed: function-call arguments, template argument lists such as `std::tuple<Ts...>`, braced initializer lists, and a few more. Doing something *for each* element, like printing it, needs one more tool — the fold expression below.

::: warning The dots follow the pattern, not the name
`std::forward<Args>(args)...` forwards each argument separately; the pattern `std::forward<Args>(args)` mentions both packs, and they are expanded together, in step. Moving the dots inside, as `std::forward<Args...>(args...)`, is a different and wrong expression. When an expansion misbehaves, underline the pattern the dots apply to and write out what it becomes for three elements.
:::

## The old way: peel one off and recurse

Before C++17, a function that did something to each element had to be written as a recursion. Handle the first argument yourself, and call yourself again with the rest:

```cpp
double sum_sq_old() { return 0.0; }                      // base case: empty pack

template <typename T, typename... Rest>
double sum_sq_old(T first, Rest... rest) {
    return first * first + sum_sq_old(rest...);          // one fewer argument each call
}
```

The template splits the arguments into `first`, one ordinary parameter, and `rest`, a pack. Calling `sum_sq_old(3.0, 4.0, 12.0)` instantiates a version for three arguments, which calls a version for two, which calls a version for one, which calls the plain base-case function with none. That is three instantiations plus a base case for one call — correct, but [[heavy on the compiler|recursion-cost]], and awkward to read.

## Fold expressions

C++17 added a direct way to combine every element of a pack with an operator: the **fold expression**. It is a parenthesised expression with a pack, an operator and `...`.

```cpp
template <typename... Ts>
double sum_sq(Ts... xs) {
    return (0.0 + ... + (xs * xs));
}
```

Read `(0.0 + ... + (xs * xs))` as "start at zero and add each `xs` squared". For three arguments the compiler writes

```cpp
((0.0 + (x0 * x0)) + (x1 * x1)) + (x2 * x2)
```

There are four forms. Here `op` is any of the 32 binary operators (`+`, `*`, `&&`, `||`, `,`, `<<` and so on), `E` is an expression containing a pack, and `I` is a starting value with no pack in it:

| Form | Written | Becomes, for three elements |
| --- | --- | --- |
| unary right fold | `(E op ...)` | `E0 op (E1 op E2)` |
| unary left fold | `(... op E)` | `(E0 op E1) op E2` |
| binary right fold | `(E op ... op I)` | `E0 op (E1 op (E2 op I))` |
| binary left fold | `(I op ... op E)` | `((I op E0) op E1) op E2` |

The side the dots are on is the side the brackets pile up on. Dots on the left: the grouping starts at the left, like reading. The outer parentheses are part of the syntax; leave them off and it does not compile.

::: key
A fold expression applies a binary operator across a parameter pack in one expression, for example summing all arguments or calling a function on each. It replaces the old recursive-variadic-template pattern with one line.
:::

::: example A vector norm for any number of components
```cpp
#include <cmath>
#include <cstdio>

// The old way (C++11): peel off one argument, recurse on the rest.
double sum_sq_old() { return 0.0; }                      // base case: empty pack

template <typename T, typename... Rest>
double sum_sq_old(T first, Rest... rest) {
    return first * first + sum_sq_old(rest...);          // one fewer argument each call
}

// The C++17 way: one fold expression.
template <typename... Ts>
double sum_sq(Ts... xs) {
    return (0.0 + ... + (xs * xs));                      // binary left fold
}

template <typename... Ts>
double norm(Ts... xs) { return std::sqrt(sum_sq(xs...)); }

int main() {
    std::printf("%.1f %.1f\n", sum_sq_old(3.0, 4.0, 12.0), sum_sq(3.0, 4.0, 12.0));
    std::printf("|v| = %.1f m/s\n", norm(3.0, 4.0, 12.0));
    std::printf("|q| = %.4f\n", norm(0.5, 0.5, 0.5, 0.5));
    std::printf("empty: %.1f\n", sum_sq());
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`, it prints:

```
169.0 169.0
|v| = 13.0 m/s
|q| = 1.0000
empty: 0.0
```

Step by step:

1. Both versions compute $3^2 + 4^2 + 12^2 = 9 + 16 + 144 = 169$. The old and new ways agree.
2. `norm(3.0, 4.0, 12.0)` passes the whole pack on with `xs...` and takes the square root: $\sqrt{169} = 13$. A velocity with those components in meters per second has a speed of $13\,\mathrm{m/s}$.
3. A quaternion has four components. `norm(0.5, 0.5, 0.5, 0.5)` is $\sqrt{4 \times 0.25} = \sqrt{1} = 1$, so this one is a unit quaternion, as attitude quaternions must be. The same template made a four-argument version with no extra code.
4. `sum_sq()` with no arguments gives $0.0$: in a binary fold with an empty pack, only the starting value `I` is left.

Sanity check: the counts of arguments were 3, 3, 4 and 0, and every one worked from the same two lines of template.
:::

### Empty packs and the order of operations

A unary fold has no starting value, so an empty pack leaves it with nothing to say. Three operators have a sensible answer anyway: `&&` gives `true` (all of nothing is satisfied), `||` gives `false`, and the comma operator gives `void()`, which does nothing. Any other operator on an empty pack is an error:

```cpp
template <typename... Ts> double total(Ts... xs) { return (xs + ...); }
// total() with no arguments:
```

```
error: fold of empty expansion over operator+
```

The fix is a binary fold with a starting value, `(xs + ... + 0.0)`.

The direction matters too. With `10, 3, 2`, the right fold `(xs - ...)` computes $10 - (3 - 2) = 9$, and the left fold `(... - xs)` computes $(10 - 3) - 2 = 5$. For `+` and `*` on integers the two agree, but not always for floating-point numbers, because [[rounding depends on order|float-order]].

::: warning Pick the fold on purpose
Use a unary fold only where an empty pack is impossible or the operator is `&&`, `||` or the comma; otherwise give a starting value, which also fixes the result type. For subtraction, division or floating-point sums where the order matters, choose left or right deliberately, and prefer the left fold, which matches the order a hand-written loop would use.
:::

## Doing something for each element: the comma fold

The **[[comma operator|comma-operator]]** evaluates its left side, throws the result away, then evaluates its right side. Folding over it turns "do this to each argument" into one line, in order from left to right:

```cpp
(print_field(fields), ...);
```

For three fields this becomes `print_field(f0), (print_field(f1), print_field(f2))`, and the comma operator guarantees `f0` is printed first, then `f1`, then `f2`.

::: example A telemetry logger and packer
Each call below takes a different list of fields. The logger counts them, adds up their sizes, and prints each with the right overload. The packer copies them into one byte buffer whose length is computed at compile time.

```cpp
#include <array>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <cstring>

void print_field(std::int16_t v)  { std::printf(" %d", v); }
void print_field(std::uint32_t v) { std::printf(" %u", static_cast<unsigned>(v)); }
void print_field(float v)         { std::printf(" %.2f", static_cast<double>(v)); }
void print_field(bool v)          { std::printf(" %s", v ? "ARMED" : "SAFE"); }

// Print every field, in order, with one comma fold.
template <typename... Fields>
void log_packet(const char* tag, const Fields&... f) {
    std::printf("[%s] %zu field(s), %zu bytes:", tag, sizeof...(Fields), (sizeof(Fields) + ... + 0));
    (print_field(f), ...);
    std::printf("\n");
}

// Copy every field into one byte buffer whose size is computed at compile time.
template <typename... Fields>
std::array<unsigned char, (sizeof(Fields) + ... + 0)> pack(const Fields&... f) {
    std::array<unsigned char, (sizeof(Fields) + ... + 0)> out{};
    std::size_t offset = 0;
    ((std::memcpy(out.data() + offset, &f, sizeof f), offset += sizeof f), ...);
    return out;
}

int main() {
    const std::uint32_t tick = 120034;
    const std::int16_t  temp_decic = -153;   // -15.3 C in tenths of a degree
    const float         bus_volts = 28.12f;
    const bool          armed = false;

    log_packet("HK", tick, temp_decic, bus_volts, armed);
    log_packet("PING", tick);

    const auto bytes = pack(tick, temp_decic, bus_volts, armed);
    std::printf("packed %zu bytes:", bytes.size());
    for (unsigned char b : bytes) std::printf(" %02x", b);
    std::printf("\n");
}
```

It prints:

```
[HK] 4 field(s), 11 bytes: 120034 -153 28.12 SAFE
[PING] 1 field(s), 4 bytes: 120034
packed 11 bytes: e2 d4 01 00 67 ff c3 f5 e0 41 00
```

Walk through the first call.

1. Deduction gives `Fields = {std::uint32_t, std::int16_t, float, bool}`, so `sizeof...(Fields)` is $4$.
2. `(sizeof(Fields) + ... + 0)` is a fold over *types*: $4 + 2 + 4 + 1 + 0 = 11$ bytes. It is a constant, worked out while compiling.
3. The comma fold calls `print_field` four times, in order, and overload resolution picks the right one for each type, so the `bool` prints as `SAFE`.

The second call has one field, so it is a second, smaller instantiation: 1 field, 4 bytes.

The packer uses the 11 as the array length — a non-type template argument, straight from last lesson. Its comma fold does two things per field: copy the field's bytes to the current offset, then move the offset along. The first four bytes, `e2 d4 01 00`, are $120034$ written [[lowest byte first|packet-bytes]]; `67 ff` is $-153$; `c3 f5 e0 41` is the `float` $28.12$; `00` is `false`. Sanity check: a Python `struct.pack('<Ihf?', 120034, -153, 28.12, False)` gives exactly the same 11 bytes, and a C++ struct holding these four members would take 16 bytes on this machine because of padding, so packing field by field really did save space.
:::

::: warning Declare the helpers first
The `print_field` overloads sit above `log_packet` on purpose. Move them below the template, and g++ refuses: `'print_field' was not declared in this scope, and no declarations were found by argument-dependent lookup at the point of instantiation`. For arguments like `int` and `float`, the name has to be visible where the template is written. Lesson 4, on two-phase lookup, explains this rule.
:::

## Passing a pack on unchanged

The last common job is forwarding: taking any arguments and handing them, untouched, to someone else — usually a constructor. That is what `std::make_unique`, `emplace_back` and the memory module's `Pool::acquire` do.

```cpp
template <typename T, typename... Args>
std::unique_ptr<T> make_owned(Args&&... args) {
    return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}

auto imu = make_owned<Sensor>("imu0", 2, 400.0);   // Sensor(std::string, int, double)
```

Two new pieces work together. In a deduced template, `Args&&...` is a pack of **[[forwarding references|forwarding-ref]]**: each one binds to anything, and remembers whether it was given a temporary or a named variable. `std::forward<Args>(args)...` then passes each argument on the same way it came in, so a temporary can still be moved from and a named variable is still copied. With a `Sensor` whose constructor takes a name, a bus and a rate, the program prints `imu0 on bus 2 at 400 Hz`.

Classes can be variadic too. `std::tuple<Ts...>` and `std::variant<Ts...>` from the last module are **[[variadic class templates|tuple-bridge]]**: one template for any list of member types.

::: key
`template <typename T, typename... Args> … T(std::forward<Args>(args)...)` passes any argument list through unchanged; `Args&&` in a deduced context is a forwarding reference. This is how `make_unique` and `emplace_back` construct in place.
:::

## Check yourself

::: check
For `template <typename... Ts> void f(Ts... xs)`, what are `Ts` and `sizeof...(xs)` for the calls `f(1, 2.0, 'c')`, `f(true)` and `f()`? How many instantiations of `f` do those three calls create?
:::

::: answer
`f(1, 2.0, 'c')`: `Ts = {int, double, char}`, and `sizeof...(xs)` is $3$. `f(true)`: `Ts = {bool}`, count $1$. `f()`: `Ts` is empty, count $0$ — an empty pack is allowed.

Three instantiations, because each call has a different list of types. `sizeof...` counts elements; it does not measure bytes, so the count for the first call is $3$, not $4 + 8 + 1$.
:::

::: check
Given `int twice(int x)` and a pack `xs` holding `1, 2, 3`, write what each expands to: `std::printf("%d %d %d\n", twice(xs)...)` and `sum(twice(xs...))`. Which one is almost certainly a bug?
:::

::: answer
In the first, the pattern is `twice(xs)`, so it becomes `std::printf("%d %d %d\n", twice(1), twice(2), twice(3))` and prints `2 4 6`.

In the second, the pattern is only `xs`, so it becomes `sum(twice(1, 2, 3))`. `twice` takes one argument, so that fails to compile. The dots belonged after `twice(xs)`: `sum(twice(xs)...)`.
:::

::: check
Write a function `all_valid(bool... flags)`-style template that returns whether every flag is true, using a fold. What does it return with no arguments, and why is that a sensible answer?
:::

::: answer
```cpp
template <typename... Ts>
bool all_valid(Ts... flags) { return (flags && ...); }
```

With no arguments it returns `true`. An `&&` fold over an empty pack is defined as `true`, which matches the logic: "every one of zero sensors is valid" has no counterexample. The unary fold is safe here only because `&&` is one of the three operators with an empty-pack value. We compiled `all_valid(true, true, false)` and `all_valid()` and got `0` and `1`.
:::

::: check
A teammate writes `template <typename... Ts> double mean(Ts... xs) { return (xs + ...) / sizeof...(xs); }`. Name two problems, and fix them.
:::

::: answer
First, `mean()` with no arguments does not compile: a `+` fold over an empty pack is an error ("fold of empty expansion over operator+"). Second, with all `int` arguments the sum is an `int`, divided by an unsigned count, so `mean(1, 2)` does integer division and returns `1.0` instead of `1.5`.

A binary fold starting at `0.0` fixes both the empty case and the type, and a `static_assert` can reject the empty call with a readable message, because dividing by zero elements is meaningless:

```cpp
template <typename... Ts>
double mean(Ts... xs) {
    static_assert(sizeof...(xs) > 0, "mean needs at least one value");
    return (0.0 + ... + xs) / sizeof...(xs);
}
```
:::

::: check
How long is the array returned by `pack(std::uint16_t{7}, 1.0, std::uint8_t{3})`, where `pack` is the example's function, and when is that length decided?
:::

::: answer
The fold `(sizeof(Fields) + ... + 0)` becomes $2 + 8 + 1 + 0 = 11$, so it returns a `std::array<unsigned char, 11>`. The length is decided while compiling: it is built from `sizeof` of each type, which is a constant, and it becomes part of the return type. No byte count is computed while the program runs.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| `typename... Ts` | a template parameter pack | zero or more types, deduced one per argument |
| `Ts... xs` | a function parameter pack | one parameter per type in `Ts` |
| `sizeof...(Ts)` | how many elements | a compile-time count, not bytes |
| pack expansion `pattern...` | stamp the pattern once per element | `f(g(xs)...)` applies `g` to each; `f(g(xs...))` does not |
| recursion (pre-C++17) | peel one off, recurse on the rest | needs a base case; many instantiations |
| fold expression | combine a pack with an operator | `(E op ...)`, `(... op E)`, `(E op ... op I)`, `(I op ... op E)`; parentheses required |
| empty pack | unary folds | only `&&` (true), logical or (false), comma (`void()`) |
| comma fold | `(f(xs), ...)` | calls `f` on each, left to right |
| forwarding | `std::forward<Args>(args)...` | passes each argument on as it came; `make_unique`, `emplace_back` |

The next lesson opens up how the compiler reads a template's body at all: why you sometimes have to write `typename` in front of a name, and why the `print_field` helpers had to come first.

::: context recursion-cost Every level is a new function
In the recursive version, a call with $n$ arguments instantiates $n$ separate function templates, each with its own mangled name, plus the base case. The optimizer usually inlines them all into a flat sum, so the running program is fast. The cost lands on the compiler, which must create, check and then discard every level; with long packs used in many places, that adds up. Lesson 10 is about exactly this kind of build-time cost. A fold expression is one instantiation.
:::

::: context float-order Adding in a different order can change the answer
A `double` keeps only about 16 significant decimal digits. Add $1$ to $10^{16}$ and the $1$ falls off the end, so $(10^{16} + 1) - 10^{16}$ gives $0$ on a computer, while $(10^{16} - 10^{16}) + 1$ gives $1$. Mathematically both are $1$. So a left fold and a right fold of the same floating-point numbers can disagree in the last digits, and occasionally by more. The last module's `std::accumulate` was a left fold, which is the order a plain loop uses.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">left fold (... + x)</text>
  <text x="270" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">right fold (x + ...)</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="90" y1="40" x2="60" y2="70"/><line x1="90" y1="40" x2="130" y2="130"/>
    <line x1="60" y1="70" x2="30" y2="130"/><line x1="60" y1="70" x2="85" y2="130"/>
    <line x1="270" y1="40" x2="230" y2="130"/><line x1="270" y1="40" x2="300" y2="70"/>
    <line x1="300" y1="70" x2="275" y2="130"/><line x1="300" y1="70" x2="330" y2="130"/>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5">
    <circle cx="90" cy="40" r="11"/><circle cx="60" cy="70" r="11"/>
    <circle cx="270" cy="40" r="11"/><circle cx="300" cy="70" r="11"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="90" y="44">+</text><text x="60" y="74">+</text><text x="270" y="44">+</text><text x="300" y="74">+</text>
    <text x="30" y="144">x0</text><text x="85" y="144">x1</text><text x="130" y="144">x2</text>
    <text x="230" y="144">x0</text><text x="275" y="144">x1</text><text x="330" y="144">x2</text>
  </g>
</svg>
```
:::

::: context comma-operator The comma that is an operator
Most commas in C++ are punctuation: they separate function arguments or declarations. Inside an expression, though, `a, b` is the comma operator: evaluate `a` completely, discard its value, then evaluate `b` and use that. It is one of the few operators with a guaranteed order, which is why a comma fold prints fields in the order written. If a type overloads `operator,` the guarantee can be lost; almost nobody does, and coding standards such as AUTOSAR C++14 forbid overloading it.
:::

::: context packet-bytes Reading the packed bytes
The flight computer here is little-endian, so each number is stored lowest byte first. The memory module's lesson on endianness showed why a ground station must agree on the order before it can decode a packet. The fields sit back to back, with no padding.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="30" width="120" height="30" fill="#8fb8f0"/>
    <rect x="130" y="30" width="60" height="30" fill="#f2b880"/>
    <rect x="190" y="30" width="120" height="30" fill="#8fb8f0"/>
    <rect x="310" y="30" width="30" height="30" fill="#f2b880"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="70" y="49">e2 d4 01 00</text><text x="160" y="49">67 ff</text>
    <text x="250" y="49">c3 f5 e0 41</text><text x="325" y="49">00</text>
    <text x="70" y="80">tick = 120034</text><text x="160" y="80">-153</text>
    <text x="250" y="80">28.12 V</text><text x="325" y="80">safe</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#6c7a93">
    <text x="10" y="22">0</text><text x="130" y="22">4</text><text x="190" y="22">6</text><text x="310" y="22">10</text>
  </g>
  <text x="180" y="102" font-size="11" text-anchor="middle" fill="#6c7a93">byte offsets above; 11 bytes in all</text>
</svg>
```
:::

::: context forwarding-ref One reference that binds to anything
Normally `X&&` is an rvalue reference, which binds only to temporaries, as the move-semantics lesson taught. But when `X` is a template parameter being deduced right there, `X&&` follows a special rule: given a named variable, `X` is deduced as an lvalue reference and the parameter becomes one; given a temporary, it stays an rvalue reference. `std::forward<X>` reads that recorded choice and restores it when passing the argument on. The two only work as a pair.
:::

::: context tuple-bridge A class with any number of members
`std::tuple<std::uint32_t, float, bool>` stores one member of each listed type, and `std::get<1>(t)` reads the `float`. Its declaration is `template <class... Types> class tuple;` — a variadic class template. `std::variant<Ts...>` holds one of its listed types at a time, and `std::visit` uses packs internally to try each. Lesson 5 shows the type-trait tools that let code ask questions about the types inside such packs.
:::
