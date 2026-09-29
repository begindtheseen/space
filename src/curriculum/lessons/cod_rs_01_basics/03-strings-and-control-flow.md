---
id: l03-strings-and-control-flow
title: Text as String and &str, and the ways a program repeats and decides
minutes: 21
covers:
  - String versus &str
  - Control flow; loop, while let, for
---

Think about the difference between your own notebook and a book in the school library. The notebook is yours. You can write more pages into it, tear pages out, and when you are done with it, you throw it away. A library book is different. You may read it, and you may put a bookmark in it or point a friend at "page 40, lines 3 to 7", but you do not own it and you may not scribble in it.

Rust has two main kinds of text, and they are exactly that pair. A **`String`** is the notebook: text you own, that can grow, stored in memory the program asked for. A **`&str`** (read "ref stir" or "string slice") is the library visit: a borrowed view of some text that lives somewhere else. Knowing which one to use where is one of the first things that makes Rust code look like Rust.

A flight computer handles more text than you might think. Commands arrive as text from the ground, telemetry is often logged as text lines, configuration files are text, and every error message is text. The second half of this lesson covers the other everyday tool: **control flow**, the ways a program decides what to do next and repeats work — `if`, `loop`, `while`, `while let` and `for`.

## Text is a row of UTF-8 bytes

Before either type makes sense, you need to know how Rust stores text. Every Rust string is **[[UTF-8|utf8-bytes]]**: a way of writing characters as bytes in which the plain English letters, digits and punctuation take 1 byte each, and other characters take 2, 3 or 4 bytes. The Greek letter Ω (the ohm, the unit of electrical resistance) takes 2.

That has consequences you can see:

```rust
fn main() {
    let unit = "Ω";
    println!("\"{}\" has {} bytes but {} char", unit, unit.len(), unit.chars().count());
}
```

```text
"Ω" has 2 bytes but 1 char
```

`.len()` counts **bytes**, not characters. `.chars()` walks the text one character at a time, and `.count()` counts them. For ordinary English text the two numbers agree; the moment a symbol like Ω or ° appears, they do not.

For the same reason, Rust will not let you ask for "character number 0" with square brackets. The line `name[0]` on a string is a compile error that says `string indices are ranges of usize`. Finding the fifth character would mean walking through the bytes from the start, and Rust refuses to hide that cost behind something that looks as cheap as an array lookup.

## String: text you own

A `String` is text that owns a **growable buffer** on the **heap**, the area of memory a program asks for while running (the same heap `new` and `std::vector` use in C++). You make one from a literal with `String::from`, and you can add to it:

```rust
let mut owned = String::from("Drag");
owned.push_str("on");     // add a &str to the end
owned.push('!');          // add one char
// owned is now "Dragon!"
```

The `String` value itself is small and fixed: three machine words, 24 bytes on this computer. They hold a **[[pointer to the buffer, the capacity, and the length|string-layout]]**. The **length** is how many bytes are in use. The **capacity** is how many bytes the buffer has room for before it must be moved to a bigger one. After `String::from("Drag")` and `push_str("on")`, this machine reported length 6 and capacity 8: the buffer grew to 8 bytes to make room, and has 2 spare.

When a `String` goes out of scope, its buffer is freed automatically. You never call `delete`.

## &str: a borrowed view

A `&str` does not own anything. It is a pointer to the first byte plus a length: 16 bytes, two machine words. The `&` in front (read "ref", short for reference) is Rust's sign for "borrowed". It can point into three kinds of place:

- A **string literal** in your code, like `"Falcon"`. The text is stored inside the program file itself and lasts as long as the program runs, so its type is `&str`.
- The inside of a `String`: `&owned` borrows all of it, and `&owned[0..4]` borrows bytes 0, 1, 2 and 3.
- Part of another `&str`. `line.split_whitespace()` hands you each word as a `&str` pointing back into `line`, with no copying.

A range like `0..4` counts byte positions, and it must start and end on a character boundary. Cut through the middle of Ω and the program stops:

```rust
fn main() {
    let reading = String::from("25Ω");
    println!("{}", &reading[0..2]);
    println!("{}", &reading[0..3]);
}
```

```text
25

thread 'main' (4865) panicked at src/main.rs:4:28:
byte index 3 is not a char boundary; it is inside 'Ω' (bytes 2..4) of `25Ω`
```

Bytes 0 and 1 are the digits `2` and `5`, so `0..2` is fine. Ω occupies bytes 2 and 3, so ending at 3 would cut it in half.

## Which one should a function take?

Now the question that matters most in practice. You write a function that only needs to **read** some text — check a command, print a label, look up a name. What type should its parameter be?

The answer is `&str`. Here is why, with a real program. The function checks whether a command means "abort", ignoring spaces and upper or lower case:

```rust
fn is_abort(command: &str) -> bool {
    command.trim().eq_ignore_ascii_case("abort")
}

fn main() {
    // three kinds of text, one function
    let typed_by_hand = "ABORT";
    let from_radio = String::from("  abort\n");
    let packet = "CMD:ABORT;SEQ:17";
    let middle = &packet[4..9];

    println!("{}", is_abort(typed_by_hand));
    println!("{}", is_abort(&from_radio));
    println!("{}", is_abort(middle));
    println!("middle = {middle:?}");
}
```

```text
true
true
true
middle = "ABORT"
```

One function accepted a literal, a borrowed `String`, and a slice of a longer packet. `.trim()` returned a `&str` view without the spaces and the newline, again with no copying. And `&packet[4..9]` is bytes 4 to 8: count `C M D :` as bytes 0 to 3, so byte 4 is the `A`, and five bytes `A B O R T` end at byte 8.

Why does `&from_radio`, which is a `&String`, fit a `&str` parameter? Rust automatically turns a `&String` into a `&str` of the whole text when a function asks for one. This is called **[[deref coercion|deref-coercion]]**, and it only works in that direction.

Now look at the two tempting alternatives, and what the compiler says about each:

```rust
fn by_value(s: String) -> usize { s.len() }
fn by_ref_string(s: &String) -> usize { s.len() }

fn main() {
    let a = by_value("LOX");
    let b = by_ref_string("RP-1");
    println!("{a} {b}");
}
```

```text
error[E0308]: mismatched types
 --> src/main.rs:5:22
  |
5 |     let a = by_value("LOX");
  |             -------- ^^^^^ expected `String`, found `&str`
...
error[E0308]: mismatched types
 --> src/main.rs:6:27
  |
6 |     let b = by_ref_string("RP-1");
  |             ------------- ^^^^^^ expected `&String`, found `&str`
```

A parameter of type `String` demands an owned `String`. A caller holding a literal must build one with `.to_string()`, allocating memory for nothing. Worse, a caller holding a `String` must hand it over for good: after the call it is gone, a rule called a **[[move|move-preview]]** that the next module explains. A parameter of type `&String` accepts only a borrowed `String`, and rejects literals and slices; it can do nothing a `&str` cannot, while accepting less.

::: key String versus &str
`String` owns a growable heap buffer; `&str` is a borrowed view of UTF-8 bytes. Function parameters should take `&str` so both a literal and an owned `String` work, which is the same reasoning as [[std::string_view in C++|string-view-bridge]].
:::

When should a function take a `String`? When it keeps the text — storing it in a struct that outlives the call, for instance. And a function that builds new text returns a `String`, because the caller needs to own the result.

::: example Building text
Three ways to make new text from pieces, run for real:

```rust
fn shout(callsign: &str) -> String {
    let mut out = String::from("CALLING ");
    out.push_str(callsign);
    out.push('!');
    out
}

fn main() {
    let literal = "Falcon";
    let owned = String::from("Dragon");
    println!("{}", shout(literal));
    let joined = format!("{}-{}", literal, 9);
    let glued = owned + " " + literal;   // owned is used up here
    println!("{joined} / {glued}");
}
```

```text
CALLING Falcon!
Falcon-9 / Dragon Falcon
```

`shout` takes a `&str` and returns a new `String`: `"CALLING "` has 8 bytes, `"Falcon"` 6, and `'!'` 1, so the result is 15 bytes long. `format!` works like `println!` but returns the text instead of printing it; it is the most flexible tool. `+` takes an owned `String` on the left and a `&str` on the right, and reuses the left one's buffer, which is why `owned` cannot be used afterwards.
:::

::: warning Do not reach for .to_string() to silence the compiler
When a type error says "expected `String`, found `&str`", the quick fix is to add `.to_string()` at the call. Often the better fix is to change the function to take `&str`. Ask what the function does with the text. If it only reads it, borrow it.
:::

## Deciding: if is an expression

Rust's `if` looks like C++'s without the round brackets around the condition. The condition must be a real `bool`. There is no "zero means false" as in C++ or "an empty list means false" as in Python:

```rust
fn main() {
    let satellites = 4;
    if satellites {
        println!("have a fix");
    }
}
```

```text
error[E0308]: mismatched types
 --> src/main.rs:3:8
  |
3 |     if satellites {
  |        ^^^^^^^^^^ expected `bool`, found integer
```

Write what you mean: `if satellites >= 4`.

The bigger difference is that `if` is an **[[expression|expressions-and-semicolons]]**: it produces a value. So you can use it on the right of `let`, where C++ would need the `? :` operator:

```rust
let altitude_m = 850.0;
let phase = if altitude_m > 1_000.0 { "descent" } else { "terminal" };
// phase is "terminal"
```

Both branches must give the same type, here `&str`. Since $850 < 1000$, the `else` branch runs and `phase` is `"terminal"`.

## Repeating: loop, while and for

### loop: forever, until you break

`loop` repeats its block forever. `break` leaves it. And `break` can carry a value out, which becomes the value of the whole `loop`:

```rust
let mut pressure_kpa = 20.0;
let mut tries = 0;
let ready_after = loop {
    tries += 1;
    pressure_kpa += 7.5;
    if pressure_kpa >= 50.0 {
        break tries;
    }
};
println!("tank pressurized after {ready_after} steps ({pressure_kpa} kPa)");
// prints: tank pressurized after 4 steps (50 kPa)
```

Trace it: $20 + 7.5 = 27.5$, then $35$, then $42.5$, then $50$. On the fourth step $50 \geq 50$, so `break tries` hands back 4. Use `loop` for "keep trying until something happens", such as waiting for a sensor to come up; `continue` skips to the next time round.

### while: as long as a condition holds

```rust
let mut t = 3;
while t > 0 {
    println!("T-{t}");
    t -= 1;
}
// prints T-3, T-2, T-1
```

The condition is checked before each pass. When `t` reaches 0, $0 > 0$ is false and the loop ends, so "T-0" is never printed.

### for: once for each item

`for` walks through anything that hands out items one at a time. The most common are ranges and collections:

```rust
for engine in 1..=3 {
    print!("engine {engine} ok; ");
}
// prints: engine 1 ok; engine 2 ok; engine 3 ok;

let temps_c = [21.5, 22.0, 85.3, 21.8];
for (i, temp) in temps_c.iter().enumerate() {
    if *temp > 60.0 {
        println!("sensor {i} hot: {temp} C");
    }
}
// prints: sensor 2 hot: 85.3 C
```

`1..=3` (read "one through three, inclusive") gives 1, 2, 3. Without the `=`, `1..3` gives only 1 and 2: the end is left out, a **[[half-open range|half-open-ranges]]**. `.iter()` hands out each array element in turn, as a borrowed reference; `.enumerate()` pairs each one with its position, starting at 0. The `*` in `*temp` (read "star temp") reads the value the reference points to.

In Rust, `for` is the usual loop. There is no C-style `for (i = 0; i < n; i++)`. Walking a collection directly means there is no index to get wrong and no way to run past the end.

::: example Stopping two loops at once
A lander's camera scores a 3 by 4 grid of landing cells by slope. Find the first cell, row by row, with a slope under 5 degrees.

```rust
fn main() {
    let slope_deg = [
        [12.0, 9.5, 14.1, 7.2],
        [8.8, 6.1, 4.3, 11.0],
        [3.9, 2.5, 6.6, 5.0],
    ];
    let mut found = None;
    'rows: for (r, row) in slope_deg.iter().enumerate() {
        for (c, s) in row.iter().enumerate() {
            if *s < 5.0 {
                found = Some((r, c));
                break 'rows;
            }
        }
    }
    println!("first safe cell: {:?}", found);
}
```

```text
first safe cell: Some((1, 2))
```

A plain `break` would only leave the inner loop, and the search would carry on in the next row. `'rows:` (read "label rows") names the outer loop, and `break 'rows` leaves both at once.

Check by hand. Row 0 is 12.0, 9.5, 14.1, 7.2: none under 5. Row 1 is 8.8, 6.1, then 4.3: under 5, at row 1, column 2. The later cells 3.9 and 2.5 are flatter, but the search asked for the first, and stopped. `found` starts as `None` (nothing found yet) and becomes `Some((1, 2))`.
:::

## while let: loop while a pattern matches

Many things in Rust hand you "either a value, or nothing left". You met this shape in the last lesson: `Some(value)` or `None`. **`while let`** runs a loop as long as the next thing has the shape you asked for, and unpacks the value for you each time.

```rust
let mut commands = vec!["ARM", "IGNITE", "THROTTLE 80"];
while let Some(cmd) = commands.pop() {
    println!("run {cmd}");
}
```

```text
run THROTTLE 80
run IGNITE
run ARM
```

`vec![…]` makes a `Vec`, a list that can grow and shrink (lesson 5 covers it). `.pop()` removes the last item and returns `Some(item)`, or `None` when the list is empty. Read the loop as "while popping gives `Some(cmd)`, run the block with that `cmd`". Notice the order: `pop` takes from the end, so the commands came out [[last in, first out|stack-order]]. When the list is empty, `pop` returns `None`, the pattern no longer matches, and the loop ends. No index, no length check, no way to pop from an empty list by mistake.

::: example Reading a telemetry line
A text line from a test stand holds name–value pairs: `"ALT 10500 VEL -42.5 TEMP 21.3"`. Print each pair.

```rust
fn main() {
    let line = "ALT 10500 VEL -42.5 TEMP 21.3";
    let mut words = line.split_whitespace();

    while let Some(name) = words.next() {
        let value: f64 = match words.next() {
            Some(text) => text.parse().unwrap(),
            None => break,
        };
        println!("{name:>4} = {value}");
    }
}
```

```text
 ALT = 10500
 VEL = -42.5
TEMP = 21.3
```

`split_whitespace()` gives an **iterator**: something with a `.next()` method that returns the next word as `Some(&str)`, or `None` at the end. Each word is a `&str` view into `line`; nothing was copied. The `while let` takes a name. The `match` (lesson 4 teaches it fully) takes the value right after it: if there is one, parse it as an `f64`; if the line ended early, `break` out. `{name:>4}` pads the name to 4 characters, right-aligned, so the `=` signs line up.

Six words, three passes through the loop, three lines printed. On the fourth pass `words.next()` returns `None`, the pattern `Some(name)` does not match, and the loop stops.
:::

::: key Loops at a glance
`loop` repeats until `break`, which may return a value. `while` repeats while a `bool` is true. `for` runs once per item of a range or collection. `while let Some(x) = …` repeats while the next result matches the pattern. `if` and `loop` are expressions that produce values.
:::

## Check yourself

::: check
How many bytes and how many characters are in the string `"20°C"`? The degree sign ° takes 2 bytes in UTF-8.
:::

::: answer
The characters are `2`, `0`, `°` and `C`: 4 characters. The bytes are $1 + 1 + 2 + 1 = 5$. So `.len()` gives 5 and `.chars().count()` gives 4. Slicing with `[0..3]` would panic, because byte 3 is inside the ° (bytes 2 and 3).
:::

::: check
You are writing `fn log_event(message: …)` that prints a message with a timestamp and does not keep it. Some callers pass literals and some pass `String`s they built with `format!`. What parameter type should it have, and how does each caller pass its text?
:::

::: answer
`message: &str`. A caller with a literal passes it as it is: `log_event("engine armed")`. A caller with a `String` lends it: `log_event(&text)`, and Rust turns the `&String` into a `&str` automatically. The caller keeps its `String` and can use it again afterwards. Neither caller has to allocate anything extra.
:::

::: check
What value does `n` end with, and how many times does the body run?

```rust
let mut n = 1;
let steps = loop {
    n *= 3;
    if n > 100 {
        break n;
    }
};
```
:::

::: answer
`n` goes $3, 9, 27, 81, 243$. The body runs 5 times; on the fifth, $243 > 100$, so `break n` returns 243. Both `n` and `steps` end as 243.
:::

::: check
How many times does each of these print, and what numbers? (a) `for i in 0..4`; (b) `for i in 0..=4`; (c) `for i in (0..4).rev()`.
:::

::: answer
(a) 4 times: 0, 1, 2, 3, because the end is left out. (b) 5 times: 0, 1, 2, 3, 4, because `..=` includes the end. (c) 4 times, backwards: 3, 2, 1, 0; `.rev()` reverses the range.
:::

::: check
A classmate writes `fn is_valid(id: &String) -> bool` and complains that `is_valid("SN15")` does not compile. What is going on, and what is the fix?
:::

::: answer
`"SN15"` is a literal, of type `&str`. A `&String` parameter only accepts a borrowed `String`, so the literal does not fit. The fix is to change the parameter to `id: &str`. Then literals and slices work as they are, and callers with a `String` pass `&their_string`, which Rust converts automatically.
:::

## Summary

| Idea | Rust | What to remember |
| --- | --- | --- |
| Owned text | `String` | Pointer, capacity, length; growable heap buffer; freed at end of scope |
| Borrowed text | `&str` | Pointer and length; literal, whole `String`, or a slice of either |
| Length | `.len()` vs `.chars().count()` | Bytes versus characters; UTF-8 |
| Slicing | `&s[a..b]` | Byte positions; must fall on character boundaries |
| Read-only parameter | `fn f(s: &str)` | Accepts literals, slices and `&String` |
| Branch | `if cond { a } else { b }` | Condition must be `bool`; it is an expression |
| Loops | `loop`, `while`, `for x in …` | `break` can return a value from `loop`; labels leave outer loops |
| Pattern loop | `while let Some(x) = …` | Runs until the pattern stops matching |

Next lesson: Rust's `struct` and its `enum`, which can carry data in each variant, and `match`, which makes the compiler check that every case is handled.

::: context utf8-bytes How UTF-8 lays out "25Ω"
UTF-8 was designed so that plain English text is byte-for-byte the same as old ASCII text, and every other character still fits. A character's first byte tells how many bytes it uses. Ω is Unicode number 937, which needs 2 bytes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="60" y="20">byte 0</text><text x="130" y="20">byte 1</text><text x="200" y="20">byte 2</text><text x="270" y="20">byte 3</text>
  </g>
  <rect x="30" y="28" width="60" height="34" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="100" y="28" width="60" height="34" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="170" y="28" width="60" height="34" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="240" y="28" width="60" height="34" fill="#f2b880" stroke="#1f2a44"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="50">0x32</text><text x="130" y="50">0x35</text><text x="200" y="50">0xCE</text><text x="270" y="50">0xA9</text>
    <text x="60" y="84">'2'</text><text x="130" y="84">'5'</text><text x="235" y="84">'Ω' (2 bytes)</text>
  </g>
  <line x1="235" y1="24" x2="235" y2="66" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="235" y="108" font-size="11" text-anchor="middle" fill="#b4232c">cutting at byte 3 splits Ω: panic</text>
</svg>
```
:::

::: context string-layout What a String and a &str look like in memory
The `String` is three words that live wherever the variable lives. The text itself sits in a heap buffer, possibly with spare room at the end. A `&str` is two words: where the text starts, and how many bytes long it is. It can point at any part of the buffer.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44" font-weight="700">String (24 bytes)</text>
  <rect x="10" y="26" width="50" height="28" fill="#fff" stroke="#1f2a44"/><text x="35" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">ptr</text>
  <rect x="60" y="26" width="50" height="28" fill="#fff" stroke="#1f2a44"/><text x="85" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">cap 8</text>
  <rect x="110" y="26" width="50" height="28" fill="#fff" stroke="#1f2a44"/><text x="135" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">len 6</text>
  <text x="200" y="18" font-size="12" fill="#1f2a44" font-weight="700">heap buffer</text>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="200" y="70" width="18" height="28" fill="#8fb8f0" stroke="#1f2a44"/><text x="209" y="89">D</text>
    <rect x="218" y="70" width="18" height="28" fill="#8fb8f0" stroke="#1f2a44"/><text x="227" y="89">r</text>
    <rect x="236" y="70" width="18" height="28" fill="#8fb8f0" stroke="#1f2a44"/><text x="245" y="89">a</text>
    <rect x="254" y="70" width="18" height="28" fill="#8fb8f0" stroke="#1f2a44"/><text x="263" y="89">g</text>
    <rect x="272" y="70" width="18" height="28" fill="#8fb8f0" stroke="#1f2a44"/><text x="281" y="89">o</text>
    <rect x="290" y="70" width="18" height="28" fill="#8fb8f0" stroke="#1f2a44"/><text x="299" y="89">n</text>
    <rect x="308" y="70" width="18" height="28" fill="#fff" stroke="#6c7a93"/>
    <rect x="326" y="70" width="18" height="28" fill="#fff" stroke="#6c7a93"/>
  </g>
  <path d="M35,54 C35,84 150,84 198,84" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="200,84 191,80 191,88" fill="#1d6fd1"/>
  <text x="10" y="130" font-size="12" fill="#1f2a44" font-weight="700">&amp;owned[0..4] (16 bytes)</text>
  <rect x="10" y="138" width="50" height="28" fill="#fff" stroke="#1f2a44"/><text x="35" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">ptr</text>
  <rect x="60" y="138" width="50" height="28" fill="#fff" stroke="#1f2a44"/><text x="85" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">len 4</text>
  <path d="M110,150 C170,150 209,130 209,100" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="209,99 205,108 213,108" fill="#b4232c"/>
</svg>
```

Gray boxes are spare capacity: room to grow without moving.
:::

::: context deref-coercion Why a &String fits where a &str is asked for
A `String` knows how to hand out a view of its whole text as a `str`. When a function wants `&str` and you give it `&String`, the compiler inserts that step for you. It is called deref coercion because it follows the same "dereference" step that `*` performs. It only goes from the owning type to the view, never the other way, because a view cannot conjure up a buffer to own.
:::

::: context move-preview A first look at moves
In Rust every value has exactly one owner. Passing a `String` to a function that takes `String` moves it: the function becomes the owner, and your variable can no longer be used. The compiler reports it as `borrow of moved value`. Moves are the heart of the next Rust module, on ownership and borrowing, where you will see why this rule removes whole classes of memory bugs.
:::

::: context string-view-bridge The C++ cousin
C++17 added `std::string_view`: a pointer and a length that looks at characters owned by someone else. A function taking `std::string_view` accepts a `std::string`, a string literal, or part of either, with no copy — exactly the reason Rust functions take `&str`. The difference is safety: in C++, nothing stops a `string_view` from outliving the string it points into. In Rust, the compiler checks that every `&str` stops being used before its text goes away.
:::

::: context expressions-and-semicolons Expressions, statements, and the semicolon
An expression produces a value: `2 + 3`, `if a { 1 } else { 2 }`, a whole `{ … }` block. A statement does something and produces nothing useful. In Rust, putting a semicolon after an expression turns it into a statement and throws the value away. That is why a function's last line has no semicolon when it is the return value, and why adding one by accident gives a type error about `()`, Rust's "nothing" value.
:::

::: context half-open-ranges Why the end is left out
A range that includes its start and leaves out its end, `a..b`, has exactly $b - a$ items, and two ranges `a..b` and `b..c` join with no gap and no overlap. With positions starting at 0, `0..n` covers every position of an $n$-item array. The computer scientist Edsger Dijkstra made this argument in a short 1982 note on why numbering should start at zero. Python's `range` and C++ iterator pairs follow the same rule.
:::

::: context stack-order Last in, first out
A pile of plates is used from the top: the last plate put on is the first taken off. A `Vec` used with `push` and `pop` behaves the same, and programmers call that a **stack**. If you want the commands in their original order instead, walk the list with `for cmd in &commands`, or reverse it first. The order a loop visits things in is part of what the code means; on a vehicle, "ARM" must come before "IGNITE".
:::
