---
id: l03-reading-borrow-checker-errors
title: Reading borrow-checker errors
minutes: 23
covers:
  - 'Reading borrow-checker errors instead of fighting them'
---

Imagine a note from the school library. It does not only say "problem with a book". It says: *you checked out* Rocket Propulsion Elements *on Monday; on Wednesday the librarian needed to send it away for rebinding; you are still reading it on Friday.* Three dates, one book, one conflict. Once you have read the note, you can see the fix yourself: return the book before Wednesday, or ask for the rebinding to wait until Friday.

Rust's borrow-checker errors are written in exactly that shape. The **[[borrow checker|borrow-checker-stage]]** — the part of the Rust compiler that checks the ownership and borrowing rules from the last two lessons — points at the line where a borrow started, the line where something conflicted with it, and the line where the borrow was still needed. Most people's first week with Rust is a fight with these messages. This lesson is about reading them instead. Read the three labels, and the message tells you what to change.

The skill pays off beyond Rust. Nearly every borrow-checker error is a bug that C++ would have compiled. Learning to read why Rust refused is learning to see those bugs in C++ code review, which is where most flight software still lives.

## The anatomy of one error

Here is a small program. It builds a flight log, borrows its first line, hands the whole log to an archiving function, and then prints the line it borrowed.

```rust
fn archive(log: Vec<String>) {
    println!("archived {} lines", log.len());
}

fn main() {
    let log = vec![String::from("T+0 liftoff"), String::from("T+72 max-Q")];
    let first = &log[0];
    archive(log);
    println!("{}", first);
}
```

```text
error[E0505]: cannot move out of `log` because it is borrowed
 --> src/main.rs:8:13
  |
6 |     let log = vec![String::from("T+0 liftoff"), String::from("T+72 max-Q")];
  |         --- binding `log` declared here
7 |     let first = &log[0];
  |                  --- borrow of `log` occurs here
8 |     archive(log);
  |             ^^^ move out of `log` occurs here
9 |     println!("{}", first);
  |                    ----- borrow later used here
  |
help: consider cloning the value if the performance cost is acceptable
  |
7 |     let first = &log.clone()[0];
  |                     ++++++++

For more information about this error, try `rustc --explain E0505`.
```

Every part has a job. Read it in this order:

1. **The header line.** `error[E0505]` is the **[[error code|error-index]]**, and the words after it are the one-sentence summary: "cannot move out of `log` because it is borrowed".
2. **The location.** `--> src/main.rs:8:13` is file, line 8, column 13: where the conflict happened.
3. **The primary label.** Under line 8, the `^^^` carets mark the exact thing the compiler refused: "move out of `log` occurs here". Carets always mark the conflict.
4. **The secondary labels.** Dashes `---` mark the context. Line 7: "borrow of `log` occurs here" is where the borrow started. Line 9: "borrow later used here" is why the borrow was still alive at line 8. Line 6 only says where `log` was declared.
5. **The help.** A suggestion the compiler is confident will make the error go away. Not necessarily the best fix. Here it suggests cloning the whole log, strings and all, to print one line.
6. **The pointer to more.** `rustc --explain E0505` prints a longer explanation with a broken example and a fixed one.

Those **[[labels|label-anatomy]]** hold the story: borrow starts (line 7), conflict (line 8), borrow still needed (line 9). The conflict sits *between* the start and the last use, which is exactly what the aliasing rule forbids. Nothing else in the message is new information.

::: key The three-point story
Almost every borrow-checker error names three places: where a borrow **starts**, where something **conflicts** with it (carets `^^^`), and where the borrow is **still used** later. To fix it, move one of the three: end the borrow before the conflict, move the conflict after the last use, or remove the need for a borrow at all.
:::

::: example Fixing E0505 without cloning
Apply the key to the log program. The three points are line 7 (start), line 8 (conflict: the move into `archive`), and line 9 (last use). Which one can move?

- The last use, line 9, can move up: print `first` before archiving. Then the borrow ends on line 8 (its new last use), and the move on line 9 conflicts with nothing.
- The conflict, the move, could move down, but then `archive` runs after the print, which is the same program in a different order.
- The borrow could be removed by copying the data, but the data is a `String`, and copying it is a clone.

The first option is the cheapest and says what the code means:

```rust
fn archive(log: Vec<String>) {
    println!("archived {} lines", log.len());
}

fn main() {
    let log = vec![String::from("T+0 liftoff"), String::from("T+72 max-Q")];
    let first = &log[0];
    println!("{}", first);
    archive(log);
}
```

```text
T+0 liftoff
archived 2 lines
```

Two lines in the log, "archived 2 lines": the count checks. No heap memory was copied. The original program had a real bug in it, too: `archive` takes ownership, so the log is dropped when `archive` returns, and `first` would have pointed into freed memory on line 9. In C++ that is a dangling reference. In Rust it was a three-line message with the fix inside it.
:::

## A field guide to the common errors

You will meet about ten error codes over and over. The ones below cover almost all ownership and borrowing mistakes. Each comes with the rule it enforces and the usual fixes, and every message was produced by rustc 1.94.1.

| Code | Summary line | Rule broken |
|---|---|---|
| E0382 | borrow of / use of moved value | Used a binding after moving out of it |
| E0499 | cannot borrow as mutable more than once at a time | Two `&mut` alive at once |
| E0502 | cannot borrow as mutable because it is also borrowed as immutable | `&` and `&mut` alive at once |
| E0505 | cannot move out of `x` because it is borrowed | Moved a value while a borrow of it lived |
| E0506 | cannot assign to `x` because it is borrowed | Overwrote a value while a borrow of it lived |
| E0507 | cannot move out of `x` which is behind a shared reference (or a mutable reference, for `&mut`) | Tried to take ownership through a borrow |
| E0515 | cannot return reference to local variable | Returned a reference to something about to be dropped |
| E0597 | `x` does not live long enough | A borrow outlived its owner |
| E0596 | cannot borrow as mutable, as it is not declared as mutable | `&mut` of a binding without `let mut` |
| E0106 | missing lifetime specifier | A reference in a signature or struct with no stated source |

The first three you met in lessons 01 and 02. Here are the rest.

### E0506: overwriting what someone is reading

```rust
fn main() {
    let mut mode = String::from("COAST");
    let shown = &mode;
    mode = String::from("BURN");
    println!("{} {}", shown, mode);
}
```

```text
error[E0506]: cannot assign to `mode` because it is borrowed
 --> src/main.rs:4:5
  |
3 |     let shown = &mode;
  |                 ----- `mode` is borrowed here
4 |     mode = String::from("BURN");
  |     ^^^^ `mode` is assigned to here but it was already borrowed
5 |     println!("{} {}", shown, mode);
  |                       ----- borrow later used here
```

Assigning a new `String` to `mode` drops the old one, "COAST", and frees its text. `shown` points at that text. Same three-point story, same fix: print `shown` before the assignment, or keep a copy of the old mode if you really need both.

### E0597: the owner leaves before the borrower

```rust
fn main() {
    let latest: &f64;
    {
        let reading = 101.3;
        latest = &reading;
    }
    println!("{}", latest);
}
```

```text
error[E0597]: `reading` does not live long enough
 --> src/main.rs:5:18
  |
4 |         let reading = 101.3;
  |             ------- binding `reading` declared here
5 |         latest = &reading;
  |                  ^^^^^^^^ borrowed value does not live long enough
6 |     }
  |     - `reading` dropped here while still borrowed
7 |     println!("{}", latest);
  |                    ------ borrow later used here
```

Here the "conflict" is a closing brace: line 6, where `reading` goes out of scope. The fix is to make the owner live at least as long as the borrower: declare `reading` in the outer block. This is the first time you see the compiler compare *how long* two things live; lesson 04 names that idea: lifetimes.

### E0515 and E0106: returning a borrow of something local

A function that builds a label and returns a reference to it:

```rust
fn make_label(id: u32) -> &str {
    let s = format!("SENSOR-{}", id);
    &s
}
```

```text
error[E0106]: missing lifetime specifier
 --> src/main.rs:1:27
  |
1 | fn make_label(id: u32) -> &str {
  |                           ^ expected named lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but there is no value for it to be borrowed from
```

Read the help line slowly: "there is no value for it to be borrowed from". A returned reference has to point into something that will still exist after the function returns, and that means something the *caller* passed in. `make_label` takes only a `u32` by value, so there is nothing to borrow from. If you silence E0106 by writing `&'static str` (read "ampersand tick static str", a reference that is valid for the whole program), the compiler moves on and reports the real problem:

```text
error[E0515]: cannot return reference to local variable `s`
 --> src/main.rs:3:5
  |
3 |     &s
  |     ^^ returns a reference to data owned by the current function
```

`s` is dropped at the end of `make_label`. The fix is the one the compiler's own help lists last: return the owned value.

```rust
fn make_label(id: u32) -> String {
    format!("SENSOR-{}", id)
}
```

Ownership moves out to the caller, no reference is involved, and nothing dangles. The same error, E0106, appears when a struct holds a reference with no stated source (`struct Latest { p: &f64 }`). Lesson 04 shows when adding a lifetime annotation is the right fix, and when, as here, it is a sign you wanted to own the data.

### E0507: taking ownership through a borrow

```rust
struct Frame {
    payload: Vec<u8>,
}

fn take_payload(f: &mut Frame) -> Vec<u8> {
    f.payload
}
```

```text
error[E0507]: cannot move out of `f.payload` which is behind a mutable reference
 --> src/main.rs:6:5
  |
6 |     f.payload
  |     ^^^^^^^^^ move occurs because `f.payload` has type `Vec<u8>`, which does not implement the `Copy` trait
```

The function borrowed the frame; it does not own it. Moving the payload out would leave the owner's `Frame` with a hole in it, a field that is no longer a valid `Vec`. The borrower may change the frame but must hand it back whole. The standard fix is to [[take the value and leave an empty one behind|mem-take]], with `std::mem::take`:

```rust
fn take_payload(f: &mut Frame) -> Vec<u8> {
    std::mem::take(&mut f.payload) // leaves an empty Vec behind
}
```

The caller then sees `[1, 2, 3]` returned and `[]` left behind in the frame. Nothing was copied.

::: example A method that borrows all of `self`
A tracker keeps a history of values and clamps them to a limit. The first version calls a helper method inside the loop:

```rust
struct Tracker {
    history: Vec<f64>,
    limit: f64,
}

impl Tracker {
    fn clamp(&mut self, x: f64) -> f64 {
        x.min(self.limit)
    }

    fn clamp_all(&mut self) {
        for h in self.history.iter_mut() {
            *h = self.clamp(*h);
        }
    }
}
```

```text
error[E0499]: cannot borrow `*self` as mutable more than once at a time
  --> src/main.rs:13:18
   |
12 |         for h in self.history.iter_mut() {
   |                  -----------------------
   |                  |
   |                  first mutable borrow occurs here
   |                  first borrow later used here
13 |             *h = self.clamp(*h);
   |                  ^^^^ second mutable borrow occurs here
```

Find the three points. Start: line 12, `self.history.iter_mut()` holds a `&mut` into the history for the whole loop. Conflict: line 13, `self.clamp` asks for `&mut self`, which is *all* of `self`, including the history the loop is walking. Still used: line 12 again, because the loop comes back around for the next element.

Now think about what `clamp` actually needs. It reads one field, `limit`. It never touches `history`, and it never writes anything. Its signature asks for far more than it uses. Inside one function body, the compiler tracks **[[disjoint fields|disjoint-fields]]** separately, so the fix is to reach the field directly:

```rust
impl Tracker {
    fn clamp_all(&mut self) {
        for h in self.history.iter_mut() {
            *h = h.min(self.limit); // two different fields: allowed
        }
    }
}
```

With `history: vec![1.0, 9.0]` and `limit: 5.0`, the result is `[1.0, 5.0]`: $\min(1, 5) = 1$ and $\min(9, 5) = 5$. Nothing above 5 remains, as a clamp should guarantee. Other good fixes: copy the limit into a local (`let limit = self.limit;`) before the loop, or make `clamp` take `&self`, or make it a plain function of `(x, limit)`. All of them say the same true thing to the compiler: clamping does not change the history.
:::

## The toolbox, without `clone()`

Here are the fixes, roughly in the order you should try them. Each one moves one of the three points, or removes a borrow.

1. **Reorder.** Use the borrow up before the conflicting line (E0502, E0505, E0506). Often the cheapest fix, and often the code reads better.
2. **Shorten the borrow.** Put it in its own small block, or into a helper function, so it ends sooner.
3. **Copy the small thing out.** `let r = v[0];` instead of `let r = &v[0];` when the element is Copy, like an `i32` or an `f64`.
4. **Keep an index, not a reference.** An index into a `Vec` survives a push; a reference does not.
5. **Borrow instead of move.** Change a parameter from `String` to `&str`, or from `Vec<T>` to `&[T]`, when the function only reads (E0382).
6. **Return owned data.** When a function creates something, return it by value (E0515, E0106).
7. **Split the borrow.** Borrow two fields instead of all of `self`, or use `split_at_mut` for two halves of a slice (E0499).
8. **Take and leave something behind.** `std::mem::take`, `std::mem::replace`, or `Option::take` to move a value out through a `&mut` (E0507).
9. **Collect, then change.** Gather what you want to add or remove while reading, then apply it after the loop (E0502 in a loop).

::: warning The help text is not the answer key
The compiler's "help: consider cloning the value" makes the error go away, and sometimes it is right: a one-off clone at startup costs nothing that matters. But a reflexive `.clone()` hides the real question. Why did two parts of the program both want this value? Often one of them should have borrowed, or the order of operations was wrong. And in a control loop, each `clone` of a `Vec` or `String` is a heap allocation, which flight code tries to keep out of the [[periodic path|no-alloc-in-loop]]. One goal of this module is to resolve twenty borrow-checker errors with no `clone()` at all. Treat each one as a question about the design.
:::

::: warning Fix the first error first
One mistake can produce several messages, and a later one may only be a consequence of an earlier one. The E0106 then E0515 pair above is typical: fixing the first revealed the second. Read from the top, fix one, and rebuild. Your editor's [[language server|rust-analyzer]] (rust-analyzer) shows the same messages inline as you type, which makes the loop short.
:::

## What the C++ compiler would have said

The exercise at the end of this module asks you to write the C++ twin of each error and say whether the C++ compiler catches it. Here is what we found for the errors in this module so far, with g++ 13.3.0 and `-Wall -Wextra`:

| Rust error | C++ twin | What g++ says |
|---|---|---|
| E0382 use after move | read a `std::string` after `std::move` | Nothing. Legal; value "valid but unspecified" |
| E0502 push while referencing | `const int& r = v[0]; v.push_back(40);` | Nothing. Undefined behavior when it reallocates |
| E0502 push inside range-`for` | `push_back` inside `for (double w : v)` | Nothing. Undefined behavior |
| E0499 across two threads | two threads doing `packets += 1` | Nothing. A data race; lost counts |
| E0505 move while borrowed | reference into a vector that is then moved away and destroyed | Nothing. Dangling reference |
| E0515 return reference to local | `const std::string& make_label(int)` returning a local | A warning, `-Wreturn-local-addr` |
| E0515 in disguise | `std::string_view make_label(int)` returning a local `std::string` | Nothing |
| E0597 borrow outlives owner | pointer to a variable in an inner block | A warning, `-Wdangling-pointer`, in the simplest case only |
| E0597 in disguise | same, but the pointer is stored through a member function | Nothing at `-O0` |

Two things stand out. First, C++ compilers catch some of these, but as **[[warnings, not errors|warnings-vs-errors]]**, and only in the plainest form. Move the same bug behind one function call or one `string_view` and the warning disappears. Second, every "Nothing" row is a bug that compiles cleanly and then misbehaves at runtime, sometimes, depending on timing or capacity. Rust turns every row into a compile error.

::: example Counting what each compiler catches
Take the nine rows of the table. The Rust compiler rejects all nine, so it catches $9$ out of $9$. g++ produces a warning on $2$ rows and nothing on the other $7$. The E0382 row is legal C++ with an unspecified result rather than undefined behavior, so of the $7$ silent rows, $7 - 1 = 6$ are undefined behavior (or a data race, which is undefined behavior in C++) that compile with no diagnostic at all.

As fractions: Rust catches $9/9 = 100\%$ as errors, g++ warns on $2/9 \approx 22\%$, and $6/9 \approx 67\%$ of these cases are silent undefined behavior in C++. The exercise predicts a similar split over twenty snippets: at least twelve silent in C++, which is $12/20 = 60\%$. Our small sample is in line with that.

Sanity check: $2 + 7 = 9$ rows, and $6 + 1 = 7$ silent rows. The counts add up.
:::

That comparison is the real reason to learn this. Rust does not add new rules to C++. It writes down the aliasing and lifetime rules a careful C++ engineer already obeys by hand, and makes the compiler check them. After a month of reading these errors, you start seeing the C++ twins in code review.

## Check yourself

::: check
In a borrow-checker message, what is the difference between the `^^^` label and the `---` labels? Which three things do the labels usually tell you?
:::

::: answer
The carets `^^^` mark the primary point: the exact expression the compiler refused, which is the conflict. The dashes `---` mark supporting context. Together they usually say where the borrow started, where the conflict happened, and where the borrow was still used later. The fix is to move one of those three, or to remove the need for the borrow.
:::

::: check
This fails with E0502:

```rust
let mut queue = vec![3, 1, 2];
let smallest = queue.iter().min().unwrap();
queue.sort();
println!("{}", smallest);
```

Name the three points and give a fix that does not clone.
:::

::: answer
Start: line 2, `queue.iter().min()` returns `Option<&i32>`, so `smallest` is a shared reference into the vector. Conflict: line 3, `sort` needs `&mut queue`. Still used: line 4 prints `smallest`. Fix by copying the number out, since `i32` is Copy: `let smallest = *queue.iter().min().unwrap();` (or `.copied()` before `.unwrap()`). Now `smallest` is an independent `1`, the borrow ends on line 2, and the sort is allowed. Moving the `println!` above the sort also works.
:::

::: check
Which error would you expect from each, before compiling? (a) `let s = String::from("x"); s.push('y');` (b) returning `&v[0]` from a function whose `v` is a local `Vec<i32>`, with the return type `&'static i32` (c) `let t = (*frame).payload;` where `frame: &Frame` and `payload: Vec<u8>`.
:::

::: answer
(a) E0596: `push` needs `&mut s`, but `s` was not declared with `let mut`. (b) E0515, worded here as "cannot return value referencing local variable `v`": `v` is dropped at the end of the function, so a reference into it would dangle. The fix is to return the `i32` itself, which is Copy. (c) E0507: moving `payload` out through a shared reference would leave the owner's frame broken. Borrow it (`let t = &frame.payload;`) or, if you had a `&mut Frame`, use `std::mem::take(&mut frame.payload)`.
:::

::: check
A teammate suggests fixing an E0499 in a `&mut self` method by cloning `self.history` before the loop and writing the clamped values back afterwards. What is the cost, and what better fix does the three-point reading suggest?
:::

::: answer
The clone allocates a second buffer the size of the history and copies every element, then the write-back copies them again: two full passes and one allocation every call. The three-point reading shows the conflict is a helper that asks for all of `&mut self` when it only reads one other field. Reach that field directly (`h.min(self.limit)`), copy it into a local before the loop, or change the helper to take `&self` or plain values. No allocation, one pass.
:::

::: check
Why does the C++ compiler warn about returning `const std::string&` to a local but not about returning a `std::string_view` of a local, when both dangle?
:::

::: answer
The warning is a pattern check written for one specific shape: a function whose return type is a reference, returning a local variable. `std::string_view` is an ordinary class that happens to hold a pointer and a length, so returning one by value does not match that pattern, even though the pointer inside it points at the dying local. Rust has no such gap, because a borrowed `&str` is a reference in the type system and the borrow checker checks every reference the same way.
:::

## Summary

| Idea | Meaning |
|---|---|
| `error[E0xxx]` | Stable code; `rustc --explain E0xxx` for the long version |
| `^^^` label | The conflict: the exact thing refused |
| `---` labels | Where the borrow started, and where it is still used |
| Three-point fix | Move the start, the conflict or the last use; or remove the borrow |
| E0505 / E0506 | Moved or overwrote a value while it was borrowed |
| E0597 / E0515 | A borrow outlived its owner; return owned data instead |
| E0507 | Moving out through a borrow; use `std::mem::take` |
| `clone()` | A last resort, not a first reflex |
| C++ twins | Mostly silent at compile time; some become warnings in the simplest form |

Several of these errors, E0597, E0515 and E0106, were about *how long* things live. The next lesson gives that idea its name and notation, lifetimes, and shows when you must write them yourself.

::: context borrow-checker-stage Where the borrow checker sits
The Rust compiler works in stages. It parses your text, resolves names, checks types, and then lowers the program to a simpler internal form called MIR, the mid-level intermediate representation, where every borrow, move and drop is spelled out as a separate step. The borrow checker runs on MIR. Only a program that passes it goes on to LLVM, the same code-generation back end Clang uses for C++. So the borrow checker adds no code and no runtime cost: by the time machine code exists, it has finished.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <rect x="8" y="30" width="60" height="34" fill="#fff" stroke="#1f2a44"/><text x="38" y="51">parse</text>
    <rect x="78" y="30" width="60" height="34" fill="#fff" stroke="#1f2a44"/><text x="108" y="51">types</text>
    <rect x="148" y="30" width="60" height="34" fill="#fff" stroke="#1f2a44"/><text x="178" y="51">MIR</text>
    <rect x="218" y="30" width="64" height="34" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/><text x="250" y="45">borrow</text><text x="250" y="58">check</text>
    <rect x="292" y="30" width="60" height="34" fill="#fff" stroke="#1f2a44"/><text x="322" y="51">LLVM</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="68" y1="47" x2="78" y2="47"/><line x1="138" y1="47" x2="148" y2="47"/>
    <line x1="208" y1="47" x2="218" y2="47"/><line x1="282" y1="47" x2="292" y2="47"/>
  </g>
  <text x="250" y="88" font-size="11" text-anchor="middle" fill="#b4232c">errors stop here</text>
  <text x="322" y="88" font-size="11" text-anchor="middle" fill="#6c7a93">machine code</text>
</svg>
```
:::

::: context error-index A catalog of every error
Every error the Rust compiler can emit has a code and an entry in the Rust error codes index, published with the documentation at doc.rust-lang.org. Each entry has a short explanation, code that triggers the error, and code that does not. `rustc --explain` prints the same text in your terminal. Because the codes do not change between compiler versions, searching the web for "E0502" finds answers written years apart that still apply, even when the wording of the message has improved since.
:::

::: context label-anatomy The three labels as a timeline
Lay the three labels along the program's lines, and a borrow error becomes a picture: a bar for the borrow, from where it starts to where it is last used, and a mark for the conflict landing inside the bar.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="20" y="34">line 7</text>
    <text x="20" y="74">line 8</text>
    <text x="20" y="114">line 9</text>
  </g>
  <rect x="80" y="22" width="16" height="96" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="108" y="34" font-size="12" fill="#1d6fd1">--- borrow starts: &amp;log[0]</text>
  <text x="108" y="74" font-size="12" fill="#b4232c">^^^ conflict: archive(log)</text>
  <text x="108" y="114" font-size="12" fill="#1d6fd1">--- still used: print first</text>
  <line x1="70" y1="70" x2="104" y2="70" stroke="#b4232c" stroke-width="3"/>
  <text x="20" y="142" font-size="11" fill="#6c7a93">fix: end the bar above the red mark, or move the mark below it</text>
</svg>
```
:::

::: context mem-take Swap something in, take something out
`std::mem::take(&mut x)` returns the value that was in `x` and puts the type's default value in its place: an empty `Vec`, an empty `String`, zero for numbers. `std::mem::replace(&mut x, new)` does the same with a replacement you choose. For an `Option`, `opt.take()` returns what was inside and leaves `None`. All three respect the borrowing rule: the owner gets back a complete, valid value, so nobody ever sees a hole. This is the move-out pattern used when a state machine hands its buffer to the next stage.
:::

::: context disjoint-fields The compiler can split a struct, but not across a call
Inside one function body, the borrow checker knows that `self.history` and `self.limit` are different pieces of memory, so borrowing one mutably and reading the other is fine. But a method call like `self.clamp(x)` only shows its signature, `&mut self`, and the checker takes that at its word: the call might touch every field. It does not look inside the method to see what it really uses. That is a deliberate choice, so that changing a method's body never breaks code that calls it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="200" height="70" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="30" y="22" font-size="12" fill="#1f2a44">Tracker (self)</text>
  <rect x="30" y="42" width="110" height="46" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="85" y="70" font-size="12" text-anchor="middle" fill="#1f2a44">history</text>
  <rect x="150" y="42" width="60" height="46" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="70" font-size="12" text-anchor="middle" fill="#1f2a44">limit</text>
  <text x="235" y="58" font-size="11" fill="#1d6fd1">&amp;mut history: loop</text>
  <text x="235" y="78" font-size="11" fill="#1f2a44">&amp;limit: read, OK</text>
  <text x="20" y="122" font-size="11" fill="#b4232c">self.clamp() asks for all of self, so it overlaps the loop</text>
</svg>
```
:::

::: context no-alloc-in-loop Why flight loops avoid the heap
Asking the heap for memory takes a variable amount of time, depending on what has been allocated and freed before, and after months of running it can fail because free memory has broken into small pieces. A control loop with a hard deadline cannot accept either. So many flight coding standards allow dynamic allocation only while the software starts up. NASA JPL's "Power of Ten" rules for safety-critical code, for example, say not to use dynamic memory allocation after initialization. A `clone()` of a `Vec` inside the loop quietly breaks that rule.
:::

::: context rust-analyzer Errors while you type
A language server is a background program that your editor talks to while you type. rust-analyzer is the one for Rust: it runs the compiler's checks on your code as you edit and draws the same labels as squiggles under the lines. The three-point story then shows up in the editor itself, and you can fix a borrow error seconds after you make it instead of after a full build.
:::

::: context warnings-vs-errors Why a warning is not enough
A warning lets the build finish. On a large codebase with hundreds of existing warnings, a new one is easy to miss, and a flag like `-Werror` that turns warnings into errors helps only if the warning fires at all. The deeper problem is coverage: a C++ compiler's dangling-reference warnings look for a few known shapes, because C++'s type system does not record where a pointer came from. Rust's references carry that information in their types, so the check is complete for safe code rather than a best effort. GCC's `-Wdangling-pointer` warning, for example, first appeared in GCC 12.
:::
