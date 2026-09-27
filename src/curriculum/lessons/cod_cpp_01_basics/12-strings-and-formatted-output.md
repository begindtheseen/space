---
id: l12-strings-and-formatted-output
title: Strings and formatted output
minutes: 22
covers:
  - std::string vs const char*; iostream and std::format
---

Think about two ways to hand someone a message. A sticky note: they read until the writing stops. Or a labeled envelope: the label says how many words are inside and who is responsible for them. The sticky note is cheap. The envelope is safer, because nobody has to guess where the message ends.

C++ has both. The sticky note is the **C string** — a row of bytes that ends in a zero byte, handed around as a `const char*`. The envelope is **`std::string`** — a class that owns its characters, knows how many there are, and cleans up after itself. Python has one string type, which knows its length and compares text with `==`. In C++ you must know which kind you hold: it is the difference between a comparison that works and one that quietly compares two memory addresses.

Printing has its own layers, like the phones in a family's junk drawer. There is `printf` from C, `iostream` from 1980s C++, and `std::format` from C++20. You will read all three, so this lesson shows them on the same data and says which to write.

Flight software adds one rule. On the hard real-time path — the control loop that must finish every cycle on time — text is usually not formatted at all. The vehicle sends **[[telemetry|telemetry-numbers]]** down as binary numbers, and the ground station turns them into text. Strings belong in start-up code, ground tools, tests and logs outside the control loop — most of the code you will write, just not the innermost part.

## `const char*` and string literals

Picture a row of mailboxes. Each holds one letter of the word. The box after the last letter holds a zero, which means "stop here". Nothing on the row says how long the word is. To find out, you walk along until you hit the zero.

That is a C string. A **string literal** — text in double quotes in your source code, like `"COAST"` — is an array of characters with one extra byte at the end: the **[[NUL terminator|nul-terminator]]**, a byte whose value is zero. (NUL is read "null".) So `"COAST"` is six bytes: `C`, `O`, `A`, `S`, `T` and the zero. Its type is `const char[6]`, read "array of six const char".

A literal also has **static storage duration**: it is built into the program file and lives for the whole run (lesson 11). The moment you pass the array anywhere, it **[[decays|array-decay]]** to a `const char*` — read "pointer to const char" — which holds only the address of the first letter.

```cpp
const char* mode = "COAST";
```

```text
sizeof("COAST") = 6
std::strlen(mode) = 5
sizeof(mode)      = 8  (the pointer, not the text)
```

Three numbers, three facts.

- `sizeof` of the literal is 6, because the zero byte is part of the array.
- `std::strlen` (from `<cstring>`, read "string length") is 5. It counts up to the zero but not including it. It does that by *walking the bytes*, so every call is a fresh scan of the whole string.
- `sizeof` of the pointer is 8, because a pointer on a 64-bit machine is 8 bytes, whatever it points at. The array decayed, exactly as lesson 09's raw arrays did.

### Comparing two C strings

Here is the trap that catches everyone. Build the same text in a second place, at run time, so the compiler cannot share one copy:

```cpp
// Build the same text at run time, so no two literals can be merged.
char buf[6];
std::snprintf(buf, sizeof(buf), "COAST");
```

```text
buf == mode (pointers) : false
strcmp(buf, mode) == 0 : true
```

`==` on two `const char*` compares **addresses** — where the text lives — not the text itself. It checks whether two letters sit in the same mailbox, not whether they say the same thing.

To compare the letters, use `std::strcmp` from `<cstring>`. It returns 0 when the two strings match, a negative number when the first sorts earlier, and a positive number when it sorts later.

There is a twist. Comparing two *identical literals* may well give `true`, because the compiler is allowed to **[[store one copy|literal-merging]]** and point both names at it. So the bug comes and goes between compilers and builds, which is worse than failing every time.

::: warning A `const char*` owns nothing
A `const char*` carries no length and owns nothing. If the bytes it points at were on the stack of a function that has returned, or inside a `std::string` that has since changed, the pointer **dangles** — it points at memory that no longer holds your text — and reading it is undefined behaviour.

The classic C functions `strcpy`, `strcat` and `sprintf` will also write straight past the end of a buffer if the text is too long. That **[[buffer overflow|buffer-overflow]]** is one of the most exploited kinds of defect in the history of software. If you must use the C functions, use the forms that take a size, such as `snprintf` and `strncmp`.
:::

## `std::string`

Now the envelope. `std::string`, from `<string>`, owns its bytes. It knows its length, compares by content, joins with `+`, and frees its storage in its **destructor** — the clean-up code that runs automatically when the object dies.

```cpp
std::string a = "COAST";
std::string b = buf;   // the same text, copied from the char buffer above
std::string longer = "TERMINAL_DESCENT_WITH_THROTTLE_BACK_ENGAGED_";   // 44 characters
```

```text
std::string a == b     : true
a.size() = 5, a.capacity() = 15
longer.size() = 44, longer.capacity() = 44
```

The first line is what you wanted from `==` all along. The other two lines show something worth knowing. The **size** is how many characters the string holds. The **capacity** is how many it could hold before it needs more memory.

A five-character string reports capacity 15, and it did not use the **heap** (the pool of memory handed out on request while the program runs) at all. That is because libstdc++, the standard library that ships with g++, stores short strings *inside the string object itself*. This trick is the **[[short string optimization|sso-layout]]**. The limit of 15 is this library's choice, not a rule of the language. The 44-character string went over the limit, so it asked the heap for memory.

So a `std::string` may or may not touch the heap, and you cannot tell by looking. On a real-time path, "may allocate" means "may miss a deadline".

The operations you will use most:

| Expression | Meaning |
| --- | --- |
| `s.size()`, `s.empty()` | length in bytes, and "is it empty?"; no scan |
| `s == t`, `s < t` | content comparison |
| `s + t`, `s += t` | joining (concatenation); may allocate |
| `s.c_str()` | a `const char*` to the same bytes, NUL-terminated, for C functions |
| `s.substr(pos, n)` | a new string of `n` characters from position `pos`; allocates if long |
| `s.at(i)` / `s[i]` | checked / unchecked access to character `i` |

`c_str()` is how you cross back to a C interface. Its pointer stays valid only until the string is changed or destroyed.

### `std::string_view`

Sometimes a function only needs to *read* some text. It does not need its own copy. Think of a bookmark and a line count: "start here, read 40 characters". That is **`std::string_view`**, from `<string_view>`: a pointer and a length, a non-owning view of characters that already exist somewhere else.

It is the right parameter type for a function that only reads text. It can be made from a `std::string`, a literal or a `char` buffer without copying any of them:

```cpp
void log_mode(std::string_view mode);   // takes any of the three, copies none
```

```text
mode ASCENT (6 chars)
mode COAST (5 chars)
mode ENTRY (5 chars)
```

Those came from a `std::string`, a literal and a `char` array.

It is `std::span` from lesson 09, made for characters, and it has the same hazard: it keeps nothing alive. A `string_view` that outlives the string it looks at dangles.

::: key
A string literal is a `const char` array with static storage duration and a NUL terminator; it decays to `const char*`, carries no length, and `==` on two such pointers compares addresses, not text. `std::string` owns its bytes, knows its size and compares by content, at the cost of a possible allocation.
:::

## Three ways to print

Here are the same three values printed three ways. The operator `<<` below is read "put to" when it sends something into a stream, and `'\n'` (read "backslash n") is the newline character.

```cpp
const std::uint32_t t_ms = 123456;
const double az = -9.81;
const std::uint8_t mode_byte = 2;

// 1. printf: terse, unchecked by the type system, but -Wformat checks the string.
std::printf("printf : t=%u az=%.3f mode=%u\n", t_ms, az, mode_byte);

// 2. iostream: type-safe, verbose, and uint8_t prints as a character.
std::cout << "cout   : t=" << t_ms << " az=" << az
          << " mode=" << mode_byte << " (unhelpful)\n";
std::cout << "cout   : mode as a number = " << +mode_byte << '\n';

// 3. std::format: type-safe and the format string is checked at compile time.
std::cout << std::format("format : t={} az={:.3f} mode={}\n", t_ms, az, mode_byte);
std::cout << std::format("format : {:>8} | {:<8} | {:#06x}\n", "COAST", "ARMED", 0x64);
```

```text
printf : t=123456 az=-9.810 mode=2
cout   : t=123456 az=-9.81 mode= (unhelpful)
cout   : mode as a number = 2
format : t=123456 az=-9.810 mode=2
format :    COAST | ARMED    | 0x0064
```

Read the second line. After `mode=` there is *nothing visible*. The program really did write a byte there. The tool `od -c`, which prints every byte of its input, shows it as `002`, the byte 2.

Here is why. `std::uint8_t` is another name for `unsigned char` (lesson 04). `iostream` prints every character type as a character, not as a number. And byte 2 is a **[[control character|control-characters]]** — a code that means an instruction, not a letter — so nothing shows on screen.

This is the most common surprise in printing telemetry. The fix is on the next line: the **unary plus**, `+mode_byte` (read "plus mode byte"). It does not change the value. It promotes the byte to `int` before the stream sees it, so the stream prints a number.

### `printf`

`printf` (read "print F", for "formatted") comes from C. It is still everywhere in embedded code, and it is useful: one line, no heap allocation, and a small implementation. Each `%` in its first argument is a placeholder: `%u` for an unsigned integer, `%d` for a signed one, `%s` for a C string, `%.3f` for a number with three decimals.

Its weakness is that it is **[[variadic|variadic]]** — it accepts any number of arguments of any type — so the *language* cannot check the arguments against the placeholders. Compilers treat it as a special case and check anyway:

```cpp
std::string mode = "COAST";
double az = -9.81;
std::printf("mode=%s az=%d\n", mode, az);   // both arguments are wrong
```

g++ 13.3.0 with `-Wall`:

```text
g1.cpp:7:24: warning: format '%s' expects argument of type 'char*', but argument 2 has type 'std::string' {aka 'std::__cxx11::basic_string<char>'} [-Wformat=]
g1.cpp:7:30: warning: format '%d' expects argument of type 'int', but argument 3 has type 'double' [-Wformat=]
```

clang++ 18.1.3 makes the first one an *error* and suggests the fix:

```text
g1.cpp:7:36: error: cannot pass non-trivial object of type 'std::string' (aka 'basic_string<char>') to variadic function; expected type from format string was 'char *' [-Wnon-pod-varargs]
g1.cpp:7:36: note: did you mean to call the c_str() method?
```

These checks work only because the compiler recognizes `printf` by name. A project's own `log_printf` gets no checking unless it carries a special marking, so home-made logging functions are a good place for bugs to hide.

### `iostream`

`std::cout << x` picks a version of `<<` by the type of `x`, so there is no placeholder to get wrong. The costs are elsewhere:

- it is wordy;
- formatting settings stick: `std::setprecision` changes every later output, not just the next one;
- character types print as text, as you saw;
- `<iostream>` pulls a lot of code into the program.

Two small points of style. Write `'\n'` rather than `std::endl`. `endl` also **[[flushes|flushing]]** the stream — pushes everything waiting in memory out to the file or screen — and that is a trip to the operating system you rarely want on every line. And send errors to `std::cerr`, which is unbuffered, so its messages survive a crash that loses whatever was still waiting in `std::cout`.

### `std::format`

This is C++20's answer, and the one to reach for in new code. You write a format string with `{}` placeholders (read "braces"), and `std::format` returns a `std::string`. Its big feature: it checks the format string against the argument types **at compile time**.

```cpp
std::cout << std::format("format : {:>8} | {:<8} | {:#06x}\n", "COAST", "ARMED", 0x64);
```

```text
format :    COAST | ARMED    | 0x0064
```

Inside the braces, everything after the colon is the **[[format spec|format-spec]]**:

| Spec | Meaning | Result above |
| --- | --- | --- |
| `{:>8}` | right-align in 8 columns | `   COAST` |
| `{:<8}` | left-align in 8 columns | `ARMED   ` |
| `{:.3f}` | fixed-point, 3 decimals | `-9.810` |
| `{:#06x}` | hexadecimal, `0x` prefix, zero-padded to 6 characters | `0x0064` |

The grammar is close to Python's f-strings; the difference is that it is checked before the program runs.

Get a spec wrong and it is a compile error, not a run-time surprise:

```cpp
const char* name = "COAST";
std::string s = std::format("{:.3f}\n", name);   // .3f on a string
```

g++ 13.3.0 reports it through a wall of template details. The line that matters is:

```text
/usr/include/c++/13/format:814:48: error: call to non-'constexpr' function 'void std::__format::__failed_to_parse_format_spec()'
```

clang++ 18.1.3 is clearer about what happened:

```text
f2.cpp:6:33: error: call to consteval function 'std::basic_format_string<char, const char *&>::basic_format_string<char[8]>' is not a constant expression
```

Both say the same thing. The format string's constructor is `consteval` (lesson 07), so the string is checked during compilation, and a spec that does not fit the argument's type makes that check fail.

One note about this toolchain. `<format>` works in g++ 13.3.0, and in clang++ 18.1.3 using the same libstdc++. `std::print`, the C++23 function that formats and writes in one call, is **not** available here: `#include <print>` fails with "No such file or directory". Write `std::cout << std::format(...)` until your toolchain catches up.

::: key
`std::format` (C++20) uses `{}` placeholders with Python-like specs such as `{:.3f}` and `{:>8}`, and its format string is checked at compile time through a `consteval` constructor. `printf` is checked only by the compiler's `-Wformat` special case. `iostream` prints `std::uint8_t` as a character; write `+byte` or `static_cast<unsigned>(byte)` to see the number.
:::

::: example Formatting one telemetry line two ways
A log line for a downlink frame holds the time, the mode name and three accelerations.

```cpp
struct Frame {
    std::uint32_t t_ms;
    std::uint8_t mode;
    float ax, ay, az;
};

const char* mode_name(std::uint8_t m);

void log_printf(const Frame& f) {
    std::printf("t=%8u mode=%-8s a=(%7.3f,%7.3f,%7.3f)\n",
                f.t_ms, mode_name(f.mode),
                static_cast<double>(f.ax), static_cast<double>(f.ay),
                static_cast<double>(f.az));
}

void log_format(const Frame& f) {
    std::cout << std::format("t={:8} mode={:<8} a=({:7.3f},{:7.3f},{:7.3f})\n",
                             f.t_ms, mode_name(f.mode), f.ax, f.ay, f.az);
}
```

With the frame `{123456, 2, 0.021f, -0.013f, -9.81f}`, both print:

```text
t=  123456 mode=COAST    a=(  0.021, -0.013, -9.810)
t=  123456 mode=COAST    a=(  0.021, -0.013, -9.810)
```

Step through the first field. `123456` has 6 digits. The width is 8, so two spaces go in front: `  123456`. Now the mode: `COAST` is 5 letters, left-aligned in 8, so three spaces follow it. Then each acceleration takes 7 columns with 3 decimals: `-9.810` is 6 characters, so one space goes in front. The two lines match, which is the sanity check.

The differences are in what can go wrong.

- The `printf` version casts each `float` to `double`. A variadic call does that anyway (default argument promotion), but writing it shows intent and keeps `-Wdouble-promotion` quiet.
- It needs `%-8s` to left-align and `%8u` for a `std::uint32_t`. If the field's type ever changes to `std::uint64_t`, `%u` becomes wrong. `-Wformat` will warn here, because the format string is a literal — but only as a warning, and only for real `printf`.
- The `std::format` version takes `{}` for any type and checks the specs at compile time. Change the field's type and it still compiles and still prints correctly.

Neither guarantees steady timing. `std::format` builds a `std::string`, which allocates or not depending on the line's length. In a loop running 1000 times a second you would do neither: you would write the five numbers into a packet as binary and let the ground format them.
:::

::: example When a `const char*` is the right answer
Not every string should be a `std::string`. Here is a table of mode names:

```cpp
// A table of mode names: static storage, no allocation, no destructor.
constexpr const char* kModeNames[] = {"IDLE", "ASCENT", "COAST", "ENTRY", "LANDING"};

const char* mode_name(std::uint8_t m) {
    return (m < std::size(kModeNames)) ? kModeNames[m] : "UNKNOWN";
}
```

```text
mode_name(2) = COAST
mode_name(9) = UNKNOWN
```

`std::size(kModeNames)`, from `<iterator>`, is 5, the number of entries. For `m = 2`, the check `2 < 5` passes, and entry 2 (counting from zero: IDLE, ASCENT, COAST) is `"COAST"`. For `m = 9`, the check `9 < 5` fails, so the function returns `"UNKNOWN"` instead of reading past the end.

The literals live in the program file for the whole run, so a pointer to one cannot dangle. There is no allocation, no copy and no destructor. The whole table costs the letters themselves plus five pointers — $5 \times 8 = 40$ bytes of pointers on a 64-bit machine.

A `std::vector<std::string>` of the same names would allocate at start-up and buy nothing, because the names never change. Here C's representation is better. And because the check uses `std::size(kModeNames)`, not a hand-typed 5, adding a sixth mode updates it in the same edit.
:::

## Check yourself

::: check
`const char* a = get_mode_name(); const char* b = "COAST";` and `a == b` is sometimes true and sometimes false for the same text. Explain both outcomes.
:::

::: answer
`==` on two pointers compares the addresses, not the characters.

If `get_mode_name` returns a pointer to the same literal object — say it returns `"COAST"` from a table, and the compiler merged identical literals into one — the addresses are equal and the comparison is true.

If it returns a pointer into a buffer filled at run time, the addresses differ and the comparison is false, even though the bytes are identical.

Merging is allowed but not required, so answers vary between compilers and optimization levels. Compare with `std::strcmp(a, b) == 0`, or hold the text in a `std::string` or `std::string_view`, where `==` compares contents.
:::

::: check
`std::cout << mode_byte` printed nothing visible when `mode_byte` was `std::uint8_t{2}`. Why? Give two fixes.
:::

::: answer
`std::uint8_t` is another name for `unsigned char`, which is a character type. So the stream's character version of `<<` is chosen, and it writes the single byte 2, an unprintable control character.

Fix one: `std::cout << +mode_byte`. The unary `+` promotes the byte to `int`, which selects the integer version.

Fix two: `std::cout << static_cast<unsigned>(mode_byte)`. It says the same thing more openly, and a reviewer of flight code would prefer it.

A third way sidesteps the question: `std::format("{}", mode_byte)` prints `2`, because `std::format` treats `unsigned char` as a number.
:::

::: check
A five-character `std::string` reported `capacity() == 15` and allocated nothing. A 44-character one reported `capacity() == 44`. What is the mechanism, and why does it rule out `std::string` in a 1 kHz control loop, rather than only making it slower?
:::

::: answer
It is the short string optimization. libstdc++ keeps a small buffer inside the `std::string` object and uses the heap only when the text does not fit — 15 characters in this library, a design choice and not a promise of the language.

The problem is not average speed. Whether an operation allocates depends on the *data*. So the worst-case time of any function holding a `std::string` is the allocating case, and the allocator's own timing depends on everything the heap has done before.

A control loop must meet its deadline every cycle, including the one where the mode name happens to be "TERMINAL_DESCENT". Fixed-size character buffers and precomputed `const char*` tables have timing you can bound; a `std::string` does not.
:::

::: check
Why is `std::format("{:.3f}", name)` a compile error, while `std::printf("%.3f", name)` is only a warning, when both are the same mistake?
:::

::: answer
`std::format`'s first parameter is a `std::basic_format_string`, and its constructor is `consteval`. So the format string is read during compilation, against the real types of the arguments. A spec that does not fit the argument's type makes that compile-time evaluation fail. No flag turns that off.

`printf` is a variadic C function, so the language checks nothing. The check exists only because g++ and clang++ recognize the name `printf` and inspect a literal format string as a special case. That special case is a warning by default. It does not cover your project's own logging functions unless they are marked, and it cannot see into a format string that is not a literal.
:::

::: check
Your logger takes `const std::string&`. A caller passes a string literal. What happens, and what would `std::string_view` change?
:::

::: answer
A `const std::string&` cannot refer to a character array directly. So the compiler builds a temporary `std::string` from the literal — copying the characters, and allocating if the text is longer than the short-string buffer — points the reference at that temporary, and destroys it after the call. Every call with a literal pays for a copy the logger never needed.

A `std::string_view` is a pointer and a length. It can be made from a literal, a `std::string` or a character buffer with no copy and no allocation, so the call passes just two small values.

Use `std::string_view` for any parameter that only reads text and does not keep it. Keep `const std::string&` only where the function really needs a `std::string`. And remember that a `string_view` keeps nothing alive, so storing one past the call is a dangling-reference bug.
:::

## Summary

| Item | What it is |
| --- | --- |
| `"COAST"` | a `const char[6]` with static storage duration, NUL-terminated |
| `const char*` | a pointer; no length, no owner; `sizeof` gives 8 |
| `strlen` | walks to the terminator every call |
| `==` on `const char*` | compares addresses; use `std::strcmp` for contents |
| `std::string` | owns its bytes, knows its size, compares by content, may allocate |
| Short string optimization | short strings live inside the object; 15 characters in libstdc++ |
| `s.c_str()` | a `const char*` to the same bytes, valid until the string changes |
| `std::string_view` | non-owning pointer plus length; the right read-only parameter type |
| `printf` | terse, no heap, checked only by the `-Wformat` special case |
| `iostream` | type-safe, wordy, sticky settings; character types print as text |
| `+byte` | promotes a `uint8_t` to `int` so it prints as a number |
| `'\n'` vs `std::endl` | `endl` also flushes; usually not what you want |
| `std::format` | C++20; `{}` placeholders, checked at compile time via `consteval` |
| `std::print` | C++23; not available in this toolchain's libstdc++ 13 |

Lesson 13 closes the module with the two ways to write down what your code assumes: `static_assert` for what must be true before the program exists, and `assert` for what must be true while it runs.

::: context telemetry-numbers Why the vehicle sends numbers, not sentences
Telemetry is the stream of measurements a vehicle sends to the ground: times, modes, accelerations, temperatures. Turning a number into text costs processor time, and the text is bigger than the number — `-9.810` is six characters, while the same value as a `float` is four bytes. So the vehicle packs raw binary values into packets, and ground software, which has plenty of time and memory, decodes and prints them. The same byte layout must be agreed on both ends, which is why lesson 04's fixed-width types matter.
:::

::: context nul-terminator Where the word ends
A C string has no length stored anywhere. The only way to know where it ends is the zero byte after the last letter. Here is `"COAST"` in memory, with the pointer `mode` holding the address of the first box:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="50" width="54" height="34" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="35" y="71" font-size="13" fill="#1f2a44" text-anchor="middle">mode</text>
  <line x1="62" y1="67" x2="72" y2="67" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="80,67 71,62 71,72" fill="#1d6fd1"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="80" y="50" width="40" height="34" fill="#8fb8f0"/>
    <rect x="120" y="50" width="40" height="34" fill="#8fb8f0"/>
    <rect x="160" y="50" width="40" height="34" fill="#8fb8f0"/>
    <rect x="200" y="50" width="40" height="34" fill="#8fb8f0"/>
    <rect x="240" y="50" width="40" height="34" fill="#8fb8f0"/>
    <rect x="280" y="50" width="40" height="34" fill="#f2b880"/>
  </g>
  <g font-size="14" fill="#1f2a44" text-anchor="middle">
    <text x="100" y="72">C</text><text x="140" y="72">O</text><text x="180" y="72">A</text>
    <text x="220" y="72">S</text><text x="260" y="72">T</text><text x="300" y="72">0</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="100" y="42">[0]</text><text x="140" y="42">[1]</text><text x="180" y="42">[2]</text>
    <text x="220" y="42">[3]</text><text x="260" y="42">[4]</text><text x="300" y="42">[5]</text>
  </g>
  <text x="300" y="18" font-size="11" fill="#b4232c" text-anchor="middle">NUL: stop</text>
  <line x1="300" y1="22" x2="300" y2="31" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="82" y1="98" x2="278" y2="98" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="180" y="113" font-size="11" fill="#1d6fd1" text-anchor="middle">strlen = 5</text>
  <line x1="82" y1="124" x2="318" y2="124" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="200" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">sizeof = 6 (the zero counts)</text>
</svg>
```

Six bytes in the array; `strlen` counts the five before the zero.
:::

::: context array-decay An array forgets its size
"Decay" is the C and C++ word for an automatic change of type. Most times you use an array's name — passing it to a function, assigning it to a pointer — the language quietly turns it into a pointer to its first element. The pointer does not know how many elements followed. That is why `sizeof(mode)` gives 8, the size of an address, and why every C string function has to find the end by searching for the zero.
:::

::: context literal-merging Sharing one copy of the same words
The C++ standard says it is unspecified whether two identical string literals are the same object. Compilers usually store one copy of each distinct literal and point every use at it, because it saves space in the program. So `"COAST" == "COAST"` often comes out `true`. But it can change with the compiler, the optimization level, or whether the two literals sit in different source files. Code that depends on it is depending on luck.
:::

::: context buffer-overflow A famous overflow
A buffer overflow happens when a program writes more bytes than a buffer holds, so the extra bytes land on whatever sits next to it in memory — often other variables, or the address a function will return to. In 1988 the Morris worm, one of the first programs to spread itself across the internet, used an overflow in a server that read input with the C function `gets`, which has no way to know the buffer's size. `gets` was later removed from the C and C++ standards entirely.
:::

::: context sso-layout Where a short string hides
In libstdc++ a `std::string` object is 32 bytes on a 64-bit machine. It holds a pointer to the characters, the length, and a 16-byte area. For a short string the pointer points back into the object's own 16 bytes: room for 15 letters plus the zero byte. A longer string gets heap memory, and the pointer points there instead.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="20" y="22">0</text><text x="100" y="22">8</text><text x="180" y="22">16</text><text x="340" y="22">32</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="30" width="80" height="36" fill="#8fb8f0"/>
    <rect x="100" y="30" width="80" height="36" fill="#ffffff"/>
    <rect x="180" y="30" width="160" height="36" fill="#f2b880"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="52">pointer</text><text x="140" y="52">size = 5</text><text x="260" y="52">COAST + zero + spare</text>
  </g>
  <path d="M60 66 V100 H260 V72" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="260,68 255,78 265,78" fill="#1d6fd1"/>
  <text x="160" y="118" font-size="11" fill="#1d6fd1" text-anchor="middle">short string: pointer aims inside the object</text>
</svg>
```

Byte offsets along the top. No heap memory is used until the text needs more than 15 characters.
:::

::: context control-characters Bytes that are not letters
Text is stored as numbers. In ASCII, the code most text still uses, the values 32 to 126 are printable: space, digits, letters, punctuation. The values 0 to 31 are control characters, left over from teleprinters: 10 is newline, 9 is tab, 7 rings a bell. Byte 2 was "start of text". A terminal shows nothing for it, which is why `mode=` looked empty. The letter `A` is 65, so a mode byte of 65 would have printed as `A`.
:::

::: context variadic Functions with "..." in their list
A variadic function is declared with `...` as its last parameter, like `int printf(const char* fmt, ...)`. The caller can pass any number of extra arguments of any type, and the function has to trust the format string to say what they were. Nothing in the language connects the two. That is why the check lives in the compiler as a special rule for `printf`. Without it, a `std::string` passed where `%s` expects a `char*` would slip through, and `printf` would read its bytes as if they were an address.
:::

::: context flushing Why output waits in a bucket
Writing to a file or screen means asking the operating system, and each request has a cost. So `std::cout` collects output in memory — a buffer — and hands it over in big batches. Flushing means handing the batch over now. `std::endl` flushes on every line, which can make a log that writes thousands of lines noticeably slower. `std::cerr` flushes every time on purpose, because an error message must not be lost if the program dies. Lesson 13 shows a line lost exactly that way.
:::

::: context format-spec Reading a format spec
A spec is read left to right. Take `{:#06x}` applied to the number 100, which is `0x64` in hexadecimal:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="26" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="48">{</text><text x="95" y="48">:</text><text x="130" y="48" fill="#b4232c">#</text>
    <text x="165" y="48" fill="#1d6fd1">0</text><text x="200" y="48" fill="#1d6fd1">6</text>
    <text x="235" y="48" fill="#b4232c">x</text><text x="270" y="48">}</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="95" y1="56" x2="95" y2="74"/><line x1="130" y1="56" x2="130" y2="92"/>
    <line x1="165" y1="56" x2="165" y2="74"/><line x1="200" y1="56" x2="200" y2="92"/>
    <line x1="235" y1="56" x2="235" y2="74"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="95" y="86">spec starts</text><text x="130" y="104">add 0x</text>
    <text x="165" y="86">pad with 0</text><text x="200" y="104">width 6</text><text x="245" y="86">hex</text>
  </g>
  <text x="180" y="134" font-size="13" fill="#1f2a44" text-anchor="middle">100 prints as 0x0064 (6 characters)</text>
</svg>
```

The width counts the `0x` prefix, so four hex digits remain after it, and the zeros fill the gap.
:::
