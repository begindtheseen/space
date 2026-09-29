---
id: l10-build-cost-and-template-errors
title: Build cost and reading template errors
minutes: 24
covers:
  - "Template instantiation cost, build-time blow-up, extern template"
  - "Reading a template error message without despair"
---

Picture a school with twenty classrooms, and every class needs the same 300-page textbook. One way: each teacher borrows the master copy, photocopies all 300 pages, and binds a copy for their own room. Twenty copies get made, and at the end of term the office throws nineteen of them away because one is enough for the archive. The other way: the print shop makes the book once, and each classroom gets a slip saying "the book is in the library, shelf 4". The second way uses one photocopier run instead of twenty.

C++ templates normally work the first way: every file that uses `Kalman<double, 6>` builds its own copy on the spot. Convenient, and slow. This lesson measures that cost on a small but realistic filter library, then cuts it with **`extern template`**, the "it is in the library, shelf 4" slip.

The second half is about a different cost: the long, frightening error messages templates produce. They have a fixed structure, and a four-step method finds the line that matters. Both halves are everyday life on a flight-software team, where the full build runs many times a day on every laptop and on the continuous-integration servers.

## Why templates cost build time

Recall from lesson 1 how a template becomes code. A template is a recipe, not code. When a file uses `Kalman<double, 6>`, the compiler **instantiates** it: it writes out a real class, and real functions for every member that file calls, with `T = double` and `N = 6` filled in. Two facts turn that into a build-time problem.

**First, every distinct set of arguments is a new copy.** `Kalman<double, 6>`, `Kalman<float, 6>` and `Kalman<double, 9>` are three unrelated classes as far as the compiler is concerned. Each gets its own `predict`, its own `update`, its own helper functions, each parsed, checked, optimized and turned into machine code separately. Nested templates multiply: if `update` calls `mul`, `inverse` and `transpose`, each instantiation of the filter drags in its own copy of each helper. Two scalar types times three state sizes is six filters, and with five member functions each that is thirty functions, from one header.

**Second, the definitions live in headers.** To instantiate a template, the compiler needs the full body, not only the declaration. So template code sits in headers, and every **[[translation unit|translation-unit]]** (one `.cpp` file plus everything it includes) that uses `Kalman<double, 6>` re-parses the header and re-instantiates the class for itself. The one-definition rule allows these duplicates, and the **[[linker keeps one copy|linker-discard]]** and throws the rest away. The throwing away is cheap. The making was not.

::: key
Why templates blow up build times: every distinct set of template arguments instantiates a new copy, and the definitions must live in headers, so every translation unit re-parses and re-instantiates them. The mitigations are `extern template` with explicit instantiation, and type-erased (non-template) interfaces at boundaries.
:::

None of this costs anything at run time. The final program holds one copy of each function. The whole bill is paid while building.

::: example One header, twenty files
The test library is a header, `kalman.hpp`, holding a fixed-size matrix `Mat<T, N>` and a filter class template. Its member functions are declared in the class and defined below it, outside the class body (the reason matters later):

```cpp
template <typename T, std::size_t N>
class Kalman {
public:
    void predict(const Mat<T, N>& F, const Mat<T, N>& Q);
    void update(const std::array<T, N>& z, const Mat<T, N>& R);
    std::array<T, N> x{};
    Mat<T, N> P{};
private:
    static Mat<T, N> mul(const Mat<T, N>& A, const Mat<T, N>& B);
    static Mat<T, N> transpose(const Mat<T, N>& A);
    static Mat<T, N> inverse(Mat<T, N> A);     // Gauss-Jordan
};

// Member functions defined outside the class: NOT implicitly inline.
template <typename T, std::size_t N>
Mat<T, N> Kalman<T, N>::mul(const Mat<T, N>& A, const Mat<T, N>& B) {
    Mat<T, N> C;
    for (std::size_t i = 0; i < N; ++i)
        for (std::size_t j = 0; j < N; ++j) {
            T s{};
            for (std::size_t k = 0; k < N; ++k) s += A(i, k) * B(k, j);
            C(i, j) = s;
        }
    return C;
}
// ... transpose, inverse, predict and update follow the same pattern.
```

Twenty source files, `tu01.cpp` to `tu20.cpp`, each run a step of six filters, as when the estimator, the simulation, the tests and the tools all use the same filter types:

```cpp
#include "kalman.hpp"
template <typename T, std::size_t N>
T step(Kalman<T, N>& k) {
    Mat<T, N> F, Q, R;
    for (std::size_t i = 0; i < N; ++i) { F(i, i) = T(1); Q(i, i) = T(0.01); R(i, i) = T(0.1); }
    std::array<T, N> z{};
    k.predict(F, Q);
    k.update(z, R);
    return k.x[0];
}
double run01() {
    Kalman<double, 6> a; Kalman<float, 6> b; Kalman<double, 9> c;
    Kalman<float, 9> d; Kalman<double, 12> e; Kalman<float, 12> f;
    return step(a) + step(b) + step(c) + step(d) + step(e) + step(f);
}
```

A `main.cpp` calls all twenty `run` functions. Each file was compiled with `g++ -std=c++20 -Wall -Wextra -O2 -c`, one after another, and the whole build timed with the shell's `time`. On one machine, two builds took:

```text
real	0m11.658s
real	0m11.315s
```

The 21 object files together came to 602,352 bytes; `tu01.o` alone was 29,960 bytes. To see why, list the symbols in `tu01.o` with the **[[nm|nm-letters]]** tool (`nm -C tu01.o`). Part of it:

```text
0000000000000000 W Kalman<double, 6ul>::update(std::array<double, 6ul> const&, Mat<double, 6ul> const&)
```

The `W` means "weak": a definition this file made for itself, which the linker may discard in favor of an identical one. `tu01.o` has 30 of them: `predict`, `update`, `mul` and `inverse` for each of the six filters (24), plus the six `step` functions. (`transpose` is so small the optimizer inlined it everywhere.) Twenty files times 24 filter functions is 480 compiled copies of 24 distinct functions. Sanity check on the output: the program still printed its answer, `0.000` (the state starts at zero and every measurement was zero, so the estimate stays zero).
:::

## `extern template`: build it once, promise it everywhere

The fix has two halves, and you need both.

**Explicit instantiation definition.** In exactly one `.cpp` file, tell the compiler to build every member of a specialization right now:

```cpp
// kalman_inst.cpp: the one place the filters are compiled.
#include "kalman.hpp"
template class Kalman<double, 6>;
template class Kalman<float, 6>;
template class Kalman<double, 9>;
template class Kalman<float, 9>;
template class Kalman<double, 12>;
template class Kalman<float, 12>;
```

Read `template class Kalman<double, 6>;` as "instantiate the class Kalman of double and 6, all of it, here". There is no `<>` after the word `template`: that is what separates it from a specialization, `template <>`, which lesson 1 used to *replace* a recipe. This line uses the recipe as it is.

**Explicit instantiation declaration.** At the bottom of the header, where every other file sees it, add the promise:

```cpp
extern template class Kalman<double, 6>;
extern template class Kalman<float, 6>;
// ... one line for each of the six
```

Read `extern template class Kalman<double, 6>;` as "an external template instantiation: Kalman of double and 6 is compiled elsewhere, so do not build it here". The word `extern` means the same as it does on a variable declared in a header: "this exists, in some other file". A file that includes the header now compiles calls to `predict` and `update` as calls to outside functions, leaves them for the linker, and moves on.

::: example The same build, with extern template
Same twenty files, same flags, plus `kalman_inst.cpp`. Two timed builds on the same machine:

```text
real	0m4.639s
real	0m4.518s
```

The object files came to 186,176 bytes in total: `tu01.o` shrank from 29,960 to 7,800 bytes, and `kalman_inst.o`, where all the filter code now lives, is 27,024 bytes. `nm -C tu01.o` now shows the same function as

```text
                 U Kalman<double, 6ul>::update(std::array<double, 6ul> const&, Mat<double, 6ul> const&)
```

`U` means undefined here: a call to be filled in by the linker. There are 12 such lines, `predict` and `update` for six filters; `mul` and `inverse` do not appear at all, because only `predict` and `update` call them, and those now live in `kalman_inst.cpp`.

Put numbers on it with python3: $11.5 / 4.58 \approx 2.5$ times faster, and $602{,}352 / 186{,}176 \approx 3.2$ times less object code. The filter functions are now compiled once each, all in `kalman_inst.cpp`, instead of 480 times across twenty files. The program printed the same `0.000`. Sanity check: timed alone, `tu01.cpp` dropped from about 0.8 s to about 0.2 s, and `kalman_inst.cpp` takes about 0.7 s, close to one old-style file, as it should: it does the filter work once.
:::

Where did the time go? g++ can report its own timers with **[[-ftime-report|time-report]]**. For `tu01.cpp` the two lines that matter were (columns: user, system, wall time in seconds, then memory):

```text
without extern template:
 phase parsing                      :   0.15 ( 26%)   0.12 ( 67%)   0.28 ( 37%)    28M ( 58%)
 phase opt and generate             :   0.39 ( 68%)   0.05 ( 28%)   0.43 ( 57%)    14M ( 30%)
with extern template:
 phase parsing                      :   0.17 ( 71%)   0.11 ( 92%)   0.28 ( 76%)    28M ( 81%)
 phase opt and generate             :   0.05 ( 21%)   0.00 (  0%)   0.05 ( 14%)  1730k (  5%)
```

This shows exactly what `extern template` does and does not do. Parsing stayed at about 0.28 s: every file still reads the whole header, and the standard headers it includes. What vanished was "opt and generate", the optimizing and machine-code writing for the thirty functions, from 0.43 s to 0.05 s. `extern template` saves the *making*. It does not save the *reading*.

::: warning Functions defined inside the class are still compiled everywhere
The standard lets the compiler ignore an `extern template` for inline functions, so it can still inline them. Every member function defined *inside* the class body is implicitly inline. A test with one member of each kind:

```cpp
template <typename T> struct Box {
    T twice(T x) const { return x + x; }      // defined in the class: inline
    T thrice(T x) const;                       // defined below: not inline
};
template <typename T> T Box<T>::thrice(T x) const { return x + x + x; }
extern template struct Box<int>;
int f(int v) { Box<int> b; return b.twice(v) + b.thrice(v); }
```

Compiled at `-O0`, `nm` listed both as `U`; at `-O2`, only `thrice` remained, because `twice` had been instantiated and inlined into `f` anyway. For big member functions, define them outside the class, as `kalman.hpp` does, or `extern template` saves little.
:::

::: warning Every extern promise needs its instantiation
If the header declares `extern template class Kalman<float, 12>;` and nobody writes `template class Kalman<float, 12>;`, every file compiles happily and the link fails. Removing that one line from `kalman_inst.cpp` gave:

```text
tu01.cpp:(.text._Z4stepIfLm12EET_R6KalmanIS0_XT0_EE[_Z4stepIfLm12EET_R6KalmanIS0_XT0_EE]+0xa9): undefined reference to `Kalman<float, 12ul>::predict(Mat<float, 12ul> const&, Mat<float, 12ul> const&)'
```

Keep the two lists in the same order, side by side.
:::

## The other mitigations, and the ones that do not help

`extern template` fits when a few argument sets are used everywhere, which is typical of numerical kernels: `float` and `double`, a handful of state sizes. The general principle is to keep heavy template bodies out of the headers that many files include.

- **Split the header.** Put the class declaration in a light `kalman.hpp` and the member bodies in `kalman_impl.hpp`, included only by `kalman_inst.cpp`. Now no other file *can* instantiate the heavy parts, it parses less, and a missing instantiation shows up as a link error you cannot miss.
- **Put a non-template interface at the boundary.** A module that exposes `void update_nav(std::span<const double> measurement);` needs no templates in its header at all; the template machinery lives inside one `.cpp`. When the boundary needs flexible behavior, **[[type erasure|type-erasure]]** (`std::function`, or an abstract interface with virtual functions) gives it for a small run-time cost, paid once per call rather than inside the inner loop.
- **Use fewer distinct argument sets.** Every extra combination, such as a `Kalman<double, 7>` nobody needs, is another full copy.
- **Make the reading cheaper.** **[[Precompiled headers|pch]]** cache the parsed result of big, stable headers. C++20 **[[modules|modules-bridge]]** go further: an interface is compiled once and imported, not re-parsed.

Some tempting fixes miss. Turning optimization off makes "opt and generate" faster, but slows the flight code and still instantiates everything. More parallel compile jobs finish the same total work sooner; they do not reduce it. Rewriting the numerical kernels around virtual dispatch removes the templates but puts a call that cannot be inlined inside every inner loop, trading build time for run time in the worst place. Measure first, then instantiate once.

## Reading a template error without despair

Templates have a second reputation: error messages that go on for pages. When code inside a template fails, the failure sits deep inside library code you did not write, and the compiler prints the whole chain of instantiations that led there, then every overload it considered and why each was rejected.

That structure is also the way in. The message always has the same parts, and four steps read them.

1. **Find the first line containing `error:`.** Not the first line of output: the first *error*. Everything before it is context; errors after it are often consequences of it.
2. **Right above it, find `required from here`.** That line carries *your* file name and line number: the place where your code asked for the template that failed. The `required from` lines above it are the **[[instantiation chain|instantiation-stack]]**, the library calling itself, and you can skim them.
3. **Read the error line itself as a sentence about types.** "No match for 'operator<' (operand types are 'const Waypoint' and ...)" is a complete diagnosis once you know which line of yours caused it.
4. **Skim the `note: candidate` lines only to confirm.** They list every function of that name the compiler could see, each with the reason it did not fit. If *your* intended function is not among them, it was never declared or not visible. If it is, its note says what did not match.

::: example A set of waypoints with no ordering
A route stored as a `std::set` (which keeps its elements sorted) of a small struct:

```cpp error
#include <set>

struct Waypoint {
    double lat_deg;
    double lon_deg;
};

int main() {
    std::set<Waypoint> route;
    route.insert({28.5, -80.6});
}
```

g++ 13 (`-std=c++20 -Wall -Wextra -O2`) prints 63 lines, 7,610 characters, with 1 error and 21 notes. The first sixteen lines, with the longest template argument lists shortened to `...` so they fit on a page:

```text
In file included from /usr/include/c++/13/bits/stl_tree.h:65,
                 from /usr/include/c++/13/set:62,
                 from err1.cpp:1:
/usr/include/c++/13/bits/stl_function.h: In instantiation of 'constexpr bool std::less<_Tp>::operator()(const _Tp&, const _Tp&) const [with _Tp = Waypoint]':
/usr/include/c++/13/bits/stl_tree.h:2118:35:   required from '... std::_Rb_tree<...>::_M_get_insert_unique_pos(const key_type&) [with ...]'
/usr/include/c++/13/bits/stl_tree.h:2171:4:   required from '... std::_Rb_tree<...>::_M_insert_unique(_Arg&&) [with ...]'
/usr/include/c++/13/bits/stl_set.h:523:25:   required from '... std::set<_Key, _Compare, _Alloc>::insert(value_type&&) [with ...]'
err1.cpp:10:17:   required from here
/usr/include/c++/13/bits/stl_function.h:408:20: error: no match for 'operator<' (operand types are 'const Waypoint' and 'const Waypoint')
  408 |       { return __x < __y; }
      |                ~~~~^~~~~
In file included from /usr/include/c++/13/bits/stl_algobase.h:67,
                 from /usr/include/c++/13/bits/stl_tree.h:63:
/usr/include/c++/13/bits/stl_iterator.h:583:5: note: candidate: 'template<...> ... std::operator<=>(const reverse_iterator<_IteratorL>&, const reverse_iterator<_IteratorR>&)' (reversed)
  583 |     operator<=>(const reverse_iterator<_IteratorL>& __x,
      |     ^~~~~~~~
/usr/include/c++/13/bits/stl_iterator.h:583:5: note:   template argument deduction/substitution failed:
```

Apply the method:

1. **First `error:`**: line 9 of the output, `no match for 'operator<' (operand types are 'const Waypoint' and 'const Waypoint')`. Something tried `a < b` on two waypoints, and no such operator exists.
2. **`required from here`**: `err1.cpp:10:17`, the `route.insert(...)` line. Your line. The three `required from` lines above it show the path: `set::insert` called the red-black tree's `_M_insert_unique`, which called `_M_get_insert_unique_pos`, which used `std::less<Waypoint>`, which does `__x < __y`. A set must compare elements to know where each one goes.
3. **Read it as a sentence**: "a `std::set<Waypoint>` needs `Waypoint < Waypoint`, and there is none."
4. **Candidates**: all seven are `operator<` or `operator<=>` for `reverse_iterator`, `move_iterator` and `pair`, each rejected with "'const Waypoint' is not derived from ...". None is yours, which confirms the diagnosis: you never wrote one.

The fix is to give `Waypoint` an ordering. The shortest is a defaulted three-way comparison, which compares `lat_deg` first, then `lon_deg`:

```cpp
#include <compare>
#include <cstdio>
#include <set>

struct Waypoint {
    double lat_deg;
    double lon_deg;
    auto operator<=>(const Waypoint&) const = default;   // compare lat, then lon
};

int main() {
    std::set<Waypoint> route;
    route.insert({28.5, -80.6});
    route.insert({28.4, -80.6});
    route.insert({28.5, -80.6});   // a duplicate: ignored
    for (const auto& w : route) std::printf("%.1f %.1f\n", w.lat_deg, w.lon_deg);
    std::printf("size %zu\n", route.size());
}
```

It prints:

```text
28.4 -80.6
28.5 -80.6
size 2
```

Sanity check: the set is sorted (28.4 before 28.5) and the duplicate was dropped, leaving 2. The other fix is to hand the set a comparison object: `std::set<Waypoint, ByLatLon>`.
:::

The same method works on the error the last module showed only one line of: `std::sort` on a `std::list`. There g++ prints 24 lines. The first `error:` is `no match for 'operator-' (operand types are 'std::_List_iterator<int>' and ...)`, and one line above it `required from here` names your `std::sort(l.begin(), l.end());`. Read as a sentence: sort tried to subtract two list iterators, which only random-access iterators can do. Fix: `l.sort();`.

::: warning Fix the first error, then compile again
After the first error the compiler guesses how to continue, and the guesses produce **[[follow-on errors|cascade]]** that vanish once the first is fixed. Do not work down a list of fifty errors. Fix the first, rebuild, repeat. `g++ -fmax-errors=1` stops after one error if the scrolling bothers you.
:::

### Concepts put the error at your door

Lesson 6 showed what constraining a template does for its messages. Here it is on this error. Suppose a small container class of your own is constrained with the standard concept `std::totally_ordered` ("has all of `<`, `>`, `<=`, `>=`, `==` and `!=`"):

```cpp fragment
template <std::totally_ordered T>
class Catalog {
public:
    void add(const T& item) { items_.insert(item); }
private:
    std::set<T> items_;
};

int main() {
    Catalog<Waypoint> route;          // Waypoint without operator<=>
    route.add({28.5, -80.6});
}
```

(The full file, `err3.cpp`, has the includes and the unchanged `Waypoint` above this.) Now g++ prints 28 lines, and the first two are:

```text
err3.cpp:18:21: error: template constraint failure for 'template<class T>  requires  totally_ordered<T> class Catalog'
err3.cpp:18:21: note: constraints not satisfied
```

The error names your file and line at once. Below it, the `required for the satisfaction of` lines work down from `totally_ordered<T>` to the first part that failed, `equality_comparable<_Tp>`, and the notes say which expressions were invalid: `(__t == __u)`, `(__t != __u)`, and their mirror images. At the very end comes a second error, `request for member 'add' in 'route', which is of non-class type 'int'`: a follow-on error from the compiler's guess, gone once the first is fixed. The same defaulted `operator<=>` fixes it, because a defaulted `<=>` also gives the type a defaulted `==`.

::: key
Reading a template error: (1) find the first `error:` line; (2) right above it, find `required from here`, which is your file and line; (3) read the error as a statement about types; (4) use the `note: candidate` lines to confirm, and the constraint lines (`required for the satisfaction of`, `the required expression ... is invalid`) to see which requirement failed. A concept moves the error to the line that misused the template.
:::

## Check yourself

::: check
A header defines `template <typename T> T lerp(T a, T b, T t)` and 40 files call it with `double`, 10 of them also with `float`. How many copies of `lerp` are compiled, and how many are in the final program?
:::

::: answer
Each file that uses a specialization instantiates it for itself: 40 copies of `lerp<double>` plus 10 of `lerp<float>`, 50 compiled copies (unless the optimizer inlines them and drops the separate function). The linker keeps one of each, so the program contains 2. For a filter class with big member functions, 48 wasted copies are real build time.
:::

::: check
With `extern template`, `-ftime-report` put parsing at 76% of the wall time for `tu01.cpp`, up from 37% before. Why did the share go *up* when the parsing time itself stayed at about 0.28 s, and what would you try next to speed the build further?
:::

::: answer
The share is parsing time divided by total time. Parsing stayed about the same, 0.28 s, but "opt and generate" fell from 0.43 s to 0.05 s, so the total fell and the unchanged parsing became most of what is left. `extern template` cannot help with that; it only stops the making of code. The next steps attack the reading: split the header so most files include only declarations, use a precompiled header for the big stable standard headers, or, where the toolchain supports them well, C++20 modules.
:::

::: check
Why does `kalman.hpp` define `predict` below the class, as `template <typename T, std::size_t N> void Kalman<T, N>::predict(...)`, instead of inside the class body?
:::

::: answer
A member function defined inside the class body is implicitly inline, and the standard allows the compiler to instantiate inline functions despite `extern template`, so it can inline them. The lesson's `Box` test showed it: at `-O2` the in-class `twice` was compiled in the file anyway, while the out-of-class `thrice` stayed an undefined reference. Defining the big members outside the class lets `extern template` suppress them.
:::

::: check
A teammate's build fails with `undefined reference to 'Kalman<double, 18ul>::update(...)'` after they added an 18-state filter. Every file compiled. What happened, and what are the two possible fixes?
:::

::: answer
Linking failed, not compiling: the header promises `extern template class Kalman<double, 18>;` (or holds only declarations), so no file built it, and no file contains `template class Kalman<double, 18>;`. Fix: add that line to `kalman_inst.cpp`, or, if only one test uses 18 states, drop the `extern` promise so that file instantiates it itself.
:::

::: check
Here is the middle of a real g++ 13 error for this file, `err4.cpp`, with the longest template argument list shortened to `...`. Which line do you read first, and what is the fix?

```cpp error
#include <map>

struct Vec3 {
    double x, y, z;
};

int main() {
    Vec3 v{1.0, 2.0, 3.0};
    std::map<Vec3, int> m;
    m[v] = 1;
}
```

```text
/usr/include/c++/13/bits/stl_function.h: In instantiation of 'constexpr bool std::less<_Tp>::operator()(const _Tp&, const _Tp&) const [with _Tp = Vec3]':
/usr/include/c++/13/bits/stl_map.h:511:32:   required from 'std::map<_Key, _Tp, _Compare, _Alloc>::mapped_type& std::map<_Key, _Tp, _Compare, _Alloc>::operator[](const key_type&) [with ...]'
err4.cpp:10:8:   required from here
/usr/include/c++/13/bits/stl_function.h:408:20: error: no match for 'operator<' (operand types are 'const Vec3' and 'const Vec3')
```
:::

::: answer
The fourth line is the first `error:`: no `operator<` for two `Vec3`. The line above it, `err4.cpp:10:8: required from here`, is the `m[v] = 1;` line. Read together: a `std::map` keeps its keys sorted with `std::less<Vec3>`, which needs `Vec3 < Vec3`. Fix: add `auto operator<=>(const Vec3&) const = default;` to `Vec3`, or give the map a comparison type. (If the keys do not need an order, a hash map with a hash for `Vec3` is another option.)
:::

## Summary

| Idea | Meaning | Rule or fact |
|---|---|---|
| instantiation cost | each distinct argument set is a full new copy | 6 filters × 4 functions × 20 files = 480 compiled copies |
| header-only cost | every translation unit re-parses and re-instantiates | linker keeps one copy (weak symbols, `W` in `nm`) |
| explicit instantiation definition | `template class Kalman<double, 6>;` | in exactly one `.cpp`; builds every member |
| explicit instantiation declaration | `extern template class Kalman<double, 6>;` | in the header; other files emit calls (`U` in `nm`) |
| measured effect | one machine, 20 files | 11.5 s → 4.6 s; 602 kB → 186 kB of objects |
| what it cannot save | parsing the headers | precompiled headers, split headers, modules |
| inline members | defined in the class body | may still be instantiated for inlining; define big ones outside |
| non-fixes | `-O0`, more parallel jobs, virtual everything | same work, or a slower flight loop |
| error method | first `error:`, `required from here`, read it, candidates | fix the first error, then rebuild |
| concepts | constraint on the template | error at your line, naming the failed requirement |

That finishes templates. The next module, cod_cpp_06_modern, steps back to look at modern C++ as a whole, from C++11 through C++23: what each standard added, which features lower the defect rate, and the question every flight team must answer, which subset of the language you would allow inside a 1 kHz control task.

::: context translation-unit What the compiler sees at once
A translation unit is what the compiler works on in one run: a single `.cpp` file after the preprocessor has pasted in every `#include`, recursively. A 30-line `.cpp` that includes `<vector>`, `<map>` and a project header can become tens of thousands of lines. The compiler knows nothing about other translation units; each one is compiled alone into an object file (`.o`), and only the linker sees them together. That isolation is why each unit must re-read and re-instantiate the templates it uses.
:::

::: context linker-discard Twenty copies in, one copy out
g++ places each template instantiation in its own section of the object file, marked so that the linker knows identical copies may appear in other files. The linker keeps the first and discards the rest.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="10" y="10" width="70" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="45" y="27">tu01.o</text>
    <rect x="10" y="44" width="70" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="45" y="61">tu02.o</text>
    <rect x="10" y="78" width="70" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="45" y="95">tu03.o</text>
    <text x="45" y="122">...</text>
    <rect x="10" y="132" width="70" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="45" y="149">tu20.o</text>
    <rect x="140" y="62" width="80" height="44" rx="6" fill="#f2b880" stroke="#1f2a44"/><text x="180" y="88">linker</text>
    <rect x="270" y="70" width="80" height="28" fill="#1d6fd1" stroke="#1f2a44"/><text x="310" y="88" fill="#ffffff">1 copy</text>
    <text x="310" y="126" fill="#b4232c">19 discarded</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.2">
    <line x1="80" y1="23" x2="140" y2="72"/><line x1="80" y1="57" x2="140" y2="78"/>
    <line x1="80" y1="91" x2="140" y2="86"/><line x1="80" y1="145" x2="140" y2="98"/>
    <line x1="220" y1="84" x2="270" y2="84"/>
  </g>
</svg>
```

Each of the twenty was parsed, optimized and written out before being thrown away.
:::

::: context nm-letters Looking inside an object file
`nm` lists the symbols (named functions and variables) in an object file, one per line, with a letter for each. `T` is a normal function defined in this file. `W` is a weak definition, one the linker may replace with an identical copy from elsewhere; template instantiations and inline functions show up this way. `U` is undefined: used here, defined somewhere else. The `-C` option turns the compiler's encoded names, such as `_ZN6KalmanIdLm6EE6updateE...`, back into readable C++.
:::

::: context time-report Timers inside the compiler
`-ftime-report` makes g++ print a table of how long each stage took: parsing, template instantiation, optimization and code generation, and dozens of finer passes. The percentages vary from run to run, so compare big differences only. clang has a more visual cousin, `-ftime-trace`, which writes a JSON file per translation unit that a trace viewer such as Perfetto can draw as a timeline, showing which header or which template took the time. Build engineers on large codebases use these to find the few headers that cost the most.
:::

::: context type-erasure Hiding the type behind a fixed interface
Type erasure means accepting many different types through one fixed, non-template type. `std::function<double(double)>` from the last module is the standard example: any callable fits, and the code that uses it is compiled once. The price is an indirect call that usually cannot be inlined. At a module boundary, called once per cycle, that price is tiny, and it lets the header stay free of templates, so every file that includes it compiles faster.
:::

::: context pch Parsing a header once
A precompiled header is a big, rarely changing header (the standard headers, a math library) that the compiler parses once and saves in its internal form. Later compilations load that saved form instead of re-reading the text. g++ writes it as a `.gch` file next to the header; CMake sets it up with `target_precompile_headers`. It helps parsing, not instantiation, and it must be rebuilt whenever the header changes, so it suits stable headers, not the ones you edit every day.
:::

::: context modules-bridge Modules, and why they are slow to arrive
A C++20 module is compiled once into a binary interface that other files import, instead of a header that every file re-reads. For template-heavy code that removes most of the parsing cost measured here. Adoption has been slow: compilers and build systems needed years to support them well, and large codebases cannot switch overnight. The next module, cod_cpp_06_modern, looks at why and what modules will change.
:::

::: context instantiation-stack The chain of "required from"
Each `required from` line is one step of a chain: your code asked for a template, which asked for another, and so on until something failed. g++ prints it from the innermost step down to your line.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <rect x="20" y="10" width="320" height="30" fill="#b4232c" stroke="#1f2a44"/>
    <text x="30" y="30" fill="#ffffff">error: std::less does __x &lt; __y</text>
    <rect x="20" y="48" width="320" height="30" fill="#ffffff" stroke="#6c7a93"/>
    <text x="30" y="68">required from _M_get_insert_unique_pos</text>
    <rect x="20" y="86" width="320" height="30" fill="#ffffff" stroke="#6c7a93"/>
    <text x="30" y="106">required from _M_insert_unique</text>
    <rect x="20" y="124" width="320" height="30" fill="#ffffff" stroke="#6c7a93"/>
    <text x="30" y="144">required from std::set::insert</text>
    <rect x="20" y="162" width="320" height="30" fill="#1d6fd1" stroke="#1f2a44"/>
    <text x="30" y="182" fill="#ffffff">required from here: err1.cpp line 10 (yours)</text>
  </g>
</svg>
```

Read the bottom box first, then the top one. The middle is the library's business.
:::

::: context cascade Why one mistake makes many errors
A compiler that stopped at the first error would make you rebuild once per mistake, so it tries to recover: it guesses what you meant and keeps going. A guess can be wrong. When `Catalog<Waypoint>` failed, g++ carried on as if `route` were an `int`, and then complained that an `int` has no member `add`. That second error describes the compiler's guess, not your code. The same habit applies in every language: fix the first error, rebuild, repeat.
:::
