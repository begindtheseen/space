---
id: l01-function-and-class-templates
title: Function and class templates
minutes: 24
covers:
  - "Function and class templates; argument deduction; explicit and partial specialization"
---

Think of a cookie cutter. You cut the shape once, out of metal. After that you can press it into gingerbread, sugar dough or chocolate dough, and every time you get the same star, made of whatever you pressed it into. The cutter is not a cookie. It is a recipe for the shape.

A **template** is a cookie cutter for code: a function or a class written once, with a hole where a type goes. When you use it with `double`, the compiler presses out a `double` version. When you use it with `int`, it presses out a separate `int` version. Each one is ordinary, fully typed C++, as fast as if you had typed it by hand.

You have been pressing cookies for a whole module already. `std::vector<double>` is the class template `std::vector` pressed with `double`. `std::array<int, 5>` is `std::array` pressed with `int` and `5`. `std::sort`, `std::find_if` and `std::transform` are function templates, which is why one `std::sort` works on a vector of doubles and on an array of telemetry records alike. Lesson 8 of the last module even wrote a home-made `my_count_if`. This module is about the cutter itself: how to make one, how the compiler decides what to press, and what happens when the general shape is wrong for one special dough.

In flight software the payoff is concrete. One filter, written once, runs on `float` on a small flight processor and on `double` in the ground simulation. One matrix class handles 3-by-3 rotations and 6-by-6 covariances. And, as the next lesson shows, the compiler can refuse to build a program that multiplies matrices of the wrong shapes.

## Function templates

Here is a function that clamps a value into a range, the kind of thing a control loop does to every command before it reaches an actuator:

```cpp
template <typename T>
T clamp_to(T x, T lo, T hi) {
    if (x < lo) return lo;
    if (x > hi) return hi;
    return x;
}
```

Read the first line aloud as "a template, for any type `T`". The angle brackets hold the **template parameter list** — the holes in the cutter. `typename T` says "`T` stands for some type, to be filled in later". (You will also see `class T` there. In this spot it means exactly the same thing; lesson 4 says where the two words differ.) After that line, `T` is used like any type name.

The whole thing is a **function template** — not a function, but a pattern for making functions. Nothing is compiled for it until you call it. When you do, the compiler fills in `T` and writes a real function. That act is **instantiation**, and the function it produces is an **instantiation** or **specialization** of the template: `clamp_to<double>`, read "clamp-to of double".

::: example Three functions from one template
This program clamps three different kinds of command.

```cpp
#include <cstdio>

template <typename T>
T clamp_to(T x, T lo, T hi) {
    if (x < lo) return lo;
    if (x > hi) return hi;
    return x;
}

int main() {
    double pitch_cmd = clamp_to(27.5, -20.0, 20.0);   // T = double
    int    throttle  = clamp_to(112, 40, 100);        // T = int
    float  gain      = clamp_to(0.3f, 0.0f, 1.0f);    // T = float
    std::printf("%.1f %d %.2f\n", pitch_cmd, throttle, gain);
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`, it prints:

```
20.0 100 0.30
```

Walk through it.

1. $27.5$ is above the $20.0$ limit, so the pitch command comes back as $20.0$ degrees.
2. $112$ percent throttle is above $100$, so it comes back as $100$.
3. $0.3$ is inside $[0, 1]$, so it comes back unchanged.

Now look at what the compiler made. Compile to an object file without optimization (at `-O2` these tiny functions get pasted into `main` and vanish), and list its symbols with `nm -C`, which prints the names in readable C++ form:

```
0000000000000000 W double clamp_to<double>(double, double, double)
0000000000000000 W float clamp_to<float>(float, float, float)
0000000000000000 W int clamp_to<int>(int, int, int)
```

Three separate functions, one per type used, with the type in each name. Nothing was made for `long` or `char`, because nothing asked for them. Sanity check: three calls with three different types gave three instantiations — one cookie per dough.
:::

The `W` in that listing marks a **[[weak symbol|weak-symbol]]**. It matters because the template's full body must be visible wherever it is called, so templates live in **[[header files|headers-why]]**, and every source file that calls `clamp_to<double>` makes its own copy. The linker keeps one and throws the rest away. That is allowed by the one-definition rule from the first module, and lesson 10 counts what it costs in build time.

::: key
A function template is a pattern, not a function. The compiler instantiates a separate, fully typed function for each distinct set of template arguments used, and only for those.
:::

## Argument deduction: how the compiler picks T

At the call `clamp_to(27.5, -20.0, 20.0)` you never wrote `double`. The compiler worked it out. That is **template argument deduction**: the compiler matches each argument's type against the matching parameter's pattern and solves for the template parameters.

Here each parameter's pattern is plain `T`. The first argument, `27.5`, is a `double`, so it says `T = double`. The second says `T = double`. The third says the same. Every vote agrees, so `T` is `double`.

The rule that trips everyone up: **deduction does not convert**. Ordinary function calls happily turn an `int` into a `double`. Deduction does not. It only looks for a `T` that makes each parameter's type match its argument's type, one argument at a time, and then demands that all the answers agree.

So watch this call, with integer limits:

```cpp
double a = clamp_to(27.5, -20, 20);
```

The first argument votes `T = double`. The other two vote `T = int`. There is no single `T`, and g++ says so:

```
error: no matching function for call to 'clamp_to(double, int, int)'
note: candidate: 'template<class T> T clamp_to(T, T, T)'
note:   template argument deduction/substitution failed:
note:   deduced conflicting types for parameter 'T' ('double' and 'int')
```

Read the last line: *deduced conflicting types*. That is the whole story. The [[standard library's own max|std-max]] fails in exactly the same way on `std::max(1, 2.5)`.

There are three honest fixes:

- **Say `T` yourself.** `clamp_to<double>(27.5, -20, 20)` — read "clamp-to of double" — skips deduction. With `T` fixed, the parameters are plain `double`, and the ordinary conversion from `int` happens as usual.
- **Make the arguments agree.** Write `-20.0` and `20.0`. Often this is the real fix, because the mixed types were an accident.
- **Allow two types.** Write `template <typename T, typename U>` and let each vote separately. Do this only if mixing really is intended, because now you must decide what type the result is.

A few more rules round out deduction:

- A template parameter that appears in no function parameter cannot be deduced. If `T` is only the return type, as in `template <typename T> T read_register(int addr)`, you must write `read_register<std::uint16_t>(0x40)`.
- Explicit arguments fill from the left. With `template <typename To, typename From> To convert(From x)`, the call `convert<float>(2.5)` sets `To = float` and still deduces `From = double`.
- For a parameter written `T` (by value), top-level `const` and references on the argument are dropped, and an array argument becomes a pointer. Pass a `const double` variable, and `T` is plain `double`.

::: warning The conversion you expected will not happen
If you are used to `sqrt(2)` working because `2` converts to `2.0`, the template error on `clamp_to(x, 0, 1)` with a `double` `x` feels unfair. It is not a bug in your template. Deduction happens before any conversion is even considered. Read the "deduced conflicting types" line, then pick one of the three fixes on purpose.
:::

::: key
Template argument deduction infers each template parameter from the argument types, with no conversions. If two arguments deduce different types for the same parameter (an `int` and a `double` for one `T`), deduction fails. Fix it with an explicit argument (`f<double>(…)`), matching arguments, or separate parameters.
:::

## Class templates

A class can have holes too. Here is a three-element vector for velocities and positions:

```cpp
template <typename T>
struct Vec3 {
    T x, y, z;

    T dot(const Vec3& o) const { return x * o.x + y * o.y + z * o.z; }
    T norm() const { return std::sqrt(dot(*this)); }
};
```

`Vec3` alone is a **class template**: a pattern for classes. `Vec3<double>` is a real class, made by filling `T` with `double`, and `Vec3<float>` is a different real class. They are as unrelated as `int` and `std::string`: you cannot pass a `Vec3<float>` where a `Vec3<double>` is wanted.

Inside the template, the bare name `Vec3` means "this same instantiation", which is why `dot` can take a `const Vec3&` without repeating `<T>`.

For a long time class templates could not deduce anything: you always wrote `Vec3<double>`. C++17 added **[[class template argument deduction|ctad]]**, so `std::vector v{1.0, 2.0}` makes a `std::vector<double>`. C++20 extended it to simple structs like `Vec3`, which have no constructor of their own:

```cpp
#include <cmath>
#include <cstdio>

// Vec3 as above

int main() {
    Vec3<double> v{3.0, 4.0, 12.0};     // T written out
    Vec3<float>  w{3.0f, 4.0f, 12.0f};
    Vec3 u{1.0, 2.0, 2.0};              // C++20: T deduced as double from the braces

    std::printf("%.1f %.1f %.1f\n", v.norm(), static_cast<double>(w.norm()), u.norm());
    std::printf("sizes: %zu %zu\n", sizeof(v), sizeof(w));
}
```

It prints:

```
13.0 13.0 3.0
sizes: 24 12
```

$\sqrt{3^2 + 4^2 + 12^2} = \sqrt{169} = 13$ and $\sqrt{1 + 4 + 4} = 3$, as the output says. A `Vec3<double>` holds three 8-byte doubles, 24 bytes; a `Vec3<float>` holds three 4-byte floats, 12 bytes. Same source, two layouts, no overhead in either.

One more property saves real work. A member function of a class template is instantiated only if it is used. So `Vec3<std::string>` holding the names `"roll"`, `"pitch"`, `"yaw"` compiles fine: `norm()` would be nonsense for strings, but nobody called it, so it was never written out. Calling it would be the error, at the line that calls it.

::: key
A class template is a pattern for classes; each set of arguments (`Vec3<float>`, `Vec3<double>`) is a separate, unrelated type. Member functions are instantiated only when used. Since C++17 the arguments can often be deduced from the initializer.
:::

## Explicit specialization: one special case

Sometimes the general pattern is wrong for one particular type. Back to the kitchen: the star cutter works for every dough except the crumbly one, so for that dough you keep a separate cutter.

In C++ the separate cutter is an **explicit specialization**, also called a **full specialization**: a complete replacement definition of the template for one exact set of arguments. It starts with `template <>` — read "template with nothing left open" — because every parameter has been fixed.

Picture a telemetry encoder that must decide how each field type goes on the wire. For most types, sending the raw bytes is fine. A `bool` is wasteful as a whole byte, so flags get packed into bits. A pointer should never be sent at all, because an address in the flight computer means nothing on the ground.

::: example Choosing a wire format by type
```cpp
#include <cstdint>
#include <cstdio>

// Primary template: the general case, for any T.
template <typename T>
struct Wire {
    static constexpr const char* how = "raw bytes, sizeof(T)";
    static constexpr std::size_t bytes = sizeof(T);
};

// Explicit (full) specialisation: every parameter fixed.
template <>
struct Wire<bool> {
    static constexpr const char* how = "one bit in a flags word";
    static constexpr std::size_t bytes = 0;
};

// Partial specialisation: still a template, but only for pointers.
template <typename T>
struct Wire<T*> {
    static constexpr const char* how = "never sent: an address means nothing on the ground";
    static constexpr std::size_t bytes = 0;
};

template <typename T>
void show(const char* name) {
    std::printf("%-12s %zu  %s\n", name, Wire<T>::bytes, Wire<T>::how);
}

int main() {
    show<std::int16_t>("int16_t");
    show<double>("double");
    show<bool>("bool");
    show<double*>("double*");
    show<const char*>("const char*");
}
```

It prints:

```
int16_t      2  raw bytes, sizeof(T)
double       8  raw bytes, sizeof(T)
bool         0  one bit in a flags word
double*      0  never sent: an address means nothing on the ground
const char*  0  never sent: an address means nothing on the ground
```

Walk through how the compiler chose each line.

1. `Wire<std::int16_t>` and `Wire<double>`: no specialization matches, so the **primary template** — the general one — is used, with `sizeof(T)` giving 2 and 8.
2. `Wire<bool>` exactly matches the full specialization, so that definition replaces the primary entirely.
3. `Wire<double*>` matches the pointer pattern `T*` with `T = double`. Why it wins is the next section's subject.
4. `Wire<const char*>` also matches `T*`, this time with `T = const char`.

Sanity check: the only lines that did not come from the primary are exactly the `bool` line and the two pointer lines.
:::

A specialisation must be declared after the primary template, and before the first use that would need it. Its body can be completely different from the primary's: different members, different sizes, anything. The standard library does this in [[a famous case|vector-bool]].

## Partial specialization: a special family

The `Wire<T*>` definition above is neither the general case nor one exact type. It is a **partial specialization**: a definition for a whole family of arguments that match a pattern. It still has open parameters (`template <typename T>`), and the pattern after the name (`Wire<T*>`) says which arguments it takes.

When several definitions match, the compiler picks the **most specialized** one: the one whose pattern accepts the fewest types. Every pointer is "some type", but not every type is a pointer, so `T*` is more specialized than `T` and wins for `double*`. If no pattern is more specialized than every other, the use is ambiguous, and it is an error.

Now the rule to carry away: **only class templates and variable templates can be partially specialized. Function templates cannot.** Try it and g++ tells you plainly:

```cpp
template <typename T>
void describe(T) { std::puts("any value"); }

template <typename T>
void describe<T*>(T*) { std::puts("a pointer"); }   // not allowed
```

```
error: non-class, non-variable partial specialization 'describe<T*>' is not allowed
```

For functions, you do something else that already works: **overload**. Drop the `<T*>` after the name, and the second `describe` becomes a separate function template that happens to share the name. Overload resolution, which you met in the first module, then picks the best candidate, and among templates that fit equally well it prefers the more specialized one. You get the effect you wanted by a different mechanism.

::: example Overloads instead of partial specialization
```cpp
#include <cstdio>

template <typename T>
void describe(T) { std::puts("any value"); }         // (1) primary

template <typename T>
void describe(T*) { std::puts("a pointer"); }        // (2) an overload, not a specialisation

void describe(bool) { std::puts("a flag"); }         // (3) a plain function

int main() {
    int x = 0;
    describe(3.5);    // only (1) fits
    describe(&x);     // (1) with T = int* and (2) with T = int both fit; (2) is more specialised
    describe(true);   // (3) and (1) with T = bool tie; the non-template wins
}
```

It prints:

```
any value
a pointer
a flag
```

Step by step:

1. `describe(3.5)`: a `double` is not a pointer, so only (1) can deduce, with `T = double`.
2. `describe(&x)`: `&x` is an `int*`. Template (1) fits with `T = int*`, template (2) fits with `T = int`. Both are exact matches, so the tie-breaker is "more specialized", and (2) wins.
3. `describe(true)`: (1) fits with `T = bool`, and the plain function (3) fits exactly. When a template and a non-template are equally good, the non-template wins.

Sanity check: each call printed the most specific description that applies to it.
:::

You may also write a full specialization of a function template, with `template <>`. It is legal but rarely a good idea, because a specialization does not take part in overload resolution. The compiler first picks among the overloaded *primary* templates, and only then looks for a specialization of the winner. Mixing the two produces [[results that surprise experts|dimov-abrahams]]. Overloading is the tool for functions, and later lessons add two more: `if constexpr` (lesson 7) and concepts (lesson 6).

::: key
Class templates and variable templates can be partially specialized; function templates cannot — you overload instead. That is why generic function customization is usually done with overloads, tag types or `if constexpr`.
:::

::: warning Specialise the primary you meant
A function-template specialization attaches to whichever primary template is visible and matches when it is declared. Add an overload later, and your specialization may end up attached to a primary that overload resolution never chooses. If you want a special case for a function, write an overload (or a plain function) and let overload resolution see it.
:::

::: note Why functions got overloading instead
Functions already had a way to choose among several definitions by argument type: overloading, with its rules for ranking candidates. When templates arrived, overloaded function templates plugged into the same machinery, including the "more specialized" tie-breaker. Adding partial specialization for functions as well would have given two competing ways to choose, with rules to settle which one applies first. Classes have no overloading at all — you cannot declare two class templates named `Wire` — so partial specialization was the only way to give them a special family. That same class mechanism is what the [[type traits of lesson 5|traits-bridge]] are built on.
:::

## Check yourself

::: check
Given `template <typename T> T lerp(T a, T b, T t)`, which of these calls compile, and what is `T` for each: `lerp(1.0, 3.0, 0.5)`, `lerp(1, 3, 0.5)`, `lerp<double>(1, 3, 0.5)`, `lerp(1.0f, 3.0f, 0.5f)`?
:::

::: answer
`lerp(1.0, 3.0, 0.5)`: all three arguments are `double`, so `T = double`. It compiles.

`lerp(1, 3, 0.5)`: the first two vote `T = int`, the third votes `T = double`. Deduction does not convert, so the votes conflict and there is no matching function.

`lerp<double>(1, 3, 0.5)`: `T` is given, so no deduction happens. The parameters are plain `double`, and the `int` arguments convert as in any ordinary call. It compiles.

`lerp(1.0f, 3.0f, 0.5f)`: all `float`, so `T = float`. It compiles, and it is a different instantiation from the `double` one.
:::

::: check
A program calls `clamp_to` with `double` arguments in four places and with `int` arguments in one place. How many instantiations of `clamp_to` does the compiler make, and why is `Vec3<float>` not usable where a `Vec3<double>` is expected?
:::

::: answer
Two: `clamp_to<double>` and `clamp_to<int>`. Instantiation happens once per distinct set of template arguments, not once per call; all four `double` calls use the same function.

`Vec3<float>` and `Vec3<double>` are two separate classes stamped from one pattern. The template relates them in the source code, but to the type system they are as unrelated as `int` and `std::string`, so there is no automatic conversion between them. You would have to write one, for example a converting constructor.
:::

::: check
A library has `template <typename T> struct Limits` with a general definition. You want a special definition for every `std::vector<T>`, whatever `T` is. Write the first two lines of it, and say which kind of specialization it is.
:::

::: answer
```cpp
template <typename T>
struct Limits<std::vector<T>> { /* ... */ };
```

It is a partial specialization: it still has an open parameter `T`, and the pattern `std::vector<T>` says it applies to the whole family of vectors. A full specialization would fix everything, as in `template <> struct Limits<std::vector<double>>`, and would apply to that one type only. This works because `Limits` is a class template.
:::

::: check
A teammate writes `template <typename T> void send(const T&)` and then, for arrays of any length, tries `template <typename T, std::size_t N> void send<T[N]>(const T (&)[N])`. What does the compiler say, and what should they write instead?
:::

::: answer
The compiler rejects it, because `send<T[N]>` is a partial specialization of a function template, and only class and variable templates may be partially specialized. g++ reports a "non-class, non-variable partial specialization ... is not allowed" error.

They should drop the `<T[N]>` after the name and write an overload:

```cpp
template <typename T, std::size_t N>
void send(const T (&arr)[N]);
```

Read `const T (&)[N]` as "a reference to a const array of `N` elements of type `T`"; both `T` and `N` are deduced from the array passed. For an array argument, both templates can match, and overload resolution prefers the more specialized one — the array overload. Called with `int a[3]`, it picks the array version; called with `5`, the general one.
:::

::: check
Why does `Vec3<std::string>` compile as long as nobody calls `norm()`, and what happens the moment someone does?
:::

::: answer
Member functions of a class template are instantiated only when they are used. Declaring `Vec3<std::string>` instantiates the class — its three `std::string` members — but not the bodies of `dot` and `norm`.

When someone calls `norm()`, the compiler instantiates it, and then `dot`, whose body multiplies strings. There is no `*` for `std::string`, and no `std::sqrt` of one either, so the build fails at that point. g++ reports "no match for 'operator*'" inside `dot` and "no matching function for call to 'sqrt'" inside `norm`, each with a "required from here" note that points back at the calling line.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| `template <typename T>` | "for any type `T`" | `class T` means the same in this position |
| function template | a pattern for functions | one instantiation per distinct argument set, only for those used |
| class template | a pattern for classes | `Vec3<float>` and `Vec3<double>` are unrelated types; members instantiated only when used |
| argument deduction | the compiler solves for `T` from the arguments | no conversions; `f(1, 2.5)` with one `T` fails |
| fixes for conflicts | explicit `f<double>(…)`, matching arguments, two parameters | explicit arguments fill from the left |
| class template argument deduction | `std::vector v{1.0, 2.0}` | C++17 for constructors, C++20 for aggregates |
| explicit (full) specialization | `template <> struct X<bool>` | replaces the primary for one exact argument set |
| partial specialization | `template <typename T> struct X<T*>` | class and variable templates only; the most specialized match wins |
| functions | cannot be partially specialized | overload instead; overloads beat function specializations |

The next lesson puts values, not only types, into the angle brackets. `std::array<int, 5>` already did it; with a `Matrix<double, 3, 3>` whose sizes are part of its type, a wrong-shaped multiply stops the build instead of reaching flight.

::: context weak-symbol A name the linker may merge
Every function the compiler emits gets a name in the object file, and `nm` lists them. The letter beside each name says what kind it is. `T` is an ordinary function, which must be defined exactly once in the program. `W` is a **weak** symbol: several object files may each carry one, and the linker keeps one and discards the rest instead of reporting a multiple-definition error. Template instantiations and inline functions are emitted this way on Linux, which is how the one-definition rule is honored in practice.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="12" width="100" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="33" font-size="12" text-anchor="middle" fill="#1f2a44">nav.o</text>
  <rect x="130" y="12" width="100" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="33" font-size="12" text-anchor="middle" fill="#1f2a44">guidance.o</text>
  <rect x="250" y="12" width="100" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="33" font-size="12" text-anchor="middle" fill="#1f2a44">control.o</text>
  <text x="60" y="62" font-size="11" text-anchor="middle" fill="#1f2a44">W clamp_to&lt;double&gt;</text>
  <text x="180" y="62" font-size="11" text-anchor="middle" fill="#1f2a44">W clamp_to&lt;double&gt;</text>
  <text x="300" y="62" font-size="11" text-anchor="middle" fill="#1f2a44">W clamp_to&lt;double&gt;</text>
  <line x1="60" y1="70" x2="170" y2="112" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="70" x2="180" y2="112" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="300" y1="70" x2="190" y2="112" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="100" y="112" width="160" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="133" font-size="12" text-anchor="middle" fill="#1f2a44">flight_sw: one copy kept</text>
  <text x="180" y="163" font-size="11" text-anchor="middle" fill="#6c7a93">the linker discards the duplicates</text>
</svg>
```
:::

::: context headers-why Why templates live in headers
To instantiate `clamp_to<double>`, the compiler needs the template's body right there, in the file it is compiling. A normal function can be declared in a header and defined once in a `.cpp` file, because the caller only needs its signature and the linker finds the body later. A template's body is the recipe itself, so it has to travel with every file that uses it. That is why `<vector>` and `<algorithm>` are full of code, not only declarations. Lesson 10 shows the cost of this in build time, and `extern template`, the tool that recovers it.
:::

::: context std-max The standard library hits the same wall
`std::max` is declared roughly as `template <class T> const T& max(const T& a, const T& b)`. One `T`, two arguments. So `std::max(1, 2.5)` fails with the same "deduced conflicting types" note, and `std::max(n, 0u)` fails when `n` is a signed `int`. The standard writers could have allowed mixed types, but then they would have had to choose the result type for you, silently. Writing `std::max<double>(1, 2.5)` makes you choose it out loud.
:::

::: context ctad The long name, shortened
Class template argument deduction is usually called **CTAD**. Before C++17, library writers supplied helper functions such as `std::make_pair` and `std::make_tuple` only because functions could deduce and classes could not; `std::make_pair(1, 2.5)` existed to spare you writing `std::pair<int, double>`. CTAD lets `std::pair p{1, 2.5}` do the same directly. It also works for `std::array`: `std::array a{1.0, 2.0, 3.0}` deduces `std::array<double, 3>`, counting the elements for you.
:::

::: context vector-bool The standard's most argued-over specialization
`std::vector<bool>` is a partial specialization of `std::vector` (the allocator parameter stays open). Instead of one byte per element it packs eight flags into each byte. That saves memory, but it breaks the promise every other vector keeps: `v[3]` is not a real `bool&`, because a single bit has no address. It returns a small proxy object instead, so `bool* p = &v[3];` does not compile. Many engineers use `std::vector<std::uint8_t>` or `std::bitset` for flags because of this.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">vector&lt;uint8_t&gt;: one byte per flag</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="10" y="26" width="40" height="24"/><rect x="50" y="26" width="40" height="24"/>
    <rect x="90" y="26" width="40" height="24"/><rect x="130" y="26" width="40" height="24"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="30" y="43">1</text><text x="70" y="43">0</text><text x="110" y="43">1</text><text x="150" y="43">1</text>
  </g>
  <text x="10" y="76" font-size="12" fill="#1f2a44">vector&lt;bool&gt;: eight flags in one byte</text>
  <rect x="10" y="84" width="160" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1">
    <line x1="30" y1="84" x2="30" y2="108"/><line x1="50" y1="84" x2="50" y2="108"/><line x1="70" y1="84" x2="70" y2="108"/>
    <line x1="90" y1="84" x2="90" y2="108"/><line x1="110" y1="84" x2="110" y2="108"/><line x1="130" y1="84" x2="130" y2="108"/>
    <line x1="150" y1="84" x2="150" y2="108"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="20" y="100">1</text><text x="40" y="100">0</text><text x="60" y="100">1</text><text x="80" y="100">1</text>
    <text x="100" y="100">0</text><text x="120" y="100">0</text><text x="140" y="100">0</text><text x="160" y="100">0</text>
  </g>
  <text x="270" y="100" font-size="11" text-anchor="middle" fill="#b4232c">a bit has no address</text>
</svg>
```
:::

::: context dimov-abrahams A puzzle that settled the advice
Herb Sutter's article "Why Not Specialize Function Templates?" made this example famous. Declare `f(T)`, then `f(T*)`, then `template <> void f<int>(int*)`: calling `f(&x)` with an `int x` runs the specialization. Now declare `g(U)`, then `template <> void g<int*>(int*)`, then `g(U*)`: calling `g(&x)` runs the general `g(U*)`, not the specialization. The only difference is the order. In the second case the specialization attached to `g(U)`, and overload resolution then chose `g(U*)`, a primary that has no specialization. We compiled both with g++ 13 and got exactly that. The lesson: specializations do not overload.
:::

::: context traits-bridge Where partial specialization earns its keep
Lesson 5's type traits are small class templates that answer questions about types at compile time. A question such as "is this a pointer?" is typically answered by a primary template that says `false` and a partial specialization for `T*` that says `true` — the same shape as `Wire<T*>`. Much of the compile-time machinery in the standard library is built from this one move.
:::
