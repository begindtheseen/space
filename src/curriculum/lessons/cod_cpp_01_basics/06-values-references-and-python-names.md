---
id: l06-values-references-and-python-names
title: Values, references, and what a variable really is
minutes: 21
covers:
  - Values, references and the difference from Python names
---

This is the lesson where Python experience actively works against you. Everything you know about what a variable is has to be replaced, and the replacement is simpler than what you have — but until you make the swap, C++ code will keep producing results that look like the language is broken. A struct you passed to a function comes back unchanged. A vector you assigned to another name turns out to be two vectors. A reference you returned points at nothing.

All of it follows from one sentence. **In Python a variable is a name bound to an object; in C++ a variable is the object.** A Python name is a label you can move from one object to another, and two labels can sit on the same object. A C++ variable is a named region of storage with a type, created where you declare it and destroyed where its scope ends, and it never moves, never rebinds, and is never shared by two names — unless you ask for that explicitly, with a reference.

Get this one right and pointers, ownership, copies and lifetimes in the next module are straightforward consequences. Get it wrong and every one of them is a surprise.

## What Python actually does

Run this and read it carefully, because you already know what it will print and that is the point:

```python
a = [6771000.0, 7670.0]
b = a                 # not a copy: another name for the same list
b[1] = 0.0
print("a =", a)
print("b =", b)
print("a is b:", a is b)

def zero_speed(v):    # the parameter is another name for the caller's list
    v[1] = 0.0

s = [6771000.0, 7670.0]
zero_speed(s)
print("after zero_speed(s):", s)

def rebind(v):        # assignment rebinds the local name only
    v = [0.0, 0.0]

t = [6771000.0, 7670.0]
rebind(t)
print("after rebind(t):", t)
```

```text
a = [6771000.0, 0.0]
b = [6771000.0, 0.0]
a is b: True
after zero_speed(s): [6771000.0, 0.0]
after rebind(t): [6771000.0, 7670.0]
```

Three facts about Python, stated the way C++ will contradict them. Assignment never copies an object; it binds a name. Passing an argument never copies an object; it binds the parameter name to the caller's object. And assigning *to* a parameter inside a function changes only which object that local name refers to, which is why `rebind` had no effect.

## What C++ does

```cpp
#include <cstdio>

struct State {
    double r_m;      // radius from Earth centre
    double v_mps;    // speed
};

void zero_speed_by_value(State s)  { s.v_mps = 0.0; }
void zero_speed_by_ref(State& s)   { s.v_mps = 0.0; }

int main() {
    State a{6771000.0, 7670.0};

    State b = a;                 // a copy: a second object
    b.v_mps = 0.0;
    std::printf("after b.v = 0     a.v = %.1f   b.v = %.1f\n", a.v_mps, b.v_mps);
    std::printf("&a == &b ?        %s\n", (&a == &b) ? "yes" : "no");

    State& r = a;                // not an object: another name for a
    r.v_mps = 100.0;
    std::printf("after r.v = 100   a.v = %.1f\n", a.v_mps);
    std::printf("&r == &a ?        %s\n", (&r == &a) ? "yes" : "no");

    a.v_mps = 7670.0;
    zero_speed_by_value(a);
    std::printf("after by-value    a.v = %.1f\n", a.v_mps);
    zero_speed_by_ref(a);
    std::printf("after by-ref      a.v = %.1f\n", a.v_mps);

    std::printf("sizeof(State) = %zu bytes\n", sizeof(State));
    return 0;
}
```

```text
after b.v = 0     a.v = 7670.0   b.v = 0.0
&a == &b ?        no
after r.v = 100   a.v = 100.0
&r == &a ?        yes
after by-value    a.v = 7670.0
after by-ref      a.v = 0.0
sizeof(State) = 16 bytes
```

Line by line against the Python. `State b = a;` created a *second object*, sixteen bytes of its own, and copied the bytes of `a` into it; the two have different addresses and changing one does not touch the other. `State& r = a;` created no object at all — `r` is another name for `a`, and `&r == &a` proves it. `zero_speed_by_value` received a copy and modified the copy, which is discarded when the function returns, so the caller's `a` is untouched. `zero_speed_by_ref` received the caller's object itself.

C++ chose the opposite default from Python. In Python everything is shared unless you copy; in C++ everything is copied unless you ask for sharing. The C++ default is the one you can reason about locally: a function taking a parameter by value cannot possibly change anything the caller can see.

g++ even notices when you write the pointless version. Compiling the program above with `-Wall -Wextra`:

```text
values.cpp: In function 'void zero_speed_by_value(State)':
values.cpp:8:32: warning: parameter 's' set but not used [-Wunused-but-set-parameter]
    8 | void zero_speed_by_value(State s)  { s.v_mps = 0.0; }
      |                          ~~~~~~^
```

"Set but not used" is the compiler telling you that you wrote to something nobody will ever read. In Python that same function is the normal way to mutate a caller's object; in C++ it is a bug the compiler can see.

::: key
A Python name is a label bound to an object; assignment rebinds the label. A C++ variable *is* an object: a named region of storage with a type. Assignment writes into that storage. `T& r = x;` makes a second name for the existing object `x`; it creates nothing and copies nothing.
:::

## A variable is storage, so it must be initialised

Because a C++ variable *is* storage, it exists the moment it is declared, and if you did not give it a value, it holds whatever was there. There is no `None`, no unbound state, and no exception when you read it. Reading an uninitialised variable is undefined behaviour, as lesson 05 listed.

C++ has several initialisation syntaxes; here is what each does:

```cpp
#include <cstdio>

struct Gains { double kp, ki, kd; };

int main() {
    double a = 3.0;      // copy initialisation
    double b{4.0};       // direct list initialisation
    double c(5.0);       // direct initialisation
    double d{};          // value initialisation: zero
    int    e{};          // zero
    Gains  g{};          // every member zero
    Gains  h{1.5, 0.2, 0.05};
    std::printf("a=%.1f b=%.1f c=%.1f d=%.1f e=%d\n", a, b, c, d, e);
    std::printf("g = {%.1f, %.1f, %.1f}\n", g.kp, g.ki, g.kd);
    std::printf("h = {%.2f, %.2f, %.2f}\n", h.kp, h.ki, h.kd);
    return 0;
}
```

```text
a=3.0 b=4.0 c=5.0 d=0.0 e=0
g = {0.0, 0.0, 0.0}
h = {1.50, 0.20, 0.05}
```

Prefer the braces. `{}` with no value zero-initialises, which removes the uninitialised-read problem in one character. `{value}` rejects narrowing conversions at compile time, as lesson 05 showed. And `Gains h{1.5, 0.2, 0.05};` initialises an aggregate member by member, which is how you will write nearly every small struct.

::: warning
`double x();` at block scope does not declare a variable initialised to zero. It declares a *function* called `x` taking no arguments and returning `double`. This is the "most vexing parse", and it is one more reason to write `double x{};`.
:::

## References

A reference is an alias: another name for an object that already exists. `T&` binds to an object of type `T` and, from then on, every use of the reference is a use of that object.

Three properties follow, and they are what make references safe:

- A reference **must be initialised** when it is declared. `State& r;` does not compile.
- A reference **cannot be reseated**. After `State& r = a;`, writing `r = b;` does not make `r` refer to `b` — it copies `b` into `a`, because `r` *is* `a`.
- There is **no null reference**. A reference that refers to nothing can only be produced by undefined behaviour, so a function taking a `T&` need not check for null, where one taking a `T*` must.

That second property is the one that catches Python programmers. `r = b` looks like a rebinding and is an assignment to the referent.

`const T&` is a reference through which you cannot modify. It is the workhorse parameter type in C++: the callee gets access to the caller's object without copying it and without permission to change it.

```cpp
double kinetic_energy(const State& s, double mass_kg) {
    return 0.5 * mass_kg * s.v_mps * s.v_mps;
}
```

Here is the whole mapping, which is worth memorising as a table rather than a rule:

| You write | Python meaning | C++ meaning |
| --- | --- | --- |
| `b = a` | `b` is a second name for `a`'s object | a second object, byte-copied from `a` |
| `f(x)` | the parameter names the caller's object | the parameter is a copy of `x` |
| `f(T& x)` | — | the parameter names the caller's object |
| `f(const T& x)` | — | names it, read-only |
| `x = y` inside `f` | rebinds the local name | writes into `x`'s storage |
| `id(a) == id(b)` | same object? | `&a == &b` |

## Choosing how to pass

| Parameter | Use when |
| --- | --- |
| `T` (by value) | `T` is small and cheap to copy: the built-in types, a two- or three-field struct, anything up to roughly 16 bytes |
| `const T&` | `T` is larger, or copying it allocates: a `std::vector`, a `std::string`, a state vector, a matrix |
| `T&` | the function must modify the caller's object, and that is the point of the call |
| return by value | the function produces a new value; do not return a reference to something you made inside |

`State` is 16 bytes — two `double`s — so by value is fine and the copy costs nothing a register cannot absorb. A `std::vector<double>` of 5000 IMU samples is a different matter: passing it by value allocates a new buffer and copies 40 KB, every call, and lesson 09 shows exactly that trap. When in doubt, `const T&` is never badly wrong for a parameter you only read.

::: example A state vector by value and by reference
A propagator takes the current state and returns the next one, and a logger takes the state to record it.

```cpp
struct State {
    double r_m;
    double v_mps;
};

// Produces a new value: return by value, take by value. 16 bytes each way.
State step(State s, double dt_s, double a_mps2) {
    s.r_m   += s.v_mps * dt_s;
    s.v_mps += a_mps2 * dt_s;
    return s;
}

// Only reads: const reference. No copy, no permission to modify.
double energy_per_kg(const State& s) { return 0.5 * s.v_mps * s.v_mps; }

// Modifies the caller's object: non-const reference, and the name says so.
void clamp_speed(State& s, double v_max) {
    if (s.v_mps > v_max) s.v_mps = v_max;
}
```

Note what `step` does with its by-value parameter: it *uses the copy as the working variable*. Because `s` is already a private copy, modifying it and returning it is both correct and efficient — no separate local is needed. That idiom is only available because parameters are copies, and it is one of the places where the C++ default is pleasanter than the Python one.

Checking `step` numerically, with $r = 6{,}771{,}000$ m, $v = 7670$ m/s, $\Delta t = 0.1$ s and $a = -8.7\,\mathrm{m/s^2}$:

$$
r' = 6{,}771{,}000 + 7670 \times 0.1 = 6{,}771{,}767\,\mathrm{m}, \qquad
v' = 7670 - 8.7 \times 0.1 = 7669.13\,\mathrm{m/s}.
$$

That is forward Euler, which the numerical-methods module will tell you not to use for orbits. The point here is the parameter passing, not the integrator.
:::

## Dangling references

A reference does not own anything and does not keep anything alive. If the object it names dies, the reference is left naming storage that is no longer an object, and using it is undefined behaviour. The classic instance:

```cpp
const State& make_state() {
    State s{6771000.0, 7670.0};
    return s;                     // s dies at the closing brace
}
```

`s` is an automatic object; its lifetime ends at the closing brace, and the reference returned names dead storage. Both compilers catch this particular case. g++ 13.3.0:

```text
dangle.cpp:7:12: warning: reference to local variable 's' returned [-Wreturn-local-addr]
    7 |     return s;                     // s dies at the closing brace
      |            ^
dangle.cpp:6:11: note: declared here
```

clang++ 18.1.3:

```text
dangle.cpp:7:12: warning: reference to stack memory associated with local variable 's' returned [-Wreturn-stack-address]
```

Both are warnings, not errors, which is one more argument for `-Werror`. Built with `-fsanitize=address` and run, this program crashed on this machine with a SEGV reported by AddressSanitizer — but that is what one build did, not a guarantee; a different build could return a plausible-looking number instead, which is the failure mode that reaches a vehicle.

The general rule: a reference is safe exactly as long as the object it names. Returning a reference to a parameter or to a member of a long-lived object is fine; returning one to a local is not. Lesson 11 makes "how long does this object live" precise, and the next module turns it into a discipline.

::: example Where a Python habit produces a C++ bug
A Python programmer writing a controller reaches for this:

```cpp
State latest{};

const State& current() { return latest; }    // fine: latest outlives every caller

State smoothed(const State& a, const State& b) {
    State out{0.5 * (a.r_m + b.r_m), 0.5 * (a.v_mps + b.v_mps)};
    return out;                              // fine: returns a copy
}

// const State& smoothed_bad(const State& a, const State& b) {
//     State out{...};
//     return out;                           // wrong: out dies here
// }
```

The first is safe because `latest` has static storage duration and lives for the whole program. The second is safe because it returns *by value*: `out` is copied — in practice moved or constructed in place — into the caller's storage before it is destroyed. The third, which differs from the second only in the return type, is the bug.

The reflex to build: **returning a reference is a claim that the object outlives the call.** If you cannot name something that keeps it alive, return by value. Returning by value is cheap for small types, and for large ones the compiler elides the copy entirely, so the "optimisation" of returning a reference is usually not one.
:::

## Check yourself

::: check
In Python, `b = a` then `b[0] = 9` changes `a`. In C++, `State b = a;` then `b.r_m = 9;` does not. State the one difference that explains both, in a sentence.
:::

::: answer
A Python variable is a name bound to an object, so `b = a` produces two names for one object and any mutation through either is visible through the other. A C++ variable *is* an object, so `State b = a;` constructs a second object and copies `a`'s bytes into it, leaving two independent objects. The Python behaviour is sharing by default; the C++ behaviour is copying by default. Everything else in this lesson — why a by-value parameter cannot affect the caller, why a reference is needed to share, why `&a == &b` is the C++ spelling of `a is b` — follows from that one difference.
:::

::: check
`State& r = a;` and then `r = b;`. What happened to `a`, to `b`, and to `r`?
:::

::: answer
`a` now holds a copy of `b`'s value. `b` is unchanged. `r` still refers to `a`, because a reference cannot be reseated: once bound it names that object for the rest of its life, and every later use of `r` — including as the left-hand side of an assignment — is a use of `a`. So `r = b;` is exactly `a = b;`. This is the single most common surprise for someone arriving from Python, where the same line would point the name `r` at `b`'s object and leave `a` alone.
:::

::: check
Why does a function taking `const State&` need no null check, while one taking `const State*` does?
:::

::: answer
A reference must be bound to an object when it is created and there is no way to create a null one without undefined behaviour first, so within a well-defined program a `const State&` parameter always names a real object. A pointer is a value like any other and `nullptr` is a perfectly ordinary value for it, so a caller can legitimately pass one and the callee must decide what that means. This is why the C++ Core Guidelines advise a reference for a required argument and a pointer only when "no object" is a meaningful input — the choice of parameter type documents the contract, and the compiler enforces half of it.
:::

::: check
`step` takes `State s` by value, modifies `s`, and returns it. Rewrite the signature to take `const State&` instead, and say what else must change and why the original is not wasteful.
:::

::: answer
With `const State& s` the function cannot modify `s`, so it needs its own local: `State out = s; out.r_m += ...; return out;`. That is one copy, exactly as before — the by-value parameter *was* that copy, made once, at the call, where the compiler can often construct it directly from the caller's temporary and elide even that. So the rewrite adds a line and saves nothing. The rule this illustrates: when a function needs its own modifiable copy of a small argument, take it by value and use it; take `const&` when you only read.
:::

::: check
A colleague writes `const std::vector<double>& history() { std::vector<double> v = build(); return v; }` and says it avoids copying the vector. What does g++ say, what actually happens, and what should the signature be?
:::

::: answer
g++ warns `reference to local variable 'v' returned [-Wreturn-local-addr]`, and clang++ says `reference to stack memory associated with local variable 'v' returned`. The local vector is destroyed at the closing brace — which also frees its heap buffer — so the returned reference names storage that is no longer an object, and every use of it is undefined behaviour. The "optimisation" is not one: returning by value, `std::vector<double> history()`, lets the compiler construct the vector directly in the caller's storage under mandatory copy elision, so no copy happens either way. Return by value; return a reference only when you can name something else that keeps the object alive.
:::

## Summary

| Concept | Python | C++ |
| --- | --- | --- |
| What a variable is | a name bound to an object | the object: named storage with a type |
| `b = a` | two names, one object | two objects; bytes copied |
| Identity test | `a is b` | `&a == &b` |
| Argument passing | parameter names the caller's object | parameter is a copy, unless declared `T&` or `const T&` |
| Rebinding | `x = y` inside a function rebinds the local name | writes into `x`'s storage; a reference can never be reseated |
| Uninitialised | impossible; a name is bound or does not exist | possible, and reading it is undefined behaviour |
| Null | `None` | no null reference; `nullptr` only for pointers |
| Lifetime | the garbage collector keeps an object alive while referenced | a reference keeps nothing alive; a dangling reference is undefined behaviour |
| `T{}` | — | value initialisation: zero |
| `-Wreturn-local-addr` | — | g++'s name for returning a reference to a local |

Lesson 07 adds the qualifiers that say what may change and when it is known: `const`, `constexpr`, `consteval`, and the `auto` that lets the compiler write the type for you.
