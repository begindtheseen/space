---
id: l06-send-sync-box-pin-and-drop
title: Send, Sync, Box, Pin and Drop
minutes: 24
covers:
  - 'Send and Sync: thread safety as a type-system property'
  - 'Box and Pin (awareness); Drop as Rust RAII'
---

Picture a company with offices in two cities. Some things can be mailed from one office to the other: a signed contract, a box of spare parts. Once mailed, it belongs to the other office. Other things make no sense to mail, like a sticky note that says "see the whiteboard behind you".

And some things can be *viewed* from both offices at once. A published schedule on a shared screen is fine, because nobody changes it while others look. A spreadsheet that one office is typing into is not something the other should read at the same moment.

Rust puts these two questions into the type system. Can a value of this type be handed to another thread? That is **Send**. Can a reference to it be used by several threads at once? That is **Sync**. The compiler answers both for every type and refuses any program that sends or shares the wrong thing. The second half of the lesson covers **Box**, a pointer that owns heap memory; **Pin**, a promise that a value will not move; and **Drop**, the cleanup that runs when an owner goes away — the reason every lock guard in lesson 05 unlocked by itself.

## Send: may this value move to another thread?

In lesson 05 you used `Arc` to share a counter between threads, and you read that `Rc` would not be allowed. Here is the refusal:

```rust
use std::rc::Rc;
use std::thread;

fn main() {
    let config = Rc::new(String::from("mode=ASCENT"));
    let handle = thread::spawn(move || {
        println!("{}", config);
    });
    handle.join().unwrap();
}
```

```text
error[E0277]: `Rc<String>` cannot be sent between threads safely
 --> src/main.rs:6:32
  |
6 |       let handle = thread::spawn(move || {
  |                    ------------- ^------
  |                    |             |
  |  __________________|_____________within this `{closure@src/main.rs:6:32: 6:39}`
  | |                  |
  | |                  required by a bound introduced by this call
7 | |         println!("{}", config);
8 | |     });
  | |_____^ `Rc<String>` cannot be sent between threads safely
  |
  = help: within `{closure@src/main.rs:6:32: 6:39}`, the trait `Send` is not implemented for `Rc<String>`
note: required by a bound in `spawn`
```

(trimmed). The `help` line says "the trait `Send` is not implemented for `Rc<String>`", and the last note says who demanded it: `thread::spawn` has a **bound** — a requirement on its argument's type — that the closure be `Send`.

`Send` is a **[[marker trait|marker-trait]]**: a trait with no methods at all, whose only job is to record a fact about a type. `T: Send` means: it is safe to move a value of type `T` to another thread and let that thread own it.

Why is `Rc` not `Send`? All the handles to one value share a single count, updated with plain, non-atomic increments. If `main` kept one handle and a thread got another, both could clone or drop at the same moment: the [[lost-update race|rc-count-race]] from lesson 02. A wrong count means the value is freed while still in use, or never freed. `Arc` fixes that with atomic updates, and `Arc` is `Send`.

Almost everything is `Send`: numbers, `String`, `Vec<f64>`, arrays, and structs made of those. The exceptions secretly share something unsynchronized, like `Rc`, or are raw pointers the compiler cannot reason about.

## Sync: may several threads look at it at once?

The second question is about sharing, not moving. `T: Sync` means several threads may safely hold a `&T` to the same value at once. Exactly:

- `T` is `Sync` exactly when `&T` is `Send`.

"Can I share it?" is the same question as "can I mail a *reference* to it?". The compiler phrases its errors that way. Let two threads bump one `Cell` counter:

```rust
use std::cell::Cell;
use std::thread;

fn main() {
    let count = Cell::new(0u32);
    thread::scope(|s| {
        s.spawn(|| count.set(count.get() + 1));
        s.spawn(|| count.set(count.get() + 1));
    });
    println!("{}", count.get());
}
```

```text
error[E0277]: `Cell<u32>` cannot be shared between threads safely
 --> src/main.rs:7:17
  |
7 |         s.spawn(|| count.set(count.get() + 1));
  |           ----- ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ `Cell<u32>` cannot be shared between threads safely
  |           |
  |           required by a bound introduced by this call
  |
  = help: the trait `Sync` is not implemented for `Cell<u32>`
  = note: if you want to do aliasing and mutation between multiple threads, use `std::sync::RwLock` or `std::sync::atomic::AtomicU32` instead
  = note: required for `&Cell<u32>` to implement `Send`
```

(trimmed). Look at the last note: "required for `&Cell<u32>` to implement `Send`". That is the definition, printed by the compiler. Each closure borrows `count`, so each thread is sent a `&Cell<u32>`, which is allowed only if `Cell<u32>` is `Sync`. It is not: `Cell` changes its value through `&` with no protection, which from two threads is a data race.

Notice what *is* allowed. A `Cell` or a `RefCell` can be **moved** to another thread, as long as that thread becomes its only user. They are `Send` but not `Sync`:

```rust
use std::cell::RefCell;
use std::sync::Arc;
use std::thread;

fn main() {
    let log = RefCell::new(vec![String::from("boot")]);
    let handle = thread::spawn(move || {
        log.borrow_mut().push(String::from("worker started"));
        log.into_inner()
    });
    let lines = handle.join().unwrap();
    println!("{:?}", lines);

    let config = Arc::new(String::from("mode=ASCENT"));
    let c2 = Arc::clone(&config);
    let h = thread::spawn(move || c2.len());
    println!("worker saw {} bytes, main still has {}", h.join().unwrap(), config);
}
```

```text
["boot", "worker started"]
worker saw 11 bytes, main still has mode=ASCENT
```

The `RefCell` went to the worker, which used it and handed back the `Vec` inside (`into_inner` consumes the cell). No two threads could reach it at once. The `Arc<String>` was shared by both threads, which is fine because through an `Arc` a `String` can only be read. `"mode=ASCENT"` is $4 + 1 + 6 = 11$ bytes.

::: key Send and Sync in one line each
Send means the type can be moved to another thread; Sync means &T can be shared across threads. Both are automatically derived, so thread safety is checked by the type system rather than by discipline.
:::

## Derived automatically, checked everywhere

You never write `impl Send for Telemetry`. Send and Sync are **[[auto traits|auto-traits]]**: the compiler decides them from what the type is made of. A struct is `Send` if every field is `Send`, and `Sync` if every field is `Sync`. Put one `Rc` inside a big struct, and the whole struct stops being `Send`. The fact travels with the type, through every layer of nesting, without anyone having to remember it.

Here is how the types you know sort out:

| Type | Send | Sync | Why |
|---|---|---|---|
| `f64`, `String`, `Vec<f64>`, `[u8; 6]` | yes | yes | Plain owned data |
| `Rc<T>` | no | no | Non-atomic shared count |
| `Arc<T>` (with `T` both Send and Sync) | yes | yes | Atomic count |
| `Cell<T>`, `RefCell<T>` | yes | no | Unsynchronized change through `&` |
| `Mutex<T>` (with `T: Send`) | yes | yes | The lock makes sharing safe |
| `MutexGuard<T>` | no | yes, if `T` is Sync | Must be [[unlocked by the thread that locked it|guard-not-send]] |
| raw pointers `*const T`, `*mut T` | no | no | The compiler knows nothing about them |

Read the `Mutex` row carefully: a `Mutex<T>` is `Sync` when `T` is merely `Send`. That is the trick of a lock: only one thread at a time gets in, so the value is in effect handed from one thread to the next.

Now put the module's pieces together. A **data race**, as lesson 02 showed, needs three ingredients at once: two paths to the same memory (aliasing), at least one writing (mutation), and two threads (concurrency). The borrow rules forbid aliasing together with mutation. Send and Sync decide what may cross between threads, and let through only types that cannot be changed through `&` or that protect the change with a lock or atomic. So safe Rust cannot assemble all three ingredients. The guarantee is not a test result; it holds for every program that compiles.

::: example Why thread::spawn asks for Send and 'static
The standard library declares `thread::spawn` like this (lightly simplified):

```rust
pub fn spawn<F, T>(f: F) -> JoinHandle<T>
where
    F: FnOnce() -> T + Send + 'static,
    T: Send + 'static,
{
    // ...
}
```

This is a fragment of a signature, not a program. Read the `where` clause aloud: "`F` is a closure that can be called once and returns a `T`; `F` and `T` are both Send and 'static". Each requirement blocks one real bug.

1. `F: Send` — the closure and everything it captured move to the new thread. Capturing an `Rc` fails here.
2. `F: 'static` — the thread might outlive the function that spawned it, so the closure must not borrow that function's locals (lesson 04's E0373).
3. `T: Send + 'static` — the return value travels back to whoever calls `join`, so it must be safe to move too.

`thread::scope` relaxes rule 2, because a scope waits for its threads before its locals die. It never relaxes rule 1: the `Cell` example above failed inside a scope.
:::

::: warning Sync is not "safe to change from many threads"
`Sync` means only that shared references may cross threads; what you can do through them is still up to the type. An `Arc<Vec<f64>>` is Sync, but through it you can only read the vector. To change shared data from several threads you need a `Mutex`, an `RwLock`, or an atomic. And if you see `unsafe impl Send for ...` in a code review, read it closely: it is a promise the compiler cannot check, the subject of lesson 07.
:::

## Box: owning something on the heap

A `Box<T>` (read "box of T") is the simplest smart pointer: a pointer to a value on the heap, and that value's single owner. On the stack it is one pointer, 8 bytes on a 64-bit machine. `Box::new(v)` moves `v` to the heap, `*b` (read "star b") reaches it, and dropping the `Box` drops the value and frees the memory. Three situations call for one:

1. **A type that contains itself**, like a command sequence where each part is itself a command.
2. **Something large**, expensive to move or too big for a small stack.
3. **A value whose exact type is chosen at runtime**, `Box<dyn Trait>`, which is lesson 08's topic.

Here is situation 1 without a `Box`:

```rust
enum Command {
    Wait(u32),
    Fire { engine: u8, ms: u32 },
    Then(Command, Command),
}

fn main() {}
```

```text
error[E0072]: recursive type `Command` has infinite size
 --> src/main.rs:1:1
  |
1 | enum Command {
  | ^^^^^^^^^^^^
...
4 |     Then(Command, Command),
  |          ------- recursive without indirection
  |
help: insert some indirection (e.g., a `Box`, `Rc`, or `&`) to break the cycle
```

(trimmed). The compiler must know the size of every type. A `Command` containing two `Command`s, each containing two more, would be infinitely big. A `Box<Command>` is always one pointer, however big the thing it points to.

::: example A burn sequence as a tree
Fire engine 1 for 1500 ms, wait 200 ms, then fire engine 2 for 800 ms.

```rust
use std::mem::size_of;

enum Command {
    Wait(u32),
    Fire { engine: u8, ms: u32 },
    Then(Box<Command>, Box<Command>),
}

fn duration_ms(c: &Command) -> u32 {
    match c {
        Command::Wait(ms) => *ms,
        Command::Fire { engine, ms } => {
            println!("  engine {} fires for {} ms", engine, ms);
            *ms
        }
        Command::Then(a, b) => duration_ms(a) + duration_ms(b),
    }
}

fn main() {
    // fire engine 1 for 1500 ms, wait 200 ms, then fire engine 2 for 800 ms
    let seq = Command::Then(
        Box::new(Command::Fire { engine: 1, ms: 1500 }),
        Box::new(Command::Then(
            Box::new(Command::Wait(200)),
            Box::new(Command::Fire { engine: 2, ms: 800 }),
        )),
    );
    println!("total: {} ms", duration_ms(&seq));
    println!("Box<Command>: {} bytes, Command: {} bytes", size_of::<Box<Command>>(), size_of::<Command>());
    let big = Box::new([0.0f64; 4096]);
    println!("on the stack, the Box of {} floats is {} bytes", big.len(), size_of::<Box<[f64; 4096]>>());
}
```

```text
  engine 1 fires for 1500 ms
  engine 2 fires for 800 ms
total: 2500 ms
Box<Command>: 8 bytes, Command: 24 bytes
on the stack, the Box of 4096 floats is 8 bytes
```

Follow the recursion. `duration_ms(seq)` sees `Then(a, b)`. `a` is the first `Fire`: 1500. `b` is another `Then`, whose parts give 200 and 800. Total: $1500 + (200 + 800) = 2500$ ms, 2.5 s. Passing `a`, a `&Box<Command>`, where a `&Command` is expected works because Rust follows the box automatically.

The sizes: a `Box<Command>` is 8 bytes, so a `Command` has a fixed size (24 bytes: two boxes plus room for the tag saying which variant it is). The big array holds $4096 \times 8 = 32{,}768$ bytes, yet costs 8 bytes on the stack, so moving it copies 8 bytes, not 32 KiB. When `seq` goes out of scope, each `Command` drops its boxes, all the way down: four `Box::new` calls, four frees, no code written for them.
:::

::: warning Box needs a heap
Every `Box::new` is a heap allocation. On a small flight computer there may be [[no heap at all|box-no-heap]], or a rule allowing allocation only at startup. Embedded Rust often avoids `Box` and uses fixed-size arrays and statically sized collections, as the next module shows.
:::

## Pin: a promise not to move (awareness)

Moving a value is normally harmless: its bytes are copied to a new place, and the old place is forgotten. That is safe because a value normally does not point at itself.

Some values do. An `async` block (code that can pause at each `.await` and continue later) is turned by the compiler into a hidden struct holding the locals it needs across the pause. If one local refers to another, the struct contains a [[pointer into itself|self-referential]]. Move it, and that pointer still holds the old address: a use-after-move bug.

`Pin<P>` (read "pin of P", where `P` is a pointer such as `Box<T>` or `&mut T`) is the fix. It promises that the value it points to will never move again until it is dropped. Most types do not care about moving; they carry the auto trait **Unpin**, meaning "pinning me is no restriction". Numbers, `String`, `Vec` and ordinary structs are all `Unpin`. Here is one that is not:

```rust
fn assert_unpin<T: Unpin>(_: &T) {}

fn main() {
    let x = 5.0f64;
    assert_unpin(&x);
    let fut = async {
        let reading = 9.81f64;
        let r = &reading;
        std::future::ready(()).await;
        println!("{}", r);
    };
    assert_unpin(&fut);
}
```

```text
error[E0277]: `{async block@src/main.rs:6:15: 6:20}` cannot be unpinned
  --> src/main.rs:12:18
   |
12 |     assert_unpin(&fut);
   |     ------------ ^^^^ the trait `Unpin` is not implemented for `{async block@src/main.rs:6:15: 6:20}`
   |
   = note: consider using the `pin!` macro
           consider using `Box::pin` if you need to access the pinned value outside of the current scope
```

(trimmed). The `f64` passed; the `async` block did not. Async blocks are never `Unpin`, because, as here, a local like `r` may refer to another local stored inside the block itself. The compiler suggests the two usual ways to pin: the `pin!` macro, on the stack, and `Box::pin`, on the heap. With `Box::pin` you can run the block by hand:

```rust
use std::future::Future;
use std::task::{Context, Poll, Waker};

fn main() {
    let mut fut = Box::pin(async {
        let reading = 9.81f64;
        let r = &reading; // a reference into the future's own storage
        std::future::ready(()).await;
        *r * 2.0
    });

    let mut cx = Context::from_waker(Waker::noop());
    match fut.as_mut().poll(&mut cx) {
        Poll::Ready(v) => println!("ready: {}", v),
        Poll::Pending => println!("pending"),
    }
}
```

```text
ready: 19.62
```

`poll` runs a paused computation until it next has to wait. It takes `Pin<&mut Self>`, so it cannot be called on an unpinned future; `fut.as_mut()` supplies that. The block returns $9.81 \times 2 = 19.62$. Normally an **executor** calls `poll` for you, the job of an async framework such as the [[embedded ones in the next module|async-embedded]]. Awareness is enough here: `Pin` exists because some values point into themselves, it keeps async code sound, and `Unpin` types never notice it.

## Drop: Rust's RAII

Lesson 01 showed `Drop` running when an owner leaves its scope, and lesson 05 used it everywhere: every `RefMut` handed back its borrow and every `MutexGuard` unlocked in its drop. A resource tied to a value, released when the value dies, is RAII, and `Drop` is how Rust spells it. You implement the `Drop` trait's one method, `fn drop(&mut self)`. The rules for *when* it runs are precise:

1. **At scope exit, in reverse order.** Local variables are dropped when their scope ends, the last one declared first. Like plates stacked on a shelf, the last one put down is the first one taken off.
2. **Moved-from values are not dropped.** A value is dropped once, by whoever owns it at the end.
3. **The struct first, then its fields.** A struct's own `drop` runs, then each of its fields is dropped, in the order the fields are declared.
4. **Early exits count.** A `return`, a `?`, or a `break` leaving a scope drops that scope's values on the way out.

::: example A heater that always switches off
A thermal-control guard: creating a `Heater` switches it on, dropping it switches it off.

```rust
struct Heater {
    zone: &'static str,
}

impl Heater {
    fn on(zone: &'static str) -> Heater {
        println!("heater {} ON", zone);
        Heater { zone }
    }
}

impl Drop for Heater {
    fn drop(&mut self) {
        println!("heater {} OFF", self.zone);
    }
}

struct ThermalPass {
    first: Heater,
    second: Heater,
}

impl Drop for ThermalPass {
    fn drop(&mut self) {
        println!("thermal pass ending ({} and {})", self.first.zone, self.second.zone);
    }
}

fn warm_tank(temp_c: f64) -> Result<(), String> {
    let _guard = Heater::on("tank");
    if temp_c < -40.0 {
        return Err(format!("sensor reads {} C, out of range", temp_c));
    }
    println!("warming tank from {} C", temp_c);
    Ok(())
}

fn main() {
    let _a = Heater::on("A");
    let b = Heater::on("B");
    let c = Heater::on("C");
    drop(b);
    println!("-- b dropped early by hand");

    let _moved = c;
    println!("-- c moved into `_moved`");

    println!("{:?}", warm_tank(-12.5));
    println!("{:?}", warm_tank(-80.0));

    let _pass = ThermalPass { first: Heater::on("P1"), second: Heater::on("P2") };
    println!("-- end of main");
}
```

```text
heater A ON
heater B ON
heater C ON
heater B OFF
-- b dropped early by hand
-- c moved into `_moved`
heater tank ON
warming tank from -12.5 C
heater tank OFF
Ok(())
heater tank ON
heater tank OFF
Err("sensor reads -80 C, out of range")
heater P1 ON
heater P2 ON
-- end of main
thermal pass ending (P1 and P2)
heater P1 OFF
heater P2 OFF
heater C OFF
heater A OFF
```

Match each OFF line to a rule.

1. `drop(b)` switches B off at once. `drop` is a standard function that takes ownership and lets its parameter fall out of scope.
2. Moving `c` into `_moved` printed nothing: rule 2. It is still one heater, switched off once, by its new owner.
3. The first `warm_tank` runs to the end, and the guard switches the tank heater off. The second returns early with `Err`, and the heater *still* switches off: rule 4. No cleanup code on the error path, so none to forget.
4. At the end of `main`, the survivors go in reverse declaration order: `_pass`, then `_moved` (heater C), then `_a`.
5. Inside `_pass`, the struct's own `drop` prints first, *then* its fields go in declaration order, P1 then P2: rule 3.

Count them: seven ONs (A, B, C, the tank twice, P1, P2) and seven OFFs. Every ON has exactly one OFF.
:::

::: warning `let _ =` drops at once
A name starting with an underscore, like `_guard`, tells the compiler "I will not use this name, do not warn me", and the value lives to the end of the scope. A bare underscore is different: `let _ = ...` binds nothing, so the value is dropped on the same line:

```rust
struct Heater(&'static str);
impl Drop for Heater {
    fn drop(&mut self) {
        println!("heater {} OFF", self.0);
    }
}
fn main() {
    let _ = Heater("X");
    let _kept = Heater("Y");
    println!("doing the thermal work");
}
```

```text
heater X OFF
doing the thermal work
heater Y OFF
```

X was off before the work started. With a lock guard, `let _ = m.lock().unwrap();` locks and immediately unlocks, protecting nothing. Always give a guard a name.
:::

Two more rules close the picture. First, you cannot call the method yourself:

```rust
struct Heater;
impl Drop for Heater {
    fn drop(&mut self) {
        println!("off");
    }
}
fn main() {
    let h = Heater;
    h.drop();
}
```

```text
error[E0040]: explicit use of destructor method
 --> src/main.rs:9:7
  |
9 |     h.drop();
  |       ^^^^ explicit destructor calls not allowed
  |
help: consider using `drop` function
```

(trimmed). If you could call `h.drop()`, `h` would still exist afterwards and be dropped *again* at the end of the scope. The function `drop(h)` takes `h` by value, so that cannot happen. In the standard library its body is empty, `pub fn drop<T>(_x: T) {}`: ownership moves in, the parameter goes out of scope, and the ordinary rules do the rest.

Second, a type cannot be both `Copy` and `Drop`: deriving `Copy` on a type with a `Drop` impl gives "error[E0184]: the trait `Copy` cannot be implemented for this type; the type has a destructor". A silent copy of a heater would mean two OFFs for one ON.

::: key How Drop compares to a C++ destructor
Same idea, run at scope exit in reverse declaration order. The differences: Drop cannot be called manually (you use drop()), a moved-from value is not dropped, and there is no need for the rule of five because moves are built into the language.
:::

For C++ readers: a C++ class that manages a resource usually needs the **[[rule of five|rule-of-five]]**, a destructor plus matching copy and move constructors and assignments. In Rust a move is a plain copy of the bytes after which the old binding is dead, and copying happens only through an explicit `Clone`. A Rust resource type is typically the struct plus a `Drop`.

::: warning Drop is likely, not guaranteed
Safe Rust promises no use-after-free, not that every destructor runs. `std::mem::forget(x)` gives up a value without dropping it, and it is [[a safe function|no-leak-promise]]; an `Rc` cycle never drops; and with `panic = "abort"` no destructors run at all. So `Drop` is the right place to free memory or unlock a lock, but never the *only* thing between the spacecraft and a hazard. A heater that must not stay on also needs a hardware timer or watchdog that cuts it if the software goes quiet.
:::

## Check yourself

::: check
Say whether each type is Send and whether it is Sync, and give the reason in a few words: (a) `Vec<f64>` (b) `Rc<u32>` (c) `RefCell<[f64; 3]>` (d) `Arc<Mutex<Vec<u8>>>`.
:::

::: answer
(a) Both: plain owned data, and through `&Vec` you can only read. (b) Neither: its shared count is updated without atomics, so two threads holding handles could corrupt it. (c) Send, not Sync: one thread may own it and hand it over, but two threads holding `&RefCell` could both change it through the unsynchronized counter. (d) Both: `Mutex<Vec<u8>>` is Send and Sync because `Vec<u8>` is Send, and an `Arc` of a Send-and-Sync type is both. It is the standard shared, changeable value between threads.
:::

::: check
A `struct Estimator { state: [f64; 6], history: Rc<Vec<f64>> }` is passed to `thread::spawn` inside a `move` closure. What happens, why, and what are two fixes?
:::

::: answer
It fails with E0277, "`Rc<Vec<f64>>` cannot be sent between threads safely". Send is an auto trait: `Estimator` is Send only if every field is, and the `Rc` field is not. Fixes: use `Arc<Vec<f64>>` if the history really is shared; or, better if nothing else needs it, a plain `Vec<f64>` that the thread owns outright.
:::

::: check
Explain in your own words why Rust can promise no data races for every program that compiles without `unsafe`.
:::

::: answer
A data race needs aliasing, mutation and concurrency together. The borrow rules never let a writable path coexist with any other path. Send and Sync let a shared reference cross threads only when changes through it are impossible or guarded by a lock or atomic. So no safe program brings all three together, and because the check is on types at compile time, it holds for every run, not only the tested ones.
:::

::: check
Why does `enum Tree { Leaf(f64), Node(Tree, Tree) }` fail to compile, and why does changing it to `Node(Box<Tree>, Box<Tree>)` fix it? How big is each `Box` on a 64-bit machine?
:::

::: answer
A `Tree` holding two `Tree`s inline would contain itself, so its size would be infinite (E0072). A `Box<Tree>` is a pointer to a `Tree` on the heap, 8 bytes on a 64-bit machine however deep the tree grows. So `Node` holds 16 bytes of pointers plus a tag: a finite size.
:::

::: check
Predict the output:

```rust
struct Tag(&'static str);
impl Drop for Tag {
    fn drop(&mut self) { println!("drop {}", self.0); }
}
fn main() {
    let _x = Tag("x");
    let y = Tag("y");
    let _z = y;
    let _ = Tag("w");
    println!("end");
}
```
:::

::: answer
```text
drop w
end
drop y
drop x
```

`let _ = Tag("w")` binds nothing, so `w` is dropped on that line, before "end". `let _z = y;` moves the `y` tag into `_z`; the binding `y` owns nothing and is not dropped. At the end of `main`, bindings go in reverse declaration order: `_z` (holding the tag labeled "y"), then `_x`. The printed label is the tag's text, not the binding's name.
:::

## Summary

| Idea | Meaning |
|---|---|
| `T: Send` | A `T` may be moved to another thread |
| `T: Sync` | `&T` may be shared across threads; `T: Sync` exactly when `&T: Send` |
| Auto traits | Derived from the fields; one non-Send field makes the whole type non-Send |
| `Rc` / `Cell` / `RefCell` | Not Sync (and `Rc` not Send): unsynchronized shared state |
| `Arc` / `Mutex` | Send and Sync (given a Send inner type); the thread-safe versions |
| No data races | Borrow rules forbid aliasing plus mutation; Send/Sync police what crosses threads |
| `Box<T>` | Owning heap pointer, 8 bytes; recursive types, large data, `dyn Trait` |
| `Pin<P>` | The pointee will not move again; needed by self-referential async code |
| `Unpin` | Auto trait: moving is harmless, so pinning is no restriction |
| `Drop` | Scope exit, reverse declaration order; struct before fields |
| `drop(x)` | Ends a value early; `x.drop()` is E0040 |
| Copy + Drop | Not allowed together (E0184) |

Everything in this module so far has been safe Rust, where the compiler checks every rule. The next lesson opens the one door where it does not: `unsafe`, the five operations it unlocks, and the discipline of wrapping them in a safe abstraction with its invariants written down.

::: context marker-trait A label with no methods
Most traits describe what a type can *do*: `Display` can format it, `Iterator` can step through it. A marker trait describes what a type *is*, and has no methods at all. `Send`, `Sync`, `Copy`, `Unpin` and `Sized` are the standard ones. They live in `std::marker`, which is where the name comes from. The compiler uses them the way an inspector uses a stamp on a pressure vessel: it does not change the vessel, but some operations are only allowed on stamped ones. Traits in general are lessons 08 and 09.
:::

::: context rc-count-race Two threads, one count
If two threads each held an `Rc` to the same value, both would update one shared count without any protection. Here both clone at once, and the count ends at 2 instead of 3.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="140" y="56" width="80" height="36" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">count</text>
  <text x="180" y="86" font-size="12" text-anchor="middle" fill="#b4232c">1, then 2</text>
  <text x="10" y="30" font-size="12" fill="#1d6fd1">thread A: Rc::clone</text>
  <text x="10" y="46" font-size="11" fill="#1d6fd1">read 1, write 2</text>
  <text x="230" y="30" font-size="12" fill="#b4232c">thread B: Rc::clone</text>
  <text x="230" y="46" font-size="11" fill="#b4232c">read 1, write 2</text>
  <line x1="80" y1="52" x2="140" y2="70" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="280" y1="52" x2="220" y2="70" stroke="#b4232c" stroke-width="1.5"/>
  <text x="10" y="120" font-size="11" fill="#1f2a44">three handles exist, the count says 2:</text>
  <text x="10" y="136" font-size="11" fill="#1f2a44">the value is freed while one handle still points at it</text>
</svg>
```

`Arc` performs the read-add-write as one atomic step, so this interleaving cannot happen.
:::

::: context auto-traits A property that flows up from the fields
An auto trait is implemented automatically for every type whose parts all have it. The compiler checks each field, and each field's fields, down to the basic types. One non-Send part anywhere makes the whole thing non-Send.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="110" y="14" width="140" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="34" font-size="12" text-anchor="middle" fill="#1f2a44">Telemetry: not Send</text>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <rect x="10" y="90" width="100" height="30" fill="#8fb8f0" stroke="#1d6fd1"/><text x="60" y="109">[f64; 3]: Send</text>
    <rect x="130" y="90" width="100" height="30" fill="#8fb8f0" stroke="#1d6fd1"/><text x="180" y="109">String: Send</text>
    <rect x="250" y="90" width="100" height="30" fill="#fff" stroke="#b4232c" stroke-width="2"/><text x="300" y="109">Rc&lt;Log&gt;: no</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="60" y1="90" x2="150" y2="44"/><line x1="180" y1="90" x2="180" y2="44"/><line x1="300" y1="90" x2="210" y2="44"/>
  </g>
  <text x="10" y="142" font-size="11" fill="#6c7a93">one non-Send field decides for the whole struct</text>
</svg>
```

A type can opt in by hand with `unsafe impl Send`, which is a promise the compiler takes on trust. That is lesson 07.
:::

::: context guard-not-send Why a lock guard stays home
On many operating systems, a mutex must be unlocked by the same thread that locked it. POSIX, the standard that Linux and many real-time operating systems follow, says unlocking an ordinary mutex from a different thread is undefined. Since a `MutexGuard` unlocks in its drop, sending the guard to another thread would move the unlock there too. So `MutexGuard` is not Send. It can be Sync, because letting other threads *look* through a `&MutexGuard` does not move the unlock anywhere.
:::

::: context box-no-heap Allocation on a microcontroller
A desktop program gets its heap from the operating system. A bare-metal flight computer has no operating system underneath, so a heap exists only if the project sets aside a region of RAM and installs an allocator for it. Embedded Rust splits the standard library into layers: `core` works everywhere with no heap; `alloc` adds `Box`, `Vec` and `String` once an allocator exists; `std` adds files, threads and the rest of an operating system. Many flight projects stay in `core` only. The next module starts from exactly this split.
:::

::: context self-referential A struct with a pointer into itself
Suppose a value stores a number and, next to it, a pointer to that number. Moving the value copies both to a new address. The number moves, but the pointer still holds the old address.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="20" y="20" font-size="12" fill="#1f2a44">before the move (address 1000)</text>
  <rect x="20" y="30" width="80" height="28" fill="#8fb8f0" stroke="#1d6fd1"/><text x="60" y="48" font-size="11" text-anchor="middle" fill="#1f2a44">9.81</text>
  <rect x="100" y="30" width="80" height="28" fill="#fff" stroke="#1f2a44"/><text x="140" y="48" font-size="11" text-anchor="middle" fill="#1f2a44">ptr = 1000</text>
  <text x="200" y="90" font-size="12" fill="#1f2a44">after (address 2000)</text>
  <rect x="200" y="100" width="70" height="28" fill="#8fb8f0" stroke="#1d6fd1"/><text x="235" y="118" font-size="11" text-anchor="middle" fill="#1f2a44">9.81</text>
  <rect x="270" y="100" width="80" height="28" fill="#fff" stroke="#b4232c" stroke-width="2"/><text x="310" y="118" font-size="11" text-anchor="middle" fill="#b4232c">ptr = 1000</text>
  <path d="M 310 100 C 300 70, 120 80, 70 60" fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="20" y="140" font-size="11" fill="#b4232c">the moved copy still points at the old place</text>
</svg>
```

Pinning the value, so it is never moved after the pointer is set, is what keeps such a pointer valid.
:::

::: context async-embedded Async on small computers
An async runtime lets one thread juggle many tasks, each pausing at an `.await` while it waits for something: a sensor, a timer, a radio. On a microcontroller this is attractive, because there is often only one core and no operating system, and waiting in a busy loop wastes power. The next module covers Embassy, an async-first framework for embedded Rust, and RTIC, a framework built around interrupt priorities. Every task Embassy runs is a pinned future polled by its executor, which is exactly the mechanism this section sketched.
:::

::: context rule-of-five The C++ bookkeeping Rust does not need
In C++, if a class needs a custom destructor (because it owns memory, a file handle or a lock), it almost always also needs a custom copy constructor, copy assignment, move constructor and move assignment. That is the rule of five. Forget one, and the compiler generates a default that copies the raw pointer, and two objects then free the same resource. C++ also keeps moved-from objects alive in a "valid but unspecified" state, so each destructor must cope with an emptied object. Rust avoids both problems: a move leaves nothing behind to destroy, and copies happen only through `Clone`.
:::

::: context no-leak-promise Why leaking is allowed
Before Rust 1.0 was released in 2015, the standard library had an API for scoped threads whose safety depended on a guard's destructor always running. People showed that with an `Rc` cycle the guard could be leaked without any `unsafe`, so its destructor never ran, and a thread could go on using memory that had already been freed. The Rust team decided that destructors cannot be relied on for memory safety, made `mem::forget` a safe function to say so plainly, and removed that API. The scoped threads you used in lesson 02 came back years later, in version 1.63, with a design that does not rely on a destructor.
:::
