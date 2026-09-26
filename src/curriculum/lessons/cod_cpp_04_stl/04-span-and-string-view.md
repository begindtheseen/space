---
id: l04-span-and-string-view
title: Views - std::span and std::string_view
minutes: 24
covers:
  - span and string_view: non-owning views, and the dangling-view hazard
---

Your friend lives in a house on Elm Street. You do not own the house, and you cannot carry it around. What you carry is a sticky note with the address: "12 Elm Street, the blue one, three windows wide." With that note you can find the house, look at it, count its windows. The note is tiny, and copying it costs nothing.

But the note has a weakness. If the house is torn down, the note does not change. It still says "12 Elm Street", and it now points at an empty lot — or at whatever was built there next.

The last three lessons were about containers: `std::array`, `std::vector`, `std::deque`, `std::list`, the maps and sets. Containers are the houses. They **own** their elements: they make them, keep them and destroy them. This lesson is about the sticky notes. A **view** is a small object that points at elements someone else owns, and says how many there are, without owning any of them. C++ has two you will use every day: `std::span` for any run of elements, and `std::string_view` for text. Both make function interfaces faster and more general. Both carry the Elm Street weakness, and the second half of the lesson is about catching it.

## The problem a view solves

Picture a function that averages a window of accelerometer samples. Where do the samples live? In a flight computer, maybe a plain C array filled by a driver. In a ground tool, maybe a `std::vector`. In a unit test, maybe a `std::array`. The function does not care. It only needs to read some doubles that sit side by side.

Before C++20 you had three unhappy choices.

- **Take `const std::vector<double>&`.** A caller holding a `std::array` or a C array must first copy everything into a new vector. That copy allocates memory, which a flight main loop is usually not allowed to do.
- **Take a pointer and a count,** `const double* p, std::size_t n`. This accepts everything, but nothing stops a caller from pairing a 3-element buffer with a count of 10.
- **Make it a template** that accepts any container. Every container type then gets its own compiled copy, and the body must live in a header.

`std::span`, from the header `<span>`, is the fourth choice, and the right one. It is the pointer and the count glued into one object, so they can never come apart. You met it briefly in the basics module. Now we look at it properly.

## std::span: a pointer and a length in one parameter

A `std::span<T>` — read it aloud as "a span of T" — holds two things: the address of the first element, and how many elements there are. That is all. It never allocates, never copies elements, and never frees anything. The elements must be **[[contiguous|contiguous]]**: stored side by side in memory with no gaps, the way a vector, a `std::array` and a C array all store them. A `std::list` or a `std::map` cannot be viewed by a span, because their elements are scattered around the heap.

Two flavors matter:

- `std::span<const double>` — a read-only view. The function can look at the doubles but not change them. This is what most parameters should be.
- `std::span<double>` — a writable view. The function can write through it into the caller's buffer. A filter that smooths samples in place would take this.

A span builds itself automatically from a C array, a `std::array` or a `std::vector`, so one function, compiled once, accepts all three.

Once you have a span `s`, here is what it offers:

- `s.size()` is the number of elements; `s.size_bytes()` is the number of bytes; `s.empty()` says whether there are none.
- `s[i]` is element `i`, with **no bounds check** — just like a raw array. `s.front()` and `s.back()` are the first and last.
- `s.data()` is the raw pointer, for handing to an old C function.
- `s.first(n)` is a new span of the first `n` elements, `s.last(n)` of the last `n`, and `s.subspan(offset, n)` of `n` elements starting at `offset`. None of them copies anything. They make a new sticky note that points at part of the same house.
- A span works in a range-based `for` loop, and has `begin()` and `end()`, so it works with every standard algorithm.
- `std::as_bytes(s)` views the same memory as raw bytes, a `std::span<const std::byte>`: what a telemetry packet encoder wants.

::: key
`std::span` is a non-owning view of a contiguous sequence with its length: pointer plus size, in one parameter. It replaces the pointer-and-length pair in interfaces and works for arrays, vectors and fixed buffers alike, which is ideal for flight-code buffer passing.
:::

Why "ideal for flight code"? Flight software builds its buffers once, at start-up, and then forbids memory allocation for the rest of the mission — a rule in almost every flight coding standard, among them the **[[Power of Ten|power-of-ten]]** rules from NASA's Jet Propulsion Laboratory. A span lets every function in a 1 kHz loop work on those preallocated buffers, or any slice of them, with no allocation and no copy. It costs 16 bytes to pass, whether it views three samples or three million.

The idea did not start in the standard. It was first shipped in the **[[Guidelines Support Library|gsl-span]]** and proved itself there before C++20 adopted it.

## Fixed extent versus dynamic extent

A span's length can be known at two different times.

Most spans have a **dynamic extent**: the length is decided while the program runs, and stored inside the span. `std::span<const double>` is one of these. It can view 3 elements today and 3,000 tomorrow.

Sometimes the length is part of the meaning. An acceleration vector always has exactly three components. A quaternion always has four. For those, write the length into the type: `std::span<const double, 3>`, read aloud as "a span of three const doubles". That is a **fixed extent**: the length is known when the program is compiled, so the span does not need to store it. A fixed-extent span is only a pointer, 8 bytes. The word **[[extent|extent-name]]** is borrowed from the standard's vocabulary for array sizes.

The compiler now checks the length for you. A `std::array<double, 3>` converts to `std::span<const double, 3>` automatically. A `std::array<double, 4>` does not: it is a compile error. A `std::vector<double>` does not either, because the compiler cannot know how long a vector is. You must say so explicitly, `std::span<const double, 3>{vec}`, and at that moment you are promising that `vec.size()` is exactly 3. Break the promise and the behavior is undefined.

::: example One mean function for three kinds of buffer
```cpp
#include <array>
#include <cstdio>
#include <span>
#include <vector>

// Mean of any run of contiguous doubles. One function, no copies, no template.
double mean(std::span<const double> s) {
    double sum = 0.0;
    for (double x : s) sum += x;
    return s.empty() ? 0.0 : sum / static_cast<double>(s.size());
}

// A fixed-extent span: exactly three doubles, size known at compile time.
double norm2(std::span<const double, 3> v) {
    return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
}

int main() {
    double raw[4] = {9.79, 9.81, 9.80, 9.82};          // a C array
    std::array<double, 3> accel{0.3, -0.4, 9.8};       // a std::array
    std::vector<double> window{9.78, 9.80, 9.83, 9.81, 9.79, 9.80};

    std::printf("raw    mean %.4f\n", mean(raw));
    std::printf("array  mean %.4f\n", mean(accel));
    std::printf("vector mean %.4f\n", mean(window));

    std::span<const double> all{window};
    std::printf("last 3 mean %.4f\n", mean(all.last(3)));
    std::printf("middle mean %.4f\n", mean(all.subspan(1, 4)));

    std::printf("|a|^2 = %.2f\n", norm2(accel));

    std::printf("sizeof dynamic span %zu, fixed span %zu\n",
                sizeof(std::span<const double>), sizeof(std::span<const double, 3>));
}
```

Compiled with `g++ -std=c++20 -Wall -Wextra -O2`, it prints:

```text
raw    mean 9.8050
array  mean 3.2333
vector mean 9.8017
last 3 mean 9.8000
middle mean 9.8075
|a|^2 = 96.29
sizeof dynamic span 16, fixed span 8
```

Walk through it. `mean` was called with a C array, a `std::array` and a `std::vector`. Each time, the compiler built a span on the spot from the container's address and size. No element was copied.

Check by hand. The C array: $39.22 / 4 = 9.805$. The accel array: $9.7 / 3 \approx 3.2333$. The whole window: $58.81 / 6 \approx 9.8017$. `all.last(3)` views $9.81, 9.79, 9.80$, mean $9.80$. `all.subspan(1, 4)` starts one element in and takes four, $9.80, 9.83, 9.81, 9.79$, mean $39.23 / 4 = 9.8075$. Both slices are new sticky notes into the same vector.

`norm2` squares and adds: $0.09 + 0.16 + 96.04 = 96.29$. The dynamic span stores a pointer and a length, $8 + 8 = 16$ bytes. The fixed span stores only the pointer, because the 3 lives in its type.

Sanity check: every mean near $9.8$ is close to $g_0 = 9.80665\,\mathrm{m/s^2}$, as an accelerometer sitting still on the pad should read.
:::

What happens if you call `norm2` with the wrong thing? Adding `std::array<double, 4> four` and `std::vector<double> vec` and calling `norm2(four)` and `norm2(vec)`, g++ 13 refuses both:

```text
error: could not convert 'four' from 'std::array<double, 4>' to 'std::span<const double, 3>'
error: could not convert 'vec' from 'std::vector<double>' to 'std::span<const double, 3>'
```

That is the fixed extent working: the wrong length is caught before the program ever runs. To pass the first three of the four on purpose, say so: `norm2(std::span<const double>(four).first<3>())`. The `first<3>()` form, with the count in angle brackets, returns a fixed-extent span.

::: warning `s[i]` is not checked
A span carries its length, but `s[i]` does not look at it. Reading `s[5]` from a 4-element span is undefined behavior, exactly as on a raw array. In C++20 there is no `.at()` on span to check for you. Check the index against `s.size()` yourself, or loop with range-based `for`, which cannot run off the end.
:::

## std::string_view: a span for text

`std::string_view`, from `<string_view>`, is the same idea specialized for characters. It holds a pointer to the first character and a count, 16 bytes in all, and owns nothing. A function that only reads text should take one by value:

```cpp
void log_event(std::string_view msg);    // accepts "literals", std::string, or a slice of either
```

It accepts a string literal, a `std::string`, or a piece of another view, and copies none of them. A `const std::string&` parameter, by contrast, forces a caller holding a literal to build a temporary `std::string` first — copying the characters and, for a long one, allocating.

A view has most of `std::string`'s read-only tools: `size()`, `empty()`, `sv[i]`, `find`, `starts_with` and `ends_with` (C++20), `substr(pos, n)`. Two differ in an important way:

- `substr` on a view returns another view. It copies no characters. On a `std::string` it builds a new string.
- `remove_prefix(n)` and `remove_suffix(n)` shrink the view from the front or back. They move the sticky note; the text itself is untouched.

That makes a view perfect for **parsing**: cutting a line of text into words without making a single new string.

::: example Splitting a command without copying a character
```cpp
#include <cstdio>
#include <string_view>

// Cut the next space-separated word off the front of `line`.
std::string_view next_word(std::string_view& line) {
    while (!line.empty() && line.front() == ' ') line.remove_prefix(1);
    const std::size_t end = line.find(' ');
    const std::string_view word = line.substr(0, end);   // end may be npos: "to the end"
    line.remove_prefix(word.size());
    return word;
}

int main() {
    const char packet[] = "SET  THROTTLE 0.72";
    std::string_view rest{packet};
    std::printf("packet is %zu chars\n", rest.size());

    while (!rest.empty()) {
        const std::string_view w = next_word(rest);
        std::printf("[%.*s] size %zu, starts at offset %td\n",
                    static_cast<int>(w.size()), w.data(), w.size(), w.data() - packet);
    }
    std::printf("sizeof(std::string_view) = %zu\n", sizeof(std::string_view));
}
```

Output:

```text
packet is 18 chars
[SET] size 3, starts at offset 0
[THROTTLE] size 8, starts at offset 5
[0.72] size 4, starts at offset 14
sizeof(std::string_view) = 16
```

Step by step. The command has two spaces after `SET`, on purpose, so it is $3 + 2 + 8 + 1 + 4 = 18$ characters.

First call: `find(' ')` finds a space at position 3, so the word is `substr(0, 3)`, `SET`, and `remove_prefix(3)` slides `rest` past it. Second call: the loop strips both spaces, `find` finds the next space 8 characters on, and the word is `THROTTLE`, at offset $3 + 2 = 5$. Third call: one space stripped, then `find` returns `npos` — read it "en-pos", a special value meaning "not found". `substr(0, npos)` means "to the end", so the word is `0.72`, at $5 + 8 + 1 = 14$.

The offsets prove the point. `w.data() - packet` is how far each view's pointer sits from the start of the original array: every word points *into* `packet`. No characters were copied and no memory was allocated.
:::

Notice the odd `printf` format, `%.*s`. It takes two arguments, a length and a pointer, and prints exactly that many characters. That is not decoration. It dodges the most common view bug.

::: warning A view is not null-terminated
C functions such as `printf("%s")` and `strlen` find the end of a string by looking for a zero byte. A `std::string_view` does not promise one: it ends where its count says, which may be in the middle of a longer string. In the example, the view `THROTTLE` points into `SET  THROTTLE 0.72`. `printf("%s", w.data())` prints `THROTTLE 0.72`, running on to the end of the whole packet. Print a view with `%.*s`, or with `std::cout << w`. If you need a **[[null-terminated|null-terminated]]** string for a C function, make an owning copy, `std::string{w}`, and pass its `c_str()`.
:::

## The dangling-view hazard

Now the empty lot. A view does not keep anything alive. If the owner dies, or moves its elements somewhere else, the view still holds the old address. It is then a **dangling view**: it points at memory that no longer holds what you think. Reading through it is undefined behavior, the same use-after-free you met with raw pointers in the memory module — just better disguised, because the code looks innocent.

::: key
Views do not own anything, so they dangle if the underlying storage dies or reallocates. Never store one in a member expecting the owner to outlive it unless that lifetime is documented and enforced.
:::

Here are the three ways it really happens.

**1. A view of a temporary.** A function returns a `std::string` by value. You catch it in a view. The returned string is a **[[temporary|temporary-lifetime]]**, and it is destroyed at the end of that line. The view outlives it.

**2. The owner reallocates.** A span into a `std::vector` is fine until a `push_back` goes past the vector's capacity. Then the vector moves its elements to a bigger buffer and frees the old one, where the span still points. A growing `std::string` does the same. Lesson 06 lists exactly which operations on which containers **[[move the elements|bridge-invalidation]]**.

**3. A stored view outlives its owner.** A class keeps a `std::string_view name_` member, set from a string the caller owned. When the caller's string dies, the object holds a note to a demolished house, and nobody finds out until the name is printed hours later.

The safe pattern follows. Use views as **function parameters**: the caller's data is certainly alive for the length of the call. Return or store a view only when it points at something that outlives it for sure — a string literal, for instance, which lives for the whole run of the program. Returning a view of a literal mode name like `"COAST"` is fine. Returning a view into a local `std::string` is a bug.

::: example A real dangling view, caught by AddressSanitizer
```cpp
#include <cstdio>
#include <string>
#include <string_view>

// Builds a channel label such as "IMU_A/accel_z_filtered". Returns a new string.
std::string make_label(int unit, const char* field) {
    return std::string("IMU_") + static_cast<char>('A' + unit) + "/" + field;
}

int main() {
    std::string_view label = make_label(0, "accel_z_filtered");   // view of a temporary
    std::printf("label has %zu chars\n", label.size());
    std::printf("first char: %c\n", label[0]);
}
```

Compiled with `g++ -std=c++20 -Wall -Wextra -O2`, there is no warning, and the program printed:

```text
label has 22 chars
first char: }
```

The size is right — `IMU_A/accel_z_filtered` is 22 characters — because the size is stored in the view itself. But the first character should be `I`, and it came out as `}`. The memory had already been freed and reused. On another day, or another machine, it might print `I` and hide the bug completely.

Now the same file built with AddressSanitizer, `g++ -std=c++20 -O1 -g -fno-omit-frame-pointer -fsanitize=address dangle.cpp`. Trimmed a little (each `...` stands for standard-library or start-up frames):

```text
label has 22 chars
==3692==ERROR: AddressSanitizer: heap-use-after-free on address 0x503000000040 ...
READ of size 1 at 0x503000000040 thread T0
    #0 0x55d8d802563c in main dangle.cpp:13
    ...
0x503000000040 is located 0 bytes inside of 31-byte region [0x503000000040,0x50300000005f)
freed by thread T0 here:
    #0 0x7fd09d2ff5e8 in operator delete(void*, unsigned long) ...
    ...
    #6 0x55d8d8025503 in std::__cxx11::basic_string<...>::~basic_string() ...
    #7 0x55d8d8025503 in main dangle.cpp:11
    ...
previously allocated by thread T0 here:
    #0 0x7fd09d2fe548 in operator new(unsigned long) ...
    ...
    #10 0x55d8d802516a in make_label[abi:cxx11](int, char const*) dangle.cpp:7
    #11 0x55d8d8025432 in main dangle.cpp:11
    ...
SUMMARY: AddressSanitizer: heap-use-after-free dangle.cpp:13 in main
```

Read it the way the memory module taught. The error class is `heap-use-after-free`. The bad read is 1 byte — one `char` — at line 13, `label[0]`. "0 bytes inside" means the very first character. The block was freed by `~basic_string()`, the `std::string` destructor, called from line 11: the temporary died at the end of the line that created the view. It was allocated inside `make_label` at line 7, where the `+` operators built the string.

Why a 31-byte block? While appending, the string grew a heap buffer with room for 30 characters plus a terminating zero. A very short label would never touch the heap, because of the **[[short-string optimization|sso]]**, and ASan would report `stack-use-after-scope` instead: the same bug seen from a different place.

The fix is one word. Own the text: `std::string label = make_label(0, "accel_z_filtered");`. Now the string lives until the end of `main`.
:::

::: warning The compiler may stay silent
g++ 13 with `-Wall -Wextra` gave no warning for the program above. clang does have a warning for this exact pattern — a view built from a temporary that dies at the end of the line — and it is on by default. It **[[cannot see the other two|dangling-gsl]]** cases, though. A span into a vector that later reallocates, or a view member that outlives its owner, compiles cleanly everywhere. Your defenses are the parameter-only rule, code review, and running the tests under AddressSanitizer.
:::

::: note Why `const std::string&` saves you and a view does not
Binding a temporary directly to a `const` reference stretches the temporary's life to match the reference, so `const std::string& s = make_label(...);` is safe. A `std::string_view` is not a reference. It is a separate object that copies a pointer and a length out of the string. Nothing is bound to the temporary, so the life-stretching rule never applies, and the string dies on schedule.
:::

## Check yourself

::: check
Write the declaration of a function `max_abs` that finds the largest absolute value among some doubles. It must accept a C array, a `std::array<double, 64>` and a `std::vector<double>`, must not copy them, and must not be a template. How big is its parameter on a 64-bit machine?
:::

::: answer
`double max_abs(std::span<const double> s);`

The `const` makes it read-only, so `const` buffers are accepted too. All three store their doubles contiguously, so each converts to the span automatically; nothing is copied or allocated. The parameter is a pointer plus a length, $8 + 8 = 16$ bytes, whatever the number of elements.
:::

::: check
A quaternion is always four numbers. Why might you declare `normalize(std::span<double, 4> q)` instead of `normalize(std::span<double> q)`? What changes in size and in checking?
:::

::: answer
With the fixed extent, 4 is part of the type, so the compiler rejects a `std::array<double, 3>` instead of letting the function read past its end. The span shrinks from 16 bytes to 8, since the length need not be stored. There is no `const` because normalizing writes back into the caller's doubles. A vector still needs an explicit `std::span<double, 4>{v}`: your promise that `v.size()` is 4.
:::

::: check
`std::string_view cmd{"ARM PYRO 3"};`. Give the values of `cmd.substr(4, 4)`, `cmd.find(' ')`, and `cmd.size()` after `cmd.remove_prefix(4);`. How many characters were copied in total?
:::

::: answer
The characters are `A R M _ P Y R O _ 3`, indexed 0 to 9, so the size starts at 10. `substr(4, 4)` starts at index 4 and takes four characters: `PYRO`. `find(' ')` returns 3, the first space. After `remove_prefix(4)`, the view starts at the `P` and has $10 - 4 = 6$ characters: `PYRO 3`. No characters were copied at any point: each result is a new pointer and length into the same literal.
:::

::: check
A logger class stores `std::string_view last_msg_;` and has `void note(std::string_view m) { last_msg_ = m; }`. A caller does `std::string s = "valve 2 open"; logger.note(s); s += " (confirmed)";`. What is wrong, and give two fixes.
:::

::: answer
`last_msg_` points into `s`'s characters. `s += " (confirmed)"` makes the text 24 characters long, too long for the string's inside buffer, so the string moves its characters to a new heap buffer. The stored view still points at the old place. Even without that, it would dangle as soon as `s` goes out of scope. Fix one: let the member own its text, `std::string last_msg_;` (the assignment then copies). Fix two, for flight code with no allocation: a fixed buffer such as `std::array<char, 64>` plus a length, which `note` copies into. Either way, the logger owns what it keeps.
:::

::: check
Which of these is safe? (a) `std::string_view mode_name(int m) { static constexpr std::string_view names[] = {"SAFE", "IDLE", "BURN"}; return names[m]; }` (b) `std::string_view trimmed(std::string s) { return std::string_view{s}.substr(1); }`
:::

::: answer
(a) is safe for `m` from 0 to 2. The views point at string literals, which live for the whole run of the program, so returning them is fine. (b) is a bug. `s` is a by-value parameter: a local copy that is destroyed when the function returns. The returned view points into it and dangles immediately. Returning `std::string` (by value) fixes it, at the cost of a copy.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| View | a small object pointing at elements it does not own | cheap to copy; keeps nothing alive |
| `std::span<T>` | pointer plus size over contiguous elements | 16 bytes; built from C array, `std::array`, `std::vector` |
| `std::span<const T>` | read-only span | the usual parameter type |
| Fixed extent | `std::span<T, N>`, length in the type | 8 bytes; wrong length is a compile error |
| Slices | `first(n)`, `last(n)`, `subspan(off, n)` | new views, no copies |
| `s[i]` | element access | not bounds-checked |
| `std::string_view` | pointer plus length over characters | right type for read-only text parameters |
| Not null-terminated | a view ends at its count | print with `%.*s`; copy to `std::string` for C APIs |
| Dangling view | owner died or reallocated | undefined behavior; ASan reports heap-use-after-free |
| Safe use | views as parameters | store or return only views of static data, or documented lifetimes |

Next lesson: four small class templates that each hold a value in a new shape — `std::optional` for "maybe a value", `std::variant` for "one of these", `std::tuple` and `std::pair` for "several at once", and `std::bitset` for a word full of on-off flags.

::: context contiguous Side by side, no gaps
Contiguous means the elements sit one right after another in memory, like houses on a street with no empty lots between them. Knowing where the first one is and how big each one is, you can compute where any other one is: element $i$ is at the start address plus $i$ times the element size. That arithmetic is the only thing a span knows how to do, which is why it can view a vector but not a linked list.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">vector's buffer (each box a double, 8 bytes)</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="20" y="30" width="50" height="30"/><rect x="70" y="30" width="50" height="30"/>
    <rect x="120" y="30" width="50" height="30"/><rect x="170" y="30" width="50" height="30"/>
    <rect x="220" y="30" width="50" height="30"/><rect x="270" y="30" width="50" height="30"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="45" y="50">9.78</text><text x="95" y="50">9.80</text><text x="145" y="50">9.83</text>
    <text x="195" y="50">9.81</text><text x="245" y="50">9.79</text><text x="295" y="50">9.80</text>
  </g>
  <rect x="70" y="26" width="200" height="38" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="70" y1="100" x2="70" y2="68" stroke="#b4232c" stroke-width="2"/>
  <polygon points="70,64 65,74 75,74" fill="#b4232c"/>
  <text x="80" y="100" font-size="12" fill="#b4232c">subspan(1, 4): pointer to element 1, size 4</text>
  <text x="80" y="118" font-size="12" fill="#6c7a93">no copy: the red frame is just an address and a count</text>
</svg>
```
:::

::: context power-of-ten Ten rules for code that must not fail
In 2006 Gerard Holzmann of NASA's Jet Propulsion Laboratory published "The Power of Ten", ten short rules for safety-critical code. Rule 3 says not to use dynamic memory allocation after initialization. The reasons are that allocators can take unpredictable time, can fail when memory is fragmented, and hide the lifetime bugs this lesson is about. JPL's own C coding standard builds on these rules, and C++ flight standards such as the JSF Air Vehicle C++ rules and MISRA C++ make the same demand. Views fit that world well: they let you pass buffers around without ever allocating.
:::

::: context gsl-span Where span came from
The C++ Core Guidelines, a public set of coding advice led by Bjarne Stroustrup and Herb Sutter, recommended passing a span instead of a pointer and a count years before the standard had one. To make that advice usable, they came with a small companion library, the Guidelines Support Library, whose `gsl::span` was widely used in real code. Its experience shaped `std::span`, which arrived in C++20. You may still meet `gsl::span` in older codebases; it is the same idea.
:::

::: context extent-name Why "extent"
The standard already used the word extent for the size of an array along one of its dimensions: `std::extent` is a tool that reports it. A dynamic span stores its size at run time, and its type uses a special marker for "no size in the type": `std::dynamic_extent`, which is the largest value a `std::size_t` can hold. A fixed span keeps the size in the type, so the object is one pointer.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">std::span&lt;const double&gt; (16 bytes)</text>
  <rect x="10" y="28" width="120" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="130" y="28" width="120" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="47" font-size="12" fill="#1f2a44" text-anchor="middle">pointer</text>
  <text x="190" y="47" font-size="12" fill="#1f2a44" text-anchor="middle">size</text>
  <text x="10" y="78" font-size="12" fill="#1f2a44">std::span&lt;const double, 3&gt; (8 bytes)</text>
  <rect x="10" y="84" width="120" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="100" font-size="12" fill="#1f2a44" text-anchor="middle">pointer</text>
  <text x="140" y="100" font-size="12" fill="#6c7a93">size 3 lives in the type</text>
</svg>
```
:::

::: context null-terminated The zero at the end
C strings have no length stored anywhere. Instead, the last character is followed by a byte with value zero, written `'\0'`, and every C function walks forward until it hits it. A `std::string` always keeps that zero after its text, which is why `c_str()` is safe to hand to C. A view of part of a string has no zero at its own end: the next byte is simply the next character of the bigger string.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1" fill="#ffffff">
    <rect x="10" y="30" width="30" height="26"/><rect x="40" y="30" width="30" height="26"/><rect x="70" y="30" width="30" height="26"/>
    <rect x="100" y="30" width="30" height="26"/>
    <rect x="130" y="30" width="30" height="26" fill="#8fb8f0"/><rect x="160" y="30" width="30" height="26" fill="#8fb8f0"/>
    <rect x="190" y="30" width="30" height="26" fill="#8fb8f0"/><rect x="220" y="30" width="30" height="26" fill="#8fb8f0"/>
    <rect x="250" y="30" width="30" height="26"/><rect x="280" y="30" width="30" height="26"/>
    <rect x="310" y="30" width="40" height="26" fill="#f2b880"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="25" y="48">A</text><text x="55" y="48">R</text><text x="85" y="48">M</text><text x="115" y="48">_</text>
    <text x="145" y="48">P</text><text x="175" y="48">Y</text><text x="205" y="48">R</text><text x="235" y="48">O</text>
    <text x="265" y="48">_</text><text x="295" y="48">3</text><text x="330" y="48">\0</text>
  </g>
  <text x="190" y="20" font-size="12" fill="#1d6fd1" text-anchor="middle">view: 4 chars, PYRO</text>
  <text x="10" y="80" font-size="12" fill="#b4232c">%s starts at P and stops only at the \0: PYRO 3</text>
  <text x="10" y="96" font-size="11" fill="#6c7a93">( _ marks a space )</text>
</svg>
```
:::

::: context temporary-lifetime When a temporary dies
A temporary is an unnamed object the compiler makes to hold an intermediate result, such as the `std::string` a function returns before you store it anywhere. The rule is that it is destroyed at the end of the full expression that created it — roughly, at the semicolon. That is why `std::printf("%zu", make_label(0, "x").size());` is fine (the string is used and then dies), while keeping a view of it past the semicolon is not.
:::

::: context bridge-invalidation Coming up in lesson 06
When a container moves or destroys elements, the pointers, references and iterators into it can become invalid. Spans and views are one more kind of pointer, so they follow exactly the same rules. Lesson 06 gives the full table: which operations on `vector`, `deque`, `list`, `map` and `unordered_map` leave your handles safe, and which ones pull the house down.
:::

::: context sso Short strings live inside the string
A `std::string` object is 32 bytes in libstdc++, the standard library that ships with g++. Rather than always allocating, it keeps short text — up to 15 characters there — in a small buffer inside those 32 bytes, and only goes to the heap for longer text. This is the short-string optimization. It saves an allocation for most short names, but it means a dangling view of a short string points into a dead object on the stack rather than into freed heap memory. The bug is identical; ASan names it differently.
:::

::: context dangling-gsl What the compilers can and cannot see
clang's warning is called `-Wdangling-gsl`, and for this program it said: "object backing the pointer will be destroyed at the end of the full-expression". It works because clang knows that `std::string_view` is a view type and `std::string` an owner (it tags them with the Core Guidelines' "Pointer" and "Owner" labels), so it can spot a view built from a dying owner on a single line. Tracking lifetimes across function calls, member variables and later `push_back` calls is far harder, and no mainstream compiler does it fully. The name comes from the Core Guidelines, whose support library is called GSL.
:::
