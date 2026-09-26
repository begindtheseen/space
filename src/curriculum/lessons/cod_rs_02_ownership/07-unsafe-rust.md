---
id: l07-unsafe-rust
title: Unsafe Rust and the safe wrapper
minutes: 24
covers:
  - 'unsafe: the five superpowers, and the discipline of wrapping it in a safe abstraction with documented invariants'
---

Picture the elevator in a tall building. Riders press buttons, and a whole set of safety systems stands between them and anything dangerous: the doors will not open between floors, the car will not move with the doors open, the brakes catch if a cable slips. Now picture the locked maintenance panel on the roof of the car. Inside it, a trained technician can do a few things a rider never could: move the car with the doors open, or hold a brake released. The key does not switch the other safety systems off. It unlocks a short list of extra abilities, and the technician signs a log saying exactly what they did and why it was safe.

Rust has the same arrangement. Everything in the last six lessons, ownership, borrowing, lifetimes, `Send` and `Sync`, is the set of safety systems. Some jobs cannot be done inside them: talking to a memory-mapped hardware register, calling a C library, building a new container type like `Vec`. For those jobs Rust has the keyword **`unsafe`** — a marker that unlocks five specific operations the compiler cannot check, and hands the responsibility for them to you. This lesson teaches the five, shows that everything else stays switched on, and then teaches the part that matters most: putting a small piece of unsafe code behind a safe interface, with its reasons written next to it.

Every flight-computer driver in Rust bottoms out in a few lines of `unsafe` that read or write a device register. The difference between a trustworthy driver and a dangerous one is not whether it uses `unsafe`. It is how small that part is, and how well it is argued.

## Why safe Rust needs a door

Safe Rust makes a strong promise: no program you can write in it has **undefined behavior** — the situation where the language places no rules at all on what happens next, like reading freed memory or two threads writing the same variable. The compiler keeps that promise by checking your code against rules it can prove.

But some correct programs are correct for reasons the compiler cannot see. You met one in lesson 02: `split_at_mut` hands out two `&mut` slices into the same array. The borrow checker only sees "two exclusive borrows of one thing", which is normally forbidden. A human can see that the two halves do not overlap, so there is no aliasing. The compiler cannot prove it from the types alone.

The same is true of a `Vec` managing a heap block that is only partly filled in, a driver writing to a register address no Rust variable owns, and a call into C code the compiler cannot look inside. For all of these, you step through the door marked `unsafe`, do the one thing that needs it, and step back out.

## The five superpowers

An `unsafe` block, `unsafe { ... }`, lets you do exactly five things that are forbidden elsewhere. People call them the five **superpowers**. Here is one program that uses all five:

```rust
// 1. raw pointers
fn raw_pointers() {
    let mut altitude_m: f64 = 1200.0;
    let p: *mut f64 = &mut altitude_m; // making a raw pointer: safe
    unsafe {
        *p += 50.0; // dereferencing it: needs unsafe
    }
    println!("altitude = {} m", altitude_m);
}

// 2. calling an unsafe function (here, a C function)
unsafe extern "C" {
    fn abs(x: i32) -> i32; // from the C standard library
}

fn call_c() {
    let r = unsafe { abs(-42) };
    println!("C abs(-42) = {}", r);
}

// 3. implementing an unsafe trait
struct RegisterBlock {
    base: *mut u32,
}
// SAFETY: the pointer is only ever used by whichever thread owns
// the RegisterBlock; nothing else keeps a copy of it.
unsafe impl Send for RegisterBlock {}

impl RegisterBlock {
    fn is_mapped(&self) -> bool {
        !self.base.is_null()
    }
}

// 4. a mutable static
static mut FRAME_COUNT: u32 = 0;

fn tick() {
    unsafe {
        FRAME_COUNT += 1;
    }
}

// 5. reading a union field
#[repr(C)]
union Word {
    bits: u32,
    value: f32,
}

fn main() {
    raw_pointers();
    call_c();
    let rb = RegisterBlock { base: std::ptr::null_mut() };
    let handle = std::thread::spawn(move || rb.is_mapped());
    println!("mapped? {}", handle.join().unwrap());
    tick();
    tick();
    let n = unsafe { FRAME_COUNT };
    println!("frames = {}", n);
    let w = Word { value: 1.0 };
    let bits = unsafe { w.bits };
    println!("1.0f32 as bits = {:#010x}", bits);
}
```

```text
altitude = 1250 m
C abs(-42) = 42
mapped? false
frames = 2
1.0f32 as bits = 0x3f800000
```

(Every program in this lesson was built with rustc 1.94.1 and the 2024 edition, which is what `cargo new` gives you.) Take the five one at a time.

**1. Dereference a raw pointer.** A **[[raw pointer|raw-pointer]]** is an address with a type, written `*const T` (read "star const T", may only be read through) or `*mut T` ("star mut T", may be written through). It is Rust's version of a C pointer. Unlike a reference, a raw pointer may be null, may dangle, may be misaligned, and is not tracked by the borrow checker. *Making* one is safe, since an address by itself hurts nobody. *Following* it with `*p` is the superpower. Try it outside an `unsafe` block and the compiler names the risks for you:

```rust
fn main() {
    let mut altitude_m: f64 = 1200.0;
    let p: *mut f64 = &mut altitude_m;
    *p += 50.0;
    println!("{}", altitude_m);
}
```

```text
error[E0133]: dereference of raw pointer is unsafe and requires unsafe block
 --> src/main.rs:4:5
  |
4 |     *p += 50.0;
  |     ^^ dereference of raw pointer
  |
  = note: raw pointers may be null, dangling or unaligned; they can violate aliasing rules and cause data races: all of these are undefined behavior
```

**2. Call an unsafe function, including one reached through [[FFI|ffi]].** An **unsafe function**, declared `unsafe fn`, is one with a precondition the compiler cannot check, so every call must sit inside `unsafe`. A function declared in an `extern "C"` block is unsafe to call by default, because Rust cannot see inside C. Here `abs` comes from the C standard library that every Rust program on Linux already links against.

**3. Implement an unsafe trait.** An **unsafe trait** is a trait whose promise the compiler cannot verify, so writing `unsafe impl` is you signing for it. The famous two are `Send` and `Sync` from lesson 06. A raw pointer is neither, so a struct holding one is not `Send`, and `thread::spawn` refuses it. Delete the `unsafe impl` line and you get:

```text
error[E0277]: `*mut u32` cannot be sent between threads safely
  --> src/main.rs:54:37
   |
54 |     let handle = std::thread::spawn(move || rb.is_mapped());
   |                  ------------------ -------^^^^^^^^^^^^^^^
   |                  |                  |
   |                  |                  `*mut u32` cannot be sent between threads safely
```

(trimmed). With the line in place, you have told the compiler "I checked: sending this to another thread is fine", and it believes you.

**4. Read or write a [[mutable static|mutable-static]].** A `static` is a single global variable that lives for the whole program. A `static mut` can be changed, from anywhere, by any thread or interrupt handler, which is exactly the "many writers at once" shape the borrow rules exist to forbid. So every access needs `unsafe`. The 2024 edition goes further and refuses to let you even take a reference to one. `println!` borrows what it prints, so this fails:

```rust
static mut FRAME_COUNT: u32 = 0;

fn main() {
    unsafe {
        FRAME_COUNT += 1;
        println!("frames = {}", FRAME_COUNT);
    }
}
```

```text
error: creating a shared reference to mutable static
 --> src/main.rs:6:33
  |
6 |         println!("frames = {}", FRAME_COUNT);
  |                                 ^^^^^^^^^^^ shared reference to mutable static
```

That is why the tour program above copies the value out first with `let n = unsafe { FRAME_COUNT };`. In real code, prefer an atomic such as `AtomicU32` or a `Mutex` (lesson 05), which need no `unsafe` at all.

**5. Access the fields of a [[union|union-bits]].** A **union** is a type whose fields all share the same bytes, like a C union. Writing `value: 1.0` and reading `bits` reinterprets the four bytes of the float as an integer. The compiler cannot know which field was last written, and some bit patterns are not valid for some types, so reading a field is unsafe. The answer `0x3f800000` is the IEEE 754 encoding of $1.0$.

::: key The five unsafe superpowers
Dereference a raw pointer, call an unsafe function or FFI, implement an unsafe trait, access or modify a mutable static, and access the fields of a union. unsafe does not turn off the borrow checker; it only enables those five operations.
:::

::: warning Pointer arithmetic is a call to an unsafe function
`p.add(i)`, which moves a raw pointer forward by `i` elements, is itself an `unsafe fn`: the result must stay inside the same allocation. So a line like `*p.add(i)` uses two superpowers at once, the call and the dereference. That is still inside the list of five, not a sixth.
:::

## What unsafe leaves switched on

The most common wrong belief about `unsafe` is that it is an "off switch" for Rust's checks. It is not. Every other rule still applies inside the block: types, lifetimes, moves, bounds checks on `v[i]`, and the borrow rules for references. Here are two `&mut` borrows of one vector inside an `unsafe` block:

```rust
fn main() {
    let mut rates = vec![0.1_f64, 0.2, 0.3];
    unsafe {
        let a = &mut rates;
        let b = &mut rates;
        a.push(0.4);
        b.push(0.5);
    }
}
```

```text
warning: unnecessary `unsafe` block
 --> src/main.rs:3:5
  |
3 |     unsafe {
  |     ^^^^^^ unnecessary `unsafe` block

error[E0499]: cannot borrow `rates` as mutable more than once at a time
 --> src/main.rs:5:17
  |
4 |         let a = &mut rates;
  |                 ---------- first mutable borrow occurs here
5 |         let b = &mut rates;
  |                 ^^^^^^^^^^ second mutable borrow occurs here
6 |         a.push(0.4);
  |         - first borrow later used here
```

Read both messages. The error is the same E0499 you met in lesson 03: the borrow checker ran as usual. And the warning says the `unsafe` did nothing, because nothing in the block used any of the five powers. The keyword has no effect on code that does not need it.

So what does `unsafe` change? It moves the responsibility for five operations from the compiler to you. Raw pointers are the loophole in practice: the borrow checker tracks references but not raw pointers, so with a raw pointer you *can* build two paths to the same memory. If you do, you have broken the aliasing rule, and the compiler will not tell you. The rule did not go away. Only the checking did.

::: warning Undefined behavior in unsafe code is still undefined behavior
Writing `unsafe` does not make a wrong program acceptable. If an unsafe block reads past the end of an array, creates two live `&mut` to one value, or reads an uninitialized variable, the whole program has undefined behavior, exactly as in C++. The optimizer is allowed to assume it never happens, so the symptoms can be anywhere, including in code that looks unrelated.
:::

::: example An off-by-one that three builds disagree about
Here is a function that sums samples through a raw pointer. The loop uses `0..=v.len()`, read "zero through length, inclusive", which visits one element too many:

```rust
fn sum_samples(v: &[f64]) -> f64 {
    let p = v.as_ptr();
    let mut total = 0.0;
    for i in 0..=v.len() {
        // BUG: `0..=len` visits len + 1 elements
        total += unsafe { *p.add(i) };
    }
    total
}

fn main() {
    let samples = [1.0, 2.0, 3.0];
    println!("sum = {}", sum_samples(&samples));
}
```

The right answer is $1 + 2 + 3 = 6$. Here is what three different builds said.

`cargo run` (a debug build):

```text
sum = 6
```

`cargo run --release` (an optimized build):

```text
sum = 0.000000000000000000000...000000020237
```

(the real line has several hundred zeros; trimmed). The debug build happened to find a harmless value in the memory after the array, so the sum still printed as $6$: the right answer, by luck. The release build printed a meaningless tiny number. Same source, two different results: that is what undefined behavior looks like, and it is why "it passed my test" proves nothing about unsafe code.

`cargo +nightly miri run` runs the program in **[[Miri|miri]]**, an interpreter that checks every memory access against the rules:

```text
error: Undefined Behavior: memory access failed: attempting to access 8 bytes, but got alloc206+0x18 which is at or beyond the end of the allocation of size 24 bytes
  --> src/main.rs:6:27
   |
 6 |         total += unsafe { *p.add(i) };
   |                           ^^^^^^^^^ Undefined Behavior occurred here
```

Check its numbers. The array holds three `f64` of 8 bytes each, so the allocation is $3 \times 8 = 24$ bytes. The bad read is at offset `0x18`, which is $1 \times 16 + 8 = 24$ in decimal: the first byte after the end. And it tried to read 8 bytes, one `f64`. Miri pinned the bug to the exact line, the first time the program ran.

The fix is to loop over `0..v.len()`. Better still, delete the unsafe code entirely and write `v.iter().sum()`, which is safe and compiles to the same loop.
:::

## The discipline: a safe wrapper with its reasons written down

Nearly all real unsafe code follows one pattern. A small unsafe core sits inside a function or type. Around it is a **safe abstraction** — an interface that any safe code can call in any way it likes, and still never cause undefined behavior. The conditions that make the core correct are called **invariants** — facts that are true every time the unsafe code runs — and they are written down next to it.

The standard library is built this way. `Vec`, `String`, `HashMap`, `split_at_mut`: all have unsafe code inside and [[a safe interface outside|std-layers]]. That is why you have used them for six lessons without writing `unsafe` once.

There are three habits that make the pattern work.

1. **Check first, then trust.** The safe function checks every condition the unsafe core needs, usually with an `assert!` or by returning an error, before the unsafe line runs.
2. **Write a `SAFETY:` comment on every unsafe block.** It says, in plain words, why each condition holds at that line. This is a **[[safety comment|safety-comment]]**, a convention used throughout the standard library, and a reviewer reads it as an argument to check, not as decoration.
3. **Write a `# Safety` section on every `unsafe fn`.** It lists what the *caller* must guarantee. The caller's `SAFETY:` comment then says why they did.

::: example Splitting an IMU sample without two borrows of one array
An IMU sample holds six numbers: three gyro rates, then three accelerations. You want to correct the gyro half and the accel half with two separate `&mut` slices. Here is a safe function that does what `split_at_mut` does:

```rust
/// Splits `v` into two non-overlapping mutable halves at `mid`.
///
/// # Panics
/// Panics if `mid > v.len()`.
pub fn split_halves(v: &mut [f64], mid: usize) -> (&mut [f64], &mut [f64]) {
    let len = v.len();
    assert!(mid <= len, "mid {} is past the end ({})", mid, len);
    let p = v.as_mut_ptr();
    // SAFETY: `p` points to `len` valid, initialised f64 values, borrowed
    // exclusively through `v` for as long as the returned slices live.
    // The first slice covers [0, mid) and the second [mid, len). The assert
    // above guarantees mid <= len, so both ranges are in bounds, and the
    // ranges do not overlap, so the two &mut never alias.
    unsafe {
        (
            std::slice::from_raw_parts_mut(p, mid),
            std::slice::from_raw_parts_mut(p.add(mid), len - mid),
        )
    }
}

fn main() {
    // gyro x, y, z then accel x, y, z
    let mut imu = [0.01, -0.02, 0.005, 0.1, 0.0, -9.81];
    let (gyro, accel) = split_halves(&mut imu, 3);
    for g in gyro.iter_mut() {
        *g -= 0.005; // remove a known gyro bias
    }
    accel[2] += 9.81; // remove gravity from the z axis
    println!("{:?}", imu);
}
```

```text
[0.005, -0.025, 0.0, 0.1, 0.0, 0.0]
```

Walk through the argument the way a reviewer would.

1. `std::slice::from_raw_parts_mut(ptr, n)` is an unsafe function. Its documentation asks for a pointer to `n` valid values, not used through any other path while the slice lives.
2. The first call asks for `mid` values from the start: indices $0$ to $2$ when `mid` is $3$.
3. The second asks for `len - mid` values starting at `mid`: indices $3$ to $5$, since $6 - 3 = 3$.
4. The ranges $[0, 3)$ and $[3, 6)$ share no index, so the two `&mut` never point at the same `f64`.
5. Both end at or before index $6$, the length, only because the `assert!` has already rejected `mid > len`. Take the assert away, call it with `mid = 7`, and in a release build `len - mid` would wrap around to an enormous number: an out-of-bounds slice.

Now the numbers. The gyro values lose $0.005$ each: $0.01 - 0.005 = 0.005$, $-0.02 - 0.005 = -0.025$, $0.005 - 0.005 = 0$. The accel z value gains $9.81$: $-9.81 + 9.81 = 0$. The output matches. The same program also runs clean under Miri, which found no undefined behavior.

The payoff: the function signature is entirely safe. Any caller, in any order, with any `mid`, either gets two correct slices or a clean panic. There is no call that produces undefined behavior. That property has a name: the function is **[[sound|soundness]]**.
:::

::: key Wrapping unsafe
Keep the unsafe block as small as possible. Put a safe function or type around it that checks every precondition before the block runs. Write a `// SAFETY:` comment on each block saying why it is correct, and a `# Safety` doc section on each `unsafe fn` saying what the caller must guarantee.
:::

## Privacy is part of the proof

Sometimes the invariant is not about one call but about a whole type: "this field is always at most 4". Then the thing that protects it is Rust's **privacy** — the rule that a field without `pub` can only be touched by code in the same module.

Here is a small, allocation-free window of the latest sensor samples. It uses an unchecked slice to avoid a bounds check, and its safety rests on the field `len`:

```rust
mod window {
    const CAP: usize = 4;

    /// The last few samples, oldest first, with no heap allocation.
    pub struct Window {
        buf: [f64; CAP],
        // Invariant: len <= CAP, and buf[..len] holds the samples.
        len: usize,
    }

    impl Window {
        pub fn new() -> Self {
            Window { buf: [0.0; CAP], len: 0 }
        }

        /// Adds a sample; when full, the oldest one is dropped.
        pub fn push(&mut self, x: f64) {
            if self.len == CAP {
                self.buf.copy_within(1.., 0); // shift left by one
                self.buf[CAP - 1] = x;
            } else {
                self.buf[self.len] = x;
                self.len += 1;
            }
        }

        pub fn as_slice(&self) -> &[f64] {
            // SAFETY: the invariant len <= CAP holds, because `new` sets
            // len = 0 and `push` only increments it while len < CAP.
            // No other code can change `len`: the field is private.
            unsafe { self.buf.get_unchecked(..self.len) }
        }
    }
}

fn main() {
    let mut w = window::Window::new();
    for x in [10.0, 11.0, 12.5, 12.0, 11.5, 13.0] {
        w.push(x);
    }
    let s = w.as_slice();
    let mean = s.iter().sum::<f64>() / s.len() as f64;
    println!("{:?} mean = {}", s, mean);
}
```

```text
[12.5, 12.0, 11.5, 13.0] mean = 12.25
```

Six samples went in; the window keeps four, so the first two, $10.0$ and $11.0$, were pushed out. The mean is $(12.5 + 12.0 + 11.5 + 13.0) / 4 = 49 / 4 = 12.25$.

The `SAFETY:` comment makes an argument about *every* function that can change `len`. That argument is only finite because the field is private. Try to break it from outside the module:

```text
error[E0616]: field `len` of struct `Window` is private
  --> src/main.rs:41:7
   |
41 |     w.len = 100;
   |       ^^^ private field
```

If `len` were `pub`, a line of perfectly safe code, `w.len = 100;`, followed by `as_slice()` would read far past the end of a 4-element array. The unsafe block would not have changed at all, yet the abstraction would be broken. So the **module** is the real unit of trust: when you review unsafe code, you review every function in the module that can touch the fields its invariants mention.

::: warning Safe code can break an unsafe block next door
A change that touches no `unsafe` line can still introduce undefined behavior, if it edits a function that an invariant depends on. Change `push` to increment `len` one extra time, and `as_slice` becomes a bug even though it was not edited. Treat every function in a module that contains `unsafe` as part of that unsafe code when you review.
:::

## Keeping unsafe rare and visible

Because unsafe code needs a human argument, teams work to keep it rare and easy to find. Three tools help.

The first is a crate-wide ban. Put `#![forbid(unsafe_code)]` at the top of `main.rs` or `lib.rs`, and any `unsafe` block in that crate is an error:

```text
error: usage of an `unsafe` block
 --> src/main.rs:6:5
  |
6 |     unsafe { *p = 2.0 };
  |     ^^^^^^^^^^^^^^^^^^^
  |
note: the lint level is defined here
 --> src/main.rs:1:11
  |
1 | #![forbid(unsafe_code)]
  |           ^^^^^^^^^^^
```

A common layout on a real project is a large crate of flight logic with this ban, plus a small crate of drivers that is allowed `unsafe` and gets the extra review.

The second is a Clippy lint that insists on the comments. With `#![warn(clippy::undocumented_unsafe_blocks)]`, an unsafe block with no `SAFETY:` comment above it gets:

```text
warning: unsafe block missing a safety comment
 --> src/main.rs:6:5
  |
6 |     unsafe { *p = 2.0 };
  |     ^^^^^^^^^^^^^^^^^^^
  |
  = help: consider adding a safety comment on the preceding line
```

The third is on by default in the 2024 edition. Inside an `unsafe fn`, the body is *not* automatically an unsafe block any more. The compiler warns unless you wrap each unsafe operation in its own `unsafe { }`, which gives each one its own comment. The compiler explains the idea in one line: "an unsafe function restricts its caller, but its body is safe by default". Here is the pattern, with both kinds of documentation:

```rust
/// Returns the sample at `i` without a bounds check.
///
/// # Safety
/// `i` must be less than `v.len()`.
unsafe fn sample_unchecked(v: &[f64], i: usize) -> f64 {
    // SAFETY: the caller promises i < v.len(), so the pointer is in bounds.
    unsafe { *v.as_ptr().add(i) }
}

fn main() {
    let v = [9.79, 9.81, 9.83];
    // SAFETY: 1 < 3.
    let x = unsafe { sample_unchecked(&v, 1) };
    println!("{}", x);
}
```

```text
9.81
```

Compare this with C++, which has no marker at all: `v[i]` on a `std::vector` is unchecked, pointer arithmetic is ordinary syntax, and any line of any file might hold the memory bug, so an audit has to read everything. In Rust, searching for the word `unsafe` gives the complete list of places where memory safety rests on a human argument, each with its reasoning attached. That is a far smaller thing to review, test under Miri, and hand to a safety assessor.

::: note Why a sound wrapper makes the whole program safe
Safe Rust's promise is: no undefined behavior, as long as every unsafe block the program uses is correct. Suppose every unsafe block sits behind a sound interface, meaning no sequence of safe calls can make its preconditions false. Then take any safe program built on top. Every operation it performs is either checked by the compiler (safe code), or is a call into one of those interfaces, which by soundness cannot misbehave whatever arguments it gets. So there is no step at which undefined behavior can enter. The argument has one weak point, which is also the whole point of this lesson: it is only as strong as the human reasoning in each `SAFETY:` comment. That is why the comments exist, why the blocks are kept small, and why tools like Miri are used to test the reasoning.
:::

## Check yourself

::: check
Which of these lines needs to be inside an `unsafe` block? (a) `let p = &x as *const f64;` (b) `let y = *p;` (c) `let v = vec![1, 2]; let a = v[5];` (d) `COUNT += 1;` where `COUNT` is a `static mut`.
:::

::: answer
(a) No: creating a raw pointer is safe; an address alone cannot cause harm. (b) Yes: dereferencing a raw pointer is one of the five superpowers. (c) No: indexing a `Vec` is safe. It is bounds-checked, so index 5 on a two-element vector panics cleanly; `unsafe` would not remove that check. (d) Yes: modifying a mutable static is one of the five.
:::

::: check
A teammate wraps a function body in `unsafe { }` "to get the borrow checker to stop complaining" about two `&mut` borrows of the same struct. What happens, and what should they do instead?
:::

::: answer
The same borrow error appears, E0499, plus a warning that the `unsafe` block is unnecessary. `unsafe` enables only the five superpowers; the borrow rules for references stay fully on. The real fix is one of the borrow-checker fixes from lesson 03: shorten one borrow, borrow two different fields separately, or split the data (for a slice, `split_at_mut`) so the two `&mut` point at different memory.
:::

::: check
In `split_halves`, the `assert!(mid <= len)` is deleted. Give a call from safe code that now causes undefined behavior, and say what goes wrong.
:::

::: answer
`split_halves(&mut [1.0, 2.0, 3.0], 5)`. The first slice asks for 5 values starting at index 0, but only 3 exist, so it covers 2 values of memory that are not part of the array. The second computes `len - mid` as `3 - 5`, which panics on overflow in a debug build but wraps around to an enormous length in a release build. Either slice can then read or write memory the function does not own. Since a safe call produced undefined behavior, the function is no longer sound.
:::

::: check
Why does the `Window` type's `SAFETY:` comment mention that `len` is private? What would you have to re-check if someone added a `pub fn clear(&mut self)` to the module?
:::

::: answer
The comment's argument is "every function that can change `len` keeps it at most `CAP`". That is only a finite list to check because privacy stops code outside the module from writing `len`. A new `clear` inside the module can change `len`, so it joins the list: you must check it sets `len` to a value no greater than `CAP` (setting it to 0 is fine). If it did something else, `as_slice` would become unsound without being edited.
:::

::: check
Write the `# Safety` doc section and the call-site `SAFETY:` comment for an unsafe function `fn read_reg(addr: *const u32) -> u32` that reads a hardware register.
:::

::: answer
A reasonable version:

```rust
/// Reads a 32-bit hardware register.
///
/// # Safety
/// `addr` must be the address of a readable 32-bit register on this
/// device, aligned to 4 bytes, and reading it must have no side effect
/// the caller is not prepared for.
unsafe fn read_reg(addr: *const u32) -> u32 {
    // SAFETY: the caller guarantees addr is a valid, aligned register.
    unsafe { core::ptr::read_volatile(addr) }
}
```

At the call site: `// SAFETY: STATUS_ADDR is the status register given in the chip's reference manual; it is 4-byte aligned and reading it has no side effect.` The point is that the comment names its source of truth. The doc section says what the caller must promise; the call-site comment says why this caller kept that promise.
:::

## Summary

| Idea | Meaning | Rust fact |
|---|---|---|
| `unsafe { }` | Unlocks five operations | Everything else, including the borrow checker, stays on |
| Raw pointer | `*const T`, `*mut T` | Creating is safe; dereferencing needs `unsafe` |
| `unsafe fn` | A function with an unchecked precondition | Called only inside `unsafe`; document it under `# Safety` |
| `extern "C"` | Functions from C (FFI) | Unsafe to call by default |
| `unsafe impl` | Signing for a trait's promise | `Send` and `Sync` are the usual ones |
| `static mut` | A mutable global | Every access is unsafe; prefer atomics or a `Mutex` |
| `union` | Fields sharing one set of bytes | Reading a field is unsafe |
| `// SAFETY:` | The argument for one block | Checked in review; `clippy::undocumented_unsafe_blocks` insists on it |
| Sound | No safe call can cause undefined behavior | Privacy of fields is part of the argument |
| Miri | Interpreter that detects undefined behavior | `cargo +nightly miri run` |

The superpowers themselves are only half the story; the other half is the interfaces you build around them, and those interfaces are traits. The next lesson shows how to define a trait such as `Sensor`, how to call it through generics or through `dyn`, and what each choice costs.

::: context raw-pointer An address with a type
A raw pointer is the plainest kind of pointer: a number that is a memory address, plus a type that says what should be found there. A reference `&T` carries promises: not null, pointing at a live, correctly aligned `T`, following the borrow rules. A raw pointer carries none of them. That is what makes it useful (you can point at a hardware register nobody owns, or at memory not filled in yet) and what makes following it the programmer's responsibility. In the `split_halves` example, one raw pointer `p` becomes two non-overlapping slices:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <rect x="30" y="50" width="50" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="55" y="69">0</text>
    <rect x="80" y="50" width="50" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="105" y="69">1</text>
    <rect x="130" y="50" width="50" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="155" y="69">2</text>
    <rect x="180" y="50" width="50" height="30" fill="#f2b880" stroke="#1f2a44"/><text x="205" y="69">3</text>
    <rect x="230" y="50" width="50" height="30" fill="#f2b880" stroke="#1f2a44"/><text x="255" y="69">4</text>
    <rect x="280" y="50" width="50" height="30" fill="#f2b880" stroke="#1f2a44"/><text x="305" y="69">5</text>
  </g>
  <text x="55" y="24" font-size="12" text-anchor="middle" fill="#1d6fd1">p</text>
  <line x1="55" y1="29" x2="55" y2="44" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="55,49 50,40 60,40" fill="#1d6fd1"/>
  <text x="205" y="24" font-size="12" text-anchor="middle" fill="#b4232c">p.add(3)</text>
  <line x1="205" y1="29" x2="205" y2="44" stroke="#b4232c" stroke-width="2"/>
  <polygon points="205,49 200,40 210,40" fill="#b4232c"/>
  <line x1="30" y1="96" x2="178" y2="96" stroke="#1d6fd1" stroke-width="2"/>
  <text x="105" y="114" font-size="12" text-anchor="middle" fill="#1d6fd1">gyro: [0, 3)</text>
  <line x1="182" y1="96" x2="330" y2="96" stroke="#b4232c" stroke-width="2"/>
  <text x="255" y="114" font-size="12" text-anchor="middle" fill="#b4232c">accel: [3, 6)</text>
</svg>
```
:::

::: context ffi Talking to other languages
FFI stands for "foreign function interface": the rules for calling a function written in another language. C's calling convention is the common ground almost every language can speak, so `extern "C"` means "use C's rules for passing arguments and returning results". In the 2024 edition the block itself is written `unsafe extern "C"`, a reminder that you are vouching for every declaration inside it: if you write the wrong argument types, nothing checks. The next module, on Rust in aerospace, has a full lesson on FFI in both directions, including `bindgen`, which generates these declarations from a C header so a human does not have to type them.
:::

::: context mutable-static Why globals are a hazard
A mutable global can be reached from anywhere, so the compiler cannot tell who else might be using it at the same moment. On a microcontroller the "someone else" is often an interrupt handler: the main loop is halfway through updating a counter when a timer interrupt fires and updates it too. That is a data race on a single core. Embedded Rust usually avoids `static mut` entirely, using atomics, or the `critical-section` crate and a `Mutex` that is only unlocked with interrupts briefly disabled. The next module covers both.
:::

::: context union-bits The bits of 1.0
A 32-bit float in the IEEE 754 standard is three fields packed into one word: 1 sign bit, 8 exponent bits and 23 fraction bits. For $1.0$, the sign is 0 (positive), the exponent field is 127, which the standard reads as $2^{127 - 127} = 2^0$, and the fraction is all zeros, meaning $1.0$ exactly. Written in binary that is `0 01111111 000…0`, which is `0x3f800000` in hexadecimal. The union let the program see that pattern directly. For this particular job safe Rust has `f32::to_bits`, which does the same thing with no `unsafe`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="24" height="34" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="44" y="30" width="96" height="34" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="140" y="30" width="200" height="34" fill="#fff" stroke="#1f2a44"/>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="32" y="52">0</text>
    <text x="92" y="52">01111111</text>
    <text x="240" y="52">000 0000 0000 0000 0000 0000</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#6c7a93">
    <text x="32" y="20">sign</text>
    <text x="92" y="20">exponent = 127</text>
    <text x="240" y="20">fraction = 0 (23 bits)</text>
  </g>
  <text x="180" y="92" font-size="12" text-anchor="middle" fill="#1d6fd1">hex: 3F 80 00 00</text>
</svg>
```
:::

::: context miri An interpreter that checks every step
Miri gets its name from MIR, the mid-level intermediate representation the Rust compiler uses internally: it is a MIR interpreter. Instead of compiling your program to machine code, it runs it one step at a time and keeps track of every allocation, every pointer and every borrow. It detects undefined behavior in unsafe code: out-of-bounds, misaligned access, invalid aliasing under Stacked Borrows, uninitialised reads. It is the Rust equivalent of running everything under a very strict sanitizer. It only runs on the nightly toolchain (install it with `rustup +nightly component add miri`), it is far slower than a native run, and it only checks the paths your tests actually take. Lesson 11 puts it next to the other testing tools.
:::

::: context std-layers Safe on top, unsafe at the bottom
Most programs are a tall stack of safe code resting on a thin layer of unsafe code, which rests on the hardware. Each unsafe core is wrapped by a sound interface, so everything above it can be checked by the compiler alone.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="14" width="300" height="40" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="39" font-size="12" text-anchor="middle" fill="#1f2a44">your flight logic: safe code only</text>
  <rect x="30" y="62" width="300" height="34" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="180" y="84" font-size="12" text-anchor="middle" fill="#1f2a44">sound interfaces: Vec, split_at_mut, driver API</text>
  <rect x="90" y="104" width="180" height="26" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="180" y="122" font-size="12" text-anchor="middle" fill="#1f2a44">small unsafe cores + SAFETY</text>
  <rect x="30" y="138" width="300" height="24" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="180" y="155" font-size="11" text-anchor="middle" fill="#6c7a93">memory, registers, C libraries</text>
</svg>
```

The next module shows this layering in embedded crates, where the bottom layer is a peripheral access crate full of register reads and writes.
:::

::: context safety-comment Writing the argument down
The `// SAFETY:` convention is used across the Rust standard library and most large Rust projects. A good comment names each precondition of the unsafe operation and says where it comes from: "the assert above", "the field is private and only `push` changes it", "the caller promised in the `# Safety` section". A bad comment says "this is safe" and nothing else. Reviewers read the good kind the way a teacher reads a proof: every step must follow. If the comment is hard to write, that is a strong sign the design needs to change.
:::

::: context soundness Sound and unsound
In logic, an argument is sound when its steps are valid and its starting facts are true, so its conclusion can be trusted. Rust borrowed the word. A safe function or type is sound if no possible use of it from safe code can cause undefined behavior. It is unsound if some safe call, however strange, can. Unsoundness counts as a serious bug in Rust libraries even when no real program has triggered it yet, because the whole promise of safe Rust depends on every unsafe core being sound. In the Rust ecosystem, unsoundness reports on widely used crates are often published as security advisories.
:::
