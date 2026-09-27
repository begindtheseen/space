---
id: l02-borrowing-and-aliasing-xor-mutability
title: Borrowing, and the rule of many readers or one writer
minutes: 22
covers:
  - 'Borrowing: shared &T versus exclusive &mut T'
  - 'Aliasing XOR mutability and why it removes data races and iterator invalidation by construction'
---

Think of the whiteboard in a mission control room. The current plan is written on it. Any number of people can read it at the same time: the flight director, the guidance officer, someone taking a photo for the log. Nobody gets in anybody's way. Now someone needs to change the plan. They pick up the eraser — and at that moment, everyone else should stop reading, because anyone who copies the board halfway through the rewrite copies a plan that never existed. So the room has an unwritten rule: *many readers, or one writer, never both at once*.

Rust writes that rule into the language. In the last lesson, the only way to let a function use a value was to hand it over, and then hand it back. That works, but it is clumsy. **Borrowing** — letting code use a value through a reference, without taking ownership — replaces nearly all of those round trips. There are two kinds of borrow: one for readers, one for the single writer. And the compiler checks the whiteboard rule for every value in your program.

That one rule has a formal name: **[[aliasing XOR mutability|xor-name]]**. This lesson shows why it rules out two whole families of bugs that C++ engineers hunt at runtime: iterator invalidation and data races. On a flight computer those are the bugs that pass every test on the bench and then show up once, in flight, when the timing is slightly different.

## Lending without giving away

A **reference** is a value that points at another value without owning it. Making one is called **borrowing**. There are two kinds:

- `&T`, read "ampersand T" or "a shared reference to T". It lets you read the value. You can have as many as you like at once.
- `&mut T`, read "ampersand mut T" or "a mutable reference to T". It lets you read *and change* the value. Only one may exist at a time, and while it exists, no `&T` may exist either. That is why it is also called an **exclusive** reference.

To follow a reference to the value it points at, you **dereference** it with `*`, read "star": if `r` is a `&mut f64`, then `*r += 1.0` adds one to the `f64` it points at. For method calls and field access, Rust dereferences for you, so `r.len()` works without a star.

A reference in safe Rust is never null, and it can never outlive the value it points at. The owner stays the owner; the borrower has to give the reference back (by no longer using it) before the owner goes out of scope. Lesson 04 shows how the compiler keeps track of that with lifetimes.

::: example Reading and then correcting a gyro buffer
A gyro that should read zero while the vehicle sits still shows a small constant **[[bias|gyro-bias]]**. We estimate the bias as the mean of a few samples, then subtract it. The first job only reads; the second job changes the buffer.

```rust
fn mean(samples: &[f64]) -> f64 {
    let sum: f64 = samples.iter().sum();
    sum / samples.len() as f64
}

fn remove_bias(samples: &mut Vec<f64>, bias: f64) {
    for s in samples.iter_mut() {
        *s -= bias;
    }
}

fn main() {
    let mut gyro_z = vec![0.50, 0.25, 0.75, 0.50]; // deg/s
    let m = mean(&gyro_z);
    println!("mean before = {:.3}", m);
    remove_bias(&mut gyro_z, m);
    println!("after = {:?}", gyro_z);
    println!("mean after = {:.3}", mean(&gyro_z));
}
```

```text
mean before = 0.500
after = [0.0, -0.25, 0.25, 0.0]
mean after = 0.000
```

Follow the ownership. `main` owns `gyro_z` the whole time.

1. `mean(&gyro_z)` lends a shared reference. The parameter type is `&[f64]`, a **[[slice|slices]]**: a borrowed view of a run of `f64` values, however they are stored. The sum is $0.50 + 0.25 + 0.75 + 0.50 = 2.00$, and $2.00 / 4 = 0.50\ \text{deg/s}$. When `mean` returns, the borrow ends.
2. `remove_bias(&mut gyro_z, m)` lends an exclusive reference. Inside, `iter_mut()` hands out a `&mut f64` for each element in turn, and `*s -= bias` changes the element itself. $0.50 - 0.50 = 0$, $0.25 - 0.50 = -0.25$, $0.75 - 0.50 = 0.25$, $0.50 - 0.50 = 0$.
3. `mean(&gyro_z)` lends again. The new mean is $0$.

Sanity check: after removing the mean, the mean should be zero, and it is. And notice what `main` never had to do: take the vector back from anybody. It lent it twice and kept it.
:::

The call site shows you the kind of borrow. `mean(&gyro_z)` can only read. `remove_bias(&mut gyro_z, m)` might change the buffer, and the `&mut` in the call says so to anyone reading the code, the way a signature with a `const&` or a plain `&` does in C++, but with the marker at the call as well.

One more rule you will trip over in the first hour: you can only take `&mut` of something declared with `let mut`. Leave out the `mut` and the compiler says "cannot borrow `readings` as mutable, as it is not declared as mutable" (error E0596). The `mut` on the `let` says "this owner allows changes"; the `&mut` on the borrow says "and I am the one making them".

## Many readers or one writer

Here is the rule in its precise form. At any moment, a given value may have **either**

- any number of shared references `&T`, **or**
- exactly one exclusive reference `&mut T`,

but never both kinds at once. **Aliasing** means two or more names that reach the same memory; **mutability** means the memory can be changed. You may have one or the other, not both. That is "aliasing XOR mutability", where XOR, read "ex-or", means "one or the other but not both".

Many readers is fine:

```rust
fn main() {
    let altitude_m = vec![1200.0, 1350.0, 1490.0];
    let a = &altitude_m;
    let b = &altitude_m;
    let c = &altitude_m;
    println!("{} {} {}", a[0], b[1], c[2]);
    println!("readers: {}", a.len() + b.len() + c.len());
}
```

```text
1200 1350 1490
readers: 9
```

Two writers is not:

```rust
fn main() {
    let mut throttle = 0.70;
    let a = &mut throttle;
    let b = &mut throttle;
    *a += 0.05;
    *b -= 0.10;
    println!("{}", throttle);
}
```

```text
error[E0499]: cannot borrow `throttle` as mutable more than once at a time
 --> src/main.rs:4:13
  |
3 |     let a = &mut throttle;
  |             ------------- first mutable borrow occurs here
4 |     let b = &mut throttle;
  |             ^^^^^^^^^^^^^ second mutable borrow occurs here
5 |     *a += 0.05;
  |     ---------- first borrow later used here
```

And a reader plus a writer is not either. That combination gets its own error, E0502, which you will see in the next section.

::: key Aliasing XOR mutability
At any moment a value has either many shared references or exactly one exclusive reference. That single rule eliminates data races, iterator invalidation and most use-after-free at compile time, because the dangerous patterns are simply not expressible.
:::

### How long a borrow lasts

A borrow does not last until the closing brace. It lasts from the line where the reference is created to the **last line that uses it**. The compiler's name for this is **[[non-lexical lifetimes|nll]]**. It means you can often fix a conflict by using a reference up before you start changing the owner:

```rust
fn main() {
    let mut v = vec![10, 20, 30];
    let first = &v[0];
    println!("first = {}", first); // last use of `first`: the borrow ends here
    v.push(40); // fine: no shared borrow is alive any more
    println!("{:?}", v);
}
```

```text
first = 10
[10, 20, 30, 40]
```

The borrow of `v` through `first` starts on line 3 and ends on line 4. By line 5 it is over, so `push` may take its exclusive borrow.

## The push that will not compile

Move the `println!` of `first` one line down, after the `push`, and everything changes:

```rust
fn main() {
    let mut v = vec![10, 20, 30];
    let r = &v[0];
    v.push(40);
    println!("{}", r);
}
```

```text
error[E0502]: cannot borrow `v` as mutable because it is also borrowed as immutable
 --> src/main.rs:4:5
  |
3 |     let r = &v[0];
  |              - immutable borrow occurs here
4 |     v.push(40);
  |     ^^^^^^^^^^ mutable borrow occurs here
5 |     println!("{}", r);
  |                    - immutable borrow later used here
```

Why? `push` is declared as `fn push(&mut self, value: T)`: it needs an exclusive borrow of the whole vector, because it might change anything in it. But `r` is a shared borrow of the vector, and `r` is still going to be used on line 5. A reader and a writer at the same time: rejected.

This is not the compiler being fussy. The reason is **[[reallocation|reallocation]]**. A `Vec` keeps its elements in one heap buffer with room for `capacity` elements. When you push and the buffer is full, the vector asks for a new, bigger buffer, copies the elements across, and frees the old one. If `r` pointed into the old buffer, it now points at freed memory.

::: example What C++ does with the same code
Here is the identical program in C++:

```cpp
#include <iostream>
#include <vector>
int main() {
    std::vector<int> v = {10, 20, 30};
    const int& r = v[0];
    v.push_back(40);
    std::cout << r << "\n";
}
```

With g++ 13.3.0 and `-Wall -Wextra`, it compiles with no warnings at all. Our run printed

```text
1453131382
```

That is not $10$. It is whatever bytes happened to be lying in freed memory. Built again with `-fsanitize=address`, the run stops with

```text
ERROR: AddressSanitizer: heap-use-after-free on address 0x502000000010
READ of size 4 at 0x502000000010 thread T0
    #0 in main push.cpp:7
0x502000000010 is located 0 bytes inside of 12-byte region
```

(trimmed). Check the numbers against the story. Three `int` values of 4 bytes each fill $3 \times 4 = 12$ bytes, which is the "12-byte region" that was freed. `r` referred to element 0, which sits "0 bytes inside" that region. And the read is "of size 4": one `int`. Every detail matches: the vector was full at capacity 3, `push_back` moved the elements to a bigger buffer, freed the 12-byte one, and `r` was left pointing into it.

The C++ program is **[[undefined behavior|undefined-behavior]]**: the language makes no promise about what happens. It might print $10$ on one machine, garbage on another, and crash on a third. [[AddressSanitizer|asan]] found it only because this exact path ran during the test. Rust rejected the same idea before the program existed.
:::

This is the single most convincing demonstration of the model to a C++ engineer, so it deserves its own key.

::: key Why `let r = &v[0]; v.push(x);` will not compile
push needs a &mut borrow of v while r holds a shared borrow, which the borrow checker rejects. In C++ the same code compiles and r dangles after reallocation; this is the single most convincing demonstration of the model to a C++ engineer.
:::

::: warning "But the push did not reallocate this time"
Maybe not. Rust's own `Vec` grew from capacity 3 to capacity 6 on our run, and the allocator happened to extend the old buffer in place, so the elements did not move. The borrow checker does not care, and it should not. Whether a given push reallocates depends on the current capacity and on the allocator, which can change with the data, the build or the machine. A rule that holds only "when there is spare capacity" is a rule that fails in flight. The borrow checker judges the *pattern*, which is wrong every time, not the *outcome*, which is only wrong sometimes.
:::

The fixes are the ones you would reach for in careful C++, except that here the compiler insists on one of them. Copy the element out (`let r = v[0];` works, because `i32` is Copy, so `r` is an independent number, not a reference). Or finish using the reference before the push. Or push first and borrow afterwards. Or keep an index instead of a reference, and look the element up again after the push.

## Iterator invalidation

An **iterator** is an object that walks through a collection one element at a time. A `for` loop over `&waypoints` borrows the vector for the whole loop, because the iterator inside it holds a reference into the buffer. **Iterator invalidation** is what C++ calls the bug where the collection changes under the iterator's feet, so the iterator's reference goes stale.

Here is a plausible bit of trajectory code: walk the waypoints and, after each one above 200 m, add a follow-up waypoint 50 m further on.

```rust
fn main() {
    let mut waypoints = vec![100.0, 250.0, 400.0];
    for w in &waypoints {
        if *w > 200.0 {
            waypoints.push(w + 50.0);
        }
    }
}
```

```text
error[E0502]: cannot borrow `waypoints` as mutable because it is also borrowed as immutable
 --> src/main.rs:5:13
  |
3 |     for w in &waypoints {
  |              ----------
  |              |
  |              immutable borrow occurs here
  |              immutable borrow later used here
4 |         if *w > 200.0 {
5 |             waypoints.push(w + 50.0);
  |             ^^^^^^^^^^^^^^^^^^^^^^^^ mutable borrow occurs here
```

It is the same error as the push example, E0502, for the same reason. The loop is a reader for its whole length, and `push` wants to be the writer in the middle of it. The C++ range-`for` version compiles without a warning and, under AddressSanitizer, stops with the same "heap-use-after-free".

The fix separates reading from writing. First read everything and collect the new waypoints into a separate list; then, with the loop's borrow finished, add them:

```rust
fn main() {
    let mut waypoints = vec![100.0, 250.0, 400.0];
    let extra: Vec<f64> = waypoints
        .iter()
        .filter(|w| **w > 200.0)
        .map(|w| w + 50.0)
        .collect();
    waypoints.extend(extra);
    println!("{:?}", waypoints);
}
```

```text
[100.0, 250.0, 400.0, 300.0, 450.0]
```

Check it: $250 > 200$, so $250 + 50 = 300$ is added; $400 > 200$, so $400 + 50 = 450$ is added; $100$ is not above $200$, so nothing is added for it. Two new waypoints, as expected. And the program now has a clear meaning, which the original never had: does a waypoint that was added during the loop get visited by the same loop? In C++ the answer was "undefined". Here the question cannot even be asked.

## Data races

A **[[data race|data-race]]** happens when two threads touch the same memory at the same time, at least one of them writes, and nothing makes them take turns. The classic result is a **lost update**: both threads read the counter as 5, both add one, both write 6. Two increments happened; the counter went up by one.

::: example Counting packets from two threads
Two threads each count a million received packets into one shared counter. In C++:

```cpp
#include <thread>
#include <iostream>
int main() {
    long packets = 0;
    auto work = [&] { for (int i = 0; i < 1000000; ++i) packets += 1; };
    std::thread a(work), b(work);
    a.join(); b.join();
    std::cout << packets << "\n";
}
```

The right answer is $2 \times 1{,}000{,}000 = 2{,}000{,}000$. Three runs on our machine printed

```text
1076788
1263840
1085562
```

The first run lost $2{,}000{,}000 - 1{,}076{,}788 = 923{,}212$ increments, about 46% of them. And the answer was different every time, which is the signature of a race. It compiled cleanly with `-Wall -Wextra`. ThreadSanitizer (`-fsanitize=thread`) reports "WARNING: ThreadSanitizer: data race", but again only for the runs you happen to test.

The same shape in Rust, using [[scoped threads|scoped-threads-and-split]] (`thread::scope` lets threads borrow local variables, because it waits for them all to finish before the scope ends):

```rust
use std::thread;

fn main() {
    let mut packets_received = 0u64;
    thread::scope(|s| {
        s.spawn(|| {
            for _ in 0..1000 {
                packets_received += 1;
            }
        });
        s.spawn(|| {
            for _ in 0..1000 {
                packets_received += 1;
            }
        });
    });
    println!("{}", packets_received);
}
```

```text
error[E0499]: cannot borrow `packets_received` as mutable more than once at a time
  --> src/main.rs:11:17
   |
 6 |           s.spawn(|| {
   |           -       -- first mutable borrow occurs here
 ...
 8 | |                 packets_received += 1;
   | |                 ---------------- first borrow occurs due to use of `packets_received` in closure
 ...
11 |           s.spawn(|| {
   |                   ^^ second mutable borrow occurs here
12 |               for _ in 0..1000 {
13 |                   packets_received += 1;
   |                   ---------------- second borrow occurs due to use of `packets_received` in closure
```

(trimmed). Look at the error code: E0499, the same "two writers" error as the throttle example. The compiler did not need a special rule about threads. Each closure that does `packets_received += 1` needs a `&mut` to the counter, and two `&mut` at the same time is already forbidden. The data race was ruled out by the aliasing rule you already know.
:::

The safe versions give each thread its own memory, or make them take turns. One way to give each thread its own memory is `split_at_mut`, which cuts one array into two non-overlapping mutable halves:

```rust
use std::thread;

fn main() {
    let mut counts = [0u64; 2];
    let (left, right) = counts.split_at_mut(1);
    thread::scope(|s| {
        s.spawn(|| {
            for _ in 0..1000 {
                left[0] += 1;
            }
        });
        s.spawn(|| {
            for _ in 0..1000 {
                right[0] += 1;
            }
        });
    });
    println!("total = {}", counts[0] + counts[1]);
}
```

```text
total = 2000
```

Two `&mut` exist at once here, but they point at different elements, so there is no aliasing. The compiler accepts it because `split_at_mut` promises in its signature that the halves do not overlap. The other way, taking turns, uses a lock such as `Mutex`, which lesson 05 covers.

::: key Why no data races at compile time
A data race needs aliasing plus mutation plus concurrency. The borrow rules forbid aliasing with mutation, and Send/Sync control what crosses threads, so the combination cannot be constructed in safe code.
:::

`Send` and `Sync` are the two type-system labels that decide which types may be moved to or shared with another thread at all; lesson 06 treats them properly. For this lesson, the point is that the heavy lifting was done by the plain aliasing rule.

::: warning What the rule does not cover
Aliasing XOR mutability is about who can reach a piece of memory and who can change it. It says nothing about arithmetic. An `i32` can still overflow (a panic in a debug build, as you saw in the basics module), a float still rounds, and a deep recursion can still run out of stack. Those need their own tools: checked arithmetic, careful numerics, and bounded recursion. It also does not prevent a **deadlock**, where two threads each wait forever for a lock the other holds.
:::

::: note Why one rule covers both bugs
Look at what each bug needs. Iterator invalidation needs a reader (the iterator's reference into the buffer) and, at the same time, a writer that can reallocate the buffer (the push). A data race needs two threads that can reach the same memory, with at least one of them writing. Strip away the details, and both bugs are the same shape: *a path that reads plus a path that writes, both alive at once, to the same memory*. Aliasing XOR mutability forbids exactly that shape. Because the compiler checks the shape rather than the timing, the proof does not depend on which thread runs first or whether a push happens to reallocate. The price is that the check is conservative: some programs that would have been fine, like two `&mut` to the same `f64` used one after the other on one thread, are rejected too. Lesson 05 shows the tools, `Cell` and `RefCell`, for the rare cases where you need to say "trust me, I have checked this another way".
:::

## Check yourself

::: check
Say aloud how you read `&T`, `&mut T` and `*r`. Then state the rule about how many of each kind of borrow may exist at once.
:::

::: answer
`&T` is "ampersand T", a shared reference; `&mut T` is "ampersand mut T", a mutable or exclusive reference; `*r` is "star r", following the reference to the value. At any moment a value may have any number of `&T` borrows, or exactly one `&mut T` borrow, never a mix. That is aliasing XOR mutability.
:::

::: check
A function `fn apply_calibration(buf: &mut [f64], scale: f64)` is called as `apply_calibration(&mut accel, 1.002);` on the line after `let peak = accel.iter().cloned().fold(f64::MIN, f64::max);`. Does it compile? What if `peak` were instead `let peak = &accel[3];` and it was printed after the calibration call?
:::

::: answer
The first version compiles. `fold` returns an `f64` by value, which is Copy, so `peak` is an independent number and the shared borrow used to compute it ended on its own line. In the second version, `peak` is a shared reference into `accel`, still in use after the call, so the `&mut` borrow for `apply_calibration` would overlap it: error E0502. The fix is to print `peak` before calibrating, or copy the value with `let peak = accel[3];`.
:::

::: check
A C++ colleague says: "I only keep the reference for a moment, and my vector has `reserve(1000)` so it never reallocates. Rust is being paranoid." Give two reasons the Rust rule is still worth having.
:::

::: answer
First, the "never reallocates" guarantee lives in someone's head and in one line of setup code far away. A later change, like a longer mission profile that pushes a 1,001st element, silently turns correct code into use-after-free, and nothing warns. Second, reallocation is not the only way a writer invalidates a reader: `clear()`, `insert()` or `erase()` shift or destroy elements too, and another thread writing while this one reads is a data race whatever the capacity. The borrow checker rules out the whole pattern, so none of those future changes can introduce the bug.
:::

::: check
Explain, in two or three sentences to a C++ engineer, why pushing to a `Vec` while holding a reference into it will not compile.
:::

::: answer
`push` takes `&mut self`, an exclusive borrow of the whole vector, because it may reallocate the buffer and move every element. A reference into the vector is a shared borrow that is still alive, and Rust never allows a shared and an exclusive borrow of the same value at once. In C++ the same code compiles, and if the push reallocates, the reference dangles into freed memory: undefined behavior that Rust turns into a compile error.
:::

::: check
Two threads each need to add up half of a 10,000-sample buffer. Using only what this lesson showed, how would you let each thread write its partial sum without a data race and without a lock?
:::

::: answer
Make an array of two sums, `let mut sums = [0.0f64; 2];`, and cut it with `sums.split_at_mut(1)` into two non-overlapping `&mut` pieces. Give one piece to each scoped thread, together with a shared borrow of its half of the samples (shared borrows of the input are fine, because nobody writes to it). Each thread writes only its own slot, so no memory is both shared and written. After `thread::scope` ends, add `sums[0] + sums[1]` for the total.
:::

## Summary

| Idea | Syntax | Rule or fact |
|---|---|---|
| Shared borrow | `&T` | Read only; any number at once |
| Exclusive borrow | `&mut T` | Read and write; exactly one, and no `&T` alongside |
| Dereference | `*r` | Reach the value a reference points at |
| Borrow length | from creation to last use | Non-lexical lifetimes |
| Two writers | E0499 | "cannot borrow as mutable more than once at a time" |
| Reader plus writer | E0502 | "cannot borrow as mutable because it is also borrowed as immutable" |
| Aliasing XOR mutability | — | Removes iterator invalidation and data races at compile time |
| Not covered by it | — | Overflow, rounding, stack depth, deadlock |

You have now seen four error codes: E0382, E0499, E0502 and E0596. The next lesson is about reading these messages, and several more, as a map of what went wrong, and fixing them without reaching for `clone()`.

::: context xor-name Where "XOR" comes from
XOR is short for "exclusive or", a term from logic and digital circuits. Ordinary "or" is true when either side is true, or both. Exclusive or is true when exactly one side is true. In a chip it is a gate with two inputs whose output is 1 when the inputs differ. "Aliasing XOR mutability" borrows that word: you may have aliasing, or mutability, but asking for both at once gives "false". (Strictly, having neither — one owner, no borrows — is also allowed, so the rule is really "not both".)
:::

::: context gyro-bias Why a still gyro does not read zero
A gyroscope measures how fast it is turning. A perfect one sitting on a table would read zero (ignoring Earth's own rotation, about 0.004 degrees per second). Real ones read a small offset called bias, which drifts with temperature and time. If you integrate a biased rate to get an angle, the error grows steadily, so navigation software estimates the bias and subtracts it. Averaging while the vehicle sits still on the pad is the simplest estimate; a Kalman filter, later in the course, keeps refining it in flight.
:::

::: context slices A borrowed view of a run of values
A slice `&[f64]` is a reference that carries two numbers: where the run starts and how many elements it has. That makes it a **fat pointer**, twice the size of a plain one. Because it carries its length, indexing past the end is caught with a panic instead of reading someone else's memory. A function that takes `&[f64]` accepts a borrowed `Vec<f64>`, a fixed array `[f64; 3]`, or part of either, so it is the usual parameter type for "some samples to read".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="90" height="60" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="20" y1="60" x2="110" y2="60" stroke="#6c7a93"/>
  <text x="65" y="50" font-size="12" text-anchor="middle" fill="#1d6fd1">ptr</text>
  <text x="65" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">len = 4</text>
  <text x="65" y="20" font-size="12" text-anchor="middle" fill="#1f2a44">&amp;[f64]</text>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <rect x="170" y="70" width="42" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="191" y="87">0.50</text>
    <rect x="212" y="70" width="42" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="233" y="87">0.25</text>
    <rect x="254" y="70" width="42" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="275" y="87">0.75</text>
    <rect x="296" y="70" width="42" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="317" y="87">0.50</text>
  </g>
  <line x1="95" y1="45" x2="166" y2="72" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="171,74 159,74 163,65" fill="#1d6fd1"/>
  <text x="254" y="116" font-size="11" text-anchor="middle" fill="#6c7a93">the owner's buffer, borrowed not copied</text>
</svg>
```
:::

::: context nll Borrows that end early
Early Rust ended every borrow at the closing brace of the block where the reference lived, which rejected many perfectly safe programs. The compiler was later rebuilt so that a borrow ends at the reference's last use. This change, called non-lexical lifetimes ("lexical" meaning "following the braces in the text"), arrived with the 2018 edition and made the borrow checker far less irritating. If you read an old blog post whose example "should not compile" but does for you, this is usually why.
:::

::: context reallocation How a vector grows
A `Vec` or `std::vector` reserves room for more elements than it holds, so most pushes are cheap. When the room runs out, it asks for a bigger buffer, often about twice as big, copies every element across, and gives the old buffer back. That is why a push can make every existing reference into the vector point at freed memory.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <text x="20" y="22" font-size="12" fill="#1f2a44">before push: capacity 3, full</text>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <rect x="20" y="30" width="36" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="38" y="48">10</text>
    <rect x="56" y="30" width="36" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="74" y="48">20</text>
    <rect x="92" y="30" width="36" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="110" y="48">30</text>
  </g>
  <text x="150" y="48" font-size="12" fill="#b4232c">freed after push</text>
  <text x="20" y="92" font-size="12" fill="#1f2a44">after push: new buffer, capacity 6</text>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <rect x="20" y="100" width="36" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="38" y="118">10</text>
    <rect x="56" y="100" width="36" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="74" y="118">20</text>
    <rect x="92" y="100" width="36" height="26" fill="#8fb8f0" stroke="#1f2a44"/><text x="110" y="118">30</text>
    <rect x="128" y="100" width="36" height="26" fill="#f2b880" stroke="#1f2a44"/><text x="146" y="118">40</text>
    <rect x="164" y="100" width="36" height="26" fill="#fff" stroke="#6c7a93"/>
    <rect x="200" y="100" width="36" height="26" fill="#fff" stroke="#6c7a93"/>
  </g>
  <text x="260" y="148" font-size="12" fill="#b4232c">r still points up here</text>
  <line x1="300" y1="136" x2="44" y2="60" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <polygon points="38,58 50,57 46,66" fill="#b4232c"/>
</svg>
```
:::

::: context undefined-behavior Undefined behavior
In C and C++, some mistakes are not errors the language catches but "undefined behavior": the standard places no requirement at all on what the program does next. The compiler is allowed to assume it never happens and optimize on that basis, so the effects can be strange and can change with the optimization level. Reading freed memory, overflowing a signed integer and a data race are all undefined behavior in C++. Safe Rust is designed so that no program you can write in it has undefined behavior; lesson 07 shows where `unsafe` lets you step outside that promise.
:::

::: context asan Sanitizers check at runtime
AddressSanitizer is a compiler feature in GCC and Clang, switched on with `-fsanitize=address`. It adds checks around every memory access and keeps freed memory "poisoned" for a while, so a read of freed memory is caught and reported with the line that did it. ThreadSanitizer (`-fsanitize=thread`) does the same job for data races. Both are excellent, and flight C++ teams run their tests under them. Their limit is that they only see the paths your tests actually run. The borrow checker sees every path, at compile time.
:::

::: context data-race Two threads, one counter
A race is easiest to see as a timeline. Each `+= 1` is really three steps: read the value, add one, write it back. If two threads interleave those steps, one write overwrites the other.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="20" y="30" font-size="12" fill="#1d6fd1">thread A</text>
  <text x="20" y="100" font-size="12" fill="#b4232c">thread B</text>
  <line x1="90" y1="60" x2="345" y2="60" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="350,60 340,55 340,65" fill="#6c7a93"/>
  <text x="330" y="78" font-size="11" fill="#6c7a93">time</text>
  <rect x="90" y="16" width="60" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="120" y="31" font-size="11" text-anchor="middle" fill="#1f2a44">read 5</text>
  <rect x="150" y="86" width="60" height="22" fill="#f2b880" stroke="#1f2a44"/><text x="180" y="101" font-size="11" text-anchor="middle" fill="#1f2a44">read 5</text>
  <rect x="210" y="16" width="60" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="240" y="31" font-size="11" text-anchor="middle" fill="#1f2a44">write 6</text>
  <rect x="270" y="86" width="60" height="22" fill="#f2b880" stroke="#1f2a44"/><text x="300" y="101" font-size="11" text-anchor="middle" fill="#1f2a44">write 6</text>
  <text x="90" y="138" font-size="12" fill="#1f2a44">two increments, counter went from 5 to 6</text>
</svg>
```
:::

::: context scoped-threads-and-split Borrowing across threads safely
`std::thread::scope` became part of stable Rust in version 1.63. Before it, a spawned thread could only take ownership of its data (or share it through `Arc`, lesson 05), because nothing guaranteed the thread would finish before the local variable went away. A scope waits for all its threads at the closing brace, so borrowing locals is safe. `split_at_mut` itself is written with a few lines of `unsafe` inside the standard library, wrapped behind a signature that promises non-overlapping halves. That pattern — a small, carefully checked unsafe core behind a safe interface — is the subject of lesson 07.
:::
