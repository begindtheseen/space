---
id: l06-option-result-and-the-question-mark
title: Option, Result and the question mark
minutes: 21
covers:
  - Option and Result, the absence of null, and the ? operator
---

Open your mailbox. Sometimes there is a letter in it, and sometimes it is empty. Both are perfectly normal. What would be strange is a mailbox that, when empty, handed you a blank envelope and let you find out later, halfway through reading, that there was nothing inside.

Now ask a friend to pick up a part from the hardware store. They come back one of two ways: "here it is", or "I couldn't, because the store was closed". The second answer is not a disaster. It is information, and the reason matters: "closed" and "they don't sell it" lead you to do different things next.

Those two situations, "maybe there is a value" and "either a value or a reason it failed", are what this lesson is about. Rust has one type for each. **`Option<T>`** says a value of type `T` might be there or might not. **`Result<T, E>`** says you got either a value of type `T` or an error of type `E`. Both are plain enums, built from the sum types of lesson 04. And a single character, the **`?` operator**, passes a failure up to whoever called you without a pile of `if` statements.

Flight and ground software is full of both situations: a sensor that has not produced a reading yet, a lookup that finds no match, a command string from the ground that does not parse, a configuration file with a typo. How a language forces you to face them decides how many of them turn into crashes.

## The trouble with "nothing"

C and C++ have several ways to say "there is no value here", and each has a trap.

- **Null pointers.** A pointer can be `nullptr`. Nothing in its type says whether it might be. Forget to check, dereference it, and the program crashes, or in C++ does something undefined.
- **Sentinel values.** A function returns `-1` for "not found", or `NaN` for "no reading", or `9999` for "sensor offline". The caller has to know the rule. If they forget, `-1` goes into the arithmetic as if it were real data.
- **Out-parameters.** `bool get_altitude(double* out)` returns `false` on failure and leaves `*out` untouched. The caller can ignore the `bool` and read an uninitialized `out`.

The common problem: **the absence is not in the type**. A `double*` looks the same whether or not it can be null. A returned `int` looks the same whether it is a count or `-1`. The compiler cannot help, because it cannot see the difference. The inventor of the null reference later called it his **[[billion-dollar mistake|billion-dollar-mistake]]**.

Safe Rust has no null. A reference `&T` always points at a real `T`. When a value might be missing, you say so in the type, with `Option`.

## Option: a value, or nothing

`Option` is an enum in the standard library, and its whole definition is tiny:

```rust
enum Option<T> {
    None,
    Some(T),
}
```

The `<T>` makes it **generic**: `T` stands for any type. `Option<f64>`, read "option of f64", is either `Some(some_number)` or `None`. `Option<usize>` is either `Some(an_index)` or `None`. `Some` and `None` are so common that you can write them without `Option::` in front.

Here is a function that looks for the first chamber-pressure sample above a limit. It might find one, and it might not:

```rust
// Index of the first reading above the limit, if there is one.
fn first_above(readings: &[f64], limit: f64) -> Option<usize> {
    for i in 0..readings.len() {
        if readings[i] > limit {
            return Some(i);
        }
    }
    None
}
```

The return type, `Option<usize>`, tells every caller, before they read a single line of the body, that "not found" is possible. There is no `-1` to remember.

The bigger point is that an `Option<usize>` is **not** a `usize`. You cannot use it as a number until you have looked inside. Try to do arithmetic on one:

```rust
let readings = [96.0, 97.5];
let last: Option<&f64> = readings.last();
let doubled = last * 2.0;
```

```text
error[E0369]: cannot multiply `Option<&f64>` by `{float}`
 --> src/bin/option_bad.rs:4:24
  |
4 |     let doubled = last * 2.0;
  |                   ---- ^ --- {float}
  |                   |
  |                   Option<&f64>
```

`readings.last()` returns an `Option`, because an empty slice has no last element, and the compiler will not let you pretend otherwise. This is the whole trick. With a null pointer, the check is something you are supposed to remember. With `Option`, the value is locked inside until you handle the `None` case, so the check cannot be forgotten.

::: key
`Option<T>` replaces null, sentinel values and uninitialised out-parameters. Because the absence is in the type, the compiler forces you to handle it, which removes the null-dereference class of defect rather than merely documenting it.
:::

### Getting the value out

There are several ways to open the box, and choosing among them is choosing what "nothing" should mean.

- **`match`**, from lesson 04, handles both cases in full. The compiler checks you covered both `Some` and `None`.
- **`if let Some(x) = opt { ... }`** runs a block only when there is a value.
- **`opt.unwrap_or(default)`** gives the value, or `default` if there is none. Use it when a sensible default really exists.
- **`opt.map(...)`** changes the value inside, if there is one, and leaves `None` as `None`.
- **`opt.unwrap()`** gives the value, or **panics** if there is none. **`opt.expect("reason")`** does the same with your message.

`map` takes a **closure**, a small function written in place. `|i| chamber_bar[i] - limit` reads "given `i`, give back `chamber_bar[i] - limit`". The name between the bars is the input; the expression after is the output. Lesson 07 covers closures properly; that reading is all you need here.

::: example Handling "maybe" four ways
```rust
fn main() {
    let chamber_bar = [96.0, 97.5, 98.2, 103.9, 97.0];

    match first_above(&chamber_bar, 100.0) {
        Some(i) => println!("over-pressure at sample {i}: {} bar", chamber_bar[i]),
        None => println!("no over-pressure"),
    }

    let late = first_above(&chamber_bar, 110.0);
    println!("{:?}", late);

    // A limit that may or may not have been set by the operator.
    let operator_limit: Option<f64> = None;
    let limit = operator_limit.unwrap_or(100.0);
    println!("using limit {limit} bar");

    // map: work on the value inside, if there is one.
    let over_by = first_above(&chamber_bar, limit).map(|i| chamber_bar[i] - limit);
    if let Some(d) = over_by {
        println!("over the limit by {d:.1} bar");
    }
}
```

```text
over-pressure at sample 3: 103.9 bar
None
using limit 100 bar
over the limit by 3.9 bar
```

Step by step.

1. Limit $100$ bar. Samples 0, 1 and 2 ($96.0$, $97.5$, $98.2$) are not above it. Sample 3, $103.9$, is. So the result is `Some(3)` and the `Some(i)` arm prints it.
2. Limit $110$ bar. No sample is above it, so the loop finishes and the function returns `None`. Printed with `{:?}`, that is `None`, honest and impossible to mistake for an index.
3. The operator set no limit, `None`, so `unwrap_or(100.0)` falls back to $100$.
4. `first_above` gives `Some(3)` again. `map` turns it into `Some(103.9 - 100.0)`, which is about $3.9$, printed to one decimal.

Sanity check: $103.9 - 100 = 3.9$ bar over, a few percent, and the only sample that was over.
:::

::: warning unwrap is a promise, not a check
`unwrap()` says "I am certain this is `Some`". If you are wrong, the program panics. In a quick experiment that is fine. In flight code, every `unwrap` is a possible crash, and reviewers treat each one as a question: why can this never be `None`? If the answer is solid, write `expect` with the reason, so a failure says what assumption broke:

```text
thread 'main' (3025) panicked at src/bin/expect.rs:3:23:
sensor buffer should never be empty after init
```

If the answer is "it can be `None`", handle it: `match`, `unwrap_or`, or pass it up with `?`.
:::

## Free safety: Option is often the size of a pointer

You might guess that all this safety costs memory. An `Option<&u32>` must store the reference **and** whether it is there. Here is what `std::mem::size_of` actually reports with Rust 1.94 on a 64-bit machine:

```text
&u32                8 bytes
Option<&u32>        8 bytes
Box<f64>            8 bytes
Option<Box<f64>>    8 bytes
NonZeroU32          4 bytes
Option<NonZeroU32>  4 bytes
u32                 4 bytes
Option<u32>         8 bytes
Option<f64>        16 bytes
```

`Option<&u32>` is the same $8$ bytes as `&u32`. How? A reference can never be zero, since safe Rust has no null. So the all-zero bit pattern is spare, and the compiler uses it to mean `None`. A spare bit pattern like that is called a **niche**, and using it is the **[[niche optimization|niche-optimization]]**. `Box` (a pointer to heap memory, from the next module) and `NonZeroU32` (a `u32` promised never to be zero) have niches too.

A plain `u32` has no spare pattern: all $2^{32}$ values are legal numbers. So `Option<u32>` needs a separate tag, and alignment rounds $4 + 1$ up to $8$ bytes. `Option<f64>` likewise grows from $8$ to $16$.

So the win of `Option` over a null pointer is **not** speed and **not** memory. An `Option<&T>` compiles to exactly the pointer-or-zero that C would use. The win is that the compiler forces the empty case to be handled before the value can be used.

## Result: a value, or a reason

`Option` says *whether* there is a value. When something can fail, you usually want to know *why*. That is `Result`:

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`Result<f64, ParseFloatError>`, read "result of f64 or ParseFloatError", is either `Ok(a_number)` or `Err(an_error_saying_what_went_wrong)`. It replaces the C habit of error codes and the C++ habit of [[exceptions|result-vs-exceptions]]. Rust has no exceptions: a function that can fail says so in its return type, and the caller cannot reach the value without facing the `Err`.

Turning text into a number is a classic example. `str::parse` returns a `Result`:

```rust
let good: Result<f64, std::num::ParseFloatError> = "12.5".parse();
let bad: Result<f64, std::num::ParseFloatError> = "12,5".parse();
```

```text
Ok(12.5)
Err(ParseFloatError { kind: Invalid })
```

A comma instead of a decimal point: a real mistake, reported as data rather than as a crash or a silent zero.

### Your own error type

A library usually defines its own error enum, with one variant per way things can go wrong. The variants can carry details, such as the text that was not understood:

```rust
#[derive(Debug, PartialEq)]
enum PressureError {
    BadNumber(String),
    UnknownUnit(String),
}
```

Here is a function that reads strings like `"14.7 psi"` and returns [[kilopascals|psi-and-kpa]], or says exactly what was wrong:

```rust
const PSI_TO_KPA: f64 = 6.894_757_293_168;

// "14.7 psi" -> Ok(101.35...) in kilopascals
fn parse_kpa(s: &str) -> Result<f64, PressureError> {
    let mut parts = s.split_whitespace();
    let number = parts.next().unwrap_or("");
    let unit = parts.next().unwrap_or("");

    let value: f64 = number
        .parse()
        .map_err(|_| PressureError::BadNumber(number.to_string()))?;

    match unit {
        "kPa" => Ok(value),
        "bar" => Ok(value * 100.0),
        "psi" => Ok(value * PSI_TO_KPA),
        other => Err(PressureError::UnknownUnit(other.to_string())),
    }
}
```

Go through it a line at a time.

- `s.split_whitespace()` breaks the string at spaces. Each call to `parts.next()` gives the next piece as an `Option<&str>`: `Some("14.7")`, then `Some("psi")`, then `None` when the pieces run out.
- `.unwrap_or("")` turns a missing piece into an empty string. An empty string will fail to parse or fail to match a unit, so it gets reported as an error below, not ignored.
- `number.parse()` returns a `Result<f64, ParseFloatError>`. The type annotation `let value: f64` tells `parse` which kind of number to make.
- **`map_err`** changes the error inside a `Result` and leaves an `Ok` alone. The closure `|_| PressureError::BadNumber(number.to_string())` ignores the library's error (the `_`) and builds ours, recording the text that failed.
- The `?` at the end passes that error straight out of the function, if there is one. The next section is about it.
- The `match` on `unit` compares string slices. `other` catches every unit not listed, names it, and returns it inside `UnknownUnit`. Here a catch-all arm is right: there are endless possible strings, and each unknown one becomes an error.

::: example Four inputs through parse_kpa
```rust
fn main() {
    for input in ["14.7 psi", "2.5 bar", "fourteen psi", "3 atm"] {
        match parse_kpa(input) {
            Ok(kpa) => println!("{input:>13} -> {kpa:.2} kPa"),
            Err(e) => println!("{input:>13} -> error: {e:?}"),
        }
    }
}
```

```text
     14.7 psi -> 101.35 kPa
      2.5 bar -> 250.00 kPa
 fourteen psi -> error: BadNumber("fourteen")
        3 atm -> error: UnknownUnit("atm")
```

- `"14.7 psi"`: the number parses, the unit is `psi`, and $14.7 \times 6.894\,757 \approx 101.35$ kPa. Sanity check: $14.7$ psi is the familiar sea-level air pressure, and sea-level pressure is about $101.3$ kPa. It matches.
- `"2.5 bar"`: $2.5 \times 100 = 250$ kPa, since one bar is exactly $100$ kPa.
- `"fourteen psi"`: `parse` fails on `"fourteen"`, `map_err` turns that into `BadNumber("fourteen")`, and `?` returns it. The unit is never examined.
- `"3 atm"`: the number is fine, but `atm` is not in the `match`, so the `other` arm returns `UnknownUnit("atm")`.

Every failure names what went wrong and carries the text that caused it, which is what someone reading a ground-station log at 3 a.m. needs.
:::

## The ? operator

Passing errors upward is so common that doing it by hand clutters everything. Here is a function that reads a limit from a configuration line like `max_q_kpa=35.0`, written the long way:

```rust
fn read_limit(line: &str) -> Result<f64, ConfigError> {
    let text = match value_of(line) {
        Some(t) => t,
        None => return Err(ConfigError::MissingEquals),
    };
    let limit: f64 = match text.parse::<f64>() {
        Ok(v) => v,
        Err(e) => return Err(ConfigError::from(e)),
    };
    Ok(limit)
}
```

And the same function with `?`:

```rust
fn read_limit(line: &str) -> Result<f64, ConfigError> {
    let text = value_of(line).ok_or(ConfigError::MissingEquals)?;
    let limit: f64 = text.parse()?; // ParseFloatError -> ConfigError via From
    Ok(limit)
}
```

The **`?` operator**, read "question mark" or "try", goes after an expression that gives a `Result` (or an `Option`). It means:

- If it is `Ok(v)`, the whole expression becomes `v`, and the function carries on.
- If it is `Err(e)`, the function **[[returns right now|question-mark-desugar]]** with `Err(From::from(e))`: the error, converted to the function's own error type.

For an `Option`, `Some(v)` becomes `v`, and `None` makes the function return `None` at once.

Each `match` block of eight or so lines became one character. The early return has not been hidden, though: every `?` is visible at the exact spot where the function might leave. That is the difference from exceptions, where any call might throw and nothing on the line says so.

::: key
On a Result, ? returns the Ok value or returns early with the error converted via From; on an Option it returns the value or returns None. It makes error propagation one character instead of a block, without hiding it.
:::

### Where the conversion comes from

In `text.parse()?`, the error from `parse` is a `ParseFloatError`, but `read_limit` returns `ConfigError`. The `?` bridges them with the standard [[From trait|from-trait]], written `From`: if there is a way to build a `ConfigError` from a `ParseFloatError`, `?` uses it. You provide one like this:

```rust
use std::num::ParseFloatError;

enum ConfigError {
    MissingEquals,
    BadValue(ParseFloatError),
}

// Teach ? how to turn a ParseFloatError into a ConfigError.
impl From<ParseFloatError> for ConfigError {
    fn from(e: ParseFloatError) -> ConfigError {
        ConfigError::BadValue(e)
    }
}
```

`impl From<ParseFloatError> for ConfigError` reads "here is how to make a `ConfigError` from a `ParseFloatError`". A trait is a named set of methods a type can provide; the next module covers traits properly. The other route is the one `parse_kpa` took: convert by hand with `map_err` right before the `?`. Use `From` when the same conversion happens in many places, and `map_err` when you want to add details, like the text that failed.

### Mixing Option and Result

`value_of` returns an `Option`, since a line might have no `=` sign:

```rust
// The value after '=' in a line like "max_q_kpa=35.0"
fn value_of(line: &str) -> Option<&str> {
    let (_key, value) = line.split_once('=')?; // None if there is no '='
    Some(value.trim())
}
```

Inside `value_of`, which returns an `Option`, a `?` on an `Option` is fine. But `read_limit` returns a `Result`, and there `?` on an `Option` is not allowed, because `None` carries no error to return:

```text
error[E0277]: the `?` operator can only be used on `Result`s, not `Option`s, in a function that returns `Result`
 --> src/bin/question_bad.rs:2:45
  |
1 | fn read_limit(line: &str) -> Result<f64, String> {
  | ------------------------------------------------ this function returns a `Result`
2 |     let (_key, value) = line.split_once('=')?;
  |                                             ^ use `.ok_or(...)?` to provide an error compatible with `Result<f64, String>`
```

The compiler even suggests the fix. **`ok_or(err)`** turns `Some(v)` into `Ok(v)` and `None` into `Err(err)`, which is exactly what `read_limit` does with `ConfigError::MissingEquals`. Running it on three lines:

```text
   max_q_kpa=35.0 -> limit 35 kPa
   max_q_kpa 35.0 -> error: no '='
 max_q_kpa=thirty -> error: invalid float literal
```

The second line has [[a typo|config-typos]], a space where the `=` should be, so `split_once` gives `None`, `ok_or` makes it `MissingEquals`, and `?` returns it. The third has an `=`, but `"thirty"` does not parse; `?` converts the `ParseFloatError` with our `From` impl. The message "invalid float literal" is how that error prints itself.

::: warning ? only works in a function that returns Result or Option
`?` needs somewhere to return the error *to*. In a function returning `f64`, or in a plain `fn main()`, it will not compile. Either change the return type to a `Result`, or handle the error on the spot with `match`. (`main` may itself return a `Result`, and many small tools do that.)
:::

## Testing the error paths

Errors are values, so you can test them like values. Here are three tests for `parse_kpa`. Lesson 08 explains the `#[cfg(test)]` line in full; for now, read it as "only compile this module when running `cargo test`":

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bar_converts() {
        assert_eq!(parse_kpa("2.5 bar"), Ok(250.0));
    }

    #[test]
    fn unknown_unit_is_named() {
        assert_eq!(
            parse_kpa("3 atm"),
            Err(PressureError::UnknownUnit("atm".to_string()))
        );
    }

    #[test]
    fn bad_number_is_caught() {
        assert!(matches!(parse_kpa("x psi"), Err(PressureError::BadNumber(_))));
    }
}
```

```text
test tests::bad_number_is_caught ... ok
test tests::bar_converts ... ok
test tests::unknown_unit_is_named ... ok
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

Three details make this work:

- `assert_eq!(a, b)` compares with `==` and prints both sides if they differ. Comparing two `Result`s needs `==` on the error type too, which is why `PressureError` derives `PartialEq` (and `Debug`, so a failure can be printed).
- **`matches!(value, pattern)`** is `true` if the value fits the pattern. `Err(PressureError::BadNumber(_))` checks the kind of error without caring what text it holds.
- `use super::*;`, from lesson 05, lets the test module call `parse_kpa` by its short name.

A good habit for flight code: for every error variant you define, write at least one test that produces it. An error path nobody has run is an error path nobody knows works.

## Check yourself

::: check
A C function is `int find_channel(const char *name)` and returns `-1` when the name is not found. Write the Rust signature you would give it, and say what a caller can no longer do by accident.
:::

::: answer
`fn find_channel(name: &str) -> Option<usize>`. The index is a `usize` (it cannot be negative), and "not found" is `None` instead of `-1`. A caller can no longer use the result as an index without first dealing with the `None` case: `channels[find_channel("IMU")]` does not compile, because an `Option<usize>` is not a `usize`. With the C version, forgetting the check silently indexes element $-1$.
:::

::: check
Why is `Option<&f64>` 8 bytes but `Option<f64>` 16 bytes on a 64-bit machine?
:::

::: answer
A reference can never be null, so the all-zeros pattern is unused and the compiler lets it mean `None`: no extra space. That is the niche optimization. An `f64` has no unused bit pattern (every 64-bit pattern is some float or NaN), so `Option<f64>` needs a separate tag. The tag plus 8 bytes of float, rounded up to a multiple of 8 for alignment, gives 16 bytes.
:::

::: check
What does `parse_kpa("")` return, and which line decides it?
:::

::: answer
`split_whitespace` on an empty string gives no pieces, so both `next()` calls return `None`, and `unwrap_or("")` makes `number` and `unit` empty strings. Then `"".parse::<f64>()` fails, `map_err` turns that into `BadNumber("")`, and the `?` after it returns `Err(PressureError::BadNumber(""))`. The unit match never runs.
:::

::: check
Rewrite this with `?`, assuming a suitable `From` impl exists:

```rust
let n: u32 = match s.parse::<u32>() {
    Ok(v) => v,
    Err(e) => return Err(MyError::from(e)),
};
```
:::

::: answer
`let n: u32 = s.parse()?;` The `?` does exactly what the `match` did: on `Ok(v)` the expression is `v`; on `Err(e)` the function returns `Err(From::from(e))`, which with the `From<ParseIntError> for MyError` impl is `Err(MyError::from(e))`. The enclosing function must return `Result<_, MyError>`.
:::

::: check
A teammate writes `let reading = latest_sample().unwrap();` in the attitude control loop. What question should a reviewer ask, and what are the better options?
:::

::: answer
"Why can `latest_sample()` never return `None` here?" If there is a real guarantee (for example, the buffer is filled during initialization and never emptied), use `expect("...")` stating that guarantee, so a failure explains itself. If it can be `None`, such as at startup or after a sensor dropout, handle it: hold the last good command, fall back to another sensor with `unwrap_or`/`match`, or return the problem to the caller with `?`. A panic in a control loop is a loss of control, not an error report.
:::

## Summary

| Idea | Rust | In one line |
| --- | --- | --- |
| No null | `&T` is never null | absence must be in the type |
| Option | `Some(v)` or `None` | replaces null, sentinels and out-parameters |
| Opening an Option | `match`, `if let`, `unwrap_or`, `map` | handle the `None`, every time |
| unwrap / expect | panic on `None` or `Err` | a promise; use `expect` with the reason |
| Niche optimization | `Option<&T>` is pointer-sized | the safety costs no memory |
| Result | `Ok(v)` or `Err(e)` | a value or the reason it failed; no exceptions |
| map_err | `r.map_err(f)` | change the error with a closure, keep the `Ok` |
| ok_or | `opt.ok_or(err)` | turn an `Option` into a `Result` |
| ? on Result | `x?` | the `Ok` value, or return `Err(From::from(e))` |
| ? on Option | `x?` | the value, or return `None` |
| From | `impl From<A> for MyError` | how `?` converts error types |
| Testing errors | `assert_eq!`, `matches!` | every error variant gets a test |

Lesson 07 turns to iterators and closures. You have already met both in small doses here (`split_whitespace` hands out pieces one at a time, and `map_err` takes a closure), and lesson 07 shows how whole chains of them compile down to plain loops.

::: context billion-dollar-mistake Where null came from
Tony Hoare, a British computer scientist, added the null reference to the language ALGOL W in 1965. In a 2009 talk he called it his "billion-dollar mistake", because of the errors, crashes and security holes it has caused since. Languages designed later, including Rust, Swift and Kotlin, took the lesson: they make "might be absent" a separate type from "is definitely here". Rust's `Option` comes from the same ML-family tradition as its enums.
:::

::: context niche-optimization Using a pattern nobody else needs
A reference is an address, and address zero is never a valid place for a Rust value. So among all the bit patterns an 8-byte reference could hold, all-zeros is guaranteed unused. The compiler borrows it: all-zeros means `None`, anything else is `Some(that_address)`. The result is bit-for-bit the same as a C pointer that may be null. The difference is only in what the compiler lets you do with it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="10" y="22" font-size="12" fill="#1f2a44" font-weight="700">Option&lt;&amp;u32&gt; (8 bytes)</text>
  <rect x="10" y="32" width="240" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="130" y="50" font-size="11" fill="#1f2a44" text-anchor="middle">address, or all zeros = None</text>
  <text x="10" y="84" font-size="12" fill="#1f2a44" font-weight="700">Option&lt;u32&gt; (8 bytes)</text>
  <rect x="10" y="94" width="30" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <text x="25" y="112" font-size="11" fill="#1f2a44" text-anchor="middle">tag</text>
  <rect x="40" y="94" width="90" height="26" fill="#ffffff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="85" y="112" font-size="11" fill="#6c7a93" text-anchor="middle">padding</text>
  <rect x="130" y="94" width="120" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="190" y="112" font-size="11" fill="#1f2a44" text-anchor="middle">u32 value</text>
  <text x="262" y="50" font-size="11" fill="#1d6fd1">niche: no tag</text>
  <text x="262" y="112" font-size="11" fill="#b4232c">every value legal</text>
</svg>
```
:::

::: context result-vs-exceptions Why Rust has no exceptions
With exceptions, any function call might jump out of your code, and nothing on the line says so. Many safety-critical C++ projects turn exceptions off entirely (the flag is `-fno-exceptions`) because it is hard to prove what happens along every hidden path, and because throwing can allocate memory. Rust's `Result` keeps every exit visible: a function that can fail says so in its type, and each `?` marks a spot where it might return early. C++23 added `std::expected<T, E>`, which is very close to `Result`.
:::

::: context psi-and-kpa Pressure units in one line each
A **pascal** (Pa) is one newton per square meter, a very small pressure, so engineers usually say kilopascals (kPa) or megapascals (MPa). One **bar** is exactly $100$ kPa, close to air pressure at sea level. One **psi**, a pound-force per square inch, is about $6.895$ kPa. Rocket engines quote chamber pressure in bar or MPa in most of the world and in psi in much US documentation, which is exactly why a parser that refuses unknown units, instead of guessing, is worth writing.
:::

::: context question-mark-desugar What the compiler writes for you
Roughly, `expr?` inside a function returning `Result<T, MyError>` becomes the `match` below. The real version goes through a trait called `Try`, which is how the same `?` works for `Option` too, but for everyday use this picture is exact enough.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="10" width="120" height="28" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="29" font-size="12" fill="#1f2a44" text-anchor="middle">expr?</text>
  <line x1="160" y1="38" x2="80" y2="80" stroke="#1f2a44"/>
  <line x1="200" y1="38" x2="280" y2="80" stroke="#1f2a44"/>
  <text x="100" y="62" font-size="11" fill="#1d6fd1" text-anchor="end">Ok(v)</text>
  <text x="260" y="62" font-size="11" fill="#b4232c">Err(e)</text>
  <rect x="10" y="80" width="140" height="44" rx="4" fill="#ffffff" stroke="#1d6fd1"/>
  <text x="80" y="98" font-size="12" fill="#1f2a44" text-anchor="middle">value is v</text>
  <text x="80" y="115" font-size="11" fill="#6c7a93" text-anchor="middle">keep going</text>
  <rect x="200" y="80" width="150" height="44" rx="4" fill="#ffffff" stroke="#b4232c"/>
  <text x="275" y="98" font-size="12" fill="#1f2a44" text-anchor="middle">return Err(</text>
  <text x="275" y="115" font-size="11" fill="#1f2a44" text-anchor="middle">From::from(e))</text>
  <text x="180" y="144" font-size="11" fill="#6c7a93" text-anchor="middle">on Option: Some(v) gives v, None returns None</text>
</svg>
```
:::

::: context from-trait A trait you will see everywhere
`From` is one of the standard library's conversion traits. `impl From<A> for B` promises "you can always make a `B` out of an `A`, and it cannot fail". Implementing it also gives you the reverse spelling for free: `let b: B = a.into();`. Error types are its most common use, because each `From` impl is one more error type that `?` can pass through automatically. Crates such as `thiserror` exist to write these impls for you, but writing a few by hand first shows what they do.
:::

::: context config-typos Why a config parser should be strict
A configuration file is code that nobody compiles. A typo like `max_q_kpa 35.0`, with the `=` missing, is easy to make and easy to miss in review. A lenient parser might skip the line and leave the limit at some default, and the mistake would show up only when the limit mattered. A parser that returns a named error, such as `MissingEquals`, turns the typo into a message at startup. The same idea runs through this whole lesson: make failure visible, early, and specific.
:::
