---
id: l04-references-and-temporaries
title: References, value categories, and the lifetime of a temporary
minutes: 20
covers:
  - 'References: lvalue and rvalue, binding rules, lifetime extension of temporaries'
---

The previous module gave you the working rules for references: an alias, bound at initialisation, never reseated, never null, and `const T&` as the default way to pass something you only read. That is enough to write correct functions. It is not enough to read the errors a compiler gives you about them, or to know when a reference to a temporary is safe and when it is a use-after-scope waiting for a warm day.

The missing piece is **value categories**: the classification of every expression in C++ as, roughly, something that has a home or something that does not. The binding rules for references are stated entirely in those terms, and so is the one rule that lets `const T&` keep a temporary alive past the semicolon.

This matters in flight code in a specific, recurring way. You will write functions that return a state vector or a quaternion by value, and callers that want to look at the result without copying it. Sometimes `const auto& q = compute_attitude();` is exactly right and costs nothing. Sometimes the identical-looking `const auto& q = wrapper(compute_attitude());` is a dangling reference. This lesson is how to tell them apart.

## Value categories: does the expression have a home?

Take any expression and ask: does it designate an object that exists somewhere you could point at?

An **lvalue** does. A named variable, a dereferenced pointer, a member of an lvalue, an array element, a function call returning `T&` — all lvalues. The operational test is that `&expr` compiles.

An **rvalue** does not, or does not for long. A literal, the result of arithmetic, a function call returning `T` by value, an explicit temporary like `Tracer{3}` — all rvalues. `&(a + b)` does not compile, because there is no object whose address that would be.

The standard subdivides rvalues into *prvalues* (pure values, like `3` or `f()` returning by value) and *xvalues* (objects at the end of their life, which is what `std::move(x)` produces). That distinction matters for move semantics, which the next module covers. For memory and lifetime, "lvalue or rvalue" is the split that decides everything.

The name is historical — left and right of an assignment — and misleading, since a `const` lvalue cannot appear on the left. Read it as *has identity* versus *does not*.

## The binding rules

| Reference type | Binds to a non-const lvalue | to a const lvalue | to an rvalue |
| --- | --- | --- | --- |
| `T&` | yes | no | no |
| `const T&` | yes | yes | yes |
| `T&&` | no | no | yes |

Two rows explain nearly all reference errors you will see. `T&` refuses rvalues, because letting you modify something with no home is almost always a mistake. `const T&` accepts everything, which is why it is the universal read-only parameter. `T&&` is the mirror image of `T&`: it takes *only* rvalues, which is how a function says "this argument is a temporary and I may gut it".

::: example What the compiler says about each illegal binding
```cpp
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
l04-binding.cpp:17:21: error: cannot bind non-const lvalue reference of type 'int&' to an rvalue of type 'int'
   17 |     int&        g = 5;          // error 1: non-const lvalue ref to rvalue
      |                     ^
l04-binding.cpp:18:21: error: binding reference of type 'int&' to 'const int' discards qualifiers
   18 |     int&        h = cx;         // error 2: drops const
      |                     ^~
l04-binding.cpp:19:21: error: cannot bind rvalue reference of type 'int&&' to lvalue of type 'int'
   19 |     int&&       i = x;          // error 3: rvalue ref to lvalue
      |                     ^
l04-binding.cpp:20:26: error: cannot bind non-const lvalue reference of type 'std::string&' ... to an rvalue of type 'std::string'
   20 |     std::string& j = name();    // error 4: non-const lvalue ref to a temporary
      |                      ~~~~^~
```

These four messages are worth memorising by shape, because you will meet them constantly and each one names the exact rule it applied. "Cannot bind non-const lvalue reference … to an rvalue" is error 1 or 4 and means *add `const`, or take by value*. "Discards qualifiers" is error 2 and means *the object is const and your reference is not*. "Cannot bind rvalue reference … to lvalue" is error 3 and means *you wrote `T&&` where you meant `T&`, or you need `std::move`*.

Notice that `int&& f = x + 1;` is legal. `x + 1` is an rvalue — there is no object called `x + 1` — so the temporary holding 4 binds to the rvalue reference. And `const int& d = 5;` is legal too, which raises the obvious question: the literal 5 has no home, so what exactly is `d` a reference to, and how long does it last?
:::

## Lifetime extension

> When a temporary is bound directly to a reference, the temporary's lifetime is extended to the lifetime of the reference.

That is the rule. It applies to `const T&`, to `T&&`, and to `auto&&`. It is the reason `const int& d = 5;` is not immediately a dangling reference: the compiler materialises an `int` object holding 5, and that object lives as long as `d` does.

::: example Extension, observed
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

Tracer 1 was constructed and destroyed on the same line: a temporary with nothing bound to it dies at the end of the *full expression*, meaning at the semicolon. Tracers 2, 3 and 4 survived to the end of `main` and were destroyed in reverse order of construction, exactly like ordinary automatic objects — which is what they have become. Tracer 5 died at the closing brace of its block, because that is where `r5` died.

So `const auto& q = compute_attitude();` is not merely safe, it is the cheapest correct thing to write: no copy, no allocation, and the result lives exactly as long as you can name it.

Extension also reaches through a member access or an array subscript, because the reference is then bound to a *subobject* of the temporary and the whole temporary is kept:

```cpp
const int& n = make(8).id;       // extends the whole Tracer
```

```text
binding to a member of a temporary
  ctor Tracer(8)
after the full expression; n = 8
end of main
  dtor Tracer(8)
```
:::

## Where extension does not happen

The word doing the work in the rule is **directly**. If the reference is initialised from something that is *already a reference*, there is no binding of a temporary to extend, and nothing is kept alive. Two forms of this cost real time in real codebases.

::: example The two cases that dangle, and which tool finds each
**Through a function that returns its own parameter.** The temporary binds to the parameter, not to your reference, so it dies at the semicolon.

```cpp
const Tracer& pass_through(const Tracer& t) { return t; }

int main() {
    const Tracer& bad = pass_through(make(7));   // temporary dies here
    std::printf("id = %d\n", bad.value());       // reads a destroyed object
}
```

g++ 13.3.0 catches this one at compile time — but only with `-Wextra`. Compiled with no flags, or with `-Wall` alone, it says nothing; `-Wextra` produces:

```text
l04-noextend.cpp:19:19: warning: possibly dangling reference to a temporary [-Wdangling-reference]
   19 |     const Tracer& bad = pass_through(make(7));   // temporary dies here
      |                   ^~~
l04-noextend.cpp:19:37: note: the temporary was destroyed at the end of the full expression 'pass_through(make(int)())'
```

Run under `-fsanitize=address -fno-sanitize-recover=all`, the same program confirms it:

```text
binding through a function that returns its parameter
  ctor Tracer(7)
  dtor Tracer(7)
about to read a destroyed object
==15615==ERROR: AddressSanitizer: stack-use-after-scope on address 0x7f78f2d00020 ...
READ of size 4 at 0x7f78f2d00020 thread T0
    #0 0x562bc06f2624 in Tracer::value() const l04-noextend.cpp:8
    #1 0x562bc06f244d in main l04-noextend.cpp:21
SUMMARY: AddressSanitizer: stack-use-after-scope l04-noextend.cpp:15 in Tracer::value() const
```

Look at the ordering in the output: `dtor Tracer(7)` printed *before* the read. The destructor had already run; the read happened afterwards. That is a use-after-scope written out in the program's own tracing, and it is why putting a print in a destructor is a reasonable first debugging move.

**A reference member initialised in a constructor.** Here nothing at all warns.

```cpp
struct Observer {
    const Tracer& t;                       // a reference member
    explicit Observer(const Tracer& r) : t(r) {}
    int id() const { return t.id; }
};

int main() {
    Observer o{make(9)};                   // no lifetime extension here
    std::printf("id = %d\n", o.id());
}
```

The temporary binds to the constructor's parameter `r`; the member `t` is initialised from `r`, which is a reference, not a temporary. Nothing is extended, and the `Tracer` dies at the end of the declaration of `o`. g++ 13.3.0 at `-Wall -Wextra -Wpedantic` emitted **no diagnostic at all**, and neither did clang++ 18.1.3. AddressSanitizer is what found it:

```text
  ctor Tracer(9)
  dtor Tracer(9)
constructed; about to read through the member
==16074==ERROR: AddressSanitizer: stack-use-after-scope on address 0x7f024a600030 ...
READ of size 4 at 0x7f024a600030 thread T0
    #0 0x55ab72d786b4 in Observer::id() const l04-member-ref.cpp:15
    #1 0x55ab72d78458 in main l04-member-ref.cpp:22
```

This is the strongest argument in the module for running your tests under the sanitizer. The bug is a two-line class that looks exactly like a hundred correct ones, no warning fires, and an unsanitized build on this machine printed `id = 9` and exited 0 — the right answer, from memory that had already been destroyed, which is the failure mode that ships.
:::

::: key
A temporary bound *directly* to a `const T&`, a `T&&` or an `auto&&` lives as long as that reference. Extension does not survive a function return, and it does not apply to a reference member initialised from a constructor parameter. A class with a reference member does not own anything and does not extend anything: it is a pointer that cannot be null, with the same lifetime obligation on whoever constructs it.
:::

::: warning
`auto` and `auto&` behave differently here and the difference is silent. `auto q = compute_attitude();` copies. `const auto& q = compute_attitude();` binds and extends, no copy. `auto&& q = compute_attitude();` also binds and extends. But `const auto& q = wrapper(compute_attitude());`, where `wrapper` returns a reference, dangles. The rule is about what the initialiser *is*, not what it looks like, so when the initialiser is a call you have to know the return type.
:::

## `T&&` beyond binding

An rvalue reference is not, by itself, about memory: it is a signal in an overload set. Given `void store(const Data&)` and `void store(Data&&)`, a caller passing a named object gets the first and a caller passing a temporary gets the second, so the second is free to take the temporary's buffer rather than copy it. That is move semantics, and the next module develops it properly.

Two facts to carry now. First, `std::move(x)` moves nothing — it is a cast that turns an lvalue into an xvalue so the `T&&` overload is chosen. Second, a variable of type `T&&` is itself an *lvalue*: inside `void store(Data&& d)`, the name `d` has a home, so passing `d` onward selects the copying overload unless you write `std::move(d)` again. That surprises everyone once.

## Check yourself

::: check
`const Tracer& r2 = make(2);` kept the temporary alive to the end of `main`. Where does that object physically live, and what is the cost compared with `Tracer r2 = make(2);`?
:::

::: answer
In `main`'s stack frame, in exactly the same place the by-value version would put it. Lifetime extension does not move the object anywhere: the temporary was already materialised in the caller's frame by the C++17 rule from lesson 01, and extension only changes when its destructor runs. So the two lines cost the same — one construction, one destruction, no copy — and the difference is entirely about the type of the name you get. `Tracer r2` is an object you may modify; `const Tracer& r2` is a read-only alias. The reason to prefer the reference form is when the initialiser's type is long or awkward to spell and you only want to read it.
:::

::: check
`int&& f = x + 1;` compiles but `int&& i = x;` does not. Explain both in one sentence each, and say what to write if you genuinely want an rvalue reference bound to `x`.
:::

::: answer
`x + 1` is an rvalue — the addition produces a value with no home, which the compiler materialises into a temporary, and `T&&` binds to rvalues. `x` is an lvalue — it names an object — and `T&&` refuses lvalues precisely so that a function overloaded on `T&&` cannot silently gut a named object the caller still intends to use. If you really want `int&& i` bound to `x`, write `int&& i = std::move(x);`, which casts the lvalue to an xvalue; you are then asserting that you accept whatever happens to `x` afterwards. For an `int` nothing happens, because moving a trivial type is a copy; for a `std::vector` the object would be left empty.
:::

::: check
A reviewer sees `struct Filter { const Config& cfg; };` and asks for it to become `struct Filter { Config cfg; };`. Give the lifetime argument for the change and the one circumstance in which the reference member is right.
:::

::: answer
The reference member makes `Filter` non-owning: every `Filter` carries an obligation that the referenced `Config` outlives it, that obligation is invisible at every call site, no warning fires when it is broken, and as the lesson showed, constructing a `Filter` from a temporary `Config` compiles cleanly and produces a use-after-scope. A `Config` member owns its data and the obligation disappears; it also makes `Filter` copyable and assignable, which a reference member silently prevents, because a reference cannot be reseated and so the compiler deletes the copy-assignment operator. The reference member is right when the `Config` is genuinely shared, expensive, and has a lifetime you can point at — a configuration block with static storage duration, loaded once at startup and never replaced — and even then a `const Config*` documents "non-owning observer" more loudly, and a `std::shared_ptr<const Config>` is the answer if the lifetime is not obviously longer.
:::

::: check
The `Observer` bug produced no compiler diagnostic but a clean AddressSanitizer report. What does that tell you about where to spend your effort, and what does `-fno-sanitize-recover=all` add?
:::

::: answer
It tells you that warnings are a filter, not a net. `-Wall -Wextra` catches the shapes the compiler can see in one function; anything that crosses a function or constructor boundary is generally outside its reach, and lifetime bugs are usually exactly that. The effort therefore goes into having a sanitized build that runs your test suite, not into hunting for a warning flag that would have caught it. `-fno-sanitize-recover=all` turns a finding into a non-zero exit status: without it some sanitizer checks print and continue, so a test run finishes green with the report scrolled off the top of the log. With it, the first finding stops the process and the test fails, which is the only way a CI system can act on it.
:::

::: check
Why does `const std::string& s = person.name();` behave differently depending on whether `name()` returns `std::string` or `const std::string&`, and how would you write the call so you do not have to know?
:::

::: answer
If `name()` returns `std::string` by value, the call produces a temporary, the reference binds to it directly, and lifetime extension keeps it alive as long as `s` — safe. If `name()` returns `const std::string&`, there is no temporary: `s` is bound to whatever the member function returned a reference to, usually a member of `person`, and `s` dangles the moment `person` does. Both spellings are identical at the call site, so the safety of your line depends on a declaration somewhere else that may change under you. Write `std::string s = person.name();` when you want to own it — a copy you can reason about, and one the compiler will often elide anyway — or `auto s = person.name();`, which copies in both cases because `auto` strips the reference. Reserve `const auto&` for initialisers whose type you can see.
:::

## Summary

| Term | Meaning |
| --- | --- |
| lvalue | an expression designating an object with a home; `&expr` compiles |
| rvalue | a value with no home: a literal, arithmetic, a function returning by value |
| `T&` | binds to non-const lvalues only |
| `const T&` | binds to anything, including temporaries |
| `T&&` | binds to rvalues only |
| lifetime extension | a temporary bound *directly* to a reference lives as long as that reference |
| extends through | member access and subscript on the temporary |
| does not extend through | a function return, or a reference member in a constructor |
| full expression | the semicolon; where an unbound temporary dies |
| `-Wdangling-reference` | g++ 13.3.0; enabled by `-Wextra`, not by `-Wall` |
| ASan `stack-use-after-scope` | what a dangling reference to a temporary looks like at run time |
| `std::move(x)` | a cast to an xvalue, not a move; a named `T&&` is itself an lvalue |

Lesson 05 goes down to the stack itself: what a frame contains, how deep it can go before the program dies, and why every flight coding standard in existence forbids recursion.
