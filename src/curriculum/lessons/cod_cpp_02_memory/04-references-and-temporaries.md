---
id: l04-references-and-temporaries
title: References, value categories, and the lifetime of a temporary
minutes: 23
covers:
  - 'References: lvalue and rvalue, binding rules, lifetime extension of temporaries'
---

Think of a reference as a nickname. Your friend Alexandra is "Alex" to you, but there is still only one Alexandra. Whatever you say to Alex, you say to her. A nickname has to belong to someone from the moment you coin it, it cannot quietly move to a different person later, and it makes no sense as a nickname for nobody.

That is a C++ **reference**: a second name for an object that already exists. The previous module gave you the working rules. A reference is bound when it is created, never reseated, never null, and `const T&` is the default way to pass something you only read. Here they are side by side with the pointer from lesson 02, because the contrast is what you will be asked about.

::: key
Pointer versus reference, the practical differences: a reference must be bound at initialization, cannot be rebound and cannot be null; a pointer can be null, reseated and arithmetic-ed. Use a reference for a required parameter, a pointer (or `std::optional`) when absence is meaningful.
:::

Those rules are enough to write correct functions. They are not enough to read the compiler's errors about references, or to know when a reference to a *temporary* is safe. The missing piece is **value categories**: every expression in C++ is sorted into, roughly, "something with a home" or "something without one". The binding rules are written in those terms, and so is the one rule that lets `const T&` keep a temporary alive.

This matters in flight code in a specific, recurring way. You write functions that return a state vector or a **[[quaternion|quaternion]]** by value, and callers that want to look at the result without copying it. Sometimes `const auto& q = compute_attitude();` is exactly right and costs nothing. Sometimes the identical-looking `const auto& q = wrapper(compute_attitude());` is a **dangling reference**, a nickname for someone who has left. This lesson is how you tell them apart.

## Value categories: does the expression have a home?

Picture two kinds of thing on your desk. A book on the shelf has a place: you can point at it, come back tomorrow, and it is still there. The answer you scribble on a sticky note while doing a sum is used once and thrown in the bin at the end of the line.

C++ sorts every expression the same way. Ask: does it name an object that exists somewhere you could point at?

An **lvalue** (say "L-value") does — it has a home. A named variable, a dereferenced pointer `*p`, a member of an lvalue, an array element, a function call returning `T&` — all lvalues. The quick test is that `&expr` compiles. (`&` in front of an expression is the address-of operator, read "address of".)

An **rvalue** ("R-value") does not, or not for long. A literal like `3`, the result of arithmetic like `a + b`, a function call returning `T` by value, an explicit temporary like `Tracer{3}` — all rvalues. `&(a + b)` does not compile, because there is no object whose address that would be.

The standard splits rvalues further into **[[prvalues and xvalues|value-category-tree]]**. A *prvalue* ("pure rvalue") is a plain value, like `3` or `f()` returning by value. An *xvalue* ("expiring value") is an object at the end of its life, which is what `std::move(x)` produces. That split matters for move semantics, which the next module covers. For memory and lifetime, "lvalue or rvalue" is the split that decides everything.

The names are **[[historical|lvalue-history]]**: an lvalue could stand on the *left* of an `=`, an rvalue only on the right. The rule no longer holds — a `const` lvalue cannot be assigned to — so read the words as *has identity* versus *does not*.

## The binding rules

C++ has three kinds of reference you will meet. Read `T&` as "T ref" (an **lvalue reference**), `const T&` as "const T ref", and `T&&` — two ampersands — as "T ref-ref", an **rvalue reference**. Here is what each will bind to:

| Reference type | Binds to a non-const lvalue | to a const lvalue | to an rvalue |
| --- | --- | --- | --- |
| `T&` | yes | no | no |
| `const T&` | yes | yes | yes |
| `T&&` | no | no | yes |

Two rows explain nearly every reference error you will see.

`T&` refuses rvalues. A plain `T&` lets you modify the object, and modifying something with no home — a value about to be thrown away — is almost always a mistake.

`const T&` accepts everything. It promises not to modify, so there is no harm in letting it look at a temporary. That is why it is the universal read-only parameter.

`T&&` is the mirror image of `T&`: it takes *only* rvalues. That is how a function says "this argument is a temporary, and I may take its insides".

::: example What the compiler says about each illegal binding
Six legal bindings and four illegal ones, in one file:

```cpp error
#include <string>

std::string name() { return "imu"; }

int main() {
    int x = 3;
    const int cx = 4;

    int&        a = x;          // fine
    const int&  b = x;          // fine
    const int&  c = cx;         // fine
    const int&  d = 5;          // fine: binds to a temporary
    int&&       e = 5;          // fine
    int&&       f = x + 1;      // fine

    int&        g = 5;          // error 1: non-const lvalue ref to rvalue
    int&        h = cx;         // error 2: drops const
    int&&       i = x;          // error 3: rvalue ref to lvalue
    std::string& j = name();    // error 4: non-const lvalue ref to a temporary
    return 0;
}
```

g++ 13.3.0 accepts the first six and rejects exactly the last four:

```text
l04-binding.cpp:16:21: error: cannot bind non-const lvalue reference of type 'int&' to an rvalue of type 'int'
   16 |     int&        g = 5;          // error 1: non-const lvalue ref to rvalue
      |                     ^
l04-binding.cpp:17:21: error: binding reference of type 'int&' to 'const int' discards qualifiers
   17 |     int&        h = cx;         // error 2: drops const
      |                     ^~
l04-binding.cpp:18:21: error: cannot bind rvalue reference of type 'int&&' to lvalue of type 'int'
   18 |     int&&       i = x;          // error 3: rvalue ref to lvalue
      |                     ^
l04-binding.cpp:19:26: error: cannot bind non-const lvalue reference of type 'std::string&' ... to an rvalue of type 'std::string'
   19 |     std::string& j = name();    // error 4: non-const lvalue ref to a temporary
      |                      ~~~~^~
```

Learn these four messages by their shape, because you will meet them constantly. Each one names the rule it applied.

- "Cannot bind non-const lvalue reference … to an rvalue" is error 1 or 4. The fix: add `const`, or take the value by copy.
- "Discards qualifiers" is error 2. The object is `const` and your reference is not.
- "Cannot bind rvalue reference … to lvalue" is error 3. You wrote `T&&` where you meant `T&`, or you need `std::move`.

Now look at two legal lines. `int&& f = x + 1;` works because `x + 1` is an rvalue: there is no object called `x + 1`, so the compiler makes a temporary holding 4, and the rvalue reference binds to it. And `const int& d = 5;` works too. That raises a fair question. The literal 5 has no home, so what exactly is `d` a nickname for, and how long does it last?
:::

## Lifetime extension

A **temporary** is a nameless object the compiler creates to hold a value in the middle of an expression. Normally it dies at the end of the **[[full expression|full-expression]]** — in practice, at the semicolon. There is one exception, and it is the whole subject of this section:

> When a temporary is bound directly to a reference, the temporary's lifetime is extended to the lifetime of the reference.

That is **lifetime extension**. It applies to `const T&`, to `T&&`, and to `auto&&`. It is why `const int& d = 5;` is not dangling: the compiler creates an `int` holding 5, and that object lives as long as `d` does.

Think of a paper cup of water handed to you at a race. Normally the cup goes in the bin as soon as you have drunk. But if you close your hand around the cup yourself, it stays for as long as you keep holding it.

::: example Extension, observed
A `Tracer` announces its construction and destruction, so you can watch lifetimes happen. (`~Tracer`, read "tilde Tracer", is the destructor.)

```cpp
#include <cstdio>

struct Tracer {
    int id;
    explicit Tracer(int i) : id(i) { std::printf("  ctor Tracer(%d)\n", id); }
    ~Tracer() { std::printf("  dtor Tracer(%d)\n", id); }
};

Tracer make(int i) { return Tracer{i}; }

int main() {
    std::printf("1: temporary with no reference\n");
    make(1);                       // dies at the end of this full expression
    std::printf("2: bound to a const lvalue reference\n");
    const Tracer& r2 = make(2);    // lifetime extended to r2's scope
    std::printf("3: bound to an rvalue reference\n");
    Tracer&& r3 = make(3);         // also extended
    std::printf("4: bound to auto&&\n");
    auto&& r4 = make(4);           // also extended
    {
        std::printf("5: inner scope\n");
        const Tracer& r5 = make(5);
        std::printf("   still alive: id = %d\n", r5.id);
    }
    std::printf("6: inner scope has closed\n");
    std::printf("   r2 = %d, r3 = %d, r4 = %d\n", r2.id, r3.id, r4.id);
    return 0;
}
```

Built with `g++ -std=c++20 -Wall -Wextra -fsanitize=address,undefined` (the sanitizer stays silent, because nothing here is wrong):

```text
1: temporary with no reference
  ctor Tracer(1)
  dtor Tracer(1)
2: bound to a const lvalue reference
  ctor Tracer(2)
3: bound to an rvalue reference
  ctor Tracer(3)
4: bound to auto&&
  ctor Tracer(4)
5: inner scope
  ctor Tracer(5)
   still alive: id = 5
  dtor Tracer(5)
6: inner scope has closed
   r2 = 2, r3 = 3, r4 = 4
  dtor Tracer(4)
  dtor Tracer(3)
  dtor Tracer(2)
```

Walk through it.

- Tracer 1 was built and destroyed on the same line. Nothing held it, so it died at the semicolon.
- Tracers 2, 3 and 4 survived to the end of `main`. They were destroyed in reverse order of construction, 4 then 3 then 2, exactly like ordinary local variables — which is what they have become.
- Tracer 5 died at the closing brace of its block, because that is where `r5` stopped existing.

The **[[timeline|lifetime-timeline]]** is the whole rule in one picture. So `const auto& q = compute_attitude();` is not merely safe. It is the cheapest correct thing to write: no copy, no allocation, and the result lives exactly as long as you can name it.

Extension also reaches through a member access or an array subscript. The reference is then bound to a *part* of the temporary — a **subobject** — and the whole temporary is kept:

```cpp
std::printf("binding to a member of a temporary\n");
const int& n = make(8).id;       // extends the whole Tracer
std::printf("after the full expression; n = %d\n", n);
std::printf("end of main\n");
```

```text
binding to a member of a temporary
  ctor Tracer(8)
after the full expression; n = 8
end of main
  dtor Tracer(8)
```

Tracer 8 outlived its semicolon and died at the end of `main`, along with `n`.
:::

## Where extension does not happen

The word doing the work in the rule is **directly**. If your reference is initialized from something that is *already a reference*, no temporary is being bound, so there is nothing to extend. In the cup picture: someone else took the cup and handed you back only a note saying where it was. Two forms of this cost real time in real codebases.

::: example The two cases that dangle, and which tool finds each
**Case 1: through a function that returns its own parameter.** The temporary binds to the parameter `t`, not to your reference, so it dies at the semicolon.

```cpp fragment
// Tracer and make() as in the previous example.
const Tracer& pass_through(const Tracer& t) { return t; }

int main() {
    std::printf("binding through a function that returns its parameter\n");
    const Tracer& bad = pass_through(make(7));   // temporary dies here
    std::printf("about to read a destroyed object\n");
    std::printf("id = %d\n", bad.id);            // reads a destroyed object
    return 0;
}
```

g++ 13.3.0 catches this one at compile time, but only with `-Wextra`. With no flags, or with `-Wall` alone, it says nothing. With `-Wall -Wextra`:

```text
l04-noextend.cpp:15:19: warning: possibly dangling reference to a temporary [-Wdangling-reference]
   15 |     const Tracer& bad = pass_through(make(7));   // temporary dies here
      |                   ^~~
l04-noextend.cpp:15:37: note: the temporary was destroyed at the end of the full expression 'pass_through(make(int)())'
```

Build it with `-fsanitize=address -fno-sanitize-recover=all` and run it, and **[[AddressSanitizer|asan-intro]]** confirms it at run time:

```text
binding through a function that returns its parameter
  ctor Tracer(7)
  dtor Tracer(7)
about to read a destroyed object
=================================================================
==7321==ERROR: AddressSanitizer: stack-use-after-scope on address 0x7f8c32300020 ...
READ of size 4 at 0x7f8c32300020 thread T0
    #0 0x55dd3d116469 in main l04-noextend.cpp:17
    ...
```

(Here and below, `...` marks lines cut from the report, and file paths are shortened to the file name. Addresses and the process number change on every run.)

Look at the order of the lines. `dtor Tracer(7)` printed *before* the read. The destructor had already run, and the read came afterwards. That is a **[[use-after-scope|use-after-scope]]** written out by the program itself — and it is why putting a print in a destructor is a good first debugging move.

**Case 2: a reference member initialized in a constructor.** Here nothing at all warns.

```cpp fragment
// Tracer and make() as before.
struct Observer {
    const Tracer& t;                       // a reference member
    explicit Observer(const Tracer& r) : t(r) {}
    int id() const { return t.id; }
};

int main() {
    Observer o{make(9)};                   // no lifetime extension here
    std::printf("constructed; about to read through the member\n");
    std::printf("id = %d\n", o.id());
    return 0;
}
```

Follow the temporary. It binds to the constructor's parameter `r`. The member `t` is then initialized from `r`, which is a reference, not a temporary. Nothing is extended, and the `Tracer` dies at the end of the line that declares `o`. **[[The member is left pointing at nothing|reference-member-picture]]**.

g++ 13.3.0 at `-Wall -Wextra -Wpedantic` gave **no diagnostic at all**, and neither did clang++ 18.1.3. AddressSanitizer found it:

```text
  ctor Tracer(9)
  dtor Tracer(9)
constructed; about to read through the member
=================================================================
==7324==ERROR: AddressSanitizer: stack-use-after-scope on address 0x7f0e9ca00030 ...
READ of size 4 at 0x7f0e9ca00030 thread T0
    #0 0x557ad1310785 in Observer::id() const l04-member-ref.cpp:14
    #1 0x557ad131043b in main l04-member-ref.cpp:20
    ...
SUMMARY: AddressSanitizer: stack-use-after-scope l04-member-ref.cpp:14 in Observer::id() const
```

This is the strongest argument in the module for running your tests under the sanitizer. The bug is a two-line class that looks exactly like a hundred correct ones, and no warning fires. Built without the sanitizer at `-O0`, this program printed `id = 9` and exited 0 — the right answer, read from memory that had already been destroyed. That is the failure mode that ships. At `-O2` the same program printed `id = 32765`, which is at least visibly wrong.
:::

The oldest way to make a dangling reference needs no temporary at all: return a reference to a local variable.

```cpp
const double& latest_sample() {
    double reading = 9.81;
    return reading;             // the local dies as the function returns
}
```

g++ warns about this one even with no flags, as `reference to local variable 'reading' returned [-Wreturn-local-addr]`. Lesson 05 shows why: the local lives in the function's stack frame, and the frame is gone the moment the function returns.

::: key
A dangling reference is a reference to an object whose lifetime has ended. The classic is returning a reference or pointer to a local, or holding a reference into a vector that then reallocates on `push_back`.
:::

::: key
A temporary bound *directly* to a `const T&`, a `T&&` or an `auto&&` lives as long as that reference. Extension does not survive a function return, and it does not apply to a reference member initialized from a constructor parameter. A class with a reference member does not own anything and does not extend anything: it is a pointer that cannot be null, with the same lifetime obligation on whoever constructs it.
:::

::: warning
`auto` and `auto&` behave differently here, and the difference is silent.

- `auto q = compute_attitude();` copies.
- `const auto& q = compute_attitude();` binds and extends, with no copy.
- `auto&& q = compute_attitude();` also binds and extends.
- `const auto& q = wrapper(compute_attitude());`, where `wrapper` returns a reference, dangles.

The rule is about what the initializer *is*, not what it looks like. When the initializer is a function call, you have to know its return type.
:::

## `T&&` beyond binding

An rvalue reference is not, by itself, about memory. It is a signal that picks between overloads. Give a function two versions, `void store(const Data&)` and `void store(Data&&)`. A caller passing a named object gets the first. A caller passing a temporary gets the second, and the second is free to take the temporary's buffer instead of copying it. That is **move semantics**, and the next module develops it properly.

Two facts to carry now.

First, `std::move(x)` moves nothing. It is a **[[cast|std-move-cast]]** that turns the lvalue `x` into an xvalue, so that the `T&&` overload is chosen.

Second, a variable declared as `T&&` is itself an *lvalue*. Inside `void store(Data&& d)`, the name `d` has a home, so passing `d` onward picks the copying overload unless you write `std::move(d)` again. That surprises everyone once, so here it is running:

```cpp
#include <cstdio>
#include <utility>
#include <vector>

void store(const std::vector<int>&) { std::printf("  copy overload\n"); }
void store(std::vector<int>&&)      { std::printf("  move overload\n"); }

void forward_on(std::vector<int>&& d) {
    store(d);              // d has a name, so it is an lvalue
    store(std::move(d));   // cast back to an rvalue
}

int main() {
    std::vector<int> v{1, 2, 3};
    std::printf("named object:\n");
    store(v);
    std::printf("temporary:\n");
    store(std::vector<int>{4, 5});
    std::printf("inside forward_on:\n");
    forward_on(std::vector<int>{6});
    return 0;
}
```

```text
named object:
  copy overload
temporary:
  move overload
inside forward_on:
  copy overload
  move overload
```

## Check yourself

::: check
`const Tracer& r2 = make(2);` kept the temporary alive to the end of `main`. Where does that object physically live, and what does it cost compared with `Tracer r2 = make(2);`?
:::

::: answer
It lives in `main`'s stack frame, in exactly the place the by-value version would put it. Lifetime extension does not move the object anywhere. The temporary was already created in the caller's frame by the C++17 rule from lesson 01 (a prvalue returned by value is built directly in the caller's storage). Extension only changes *when its destructor runs*.

So the two lines cost the same: one construction, one destruction, no copy. The difference is only in the name you get. `Tracer r2` is an object you may modify. `const Tracer& r2` is a read-only alias. Prefer the reference form when the initializer's type is long or awkward to spell and you only want to read it.
:::

::: check
`int&& f = x + 1;` compiles but `int&& i = x;` does not. Explain both in one sentence each, and say what to write if you really want an rvalue reference bound to `x`.
:::

::: answer
`x + 1` is an rvalue: the addition produces a value with no home, the compiler puts it in a temporary, and `T&&` binds to rvalues.

`x` is an lvalue: it names an object, and `T&&` refuses lvalues so that a function overloaded on `T&&` cannot quietly gut a named object the caller still means to use.

If you really want it, write `int&& i = std::move(x);`. That casts the lvalue to an xvalue, and you are declaring that you accept whatever happens to `x` afterwards. For an `int` nothing happens, because moving a simple type is a copy. For a `std::vector` the moved-from object would be left empty.
:::

::: check
A reviewer sees `struct Filter { const Config& cfg; };` and asks for it to become `struct Filter { Config cfg; };`. Give the lifetime argument for the change, and the one circumstance in which the reference member is right.
:::

::: answer
The reference member makes `Filter` non-owning. Every `Filter` carries an obligation: the referenced `Config` must outlive it. That obligation is invisible at every call site, and no warning fires when it is broken. As the `Observer` example showed, building a `Filter` from a temporary `Config` compiles cleanly and produces a use-after-scope.

A `Config` member owns its data, and the obligation disappears. It also makes `Filter` assignable. A reference member silently prevents that: a reference cannot be reseated, so the compiler deletes the copy-assignment operator. (Copy *construction* still works; `a = b;` does not.)

The reference member is right when the `Config` is genuinely shared, expensive to copy, and has a lifetime you can point at — for example a configuration block with static storage duration, loaded once at startup and never replaced. Even then, a `const Config*` says "non-owning observer" more loudly. And if the lifetime is not plainly longer, `std::shared_ptr<const Config>` (lesson 14) is the answer.
:::

::: check
The `Observer` bug produced no compiler warning but a clear AddressSanitizer report. What does that tell you about where to spend your effort, and what does `-fno-sanitize-recover=all` add?
:::

::: answer
It tells you that warnings are a filter, not a net. `-Wall -Wextra` catches the shapes a compiler can see inside one function. Anything that crosses a function or constructor boundary is mostly out of its reach, and lifetime bugs usually cross exactly such a boundary. So the effort goes into a sanitized build that runs your whole test suite, not into hunting for one more warning flag.

`-fno-sanitize-recover=all` turns a finding into a non-zero exit status. Without it, some sanitizer checks print a report and carry on, so a test run can finish green with the report scrolled off the top of the log. With it, the first finding stops the process and the test fails, which is the only way an automatic build system can act on it.
:::

::: check
Why does `const std::string& s = person.name();` behave differently depending on whether `name()` returns `std::string` or `const std::string&`? How would you write the call so you do not have to know?
:::

::: answer
If `name()` returns `std::string` by value, the call makes a temporary, the reference binds to it directly, and lifetime extension keeps it alive as long as `s`. Safe.

If `name()` returns `const std::string&`, there is no temporary. `s` is bound to whatever the function returned a reference to — usually a member of `person` — and `s` dangles the moment `person` dies.

Both look identical at the call site, so the safety of your line depends on a declaration somewhere else that may change under you. Write `std::string s = person.name();` when you want to own the value: a copy you can reason about, and one the compiler will often avoid anyway. Or write `auto s = person.name();`, which copies in both cases, because `auto` drops the reference. Keep `const auto&` for initializers whose type you can see.
:::

## Summary

| Term | Meaning |
| --- | --- |
| lvalue | an expression naming an object with a home; `&expr` compiles |
| rvalue | a value with no home: a literal, arithmetic, a function returning by value |
| `T&` | binds to non-const lvalues only |
| `const T&` | binds to anything, including temporaries |
| `T&&` | binds to rvalues only |
| reference vs pointer | a reference is bound once, never reseated, never null; a pointer may be all three |
| lifetime extension | a temporary bound *directly* to a reference lives as long as that reference |
| extends through | member access and subscript on the temporary |
| does not extend through | a function return, or a reference member set in a constructor |
| full expression | ends at the semicolon; where an unbound temporary dies |
| dangling reference | a reference to an object whose lifetime has ended |
| `-Wdangling-reference` | g++ 13.3.0; turned on by `-Wextra`, not by `-Wall` |
| `-Wreturn-local-addr` | on by default; returning a reference to a local |
| ASan `stack-use-after-scope` | what a dangling reference to a temporary looks like at run time |
| `std::move(x)` | a cast to an xvalue, not a move; a named `T&&` is itself an lvalue |

Lesson 05 goes down to the stack itself: what a frame contains, how deep calls can go before the program dies, and why flight coding standards forbid recursion.

::: context quaternion Four numbers for an orientation
A **quaternion** is a set of four numbers that describes how a spacecraft is turned in space — its attitude. Flight software prefers it to three angles because it never hits the "gimbal lock" dead spot and is cheap to update every cycle.

For this lesson it only matters as a typical small value that functions return by value: four `double`s, 32 bytes. The attitude-representation module later in the course teaches the mathematics.
:::

::: context value-category-tree The full family of value categories
Since C++11 the standard sorts every expression into one of three leaf categories. Two groupings sit above them: a **glvalue** ("generalized lvalue") has identity, and an **rvalue** may be moved from. The xvalue belongs to both — an object with a name or address that is about to expire.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="180" y1="30" x2="95" y2="62"/>
    <line x1="180" y1="30" x2="265" y2="62"/>
    <line x1="95" y1="84" x2="50" y2="116"/>
    <line x1="95" y1="84" x2="180" y2="116"/>
    <line x1="265" y1="84" x2="180" y2="116"/>
    <line x1="265" y1="84" x2="310" y2="116"/>
  </g>
  <rect x="130" y="10" width="100" height="22" rx="4" fill="#ffffff" stroke="#1f2a44"/>
  <text x="180" y="26" font-size="12" fill="#1f2a44" text-anchor="middle">expression</text>
  <rect x="45" y="62" width="100" height="22" rx="4" fill="#8fb8f0" stroke="#1d6fd1"/>
  <text x="95" y="78" font-size="12" fill="#1f2a44" text-anchor="middle">glvalue</text>
  <rect x="215" y="62" width="100" height="22" rx="4" fill="#f2b880" stroke="#b4232c"/>
  <text x="265" y="78" font-size="12" fill="#1f2a44" text-anchor="middle">rvalue</text>
  <rect x="10" y="116" width="80" height="22" rx="4" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="50" y="132" font-size="12" fill="#1f2a44" text-anchor="middle">lvalue</text>
  <rect x="140" y="116" width="80" height="22" rx="4" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="132" font-size="12" fill="#1f2a44" text-anchor="middle">xvalue</text>
  <rect x="270" y="116" width="80" height="22" rx="4" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
  <text x="310" y="132" font-size="12" fill="#1f2a44" text-anchor="middle">prvalue</text>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="50" y="156">x, *p, v[i]</text>
    <text x="180" y="156">std::move(x)</text>
    <text x="310" y="156">5, a + b, f()</text>
    <text x="95" y="176">has identity</text>
    <text x="265" y="176">can be moved from</text>
  </g>
</svg>
```
:::

::: context lvalue-history Left and right of the equals sign
The words go back to Christopher Strachey, who used them for the CPL language in the 1960s and explained them in his 1967 lecture notes *Fundamental Concepts in Programming Languages*. He noticed that in `a = b`, the name `a` stands for a *place* to put something, while `b` stands for a *value*. C adopted the words, and C++ inherited them.

The left-right picture broke down as the language grew: a `const` variable has a place but cannot be assigned to, and a function returning `T&` can sit on the left. The names stayed anyway.
:::

::: context full-expression Where the semicolon really is
A **full expression** is an expression that is not part of a bigger one. In `double y = f(g(x)) + 1;` the whole right-hand side is one full expression. `g(x)` and `f(...)` are pieces of it. Every temporary made while working it out lives until the whole thing is finished, then all of them are destroyed together.

That is why `f(make_temp())` is safe even though `f` takes a reference: the temporary outlives the call because the full expression has not ended yet. The danger begins only when a reference to it escapes past the semicolon.
:::

::: context lifetime-timeline Five tracers on a timeline
Each bar runs from a tracer's construction to its destruction, measured against the numbered prints in `main`. Tracer 1 lives for one line. Tracer 5 lives until the inner block's brace. Tracers 2, 3 and 4 run to the end of `main` and die in reverse order.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="12" y="44">T1</text><text x="12" y="66">T2</text><text x="12" y="88">T3</text>
    <text x="12" y="110">T4</text><text x="12" y="132">T5</text>
  </g>
  <rect x="64" y="34" width="14" height="12" fill="#b4232c"/>
  <rect x="104" y="56" width="232" height="12" fill="#1d6fd1"/>
  <rect x="144" y="78" width="192" height="12" fill="#1d6fd1"/>
  <rect x="184" y="100" width="152" height="12" fill="#1d6fd1"/>
  <rect x="224" y="122" width="42" height="12" fill="#f2b880"/>
  <line x1="40" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="64" y1="146" x2="64" y2="154"/><line x1="104" y1="146" x2="104" y2="154"/>
    <line x1="144" y1="146" x2="144" y2="154"/><line x1="184" y1="146" x2="184" y2="154"/>
    <line x1="224" y1="146" x2="224" y2="154"/><line x1="266" y1="146" x2="266" y2="154"/>
    <line x1="296" y1="146" x2="296" y2="154"/><line x1="336" y1="146" x2="336" y2="154"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="64" y="168">1</text><text x="104" y="168">2</text><text x="144" y="168">3</text>
    <text x="184" y="168">4</text><text x="224" y="168">5</text><text x="266" y="168">}</text>
    <text x="296" y="168">6</text><text x="336" y="168">end</text>
  </g>
  <text x="180" y="18" font-size="11" fill="#6c7a93" text-anchor="middle">construction to destruction, by print step</text>
</svg>
```
:::

::: context asan-intro A sanitizer in one paragraph
**AddressSanitizer**, ASan for short, is a compiler feature in g++ and clang++. You turn it on with `-fsanitize=address`. The compiler then adds a check before every memory read and write, and the runtime keeps a map of which bytes currently belong to a live object. Touch a byte that does not, and the program stops with a report naming the error, the line, and where the memory came from.

It roughly doubles run time, so it belongs in testing, not in the flight build. Lesson 09 is devoted to it.
:::

::: context use-after-scope What "use-after-scope" means
ASan uses **use-after-scope** for reading or writing a stack object after the block, or full expression, that owned it has ended. The bytes are still there in the stack frame — nothing has erased them yet — which is exactly why the unsanitized program printed the right number.

ASan marks those bytes "poisoned" the moment the object's lifetime ends, so the very next touch is caught. Its cousins are `stack-use-after-return`, for a local read after its function has returned, and `heap-use-after-free`, for heap memory that has been released.
:::

::: context reference-member-picture The member that points at nothing
After the line `Observer o{make(9)};`, the observer survives but the tracer it refers to does not. The reference still holds the old address. The bytes there may even still read 9, until something else reuses that stack space.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="120" height="60" rx="6" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="80" y="52" font-size="13" fill="#1f2a44" text-anchor="middle">Observer o</text>
  <text x="80" y="74" font-size="12" fill="#1f2a44" text-anchor="middle">t (reference)</text>
  <line x1="140" y1="60" x2="222" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="230,60 220,55 220,65" fill="#1f2a44"/>
  <rect x="232" y="30" width="110" height="60" rx="6" fill="#ffffff" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="287" y="52" font-size="12" fill="#6c7a93" text-anchor="middle">Tracer(9)</text>
  <text x="287" y="74" font-size="12" fill="#b4232c" text-anchor="middle">destroyed</text>
  <line x1="240" y1="36" x2="334" y2="84" stroke="#b4232c" stroke-width="2"/>
  <text x="80" y="112" font-size="11" fill="#6c7a93" text-anchor="middle">still alive</text>
  <text x="287" y="112" font-size="11" fill="#6c7a93" text-anchor="middle">ended at the semicolon</text>
</svg>
```
:::

::: context std-move-cast What std::move really is
Inside the standard library, `std::move` is a one-line function. It performs `static_cast<T&&>(x)` — "treat this as an rvalue reference" — and returns. No bytes are copied and no object changes.

The moving, if any, happens later, in whichever constructor or function the `T&&` overload leads to. So `std::move(x);` on a line by itself does nothing at all. The next module builds move constructors on top of exactly this signal.
:::
