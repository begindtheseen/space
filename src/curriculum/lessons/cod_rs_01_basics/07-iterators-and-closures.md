---
id: l07-iterators-and-closures
title: Iterators and closures
minutes: 25
covers:
  - Iterators and adapters and their zero-cost nature
  - 'Closures: Fn, FnMut, FnOnce'
---

Think of a ticket dispenser at a deli counter. You press the button and it hands you one ticket. Press again, you get the next one. When the roll runs out, pressing the button gets you nothing, and you know you are done. You never see the whole roll at once, and you do not need to.

Now picture a factory conveyor belt. Parts come off the dispenser one at a time and roll past a few stations. One station paints each part. One throws away the dented ones. At the end of the belt, a worker counts or boxes what arrives. Nothing moves until that last worker pulls the next part toward them.

Rust's **[[iterators|iterator-word]]** are the dispenser, and its **adapters** are the stations on the belt. The little instructions you hand to each station — "paint it blue", "throw away anything above 1200 m" — are **closures**: short functions you write right where you need them, which can remember values from around them. On a flight-software or ground-tools team you use all three constantly: to scan a telemetry log, to compute a rate from neighboring samples, to sort thrusters by health, to hand a callback to a scheduler. This lesson shows how they work, why a long chain of them runs as fast as a loop you wrote by hand, and what the three closure traits `Fn`, `FnMut` and `FnOnce` mean.

## An iterator is anything with a `next` button

An **iterator** is a value that hands out items one at a time. In Rust, "being an iterator" means having one method, `next`. Here is the heart of the standard library's definition (a fragment, not a whole program):

```rust
trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}
```

Read it line by line. A **trait** is a list of abilities a type can promise to have — you will meet traits properly in the next module. `type Item;` says every iterator names the kind of thing it hands out; this is an **[[associated type|associated-type]]**. Then `next` takes `&mut self` ("ampersand mut self", a mutable borrow of the iterator, because pressing the button changes where it is in the roll) and returns an `Option` of an item.

You met `Option` in the last lesson. `Some(item)` means "here is the next ticket". `None` means "the roll is empty". That is the whole protocol.

```rust
fn main() {
    let burns = [12.0, 8.5, 3.0];
    let mut it = burns.iter();
    println!("{:?}", it.next());
    println!("{:?}", it.next());
    println!("{:?}", it.next());
    println!("{:?}", it.next());
}
```

```text
Some(12.0)
Some(8.5)
Some(3.0)
None
```

`burns.iter()` makes an iterator over the array. Each call to `next` moves it along by one. The fourth call has nothing left to give, so it returns `None`.

### The `for` loop is an iterator in disguise

You have been using iterators since lesson 03 without seeing them. A `for` loop is **[[syntactic sugar|syntactic-sugar]]** for a `while let` that calls `next` until it gets `None`. These two fragments do the same thing:

```rust
for b in burns.iter() {
    println!("{b}");
}

let mut it = burns.iter();
while let Some(b) = it.next() {
    println!("{b}");
}
```

### Three ways to walk a collection

A collection like a `Vec` or an array can give you three kinds of iterator. The difference is what each item is:

- `v.iter()` hands out `&T` — a shared borrow of each element. You can look but not change. This is the one you use most.
- `v.iter_mut()` hands out `&mut T` — a mutable borrow, so you can change each element in place.
- `v.into_iter()` hands out `T` — the elements themselves. The collection is used up; after the loop it is gone.

```rust
let mut temps_c = [21.5, 22.0, 19.5];
for t in temps_c.iter_mut() {
    *t += 273.15; // the * reaches through the borrow to the number itself
}
// temps_c is now [294.65, 295.15, 292.65], in kelvin
```

Who owns what, and why `into_iter` uses the collection up, is the whole subject of the next module. For now, reach for `iter()` unless you need one of the other two.

## Adapters and consumers

An **adapter** is a method that takes an iterator and returns a new iterator that does a bit more work. It is a station on the belt. A **consumer** is a method that actually pulls items through and produces a final answer. It is the worker at the end.

Adapters you will use every week:

- `map(f)` — run `f` on each item and pass on the result.
- `filter(f)` — pass on only the items for which `f` says `true`.
- `enumerate()` — pair each item with its position: `(0, a)`, `(1, b)`, …
- `zip(other)` — walk two iterators side by side, making pairs.
- `take(n)` and `skip(n)` — keep only the first `n`, or drop the first `n`.
- `rev()` — go backwards.
- `copied()` — turn `&f64` items into plain `f64` copies, which are easier to work with.

Consumers you will use every week:

- `sum()` and `count()`.
- `collect()` — gather the items into a collection, such as a `Vec`.
- `fold(start, f)` — carry a running value through every item.
- `any(f)`, `all(f)` — is it true for at least one item, or for every item?
- `position(f)` — the index of the first item for which `f` is true, as an `Option`.
- `min()`, `max()` — the smallest or largest item, as an `Option`.

A slice also has a handy method, `windows(n)`, which gives you every run of `n` neighbors: for `[a, b, c, d]` and `n = 2` it gives `[a, b]`, `[b, c]`, `[c, d]`. It is exactly what you need to compare each sample with the one after it — a **[[sliding window|sliding-window]]**.

### Adapters are lazy

Here is the rule that surprises people. An adapter on its own does nothing at all. It only builds the belt. Nothing moves until a consumer pulls.

```rust
fn main() {
    let v = vec![1, 2, 3];
    v.iter().map(|x| {
        println!("looking at {x}");
        x * 10
    });
    println!("done");
}
```

This program prints only `done`. The compiler even warns you (rustc 1.94.1, output trimmed):

```text
warning: unused `Map` that must be used
 --> examples/lazy.rs:3:5
  |
  = note: iterators are lazy and do nothing unless consumed
```

Being **lazy** — doing work only when asked — is not a flaw. It means a chain can stop early. `(1..).map(|n| n * n).take(3)` starts from an endless range of numbers, yet `collect` gives `[1, 4, 9]` and stops, because `take(3)` never asks for a fourth. Each item travels the whole belt before the next one starts, so no hidden temporary lists are built between stations. The consumer at the end is [[pulling items through|pull-model]], one at a time.

::: example A descent rate from an altitude log
A lander's altimeter logs its height above the pad once per second: 1200, 1130, 1062, 9999, 931 and 868 m. The 9999 is a glitch — a bad reading. You want the descent rate, in meters per second, between each pair of good samples.

A first try: throw out the glitch, then compare neighbors.

```rust
fn main() {
    // Altitude above the pad in metres, one sample per second.
    let alt_m = [1200.0, 1130.0, 1062.0, 9999.0, 931.0, 868.0];

    // Throw away the glitch: a real reading can't be above the first one.
    let clean: Vec<f64> = alt_m.iter().copied().filter(|&h| h <= alt_m[0]).collect();

    // Descent rate for each pair of neighbours (metres per second).
    let rates: Vec<f64> = clean.windows(2).map(|w| w[0] - w[1]).collect();

    let mean = rates.iter().sum::<f64>() / rates.len() as f64;
    let fastest = rates.iter().copied().fold(f64::MIN, f64::max);

    println!("clean   = {:?}", clean);
    println!("rates   = {:?}", rates);
    println!("mean    = {:.2} m/s", mean);
    println!("fastest = {:.1} m/s", fastest);
}
```

```text
clean   = [1200.0, 1130.0, 1062.0, 931.0, 868.0]
rates   = [70.0, 68.0, 131.0, 63.0]
mean    = 83.00 m/s
fastest = 131.0 m/s
```

Read the chain aloud. Walk the altitudes, copy each one out, keep only those at or below 1200 m, collect them. Then slide a window of two, subtract, collect.

Now check that it makes sense. The rates go 70, 68, then suddenly 131, then 63. A lander slowing down does not suddenly double its speed for one second. What happened? The filter removed the sample at 3 s, so 1062 m (at 2 s) and 931 m (at 4 s) became neighbors. They are two seconds apart, not one: $1062 - 931 = 131\,\mathrm{m}$ in $2\,\mathrm{s}$ is $65.5\,\mathrm{m/s}$.

The fix is to keep each sample's time stamp with it before filtering. `enumerate` gives the index, which is the time in seconds:

```rust
let clean: Vec<(f64, f64)> = alt_m
    .iter()
    .enumerate()
    .map(|(i, &h)| (i as f64, h))
    .filter(|&(_, h)| h <= alt_m[0])
    .collect();

// Rate = drop in height / time between the two samples.
let rates: Vec<f64> = clean
    .windows(2)
    .map(|w| (w[0].1 - w[1].1) / (w[1].0 - w[0].0))
    .collect();
```

```text
rates = [70.0, 68.0, 65.5, 63.0]
mean  = 66.625 m/s
```

Now the rates fall steadily — 70, 68, 65.5, 63 — the way a lander braking with its engine should. The mean is $(70 + 68 + 65.5 + 63) / 4 = 66.625\,\mathrm{m/s}$, not 83. The iterator code was never wrong; the physics was. Always sanity-check the numbers a chain gives you.
:::

::: warning Floats have no plain `max`
`rates.iter().max()` does not compile when the items are `f64`. The error is ``the trait `Ord` is not implemented for `f64` ``. `Ord` means "any two values can be put in order", and floats break that promise because of NaN ("not a number"), which is neither bigger nor smaller than anything. Use `fold(f64::MIN, f64::max)`, as the example did, or `max_by(|a, b| a.total_cmp(b))`, which uses a fixed ordering that even places NaN.
:::

### Collecting results that can fail

`collect` is smarter than it looks. If each item is a `Result`, you can collect into a `Result<Vec<_>, _>`. You get `Ok` with the whole list if every item was `Ok`, or the first `Err` if any failed:

```rust
let good: Result<Vec<f64>, _> = ["1.5", "2.25", "4"].iter().map(|s| s.parse::<f64>()).collect();
let bad: Result<Vec<f64>, _> = ["1.5", "two", "4"].iter().map(|s| s.parse::<f64>()).collect();
// good = Ok([1.5, 2.25, 4.0])
// bad  = Err(ParseFloatError { kind: Invalid })
```

That is how you would parse a whole column of numbers from a ground-station file, with the error handling of the last lesson built in.

## Why the chain costs nothing

A reasonable worry: all these stations, closures and `Option`s must cost something. In C or old C++, a call through a function pointer for every element is real overhead. So is a chain of iterators slower than a plain loop?

In an optimized build, no. Two compiler steps make the stations disappear.

The first is **[[monomorphization|monomorphization]]**: turning generic code into a separate, concrete copy for each type it is used with. Every closure in Rust has its own unique type, and `map` is generic over that type. So `v.iter().map(|x| 0.5 * x * x)` is not "map with some function"; it is a brand-new type, a `Map` of a slice iterator over `f64` with this one closure inside. The compiler writes code for exactly that combination, the same way a C++ template is stamped out for each type you use it with.

The second is **[[inlining|inlining]]**: pasting the body of a small function directly where it is called, instead of jumping to it. Because the compiler knows exactly which closure and which `next` are involved, it pastes them all into one function. What is left is an ordinary loop, and the optimizer treats it like any loop you wrote yourself. Often it does better: a slice iterator knows it cannot run past the end, so the bounds checks an index loop might need are gone.

::: key Are Rust iterators actually zero cost?
In practice yes: adapter chains monomorphise and inline into the same loop a hand-written version would produce, often with bounds checks eliminated. Verify with a benchmark or Compiler Explorer rather than taking it on faith.
:::

::: key The mechanism
Generics monomorphise (one concrete copy per closure and item type) and the adapters inline, so the abstraction is gone before the optimizer even starts. It is the same reason C++ templates can be zero overhead.
:::

::: example Checking the claim instead of trusting it
Here are two functions that add up $\tfrac12 v^2$ — kinetic energy per kilogram — over a list of speed samples. One is a hand-written index loop. One is an iterator chain.

```rust
/// Kinetic energy per kilogram, summed over samples: a hand-written loop.
#[inline(never)]
pub fn energy_loop(v: &[f64]) -> f64 {
    let mut total = 0.0;
    let mut i = 0;
    while i < v.len() {
        total += 0.5 * v[i] * v[i];
        i += 1;
    }
    total
}

/// The same thing as an iterator chain.
#[inline(never)]
pub fn energy_iter(v: &[f64]) -> f64 {
    v.iter().map(|x| 0.5 * x * x).fold(0.0, |acc, e| acc + e)
}
```

`#[inline(never)]` stops the compiler from folding these two into their callers, so each one stays a separate function you can inspect. (`fold(0.0, …)` is used instead of `sum()` so that both versions start from exactly the same `0.0` and the comparison is fair.)

**Step 1: read the machine code.** Ask the compiler for **[[assembly|assembly-language]]** with full optimization:

```text
rustc --edition 2024 --crate-type=lib -C opt-level=3 -C codegen-units=1 --emit asm -o out.s src/lib.rs
```

With rustc 1.94.1 on x86-64, each function comes out as 53 instructions. After renaming the internal jump labels, the two bodies are identical, line for line. Neither contains a single call to a panic routine, so the index loop's bounds check on `v[i]` was removed too. Both handle four samples per trip around the loop (the optimizer "unrolled" it), with ten `mulsd` (multiply) and five `addsd` (add) instructions in all.

**Step 2: time it.** A small program calls each function on 10 million samples and prints the time, first in a debug build and then with `--release`:

```text
DEBUG
loop  37.46ms  iter  80.56ms  same answer: true
RELEASE
loop  13.25ms  iter  12.47ms  same answer: true
```

In the release build the two are within the noise of each other, as the identical assembly promised. The loop got about $37.5/13.3 \approx 2.8$ times faster than in debug, and the iterator version about $80.6/12.5 \approx 6.4$ times faster.

**Sanity check.** The debug build tells the other half of the story: with no optimization, nothing was inlined, and every `map` and `next` was a real function call, so the iterator version took about twice as long as the loop. Zero cost is something the optimizer delivers. It is not a property of the source code.
:::

::: warning "Zero cost" does not mean "free"
It means "no slower than the best loop you would have written by hand". The work of the loop is still there. And it holds only in optimized builds: a debug build of iterator-heavy code can be several times slower than release. Never judge speed from `cargo run` without `--release`, and when speed matters, measure — with a benchmark, or by reading the assembly on [[Compiler Explorer|compiler-explorer]].
:::

## Closures: small functions that remember

A **closure** is a function with no name that you write inline, and that can use variables from the place where it was written. The syntax puts the parameters between two vertical bars, called "pipes":

```rust
let gain = 0.8;
let scale = |x: f64| gain * x;
println!("{}", scale(10.0)); // 8
```

Read `|x: f64| gain * x` as "a closure taking x, returning gain times x". The types of the parameter and the result can usually be left out, because the compiler works them out from how the closure is used. For more than one line, put the body in braces: `|x| { let y = x * 2.0; y + 1.0 }`.

The interesting part is `gain`. It is not a parameter. It lives outside the closure, yet the closure uses it. The closure has **captured** it — packed a reference to it into its own little backpack. That is where the name comes from: the function [[closes over|closure-word]] its surroundings.

If you know C++ lambdas, this is the same idea, with one difference. In C++ you write the capture list yourself, `[gain](double x) { return gain * x; }`. In Rust the compiler looks at what the body does with each variable and picks the lightest capture that works: a shared borrow if the closure only reads it, a mutable borrow if it changes it, and taking ownership if it has to give it away.

### Passing and returning closures

Because every closure has its own unnamed type, a function that accepts one is generic: "any type `F` that can be called like a function taking an `f64` and returning an `f64`". You write that as `F: Fn(f64) -> f64`. A function can also return a closure with `impl Fn(f64) -> f64`, "some closure type; I won't name it":

```rust
fn make_limiter(max: f64) -> impl Fn(f64) -> f64 {
    move |x| x.clamp(-max, max)
}

fn main() {
    // A closure factory: each limiter remembers its own max.
    let fin_limit = make_limiter(15.0); // fin deflection, degrees
    let gimbal_limit = make_limiter(5.0); // engine gimbal, degrees
    let commands = [3.0, -22.0, 8.0];
    let fins: Vec<f64> = commands.iter().map(|&c| fin_limit(c)).collect();
    let gimbal: Vec<f64> = commands.iter().map(|&c| gimbal_limit(c)).collect();
    println!("fins   = {:?}", fins);
    println!("gimbal = {:?}", gimbal);
}
```

```text
fins   = [3.0, -15.0, 8.0]
gimbal = [3.0, -5.0, 5.0]
```

The keyword **`move`** in front of the pipes tells the closure to take ownership of what it captures instead of borrowing it. It is needed here because `max` belongs to `make_limiter`, which ends as soon as it returns. A borrow of `max` would point at something that no longer exists, so the closure must carry its own copy. Each limiter now carries its own `max`: 15 degrees for the fins, 5 for the engine gimbal.

## `Fn`, `FnMut` and `FnOnce`

Picture a library book. You can read it — and so can anyone else, as often as you like. You can write notes in its margins — but only if nobody else is holding it at the same time. Or you can give it away — and then it is gone; you cannot give it away twice.

Closures sort into three families in exactly this way, by what they do with what they captured. Each family is a trait:

- **`Fn`** — only reads its captures. It can be called any number of times, even from several places at once.
- **`FnMut`** — changes its captures. It can be called many times, but whoever calls it needs exclusive (`mut`) access to it.
- **`FnOnce`** — gives its captures away (moves them out). After one call they are gone, so it can be called only once.

```rust
fn apply_twice<F: Fn(f64) -> f64>(f: F, x: f64) -> f64 {
    f(f(x))
}

fn call_three_times<F: FnMut()>(mut f: F) {
    f();
    f();
    f();
}

fn run_once<F: FnOnce() -> Vec<String>>(f: F) -> Vec<String> {
    f()
}

fn main() {
    // Fn: reads its capture, can be called again and again.
    let gain = 0.8;
    let scale = |x: f64| gain * x;
    println!("scale(10.0)         = {}", scale(10.0));
    println!("apply_twice(scale)  = {}", apply_twice(scale, 10.0));

    // FnMut: changes its capture, so it needs exclusive access.
    let mut ticks = 0;
    let tick = || ticks += 1;
    call_three_times(tick);
    println!("ticks               = {}", ticks);

    // FnOnce: gives away the thing it captured, so it can only run once.
    let log = vec![String::from("MECO"), String::from("STAGE SEP")];
    let hand_over = move || log;
    let received = run_once(hand_over);
    println!("received            = {:?}", received);
}
```

```text
scale(10.0)         = 8
apply_twice(scale)  = 6.4
ticks               = 3
received            = ["MECO", "STAGE SEP"]
```

`apply_twice` scales 10 to 8, then 8 to 6.4. The counter is bumped three times. The last closure returns its `Vec` of event names — it hands the log over — so running it a second time would have nothing to return.

::: key Fn, FnMut, FnOnce
Three closure traits by how they capture: Fn borrows immutably and can be called repeatedly, FnMut borrows mutably, FnOnce consumes the captures and can be called once. The compiler infers the most permissive one that works.
:::

"Most permissive" means the one that lets the closure be used in the most places. The families nest like [[rungs on a ladder|closure-trait-ladder]]. Every `Fn` closure can also be used where an `FnMut` is asked for (reading is a harmless kind of changing nothing), and every `FnMut` can be used where an `FnOnce` is asked for (anything you can call many times you can certainly call once). So the compiler makes a closure `Fn` whenever the body allows, `FnMut` if the body changes something, and only `FnOnce` if the body gives something away.

Seen from the other side, a function that *accepts* a closure should ask for the least it needs. `Iterator::map` asks for `FnMut`, so you can keep a running counter inside a `map` if you must. A function that calls its argument exactly once, like starting a new thread, asks for `FnOnce`, which accepts every closure.

### What the compiler says when the family is wrong

Pass a counting closure to a function that demands `Fn`, and the compiler stops you and names the fix:

```text
error[E0594]: cannot assign to `ticks`, as it is a captured variable in a `Fn` closure
 --> examples/err_fn.rs:8:19
  |
1 | fn call_twice<F: Fn()>(f: F) {
  |                           - change this to accept `FnMut` instead of `Fn`
...
8 |     call_twice(|| ticks += 1);
  |     ---------- -- ^^^^^^^^^^ cannot assign
  |     |          |
  |     |          in this closure
  |     expects `Fn` instead of `FnMut`
```

Call the log-handing closure twice, and you get (trimmed):

```text
error[E0382]: use of moved value: `hand_over`
note: closure cannot be invoked more than once because it moves the variable `log` out of its environment
```

Both are mistakes that in C++ would compile and then misbehave: two threads bumping the same counter, or a buffer read after it was moved away. Here they never reach a test stand.

::: warning `move` does not make a closure `FnOnce`
`move` decides how values get *into* the closure: by ownership instead of by borrow. The family depends on what the body does with them *afterwards*. `make_limiter` returned a `move` closure that is still `Fn` — it only reads its `max`, so it can be called a thousand times. A closure is `FnOnce` only when its body gives a captured value away, as `hand_over` did.
:::

On a real vehicle's software these show up everywhere. A sort that orders thrusters by remaining propellant takes an `FnMut` comparison. A filter that scans telemetry for out-of-limit pressures takes a closure. A scheduler that runs a task every 10 ms stores `FnMut` callbacks, because tasks keep state between runs. And handing work to a [[new thread|threads-bridge]] takes an `FnOnce`, because the work, and everything it captured, moves to the thread for good.

## Check yourself

::: check
Without running it, say what this prints, and say which methods are adapters and which one is the consumer: `let total: i32 = (1..=5).filter(|n| n % 2 == 1).map(|n| n * n).sum();` then `println!("{total}");`. What would happen if you deleted `.sum()` and the type annotation?
:::

::: answer
`1..=5` gives 1, 2, 3, 4, 5. `filter` keeps the odd ones: 1, 3, 5. `map` squares them: 1, 9, 25. `sum` adds them: $1 + 9 + 25 = 35$. It prints `35`.

`filter` and `map` are adapters: each returns a new iterator and does no work on its own. `sum` is the consumer that pulls the items through.

Without `.sum()`, `total` would be an unconsumed iterator. No filtering or squaring would ever happen, and printing it with `{}` would not even compile, because an iterator is not a number and does not know how to display itself.
:::

::: check
Classify each closure as `Fn`, `FnMut` or `FnOnce` and say why: (a) `|x: f64| x * k` where `k` is a nearby `f64`; (b) `|| count += 1` where `count` is a nearby `mut` integer; (c) `move || buffer` where `buffer` is a nearby `Vec<u8>`; (d) `move |x: f64| x * k`.
:::

::: answer
(a) `Fn`: it only reads `k`.

(b) `FnMut`: it changes `count`, so each call needs exclusive access.

(c) `FnOnce`: calling it returns `buffer`, handing the vector away. A second call would have nothing to return.

(d) `Fn`: `move` makes it own its copy of `k`, but the body only reads that copy. `move` controls how captures get in, not which family the closure belongs to.
:::

::: check
A teammate replaces `for i in 0..p.len() { if p[i] > 200.0 { n += 1; } }` with an iterator chain and asks whether it will slow down the 1 kHz telemetry monitor. Write the chain, and give a two-sentence answer about speed, including the one situation where it really would be slower.
:::

::: answer
`let n = p.iter().copied().filter(|&x| x > 200.0).count();` — for `[101.2, 99.8, 240.0, 100.4, 251.3]` it gives 2.

In an optimized build the chain is monomorphised for this one closure and inlined into a plain loop, so it compiles to the same machine code as the index loop, usually without bounds checks. It would be slower only in an unoptimized debug build, where every `next` and closure call stays a real function call — which is why speed is always judged with `--release` and confirmed with a benchmark or the assembly.
:::

::: check
Why does `readings.iter().max()` fail to compile for a slice of `f64`, when it works for a slice of `i32`? Give two ways to get the largest reading.
:::

::: answer
`max` needs the items to be `Ord`: any two values must have a definite order. Integers have one. Floats do not, because NaN compares as neither smaller, equal nor larger than anything, so `f64` implements only the weaker `PartialOrd`.

Two fixes: `readings.iter().copied().fold(f64::MIN, f64::max)`, which starts below every real reading and keeps the larger at each step; or `readings.iter().copied().max_by(|a, b| a.total_cmp(b))`, which uses a complete ordering that gives NaN a fixed place. `max_by` returns an `Option`, which is `None` for an empty slice.
:::

::: check
`make_limiter` in the lesson begins its closure with `move`. Explain what would go wrong without it, in terms of where `max` lives.
:::

::: answer
`max` is a parameter of `make_limiter`, so it lives only while `make_limiter` is running. Without `move`, the closure would borrow `max` — hold a reference to it — because it only reads it. But the closure is returned and used after `make_limiter` has ended, when `max` no longer exists. That reference would point at nothing. Rust refuses to compile it and suggests adding `move`, which makes the closure carry its own copy of `max` in its backpack.
:::

## Summary

| Idea | Meaning | Fact to keep |
| --- | --- | --- |
| Iterator | a value with `next(&mut self) -> Option<Item>` | `Some(item)` until empty, then `None` |
| `iter`, `iter_mut`, `into_iter` | items are `&T`, `&mut T`, `T` | `for` loops call `next` for you |
| Adapter | iterator in, iterator out: `map`, `filter`, `enumerate`, `zip`, `take`, `windows` on slices | lazy: does nothing until consumed |
| Consumer | pulls items through: `sum`, `count`, `collect`, `fold`, `any`, `position` | `collect` can build a `Result<Vec<_>, _>` |
| Zero cost | chain compiles to the hand-written loop | monomorphisation plus inlining, in optimized builds only |
| Closure | an unnamed inline function that captures its surroundings | written between pipes; each has its own type |
| `move` | capture by ownership instead of by borrow | does not decide the closure's family |
| `Fn` / `FnMut` / `FnOnce` | reads / changes / gives away its captures | compiler picks the most permissive that works |

The next lesson turns to the tools that surround everyday Rust: `derive` to have the compiler write routine code for you, `cfg` to include code only in some builds (including the test module every library carries), doc tests that keep examples honest, and clippy, which will point out every place in your first Rust that still reads like C++.

::: context iterator-word Where "iterate" comes from
"Iterate" comes from the Latin *iterum*, "again". To iterate is to do something again and again, and an iterator is the thing that does it for you. Python uses the same word, and its protocol is almost the same as Rust's: Python's `__next__` hands out the next item and raises `StopIteration` at the end, where Rust's `next` returns `None`. In C++, an "iterator" means something a bit different — a pointer-like position that you compare against an `end()` position yourself. Rust's version carries its own "am I done?" answer, which is why it is hard to run past the end.
:::

::: context associated-type A type that belongs to a trait
`type Item;` inside the trait says: "every iterator must say what kind of item it hands out". An iterator over a `[f64]` fills this in as `&f64`. A range like `1..=5` fills it in as `i32`. Because each iterator has exactly one item type, the compiler always knows what `next` returns, and you never have to write it. You will see associated types again in the next module, where they are compared with the other way of putting a type inside a trait, a generic parameter.
:::

::: context syntactic-sugar Sweeter to write, same underneath
Programmers call a shorter way of writing something that the compiler rewrites into a longer form **syntactic sugar**: it makes the code nicer to read without adding any new ability. The `for` loop is sugar over `IntoIterator::into_iter` plus repeated calls to `next`. The `?` operator from the last lesson is sugar over a `match` that returns early. Knowing what the sugar turns into is how you understand the error messages it can produce.
:::

::: context sliding-window A window sliding along the samples
`windows(2)` looks at the data through a frame two items wide, then slides the frame one step and looks again. Six samples give five windows; in general, $n$ samples give $n - 1$ windows of size 2. Each window is a small slice borrowed from the original data, so nothing is copied. The same idea with a wider window gives a moving average, a common way to smooth a noisy sensor.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="30" y="40" width="50" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="55" y="60">1200</text>
    <rect x="80" y="40" width="50" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="105" y="60">1130</text>
    <rect x="130" y="40" width="50" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="155" y="60">1062</text>
    <rect x="180" y="40" width="50" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="205" y="60">931</text>
    <rect x="230" y="40" width="50" height="30" fill="#ffffff" stroke="#1f2a44"/><text x="255" y="60">868</text>
  </g>
  <rect x="26" y="34" width="108" height="42" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <rect x="126" y="34" width="108" height="42" fill="none" stroke="#b4232c" stroke-width="3" stroke-dasharray="6 4"/>
  <text x="80" y="24" font-size="12" fill="#1d6fd1" text-anchor="middle">window 1: [1200, 1130]</text>
  <text x="180" y="98" font-size="12" fill="#b4232c" text-anchor="middle">window 3: [1062, 931]</text>
  <text x="180" y="120" font-size="11" fill="#6c7a93" text-anchor="middle">5 samples give 4 windows of 2</text>
</svg>
```
:::

::: context pull-model The worker at the end pulls
In a Rust iterator chain the consumer drives everything. `sum` calls `next` on `map`; `map` calls `next` on `filter`; `filter` calls `next` on the slice iterator, skipping items until one passes. One item travels the whole way, then the next one starts. If nobody at the end calls `next`, nothing happens at all, which is why an unused chain does no work.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="10" y="40" width="70" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44"/><text x="45" y="63">slice iter</text>
    <rect x="100" y="40" width="70" height="36" rx="6" fill="#ffffff" stroke="#1f2a44"/><text x="135" y="63">filter</text>
    <rect x="190" y="40" width="70" height="36" rx="6" fill="#ffffff" stroke="#1f2a44"/><text x="225" y="63">map</text>
    <rect x="280" y="40" width="70" height="36" rx="6" fill="#f2b880" stroke="#1f2a44"/><text x="315" y="63">sum</text>
  </g>
  <g stroke="#b4232c" stroke-width="2" fill="#b4232c">
    <line x1="278" y1="34" x2="182" y2="34"/><polygon points="176,34 184,30 184,38"/>
    <line x1="188" y1="34" x2="92" y2="34"/><polygon points="86,34 94,30 94,38"/>
  </g>
  <text x="180" y="22" font-size="11" fill="#b4232c" text-anchor="middle">next()? requests flow left</text>
  <g stroke="#1d6fd1" stroke-width="2" fill="#1d6fd1">
    <line x1="82" y1="86" x2="178" y2="86"/><polygon points="184,86 176,82 176,90"/>
    <line x1="172" y1="86" x2="268" y2="86"/><polygon points="274,86 266,82 266,90"/>
  </g>
  <text x="180" y="108" font-size="11" fill="#1d6fd1" text-anchor="middle">Some(item) flows right, one at a time</text>
</svg>
```
:::

::: context monomorphization One shape per use
The word is built from Greek: *monos*, "one", and *morphē*, "shape". Generic code can take many shapes; monomorphization gives it exactly one shape for each concrete type it is used with. C++ templates work the same way. The upside is speed, because every copy is specialized and can be inlined. The price is size: a generic function used with twenty types becomes twenty functions in the binary, and compile times grow with them. On a flight computer with a small flash memory, that trade-off is something teams do keep an eye on.
:::

::: context inlining Pasting the function in
Calling a function costs a little: jump to it, set up its stack frame, jump back. For a tiny function like a closure that computes `0.5 * x * x`, that overhead can be bigger than the work itself. **Inlining** removes it by copying the function's body straight into the caller. The bigger win is what comes after: once everything sits in one function, the optimizer can see the whole loop at once, remove repeated checks, keep values in registers and unroll it.
:::

::: context assembly-language Reading what the chip runs
**Assembly language** is the human-readable form of the instructions a processor actually executes, one simple step per line. On x86-64, `mulsd` reads "multiply scalar double" — multiply one 64-bit float — and `addsd` is the matching add. You do not need to write assembly to use it. Comparing the instruction count of two versions, or checking whether a call to a panic routine is still there, already answers most "is this abstraction free?" questions.
:::

::: context compiler-explorer A website for looking at assembly
Compiler Explorer, at godbolt.org, is a free website created by Matt Godbolt. You paste code on one side, pick a compiler and flags, and it shows the assembly on the other side, with colors linking each source line to the instructions it became. It supports Rust, C, C++ and many other languages, so you can put a Rust iterator chain beside the C++ loop it replaces. Remember to add `-C opt-level=3` for Rust (or `-O2` for C++), or you will be looking at the slow debug version.
:::

::: context closure-word Why it is called a closure
A closure "closes over" the variables around it: it wraps the function together with the values it needs from its surroundings, so the two travel as one package. The name goes back to programming-language research in the 1960s. Python, JavaScript, Swift and modern C++ all have closures; they differ mostly in how the captured variables are stored — which is exactly the question Rust's three traits answer.
:::

::: context closure-trait-ladder Three families, nested
Every `Fn` closure is also an `FnMut`, and every `FnMut` is also an `FnOnce`. So the families nest, like circles inside circles. A function that asks for `FnOnce` accepts every closure. A function that asks for `Fn` accepts only the innermost circle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="180" rx="14" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="24" y="32" font-size="13" fill="#1f2a44" font-weight="700">FnOnce: can be called at least once</text>
  <text x="24" y="50" font-size="11" fill="#6c7a93">move || log  (gives log away)</text>
  <rect x="40" y="62" width="290" height="116" rx="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="54" y="82" font-size="13" fill="#1f2a44" font-weight="700">FnMut: can change its captures</text>
  <text x="54" y="100" font-size="11" fill="#1f2a44">|| ticks += 1</text>
  <rect x="80" y="112" width="230" height="56" rx="10" fill="#1d6fd1" stroke="#1f2a44" stroke-width="2"/>
  <text x="94" y="134" font-size="13" fill="#ffffff" font-weight="700">Fn: only reads</text>
  <text x="94" y="154" font-size="11" fill="#ffffff">|x| gain * x</text>
</svg>
```
:::

::: context threads-bridge Closures that move to another thread
`std::thread::spawn` takes a closure and runs it on a new thread. It asks for `FnOnce`, because the thread runs the work exactly once, and the captured values usually must be moved in with `move`, since the new thread may outlive the function that started it. It also asks that everything captured be safe to send between threads. That requirement is a trait called `Send`, and the next module shows how it lets the compiler reject a data race before the program ever runs.
:::
