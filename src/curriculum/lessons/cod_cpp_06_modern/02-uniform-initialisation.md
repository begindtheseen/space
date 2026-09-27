---
id: l02-uniform-initialisation
title: Brace initialisation and the initializer_list trap
minutes: 22
covers:
  - Uniform initialisation and the initializer_list gotcha
---

Picture a universal remote control. You had three remotes, one for the TV, one for the speaker and one for the streaming box, each with its own buttons. The universal remote promises one set of buttons for all of them. It mostly works. Then one day you press "3" to pick a channel on one particular TV, and it sets the volume to 3 instead, because that TV's maker gave the button a special meaning.

C++11's **brace initialisation** is that universal remote. Before it, C++ had several different ways to give an object its first value, and each one worked in some places and not others. Braces, `{ }`, were meant to work everywhere, for every type. They almost do. They also add a safety check the old forms lacked. And there is one button with a special meaning: when a class has a constructor that takes a list, braces press that one first.

Last lesson toured C++11 as a whole. This lesson takes its most surprising feature on its own. You met braces in the basics module (lesson 6) and in the RAII module (lesson 1). Here we pull the rules together, including the one trap every C++ programmer falls into at least once.

## One syntax for everything

C++98 had a separate spelling for almost every situation:

```cpp
int a = 5;                 // copy form, with =
int b(5);                  // direct form, with parentheses
int c[3] = {1, 2, 3};      // braces, but only for arrays and plain structs
std::vector<int> v;        // no way to give a vector its elements here
v.push_back(1);            // ... so you added them one at a time
```

C++11 lets you use braces for all of them: `int a{5};`, `std::vector<int> v{1, 2, 3};`, a struct `Vec3 p{0.0, 0.0, 9.81};`, a temporary `draw(Vec3{1.0, 2.0, 3.0})`, a returned value `return {x, y, z};`, a heap object `new Vec3{...}`, and a member in a constructor's initialiser list, `x_{x}`. The official name for this is **[[list-initialisation|list-init-name]]**; "uniform initialisation" was the nickname it launched with.

There are two brace forms, and the difference is small but real:

- `T x{args};` is **direct-list-initialisation**. It may call any constructor, including one marked `explicit`.
- `T x = {args};` is **copy-list-initialisation**. It may not call an `explicit` constructor, the same way `T x = value;` may not (RAII module, lesson 1).

Empty braces are special and useful. `double x{};` sets `x` to zero, and `Vec3 p{};` sets every member to zero. This is called **value-initialisation**: for a class with a constructor you wrote, it calls the default constructor; for everything else, it zero-fills. One pair of braces removes the whole class of "read an uninitialised variable" bugs.

## Braces refuse narrowing

A **[[narrowing conversion|narrowing-range]]** is one that can lose information: a `double` into an `int` (the fraction is dropped), a `double` into a `float` (precision is lost), an `int` into a `std::uint8_t` (anything above 255 wraps). The old `=` and `()` forms accept all of these silently. Braces do not. The standard says a narrowing conversion inside braces makes the program **ill-formed**, meaning it is not valid C++ and the compiler must say so.

The precise rule has one exception that matters in practice. If the value is a **constant** the compiler can see, and it fits exactly, braces allow it. So `std::uint8_t mask{200};` is fine, because 200 fits in 0 to 255. `std::uint8_t mask{300};` is rejected, because it does not. (For `double` to `float`, a constant need only be in range, so `float f{0.1};` is allowed even though $0.1$ is not exactly representable in either type.)

::: example What each compiler says
```cpp
#include <cstdint>
int main() {
    double thrust_kn = 845.7;
    int a = thrust_kn;             // old style: silently 845
    int b(thrust_kn);              // parentheses: silently 845
    int c{thrust_kn};              // braces: narrowing, ill-formed
    std::uint8_t d{300};           // constant that does not fit
    std::uint8_t e{200};           // constant that fits: fine
    (void)a; (void)b; (void)c; (void)d; (void)e;
}
```

With `g++ -std=c++20 -Wall -Wextra`, g++ 13 reports:

```text
narrow.cpp:6:11: warning: narrowing conversion of 'thrust_kn' from 'double' to 'int' [-Wnarrowing]
narrow.cpp:7:20: error: narrowing conversion of '300' from 'int' to 'uint8_t' {aka 'unsigned char'} [-Wnarrowing]
```

clang++ 18, with the same flags, makes both of them errors:

```text
narrow.cpp:6:11: error: type 'double' cannot be narrowed to 'int' in initializer list [-Wc++11-narrowing]
narrow.cpp:7:20: error: constant expression evaluates to 300 which cannot be narrowed to type 'std::uint8_t' (aka 'unsigned char') [-Wc++11-narrowing]
```

Read it line by line.

1. Lines 4 and 5, the old forms, produce nothing at all under `-Wall -Wextra`. Both store 845 and throw away $0.7\,\mathrm{kN}$. Only `-Wconversion` would flag them.
2. Line 6 narrows a variable. clang stops. g++ 13 only warns, because it chose to keep compiling old code that did this; `-Werror=narrowing` or `-pedantic-errors` turns it into an error, and flight builds usually set one of them.
3. Line 7 narrows a constant that does not fit ($300 - 256 = 44$ is what would be stored). Both compilers refuse.
4. Line 8 is silent: 200 is a constant that fits.

Sanity check: the one line both compilers accept without a word is the one where no information is lost.
:::

::: warning g++ warns where the standard says "error"
If your team builds with g++ and without `-Werror`, a narrowing from a variable inside braces is only a warning, and warnings scroll past. Add `-Werror=narrowing` (or `-pedantic-errors`) to the flight build so braces give you the protection the standard promises.
:::

## The most vexing parse, fixed

C++ inherited a rule from C: if a line *can* be read as a declaration, it *is* one. The basics module showed the simple case, `double x();`, which declares a function, not a variable. Here is the version that bites experienced programmers:

```cpp
#include <cstdio>

struct Clock {
    long ticks() const { return 42; }
};

struct Timer {
    explicit Timer(Clock c) : start(c.ticks()) {}
    long start;
};

int main() {
    Timer t(Clock());      // intended: a Timer built from a fresh Clock
    std::printf("%ld\n", t.start);
}
```

The line `Timer t(Clock());` looks like "make a `Timer` named `t` from a new `Clock`". C++ reads it as the declaration of a **[[function named t|vexing-tree]]** that returns a `Timer` and takes one parameter: a function with no arguments that returns a `Clock`. g++ 13 says so:

```text
warning: parentheses were disambiguated as a function declaration [-Wvexing-parse]
note: replace parentheses with braces to declare a variable
error: request for member 'start' in 't', which is of non-class type 'Timer(Clock (*)())'
```

The fix is in the compiler's own note. `Timer t{Clock{}};` cannot be a function declaration, because a function's parameter list is never written in braces. With that one change the program compiles and prints `42`.

::: key Braces
`{}` works for every kind of initialisation, refuses narrowing conversions (a constant that fits is allowed), value-initialises with empty braces, and can never be parsed as a function declaration.
:::

## The initializer_list gotcha

Now the special button.

C++11 added a small library type, **`std::initializer_list<T>`**, read "initializer list of T". When you write `{1, 2, 3}` where a list of `int` is expected, the compiler makes a hidden array holding 1, 2 and 3, and hands over a lightweight **[[view of that array|init-list-backing]]**. A class can have a constructor that takes one. That is how `std::vector<int> v{1, 2, 3};` gets three elements.

The trouble is that `std::vector` also has older constructors, and one of them is `vector(count, value)`: make `count` copies of `value`. So what does `{10, 1}` mean — the list "10, 1", or "ten ones"?

The rule: **when you use braces and the class has an initializer_list constructor, the compiler tries that constructor first, and uses it if it can be made to work at all.** Only if no initializer_list constructor is viable does it look at the others. Parentheses never consider it.

::: example Parentheses against braces, run for real
```cpp
#include <cstdio>
#include <string>
#include <vector>

template <typename T>
void show(const char* label, const std::vector<T>& v) {
    std::printf("%-26s size %zu:", label, v.size());
    for (const auto& x : v) std::printf(" %d", static_cast<int>(x));
    std::printf("\n");
}

int main() {
    std::vector<int> a(10, 1);   // parentheses: count, value
    std::vector<int> b{10, 1};   // braces: the list {10, 1}
    std::vector<int> c(10);      // ten zeros
    std::vector<int> d{10};      // one element, 10
    std::vector<int> e{};        // empty: default constructor

    show("std::vector<int> a(10, 1)", a);
    show("std::vector<int> b{10, 1}", b);
    show("std::vector<int> c(10)", c);
    show("std::vector<int> d{10}", d);
    show("std::vector<int> e{}", e);

    std::vector<std::string> s{3};   // no string can be made from 3 ...
    std::printf("std::vector<std::string> s{3} size %zu\n", s.size());
}
```

With `g++ -std=c++20 -Wall -Wextra -O2` it prints:

```text
std::vector<int> a(10, 1)  size 10: 1 1 1 1 1 1 1 1 1 1
std::vector<int> b{10, 1}  size 2: 10 1
std::vector<int> c(10)     size 10: 0 0 0 0 0 0 0 0 0 0
std::vector<int> d{10}     size 1: 10
std::vector<int> e{}       size 0:
std::vector<std::string> s{3} size 3
```

Go through the six lines.

1. `a(10, 1)`: parentheses never look at the list constructor, so this is `vector(count, value)`: ten ones.
2. `b{10, 1}`: braces try the list constructor first. `{10, 1}` is a perfectly good list of `int`, so it wins: two elements, 10 and 1.
3. `c(10)`: `vector(count)`, ten value-initialised `int`s, all zero.
4. `d{10}`: a list of one `int`. One element, 10. This is the line that turns "reserve room for ten samples" into a one-sample vector.
5. `e{}`: empty braces are the one exception. They mean "default constructor", not "empty list". (Both give an empty vector here, so you only see the difference in your own classes.)
6. `s{3}`: a `std::string` cannot be made from the number 3, so a list of strings is not viable. Only then does the compiler fall back to the other constructors, and `vector(count)` makes three empty strings.

Sanity check: every braces line with `int`s produced exactly as many elements as numbers inside the braces, and every parentheses line produced as many as the first number said.
:::

::: key The initializer_list gotcha
`std::vector<int> v{3, 0}` makes a two-element vector, while `std::vector<int> v(3, 0)` makes three zeros. Braces prefer an initializer_list constructor whenever one is viable, which surprises everyone at least once. Likewise `v{10, 1}` holds 10 and 1; `v(10, 1)` holds ten ones.
:::

### It can win even when it has to fail

"Whenever one is viable" is stronger than it sounds. The compiler picks the initializer_list constructor *before* checking for narrowing, and narrowing then makes the program ill-formed. Here is a class with both kinds of constructor:

```cpp
class Window {
public:
    Window(int samples, double gain);            // count and gain
    Window(std::initializer_list<int> taps);     // a list of filter taps
    // ...
};

Window a(8, 2.0);   // (int, double): 8 samples, gain 2.0
Window b{8, 2};     // both ints: the list constructor wins, two taps
Window c{8, 2.5};   // the list constructor is still chosen, then 2.5 narrows
```

Run with a `print` member (the full program is short), `a` reports `n=8 gain=2.0 from_list=0` and `b` reports `n=2 gain=1.0 from_list=1`. The line for `c` does not compile: g++ says `narrowing conversion of '2.5e+0' from 'double' to 'int'`. The compiler did not quietly fall back to `Window(int, double)`, which would have worked. It chose the list, then refused the list.

::: warning Rules for your own classes
Adding an initializer_list constructor to a class that already has other constructors changes the meaning of every existing brace call site that happens to fit a list. Add one only when "a list of elements" is the class's main job, as with containers. At call sites, use parentheses when you mean a count or a size — `std::vector<double> history(1000);` — and braces when you mean the elements themselves.
:::

## auto and braces

`auto` and braces met awkwardly in C++11, and the rules changed later. Today they are:

```cpp
auto a = 1;       // int
auto b{1};        // int (since the C++17 rule; see the text)
auto c = {1};     // std::initializer_list<int>
auto d = {1, 2};  // std::initializer_list<int>
// auto e{1, 2};  // error: direct-list-init of auto needs exactly one element
```

A small program checking each type with `std::is_same_v` confirms `a` and `b` are `int`, and `c` and `d` are `std::initializer_list<int>` (with `d.size()` equal to 2). Uncomment `e` and g++ says `direct-list-initialization of 'auto' requires exactly one element`.

The line to watch is `b`. As C++11 was first published, `auto b{1};` made `b` a `std::initializer_list<int>`, which nobody wanted. A **[[later fix|auto-brace-history]]** made it plain `int`. It is written into C++17, but g++ and clang apply it in every mode, so `-std=c++11` gives `int` too on today's compilers. The `=` form, `auto c = {1};`, still gives an initializer_list, and always will.

::: warning `auto` with `= {...}` is a list
`auto limit = {5.0};` does not make a `double`. It makes a `std::initializer_list<double>`, and `limit * 2.0` will not compile. With `auto`, write `auto limit = 5.0;` or `auto limit{5.0};`, never `= { }`.
:::

## Aggregate initialisation

An **aggregate** is a plain bundle of data: an array, or a class with no constructors you declared, no private or protected data members, no virtual functions and no virtual base classes. Aggregates do not need a constructor to be filled with braces. The values go into the members in declaration order, and the rules for **[[what counts as an aggregate|aggregate-history]]** have loosened with each standard.

Three rules do most of the work:

- **Missing members are value-initialised.** `Gains g{1.5};` sets the first member to 1.5 and the rest to zero (or to their default member initialiser, if they have one).
- **Nested braces fill nested aggregates.** A `Vec3` inside a struct takes its own `{x, y, z}`. You may leave the inner braces out — **brace elision** — which is why `std::array<int, 4> counts{1, 2};` works: `std::array` is a struct holding a C array, and the one pair of braces reaches through it.
- **Since C++14, an aggregate may have default member initialisers**, like `std::uint8_t status = 0xFF;`. In C++11 that line stopped the struct being an aggregate at all.

::: example Filling an IMU sample
```cpp
#include <array>
#include <cstdint>
#include <cstdio>

struct Vec3 { double x, y, z; };

struct ImuSample {
    std::uint32_t seq;
    Vec3 gyro_rad_s;
    Vec3 accel_m_s2;
    std::uint8_t status = 0xFF;   // default member initialiser: allowed in an aggregate since C++14
};

int main() {
    ImuSample full{7, {0.01, -0.02, 0.0}, {0.0, 0.0, 9.81}, 0x00};
    ImuSample partial{8, {0.01, -0.02}};    // the rest: zero, and status gets its default
    ImuSample blank{};                       // everything zero, status 0xFF

    std::array<int, 4> counts{1, 2};         // 1 2 0 0

    auto print = [](const char* name, const ImuSample& s) {
        std::printf("%-7s seq=%u gyro=(%.2f, %.2f, %.2f) accel=(%.2f, %.2f, %.2f) status=0x%02X\n",
                    name, static_cast<unsigned>(s.seq), s.gyro_rad_s.x, s.gyro_rad_s.y, s.gyro_rad_s.z,
                    s.accel_m_s2.x, s.accel_m_s2.y, s.accel_m_s2.z, static_cast<unsigned>(s.status));
    };
    print("full", full);
    print("partial", partial);
    print("blank", blank);
    std::printf("counts: %d %d %d %d\n", counts[0], counts[1], counts[2], counts[3]);
}
```

With `g++ -std=c++20 -Wall -Wextra -O2` it prints:

```text
full    seq=7 gyro=(0.01, -0.02, 0.00) accel=(0.00, 0.00, 9.81) status=0x00
partial seq=8 gyro=(0.01, -0.02, 0.00) accel=(0.00, 0.00, 0.00) status=0xFF
blank   seq=0 gyro=(0.00, 0.00, 0.00) accel=(0.00, 0.00, 0.00) status=0xFF
counts: 1 2 0 0
```

Step by step:

1. `full` names every member in declaration order: `seq`, then the gyro `Vec3` in its own braces, then the accelerometer, then `status`.
2. `partial` stops early. The gyro's missing `z` becomes $0.0$, the whole accelerometer becomes zeros, and `status` takes its default, `0xFF`. g++ with `-Wextra` also warns `missing initializer for member 'Vec3::z' [-Wmissing-field-initializers]` for this line: legal, but perhaps not what you meant.
3. `blank{}` value-initialises everything, and the default member initialiser still applies. No warning, because empty braces are an unmistakable request for "all defaults".
4. `counts{1, 2}` uses brace elision; the last two elements are zero.

Sanity check: compile the same file with `-std=c++11` and g++ rejects `full` and `partial` with `no matching function for call to 'ImuSample::ImuSample(<brace-enclosed initializer list>)'`, because in C++11 the `= 0xFF` made `ImuSample` a non-aggregate. That is the C++14 rule change, observed.
:::

In telemetry code the danger in aggregate initialisation is order. `{8, {0.01, -0.02}}` depends on the member order in the struct; swap two `double` members in the header and every call site silently fills the wrong fields, with no narrowing to catch it. C++20's **[[designated initialisers|designated-bridge]]**, `ImuSample s{.seq = 8, .status = 0}`, name each member and remove that risk.

::: key Aggregates
An aggregate is filled in member declaration order; missing members are value-initialised or take their default member initialiser; inner braces may be elided. Since C++14 an aggregate may have default member initialisers.
:::

## A house style that avoids every trap

Put it together into habits a flight team can check in review:

1. Use braces by default for values, structs and objects: `double x{};`, `Vec3 p{0.0, 0.0, 9.81};`. You get narrowing checks, zeroing, and no vexing parse.
2. Use parentheses for a container's *size* or *count* constructor: `std::vector<double> buf(1000);`. Braces there would give you one element.
3. With `auto`, use `auto x = value;` or `auto x{value};`, never `auto x = {value};`.
4. Build with `-Werror=narrowing`, and `-Wextra` for missing-initialiser warnings.

The C++ Core Guidelines give the same advice: rule **[[ES.23|core-guidelines]]** says to prefer the `{}` initialiser syntax, and lists the container case as its exception.

## Check yourself

::: check
For each line, give the number of elements and their values: `std::vector<double> p(3, 1.5);`, `std::vector<double> q{3, 1.5};`, `std::vector<int> r{4};`, `std::vector<int> s(4);`.
:::

::: answer
`p(3, 1.5)`: parentheses ignore the list constructor, so this is count 3, value 1.5: three elements, `1.5 1.5 1.5`.

`q{3, 1.5}`: braces try the initializer_list constructor first. `{3, 1.5}` can be a list of `double` (3 converts to `3.0` without narrowing, because an `int` constant that fits exactly is allowed), so two elements: `3.0 1.5`.

`r{4}`: a list of one `int`: one element, `4`.

`s(4)`: count 4, value-initialised: four elements, `0 0 0 0`.
:::

::: check
Which of these compile, and why? (a) `std::uint8_t id{255};` (b) `std::uint8_t id{256};` (c) `int n = 3; std::uint8_t id{n};` (d) `float f{16777217};`
:::

::: answer
(a) Compiles: 255 is a constant and fits in 0 to 255.

(b) Rejected by both g++ and clang: a constant that does not fit, and $256$ would wrap to $0$.

(c) Narrowing: `n` is not a constant, so the compiler cannot prove it fits, even though 3 would fit at run time. Ill-formed by the standard; g++ 13 warns (error with `-Werror=narrowing`), clang errors. Declaring `const int n = 3;` makes it a constant expression that fits, and then it compiles.

(d) Rejected: $16777217 = 2^{24} + 1$ is a constant, but a `float` has a 24-bit significand, so it cannot hold that exactly. For an integer-to-floating conversion a constant must be exactly representable, and g++ reports `narrowing conversion of '16777217' from 'int' to 'float'`.
:::

::: check
A teammate writes `Logger log(Config());` and then `log.write("boot");`, and the build fails on the second line. Explain the error and give two fixes.
:::

::: answer
The first line is the most vexing parse. It declares a function named `log` that returns a `Logger` and takes one parameter: a pointer to a function with no arguments returning `Config`. So `log.write` asks for a member of a function, and the compiler reports a request for a member in something of non-class type. g++ also warns `-Wvexing-parse` on the first line.

Fixes: `Logger log{Config{}};` (braces can never be a parameter list), or `Logger log(Config{});`. Another option is to name the config first: `Config cfg; Logger log(cfg);`.
:::

::: check
What type does each variable get? `auto a{2.5};` `auto b = {2.5};` `auto c = {1, 2.5};`
:::

::: answer
`a` is `double`: direct-list-initialisation of `auto` with exactly one element deduces that element's type (the rule from C++17, applied by modern compilers in all modes).

`b` is `std::initializer_list<double>`: the `=` form with braces always deduces an initializer_list.

`c` does not compile. The `=` form wants a `std::initializer_list<T>` with one `T`, but the elements are `int` and `double`, so `T` cannot be deduced.
:::

::: check
`struct Limits { double min_kpa; double max_kpa; bool armed = false; };` Someone writes `Limits l{9000.0};`. What are the three members? Which C++ version first accepts this line, and what warning might `-Wextra` print?
:::

::: answer
`min_kpa` is `9000.0`, `max_kpa` is value-initialised to `0.0`, and `armed` takes its default member initialiser, `false`. `Limits` is still an aggregate because it has no user-declared constructors, private members or virtual functions.

C++14 is the first to accept it: in C++11, the `= false` default member initialiser made `Limits` a non-aggregate, and braces would then look for a constructor that does not exist. With `-Wextra`, g++ warns `missing initializer for member 'Limits::max_kpa'`, a useful hint here, since a maximum of zero would make every reading look out of range.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| list-initialisation | `T x{args}` or `T x = {args}` | the `=` form cannot call `explicit` constructors |
| value-initialisation | `T x{}` | zero for built-ins and aggregates; default constructor otherwise |
| narrowing | a conversion that can lose information | ill-formed in braces; a constant that fits is allowed |
| most vexing parse | `T t(U());` declares a function | braces cannot be a declaration: `T t{U{}};` |
| initializer_list gotcha | braces prefer a list constructor | `v{3, 0}` has 2 elements; `v(3, 0)` has three zeros |
| empty braces | `v{}` | default constructor, not an empty list |
| `auto` with braces | `auto x{1}` and `auto x = {1}` | `int` and `std::initializer_list<int>` |
| aggregate | plain data, filled in member order | missing members value-initialised; default member initialisers allowed since C++14 |

Next lesson turns to C++14, the smaller standard that finished what C++11 started: generic lambdas, `auto` return types, `make_unique` at last, and variable templates.

::: context list-init-name Not quite uniform
The standard never uses the word "uniform". Its term is list-initialisation, and it splits into direct-list and copy-list forms, each with its own rules. "Uniform initialisation" was how C++11 was explained to programmers, because braces really can go in every place a starting value can. What is not uniform is the meaning: a class with an initializer_list constructor treats braces differently from one without, which is this lesson's whole trap.
:::

::: context narrowing-range Fits, or does not fit
A `std::uint8_t` holds the whole numbers 0 to 255. A constant such as 200 lands inside that range, so braces accept it. A constant such as 300 lands outside; the old `=` form would store $300 - 256 = 44$ without a word, and braces refuse it. A variable could hold anything, so braces refuse it unless its type's whole range fits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <rect x="30" y="40" width="220" height="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="30" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="250" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">255</text>
  <text x="140" y="32" font-size="11" text-anchor="middle" fill="#1f2a44">std::uint8_t range</text>
  <circle cx="202" cy="50" r="6" fill="#1d6fd1"/>
  <text x="202" y="98" font-size="11" text-anchor="middle" fill="#1d6fd1">200: allowed</text>
  <circle cx="288" cy="50" r="6" fill="#b4232c"/>
  <text x="300" y="98" font-size="11" text-anchor="middle" fill="#b4232c">300: rejected</text>
</svg>
```
:::

::: context vexing-tree How the compiler reads it
C++ reads `Timer t(Clock());` the way it would read `Timer t(Clock f());` with the parameter name left out. A parameter declared as a function type is adjusted to a pointer to that function, which is why g++ names the type `Timer(Clock (*)())`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="180" y="24" font-size="14" text-anchor="middle" fill="#1f2a44">Timer  t  ( Clock() ) ;</text>
  <line x1="120" y1="32" x2="70" y2="70" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="150" y1="32" x2="180" y2="70" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="215" y1="32" x2="290" y2="70" stroke="#b4232c" stroke-width="1.5"/>
  <rect x="20" y="72" width="100" height="30" fill="#fff" stroke="#1f2a44"/>
  <text x="70" y="91" font-size="11" text-anchor="middle" fill="#1f2a44">return type</text>
  <rect x="135" y="72" width="90" height="30" fill="#fff" stroke="#1f2a44"/>
  <text x="180" y="91" font-size="11" text-anchor="middle" fill="#1f2a44">function name</text>
  <rect x="240" y="72" width="105" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="292" y="91" font-size="11" text-anchor="middle" fill="#1f2a44">one parameter</text>
  <text x="292" y="122" font-size="11" text-anchor="middle" fill="#b4232c">pointer to function</text>
  <text x="292" y="138" font-size="11" text-anchor="middle" fill="#b4232c">returning Clock</text>
</svg>
```
:::

::: context init-list-backing What an initializer_list holds
An `std::initializer_list<int>` does not own anything. The compiler builds a hidden array for the braced values and the list stores where it starts and how long it is, like a small `std::span`. The hidden array's elements are `const`, so a constructor can copy from them but never move out of them. That is why `std::vector<std::unique_ptr<int>> v{std::make_unique<int>(1)};` fails to compile: a `unique_ptr` can only be moved, and the list offers only `const` elements.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="110" height="46" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="75" y="38" font-size="11" text-anchor="middle" fill="#1f2a44">initializer_list</text>
  <text x="75" y="56" font-size="11" text-anchor="middle" fill="#1f2a44">begin, size = 3</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#fff">
    <rect x="190" y="80" width="50" height="30"/><rect x="240" y="80" width="50" height="30"/><rect x="290" y="80" width="50" height="30"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="215" y="100">1</text><text x="265" y="100">2</text><text x="315" y="100">3</text>
  </g>
  <line x1="130" y1="50" x2="186" y2="88" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="190,90 180,90 185,82" fill="#1d6fd1"/>
  <text x="265" y="72" font-size="11" text-anchor="middle" fill="#6c7a93">hidden const array</text>
</svg>
```
:::

::: context auto-brace-history A rule fixed after the fact
The original C++11 rule deduced `std::initializer_list` for any `auto` with braces, so `auto n{5};` was not an `int`, and people who had been told "prefer braces" were bitten at once. A 2014 committee paper, N3922, proposed the rules you see today: one element in direct braces gives that element's type; several elements there is an error; the `= {}` form keeps giving a list. It went into C++17, and compiler vendors applied it to older modes as a defect fix, which is why very old compilers are the only place the original behaviour survives.
:::

::: context aggregate-history An aggregate, standard by standard
The definition has changed several times. In C++11, a default member initialiser disqualified a class. C++14 allowed them. C++17 allowed public, non-virtual base classes, which are filled first, in their own braces. C++20 stopped counting a class with any user-declared constructor, even one written `= default` or `= delete`, as an aggregate, and also allowed aggregates to be filled with parentheses, `Vec3 p(1.0, 2.0, 3.0)`. When legacy code upgrades its standard and a brace initialiser stops compiling, a changed aggregate rule is a likely cause.
:::

::: context designated-bridge Naming the fields
Lesson 6 of this module covers designated initialisers from C++20: `ImuSample s{.seq = 8, .gyro_rad_s = {0.01, -0.02, 0.0}}`. The names must appear in declaration order, and any you skip are value-initialised or take their defaults. They turn a reordered struct from a silent data bug into a compile error, which is why telemetry and configuration structs are their favourite use.
:::

::: context core-guidelines The C++ Core Guidelines
The C++ Core Guidelines are a free, online set of rules for modern C++, edited by Bjarne Stroustrup, who created the language, and Herb Sutter. Rules are numbered by section: ES is "expressions and statements". ES.23 recommends the `{}` initialiser syntax because it is the most widely applicable form, forbids narrowing, and avoids the vexing parse, and it names the container-size case as a place to use parentheses instead. Many static analysers can check Core Guidelines rules automatically.
:::
