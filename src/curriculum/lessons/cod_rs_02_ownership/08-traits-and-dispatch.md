---
id: l08-traits-and-dispatch
title: Traits, generics and dispatch
minutes: 26
covers:
  - 'Traits: definition, default methods, associated types versus generic parameters, where clauses, blanket impls, the orphan rule'
  - 'Static dispatch (impl Trait, generics) versus dynamic dispatch (dyn Trait, fat pointers)'
---

Think about the charging port on a phone. The port is a promise written down in a standard: any cable that meets it will fit, and any device that has it can be charged. The charger does not need to know whether it is talking to a phone, a pair of headphones or a camera. It only needs to know that the device keeps the promise.

A rocket's flight computer wants the same thing from its sensors. A navigation filter should not care whether a reading came from this year's gyro or next year's. It should only care that "you can ask it for a reading, and you get back three numbers or an error". In Rust, a written-down promise like that is a **trait** — a named list of methods that a type can promise to provide. You have met a few already: `Copy`, `Clone`, `Drop`, `Iterator`, `Send`. The [[word trait|trait-word]] is well chosen: it names something a type can do. This lesson shows how to write your own.

Then it answers the question that matters for a control loop running a thousand times a second: when code calls a method through a trait, how does the program find the right function? There are two answers, **static dispatch** and **dynamic dispatch**, and you will measure the difference yourself.

## Defining a trait and implementing it

Here is the sensor promise, written as a trait, with two sensors that keep it:

```rust
#[derive(Debug)]
pub enum SensorError {
    Timeout,
    OutOfRange,
}

pub trait Sensor {
    // Required: every sensor must say how to read it.
    fn read(&mut self) -> Result<[f64; 3], SensorError>;

    // Provided: a default that every sensor gets for free.
    fn name(&self) -> &'static str {
        "unnamed sensor"
    }
}

pub struct Gyro {
    t: f64,
    bias: [f64; 3],
}

impl Sensor for Gyro {
    fn read(&mut self) -> Result<[f64; 3], SensorError> {
        self.t += 0.001;
        Ok([
            0.01 * self.t.sin() + self.bias[0],
            0.01 * self.t.cos() + self.bias[1],
            self.bias[2],
        ])
    }

    fn name(&self) -> &'static str {
        "gyro"
    }
}

pub struct Accel {
    t: f64,
    replies_left: u32, // simulates a device that stops answering
}

impl Sensor for Accel {
    fn read(&mut self) -> Result<[f64; 3], SensorError> {
        if self.replies_left == 0 {
            return Err(SensorError::Timeout);
        }
        self.replies_left -= 1;
        self.t += 0.001;
        Ok([0.0, 0.0, -9.80665 + 0.001 * self.t])
    }
    // no name() here, so Accel keeps the default
}

fn main() {
    let mut g = Gyro { t: 0.0, bias: [1e-3, -2e-3, 5e-4] };
    let mut a = Accel { t: 0.0, replies_left: 1 };
    println!("{}: {:?}", g.name(), g.read());
    println!("{}: {:?}", a.name(), a.read());
    println!("{}: {:?}", a.name(), a.read());
}
```

```text
gyro: Ok([0.0010099999983333335, 0.007999995000000417, 0.0005])
unnamed sensor: Ok([0.0, 0.0, -9.806649])
unnamed sensor: Err(Timeout)
```

(Every program in this lesson was built and run with rustc 1.94.1.) Read the pieces in order.

- `pub trait Sensor { ... }` **defines** the trait. Inside are method signatures.
- `fn read(&mut self) -> ...;` ends in a semicolon, with no body. That makes it a **required method**: every type that implements the trait must write it.
- `fn name(&self) -> ... { "unnamed sensor" }` has a body. That makes it a **default method** (also called a provided method): a type gets it for free, and may replace it with its own version.
- `impl Sensor for Gyro { ... }`, read "implement Sensor for Gyro", is the type keeping the promise. `Gyro` writes `read` and replaces `name`. `Accel` writes only `read`, so it keeps the default name.

Check the numbers. On the gyro's first read, $t = 0.001$, so the x value is $0.01 \sin(0.001) + 0.001 \approx 0.00001 + 0.001 = 0.00101$, and the y value is $0.01 \cos(0.001) - 0.002 \approx 0.01 - 0.002 = 0.008$. The z value is the bias, $0.0005$. The accelerometer gives $-9.80665 + 0.001 \times 0.001 = -9.806649$, then times out on its second read, because it was built with one reply left.

[[Default methods|default-methods]] are where much of a trait's power comes from. `Iterator` has exactly one required method, `next`, and dozens of default ones: `map`, `filter`, `sum`, `zip` and the rest you used in the last module. Write `next` for your own type and you get all of them.

::: warning A trait is not a class
There is no inheritance of data. A trait lists behavior, never fields, so `Sensor` cannot say "every sensor has a `t`". Each type keeps its own fields and writes its own methods. If two sensors share a lot of code, put that code in a default method that calls the required ones, or in a plain helper function.
:::

## Generic functions and trait bounds

Now write one function that works for *any* sensor. A **generic function** has a type parameter in angle brackets, and a **trait bound** says what that type must be able to do:

```rust
// (SensorError, Sensor, Gyro and Accel as defined above)

// 1. A generic function with a trait bound.
pub fn mean_static<S: Sensor>(s: &mut S, n: usize) -> [f64; 3] {
    let mut acc = [0.0f64; 3];
    for _ in 0..n {
        if let Ok(v) = s.read() {
            for i in 0..3 {
                acc[i] += v[i];
            }
        }
    }
    let k = n as f64;
    [acc[0] / k, acc[1] / k, acc[2] / k]
}

// 2. The same idea, written with impl Trait in argument position.
fn warm_up(s: &mut impl Sensor, n: usize) {
    for _ in 0..n {
        let _ = s.read();
    }
}

// 3. A where clause, for signatures with several bounds.
fn z_difference<A, B>(a: &mut A, b: &mut B) -> Option<f64>
where
    A: Sensor,
    B: Sensor,
{
    let za = a.read().ok()?[2];
    let zb = b.read().ok()?[2];
    Some(za - zb)
}
```

Read `<S: Sensor>` aloud as "for any type S that implements Sensor". Inside the function you may call only what the bound promises: `s.read()` and `s.name()`, nothing else. That is the deal. The caller can pass any type, and the compiler checks that the type keeps the promise.

**`impl Trait` in argument position**, as in `s: &mut impl Sensor`, means the same thing with less typing: "some type that implements Sensor; I will not bother naming it". Use it for short signatures.

A **where clause** moves the bounds after the signature, so a function with several type parameters stays readable. `A: Sensor, B: Sensor` says both must be sensors, and they may be *different* sensors. To require more than one trait of the same type, join them with `+`, as in `S: Sensor + std::fmt::Debug`.

`impl Trait` can also go in *return* position: `fn make_sensor() -> impl Sensor` means "this returns one particular type that implements Sensor, and callers only get to use the Sensor methods". You saw that form in the last module, returning closures with `impl Fn(f64) -> f64`.

::: key Traits, in one breath
A trait is a named set of methods. Required methods end in `;`; default methods have a body a type may override. `fn f<S: Sensor>(s: &mut S)`, `fn f(s: &mut impl Sensor)` and `fn f<S>(s: &mut S) where S: Sensor` all say the same thing: any type that implements `Sensor`.
:::

## Associated types versus generic parameters

A trait can carry a type inside it in two different ways, and choosing between them is a real design decision.

An **associated type** is a type slot the implementer fills in exactly once: `type Sample;`. You met one in `Iterator`, whose `type Item` says what `next` hands out. A **generic parameter** on the trait itself, as in `trait Update<M>`, lets one type implement the trait many times, once for each `M`.

The question to ask is: *for one implementing type, is there exactly one right answer, or several?*

::: example One sample type per instrument, many measurement types per filter
A barometer produces one kind of sample, a pressure. A star tracker produces one kind, an attitude quaternion. So "the sample type" is an associated type. But an altitude filter can accept several kinds of measurement, a GPS fix and a barometric altitude, each with its own trust weight. So "the measurement type" is a generic parameter.

```rust
// Associated type: each instrument has exactly ONE kind of sample.
trait Instrument {
    type Sample;
    fn sample(&mut self) -> Self::Sample;
}

struct Barometer;
impl Instrument for Barometer {
    type Sample = f64; // pressure in pascals
    fn sample(&mut self) -> f64 {
        101_325.0
    }
}

struct StarTracker;
impl Instrument for StarTracker {
    type Sample = [f64; 4]; // attitude quaternion
    fn sample(&mut self) -> [f64; 4] {
        [1.0, 0.0, 0.0, 0.0]
    }
}

// Generic parameter: one filter can accept MANY kinds of measurement.
trait Update<M> {
    fn update(&mut self, m: M);
}

struct GpsFix {
    alt_m: f64,
}
struct BaroAlt {
    alt_m: f64,
}

struct AltFilter {
    alt_m: f64,
}

impl Update<GpsFix> for AltFilter {
    fn update(&mut self, m: GpsFix) {
        self.alt_m += 0.8 * (m.alt_m - self.alt_m); // trust GPS a lot
    }
}

impl Update<BaroAlt> for AltFilter {
    fn update(&mut self, m: BaroAlt) {
        self.alt_m += 0.2 * (m.alt_m - self.alt_m); // trust the baro less
    }
}

fn main() {
    let p = Barometer.sample();
    let q = StarTracker.sample();
    println!("pressure {} Pa, attitude {:?}", p, q);

    let mut f = AltFilter { alt_m: 1000.0 };
    f.update(GpsFix { alt_m: 1010.0 });
    println!("after GPS:  {:.1} m", f.alt_m);
    f.update(BaroAlt { alt_m: 1004.0 });
    println!("after baro: {:.1} m", f.alt_m);
}
```

```text
pressure 101325 Pa, attitude [1.0, 0.0, 0.0, 0.0]
after GPS:  1008.0 m
after baro: 1007.2 m
```

Work the filter by hand. It starts at $1000.0\,\mathrm{m}$.

1. The GPS says $1010.0\,\mathrm{m}$. The gap is $1010 - 1000 = 10\,\mathrm{m}$. The filter moves $0.8$ of the way: $1000 + 0.8 \times 10 = 1008.0\,\mathrm{m}$.
2. The barometer says $1004.0\,\mathrm{m}$. The gap is $1004 - 1008 = -4\,\mathrm{m}$. The filter moves $0.2$ of the way: $1008 + 0.2 \times (-4) = 1008 - 0.8 = 1007.2\,\mathrm{m}$.

Sanity check: the estimate ends between the two measurements and closer to the GPS, the one it trusts more. That is what a blend like this should do.

Notice the call `f.update(...)`. It is the same method name both times, and the compiler picks the right implementation from the argument's type. That is the job generic parameters on a trait do well.

The two cases also fail differently. Try to give `Barometer` a second `Instrument` impl with `type Sample = f32` and the compiler refuses with E0119, "conflicting implementations of trait `Instrument` for type `Barometer`". One implementation per type is exactly what an associated type means.
:::

::: key Associated type or generic parameter?
Use an associated type when each implementing type has exactly one natural choice (an iterator's `Item`, a sensor's `Sample`); callers never have to name it. Use a generic parameter when one type should implement the trait several times for different types (`Update<GpsFix>` and `Update<BaroAlt>`, or the standard `From<T>`).
:::

## Blanket impls

A **blanket impl** implements a trait for every type that meets a bound, in one line. It is written with a generic on the `impl` itself:

```rust
// (SensorError, Sensor, Gyro, Accel and mean_static as defined above)

// 4. A blanket impl: every Sensor gets SelfTest automatically.
pub trait SelfTest {
    fn self_test(&mut self) -> bool;
}

impl<S: Sensor> SelfTest for S {
    fn self_test(&mut self) -> bool {
        (0..3).all(|_| self.read().is_ok())
    }
}

fn main() {
    let mut g = Gyro { t: 0.0, bias: [1e-3, -2e-3, 5e-4] };
    let mut a = Accel { t: 0.0, replies_left: 5 };
    warm_up(&mut g, 10);
    let m = mean_static(&mut a, 4);
    println!("accel mean z = {:.6} m/s^2", m[2]);
    println!("z difference = {:?}", z_difference(&mut g, &mut a));
    println!("gyro self test: {}", g.self_test());
    println!("accel self test: {}", a.self_test());
}
```

```text
accel mean z = -9.806648 m/s^2
z difference = Some(9.807145)
gyro self test: true
accel self test: false
```

Read `impl<S: Sensor> SelfTest for S` as "for every type S that is a Sensor, here is SelfTest". Neither `Gyro` nor `Accel` mentions `SelfTest`, yet both have it. And any sensor someone writes next year gets it too.

Follow the accelerometer's five replies to see why its self test fails. `mean_static` used four of them. `z_difference` used the fifth. The self test's first read then times out, so `all` returns `false`. The numbers check out as well: the four readings at $t = 0.001$ to $0.004$ average to $-9.80665 + 0.0000025 = -9.8066475$, printed as $-9.806648$. The z difference is the gyro's $0.0005$ minus the accelerometer's fifth reading, $-9.806645$, which gives $9.807145$.

The standard library leans on blanket impls. The one you use most is `impl<T: Display> ToString for T`: every type that can be printed with `{}` gets `.to_string()` for free. The next lesson shows another, which gives you `Into` whenever you write `From`.

## The orphan rule

Suppose you want `{}` to print a `Vec<f64>` of samples in a nice way. `Display` is the trait for `{}`. So you try:

```rust
use std::fmt;

impl fmt::Display for Vec<f64> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{} samples", self.len())
    }
}

fn main() {}
```

```text
error[E0117]: only traits defined in the current crate can be implemented for types defined outside of the crate
 --> src/main.rs:3:1
  |
3 | impl fmt::Display for Vec<f64> {
  | ^^^^^^^^^^^^^^^^^^^^^^--------
  |                       |
  |                       `Vec` is not defined in the current crate
  |
  = note: impl doesn't have any local type before any uncovered type parameters
  = note: for more information see https://doc.rust-lang.org/reference/items/implementations.html#orphan-rules
  = note: define and implement a trait or new type instead
```

This is the **orphan rule**: you may write `impl Trait for Type` only if the trait or the type (at least one of them) is defined in your own crate. Here `Display` belongs to the standard library, and so does `Vec`, so the impl would be an "orphan" with no home crate.

Why have the rule? Imagine two libraries you depend on each wrote their own `impl Display for Vec<f64>`. Your program would contain two different answers to "how do I print a `Vec<f64>`?", and the compiler would have no fair way to choose. The orphan rule makes that [[collision impossible|coherence]]: every pair of trait and type has at most one impl in the whole program, and it can only live in the crate that owns one of them.

The note in the error names the fix. Wrap the foreign type in a local one, a **[[newtype|newtype]]** — a struct with a single field whose only job is to be a new type:

```rust
use std::fmt;

struct Samples(Vec<f64>); // a local "newtype" wrapper

impl fmt::Display for Samples {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let mean = self.0.iter().sum::<f64>() / self.0.len() as f64;
        write!(f, "{} samples, mean {:.3}", self.0.len(), mean)
    }
}

fn main() {
    let s = Samples(vec![9.79, 9.81, 9.83, 9.80]);
    println!("{}", s);
}
```

```text
4 samples, mean 9.808
```

`Samples` is defined here, so the impl is allowed. `self.0` is the first (and only) field of the wrapper. The mean is $(9.79 + 9.81 + 9.83 + 9.80) / 4 = 39.23 / 4 = 9.8075$, printed to three decimals.

::: key The orphan rule
You can implement a trait for a type only if the trait or the type is defined in your crate. It guarantees that each (trait, type) pair has at most one implementation in a program. To add a foreign trait to a foreign type, wrap the type in a local newtype.
:::

## Static dispatch: one copy per type

Now the question from the start: when `mean_static` calls `s.read()`, how does the program find the right `read`?

With a generic function, the answer is settled before the program runs. The compiler writes a separate copy of `mean_static` for each type it is used with: one where `S` is `Gyro`, one where `S` is `Accel`. This is **monomorphization**, which you met with iterators in the last module. Inside the `Gyro` copy, `s.read()` is a direct call to `Gyro::read`, and the optimizer can **[[inline|inlining]]** it — paste the body of `read` right into the loop and optimize the two together. Choosing the function at compile time like this is **static dispatch**.

You can see the copies in a real binary. Build a program that calls `mean_static` with both sensors and `mean_dynamic` (below) with both, and list the function names in the debug build with the `nm` tool (GNU binutils 2.42):

```text
$ nm -C target/debug/t6 | grep mean_
0000000000016d20 t t6::mean_static
0000000000016f50 t t6::mean_static
0000000000017360 t t6::mean_dynamic
```

Two `mean_static` functions at two addresses, one per sensor type. One `mean_dynamic`, however many types use it.

The cost of static dispatch is size. Twenty sensor types means twenty copies. And the concrete type must be known at compile time: a `Vec<S>` holds only one kind of `S`.

## Dynamic dispatch: `dyn Trait` and fat pointers

The other answer is to decide while the program runs. Write the parameter as `&mut dyn Sensor`, read "a mutable reference to some sensor, type decided at runtime":

```rust
// (SensorError, Sensor, Gyro and Accel as defined above)

pub fn mean_dynamic(s: &mut dyn Sensor, n: usize) -> [f64; 3] {
    let mut acc = [0.0f64; 3];
    for _ in 0..n {
        if let Ok(v) = s.read() {
            for i in 0..3 {
                acc[i] += v[i];
            }
        }
    }
    let k = n as f64;
    [acc[0] / k, acc[1] / k, acc[2] / k]
}

fn main() {
    use std::mem::size_of;
    println!("&Gyro:           {} bytes", size_of::<&Gyro>());
    println!("&mut dyn Sensor: {} bytes", size_of::<&mut dyn Sensor>());
    println!("Box<dyn Sensor>: {} bytes", size_of::<Box<dyn Sensor>>());

    // A mixed list: only possible with dyn.
    let mut suite: Vec<Box<dyn Sensor>> = vec![
        Box::new(Gyro { t: 0.0, bias: [1e-3, -2e-3, 5e-4] }),
        Box::new(Accel { t: 0.0, replies_left: 100 }),
    ];
    for s in suite.iter_mut() {
        let m = mean_dynamic(s.as_mut(), 100);
        println!("{:>14}: z mean {:.6}", s.name(), m[2]);
    }
}
```

```text
&Gyro:           8 bytes
&mut dyn Sensor: 16 bytes
Box<dyn Sensor>: 16 bytes
          gyro: z mean 0.000500
unnamed sensor: z mean -9.806599
```

The sizes tell the story. A reference to a `Gyro` is one 8-byte address. A reference to `dyn Sensor` is 16 bytes: two addresses. It is a **[[fat pointer|fat-pointer]]** — a pointer that carries a second word of information alongside the address. For `dyn Trait`, the second word points at a **[[vtable|vtable]]** — a small table, one per type, holding the addresses of that type's trait methods (plus its size, alignment and drop function). A call `s.read()` becomes: load the vtable address from the fat pointer, load the `read` entry from the table, and jump there. That is an **indirect call**. The compiler usually cannot see which function it will reach, so it cannot inline it. Choosing the function at runtime like this is **dynamic dispatch**.

In exchange, you get something static dispatch cannot give: one list holding different types. `Vec<Box<dyn Sensor>>` holds a gyro and an accelerometer side by side, each in its own heap box (`Box`, from lesson 06), and the loop treats them alike. The accelerometer's mean works out as expected: over 100 readings the added term averages $0.001 \times 0.0505 = 0.0000505$, and $-9.80665 + 0.0000505 = -9.8065995$.

::: key impl Trait versus dyn Trait
impl Trait (or a generic parameter) is static dispatch: monomorphised, inlinable, one copy per type, and the concrete type is fixed at compile time. dyn Trait is a fat pointer with a vtable: one copy of the code, an indirect call, and heterogeneous collections become possible.
:::

::: warning Not every trait can be used as `dyn`
A vtable needs one fixed entry per method. A generic method, such as `fn log<T: Debug>(&mut self, value: T)`, would need a different entry for every possible `T`, so no table can be built. Use such a trait as `dyn` and you get E0038: "the trait `Logger` is not dyn compatible ... because method `log` has generic type parameters". Keep traits meant for `dyn` free of generic methods, or move those methods to a second trait.
:::

## Measuring the difference

The module's first exercise asks you to benchmark the two. Here is a minimal version. Put this `main` after the definitions of `Sensor`, `Accel`, `mean_static` and `mean_dynamic` above. The two functions have identical bodies; only the way `read` is found differs:

```rust
use std::hint::black_box;
use std::time::Instant;

fn main() {
    let n = 10_000_000;

    let mut a1 = Accel { t: 0.0, replies_left: u32::MAX };
    let t0 = Instant::now();
    let s = mean_static(black_box(&mut a1), n);
    let t_static = t0.elapsed();

    let mut a2 = Accel { t: 0.0, replies_left: u32::MAX };
    let t0 = Instant::now();
    let d = mean_dynamic(black_box(&mut a2 as &mut dyn Sensor), n);
    let t_dynamic = t0.elapsed();

    println!("static:  z = {:.7}  in {:.1?}", s[2], t_static);
    println!("dynamic: z = {:.7}  in {:.1?}", d[2], t_dynamic);
    println!("identical: {}", s == d);
}
```

`std::hint::[[black_box|black-box]]` hides a value from the optimizer. Without it, the compiler can see that the `dyn Sensor` is really an `Accel` and turn the indirect call back into a direct one, which would make the comparison meaningless.

::: example Ten million reads, two ways
Built with `cargo run --release` on a 2.1 GHz Intel Xeon, three runs gave:

```text
static:  z = -4.8066495  in 8.8ms
dynamic: z = -4.8066495  in 31.3ms
identical: true
static:  z = -4.8066495  in 8.6ms
dynamic: z = -4.8066495  in 31.0ms
identical: true
static:  z = -4.8066495  in 8.7ms
dynamic: z = -4.8066495  in 30.9ms
identical: true
```

First, the results are identical, as the exercise expects: same arithmetic in the same order, whichever way `read` was found. Check the value: the added term is $0.001\,t$, and over ten million readings $t$ averages $0.001 \times (10^7 + 1)/2 \approx 5000$, so the term averages about $5.0$ and the mean is $-9.80665 + 5.0000005 = -4.8066495$.

Now the time per call. Static: $8.7\,\mathrm{ms} / 10^7 = 0.87\,\mathrm{ns}$. Dynamic: $31.0\,\mathrm{ms} / 10^7 = 3.1\,\mathrm{ns}$. The dynamic version is about $31.0 / 8.7 \approx 3.6$ times slower here, because the tiny `read` could be inlined into the static loop and optimized with it, and could not be in the dynamic one.

Then swap in the `Gyro`, whose `read` computes a sine and a cosine. Three runs gave static times of 162.0, 141.2 and 141.7 ms and dynamic times of 150.0, 150.5 and 163.0 ms. The difference has vanished into run-to-run noise, because each call now spends about 14 ns doing real work, and an extra 2 ns of call overhead is lost in it.

The lesson from both: the cost of dynamic dispatch is a few nanoseconds per call plus the optimizations it blocks. It matters when the function called is tiny and called very often, and hardly at all otherwise. Numbers like these depend on the machine and the compiler, so measure your own code; lesson 11 shows the proper tool for it, `criterion`.
:::

So which should a 1 kHz control task use? When the set of sensor types is known when the software is built, which on a flight vehicle it nearly always is, prefer static dispatch through generics. Calls can inline, there is no vtable lookup, no heap box is needed, and the exact code that runs is fixed at compile time, which makes timing analysis easier. Reach for `dyn Trait` when you truly need one collection of mixed types, or a plugin that is only chosen at runtime, and the few nanoseconds do not matter. For a closed set that must still sit in one list, there is a third option: [[an enum with one variant per sensor|enum-dispatch]].

This is the same choice a C++ engineer makes. `dyn Trait` corresponds to a class with `virtual` functions, called through a base-class pointer. Generics correspond to templates, and to the **[[CRTP|crtp]]** pattern C++ uses to get interface-like code without virtual calls. One difference: a C++ object with virtual functions stores its vtable pointer *inside the object*, in every instance. A Rust value stores nothing extra; the vtable pointer travels in the fat pointer, and only when you ask for `dyn`.

::: note Why a generic call can be inlined and a `dyn` call usually cannot
Inlining needs the compiler to know, while compiling the caller, exactly which function body will run. In the `Gyro` copy of `mean_static`, the type `S` has been replaced by `Gyro`, so `s.read()` can only mean `Gyro::read`; the body is known, and can be pasted in. In `mean_dynamic`, the only thing known about `s` is that it has *some* vtable. Which one depends on what the caller passed, which may not be decided until the program runs, so the call must go through the table. Compilers do sometimes prove which type reaches a `dyn` call, and then turn it back into a direct call ("devirtualization"). That is exactly what `black_box` was there to prevent in the benchmark.
:::

## Check yourself

::: check
A trait has one method with a body and one without. Which one must every implementer write, and what happens to the other if an implementer does not mention it?
:::

::: answer
The method without a body (ending in `;`) is required: every `impl` must provide it, or the compiler reports it as missing. The method with a body is a default method. An implementer that does not mention it gets the default body. One that writes its own version replaces the default for that type only, as `Gyro` did with `name`.
:::

::: check
You are designing a trait `Codec` for turning telemetry packets into bytes. One packet type should only ever have one encoding. Should the byte format be an associated type or a generic parameter? What if one packet type must support both a compact and a verbose format?
:::

::: answer
With exactly one encoding per packet type, use an associated type, `type Output;`: each type fills it in once, and callers never have to name it. If one packet type must be encodable into several formats, use a generic parameter, `trait Codec<F>`, so the packet can have `impl Codec<Compact> for Packet` and `impl Codec<Verbose> for Packet` side by side. An associated type would allow only one of those; the second impl would be rejected with E0119.
:::

::: check
Which of these impls does the orphan rule allow in your crate, where `Quat` is your own type? (a) `impl Display for Quat` (b) `impl MyTrait for f64` (c) `impl Display for [f64; 4]` (d) `impl From<Quat> for [f64; 4]`
:::

::: answer
(a) Yes: the type is yours. (b) Yes: the trait is yours. (c) No: both `Display` and arrays belong to the standard library. Wrap the array in a newtype. (d) Yes. `From<Quat>` counts as a local trait for this purpose, because your type `Quat` appears as its parameter, and the rule looks for a local type in the impl. That is why you may write conversions from your own types into standard ones.
:::

::: check
What is stored in the 16 bytes of a `&dyn Sensor`, and why is a `&Gyro` only 8?
:::

::: answer
A `&dyn Sensor` is a fat pointer: 8 bytes for the address of the value, and 8 bytes for the address of the vtable for its concrete type, which lists that type's `read` and `name` functions (plus size, alignment and drop). A `&Gyro` needs no table, because the type is known at compile time, so the compiler already knows which `read` to call; it only needs the value's address.
:::

::: check
A teammate proposes `Vec<Box<dyn Sensor>>` for the six sensors of a 1 kHz attitude loop, "for flexibility". The six types are fixed at build time. What would you suggest, and why?
:::

::: answer
Prefer static dispatch. With a closed set known at compile time, generics (or a struct holding each sensor as its own concretely typed field, read by generic functions) let every `read` inline, avoid the vtable lookup, and avoid six heap allocations. The code that runs is fixed at compile time, which helps timing analysis. It is the same reasoning as choosing templates or CRTP over virtual functions in C++. The measured cost per call is only nanoseconds, so the main gains are the optimizations inlining allows and predictability, not raw call speed. `dyn` earns its place only if sensors must really be chosen at runtime.
:::

## Summary

| Idea | Meaning | Rust fact |
|---|---|---|
| Trait | A named set of methods | `trait Sensor { fn read(&mut self) -> ...; }` |
| Default method | A method with a body in the trait | Implementers get it free; may override |
| Trait bound | What a generic type must do | `<S: Sensor>`, `impl Sensor`, `where S: Sensor` |
| Associated type | One type per implementer | `type Sample;` as in `Iterator::Item` |
| Generic parameter on a trait | Many impls per type | `Update<GpsFix>`, `Update<BaroAlt>`, `From<T>` |
| Blanket impl | Impl for every type meeting a bound | `impl<S: Sensor> SelfTest for S` |
| Orphan rule | Trait or type must be local | E0117; fix with a newtype |
| Static dispatch | Chosen at compile time | Monomorphised, inlinable, one copy per type |
| Dynamic dispatch | Chosen at runtime | `dyn Trait`: 16-byte fat pointer, vtable, indirect call |
| Measured here | 10 million tiny reads | 8.7 ms static, 31 ms dynamic; identical results |

The standard library defines a set of traits that almost every Rust type implements: the operators `+` and `*`, conversions with `From` and `TryFrom`, printing with `Display` and `Debug`, and more. The next lesson goes through them, and shows how to give your own vector and unit types the same abilities.

::: context trait-word Where the word comes from
In everyday English a trait is a quality that marks someone out: patience, curiosity, a good memory. Rust uses the word the same way. A trait names an ability, and a type "has the trait" when it can do what the trait lists. Rust's traits are closest to the type classes of the Haskell language. A C++ engineer can think of a trait as a C++20 concept (a checked list of requirements) and an abstract interface rolled into one: the same trait can be used for compile-time generics or for runtime `dyn` calls.
:::

::: context default-methods Many methods from one
A default method may call the trait's required methods, even though it does not know which type it will run on. That is how `Iterator` works: `sum`, `map`, `filter`, `count` and the rest are all written in terms of `next`. Implement `next` for a type of your own, and every one of them works on it at once. The same trick serves the sensor trait: a default `read_n(&mut self, n)` could call `read` in a loop, and every sensor would have it. The next lesson implements `Iterator` for a type of its own and shows this in action.
:::

::: context coherence One answer per question
The property the orphan rule protects is called coherence: for any trait and any type, there is at most one implementation in the whole program. Without it, adding a new library could silently change what an existing line of code does, or break the build in a crate you never touched. The rule decides ownership in advance: an impl lives in the crate that owns the trait or the crate that owns the type, and nowhere else.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="12" width="120" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="34" font-size="12" text-anchor="middle" fill="#1f2a44">std: Display, Vec</text>
  <rect x="14" y="104" width="130" height="44" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="79" y="122" font-size="11" text-anchor="middle" fill="#b4232c">crate A: impl Display</text>
  <text x="79" y="138" font-size="11" text-anchor="middle" fill="#b4232c">for Vec&lt;f64&gt;</text>
  <rect x="216" y="104" width="130" height="44" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="281" y="122" font-size="11" text-anchor="middle" fill="#b4232c">crate B: impl Display</text>
  <text x="281" y="138" font-size="11" text-anchor="middle" fill="#b4232c">for Vec&lt;f64&gt;</text>
  <line x1="79" y1="104" x2="160" y2="50" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="281" y1="104" x2="200" y2="50" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="180" y="86" font-size="12" text-anchor="middle" fill="#1f2a44">which one wins?</text>
  <text x="180" y="102" font-size="11" text-anchor="middle" fill="#6c7a93">the rule forbids both</text>
</svg>
```
:::

::: context newtype A wrapper that costs nothing
A single-field struct is laid out exactly like its field, so `Samples` takes the same 24 bytes as the `Vec<f64>` inside it, and wrapping or unwrapping it compiles to nothing. Newtypes are used for two jobs. One is getting around the orphan rule, as here. The other is giving plain numbers a unit the compiler can check: `struct Meters(f64)` and `struct Feet(f64)` cannot be mixed up by accident. That is exactly the kind of error that lost NASA's Mars Climate Orbiter in 1999, when one team's software produced thruster data in pound-force seconds and another's expected newton-seconds. The next lesson builds unit types like this.
:::

::: context inlining Pasting a function into its caller
Inlining replaces a call with a copy of the called function's body. That saves the call itself, a few instructions, but the bigger win comes after: once the body sits inside the loop, the optimizer can treat the two as one piece of code, keep values in registers, and vectorize. A direct call can be inlined; a call through a vtable usually cannot, because the target is unknown until runtime.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">static</text>
  <rect x="10" y="28" width="160" height="54" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="90" y="48" font-size="11" text-anchor="middle" fill="#1f2a44">mean_static::&lt;Gyro&gt;</text>
  <text x="90" y="68" font-size="11" text-anchor="middle" fill="#1d6fd1">Gyro::read pasted in</text>
  <rect x="10" y="98" width="160" height="54" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="90" y="118" font-size="11" text-anchor="middle" fill="#1f2a44">mean_static::&lt;Accel&gt;</text>
  <text x="90" y="138" font-size="11" text-anchor="middle" fill="#1d6fd1">Accel::read pasted in</text>
  <text x="270" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">dynamic</text>
  <rect x="200" y="28" width="140" height="34" fill="#f2b880" stroke="#1f2a44"/>
  <text x="270" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">mean_dynamic (one copy)</text>
  <line x1="270" y1="62" x2="270" y2="78" stroke="#b4232c" stroke-width="2"/>
  <rect x="220" y="80" width="100" height="24" fill="#fff" stroke="#b4232c"/>
  <text x="270" y="97" font-size="11" text-anchor="middle" fill="#b4232c">vtable lookup</text>
  <line x1="250" y1="104" x2="225" y2="126" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="290" y1="104" x2="315" y2="126" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="225" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">Gyro::read</text>
  <text x="315" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">Accel::read</text>
</svg>
```
:::

::: context fat-pointer Pointers that carry a second word
You have used fat pointers since lesson 02 without the name. A slice reference `&[f64]` is 16 bytes on a 64-bit machine: the address of the first element plus the length, so bounds checks know where to stop. A `&str` is the same. A `&dyn Trait` uses its second word for the vtable address instead of a length. In both cases the extra word carries what the type alone cannot say: how many elements, or which concrete type. A plain `&f64` or `&Gyro` needs neither, so it stays one word.
:::

::: context vtable A table of function addresses
A vtable ("virtual method table", a name that comes from C++) is built by the compiler once for each pair of concrete type and trait, and stored with the program's constant data. In today's compiler it starts with the type's drop function, its size and its alignment, followed by one entry per trait method. The exact layout is not a stable promise, so no code should rely on it. A `&mut dyn Sensor` is the pair of addresses on the left:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="20" y="20" font-size="12" fill="#1f2a44">&amp;mut dyn Sensor (16 bytes)</text>
  <rect x="20" y="30" width="110" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="75" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">data ptr</text>
  <rect x="20" y="60" width="110" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="75" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">vtable ptr</text>
  <rect x="210" y="22" width="130" height="30" fill="#fff" stroke="#1f2a44"/>
  <text x="275" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">Gyro { t, bias }</text>
  <rect x="210" y="84" width="130" height="104" fill="#fff" stroke="#1f2a44"/>
  <g font-size="11" fill="#1f2a44">
    <text x="220" y="102">drop</text>
    <text x="220" y="122">size = 32</text>
    <text x="220" y="142">align = 8</text>
    <text x="220" y="162">read: Gyro::read</text>
    <text x="220" y="182">name: Gyro::name</text>
  </g>
  <line x1="130" y1="45" x2="204" y2="38" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="210,37 200,33 201,43" fill="#1d6fd1"/>
  <line x1="130" y1="75" x2="204" y2="98" stroke="#b4232c" stroke-width="2"/>
  <polygon points="210,100 199,101 202,92" fill="#b4232c"/>
</svg>
```

The size of 32 bytes is a `Gyro`'s one `f64` plus its three-element bias array: $8 + 3 \times 8 = 32$.
:::

::: context black-box Hiding a value from the optimizer
`std::hint::black_box` returns its argument unchanged, but the optimizer has to assume anything might have happened to it on the way through. It became part of stable Rust in version 1.66. Benchmarks use it to stop the compiler from computing an answer ahead of time, deleting work whose result is unused, or, as here, discovering the concrete type behind a `dyn` and calling it directly. The documentation describes it as a best-effort hint rather than a guarantee, which is one more reason to look at a benchmark's numbers with a skeptical eye.
:::

::: context enum-dispatch A closed set in one list, without dyn
Write `enum AnySensor { Gyro(Gyro), Accel(Accel) }` and implement `Sensor` for it with a `match` that forwards `read` to whichever sensor is inside. A `Vec<AnySensor>` then holds mixed sensors with no heap boxes and no vtable. The `match` is an ordinary branch, and each arm is a direct call that can be inlined. Adding a sensor type means adding a variant, and the compiler's exhaustiveness check (from the last module) points at every `match` that must handle it. For a set of types fixed when the software is built, this is often the best of both worlds.
:::

::: context crtp The C++ trick for static interfaces
CRTP stands for "curiously recurring template pattern": a class derives from a template instantiated with the class itself, as in `struct Gyro : SensorBase<Gyro>`. Inside `SensorBase`, code can call `static_cast<Derived*>(this)->read()`, which the compiler resolves at compile time, so no virtual call and no vtable pointer are needed. It gives C++ the static dispatch that Rust generics provide directly. C++20 concepts add the other half, a named, checked list of requirements, which is close to what a trait bound does.
:::
