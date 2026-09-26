---
id: l04-structs-enums-and-match
title: Structs, enums and match
minutes: 24
covers:
  - struct, enum as real sum types, impl blocks
  - Pattern matching and match exhaustiveness
---

Think about two different forms you might fill in.

The first is a shipping label: a name **and** a street **and** a city **and** a zip code. Every label has all four boxes filled in.

The second is a lunch order: soup **or** a sandwich **or** a salad, never two at once. Each choice comes with its own questions. Soup asks "cup or bowl?", a sandwich asks "which bread?", a salad asks nothing more.

Those two shapes, "all of these together" and "exactly one of these", are the two ways data is built in almost every program. Rust gives each one its own tool. A **struct** is the shipping label: several named pieces, all present at once. An **enum** is the lunch order: exactly one of several choices, and each choice can carry its own details. The third tool in this lesson, **match**, is the person at the counter who looks at the order, sees which kind it is, and makes the right thing.

On a spacecraft the same shapes are everywhere. A propellant tank's state is a struct: a name, a capacity, a level. The flight mode is an enum: exactly one mode at a time. And flight software is full of code that says "in this mode, do this; in that mode, do that". Rust's version of that code has a property C++ lacks: the compiler refuses to build it if you forgot a mode.

## Structs: several named things, all at once

A **struct** (short for "structure") is a new type you define by listing its **fields**, the named pieces it holds. Here is a propellant tank, with a few verbs attached so it can do something:

```rust
#[derive(Debug)]
struct Tank {
    name: String,
    capacity_kg: f64,
    level_kg: f64,
}

impl Tank {
    // An associated function: no self. Called as Tank::new(...).
    fn new(name: &str, capacity_kg: f64) -> Tank {
        Tank {
            name: name.to_string(),
            capacity_kg,        // shorthand for capacity_kg: capacity_kg
            level_kg: 0.0,
        }
    }

    // A method that only reads: &self.
    fn fraction_full(&self) -> f64 {
        self.level_kg / self.capacity_kg
    }

    // A method that changes the tank: &mut self.
    fn fill(&mut self, kg: f64) {
        self.level_kg = (self.level_kg + kg).min(self.capacity_kg);
    }
}

fn main() {
    let mut lox = Tank::new("LOX", 280_000.0);
    lox.fill(200_000.0);
    println!("{} is {:.1}% full", lox.name, 100.0 * lox.fraction_full());
    lox.fill(100_000.0); // more than fits: capped at capacity
    println!("{} is {:.1}% full", lox.name, 100.0 * lox.fraction_full());
    println!("{:?}", lox);
}
```

```text
LOX is 71.4% full
LOX is 100.0% full
Tank { name: "LOX", capacity_kg: 280000.0, level_kg: 280000.0 }
```

`struct Tank { ... }` lists three fields, each as `name: type`. To make a `Tank` you write the type name and give **every** field a value inside braces. There is no "leave it blank and hope it is zero", which is one way C++ lets an uninitialized member slip through.

When a local variable has the same name as the field, you can write it once: `capacity_kg,` means `capacity_kg: capacity_kg`. This is called **field init shorthand**.

You read a field with a dot, `lox.name`, the same as in C++ and Python. Mutability belongs to the variable, not to single fields: `let mut lox` lets you change any field of `lox`, and a plain `let` lets you change none.

The line `#[derive(Debug)]` above the struct asks the compiler to write the code that prints a `Tank` with `{:?}`. That is what produced the last output line. Lesson 08 explains **[[derive|derive-attribute]]** properly; for now, put it on types you want to print while you learn.

### Tuple structs and the newtype trick

Sometimes the fields do not need names. A **tuple struct** has fields numbered `.0`, `.1`, and so on:

```rust
struct Meters(f64);
struct Feet(f64);

fn above_floor(h: Meters) -> bool {
    h.0 > 100.0
}

fn main() {
    let h = Feet(328.0);
    println!("{}", above_floor(h));
}
```

This does not compile, and that is the point:

```text
error[E0308]: mismatched types
  --> src/bin/newtype.rs:10:32
   |
10 |     println!("{}", above_floor(h));
   |                    ----------- ^ expected `Meters`, found `Feet`
   |                    |
   |                    arguments to this function are incorrect
```

`Meters` and `Feet` are the same eight bytes at run time, but different types to the compiler. A one-field wrapper like this is a **newtype**. It costs nothing at run time and turns a units mix-up into a compile error, the kind of mistake that has cost a real **[[Mars mission|mars-climate-orbiter]]**.

::: key
A struct groups named fields that are all present at once. Every field must be given a value when the struct is built. A tuple struct with one field, a newtype, gives the same bytes a different type, so the compiler can keep units apart.
:::

## impl blocks: giving a type its verbs

The functions that belong to a type live in an **impl block** ("impl" is short for implementation): `impl Tank { ... }`. Inside one there are two kinds of function.

- An **associated function** has no `self` parameter. It belongs to the type, not to any one tank. You call it with two colons: `Tank::new("LOX", 280_000.0)`. Read `::` as "the ... that belongs to", so `Tank::new` is "the `new` that belongs to `Tank`". Rust has no special constructor syntax; `new` is only a naming habit for the function that builds one.
- A **method** has `self` as its first parameter. You call it with a dot on a value: `lox.fraction_full()`.

The first parameter says what the method is allowed to do with the value. Read the `&` aloud as "a borrow of":

| First parameter | Read aloud | What the method may do |
| --- | --- | --- |
| `&self` | "ampersand self", a shared borrow | look at the fields, not change them |
| `&mut self` | "ampersand mut self", a mutable borrow | change the fields |
| `self` | "self", by value | take the whole value and use it up |

So `fraction_full(&self)` only reads, and `fill(&mut self, kg)` writes. The dot call hides the borrow: `lox.fill(200_000.0)` means `Tank::fill(&mut lox, 200_000.0)`. Calling `fill` on a tank declared with plain `let` is a compile error. This is the job `const` member functions do in C++, except that here read-only is the default and you opt in to changing things. The word **[[self|why-self]]** is the same one Python uses, and `Self` with a capital S is a short name for the type being implemented. The next module is all about borrowing; for now, the three rows of that table are enough.

::: example Following the tank program line by line
Start: `Tank::new("LOX", 280_000.0)` builds a tank with `level_kg` at $0$.

First fill: $0 + 200\,000 = 200\,000\,\mathrm{kg}$. That is less than the capacity, so `.min(...)` keeps it. The fraction full is

$$
\frac{200\,000}{280\,000} = 0.714\ldots,
$$

and times $100$, printed with one decimal place, that is $71.4\%$.

Second fill: $200\,000 + 100\,000 = 300\,000\,\mathrm{kg}$. That is more than the tank holds, so `(300_000.0).min(280_000.0)` gives $280\,000$. The fraction is exactly $1$, printed as $100.0\%$.

Sanity check: a tank can never read more than $100\%$, and the `min` in `fill` is the one line that guarantees it.
:::

## No function overloading

In C++ you might give a class two constructors, one taking an angle in radians as a `double` and one taking degrees as a `float`. The compiler picks one by looking at the argument's type. That is **function overloading**: several functions with the same name, told apart by their parameter types.

Rust does not allow it. Two methods with the same name in one type is an error:

```rust
impl Angle {
    fn new(rad: f64) -> Angle {
        Angle { rad }
    }
    fn new(deg: f32) -> Angle {
        Angle { rad: (deg as f64).to_radians() }
    }
}
```

```text
error[E0592]: duplicate definitions with name `new`
 --> src/bin/overload.rs:9:5
  |
6 |     fn new(rad: f64) -> Angle {
  |     ------------------------- other definition for `new`
...
9 |     fn new(deg: f32) -> Angle {
  |     ^^^^^^^^^^^^^^^^^^^^^^^^^ duplicate definitions for `new`
```

Why? Rust leans hard on **[[type inference|type-inference]]**: the compiler works out types you did not write down. In `Angle::new(1.0)` the literal `1.0` could be an `f32` or an `f64`. With two `new` functions, the compiler would have to pick the function and the literal's type at once, each choice depending on the other, and its error messages would turn into long lists of "candidates".

Rust's answers:

- **Different names.** `Angle::from_rad` and `Angle::from_deg`. The name now says the unit, which is better for flight code anyway.
- **Traits and generics**, for one operation that should work on many types. A trait is a named set of methods many types can provide; the next module covers them.
- **Option structs or builders** replace C++ default arguments (Rust has none): pass one struct holding the settings, or build the value step by step.

```rust
struct Angle {
    rad: f64,
}

impl Angle {
    fn from_rad(rad: f64) -> Angle {
        Angle { rad }
    }
    fn from_deg(deg: f64) -> Angle {
        Angle { rad: deg.to_radians() }
    }
    fn deg(&self) -> f64 {
        self.rad.to_degrees()
    }
}

fn main() {
    let a = Angle::from_deg(90.0);
    let b = Angle::from_rad(0.5);
    println!("{:.6} rad", a.rad);
    println!("{:.3} deg", b.deg());
}
```

```text
1.570796 rad
28.648 deg
```

Check the numbers: $90^\circ$ is a quarter turn, $\pi/2 \approx 1.570796$ rad. And $0.5 \times 180/\pi \approx 28.648^\circ$.

::: key
Rust has no function overloading, to keep type inference and error messages tractable. Traits and generics cover most of what overloading would provide, and builder or option structs cover the rest, which is why Rust APIs look different from C++ ones.
:::

## Enums: exactly one of several shapes

Back to the lunch order. An **enum** (short for enumeration) is a type whose value is exactly one of a fixed list of **variants**.

The simplest kind looks like a C++ `enum class`: a list of names.

```rust
#[derive(Debug, Clone, Copy)]
enum AdcsMode {
    Safe,
    Detumble,
    SunPointing,
    NadirPointing,
}
```

These are modes of a satellite's **[[attitude control|adcs]]** system, the part that points the spacecraft. An `AdcsMode` is one of those four and nothing else, written like `AdcsMode::Safe`. (`Clone, Copy` in the derive line lets a mode be copied freely, like a number.)

### Variants that carry data

Here is where Rust parts company with C++. Each variant can carry its own data, and different variants can carry different kinds:

```rust
#[derive(Debug)]
enum Command {
    Hold,
    SetThrottle(f64),
    Gimbal { pitch_deg: f64, yaw_deg: f64 },
}
```

`Hold` carries nothing. `SetThrottle` carries one number, a fraction from $0$ to $1$. `Gimbal` carries two named numbers. A `Command` is exactly one of the three, with exactly the data that variant needs. No meaningless throttle field lies around when the command is `Hold`.

How is that stored? Underneath, a `Command` is a small number saying *which* variant it is, called the **tag**, plus enough room for the biggest variant's data. That combination is a **[[tagged union|tagged-union-layout]]**. On this machine `std::mem::size_of::<Command>()` is $24$ bytes: $16$ for the two `f64`s of the largest variant, one for the tag, and padding to keep the `f64`s lined up on 8-byte boundaries.

The key rule: you **cannot touch the data without first checking the tag**. Safe Rust has no way to read a `Hold` as if it were a `Gimbal`. The only way in is `match`.

Compare that with the C++ tools:

- A C++ `enum` or `enum class` is a named integer. It cannot carry data.
- A C++ `union` has no tag. Nothing stops you reading the wrong member.
- **[[std::variant|std-variant]]** (C++17) has a tag, but `std::get` on the wrong alternative is found out at run time, when it throws.

::: key
A Rust enum is a tagged union: each variant can carry data of a different type, and the compiler enforces that you check the tag before touching the payload. It is std::variant with pattern matching and exhaustiveness built into the language.
:::

Why "sum type"? Count the possible values. A struct holding a `bool` **and** a `u8` has $2 \times 256 = 512$ values. An enum holding a `bool` **or** a `u8` has $2 + 256 = 258$. Structs multiply, enums add, so a struct is a **product type** and an enum a **[[sum type|sum-and-product]]**.

One enum you will use every day is in the standard library: `Option`, which is either `Some(value)` or `None`. Lesson 06 is all about it.

## match: looking at the order and acting on it

The person at the sandwich counter reads the order, sees which kind it is, and then reaches for the details that kind carries. That is **match**.

```rust
fn describe(cmd: &Command) -> String {
    match cmd {
        Command::Hold => String::from("hold current state"),
        Command::SetThrottle(t) => format!("throttle to {:.0}%", t * 100.0),
        Command::Gimbal { pitch_deg, yaw_deg } => {
            format!("gimbal pitch {pitch_deg} deg, yaw {yaw_deg} deg")
        }
    }
}
```

A `match` takes a value and a list of **arms**. Each arm is a **pattern**, then `=>` (read "goes to", also called the **[[fat arrow|fat-arrow]]**), then an expression. Rust tries the patterns top to bottom and runs the first that fits.

A pattern does two jobs at once. It checks the shape (is this a `SetThrottle`?) and gives names to the data inside (`t` is the throttle). `{ pitch_deg, yaw_deg }` pulls out both `Gimbal` fields by name. This is called **destructuring**.

`match` is an expression: it has the value of whichever arm ran. The match is the last expression in `describe`, so its value is what the function returns, with no `return` needed. Every arm must produce the same type, here a `String`.

::: example A command queue, sorted by kind
```rust
fn main() {
    let queue = [
        Command::SetThrottle(0.7),
        Command::Gimbal { pitch_deg: 1.5, yaw_deg: -0.5 },
        Command::Hold,
    ];
    for cmd in &queue {
        println!("{}", describe(cmd));
    }
}
```

```text
throttle to 70%
gimbal pitch 1.5 deg, yaw -0.5 deg
hold current state
```

Step by step. The first command is `SetThrottle(0.7)`. The first arm, `Command::Hold`, does not fit, so Rust moves on. The second arm fits, and `t` becomes $0.7$. Then $0.7 \times 100 = 70$, printed with no decimals: "throttle to 70%".

The second command is a `Gimbal`. It skips the first two arms and fits the third, with `pitch_deg` $= 1.5$ and `yaw_deg` $= -0.5$.

The third command fits the very first arm. It carries no data, so the arm names nothing.

Notice what could not happen: no arm could ever see a throttle number on a `Hold` command, because the pattern for `Hold` has nowhere to put one.
:::

### More kinds of pattern

Patterns work on plain numbers too, not only enums:

```rust
fn band(alt_m: u32) -> &'static str {
    match alt_m {
        0 => "on the pad",
        1..=999 => "low",
        1_000..=9_999 => "climbing",
        _ => "high",
    }
}

fn check(temp_c: f64) -> &'static str {
    match temp_c {
        t if t < -40.0 => "too cold",
        t if t > 85.0 => "too hot",
        _ => "in range",
    }
}
```

```text
0 m: on the pad
450 m: low
7200 m: climbing
35000 m: high
-55 C: too cold
20 C: in range
90 C: too hot
```

- A **literal** like `0` matches that exact value.
- A **range pattern** `1..=999`, read "one through nine hundred ninety-nine, inclusive", matches anything in between, ends included.
- `_`, read "underscore" or "anything", is the **wildcard**. It matches every value and names nothing.
- `A | B`, read "A or B", matches if either pattern does.
- A **match guard** is an extra `if` after the pattern: `t if t < -40.0` fits only when the condition is true. Guards are how you test floating-point limits, since a range of floats is rarely what you want.

When you care about only one variant, a full `match` feels heavy. **if let** is a one-arm match: `if let Command::SetThrottle(t) = c { ... }` runs the block only when `c` is a `SetThrottle`, with `t` bound to its number. Lesson 03's `while let` is the same idea in a loop.

::: warning Arms are tried in order
The first arm that fits wins, so a wide pattern placed early hides the narrow ones after it. Put `_ => "high"` first in `band` and every altitude, even $0$, comes out "high". The compiler does notice this one and warns you: `warning: unreachable pattern ... no value can reach this`. Read that warning as an error. It always means an arm you wrote can never run.
:::

## Exhaustiveness: the compiler checks every case

Here is the rule that makes all of this worth learning. **A match must cover every possible value of the thing it matches.** If some value would fall through every arm, the program does not compile. A match that covers everything is called **exhaustive**.

Take a function that sets the maximum turn rate for each attitude mode:

```rust
fn max_rate_deg_s(mode: AdcsMode) -> f64 {
    match mode {
        AdcsMode::Safe => 0.5,
        AdcsMode::Detumble => 5.0,
        AdcsMode::SunPointing => 1.0,
        AdcsMode::NadirPointing => 1.0,
    }
}
```

It compiles, because all four modes have an arm. Now a new requirement arrives, and someone adds a fifth mode to the enum, `TargetTracking`, for pointing a camera at a spot on the ground. They do not touch `max_rate_deg_s`, maybe because they did not know it existed. The build stops:

```text
error[E0004]: non-exhaustive patterns: `AdcsMode::TargetTracking` not covered
  --> src/bin/modes_bad.rs:11:11
   |
11 |     match mode {
   |           ^^^^ pattern `AdcsMode::TargetTracking` not covered
   |
note: `AdcsMode` defined here
  --> src/bin/modes_bad.rs:2:6
   |
 2 | enum AdcsMode {
   |      ^^^^^^^^
...
 7 |     TargetTracking,
   |     -------------- not covered
   = note: the matched value is of type `AdcsMode`
```

This is an **error**, not a warning, naming the missing variant and the exact match that forgot it. In a real flight program the same enum is matched in dozens of places: rate limits, telemetry labels, which actuators may fire. Every one lights up, so nobody can forget one.

::: key
Match exhaustiveness is a safety feature: adding a variant to an enum breaks every match that does not handle it, so a new vehicle mode cannot silently fall into a default branch. It turns a code-review responsibility into a compiler responsibility.
:::

::: warning The wildcard switches the check off
If the last arm had been `_ => 1.0`, adding `TargetTracking` would compile with no complaint about this match: the new mode quietly gets `1.0`, which may be exactly wrong. On your own mode enums, list every variant and leave out `_`. Save the wildcard for things with too many values to list, like a `u32` or a string.
:::

::: example Exhaustiveness over a pair of values
Thrusters may fire only when the system is armed and the mode is not `Safe`. You can match on both values at once by putting them in a **tuple**, `(mode, armed)`:

```rust
fn thrusters_allowed(mode: AdcsMode, armed: bool) -> bool {
    match (mode, armed) {
        (_, false) => false,
        (AdcsMode::Safe, true) => false,
        (AdcsMode::Detumble | AdcsMode::SunPointing | AdcsMode::NadirPointing, true) => true,
    }
}
```

How many cases must be covered? Four modes times two values of `armed` is $4 \times 2 = 8$ combinations.

- The first arm, `(_, false)`, covers all four modes when not armed: $4$ cases.
- The second covers `Safe` when armed: $1$ case.
- The third covers the other three modes when armed: $3$ cases.

$4 + 1 + 3 = 8$. Every combination is covered, so it compiles. Running all eight gives `true` only for `Detumble`, `SunPointing` and `NadirPointing` with `armed=true`.

Now delete `AdcsMode::NadirPointing` from the third arm. That leaves $7$ covered, and the compiler finds the one that is missing:

```text
error[E0004]: non-exhaustive patterns: `(AdcsMode::NadirPointing, true)` not covered
```

It counted combinations for you, exactly where a human reviewer is most likely to miss one.
:::

### The same thing in C++

In C++ the nearest tool is a `switch` over an `enum class`. Here is the five-mode version with the new mode unhandled, compiled with GCC 13 and `-Wall`:

```text
modes.cpp: In function 'double max_rate_deg_s(AdcsMode)':
modes.cpp:4:12: warning: enumeration value 'TargetTracking' not handled in switch [-Wswitch]
```

That is helpful, but look at the limits of **[[-Wswitch|wswitch-and-rules]]**:

- It is a **warning**. The program still builds unless the project compiles with `-Werror`, which turns warnings into errors.
- It fires only when the `switch` has **no `default:` label**. Add a `default:` and GCC says nothing, even with `-Wall`. The separate flag `-Wswitch-enum` warns even then, but `-Wall` does not include it.
- A C++ enum variable can hold a value that is none of its enumerators, say after `static_cast<AdcsMode>(7)` on a corrupted telemetry byte, and then no `case` matches. In safe Rust an enum value is always one of its variants.

Rust makes the check an error, every time, with no flag to remember and no `default` that hides it.

## Check yourself

::: check
A struct is defined as `struct Reading { t_s: f64, value: f64 }`. Someone writes `let r = Reading { t_s: 1.5 };`. What happens, and why is that a good thing for flight code?
:::

::: answer
It does not compile: every field needs a value, and `value` is missing. So there is no half-built `Reading` whose `value` is whatever happened to be in memory, which a C++ struct member without an initializer can hold.
:::

::: check
An enum is `enum Sample { Flag(u8), Vector(f64, f64, f64) }`. Roughly how big is a `Sample`, and why is it not $1 + 24 = 25$ bytes?
:::

::: answer
The largest variant, `Vector`, needs $3 \times 8 = 24$ bytes. The tag needs at least one byte, which makes $25$. But the `f64`s must sit at addresses that are multiples of $8$, and an array of `Sample`s must keep every element lined up that way. So the size is rounded up to the next multiple of $8$: $32$ bytes. `std::mem::size_of::<Sample>()` prints `32` with Rust 1.94.
:::

::: check
You want a `Thrust` type that can be built from newtons or from pounds-force. A C++ colleague writes two `fn new` functions with different parameter types. What does the compiler say, and what would you write instead?
:::

::: answer
Error E0592, "duplicate definitions with name `new`": Rust has no overloading. Use different names, such as `Thrust::from_newtons(f64)` and `Thrust::from_lbf(f64)`, so every call site shows the unit. Newtypes like `Newtons(f64)` would guard the units even more strongly.
:::

::: check
A team's mode match ends with `_ => 0.0`. Someone adds a variant `Abort`. What does the build do, and what would you change?
:::

::: answer
It builds. The wildcard arm catches `Abort` and gives it `0.0` without any error, which is exactly the silent default that exhaustiveness is meant to prevent. Replace `_` with one arm per variant. Then adding `Abort` produces error E0004, "non-exhaustive patterns: `...::Abort` not covered", at every match that needs a decision about it.
:::

::: check
Count the possible values of `struct S { a: bool, b: bool, c: u8 }` and of `enum E { A(bool), B(bool), C(u8) }`. Which is a sum and which is a product?
:::

::: answer
The struct holds all three at once: $2 \times 2 \times 256 = 1024$ values. That is a product. The enum holds exactly one variant with its data: $2 + 2 + 256 = 260$ values. That is a sum. Fewer possible values means fewer impossible states for your code to guard against.
:::

## Summary

| Idea | Rust | In one line |
| --- | --- | --- |
| Struct | `struct Tank { name: String, level_kg: f64 }` | named fields, all present, all given a value when built |
| Tuple struct / newtype | `struct Meters(f64);` | same bytes, different type: units the compiler can check |
| impl block | `impl Tank { ... }` | the functions that belong to a type |
| Associated function | `Tank::new(...)` | no `self`; called with `::` |
| Method receivers | `&self`, `&mut self`, `self` | read, change, or use up the value |
| No overloading | `from_deg`, `from_rad` | different names, traits and generics, option structs |
| Enum | `enum Command { Hold, SetThrottle(f64) }` | exactly one variant; a tagged union, a sum type |
| match | `match x { pat => expr, ... }` | first fitting arm runs; the match is an expression |
| Patterns | literals, ranges `1..=9`, or-patterns, `_`, guards | check the shape and name the parts |
| Exhaustiveness | error E0004 | a missed variant is a compile error, not a warning |
| C++ switch | `-Wswitch` | a warning, silenced by `default:` |

Next, lesson 05 organizes code into modules, decides what is public, and introduces the collections (arrays, slices, `Vec`, `HashMap`, `BTreeMap`) that hold many structs at once.

::: context derive-attribute The line above the struct
`#[derive(Debug)]` is an **attribute**: an instruction to the compiler written on the line above an item. `derive` means "write the obvious code for this trait for me". `Debug` is the trait that lets `{:?}` print a value. Without the line, `println!("{:?}", lox)` is a compile error, because Rust will not guess how you want a type printed. Other common ones are `Clone`, `Copy` and `PartialEq` (which gives `==`). Lesson 08 covers derive macros in full; the exercise solutions in this module use `#[derive(Debug, PartialEq)]` so their tests can compare errors with `assert_eq!`.
:::

::: context mars-climate-orbiter A lost spacecraft and a missing type
NASA's Mars Climate Orbiter was lost in September 1999 as it arrived at Mars. The investigation board found that ground software supplied thruster impulse data in pound-force seconds, while the navigation software expected newton-seconds. The numbers were off by a factor of about $4.45$, and the spacecraft's path drifted until it came in far too low. Both values were plain floating-point numbers, so nothing in the code could tell them apart. A newtype such as `NewtonSeconds(f64)` is the programming-language answer: the mismatch becomes a type error at build time instead of a navigation error at a planet.
:::

::: context why-self Why the word self
Python makes you write `self` as the first parameter of every method, and Rust does too. C++ hides it: every member function secretly receives a pointer called `this`. Rust's choice to write it out has a payoff Python does not get: the receiver carries a borrow mode. `&self`, `&mut self` and `self` are three different promises about the object, and the compiler holds each method to its promise. In C++ the closest thing is putting `const` after the parameter list, and forgetting it is common.
:::

::: context type-inference Letting the compiler work out the types
**Type inference** means the compiler figures out a type from how a value is used, so you do not have to write it. In `let x = 2.0; let y: f32 = x * 3.0;`, Rust decides `x` is an `f32` from the second line. This works by solving a set of little equations across a function. Overloading would add a second unknown to every call (which function did you mean?) that depends on the first (which types are these?). Rust chose predictable inference and short error messages over overloading. C++ made the other choice, which is one reason its template errors can run to pages.
:::

::: context adcs What attitude control does
A spacecraft's **attitude** is which way it is pointing. The **attitude determination and control system**, ADCS, measures that (with star trackers, sun sensors, gyroscopes) and changes it (with reaction wheels, magnetic torquers or small thrusters). Typical modes: *detumble* slows a spinning satellite after it separates from the rocket; *sun pointing* turns the solar panels to the Sun; *nadir pointing* aims an instrument straight down at Earth; *safe mode* is a simple, robust state the spacecraft falls back to when something goes wrong. The mode names in this lesson are typical examples, not any one spacecraft's list.
:::

::: context tagged-union-layout What a Command looks like in memory
Every `Command` takes the same 24 bytes, whichever variant it is. The tag says which variant; the rest is room for the biggest payload. A `Hold` leaves the payload bytes unused, and `SetThrottle` uses only the first eight. The exact layout is the compiler's choice, and Rust does not promise it unless you ask with an attribute such as `#[repr(C)]`; this picture shows the idea.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#6c7a93">byte offset</text>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="104" y="18">0</text><text x="176" y="18">8</text><text x="248" y="18">16</text><text x="320" y="18">24</text>
  </g>
  <text x="10" y="50" font-size="12" fill="#1f2a44">Hold</text>
  <rect x="104" y="34" width="72" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="176" y="34" width="144" height="26" fill="#ffffff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="140" y="51" font-size="11" fill="#1f2a44" text-anchor="middle">tag 0</text>
  <text x="248" y="51" font-size="11" fill="#6c7a93" text-anchor="middle">unused</text>
  <text x="10" y="94" font-size="12" fill="#1f2a44">SetThrottle</text>
  <rect x="104" y="78" width="72" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="176" y="78" width="72" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="248" y="78" width="72" height="26" fill="#ffffff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="140" y="95" font-size="11" fill="#1f2a44" text-anchor="middle">tag 1</text>
  <text x="212" y="95" font-size="11" fill="#1f2a44" text-anchor="middle">f64</text>
  <text x="284" y="95" font-size="11" fill="#6c7a93" text-anchor="middle">unused</text>
  <text x="10" y="138" font-size="12" fill="#1f2a44">Gimbal</text>
  <rect x="104" y="122" width="72" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="176" y="122" width="72" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="248" y="122" width="72" height="26" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="140" y="139" font-size="11" fill="#1f2a44" text-anchor="middle">tag 2</text>
  <text x="212" y="139" font-size="11" fill="#1f2a44" text-anchor="middle">pitch</text>
  <text x="284" y="139" font-size="11" fill="#ffffff" text-anchor="middle">yaw</text>
  <text x="104" y="164" font-size="11" fill="#6c7a93">tag byte plus 7 bytes of padding, then the payload</text>
</svg>
```
:::

::: context std-variant The C++ cousin
`std::variant<A, B, C>`, added in C++17, is a library tagged union. It knows which alternative it holds. You read it with `std::get<B>(v)`, which throws `std::bad_variant_access` if `v` holds something else, or with `std::visit` and a set of lambdas, one per alternative. `std::visit` does check that every alternative is handled, but the checking lives in template machinery, so a missing case shows up as a long template error rather than a one-line message naming the case. Rust puts the same idea in the language itself, with `match`, patterns and a plain error.
:::

::: context sum-and-product Where the names come from
Types can be counted like numbers. `bool` has $2$ values, `u8` has $256$. Putting types side by side in a struct multiplies the counts; offering a choice between them in an enum adds them. Types built from sums and products are called **algebraic data types**. Languages in the ML family, such as OCaml and Haskell, have had them for decades, and Rust's enums and `match` come from that tradition.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="90" y="20" font-size="13" fill="#1f2a44" text-anchor="middle" font-weight="700">struct: AND</text>
  <rect x="20" y="32" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="50" y="52" font-size="12" fill="#1f2a44" text-anchor="middle">bool</text>
  <rect x="100" y="32" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="130" y="52" font-size="12" fill="#1f2a44" text-anchor="middle">u8</text>
  <text x="90" y="86" font-size="12" fill="#1f2a44" text-anchor="middle">2 × 256 = 512 values</text>
  <text x="270" y="20" font-size="13" fill="#1f2a44" text-anchor="middle" font-weight="700">enum: OR</text>
  <rect x="200" y="32" width="60" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="230" y="52" font-size="12" fill="#1f2a44" text-anchor="middle">bool</text>
  <text x="270" y="52" font-size="12" fill="#b4232c" text-anchor="middle">or</text>
  <rect x="280" y="32" width="60" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="310" y="52" font-size="12" fill="#1f2a44" text-anchor="middle">u8</text>
  <text x="270" y="86" font-size="12" fill="#1f2a44" text-anchor="middle">2 + 256 = 258 values</text>
  <text x="180" y="112" font-size="11" fill="#6c7a93" text-anchor="middle">fewer values means fewer impossible states</text>
</svg>
```
:::

::: context fat-arrow Two arrows
Rust has two arrows and they mean different things. The thin arrow `->`, made of a minus and a greater-than, points from a function's parameters to its return type: `fn new() -> Tank`. The fat arrow `=>`, made of an equals and a greater-than, points from a pattern to what to do when it matches. JavaScript uses `=>` for its short functions, and programmers there call it the fat arrow too.
:::

::: context wswitch-and-rules Warnings, rules and the default label
`-Wall` in GCC and Clang turns on `-Wswitch`, and many flight-software builds add `-Werror` so that a warning stops the build. But coding standards can pull the other way. MISRA C:2012, widely used in safety-critical C, requires every `switch` to have a `default` label (Rule 16.4), and a `default` label is exactly what silences `-Wswitch`. Teams that follow both usually turn on `-Wswitch-enum` as well, or use a static-analysis tool. In Rust there is nothing to configure.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#6c7a93">a mode is added but not handled</text>
  <rect x="10" y="32" width="340" height="30" fill="#ffffff" stroke="#1f2a44"/>
  <text x="20" y="52" font-size="12" fill="#1f2a44">C++ switch, no default, -Wall</text>
  <text x="340" y="52" font-size="12" fill="#1d6fd1" text-anchor="end" font-weight="700">warning</text>
  <rect x="10" y="68" width="340" height="30" fill="#ffffff" stroke="#1f2a44"/>
  <text x="20" y="88" font-size="12" fill="#1f2a44">C++ switch with default:, -Wall</text>
  <text x="340" y="88" font-size="12" fill="#6c7a93" text-anchor="end" font-weight="700">silent</text>
  <rect x="10" y="104" width="340" height="30" fill="#ffffff" stroke="#1f2a44"/>
  <text x="20" y="124" font-size="12" fill="#1f2a44">Rust match, no wildcard</text>
  <text x="340" y="124" font-size="12" fill="#b4232c" text-anchor="end" font-weight="700">error E0004</text>
</svg>
```
:::
