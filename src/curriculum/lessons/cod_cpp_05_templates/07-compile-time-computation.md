---
id: l07-compile-time-computation
title: Computing before the program runs, and if constexpr
minutes: 24
covers:
  - constexpr functions, consteval, constinit, compile-time computation
  - if constexpr for compile-time branching
---

Think of the times table printed on the back cover of an old school notebook. Nobody works out $7 \times 8$ during a test by adding sevens. The printer did that work once, years ago, and every student since has only read the answer. Reading is faster than working, and a printed table cannot make an adding mistake on the day.

A flight computer wants the same trade. Sine tables, checksum tables, filter coefficients, the size of every buffer: work that depends only on numbers known before launch should be done before launch. Better still, before the program even exists, by the compiler. Then it costs nothing at boot, nothing in a 1 kHz control cycle, and it cannot fail in flight.

The first C++ module met the words for this: `constexpr`, which means "may be computed while compiling", and `consteval`, which means "must be". It also met the **static initialisation order fiasco** — two global objects in different files, one reading the other before it was set. This lesson makes all of that exact. It pins down what `constexpr` promises and what it does not, adds `constinit` to close the fiasco, builds a real table of sines and cosines inside the compiler, and then turns to `if constexpr`, which lets one template choose its behaviour by the type it is given.

## What `constexpr` on a function really promises

A `constexpr` function is written like any other. The keyword is a permission: this function is simple enough that the compiler *may* run it itself, if every input is a constant. It is not an order.

So when does the compiler actually run it? Whenever the language needs a value while compiling. These places are called **[[constant contexts|constant-context]]** — spots in the code where only a value known at compile time will do:

- the initialiser of a `constexpr` variable;
- a template argument, like the `3` in `Matrix<double, 3, 3>` from lesson 2;
- the size of a built-in array or `std::array`;
- the condition of a `static_assert`;
- a `case` label in a `switch`.

Anywhere else, the call is an ordinary run-time call, as far as the language is concerned. An optimiser may still fold it into a constant, and g++ at `-O2` often does. But that is a favour, not a guarantee, and it can change with the flags or the compiler version.

The standard library can tell you which world you are in. `std::is_constant_evaluated()` (from `<type_traits>`, C++20) returns `true` only while the compiler is evaluating the call in a constant context.

::: example The same function, called in two places
```cpp
#include <cstdio>
#include <type_traits>

constexpr const char* when() {
    return std::is_constant_evaluated() ? "compile time" : "run time";
}

constexpr double deg_to_rad(double deg) { return deg * 3.14159265358979323846 / 180.0; }

int main(int argc, char**) {
    constexpr const char* a = when();   // a constant is required here
    const char* b = when();             // no constant required
    std::printf("constexpr variable: %s\n", a);
    std::printf("plain variable:     %s\n", b);

    constexpr double k = deg_to_rad(90.0);      // must be a constant
    double r = deg_to_rad(90.0 * argc);         // argc is only known at run time
    std::printf("%.6f %.6f\n", k, r);
}
```

Compiled with `g++ -std=c++20 -Wall -Wextra -O2` and run with no arguments, so `argc` is 1:

```text
constexpr variable: compile time
plain variable:     run time
1.570796 1.570796
```

Walk through it.

1. `a` is a `constexpr` variable, so its initialiser is a constant context. The compiler must evaluate `when()` itself, and inside that evaluation `std::is_constant_evaluated()` is `true`.
2. `b` is a plain variable. The call has constant inputs (it has none at all), and the optimiser surely folded it. Yet the language says this is not a constant context, so the answer is "run time". The function reports the language's view, not the optimiser's.
3. `deg_to_rad` runs twice: once inside the compiler for `k`, once at run time for `r`, because `argc` does not exist until the program starts. One function, two modes.

Sanity check: $90 \times \pi / 180 = \pi/2 \approx 1.570796$, and both lines agree.
:::

::: key
`constexpr` on a function guarantees that it may be evaluated at compile time when its arguments are constant expressions; it does not force it. `consteval` does force it, making the function **immediate**: every call must be evaluated at compile time.
:::

::: warning `constexpr` is not a speed switch
Marking a function `constexpr` does not make a run-time call any faster. Called in a loop with sensor data, it is an ordinary function. If you need the answer computed while compiling, store it in a `constexpr` variable, or make the function `consteval` so a run-time call is impossible.
:::

### The compiler as a checker

There is a bonus hidden in constant evaluation. At run time, reading past the end of an array or overflowing a signed integer is **[[undefined behaviour|compile-time-ub]]** — the language makes no promise at all about what happens next. During constant evaluation, the compiler is required to notice it and refuse.

Here is a timing constant that overflows. One hour in microseconds is $3.6 \times 10^9$, and a 32-bit signed integer tops out at $2^{31} - 1 = 2\,147\,483\,647$:

```cpp
#include <cstdint>
constexpr std::int32_t ticks(std::int32_t seconds) { return seconds * 1'000'000; }  // microseconds
constexpr std::int32_t kOneHour = ticks(3600);
int main() { return kOneHour > 0; }
```

```text
ub2.cpp:3:40:   in 'constexpr' expansion of 'ticks(3600)'
ub2.cpp:3:45: error: overflow in constant expression [-fpermissive]
```

At run time the same multiply would quietly wrap to a negative number on most machines. Here the build stops. That is a strong reason to write table builders and unit conversions as `constexpr` and to check them with `static_assert`: the compiler becomes a test harness that runs on every build.

Compile-time evaluation has a budget: g++ stops any one loop after 262,144 iterations (`-fconstexpr-loop-limit=` raises it). A table of a few thousand entries is far inside that.

## `consteval`: no run-time version at all

An **immediate function**, declared `consteval`, has no run-time form. Every call must happen in the compiler. You met it validating a telemetry identifier; here it guards a table's shape:

```cpp
consteval int entries_for_step(int step_deg) {
    if (step_deg <= 0 || 360 % step_deg != 0) throw "step must divide 360 evenly";
    return 360 / step_deg;
}

constexpr int kEntries = entries_for_step(5);     // 72
```

`entries_for_step(7)` stops the build: g++ reports `expression '<throw-expression>' is not a constant expression` and points at the `throw`. Nothing is ever thrown at run time, because there is no run time for this function. Reaching the `throw` while compiling means the call is not a constant, which is an error.

Use `consteval` when a run-time call would be a mistake — a validator, or a table builder you never want compiled into the flight binary as code. Use `constexpr` when the same function should also serve run-time callers.

## `constinit`: set before anything runs, still changeable

Picture an office coffee machine. Either the night cleaner fills it before anyone arrives, or the first person in fills it. The second plan works until the day someone who only drinks, never fills, arrives first and gets an empty cup.

That is the fiasco. Every global object lives through **[[two initialisation phases|static-init-phases]]**. In the first, **static initialisation**, memory is zeroed and every object whose initialiser is a constant gets its value, all before any code runs. In the second, **dynamic initialisation**, the rest are computed by code that runs before `main`, and between different source files the order is unspecified. A global that reads another file's global during that second phase may read the zero left from the first.

C++20's `constinit` is the night cleaner's signature. Writing it on a variable says: *this object must be set during static initialisation, or the build fails.*

The rules:

- It applies only to variables with static storage duration (globals, `static` members, `static` locals) or **[[thread storage duration|thread-local]]** (`thread_local`, one copy per thread).
- Its initialiser must be a constant expression.
- It does **not** make the variable `const`. The program may change it afterwards.

That last rule is the point. `constexpr` gives you early initialisation, but also a constant you can never change. A frame counter, a mode flag or a mass estimate must change. Before C++20 such a variable could still be constant-initialised, but only by luck of its initialiser, and one careless edit later it would silently move to the dynamic phase.

```cpp
#include <cstdint>
#include <cstdio>

constexpr double dry_mass_kg() { return 549054.0; }   // kg, roughly a Falcon 9 at lift-off

constinit double g_mass_kg = dry_mass_kg();           // set before any code runs
constinit std::uint32_t g_frames_sent = 0;             // a counter: it must change
constinit thread_local std::uint32_t t_retries = 0;    // one per thread, also static-init

void send_frame() { ++g_frames_sent; }

int main() {
    for (int i = 0; i < 3; ++i) send_frame();
    g_mass_kg -= 1200.0;                               // propellant used: allowed, not const
    t_retries = 2;
    std::printf("frames sent = %u\n", g_frames_sent);
    std::printf("mass        = %.1f kg\n", g_mass_kg);
    std::printf("retries     = %u\n", t_retries);
}
```

```text
frames sent = 3
mass        = 547854.0 kg
retries     = 2
```

Now the careless edit. Suppose someone changes the initialiser to call an ordinary function, `double read_dry_mass()`, which is not `constexpr`:

```text
ci.cpp:7:18: error: 'constinit' variable 'g_mass_kg' does not have a constant initializer
    7 | constinit double g_mass_kg = read_dry_mass();
      |                  ^~~~~~~~~
ci.cpp:7:43: error: call to non-'constexpr' function 'double read_dry_mass()'
```

Without `constinit`, that edit compiles cleanly and moves `g_mass_kg` into the dynamic phase — exactly the two-link-orders, two-answers bug the first module demonstrated. With it, the build stops at the line that caused it.

::: key
`const`: may not be modified through this name. `constexpr` variable: a compile-time constant, and `const`. `constinit`: initialised during static initialisation (the build fails otherwise), but *not* `const`. `consteval` function: every call evaluated at compile time.
:::

::: warning `constinit` guards one object, not its readers
`constinit` guarantees *this* variable is ready before any code runs. It does nothing for a different global that is still dynamically initialised. Put `constinit` on the object that others read. And since it is not `const`, a `constinit` global is still shared, changeable state: across threads it needs the same care as any other global.
:::

## A rotation table built by the compiler

Now the payoff: a table of sines and cosines, one entry per whole degree, computed and checked inside the compiler. It rotates a 2-D vector — a thrust direction, a sensor boresight — with multiplies and adds and no call to a sine routine. On a small processor without fast sine that saves real time.

The obvious plan fails at the first step. `std::sin` is not `constexpr` in the C++20 or C++23 standard. g++ 13.3 happens to accept `constexpr double h = std::sin(0.5235987755982988);` as an extension, even with `-pedantic`. clang++ 18.1.3 refuses: `non-constexpr function 'sin' cannot be used in a constant expression`. Code that must build on both cannot rely on it. So we write our own.

The tool is the **[[Taylor series|taylor-series]]**: sine and cosine written as endless sums of powers of $x$, with $x$ in radians.

$$
\sin x = x - \frac{x^3}{3!} + \frac{x^5}{5!} - \frac{x^7}{7!} + \cdots
\qquad
\cos x = 1 - \frac{x^2}{2!} + \frac{x^4}{4!} - \frac{x^6}{6!} + \cdots
$$

Read $3!$ as "three factorial", $3 \times 2 \times 1 = 6$. Each term is the one before it, multiplied by $-x^2$ and divided by the next two whole numbers. For sine, the term after $x$ is $x \cdot \frac{-x^2}{2 \cdot 3}$, the next is that times $\frac{-x^2}{4 \cdot 5}$, and so on. A loop can do that without ever computing a large factorial.

The terms shrink fastest when $x$ is small, so we only ever feed the series angles from $0$ to $90°$ ($0$ to $\pi/2$ radians). Any whole-degree angle splits into whole **[[quarter-turns|quarter-turns]]** plus a leftover under $90°$, and a quarter-turn only swaps and negates cosine and sine:

$$
\begin{aligned}
\cos(90° + r) &= -\sin r, & \sin(90° + r) &= \cos r, \\
\cos(180° + r) &= -\cos r, & \sin(180° + r) &= -\sin r, \\
\cos(270° + r) &= \sin r, & \sin(270° + r) &= -\cos r.
\end{aligned}
$$

How many terms? The series alternate in sign with shrinking terms, and for such a series the error is smaller than the first term you leave out. At the worst angle, $x = \pi/2 \approx 1.5708$, keeping the terms up to $x^{25}$ leaves out $x^{27}/27!$, which python3 puts at about $1.8 \times 10^{-23}$. That is far below the rounding of a `double` near 1, about $1.1 \times 10^{-16}$. The loop below keeps 13 terms of each series, which is generous.

::: example A 360-entry rotation table, and how accurate it is
```cpp
#include <array>
#include <cmath>
#include <cstdio>

constexpr double kPi = 3.14159265358979323846;

// sin and cos of x, for 0 <= x <= pi/2, by their Taylor series.
// Each term is the previous one times -x*x / ((k+1)(k+2)).
constexpr double sin_taylor(double x) {
    double term = x, sum = x;
    for (int k = 1; k <= 12; ++k) {
        term *= -x * x / ((2 * k) * (2 * k + 1));
        sum += term;
    }
    return sum;
}

constexpr double cos_taylor(double x) {
    double term = 1.0, sum = 1.0;
    for (int k = 1; k <= 12; ++k) {
        term *= -x * x / ((2 * k - 1) * (2 * k));
        sum += term;
    }
    return sum;
}

struct Rot {
    double c;   // cos of the angle
    double s;   // sin of the angle
};

// One entry per whole degree, 0 to 359.
constexpr std::array<Rot, 360> make_rotation_table() {
    std::array<Rot, 360> t{};
    for (int deg = 0; deg < 360; ++deg) {
        const int quadrant = deg / 90;           // 0, 1, 2 or 3
        const double x = (deg % 90) * kPi / 180.0; // 0 <= x < pi/2
        const double c = cos_taylor(x);
        const double s = sin_taylor(x);
        switch (quadrant) {                        // turn by whole quarter-turns
            case 0:  t[deg] = { c,  s}; break;
            case 1:  t[deg] = {-s,  c}; break;
            case 2:  t[deg] = {-c, -s}; break;
            default: t[deg] = { s, -c}; break;
        }
    }
    return t;
}

constexpr auto kRot = make_rotation_table();

static_assert(kRot[0].c == 1.0 && kRot[0].s == 0.0);
static_assert(kRot[90].c == 0.0 && kRot[90].s == 1.0);
static_assert(kRot[180].c == -1.0);

int main() {
    double worst = 0.0;
    int worst_deg = 0;
    for (int deg = 0; deg < 360; ++deg) {
        const double a = deg * kPi / 180.0;
        const double e = std::fmax(std::fabs(kRot[deg].c - std::cos(a)),
                                   std::fabs(kRot[deg].s - std::sin(a)));
        if (e > worst) { worst = e; worst_deg = deg; }
    }
    std::printf("kRot[30]  = (%.17f, %.17f)\n", kRot[30].c, kRot[30].s);
    std::printf("std::     = (%.17f, %.17f)\n", std::cos(kPi / 6), std::sin(kPi / 6));
    std::printf("worst difference from std::sin/std::cos: %.3g at %d deg\n", worst, worst_deg);
    std::printf("table size: %zu bytes\n", sizeof(kRot));
}
```

Output, identical from g++ 13.3 and clang++ 18.1.3:

```text
kRot[30]  = (0.86602540378443860, 0.49999999999999994)
std::     = (0.86602540378443871, 0.49999999999999994)
worst difference from std::sin/std::cos: 1.1e-15 at 359 deg
table size: 5760 bytes
```

Step by step:

1. `constexpr auto kRot = make_rotation_table();` is a constant context, so the compiler runs the whole loop: 360 angles, 13 terms each for sine and cosine. The finished table lands in the program's read-only data (`nm` lists `kRot` with an `r`). No code builds it at start-up.
2. The three `static_assert` lines are tests that run while compiling. The quarter-turn trick pays off here: at $90°$ the leftover $x$ is exactly 0, so the table holds exactly $\cos 90° = 0$ and $\sin 90° = 1$. Feeding the rounded number `90 * kPi / 180` to a cosine would instead give about $6 \times 10^{-17}$, not 0.
3. Entry 30 should be $(\cos 30°, \sin 30°) = (\sqrt{3}/2,\ 1/2) \approx (0.8660, 0.5000)$. It is. Sine agrees with `std::sin` to every digit printed; cosine differs in the 16th significant digit.
4. The size is $360 \times 16 = 5760$ bytes: two 8-byte `double`s per entry.

Who is closer to the truth, the table or `std::sin`? A 50-digit reference computed in python3 with the `decimal` module answers it. The table's worst error is about $3.0 \times 10^{-16}$. The worst error of `std::sin(deg * kPi / 180.0)` is about $9.5 \times 10^{-16}$, because for large angles the argument itself is rounded before `std::sin` ever sees it. Most of the $1.1 \times 10^{-15}$ difference is on the library's side. Either is about [[a few units in the last place|ulp]] of a `double`, and many orders of magnitude finer than any sensor on a vehicle.
:::

To use the table, rotate a vector $(x, y)$ by the angle $\theta$ (read "theta") with the rotation you met in the algebra modules:

$$
x' = x \cos\theta - y \sin\theta, \qquad y' = x \sin\theta + y \cos\theta.
$$

In code that is `kRot[deg].c * x - kRot[deg].s * y` and `kRot[deg].s * x + kRot[deg].c * y` — no transcendental call in the control loop at all.

## `if constexpr`: one template, several behaviours

Picture a tax form with whole pages for farmers, for sailors and for pilots. Before it reaches you, the pages that do not apply are torn out. Nobody fills them in, and nobody checks them for mistakes.

`if constexpr` (read "if const-expr") does that to a template. Its condition must be a constant expression, usually a type trait from lesson 5. When the template is instantiated for a particular type, the compiler evaluates the condition, keeps the branch that applies, and discards the other. A **discarded statement** inside a template is not instantiated for that type. It must still parse, but code in it that would be ill-formed for that type — calling `.count()` on a `double`, say — is never checked against that type, because for that type it does not exist.

That lets one function select its behaviour by a property of its type, with no specialisation. Lesson 1 chose a telemetry wire format with a primary template and two specialisations, three separate definitions. Here is one function that packs any supported value into a signed 32-bit telemetry word.

::: example One encoder for enums, floats, integers and durations
```cpp
#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <type_traits>

enum class Mode : std::uint8_t { Safe = 0, Coast = 3, Burn = 7 };

// Pack any supported value into one signed 32-bit telemetry word.
template <typename T>
std::int32_t encode(T v) {
    if constexpr (std::is_enum_v<T>) {
        return static_cast<std::int32_t>(static_cast<std::underlying_type_t<T>>(v));
    } else if constexpr (std::is_floating_point_v<T>) {
        constexpr double kLsb = 0.001;                     // one count = 0.001 units
        return static_cast<std::int32_t>(std::lround(v / kLsb));
    } else if constexpr (std::is_integral_v<T>) {
        return static_cast<std::int32_t>(v);
    } else if constexpr (requires { v.count(); }) {        // a std::chrono duration
        using std::chrono::microseconds;
        return static_cast<std::int32_t>(std::chrono::duration_cast<microseconds>(v).count());
    } else {
        static_assert(false, "encode: no telemetry encoding for this type");
    }
}

int main() {
    using namespace std::chrono_literals;
    std::printf("Mode::Burn -> %d\n", encode(Mode::Burn));
    std::printf("9.80665    -> %d\n", encode(9.80665));
    std::printf("-2.5f      -> %d\n", encode(-2.5f));
    std::printf("int 42     -> %d\n", encode(42));
    std::printf("12.5 ms    -> %d\n", encode(12.5ms));
}
```

```text
Mode::Burn -> 7
9.80665    -> 9807
-2.5f      -> -2500
int 42     -> 42
12.5 ms    -> 12500
```

Follow each call.

1. `encode(Mode::Burn)`: `T` is `Mode`, an enum, so the first branch is kept. `std::underlying_type_t<Mode>` (read "the underlying type of Mode") is `std::uint8_t`, and the value 7 comes out. Every other branch is discarded, including `v / kLsb`, which has no meaning for an enum.
2. `encode(9.80665)`: `T` is `double`. Now the enum branch is discarded — a good thing, because `std::underlying_type_t<double>` does not exist. The float branch divides by the scale: $9.80665 / 0.001 = 9806.65$, rounded to $9807$ counts.
3. `encode(-2.5f)`: the same branch, instantiated a second time for `float`: $-2.5 / 0.001 = -2500$.
4. `encode(42)`: the integer branch, a plain copy.
5. `encode(12.5ms)`: none of the traits match a `std::chrono::duration`, so the `requires` expression from lesson 6 asks "does `v.count()` compile?" It does. The duration becomes 12,500 microseconds.
6. Anything else — a `std::string`, say — reaches the last branch, and the build stops with the message `encode: no telemetry encoding for this type`.

Now change the first two `if constexpr` to plain `if` and rebuild. g++ refuses, with a pile of errors including:

```text
error: no match for 'operator/' (operand types are 'Mode' and 'const double')
error: no type named 'type' in 'struct std::underlying_type<double>'
```

A plain `if` is decided while the program runs, so the compiler must type-check both branches for every `T`. `if constexpr` is decided while compiling, and the branch that loses is never instantiated.
:::

::: key
`if constexpr`: the untaken branch is not instantiated, so it may contain code that would be ill-formed for that type. It replaces [[tag dispatch|tag-dispatch]] and much specialisation with an ordinary, readable `if`.
:::

A note on `static_assert(false)` in the last branch. Older rules made it fire even when discarded, so people wrote a condition that depends on `T`, such as `sizeof(T) == 0`. A recent fix to the standard, applied to earlier versions too, made the plain form legal in a discarded branch; g++ 13 and clang++ 18 both accept it with `-std=c++20`.

::: warning Three ways `if constexpr` bites
- **Every link of the chain needs `constexpr`.** Write `else if (std::is_integral_v<T>)` without it, and that `if` becomes a run-time one. Its branches are no longer discarded: `encode(12.5ms)` now fails with `invalid 'static_cast' from type 'std::chrono::duration<...>'`, and `encode(42)` trips the `static_assert`.
- **Only inside a template.** In ordinary code, a discarded branch is still fully checked. `double v = 1.0; if constexpr (false) { v.count(); }` in `main` is an error: `request for member 'count' in 'v', which is of non-class type 'double'`.
- **The condition must be a constant.** `if constexpr (n > 0)` with a run-time `n` fails with `'n' is not a constant expression`.
:::

## Check yourself

::: check
In `main`, a teammate writes `double k = deg_to_rad(15.0);`, where `deg_to_rad` is `constexpr`. The disassembly shows a constant, no call. Is the compile-time evaluation guaranteed? What two changes would guarantee it?
:::

::: answer
No. `double k` is not a constant context, so the language treats the call as a run-time call; the optimiser folded it as a favour, and a different flag or compiler might not. Guarantee it by making the variable `constexpr double k = deg_to_rad(15.0);`, whose initialiser is a constant context, or by declaring the function `consteval`, so that every call must be evaluated while compiling (and a run-time argument becomes an error).
:::

::: check
A flight program has a global `std::uint32_t g_boot_count = 0;` that start-up code increments, and other files read it during their own dynamic initialisation. Which of `constexpr`, `const` and `constinit` should you add, and why not the other two?
:::

::: answer
`constinit`. It demands that the variable be set during static initialisation, before any code runs, so every reader sees 0 rather than an unset value, and the build fails if a later edit makes the initialiser non-constant. `constexpr` would also force early initialisation but makes the variable `const`, so `++g_boot_count` would not compile. `const` alone forbids the increment too, and does not guarantee anything about when it is initialised.
:::

::: check
Using the rule that an alternating series with shrinking terms is off by less than its first omitted term, how many terms of the sine series ($x, x^3, x^5, \ldots$) do you need at $x = \pi/2$ to be sure of an error below $10^{-16}$? Use $(\pi/2)^{21}/21! \approx 2.6 \times 10^{-16}$ and $(\pi/2)^{23}/23! \approx 1.3 \times 10^{-18}$.
:::

::: answer
Eleven. Keeping the terms $x, x^3, \ldots, x^{19}$ (ten terms) leaves out $x^{21}/21! \approx 2.6 \times 10^{-16}$, which is not below $10^{-16}$. Adding the $x^{21}$ term (eleven terms) leaves out $x^{23}/23! \approx 1.3 \times 10^{-18}$, which is. The lesson's loop keeps thirteen terms, so it has a comfortable margin, and smaller angles converge even faster because $x < \pi/2$.
:::

::: check
Use the rotation table to rotate the vector $(100, 0)$ m by $120°$. Which entry do you read, how was it built, and what is the result?
:::

::: answer
Read `kRot[120]`. The builder splits $120°$ into one quarter-turn plus $r = 30°$, and the quadrant-1 rule stores $(\cos, \sin) = (-\sin 30°, \cos 30°) = (-0.5, 0.8660)$. Then $x' = 100 \times (-0.5) - 0 \times 0.8660 = -50.0$ m and $y' = 100 \times 0.8660 + 0 \times (-0.5) = 86.6$ m. Sanity check: the length is $\sqrt{50^2 + 86.6^2} \approx 100$ m, unchanged, as a rotation must leave it, and the point is up and to the left, in the second quadrant, where $120°$ belongs.
:::

::: check
Someone adds a fifth kind to `encode`: `else if (std::is_same_v<T, bool>) { return v ? 1 : 0; }`, placed right after the enum branch and written without `constexpr`. Which calls now break, and why?
:::

::: answer
Only `encode(12.5ms)`. g++ says `could not convert 'v' from 'std::chrono::duration<long double, std::ratio<1, 1000> >' to 'bool'`. Here is why. For any type that is not an enum, the first branch is discarded and its `else` is kept — and that `else` now starts with a run-time `if`. Both branches of a run-time `if` are instantiated, so `return v ? 1 : 0;` is compiled for *every* non-enum type. That line is fine for `double`, `float` and `int`, which all convert to `bool`, but a `std::chrono::duration` does not. Everything below still starts with `if constexpr`, so the discarding keeps working further down, which is why nothing else breaks. The fix is `else if constexpr (std::is_same_v<T, bool>)`. (Its position is right, too: `std::is_integral_v<bool>` is true, so a `bool` branch placed after the integer branch would never be reached.)
:::

## Summary

| Idea | Meaning | Rule or fact |
|---|---|---|
| `constexpr` function | may be evaluated while compiling | only guaranteed in a constant context; otherwise an ordinary call |
| constant context | a place that needs a compile-time value | `constexpr` initialiser, template argument, array bound, `static_assert`, `case` |
| `std::is_constant_evaluated()` | "am I running in the compiler?" | true only in a constant context |
| undefined behaviour at compile time | overflow, out-of-bounds read | a compile error, not a silent wrap |
| `consteval` | immediate function | every call evaluated while compiling; no run-time form |
| `constinit` | static initialisation, guaranteed | build fails otherwise; the variable is not `const` |
| compile-time table | `constexpr auto kRot = make_rotation_table();` | Taylor series, 13 terms, worst error about $3 \times 10^{-16}$; checked by `static_assert` |
| `if constexpr` | branch chosen while compiling | the discarded branch is not instantiated for that type |

The next lesson goes back to CRTP from the RAII module and uses it to bolt features onto many types at once, meets C++23's "deducing this", and then builds classes out of interchangeable parts chosen by template parameters: policy-based design.

::: context constant-context Every place that needs a constant
A **constant expression** is one the compiler can evaluate completely while compiling, using only constant inputs and `constexpr` functions, without touching anything that exists only at run time: no reads of ordinary variables, no input and output, no calls to ordinary functions. The standard calls evaluation in a place that *requires* such a value "manifestly constant-evaluated". Besides the five places in the lesson, the list includes the condition of `if constexpr`, the width of a bit-field, an `enum` enumerator's value, a `noexcept(...)` condition, and the initialiser of a `constinit` variable. In all of them a non-constant is a compile error, not a slower path.
:::

::: context compile-time-ub Why the compiler must catch undefined behaviour
At run time the standard makes no promise about undefined behaviour, so compilers are free to assume it never happens, and the effects can be strange. During constant evaluation the rule flips: the standard says an expression that would have undefined behaviour is not a constant expression. So the compiler must detect it, and it does, for signed overflow, out-of-range array reads, dereferencing null, and reading an object after its lifetime ended. That is why some teams write `static_assert` tests on `constexpr` code: those tests catch a class of bugs that a run-time unit test can pass by luck.
:::

::: context static-init-phases The two phases before main
Every global object passes through the same two phases before `main` runs. `constinit` insists that an object is finished in the first.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="14" y1="60" x2="346" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="346,60 336,55 336,65" fill="#1f2a44"/>
  <text x="330" y="80" font-size="11" fill="#6c7a93" text-anchor="end">time</text>
  <rect x="18" y="30" width="120" height="24" fill="#8fb8f0" stroke="#1d6fd1"/>
  <text x="78" y="46" font-size="11" fill="#1f2a44" text-anchor="middle">static init</text>
  <rect x="146" y="30" width="120" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <text x="206" y="46" font-size="11" fill="#1f2a44" text-anchor="middle">dynamic init</text>
  <rect x="274" y="30" width="56" height="24" fill="#ffffff" stroke="#1f2a44"/>
  <text x="302" y="46" font-size="11" fill="#1f2a44" text-anchor="middle">main</text>
  <text x="78" y="98" font-size="11" fill="#1d6fd1" text-anchor="middle">zero everything,</text>
  <text x="78" y="113" font-size="11" fill="#1d6fd1" text-anchor="middle">then constant values</text>
  <text x="78" y="128" font-size="11" fill="#1d6fd1" text-anchor="middle">no code runs</text>
  <text x="206" y="98" font-size="11" fill="#b4232c" text-anchor="middle">code computes the rest</text>
  <text x="206" y="113" font-size="11" fill="#b4232c" text-anchor="middle">order between files</text>
  <text x="206" y="128" font-size="11" fill="#b4232c" text-anchor="middle">is unspecified</text>
  <text x="78" y="156" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">constinit: here</text>
</svg>
```

A `constinit` object reads the same from the first instruction onward, whichever order the linker chose for the files.
:::

::: context thread-local One copy per thread
A `thread_local` variable exists once per thread: each thread gets its own copy, which lives as long as the thread does. It suits per-thread scratch data such as a retry counter or an error code. If such a variable needs dynamic initialisation, the generated code often has to ask "is this thread's copy set up yet?" before using it. A `constinit thread_local` variable is known to be set by constant values, so the compiler can drop that question.
:::

::: context taylor-series A polynomial that copies a curve
The series is named after Brook Taylor, who published the general method in 1715. The idea: near $x = 0$, match the curve's value, then its slope, then how its slope changes, and so on, one power of $x$ at a time. For sine the pattern of derivatives at 0 repeats every four steps: $0, 1, 0, -1$. That is why only odd powers appear, with alternating signs, and why each is divided by its factorial. Cosine gets the even powers. The single-variable calculus module derives the general formula and its error bound.
:::

::: context quarter-turns Why a quarter-turn swaps cosine and sine
Turning a point on the unit circle by $90°$ counter-clockwise moves $(c, s)$ to $(-s, c)$. So the table entry for $120°$ is entry $30°$ turned once.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="80" y1="110" x2="280" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="20" x2="180" y2="195" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="180" cy="110" r="80" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="110" x2="249.3" y2="70" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="249.3" cy="70" r="4" fill="#1d6fd1"/>
  <text x="256" y="62" font-size="12" fill="#1d6fd1">30°: (0.866, 0.5)</text>
  <line x1="180" y1="110" x2="140" y2="40.7" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="140" cy="40.7" r="4" fill="#b4232c"/>
  <text x="134" y="32" font-size="12" fill="#b4232c" text-anchor="end">120°: (−0.5, 0.866)</text>
  <path d="M 210 110 A 30 30 0 0 0 206 95" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <path d="M 207.7 94 A 32 32 0 0 0 164 82.3" fill="none" stroke="#f2b880" stroke-width="2"/>
  <text x="180" y="70" font-size="11" fill="#1f2a44" text-anchor="middle">+90°</text>
  <text x="274" y="126" font-size="11" fill="#6c7a93">x</text>
  <text x="186" y="30" font-size="11" fill="#6c7a93">y</text>
</svg>
```

The blue point is $(\cos 30°, \sin 30°)$. Turned a quarter, it lands at $(-\sin 30°, \cos 30°)$, which is $(\cos 120°, \sin 120°)$.
:::

::: context ulp How fine a double is
A `double` stores about 16 significant decimal digits, so neighbouring values are not continuous. The gap between one `double` and the next is called an **ulp**, a "unit in the last place". Near 1 it is $2^{-52} \approx 2.2 \times 10^{-16}$. Near $6.28$, the size of a full turn in radians, it is four times larger, about $8.9 \times 10^{-16}$. An error of $3 \times 10^{-16}$ in a value near 1 is one or two ulps: as close as the format allows, give or take rounding.
:::

::: context tag-dispatch What people wrote before if constexpr
Before C++17, choosing code by a type property meant **tag dispatch**. You wrote several overloads that differed only in an extra empty "tag" parameter, such as `std::true_type` or `std::false_type`, then called them with `std::is_floating_point<T>{}` as the tag. Overload resolution picked the matching version, and only that one was instantiated. It worked, but one idea was spread over three or four functions with no names that said what they did. The C++ standard library still uses the technique inside, for example to pick the fastest algorithm for a given iterator category.
:::
