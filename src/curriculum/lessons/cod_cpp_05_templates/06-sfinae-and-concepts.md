---
id: l06-sfinae-and-concepts
title: "SFINAE, enable_if and concepts: putting rules on a template"
minutes: 28
covers:
  - SFINAE and enable_if, and the C++20 replacement: concepts and requires
---

Picture a roller coaster. At the entrance there is a sign: "You must be this tall to ride", with a line painted at 122 cm. A child who is too short learns it in two seconds, at the gate, from a sign that states the rule. Now picture a park with no sign. The child gets in, and only halfway up the first hill does the lap bar refuse to close. The ride stops, and only then does someone explain that the problem was height.

Templates without rules are the park with no sign. Last lesson's `Kalman1<int>` got a `static_assert`, which is a guard standing *inside* the ride: better than nothing, but the template has already been chosen by the time it speaks. This lesson is about signs at the gate. The old way to put one up is a trick with a strange name, **SFINAE**, usually used through a tool called `std::enable_if`. The C++20 way is **concepts**: named, readable requirements like `std::floating_point`, checked before the template is even picked.

You will see both on the same problems, and read the real g++ errors each produces when misused. In a large codebase, the person who hits your template's error is usually not you, and that message decides whether they lose five minutes or an afternoon.

## Substitution failure is not an error

When you call a function that has several **overloads** (several functions with the same name), the compiler goes through a process called **[[overload resolution|overload-resolution]]**: it collects every candidate, throws out the ones that cannot take these arguments, and picks the best of the rest.

For a function template, being a candidate takes two steps. First, **deduction**: work out the template arguments from the call, as lesson 1 showed. Second, **substitution**: paste those arguments into the template's *declaration* (its return type, its parameter types, its template parameters) to see what function signature comes out.

Sometimes the pasted result is nonsense. If `C = double`, then `typename C::size_type` asks for "double's size type", and `double` has no members at all. The rule C++ has for this moment is the one with the long name: **substitution failure is not an error**, shortened to **[[SFINAE|sfinae-name]]** and often pronounced "sfee-nay". The broken candidate is quietly removed from the list, and overload resolution carries on with the others. Only if *no* candidate is left is there an error.

::: example SFINAE choosing between overloads
```cpp
#include <array>
#include <cstdio>
#include <vector>

// Overload A: for a container. The return type names C's size type.
template <typename C>
typename C::size_type count_of(const C& c) {
    std::printf("  [A] ");
    return c.size();
}

// Overload B: a single reading counts as one sample.
std::size_t count_of(double) {
    std::printf("  [B] ");
    return 1;
}

int main() {
    std::vector<double> window{0.1, 0.2, 0.3};
    std::array<float, 8> burst{};
    std::printf("%zu\n", count_of(window));   // A: C = std::vector<double>
    std::printf("%zu\n", count_of(burst));    // A: C = std::array<float, 8>
    std::printf("%zu\n", count_of(2.5));      // A tried with C = double: double::size_type fails -> B
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`, it prints:

```
  [A] 3
  [A] 8
  [B] 1
```

Take the calls one at a time.

1. `count_of(window)`. Candidate A deduces `C = std::vector<double>`. Substituting gives the return type `std::vector<double>::size_type`, which exists. Candidate B needs a `double`, and a vector cannot become one, so B is not viable. A wins and returns the size, 3.
2. `count_of(burst)`. Same story with `C = std::array<float, 8>`: A wins, size 8.
3. `count_of(2.5)`. Candidate A deduces `C = double` and substitutes: `double::size_type`, which cannot exist. Without SFINAE the program would fail to compile because of a candidate nobody wanted. With SFINAE, A is quietly dropped, and B, which takes a `double` exactly, returns 1.

Sanity check: three readings count as 3, eight slots as 8, one reading as 1. Each call reached the sensible overload.
:::

::: warning Only the declaration is protected
SFINAE covers failures while substituting into the template's *declaration*: the return type, the parameter types and the template parameter list. An error inside the function *body* is a hard error, reported after the candidate has already won. That is why a template with no rules at all fails deep inside its own code, as you will see with `Matrix<std::string, 2, 2>` at the end of this lesson.
:::

## enable_if: SFINAE on purpose

Above, SFINAE happened by accident. Library writers wanted to trigger it *on purpose*, with any condition, such as "only for integer types". The tool for that is `std::enable_if`, from `<type_traits>`. It is a trait, built exactly the way last lesson's traits were:

```cpp
template <bool B, typename T = void> struct enable_if {};                 // no member "type" at all
template <typename T>                struct enable_if<true, T> { using type = T; };  // only when B is true
```

Read `std::enable_if_t<B, T>` as "T, enabled only if B". When `B` is true, `enable_if<true, T>::type` is `T`. When `B` is false, the general version is used, and it has no member called `type`. Asking for it is a substitution failure, so the whole candidate disappears.

Put `std::enable_if_t<condition, ReturnType>` where the return type goes, and the condition decides whether the function exists for this call.

::: example Raw counts or physical units
A MEMS gyro reports rotation rate as a raw 16-bit **[[ADC count|adc-count]]**. At a typical setting, one count means $0.00875$ degrees per second. A helper `to_dps` ("to degrees per second") should scale integer counts, and pass values that are already floating point straight through.

```cpp
#include <cstdint>
#include <cstdio>
#include <type_traits>

constexpr double kLsb = 0.00875;   // deg/s per count, a typical MEMS gyro setting

// Integer input: a raw ADC count, so scale it.
template <typename T>
std::enable_if_t<std::is_integral_v<T>, double>
to_dps(T counts) { return counts * kLsb; }

// Floating-point input: already in deg/s, pass it through.
template <typename T>
std::enable_if_t<std::is_floating_point_v<T>, double>
to_dps(T value) { return static_cast<double>(value); }

int main() {
    std::int16_t raw = 1234;
    std::printf("%.4f\n", to_dps(raw));     // integral overload
    std::printf("%.4f\n", to_dps(10.8f));   // floating-point overload
}
```

Output:

```
10.7975
10.8000
```

Step by step. For `to_dps(raw)`, both templates deduce `T = std::int16_t`. In the first, `std::is_integral_v<std::int16_t>` is true, so the return type is `double` and the candidate survives. In the second, `std::is_floating_point_v<std::int16_t>` is false, so `enable_if_t<false, double>` has no `type`: substitution fails and the candidate vanishes. One candidate left, called with $1234 \times 0.00875 = 10.7975\,\mathrm{deg/s}$.

For `to_dps(10.8f)`, `T = float`, and it goes the other way: only the second survives, and it returns $10.8$. Sanity check: $1234$ counts at $0.00875$ each is a little under $1234 / 100 = 12.3$, and $10.8$ is in that range.
:::

You will also meet `enable_if` in a second position, as an extra template parameter with a default value, which leaves the return type readable:

```cpp
template <typename T, std::enable_if_t<std::is_integral_v<T>, int> = 0>
double to_dps(T counts);
```

Read it as "a second, unnamed template parameter of type `int`, defaulting to 0, which only exists if `T` is integral". Same trick, different hiding place.

### What enable_if errors look like

Now misuse it. Pass a `std::string` holding `"1234"`, the kind of mistake that happens when a value arrives from a text command link:

```cpp
std::string s = "1234";
std::printf("%.4f\n", to_dps(s));
```

g++ 13 prints 21 lines. Here is the heart of them:

```
f2bad.cpp:18:33: error: no matching function for call to 'to_dps(std::string&)'
f2bad.cpp:10:1: note: candidate: 'template<class T> std::enable_if_t<is_integral_v<T>, double> to_dps(T)'
f2bad.cpp:10:1: note:   template argument deduction/substitution failed:
/usr/include/c++/13/type_traits: In substitution of 'template<bool _Cond, class _Tp> using std::enable_if_t = typename std::enable_if::type [with bool _Cond = false; _Tp = double]':
f2bad.cpp:10:1:   required by substitution of 'template<class T> std::enable_if_t<is_integral_v<T>, double> to_dps(T) [with T = std::__cxx11::basic_string<char>]'
f2bad.cpp:18:33:   required from here
/usr/include/c++/13/type_traits:2610:11: error: no type named 'type' in 'struct std::enable_if<false, double>'
f2bad.cpp:14:1: note: candidate: 'template<class T> std::enable_if_t<is_floating_point_v<T>, double> to_dps(T)'
f2bad.cpp:14:1: note:   template argument deduction/substitution failed:
```

Look at what it says. The central error, `no type named 'type' in 'struct std::enable_if<false, double>'`, points into the standard library's own file, about a member you never asked for. To learn the *reason*, you must find the `is_integral_v<T>` buried in the candidate's return type and work backwards. For the second candidate, g++ does not show the reason at all. In a real library with many overloads and nested conditions, such messages run to pages.

A second problem: overlapping conditions make a call **ambiguous**. Enable one overload for `std::is_arithmetic_v<T>` (any number) and another for `std::is_floating_point_v<T>`, and a call with `2.5` satisfies both: g++ says `call of overloaded 'describe(double)' is ambiguous`. To the compiler the two conditions are unrelated expressions; it cannot see that one is narrower.

## Concepts: the sign at the gate

C++20 added a direct way to say what a template needs. A **[[concept|concepts-history]]** is a named, compile-time requirement on types: a predicate that is true or false for a given type. The standard library provides many in the header `<concepts>`, including:

- `std::integral<T>`: `T` is an integer type (`int`, `std::int16_t`, `char`, `bool`…);
- `std::floating_point<T>`: `T` is `float`, `double` or `long double`;
- `std::same_as<T, U>`: `T` and `U` are the same type;
- `std::convertible_to<From, To>`: a `From` can be implicitly converted to a `To`.

Many are thin wrappers over last lesson's traits: in g++'s library, `std::floating_point` is one line, `std::is_floating_point_v<T>`. What is new is where and how the question is asked.

A template states its requirement with a **requires-clause**: the keyword `requires` followed by a condition built from concepts. There are four spellings. The first three put the same requirement on the same function; the fourth is almost the same:

```cpp
template <typename T> requires std::floating_point<T> T f1(T x);   // requires-clause after the parameter list
template <typename T> T f2(T x) requires std::floating_point<T>;   // trailing requires-clause
template <std::floating_point T> T f3(T x);                        // the concept replaces "typename"
std::floating_point auto f4(std::floating_point auto x);           // abbreviated: "any floating-point x"
```

Read `template <std::floating_point T>` as "for any floating-point type `T`", and `std::floating_point auto x` as "`x`, of any floating-point type". The "almost" is the return type. `f1` to `f3` return exactly the `T` they were given. In `f4`, the `std::floating_point auto` in front is a separate placeholder: the return type is worked out from the `return` statement in the body, and only checked to be *some* floating-point type. With a body of `return x * 2.0;`, `f3(1.0f)` returns a `float` but `f4(1.0f)` returns a `double`. The requirement is part of the template's **interface**, the part a caller sees. A template whose requirement is not met is removed from overload resolution, as with SFINAE, but now the compiler knows *which requirement* failed and can say so.

::: key
Concepts express requirements directly and readably, produce diagnostics naming the failed requirement, participate in overload resolution with a clear subsumption ordering, and can be reused by name. `enable_if` hid the intent in the return type and produced unreadable errors.
:::

### The same helper, with concepts

Here is `to_dps` rewritten with the two standard concepts:

```cpp
double to_dps(std::integral auto counts)       { return counts * kLsb; }
double to_dps(std::floating_point auto value)  { return static_cast<double>(value); }
```

With the same `main` it prints the same `10.7975` and `10.8000`. We compiled both versions with `-O2` and compared the machine code g++ generated for `main`: identical, instruction for instruction. A constraint is checked while compiling and then disappears. It costs **nothing at run time**; what it changes is the error you get when something is wrong.

::: example Two diagnostics, side by side
Pass the same `std::string` to the concept version. Here is g++ 13's report, shortened in the same way as before (source-line echoes and "In substitution of … required from here" lines removed):

```
f3bad.cpp:13:33: error: no matching function for call to 'to_dps(std::string&)'
f3bad.cpp:8:8: note: candidate: 'template<class auto:16>  requires  integral<auto:16> double to_dps(auto:16)'
f3bad.cpp:8:8: note:   template argument deduction/substitution failed:
f3bad.cpp:8:8: note: constraints not satisfied
/usr/include/c++/13/concepts:100:13:   required for the satisfaction of 'integral<auto:16>' [with auto:16 = std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >]
/usr/include/c++/13/concepts:100:24: note: the expression 'is_integral_v<_Tp> [with _Tp = std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >]' evaluated to 'false'
f3bad.cpp:9:8: note: candidate: 'template<class auto:17>  requires  floating_point<auto:17> double to_dps(auto:17)'
f3bad.cpp:9:8: note:   template argument deduction/substitution failed:
f3bad.cpp:9:8: note: constraints not satisfied
/usr/include/c++/13/concepts:109:13:   required for the satisfaction of 'floating_point<auto:17>' [with auto:17 = std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >]
/usr/include/c++/13/concepts:109:30: note: the expression 'is_floating_point_v<_Tp> [with _Tp = std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >]' evaluated to 'false'
```

Compare it with the `enable_if` report, line for line.

1. Both start at the call site, line 13 here and line 18 there: "no matching function".
2. Where `enable_if` said `no type named 'type' in 'struct std::enable_if<false, double>'`, the concept version says `constraints not satisfied`, `required for the satisfaction of 'integral<...>'`, and `the expression 'is_integral_v<...>' evaluated to 'false'`: the concept's name and the exact test that failed.
3. The `enable_if` version explained only the first candidate. The concept version explains both: not `integral`, and not `floating_point`.

In length they are close, 21 lines against 27, because g++ now explains more. The gain is in what the lines say. Sanity check: from the concept version alone, a reader who has never seen `to_dps` can tell it wants an integer or a floating-point value, and a `std::string` is neither.
:::

## Writing your own concept

A concept is defined with the keyword `concept`:

```cpp
template <typename T>
concept Scalar = std::floating_point<T>;
```

Read it as "a type `T` is a Scalar if `T` is floating point". The right-hand side can combine other concepts and traits with `&&` ("and") and `||` ("or").

To require that certain *code* compiles for a type, use a **requires-expression**. It looks like a function body, with parameters to talk about, and each line is a requirement:

```cpp
requires(T a, T b) {
    a + b;                                  // simple requirement: this must compile
    { a * b } -> std::convertible_to<T>;    // compound requirement: must compile, and its type must satisfy the concept
    typename T::value_type;                 // type requirement: this type must exist
    requires sizeof(T) <= 8;                // nested requirement: this must be true
}
```

The parameters `a` and `b` are never created and nothing runs; the compiler only checks whether each line *would* be valid. The result is `true` if every requirement holds, `false` otherwise. In a compound requirement, read `{ a * b } -> std::convertible_to<T>` as "`a * b` must compile, and its result must be convertible to `T`".

Keep the two uses of `requires` apart. A **requires-clause** *states* a constraint: `requires Scalar<T>`. A **requires-expression**, `requires (params) { ... }`, *tests* whether code is valid and yields a `bool`. Putting one straight into the other gives the odd-looking, legal `requires requires (T a) { a.step(1.0); }`; a named concept is almost always clearer.

::: example A Propagator concept, and its diagnostic
A simulation loop can step any object forward in time, as long as it has `step(dt)` and a `state()` that gives a number.

```cpp
#include <concepts>
#include <cstdio>

// Anything that can be stepped forward by a time step dt and report its state.
template <typename S>
concept Propagator = requires(S s, double dt) {
    s.step(dt);                                   // must compile
    { s.state() } -> std::convertible_to<double>; // must compile and give a number
};

struct ConstantVelocity {
    double x = 0.0, v = 7.5;                      // m, m/s
    void step(double dt) { x += v * dt; }
    double state() const { return x; }
};

struct Logger {                                   // has state() but no step()
    double state() const { return 0.0; }
};

template <Propagator P>
double run(P p, double dt, int n) {
    for (int i = 0; i < n; ++i) p.step(dt);
    return p.state();
}

int main() {
    std::printf("after 1 s: %.2f m\n", run(ConstantVelocity{}, 0.01, 100));
    static_assert(Propagator<ConstantVelocity>);
    static_assert(!Propagator<Logger>);
#ifdef MISUSE
    run(Logger{}, 0.01, 100);
#endif
}
```

Output:

```
after 1 s: 7.50 m
```

Check it: 100 steps of $0.01\,\mathrm{s}$ is $1\,\mathrm{s}$, and at $7.5\,\mathrm{m/s}$ the object moves $7.5\,\mathrm{m}$. The two `static_assert` lines show that a concept can also be asked directly, like a trait: `Propagator<ConstantVelocity>` is `true` and `Propagator<Logger>` is `false`.

Now compile with `-DMISUSE`, which switches on the `run(Logger{}, ...)` line. g++ 13 says:

```
h1.cpp:32:8: error: no matching function for call to 'run(Logger, double, int)'
h1.cpp:22:8: note: candidate: 'template<class P>  requires  Propagator<P> double run(P, double, int)'
h1.cpp:22:8: note:   template argument deduction/substitution failed:
h1.cpp:22:8: note: constraints not satisfied
h1.cpp:6:9:   required for the satisfaction of 'Propagator<P>' [with P = Logger]
h1.cpp:6:22:   in requirements with 'S s', 'double dt' [with S = Logger]
h1.cpp:7:11: note: the required expression 's.step(dt)' is invalid
cc1plus: note: set '-fconcepts-diagnostics-depth=' to at least 2 for more detail
```

Every line is about *your* code: the call on line 32, the concept on line 6, and **[[the exact requirement|diagnostics-depth]]** on line 7 that `Logger` fails. Sanity check: `Logger` really has no `step`, and that is the one thing the message complains about.
:::

::: warning A concept checks only what you wrote down
`Propagator` checks that `s.step(dt)` compiles. It does not check that `step` moves time forward, or that it takes seconds rather than milliseconds. A concept is a promise about *syntax*: which expressions are valid and what types they give. The meaning is still up to documentation and tests.
:::

## Subsumption: the more specific concept wins

Concepts fix the ambiguity problem too. When two constrained overloads both accept a call, the compiler compares their constraints. If one constraint includes everything the other requires and more, it **subsumes** the other, and the more constrained overload wins.

::: example The narrower requirement wins
```cpp
#include <concepts>
#include <cstdio>

template <typename T>
concept Arithmetic = std::integral<T> || std::floating_point<T>;

template <typename T>
concept Real = Arithmetic<T> && std::floating_point<T>;   // Real includes all of Arithmetic's demands, and more

void describe(Arithmetic auto x) { std::printf("%-6g -> Arithmetic version\n", static_cast<double>(x)); }
void describe(Real auto x)       { std::printf("%-6g -> Real version\n", static_cast<double>(x)); }

int main() {
    describe(3);      // int: only Arithmetic is satisfied
    describe(2.5);    // double: both satisfied; Real subsumes Arithmetic, so it wins
}
```

Output:

```
3      -> Arithmetic version
2.5    -> Real version
```

Step by step. For `3`, an `int`, `Arithmetic` holds (it is integral) but `Real` does not (not floating point), so only the first overload is viable. For `2.5`, a `double`, both hold. The compiler breaks each concept down into its pieces: `Real` is `Arithmetic` *and* `floating_point`, so anything that satisfies `Real` must satisfy `Arithmetic`. `Real` subsumes `Arithmetic`, and its overload is chosen. Sanity check: this is the same pair of conditions that made the `enable_if` version ambiguous. With named concepts, the compiler can see which one is narrower.
:::

::: note Why named concepts matter for subsumption
The compiler compares constraints by breaking them into **atomic constraints**, the smallest pieces, such as the `std::is_floating_point_v<T>` inside `std::floating_point`. Two atomic constraints count as the same only if they are the same expression from the same place in the source. `Real` and `Arithmetic` both go through `std::floating_point`, so they share that piece. Write the raw `std::is_floating_point_v<T>` by hand in two requires-clauses and the compiler treats them as unrelated: an ambiguous call again. Build overload sets from named concepts.
:::

## The exercise: a Matrix with a Scalar concept

Lesson 2 built `Matrix<T, R, C>`. It works for `double`. But nothing stops someone from writing `Matrix<std::string, 2, 2>`, or `Matrix<int, 3, 3>`, which would quietly do every later division, in an inverse or a normalization, in integer arithmetic. The exercise for this module asks you to constrain it with a concept, and to compare the diagnostics. Here are the two halves.

Without constraints, something surprising happens: the declaration `Matrix<std::string, 2, 2> m;` **compiles**. A `std::array<std::string, 4>` is a perfectly good array. The error waits until you use the part that needs arithmetic. Multiply two such matrices and g++ 13 reports, from inside `operator*`:

```
g_unc.cpp: In instantiation of 'Matrix<T, R, C> operator*(const Matrix<T, R, K>&, const Matrix<T, K, C>&) [with T = std::__cxx11::basic_string<char>; long unsigned int R = 2; long unsigned int K = 2; long unsigned int C = 2]':
g_unc.cpp:29:18:   required from here
g_unc.cpp:20:62: error: no match for 'operator*' (operand types are 'std::__cxx11::basic_string<char>' and 'std::__cxx11::basic_string<char>')
   20 |             for (std::size_t k = 0; k < K; ++k) s += a(i, k) * b(k, j);
      |                                                      ~~~~~~~~^~~~~~~~~
g_unc.cpp:15:17: note: candidate: 'template<class T, long unsigned int R, long unsigned int K, long unsigned int C> Matrix<T, R, C> operator*(const Matrix<T, R, K>&, const Matrix<T, K, C>&)'
g_unc.cpp:15:17: note:   template argument deduction/substitution failed:
g_unc.cpp:20:62: note:   'std::__cxx11::basic_string<char>' is not derived from 'const Matrix<T, R, K>'
```

The error points at line 20, the inner loop of the library's multiply: the body, where SFINAE offers no protection. The user who wrote the bad line 29 is told about an `operator*` of two strings they never wrote, then about every other `operator*` g++ can see. Here that was 12 lines; adding `#include <complex>` and `#include <chrono>`, which bring more `operator*` overloads into view, made it 34. Each extra layer of helper functions adds another "required from" line.

Now the constrained version. Define the concept, and put it on the class and on `operator*`:

```cpp
// A Scalar is a floating-point type that supports the arithmetic the matrix uses.
template <typename T>
concept Scalar = std::floating_point<T> && requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
    { a * b } -> std::convertible_to<T>;
};

template <Scalar T, std::size_t R, std::size_t C>
class Matrix { /* as in lesson 2 */ };

template <Scalar T, std::size_t R, std::size_t K, std::size_t C>
Matrix<T, R, C> operator*(const Matrix<T, R, K>& a, const Matrix<T, K, C>& b);
```

With `double`, nothing changes. A 90-degree rotation matrix times the vector $(3, 4)$ prints `2x1: (-4.0, 3.0)`, which is right: rotating $(3, 4)$ a quarter turn counterclockwise gives $(-4, 3)$. But now the declaration `Matrix<std::string, 2, 2> m;` fails by itself, at the line that wrote it:

```
g_con.cpp:46:29: error: template constraint failure for 'template<class T, long unsigned int R, long unsigned int C>  requires  Scalar<T> class Matrix'
   46 |     Matrix<std::string, 2, 2> m;              // rejected at the declaration
      |                             ^
g_con.cpp:46:29: note: constraints not satisfied
/usr/include/c++/13/concepts:109:13:   required for the satisfaction of 'floating_point<T>' [with T = std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >]
g_con.cpp:9:9:   required for the satisfaction of 'Scalar<T>' [with T = std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >]
/usr/include/c++/13/concepts:109:30: note: the expression 'is_floating_point_v<_Tp> [with _Tp = std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >]' evaluated to 'false'
```

Read it from the top: line 46 of *your* file, "template constraint failure", "constraints not satisfied", `required for the satisfaction of 'Scalar<T>'`, and the exact test that failed, `is_floating_point_v`. The diagnosis has moved from the middle of the library to the **[[interface boundary|interface-boundary]]**, the line where the misuse happened. It also catches `Matrix<int, 3, 3>`, which the unconstrained version would have accepted in silence.

::: key
The practical benefit of constraining a template with a concept: the error names the unsatisfied requirement at the call site, instead of surfacing deep inside the instantiation. The generated runtime code is the same; only the diagnosis moves.
:::

::: warning Constrain every entry point
Putting `Scalar` on `Matrix` but not on a free function template like `dot(a, b)` leaves a side door: calls to `dot` with a bad type fail inside its body again. Put the concept on each public template. Once `Scalar` has a name, that costs one word per template.
:::

## Check yourself

::: check
Explain in your own words what "substitution failure is not an error" means, and say where in a function template a failure must happen for the rule to apply.
:::

::: answer
When the compiler considers a function template for a call, it deduces the template arguments and then substitutes them into the template's declaration. If that produces an invalid type or expression, such as `double::size_type`, the template is not a compile error; it is only dropped from the list of candidates, and overload resolution continues with the others. It becomes an error only if no viable candidate remains.

The failure must happen in the declaration: the return type, the parameter types, or the template parameter list (for example a defaulted `enable_if_t<...>` parameter). A failure inside the body is a hard error, because the body is only instantiated after the function has been chosen.
:::

::: check
Given `template <bool B, typename T = void> struct enable_if {};` and the specialization for `true`, what is `std::enable_if_t<(sizeof(long) == 8), int>` on a typical 64-bit Linux machine, and what is `std::enable_if_t<false>`?
:::

::: answer
On 64-bit Linux `long` is 8 bytes, so the condition is true, the `true` specialization is used, and its `type` is `int`. So the first is `int`.

`std::enable_if_t<false>` uses the default `T = void`, but with `false` the general template is chosen, and it has no member `type`. Naming it is invalid: inside a function template's declaration that is a substitution failure that removes the candidate; anywhere else it is an ordinary compile error.
:::

::: check
Write a concept `Timestamped` requiring that a type has a member type `clock_type`, and a member function `time()` whose result is convertible to `double`. Then write a function template `age` that only accepts `Timestamped` types, using the shortest syntax.
:::

::: answer
```cpp
template <typename T>
concept Timestamped = requires(const T t) {
    typename T::clock_type;                         // type requirement
    { t.time() } -> std::convertible_to<double>;    // compound requirement
};

double age(const Timestamped auto& x, double now) { return now - x.time(); }
```

The first line inside the braces is a type requirement: `T::clock_type` must name a type. The second is a compound requirement: `t.time()` must compile and its result must convert to `double`. The abbreviated `Timestamped auto&` means "a reference to any type satisfying `Timestamped`". Taking `const T t` as the parameter makes sure `time()` can be called on a `const` object.
:::

::: check
Two overloads: `void send(std::integral auto x)` and `void send(std::unsigned_integral auto x)`, where the standard concept `std::unsigned_integral` is defined as `std::integral<T> && !std::signed_integral<T>`. Which overload does `send(5u)` call, and which does `send(-5)` call? Why is there no ambiguity?
:::

::: answer
`5u` is an `unsigned int`. It is integral, and unsigned, so both overloads are viable. `std::unsigned_integral` is defined as `std::integral` *and* something more, so it subsumes `std::integral`: the `unsigned_integral` overload is more constrained and wins.

`-5` is an `int`, which is signed, so `std::unsigned_integral` fails and only the `std::integral` overload is viable: it is called.

No ambiguity, because the compiler sees through the named concepts that one requirement includes the other. The same pair written as two raw `enable_if` conditions would make `send(5u)` ambiguous.
:::

::: check
A colleague says: "Adding concepts to our matrix library will make the flight code faster, because the compiler knows more about the types." Is that right? What does the change actually buy?
:::

::: answer
No. Constraints are checked while compiling and then vanish; when we compiled the `enable_if` and concept versions of `to_dps` with `-O2`, the machine code for `main` was identical. For the types the library already accepted, nothing about the generated code changes.

What it buys is at build time: a misuse like `Matrix<std::string, 2, 2>` or `Matrix<int, 3, 3>` is rejected at the line that wrote it, with a message naming the failed requirement, instead of an error from inside the library's loops, or no error at all. It also documents the requirement where every reader sees it.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| SFINAE | Substitution failure is not an error | A candidate whose declaration fails to substitute is dropped, not an error |
| `enable_if_t<B, T>` | `T` only when `B` is true | False: no member `type`, so the candidate disappears |
| enable_if's cost | Hidden intent | Errors like `no type named 'type' in 'struct std::enable_if<false, double>'`; overlaps are ambiguous |
| Concept | A named compile-time requirement | `template <typename T> concept Scalar = std::floating_point<T> && ...;` |
| requires-clause | States a constraint | `template <Scalar T>`, `requires Scalar<T>`, `Scalar auto x` |
| requires-expression | Tests whether code is valid | Simple, compound `{ e } -> C<T>`, type `typename T::X;`, nested `requires ...;` |
| Standard concepts | From `<concepts>` | `std::integral`, `std::floating_point`, `std::same_as`, `std::convertible_to` |
| Subsumption | More constrained wins | Works through named concepts |
| Benefit | Readable diagnosis at the call site | Same runtime code |

Next lesson moves from checking types at compile time to *computing* at compile time: `constexpr` and `consteval` functions, `constinit`, and `if constexpr`, which chooses behavior on a type property like `std::is_floating_point_v<T>` **[[without writing a single specialization|if-constexpr-bridge]]**.

::: context overload-resolution How the compiler picks one function
Overload resolution runs in three steps. Collect every function with the right name that lookup can see. Keep only the **viable** ones, those that can accept these arguments at all; this is where SFINAE and constraints remove candidates. Then rank the survivors: an exact match beats a promotion (such as `float` to `double`), which beats a conversion (such as `int` to `double`). If one candidate is best, it is called; if two tie, the call is ambiguous.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="96" height="44" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="58" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">1. collect</text>
  <text x="58" y="65" font-size="11" text-anchor="middle" fill="#1f2a44">candidates</text>
  <rect x="132" y="30" width="96" height="44" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">2. drop the</text>
  <text x="180" y="65" font-size="11" text-anchor="middle" fill="#1f2a44">non-viable</text>
  <rect x="254" y="30" width="96" height="44" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="302" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">3. rank,</text>
  <text x="302" y="65" font-size="11" text-anchor="middle" fill="#1f2a44">pick the best</text>
  <line x1="106" y1="52" x2="126" y2="52" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="131,52 123,48 123,56" fill="#1f2a44"/>
  <line x1="228" y1="52" x2="248" y2="52" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="253,52 245,48 245,56" fill="#1f2a44"/>
  <text x="180" y="96" font-size="11" text-anchor="middle" fill="#b4232c">SFINAE and concepts act here</text>
</svg>
```
:::

::: context sfinae-name An acronym that stuck
The phrase comes from the standard's own rule, and the acronym was popularized by David Vandevoorde and Nicolai Josuttis in their book *C++ Templates*, which this module lists as a resource. For many years SFINAE was the main way to put conditions on templates, and whole libraries of tricks were built on it. Most of those tricks have a one-line concept equivalent today, but you will read SFINAE code for years, in older libraries and in any codebase still built as C++14 or C++17.
:::

::: context adc-count What a raw count is
A sensor's analog-to-digital converter (ADC) turns a voltage into an integer. A 16-bit converter gives a signed number from $-32768$ to $32767$. The datasheet says what one count means, the **scale factor**, here $0.00875$ degrees per second per count, so the full range is about $\pm 287\,\mathrm{deg/s}$. Flight software reads counts from the device, then converts to physical units once, at the driver boundary. Mixing up "counts" and "units" is a classic bug, which is exactly why a type-based rule helps.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="90" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="55" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">gyro ADC</text>
  <line x1="100" y1="50" x2="150" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="156,50 146,45 146,55" fill="#1f2a44"/>
  <text x="128" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">1234</text>
  <rect x="158" y="30" width="90" height="40" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="203" y="47" font-size="11" text-anchor="middle" fill="#1f2a44">× 0.00875</text>
  <text x="203" y="62" font-size="11" text-anchor="middle" fill="#1f2a44">to_dps</text>
  <line x1="248" y1="50" x2="290" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="296,50 286,45 286,55" fill="#1f2a44"/>
  <text x="326" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">10.80</text>
  <text x="55" y="92" font-size="11" text-anchor="middle" fill="#6c7a93">int16 counts</text>
  <text x="326" y="92" font-size="11" text-anchor="middle" fill="#6c7a93">deg/s</text>
</svg>
```
:::

::: context concepts-history A feature that took twenty years
Concepts were proposed for the standard that became C++11, and a large version was voted in and then taken out again in 2009, judged too complex to finish in time. A smaller design, nicknamed "Concepts Lite", was published first as a Technical Specification and then merged into C++20. The wait is one reason SFINAE tricks became so elaborate: for a long time they were the only tool available.
:::

::: context diagnostics-depth Asking g++ for more detail
The last line of that report, `set '-fconcepts-diagnostics-depth=' to at least 2 for more detail`, is a real g++ option. By default g++ shows the first failed requirement and stops. With `-fconcepts-diagnostics-depth=2` or more, it opens up nested concepts and shows further failures. For a deep concept built from other concepts, raising it is often the fastest way to find which piece failed. clang++ has its own format, but also reports the unsatisfied requirement by name.
:::

::: context interface-boundary Why the location of an error matters
A template library is written by one team and used by many. The *interface* is what users see: names, parameter types, and now the constraints. The *implementation* is the loops and helpers inside. An error reported in the implementation asks the user to understand code they did not write; an error reported at the interface speaks their language.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="110" height="110" rx="8" fill="#fff" stroke="#1f2a44"/>
  <text x="65" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">your code</text>
  <text x="65" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">Matrix&lt;string,2,2&gt;</text>
  <rect x="140" y="20" width="16" height="110" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="148" y="146" font-size="11" text-anchor="middle" fill="#1d6fd1">Scalar</text>
  <rect x="176" y="20" width="174" height="110" rx="8" fill="#fff" stroke="#1f2a44"/>
  <text x="263" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">library internals</text>
  <text x="263" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">s += a(i,k) * b(k,j)</text>
  <circle cx="148" cy="76" r="7" fill="#1d6fd1"/>
  <circle cx="330" cy="100" r="7" fill="#b4232c"/>
  <text x="263" y="118" font-size="11" text-anchor="middle" fill="#b4232c">unconstrained error</text>
</svg>
```

Blue: where the constrained error is reported. Red: where the unconstrained one surfaces.
:::

::: context if-constexpr-bridge One template, two behaviors
In this lesson, each type property got its own overload: one `to_dps` for integers, one for floating point. Lesson 7 shows `if constexpr (std::is_integral_v<T>)`, an ordinary-looking `if` evaluated at compile time. The branch not taken is not instantiated for that type, so one function body can scale counts for integers and pass values through for floats. Concepts decide *whether* a template may be used; `if constexpr` decides *what* it does once chosen.
:::
