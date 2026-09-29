---
id: l02-variables-types-and-overflow
title: Variables, types, and what happens when a number overflows
minutes: 22
covers:
  - Variables, mut, shadowing; scalar and compound types
  - 'Integer overflow: panics in debug, wraps in release; checked, wrapping and saturating operations'
---

Picture the mileage counter in an old car: a row of little wheels with the digits 0 to 9 on them. Each wheel rolls over to 0 and nudges the next one along. Now picture a car whose counter has only three wheels. It reads 998, then 999, then — one more kilometer — 000. The car did not teleport home. The counter ran out of room, and the number it shows is now wrong.

Computers store whole numbers the same way: in a fixed number of binary wheels, called **bits**. When a sum needs more bits than the box has, it **overflows**. On a rocket this is not a curiosity. Packet counters, clocks, sensor readings and array positions are all whole numbers in fixed-size boxes, and a counter that silently rolls over can make software believe time went backwards.

This lesson covers the boxes first — how Rust makes a variable, when it lets you change one, and which types of number it offers. Then it covers the one place where Rust's debug and release builds behave differently on purpose: what happens when a box overflows, and the four operations that let you choose.

## Variables are fixed unless you say otherwise

A **variable** is a name attached to a value, like a label stuck on a jar. In Rust you make one with `let`:

```rust
let fuel_kg = 1_200.0;
```

Read it as "let fuel k g be twelve hundred". Rust calls this a **[[binding|what-binding-means]]**: the name `fuel_kg` is bound to the value `1200.0`.

Here is the first surprise if you come from Python or C++. That jar is sealed. Try to change it:

```rust
fn main() {
    let fuel_kg = 1_200.0;
    fuel_kg = fuel_kg - 35.0;
    println!("{fuel_kg}");
}
```

```text
error[E0384]: cannot assign twice to immutable variable `fuel_kg`
 --> src/main.rs:3:5
  |
2 |     let fuel_kg = 1_200.0;
  |         ------- first assignment to `fuel_kg`
3 |     fuel_kg = fuel_kg - 35.0;
  |     ^^^^^^^^^^^^^^^^^^^^^^^^ cannot assign twice to immutable variable
  |
help: consider making this binding mutable
  |
2 |     let mut fuel_kg = 1_200.0;
  |         +++
```

In Rust a variable is **immutable** — it cannot change — unless you ask. It is the opposite of C++, where everything can change unless you write `const`. Most values in a program never need to change after they are made, and the compiler can then promise you that nobody changed them behind your back. The compiler even shows the fix, with `+++` under the letters to add.

## mut: a jar you can refill

Write `let mut` (read "let mute", short for mutable) to make a variable you are allowed to change:

```rust
let mut fuel_kg = 1_200.0;
fuel_kg -= 35.0;
fuel_kg -= 35.0;
println!("fuel left: {fuel_kg} kg");   // prints: fuel left: 1130 kg
```

`fuel_kg -= 35.0` is short for `fuel_kg = fuel_kg - 35.0`. After two burns, $1200 - 35 - 35 = 1130$. The `{fuel_kg}` inside the quotes prints the variable's value there.

A `mut` variable keeps its type forever. `fuel_kg` started as a decimal number, so you can put another decimal number in it, but never a word.

## Shadowing: a new jar with the same label

Sometimes a value arrives in one form and you want it in another, without inventing new names like `altitude_text`, `altitude_number` and `altitude_km`. Rust lets you declare a new variable with the same name. The new one **shadows** the old one: from that line on, the name means the new jar, and the old jar can no longer be reached by that name.

```rust
fn main() {
    let altitude = "10500";                 // text, as it came off the radio
    let altitude: f64 = altitude.parse().unwrap();
    let altitude = altitude / 1000.0;       // now in kilometres
    println!("altitude: {altitude} km");
}
```

```text
altitude: 10.5 km
```

Follow it line by line. The first `altitude` is text. The second `let` makes a new variable, of type `f64` (a decimal number), by reading the text as a number: `.parse()` tries the conversion, and `.unwrap()` means "give me the number, and stop the program if the text was not a number". (Lesson 6 shows how to handle that failure properly.) The third `let` makes yet another variable: $10\,500 / 1000 = 10.5$.

::: key Variables
`let` makes an immutable binding. `let mut` makes one you can reassign, but its type stays fixed. A new `let` with the same name **shadows** the old variable: it is a new variable, so it may have a different type.
:::

::: warning Shadowing is not assigning
Inside a pair of curly braces `{ }`, a shadowing `let` lasts only until the closing brace. After it, the outer variable is back, unchanged. If you meant to change the outer value, you needed `let mut` outside and a plain assignment (no `let`) inside. When a value seems to "undo itself", look for a stray `let`.
:::

## Scalar types: one value each

A **type** says what kind of value a variable holds and how many bytes it takes. A **scalar** type holds one single value. Rust has four kinds.

### Integers

Whole numbers. The name says the sign and the size: `i` for signed (can be negative), `u` for unsigned (zero or more), then the number of bits.

| Type | Bits | Smallest | Largest |
| --- | --- | --- | --- |
| `u8` | 8 | 0 | 255 |
| `i8` | 8 | −128 | 127 |
| `u16` | 16 | 0 | 65 535 |
| `i16` | 16 | −32 768 | 32 767 |
| `u32` | 32 | 0 | 4 294 967 295 |
| `i32` | 32 | −2 147 483 648 | 2 147 483 647 |
| `u64`, `i64` | 64 | 0 or about −9.22 × 10¹⁸ | about 1.84 × 10¹⁹ or 9.22 × 10¹⁸ |

There are also `u128` and `i128`, and two whose size follows the machine: `usize` and `isize`. A **[[usize|what-usize-is]]** is 8 bytes on a 64-bit computer, and it is the type Rust uses for counting and indexing things in memory.

The pattern behind the table: an unsigned type with $n$ bits holds $0$ to $2^n - 1$. A signed one gives half its patterns to negatives, and holds $-2^{n-1}$ to $2^{n-1} - 1$. For $n = 8$: $2^8 - 1 = 255$, and $-2^7 = -128$ to $2^7 - 1 = 127$.

Unlike C++, where an `int` or `long` may be different sizes on different machines, every Rust integer except `usize` and `isize` has exactly the width in its name, everywhere.

### Floating-point numbers

Numbers with a decimal point: `f32` (4 bytes, about 7 significant digits) and `f64` (8 bytes, about 15 to 16 digits). They follow the same IEEE 754 standard as C++'s `float` and `double`. GNC code nearly always uses `f64`.

### Booleans and characters

`bool` is `true` or `false`, one byte. `char` is one **[[Unicode character|char-is-unicode]]**, written in single quotes like `'A'` or `'Ω'`, and it takes 4 bytes, not 1 as in C++.

### What the machine reports

```rust
use std::mem::size_of;

fn main() {
    println!("u8   {} byte(s), max {}", size_of::<u8>(), u8::MAX);
    println!("i16  {} byte(s), {} to {}", size_of::<i16>(), i16::MIN, i16::MAX);
    println!("usize {} byte(s) on this machine", size_of::<usize>());
    println!("f32  {} byte(s), f64 {} byte(s)", size_of::<f32>(), size_of::<f64>());
    println!("bool {} byte(s), char {} byte(s)", size_of::<bool>(), size_of::<char>());

    let gps_week = 2_390;          // no type written: i32
    let mass_kg = 549_054.0;       // no type written: f64
    let quality: u8 = 200;
    let letter = 'Ω';
    println!("{gps_week} {mass_kg} {quality} {letter}");
    println!("7 / 2 = {}, 7 % 2 = {}, 7.0 / 2.0 = {}", 7 / 2, 7 % 2, 7.0 / 2.0);
    println!("-7 / 2 = {}", -7 / 2);
}
```

```text
u8   1 byte(s), max 255
i16  2 byte(s), -32768 to 32767
usize 8 byte(s) on this machine
f32  4 byte(s), f64 8 byte(s)
bool 1 byte(s), char 4 byte(s)
2390 549054 200 Ω
7 / 2 = 3, 7 % 2 = 1, 7.0 / 2.0 = 3.5
-7 / 2 = -3
```

Three things to notice. When you write no type, Rust **infers** one from how the value is used, and falls back to `i32` for whole numbers and `f64` for decimals. `size_of::<u8>()` is read "size of, for type u8": the `::<…>` (nicknamed the **turbofish**) hands the function a type. And dividing two integers throws the remainder away, rounding toward zero: $7 / 2 = 3$ and $-7 / 2 = -3$; the `%` operator (read "remainder") gives the part thrown away.

### No silent mixing

C++ quietly converts an `int` to a `double` when you mix them. Rust refuses:

```rust
fn main() {
    let burn_s: u32 = 162;
    let rate_kg_s: f64 = 2_540.0;
    let used = burn_s * rate_kg_s;
    println!("{used}");
}
```

```text
error[E0277]: cannot multiply `u32` by `f64`
 --> src/main.rs:4:23
  |
4 |     let used = burn_s * rate_kg_s;
  |                       ^ no implementation for `u32 * f64`
```

You convert on purpose with `as`: `burn_s as f64 * rate_kg_s` gives $162 \times 2540 = 411\,480\,\mathrm{kg}$. Be careful with `as` going the other way. It never fails; it squeezes. `300_i32 as u8` gives `44` (it keeps the low 8 bits: $300 - 256 = 44$), and `70000.0_f64 as i16` gives `32767`, the largest `i16`. When a conversion might not fit, use `u8::try_from(x)`, which returns an error instead of a wrong number.

## Compound types: several values in one

A **compound** type groups values. Rust has two built-in ones.

A **tuple** holds a fixed number of values that may have different types, written in round brackets. You read its parts with `.0`, `.1`, `.2`, or unpack them all at once:

```rust
let fix: (f64, f64, u8) = (28.5623, -80.5774, 9);   // latitude, longitude, satellites
let (lat, lon, sats) = fix;
println!("lat {lat}, lon {lon}, sats {sats}, fix.2 = {}", fix.2);
// prints: lat 28.5623, lon -80.5774, sats 9, fix.2 = 9
```

An **array** holds a fixed number of values that all have the same type. Its type is written `[T; N]`, read "array of N T's":

```rust
let accel: [f64; 3] = [0.02, -0.01, 9.79];
println!("z accel = {}, length = {}", accel[2], accel.len());
// prints: z accel = 9.79, length = 3
```

Positions count from 0, so `accel[2]` is the third value. Reading `accel[3]` stops the program instead of reading whatever memory sits next door, as C++ might. Lesson 5 adds `Vec`, the array that can grow.

::: example Sizes of a tuple and an array
How many bytes do `(f64, f64, u8)` and `[f64; 3]` take? The real run says 24 for both. Work it out.

The array is three `f64`s: $3 \times 8 = 24$ bytes.

The tuple holds $8 + 8 + 1 = 17$ bytes of data, but the whole thing must start at an address that is a multiple of 8, so that each `f64` inside it is lined up where the processor likes it. Rust rounds the size up to the next multiple of 8, adding 7 bytes of **padding**: $17 + 7 = 24$. It is the same alignment rule you met for C++ structs. (Rust is also free to reorder a tuple's fields to waste less space; here no order can do better than 24.)
:::

## Integer overflow

Now back to the three-wheel mileage counter. A `u8` is an 8-wheel counter in binary. Its biggest value is 255. What is $250 + 10$ in a `u8`?

The true answer, 260, does not fit. There are only three honest things a program can do:

1. **Stop**, and report the bug.
2. **Wrap around**, like the [[odometer|wrap-circle]]: count up to 255, roll to 0, keep going. $260 - 256 = 4$.
3. **Stick at the edge**: give 255, the closest value that fits.

What C++ does depends on the type: unsigned types wrap, and signed overflow is **[[undefined behavior|cpp-signed-overflow]]** — the compiler may assume it never happens. Rust never makes it undefined. The default depends on the build profile from the last lesson.

```rust
fn add_counts(a: u8, b: u8) -> u8 {
    a + b
}

fn main() {
    let frames: u8 = 250;
    let more = add_counts(frames, 10);
    println!("250 + 10 as u8 = {more}");
}
```

Built with `cargo run` (the dev profile):

```text
thread 'main' (3402) panicked at src/main.rs:2:5:
attempt to add with overflow
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

The program **[[panicked|what-a-panic-is]]**: it stopped on purpose, named the file and line, and exited with code 101. Built with `cargo run --release`:

```text
250 + 10 as u8 = 4
```

No error. The number wrapped, and the program carried on with 4.

The difference is the `overflow-checks` setting from the profile table in the last lesson: on in dev, off in release. Checking every addition costs a little speed, so release builds leave it out by default. You can turn it back on with `overflow-checks = true` under `[profile.release]` in `Cargo.toml`; this machine then panics in release too.

One more twist. If the compiler can see the numbers while compiling — say `let x: u8 = 250;` followed directly by `x + 10` in the same function — it does not wait for run time. A built-in check called `arithmetic_overflow` refuses to compile the line, in both profiles: `error: this arithmetic operation will overflow`. The debug-panics, release-wraps rule is about values that arrive while the program runs, like sensor readings, packets and function arguments. That is why the example above passes the numbers through a function.

::: key Integer overflow in Rust: debug versus release
Debug builds panic on overflow; release builds wrap by default. Flight code should not rely on either: use `checked_`, `wrapping_` or `saturating_` operations so the intent is explicit and identical in both profiles.
:::

::: example Wrapping by hand
Wrapping means "add or subtract $2^n$ until the result fits". For `u8`, $2^8 = 256$.

- $250 + 10 = 260$. Too big by more than 255, so subtract 256: $260 - 256 = 4$.
- $3 - 5 = -2$. Below zero, so add 256: $-2 + 256 = 254$.
- For `i8` the range is $-128$ to $127$. $127 + 1 = 128$ is too big; subtract 256: $128 - 256 = -128$. The largest `i8` plus one is the smallest.

Each wrapped answer is a real number of the right type, and each is badly wrong. A propellant count of 3 minus a burn of 5 reading as 254 is a tank that refilled itself. That is why wrapping is dangerous when nobody chose it.
:::

## Choosing on purpose: checked, wrapping, saturating

Every Rust integer type has methods that do the arithmetic one fixed way, whatever the profile. They are named by what they do on overflow.

```rust
fn main() {
    let x: u8 = 250;
    println!("checked_add(10)     = {:?}", x.checked_add(10));
    println!("checked_add(5)      = {:?}", x.checked_add(5));
    println!("wrapping_add(10)    = {}", x.wrapping_add(10));
    println!("saturating_add(10)  = {}", x.saturating_add(10));
    println!("overflowing_add(10) = {:?}", x.overflowing_add(10));

    let t: i8 = 127;
    println!("127_i8 wrapping_add(1)   = {}", t.wrapping_add(1));
    println!("127_i8 saturating_add(1) = {}", t.saturating_add(1));
}
```

```text
checked_add(10)     = None
checked_add(5)      = Some(255)
wrapping_add(10)    = 4
saturating_add(10)  = 255
overflowing_add(10) = (4, true)
127_i8 wrapping_add(1)   = -128
127_i8 saturating_add(1) = 127
```

The output was identical, byte for byte, in the dev and release builds. That is the whole point.

- **`checked_add`** gives back an **[[Option|option-preview]]**: `Some(answer)` if it fit, `None` if it overflowed. The caller must look at which one it got before using the number. Use it when overflow means a bug or a fault.
- **`wrapping_add`** always wraps. Use it when rolling over is the documented behavior, like a packet counter.
- **`saturating_add`** sticks at the largest (or smallest) value. Use it when a quantity has a hard floor or ceiling.
- **`overflowing_add`** gives the wrapped answer and a `true`/`false` flag saying whether it wrapped.

The same families exist for subtraction, multiplication and more: `checked_sub`, `wrapping_mul`, `saturating_sub`, and so on. (The `{:?}` in `println!` is read "debug format"; it prints values like `Some(255)` that plain `{}` cannot.)

::: example Three counters on a flight computer
Each quantity gets the operation that matches what overflow means for it.

```rust
fn main() {
    // 1. Telemetry packet counter: rolling over is the documented behaviour.
    let mut seq: u16 = 65_534;
    for _ in 0..3 {
        println!("send packet seq = {seq}");
        seq = seq.wrapping_add(1);
    }

    // 2. Propellant left, in grams: it can reach zero but never go below.
    let left_g: u32 = 1_500;
    let burned_g: u32 = 2_000;
    println!("left after burn = {} g", left_g.saturating_sub(burned_g));
    println!("(plain wrapping would say {} g)", left_g.wrapping_sub(burned_g));

    // 3. Mission clock in milliseconds: overflow here is a bug, so check it.
    let t_ms: u32 = 4_294_000_000;
    match t_ms.checked_add(2_000_000) {
        Some(t) => println!("clock = {t} ms"),
        None => println!("clock overflow: raise a fault"),
    }
}
```

```text
send packet seq = 65534
send packet seq = 65535
send packet seq = 0
left after burn = 0 g
(plain wrapping would say 4294966796 g)
clock overflow: raise a fault
```

Check each line. The counter goes $65\,534$, $65\,535$, then $65\,536 - 65\,536 = 0$, which the ground software expects. The propellant: $1500 - 2000 = -500$, saturated to 0; wrapped it would be $-500 + 2^{32} = 4\,294\,966\,796$ grams, about 4 300 metric tons of phantom fuel. The clock: $4\,294\,000\,000 + 2\,000\,000 = 4\,296\,000\,000$, which is more than the `u32` limit of $4\,294\,967\,295$, so `checked_add` said `None` and the code took the fault branch. (The `match` there picks a branch by which case the `Option` holds; lesson 4 teaches it.)

How long does a `u32` millisecond clock last? $2^{32}\,\mathrm{ms} = 4\,294\,967\,296\,\mathrm{ms}$. Divide by $1000$ for seconds, then by $86\,400$ seconds per day: about $49.7$ days. A spacecraft that stays powered for two months would hit it — the kind of bug that has [[grounded real aircraft|real-counter-bugs]].
:::

::: warning Do not "fix" overflow by turning checks off
If a debug build panics on overflow, the panic found a real question: what should happen at the edge? Answer it with the right operation, or a wider type (a `u64` millisecond clock lasts about 585 million years). Switching to a release build to make the panic go away only hides the wrong number.
:::

## Check yourself

::: check
Why does this compile, and what does it print?

```rust
let n = "42";
let n: i32 = n.parse().unwrap();
let n = n * 2;
println!("{n}");
```
:::

::: answer
It compiles because each `let` makes a new variable that shadows the one before, so the type may change: text first, then an `i32`, then another `i32`. No variable is ever reassigned, so no `mut` is needed. It prints `84`, since $42 \times 2 = 84$.
:::

::: check
What range of values does an `i16` hold, and what is `i16::MAX.wrapping_add(2)`?
:::

::: answer
An `i16` has $n = 16$ bits, so it holds $-2^{15} = -32\,768$ up to $2^{15} - 1 = 32\,767$. Adding 2 to $32\,767$ gives $32\,769$, which is too big. Wrapping subtracts $2^{16} = 65\,536$: $32\,769 - 65\,536 = -32\,767$.
:::

::: check
A `u8` sensor count arrives in a packet with the value 200, and the code adds 100 to it with plain `+`. What happens in a debug build, and in a default release build?
:::

::: answer
The true sum, 300, does not fit in a `u8`. In the debug build the program panics with "attempt to add with overflow" and stops. In the default release build it wraps: $300 - 256 = 44$, and the program carries on with 44. The compiler cannot reject it at compile time, because the 200 only arrives while the program runs.
:::

::: check
For each quantity, pick `checked_`, `wrapping_` or `saturating_`, and say why: (a) a 16-bit frame counter that the ground station knows rolls over; (b) a throttle setting that must stay between 0 and 255 whatever the joystick sends; (c) the index of the next free slot in a fixed-size log buffer.
:::

::: answer
(a) `wrapping_add`: rolling over is the documented, expected behavior. (b) `saturating_add` and `saturating_sub`: the value should stick at 0 or 255, never jump from one end to the other. (c) `checked_add`: going past the end of the buffer is a bug or a full buffer, and the code must notice and decide what to do, not continue with a wrong index.
:::

::: check
What does `1000_i32 as u8` give? And what does `u8::try_from(1000_i32)` give instead?
:::

::: answer
`as` keeps the low 8 bits, which is the same as wrapping: $1000 - 3 \times 256 = 1000 - 768 = 232$. So `1000_i32 as u8` is `232`, silently. `u8::try_from(1000_i32)` notices that 1000 does not fit and returns an error value instead of a number, so the code has to deal with it.
:::

## Summary

| Idea | Rust | What to remember |
| --- | --- | --- |
| Immutable binding | `let x = 5;` | Cannot be reassigned |
| Mutable binding | `let mut x = 5;` | Can be reassigned; type fixed |
| Shadowing | `let x = x * 2;` | A new variable; type may change |
| Integers | `i8`…`i128`, `u8`…`u128`, `isize`, `usize` | Unsigned $0$ to $2^n-1$; signed $-2^{n-1}$ to $2^{n-1}-1$ |
| Floats, bool, char | `f32`, `f64`, `bool`, `char` | Defaults `i32` and `f64`; `char` is 4 bytes |
| Tuple, array | `(f64, u8)`, `[f64; 3]` | Fixed size; array elements share one type |
| Overflow default | `+`, `-`, `*` | Debug: panic. Release: wrap |
| Explicit overflow | `checked_`, `wrapping_`, `saturating_`, `overflowing_` | Same behavior in every profile |

Next lesson: text, in its two Rust forms `String` and `&str`, and the loops and branches — `if`, `loop`, `while`, `while let` and `for` — that move a program through its work.

::: context what-binding-means Binding, not boxing
In C++ you think of a variable as a box in memory that you put values into. Rust's word "binding" puts the weight on the name: you tie a name to a value. With `let x = 5;` and then `let x = 6;`, you did not open the box and swap the 5 for a 6. You made a second value and moved the label onto it. That is why shadowing can change the type: it is a new tie, not a new filling.
:::

::: context what-usize-is The type for counting memory
A 64-bit computer names each byte of memory with a 64-bit address, so the size of anything in memory, and the position of an item in an array, fits in 64 bits. `usize` is exactly that width on each machine: 8 bytes here, 4 bytes on a 32-bit microcontroller. Rust requires array positions to be `usize`, which is why you sometimes write `i as usize` before indexing. It plays the role of C++'s `std::size_t`.
:::

::: context char-is-unicode Why a char takes four bytes
Unicode gives a number to every character in every writing system: letters, digits, Greek letters like Ω, Chinese characters, even emoji. The biggest of those numbers needs 21 bits, which rounds up to 4 bytes. A Rust `char` holds one such number, so it can be any character at all. A C++ `char` is one byte and can only hold one piece of a character. The next lesson shows how text strings pack these characters more tightly.
:::

::: context wrap-circle Numbers on a ring
Bend the `u8` number line into a circle. 255 sits right next to 0, so counting up from 250 by ten steps goes past the top and lands on 4. Wrapping arithmetic is arithmetic on this ring; mathematicians call it arithmetic "modulo 256".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="110" r="70" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="180" y1="34" x2="180" y2="46"/><line x1="244" y1="110" x2="256" y2="110"/>
    <line x1="180" y1="174" x2="180" y2="186"/><line x1="104" y1="110" x2="116" y2="110"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="180" y="62">0</text><text x="228" y="114">64</text><text x="180" y="166">128</text><text x="132" y="114">192</text>
  </g>
  <circle cx="169.7" cy="40.8" r="4.5" fill="#b4232c"/>
  <circle cx="186.9" cy="40.3" r="4.5" fill="#1d6fd1"/>
  <text x="150" y="38" font-size="12" text-anchor="end" fill="#b4232c">250</text>
  <text x="206" y="38" font-size="12" fill="#1d6fd1">4</text>
  <path d="M167.7,26.9 A84,84 0 0,1 188.2,26.4" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="192,27 185,22 185,31" fill="#1f2a44"/>
  <text x="178" y="14" font-size="11" text-anchor="middle" fill="#1f2a44">+10</text>
  <text x="350" y="185" font-size="11" text-anchor="end" fill="#6c7a93">u8: 256 places on the ring</text>
</svg>
```
:::

::: context cpp-signed-overflow The C++ rule Rust avoided
In C++, overflowing a signed integer is undefined behavior: the standard says nothing about what happens, and the optimizer may assume it never does. It can then delete an overflow check you wrote, because "that can never be true". The C++ module's lesson on promotion and undefined behavior shows this. Rust defines every outcome: a panic, or a two's-complement wrap. You may get a wrong number, but never a program the compiler has rewritten around an impossible case.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="160" height="100" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="32" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">C++</text>
  <text x="90" y="56" font-size="12" text-anchor="middle" fill="#1f2a44">unsigned: wraps</text>
  <text x="90" y="80" font-size="12" text-anchor="middle" fill="#b4232c">signed: undefined</text>
  <rect x="190" y="10" width="160" height="100" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="32" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">Rust</text>
  <text x="270" y="56" font-size="12" text-anchor="middle" fill="#1d6fd1">debug: panics</text>
  <text x="270" y="80" font-size="12" text-anchor="middle" fill="#1d6fd1">release: wraps</text>
  <text x="270" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">both defined</text>
</svg>
```
:::

::: context what-a-panic-is What a panic does
A panic is Rust's emergency stop for a bug the program cannot sensibly continue past: overflow in a debug build, reading past the end of an array, an `unwrap` on a missing value. By default it prints a message with the file and line, cleans up the thread it happened on, and the process exits with code 101. It is not like an exception you are meant to catch. The next Rust module covers when to panic and when to return an error instead.
:::

::: context option-preview A first look at Option
`Option` is Rust's way of saying "there may be no answer". It has exactly two forms: `Some(value)` and `None`. You cannot do arithmetic on an `Option<u8>` directly; you must first check which form it is. That is what makes `checked_add` safe: the overflow case cannot be forgotten, because the number is locked inside until you look. Lesson 6 is all about `Option`.
:::

::: context real-counter-bugs Overflow on real flying machines
In 2015 the US Federal Aviation Administration ordered operators of the Boeing 787 to power-cycle its electrical generator control units regularly: a software counter inside them would overflow after 248 days of continuous power, which could shut the generators down. Counting hundredths of a second in a signed 32-bit integer gives $2^{31} / 100$ seconds, which is about 248.6 days. And in 1996 the first Ariane 5 was lost about 37 seconds after lift-off when a 64-bit floating-point value was converted into a 16-bit signed integer that could not hold it; the conversion error shut down the inertial reference system.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="20" y="38" width="300" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <line x1="320" y1="28" x2="320" y2="72" stroke="#b4232c" stroke-width="2.5"/>
  <text x="20" y="88" font-size="11" fill="#1f2a44">power on: 0</text>
  <text x="320" y="88" font-size="11" text-anchor="end" fill="#b4232c">2³¹ − 1 hundredths ≈ 248.6 days</text>
  <text x="170" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">signed 32-bit counter of hundredths of a second</text>
</svg>
```
:::
