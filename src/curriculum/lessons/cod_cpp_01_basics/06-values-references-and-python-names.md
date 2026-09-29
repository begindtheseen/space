---
id: l06-values-references-and-python-names
title: Values, references, and what a variable really is
minutes: 19
covers:
  - Values, references and the difference from Python names
---

Suppose you want a friend to read your science report. You can hand them a **photocopy**. They can scribble all over it and your original stays clean. Or you can send them a **link** to the shared document. Now there is one document, and anything they type, you see.

Python hands out links. C++ hands out photocopies. That one difference explains most of the surprises a Python programmer meets in C++. A struct you passed to a function comes back unchanged. A vector you assigned to another name turns out to be two vectors. And a reference you returned from a function points at nothing.

Here it is as one sentence. **In Python a variable is a name bound to an object; in C++ a variable is the object.** A Python name is a sticky label you can move from one object to another, and two labels can sit on the same object. A C++ variable is a named piece of memory with a type. It is created where you declare it and destroyed where its scope ends. It never moves, never gets relabelled, and is never shared by two names — unless you ask for that on purpose, with a **reference**.

Get this right and pointers, ownership, copies and lifetimes in the next module follow from it. Get it wrong and every one of them is a surprise.

## What Python actually does

Run this and read it carefully. You already know what it prints, and that is the point:

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

(The two numbers are a spacecraft's distance from Earth's center, 6,771 km, and its speed, 7.67 km/s — a typical low orbit.)

Here are three facts about Python, stated the way C++ will contradict them:

1. Assignment never copies an object. It **[[binds a name|python-names]]** — sticks a label on the object.
2. Passing an argument never copies an object. The parameter becomes another label on the caller's object.
3. Assigning *to* a parameter inside a function moves only that local label. That is why `rebind` had no effect.

## What C++ does

Now the same experiment in C++. `struct State` bundles two `double`s into one type:

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

Two new symbols. `&a`, read "address of a", gives the object's **[[address|addresses]]** — its location in memory. `State&`, read "State ref" or "reference to State", is the type of a reference. Same character, two jobs: in front of a variable it takes an address; after a type it makes a reference type.

Now go line by line against the Python.

- `State b = a;` made a *second object*, sixteen bytes of its own, and copied `a`'s bytes into it. The two have different addresses. Changing one leaves the other alone.
- `State& r = a;` made no object at all. `r` is another name for `a`, and `&r == &a` proves it.
- `zero_speed_by_value` received a photocopy and scribbled on the copy. The copy was thrown away when the function returned, so the caller's `a` is untouched.
- `zero_speed_by_ref` received the caller's object itself.

C++ chose the opposite default from Python. In Python everything is shared unless you copy. In C++ everything is copied unless you ask to share. The C++ default is one you can reason about locally: a function taking its parameter by value cannot change anything the caller can see.

g++ even notices when you write the pointless version. Compiling the program with `-Wall -Wextra`:

```text
values.cpp: In function 'void zero_speed_by_value(State)':
values.cpp:8:32: warning: parameter 's' set but not used [-Wunused-but-set-parameter]
    8 | void zero_speed_by_value(State s)  { s.v_mps = 0.0; }
      |                          ~~~~~~^
```

"Set but not used" means you wrote to something nobody will ever read. In Python that function is the normal way to change a caller's object. In C++ it is a bug the compiler can see.

::: key
A Python name is a label bound to an object; assignment rebinds the label. A C++ variable *is* an object: a named region of storage with a type. Assignment writes into that storage. `T& r = x;` makes a second name for the existing object `x`; it creates nothing and copies nothing.
:::

## A variable is storage, so it must be initialized

Because a C++ variable *is* memory, it exists the moment it is declared. If you did not give it a value, it holds whatever was there before. There is no `None`, no "not yet bound" state, and no exception when you read it. Reading an uninitialised variable is undefined behavior, as lesson 05 listed.

C++ has several ways to write an initial value. Here is what each does:

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

(`Gains` holds the three numbers of a PID controller: proportional, integral and derivative gains.)

Prefer the braces, for three reasons.

1. `{}` with nothing inside sets the value to zero. One pair of braces removes the uninitialised-read problem.
2. `{value}` refuses a narrowing conversion at compile time, as lesson 05 showed.
3. `Gains h{1.5, 0.2, 0.05};` fills an **[[aggregate|aggregate]]** — a simple struct — member by member, in order. That is how you will write nearly every small struct.

::: warning
`double x();` inside a function does not declare a variable set to zero. It declares a *function* named `x` that takes no arguments and returns a `double`. This trap is called the **[[most vexing parse|vexing-parse]]**. It is one more reason to write `double x{};`.
:::

## References

A **reference** is an alias: another name for an object that already exists. `T&` binds to an object of type `T`. From then on, every use of the reference is a use of that object. Think of a nickname. Calling your friend "Sam" or "Samantha" reaches the same person.

Three rules follow, and they are what make references safe:

- A reference **must be initialized** when it is declared. `State& r;` does not compile: g++ says "'r' declared as reference but not initialized".
- A reference **cannot be reseated** — pointed at a different object later. After `State& r = a;`, writing `r = b;` does not make `r` name `b`. It copies `b` into `a`, because `r` *is* `a`.
- There is **no null reference**. A reference to nothing can only come from undefined behavior. So a function taking a `T&` need not check for null, where one taking a pointer, `T*`, must.

The second rule is the one that catches Python programmers. `r = b` looks like moving a label, and is really an assignment to the object `r` names.

`const T&`, read "const T ref", is a reference through which you cannot modify the object. It is the workhorse parameter type in C++. The function gets to read the caller's object without copying it, and without permission to change it:

```cpp
double kinetic_energy(const State& s, double mass_kg) {
    return 0.5 * mass_kg * s.v_mps * s.v_mps;
}
```

Here is the whole mapping. It is worth learning as a table:

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

`State` is 16 bytes, two `double`s, so by value is fine: the copy fits in a couple of processor registers and costs almost nothing. A `std::vector<double>` of 5000 samples is different. At 8 bytes each that is $5000 \times 8 = 40{,}000$ bytes, about 40 KB. Passing it by value grabs new memory and copies all 40 KB, on every call. Lesson 09 shows that trap. When in doubt, `const T&` is never badly wrong for a parameter you only read. The **[[C++ Core Guidelines|core-guidelines]]** give the same advice.

::: example A state vector by value and by reference
A propagator takes the current state and returns the next one. Other functions read or adjust a state.

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

Look at what `step` does with its by-value parameter. It *uses the copy as its working variable*. `s` is already a private copy, so changing it and returning it is correct and efficient; no extra local is needed. That trick exists only because parameters are copies. Here the C++ default is nicer than Python's.

**Check `step` with numbers.** Take $r = 6{,}771{,}000$ m, $v = 7670$ m/s, a time step $\Delta t = 0.1$ s (read "delta t"), and an acceleration $a = -8.7\,\mathrm{m/s^2}$.

The position moves by speed times time: $7670 \times 0.1 = 767$ m. So

$$
r' = 6{,}771{,}000 + 767 = 6{,}771{,}767\,\mathrm{m}.
$$

The speed changes by acceleration times time: $-8.7 \times 0.1 = -0.87$ m/s. So

$$
v' = 7670 - 0.87 = 7669.13\,\mathrm{m/s}.
$$

A test program that calls `step` and prints the result shows `r=6771767.0 v=7669.13`, matching. Sanity check: in a tenth of a second at orbital speed you travel about three quarters of a kilometer, and the speed barely changes. That is right.

This method is **[[forward Euler|forward-euler]]**, which the numerical-methods module will warn you not to use for orbits. The point here is how the parameters are passed, not the integrator.
:::

## Dangling references

A reference does not own anything, and it does not keep anything alive. If the object it names dies, the reference is left naming memory that no longer holds an object. Using it is undefined behavior. We call it a **dangling reference**. The classic case:

```cpp
#include <cstdio>

struct State { double r_m; double v_mps; };

const State& make_state() {
    State s{6771000.0, 7670.0};
    return s;                     // s dies at the closing brace
}

int main() {
    const State& st = make_state();
    std::printf("%.1f\n", st.v_mps);
    return 0;
}
```

`s` is an automatic object: it lives in the function's **[[stack frame|stack-frame]]** and dies at the closing brace. The returned reference names dead storage. Both compilers catch this simple case. g++ 13.3.0:

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

Both are warnings, not errors — one more argument for `-Werror`. Now run the two builds. On this machine the g++ build crashed with a segmentation fault: g++ had quietly made the function return a null address. The clang++ build printed `7670.0`, a perfectly believable number. Neither result is a promise. The believable number is the dangerous one, because it is the failure that passes its tests and reaches a vehicle.

The general rule: a reference is safe exactly as long as the object it names. Returning a reference to a parameter, or to a member of a long-lived object, is fine. Returning one to a local is not. Lesson 11 makes "how long does this object live" precise, and the next module turns it into a discipline.

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

Take the three in turn.

1. `current` is safe. `latest` is declared outside any function, so it has **static storage duration**: it lives for the whole run of the program.
2. `smoothed` is safe because it returns *by value*. `out` is copied into the caller's storage before it is destroyed — and in practice the compiler builds it there directly, or moves it.
3. `smoothed_bad` differs from the second only in its return type, and it is the bug.

The reflex to build: **returning a reference is a claim that the object outlives the call.** If you cannot name something that keeps it alive, return by value. That is cheap for small types. For large ones the compiler usually builds the result straight into the caller's storage — **[[copy elision|copy-elision]]** — and if it cannot, it *moves* the object, which for a vector means handing over a pointer rather than copying the data. So "returning a reference to save a copy" rarely saves anything.
:::

## Check yourself

::: check
In Python, `b = a` then `b[0] = 9` changes `a`. In C++, `State b = a;` then `b.r_m = 9;` does not. State the one difference that explains both, in a sentence, and name one more thing that follows from it.
:::

::: answer
A Python variable is a name bound to an object, so `b = a` makes two names for one object and a change through either shows through the other; a C++ variable *is* an object, so `State b = a;` builds a second object and copies `a`'s bytes into it, leaving two independent objects. Python shares by default; C++ copies by default. Much else follows: a by-value parameter cannot affect the caller, a reference is needed to share, and `&a == &b` is the C++ spelling of `a is b`.
:::

::: check
`State& r = a;` and then `r = b;`. What happened to `a`, to `b`, and to `r`?
:::

::: answer
`a` now holds a copy of `b`'s value. `b` is unchanged. `r` still refers to `a`, because a reference cannot be reseated: once bound, it names that object for its whole life, and every later use of `r` — including on the left of `=` — is a use of `a`. So `r = b;` means exactly `a = b;`. In Python the same line would move the label `r` onto `b`'s object and leave `a` alone, which is why this surprises people.
:::

::: check
Why does a function taking `const State&` need no null check, while one taking `const State*` does?
:::

::: answer
A reference must be bound to an object when it is created, and there is no way to make a null one without first doing something undefined. So in a well-defined program a `const State&` parameter always names a real object. A pointer is an ordinary value, and `nullptr` is a perfectly legal value for it. A caller may pass one, and the function must decide what it means. That is why the C++ Core Guidelines suggest a reference for a required argument and a pointer only when "no object" is a meaningful input. The parameter type documents the contract, and the compiler enforces half of it.
:::

::: check
`step` takes `State s` by value, changes `s`, and returns it. Rewrite it to take `const State&` instead. What else must change, and why is the original not wasteful?
:::

::: answer
With `const State& s` the function may not change `s`, so it needs its own local: `State out = s; out.r_m += ...; return out;`. That is one copy, exactly as before. The by-value parameter *was* that copy, made once at the call, where the compiler can often build it straight from the caller's value. So the rewrite adds a line and saves nothing. The rule: when a function needs its own changeable copy of a small argument, take it by value and use it; take `const&` when you only read.
:::

::: check
A colleague writes `const std::vector<double>& history() { std::vector<double> v = build(); return v; }` and says it avoids copying the vector. What do the compilers say, what actually happens, and what should the signature be?
:::

::: answer
g++ warns `reference to local variable 'v' returned [-Wreturn-local-addr]`, and clang++ warns `reference to stack memory associated with local variable 'v' returned`. The local vector is destroyed at the closing brace, which also frees the memory holding its numbers. The returned reference names an object that no longer exists, and every use of it is undefined behavior. The "optimization" saves nothing anyway. Write `std::vector<double> history()` and return by value: the compiler usually builds `v` directly in the caller's storage, and when it cannot, it moves the vector — a few pointer copies, never a copy of the data. Return a reference only when you can name something else that keeps the object alive.
:::

## Summary

| Concept | Python | C++ |
| --- | --- | --- |
| What a variable is | a name bound to an object | the object: named storage with a type |
| `b = a` | two names, one object | two objects; bytes copied |
| Identity test | `a is b` | `&a == &b` |
| Argument passing | parameter names the caller's object | parameter is a copy, unless declared `T&` or `const T&` |
| Rebinding | `x = y` inside a function rebinds the local name | writes into `x`'s storage; a reference can never be reseated |
| Uninitialised | impossible; a name is bound or does not exist | possible, and reading it is undefined behavior |
| Null | `None` | no null reference; `nullptr` only for pointers |
| Lifetime | the garbage collector keeps an object alive while referenced | a reference keeps nothing alive; a dangling reference is undefined behavior |
| `T{}` | — | value initialization: zero |
| `-Wreturn-local-addr` | — | g++'s name for returning a reference to a local |

Lesson 07 adds the words that say what may change and when a value is known: `const`, `constexpr`, `consteval`, and the `auto` that lets the compiler write the type for you.

::: context python-names Labels and boxes
In Python, a name is a label tied to an object that lives elsewhere; two names can point at one list. In C++, each variable is its own box of memory, and a reference is a second name painted on the same box.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <text x="85" y="18" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">Python: b = a</text>
  <rect x="20" y="40" width="30" height="22" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="35" y="56" font-size="12" fill="#1f2a44" text-anchor="middle">a</text>
  <rect x="20" y="100" width="30" height="22" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="35" y="116" font-size="12" fill="#1f2a44" text-anchor="middle">b</text>
  <rect x="95" y="62" width="60" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="125" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">[r, v]</text>
  <line x1="50" y1="51" x2="90" y2="72" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="95,75 85,74 89,66" fill="#1d6fd1"/>
  <line x1="50" y1="111" x2="90" y2="92" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="95,89 89,98 85,90" fill="#1d6fd1"/>
  <text x="85" y="148" font-size="11" fill="#6c7a93" text-anchor="middle">two labels, one object</text>
  <line x1="180" y1="10" x2="180" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <text x="270" y="18" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">C++: State b = a;</text>
  <rect x="200" y="40" width="60" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="230" y="64" font-size="11" fill="#1f2a44" text-anchor="middle">a / r</text>
  <rect x="280" y="40" width="60" height="40" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="310" y="64" font-size="11" fill="#1f2a44" text-anchor="middle">b</text>
  <text x="270" y="110" font-size="11" fill="#6c7a93" text-anchor="middle">two objects, 16 bytes each;</text>
  <text x="270" y="126" font-size="11" fill="#6c7a93" text-anchor="middle">r is a second name for a</text>
</svg>
```
:::

::: context addresses Every object has an address
Memory is one long row of numbered bytes, like mailboxes on a very long street. An object's **address** is the number of its first byte. Two objects that exist at the same time never share an address, so comparing addresses answers "is this the same object?" — exactly what Python's `is` does. Printing an address with `%p` shows a large hexadecimal number, which changes from run to run; only comparisons between addresses mean anything.
:::

::: context aggregate What counts as an aggregate
An **aggregate** is a plain bundle of data: an array, or a struct with no constructors you wrote yourself, no private data, and no virtual functions. You can fill one with a braced list, and the values go into the members in the order they were declared. `Gains h{1.5, 0.2, 0.05}` sets `kp`, then `ki`, then `kd`. Leave some out and the rest are set to zero, so `Gains g{}` is all zeros. Lesson 10 shows how structs with private members and constructors differ.
:::

::: context vexing-parse Why C++ reads it as a function
C++ inherited a rule from C: if something *can* be read as a declaration, it *is* one. `double x();` has the exact shape of a function declaration — a return type, a name, an empty argument list — so that is what it means. Scott Meyers named it the "most vexing parse". Modern g++ warns about it by default, with `-Wvexing-parse`: "empty parentheses were disambiguated as a function declaration". Braces, `double x{};`, can never be read as a function, which is one reason C++11 added them.
:::

::: context core-guidelines The C++ Core Guidelines
The C++ Core Guidelines are a free, public set of rules for writing modern C++, led by Bjarne Stroustrup (who created C++) and Herb Sutter. Their rules on parameters say: pass cheap-to-copy types by value, pass other read-only inputs by `const&`, use `T&` for values the function changes, and use a pointer only when "no object" is a valid input. Many flight-software coding standards borrow from them, and tools like clang-tidy can check some of the rules automatically.
:::

::: context forward-euler The simplest way to step forward in time
**Forward Euler** says: to guess where you will be a short time $\Delta t$ from now, assume your speed and acceleration stay the same for that step. New position is old position plus speed times $\Delta t$; new speed is old speed plus acceleration times $\Delta t$. It is easy, but for an orbit its small errors all push the same way, so a simulated satellite slowly spirals outward. The numerical-methods module shows the better integrators (such as Runge–Kutta) that flight software and simulators really use.
:::

::: context stack-frame Where local variables live
Each time a function is called, it gets a **stack frame**: a block of memory for its local variables, piled on top of its caller's frame. When the function returns, its frame is popped and the space is reused by the next call.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">during make_state()</text>
  <rect x="30" y="30" width="120" height="40" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="54" font-size="11" fill="#1f2a44" text-anchor="middle">make_state: s</text>
  <rect x="30" y="70" width="120" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="94" font-size="11" fill="#1f2a44" text-anchor="middle">main</text>
  <text x="270" y="18" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">after it returns</text>
  <rect x="210" y="30" width="120" height="40" fill="#fff" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5,4"/>
  <text x="270" y="54" font-size="11" fill="#b4232c" text-anchor="middle">dead, reused</text>
  <rect x="210" y="70" width="120" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="94" font-size="11" fill="#1f2a44" text-anchor="middle">main: st</text>
  <path d="M300,82 C345,82 345,50 332,50" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="332,50 341,45 341,55" fill="#b4232c"/>
  <text x="180" y="138" font-size="11" fill="#6c7a93" text-anchor="middle">the reference st still points at the popped frame</text>
</svg>
```
:::

::: context copy-elision When the compiler skips the copy
**Copy elision** means the compiler builds a returned object directly in the caller's storage, so no copy is made at all. Since C++17 it is *guaranteed* when you return a temporary, as in `return State{...};`. When you return a named local, as in `return out;`, elision is allowed and usual but not guaranteed (it is called NRVO, "named return value optimization"). If the compiler does not elide it, C++ still treats the local as something that can be *moved* rather than copied. Either way, returning by value is cheap.
:::
