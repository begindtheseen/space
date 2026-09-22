---
id: l08-functions-overloading-default-arguments
title: Functions, overloading and default arguments
minutes: 17
covers:
  - Functions, overloading, default arguments
---

A Python function is an object with a name bound to it, and a call is a lookup at run time: the interpreter finds whatever `norm` currently refers to and calls it with whatever you passed. A C++ function has no run-time identity of that kind. The compiler decides, while compiling the call, exactly which function you meant, using only the types of the arguments — and it encodes that choice into the object file as a mangled symbol, as lesson 01 showed.

That shift has two visible consequences. You can have several functions with the same name and different parameters, and the compiler will choose between them: *overloading*. And when the choice is not clear, you do not get a run-time error at the moment of the call — you get a compile error listing the candidates, which is a much better place to find out.

Default arguments look like Python's and are not. They are part of a declaration rather than part of the function, and they are re-evaluated at every call rather than once when the function is defined, which turns Python's most notorious footgun into a non-issue and introduces a different one.

## The shape of a function

```cpp
double norm(const Vec3& v);                       // declaration
double norm(const Vec3& v) {                      // definition
    return std::sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}
```

Return type, name, parameter list, body. A function that returns nothing is declared `void`. Unlike Python, the return type is part of the contract and the compiler checks every `return` against it, and a non-`void` function that falls off the end without returning is undefined behaviour — `-Wall` catches it with `-Wreturn-type`.

Two modern spellings worth knowing. A trailing return type, `auto norm(const Vec3& v) -> double;`, means the same thing and is useful when the return type depends on the parameters. And `[[nodiscard]]` on a declaration tells the compiler that ignoring the result is probably a mistake:

```cpp
[[nodiscard]] std::uint8_t checksum(const std::uint8_t* p, unsigned n);
```

```text
b2.cpp:7:13: warning: ignoring return value of 'uint8_t checksum(const uint8_t*, unsigned int)', declared with attribute 'nodiscard' [-Wunused-result]
    7 |     checksum(packet, 4);      // result thrown away
      |     ~~~~~~~~^~~~~~~~~~~
```

Put `[[nodiscard]]` on anything whose entire purpose is its return value — a checksum, a status code, a validity check. Combined with `-Werror` it makes "forgot to check the return" a build failure.

## Overloading

Several functions may share a name if their *parameter lists* differ. The compiler builds the set of candidates, discards the ones that cannot accept the arguments, ranks the rest, and takes the best.

```cpp
struct Vec3 { double x, y, z; };

double norm(double x)           { return std::fabs(x); }
double norm(double x, double y) { return std::sqrt(x * x + y * y); }
double norm(const Vec3& v)      { return std::sqrt(v.x * v.x + v.y * v.y + v.z * v.z); }
```

```text
norm(-3.0)          = 3.0000
norm(3.0, 4.0)      = 5.0000
norm(Vec3{1,2,2})   = 3.0000
```

Check the last: $\sqrt{1^2 + 2^2 + 2^2} = \sqrt{9} = 3$.

The ranking, simplified to what you need, goes from best to worst:

1. **Exact match** — including a trivial adjustment like binding a `Vec3` to a `const Vec3&`.
2. **Promotion** — `float` to `double`, or the integral promotions from lesson 05.
3. **Standard conversion** — `int` to `double`, `double` to `int`, a derived pointer to a base pointer.
4. **User-defined conversion** — via a converting constructor.

A call is ambiguous when two candidates need conversions of the same rank and neither is better.

```cpp
void log_value(double v);
void log_value(long v);

log_value(3);     // an int
```

```text
a1.cpp:5:14: error: call of overloaded 'log_value(int)' is ambiguous
    5 |     log_value(3);          // int: converts to double or to long, neither is better
      |     ~~~~~~~~~^~~
a1.cpp:1:6: note: candidate: 'void log_value(double)'
a1.cpp:2:6: note: candidate: 'void log_value(long int)'
```

`int` to `double` and `int` to `long` are both standard conversions, so neither wins. The error is the good outcome: the alternative would be a silent choice you did not intend. Fix it by adding an `int` overload, or by making the call exact — `log_value(3.0)`.

### What cannot distinguish an overload

**The return type.** Overload resolution happens before the result is used, so the return type carries no information for choosing.

```text
a2.cpp:2:8: error: ambiguating new declaration of 'int measure()'
    2 | int    measure();          // differs only in return type
      |        ^~~~~~~
a2.cpp:1:8: note: old declaration 'double measure()'
```

**Top-level `const` on a by-value parameter.** As lesson 07 noted, `const int` and `int` parameters are the same parameter type, because the argument is a copy either way. Declaring both is not an overload, it is a redefinition:

```text
a3.cpp:2:6: error: redefinition of 'void set_rate(int)'
    2 | void set_rate(const int hz) {}   // top-level const does not distinguish
      |      ^~~~~~~~
a3.cpp:1:6: note: 'void set_rate(int)' previously defined here
```

**Value versus `const` reference.** These *are* different parameter types, so the declarations are legal — but no call can choose between them, because binding an argument to either is an exact match:

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
A thruster command must be limited before it reaches the hardware, and the same idea applies to a scalar throttle, an axis pair and a full three-axis torque.

```cpp
struct Vec3 { double x, y, z; };

double saturate(double u, double u_max) {
    if (u >  u_max) return  u_max;
    if (u < -u_max) return -u_max;
    return u;
}

Vec3 saturate(const Vec3& u, double u_max) {
    return Vec3{saturate(u.x, u_max), saturate(u.y, u_max), saturate(u.z, u_max)};
}
```

```text
saturate(1.4, 1.0)              = 1.0000
saturate(-2.5, 1.0)             = -1.0000
saturate(Vec3{0.3,1.4,-2.0}, 1) = (0.3000, 1.0000, -1.0000)
```

Two things make this a good overload set rather than a bad one. The two functions mean the *same thing* on different types — per-component saturation — so a reader who knows one knows the other. And the vector version is written in terms of the scalar version, so there is one definition of the behaviour and one place to change it.

The failure mode to avoid is overloading on unrelated meanings: a `process(double)` that filters and a `process(int)` that logs share nothing but a name, and the reader at the call site cannot tell which is which without checking the argument's type. Overload when the operation is the same; use different names when it is not.
:::

## Default arguments

A default argument supplies a value for a trailing parameter the caller omits.

```cpp
void step(double dt_s = 0.01);

step();       // step(0.01)
step(0.02);   // step(0.02)
```

Four rules, each of which the compiler enforces.

**Defaults must be trailing.** Once a parameter has a default, every parameter after it must too:

```text
a4.cpp:1:36: error: default argument missing for parameter 2 of 'void step(double, double)'
    1 | void step(double dt = 0.01, double gain);   // default must be trailing
      |                             ~~~~~~~^~~~
a4.cpp:1:18: note: ...following parameter 1 which has a default argument
```

**A default may be given once.** Put it in the header's declaration, not in the definition — if both have it, the build fails:

```text
a5.cpp:2:6: error: default argument given for parameter 1 of 'void step(double)'
    2 | void step(double dt = 0.02);    // default given twice
      |      ^~~~
a5.cpp:1:6: note: previous specification in 'void step(double)' here
```

**A default belongs to a declaration, not to the function.** A translation unit that includes the header sees the default; one that declares the function itself does not. Keep the default in exactly one place — the header everyone includes — or callers in different files will disagree about what "omitted" means.

**A default plus an overload is usually an ambiguity.**

```cpp
void step(double dt = 0.01);
void step();

step();
```

```text
a6.cpp:4:18: error: call of overloaded 'step()' is ambiguous
a6.cpp:1:6: note: candidate: 'void step(double)'
a6.cpp:2:6: note: candidate: 'void step()'
```

Choose one mechanism: a default argument, or an overload that forwards.

### The Python contrast worth memorising

In Python, a default expression is evaluated **once**, when the `def` runs. That is why this is a classic bug:

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

One list, shared by every call that omits the argument, accumulating forever.

In C++ a default argument is an **expression re-evaluated at every call** that omits it:

```cpp
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

The sequence number advances on every defaulted call and does not advance when the caller supplies one. Python's mutable-default trap cannot happen in C++; the cost is that a default argument with a side effect is a call the reader cannot see at the call site, which is a good reason to keep defaults to plain constants.

::: warning
A default argument is part of the *declaration the caller can see*, so it is baked into each call site at compile time. Change `0.01` to `0.005` in the header and any translation unit that is not recompiled keeps calling with the old value — exactly the stale-object-file hazard from lesson 03, now producing a wrong number rather than a link error. This is another reason `-MMD -MP` is not optional.
:::

::: example A controller step with sensible defaults
A discrete PID step needs a gain set, a measurement, a setpoint and a timestep. Two of those rarely change.

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

With $k_p = 2.0$, $k_i = 0.5$, $k_d = 0.1$, a first call at $e = 1.0$ with zero history and the default $\Delta t = 0.01$ s:

$$
I = 0 + 1.0 \times 0.01 = 0.01, \qquad
D = (1.0 - 0)/0.01 = 100, \qquad
u = 2 \times 1.0 + 0.5 \times 0.01 + 0.1 \times 100 = 12.005.
$$

```text
u1 = 12.005000   integral = 0.010000
u2 = -0.391000   integral = 0.018000
```

The second call, with $e = 0.8$, gives $I = 0.01 + 0.8 \times 0.01 = 0.018$ and $D = (0.8 - 1.0)/0.01 = -20$, so $u = 1.6 + 0.009 - 2.0 = -0.391$: the derivative term dominates and reverses the sign of the command.

Note the design choices that the signature makes visible. `const Gains&` says the gains are read and not modified. `double& integral` and `double& prev_error` are non-const references, which is the signature's way of announcing that this function has state the caller owns — and that two controllers cannot accidentally share it. And the defaults sit in the header, once, so `pid_step(g, e, I, ep)` at a call site means the 100 Hz loop without the reader having to look anything up.

The derivative term of 100 on the very first call is the well-known derivative kick, and it is the reason real implementations either filter the derivative or compute it from the measurement rather than the error. The arithmetic above is exactly what the code does; whether it is a good controller is the classical-control module's question.
:::

## Check yourself

::: check
`void log_value(double); void log_value(long);` and the call `log_value(3)` is ambiguous, but `log_value(3.0)` is not. Explain both, and give two different fixes for the first.
:::

::: answer
`3` is an `int`. Converting `int` to `double` and `int` to `long` are both standard conversions of the same rank, so neither candidate is better and the compiler refuses to guess. `3.0` is a `double`, which matches `log_value(double)` exactly — rank 1 beats the `double`-to-`long` conversion the other candidate would need — so there is a unique best match. Fix one: add `void log_value(int);` so the call has an exact match. Fix two: make the call unambiguous at the call site, `log_value(3.0)` or `log_value(3L)`. The first is better if many callers pass integers; the second if this call is the odd one out.
:::

::: check
Why is `double area(); int area();` rejected, when `double norm(double); double norm(const Vec3&);` is accepted?
:::

::: answer
Overload resolution uses only the arguments at the call site, so two functions that differ only in return type give the compiler nothing to choose with — `area()` would be equally valid for both, and the language forbids the declarations outright rather than waiting for an ambiguous call. g++ calls it an "ambiguating new declaration". The `norm` pair differs in parameter types, which is exactly the information the compiler has at a call, so each call picks one unambiguously.
:::

::: check
A header declares `void step(double dt = 0.01);` and the `.cpp` defines `void step(double dt = 0.01) { ... }`. What happens and why is the rule what it is?
:::

::: answer
The build fails: "default argument given for parameter 1 of 'void step(double)'", with a note pointing at the header's declaration. A default argument may be specified once per parameter per scope, because a default belongs to a declaration rather than to the function, and two declarations that both supply one would leave the meaning of an omitted argument dependent on which declaration a caller happened to see. Put the default in the header, where every caller sees it, and repeat only the parameter's type and name in the definition.
:::

::: check
Python's `def f(x, history=[])` accumulates across calls; the C++ equivalent does not. State the underlying rule in each language, and say which one you would rather have in flight software.
:::

::: answer
Python evaluates a default expression once, when the `def` statement executes, and stores the resulting object on the function; every defaulted call then shares that one object, so a mutable default accumulates. C++ treats a default argument as an expression written at the call site, re-evaluated on every call that omits the argument, so there is no shared object to accumulate into. The C++ rule is the one you want in flight software, because it removes hidden state: a function's behaviour depends only on its arguments and whatever state it explicitly names. The corresponding C++ hazard is the opposite one — a default argument that calls a function has a per-call cost and side effect that is invisible at the call site — which is why defaults should be plain constants.
:::

::: check
`[[nodiscard]] std::uint8_t checksum(...)` and a call that ignores the result produces a warning, not an error. Why might a flight-software project care enough to configure it as an error, and what would you attach the attribute to?
:::

::: answer
A function whose only effect is its return value, called and discarded, is either dead code or a missing check — and a missing checksum comparison is exactly the defect that lets a corrupted packet through. As a warning it scrolls past in a build log; with `-Werror` it stops the build, which is the only enforcement that survives a busy week. Attach `[[nodiscard]]` to anything pure whose result is the point: checksums, validity and range checks, status codes, and factory functions that allocate a resource the caller must keep. Do not attach it to functions called for their side effects, where discarding the result is normal.
:::

## Summary

| Item | Rule |
| --- | --- |
| Overload set | same name, different parameter types; resolved at compile time from argument types |
| Ranking | exact match, then promotion, then standard conversion, then user-defined conversion |
| Ambiguity | two candidates of equal rank; a compile error listing the candidates |
| Return type | does not participate in overload resolution |
| Top-level `const` on a by-value parameter | does not distinguish an overload; declaring both is a redefinition |
| `T` versus `const T&` | legal declarations, but every call is ambiguous — pick one |
| Default arguments | must be trailing; given once, in the header's declaration |
| Default evaluation | re-evaluated at every defaulted call (Python evaluates once, at `def`) |
| Default plus overload | usually ambiguous; use one mechanism |
| `[[nodiscard]]` | warns when the result is ignored; make it an error with `-Werror` |
| `-Wreturn-type` | catches a non-`void` function that falls off the end |

Lesson 09 applies all of this to the containers you will actually pass to functions: raw arrays, `std::array` and `std::vector`, and why the first one loses its size at a function boundary.
