---
id: l05-interior-mutability-and-shared-ownership
title: Interior mutability and shared ownership
minutes: 28
covers:
  - 'Interior mutability: Cell, RefCell and its runtime panics, Rc, Arc, Mutex, RwLock, OnceLock'
---

Go back to the whiteboard in mission control from lesson 02. Many people may read it, or one person may write on it, never both at once. So far the compiler has enforced that rule *before the meeting starts*: it reads the plan of who will stand where, and refuses any plan in which a reader and a writer could overlap.

Some meetings cannot be planned that far ahead. People drift in and out, and nobody knows in advance who will want to write. For those rooms there is a second way to keep the rule: hang one marker on a string next to the board. To write, you have to be holding the marker. If someone else has it, you wait, or you give up. The rule is the same. What changed is *when* it is checked: at the moment of writing, not in advance.

Rust has both kinds of room. Almost all your code should be the first kind. This lesson is about the second: **interior mutability** — changing a value through a shared reference `&T`, with the many-readers-or-one-writer rule checked some other way, often while the program runs. It also covers **shared ownership**, for values with more than one owner. You will meet `Cell`, `RefCell`, `Rc`, `Arc`, `Mutex`, `RwLock` and `OnceLock`, what each costs, and why flight code uses them sparingly.

## When the compiler cannot see the proof

The borrow checker is **conservative**: it accepts only programs it can prove safe, and rejects some safe programs because it cannot find the proof. Usually the fix is to restructure the code, as lesson 03 showed. But a few shapes of program are correct and still very hard to express with plain `&` and `&mut`.

- **A counter updated from `&self` methods.** A sensor driver's `read(&self)` wants to count how many times it was called. The count is a detail of the driver, but `&self` forbids changing any field.
- **A shared log or observer.** Several subsystems — power, thermal, guidance — all append to the same event log. Each one needs to write to it, at unpredictable times, and none of them is "the" owner.
- **A graph.** Two nodes that point at each other cannot each own the other.
- **Data shared between threads**, where one thread writes a new target attitude and several others read it.

For each of these the standard library offers a type that says, in effect, "I will enforce the rule myself". All of them are built on one low-level block, **[[UnsafeCell|unsafecell]]**, the only way in Rust to change data behind a shared reference. You will use the safe types built on it, not `UnsafeCell` itself.

## Cell: copy in, copy out

The simplest is `Cell<T>` (from `std::cell`). A `Cell` holds a value and lets you replace it through a shared reference, with two main methods:

- `get()` copies the value out (for `Copy` types like numbers);
- `set(v)` puts a new value in.

The trick is what `Cell` never does: it never hands out a reference to its inside. You cannot get a `&u32` pointing into a `Cell<u32>`. So no borrow of the inner value can ever exist, and there is nothing for a `set` to invalidate. That is why it is safe with no runtime check at all.

::: example Counting sensor reads through &self
A gyro driver whose `read` takes `&self`, so two parts of the program can hold `&gyro` at once, and still counts its calls:

```rust
use std::cell::{Cell, RefCell};
use std::mem::size_of;

struct Gyro {
    rate: f64,
    reads: Cell<u32>,
}

impl Gyro {
    fn read(&self) -> f64 {
        self.reads.set(self.reads.get() + 1);
        self.rate
    }
}

fn main() {
    let gyro = Gyro { rate: 0.0123, reads: Cell::new(0) };
    let guidance = &gyro;
    let logger = &gyro;
    guidance.read();
    logger.read();
    guidance.read();
    println!("reads so far: {}", gyro.reads.get());

    println!("f64: {}  Cell<f64>: {}  RefCell<f64>: {}", size_of::<f64>(), size_of::<Cell<f64>>(), size_of::<RefCell<f64>>());
    println!("[f64; 3]: {}  RefCell<[f64; 3]>: {}", size_of::<[f64; 3]>(), size_of::<RefCell<[f64; 3]>>());
}
```

```text
reads so far: 3
f64: 8  Cell<f64>: 8  RefCell<f64>: 16
[f64; 3]: 24  RefCell<[f64; 3]>: 32
```

Follow the count: `guidance.read()` sets it from 0 to 1, `logger.read()` from 1 to 2, `guidance.read()` from 2 to 3. Two shared references, three updates, no `&mut` anywhere.

Now read the size lines, measured on a 64-bit Linux machine with Rust 1.94. A `Cell<f64>` is 8 bytes, the same as a bare `f64`: there is no hidden counter. A `RefCell<f64>` is 16 bytes: 8 for the number and 8 for a borrow counter. For an array of three `f64`, 24 bytes of data grow to 32. Keep those numbers in mind for the next section.
:::

`Cell` works best for small `Copy` values: counters, flags, the last timestamp seen. For a `Vec` or a `String`, copying out is not possible, and you want to borrow the inside. That needs a real check.

## RefCell: the borrow checker, moved to runtime

`RefCell<T>` lets you borrow its inside through a shared reference, and keeps score while the program runs:

- `borrow()` gives you a shared borrow, wrapped in a small **[[guard|guard-objects]]** object of type `Ref<T>`. You use it like a `&T`.
- `borrow_mut()` gives you an exclusive borrow, wrapped in a `RefMut<T>`. You use it like a `&mut T`.
- When a guard is dropped, the borrow ends.

Inside, the `RefCell` keeps a **[[borrow counter|refcell-flag]]**: how many shared borrows are live, or a mark meaning "one writer is in". Each `borrow` and `borrow_mut` checks the counter first. If the request would break many-readers-or-one-writer, the program does not get a borrow. It **panics**: it stops with an error message, the same way an out-of-bounds index does.

Here is the trap that catches everyone. An event log is being scanned, and when the scan finds `"arm"`, it tries to append an acknowledgement:

```rust
use std::cell::RefCell;

fn main() {
    let events = RefCell::new(vec![String::from("boot")]);

    {
        let mut log = events.borrow_mut();
        log.push(String::from("arm"));
    } // the RefMut guard is dropped here, so the write borrow ends

    println!("{} events", events.borrow().len());

    for e in events.borrow().iter() {
        if e == "arm" {
            events.borrow_mut().push(String::from("armed-ack"));
        }
    }
}
```

```text
2 events

thread 'main' (5317) panicked at src/main.rs:15:20:
RefCell already borrowed
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

(Rust 1.94; older compilers word the message `already borrowed: BorrowMutError`, and the number after `'main'` is a thread id that changes from run to run.) It compiled without a complaint. The first two blocks work: each guard ends at its closing brace or semicolon. But the `for` loop holds `events.borrow()` for the whole loop, and line 15 asks for `borrow_mut()` while that read is live. This is the push-while-iterating bug from lesson 02. With a plain `Vec` the compiler would have refused it. Wrapped in a `RefCell`, it became a crash at runtime.

::: key RefCell: when it is appropriate and what it costs
When the borrow pattern is correct but cannot be proved statically, typically a graph or a shared observer. It moves the check to runtime, so a violation is a panic instead of a compile error, and it adds a counter per cell. In flight code it is usually a design smell.
:::

::: example Asking instead of panicking, and fixing the shape
`try_borrow_mut()` returns a `Result` instead of panicking, so you can see the refusal. And the real fix is to end the read before the write:

```rust
use std::cell::RefCell;

fn main() {
    let events = RefCell::new(vec![String::from("boot"), String::from("arm")]);

    match events.try_borrow_mut() {
        Ok(mut log) => log.push(String::from("first try")),
        Err(e) => println!("could not write: {}", e),
    }

    let reader = events.borrow();
    match events.try_borrow_mut() {
        Ok(mut log) => log.push(String::from("second try")),
        Err(e) => println!("could not write: {}", e),
    }
    drop(reader);

    let saw_arm = events.borrow().iter().any(|e| e == "arm");
    if saw_arm {
        events.borrow_mut().push(String::from("armed-ack"));
    }
    println!("{:?}", events.borrow());
}
```

```text
could not write: RefCell already borrowed
["boot", "arm", "first try", "armed-ack"]
```

Trace the counter through it.

1. The first `try_borrow_mut` finds no borrows, succeeds, and pushes `"first try"`. Its guard ends with the match arm.
2. `reader` takes a shared borrow; the counter says one reader.
3. The second `try_borrow_mut` sees that reader and returns `Err`; the program prints the refusal instead of crashing.
4. `drop(reader)` ends the read; the counter is back to zero.
5. The scan `events.borrow().iter().any(...)` finishes, and its guard is gone, *before* `borrow_mut` asks to write. So the write succeeds.

Four entries at the end. Step 5 is the fix lesson 03 taught for the compile-time error: finish reading, then write.
:::

::: warning RefCell in a real-time loop
A mistake the compiler would have caught on your desk is now a panic on the one run where the timing lines up. Flight software is usually built so that a panic stops the program at once ([[panic = abort|panic-abort]], lesson 10), so a `RefCell` conflict in a 1 kHz control task becomes a flight computer reset. And every borrow reads and writes the counter, and every cell carries the extra bytes you measured: small, but not free, and buying nothing a better ownership design would not give you for zero. Before reaching for `RefCell` in flight code, ask who should really own the data, and whether one function can be handed a `&mut` at the right moment.
:::

## Rc: more than one owner

Everything so far had one owner. Now think of a shared event log again. Power, thermal and guidance all hold it. Which of them should drop it? None of them alone: it should be dropped when the *last* one lets go.

That is what `Rc<T>` gives you. The name stands for **[[reference counted|reference-counting]]**. An `Rc` puts the value on the heap together with a count of how many `Rc` handles point to it.

- `Rc::new(v)` makes the first handle; the count is 1.
- `Rc::clone(&h)` makes another handle to the *same* value; the count goes up by one. Nothing is deep-copied. It is the cheap kind of clone: one increment.
- Dropping a handle takes the count down by one. When it reaches 0, the value is dropped.

An `Rc` only gives shared access: `&T`, never `&mut T`, because other handles might be reading. So if the shared value needs to change, you put a `RefCell` inside it. `Rc<RefCell<T>>`, read "R-C of RefCell of T", is the standard single-threaded shared, changeable value.

::: example Three subsystems, one log
```rust
use std::cell::RefCell;
use std::rc::Rc;

struct Subsystem {
    name: &'static str,
    log: Rc<RefCell<Vec<String>>>,
}

impl Subsystem {
    fn report(&self, msg: &str) {
        self.log.borrow_mut().push(format!("{}: {}", self.name, msg));
    }
}

fn main() {
    let log = Rc::new(RefCell::new(Vec::new()));
    println!("owners after new: {}", Rc::strong_count(&log));

    let power = Subsystem { name: "EPS", log: Rc::clone(&log) };
    let thermal = Subsystem { name: "TCS", log: Rc::clone(&log) };
    println!("owners after two clones: {}", Rc::strong_count(&log));

    power.report("bus at 28.1 V");
    thermal.report("heater 2 on");
    power.report("battery 87 %");

    drop(power);
    println!("owners after power is dropped: {}", Rc::strong_count(&log));

    for line in log.borrow().iter() {
        println!("{}", line);
    }
}
```

```text
owners after new: 1
owners after two clones: 3
owners after power is dropped: 2
EPS: bus at 28.1 V
TCS: heater 2 on
EPS: battery 87 %
```

The count goes 1, then $1 + 2 = 3$ after two clones, then $3 - 1 = 2$ when `power` is dropped. The log survives, because `main` and `thermal` still hold it. When `main` ends, both remaining handles are dropped, the count reaches 0, and the `Vec` is freed. Each `report` holds `borrow_mut()` for one push only, so no two borrows overlap.
:::

::: warning Two Rc that point at each other never die
If node A holds an `Rc` to B and B holds an `Rc` to A, each count stays at least 1 forever, even after the rest of the program lets go of both. The memory is **leaked**: never freed. Rust's safety promise does not cover leaks. The standard fix is `Weak<T>` (from `Rc::downgrade`), a handle that does not count as an owner, used for the "back" direction, such as a child pointing to its parent. To read through a `Weak`, you call `upgrade()`, which gives `Some(Rc)` if the value still exists and `None` if it is gone.
:::

## Across threads: Arc and Mutex

`Rc` and `RefCell` are for one thread only. Their counters use ordinary reads and writes, which go wrong when two threads do them at once, as lesson 02's lost-update race showed. The compiler will not let them cross to another thread; lesson 06 shows how it knows.

The thread-safe twins are:

- `Arc<T>`, the **atomically reference counted** pointer. Same idea as `Rc`, but the count is changed with **[[atomic|atomic-ops]]** instructions, which the processor guarantees cannot be interleaved. Slightly slower, safe across threads.
- `Mutex<T>`, a **mutual exclusion** lock: the marker on a string. To touch the value you call `lock()`, which waits until no other thread holds the lock and then gives you a guard, a `MutexGuard<T>`, that works like `&mut T`. When the guard is dropped, the lock is released.

`Arc<Mutex<T>>` is the multi-thread version of `Rc<RefCell<T>>`, with one difference in behavior. A conflicting `RefCell` borrow panics. A `Mutex` that is already locked makes you *wait*, which is right between threads, because the other thread will finish and let go.

::: example The packet counter, done right
Lesson 02 showed two C++ threads losing about 46% of their two million increments, and Rust refusing to compile the same shape. Here is the version Rust accepts, with the lock making the threads take turns:

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let packets = Arc::new(Mutex::new(0u64));
    let mut handles = Vec::new();

    for _ in 0..2 {
        let counter = Arc::clone(&packets);
        handles.push(thread::spawn(move || {
            for _ in 0..1_000_000 {
                let mut n = counter.lock().unwrap();
                *n += 1;
            } // the guard `n` is dropped here each time round, which unlocks
        }));
    }

    for h in handles {
        h.join().unwrap();
    }
    println!("packets = {}", *packets.lock().unwrap());
    println!("owners left = {}", Arc::strong_count(&packets));
}
```

```text
packets = 2000000
owners left = 1
```

Every run prints $2 \times 1{,}000{,}000 = 2{,}000{,}000$. Step by step:

1. `Arc::new(Mutex::new(0u64))` puts one counter on the heap. Count of owners: 1.
2. Each time round the `for`, `Arc::clone` makes a new handle (count 2, then 3), and `move` hands it to the new thread, which must own everything it uses (lesson 04).
3. Inside each thread, `counter.lock()` waits for the lock. `.unwrap()` takes the guard out of the `Result` (an error only if the lock is [[poisoned|poisoning]]). `*n += 1` reads "add one to the value the guard points at".
4. At the loop body's closing brace the guard is dropped, which unlocks, and the other thread can get in.
5. When a thread finishes, its `Arc` handle is dropped. After both `join`s, only `main`'s is left: `owners left = 1`.
:::

`lock()` returns a `Result` because if a thread panics while holding the lock, the data might be half-updated, so the mutex marks itself poisoned and later `lock()` calls return `Err`. `unwrap()` there means "if another thread crashed mid-update, crash too", a reasonable default.

::: warning A lock guard held too long
The lock is held for as long as the guard is alive. Write `let n = counter.lock().unwrap();` near the top of a long function and the whole function becomes a one-thread-at-a-time zone. Worse, lock two mutexes in opposite orders on two threads and each can wait for the other forever — a **deadlock**, which no Rust rule prevents. Keep the guard's scope tight, as the example did with one increment per lock, and always take locks in the same order.
:::

## RwLock and OnceLock

Two more locks round out the set.

`RwLock<T>` is a **reader-writer lock**, and it is the whiteboard rule exactly, enforced at runtime between threads. `read()` gives a shared guard, and any number of threads can hold one at once. `write()` gives an exclusive guard, and waits until every reader has left. It suits data read often and changed rarely, like a target attitude that several tasks read every cycle.

`OnceLock<T>` holds a value that is set **exactly once**, then only read. The first caller of `get_or_init` runs the setup code; every later caller, from any thread, gets a `&T` to the same value, with no lock taken after that first moment. It is the safe way to build data that lives for the whole program, the honest `'static` from lesson 04: a calibration table, a configuration loaded at boot. It has been in stable Rust since version 1.70.

::: example Three readers, one writer, one calibration table
```rust
use std::sync::{OnceLock, RwLock};
use std::thread;

static SCALE_FACTORS: OnceLock<[f64; 3]> = OnceLock::new();

fn scale_factors() -> &'static [f64; 3] {
    SCALE_FACTORS.get_or_init(|| {
        println!("(loading calibration once)");
        [1.0012, 0.9987, 1.0005]
    })
}

fn main() {
    let target_attitude = RwLock::new([0.0f64, 0.0, 0.0]);

    thread::scope(|s| {
        for id in 0..3 {
            let target = &target_attitude;
            s.spawn(move || {
                let t = target.read().unwrap();
                let k = scale_factors();
                println!("reader {} sees yaw target {:.1} deg, k_z = {}", id, t[2], k[2]);
            });
        }
    });

    {
        let mut t = target_attitude.write().unwrap();
        t[2] = 45.0;
    }
    println!("after write: {:?}", target_attitude.read().unwrap());
}
```

```text
(loading calibration once)
reader 0 sees yaw target 0.0 deg, k_z = 1.0005
reader 1 sees yaw target 0.0 deg, k_z = 1.0005
reader 2 sees yaw target 0.0 deg, k_z = 1.0005
after write: [0.0, 0.0, 45.0]
```

The three reader lines can appear in any order from run to run. Two things never change. "Loading calibration once" prints exactly once, although three threads called `scale_factors()`: the first ran the setup, and the others waited and shared the result. And all three readers could hold `read()` guards at the same time. After the scope, `write()` gets the lock alone and sets the yaw target to 45.0°. `k_z = 1.0005` scales the z-axis reading up by $0.05\%$.
:::

## Choosing, and choosing not to

Every type in this lesson has a single-thread version and a thread-safe version:

| Job | One thread | Across threads |
|---|---|---|
| Change a small Copy value through `&` | `Cell<T>` | atomics such as `AtomicU32` |
| Borrow the inside through `&`, checked at runtime | `RefCell<T>` (panics on conflict) | `Mutex<T>` or `RwLock<T>` (waits) |
| Several owners, dropped by the last | `Rc<T>` | `Arc<T>` |
| Set once, then read forever | `OnceCell<T>` | `OnceLock<T>` |

The single-thread versions are cheaper and are refused at compile time if they would cross a thread, so you cannot pick the wrong column by accident.

Now the flight-software view. Each of these types exists because the program's ownership could not be written as a plain tree of owners and borrows. In a flight loop, that has costs. A `RefCell` can panic. A `Mutex` can make a high-priority task wait on a low-priority one, the classic **[[priority inversion|priority-inversion]]**. An `Rc` or `Arc` usually means a heap allocation, which many flight projects allow only at startup. So the usual design for a control loop is plain ownership: one task owns the state, receives inputs by message or by a `&mut` handed to it each cycle, and sends outputs the same way. Interior mutability and shared ownership stay at the edges: the logging system, a configuration loaded once with `OnceLock`, a buffer between an interrupt handler and a task.

::: key The interior-mutability toolbox
`Cell` swaps whole values and never lends a reference; `RefCell` counts borrows at runtime and panics on a conflict; `Rc` counts owners on one thread, `Arc` counts them atomically across threads; `Mutex` makes threads take turns, `RwLock` allows many readers or one writer, and `OnceLock` sets a value once and then shares it.
:::

## Check yourself

::: check
Why can `Cell<u32>` allow changes through a shared reference with no runtime check at all, while `RefCell<Vec<u32>>` needs a counter?
:::

::: answer
`Cell` never hands out a reference to what is inside; you can only copy out with `get` or replace with `set`. Nobody can hold a borrow of the inner `u32`, so a `set` cannot invalidate anyone's view, and there is nothing to check. `RefCell` does hand out borrows (guards acting like `&Vec` or `&mut Vec`), so it must track how many are live: that is the counter, 8 extra bytes on a 64-bit machine and a check on every borrow.
:::

::: check
This code panics. Say where and why, and give a fix that keeps the `RefCell`:

```rust
let tracks = RefCell::new(vec![1.0, 2.0]);
let first = tracks.borrow();
tracks.borrow_mut().push(first[0] * 2.0);
```
:::

::: answer
`first` is a live shared borrow (a `Ref` guard) when the third line calls `borrow_mut()`. The counter says one reader, so the write request violates the rule and the program panics with "RefCell already borrowed". Fix: copy the number out and end the read first, `let x = tracks.borrow()[0] * 2.0;` (the temporary guard ends at the semicolon), then `tracks.borrow_mut().push(x);`. The vector becomes `[1.0, 2.0, 2.0]`.
:::

::: check
An `Rc` is created, cloned three times, one clone is dropped, and then the original handle is dropped. What is the strong count now, and is the value still alive?
:::

::: answer
Start at 1. Three clones: $1 + 3 = 4$. Drop one clone: $4 - 1 = 3$. Drop the original: $3 - 1 = 2$. The value is still alive. The "original" handle is not special; all handles are equal owners, and the value is dropped only at 0.
:::

::: check
Asking a `RefCell` for a conflicting borrow panics. Asking a `Mutex` that is already locked makes you wait. Explain why waiting is right for a mutex but would be wrong for a `RefCell`.
:::

::: answer
Between threads, a conflict is temporary: the other thread is running and will release its guard soon, so waiting works. Within one thread, a `RefCell` conflict means the *same* thread already holds a borrow further up its own call stack. The only thread that could release it is the one waiting, so it would hang forever. A loud, immediate panic is the more useful failure.
:::

::: check
A teammate wraps the state of a 1 kHz attitude controller in `Rc<RefCell<State>>` "so the telemetry task can read it too". Name the three costs and suggest a design without them.
:::

::: answer
First, a borrow mistake becomes a runtime panic, which with panic = abort resets the computer, where the compiler could have caught it. Second, every access checks a borrow counter, and `Rc::new` puts the state on the heap. Third, `Rc<RefCell<>>` is single-threaded, so if telemetry runs on another thread it will not even compile. Better: the controller owns its `State` outright, and at the end of each cycle copies the few numbers telemetry needs into a message or a small snapshot (say, behind a `Mutex` held only for the copy).
:::

## Summary

| Type | What it does | Cost or risk |
|---|---|---|
| `Cell<T>` | `get` / `set` through `&`; no references to the inside | None beyond the copy; one thread |
| `RefCell<T>` | `borrow` / `borrow_mut` with a runtime counter | A panic on conflict; counter per cell |
| `try_borrow_mut` | The same request, returning `Result` | You must handle the `Err` |
| `Rc<T>` | Shared ownership; dropped when the count hits 0 | Heap allocation; cycles leak (use `Weak`) |
| `Arc<T>` | `Rc` with an atomic count | Thread-safe; slightly slower |
| `Mutex<T>` | One thread at a time, via a guard | Waiting; deadlock if misused; poisoning |
| `RwLock<T>` | Many readers or one writer, at runtime | Writers wait for all readers |
| `OnceLock<T>` | Set once, read forever | Only the first caller runs the setup |

You saw that `Rc` and `RefCell` cannot go to another thread while `Arc` and `Mutex` can. The next lesson shows how the compiler knows: the marker traits `Send` and `Sync`. It then looks at `Box`, `Pin`, and at `Drop`, the mechanism behind every guard in this lesson.

::: context unsafecell The one door every cell goes through
Normally Rust promises that data behind a `&T` does not change, and the optimizer relies on that promise. `UnsafeCell<T>` is the single, built-in exception: the compiler knows that data inside it may change even through a shared reference. Every type in this lesson is built on it, adding its own rule that makes the change safe.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <rect x="10" y="20" width="60" height="30" fill="#8fb8f0" stroke="#1d6fd1"/><text x="40" y="40">Cell</text>
    <rect x="80" y="20" width="60" height="30" fill="#8fb8f0" stroke="#1d6fd1"/><text x="110" y="40">RefCell</text>
    <rect x="150" y="20" width="60" height="30" fill="#f2b880" stroke="#1f2a44"/><text x="180" y="40">Mutex</text>
    <rect x="220" y="20" width="60" height="30" fill="#f2b880" stroke="#1f2a44"/><text x="250" y="40">RwLock</text>
    <rect x="290" y="20" width="60" height="30" fill="#f2b880" stroke="#1f2a44"/><text x="320" y="40">OnceLock</text>
    <rect x="10" y="70" width="340" height="30" fill="#fff" stroke="#1f2a44" stroke-width="2"/><text x="180" y="90">UnsafeCell: change allowed behind &amp;T</text>
  </g>
  <g stroke="#6c7a93"><line x1="40" y1="50" x2="40" y2="70"/><line x1="110" y1="50" x2="110" y2="70"/><line x1="180" y1="50" x2="180" y2="70"/><line x1="250" y1="50" x2="250" y2="70"/><line x1="320" y1="50" x2="320" y2="70"/></g>
  <text x="10" y="120" font-size="11" fill="#6c7a93">blue: one thread only; orange: safe across threads</text>
</svg>
```

Using `UnsafeCell` directly requires `unsafe` code, the subject of lesson 07.
:::

::: context guard-objects A borrow you can hold in your hand
A guard is an ordinary value whose whole job is to represent "I currently hold this". `Ref`, `RefMut` and `MutexGuard` all work the same way: creating one updates the counter or takes the lock, using one gives you access to the data, and dropping one undoes the update. Because the undo happens in the guard's drop, you cannot forget it, and an early `return` or a `?` cannot skip it. This is RAII again, from lesson 01, and lesson 06 looks at `Drop`, the trait that makes it work.
:::

::: context refcell-flag The counter inside a RefCell
The standard library stores the RefCell's state in one signed integer. Zero means free. A positive number counts live shared borrows. A negative value marks an exclusive borrow.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <rect x="130" y="50" width="100" height="36" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/><text x="180" y="73">0: free</text>
    <rect x="10" y="50" width="100" height="36" rx="6" fill="#8fb8f0" stroke="#1d6fd1"/><text x="60" y="66">1, 2, 3 ...</text><text x="60" y="80">readers</text>
    <rect x="250" y="50" width="100" height="36" rx="6" fill="#f2b880" stroke="#1f2a44"/><text x="300" y="66">-1</text><text x="300" y="80">one writer</text>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="70" y="38">borrow()</text>
    <text x="232" y="38">borrow_mut()</text>
  </g>
  <line x1="130" y1="60" x2="112" y2="60" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="230" y1="60" x2="248" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="10" y="112" font-size="11" fill="#b4232c">borrow_mut() when readers &gt; 0: panic</text>
  <text x="10" y="128" font-size="11" fill="#b4232c">borrow() when a writer is in: panic</text>
</svg>
```
:::

::: context panic-abort What a panic means on a flight computer
A panic is Rust's response to a bug it discovers while running: an index out of range, an `unwrap` on `None`, a `RefCell` conflict. On a desktop, the default is to **unwind**: walk back up the stack, dropping everything, and end the thread. Flight builds usually set `panic = "abort"` in `Cargo.toml` instead, which stops the program on the spot. A hardware watchdog then notices the silence and restarts the computer into a known state. Lesson 10 explains why that is the preferred choice.
:::

::: context reference-counting Counting who still needs it
Reference counting is one of the oldest ways to manage shared memory: attach a counter to the data, add one for every holder, subtract one when a holder lets go, free at zero. C++ has the same tool as `std::shared_ptr`. The C++ standard requires a `shared_ptr` to be safe to copy from several threads, so its count is normally updated with atomic operations even in a program with one thread. Rust splits the job in two: `Rc` for one thread, with plain increments, and `Arc` for many, with atomic ones. The type system makes sure you cannot use the cheap one where the safe one is needed.
:::

::: context atomic-ops An addition nobody can interrupt
An atomic operation is one the processor carries out as a single, indivisible step, so no other core can see it half-done. An atomic increment reads, adds and writes back as one unit, which is exactly what the lost-update race in lesson 02 was missing. Modern processors provide instructions for this, including the ARM Cortex-M3, M4 and M7 cores common on small spacecraft. Rust exposes them directly as `AtomicU32`, `AtomicBool` and friends in `std::sync::atomic`, which are what you use for a single shared counter or flag when a whole `Mutex` would be more than you need.
:::

::: context poisoning A lock that remembers a crash
If a thread panics while holding a `MutexGuard`, the guard is still dropped during unwinding, so the lock is released. But the data may have been left halfway through an update: two fields changed, the third not yet. Rust marks the mutex as poisoned so that the next thread to lock it is told, through the `Err` case, instead of silently reading broken data. The error still carries the guard, so a thread that knows how to repair the data can recover it with `into_inner()`. With `panic = "abort"`, poisoning never comes up, because nothing keeps running after a panic.
:::

::: context priority-inversion When the important task waits for the unimportant one
A real-time system runs tasks by priority. Suppose a low-priority task holds a mutex, a high-priority task needs it and waits, and a medium-priority task, which needs no lock, keeps running and starves the low one. Now the high task is stuck behind the medium one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <text x="8" y="34">high</text><text x="8" y="74">medium</text><text x="8" y="114">low</text>
  </g>
  <rect x="60" y="100" width="50" height="20" fill="#8fb8f0" stroke="#1d6fd1"/>
  <text x="85" y="95" font-size="11" text-anchor="middle" fill="#1d6fd1">lock</text>
  <rect x="110" y="20" width="20" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="130" y="20" width="160" height="20" fill="#fff" stroke="#b4232c" stroke-dasharray="4 3"/>
  <text x="210" y="34" font-size="11" text-anchor="middle" fill="#b4232c">waiting for lock</text>
  <rect x="130" y="60" width="160" height="20" fill="#6c7a93" stroke="#1f2a44"/>
  <text x="210" y="74" font-size="11" text-anchor="middle" fill="#ffffff">runs, needs no lock</text>
  <rect x="290" y="100" width="20" height="20" fill="#8fb8f0" stroke="#1d6fd1"/>
  <line x1="60" y1="138" x2="350" y2="138" stroke="#6c7a93"/>
  <text x="330" y="132" font-size="11" fill="#6c7a93">time</text>
</svg>
```

This happened on NASA's Mars Pathfinder lander in 1997: a high-priority task that kept missing its deadline triggered repeated system resets. Engineers diagnosed it from Earth and enabled priority inheritance on the offending mutex, which lets the lock holder temporarily borrow the waiter's priority. It is a reason flight designs keep shared locks rare and short.
:::
