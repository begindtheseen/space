---
id: l05-modules-and-collections
title: Modules and collections
minutes: 24
covers:
  - Modules, pub, paths, use
  - Slices and arrays; Vec, HashMap, BTreeMap
---

Picture a workshop. The tools are not in one heap on the floor. They are in a cabinet with labeled drawers: "wrenches", "drill bits", "electrical". Some drawers are locked, because only the person who owns them should reach inside. When you want a tool, you say which drawer it lives in.

Now picture what the tools go into. An egg carton always holds exactly twelve eggs. A backpack stretches to hold as much as you put in. A phone book lets you look up a number by a name. The index at the back of a book does the same, but keeps the names in alphabetical order.

This lesson is about both. The first half is **modules**: Rust's labeled drawers for code, with locks deciding who may reach in. The second half is **collections**: the carton (an array), a window onto part of the carton (a slice), the backpack (a `Vec`), the phone book (a `HashMap`) and the sorted index (a `BTreeMap`).

Flight software needs both. Its hundreds of functions must be sorted so two teams' helpers never collide or leak into each other, and its data comes in bunches: the last ten gyro readings, a queue of commands, packet counts by sensor.

## Modules: drawers for code

A **module** is a named container for functions, types, constants and other modules. You make one with the keyword `mod`.

The simplest way puts the module in a separate file. Say your project has `src/main.rs` and a second file `src/units.rs`:

```rust
// src/units.rs
pub const FT_TO_M: f64 = 0.3048;

pub fn ft_to_m(ft: f64) -> f64 {
    ft * FT_TO_M
}

pub mod force {
    const LBF_TO_N: f64 = 4.448_221_615_260_5;

    pub fn lbf_to_n(lbf: f64) -> f64 {
        check(lbf);
        lbf * LBF_TO_N
    }

    fn check(x: f64) {
        debug_assert!(x.is_finite());
    }
}
```

```rust
// src/main.rs
mod units;

use units::{ft_to_m, FT_TO_M};

fn main() {
    println!("1 ft = {FT_TO_M} m");
    println!("12.5 ft = {} m", ft_to_m(12.5));
    println!("100 lbf = {:.2} N", units::force::lbf_to_n(100.0));
}
```

```text
1 ft = 0.3048 m
12.5 ft = 3.81 m
100 lbf = 444.82 N
```

The line `mod units;` in `main.rs` tells the compiler: "there is a module called `units`; go and read `src/units.rs` for it". This is the only way a file becomes part of the program. Unlike C++, there is no list of source files in a build script and no `#include`. The **[[module tree|module-tree]]** starts at `main.rs` (or `lib.rs` for a library) and grows one `mod` line at a time. The older layout `src/units/mod.rs` also works and means the same thing.

Inside `units.rs`, `pub mod force { ... }` makes a module inside a module, written right there in braces. That is an **inline module**. Both styles make the same tree.

### Private unless you say pub

Everything in a module is **private** by default: only code in the same module (and the modules inside it) can use it. The keyword **pub**, read "pub" or "public", unlocks the drawer.

`lbf_to_n` is `pub`, so `main` can call it. `check` has no `pub`, so it is a private helper. Try calling it from `main` and the compiler stops you:

```text
error[E0603]: function `check` is private
  --> src/main.rs:9:19
   |
 9 |     units::force::check(1.0);
   |                   ^^^^^ private function
```

This is the lock on the drawer. The `force` module can rename or delete `check` knowing no outside code can break. The public items are the module's contract with the rest of the program; the private ones are its own business. That is the opposite default from C++, where a free function is visible everywhere unless it is `static` or in an anonymous namespace.

### Privacy and struct fields

Marking a struct `pub` makes the *type* public. Its fields stay private unless each one is marked `pub` too:

```rust
mod tank {
    pub struct Tank {
        pub name: String,
        level_kg: f64,
    }
    impl Tank {
        pub fn new(name: &str) -> Tank {
            Tank { name: name.to_string(), level_kg: 0.0 }
        }
        pub fn level_kg(&self) -> f64 {
            self.level_kg
        }
    }
}
```

Outside the module you may read `t.name`, and read the level through the method `t.level_kg()`. But writing `t.level_kg = 1.0e9;` fails:

```text
error[E0616]: field `level_kg` of struct `Tank` is private
```

This is how Rust protects an **[[invariant|invariant]]**, something that must always be true about a value, such as "the level never exceeds the capacity": only the module's own methods can touch the field. Outside code cannot even build a `Tank` with braces; it has to call `Tank::new`.

Enums are different. If an enum is `pub`, all its variants and their data are public. That makes sense: code that matches on an enum has to see every variant.

There is also a middle setting, `pub(crate)`, meaning "public inside this crate but not to other crates that use it". A **[[crate|crate-word]]** is one compiled unit: one library or one program, the thing one `Cargo.toml` package builds.

::: key
Items in a module are private by default; `pub` makes them visible to the parent and beyond. `pub struct` makes the type public, and each field needs its own `pub`. The variants of a `pub enum` are all public.
:::

## Paths and use

To name an item in another module, you write a **path**: module names joined by `::`, like a folder path joined by slashes. `units::force::lbf_to_n` is "the `lbf_to_n` in `force`, in `units`".

A path can start in three places:

| Start | Read aloud | Means |
| --- | --- | --- |
| `crate::` | "crate" | the root of this crate, like `/` on a disk |
| `super::` | "super" | the parent module, like `..` |
| `self::` | "self" | this module, like `.` |
| a name | | a module visible from here, or an outside crate such as `std` |

Writing long paths everywhere is tiring, so **use** brings a name into scope once. After `use units::ft_to_m;` you can write `ft_to_m(12.5)`. Braces bring in several at once, `use units::{ft_to_m, FT_TO_M};`, and `as` gives a local nickname:

```rust
mod gnc {
    pub mod frames {
        pub fn deg_to_rad(d: f64) -> f64 {
            d * std::f64::consts::PI / 180.0
        }
    }

    pub mod guidance {
        // super:: climbs one level, to gnc.
        use super::frames::deg_to_rad;

        pub fn pitch_command_rad(pitch_deg: f64) -> f64 {
            deg_to_rad(pitch_deg)
        }
    }
}

// crate:: starts at the root of this crate.
use crate::gnc::guidance;
use crate::gnc::frames::deg_to_rad as d2r;

fn main() {
    println!("{:.4}", guidance::pitch_command_rad(45.0));
    println!("{:.4}", d2r(180.0));
}
```

```text
0.7854
3.1416
```

Inside `guidance`, `super::frames` means "go up to `gnc`, then down into `frames`". At the top, `use crate::gnc::guidance;` brings in the module itself, so the call still shows where the function lives: `guidance::pitch_command_rad(45.0)`.

`use` is not `#include`. It copies no text and loads no file; it is closer to a C++ `using` declaration.

One `use` you will see in every test module is `use super::*;`. The `*` is a **glob**: it brings in every name visible in the parent module. Tests live in a small module inside the file they test (lesson 08 shows the `#[cfg(test)]` that goes with it), so `use super::*;` lets them call the tested functions by their short names, private helpers included.

::: warning use does not load anything
A common first mistake is writing `use units::ft_to_m;` in `main.rs` and forgetting `mod units;`. The compiler cannot find `units` at all, because nothing ever told it the file exists. `mod` adds a module to the tree. `use` only makes a short name for something already in it. You need `mod units;` exactly once, in the parent, and `use` wherever it is convenient.
:::

::: example A small units module, from the outside in
Look again at the `units` program and follow each name.

1. `mod units;` in `main.rs` pulls `src/units.rs` into the tree as `crate::units`.
2. `use units::{ft_to_m, FT_TO_M};` makes two short names. `FT_TO_M` is the constant $0.3048$, the exact international definition of a foot in meters.
3. `ft_to_m(12.5)` computes $12.5 \times 0.3048 = 3.81$, printed as `3.81 m`.
4. `units::force::lbf_to_n(100.0)` uses a full path instead. Inside, it calls the private `check`, which is allowed because `check` is in the same module. Then $100 \times 4.448\,221\,615\,260\,5 = 444.822\ldots$, printed to two places as `444.82 N`.

Sanity check: a foot is about a third of a meter, so $12.5$ ft being about $3.8$ m makes sense. A pound-force is about $4.45$ N, so $100$ lbf is about $445$ N.

This is the same shape as the unit-conversion exercise at the end of the module: a module of `pub` conversion functions, a few private helpers, and tests that reach in with `use super::*;`.
:::

## Arrays: the egg carton

An **array** holds a fixed number of values of the same type, side by side in memory. Its type says both: `[f64; 5]`, read "an array of five f64s".

```rust
let pressures_kpa: [f64; 5] = [101.2, 101.4, 100.9, 101.8, 101.6];
let zeros = [0.0_f64; 3];                 // [0.0, 0.0, 0.0]
let quat: [f64; 4] = [1.0, 0.0, 0.0, 0.0];
```

`[value; count]` repeats one value, so `[0.0_f64; 3]` is three zeros. The length is part of the type, so a function asking for a `[f64; 4]` quaternion cannot be handed three numbers by mistake. An array lives where the variable lives, usually on the stack; a `[f64; 4]` is exactly $4 \times 8 = 32$ bytes, like C++'s `std::array<double, 4>`.

You read an element with `a[i]`, counting from zero, and **every index is checked**. Reading past the end does not quietly read other memory, as in C. The program stops with a **[[panic|panic]]**, a controlled crash with a message:

```text
thread 'main' (3998) panicked at src/bin/slices.rs:28:20:
index out of bounds: the len is 5 but the index is 7
```

If being out of range is a normal possibility, not a bug, use `.get(i)` instead. It returns an `Option`: `Some(value)` when the index is valid and `None` when it is not. `pressures_kpa.get(1)` gives `Some(101.4)` and `pressures_kpa.get(9)` gives `None`. Lesson 06 is all about handling `Option` well.

## Slices: a window onto the carton

A **slice** is a borrowed view of a run of elements that live somewhere else: all or part of an array or a `Vec`. Its type is `&[T]`, read "a slice of T". There is no length in the type: the same `&[f64]` can see three elements or three thousand.

Underneath, a slice is two numbers: a pointer to the first element and a count. A value made of a pointer plus extra information is called a **[[fat pointer|fat-pointer]]**. On a 64-bit machine a plain `&f64` is $8$ bytes and a `&[f64]` is $16$.

You take a slice with a **range** in square brackets:

| Expression | Read aloud | Elements |
| --- | --- | --- |
| `&a[1..3]` | "a from one up to three" | indices 1 and 2 (the end is not included) |
| `&a[2..]` | "a from two on" | index 2 to the end |
| `&a[..2]` | "a up to two" | indices 0 and 1 |
| `&a[..]` or `&a` | "all of a" | everything |

The rule to remember is that `start..end` includes the start and stops *before* the end, the same as Python's `a[1:3]` and C++ iterator pairs. So `&a[1..3]` has $3 - 1 = 2$ elements.

This is lesson 03's `String` and `&str` story again. A function that only reads a list of numbers should take `&[f64]`. Then callers can pass an array, a `Vec`, or any piece of either, and nothing is copied. It is the same reasoning as `std::span` in C++20.

If the function must change the elements, it takes `&mut [f64]`, a mutable slice:

```rust
fn zero_bias(xs: &mut [f64], bias: f64) {
    for x in xs.iter_mut() {
        *x -= bias;
    }
}

fn main() {
    let mut gyro_deg_s = [0.5, 0.75, 1.25, 0.5];
    zero_bias(&mut gyro_deg_s[1..3], 0.25);
    println!("{:?}", gyro_deg_s);
}
```

```text
[0.5, 0.5, 1.0, 0.5]
```

Only elements 1 and 2 changed ($0.75 - 0.25 = 0.5$ and $1.25 - 0.25 = 1.0$). The function could not have touched element 0 or 3 even if it tried, because its slice does not reach them. The `*x`, read "star x", means "the value that `x` points at", as in C++.

::: example One function, three kinds of input
```rust
fn mean(xs: &[f64]) -> f64 {
    let mut sum = 0.0;
    for x in xs {
        sum += x;
    }
    sum / xs.len() as f64
}
```

Call it three ways, on `pressures_kpa = [101.2, 101.4, 100.9, 101.8, 101.6]` and on a `Vec` holding `[21.5, 22.0, 22.9]`:

- `mean(&pressures_kpa)`: the whole array. $101.2 + 101.4 + 100.9 + 101.8 + 101.6 = 506.9$, and $506.9 / 5 = 101.38$.
- `mean(&temps_c)`: the whole `Vec`. $21.5 + 22.0 + 22.9 = 66.4$, and $66.4 / 3 \approx 22.13$.
- `mean(&pressures_kpa[2..])`: the last three pressures. $100.9 + 101.8 + 101.6 = 304.3$, and $304.3 / 3 \approx 101.43$.

```text
mean of array: 101.38
mean of Vec:   22.13
mean of last 3 pressures: 101.43
```

`xs.len() as f64` turns the count, a `usize`, into an `f64` so the division is allowed; Rust never mixes number types by itself. Sanity check: every mean sits between the smallest and largest value it averaged, as a mean must. What happens with an empty slice? `xs.len()` is $0$, and $0.0 / 0.0$ is `NaN`, not a crash. Flight code would check for that first.
:::

## Vec: the backpack that grows

A **Vec**, short for vector and written `Vec<T>` ("vec of T"), is a list that can grow and shrink. The elements live on the heap. The `Vec` itself is three numbers on the stack: a pointer to the elements, the **length** (how many are in use) and the **capacity** (how many fit before it must find a bigger space). It is Rust's `std::vector`.

```rust
let mut v: Vec<u32> = Vec::new();   // empty, no heap memory yet
v.push(7);                          // add at the end
let x = vec![1.0, 2.0, 3.0];        // the vec! macro builds one from a list
let last = v.pop();                 // removes the last: Some(7), or None if empty
```

When a `push` finds the length equal to the capacity, the `Vec` gets a bigger block, copies everything over and frees the old one. Here is Rust 1.94 pushing nine numbers:

```text
len 0 cap 0
len 1 cap 4
len 2 cap 4
len 3 cap 4
len 4 cap 4
len 5 cap 8
len 6 cap 8
len 7 cap 8
len 8 cap 8
len 9 cap 16
```

The capacity doubled each time it ran out ($4$, $8$, $16$), so only three **[[reallocations|vec-growth]]** happened for nine pushes. The exact numbers are the standard library's choice and may change, but the doubling idea is why pushing is fast on average.

`pop` returns an `Option`, because an empty `Vec` has nothing to give. Indexing `v[i]` is bounds-checked exactly like an array, and `v.get(i)` returns an `Option`.

::: warning Allocation in the control loop
Every time a `Vec` grows, it asks the allocator for memory, which takes an unpredictable time and can fail. A control loop running hundreds of times a second usually does not allocate at all. The habit is to allocate at startup with `Vec::with_capacity(n)`, which reserves room for `n` elements at once, and never push past `n`. With `with_capacity(100)` and one push, the length is $1$ and the capacity is $100$.
:::

## HashMap: the phone book

A **HashMap** stores pairs: a **key** you look up by, and a **value** that goes with it. `HashMap<&str, u32>` maps names to counts. It is the same idea as a Python `dict` or a C++ `std::unordered_map`. It lives in the standard library but is not loaded automatically, so you bring it in with `use std::collections::HashMap;`.

Here is a count of telemetry packets by sensor:

```rust
use std::collections::{BTreeMap, HashMap};

fn main() {
    let packets = ["IMU", "GPS", "IMU", "BARO", "IMU", "GPS", "MAG", "IMU"];

    let mut counts: HashMap<&str, u32> = HashMap::new();
    for p in packets {
        *counts.entry(p).or_insert(0) += 1;
    }
    println!("IMU count: {:?}", counts.get("IMU"));
    println!("STAR count: {:?}", counts.get("STAR"));
    print!("HashMap order: ");
    for (k, v) in &counts {
        print!("{k}={v} ");
    }
    println!();

    let mut sorted: BTreeMap<&str, u32> = BTreeMap::new();
    for p in packets {
        *sorted.entry(p).or_insert(0) += 1;
    }
    print!("BTreeMap order: ");
    for (k, v) in &sorted {
        print!("{k}={v} ");
    }
    println!();
}
```

The line `*counts.entry(p).or_insert(0) += 1;` is the standard counting pattern. Read it from the inside out:

1. `counts.entry(p)` finds the slot for key `p`, whether or not it is filled yet.
2. `.or_insert(0)` puts `0` there if the slot was empty, and either way hands back a mutable reference to the value.
3. `*... += 1` adds one to the value that reference points at.

`counts.get("IMU")` returns `Some(&4)`, printed as `Some(4)`, and `counts.get("STAR")` returns `None`, because no star-tracker packet arrived. Lookups give an `Option`, not a default zero and not an exception.

Now the output from four runs of the same program:

```text
HashMap order: MAG=1 IMU=4 BARO=1 GPS=2
HashMap order: IMU=4 GPS=2 BARO=1 MAG=1
HashMap order: IMU=4 GPS=2 BARO=1 MAG=1
HashMap order: IMU=4 MAG=1 GPS=2 BARO=1
```

The counts are always right, but the **order changes from run to run**. A `HashMap` stores keys wherever their **[[hash|hashing]]** sends them, and Rust's default hashing is seeded with a random number each time the program starts, as a defense against inputs crafted to make lookups slow. So you must never depend on the order you iterate a `HashMap` in.

::: warning Square brackets on a map panic when the key is missing
`counts["IMU"]` works and gives `4`. But `counts["STAR"]` panics, because there is no such key. Use `.get(key)` and handle the `None` whenever a key might be absent. The same goes for `Vec` and arrays: `[]` is for when a missing element would be a bug; `.get` is for when it is a normal possibility.
:::

## BTreeMap: the sorted index

A **BTreeMap** holds the same key-value pairs, with the same `insert`, `get` and `entry` methods, but it keeps the keys **in sorted order**. It is the Rust version of C++'s `std::map`. The name comes from the **B-tree**, the kind of sorted tree it uses inside.

In the program above, the `BTreeMap` printed the same line on all four runs:

```text
BTreeMap order: BARO=1 GPS=2 IMU=4 MAG=1
```

Alphabetical, every time.

Which should you choose?

| | `HashMap` | `BTreeMap` |
| --- | --- | --- |
| Lookup time | about the same for any size, on average | grows slowly with size (logarithmic) |
| Iteration order | unpredictable, changes between runs | sorted by key, always the same |
| Range queries ("keys from 150 to 350") | no | yes, with `.range(...)` |
| Keys must be | hashable and comparable for equality | orderable |

The second row matters more than it looks. A telemetry summary written by looping over a `HashMap` comes out in a different order on each run, so a test comparing output text fails at random. When output order matters, or you want **[[deterministic|determinism]]** behavior, reach for `BTreeMap`.

::: example A time-stamped log with a range query
A `BTreeMap<u32, f64>` maps a time in milliseconds to a chamber pressure in bar. The entries are inserted out of order:

```rust
use std::collections::BTreeMap;

fn main() {
    // Chamber pressure log: time in ms -> pressure in bar
    let mut log: BTreeMap<u32, f64> = BTreeMap::new();
    log.insert(300, 97.8);
    log.insert(100, 12.4);
    log.insert(400, 98.1);
    log.insert(200, 85.0);
    for (t, p) in log.range(150..=350) {
        println!("t={t} ms  p={p} bar");
    }
    println!("first: {:?}", log.first_key_value());
}
```

```text
t=200 ms  p=85 bar
t=300 ms  p=97.8 bar
first: Some((100, 12.4))
```

Step by step. The keys are $100, 200, 300, 400$ once sorted, whatever order they went in. `150..=350` means $150$ to $350$ with both ends included. Of the four keys, $100$ is too small and $400$ too large, so exactly $200$ and $300$ come out, in order. `first_key_value()` returns the smallest key and its value, wrapped in an `Option` because an empty map has no first entry.

Sanity check: the pressure rises from $12.4$ bar at $100$ ms to about $98$ bar by $400$ ms, the shape of an engine start, and the range picked out the middle of that climb. A `HashMap` could not have answered "everything between 150 and 350" without checking every key.
:::

::: key
Arrays `[T; N]` have a fixed length in their type; slices `&[T]` borrow a run of elements and carry their length; `Vec<T>` grows on the heap. `HashMap` is fast but its iteration order is random; `BTreeMap` keeps keys sorted and supports range queries. Indexing with `[]` panics when out of range; `.get` returns an `Option`.
:::

## Check yourself

::: check
A project has `src/main.rs` and `src/nav.rs`. `main.rs` contains `use nav::propagate;` but the build says it cannot find `nav`. What is missing, and why doesn't `use` fix it?
:::

::: answer
`main.rs` needs the line `mod nav;`. Only `mod` adds a file to the module tree; the compiler never goes looking for `.rs` files on its own. `use` only creates a short name for something already in the tree, so with no `mod nav;` there is nothing for it to point at. Also, `propagate` must be marked `pub` in `nav.rs`, or the next error will be that it is private.
:::

::: check
Inside `mod gnc { mod control { ... } mod nav { ... } }`, a function in `control` wants to call `nav::estimate`. Write the path two ways.
:::

::: answer
Relative to `control`: `super::nav::estimate`, since `super` climbs to `gnc` and then goes down into `nav`. Absolute: `crate::gnc::nav::estimate`, starting from the root. Either way, `nav` must be visible to `control` (sibling modules can see each other, since both are inside `gnc`) and `estimate` must be `pub` so code outside `nav` may call it.
:::

::: check
With `let a = [3, 1, 4, 1, 5, 9];`, what does `&a[2..5]` contain, how many elements is that, and what does `a.get(6)` return?
:::

::: answer
`2..5` starts at index 2 and stops before index 5, so it takes indices 2, 3 and 4: `[4, 1, 5]`, which is $5 - 2 = 3$ elements. `a.get(6)` returns `None`, because the array has six elements, indices 0 to 5. Writing `a[6]` instead would panic with "index out of bounds: the len is 6 but the index is 6".
:::

::: check
A function signature is `fn max_abs(xs: &Vec<f64>) -> f64`. Why would a reviewer ask you to change the parameter type, and to what?
:::

::: answer
Change it to `xs: &[f64]`. As written, it only accepts a `Vec`, so a caller holding an array, or wanting the maximum of part of a buffer, has to build a new `Vec` first. A `&Vec<f64>` turns into a `&[f64]` automatically when passed, so every existing caller keeps working, and arrays and sub-slices now work too, with nothing copied. It is the same reason read-only string parameters take `&str` instead of `&String`.
:::

::: check
A ground tool writes a report of error counts per subsystem by looping over a `HashMap<String, u32>`. Two runs on the same log produce files that `diff` says are different. What is going on, and what is the smallest fix?
:::

::: answer
The counts are the same; the order is not. Rust's `HashMap` seeds its hashing randomly each run, so iteration order varies between runs. Change the type to `BTreeMap<String, u32>` (and the `use` line). The same methods work, and iteration is sorted by key, so every run writes the same file.
:::

## Summary

| Idea | Rust | In one line |
| --- | --- | --- |
| Module | `mod units;` or `mod force { ... }` | a named drawer for items; files join only through `mod` |
| Privacy | `pub`, `pub(crate)` | private by default; each struct field needs its own `pub` |
| Paths | `crate::`, `super::`, `self::` | root, parent, this module |
| use | `use a::b::{c, d};`, `as`, `super::*` | a short name for something already in the tree |
| Array | `[f64; 5]`, `[0.0; 3]` | fixed length in the type; on the stack; checked indexing |
| Slice | `&[T]`, `&mut [T]`, `&a[1..3]` | pointer plus length; end of a range not included |
| Vec | `Vec::new()`, `vec![...]`, `push`, `pop`, `with_capacity` | growable, heap; preallocate for flight loops |
| HashMap | `entry(k).or_insert(0)`, `get(k)` | fast lookups; iteration order random |
| BTreeMap | `range(a..=b)`, `first_key_value()` | sorted keys, deterministic order |
| `[]` vs `.get` | `v[i]`, `v.get(i)` | panic on missing, or return an `Option` |

Almost every lookup in this lesson handed back an `Option`. Lesson 06 explains that type properly, together with `Result` and the `?` operator, which is how Rust handles "nothing there" and "something went wrong" without null pointers or exceptions.

::: context module-tree One tree, grown from the root
The compiler starts at `src/main.rs` (for a program) or `src/lib.rs` (for a library), called the **crate root**. Each `mod` line adds a branch, either written inline in braces or read from a file named after it. A file that no `mod` line mentions is ignored, even if it sits in `src/`. Paths follow the branches: `crate::units::force::lbf_to_n`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="10" width="100" height="28" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="29" font-size="12" fill="#1f2a44" text-anchor="middle">crate (main.rs)</text>
  <line x1="180" y1="38" x2="180" y2="62" stroke="#1f2a44"/>
  <rect x="130" y="62" width="100" height="28" rx="4" fill="#ffffff" stroke="#1f2a44"/>
  <text x="180" y="81" font-size="12" fill="#1f2a44" text-anchor="middle">units (units.rs)</text>
  <line x1="160" y1="90" x2="80" y2="118" stroke="#1f2a44"/>
  <line x1="200" y1="90" x2="270" y2="118" stroke="#1f2a44"/>
  <rect x="20" y="118" width="120" height="28" rx="4" fill="#ffffff" stroke="#1f2a44"/>
  <text x="80" y="137" font-size="12" fill="#1f2a44" text-anchor="middle">pub fn ft_to_m</text>
  <rect x="210" y="118" width="120" height="28" rx="4" fill="#ffffff" stroke="#1f2a44"/>
  <text x="270" y="137" font-size="12" fill="#1f2a44" text-anchor="middle">pub mod force</text>
  <text x="270" y="162" font-size="11" fill="#b4232c" text-anchor="middle">fn check: private</text>
</svg>
```
:::

::: context invariant A promise the data always keeps
An **invariant** is a fact about a value that is true every time anyone can look at it. "Tank level is between zero and capacity." "This quaternion has length one." "These timestamps only increase." If any code anywhere can write the fields, then any code anywhere can break the promise, and proving it holds means reading the whole program. If only the module's methods can write them, you check those few methods and you are done. C++ does the same with `private`, which you met in the C++ modules; Rust makes private the default.
:::

::: context crate-word Why a crate
A crate is a wooden shipping box, and Rust's package site is named crates.io, so the word fits: a crate is the unit you build, publish and pull in as a dependency. One Cargo package can hold one library crate and several program crates (each file in `src/bin/` is its own program crate). `pub(crate)` draws the privacy line at the edge of that box.
:::

::: context panic A controlled stop
A **panic** stops the current thread on purpose, prints where and why, and by default unwinds the stack so that each value's cleanup code runs. It is Rust's way of saying "this is a bug; continuing would be worse". It is not undefined behavior: an out-of-range read in C might return garbage and carry on, which is far harder to find. Flight code still treats a panic as a failure to be designed out, usually by using `.get` and handling the `None`, which lesson 06 shows.
:::

::: context fat-pointer Two numbers pretending to be one
A slice reference carries its own length, so the function receiving it always knows where the data ends. That is what makes bounds checking possible. In C, a function receiving `const double *xs` gets only the address and must trust a separate `n` passed beside it, and a wrong `n` is a classic source of buffer overruns.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">&amp;a[1..3]</text>
  <rect x="10" y="28" width="70" height="28" fill="#f2b880" stroke="#1f2a44"/>
  <text x="45" y="47" font-size="12" fill="#1f2a44" text-anchor="middle">ptr</text>
  <rect x="80" y="28" width="70" height="28" fill="#f2b880" stroke="#1f2a44"/>
  <text x="115" y="47" font-size="12" fill="#1f2a44" text-anchor="middle">len = 2</text>
  <text x="10" y="112" font-size="12" fill="#1f2a44">a</text>
  <g stroke="#1f2a44">
    <rect x="40" y="96" width="60" height="28" fill="#ffffff"/>
    <rect x="100" y="96" width="60" height="28" fill="#8fb8f0"/>
    <rect x="160" y="96" width="60" height="28" fill="#8fb8f0"/>
    <rect x="220" y="96" width="60" height="28" fill="#ffffff"/>
    <rect x="280" y="96" width="60" height="28" fill="#ffffff"/>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="70" y="140">0</text><text x="130" y="140">1</text><text x="190" y="140">2</text><text x="250" y="140">3</text><text x="310" y="140">4</text>
  </g>
  <line x1="45" y1="56" x2="126" y2="92" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="130,96 120,90 128,86" fill="#1d6fd1"/>
</svg>
```
:::

::: context vec-growth Why doubling keeps pushes cheap
Copying everything into a bigger block sounds slow, and one such copy is. But if the capacity doubles each time, the copies get rarer as the list gets longer. Filling a `Vec` to $n$ elements copies at most about $n$ elements in total across all its growths ($4 + 8 + 16 + \dots$ adds up to less than $2n$), so each push costs a small fixed amount on average. Engineers call this **amortized** constant time. The catch for real-time code is the word "average": the one push that triggers a copy is much slower than the rest.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="30" font-size="12" fill="#1f2a44">cap 4</text>
  <text x="10" y="70" font-size="12" fill="#1f2a44">cap 8</text>
  <text x="10" y="110" font-size="12" fill="#1f2a44">cap 16</text>
  <g stroke="#1f2a44">
    <rect x="60" y="16" width="72" height="20" fill="#8fb8f0"/>
    <rect x="60" y="56" width="90" height="20" fill="#8fb8f0"/>
    <rect x="150" y="56" width="54" height="20" fill="#ffffff"/>
    <rect x="60" y="96" width="162" height="20" fill="#8fb8f0"/>
    <rect x="222" y="96" width="126" height="20" fill="#ffffff"/>
  </g>
  <text x="140" y="31" font-size="11" fill="#6c7a93">4 used, full</text>
  <text x="212" y="71" font-size="11" fill="#6c7a93">5 used after 1st copy</text>
  <text x="230" y="90" font-size="11" fill="#b4232c">9 used after 2nd copy</text>
</svg>
```
:::

::: context hashing How a phone book with no order finds things fast
A **hash function** turns a key, such as the string `"IMU"`, into a big number. The map uses that number to pick a bucket, so finding a key means computing its hash and looking in one bucket, not searching the whole map. Keys land in buckets by hash value, not by name, which is why there is no alphabetical order. Rust's default hasher, SipHash, uses a random key chosen when the map is created, so an attacker cannot predict which inputs collide into the same bucket.
:::

::: context determinism Same input, same output
A program is **deterministic** when the same inputs always produce exactly the same outputs. Flight software teams care about this a great deal: a simulation run that cannot be repeated cannot be debugged, and a test whose output shuffles itself cannot be trusted. Hidden sources of randomness, such as hash-map iteration order, thread timing and uninitialized memory, are the usual culprits. Choosing `BTreeMap` for anything that is printed, logged or compared removes one of them for free.
:::
