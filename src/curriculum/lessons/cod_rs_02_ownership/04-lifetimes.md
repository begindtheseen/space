---
id: l04-lifetimes
title: Lifetimes, or how long a borrow may last
minutes: 24
covers:
  - 'Lifetimes: elision rules, explicit annotations, lifetimes in structs, static'
---

Think about a library book. When you check it out, the slip inside the cover has a due date. You can read it, lend it to your sister, carry it to school. What you cannot do is keep it past the due date, because then the library may give it to someone else. Every borrow comes with a window of time.

Rust references work the same way. A `&f64` or a `&str` is a borrow, and every borrow has a due date: the moment its owner goes out of scope and the value is dropped. The borrow checker's job is to make sure no reference is ever used after its due date. The stretch of code during which a reference must stay valid is called its **lifetime**.

Usually the compiler works lifetimes out by itself. This lesson is about the times it asks you: the notation `'a`, the three **elision rules** that fill lifetimes in for you, lifetimes in structs, and the special lifetime `'static`. On a flight computer this is what lets you parse a telemetry packet in place, without copying it, and still be certain nothing points into a buffer that has been reused.

## A lifetime is a stretch of code

You met a lifetime error in the last lesson, E0597: "`reading` does not live long enough". The compiler compared two stretches of code: where the owner, `reading`, existed, and where the reference, `latest`, was still going to be used. The second reached past the end of the first, so the program was rejected.

That comparison is all a lifetime ever is. A lifetime is a **[[region|lifetime-region]]** of the program — from the line where a borrow is created to the last line where it is used — and the rule is:

- a reference's lifetime must fit inside the lifetime of the value it points into.

Inside one function, the compiler can see every line, so it measures these regions by itself. The trouble starts at a function boundary. When a function returns a reference, the caller needs to know *where that reference points*, so it can check the due date. The compiler does not look inside the function body to find out. It reads only the **signature** — the `fn` line with its parameter types and return type. So the signature has to say it.

## Writing a lifetime down

Here is a function that picks one of two sensor labels. If the primary unit is healthy, use its name; otherwise fall back to the backup.

```rust
fn pick_label(primary: &str, backup: &str, primary_ok: bool) -> &str {
    if primary_ok { primary } else { backup }
}

fn main() {
    println!("{}", pick_label("IMU-A", "IMU-B", false));
}
```

```text
error[E0106]: missing lifetime specifier
 --> src/main.rs:1:65
  |
1 | fn pick_label(primary: &str, backup: &str, primary_ok: bool) -> &str {
  |                        ----          ----                       ^ expected named lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from `primary` or `backup`
```

The help line says exactly what is missing. The returned `&str` points into *something*, and the signature does not say into what. From the caller's side of the fence, the answer matters: if the result borrows from `backup`, the caller must keep `backup` alive as long as it uses the result.

The fix is a **lifetime annotation**, a name for a lifetime, written with an apostrophe:

```rust
fn pick_label<'a>(primary: &'a str, backup: &'a str, primary_ok: bool) -> &'a str {
    if primary_ok { primary } else { backup }
}
```

Read it aloud piece by piece.

- `<'a>` — read "tick a" or "lifetime a". This introduces a **[[lifetime parameter|tick-name]]**, the same way `<T>` introduces a type parameter. It says: "this function works for some lifetime; call it `'a`".
- `&'a str` — read "ampersand tick a str": a borrowed string that is valid for at least the lifetime `'a`.
- `-> &'a str` — the result is valid for `'a` as well.

Put together, the signature is a promise in both directions. To the function body it says: you may only return something that lives at least as long as `'a`, which both inputs do. To the caller it says: the result is good for as long as *both* inputs are still alive. When two different inputs are both tagged `'a`, the compiler picks for `'a` the region where both are valid, which is the shorter of the two.

::: key What a lifetime annotation says
It relates the lifetimes of inputs and outputs so the compiler can check that a returned reference cannot outlive what it points into. It does not change how long anything lives; it only describes the relationship.
:::

::: example The caller has to keep both inputs alive
Use the annotated `pick_label` where `backup` lives in a shorter inner block:

```rust
fn pick_label<'a>(primary: &'a str, backup: &'a str, primary_ok: bool) -> &'a str {
    if primary_ok { primary } else { backup }
}

fn main() {
    let primary = String::from("IMU-A");
    let chosen;
    {
        let backup = String::from("IMU-B");
        chosen = pick_label(&primary, &backup, true);
    }
    println!("using {}", chosen);
}
```

```text
error[E0597]: `backup` does not live long enough
  --> src/main.rs:10:39
   |
 9 |         let backup = String::from("IMU-B");
   |             ------ binding `backup` declared here
10 |         chosen = pick_label(&primary, &backup, true);
   |                                       ^^^^^^^ borrowed value does not live long enough
11 |     }
   |     - `backup` dropped here while still borrowed
12 |     println!("using {}", chosen);
   |                          ------ borrow later used here
```

Walk through it with the three points from lesson 03.

1. The borrow starts on line 10, where `&backup` is passed in. Because of the signature, `chosen` now counts as a borrow of `backup` too.
2. The conflict is line 11: the closing brace drops `backup`.
3. The borrow is still used on line 12, where `chosen` is printed.

Now look at the call: `primary_ok` is `true`, so at runtime the function would have returned `primary`, which is alive. The compiler rejects it anyway. It did not look inside the function; it read the signature, which says the result may come from either input, and checked the worst case. Move `let backup` up next to `let primary` and the program compiles.
:::

::: warning An annotation cannot make anything live longer
People new to lifetimes sometimes add `'a` everywhere, hoping the error goes away. Writing `'a` does not stretch the life of any value by a single line; values still die at the end of their scope. The annotation only *describes* which inputs a returned reference depends on. If the description is true and the program is still rejected, the program really does use something after its due date.
:::

## The elision rules: when you can leave them out

If every reference needed an annotation, Rust code would be full of apostrophes. Instead, the compiler fills in the common cases. Leaving a lifetime out and letting the compiler supply it is called **[[elision|elision-word]]**. The compiler follows three fixed rules, in order. They look only at the signature.

1. **Each input gets its own.** Every reference in the parameters that has no written lifetime gets a fresh, separate lifetime. So `fn f(a: &str, b: &str)` is read as `fn f<'x, 'y>(a: &'x str, b: &'y str)`.
2. **One input, one answer.** If there is exactly one input lifetime, it is given to every reference in the output.
3. **Methods borrow from `self`.** If there are several input lifetimes, but one of them belongs to `&self` or `&mut self`, the output gets the lifetime of `self`.

If none of the rules decides the output, elision fails and the compiler asks you, with E0106. Try them on a few signatures:

- `fn first_field(record: &str) -> &str` — rule 1 gives the one input a lifetime; rule 2 hands it to the output. Done: the result borrows from `record`.
- `fn short_name(&self, prefix: &str) -> &str` — rule 1 gives `self` and `prefix` separate lifetimes; rule 2 does not apply (there are two); rule 3 does, so the result borrows from `self`.
- `fn pick_label(primary: &str, backup: &str, ok: bool) -> &str` — two input lifetimes, no `self`. No rule decides, so the compiler stops.

::: key When lifetime elision fails
When a function has several reference parameters and returns a reference, so the compiler cannot infer which input the output borrows from. Then you must annotate, which is also a design prompt: often the answer is to return an owned value.
:::

"Design prompt" means: when the compiler asks which input the result borrows from, ask whether it should borrow at all. Lesson 03 fixed `make_label` by returning a `String`. An owned result has no due date, so there is nothing to annotate. For small results, like a label, that is often cleanest. For a slice of a big buffer, borrowing is worth the annotation, because it avoids a copy.

::: example Annotating only the input that matters
A telemetry record arrives as text, `ALT=10250.5,VEL=312.4,MODE=ASCENT`. You want a function that looks up one key and returns its value without copying it. It takes two references, the record and the key, so elision fails. But the answer only ever comes out of the record. The key is only compared against. So tag only the record:

```rust
// Rule 2: one reference in, so the output borrows from it.
fn first_field(record: &str) -> &str {
    record.split(',').next().unwrap_or("")
}

// Two references in, but the output only ever comes from `record`.
fn find_value<'a>(record: &'a str, key: &str) -> Option<&'a str> {
    for field in record.split(',') {
        if let Some((k, v)) = field.split_once('=') {
            if k == key {
                return Some(v);
            }
        }
    }
    None
}

struct Channel {
    name: String,
}

impl Channel {
    // Rule 3: a &self method, so the output borrows from self.
    fn short_name(&self, _prefix: &str) -> &str {
        &self.name[..3]
    }
}

fn main() {
    let record = String::from("ALT=10250.5,VEL=312.4,MODE=ASCENT");
    println!("first field: {}", first_field(&record));

    let alt;
    {
        let key = String::from("ALT");
        alt = find_value(&record, &key);
    } // key is dropped here, and that is fine
    let alt_m: f64 = alt.unwrap().parse().unwrap();
    println!("altitude: {} m = {} km", alt_m, alt_m / 1000.0);

    let ch = Channel { name: String::from("GYRO_X") };
    println!("short: {}", ch.short_name("unused"));
}
```

```text
first field: ALT=10250.5
altitude: 10250.5 m = 10.2505 km
short: GYR
```

Step by step: `split(',')` cuts the record into three fields. `split_once('=')` cuts `ALT=10250.5` into `ALT` and `10250.5`. The key matches, so the function returns `Some("10250.5")` — a slice pointing into `record`, not a new string. Parsing it gives 10250.5 m, and dividing by 1000 gives 10.2505 km.

The important line is the closing brace that drops `key`. The program compiles, because the signature says `alt` depends only on `record`. Now change the signature to the lazy version, `key: &'a str`, tagging both inputs. The same `main` is rejected:

```text
error[E0597]: `key` does not live long enough
  --> src/main.rs:36:35
   |
36 |         alt = find_value(&record, &key);
   |                                   ^^^^ borrowed value does not live long enough
37 |     } // key is dropped here, and that is fine
   |     - `key` dropped here while still borrowed
```

(trimmed). Nothing in the function body changed. Only the description changed, and a less precise description forced the caller to keep `key` alive for no reason. A precise signature is kinder to every caller.
:::

::: note Why the compiler reads only the signature
The compiler could, in principle, look inside `find_value` and notice that the result always comes from `record`. Rust deliberately does not. The signature is a **[[contract|signature-contract]]** with every caller. If callers were checked against the body, a harmless-looking edit to the body could break code in another crate you have never seen. Checking against the signature means each function is verified once, and callers depend only on a promise that changes when you change it on purpose.
:::

## Lifetimes in structs

So far every reference lived in a local variable or a parameter. A struct can hold a reference too, and that is useful: it lets you build a **view** — a small struct that reads data owned by someone else, without copying it.

Here is a view over a telemetry packet. Space missions commonly wrap their data in the **[[CCSDS Space Packet|ccsds]]** format, whose first 6 bytes are a fixed header. Among other things, the header carries an 11-bit **APID** (application process identifier, which says what kind of data this is), a 14-bit sequence count (so the ground can spot missing packets), and a 16-bit length field that holds the number of data bytes *minus one*.

Try to write the struct the obvious way:

```rust
struct PacketView {
    bytes: &[u8],
}

fn main() {}
```

```text
error[E0106]: missing lifetime specifier
 --> src/main.rs:2:12
  |
2 |     bytes: &[u8],
  |            ^ expected named lifetime parameter
  |
help: consider introducing a named lifetime parameter
  |
1 ~ struct PacketView<'a> {
2 ~     bytes: &'a [u8],
  |
```

Elision never applies to struct fields. The compiler insists on a name, because the struct's type must carry the due date of what it borrows. Write `struct PacketView<'a>` and read it as "a packet view that borrows for lifetime `'a`". That one change has a big consequence: a `PacketView<'a>` value can never outlive the buffer it points into. The type itself now carries the due date.

::: example Parsing a packet header in place
A 10-byte packet arrives from a radio: `08 64 C0 2A 00 03 DE AD BE EF` (hexadecimal). Parse it without copying a single byte.

```rust
struct PacketView<'a> {
    bytes: &'a [u8],
}

impl<'a> PacketView<'a> {
    fn new(bytes: &'a [u8]) -> Option<PacketView<'a>> {
        if bytes.len() < 6 {
            return None;
        }
        let view = PacketView { bytes };
        if bytes.len() < 6 + view.data_len() {
            return None;
        }
        Some(view)
    }

    fn apid(&self) -> u16 {
        (((self.bytes[0] & 0x07) as u16) << 8) | self.bytes[1] as u16
    }

    fn seq_count(&self) -> u16 {
        (((self.bytes[2] & 0x3F) as u16) << 8) | self.bytes[3] as u16
    }

    fn data_len(&self) -> usize {
        u16::from_be_bytes([self.bytes[4], self.bytes[5]]) as usize + 1
    }

    fn data(&self) -> &'a [u8] {
        &self.bytes[6..6 + self.data_len()]
    }
}

fn main() {
    let buffer: Vec<u8> = vec![0x08, 0x64, 0xC0, 0x2A, 0x00, 0x03, 0xDE, 0xAD, 0xBE, 0xEF];
    let pkt = PacketView::new(&buffer).expect("short packet");
    println!("APID {}, sequence {}, {} data bytes", pkt.apid(), pkt.seq_count(), pkt.data_len());
    println!("data: {:02X?}", pkt.data());
}
```

```text
APID 100, sequence 42, 4 data bytes
data: [DE, AD, BE, EF]
```

Check each number by hand.

1. APID: the low 3 bits of byte 0 are the top of the APID. `0x08 & 0x07` is `0`. Byte 1 is `0x64`, which is $6 \times 16 + 4 = 100$. So the APID is 100.
2. Sequence count: the low 6 bits of byte 2 (`0xC0 & 0x3F = 0`) and all of byte 3, `0x2A` $= 2 \times 16 + 10 = 42$.
3. Length: bytes 4 and 5 read as one big-endian number are `0x0003` $= 3$. The field stores "length minus one", so there are $3 + 1 = 4$ data bytes.
4. Data: bytes 6 through 9, `DE AD BE EF`. Four bytes, matching step 3, and $6 + 4 = 10$, the whole buffer.

Two details are worth reading aloud. `impl<'a> PacketView<'a>` says "for any lifetime `'a`, here are the methods of a view borrowing for `'a`". And `data` returns `&'a [u8]`, not a reference tied to `&self`: the slice points into the *buffer*, so it may outlive the small `PacketView` struct itself. Without the explicit `'a`, rule 3 would have tied it to `self`.
:::

Now try to let the view outlive its buffer:

```rust
struct PacketView<'a> {
    bytes: &'a [u8],
}

fn main() {
    let view;
    {
        let buffer: Vec<u8> = vec![0x08, 0x64, 0xC0, 0x2A, 0x00, 0x00, 0x7F];
        view = PacketView { bytes: &buffer };
    }
    println!("{}", view.bytes.len());
}
```

```text
error[E0597]: `buffer` does not live long enough
  --> src/main.rs:9:36
   |
 9 |         view = PacketView { bytes: &buffer };
   |                                    ^^^^^^^ borrowed value does not live long enough
10 |     }
   |     - `buffer` dropped here while still borrowed
11 |     println!("{}", view.bytes.len());
   |                    ---------- borrow later used here
```

(trimmed). The same E0597, now protecting a struct. On a flight computer, a radio's receive buffer is typically reused for the next packet, and a view that survived into the next cycle would read the wrong packet's bytes. Here that mistake does not compile. Reading data in place like this, **[[zero-copy parsing|zero-copy]]**, is popular in flight software because it avoids allocation and copying — and in Rust the view cannot outlast the buffer. C++ has the same kind of view types, `std::string_view` and `std::span`, but with [[no due date in the type|cpp-lifetimebound]], so a view that outlives its buffer compiles without a word.

::: warning A struct with a lifetime is a borrow, not a container
`PacketView<'a>` does not own its bytes. While a view exists, the buffer cannot be modified or moved, exactly as for a `&[u8]`. If you want to keep a view for a long time, or send it elsewhere in the program, that is the design prompt again: you probably want a struct that owns a `Vec<u8>` or a fixed array.
:::

## The lifetime called static

One lifetime has a reserved name: `'static`, read "tick static". It means "valid for the entire run of the program". You meet it in two places, and they mean slightly different things.

### A reference that never expires

A string literal such as `"ASCENT"` is not stored on the stack or the heap. It is written into the program file itself, in a **[[read-only data section|rodata]]**, and it sits there from the moment the program starts until it exits. So a reference to it never expires, and its type is `&'static str`.

```rust
use std::thread;

fn mode_name(code: u8) -> &'static str {
    match code {
        0 => "SAFE",
        1 => "ASCENT",
        2 => "COAST",
        _ => "UNKNOWN",
    }
}

fn main() {
    let vehicle: &'static str = "ORBIT-1";
    let name = mode_name(1);
    println!("{} is in {}", vehicle, name);

    let log = vec![String::from("boot"), String::from("arm")];
    let handle = thread::spawn(move || {
        println!("logger thread owns {} entries", log.len());
    });
    handle.join().unwrap();
}
```

```text
ORBIT-1 is in ASCENT
logger thread owns 2 entries
```

`mode_name` takes no references, yet returns one. That is fine: the result points at text baked into the program, and the signature says so with `'static`.

A `&'static` parameter is a strong demand. This fails:

```rust
fn set_banner(text: &'static str) {
    println!("banner: {}", text);
}

fn main() {
    let callsign = String::from("DRAGON-7");
    set_banner(&callsign);
}
```

```text
error[E0597]: `callsign` does not live long enough
 --> src/main.rs:7:16
  |
7 |     set_banner(&callsign);
  |     -----------^^^^^^^^^-
  |     |          |
  |     |          borrowed value does not live long enough
  |     argument requires that `callsign` is borrowed for `'static`
8 | }
  | - `callsign` dropped here while still borrowed
```

(trimmed). `callsign` lives on the heap and is dropped at the end of `main`, so a borrow of it cannot last "forever". Either pass a literal, or change the parameter to plain `&str`, which is what it should have been.

### A type that owns everything it holds

The second use is a **bound** — a requirement written on a type. `T: 'static` (read "T is static") does not mean "the value lives forever". It means "the type `T` contains no borrows that could expire", so a value of it may be kept for as long as its holder likes. It is one case of a more general [[outlives relation|outlives-bound]] between lifetimes. A `String` satisfies `T: 'static`, because it owns its text. A `&str` pointing into a local `String` does not.

That is why the `thread::spawn` call above needed `move`. A spawned thread might run longer than the function that started it, so `spawn` demands a closure that is `'static`: it must own everything it uses. Leave out `move` and the closure borrows `log`:

```text
error[E0373]: closure may outlive the current function, but it borrows `log`, which is owned by the current function
 --> src/main.rs:5:32
  |
5 |     let handle = thread::spawn(|| {
  |                                ^^ may outlive borrowed value `log`
6 |         println!("logger thread sees {} entries", log.len());
  |                                                   --- `log` is borrowed here
  |
note: function requires argument type to outlive `'static`
```

(trimmed). With `move`, the closure owns the `Vec`, contains no borrows, and passes the `'static` test. The vector is still dropped, at the end of the thread. `'static` was a statement about borrows, not about how long the vector lives.

::: warning Do not reach for 'static to silence an error
Changing a parameter to `&'static` feels like the strongest possible fix for "does not live long enough". It is usually the wrong one: every caller can now pass only literals or leaked memory. Ask instead: should this be an owned value? Should the owner move to an outer scope? The honest uses of `'static` are string literals, constants, and data that really does live for the whole program, like a lookup table built once at startup. Lesson 05 shows `OnceLock`, the standard way to build that last kind.
:::

## Check yourself

::: check
Apply the elision rules to each signature and say what the returned reference borrows from, or that elision fails: (a) `fn trim_units(reading: &str) -> &str` (b) `fn label(&self, suffix: &str) -> &str` (c) `fn longer_name(a: &str, b: &str) -> &str` (d) `fn default_mode() -> &str`.
:::

::: answer
(a) One input lifetime, so rule 2 gives it to the output: the result borrows from `reading`. (b) Two input lifetimes, but one is `&self`, so rule 3 applies: the result borrows from `self`, not from `suffix`. (c) Two input lifetimes and no `self`: no rule decides, so E0106. You must annotate, for example `fn longer_name<'a>(a: &'a str, b: &'a str) -> &'a str`, or return a `String`. (d) Zero input lifetimes, so rule 2 cannot apply either, and the compiler reports E0106 ("there is no value for it to be borrowed from"). If the function returns a literal, the right signature is `-> &'static str`.
:::

::: check
A teammate adds `'a` to every reference in a function that fails with E0597, and it still fails. They conclude "lifetimes are broken". What would you tell them?
:::

::: answer
An annotation does not change how long anything lives; it only describes which inputs the output depends on. If the program is still rejected, it really does use a reference after its value is dropped. Tagging *every* input with the same `'a` can even make things worse, as the `find_value` example showed. The fix is to move the owner to an outer scope, shorten the use of the borrow, tag only the input the result truly comes from, or return an owned value.
:::

::: check
Why does `struct Frame { payload: &[u8] }` need a lifetime, when `fn len(payload: &[u8]) -> usize` does not?
:::

::: answer
The function returns a `usize`, which holds no borrow, so there is nothing to relate. The struct stores a reference inside a value that can be passed around and kept, so its type must record how long that reference is valid; then the compiler can refuse to let a `Frame` outlive the buffer. Elision never applies to struct fields, so you write `struct Frame<'a> { payload: &'a [u8] }`.
:::

::: check
In `PacketView`, what would change if `data` were written `fn data(&self) -> &[u8]` instead of `-> &'a [u8]`? Give a use that would break.
:::

::: answer
Rule 3 would tie the result to `self`, the view, instead of to the buffer, so the slice could not outlive the `PacketView`. A helper `fn payload_of(buf: &[u8]) -> &[u8] { PacketView::new(buf).unwrap().data() }` compiles with `-> &'a [u8]`, because the slice points into `buf`. With the elided version it fails with E0515, "cannot return value referencing temporary value": the view dies at the end of the helper, and the result is tied to it. Same bytes; different promise.
:::

::: check
True or false, with a reason: "`T: 'static` means values of type `T` are never dropped."
:::

::: answer
False. `T: 'static` means the type contains no borrows that could expire. A `String` or a `Vec<String>` meets the bound, and it is still dropped when its owner goes out of scope, as the logger thread's vector was at the end of the thread. Only a `&'static` reference points at something that really lasts the whole program, like a string literal.
:::

## Summary

| Idea | Notation | Meaning |
|---|---|---|
| Lifetime | `'a` ("tick a") | A region of code where a borrow must stay valid |
| Annotation | `fn f<'a>(x: &'a T) -> &'a U` | The output borrows from `x`; describes, never extends |
| Elision rule 1 | each `&` input | Gets its own separate lifetime |
| Elision rule 2 | one input lifetime | Given to every output reference |
| Elision rule 3 | `&self` / `&mut self` | Output borrows from `self` |
| Elision fails | several inputs, no `self` | E0106: annotate, or return an owned value |
| Struct with a borrow | `struct V<'a> { b: &'a [u8] }` | The value cannot outlive what it points into |
| Static reference | `&'static str` | Valid for the whole program, like a literal |
| Static bound | `T: 'static` | Holds no expiring borrows; needed by `thread::spawn` |

Every tool so far has been checked at compile time. The next lesson covers the cases where the borrow pattern is correct but the compiler cannot prove it — shared observers, reference-counted data, values shared between threads — and the types (`Cell`, `RefCell`, `Rc`, `Arc`, `Mutex`) that move part of the check to runtime.

::: context lifetime-region Due dates drawn as bars
It helps to draw each lifetime as a bar alongside the code. Here is the E0597 from the last lesson: the owner's bar ends at the closing brace, but the borrow's bar must reach the `println!`. The borrow checker's whole job is to see that the lower bar sticks out past the upper one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="10" y="22">let latest: &amp;f64;</text>
    <text x="10" y="44">{ let reading = 101.3;</text>
    <text x="10" y="66">  latest = &amp;reading;</text>
    <text x="10" y="88">}</text>
    <text x="10" y="110">println!(latest);</text>
  </g>
  <rect x="200" y="34" width="14" height="58" fill="#8fb8f0" stroke="#1d6fd1"/>
  <text x="220" y="52" font-size="11" fill="#1d6fd1">reading</text>
  <text x="220" y="66" font-size="11" fill="#1d6fd1">(owner)</text>
  <rect x="290" y="56" width="14" height="60" fill="#f2b880" stroke="#b4232c"/>
  <text x="310" y="74" font-size="11" fill="#b4232c">borrow</text>
  <line x1="190" y1="92" x2="350" y2="92" stroke="#b4232c" stroke-dasharray="4 3"/>
  <text x="200" y="138" font-size="11" fill="#b4232c">borrow bar sticks out: rejected</text>
</svg>
```
:::

::: context tick-name Why an apostrophe
The apostrophe before a lifetime name echoes the ML family of languages, such as OCaml, where `'a` is how you write a type variable. The first Rust compiler was itself written in OCaml, before Rust could compile itself. By convention lifetimes get short names, `'a`, `'b`, but a longer one is allowed and sometimes clearer, like `'buf` for "the lifetime of the receive buffer". Lifetime parameters sit in the same angle brackets as type parameters (`<'a, T>`, lifetimes first), because they are the same idea: the function works for any choice, and the compiler fills in the concrete choice at each call. Generic type parameters come back in full in lesson 08.
:::

::: context elision-word Leaving out what everyone knows
To *elide* means to leave something out, the way "do not" becomes "don't". The rules were added to Rust in 2014, before version 1.0, through a public design proposal (RFC 141, "lifetime elision"). Before them, many ordinary signatures needed explicit annotations. The rules were chosen to match the patterns ordinary code uses most, so the common case costs nothing to write and only the ambiguous case needs a name.
:::

::: context signature-contract A signature is a promise
Think of a function signature as a label on a sealed box. The caller reads the label; the box's contents are the function's own business. Rust checks two things separately: that the body keeps the promise on the label, and that every caller relies only on what the label says. The same idea runs through safety-critical engineering generally, where an interface control document fixes what each side of a boundary may assume, so that one team can change its side without breaking the other. When you change a signature's lifetimes, you change the label, and callers are rechecked against it.
:::

::: context ccsds The packet format of spacecraft
CCSDS, the Consultative Committee for Space Data Systems, is an international body founded by space agencies to agree on common data standards, so a spacecraft built by one agency can be tracked by another's ground stations. Its Space Packet Protocol begins every packet with the 6-byte primary header parsed in this lesson:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="10" y="30" width="18" height="34" fill="#fff" stroke="#1f2a44"/><text x="19" y="80">3</text>
    <rect x="28" y="30" width="6" height="34" fill="#6c7a93" stroke="#1f2a44"/><text x="31" y="94">1</text>
    <rect x="34" y="30" width="6" height="34" fill="#6c7a93" stroke="#1f2a44"/><text x="37" y="80">1</text>
    <rect x="40" y="30" width="66" height="34" fill="#8fb8f0" stroke="#1d6fd1"/><text x="73" y="51">APID</text><text x="73" y="80">11</text>
    <rect x="106" y="30" width="12" height="34" fill="#fff" stroke="#1f2a44"/><text x="112" y="80">2</text>
    <rect x="118" y="30" width="84" height="34" fill="#f2b880" stroke="#1f2a44"/><text x="160" y="51">seq count</text><text x="160" y="80">14</text>
    <rect x="202" y="30" width="96" height="34" fill="#fff" stroke="#1f2a44"/><text x="250" y="51">length - 1</text><text x="250" y="80">16</text>
    <text x="330" y="51">data</text>
  </g>
  <text x="10" y="18" font-size="11" fill="#6c7a93">bits: version, type, sec. header flag, APID, flags, count, length</text>
  <text x="10" y="112" font-size="11" fill="#6c7a93">3+1+1+11+2+14+16 = 48 bits = 6 bytes</text>
</svg>
```

Storing "length minus one" lets the 16-bit field describe data fields from 1 to 65,536 bytes long.
:::

::: context zero-copy Reading data where it lands
Zero-copy parsing means interpreting bytes in the buffer they arrived in, instead of copying them into new structures first. It saves time and, more importantly for flight software, it avoids allocating memory while the vehicle is flying: many flight coding standards allow heap allocation only during startup. The classic C way to do it is to cast a pointer to the buffer into a pointer to a header struct, which works until someone keeps that pointer after the buffer is refilled. The Rust version has the same speed, and the lifetime on the view makes keeping it too long a compile error.
:::

::: context cpp-lifetimebound The same bug in C++
C++17 added `std::string_view`, and C++20 added `std::span`: both are views, a pointer plus a length, like a Rust `&str` or `&[u8]`. They are fast and useful, and they dangle silently if the string or vector they view goes away. C++ has no lifetime notation in its type system. Clang offers a partial patch, the `clang::lifetimebound` attribute, which you can put on a parameter to say "the return value refers to this argument", and the compiler then warns about some obvious dangling uses. It is the same idea as a Rust lifetime annotation, bolted on and checked far less thoroughly.
:::

::: context rodata Where a string literal lives
When a program is built, the linker lays it out in sections. Machine code goes in `.text`. Constant data, including every string literal, goes in a read-only section, usually named `.rodata` on Linux and embedded targets. On a microcontroller that section often stays in flash memory and is never copied to RAM at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <rect x="20" y="14" width="150" height="24" fill="#fff" stroke="#1f2a44"/><text x="30" y="30">.text (code)</text>
    <rect x="20" y="38" width="150" height="24" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/><text x="30" y="54">.rodata "ASCENT"</text>
    <rect x="20" y="62" width="150" height="24" fill="#fff" stroke="#1f2a44"/><text x="30" y="78">.data / .bss</text>
    <rect x="20" y="86" width="150" height="24" fill="#f2b880" stroke="#1f2a44"/><text x="30" y="102">heap</text>
    <rect x="20" y="110" width="150" height="24" fill="#fff" stroke="#1f2a44"/><text x="30" y="126">stack</text>
  </g>
  <text x="185" y="54" font-size="11" fill="#1d6fd1">&amp;'static str: here from start to exit</text>
  <text x="185" y="102" font-size="11" fill="#b4232c">String: freed when dropped</text>
  <text x="185" y="126" font-size="11" fill="#6c7a93">locals: freed at return</text>
</svg>
```

Because the literal is there for the whole run, a reference to it can safely be `'static`.
:::

::: context outlives-bound One lifetime inside another
Sometimes you need to say that one lifetime contains another. The notation is `'a: 'b`, read "tick a outlives tick b": the region `'a` lasts at least as long as the region `'b`. `T: 'static` is the same notation with a type on the left. You will rarely write `'a: 'b` yourself, but you will read it in library signatures and in error notes such as "function requires argument type to outlive `'static`", which is exactly this relation spelled out.
:::
