---
id: l01-ownership-and-moves
title: Ownership and moves
minutes: 20
covers:
  - 'The three ownership rules; move by default and Copy types'
---

Picture the paper logbook that sits on a test stand. There is exactly one of it. Whoever is holding it is responsible for it: they write in it, and at the end of the shift they file it away. If you hand it to the next engineer, you no longer have it. You cannot write in it from across the room, and you certainly cannot file it away a second time.

Now picture the phone number of the control room, written on a sticky note. You can copy that onto a second note in two seconds. Both notes are complete and independent. Nobody cares which one is "the real one".

Rust treats values in exactly these two ways. Big things that own memory, like a growing list of sensor readings, behave like the logbook: one holder at a time, and handing it over means giving it up. Small plain things, like a number, behave like the sticky note: handing one over makes a copy. The name for the logbook rules is **ownership** — the set of rules that decides which part of a program is responsible for a value and when that value is cleaned up. This lesson teaches the three rules, what a **move** is, and which types are **Copy**. Everything in this module, from borrowing to threads, is built on top of them.

Why should a GNC engineer care? Flight software runs for months without a restart. A single piece of memory freed twice, or used after it was freed, can crash a flight computer or quietly corrupt a navigation state. In C and C++ you prevent those bugs by being careful. In Rust the compiler checks that you were careful, before the code ever runs.

## Where a value lives, and who cleans it up

You met the two places a program keeps data in the C++ memory module. The **stack** is the fast scratch space for a function's local variables; it is cleaned up automatically when the function returns. The **[[heap|stack-and-heap]]** is the big shared storage area for data whose size is only known while the program runs, like a list that keeps growing.

A Rust `String` uses both. On the stack sits a small fixed-size **header** with three numbers: a pointer to the text, the length, and the capacity (how much room has been reserved). The characters themselves sit on the heap. On a 64-bit machine the header is 24 bytes: three 8-byte numbers. A `Vec<f64>` (read "vec of f64", a growable list of 64-bit floats) has the same three-part header.

```rust
fn main() {
    let s = String::from("DRAGON-7");
    println!("String header: {} bytes", std::mem::size_of::<String>());
    println!("len = {}, capacity = {}", s.len(), s.capacity());
    println!("Vec<f64> header: {} bytes", std::mem::size_of::<Vec<f64>>());
    println!("[f64; 3]: {} bytes", std::mem::size_of::<[f64; 3]>());
}
```

```text
String header: 24 bytes
len = 8, capacity = 8
Vec<f64> header: 24 bytes
[f64; 3]: 24 bytes
```

The last line is a trap for the eye. A fixed array of three `f64` is also 24 bytes, but those 24 bytes *are* the data. There is no heap part. That difference, "does this value point at memory somewhere else?", is the whole reason some types move and others copy.

Somebody has to give the heap memory back. Languages have tried three answers. C makes you call `free` yourself, and people forget or do it twice. Java and Python run a **[[garbage collector|garbage-collection]]** that finds unused memory later, at a time you do not choose. Rust picks a third way: the compiler works out, from the structure of your code, the exact line where each value stops being needed, and inserts the cleanup there.

## The three ownership rules

Here they are, in one place:

1. Every value has exactly one owner — a variable (or a field, or a slot in a collection) that is responsible for it.
2. There is only one owner at a time.
3. When the owner goes out of **scope** — the stretch of code between a pair of curly braces `{ }` where a variable exists — the value is **dropped**: its cleanup runs and its heap memory is given back.

::: key The three ownership rules
Every value has exactly one owner; there is only one owner at a time; when the owner goes out of scope the value is dropped. Moves transfer ownership, and the moved-from binding cannot be used again.
:::

A **binding** is the name a `let` statement attaches to a value: in `let s = ...`, the binding is `s`. The word "binding" is used instead of "variable" because the name is tied to one value and, as you are about to see, can lose that value.

Rule 3 is where the cleanup comes from. You never write `free`. When `s` goes out of scope, Rust runs the drop for `String`, which gives the heap buffer back. This is the same idea as a C++ destructor, the pattern called **[[RAII|raii]]**. Lesson 06 of this module looks at `Drop` in detail; for now, watch it happen.

::: example Watching drops happen
A type can print a line when it is dropped. Here each `Valve` prints "closing" as it is cleaned up:

```rust
struct Valve {
    name: &'static str,
}

impl Drop for Valve {
    fn drop(&mut self) {
        println!("closing {}", self.name);
    }
}

fn take(v: Valve) {
    println!("take() now owns {}", v.name);
} // v goes out of scope here, so it is dropped

fn main() {
    let a = Valve { name: "LOX main" };
    let b = Valve { name: "RP-1 main" };
    {
        let c = Valve { name: "igniter purge" };
        println!("inner block uses {}", c.name);
    } // c goes out of scope here
    take(a); // ownership of a moves into take()
    println!("main still owns {}", b.name);
} // b goes out of scope here; a was moved away, so nothing happens for a
```

```text
inner block uses igniter purge
closing igniter purge
take() now owns LOX main
closing LOX main
main still owns RP-1 main
closing RP-1 main
```

Read the output line by line.

1. The inner block ends, so `c` goes out of scope. "closing igniter purge" prints right there, before anything after the block.
2. `take(a)` hands `a` to the function. Now the parameter `v` owns the valve. When `take` returns, `v` goes out of scope, so "closing LOX main" prints *inside* the call, before `main` continues.
3. `main` ends. Only `b` is still owned by `main`, so only "closing RP-1 main" prints.

Count the closes: three valves, three closes. Nothing was closed twice, and nothing was left open. Notice that `a` was not dropped again at the end of `main`: a moved-from binding owns nothing, so there is nothing to drop.
:::

## Moves: handing over the logbook

What happens when you write `let logged = callsign;` with a `String`? In Python both names would point at the same object. In C++ `std::string logged = callsign;` makes a full copy of the text. Rust does neither. It **moves** the value: it copies the 24-byte header into `logged`, leaves the heap text exactly where it is, and marks `callsign` as no longer usable.

That last part is the key. After a move, there is still only one header that points at the heap text. If both headers were live, both would try to give the same memory back when they went out of scope. That is a **[[double free|double-free]]**, one of the classic C bugs. Rust makes it impossible by rule 2: one owner at a time.

Try to use the old name and the compiler stops you:

```rust
fn main() {
    let callsign = String::from("DRAGON-7");
    let logged = callsign;
    println!("{}", callsign);
}
```

```text
error[E0382]: borrow of moved value: `callsign`
 --> src/main.rs:4:20
  |
2 |     let callsign = String::from("DRAGON-7");
  |         -------- move occurs because `callsign` has type `String`, which does not implement the `Copy` trait
3 |     let logged = callsign;
  |                  -------- value moved here
4 |     println!("{}", callsign);
  |                    ^^^^^^^^ value borrowed here after move
```

(This and every other message in the module came from rustc 1.94.1; the help text is trimmed.) The message tells a story in three labels. Line 2: here is the value and its type, `String`, which is not `Copy`. Line 3: here is where it moved. Line 4: here is where you tried to use it anyway. Every **[[borrow-checker error|error-codes]]** you will meet reads like this, and lesson 03 is about reading them fluently.

A move is cheap. Moving a `String` holding a megabyte of telemetry copies 24 bytes, not a megabyte. The "cost" of a move is only that the old name is finished.

::: warning Moving into a function counts too
Passing a value to a function that takes it by value is a move, exactly like `let`. After `send_to_ground(msg)` where the parameter type is `String`, `msg` is gone. The compiler even says so: "this parameter takes ownership of the value". The same thing happens inside a loop: the first pass moves the value, and the second pass finds nothing there ("value moved here, in previous iteration of loop"). The usual fix is not `.clone()`; it is to make the function borrow instead of own, which is the next lesson.
:::

### Giving ownership back

A function can hand ownership back by returning the value. This is a real pattern, used when a function needs to change something and then give it back:

::: example Appending a checksum byte
A ground-link packet is a list of bytes. The function takes the packet, adds one checksum byte, and returns it.

```rust
fn add_checksum(mut packet: Vec<u8>) -> Vec<u8> {
    let sum: u32 = packet.iter().map(|&b| b as u32).sum();
    packet.push((sum % 256) as u8);
    packet
}

fn main() {
    let packet = vec![0x10, 0x20, 0x30];
    let packet = add_checksum(packet);
    println!("{:?}", packet);
}
```

```text
[16, 32, 48, 96]
```

Step by step. The bytes are `0x10`, `0x20`, `0x30` in hexadecimal, which are $16$, $32$ and $48$ in decimal. Their sum is $16 + 32 + 48 = 96$. The remainder after dividing by $256$ is $96$, because $96$ is already less than $256$. So the function pushes $96$ and returns the packet.

Ownership went on a round trip. `main` moved the packet into the function, the function owned it while it pushed, and the return moved it back into a new `packet` binding (shadowing the old one). At no point were there two owners. And no byte of heap data was copied: only the 24-byte header traveled.

Sanity check: the output has four bytes where the input had three, and the new last byte equals the sum of the first three. That is what a checksum of this kind should look like.
:::

Returning things back works, but it gets clumsy when a function needs to look at five values. Borrowing, in the next lesson, is the tool that replaces most of these round trips.

## Copy types: the sticky note

Some values do not move. They copy:

```rust
#[derive(Debug, Clone, Copy)]
struct Vec3 {
    x: f64,
    y: f64,
    z: f64,
}

fn norm(v: Vec3) -> f64 {
    (v.x * v.x + v.y * v.y + v.z * v.z).sqrt()
}

fn main() {
    let rate_deg_s: f64 = 12.5;
    let copy_of_rate = rate_deg_s; // f64 is Copy: bits duplicated
    println!("{} {}", rate_deg_s, copy_of_rate);

    let accel = Vec3 { x: 3.0, y: 4.0, z: 12.0 };
    let n = norm(accel); // accel is copied into norm
    println!("|accel| = {} m/s^2, still have {:?}", n, accel);
}
```

```text
12.5 12.5
|accel| = 13 m/s^2, still have Vec3 { x: 3.0, y: 4.0, z: 12.0 }
```

The length works out because $3^2 + 4^2 + 12^2 = 9 + 16 + 144 = 169$ and $\sqrt{169} = 13$. And `accel` is still usable after the call, because passing it made a copy.

A type is **Copy** when duplicating its bits gives a complete, independent value — when there is no hidden heap memory that two copies would fight over. Copy is a **[[trait|traits-preview]]**, a label a type can carry that says what it can do. These are Copy:

- all the integer types (`i32`, `u8`, `u64`, …), both float types (`f32`, `f64`), `bool` and `char`;
- shared references `&T` (the next lesson);
- arrays and tuples whose elements are all Copy, like `[f64; 3]` or `(u16, f64)`;
- your own structs and enums, if you write `#[derive(Clone, Copy)]` and every field is Copy.

These are not Copy: `String`, `Vec<T>`, `Box<T>`, `HashMap`, a mutable reference `&mut T`, and any struct holding one of them. The compiler will not let you pretend otherwise:

```rust
#[derive(Clone, Copy)]
struct Packet {
    id: u16,
    payload: Vec<u8>,
}
```

```text
error[E0204]: the trait `Copy` cannot be implemented for this type
 --> src/main.rs:1:17
  |
1 | #[derive(Clone, Copy)]
  |                 ^^^^
...
4 |     payload: Vec<u8>,
  |     ---------------- this field does not implement `Copy`
```

A type that implements `Drop` can never be Copy either. That makes sense: if copies were made silently, which one would run the cleanup?

::: key Move by default, Copy by opt-in
Assignment and passing by value **move** unless the type is **Copy**. A move copies only the stack part and ends the old binding; a Copy duplicates the whole value and both bindings stay usable. Copy is only possible when every part of the type is Copy and the type has no `Drop`.
:::

::: warning Copy is not a speed setting
Beginners sometimes try to derive Copy to make an error go away. For a small struct of numbers (a 3-vector, a quaternion, a timestamp) Copy is right, and GNC math types are almost always Copy. But you cannot make a `Vec` Copy, and a big Copy struct gets duplicated every time you pass it. A `[f64; 1000]` is Copy, and passing it by value copies 8,000 bytes each call. Pass large things by reference instead.
:::

## Clone: the deliberate photocopy

Sometimes you really do want two independent owners of the same data: keep a backup of a sample buffer, then change the original. That is **`clone`** — a method that makes a full, deep copy, including a fresh heap buffer.

```rust
fn main() {
    let samples = vec![0.12_f64, 0.15, 0.11];
    let backup = samples.clone(); // a second, independent heap buffer
    let mut samples = samples;
    samples.push(0.40);
    println!("samples = {:?}", samples);
    println!("backup  = {:?}", backup);
}
```

```text
samples = [0.12, 0.15, 0.11, 0.4]
backup  = [0.12, 0.15, 0.11]
```

The difference from C++ is where the cost is written. In C++, `auto b = a;` on a vector silently allocates and copies every element. In Rust, the only way to get that is to type `.clone()`, so every expensive copy is visible in the source. In a 1 kHz control loop, an allocation you can see is an allocation you can remove.

The compiler's help text will often suggest `.clone()` when you hit a move error. Treat that as the last resort, not the first. One of this module's goals is to fix twenty borrow errors without it. The usual right answer is borrowing, which is the next lesson.

## The same program in C++

If you know C++11, you may think `std::move` is the same thing. It is related, but weaker. Here is the Rust program that failed with E0382, written in C++:

```cpp
#include <iostream>
#include <string>
#include <utility>
int main() {
    std::string callsign = "DRAGON-7";
    std::string logged = std::move(callsign);
    std::cout << "[" << callsign << "] size " << callsign.size() << "\n";
}
```

```text
[] size 0
```

It compiles with no warning under `g++ -Wall -Wextra` (g++ 13.3.0), and it runs. The moved-from string is left in what the C++ standard library calls a "[[valid but unspecified|valid-but-unspecified]]" state. With this library it happened to be empty. Nothing stopped us from reading it.

So the two languages differ in three ways:

- In C++ copying is the default and moving is opt-in (`std::move`). In Rust moving is the default and copying is opt-in (`Copy` for cheap types, `.clone()` for expensive ones).
- In C++ the moved-from object still exists, and its destructor still runs later. In Rust the moved-from binding is dead, and a moved-from value is not dropped at all.
- In C++ using a moved-from object is legal, and at best a logic bug. In Rust it is a compile error.

This is the first taste of what the module promises: rules you are supposed to follow by hand in C++ become rules the Rust compiler checks. Seeing which C++ bugs they rule out makes you a more careful C++ programmer too.

::: note Why one owner at a time rules out double free
Cleanup happens at the moment the owner goes out of scope (rule 3). If every value has exactly one owner at any moment (rules 1 and 2), then each value reaches the end of exactly one owner's scope, so its cleanup runs exactly once. A move does not break this: it transfers the job from the old owner to the new one, and the old binding is then removed from consideration, so the count of owners stays at one. The only way to break the count would be to have two live owners, which the compiler refuses to allow in safe code. The exceptions you will meet later are deliberate: `Rc` and `Arc` (lesson 05) share one value between several handles by counting them at runtime, and `std::mem::forget` skips a cleanup on purpose.
:::

## Check yourself

::: check
Write the three ownership rules from memory. Then say which rule is responsible for the cleanup code you never write.
:::

::: answer
Every value has exactly one owner; there is only one owner at a time; when the owner goes out of scope, the value is dropped. The third rule produces the cleanup: at the closing brace of the owner's scope, the compiler inserts the drop, which frees any heap memory. You never call `free` yourself.
:::

::: check
After `let a: [f64; 3] = [1.0, 2.0, 3.0]; let b = a;`, can you still print `a`? What about after `let a = vec![1.0, 2.0, 3.0]; let b = a;`? Explain the difference in terms of what lives on the heap.
:::

::: answer
The array: yes. `[f64; 3]` is Copy because all 24 bytes of it are the data itself, with no heap part, so `let b = a;` duplicates the bits and both are usable. The `Vec`: no. A `Vec` is a 24-byte header pointing at a heap buffer. `let b = a;` moves the header into `b` and ends `a`. If both were usable, both would free the same buffer. Printing `a` afterwards gives error E0382, "borrow of moved value".
:::

::: check
A struct `ImuSample { t_s: f64, gyro: [f64; 3], accel: [f64; 3] }` is passed by value to a filter function a thousand times a second. Can it be Copy? How many bytes are duplicated per call?
:::

::: answer
Yes. Every field is Copy (`f64` and arrays of `f64`), and it has no `Drop`, so `#[derive(Clone, Copy)]` is allowed. Its size is $8 + 3 \times 8 + 3 \times 8 = 56$ bytes, which is what gets copied per call. That is small: copying 56 bytes takes a handful of machine instructions, so Copy is a good choice for a sample like this.
:::

::: check
In the `Valve` example, suppose you delete the line `take(a);`. Write the new output, in order.
:::

::: answer
Now `a` stays owned by `main` until the end. The inner block still prints "inner block uses igniter purge" then "closing igniter purge". Then "main still owns RP-1 main". At the end of `main`, both `a` and `b` go out of scope, and Rust drops local variables in the reverse of the order they were declared, so `b` goes first:

```text
inner block uses igniter purge
closing igniter purge
main still owns RP-1 main
closing RP-1 main
closing LOX main
```

Three valves, three closes, as before.
:::

::: check
A teammate "fixes" an E0382 error by writing `log_line(msg.clone())` inside a loop that runs 1,000 times per second, where `msg` is a 200-byte `String`. What does that cost, and what is the better fix?
:::

::: answer
Each `.clone()` allocates a new 200-byte heap buffer and copies the text into it, and each one is freed when `log_line` returns. That is 1,000 allocations and 1,000 frees per second, about 200 kB of copying per second, all to print text that was never going to change. The better fix is to change `log_line` to take a borrowed `&str` (or `&String`) instead of an owned `String`, so the loop lends the same text every time and nothing is allocated. That is the subject of the next lesson.
:::

## Summary

| Idea | Meaning | Rust fact |
|---|---|---|
| Owner | The binding responsible for a value | Exactly one at a time |
| Drop | Cleanup when the owner leaves scope | Runs once; a moved-from value is not dropped |
| Move | Transfer of ownership | Copies the stack header only; old binding unusable (E0382) |
| Copy | Duplicate the whole value | Only if every part is Copy and there is no `Drop` |
| `clone()` | Deliberate deep copy | Allocates; always visible in the source |
| `String` / `Vec<T>` header | Pointer, length, capacity | 24 bytes on a 64-bit machine |
| C++ `std::move` | Opt-in move | Moved-from object is "valid but unspecified" and still usable |

Handing values back and forth is clumsy. The next lesson introduces borrowing: lending a value with `&T` or `&mut T` without giving up ownership, and the single rule about sharing and changing that makes the borrow checker work.

::: context stack-and-heap Two places to keep data
The stack is like a stack of trays in a cafeteria: each function call puts a tray on top, and when the function returns its tray is taken off. It is fast, but every tray has a fixed size known in advance. The heap is like a warehouse: you ask for a shelf of any size while the program runs, and you must hand the shelf back later. A `String` keeps a small fixed-size header on the stack and its text on a heap shelf.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="20" y="20" font-size="13" fill="#1f2a44">stack</text>
  <rect x="20" y="30" width="120" height="96" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="48" font-size="12" text-anchor="middle" fill="#1f2a44">s: String</text>
  <line x1="20" y1="56" x2="140" y2="56" stroke="#6c7a93"/>
  <text x="30" y="74" font-size="12" fill="#1d6fd1">ptr</text>
  <text x="30" y="96" font-size="12" fill="#1f2a44">len = 8</text>
  <text x="30" y="118" font-size="12" fill="#1f2a44">cap = 8</text>
  <text x="220" y="20" font-size="13" fill="#1f2a44">heap</text>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <rect x="200" y="58" width="18" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="209" y="75">D</text>
    <rect x="218" y="58" width="18" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="227" y="75">R</text>
    <rect x="236" y="58" width="18" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="245" y="75">A</text>
    <rect x="254" y="58" width="18" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="263" y="75">G</text>
    <rect x="272" y="58" width="18" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="281" y="75">O</text>
    <rect x="290" y="58" width="18" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="299" y="75">N</text>
    <rect x="308" y="58" width="18" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="317" y="75">-</text>
    <rect x="326" y="58" width="18" height="24" fill="#8fb8f0" stroke="#1f2a44"/><text x="335" y="75">7</text>
  </g>
  <line x1="60" y1="70" x2="194" y2="70" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="200,70 190,65 190,75" fill="#1d6fd1"/>
  <text x="272" y="106" font-size="11" text-anchor="middle" fill="#6c7a93">8 bytes of text</text>
</svg>
```
:::

::: context garbage-collection Why not a garbage collector?
A garbage collector is a part of the language runtime that pauses now and then, finds memory nothing points to any more, and frees it. It is convenient, and it is why Python and Java programmers rarely think about freeing. The price is timing: the pause happens when the collector decides, not when you do. A control loop that must finish its work every millisecond cannot afford a surprise pause, which is one reason flight software is written in C, C++, Ada or Rust, none of which use a collector for ordinary memory. Rust's ownership rules give the convenience of never writing `free` with none of the pauses.
:::

::: context raii Cleanup tied to a scope
RAII stands for "Resource Acquisition Is Initialization", a name from C++ that many people find hard to decode. The idea itself is easy to picture: a resource (memory, an open file, a locked mutex, a valve held open) belongs to an object, and when the object's scope ends, the cleanup runs automatically. You cannot forget it, and an early `return` cannot skip it. Rust uses the same idea for everything that owns something.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="20" y="24" font-size="13" fill="#1f2a44">fn main() {</text>
  <text x="40" y="46" font-size="13" fill="#1f2a44">let b = Valve{..};</text>
  <text x="40" y="68" font-size="13" fill="#1f2a44">{ let c = Valve{..}; }</text>
  <text x="20" y="112" font-size="13" fill="#1f2a44">}</text>
  <line x1="220" y1="64" x2="262" y2="64" stroke="#b4232c" stroke-width="2"/>
  <polygon points="214,64 224,59 224,69" fill="#b4232c"/>
  <text x="268" y="68" font-size="12" fill="#b4232c">c dropped</text>
  <line x1="40" y1="108" x2="262" y2="108" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <polygon points="34,108 44,103 44,113" fill="#b4232c"/>
  <text x="268" y="112" font-size="12" fill="#b4232c">b dropped</text>
  <text x="40" y="90" font-size="11" fill="#6c7a93">each closing brace ends a scope</text>
</svg>
```
:::

::: context double-free Freeing the same memory twice
In C, `malloc` hands you a block of heap memory and `free` hands it back. Call `free` twice on the same block and the allocator's own bookkeeping is corrupted: later allocations can hand out the same memory to two different parts of the program, which then overwrite each other. The crash, if one comes, can appear far away from the mistake and long after it. Double frees and their cousin use-after-free are among the most common memory-safety defects in large C and C++ programs. Rust's rule of one owner at a time is what makes them impossible in safe code. After `let logged = callsign;` the picture is this: two headers existed for an instant, but the old one is dead, so only one can ever free the text.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="110" height="46" fill="#fff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="75" y="40" font-size="12" text-anchor="middle" fill="#6c7a93">callsign</text>
  <text x="75" y="58" font-size="11" text-anchor="middle" fill="#b4232c">moved: unusable</text>
  <rect x="20" y="86" width="110" height="46" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="75" y="106" font-size="12" text-anchor="middle" fill="#1f2a44">logged</text>
  <text x="75" y="124" font-size="11" text-anchor="middle" fill="#1d6fd1">ptr, len 8, cap 8</text>
  <rect x="220" y="60" width="120" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">DRAGON-7</text>
  <line x1="130" y1="109" x2="214" y2="80" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="220,78 208,77 212,87" fill="#1d6fd1"/>
  <text x="280" y="110" font-size="11" text-anchor="middle" fill="#6c7a93">heap text never moved</text>
</svg>
```
:::

::: context error-codes The E-numbers
Every Rust compiler error has a code like E0382. The code is stable across compiler versions even when the wording of the message changes, so you can search for it. Running `rustc --explain E0382` in a terminal prints a short explanation with a broken example and a fixed one. Lesson 03 of this module walks through the dozen codes you will meet most often and how to read the labels under each one.
:::

::: context traits-preview A first look at traits
A trait is a named set of abilities a type can have, a bit like a C++ concept or an abstract interface. `Copy` is a trait with no methods at all: it is a promise that a plain bit-for-bit copy is a correct copy. `Clone` is a trait with one method, `clone()`. `Drop` is a trait with one method, `drop()`, which the compiler calls for you. `#[derive(...)]` asks the compiler to write the trait implementation automatically. Lesson 08 of this module covers traits in full.
:::

::: context valid-but-unspecified What "valid but unspecified" means
The C++ standard library promises only this about a moved-from `std::string` or `std::vector`: it is still a real object, you may assign a new value to it, and its destructor will run safely. It does not promise what the object contains. Reading it is legal but meaningless: empty on one library, something else on another. Static checkers such as clang-tidy have a check (`bugprone-use-after-move`) that flags reads like this, but the compiler itself accepts them. In Rust the moved-from name is not an object at all any more, so there is nothing to read.
:::
