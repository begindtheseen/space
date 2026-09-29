---
id: l05-type-traits
title: "Type traits: asking the compiler questions about types"
minutes: 24
covers:
  - "Type traits: is_same, is_floating_point, conditional, decay, remove_cvref"
---

Picture the check-in desk at an airport. Before your bag goes anywhere, the agent asks it questions. Is it heavier than 23 kg? Is it a liquid? Does it contain a battery? Some questions have yes-or-no answers. Others change the bag: take off the plastic wrap, take the laptop out, put on a destination tag. Nothing has flown yet. All of it happens at the desk, before departure, and a bag that fails a check never reaches the plane.

A **type trait** is that desk for types. It is a small class template that answers a question about a type, or produces a changed type, while the program is being compiled. "Is `T` a floating-point type?" "Are `A` and `B` the same type?" "What is `T` with its `const` and its `&` removed?" The answers cost nothing when the program runs, because by then they are already baked in.

Last lesson you had to tell the compiler things about names. This lesson turns it around: your template asks the compiler things about types. Flight code uses this all the time. A Kalman filter template refuses to build with an integer scalar. A logging routine picks a wider type to add in. A generic buffer stores a clean copy of whatever it is given, with no stray `const` or reference attached. The tools live in the standard header `<type_traits>`, and five of them carry most of the load: `is_same`, `is_floating_point`, `conditional`, `decay` and `remove_cvref`.

## Two kinds of question

A type trait has one of two shapes.

A **predicate trait** answers yes or no. It has a member called `value`, a compile-time `bool`:

```cpp
std::is_floating_point<double>::value    // true
std::is_same<int, long>::value           // false
```

Read `std::is_floating_point<double>::value` aloud as "is floating point of double, its value".

A **transformation trait** produces a new type. It has a member type called `type`:

```cpp
std::remove_cvref<const double&>::type   // double
```

Read it as "remove cv-ref of const double ref, its type". Both kinds are worked out entirely by the compiler. No object is created and no instruction runs.

### The _v and _t shortcuts

Writing `::value` and `::type` everywhere gets tiring. And because `std::remove_cvref<T>::type` is a dependent name inside a template, last lesson's rule means you would often have to write `typename std::remove_cvref<T>::type`. So the standard gives every trait a short form:

- `std::is_same_v<A, B>` means `std::is_same<A, B>::value`. The `_v` is for "value". It is a **[[variable template|variable-template]]**, added in C++17.
- `std::remove_cvref_t<T>` means `typename std::remove_cvref<T>::type`. The `_t` is for "type". It is an **alias template**, a `using` declaration with template parameters, added in C++14.

```cpp
// The _t helper is defined, in essence, like this:
template <typename T>
using remove_cvref_t = typename remove_cvref<T>::type;
```

That one `typename` inside the alias is written once, by the library, so you never write it again. Use the `_v` and `_t` forms everywhere; the long forms are what you will see in older code.

::: key
A type trait is a class template that answers a compile-time question about a type (member `value`) or computes a new type (member `type`). The helpers `std::X_v<T>` (C++17) and `std::X_t<T>` (C++14) are short for `std::X<T>::value` and `typename std::X<T>::type`.
:::

## How a trait is built

There is no magic in `<type_traits>` for most of these. A trait is a template plus some specializations, exactly the tools of lesson 1. The general template gives the default answer. A specialization gives the answer for the special cases.

Here is a home-made `is_same`. The general version says "no". A partial specialization catches the one pattern where both arguments are the same type, and says "yes":

```cpp
template <typename A, typename B>
struct same_as_trait { static constexpr bool value = false; };      // the general answer: no

template <typename A>
struct same_as_trait<A, A> { static constexpr bool value = true; };  // both the same: yes
```

When you ask for `same_as_trait<int, int>`, the compiler checks which versions match. The general one always matches. The specialization `<A, A>` also matches, with `A = int`, and because it is more specialized, it wins: `value` is `true`. For `same_as_trait<int, long>`, no single `A` can be both `int` and `long`, so only the general version matches: `false`.

::: example Building two traits by hand
```cpp
#include <cstdio>
#include <type_traits>

// A home-made copy of std::is_same: a primary template and one partial specialisation.
template <typename A, typename B>
struct same_as_trait { static constexpr bool value = false; };   // the general answer: no

template <typename A>
struct same_as_trait<A, A> { static constexpr bool value = true; }; // both the same: yes

// A home-made is_floating_point: the answer is "no" unless one of three specialisations matches.
template <typename T> struct is_float_trait              { static constexpr bool value = false; };
template <>           struct is_float_trait<float>       { static constexpr bool value = true; };
template <>           struct is_float_trait<double>      { static constexpr bool value = true; };
template <>           struct is_float_trait<long double> { static constexpr bool value = true; };

// The _v helper: a variable template that saves typing ::value.
template <typename T>
inline constexpr bool is_float_v = is_float_trait<T>::value;

int main() {
    std::printf("same_as_trait<int, int>     : %d\n", same_as_trait<int, int>::value);
    std::printf("same_as_trait<int, long>    : %d\n", same_as_trait<int, long>::value);
    std::printf("is_float_v<double>          : %d\n", is_float_v<double>);
    std::printf("is_float_v<int>             : %d\n", is_float_v<int>);
    std::printf("is_float_v<const double>    : %d\n", is_float_v<const double>);
    std::printf("std::is_floating_point_v<const double> : %d\n",
                std::is_floating_point_v<const double>);
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`, it prints (`1` is true, `0` is false):

```
same_as_trait<int, int>     : 1
same_as_trait<int, long>    : 0
is_float_v<double>          : 1
is_float_v<int>             : 0
is_float_v<const double>    : 0
std::is_floating_point_v<const double> : 1
```

The first four lines are what we designed. For `is_float_v<double>`, the explicit specialization `is_float_trait<double>` matches exactly, so `true`. For `int`, nothing but the general version matches, so `false`.

The fifth line is the lesson. `const double` is not the same type as `double`, so none of the three specializations matches, and the home-made trait says "not floating point". The standard one says yes: it strips `const` and `volatile` first, then asks. Sanity check: a `const double` certainly holds a floating-point number, so the standard answer is the right one. To fix ours, ask about `std::remove_cv_t<T>` instead of `T`.
:::

The standard traits add one more piece of polish. Their `value` comes from inheriting a tiny class, `std::true_type` or `std::false_type`, which are **[[bool_constant|bool-constant]]** types. You will see those names in error messages and in library code, and they mean exactly "a type that carries the answer true" or "false".

::: key
A trait is built from a primary template (the default answer) plus explicit or partial specializations (the special cases). `is_same<A, A>` is a partial specialization; `is_floating_point` is true for `float`, `double` and `long double`, with or without `const` and `volatile`.
:::

## is_same and is_floating_point

`std::is_same_v<A, B>` is true only when `A` and `B` are exactly the same type. "Close" does not count:

- `std::is_same_v<int, long>` is false, even on a machine where both happen to hold the same range of numbers. They are different types.
- `std::is_same_v<int, const int>` is false. `const` is part of the type.
- `std::is_same_v<std::int32_t, int>` is true on a typical Linux machine, because there `std::int32_t` is only another name for `int`. An alias does not make a new type.

`std::is_floating_point_v<T>` is true for the three floating-point types, `float`, `double` and `long double`, including their `const` and `volatile` versions. It is false for every integer type, for `bool`, and for anything with a reference attached: `std::is_floating_point_v<double&>` is false, because a reference to a double is not itself a double.

That last point bites inside templates, where references appear without being asked for.

::: example A reference hides the answer
```cpp
#include <cstdio>
#include <type_traits>

template <typename T>
void check(const T& x) {
    using X = decltype(x);    // the declared type of x: const T&
    std::printf("is_floating_point_v<T>                : %d\n", std::is_floating_point_v<T>);
    std::printf("is_floating_point_v<decltype(x)>      : %d\n", std::is_floating_point_v<X>);
    std::printf("is_floating_point_v<remove_cvref_t<..>>: %d\n",
                std::is_floating_point_v<std::remove_cvref_t<X>>);
}

int main() { check(9.80665); }
```

Output:

```
is_floating_point_v<T>                : 1
is_floating_point_v<decltype(x)>      : 0
is_floating_point_v<remove_cvref_t<..>>: 1
```

Step by step. The call `check(9.80665)` deduces `T = double`, so the first line asks about `double`: true. `decltype(x)`, read "decl-type of x", gives the type `x` was declared with, which is `const double&`. A reference is not a floating-point type, so the second line says false. The third line strips the `const` and the `&` first, leaving `double`, and the answer is true again. Sanity check: all three lines are about the same number, $9.80665\,\mathrm{m/s^2}$, standard gravity, so only an answer of "yes" makes physical sense. The "no" came from the reference wrapped around it.
:::

::: warning Ask about the bare type
Whenever the type you are testing might carry a reference or a `const` (anything from `decltype`, anything deduced from a forwarding parameter `T&&`), strip it first: `std::is_floating_point_v<std::remove_cvref_t<X>>`. Otherwise a perfectly good `double` can fail your check.
:::

## Changing a type: remove_cvref and decay

The **cv-qualifiers** are `const` and `volatile`, the two words that can be stuck onto a type ("cv" is their initials). `const` you know. **[[volatile|volatile-registers]]** tells the compiler that the value may change behind the program's back, as a hardware register does, so every read must really happen.

`std::remove_cvref_t<T>`, new in C++20, takes a type and removes, in this order, a reference (`&` or `&&`), and then any top-level `const` and `volatile`. What is left is the plain type underneath. It is the "take off the wrapping" trait.

`std::decay_t<T>` goes one step further. It turns `T` into the type you would get if you passed a `T` **by value**, the way a function parameter `void f(U u)` would receive it. That means everything `remove_cvref` does, plus two conversions:

- an array becomes a pointer to its first element: `const char[4]` becomes `const char*`;
- a function becomes a pointer to that function: `void(int)` becomes `void(*)(int)`.

Those two conversions are what the language already does to arrays and functions passed by value. That loss of information, an array forgetting its length, is why this is called **[[decay|decay-name]]**.

::: example Watching the types change
g++ and clang++ write out a template's arguments inside the built-in name `__PRETTY_FUNCTION__`. It is a compiler extension, not standard C++, but it is a handy way to *see* a type.

```cpp
#include <cstdio>
#include <type_traits>

// g++ and clang++ spell out T inside __PRETTY_FUNCTION__ (a compiler extension).
template <typename T>
void show(const char* label) { std::printf("%-34s %s\n", label, __PRETTY_FUNCTION__); }

void on_tick(int) {}

int main() {
    show<std::remove_cvref_t<const double&>>("remove_cvref_t<const double&>");
    show<std::remove_cvref_t<volatile int>>("remove_cvref_t<volatile int>");
    show<std::remove_cvref_t<const char(&)[4]>>("remove_cvref_t<const char(&)[4]>");
    show<std::decay_t<const double&>>("decay_t<const double&>");
    show<std::decay_t<const char(&)[4]>>("decay_t<const char(&)[4]>");
    show<std::decay_t<decltype(on_tick)>>("decay_t<void(int)>");
}
```

Output with g++ 13:

```
remove_cvref_t<const double&>      void show(const char*) [with T = double]
remove_cvref_t<volatile int>       void show(const char*) [with T = int]
remove_cvref_t<const char(&)[4]>   void show(const char*) [with T = char [4]]
decay_t<const double&>             void show(const char*) [with T = double]
decay_t<const char(&)[4]>          void show(const char*) [with T = const char*]
decay_t<void(int)>                 void show(const char*) [with T = void (*)(int)]
```

Go line by line. `const double&` loses its `&` and then its `const`: `double`. `volatile int` loses its `volatile`: `int`. The third input is the type of a string literal like `"IMU"` bound to a reference: a reference to an array of 4 `const char` (three letters plus the terminating zero). `remove_cvref` drops the reference and the `const`, and keeps the array: `char[4]`, length intact.

Now `decay`. For `const double&` it gives the same `double`. For the string literal it does not keep the array: the array decays to a pointer, `const char*`, and the length 4 is gone. For the function `on_tick`, whose type is `void(int)`, it gives a function pointer, `void (*)(int)`. Sanity check: if you wrote `auto p = "IMU";`, `p` would be a `const char*`, the same answer `decay` gave, because `auto` uses the same by-value rules.
:::

When do you want which? Use `remove_cvref_t` when you want "the plain type of this thing", for example before asking a predicate trait. Use `decay_t` when you are about to **store a copy** of an argument, as a generic event queue or a callback wrapper does, because a copy of an array or function has to be a pointer anyway. The standard library does exactly this: `std::make_pair` and `std::thread` decay their arguments before storing them.

::: key
`std::remove_cvref_t<T>` removes a reference and then top-level `const`/`volatile`. `std::decay_t<T>` does that too, and also turns an array into a pointer to its first element and a function into a function pointer: the type a by-value parameter would receive.
:::

## conditional: an if statement for types

Sometimes the right type depends on another type. `std::conditional_t<B, X, Y>` is a compile-time choice: if the `bool` `B` is true, it is the type `X`; otherwise it is `Y`. Read it as "if B then X else Y".

It is built the same way as every other trait: a general template for the `true` case, and a specialization for `false`.

```cpp
template <bool B, typename X, typename Y> struct conditional        { using type = X; };
template <typename X, typename Y>         struct conditional<false, X, Y> { using type = Y; };
```

The condition is usually another trait. A classic use is choosing the type to add up in.

::: example A wider accumulator for float samples
Adding a million `float` values in a `float` loses accuracy, because a `float` carries only about 7 significant decimal digits. This program picks a `double` accumulator when the samples are `float`, and keeps the sample type otherwise.

```cpp
#include <cstdio>
#include <type_traits>
#include <vector>

// Pick the type to add up in: float samples get a double accumulator,
// every other type keeps its own.
template <typename T>
using accum_t = std::conditional_t<std::is_same_v<T, float>, double, T>;

template <typename T>
accum_t<T> total(const std::vector<T>& v) {
    accum_t<T> s{};
    for (T x : v) s += x;
    return s;
}

int main() {
    std::vector<float> samples(1'000'000, 0.1f);    // one million readings of 0.1

    float naive = 0.0f;                            // adding in float, for comparison
    for (float x : samples) naive += x;

    std::printf("float accumulator : %.4f\n", naive);
    std::printf("accum_t<float>    : %.4f\n", total(samples));
    std::printf("sizeof(accum_t<float>) = %zu, sizeof(accum_t<int>) = %zu\n",
                sizeof(accum_t<float>), sizeof(accum_t<int>));
}
```

Output with `g++ -std=c++20 -Wall -Wextra -O2`:

```
float accumulator : 100958.3438
accum_t<float>    : 100000.0015
sizeof(accum_t<float>) = 8, sizeof(accum_t<int>) = 4
```

Step by step. For `T = float`, `std::is_same_v<float, float>` is true, so `accum_t<float>` is `double`, 8 bytes. For `T = int`, the test is false, so `accum_t<int>` is `int`, 4 bytes. The last line confirms both choices.

Now the numbers. The `float` closest to $0.1$ is really $0.100000001490116\ldots$, so a million of them add up to about $100000.0015$. The `double` accumulator gets that right. The `float` accumulator ends at $100958.3438$, off by $958$, almost $1\%$. The reason is **[[rounding|float-spacing]]** on every add: near $100000$, neighboring `float` values are $0.0078125$ apart, so each addition of $0.1$ lands on the nearest one, and a million small errors pile up. Sanity check: a million readings of $0.1$ "should" total $100000$, and the `double` result is within $0.002$ of that.
:::

## static_assert with traits

A **`static_assert`** is a check the compiler performs: `static_assert(condition, "message");` stops the build with your message if the condition is false. Put a trait in the condition and you have **[[a rule about types that cannot be broken|eigen-static-assert]]**.

A Kalman filter is the standard example. Its **[[gain|kalman-gain]]** is a ratio between $0$ and $1$, computed as $K = P / (P + R)$, where $P$ is how unsure the filter is about its estimate and $R$ is how noisy the sensor is. In integer arithmetic that division is **integer division**, which throws away the fraction. With $P = 1$ and $R = 1$, the gain is $1 / 2$, which in `int` is $0$. A gain of zero means the filter ignores every measurement forever. We tried it: an `int` version of the filter below, fed the readings 5, 6, 5 and 4, reported an estimate of 0 after every one. It compiled without a single warning.

So the filter's author writes the rule into the type:

```cpp
#include <cstdio>
#include <type_traits>

// A one-state Kalman filter: estimates a constant (say, a gyro bias) from noisy readings.
template <typename T>
class Kalman1 {
    static_assert(std::is_floating_point_v<T>,
                  "Kalman1<T>: T must be a floating-point type (float, double, long double)");
public:
    Kalman1(T x0, T p0, T r) : x_(x0), p_(p0), r_(r) {}
    T update(T z) {
        const T k = p_ / (p_ + r_);   // Kalman gain, between 0 and 1
        x_ += k * (z - x_);           // move the estimate toward the reading
        p_ *= (T{1} - k);             // uncertainty shrinks
        return x_;
    }
    T variance() const { return p_; }
private:
    T x_, p_, r_;
};

int main() {
    Kalman1<double> bias(0.0, 1.0, 0.25);             // start at 0, variance 1, reading variance 0.25
    const double z[] = {0.52, 0.47, 0.55, 0.49};      // readings, deg/s
    for (double zi : z) {
        const double est = bias.update(zi);
        std::printf("reading %.2f -> estimate %.4f, variance %.4f\n", zi, est, bias.variance());
    }
    // Kalman1<int> bad(0, 1, 1);    // uncomment: the static_assert fires
}
```

Output:

```
reading 0.52 -> estimate 0.4160, variance 0.2000
reading 0.47 -> estimate 0.4400, variance 0.1111
reading 0.55 -> estimate 0.4738, variance 0.0769
reading 0.49 -> estimate 0.4776, variance 0.0588
```

Check the first line by hand. The gain is $K = 1 / (1 + 0.25) = 0.8$. The estimate moves 80% of the way from $0$ to $0.52$: $0.8 \times 0.52 = 0.416$. The variance becomes $1 \times (1 - 0.8) = 0.2$. Second line: $K = 0.2 / 0.45 = 0.444$, the estimate moves to $0.416 + 0.444 \times (0.47 - 0.416) = 0.440$, and the variance to $0.2 \times 0.556 = 0.111$. The estimate climbs toward the readings' average, $0.5075\,\mathrm{deg/s}$, held back a little by the starting guess of $0$, and the variance keeps shrinking: exactly what a filter gathering evidence should do.

Now uncomment the `Kalman1<int>` line. g++ 13 says:

```
e4bad.cpp: In instantiation of 'class Kalman1<int>':
e4bad.cpp:28:21:   required from here
e4bad.cpp:7:24: error: static assertion failed: Kalman1<T>: T must be a floating-point type (float, double, long double)
    7 |     static_assert(std::is_floating_point_v<T>,
      |                   ~~~~~^~~~~~~~~~~~~~~~~~~~~~
e4bad.cpp:7:24: note: 'std::is_floating_point_v<int>' evaluates to false
```

Four lines, in plain English, pointing at the line that broke the rule. The silent zero-gain filter is now impossible to build.

::: key
`static_assert(std::is_floating_point_v<T>, "message")` inside a class template turns a type rule into a build failure with your own message, checked when the template is instantiated, at zero runtime cost.
:::

::: warning A static_assert fires only when the class is instantiated
The check in `Kalman1` runs when someone creates a `Kalman1<int>`, not when the header is read. Also, it lives *inside* the template, so the compiler has already chosen this template before the check fires. It cannot steer overload resolution toward a different function. The next lesson's tools, `enable_if` and concepts, move the check to the template's front door, where it can.
:::

## Check yourself

::: check
Say what each of these is: `std::is_same_v<unsigned, unsigned int>`, `std::is_same_v<char, signed char>`, `std::is_floating_point_v<const float>`, `std::is_floating_point_v<float*>`.
:::

::: answer
`unsigned` and `unsigned int` are two spellings of the same type, so the first is true. `char` and `signed char` are, by the standard's rule, three distinct types together with `unsigned char`, even though a `char` behaves like one of the other two on any given machine; so the second is false. `const float` is a floating-point type with a `const` on it, and the standard trait ignores `const`, so the third is true. `float*` is a pointer, not a floating-point type, so the fourth is false.
:::

::: check
Work out `std::remove_cvref_t<const int* const&>` and `std::decay_t<double[3]>`. Explain each step.
:::

::: answer
First one: remove the reference, leaving `const int* const`. Then remove the top-level `const`, the one on the pointer itself (the rightmost `const`), leaving `const int*`. The `const` on the `int` is not top-level: it describes what the pointer points at, so it stays. Answer: `const int*`, a pointer to a constant int.

Second: `double[3]` has no reference or cv to remove. It is an array, and `decay` turns an array into a pointer to its first element: `double*`. The length 3 is lost.
:::

::: check
Write the alias `wide_t<T>`: `long long` if `T` is an integer type smaller than 8 bytes, otherwise `T` itself. Use `std::is_integral_v<T>` (true for integer types) and `sizeof`. What is `wide_t<short>`, `wide_t<double>` and `wide_t<long long>`?
:::

::: answer
```cpp
template <typename T>
using wide_t = std::conditional_t<std::is_integral_v<T> && (sizeof(T) < 8), long long, T>;
```

`short` is integral and 2 bytes, so the condition is true: `wide_t<short>` is `long long`. `double` is not integral, so the condition is false: `double`. `long long` is integral but 8 bytes, so `sizeof(T) < 8` is false: `long long` (itself). The parentheses around `sizeof(T) < 8` are a good habit: inside a template argument list, a bare `>` would end the list, so comparisons are safest in parentheses.
:::

::: check
Sketch a home-made `is_pointer_trait<T>` with a `value` member. Which kind of specialization do you need, and why?
:::

::: answer
```cpp
template <typename T> struct is_pointer_trait     { static constexpr bool value = false; };
template <typename T> struct is_pointer_trait<T*> { static constexpr bool value = true; };
```

It needs a **partial** specialization, `is_pointer_trait<T*>`, because it must match every pointer type (`int*`, `double*`, `Frame*`…), a whole family, not one exact type. An explicit specialization would name one type only. Like the home-made `is_float_trait`, this version misses `int* const`; the standard `std::is_pointer` also handles the cv-qualified cases.
:::

::: check
A teammate writes `static_assert(sizeof(T) == 8, "need double")` in a filter template to make sure it runs in `double`. What slips through, and what should the assert be?
:::

::: answer
Many 8-byte types that are not `double`: `long`, `std::int64_t`, `unsigned long long`, any pointer, and a struct holding two `int`s. Each of those passes the size check and then does integer (or nonsense) arithmetic inside the filter. The check should ask the real question: `static_assert(std::is_same_v<T, double>, ...)` if it must be exactly `double`, or `static_assert(std::is_floating_point_v<T>, ...)` if any floating-point type is acceptable.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| Type trait | A compile-time question about a type | Member `value` (a predicate) or member `type` (a transformation) |
| `_v`, `_t` helpers | Short forms | `X_v<T>` is `X<T>::value`; `X_t<T>` is `typename X<T>::type` |
| Building a trait | Primary template + specializations | `is_same<A, A>` is a partial specialization |
| `is_same_v<A, B>` | Exactly the same type? | `int` vs `long`: false; `const int` vs `int`: false |
| `is_floating_point_v<T>` | `float`, `double`, `long double`? | Ignores cv; false for references |
| `remove_cvref_t<T>` | Strip `&`/`&&`, then top-level `const`/`volatile` | `const double&` becomes `double` |
| `decay_t<T>` | The by-value type | Also array to pointer, function to function pointer |
| `conditional_t<B, X, Y>` | If `B` then `X` else `Y` | Chosen at compile time |
| `static_assert` + trait | A type rule that breaks the build | `Kalman1<int>` fails with your message |

Next lesson puts traits to work at the front door of a template: `enable_if` uses them to remove overloads that do not fit, and C++20 concepts, like `std::floating_point`, which is defined straight from `is_floating_point_v`, turn them into readable requirements.

::: context variable-template A variable with a template parameter
Since C++14 a variable, not only a function or class, can be a template. `template <typename T> inline constexpr bool is_float_v = is_float_trait<T>::value;` declares a whole family of constants, one per type. `constexpr` means the value is known at compile time; `inline` lets the same definition appear in every file that includes the header without the linker complaining about duplicates. The standard `_v` helpers are declared this way. So is `std::numbers::pi_v<T>`, which gives $\pi$ in whichever floating-point type you ask for.
:::

::: context bool-constant Answers that are types
The standard library defines `std::integral_constant<T, v>`, a class whose only job is to carry the value `v` as a compile-time constant. `std::bool_constant<b>` is the `bool` version, and `std::true_type` and `std::false_type` are its two members. `std::is_same<int, int>` inherits from `std::true_type`, which is where its `value` comes from. Having the answer as a *type* lets you overload a function on it, an older technique called **tag dispatch**; lesson 7's `if constexpr` replaces most of it with an ordinary-looking `if`.
:::

::: context volatile-registers Why volatile exists
On a flight computer, many "variables" are really hardware: a memory address where a UART's status bits or an ADC's latest reading appear. The value changes because the hardware changes it, not because the program wrote it. Without `volatile`, the optimizer may read such an address once and reuse the answer, or drop a write it thinks nobody reads. `volatile` forbids that: every read and write in the source really happens, in order. It does *not* make access thread-safe; that is the concurrency module's topic.
:::

::: context decay-name Why "decay"
The word describes information being lost. An array knows its length as part of its type: `const char[4]`. The pointer it turns into knows only where the first element is. Nothing about the pointer says "four".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="14" y="22" font-size="12" fill="#1f2a44">const char[4]</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="120" y="8" width="40" height="24" fill="#8fb8f0"/>
    <rect x="160" y="8" width="40" height="24" fill="#8fb8f0"/>
    <rect x="200" y="8" width="40" height="24" fill="#8fb8f0"/>
    <rect x="240" y="8" width="40" height="24" fill="#8fb8f0"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="140" y="25">I</text><text x="180" y="25">M</text><text x="220" y="25">U</text><text x="260" y="25">\0</text>
  </g>
  <text x="200" y="50" font-size="11" text-anchor="middle" fill="#6c7a93">length 4 is part of the type</text>
  <text x="14" y="98" font-size="12" fill="#1f2a44">const char*</text>
  <rect x="120" y="82" width="56" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="148" y="99" font-size="11" text-anchor="middle" fill="#1f2a44">address</text>
  <line x1="148" y1="82" x2="140" y2="36" stroke="#b4232c" stroke-width="2"/>
  <polygon points="140,34 136,44 145,43" fill="#b4232c"/>
  <text x="196" y="99" font-size="11" fill="#6c7a93">points at the first; length gone</text>
</svg>
```
:::

::: context float-spacing Floats have gaps between them
A `float` stores 24 significant binary digits. Between $65536$ and $131072$ that leaves room for steps of $2^{-7} = 0.0078125$, and nothing in between. So once the running total passes $65536$, each "add $0.1$" really adds $0.1$ rounded to a multiple of $0.0078125$, which is $0.1015625$. The total gets there after about $651{,}000$ additions, and the remaining $349{,}000$ each add $0.0015625$ too much: about $545$ of the $958$ error. Lower stretches have their own rounding, sometimes up and sometimes down. A `double` has 53 binary digits; at $100000$ its steps are about $1.5 \times 10^{-11}$, far too small to matter here.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="180" y="16" font-size="11" text-anchor="middle" fill="#1f2a44">float grid above the old total (steps of 0.0078125)</text>
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="40" y1="50" x2="40" y2="70"/><line x1="120" y1="50" x2="120" y2="70"/>
    <line x1="200" y1="50" x2="200" y2="70"/><line x1="280" y1="50" x2="280" y2="70"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="40" y="86">11</text><text x="120" y="86">12</text><text x="200" y="86">13</text><text x="280" y="86">14</text>
  </g>
  <line x1="184" y1="30" x2="184" y2="54" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="184,57 179,47 189,47" fill="#1d6fd1"/>
  <text x="176" y="36" font-size="11" text-anchor="end" fill="#1d6fd1">exact +0.1 = 12.8</text>
  <circle cx="200" cy="60" r="6" fill="#b4232c"/>
  <text x="200" y="112" font-size="11" text-anchor="middle" fill="#b4232c">stored: 13 steps = 0.1015625</text>
</svg>
```

Near $100000$, the true sum lands $0.8$ of the way from step 12 to step 13, and rounds to 13.
:::

::: context eigen-static-assert How Eigen shouts at you
Eigen, the matrix library used across GNC code, leans on `static_assert` for exactly this kind of rule. Add a fixed-size 3-vector to a 4-vector, and the build stops with a message spelled as one long capitalized identifier, such as `YOU_MIXED_MATRICES_OF_DIFFERENT_SIZES`. Mix `float` and `double` matrices in one expression and you get `YOU_MIXED_DIFFERENT_NUMERIC_TYPES__YOU_NEED_TO_USE_THE_CAST_METHOD_OF_MATRIXBASE_TO_CAST_NUMERIC_TYPES_EXPLICITLY`. The capital letters are deliberate: in a long template error, they are easy to spot.
:::

::: context kalman-gain How much to trust the new reading
The gain $K$ is the Kalman filter's single most important number. If the estimate's uncertainty $P$ is large compared with the sensor's noise $R$, $K$ is close to $1$ and the filter jumps toward the new reading. If $P$ is small, $K$ is close to $0$ and the filter mostly keeps what it has. The Kalman filter module derives this properly, for many states at once, with matrices where this lesson has single numbers. There, the scalar type is almost always `double`, for the same accuracy reasons as the accumulator example.
:::
