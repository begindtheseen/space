---
id: l04-dependent-names-and-lookup
title: "Dependent names: typename, template, and two-phase lookup"
minutes: 26
covers:
  - typename vs class; dependent names and the typename/template disambiguators
  - Two-phase name lookup
---

Picture a form letter. "Dear ______, your ______ is ready for pickup at ______." A proofreader can check it before any names go in. She can see that "pickup" is spelled right and that every sentence has a verb. What she cannot check yet is anything about the blanks. Is "your ______ is ready" going to read "your telescope is ready" or "your 42 is ready"? That depends on what gets written in, so that part of the check has to wait until each copy is filled in.

A C++ template is that form letter, and the compiler is that proofreader. It reads every template twice. Once when it meets the template's definition, with the blanks still blank. Then again for each set of real types you use it with, like `std::vector<double>` or `Matrix<float, 3, 3>`. Anything in the template that depends on a blank can only be checked the second time. And that raises a strange problem: while the blanks are still blank, the compiler sometimes cannot even tell what *kind* of thing a word is. Is `T::value_type` a type or a number? Is the `<` after a name a less-than sign or the start of a template argument list?

This lesson is about those moments: where C++ needs your help (the keywords `typename` and `template`, in a new job), how the two readings are split (**two-phase name lookup**), and the famous trap that comes out of it, a class template that cannot see its own base class's members. Anyone writing a generic filter or telemetry decoder meets these errors in the first week. Each has a short, exact fix.

## typename and class in the parameter list

In the last three lessons you wrote `template <typename T>`. You will also see code that writes `template <class T>`. In a template's parameter list, the two words mean exactly the same thing: "`T` is a **[[type parameter|type-parameter]]**", a blank that will be filled with a type.

```cpp
template <typename T> T twice(T x) { return x + x; }   // these two lines
template <class T>    T half(T x)  { return x / 2; }   // declare the same kind of parameter
```

The word `class` here does *not* mean "`T` must be a class". `half<double>` is fine, and `double` is not a class. It is only a word the language already had, reused so that templates did not need a new keyword. `typename` was added a little later, while C++ was being standardized. Style guides pick one and stick to it; the compiler does not care.

::: key
In a template parameter list, `typename` and `class` are interchangeable: `template <typename T>` and `template <class T>` declare the same type parameter. The keyword `class` does not require `T` to be a class.
:::

The keyword `typename` has a *second* job, somewhere else entirely, and that second job is where the real rule lives.

## Dependent names: is it a type or a value?

A **dependent name** is a name whose meaning depends on a template parameter. Inside `template <typename Container>`, the name `Container::value_type` is dependent. Read it aloud as "Container's value type", the way you would say "the car's color". What it refers to depends on what `Container` turns out to be. The `::` (read "colon colon", the **scope operator**) means "the thing called `value_type` inside `Container`".

For `std::vector<double>`, `value_type` is a type, `double`. But another class could have a static data member, a plain number, with the same name. So on the first reading, `Container::value_type` could be a type, a value, or even a function, and the compiler must decide *now*, because the meaning changes how the whole line is read.

Here is a line that has two completely different meanings:

```cpp
T::value_type * x;
```

If `T::value_type` is a type, this line declares `x` as a pointer to that type. If it is a value, the line multiplies that value by `x` and throws the answer away. Same characters, two different programs. The compiler must choose one before it knows `T`.

The rule C++ chose is this: **a dependent qualified name is assumed to name a value, unless you say it is a type.** You say it with the keyword `typename` in front:

```cpp
typename T::value_type* p;   // "typename": p is a pointer to T's value type
```

Read `typename T::value_type` aloud as "the type T's value type". Used this way, `typename` is called a **disambiguator**: a word that removes an ambiguity for the parser.

::: example A value that is really a value
This little program uses the default reading on purpose. `Gain` has a static member that happens to be *called* `value_type`, and it is a number.

```cpp
#include <cstdio>

struct Gain { static constexpr int value_type = 3; };   // a *value* that happens to be called value_type

int x = 2;

template <typename T>
int scaled() {
    return T::value_type * x;     // read as: (T's value_type) times x
}

int main() { std::printf("%d\n", scaled<Gain>()); }
```

Compiled with `g++ -std=c++20 -Wall -Wextra -O2`, it prints:

```
6
```

Step by step: the compiler reads `scaled` with `T` still blank. It sees `T::value_type`, which is dependent, and applies the default: a value. So `T::value_type * x` is a multiplication. When `main` asks for `scaled<Gain>`, `T::value_type` becomes `Gain::value_type`, which is `3`, and `x` is `2`. So the answer is $3 \times 2 = 6$. Sanity check: the default reading and the real meaning agree here, so it compiles. Now watch them disagree.
:::

### What forgetting typename looks like

This template adds up any container and wants a local variable of the container's element type:

```cpp
#include <vector>
template <typename Container>
auto sum(const Container& c) {
    Container::value_type total{};
    for (const auto& x : c) total += x;
    return total;
}
int main() { std::vector<double> v{1.5, 2.5}; return static_cast<int>(sum(v)); }
```

g++ 13 complains during the first reading, before it looks at the `std::vector`, and once more when it instantiates `sum` (the list is shortened here):

```
a1.cpp: In function 'auto sum(const Container&)':
a1.cpp:4:5: error: need 'typename' before 'Container::value_type' because 'Container' is a dependent scope
    4 |     Container::value_type total{};
      |     ^~~~~~~~~
a1.cpp:4:26: error: expected ';' before 'total'
...
a1.cpp:4:16: error: dependent-name 'Container::value_type' is parsed as a non-type, but instantiation yields a type
a1.cpp:4:16: note: say 'typename Container::value_type' if a type is meant
```

Read the first line and the last note together. g++ tells you exactly what it assumed ("parsed as a non-type") and what it found when it filled in the blank ("instantiation yields a type"). A **dependent scope** is g++'s phrase for "a class that depends on a template parameter". The fix is the one word it asks for.

::: example Adding up readings of any container
```cpp
#include <array>
#include <cstdio>
#include <vector>

// Adds up any container of numbers and returns the total in the element's own type.
template <typename Container>
typename Container::value_type sum(const Container& c) {
    typename Container::value_type total{};   // "typename": this name is a type
    for (const auto& x : c) total += x;
    return total;
}

// C++20: in a few places only a type can appear, so typename may be left out.
template <typename Container>
struct Stats {
    using value_type = Container::value_type;   // alias declaration: OK without typename in C++20
    value_type mean(const Container& c) const {
        return sum(c) / static_cast<value_type>(c.size());
    }
};

int main() {
    std::vector<double> gyro_z{0.012, 0.015, 0.009, 0.014};   // rad/s
    std::array<int, 3> counts{120, 118, 125};                  // ADC counts
    std::printf("sum of gyro_z  = %.3f rad/s\n", sum(gyro_z));
    std::printf("sum of counts  = %d\n", sum(counts));
    std::printf("mean of gyro_z = %.4f rad/s\n", Stats<std::vector<double>>{}.mean(gyro_z));
}
```

Output with `g++ -std=c++20 -Wall -Wextra -O2`:

```
sum of gyro_z  = 0.050 rad/s
sum of counts  = 363
mean of gyro_z = 0.0125 rad/s
```

Walk through it. For `gyro_z`, `Container` is `std::vector<double>`, so `typename Container::value_type` is `double`, `total` starts at `0.0`, and the loop adds $0.012 + 0.015 + 0.009 + 0.014 = 0.050$. For `counts`, `Container` is `std::array<int, 3>`, the value type is `int`, and $120 + 118 + 125 = 363$. The mean is $0.050 / 4 = 0.0125\,\mathrm{rad/s}$. Sanity check: the sum of four readings near $0.0125$ should be near $0.05$, and it is.

Notice the return type also says `typename Container::value_type`. One template, two containers, two element types, one generic routine.
:::

### C++20 made the rule gentler, not gone

In some places only a type could possibly appear: after `using value_type =`, nothing but a type makes sense. Since C++20 the compiler assumes a type there, so you may leave `typename` out. That is why the `Stats` line compiles with `-std=c++20`; with `-std=c++17`, g++ says `need 'typename' before 'Container::value_type'` on that line.

The relaxed places include an alias declaration (`using X = T::type;`), the return type of a function declared at namespace scope, and the target of a cast like `static_cast<T::value_type>(...)`. Inside a function body, as in the `total` line, you still need it. The safe habit: write `typename` whenever you mean a dependent type. The C++20 change is **[[a convenience|down-with-typename]]**, not a new rule.

::: key
Inside a template, a name that depends on a template parameter (like `T::value_type`) is assumed to be a value unless you say otherwise; `typename T::value_type` tells the compiler it is a type. C++20 relaxed many of these cases (alias declarations, return types, casts), but the rule still applies in general.
:::

::: warning `class` cannot do typename's second job
`typename` and `class` are twins only in the parameter list. In the body, `class T::value_type total;` is an error, not a disambiguator. Only `typename` tells the parser "the next dependent name is a type".
:::

## The template disambiguator

The same kind of guessing happens with angle brackets. Say a telemetry frame has a member function template `get<N>()` that reads channel `N`:

```cpp
struct Frame {
    double ch[3];
    template <int N>
    double get() const { return ch[N]; }
};
```

Now a generic function wants channel 0 of any frame type `F`:

```cpp
template <typename F>
double first_channel(const F& f) {
    return f.get<0>();          // missing 'template'
}
```

While `F` is blank, the compiler does not know that `F` has a member *template* called `get`. It could be a plain data member. So it reads the `<` as **less-than**: "`f.get` is less than `0`, which is greater than `()`". The empty `()` makes no sense as a value, and g++ 13 says so:

```
b1.cpp: In function 'double first_channel(const F&)':
b1.cpp:12:14: warning: expected 'template' keyword before dependent template name [-Wmissing-template-keyword]
   12 |     return f.get<0>();          // missing 'template'
      |              ^~~
      |              template
b1.cpp:12:21: error: expected primary-expression before ')' token
b1.cpp: In instantiation of 'double first_channel(const F&) [with F = Frame]':
b1.cpp:17:40:   required from here
b1.cpp:12:17: error: invalid operands of types '<unresolved overloaded function type>' and 'int' to binary 'operator<'
```

The last line proves it: g++ really tried to compute `f.get < 0`. The fix is the keyword `template` right before the member name:

```cpp
    return f.template get<0>();
```

Read it aloud as "f dot template get of zero". With that one word the program compiles and prints `1.0` for a frame `{1.0, 2.0, 3.0}`. Same idea as `typename`: when the compiler cannot know, you tell it that what follows is a template, so the `<` opens an argument list.

You need `template` only when all three are true:

1. the object's type (or the class before `::`) depends on a template parameter;
2. the member is a template;
3. you give it explicit template arguments in `< >`.

So `f.template get<0>()`, `p->template get<0>()` and `T::template rebind<U>` need it. The free function `std::get<0>(t)` from the last module never does, because `std::get` is not a member of a dependent type; the compiler already knows it is a template.

::: key
Inside a template, when you call a member template with explicit arguments on an object whose type is dependent, write `x.template get<0>()`. Without `template`, the `<` is read as less-than.
:::

## Two-phase name lookup

Now the two readings get their proper name. **Name lookup** is how the compiler finds what a name refers to: which function `report` is, which variable `state` is. For a template, C++ splits lookup into **[[two phases|two-phase-timeline]]**:

- **Phase 1, at the definition.** The compiler parses the whole template with the blanks still blank. Every name that does *not* depend on a template parameter (a **non-dependent name**) is looked up right now, and the answer is locked in. If it cannot be found, that is an error now, even if nobody ever uses the template.
- **Phase 2, at instantiation.** When code uses the template with real arguments, the compiler **[[instantiates|instantiate-word]]** it, lesson 1's word for stamping out a real copy with the blanks filled. Dependent names are looked up now, when their meaning finally exists.

The place in your code that triggers an instantiation is called the **point of instantiation**. Phase 2 happens there, once for each distinct set of arguments.

::: key
Two-phase lookup: non-dependent names are looked up when the template is defined, dependent names when it is instantiated, which is why a typo in a never-instantiated branch may go unnoticed on one compiler and fail on another.
:::

### Seeing both phases

This template is never used. It has two mistakes:

```cpp
template <typename T>
void calibrate(T& sensor) {
    sensor.aply_bias();        // typo, but depends on T: not checked yet
    log_calibration();         // never declared anywhere, and does not depend on T
}
int main() {}
```

g++ 13 reports one of them:

```
c1.cpp: In function 'void calibrate(T&)':
c1.cpp:4:5: error: there are no arguments to 'log_calibration' that depend on a template parameter, so a declaration of 'log_calibration' must be available [-fpermissive]
```

That message is two-phase lookup in one sentence. `log_calibration()` has no arguments involving `T`, so it is non-dependent, so it is looked up in phase 1, and it does not exist. clang++ says it more briefly: `use of undeclared identifier 'log_calibration'`.

The misspelled `aply_bias` is not reported at all. `sensor` has type `T&`, so `sensor.aply_bias` depends on `T`. Maybe some future `T` really has a member called `aply_bias`. The compiler cannot say it is wrong until phase 2, and phase 2 never comes because nothing calls `calibrate`. Delete the `log_calibration` line and the file compiles cleanly, typo and all.

::: warning A template that is never instantiated is barely tested
A template body that no test ever instantiates has only had its non-dependent parts checked. That is how a typo sits in a rarely used branch for months and then breaks the build the day someone finally uses it, or breaks on a **[[different compiler|msvc-history]]** that checks a little more or a little less in phase 1. Instantiate every template, with every type you ship, in a unit test.
:::

### Phase 1 locks in its answer

Phase 1 does more than catch errors. It *binds*: once a non-dependent name is found, later declarations cannot change the choice.

For dependent calls, phase 2 adds one more search. **Argument-dependent lookup**, or **[[ADL|adl-koenig]]**, looks for a function in the namespaces of the argument types. A call `report(p)` where `p` is an `fsw::Packet` also searches namespace `fsw`. At the point of instantiation, it is ADL that can find functions declared after the template; ordinary lookup already happened in phase 1.

::: example Which report() gets called?
```cpp
#include <cstdio>

void report(double) { std::puts("report(double)"); }

template <typename T>
void downlink(T value) {
    report(1);        // non-dependent: looked up HERE, at the definition
    report(value);    // dependent: looked up again when downlink<T> is instantiated
}

void report(int) { std::puts("report(int)"); }      // declared after the template

namespace fsw {
struct Packet { int id; };
void report(Packet p) { std::printf("report(Packet %d)\n", p.id); }
}

int main() {
    downlink(7);                  // T = int
    downlink(fsw::Packet{42});    // T = fsw::Packet
}
```

g++ 13 and clang++ both print:

```
report(double)
report(double)
report(double)
report(Packet 42)
```

Go line by line.

1. `downlink(7)` makes `T = int`. The first call, `report(1)`, is non-dependent. In phase 1 the only `report` in sight was `report(double)`, so that choice was locked in. `report(int)` would be a better match for `1`, but it was declared too late. Output: `report(double)`.
2. The second call, `report(value)`, is dependent, so it waits for phase 2. Ordinary lookup already ran in phase 1 and found only `report(double)`. ADL adds nothing, because `int` is a built-in type and belongs to no namespace. So again `report(double)`, with `7` converted to `7.0`.
3. `downlink(fsw::Packet{42})` makes `T = fsw::Packet`. The first call is the same locked-in `report(double)`. The second is dependent, and now ADL searches namespace `fsw`, the home of `Packet`, and finds `fsw::report(Packet)`: `report(Packet 42)`.

Sanity check: `report(int)` is never printed, even though `downlink(7)` passes an `int`. To have it found, declare it before the template.
:::

## The dependent base class trap

This is the error nearly everyone meets. You write a class template that inherits from another class template, and it cannot see its parent's members.

```cpp
template <typename T>
struct Filter {
    T state{};
    void reset() { state = T{}; }
};

template <typename T>
struct LowPass : Filter<T> {
    T alpha{0.1};
    T update(T x) {
        state += alpha * (x - state);    // state lives in the base Filter<T>
        return state;
    }
    void restart() { reset(); }
};
```

g++ 13 refuses, before `LowPass` is ever used:

```
d1.cpp: In member function 'T LowPass<T>::update(T)':
d1.cpp:13:9: error: 'state' was not declared in this scope; did you mean 'static'?
   13 |         state += alpha * (x - state);    // state lives in the base Filter<T>
      |         ^~~~~
      |         static
d1.cpp: In member function 'void LowPass<T>::restart()':
d1.cpp:16:22: error: there are no arguments to 'reset' that depend on a template parameter, so a declaration of 'reset' must be available [-fpermissive]
```

The base class `Filter<T>` depends on `T`; it is a **[[dependent base|dependent-base-picture]]**. In phase 1 the compiler does not look inside a dependent base, because it cannot know what will be there. Lesson 1 showed why: someone may write an explicit specialization `Filter<int>` later that has no member `state` at all, or has a `state` that is a function. So the plain name `state` is non-dependent, it is looked up in phase 1, the dependent base is skipped, and nothing is found.

The fix is to make the name dependent, so its lookup waits for phase 2, when the base class is known:

- **`this->state`**. `this` points to a `LowPass<T>`, which depends on `T`, so `this->state` is dependent. This is the most common fix.
- **`using Filter<T>::state;`** once in the class body, and then plain `state` everywhere after. Good when a name is used many times.
- **`Filter<T>::state`** written out in full. It also works, but for a member function it turns off virtual dispatch, so prefer the other two for functions.

::: example The low-pass filter, fixed
```cpp
#include <cstdio>

template <typename T>
struct Filter {
    T state{};
    void reset() { state = T{}; }
};

template <typename T>
struct LowPass : Filter<T> {
    using Filter<T>::state;              // fix 2: bring the name in once
    T alpha{0.1};
    T update(T x) {
        state += alpha * (x - state);
        return state;
    }
    void restart() { this->reset(); }    // fix 1: this-> makes the name dependent
};

int main() {
    LowPass<double> lp;
    for (int i = 0; i < 3; ++i) std::printf("step %d: %.4f\n", i + 1, lp.update(10.0));
    lp.restart();
    std::printf("after restart: %.4f\n", lp.state);
}
```

Output:

```
step 1: 1.0000
step 2: 1.9000
step 3: 2.7100
after restart: 0.0000
```

Check the numbers by hand. The update is $s \leftarrow s + \alpha (x - s)$ with $\alpha = 0.1$ and input $x = 10$. Step 1: $0 + 0.1 \times (10 - 0) = 1$. Step 2: $1 + 0.1 \times (10 - 1) = 1.9$. Step 3: $1.9 + 0.1 \times (10 - 1.9) = 2.71$. The output creeps toward $10$, a tenth of the remaining gap each step, which is exactly what a **[[first-order low-pass filter|low-pass]]** should do. After `restart()`, `reset()` from the base set `state` back to `0`.
:::

::: warning The quiet version of this bug
The error above is the lucky case. If an unrelated `state` is visible at the definition, say a global `double state = 0.0;` above the templates, phase 1 *finds it* and binds to it, with no error and no warning. Built that way with g++ 13, `LowPass<double>::update(10.0)` left the filter's own state at `0.0000` and changed the global to `1.0000`. Write `this->` for every base-class member, and the question never comes up.
:::

## Check yourself

::: check
A colleague writes `template <class T> T clamp01(T x)` and says "this only works for classes, so it will not accept a `float`". Are they right?
:::

::: answer
No. In a template parameter list `class` and `typename` mean the same thing: "`T` is a type parameter". Any type can fill it, including `float`, `int` or `double`. `clamp01<float>(1.3f)` compiles as long as the body makes sense for `float`. The word `class` is only there because it was an existing keyword when templates were added.
:::

::: check
Inside `template <typename Map> void dump(const Map& m)`, you write `Map::const_iterator it = m.begin();` and g++ says `need 'typename' before 'Map::const_iterator'`. Explain why the compiler cannot work this out for itself, and fix the line two ways.
:::

::: answer
`Map::const_iterator` depends on the template parameter `Map`. While reading the template for the first time, the compiler does not know `Map`, so it cannot tell whether `const_iterator` is a type or a static data member. The rule says a dependent qualified name is assumed to be a value, and a value followed by `it` is a syntax error.

Fix 1: `typename Map::const_iterator it = m.begin();` tells it the name is a type.

Fix 2: `auto it = m.begin();` avoids naming the type at all. When you must spell the type (a member variable, say), only fix 1 works.
:::

::: check
`template <typename Codec> int decode(const Codec& c, const unsigned char* buf) { return c.read<int>(buf); }` fails to compile with `expected primary-expression`. What is the compiler reading, and what is the fix?
:::

::: answer
`c` has type `const Codec&`, which depends on `Codec`, so the compiler cannot know that `read` is a member template. It reads `c.read < int > (buf)`: "`c.read` is less than `int`, which is greater than `(buf)`", and `int` is not an expression, hence the error. The fix is `return c.template read<int>(buf);`. The keyword `template` says that `read` names a template, so the `<` opens an argument list.
:::

::: check
A template body contains `sqrtf(x)` where `x` has type `T`, and another line `clamp_limits()` with no arguments. Neither function is declared anywhere. The template is never used. Which line does g++ report, and why?
:::

::: answer
Only `clamp_limits()`. It has no argument that depends on `T`, so it is a non-dependent name, looked up in phase 1 when the template is defined, and it is not found: g++ says "there are no arguments to 'clamp_limits' that depend on a template parameter, so a declaration of 'clamp_limits' must be available".

`sqrtf(x)` has an argument of type `T`, so the call is dependent. Its lookup waits for phase 2, where argument-dependent lookup might still find a `sqrtf` in `T`'s namespace. Since the template is never instantiated, phase 2 never happens, and nothing is reported.
:::

::: check
In `template <typename T> struct Kf : Base<T> { void predict() { propagate(); } };`, `propagate` is a member function of `Base<T>`. Why does the compiler not find it, and which fix would you choose?
:::

::: answer
`Base<T>` depends on `T`, so it is a dependent base. `propagate()` has no dependent arguments, so it is looked up in phase 1, and phase 1 does not look inside a dependent base, because a later specialization of `Base` could have no `propagate` at all. The lookup finds nothing (or, worse, finds an unrelated `propagate` outside the class).

The usual fix is `this->propagate();`, which makes the name dependent so it is looked up in phase 2, when `Base<T>` is known. `using Base<T>::propagate;` in the class body also works. `Base<T>::propagate()` works too, but if `propagate` is virtual it bypasses virtual dispatch, so it is the last choice.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| `typename` vs `class` in a parameter list | Two spellings of "type parameter" | Interchangeable; `class` does not require a class type |
| Dependent name | A name whose meaning depends on a template parameter | `T::value_type`, `x.member` where `x` has a dependent type |
| `typename` disambiguator | "The next dependent name is a type" | Assumed a value otherwise; C++20 lets you drop it in type-only spots |
| `template` disambiguator | "The next member name is a template" | `x.template get<0>()`, `T::template rebind<U>` |
| Two-phase lookup | Two readings of every template | Non-dependent names at definition, dependent names at instantiation |
| ADL | Argument-dependent lookup | Dependent calls also search the argument types' namespaces |
| Dependent base | A base class that depends on `T` | Not searched in phase 1; use `this->name` or `using Base<T>::name` |

Next lesson turns templates around: instead of the compiler asking you what a name is, your code asks the compiler questions about a type — is it floating point, are these two types the same, what is it without its `const` — using **type traits**.

::: context type-parameter A blank that holds a type
Most parameters you know hold values: `f(3.0)` fills the parameter `x` with $3.0$. A template's type parameter holds a *type* instead: `sum<std::vector<double>>` fills `Container` with the type `std::vector<double>`. Templates can also have **non-type parameters**, which hold compile-time values, like the `R` and `C` in lesson 2's `Matrix<T, R, C>`, and **template template parameters**, which hold a whole template, like `template <template <typename> class Container>`. Before C++17 that innermost spot had to say `class`; since C++17 `typename` works there too.
:::

::: context down-with-typename How the C++20 change got its name
The proposal that let compilers assume a type in type-only positions was titled "Down with `typename`!" (paper P0634, adopted for C++20). Its argument was that in places like `using X = T::type;` nothing but a type can appear, so demanding the keyword only produced errors that told the programmer what the compiler already knew. It did not remove the ambiguity inside function bodies, where `T::x * y;` can still be a declaration or a multiplication, so the old rule stays there.
:::

::: context two-phase-timeline One template, two readings
Phase 1 happens once, where the template is written. Phase 2 happens once per distinct set of arguments, wherever the template is first used with them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="80" x2="340" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="344,80 334,75 334,85" fill="#1f2a44"/>
  <text x="330" y="100" font-size="11" text-anchor="end" fill="#6c7a93">reading the file</text>
  <circle cx="60" cy="80" r="7" fill="#1d6fd1"/>
  <text x="60" y="30" font-size="12" text-anchor="middle" fill="#1d6fd1">phase 1</text>
  <text x="60" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">definition:</text>
  <text x="60" y="60" font-size="11" text-anchor="middle" fill="#1f2a44">non-dependent names</text>
  <circle cx="200" cy="80" r="7" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="290" cy="80" r="7" fill="#f2b880" stroke="#1f2a44"/>
  <text x="245" y="30" font-size="12" text-anchor="middle" fill="#b4232c">phase 2, per use</text>
  <text x="245" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">instantiation:</text>
  <text x="245" y="60" font-size="11" text-anchor="middle" fill="#1f2a44">dependent names + ADL</text>
  <text x="200" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">sum&lt;vector&lt;double&gt;&gt;</text>
  <text x="290" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">sum&lt;array&lt;int,3&gt;&gt;</text>
</svg>
```
:::

::: context instantiate-word Where "instantiate" comes from
To instantiate is to make an *instance*: one concrete example of a general pattern. In lesson 1's picture, the template is the cookie cutter and each cookie is an instance. When you write `sum(gyro_z)`, the compiler works out `Container = std::vector<double>` and privately writes a real function with that type everywhere the blank was: a specialization of the template. It is compiled like any hand-written function, which is why templates cost nothing at run time and quite a lot at build time, a trade-off lesson 10 measures.
:::

::: context msvc-history Not every compiler read templates the same way
For many years Microsoft's C++ compiler did not do phase 1 properly. It stored a template's text and parsed it only when it was instantiated, so a missing declaration or a missing `typename` in an unused template went unnoticed on Windows and failed on Linux with g++. Modern Microsoft compilers implement two-phase lookup under the `/permissive-` conformance option. Teams that build flight software for several targets often compile with two different compilers in continuous integration for exactly this reason: each one catches mistakes the other lets through.
:::

::: context adl-koenig Looking in the argument's home
Argument-dependent lookup is also called **Koenig lookup**, after Andrew Koenig, who is credited with the idea. It is what makes `std::cout << x` work without writing `std::operator<<(std::cout, x)`: the arguments are from namespace `std`, so `std` is searched for `operator<<`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="12" width="160" height="126" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">global namespace</text>
  <rect x="24" y="44" width="132" height="30" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="90" y="63" font-size="11" text-anchor="middle" fill="#1f2a44">report(double)</text>
  <rect x="24" y="92" width="132" height="30" rx="5" fill="#fff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="90" y="111" font-size="11" text-anchor="middle" fill="#6c7a93">report(int), too late</text>
  <rect x="190" y="12" width="160" height="126" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">namespace fsw</text>
  <rect x="204" y="44" width="132" height="30" rx="5" fill="#fff" stroke="#1f2a44"/>
  <text x="270" y="63" font-size="11" text-anchor="middle" fill="#1f2a44">struct Packet</text>
  <rect x="204" y="92" width="132" height="30" rx="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="270" y="111" font-size="11" text-anchor="middle" fill="#1f2a44">report(Packet)</text>
  <line x1="270" y1="74" x2="270" y2="90" stroke="#b4232c" stroke-width="2"/>
  <polygon points="270,92 265,84 275,84" fill="#b4232c"/>
</svg>
```

Blue: found by ordinary lookup in phase 1. Orange: found by ADL in phase 2, because the argument's type lives in `fsw`.
:::

::: context dependent-base-picture Why the compiler will not look in the base
The general `Filter<T>` has a member `state`. But lesson 1 showed that anyone may write an explicit specialization, and a specialization is free to contain completely different members. The compiler, reading `LowPass<T>` in phase 1, cannot know which version it will inherit from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="14" y="14" width="150" height="62" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="89" y="34" font-size="12" text-anchor="middle" fill="#1f2a44">Filter&lt;T&gt;</text>
  <text x="89" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">T state; reset()</text>
  <rect x="196" y="14" width="150" height="62" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="271" y="34" font-size="12" text-anchor="middle" fill="#1f2a44">Filter&lt;int&gt;</text>
  <text x="271" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">no state at all</text>
  <rect x="105" y="106" width="150" height="34" rx="6" fill="#fff" stroke="#1f2a44"/>
  <text x="180" y="127" font-size="12" text-anchor="middle" fill="#1f2a44">LowPass&lt;T&gt;</text>
  <line x1="150" y1="106" x2="100" y2="78" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="210" y1="106" x2="260" y2="78" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="180" y="96" font-size="11" text-anchor="middle" fill="#b4232c">which one?</text>
</svg>
```

Writing `this->state` postpones the question to phase 2, when `T` is known.
:::

::: context low-pass A filter that smooths noise
A first-order low-pass filter keeps a running estimate and moves it a fixed fraction $\alpha$ of the way toward each new reading. Fast jitter mostly cancels out; slow changes come through. With $\alpha = 0.1$ at a $1\,\mathrm{kHz}$ loop rate, the filter follows a step change to about $63\%$ in roughly ten samples, about $10\,\mathrm{ms}$. Flight software puts filters like this on gyro and accelerometer channels before the attitude estimator sees them. Writing it as a template lets one source serve `float` on a small flight processor and `double` in the desktop simulation.
:::
