---
id: l05-optional-variant-tuple-bitset
title: Maybe, one-of, several-at-once, and flags - optional, variant, tuple, pair and bitset
minutes: 22
covers:
  - optional, variant, tuple, pair, bitset
---

Think about the boxes you meet in everyday life. A mailbox may hold a letter, or it may be empty, and "empty" is a perfectly normal answer. A vending-machine slot holds exactly one kind of snack, but which kind depends on the button you pressed. A lunch tray holds several different things at once: a sandwich, an apple, a drink. And a car's dashboard has a row of warning lights, each either on or off.

Flight software needs every one of those shapes. A GPS receiver may have a position fix, or not yet. A sensor read gives back either a measurement or the reason there is none. A statistics routine wants to return a minimum, a maximum and a count together. And every telemetry frame carries a **health word**: sixteen or thirty-two on-off flags saying which parts of the vehicle are unhappy.

The standard library has a small tool for each shape. `std::optional` is the mailbox. `std::variant` is the vending slot, and you already know it from the previous module. `std::pair` and `std::tuple` are the lunch tray. `std::bitset` is the dashboard. None of them uses the heap. Each is a plain value you can copy, compare and pass around, which is why flight coding standards are comfortable with all five.

## std::optional: a value, or nothing

Suppose a function computes a GPS fix. With fewer than four satellites in view there is no answer. How should the function say so?

The old habits all have a flaw. Returning a special "impossible" number, called a **[[sentinel value|sentinel]]** — latitude $-999$, say, or `NaN` — works until someone forgets to check and feeds $-999$ degrees into the navigation filter. Returning `bool` and writing the answer through a reference parameter works, but nothing forces the caller to look at the `bool` before using the answer.

`std::optional<T>`, from `<optional>`, read aloud as "an optional T", says it in the type. It holds either one `T` or nothing at all. The "nothing" has a name, `std::nullopt` — read it "null opt". The caller cannot mistake the empty case for a real value, because it has to open the box to get the value out.

Here is what you can do with an optional `o`:

- `if (o)` or `o.has_value()` — is there a value?
- `*o` and `o->member` — the value, with **no check**. Using them on an empty optional is undefined behavior.
- `o.value()` — the value, checked: if the optional is empty, it throws `std::bad_optional_access`.
- `o.value_or(fallback)` — the value if there is one, otherwise `fallback`.
- `o = std::nullopt;` or `o.reset();` empties it. Assigning a `T` fills it.

The value lives *inside* the optional object, next to a small flag that says whether it is there. There is **[[no heap|optional-layout]]**: making, filling and emptying an optional never allocates.

::: example A GPS fix that might not exist
```cpp
#include <cstdio>
#include <optional>

struct Fix { double lat_deg; double lon_deg; int sats; };

// A GPS fix needs at least four satellites. With fewer, there is no answer.
std::optional<Fix> solve_fix(int sats_tracked) {
    if (sats_tracked < 4) return std::nullopt;             // "no value"
    return Fix{28.5729, -80.6490, sats_tracked};             // a value
}

int main() {
    for (int sats : {7, 3}) {
        const std::optional<Fix> fix = solve_fix(sats);
        if (fix) {                                           // has a value?
            std::printf("%d sats: fix at %.4f, %.4f\n", sats, fix->lat_deg, fix->lon_deg);
        } else {
            std::printf("%d sats: no fix\n", sats);
        }
    }

    std::optional<double> baro_alt_m;                        // starts empty
    std::printf("altitude or fallback: %.1f\n", baro_alt_m.value_or(-1.0));
    baro_alt_m = 1523.4;
    std::printf("altitude or fallback: %.1f\n", baro_alt_m.value_or(-1.0));

    std::printf("sizeof(Fix) = %zu, sizeof(optional<Fix>) = %zu\n",
                sizeof(Fix), sizeof(std::optional<Fix>));
    std::printf("sizeof(double) = %zu, sizeof(optional<double>) = %zu\n",
                sizeof(double), sizeof(std::optional<double>));

    try {
        std::optional<Fix> none = solve_fix(2);
        std::printf("%d\n", none.value().sats);
    } catch (const std::bad_optional_access& e) {
        std::printf("caught: %s\n", e.what());
    }
}
```

Compiled with `g++ -std=c++20 -Wall -Wextra -O2`:

```text
7 sats: fix at 28.5729, -80.6490
3 sats: no fix
altitude or fallback: -1.0
altitude or fallback: 1523.4
sizeof(Fix) = 24, sizeof(optional<Fix>) = 32
sizeof(double) = 8, sizeof(optional<double>) = 16
caught: bad optional access
```

Line by line. With 7 satellites, `solve_fix` returns a `Fix`, which fills the optional. `if (fix)` is true, and `fix->lat_deg` reaches inside — a position near Cape Canaveral. With 3 satellites it returns `std::nullopt`, `if (fix)` is false, and the program says so instead of printing garbage.

`baro_alt_m` starts empty, so `value_or(-1.0)` hands back the fallback. After `baro_alt_m = 1523.4;` it holds a value and `value_or` returns it.

Now the sizes. A `Fix` is two doubles and an `int`: $8 + 8 + 4 = 20$ bytes, rounded up to 24 so the next `Fix` in an array would start on an 8-byte boundary. The optional adds a one-byte "is there a value?" flag. That flag is rounded up the same way, to the next multiple of 8: $24 + 8 = 32$. For a lone `double`, $8 + 8 = 16$. The cost is one flag plus padding, and no allocation.

Last, `value()` on an empty optional threw `std::bad_optional_access`, and the `catch` printed its message. Sanity check: the one unchecked access in the program, `fix->lat_deg`, sits inside `if (fix)`, so it is never reached when the box is empty.
:::

::: warning Two ways to open an empty box
`*o` and `o->` do not check. On an empty optional they read whatever bytes happen to be there — undefined behavior, not an error message. Only use them right after testing `if (o)`. And many flight builds switch exceptions off, which turns `value()`'s throw into a crash; the last lesson of this module explains why. In flight code, test first, or use `value_or`.
:::

::: warning `optional<bool>` reads backwards
`std::optional<bool> armed = false;` holds a value — the value `false`. So `if (armed)` is **true**, because the test asks "is there a value?", not "is it true?". A short test built around exactly that line printed `if (armed) is true: it has a value`. Write `if (armed.value_or(false))` or `if (armed == true)` to say what you mean. The same trap waits in `std::optional<int>` holding `0`.
:::

C++23 adds `and_then`, `transform` and `or_else`, which chain steps that may each come back empty, but everything above works in C++20.

## std::variant, briefly: one of a fixed list

The previous module's lesson on `std::variant` and `std::visit` built a four-mode flight state machine. Here is the one-sentence reminder: a `std::variant<A, B, C>` holds exactly one value, of type `A`, `B` or `C`, together with a small index saying which, stored inside the variant with no heap. You read it with `std::visit` for a full case-by-case handling, or with `std::get_if<B>(&v)`, which returns a pointer to the `B` inside or `nullptr` if it holds something else.

An optional is really a variant with two alternatives: "a `T`" and "nothing". Grow the "nothing" into "nothing, and here is why", and you get a common shape for results:

```cpp
enum class SensorError : std::uint8_t { Timeout, BadChecksum, OutOfRange };

// Either a pressure reading in pascals, or the reason there is none.
std::variant<double, SensorError> read_pressure(int attempt) {
    if (attempt == 0) return SensorError::Timeout;
    return 101325.0;
}
```

Called twice, testing with `std::get_if<double>(&r)` and printing the error's number otherwise, a full program printed `attempt 0: error 0` and `attempt 1: 101325 Pa`. Its `sizeof` was 16: an 8-byte `double`, a one-byte index and padding.

Two small tools round this out. `std::monostate`, from `<variant>`, is an **[[empty type|monostate]]** whose job is to be "nothing yet" inside a variant; a `std::variant<std::monostate, double>` starts out holding it, at index 0. And the "value or error" shape is so common that C++23 gave it its own type, **[[std::expected|bridge-expected]]**, covered in this module's last lesson.

::: key
`std::optional<T>` holds a `T` or nothing (`std::nullopt`), inside itself, with no allocation. `std::variant<A, B>` holds exactly one of its listed types, also inside itself. Both replace sentinel values and out-parameters with a type the caller must open.
:::

## std::pair and std::tuple: several values at once

A **`std::pair<A, B>`**, from `<utility>`, holds two values, called `first` and `second`. You have already met pairs whether you noticed or not: every element of a `std::map<K, V>` is a `std::pair<const K, V>`, the key and its value, and `map::insert` answers with a pair — where the element is, and whether it was newly inserted.

A **`std::tuple<A, B, C, ...>`**, from `<tuple>`, is the same idea for any number of values. Its members have no names. You reach them by position with `std::get<0>(t)`, `std::get<1>(t)` and so on — read `std::get<1>(t)` as "get element one of t". The position must be a constant the compiler can see; you cannot loop over a tuple's elements with an ordinary `for`.

Unpacking these one `.first` or `std::get` at a time gets clumsy. C++17 added **structured bindings**, which name all the parts in one line:

```cpp
const auto [lo, hi, n] = stats(temps_c);      // three names for the tuple's three parts
```

Read it as "unpack the result into `lo`, `hi` and `n`". The number of names must match the number of parts exactly. The same syntax unpacks a pair, a tuple, a `std::array`, or a plain struct with public members. Under the hood it is **[[not three separate variables|structured-bindings-how]]**, but you can use the names as if it were.

Pairs and tuples also compare. `<` checks the first elements; only if they are equal does it look at the second, and so on. That is **[[lexicographic|lexicographic]]** order, the way a dictionary sorts words. It makes a tuple a quick way to sort by one field and break ties with another.

::: example Three answers from one function, and a map walked in order
```cpp
#include <algorithm>
#include <cstdio>
#include <map>
#include <string>
#include <tuple>
#include <utility>
#include <vector>

// Three answers from one pass: smallest, largest, and how many samples.
std::tuple<double, double, int> stats(const std::vector<double>& v) {
    const auto [lo, hi] = std::minmax_element(v.begin(), v.end());   // a pair of iterators
    return {*lo, *hi, static_cast<int>(v.size())};
}

int main() {
    std::pair<int, double> p{17, 0.25};                  // channel 17, scale 0.25
    std::printf("pair: first %d, second %.2f\n", p.first, p.second);

    const std::vector<double> temps_c{21.5, 23.0, 19.8, 24.1, 22.7};
    const auto [lo, hi, n] = stats(temps_c);             // structured binding
    std::printf("min %.1f, max %.1f, n %d\n", lo, hi, n);

    const auto t = stats(temps_c);
    std::printf("std::get<1>(t) = %.1f, tuple_size = %zu\n",
                std::get<1>(t), std::tuple_size_v<decltype(t)>);

    std::map<int, std::string> channels{{3, "gyro_x"}, {1, "accel_z"}, {2, "baro"}};
    for (const auto& [id, name] : channels)              // each element is a pair
        std::printf("  channel %d -> %s\n", id, name.c_str());

    const auto [where, inserted] = channels.insert({2, "mag_x"});
    std::printf("insert id 2: inserted=%d, existing name %s\n",
                inserted, where->second.c_str());

    // tuples compare element by element, left to right
    std::printf("(1,9) < (2,0)? %d   (2,0) < (2,5)? %d\n",
                std::make_tuple(1, 9) < std::make_tuple(2, 0),
                std::make_tuple(2, 0) < std::make_tuple(2, 5));
    std::printf("sizeof pair<int,double> %zu, tuple<double,double,int> %zu\n",
                sizeof(std::pair<int, double>), sizeof(std::tuple<double, double, int>));
}
```

Output:

```text
pair: first 17, second 0.25
min 19.8, max 24.1, n 5
std::get<1>(t) = 24.1, tuple_size = 3
  channel 1 -> accel_z
  channel 2 -> baro
  channel 3 -> gyro_x
insert id 2: inserted=0, existing name baro
(1,9) < (2,0)? 1   (2,0) < (2,5)? 1
sizeof pair<int,double> 16, tuple<double,double,int> 24
```

Walk through it. The pair prints its two members by name, `first` and `second`.

Inside `stats`, `std::minmax_element` returns a pair of iterators — positions in the vector, the subject of the next lesson — and a structured binding names them `lo` and `hi`. The `return` builds the tuple from three values in braces. Back in `main`, a second structured binding unpacks the tuple. Check against the data: the smallest of $21.5, 23.0, 19.8, 24.1, 22.7$ is $19.8$, the largest $24.1$, and there are 5.

`std::get<1>(t)` is the element at position 1, counting from 0, which is the maximum, $24.1$. `std::tuple_size_v` reports 3 parts.

The `for` loop walks the map. Each element is a `std::pair<const int, std::string>`, and `[id, name]` unpacks it. The map keeps keys sorted, so the channels print as 1, 2, 3, not in the order they were written.

`insert({2, "mag_x"})` fails because key 2 exists. It returns a pair: an iterator to the element already there, and `false`, printed as 0. So `baro` survives.

The comparisons: $(1, 9) < (2, 0)$ is decided by the first elements alone, $1 < 2$, so true, even though $9 > 0$. $(2, 0) < (2, 5)$ has equal first elements, so the second decides: $0 < 5$, true.

Sizes: a `pair<int, double>` is 4 bytes of `int`, 4 of padding so the `double` starts on an 8-byte boundary, and 8 of `double`, 16 in all. The tuple is $8 + 8 + 4 = 20$, rounded up to 24.
:::

::: warning `first`, `second` and `get<2>` say nothing
A function returning `std::tuple<double, double, int>` does not tell the reader which `double` is the minimum. Six months later someone swaps them and the code still compiles. For anything that crosses an interface, prefer a small struct with named members — `struct Stats { double min; double max; int n; };` — which structured bindings unpack as neatly. Keep pairs and tuples for short-lived, local results, and for the places the standard library hands them to you.
:::

## std::bitset: a row of on-off flags

A car's dashboard does not have one light that says "something is wrong". It has a row of them — oil, battery, brakes — and several can be on at once. Flight software reports health the same way. Every telemetry frame carries a **health word**: an integer whose individual bits are flags. Bit 0 might mean "IMU A failed", bit 2 "no GPS fix", bit 5 "engine too hot". Sixteen flags fit in two bytes, which matters when a radio link carries only a few thousand bits per second.

`std::bitset<N>`, from `<bitset>`, read aloud as "a bitset of N bits", is a fixed row of `N` bits, with `N` fixed at compile time. Bits are numbered from 0, the lowest. It has exactly the tools a health word needs:

- `b.set(i)`, `b.reset(i)`, `b.flip(i)` turn bit `i` on, off, or to its opposite. With no argument, they act on every bit.
- `b.test(i)` reads bit `i`, and **checks** `i`: past the end, it throws `std::out_of_range`. `b[i]` reads or writes bit `i` with **no** check.
- `b.count()` is how many bits are on; `b.any()`, `b.none()` and `b.all()` ask whether any, none or all are on; `b.size()` is `N`.
- `&`, `|`, `^` and `~` work bit by bit on whole bitsets, the same operators you would use on integers.
- `b.to_ulong()` gives the bits back as an integer, ready to pack into a frame; `b.to_string()` gives them as `'0'` and `'1'` characters, highest bit first.

Why not a plain `std::uint16_t` and masks like `word |= 1u << 5`? You can, and much flight code does. The bitset's advantages are the named operations, `count()` and `to_string()` for free, and a checked `test`. Its cost is size: libstdc++ stores bits in whole **[[machine words|machine-word]]**, so even a `bitset<16>` takes 8 bytes. For the downlink you convert to a fixed-width integer.

::: example A 16-bit health word for telemetry
```cpp
#include <bitset>
#include <cstdint>
#include <cstdio>
#include <stdexcept>

// Bit positions in the 16-bit health word sent down in every telemetry frame.
enum Fault : std::size_t {
    IMU_A_FAIL   = 0,
    IMU_B_FAIL   = 1,
    GPS_NO_FIX   = 2,
    BATT_LOW     = 3,
    TANK_OVERP   = 4,
    ENGINE_TEMP  = 5,
    RADIO_LOSS   = 9,
};

int main() {
    std::bitset<16> health;                        // all 16 bits start at 0
    health.set(GPS_NO_FIX);                        // bit 2 on
    health.set(ENGINE_TEMP);                       // bit 5 on
    health[RADIO_LOSS] = true;                     // bit 9 on, via operator[]

    std::printf("bits    %s\n", health.to_string().c_str());
    std::printf("count   %zu of %zu set, any=%d none=%d\n",
                health.count(), health.size(), health.any(), health.none());

    health.reset(GPS_NO_FIX);                      // fix acquired: bit 2 off
    const auto word = static_cast<std::uint16_t>(health.to_ulong());
    std::printf("word    0x%04X (%u)\n", word, word);

    const std::bitset<16> critical{(1u << IMU_A_FAIL) | (1u << IMU_B_FAIL) | (1u << TANK_OVERP)};
    std::printf("critical fault present? %d\n", (health & critical).any());
    health.set(TANK_OVERP);
    std::printf("critical fault present? %d\n", (health & critical).any());

    try {
        health.test(16);                           // there is no bit 16
    } catch (const std::out_of_range&) {
        std::printf("test(16) threw out_of_range\n");
    }
    std::printf("sizeof(bitset<16>) = %zu\n", sizeof(std::bitset<16>));
}
```

Output:

```text
bits    0000001000100100
count   3 of 16 set, any=1 none=0
word    0x0220 (544)
critical fault present? 0
critical fault present? 1
test(16) threw out_of_range
sizeof(bitset<16>) = 8
```

Step by step. The `enum` gives every bit position a name, so nobody has to remember that 5 means engine temperature. The bitset starts all zeros. Three faults are set: bits 2, 5 and 9.

`to_string()` prints bit 15 on the left and bit 0 on the right. Count from the right, starting at 0: the ones sit at positions 2, 5 and 9. `count()` agrees, 3 of 16.

Then the GPS fix comes back, so bit 2 is reset. Bits 5 and 9 remain. As a number that is $2^5 + 2^9 = 32 + 512 = 544$, which in **[[hexadecimal|hex]]** is `0x0220`. That 16-bit value is what goes into the telemetry frame.

`critical` is a mask of the faults that should trigger an abort: bits 0, 1 and 4. `(health & critical)` keeps only the bits that are on in both. At first that is none, so `any()` is false. Once the tank over-pressure bit 4 is set, the AND has a bit on, and the answer flips to true. One line checks every critical fault at once.

`test(16)` asked for a bit that does not exist and threw. `health[16]` would not have checked. Sanity check on the size: 8 bytes, one 64-bit machine word, for 16 bits of information. That is why the program sends `word`, a `std::uint16_t`, and not the bitset itself.
:::

::: warning The order you print is not the order you number
`to_string()` puts the highest bit first, so bit 0 is the *last* character. People reading a telemetry dump often count from the left and blame the wrong subsystem. Always count from the right, starting at 0, or print the set bit numbers explicitly. And remember that a multi-byte word crosses the radio link in a chosen byte order; the endianness lesson in the memory module covers packing it.
:::

::: note Why an enum and not magic numbers
`health.set(5)` compiles as well as `health.set(ENGINE_TEMP)`. The difference shows up in a review, and years later, when someone moves engine temperature to bit 6. With the enum it is a one-line change that every use picks up. The ground station must decode the same layout, so real projects keep the bit list in one shared definition, often generated from the telemetry database, rather than typed twice.
:::

## Check yourself

::: check
A star tracker sometimes cannot identify any stars (the Sun is in view, say). Its old interface was `bool get_attitude(Quat& out);`. Rewrite the signature using this lesson's tools, and write the call site that uses the attitude only when it exists.
:::

::: answer
`std::optional<Quat> get_attitude();` The empty case is now part of the return type. At the call site:

`if (const auto q = get_attitude()) { use(*q); } else { coast_on_gyros(); }`

The `if` with a declaration creates `q`, tests whether it holds a value, and keeps `q` in scope only for the two branches. `*q` is unchecked, but it runs only inside the branch where the test passed. Nothing is allocated: the `Quat` sits inside the optional.
:::

::: check
What is `sizeof(std::optional<std::int32_t>)` likely to be, and why? Check your reasoning: an `int32_t` is 4 bytes and must start on a 4-byte boundary.
:::

::: answer
8 bytes. The optional holds the 4-byte value plus a 1-byte "has value" flag, which makes 5. The whole object must be a multiple of the value's alignment, 4, so that an array of them keeps every `int32_t` on a 4-byte boundary. The next multiple of 4 after 5 is 8. With g++ 13 the program `std::printf("%zu", sizeof(std::optional<std::int32_t>));` prints `8`.
:::

::: check
You want to sort a list of telemetry events by priority (highest first) and, among equal priorities, by time (earliest first). Show how a tuple comparison does the tie-break, for events $(p = 2, t = 10.0)$, $(p = 3, t = 12.5)$ and $(p = 2, t = 4.0)$.
:::

::: answer
Compare the tuples `(-p, t)`: negating the priority makes "higher priority" sort as "smaller". The keys are $(-2, 10.0)$, $(-3, 12.5)$, $(-2, 4.0)$. Lexicographic order compares the first elements: $-3$ is smallest, so the priority-3 event comes first. The other two tie at $-2$, so their second elements decide: $4.0 < 10.0$. Final order: $(3, 12.5)$, $(2, 4.0)$, $(2, 10.0)$. In code the comparison is `std::tuple(-a.p, a.t) < std::tuple(-b.p, b.t)`.
:::

::: check
A health word arrives on the ground as `0x0031`. Which bits are set, and using the example's enum, which faults are active?
:::

::: answer
`0x0031` is $3 \times 16 + 1 = 49$. Break it into powers of two: $49 = 32 + 16 + 1 = 2^5 + 2^4 + 2^0$. So bits 0, 4 and 5 are set: `IMU_A_FAIL`, `TANK_OVERP` and `ENGINE_TEMP`. Bits 0 and 4 are in the `critical` mask, so `(health & critical).any()` would be true. As `to_string()` it would print `0000000000110001`: counting from the right, positions 0, 4 and 5.
:::

::: check
A teammate writes `std::optional<int> retries = 0; if (!retries) start_countdown();`. The countdown never starts. Explain, and fix it.
:::

::: answer
`retries` holds a value, the number 0. `!retries` asks "is it empty?", and it is not, so `!retries` is false and the countdown is skipped. The test looks at whether the box has something in it, not at the number inside. If the intent is "no retries were needed", write `if (retries == 0)` — comparing an optional with a value is true only when it holds that value — or `if (retries.value_or(0) == 0)` if an empty optional should count as zero too.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| `std::optional<T>` | a `T` or nothing (`std::nullopt`) | stored inside; size of `T` plus a flag, rounded up |
| `if (o)`, `*o`, `o->` | test, then unchecked access | `*o` on empty is undefined behavior |
| `o.value()`, `o.value_or(x)` | checked access, access with fallback | `value()` throws `bad_optional_access` |
| `std::variant<A, B>` | exactly one of the listed types | good for "value or error"; read with `get_if` or `visit` |
| `std::pair<A, B>` | two values, `first` and `second` | a map's elements are `pair<const K, V>` |
| `std::tuple<...>` | any number of unnamed values | `std::get<i>(t)`; compares lexicographically |
| Structured binding | `auto [a, b, c] = ...;` | names every part at once; count must match |
| `std::bitset<N>` | `N` on-off bits, fixed size | `set`, `reset`, `test` (checked), `[]` (unchecked), `count`, `to_ulong` |
| Health word | fault flags packed into an integer | name bits with an enum; count from the right |

Next lesson: the iterators that `minmax_element` and `map::insert` handed back. What an iterator really is, the five kinds, why a range is written as a half-open $[\text{begin}, \text{end})$, and — most important — which container operations leave your iterators, pointers and references safe to use.

::: context sentinel The guard at the gate
A sentinel is a guard, and in programming a sentinel value is a special value that stands guard to mean "stop" or "nothing here": $-1$ for "not found", $-999$ for "no reading", `NaN` (not a number) for "invalid". The trouble is that a sentinel has the same type as a real answer, so nothing forces a caller to check it. A $-999$ latitude slides into a navigation filter as easily as a real one. `NaN` is worse in one way: every comparison with it is false, so a range check like `lat < -90` does not catch it either.
:::

::: context optional-layout What is inside an optional
An `std::optional<double>` is a double's worth of storage and a one-byte flag. The flag says whether the storage currently holds a live `double`. Padding rounds the object up to 16 bytes so that, in an array, each `double` stays on an 8-byte boundary.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">std::optional&lt;double&gt;, 16 bytes</text>
  <rect x="10" y="30" width="160" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="170" y="30" width="20" height="34" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="190" y="30" width="140" height="34" fill="#ffffff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="90" y="52" font-size="12" fill="#1f2a44" text-anchor="middle">storage for a double (8)</text>
  <text x="180" y="84" font-size="11" fill="#1f2a44" text-anchor="middle">flag (1)</text>
  <text x="260" y="52" font-size="12" fill="#6c7a93" text-anchor="middle">padding (7)</text>
  <text x="10" y="104" font-size="11" fill="#6c7a93">bytes 0-7 value, byte 8 has_value, bytes 9-15 unused</text>
</svg>
```
:::

::: context monostate A type with one possible value
`std::monostate` has no members, so every `monostate` object is the same as every other: the type has exactly one possible value. That is where the name comes from, "mono" meaning one. It is useful as the first alternative of a variant whose other alternatives cannot be default-constructed, because a variant always starts out holding its first alternative. Putting `monostate` first gives the variant a cheap, honest "nothing yet" state.
:::

::: context bridge-expected Coming in the last lesson
`std::expected<T, E>`, added in C++23 in the header `<expected>`, holds either a value of type `T` or an error of type `E`. It is the value-or-error variant from this section with a friendlier interface: `has_value()`, `value()`, `error()`. The module's last lesson uses it to explain how flight code reports errors when exceptions are turned off.
:::

::: context structured-bindings-how What the names really are
`auto [lo, hi, n] = stats(v);` makes one hidden object that holds the whole tuple. `lo`, `hi` and `n` are not three new variables. They are names for the parts of that hidden object. Usually the difference does not matter. It shows when you write `auto& [a, b] = some_pair;`: then the hidden object is a reference to `some_pair`, and changing `a` changes `some_pair.first`.
:::

::: context lexicographic Dictionary order
Lexicographic comes from lexicon, an old word for a dictionary. A dictionary puts "apple" before "banana" because of the first letter alone; only when first letters match, as in "cab" and "car", does it look at the second. Tuples and pairs compare the same way, element by element, and stop at the first difference.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <text x="10" y="24" font-size="13" fill="#1f2a44">(1, 9) vs (2, 0)</text>
  <text x="150" y="24" font-size="13" fill="#1d6fd1">1 &lt; 2: decided, stop</text>
  <text x="10" y="54" font-size="13" fill="#1f2a44">(2, 0) vs (2, 5)</text>
  <text x="150" y="54" font-size="13" fill="#6c7a93">2 = 2: look further</text>
  <text x="150" y="74" font-size="13" fill="#1d6fd1">0 &lt; 5: decided</text>
  <line x1="10" y1="88" x2="350" y2="88" stroke="#8fb8f0" stroke-width="1.5"/>
</svg>
```
:::

::: context machine-word The size the processor likes
A machine word is the chunk of bits a processor handles in one step: 64 bits on a typical laptop, 32 bits on many microcontrollers and flight processors. libstdc++ builds a bitset out of `unsigned long` words, which are 64 bits on 64-bit Linux, so any bitset from 1 to 64 bits takes 8 bytes there. Setting, testing and counting bits then use the processor's own word instructions, which is fast. The price is wasted space for small bitsets, which is why telemetry packs them into a `std::uint16_t` before sending.
:::

::: context hex Hexadecimal in one breath
Hexadecimal counts in sixteens. Its digits are 0 to 9 and then A to F for ten to fifteen, and `0x` in front marks a hex number. Each hex digit stands for exactly four bits, which is why engineers read bit patterns in hex. `0x0220` splits into four-bit groups `0000 0010 0010 0000`: bit 9 in the second group from the left and bit 5 in the third. As a decimal number, $2 \times 256 + 2 \times 16 = 544$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="55" y="22">0</text><text x="135" y="22">2</text><text x="215" y="22">2</text><text x="295" y="22">0</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1" fill="#ffffff">
    <rect x="15" y="32" width="80" height="26"/><rect x="95" y="32" width="80" height="26"/>
    <rect x="175" y="32" width="80" height="26"/><rect x="255" y="32" width="80" height="26"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="55" y="50">0000</text><text x="135" y="50">0010</text><text x="215" y="50">0010</text><text x="295" y="50">0000</text>
  </g>
  <text x="15" y="80" font-size="11" fill="#6c7a93">bits 15-12</text>
  <text x="95" y="80" font-size="11" fill="#b4232c">bit 9 on</text>
  <text x="175" y="80" font-size="11" fill="#b4232c">bit 5 on</text>
  <text x="255" y="80" font-size="11" fill="#6c7a93">bits 3-0</text>
  <text x="15" y="106" font-size="12" fill="#1f2a44">0x0220 = 512 + 32 = 544</text>
</svg>
```
:::
