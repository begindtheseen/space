---
id: l12-strings-and-formatted-output
title: Strings and formatted output
minutes: 18
covers:
  - std::string vs const char*; iostream and std::format
---

Python has one string type. It is immutable, it knows its length, `==` compares contents, `+` concatenates and `f"{x:.3f}"` formats. None of that transfers.

C++ inherited C's representation — a pointer to bytes terminated by a zero byte, with no length and no owner — and then added a class that fixes it. Both are in constant use: literals, C interfaces, and every embedded API you will meet are `const char*`, while anything you build or store is a `std::string`. Knowing which one you are holding is the difference between a comparison that works and one that silently compares two addresses.

Output has three generations layered on top of each other: `printf` from C, `iostream` from 1980s C++, and `std::format` from C++20. This lesson shows all three on the same data, because you will read all three in a real codebase and you need to know which one to write.

Flight software adds a constraint: on the hard real-time path, text is usually not formatted at all. Telemetry goes down as binary fields and the ground station renders them. Strings belong in initialisation, in ground tools, in test harnesses and in log messages outside the control loop — which is most of the code you will write, just not the innermost part.

## `const char*` and string literals

A string literal `"COAST"` is an object: an array of six `const char` with static storage duration, holding `C`, `O`, `A`, `S`, `T` and a terminating zero byte. Its type is `const char[6]`, which decays to `const char*` the moment you pass it anywhere.

```cpp
const char* mode = "COAST";
```

```text
sizeof("COAST") = 6
std::strlen(mode) = 5
sizeof(mode)      = 8  (the pointer, not the text)
```

Three numbers, three facts. `sizeof` of the literal is 6 because the terminator is part of the array. `strlen` is 5 because it counts up to but not including the terminator — and it does so by *walking the bytes*, so it is a linear scan every time you call it. `sizeof` of the pointer is 8 because a pointer is a pointer; the array decayed, exactly as lesson 09's raw arrays did.

The consequence that catches everyone:

```cpp
// Build the same text at run time, so no two literals can be merged.
char buf[6];
std::snprintf(buf, sizeof(buf), "COAST");
```

```text
buf == mode (pointers) : false
strcmp(buf, mode) == 0 : true
```

`==` on two `const char*` compares **addresses**. Two buffers holding identical text are not equal; the same buffer compared with itself is. The contents comparison is `std::strcmp` from `<cstring>`, which returns 0 for equal. (Comparing two identical literals may well give `true`, because the compiler is permitted to store one copy and point both at it — which makes the bug intermittent and therefore worse.)

::: warning
A `const char*` carries no length and owns nothing. If the bytes it points at were on the stack of a function that has returned, or in a `std::string` that has since been modified, the pointer dangles and reading it is undefined behaviour. Every C-string function — `strcpy`, `strcat`, `sprintf` — will also happily write past the end of a buffer, which is the single most exploited defect class in the history of software. Use the `n`-suffixed forms (`snprintf`, `strncmp`) when you must use them at all.
:::

## `std::string`

`std::string` owns its bytes. It knows its length, compares by content, concatenates, and frees its storage in its destructor.

```text
std::string a == b     : true
a.size() = 5, a.capacity() = 15
longer.size() = 44, longer.capacity() = 44
```

The first line is what you wanted from `==` all along. The other two show something worth knowing: a five-character string has capacity 15 with no heap allocation at all, because libstdc++ stores short strings inside the string object itself. That is the **short string optimisation**, and 15 is this implementation's threshold, not a standard guarantee. The 44-character string exceeded it and allocated.

So `std::string` may or may not touch the heap, and you cannot tell by looking. That is fine everywhere except a real-time path, where "may allocate" means "may miss a deadline".

The interface you will use most:

| Expression | Meaning |
| --- | --- |
| `s.size()`, `s.empty()` | length in bytes; no scan |
| `s == t`, `s < t` | content comparison |
| `s + t`, `s += t` | concatenation, may allocate |
| `s.c_str()` | a `const char*` to the same bytes, NUL-terminated, for C APIs |
| `s.substr(pos, n)` | a new string, allocating |
| `s.at(i)` / `s[i]` | checked / unchecked element access |

`c_str()` is how you cross back to a C interface, and its result is valid only until the string is modified or destroyed.

### `std::string_view`

`std::string_view` from `<string_view>` is a pointer and a length: a non-owning view of characters that already exist somewhere. It is the right parameter type for a function that only reads text, because it binds to a `std::string`, a literal or a `char` buffer without copying any of them:

```cpp
void log_mode(std::string_view mode);   // takes any of the three, copies none
```

It is `std::span` from lesson 09 specialised to characters, and it shares the same hazard: it keeps nothing alive. A `string_view` outliving the string it views dangles.

## Three ways to print

The same three values, printed three ways:

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

Read the second line. `mode=` is followed by *nothing visible* — the program really did write a byte there, and `od -c` on the output shows it as `d   e   =  002`, the byte 2 — because `std::uint8_t` is an alias for `unsigned char` (lesson 04), `iostream` treats every character type as text, and 2 is an unprintable control character. This is the single most common surprise in printing telemetry, and the fix is the unary `+` on the next line, which promotes the byte to `int` before it reaches the stream.

### `printf`

Inherited from C, still everywhere in embedded code, and genuinely useful: one line, no allocation, and a small implementation. Its weakness is that it is variadic, so the *language* cannot check the arguments against the format string. The compilers special-case it and check anyway:

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

These checks work only because the compiler recognises `printf` by name. A project's own `log_printf` gets no checking at all unless it is annotated, which is why a project-specific logging function is a place bugs hide.

### `iostream`

`std::cout << x` picks an overload by the type of `x`, so it cannot be given the wrong format. The costs are verbosity, formatting done through sticky stream state (`std::setprecision` changes every later output), a character-type surprise, and a large amount of code pulled in by `<iostream>`.

Two small points of style. Write `'\n'` rather than `std::endl`: `endl` also flushes the stream, which is a system call you rarely want and which turns a buffered log into a per-line write. And `std::cerr` is unbuffered and is where errors belong, so they survive a crash that eats `std::cout`'s buffer.

### `std::format`

C++20's answer, and the one to reach for in new code. It takes a format string with `{}` placeholders, checks it against the argument types **at compile time**, and returns a `std::string`.

```cpp
std::cout << std::format("format : {:>8} | {:<8} | {:#06x}\n", "COAST", "ARMED", 0x64);
```

```text
format :    COAST | ARMED    | 0x0064
```

`{:>8}` right-aligns in eight columns, `{:<8}` left-aligns, `{:.3f}` is fixed-point with three decimals, `{:#06x}` is hexadecimal with the `0x` prefix, zero-padded to six characters. The grammar is close enough to Python's f-strings that you already know most of it, and unlike an f-string the check happens before the program runs.

Get a specifier wrong and it is a compile error, not a run-time surprise:

```cpp
const char* name = "COAST";
std::string s = std::format("{:.3f}\n", name);   // .3f on a string
```

g++ 13.3.0 reports it through a wall of template expansion whose operative line is:

```text
/usr/include/c++/13/format:814:48: error: call to non-'constexpr' function 'void std::__format::__failed_to_parse_format_spec()'
```

clang++ 18.1.3 is clearer about what happened:

```text
f2.cpp:6:33: error: call to consteval function 'std::basic_format_string<char, const char *&>::basic_format_string<char[8]>' is not a constant expression
```

Both are saying the same thing, and you have met the mechanism already: the format string's constructor is `consteval` (lesson 07), so parsing it happens during compilation, and a spec that does not match the argument type makes that evaluation fail. This is `consteval` earning its keep in the standard library.

One availability note for this toolchain: `<format>` works in g++ 13.3.0 and in clang++ 18.1.3 using the same libstdc++. `std::print`, the C++23 function that formats and writes in one call, is **not** available here — `#include <print>` fails with "No such file or directory" — so write `std::cout << std::format(...)` until your toolchain catches up.

::: example Formatting one telemetry line three ways
A log line for a downlink frame: time, mode name, three accelerations.

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

```text
t=  123456 mode=COAST    a=(  0.021, -0.013, -9.810)
t=  123456 mode=COAST    a=(  0.021, -0.013, -9.810)
```

Identical output, and the differences are all in what can go wrong. The `printf` version needs `static_cast<double>` on the `float`s — strictly, default argument promotion does that anyway for a variadic call, but writing it makes the intent visible and keeps `-Wdouble-promotion` quiet. It also needs `%-8s` to left-align and `%8u` for a `std::uint32_t`, and if the field's type ever changes to `std::uint64_t` the specifier is silently wrong. The `std::format` version takes `{}` for anything and checks the alignment specifiers against the argument types at compile time; change the field's type and it still compiles and still prints correctly.

Note what neither version does: allocate, in the `printf` case, or allocate predictably, in the `std::format` case, which builds a `std::string`. In a 1 kHz loop you would do neither — you would write the six binary fields into a packet buffer and let the ground station format them. Text formatting is for ground tools, test harnesses and initialisation-time logging.
:::

::: example When a `const char*` is the right answer
Not every string should be a `std::string`.

```cpp
// A table of mode names: static storage, no allocation, no destructor.
constexpr const char* kModeNames[] = {"IDLE", "ASCENT", "COAST", "ENTRY", "LANDING"};

const char* mode_name(std::uint8_t m) {
    return (m < std::size(kModeNames)) ? kModeNames[m] : "UNKNOWN";
}
```

The literals live in the program image for the whole run, so returning a pointer to one is safe — it is not a dangling pointer, because the object it points at outlives everything. There is no allocation, no copy and no destructor, and the whole table costs a handful of bytes plus five pointers.

A `std::vector<std::string>` holding the same names would allocate six times at start-up, cost a destructor at shutdown, and buy nothing, because the names never change. This is the case where C's representation is genuinely better, and recognising it is part of reading flight code fluently.

Note the bounds check before the index, and that it uses `std::size(kModeNames)` from `<iterator>` rather than a hand-written 5 — so adding a sixth mode to the table updates the check in the same edit.
:::

::: key
A string literal is a `const char` array with static storage duration and a NUL terminator; it decays to `const char*`, carries no length, and `==` on two such pointers compares addresses, not text. `std::string` owns its bytes, knows its size and compares by content, at the cost of a possible allocation.
:::

## Check yourself

::: check
`const char* a = get_mode_name(); const char* b = "COAST";` and `a == b` is sometimes true and sometimes false for the same text. Explain both outcomes.
:::

::: answer
`==` on two pointers compares the addresses, not the characters. If `get_mode_name` returns a pointer to the same literal object — which it would if it returns `"COAST"` from a table, and the compiler merged identical literals into one object — the addresses are equal and the comparison is true. If it returns a pointer into a buffer that was filled at run time, the addresses differ and it is false, even though the bytes are identical. Literal merging is permitted but not required, so the same source can give different answers on different compilers or optimisation levels. Compare with `std::strcmp(a, b) == 0`, or, better, hold the text in `std::string` or `std::string_view`, where `==` compares contents.
:::

::: check
`std::cout << mode_byte` printed nothing visible when `mode_byte` was `std::uint8_t{2}`. Why, and give two fixes.
:::

::: answer
`std::uint8_t` is an alias for `unsigned char`, which is a character type, so the stream's overload for characters is selected and it writes the single byte 2 — an unprintable control character. Fix one: `std::cout << +mode_byte`, where the unary `+` triggers integral promotion to `int` and selects the integer overload. Fix two: `std::cout << static_cast<unsigned>(mode_byte)`, which says the same thing more explicitly and is what a reviewer would prefer in flight code. A third option is to avoid the question by using `std::format("{}", mode_byte)` — which, note, prints `2`, because the formatter for `unsigned char` is the integer one.
:::

::: check
A five-character `std::string` reported `capacity() == 15` and allocated nothing; a 44-character one reported `capacity() == 44`. What is the mechanism, and why does it disqualify `std::string` from a 1 kHz control loop rather than merely making it slow?
:::

::: answer
The short string optimisation: libstdc++ keeps a small buffer inside the `std::string` object itself and uses the heap only when the text does not fit — 15 characters on this implementation, which is an implementation choice and not a standard guarantee. The disqualification is not about average speed. It is that whether a given operation allocates depends on the *data*, so the worst-case execution time of a function containing a `std::string` is the allocating case, and the allocator's own timing depends on the heap's history. A control loop must meet its deadline every cycle, including the cycle where the mode name happened to be "TERMINAL_DESCENT", so a path whose timing depends on string length is not analysable. Fixed-size character buffers or precomputed `const char*` tables are.
:::

::: check
Why is `std::format("{:.3f}", name)` a compile error while `std::printf("%.3f", name)` is only a warning, when both are the same mistake?
:::

::: answer
`std::format`'s first parameter is a `std::basic_format_string`, whose constructor is `consteval` — so the format string is parsed during compilation, against the actual types of the arguments, and a spec that does not apply to the argument type makes the constant evaluation fail. That is a language-level check that no flag can turn off. `printf` is a variadic C function: the language does nothing, and the check exists only because g++ and clang++ recognise the name `printf` and inspect the literal format string as a special case. That special case is a warning by default, does not apply to your project's own logging wrappers unless they are annotated, and cannot see through a format string that is not a literal. `std::format` gives you the check as part of the type system instead.
:::

::: check
Your logger takes `const std::string&`. A caller passes a string literal. What happens, and what would `std::string_view` change?
:::

::: answer
A `const std::string&` cannot bind to a `const char*`, so the compiler constructs a temporary `std::string` from the literal — copying the characters and, if the literal is longer than the short-string buffer, allocating — binds the reference to that temporary, and destroys it after the call. Every call with a literal pays for a copy the logger never needed. `std::string_view` is a pointer and a length: it binds to a literal, a `std::string` or a character buffer with no copy and no allocation, so the same call becomes two words on the stack. Use `std::string_view` for any parameter that only reads text and does not store it; keep `const std::string&` only where the callee genuinely needs a `std::string` — and remember that a `string_view` keeps nothing alive, so storing one beyond the call is a dangling-reference bug.
:::

## Summary

| Item | What it is |
| --- | --- |
| `"COAST"` | a `const char[6]` with static storage duration, NUL-terminated |
| `const char*` | a pointer; no length, no owner; `sizeof` gives 8 |
| `strlen` | linear scan to the terminator |
| `==` on `const char*` | compares addresses; use `std::strcmp` for contents |
| `std::string` | owns its bytes, knows its size, compares by content, may allocate |
| Short string optimisation | short strings live inside the object; 15 characters in libstdc++ |
| `s.c_str()` | a `const char*` view, valid until the string changes |
| `std::string_view` | non-owning pointer plus length; the right read-only parameter type |
| `printf` | terse, no allocation, checked only by `-Wformat` special-casing |
| `iostream` | type-safe, verbose, sticky state; character types print as text |
| `+byte` | promotes a `uint8_t` to `int` so it prints as a number |
| `'\n'` vs `std::endl` | `endl` also flushes; usually not what you want |
| `std::format` | C++20; `{}` placeholders, checked at compile time via `consteval` |
| `std::print` | C++23; not available in this toolchain's libstdc++ 13 |

Lesson 13 closes the module with the two ways to state what your code assumes — `static_assert` for what must be true before the program exists, and `assert` for what must be true while it runs.
