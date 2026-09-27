---
id: l08-functions-overloading-default-arguments
title: Functions, overloading and default arguments
minutes: 19
covers:
  - Functions, overloading, default arguments
---

Picture a classroom with two students called Sam. When the teacher says "Sam, hand me the ruler", everybody looks at who is nearest the ruler. When she says "Sam, read the next line", everybody looks at who is holding the book. The name alone is not enough; the situation decides which Sam she means. And if both Sams are equally near the ruler, somebody has to ask, "which Sam?"

C++ functions work the same way. You can give several functions the same name, as long as they take different kinds of **arguments** — the values you hand over in a call. The compiler looks at what you handed over and picks the one that fits. That is called **overloading**. When two fit equally well, the compiler does not guess. It stops and asks "which one?" as a compile error.

This is a real change from Python. A Python function is an object with a name stuck on it, and a call is a lookup that happens while the program runs: Python finds whatever `norm` refers to *right now* and calls it. A C++ function has no such run-time identity. The compiler decides, while it is building the program, exactly which function each call means, using only the types of the arguments. Then it writes that choice into the object file as a **[[mangled symbol|name-mangling]]**, as lesson 01 showed.

**Default arguments** look like Python's and are not. A default is a value used when the caller leaves an argument out, like a coffee shop that makes a medium unless you say otherwise. In C++ it belongs to a declaration, not to the function, and it is worked out again at every call — which removes Python's most famous trap and brings in a different one.

## The shape of a function

```cpp
double norm(const Vec3& v);                       // declaration
double norm(const Vec3& v) {                      // definition
    return std::sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}
```

Four parts, left to right: the **return type** (`double`, the kind of value handed back), the name, the **parameter list** in brackets (what the function takes), and the **body** in braces (what it does). The first line is a **declaration** — it announces that the function exists. The second is the **definition** — it also supplies the body. A function that hands nothing back is declared `void`.

Unlike Python, the return type is part of the contract. The compiler checks every `return` against it. A non-`void` function that reaches its closing brace without a `return` is **undefined behaviour** — lesson 05's name for "the language makes no promise at all". `-Wall` catches it:

```cpp
int sign(int x) {
    if (x > 0) return 1;
    if (x < 0) return -1;
}
```

```text
ret.cpp: In function 'int sign(int)':
ret.cpp:4:1: warning: control reaches end of non-void function [-Wreturn-type]
```

Zero slips through both tests and **[[falls off the end|main-exception]]** of the function. Add `return 0;` as the last line.

Two modern spellings are worth knowing.

A **trailing return type** puts the type after the parameters: `auto norm(const Vec3& v) -> double;`. Read the `->` aloud as "returns". It means the same as the ordinary form, and it is handy when the return type depends on the parameters.

**`[[nodiscard]]`** — say "no-discard" — is an **[[attribute|attributes]]** you put on a declaration. It tells the compiler that ignoring the result is probably a mistake:

```cpp
#include <cstdint>

[[nodiscard]] std::uint8_t checksum(const std::uint8_t* p, unsigned n);

int main() {
    const std::uint8_t packet[4]{0x10, 0x20, 0x30, 0x40};
    checksum(packet, 4);      // result thrown away
}
```

```text
b2.cpp:7:13: warning: ignoring return value of 'uint8_t checksum(const uint8_t*, unsigned int)', declared with attribute 'nodiscard' [-Wunused-result]
    7 |     checksum(packet, 4);      // result thrown away
      |     ~~~~~~~~^~~~~~~~~~~
```

Put `[[nodiscard]]` on anything whose whole purpose is its return value: a checksum, a status code, a validity check. Add `-Werror`, which turns every warning into an error, and "forgot to check the result" becomes a failed build.

## Overloading

Several functions may share a name if their *parameter lists* differ. For each call, the compiler does four things:

1. It collects every function with that name — the **candidates**.
2. It throws out the ones that cannot accept these arguments at all.
3. It ranks the rest by how much converting each argument needs.
4. It takes the best. If two tie for best, it stops with an error.

Here are three functions called `norm` — the length of something:

```cpp
#include <cmath>
#include <cstdio>

struct Vec3 { double x, y, z; };

double norm(double x)           { return std::fabs(x); }
double norm(double x, double y) { return std::sqrt(x * x + y * y); }
double norm(const Vec3& v)      { return std::sqrt(v.x * v.x + v.y * v.y + v.z * v.z); }

int main() {
    std::printf("norm(-3.0)          = %.4f\n", norm(-3.0));
    std::printf("norm(3.0, 4.0)      = %.4f\n", norm(3.0, 4.0));
    std::printf("norm(Vec3{1,2,2})   = %.4f\n", norm(Vec3{1, 2, 2}));
}
```

```text
norm(-3.0)          = 3.0000
norm(3.0, 4.0)      = 5.0000
norm(Vec3{1,2,2})   = 3.0000
```

One argument of type `double` picks the first; two picks the second; a `Vec3` picks the third. Check the answers. `std::fabs` is absolute value, so $|-3| = 3$. The second is Pythagoras: $\sqrt{3^2 + 4^2} = \sqrt{25} = 5$. The third is the same in three dimensions: $\sqrt{1^2 + 2^2 + 2^2} = \sqrt{9} = 3$.

### How the compiler ranks candidates

Think of it as a **[[ladder of conversions|ranking-ladder]]**. The fewer rungs an argument has to climb to fit a parameter, the better. From best to worst:

1. **Exact match** — including tiny adjustments like letting a `Vec3` be seen through a `const Vec3&`.
2. **Promotion** — a small type widened to its natural bigger version: `float` to `double`, or the integer promotions from lesson 05.
3. **Standard conversion** — any other built-in conversion: `int` to `double`, `double` to `int`, `int` to `long`.
4. **User-defined conversion** — a conversion you wrote yourself, through a constructor (lesson 10).

A call is **ambiguous** when two candidates need conversions of the same rank and neither is better. Here is one:

```cpp
void log_value(double v);
void log_value(long v);

int main() {
    log_value(3);          // int: converts to double or to long, neither is better
}
```

```text
a1.cpp:5:14: error: call of overloaded 'log_value(int)' is ambiguous
    5 |     log_value(3);          // int: converts to double or to long, neither is better
      |     ~~~~~~~~~^~~
a1.cpp:1:6: note: candidate: 'void log_value(double)'
a1.cpp:2:6: note: candidate: 'void log_value(long int)'
```

`3` is an `int`. Turning it into a `double` is a standard conversion. Turning it into a `long` is also a standard conversion. Same rung, so neither wins. The error is the *good* outcome: the alternative would be a silent choice you never meant. Fix it by adding an `int` version, or by making the call exact — `log_value(3.0)`.

### What cannot tell overloads apart

**The return type.** The compiler picks a function before it looks at what you do with the answer, so the return type gives it nothing to choose with. Two functions that differ only in return type are rejected on sight:

```cpp
double measure();
int    measure();          // differs only in return type
```

```text
a2.cpp:2:8: error: ambiguating new declaration of 'int measure()'
    2 | int    measure();          // differs only in return type
      |        ^~~~~~~
a2.cpp:1:8: note: old declaration 'double measure()'
```

**Top-level `const` on a by-value parameter.** As lesson 07 showed, `const int` and `int` parameters are the same parameter type, because the function gets a copy either way. Writing both is not an overload. It is the same function defined twice:

```text
a3.cpp:2:6: error: redefinition of 'void set_rate(int)'
    2 | void set_rate(const int hz) {}   // top-level const does not distinguish
      |      ^~~~~~~~
a3.cpp:1:6: note: 'void set_rate(int)' previously defined here
```

**By value versus by `const` reference.** These *are* different parameter types, so declaring both is legal. But no call can ever choose between them, because handing an argument to either is an exact match:

```cpp
struct Vec3 { double x, y, z; };

double norm(Vec3 v)        { return v.x; }
double norm(const Vec3& v) { return v.x; }

int main() {
    Vec3 v{1, 2, 2};
    return static_cast<int>(norm(v));
}
```

```text
b1.cpp:8:33: error: call of overloaded 'norm(Vec3&)' is ambiguous
b1.cpp:3:8: note: candidate: 'double norm(Vec3)'
b1.cpp:4:8: note: candidate: 'double norm(const Vec3&)'
```

Pick one. Lesson 06's table tells you which.

::: key
Overloads are distinguished by parameter types only. The return type does not participate, and neither does top-level `const` on a by-value parameter. `T` and `const T&` are different declarations but produce an ambiguous call, so a function should have one or the other.
:::

::: example An overload set for saturating a command
Before a thruster command reaches the hardware it must be **[[saturated|saturation]]** — clamped so it never asks for more than the hardware can give. The same idea applies to a single throttle number and to a three-axis torque.

```cpp
#include <cstdio>
struct Vec3 { double x, y, z; };

double saturate(double u, double u_max) {
    if (u >  u_max) return  u_max;
    if (u < -u_max) return -u_max;
    return u;
}

Vec3 saturate(const Vec3& u, double u_max) {
    return Vec3{saturate(u.x, u_max), saturate(u.y, u_max), saturate(u.z, u_max)};
}
int main() {
    std::printf("saturate(1.4, 1.0)              = %.4f\n", saturate(1.4, 1.0));
    std::printf("saturate(-2.5, 1.0)             = %.4f\n", saturate(-2.5, 1.0));
    Vec3 v = saturate(Vec3{0.3, 1.4, -2.0}, 1.0);
    std::printf("saturate(Vec3{0.3,1.4,-2.0}, 1) = (%.4f, %.4f, %.4f)\n", v.x, v.y, v.z);
}
```

```text
saturate(1.4, 1.0)              = 1.0000
saturate(-2.5, 1.0)             = -1.0000
saturate(Vec3{0.3,1.4,-2.0}, 1) = (0.3000, 1.0000, -1.0000)
```

Walk through the vector case one part at a time. $0.3$ sits between $-1$ and $1$, so it passes unchanged. $1.4$ is above $1$, so it becomes $1$. $-2.0$ is below $-1$, so it becomes $-1$. Every output lies between $-1$ and $1$, as it must.

Two things make this a *good* overload set. First, both functions mean the same thing — clamp each part — on different types, so a reader who knows one knows the other. Second, the vector version is written using the number version, so the clamping rule lives in one place.

The trap is overloading things that do different jobs. A `process(double)` that filters and a `process(int)` that logs share nothing but a name, and a reader at the call site cannot tell which runs without checking the argument's type. Overload when the operation is the same. Use different names when it is not.
:::

## Default arguments

A **default argument** supplies a value for a parameter at the end of the list when the caller leaves it out:

```cpp
void step(double dt_s = 0.01);

step();       // step(0.01)
step(0.02);   // step(0.02)
```

(`dt_s` is a name habit: a time step, `dt`, in seconds, `_s`.) The compiler enforces four rules.

**Defaults go at the end.** Once a parameter has a default, every parameter after it needs one too. Otherwise there would be no way to leave out the first and still give the second:

```text
a4.cpp:1:36: error: default argument missing for parameter 2 of 'void step(double, double)'
    1 | void step(double dt = 0.01, double gain);   // default must be trailing
      |                             ~~~~~~~^~~~
a4.cpp:1:18: note: ...following parameter 1 which has a default argument
```

**A default is given once.** Put it in the header's declaration, not in the definition. If both have it — even with the same value — the build fails:

```text
a5.cpp:2:6: error: default argument given for parameter 1 of 'void step(double)'
    2 | void step(double dt = 0.02);    // default given twice
      |      ^~~~
a5.cpp:1:6: note: previous specification in 'void step(double)' here
```

**A default belongs to a declaration, not to the function.** A file that includes the header sees the default. A file that writes its own declaration without one does not. Keep the default in one place — the header everyone includes — or callers in different files will disagree about what "left out" means.

**A default plus an overload is usually an ambiguity.**

```cpp
void step(double dt = 0.01);
void step();

int main() { step(); }
```

```text
a6.cpp:4:18: error: call of overloaded 'step()' is ambiguous
a6.cpp:1:6: note: candidate: 'void step(double)'
a6.cpp:2:6: note: candidate: 'void step()'
```

`step()` fits the first by using the default, and fits the second exactly. Both are perfect, so neither wins. Choose one mechanism: a default argument, or an overload that passes the value on.

### The Python contrast worth remembering

In Python, a default is worked out **once**, when the `def` line runs. That is why this is a classic bug:

```python
def log_sample(value, history=[]):    # evaluated once, at definition time
    history.append(value)
    return history

print(log_sample(1.0))
print(log_sample(2.0))
print(log_sample(3.0))
```

```text
[1.0]
[1.0, 2.0]
[1.0, 2.0, 3.0]
```

There is **[[one list|python-default-list]]**, shared by every call that leaves the argument out, and it keeps growing.

In C++ a default argument is an expression worked out **again at every call** that leaves it out. Here the default is a function call, so you can watch it run each time:

```cpp
#include <cstdio>

int next_seq() {
    static int seq = 0;         // one object, initialised once
    return ++seq;
}

// The default argument is an expression, re-evaluated at every call that omits it.
void log_sample(double value, int seq = next_seq()) {
    std::printf("seq=%d value=%.1f\n", seq, value);
}

int main() {
    log_sample(1.0);
    log_sample(2.0);
    log_sample(3.0);
    log_sample(4.0, 99);
    log_sample(5.0);
    return 0;
}
```

```text
seq=1 value=1.0
seq=2 value=2.0
seq=3 value=3.0
seq=99 value=4.0
seq=4 value=5.0
```

(`seq` is a **[[static local|static-local]]**: one variable that survives between calls. `++seq` — read "plus-plus seq" — adds one and hands back the new value.)

The sequence number goes up on every call that uses the default. On the call that supplies `99`, `next_seq()` never runs, so the next default is 4, not 5. Python's shared-list trap cannot happen in C++. The price is the opposite problem: a default that calls a function is a call the reader cannot see at the call site. That is a good reason to keep defaults to plain constants.

::: warning A default is baked into each caller
A default argument is part of the *declaration the caller sees*, so it is copied into each call at compile time. Change `0.01` to `0.005` in the header, and any file that is not recompiled keeps calling with the old value. That is the stale-object-file problem from lesson 03 again — but now it produces a wrong number instead of a link error. It is one more reason the `-MMD -MP` dependency flags are not optional.
:::

::: example A controller step with sensible defaults
A **[[PID controller|pid-terms]]** turns an error — how far you are from where you want to be — into a command. One step of it needs gains, the error, some remembered state, and a time step. Two of those rarely change.

```cpp
struct Gains { double kp, ki, kd; };

// Declared in the header, with the defaults here and nowhere else.
double pid_step(const Gains& g, double error, double& integral,
                double& prev_error, double dt_s = 0.01, double i_limit = 1.0);
```

```cpp
// Defined in the .cpp, with no repeated defaults.
double pid_step(const Gains& g, double error, double& integral,
                double& prev_error, double dt_s, double i_limit) {
    integral += error * dt_s;
    if (integral >  i_limit) integral =  i_limit;
    if (integral < -i_limit) integral = -i_limit;
    const double derivative = (error - prev_error) / dt_s;
    prev_error = error;
    return g.kp * error + g.ki * integral + g.kd * derivative;
}
```

Take $k_p = 2.0$, $k_i = 0.5$, $k_d = 0.1$ (read "k sub p", and so on: the three gains). Call it first with error $e = 1.0$, no history, and the default $\Delta t = 0.01\,\mathrm{s}$ (read "delta t", the time step). Step one, the running total of error, $I$: add error times time step. Step two, the rate of change, $D$: the change in error divided by the time step. Step three, weight and add:

$$
I = 0 + 1.0 \times 0.01 = 0.01, \qquad
D = (1.0 - 0)/0.01 = 100, \qquad
u = 2 \times 1.0 + 0.5 \times 0.01 + 0.1 \times 100 = 12.005.
$$

```text
u1 = 12.005000   integral = 0.010000
u2 = -0.391000   integral = 0.018000
```

The second call has $e = 0.8$. Then $I = 0.01 + 0.8 \times 0.01 = 0.018$ and $D = (0.8 - 1.0)/0.01 = -20$, so $u = 1.6 + 0.009 - 2.0 = -0.391$. The error is still positive, but it is shrinking fast, so the derivative term wins and flips the command's sign. Both printed values match the hand sums.

Now read the signature as a reviewer would. `const Gains&` says the gains are read, not changed. `double& integral` and `double& prev_error` are non-const references: that is the signature announcing that this function keeps state, that the *caller* owns that state, and that two controllers cannot accidentally share it. And the defaults sit in the header, once, so `pid_step(g, e, I, ep)` at a call site means "the 100 Hz loop" — $1 / 0.01\,\mathrm{s} = 100$ steps a second — without anyone looking anything up.

That $D = 100$ on the very first call is the well-known **derivative kick**. Real controllers avoid it by filtering the derivative, or by taking it from the measurement instead of the error. The code above does exactly what the arithmetic says; whether it is a *good* controller is the classical-control module's question.
:::

## Check yourself

::: check
With `void log_value(double); void log_value(long);`, the call `log_value(3)` is ambiguous but `log_value(3.0)` is not. Explain both, and give two different fixes for the first.
:::

::: answer
`3` is an `int`. Turning `int` into `double` and turning `int` into `long` are both standard conversions — the same rung — so neither candidate is better and the compiler refuses to guess.

`3.0` is a `double`. It matches `log_value(double)` exactly, and an exact match beats the `double`-to-`long` conversion the other candidate would need. So there is one clear winner.

Fix one: add `void log_value(int);`, so the call has an exact match. Fix two: make the call itself exact, `log_value(3.0)` or `log_value(3L)` (the `L` makes the literal a `long`). The first fix is better if many callers pass whole numbers; the second if this call is the odd one out.
:::

::: check
Why is `double area(); int area();` rejected, when `double norm(double); double norm(const Vec3&);` is accepted?
:::

::: answer
The compiler picks a function using only the arguments at the call. Two functions that differ only in return type give it nothing to choose with: `area()` would fit both equally. So C++ forbids the pair outright rather than waiting for an ambiguous call. g++ calls it an "ambiguating new declaration".

The `norm` pair differs in parameter types, which is exactly the information the compiler has at a call. Each call picks one without doubt.
:::

::: check
A header declares `void step(double dt = 0.01);` and the `.cpp` defines `void step(double dt = 0.01) { ... }`. What happens, and why is the rule what it is?
:::

::: answer
The build fails: "default argument given for parameter 1 of 'void step(double)'", with a note pointing at the header's declaration. It fails even though both say `0.01`.

A default belongs to a declaration, not to the function. If two declarations could both supply one, what a left-out argument means would depend on which declaration a caller happened to see. So a default may be given only once. Put it in the header, where every caller sees it, and write only the parameter's type and name in the definition.
:::

::: check
Python's `def f(x, history=[])` keeps growing across calls; the C++ equivalent does not. State the rule in each language, and say which one you would rather have in flight software.
:::

::: answer
Python works out a default once, when the `def` line runs, and stores that object with the function. Every call that leaves the argument out shares that one object, so a list default keeps growing.

C++ treats a default argument as an expression worked out again on every call that leaves it out. There is no stored object to grow.

The C++ rule is the one you want in flight software, because it removes hidden state: a function's behaviour depends only on its arguments and whatever state it names openly. The C++ hazard is the opposite one — a default that calls a function has a cost and a side effect that are invisible at the call site — which is why defaults should be plain constants.
:::

::: check
`[[nodiscard]] std::uint8_t checksum(...)`, and a call that ignores the result, gives a warning, not an error. Why might a flight-software project care enough to make it an error, and what would you put the attribute on?
:::

::: answer
A function whose only effect is its return value, called and then ignored, is either dead code or a missing check. A missing checksum comparison is exactly the defect that lets a corrupted packet through.

As a warning it scrolls past in a build log. With `-Werror` it stops the build, which is the only enforcement that survives a busy week.

Put `[[nodiscard]]` on anything whose result is the point: checksums, validity and range checks, status codes, and functions that create something the caller must keep. Leave it off functions called for what they *do*, where ignoring the result is normal.
:::

## Summary

| Item | Rule |
| --- | --- |
| Overload set | same name, different parameter types; chosen at compile time from the argument types |
| Ranking | exact match, then promotion, then standard conversion, then user-defined conversion |
| Ambiguity | two candidates on the same rung; a compile error listing the candidates |
| Return type | takes no part in choosing an overload |
| Top-level `const` on a by-value parameter | does not make a different overload; writing both is a redefinition |
| `T` versus `const T&` | both declarations are legal, but every call is ambiguous — pick one |
| Default arguments | go at the end; given once, in the header's declaration |
| When a default is worked out | again at every call that leaves it out (Python: once, at `def`) |
| Default plus overload | usually ambiguous; use one mechanism |
| `[[nodiscard]]` | warns when the result is ignored; an error with `-Werror` |
| `-Wreturn-type` | catches a non-`void` function that falls off the end |
| `->` after the parameters | a trailing return type, read "returns" |

Lesson 09 puts all of this to work on the containers you will pass to functions most often: raw arrays, `std::array` and `std::vector` — and why the first one forgets its own size the moment it crosses into a function.

::: context name-mangling How the linker tells three norms apart
The linker, which joins object files together, only understands plain symbol names, and it would reject three functions all called `norm`. So the compiler **mangles** each name: it adds a code for the parameter types. These are the real symbols g++ produced for the three `norm` functions, as `nm` lists them:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" font-family="monospace">
    <text x="10" y="35">norm(double)</text>
    <text x="10" y="70">norm(double, double)</text>
    <text x="10" y="105">norm(Vec3 const&amp;)</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="170" y1="31" x2="214" y2="31"/>
    <line x1="170" y1="66" x2="214" y2="66"/>
    <line x1="170" y1="101" x2="214" y2="101"/>
  </g>
  <g fill="#6c7a93">
    <polygon points="220,31 212,27 212,35"/>
    <polygon points="220,66 212,62 212,70"/>
    <polygon points="220,101 212,97 212,105"/>
  </g>
  <g font-size="12" fill="#1d6fd1" font-family="monospace">
    <text x="226" y="35">_Z4normd</text>
    <text x="226" y="70">_Z4normdd</text>
    <text x="226" y="105">_Z4normRK4Vec3</text>
  </g>
  <text x="10" y="12" font-size="11" fill="#6c7a93">source</text>
  <text x="226" y="12" font-size="11" fill="#6c7a93">symbol in the object file</text>
</svg>
```

`4norm` is the name with its length, `d` means `double`, and `RK4Vec3` means "reference to const `Vec3`". No part of the code stands for the return type, which is one more reason the return type cannot tell overloads apart.
:::

::: context main-exception The one function allowed to fall off the end
There is exactly one exception to the rule. If `main` reaches its closing brace without a `return`, C++ acts as if it ended with `return 0;`, and 0 tells the operating system "success". Every other non-`void` function that falls off the end is undefined behaviour.

Lesson examples often still write `return 0;` in `main`. It is not required, but it makes the program's exit status visible to the reader.
:::

::: context attributes Notes to the compiler in double brackets
An **attribute** is extra information for the compiler, written inside double square brackets. It does not change what correct code means; it helps the compiler warn you or optimize. C++11 introduced the syntax, and `[[nodiscard]]` arrived in C++17.

Others you will meet: `[[maybe_unused]]` quiets the "unused variable" warning for something you keep on purpose, `[[fallthrough]]` marks a `switch` case that is meant to run into the next one, and `[[deprecated]]` warns anyone who still calls an old function. A compiler ignores an attribute it does not recognise, usually with a warning.
:::

::: context ranking-ladder Fewer rungs wins
With one argument, the candidate whose conversion sits lowest on the ladder wins. With several arguments, the winner must be at least as good as every rival for every argument, and better for at least one. For `log_value(3)`, both candidates need a step to the same rung, so they tie.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="15" x2="40" y2="160" stroke="#1f2a44" stroke-width="2"/>
  <line x1="110" y1="15" x2="110" y2="160" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="40" y1="30" x2="110" y2="30"/>
    <line x1="40" y1="65" x2="110" y2="65"/>
    <line x1="40" y1="100" x2="110" y2="100"/>
    <line x1="40" y1="135" x2="110" y2="135"/>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="122" y="34">1 exact match (best)</text>
    <text x="122" y="69">2 promotion: float to double</text>
    <text x="122" y="104">3 standard conversion</text>
    <text x="122" y="139">4 user-defined conversion</text>
  </g>
  <g font-size="11" fill="#b4232c">
    <text x="122" y="118">int to double, int to long: a tie</text>
  </g>
</svg>
```

A promotion beats a standard conversion, so `f(1.0F)` with a choice of `f(double)` and `f(int)` picks `f(double)`.
:::

::: context saturation When the hardware runs out
Every actuator has a limit. A reaction wheel can only spin up so fast, a thruster valve can only open so far, and an engine gimbal can only swing a few degrees. When the controller asks for more than that, the actuator is **saturated**: it delivers its maximum and no more.

Flight code clamps commands on purpose, before they reach the hardware, so the software knows exactly what was really commanded. Knowing that matters: the integral part of a controller keeps growing while the actuator is pinned at its limit — called *windup* — which is why `pid_step` clamps its integral to `i_limit` too.
:::

::: context python-default-list Why Python shares one list
In Python, `def` is a statement that runs once. When it runs, it works out each default and stores the resulting object on the function itself, in `log_sample.__defaults__`. Every call that leaves `history` out gets that same stored list, and `append` changes it in place.

The Python habit that avoids it is `history=None`, followed by `if history is None: history = []` inside the body. That creates a fresh list on every call — which is exactly what C++ does for you automatically.
:::

::: context static-local A local that remembers
A normal local variable is created each time its function is called and destroyed when the call ends. A `static` local is different. It is set up once — at the latest, the first time a call reaches it — and then it lives until the program ends, keeping its value between calls.

That is how `next_seq` can count: `seq` is still there, holding 3, when the fourth call arrives. Lesson 11 explains the three places objects can live — the stack, the heap and static storage — and a `static` local lives in the third.
:::

::: context pid-terms Three parts of one command
PID stands for **proportional, integral, derivative**. The proportional part pushes in proportion to the error now. The integral part pushes against error that has lasted a while. The derivative part pushes against how fast the error is changing. Here are the three parts of each command from the example, and their sums:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="350" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="90" width="30" height="20" fill="#1d6fd1"/>
  <rect x="75" y="109.9" width="30" height="0.1" fill="#f2b880" stroke="#f2b880" stroke-width="1"/>
  <rect x="110" y="10" width="30" height="100" fill="#b4232c"/>
  <rect x="200" y="94" width="30" height="16" fill="#1d6fd1"/>
  <rect x="235" y="109.9" width="30" height="0.1" fill="#f2b880" stroke="#f2b880" stroke-width="1"/>
  <rect x="270" y="110" width="30" height="20" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="55" y="84">2.0</text><text x="90" y="100">0.005</text><text x="125" y="125">10.0</text>
    <text x="215" y="88">1.6</text><text x="250" y="100">0.009</text><text x="285" y="144">−2.0</text>
    <text x="55" y="125">P</text><text x="90" y="125">I</text>
    <text x="215" y="125">P</text><text x="250" y="125">I</text><text x="285" y="104">D</text>
    <text x="90" y="165">call 1: u = 12.005</text>
    <text x="250" y="165">call 2: u = −0.391</text>
  </g>
  <text x="125" y="22" font-size="11" fill="#ffffff" text-anchor="middle">D</text>
</svg>
```

Bars are drawn to scale, 10 px per unit. On the first call the derivative kick is five times the proportional part.
:::
