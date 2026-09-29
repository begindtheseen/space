---
id: l03-inspecting-state-in-gdb
title: Looking inside a stopped program
minutes: 19
covers:
  - info args, info locals, info registers, print, p *ptr@n, x/16xb
---

At a checkup, a doctor starts from the outside. She reads your temperature and your blood pressure: single numbers with names. If something looks off, she orders an X-ray, which shows what is really inside, bone by bone, with no labels at all. You need both. The numbers tell you where to look, and the X-ray tells you what is actually there.

Lesson 02 taught gdb to stop a program at the right moment. This lesson is about the checkup once it has stopped. You will read variables by name with `info args`, `info locals` and `print`. You will look at whole arrays behind a pointer with `p *ptr@n`. You will take the X-ray with `x`, which shows raw bytes in memory. And you will read the processor's own **[[registers|registers-word]]**, which is what you fall back on when a program has no debug information at all.

These are the commands that turn "the state vector is wrong" into "bytes 32 to 47 of the state vector are in the wrong order". On a GNC team, data arrives from sensors, radios and other computers as raw bytes, so looking at bytes is not an unusual skill. It is daily work.

## The program and the symptom

A ground tool receives a **[[telemetry|telemetry-word]]** frame from a spacecraft: six numbers, position in meters and velocity in meters per second, each sent as an 8-byte `double` in **[[big-endian|endian-word]]** order (most significant byte first, the usual network order). The tool unpacks them into a state vector and checks that they are plausible for a spacecraft in low Earth orbit.

```cpp
// telem.cpp: unpack a big-endian telemetry frame into a state vector.
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cstring>

// Read 8 big-endian bytes as a double.
double be_to_double(const uint8_t* p) {
    uint64_t u = 0;
    for (int i = 0; i < 8; ++i) u = (u << 8) | p[i];
    double d;
    std::memcpy(&d, &u, 8);
    return d;
}

// Write a double as 8 big-endian bytes (what the flight computer sends).
void double_to_be(double d, uint8_t* p) {
    uint64_t u;
    std::memcpy(&u, &d, 8);
    for (int i = 7; i >= 0; --i) { p[i] = u & 0xff; u >>= 8; }
}

void unpack(const uint8_t* frame, double* state, int n) {
    for (int i = 0; i < 3; ++i)                 // position, meters
        state[i] = be_to_double(frame + 8 * i);
    for (int i = 3; i < n; ++i)                 // velocity, m/s (added later)
        std::memcpy(&state[i], frame + 8 * i, 8);
}

bool check_state(const double* state, int n) {
    double r = std::sqrt(state[0]*state[0] + state[1]*state[1] + state[2]*state[2]);
    double v = std::sqrt(state[3]*state[3] + state[4]*state[4] + state[5]*state[5]);
    bool ok = (r > 6.3e6 && r < 5.0e7) && (v > 1.0e3 && v < 1.2e4);
    std::printf("n=%d r=%.1f m v=%.6g m/s -> %s\n", n, r, v, ok ? "ok" : "REJECT");
    return ok;
}

int main() {
    const double truth[6] = {6778137.0, 0.0, 0.0, 0.0, 7668.56, 12.5};
    uint8_t frame[48];
    for (int i = 0; i < 6; ++i) double_to_be(truth[i], frame + 8 * i);

    double* state = new double[6];
    unpack(frame, state, 6);
    bool ok = check_state(state, 6);
    delete[] state;
    return ok ? 0 : 1;
}
```

`main` plays the part of the spacecraft: it packs a known true state into a frame, so we know what the answer should be. The truth is a spacecraft 400 km up: radius $6{,}378{,}137 + 400{,}000 = 6{,}778{,}137$ m from Earth's center, moving at 7,668.56 m/s, the speed of a [[circular orbit|circular-orbit-speed]] at that height. Build and run:

```text
$ g++ -g -O0 -Wall -Wextra -o telem telem.cpp
$ ./telem
n=6 r=6778137.0 m v=2.43931e+19 m/s -> REJECT
```

The radius is exactly right. The speed is $2.4 \times 10^{19}$ m/s, roughly 80 billion times the speed of light. The program did not crash; it gave a wrong number. So we stop it with a breakpoint and look.

## info args and info locals: the named variables

Two commands list every named variable in the selected frame at once.

- **`info args`** prints the function's arguments.
- **`info locals`** prints its local variables.

::: example A first look inside check_state
```text
(gdb) break check_state
Breakpoint 1 at 0x137e: file telem.cpp, line 31.
(gdb) run
Breakpoint 1, check_state (state=0x55555556b2b0, n=6) at telem.cpp:31
31	    double r = std::sqrt(state[0]*state[0] + state[1]*state[1] + state[2]*state[2]);
(gdb) info args
state = 0x55555556b2b0
n = 6
(gdb) info locals
r = 6.9533558071634703e-310
v = 6.9533558071634703e-310
ok = false
```

The arguments look sensible: a [[heap pointer|address-map]] and $n = 6$. But the locals are nonsense, and that is expected. A breakpoint stops **before** its line runs, so line 31 has not computed `r` yet. The locals hold whatever bytes were already in that stack memory. In a fresh session, stop three lines later instead, at line 34, and they are real:

```text
(gdb) break telem.cpp:34
(gdb) run
Breakpoint 1, check_state (state=0x55555556b2b0, n=6) at telem.cpp:34
(gdb) info locals
r = 6778137
v = 2.439312395553656e+19
ok = false
```

`r` is right, `v` is huge. The trouble is in `state[3]`, `state[4]` or `state[5]`, the velocity.
:::

::: key
**gdb: bt, frame N, info locals.** `bt` prints the call stack; `frame N` selects a stack frame so that `print` and `info` operate in its scope; `info locals` dumps that frame's local variables. This trio answers most crash questions.
:::

::: warning A local before its line has run is garbage
When `info locals` shows wild values like `6.95e-310` or `-1431655766`, first check whether the line that sets them has run yet. Stack memory is reused from call to call, so an unset local shows leftovers from an earlier call. This is also exactly what an **uninitialized variable** bug looks like when the program really does use it before setting it.
:::

## print: any expression, in any frame

**`print`** (short **`p`**) evaluates a C++ expression in the selected frame and shows the result. It is not limited to plain variable names:

```text
(gdb) print r / 1000
$1 = 6778.1369999999997
(gdb) print v > 1.2e4
$2 = true
```

(`6778.1369999999997` is how gdb shows the nearest `double` to 6778.137, which cannot be stored exactly in binary.)

It can even call your program's functions. Move `up` to `main`, where the raw `frame` array lives, and ask what the velocity bytes should decode to:

```text
(gdb) up
#1  0x00005555555555c0 in main () at telem.cpp:45
45	    bool ok = check_state(state, 6);
(gdb) print be_to_double(frame + 32)
$3 = 7668.5600000000004
(gdb) print be_to_double(frame + 40)
$4 = 12.5
```

The frame itself carries the right velocity. Decoded properly, bytes 32 to 39 are 7,668.56 m/s and bytes 40 to 47 are 12.5 m/s. So the telemetry is fine, and the damage happens between the frame and the state vector.

`print` also takes a **format** after a slash, `print/F expr`:

| Format | Shows | Example | Result |
| --- | --- | --- | --- |
| `/x` | hexadecimal | `print/x 255` | `0xff` |
| `/d` | signed decimal | `print/d 0x40` | `64` |
| `/t` | binary | `print/t 10` | `1010` |
| `/c` | character | `print/c 65` | `65 'A'` |

With gdb 15.1, `/x` on a `double` shows the 8 bytes of its storage as one hex number: `print/x 7668.56` gives `0x40bdf48f5c28f5c3`. Keep that number in mind.

Two relatives help when you are not sure what something is: **`whatis state`** prints its type (`const double *`), and **`ptype`** prints the full definition of a type, including every field of a struct.

::: warning Names belong to frames
After `up`, you are in `main`, and `check_state`'s variables are out of reach. `print *state@n` there fails with `No symbol "n" in current context.`, because `n` is an argument of `check_state`, not a variable of `main`. When `print` cannot find a name, check which frame is selected (`frame` with no number tells you) before deciding the variable does not exist.
:::

## p *ptr@n: arrays behind a pointer

`state` is a `double*`, a pointer to the first of six doubles on the heap. Printing it gives only the address, and `*state` gives only the first element. gdb cannot know how many elements follow; C++ does not record it. You tell it with the **`@`** operator. Read `*state@6` as "six elements starting at `*state`".

::: example The whole state vector in one line
```text
(gdb) print state
$1 = (const double *) 0x55555556b2b0
(gdb) print *state
$2 = 6778137
(gdb) print *state@6
$4 = {6778137, 0, 0, 0, -2.439312395553656e+19, 5.2173332200835635e-320}
(gdb) print state[3]@3
$5 = {0, -2.439312395553656e+19, 5.2173332200835635e-320}
```

Compare with the truth, `{6778137, 0, 0, 0, 7668.56, 12.5}`:

1. Elements 0 to 3 match. Element 3 is zero in both.
2. Element 4 should be 7,668.56 and is $-2.44 \times 10^{19}$.
3. Element 5 should be 12.5 and is $5.2 \times 10^{-320}$, a [[number so tiny|subnormal]] it is almost zero.

`state[3]@3` shows that the left side can be any element, not only `*ptr`: it prints the three velocity components. The pattern is "position fine, velocity garbage", and position and velocity come from different loops in `unpack`.

Sanity check: the speed from the bad values is $\sqrt{0^2 + (2.44 \times 10^{19})^2 + (5.2 \times 10^{-320})^2} \approx 2.44 \times 10^{19}$, which is the `v` that `info locals` showed. The two views agree.
:::

::: key
`p *ptr@n` prints `n` elements starting at `*ptr`. `p arr[i]@k` prints `k` elements starting at index `i`. Without `@`, gdb shows only the address or the first element.
:::

## x: the raw bytes

`print` interprets memory as the type the program says it is. Sometimes the type is the lie, and you need to see the bytes themselves. **`x`**, short for "examine", dumps raw memory starting at an address. Its shape is `x/NFU address`:

- **N**: how many units to show.
- **F**: the format: `x` hex, `d` decimal, `f` floating point, `c` characters, `s` a string, `i` machine instructions.
- **U**: the unit size: `b` byte (1), `h` halfword (2), `w` word (4), `g` giant (8).

So **`x/16xb addr`** reads "examine 16 units, in hex, one byte each, starting at addr". The address must be an address, so you usually write `&` in front of a variable, or use a pointer.

Now recall from the memory module that x86-64 is **little-endian**: a multi-byte number is stored with its least significant byte at the lowest address. A correctly stored 7,668.56, whose [[bit pattern|double-bits]] is `0x40bdf48f5c28f5c3`, sits in memory as `c3 f5 28 5c 8f f4 bd 40`: the same bytes, last one first.

::: example Seeing the bytes in the wrong order
First, a healthy element for comparison, `state[0]` (6,778,137):

```text
(gdb) x/8xb &state[0]
0x55555556b2b0:	0x00	0x00	0x00	0x40	0x46	0xdb	0x59	0x41
```

Read backwards, that is `0x4159db4640000000`, which is 6,778,137 as a `double`. The `0x41` exponent byte comes last, where little-endian puts it. Now the velocity, 16 bytes starting at `state[4]`:

```text
(gdb) x/16xb &state[4]
0x55555556b2d0:	0x40	0xbd	0xf4	0x8f	0x5c	0x28	0xf5	0xc3
0x55555556b2d8:	0x40	0x29	0x00	0x00	0x00	0x00	0x00	0x00
```

The first row is `40 bd f4 8f 5c 28 f5 c3`: the bytes of 7,668.56, but in **big-endian** order, exactly as they came off the wire. The second row, `40 29 00 ...`, is 12.5 in big-endian (12.5 is `0x4029000000000000`). The program read these bytes as little-endian, so it built a completely different number:

- read as little-endian, `40 bd f4 8f 5c 28 f5 c3` means `0xc3f5285c8ff4bd40`, which is about $-2.44 \times 10^{19}$ (the top bit is 1, so it is negative);
- `40 29 00 00 00 00 00 00` means `0x0000000000002940`, a tiny number near $5.2 \times 10^{-320}$.

Both match what `print *state@6` showed. And `x/16xb frame+32` in `main` shows the identical 16 bytes in the frame, so `unpack` copied the velocity **without swapping the byte order**. Look at `unpack` again: the position loop calls `be_to_double`, but the velocity loop, "added later", uses a plain `memcpy`. Found it.
:::

`x` has other useful shapes. `x/5fg f.x` shows five 8-byte floats; aimed at the `Filter` from lesson 02 while it was stopped in `step`, it prints:

```text
(gdb) x/5fg f.x
0x7fffffffc980:	100	0.20000000000000001
0x7fffffffc990:	0.080000000000000016	1.004
0x7fffffffc9a0:	0.00040000000000000002
```

The fifth "state", at `0x7fffffffc9a0`, is 0.0004, and that address is where the `imu` pointer lives. `x/8xb &f.imu` shows its bytes, `2d 43 1c eb e2 36 3a 3f`, which read backwards are `0x3f3a36e2eb1c432d`: the garbage pointer from lesson 02's crash, now proved to be the number 0.0004 written over it.

::: warning x wants an address, print wants a value
`x/8xb state[4]` is wrong: `state[4]` is a `double` value, and gdb will treat that number as an address. Write `x/8xb &state[4]`, or `x/8xb state+4` (pointer arithmetic, 4 elements past `state`). If `x` answers `Cannot access memory at address ...`, you probably passed a value where an address belongs.
:::

## info registers: the processor's own variables

Under all the C++ names, the processor works on a small set of **registers**, tiny storage slots built into the chip itself. On x86-64 there are sixteen general-purpose 64-bit registers plus special ones. A few are worth knowing by name:

- **`rip`**, the instruction pointer: the address of the next instruction to run.
- **`rsp`**, the stack pointer: the current top of the stack.
- **`rdi`**, **`rsi`**: on 64-bit Linux, the first and second integer or pointer arguments of a function are passed in these, by the [[calling convention|calling-convention]].
- **`rax`**: used for return values and as a general scratch register.

**`info registers`** shows them all; name some to see only those. In expressions, write them with a dollar sign: `$rip`, `$rsp`, `$pc` (another name for the instruction pointer).

```text
(gdb) info registers rip rsp rdi rsi
rip            0x55555555537e      0x55555555537e <check_state(double const*, int)+19>
rsp            0x7fffffffc900      0x7fffffffc900
rdi            0x55555556b2b0      93824992326320
rsi            0x6                 6
```

That was taken at the breakpoint on `check_state`, right at the start of the function. `rdi` holds `0x55555556b2b0`, the `state` pointer, and `rsi` holds 6, the `n` argument: the two arguments, exactly where the calling convention put them. `rip` is 19 bytes into `check_state`. Each register is printed twice: raw hex, then a natural reading (a decimal number, or a code address with its function name).

With `-g` you rarely need registers, because names are easier. They earn their place when names are gone.

::: example Debugging a crash with no debug information
Build lesson 02's `nav.cpp` **without** `-g`, as a release binary from a supplier might be, and run it in gdb:

```text
$ g++ -O0 -o nav_nosym nav.cpp
$ gdb -q ./nav_nosym
(gdb) run
Program received signal SIGSEGV, Segmentation fault.
0x000055555555517e in read_gyro(Imu const*, double) ()
(gdb) bt
#0  0x000055555555517e in read_gyro(Imu const*, double) ()
#1  0x000055555555529a in step(Filter&, double, double) ()
#2  0x0000555555555389 in main ()
(gdb) print imu
No symbol "imu" in current context.
```

Function names survive (they are in the binary's [[symbol table|symbol-table]]), but there are no line numbers and no variable names. So ask the processor what it was doing:

```text
(gdb) x/i $pc
=> 0x55555555517e <_Z9read_gyroPK3Imud+21>:	movsd  (%rax),%xmm1
(gdb) info registers rax rdi
rax            0x3f3a36e2eb1c432d  4556014321273684781
rdi            0x3f3a36e2eb1c432d  4556014321273684781
```

`x/i $pc` examines one instruction at the program counter. `movsd (%rax),%xmm1` means "load the 8-byte double stored at the address in `rax`", written in [[AT&T syntax|att-syntax]]. The parentheses mean "the memory at". So the crash is a load through `rax`, and `rax` holds `0x3f3a36e2eb1c432d`: the same garbage pointer as in lesson 02. `rdi`, the first argument, holds it too, so `read_gyro` was handed the bad pointer by its caller.

Sanity check: this is the same value that `print imu` showed in the `-g` build. Registers told the same story, only with less help.
:::

::: key
With debug information, the value of a pointer in a crashing frame comes from selecting the frame (`frame N`) and `print`-ing it. Without debug information, `x/i $pc` shows the faulting instruction and `info registers` shows the address it used.
:::

## The fix, and the checkup routine

The velocity loop must decode the same way as the position loop. One loop does both:

```cpp
void unpack(const uint8_t* frame, double* state, int n) {
    for (int i = 0; i < n; ++i)                 // position, then velocity
        state[i] = be_to_double(frame + 8 * i);
}
```

```text
$ ./telem_fixed
n=6 r=6778137.0 m v=7668.57 m/s -> ok
```

Check: $\sqrt{7668.56^2 + 12.5^2} \approx 7668.570$ m/s, printed to six significant figures as `7668.57`. The small 12.5 m/s component barely changes the total, as a sideways nudge should.

Put together, a checkup of a stopped program usually runs in this order: `bt` to see where you are; `frame N` to pick the call that matters; `info args` and `info locals` for the named values; `print` for expressions, function calls and arrays with `@`; `x` when you suspect the bytes do not mean what the type says; and registers when there are no names at all.

## Check yourself

::: check
`buf` is a `float*` pointing at 10 floats. Write the gdb commands to print all 10 as numbers, then the last three, then the raw bytes of the first one.
:::

::: answer
`print *buf@10` prints all ten. `print buf[7]@3` prints elements 7, 8 and 9. A `float` is 4 bytes, so `x/4xb buf` (or `x/4xb &buf[0]`) shows the raw bytes of the first one. `x/10fw buf` would also print all ten as 4-byte floats straight from memory.
:::

::: check
At a breakpoint on the first line of a function, `info locals` shows `count = 21845` and `sum = 4.6e-310`. Is the function broken?
:::

::: answer
Not necessarily. A breakpoint stops before its line runs, so if `count` and `sum` are set on or after this line, they have not been assigned yet and hold leftover stack bytes. Step past the lines that set them (or break a few lines later) and look again. It is only a bug if the program reads them before assigning them.
:::

::: check
The `double` 1.0 has the bit pattern `0x3ff0000000000000`. What does `x/8xb &d` print for `double d = 1.0;` on x86-64, and why?
:::

::: answer
`0x00 0x00 0x00 0x00 0x00 0x00 0xf0 0x3f`. x86-64 is little-endian: the least significant byte is stored at the lowest address, so the bytes appear in reverse order of the hex number. The two meaningful bytes, `3f f0`, come last, as `f0 3f`.
:::

::: check
You are in frame 0 of a crash, and `print cfg->rate` fails with `No symbol "cfg" in current context.` The program was built with `-g`. Give two possible reasons.
:::

::: answer
First, `cfg` may belong to a different frame: frame 0 might be a library function, and `cfg` is a variable of your function further up. Use `bt` to find it, then `frame N`. Second, the frame might be inside code built without `-g` (a system library, for example), where no local names exist even though your own files have them. In both cases, `bt` shows which frames have file and line information.
:::

::: check
In the no-debug-info example, `rax` and `rdi` both held `0x3f3a36e2eb1c432d`. Why is seeing it in `rdi` a stronger clue than seeing it in `rax`?
:::

::: answer
By the calling convention, `rdi` carries a function's first argument when it is called. Finding the bad value there suggests it arrived from the caller, so `read_gyro` did not create it. `rax` is a scratch register; it only shows the address this particular instruction used. Together they say: the caller passed a bad pointer, and the crash is the first time anyone dereferenced it. (After a function has been running a while, `rdi` may have been reused, so this reading is safest near the start of a function.)
:::

## Summary

| Command | What it shows | Example |
| --- | --- | --- |
| `info args` | the selected frame's arguments | `info args` |
| `info locals` | the selected frame's local variables | `info locals` |
| `print expr` | any expression, even a function call | `print be_to_double(frame + 32)` |
| `print/x`, `/d`, `/t`, `/c` | a value in hex, decimal, binary, character | `print/x 255` |
| `p *ptr@n` | `n` elements starting at `*ptr` | `p *state@6` |
| `x/NFU addr` | raw memory: count, format, unit size | `x/16xb &state[4]` |
| `x/i $pc` | the instruction about to run | `x/i $pc` |
| `info registers` | processor registers | `info registers rip rsp rdi` |
| `whatis`, `ptype` | a value's type, a type's definition | `whatis state` |

You can now stop a program, find where it is, and read everything in it. Lesson 04 makes it move again under your control: `step`, `next`, `finish` and `until` to walk through code one line at a time, `display` to watch values change as you go, and `set var` to change a value and test a hypothesis without recompiling.

::: context registers-word The fastest memory there is
A register is a storage slot inside the processor itself. Reading one takes well under a nanosecond; reading main memory can take a hundred times longer. So the compiler keeps the values it is working on in registers and moves them to and from memory as needed. With `-O0`, it writes each variable back to memory after every line, which is why gdb can always find it. With optimization on, a variable may live only in a register, or only for a few instructions, and gdb reports it as `<optimized out>`.
:::

::: context telemetry-word Measurements sent from far away
Telemetry comes from Greek words meaning "far" and "measure". It is the stream of numbers a vehicle sends to the ground: positions, temperatures, pressures, voltages, software status. It is sent as compact binary frames, not text, because radio bandwidth is precious. Every frame has a fixed layout (which bytes hold which number, in what byte order and units), written down in an interface document that both the flight and the ground software must follow exactly. A mismatch in that layout is one of the most common bugs in ground tools.
:::

::: context endian-word Which end goes first
The words come from Jonathan Swift's *Gulliver's Travels* (1726), where two nations go to war over whether to crack a boiled egg at the big end or the little end. The computer scientist Danny Cohen borrowed them in 1980 for the argument over byte order. Big-endian stores the most significant byte first, the way we write numbers; little-endian stores the least significant byte first. x86-64 and most ARM systems run little-endian, while network protocols and many telemetry formats are big-endian, so every byte that crosses between them must be swapped once, and only once.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">7668.56 = 0x40bdf48f5c28f5c3</text>
  <text x="10" y="50" font-size="11" fill="#1f2a44">big-endian</text>
  <text x="10" y="95" font-size="11" fill="#1f2a44">little-endian</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="90" y="36" width="30" height="22" fill="#f2b880" stroke="#1f2a44"/><text x="105" y="51">40</text>
    <rect x="120" y="36" width="30" height="22" fill="#ffffff" stroke="#1f2a44"/><text x="135" y="51">bd</text>
    <rect x="150" y="36" width="30" height="22" fill="#ffffff" stroke="#1f2a44"/><text x="165" y="51">f4</text>
    <rect x="180" y="36" width="30" height="22" fill="#ffffff" stroke="#1f2a44"/><text x="195" y="51">8f</text>
    <rect x="210" y="36" width="30" height="22" fill="#ffffff" stroke="#1f2a44"/><text x="225" y="51">5c</text>
    <rect x="240" y="36" width="30" height="22" fill="#ffffff" stroke="#1f2a44"/><text x="255" y="51">28</text>
    <rect x="270" y="36" width="30" height="22" fill="#ffffff" stroke="#1f2a44"/><text x="285" y="51">f5</text>
    <rect x="300" y="36" width="30" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="315" y="51">c3</text>
    <rect x="90" y="81" width="30" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="105" y="96">c3</text>
    <rect x="120" y="81" width="30" height="22" fill="#ffffff" stroke="#1f2a44"/><text x="135" y="96">f5</text>
    <rect x="150" y="81" width="30" height="22" fill="#ffffff" stroke="#1f2a44"/><text x="165" y="96">28</text>
    <rect x="180" y="81" width="30" height="22" fill="#ffffff" stroke="#1f2a44"/><text x="195" y="96">5c</text>
    <rect x="210" y="81" width="30" height="22" fill="#ffffff" stroke="#1f2a44"/><text x="225" y="96">8f</text>
    <rect x="240" y="81" width="30" height="22" fill="#ffffff" stroke="#1f2a44"/><text x="255" y="96">f4</text>
    <rect x="270" y="81" width="30" height="22" fill="#ffffff" stroke="#1f2a44"/><text x="285" y="96">bd</text>
    <rect x="300" y="81" width="30" height="22" fill="#f2b880" stroke="#1f2a44"/><text x="315" y="96">40</text>
  </g>
  <text x="90" y="122" font-size="11" fill="#6c7a93">lowest address</text>
  <text x="330" y="122" font-size="11" fill="#6c7a93" text-anchor="end">highest address</text>
</svg>
```
:::

::: context circular-orbit-speed Where 7,668.56 m/s comes from
For a circular orbit, gravity supplies exactly the pull needed to keep the spacecraft curving around Earth. Setting the two equal gives $v = \sqrt{\mu / r}$, where $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ is Earth's gravitational parameter and $r$ is the distance from Earth's center. With $r = 6{,}778{,}137$ m (400 km up, about where the International Space Station flies), $v = \sqrt{3.986 \times 10^{14} / 6{,}778{,}137} \approx 7{,}669$ m/s. That is why the checker accepts speeds between 1 and 12 km/s: anything in orbit around Earth falls in that range.
:::

::: context address-map Why addresses start with 0x5555 or 0x7fff
A 64-bit Linux program sees its own private map of memory. Under gdb, which turns off address randomization, the program's code is loaded near `0x555555554000`, and the heap, where `new` gets memory, grows upward from right after it. That is why `state = 0x55555556b2b0` is recognizably a heap address. The stack starts near the top of the user half of the address space, a little below `0x7ffffffff000`, and grows downward, so stack addresses look like `0x7fffffffc900`. A pointer that looks like neither, such as `0x3f3a36e2eb1c432d`, is a strong hint it is not a pointer at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="10" width="140" height="150" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="100" y="10" width="140" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="170" y="29" font-size="12" fill="#1f2a44" text-anchor="middle">stack</text>
  <text x="250" y="22" font-size="11" fill="#1f2a44">0x7fff...</text>
  <text x="250" y="36" font-size="11" fill="#6c7a93">grows down</text>
  <text x="170" y="90" font-size="11" fill="#6c7a93" text-anchor="middle">unused gap</text>
  <rect x="100" y="115" width="140" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <text x="170" y="129" font-size="12" fill="#1f2a44" text-anchor="middle">heap</text>
  <text x="250" y="126" font-size="11" fill="#6c7a93">grows up</text>
  <rect x="100" y="135" width="140" height="25" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="170" y="152" font-size="12" fill="#1f2a44" text-anchor="middle">code and data</text>
  <text x="250" y="152" font-size="11" fill="#1f2a44">0x5555...</text>
  <text x="10" y="22" font-size="11" fill="#6c7a93">high</text>
  <text x="10" y="152" font-size="11" fill="#6c7a93">low</text>
</svg>
```
:::

::: context subnormal Numbers smaller than the smallest
The smallest ordinary positive `double` is about $2.2 \times 10^{-308}$. Below that, IEEE 754 allows **subnormal** numbers, which give up precision to reach even closer to zero, down to about $4.9 \times 10^{-324}$. A small integer or a pointer's high bytes, read as if they were a `double`, usually land in this range, because their top bits (where a `double` keeps its exponent) are all zero. So when you see a value like `5.2e-320` or `6.95e-310`, suspect bytes that were never a floating-point number, not a physical quantity that happens to be tiny.
:::

::: context double-bits What the 64 bits of a double mean
A `double` is split into three fields: 1 sign bit, 11 exponent bits and 52 fraction bits. The value is $(-1)^{s} \times 1.f \times 2^{e - 1023}$. For `0x40bdf48f5c28f5c3`: the sign is 0 (positive), the exponent field is `0x40b` $= 1035$, so the power is $2^{1035 - 1023} = 2^{12} = 4096$, and the fraction makes $1.f \approx 1.872207$. Then $1.872207 \times 4096 \approx 7668.56$. Swap the bytes and the top bit becomes 1 and the exponent field 1087, which is why the misread velocity came out negative, at about $1.3 \times 2^{64}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="20" height="30" fill="#b4232c" stroke="#1f2a44"/>
  <rect x="30" y="30" width="80" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="110" y="30" width="240" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="20" y="22" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="70" y="22" font-size="11" fill="#1f2a44" text-anchor="middle">11 bits</text>
  <text x="230" y="22" font-size="11" fill="#1f2a44" text-anchor="middle">52 bits</text>
  <text x="20" y="80" font-size="11" fill="#1f2a44" text-anchor="middle">sign</text>
  <text x="70" y="80" font-size="11" fill="#1f2a44" text-anchor="middle">exponent</text>
  <text x="230" y="80" font-size="11" fill="#1f2a44" text-anchor="middle">fraction</text>
</svg>
```
:::

::: context calling-convention Who puts the arguments where
A calling convention is the agreement between a function and its callers about where arguments go and where the result comes back. On 64-bit Linux, the standard is the System V AMD64 ABI: the first six integer or pointer arguments go in `rdi`, `rsi`, `rdx`, `rcx`, `r8` and `r9`, floating-point arguments in `xmm0` to `xmm7`, and the result comes back in `rax` (or `xmm0` for a `double`). Windows uses a different convention. Knowing it lets you read arguments straight out of registers at a function's first instruction, even without debug information.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="180" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">check_state(state, n) at entry</text>
  <rect x="30" y="35" width="130" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="95" y="55" font-size="12" fill="#1f2a44" text-anchor="middle">rdi: 1st argument</text>
  <rect x="200" y="35" width="130" height="30" fill="#ffffff" stroke="#1f2a44"/>
  <text x="265" y="55" font-size="12" fill="#1f2a44" text-anchor="middle">state = 0x...b2b0</text>
  <line x1="160" y1="50" x2="200" y2="50" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="30" y="80" width="130" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="95" y="100" font-size="12" fill="#1f2a44" text-anchor="middle">rsi: 2nd argument</text>
  <rect x="200" y="80" width="130" height="30" fill="#ffffff" stroke="#1f2a44"/>
  <text x="265" y="100" font-size="12" fill="#1f2a44" text-anchor="middle">n = 6</text>
  <line x1="160" y1="95" x2="200" y2="95" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="136" font-size="11" fill="#6c7a93" text-anchor="middle">then rdx, rcx, r8, r9; doubles in xmm0 to xmm7</text>
</svg>
```
:::

::: context symbol-table Names without debug information
Even without `-g`, an executable usually keeps a symbol table: a list of function names and their addresses, used by the linker and by tools like gdb and `perf`. That is why `bt` could still say `read_gyro` and `step`. The odd name `_Z9read_gyroPK3Imud` is the **mangled** form C++ uses so that overloaded functions get unique names; gdb shows the readable version, `read_gyro(Imu const*, double)`. The `strip` command removes the symbol table too, leaving only addresses, which is why teams keep the unstripped build of every release archived.
:::

::: context att-syntax Reading one line of assembly
gdb shows x86 assembly in AT&T syntax by default: the source comes first and the destination last, registers get a `%`, and parentheses mean "the memory at this address". So `movsd (%rax),%xmm1` is "copy the double at address `rax` into register `xmm1`". Intel syntax writes the same instruction as `movsd xmm1, QWORD PTR [rax]`, destination first. Type `set disassembly-flavor intel` if you prefer that style. You do not need to write assembly to debug; you only need to find which register held the bad address.
:::
