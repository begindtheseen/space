---
id: l09-the-standard-traits
title: The standard traits
minutes: 22
covers:
  - 'Operator traits, From/Into, TryFrom, Display, Debug, Default, Iterator, Deref'
---

Think about a box of building bricks. A brick from a set bought ten years ago clicks onto a brick bought yesterday, because every brick has the same studs on top and the same holes underneath. Nobody has to write instructions for how brick A joins brick B. The shared shape does it.

Rust's standard library has a set of shared shapes like that: a handful of traits that almost every type implements. `+` works on a type because the type implements a trait called `Add`. `println!("{}", x)` works because `x`'s type implements `Display`. A `for` loop works because the thing after `in` implements `Iterator` (or can become one). Give your own type these traits and it clicks into the whole language, and into every library that expects them.

This lesson goes through eight of them, using the kind of types a GNC engineer writes in the first week: a 3-vector, angle units, a filter configuration, a stream of time steps. Each section is the same shape: what the trait promises, how to implement it, and where people slip.

## Operators are traits

When you write `a + b`, Rust turns it into a method call: `Add::add(a, b)`. The trait `std::ops::Add` looks like this:

```rust
pub trait Add<Rhs = Self> {
    type Output;
    fn add(self, rhs: Rhs) -> Self::Output;
}
```

(That is the standard library's definition, shown so you can read it, not a program to run.) Both tools from the last lesson are here. `Rhs`, read "right-hand side", is a **generic parameter**, so one type can be added to several kinds of thing. `= Self` gives it a default: if you say nothing, you add two values of the same type. `Output` is an **associated type**: for a given pair of operand types, there is exactly one result type.

Every **[[overloadable operator|operator-overloading]]** has a trait like this in `std::ops`: `Sub` for `-`, `Mul` for `*`, `Div` for `/`, `Neg` for unary minus, `AddAssign` for `+=`, `Index` for `v[i]`, and so on. The comparison operators live in `std::cmp`: `PartialEq` gives `==` and `!=`, and `PartialOrd` gives `<`, `>`, `<=` and `>=`.

::: example Integrating a thrusting vehicle with vector operators
Here is a `Vec3` with the operators a physics step needs, followed by ten Euler steps of a vehicle under thrust and gravity.

```rust
use std::ops::{Add, AddAssign, Mul, Neg, Sub};

#[derive(Debug, Clone, Copy, PartialEq)]
struct Vec3 {
    x: f64,
    y: f64,
    z: f64,
}

impl Add for Vec3 {
    type Output = Vec3;
    fn add(self, o: Vec3) -> Vec3 {
        Vec3 { x: self.x + o.x, y: self.y + o.y, z: self.z + o.z }
    }
}

impl Sub for Vec3 {
    type Output = Vec3;
    fn sub(self, o: Vec3) -> Vec3 {
        Vec3 { x: self.x - o.x, y: self.y - o.y, z: self.z - o.z }
    }
}

// vector * number
impl Mul<f64> for Vec3 {
    type Output = Vec3;
    fn mul(self, k: f64) -> Vec3 {
        Vec3 { x: self.x * k, y: self.y * k, z: self.z * k }
    }
}

// number * vector: the trait is implemented on f64, with Vec3 as the parameter
impl Mul<Vec3> for f64 {
    type Output = Vec3;
    fn mul(self, v: Vec3) -> Vec3 {
        v * self
    }
}

impl Neg for Vec3 {
    type Output = Vec3;
    fn neg(self) -> Vec3 {
        Vec3 { x: -self.x, y: -self.y, z: -self.z }
    }
}

impl AddAssign for Vec3 {
    fn add_assign(&mut self, o: Vec3) {
        self.x += o.x;
        self.y += o.y;
        self.z += o.z;
    }
}

fn main() {
    let g = Vec3 { x: 0.0, y: 0.0, z: -9.80665 };  // gravity, m/s^2
    let thrust = Vec3 { x: 0.5, y: 0.0, z: 14.2 }; // thrust / mass, m/s^2
    let mut v = Vec3 { x: 0.0, y: 0.0, z: 0.0 };   // velocity, m/s
    let dt = 0.1;                                  // time step, s

    for _ in 0..10 {
        v += (thrust + g) * dt; // one Euler step
    }
    println!("v after 1 s = {:?}", v);
    println!("-v = {:?}", -v);
    println!("2.0 * g = {:?}", 2.0 * g);
    println!("thrust - thrust == zero? {}", thrust - thrust == Vec3 { x: 0.0, y: 0.0, z: 0.0 });
}
```

```text
v after 1 s = Vec3 { x: 0.49999999999999994, y: 0.0, z: 4.393349999999999 }
-v = Vec3 { x: -0.49999999999999994, y: -0.0, z: -4.393349999999999 }
2.0 * g = Vec3 { x: 0.0, y: 0.0, z: -19.6133 }
thrust - thrust == zero? true
```

(Every program in this lesson was built and run with rustc 1.94.1.) Work the physics by hand. The net acceleration is thrust plus gravity: $(0.5,\ 0,\ 14.2 - 9.80665) = (0.5,\ 0,\ 4.39335)\,\mathrm{m/s^2}$. Each **[[Euler step|euler-step]]** adds acceleration times $dt$ to the velocity. Ten steps of $0.1\,\mathrm{s}$ make $1\,\mathrm{s}$, so the velocity should be $(0.5,\ 0,\ 4.39335)\,\mathrm{m/s}$.

The program agrees, up to the last digit: $0.49999999999999994$ instead of $0.5$. That is floating-point rounding from adding $0.05$ ten times, the same thing Python prints for the same sum. Your `Vec3` did nothing wrong.

Look at the line `v += (thrust + g) * dt;`. It reads like the physics. Behind it are three trait calls: `Add::add(thrust, g)`, then `Mul::mul(that, dt)`, then `AddAssign::add_assign(&mut v, result)`.

Two details are worth a second look. `2.0 * g` works only because of the fourth impl, `impl Mul<Vec3> for f64`: the left operand decides whose trait is called, so "number times vector" and "vector times number" are two different impls. And `-v` printed `y: -0.0`. That is **[[negative zero|negative-zero]]**, a real IEEE 754 value, and it compares equal to `0.0`.
:::

::: key Operators are traits
`a + b` means `Add::add(a, b)`. Each operator has a trait in `std::ops` (`Add`, `Sub`, `Mul`, `Div`, `Neg`, `AddAssign`, `Index`, …) with an associated `Output` type, and `==` and `<` come from `PartialEq` and `PartialOrd`. You cannot invent new operators; you can only implement the existing traits for your types.
:::

::: warning Operators take their operands by value
`fn add(self, rhs: Rhs)` takes `self`, not `&self`. For a small type like `Vec3` that is fine, *if* the type is `Copy`: then `thrust + g` copies both and you can keep using them. Forget `#[derive(Clone, Copy)]` and the first `thrust + g` moves `thrust` away, and the next use is error E0382 from lesson 01. For big types, such as a 6×6 matrix, implement the operator for references instead (`impl Add for &Mat6`), so `&a + &b` borrows.
:::

`PartialEq` and `PartialOrd` are called "partial" because of floats. A float can be NaN, "not a number", and NaN is not equal to anything, not even itself. So `f64` implements `PartialEq` but not `Eq` (the promise that every value equals itself), and `PartialOrd` but not `Ord` (the promise that any two values can be put in order). That is why the last module could not call `.max()` on a list of `f64`. Deriving `PartialEq` for `Vec3`, as above, compares field by field.

## Display and Debug: two ways to print

Rust has two printing traits, for two audiences.

- **`Debug`** is for programmers. It is used by `{:?}` and by the pretty form `{:#?}`. You almost never write it by hand: `#[derive(Debug)]` prints the type name and every field.
- **`Display`** is for users: an operator's console, a log line, an error message. It is used by `{}`. It cannot be derived, because only you know how your type should read to a person.

Try `{}` on a type without `Display` and the compiler explains the split:

```text
error[E0277]: `Vec3` doesn't implement `std::fmt::Display`
 --> src/main.rs:9:20
  |
9 |     println!("{}", v);
  |               --   ^ `Vec3` cannot be formatted with the default formatter
  |               |
  |               required by this formatting parameter
  |
  = note: in format strings you may be able to use `{:?}` (or {:#?} for pretty-print) instead
```

(trimmed). Here is `Display` written by hand:

```rust
use std::fmt;

#[derive(Debug, Clone, Copy)]
struct Vec3 {
    x: f64,
    y: f64,
    z: f64,
}

impl fmt::Display for Vec3 {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({:.3}, {:.3}, {:.3})", self.x, self.y, self.z)
    }
}

fn main() {
    let v = Vec3 { x: 0.49999999999999994, y: 0.0, z: 4.393349999999999 };
    println!("Display: v = {} m/s", v);
    println!("Debug:   v = {:?}", v);
    println!("Pretty:\n{:#?}", v);
    let label: String = v.to_string(); // from the blanket impl of ToString
    println!("as a String, {} characters", label.len());
}
```

```text
Display: v = (0.500, 0.000, 4.393) m/s
Debug:   v = Vec3 { x: 0.49999999999999994, y: 0.0, z: 4.393349999999999 }
Pretty:
Vec3 {
    x: 0.49999999999999994,
    y: 0.0,
    z: 4.393349999999999,
}
as a String, 21 characters
```

The one method, `fmt`, receives a `Formatter` (the place the text is going) and writes into it with the `write!` macro, which takes the same **[[format strings|format-spec]]** as `println!`. `{:.3}` means "three digits after the decimal point", which turns the rounding noise into the clean $0.500$ an operator wants to see. It returns `fmt::Result`, which is `Ok(())` unless the destination failed.

The `to_string()` call is the blanket impl from the last lesson at work: every `Display` type gets `ToString` for free. The string `(0.500, 0.000, 4.393)` is 21 characters: three numbers of 5 characters, two separators `", "` of 2 characters each, and two parentheses, $15 + 4 + 2 = 21$.

::: key Display versus Debug
`Debug` (`{:?}`, `{:#?}`) is for programmers and is derived with `#[derive(Debug)]`. `Display` (`{}`) is for people, is always written by hand, and gives the type `.to_string()` through a blanket impl. Error types implement both, which lesson 10 relies on.
:::

## Default: a sensible starting value

`Default` has one method, `fn default() -> Self`, which returns a starting value. `#[derive(Default)]` fills every field with its own default: `0` for numbers, `false` for `bool`, an empty `String` or `Vec`, and `None` for an `Option`. When zeros are wrong, write it by hand.

```rust
#[derive(Debug, Default)]
pub struct Counters {
    pub frames: u32,
    pub crc_errors: u32,
    pub last_error: Option<String>,
}

#[derive(Debug)]
pub struct FilterConfig {
    pub rate_hz: f64,
    pub gyro_noise: f64,  // rad/s per sample
    pub accel_noise: f64, // m/s^2 per sample
    pub use_magnetometer: bool,
}

impl Default for FilterConfig {
    fn default() -> Self {
        FilterConfig {
            rate_hz: 100.0,
            gyro_noise: 0.002,
            accel_noise: 0.05,
            use_magnetometer: true,
        }
    }
}

fn main() {
    let c = Counters::default();
    println!("{:?}", c);

    let bench = FilterConfig::default();
    let flight = FilterConfig {
        rate_hz: 1000.0,
        use_magnetometer: false,
        ..Default::default() // everything else from default()
    };
    println!("{:?}", bench);
    println!("{:?}", flight);
    println!("dt = {} s", 1.0 / flight.rate_hz);
}
```

```text
Counters { frames: 0, crc_errors: 0, last_error: None }
FilterConfig { rate_hz: 100.0, gyro_noise: 0.002, accel_noise: 0.05, use_magnetometer: true }
FilterConfig { rate_hz: 1000.0, gyro_noise: 0.002, accel_noise: 0.05, use_magnetometer: false }
dt = 0.001 s
```

For `Counters`, all zeros is exactly right, so the derive does it. A filter running at $0\,\mathrm{Hz}$ would be nonsense, so `FilterConfig` writes its own. The `flight` value uses **[[struct update syntax|struct-update]]**, `..Default::default()`, read "and the rest from the default". It sets two fields and takes the other two from `default()`. A rate of $1000\,\mathrm{Hz}$ gives a step of $1 / 1000 = 0.001\,\mathrm{s}$.

This pattern is how Rust copes without default arguments or overloading (from the last module): one config struct, a `Default`, and callers override only what they care about.

## From and Into: conversions that cannot fail

`From<T>` says "a value of this type can be built from a `T`, and it always works". It has one method, `fn from(value: T) -> Self`. Its partner `Into<U>` is the same conversion seen from the other side: `x.into()`. You implement only `From`. The standard library has a blanket impl, `impl<T, U> Into<U> for T where U: From<T>`, so every `From` gives you the matching `Into` for free.

Why convert at all? Because a plain `f64` does not know what it means. Wrap numbers in **newtypes** (from the last lesson) such as `Degrees(f64)` and `Radians(f64)`, and a function that asks for `Radians` cannot be handed degrees by mistake.

## TryFrom: conversions that can fail

Some conversions only work for some inputs. A `u8` from the ground is a mode command only if it is 0, 1 or 2. An `i32` fits in a `u16` only if it is between $0$ and $65\,535$. For these, **`TryFrom<T>`** has a method `fn try_from(value: T) -> Result<Self, Self::Error>`, with an associated `Error` type saying what went wrong. Its partner is `TryInto`, again free through a blanket impl.

::: example Units, command bytes and a number too big for 16 bits

```rust
use std::f64::consts::PI;

#[derive(Debug, Clone, Copy)]
pub struct Degrees(pub f64);

#[derive(Debug, Clone, Copy)]
pub struct Radians(pub f64);

// Always succeeds, so From.
impl From<Degrees> for Radians {
    fn from(d: Degrees) -> Radians {
        Radians(d.0 * PI / 180.0)
    }
}

// A function that only accepts radians.
fn rotation_time_s(angle: Radians, rate_rad_s: f64) -> f64 {
    angle.0 / rate_rad_s
}

#[derive(Debug, PartialEq)]
pub enum Mode {
    Safe,
    Standby,
    Science,
}

#[derive(Debug, PartialEq)]
pub struct BadMode(pub u8);

// Can fail, so TryFrom.
impl TryFrom<u8> for Mode {
    type Error = BadMode;
    fn try_from(b: u8) -> Result<Mode, BadMode> {
        match b {
            0 => Ok(Mode::Safe),
            1 => Ok(Mode::Standby),
            2 => Ok(Mode::Science),
            other => Err(BadMode(other)),
        }
    }
}

fn main() {
    let slew = Degrees(90.0);
    let r = Radians::from(slew); // call From directly
    let r2: Radians = slew.into(); // or let Into pick it up
    println!("{:?} = {:?} = {:?}", slew, r, r2);
    println!("slew time at 0.05 rad/s: {:.1} s", rotation_time_s(slew.into(), 0.05));

    for byte in [2u8, 7] {
        match Mode::try_from(byte) {
            Ok(m) => println!("command byte {} -> {:?}", byte, m),
            Err(e) => println!("command byte {} rejected: {:?}", byte, e),
        }
    }

    let counts: i32 = 70_000;
    println!("u16::try_from(70000) = {:?}", u16::try_from(counts));
    println!("70000 as u16         = {}", counts as u16);
    let ok: Result<u16, _> = 1_200_i32.try_into();
    println!("1200.try_into()      = {:?}", ok);
}
```

```text
Degrees(90.0) = Radians(1.5707963267948966) = Radians(1.5707963267948966)
slew time at 0.05 rad/s: 31.4 s
command byte 2 -> Science
command byte 7 rejected: BadMode(7)
u16::try_from(70000) = Err(TryFromIntError(()))
70000 as u16         = 4464
1200.try_into()      = Ok(1200)
```

Go line by line.

1. **The slew.** $90^\circ \times \pi / 180 = \pi / 2 \approx 1.5708\,\mathrm{rad}$. Both spellings, `Radians::from(slew)` and `slew.into()`, run the same code. The `.into()` works because `Radians: From<Degrees>`, so the blanket impl gives `Degrees: Into<Radians>`; the compiler learns the target type from the parameter of `rotation_time_s`.
2. **The slew time.** At $0.05\,\mathrm{rad/s}$, turning $1.5708\,\mathrm{rad}$ takes $1.5708 / 0.05 \approx 31.4\,\mathrm{s}$. About half a minute for a quarter turn is a plausible, gentle spacecraft slew. Pass `slew` itself, without `.into()`, and the compiler stops you: "expected `Radians`, found `Degrees`" (error E0308).
3. **The command bytes.** Byte 2 is a valid mode, `Science`. Byte 7 is not a mode at all, so `try_from` returns `Err(BadMode(7))`, and the caller decides what to do: reject the command and report it to the ground.
4. **The big number.** $70\,000$ does not fit in a `u16`, whose largest value is $65\,535$, so `u16::try_from` returns an error. The `as` [[cast|as-casts]], by contrast, *silently* keeps the low 16 bits: $70\,000 - 65\,536 = 4\,464$. A counter that jumped from $70\,000$ to $4\,464$ with no warning is exactly the kind of bug `TryFrom` exists to catch.
5. **The small number.** $1\,200$ fits, so `try_into` gives `Ok(1200)`.
:::

::: key From, Into and TryFrom
Implement `From<T>` for conversions that always succeed; the blanket impl then gives `Into` for free. Implement `TryFrom<T>` (with an associated `Error` type) for conversions that can fail; `TryInto` comes free the same way. Prefer `try_from` to an `as` cast whenever a value might not fit.
:::

The `?` operator uses `From` too. When a function returns `Result<T, MyError>` and a line inside produces some other error `E`, `?` converts it with `From::from` before returning, as long as `impl From<E> for MyError` exists. Lesson 10 builds whole error types on that one fact.

## Iterator: write `next`, get everything else

You met the `Iterator` trait in the last module: one associated type, `Item`, and one required method, `fn next(&mut self) -> Option<Self::Item>`. Each call hands out `Some(item)`, and `None` means [[finished|next-sequence]]. Every adapter you used, `map`, `filter`, `take`, `fold`, `count`, is a default method built on `next`, so implementing `next` for your own type gives you all of them at once.

::: example A time grid for a trajectory table

```rust
/// The times 0, dt, 2 dt, ... up to and including n dt.
struct TimeGrid {
    dt: f64,
    i: u32,
    n: u32,
}

impl Iterator for TimeGrid {
    type Item = f64;

    fn next(&mut self) -> Option<f64> {
        if self.i > self.n {
            return None; // finished
        }
        let t = self.i as f64 * self.dt;
        self.i += 1;
        Some(t)
    }
}

fn main() {
    let g0 = 9.80665;
    let v0 = 5.0 * g0; // launch speed, m/s
    let altitude = |t: f64| v0 * t - 0.5 * g0 * t * t;

    let grid = || TimeGrid { dt: 0.5, i: 0, n: 20 };

    let first: Vec<f64> = grid().take(4).collect();
    println!("first times: {:?}", first);
    println!("samples: {}", grid().count());

    let (t_top, h_top) = grid()
        .map(|t| (t, altitude(t)))
        .fold((0.0, f64::MIN), |best, s| if s.1 > best.1 { s } else { best });
    println!("highest sample: t = {} s, h = {:.2} m", t_top, h_top);

    for t in grid().filter(|&t| t >= 9.5) {
        println!("t = {:4} s  h = {:6.2} m", t, altitude(t));
    }
}
```

```text
first times: [0.0, 0.5, 1.0, 1.5]
samples: 21
highest sample: t = 5 s, h = 122.58 m
t =  9.5 s  h =  23.29 m
t =   10 s  h =   0.00 m
```

The grid computes each time as `i * dt` from an integer counter, rather than adding `dt` over and over, so the times come out exact: $0.5$ is a power of two and has an exact binary form. It runs from $i = 0$ to $i = 20$, which is $21$ samples, ending at $20 \times 0.5 = 10\,\mathrm{s}$.

Now the physics. A ball thrown straight up at $v_0 = 5 g_0 = 49.03\,\mathrm{m/s}$ has height $h(t) = v_0 t - \tfrac{1}{2} g_0 t^2$. It stops rising when its speed $v_0 - g_0 t$ reaches zero, at $t = v_0 / g_0 = 5\,\mathrm{s}$. There, $h = 5 g_0 \times 5 - \tfrac{1}{2} g_0 \times 25 = 25 g_0 - 12.5 g_0 = 12.5 g_0 = 12.5 \times 9.80665 \approx 122.58\,\mathrm{m}$. The fold found the same peak. At $t = 10\,\mathrm{s}$ the ball is back on the ground: $h = 50 g_0 - 50 g_0 = 0$. The table agrees.

`TimeGrid` has one method of its own, and it used `take`, `collect`, `count`, `map`, `fold` and `filter`, and a `for` loop. A `for` loop accepts anything that implements `IntoIterator`, and the standard library has a blanket impl that makes every `Iterator` one.
:::

::: warning `next` must keep returning `None`
Once an iterator has returned `None`, many callers assume it stays finished. Write `next` so that it does. `TimeGrid` does, because `i` only grows. An iterator that restarts after `None` behaves strangely in adapters like `zip` and `chain`, and there is no error message to warn you.
:::

## Deref: what `*` does, and the conversions it enables

`Deref` is the trait behind the `*` operator on smart pointers. It has an associated type `Target` and one method, `fn deref(&self) -> &Self::Target`. `Box<T>` implements it with `Target = T`, which is why `*b` reaches the value in the box. `DerefMut` is the same for `&mut`.

`Deref` also switches on a convenience called **[[deref coercion|deref-coercion]]**. When you pass `&x` where a different reference type is expected, the compiler applies `deref` as many times as needed to make the types match. That is why a `&String` can be passed to a function wanting `&str` (`String` derefs to `str`), and a `&Vec<f64>` to a function wanting `&[f64]` (`Vec<T>` derefs to `[T]`).

Here are both, and a newtype of our own that derefs to a slice:

```rust
use std::ops::Deref;

/// Samples that are known to be sorted, oldest first.
pub struct SortedSamples(Vec<f64>);

impl SortedSamples {
    pub fn new(mut v: Vec<f64>) -> Self {
        v.sort_by(|a, b| a.total_cmp(b));
        SortedSamples(v)
    }
}

// Read-only access to the inner slice, and nothing more.
impl Deref for SortedSamples {
    type Target = [f64];
    fn deref(&self) -> &[f64] {
        &self.0
    }
}

fn median(v: &[f64]) -> f64 {
    let n = v.len();
    if n % 2 == 1 { v[n / 2] } else { 0.5 * (v[n / 2 - 1] + v[n / 2]) }
}

fn shout(s: &str) -> String {
    s.to_uppercase()
}

fn main() {
    let b: Box<f64> = Box::new(101_325.0);
    let p: f64 = *b + 250.0; // *b goes through Deref for Box
    println!("p = {} Pa", p);

    let callsign = String::from("dragon-7");
    println!("{}", shout(&callsign)); // &String becomes &str

    let s = SortedSamples::new(vec![9.83, 9.79, 9.81, 9.80]);
    println!("len {} first {} last {}", s.len(), s[0], s[s.len() - 1]);
    println!("median {:.3}", median(&s)); // &SortedSamples becomes &[f64]
}
```

```text
p = 101575 Pa
DRAGON-7
len 4 first 9.79 last 9.83
median 9.805
```

`SortedSamples` never defines `len` or indexing, yet `s.len()` and `s[0]` work: method calls and indexing look through `Deref` to the slice. And `median(&s)` compiles because `&SortedSamples` coerces to `&[f64]`. The median of the sorted four, $9.79, 9.80, 9.81, 9.83$, is the average of the middle two: $(9.80 + 9.81) / 2 = 9.805$.

Notice what is *not* there: `DerefMut`. So nobody can write through the wrapper and break the sorted order. Add the line `s[0] = 100.0;` at the end of `main` and the compiler refuses:

```text
error[E0594]: cannot assign to data in dereference of `SortedSamples`
  --> src/main.rs:41:5
   |
41 |     s[0] = 100.0;
   |     ^^^^^^^^^^^^ cannot assign
   |
   = help: trait `DerefMut` is required to modify through a dereference, but it is not implemented for `SortedSamples`
```

That is the same idea as the private field in lesson 07: the invariant "sorted" is protected because the only ways in are the ones you chose to write.

::: warning Deref is not inheritance
It is tempting to make `struct Rocket { vehicle: Vehicle }` deref to `Vehicle` so that `rocket.mass()` "inherits" the method. Resist it. `Deref` is meant for smart pointers and thin wrappers whose whole job is to *be* the thing inside. Used as fake inheritance, it makes method lookup surprising, and it does not make a `Rocket` usable where a trait bound asks for a `Vehicle`, which is what you really wanted. Use a trait, or write the forwarding method.
:::

::: key Deref
`Deref` (with `type Target`) defines what `*x` gives for a smart pointer, and powers deref coercion: `&String` → `&str`, `&Vec<T>` → `&[T]`, `&Box<T>` → `&T`. Implement it for pointer-like wrappers only; without `DerefMut`, the wrapper stays read-only.
:::

## Check yourself

::: check
You want `q1 * q2` to multiply two quaternions of type `Quat` and `q * 2.0` to scale one. Write the two `impl` lines (headers only), and say why `2.0 * q` would still not compile.
:::

::: answer
`impl Mul for Quat` (short for `impl Mul<Quat> for Quat`), with `type Output = Quat;`, and `impl Mul<f64> for Quat`, also with `type Output = Quat;`. The left operand chooses the impl, so `2.0 * q` looks for `impl Mul<Quat> for f64`, which does not exist yet. Add it, as the `Vec3` example did, if you want both orders. The orphan rule allows it because `Quat` is your own type.
:::

::: check
A telemetry display shows `Vec3 { x: 0.49999999999999994, ... }`. Which trait produced that, and what would you implement to show `(0.500, 0.000, 4.393)` instead? Which format placeholder uses each?
:::

::: answer
The derived `Debug` implementation produced it, through `{:?}`. For operator-facing text, implement `Display` by hand, writing each component with `{:.3}`, and print it with `{}`. Keep the `Debug` derive as well: it is the right tool for logs read by programmers and for `assert_eq!` failure messages.
:::

::: check
A ground command carries a 16-bit throttle setting in tenths of a percent, so valid values are 0 to 1000. Should the conversion from `u16` into your `Throttle` type be `From` or `TryFrom`? What should the error hold?
:::

::: answer
`TryFrom<u16>`, because values from 1001 to 65,535 are possible on the wire and are not valid throttles. The associated `Error` type should hold the rejected value, for example `struct BadThrottle(u16)`, so the rejection can be reported to the ground exactly. `From` is only for conversions that succeed for every input, and a panic inside `from` for bad input would let one corrupted command crash the flight software.
:::

::: check
What does `300_i32 as u8` give, and what does `u8::try_from(300_i32)` give? Show the arithmetic.
:::

::: answer
The cast keeps the low 8 bits. A `u8` holds 0 to 255, so it wraps at $256$: $300 - 256 = 44$, and `300_i32 as u8` is $44$, with no warning. `u8::try_from(300_i32)` returns `Err(TryFromIntError(()))`, because $300 > 255$. The first silently gives a wrong value; the second makes the caller decide what to do.
:::

::: check
Your custom iterator implements only `next`. A colleague asks why `.filter(...)`, `.sum()` and `for x in it` all work on it. Explain in terms of the last lesson's ideas.
:::

::: answer
`filter`, `sum` and the other adapters are default methods of the `Iterator` trait, written in terms of `next`, so any type that provides `next` gets them. The `for` loop needs `IntoIterator`, and the standard library has a blanket impl, `impl<I: Iterator> IntoIterator for I`, so every iterator is automatically one. Default methods and blanket impls do all the work.
:::

## Summary

| Trait | Gives you | Key detail |
|---|---|---|
| `Add`, `Sub`, `Mul`, `Neg`, `AddAssign`, `Index` | `+`, `-`, `*`, unary `-`, `+=`, `v[i]` | Associated `Output`; left operand chooses the impl |
| `PartialEq`, `PartialOrd` | `==`, `<` and friends | "Partial" because NaN; `f64` is not `Eq` or `Ord` |
| `Debug` | `{:?}`, `{:#?}` | Derived; for programmers |
| `Display` | `{}`, `.to_string()` | Written by hand; for people |
| `Default` | `T::default()`, `..Default::default()` | Derive for zeros; hand-write real defaults |
| `From` / `Into` | Infallible conversion | Implement `From`; `Into` comes free |
| `TryFrom` / `TryInto` | Fallible conversion | Associated `Error`; safer than `as` |
| `Iterator` | `next` plus every adapter | `Item` associated type; `None` means finished |
| `Deref` | `*x`, deref coercion | For smart pointers and thin wrappers only |

`From` and `Display` are the two traits every error type leans on. The next lesson builds custom error enums, lets `thiserror` write those impls for you in a library and `anyhow` carry errors in an application, and draws the line between an error you return and a panic.

::: context operator-overloading A fixed menu of operators
Rust lets a type give its own meaning to an operator, which is called operator overloading, but only for the operators the language lists, each through its trait. You cannot invent a new symbol such as `**`, and `&&`, `||` and plain assignment `=` cannot be overloaded at all. C++ allows more, including overloading `&&`, `,` and the address-of operator `&`, which is one source of surprising C++ code. Every Rust operator is a plain trait method, so the compiler, readers and tools can always find the code behind a `+`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="14" y="20" width="130" height="36" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="79" y="43" font-size="13" text-anchor="middle" fill="#1f2a44">thrust + g</text>
  <line x1="144" y1="38" x2="196" y2="38" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="204,38 194,33 194,43" fill="#1d6fd1"/>
  <rect x="206" y="20" width="140" height="36" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="276" y="43" font-size="12" text-anchor="middle" fill="#1f2a44">Add::add(thrust, g)</text>
  <rect x="14" y="72" width="130" height="36" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="79" y="95" font-size="13" text-anchor="middle" fill="#1f2a44">v += a</text>
  <line x1="144" y1="90" x2="196" y2="90" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="204,90 194,85 194,95" fill="#1d6fd1"/>
  <rect x="206" y="72" width="140" height="36" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="276" y="95" font-size="11" text-anchor="middle" fill="#1f2a44">AddAssign::add_assign</text>
</svg>
```
:::

::: context euler-step The simplest way to step physics forward
Euler's method, named after the eighteenth-century mathematician Leonhard Euler, advances a simulation by assuming the rate of change stays constant for one short step: new velocity equals old velocity plus acceleration times $dt$. With constant acceleration, as here, it is exact up to rounding. When the acceleration changes during the step, as it does for a real vehicle burning propellant, it makes a small error every step, and the errors pile up. That is why flight simulators usually use higher-order methods such as Runge–Kutta, which the course's simulation modules cover.
:::

::: context negative-zero Why there is a minus zero
IEEE 754 floating-point numbers store a sign bit separately from the size, so zero can carry either sign. Negating `0.0` flips the sign bit and gives `-0.0`. The standard says the two compare equal, so `-0.0 == 0.0` is `true` in Rust, C++ and Python alike. The sign is not useless: it records which side a tiny result came from, and it shows up in a few places, such as `1.0 / -0.0`, which is negative infinity.
:::

::: context format-spec The little language inside the braces
Inside `{}` you can add a colon and a specification. `{:.3}` sets three digits after the point. `{:6.2}` sets a total width of 6 characters with 2 decimals, padding on the left, which is how the trajectory table lines its columns up. `{:>14}` right-aligns in 14 characters. `{:?}` asks for `Debug` instead of `Display`, and `{:#?}` for pretty `Debug`. `{:#010x}` prints an integer in hexadecimal with a `0x` prefix, zero-padded to 10 characters in all, as lesson 07 did for the bits of a float. Your `Display` impl receives the specification through the `Formatter`, and can honor it or ignore it.
:::

::: context struct-update Filling in the rest
The `..expr` at the end of a struct literal says: take every field not listed from `expr`. It is written last, and `expr` must be a value of the same type, very often `Default::default()`. It is not special to `Default`: `FilterConfig { rate_hz: 50.0, ..flight }` builds a copy of `flight` with a different rate. Beware one detail: fields taken this way are moved out of `expr`, so if they are not `Copy` (a `String`, say), the original can no longer be used as a whole afterwards.
:::

::: context as-casts What `as` does with numbers that do not fit
`as` never fails and never panics; it always produces some value. Between integer types it keeps the low bits, so `70_000_i32 as u16` is 4,464 and `-1_i32 as u8` is 255. From a float to an integer it saturates: the value is clamped to the target's range, and NaN becomes 0. So `300.7_f64 as u8` is 255 and `-5.0_f64 as u8` is 0. These rules are fully defined, but "fully defined" is not "what you meant". Clippy has lints that flag casts which may truncate or lose the sign, and flight code often turns them on.
:::

::: context next-sequence One button, pressed until it says stop
Picture the time grid as a ticket machine. Each call to `next` prints one ticket, `Some(t)`, and moves the counter on. When the roll runs out, it prints `None`, and every adapter and `for` loop stops there. Nothing is computed ahead of time: a time is only made when someone asks for it, which is why `take(4)` on a grid of 21 times did only four steps of work.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <rect x="8" y="40" width="62" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="39" y="59">Some(0.0)</text>
    <rect x="76" y="40" width="62" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="107" y="59">Some(0.5)</text>
    <rect x="144" y="40" width="40" height="30" fill="#fff" stroke="#6c7a93"/><text x="164" y="59">...</text>
    <rect x="190" y="40" width="70" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="225" y="59">Some(10.0)</text>
    <rect x="266" y="40" width="50" height="30" fill="#f2b880" stroke="#b4232c"/><text x="291" y="59">None</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#6c7a93">
    <text x="39" y="30">i = 0</text>
    <text x="107" y="30">i = 1</text>
    <text x="225" y="30">i = 20</text>
    <text x="291" y="30">i = 21</text>
  </g>
  <text x="180" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">21 calls return Some; the 22nd returns None</text>
</svg>
```
:::

::: context deref-coercion A chain of automatic derefs
When the types do not match, the compiler tries inserting `deref` calls, one after another, until they do. A `&Box<String>` passed to a function wanting `&str` is converted in two steps. Each step is an ordinary call to `deref`, decided at compile time, so there is no runtime search. The coercion only goes from one reference type to another; it never turns a value into a reference, and it never happens for trait bounds on generics.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="30" width="100" height="36" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="58" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">&amp;Box&lt;String&gt;</text>
  <line x1="108" y1="48" x2="136" y2="48" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="144,48 134,43 134,53" fill="#1d6fd1"/>
  <rect x="146" y="30" width="90" height="36" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="191" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">&amp;String</text>
  <line x1="236" y1="48" x2="264" y2="48" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="272,48 262,43 262,53" fill="#1d6fd1"/>
  <rect x="274" y="30" width="76" height="36" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="312" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">&amp;str</text>
  <text x="126" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">deref</text>
  <text x="254" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">deref</text>
  <text x="180" y="90" font-size="11" text-anchor="middle" fill="#6c7a93">inserted by the compiler, at compile time</text>
</svg>
```
:::
