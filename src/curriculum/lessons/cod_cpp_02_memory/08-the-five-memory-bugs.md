---
id: l08-the-five-memory-bugs
title: Five ways to use memory you do not own
minutes: 23
covers:
  - Dangling pointers, use-after-free, double free, buffer overrun, uninitialised reads
---

Imagine you check out of a hotel and forget to hand back the key card. Tonight the card might still open the door. The room might be empty, or it might already belong to a new guest, whose suitcase you are now rummaging through. Nothing stops you at the door. The mistake is real either way; what you see depends on luck.

Most memory corruption in C++ comes from five mistakes of exactly that kind:

- using a pointer to an object that has died (a **dangling pointer**);
- using heap memory after it was freed (a **use-after-free**);
- freeing the same block twice (a **double free**);
- writing past the end of a buffer (a **buffer overrun**);
- reading storage that was never given a value (an **uninitialized read**).

They have different causes. They share one property that makes them harder to learn than anything else in this module: all five are **[[undefined behavior|ub-name]]**. The language rules place no requirement at all on a program that does one of them. Whatever it appears to do is a fact about one build, on one machine, on one day. You cannot learn what a double free "does" by writing one and running it — and this lesson proves that by writing one, running it three ways, and getting three different results.

So the goal is not a list of symptoms. It is to know what each bug is, why the language refuses to define it, and how to produce real evidence that it happened. On a flight computer these bugs do not announce themselves: a corrupted gain or a stale sensor pointer makes the vehicle behave slightly wrong, long after the bad line ran.

## What undefined behavior allows the compiler to do

Undefined behavior works like a promise. You promise the compiler your program never does it. In return, the compiler is allowed to optimize as if you kept the promise. That is not a formality. Look at a function that seems careful:

```cpp
int reading_or_error(const int* p) {
    int v = *p;
    if (p == nullptr) return -1;
    return v;
}
```

Line 2 **dereferences** `p` — reads the `int` it points to. Dereferencing a null pointer is undefined, so after line 2 the compiler may assume `p` is not null. The check on line 3 then tests something that "cannot" be true, and code that can never run may be deleted.

At `-O0`, g++ 13.3.0 keeps the check. Here is the **[[assembly|reading-assembly]]** it emits, with bookkeeping lines removed:

```text
	mov	rax, QWORD PTR -24[rbp]
	mov	eax, DWORD PTR [rax]
	mov	DWORD PTR -4[rbp], eax
	cmp	QWORD PTR -24[rbp], 0
	jne	.L2
	mov	eax, -1
```

The `cmp ... 0` line compares `p` with zero; that is the null check. At `-O2` the entire function is this:

```text
_Z16reading_or_errorPKi:
	endbr64
	mov	eax, DWORD PTR [rdi]
	ret
```

Read the address in `rdi` (that is `p`), load the `int` there, and return. The null check is gone. The optimizer is not being hostile; your own code said, one line earlier, that the pointer is valid. This is how "I added a check and it still crashed" happens. The honest description of undefined behavior is not "anything might happen when it runs". It is "the code you wrote may not be the code that runs."

::: key
Undefined behavior is a contract: you promise not to do it, and the compiler optimizes as if you kept the promise. An observed result — a crash, a plausible number, a clean exit — is a fact about one build, never a fact about the language. Reason about what is undefined; use a sanitizer to produce evidence that it happened.
:::

## The same bug, three builds, three answers

::: example One double free, run three ways
Here is a program that frees one block twice. (`setvbuf` turns off output buffering so no printed line is lost if the program dies.)

```cpp
#include <cstdio>

struct Frame { double v[4]; };

int main() {
    std::setvbuf(stdout, nullptr, _IONBF, 0);   // unbuffered, so no line is lost
    Frame* f = new Frame{};
    std::printf("allocated\n");
    delete f;
    std::printf("deleted once\n");
    delete f;                                   // undefined behavior
    std::printf("deleted twice\n");
    return 0;
}
```

**Build 1, `g++ -O0`.** glibc's allocator notices the block is already sitting in its **[[tcache|tcache]]** of freed blocks, and stops the program:

```text
allocated
deleted once
free(): double free detected in tcache 2
```

The shell reports `Aborted` and **[[exit status 134|exit-134]]**.

**Build 2, `g++ -O1`.** The program prints all three lines and exits with status 0. Nothing is detected, because nothing happens. Listing the symbols in the object file with `nm -C` shows no mention of `operator new` or `operator delete` at all. The language lets a compiler **[[remove an allocation|allocation-elision]]** whose result nobody can observe. So the optimizer dropped the allocation and both frees. There is no double free in the program that ran, because there is no allocation in it.

**Build 3, `g++ -O0 -g -fsanitize=address`.** AddressSanitizer — ASan for short, the checking tool lesson 09 covers in full — reports:

```text
allocated
deleted once
=================================================================
==9168==ERROR: AddressSanitizer: attempting double-free on 0x503000000040 in thread T0:
    #0 0x7f92c0cff5e8 in operator delete(void*, unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:164
    #1 0x559543e6f37f in main l08-doublefree.cpp:11
    ...

0x503000000040 is located 0 bytes inside of 32-byte region [0x503000000040,0x503000000060)
freed by thread T0 here:
    #0 0x7f92c0cff5e8 in operator delete(void*, unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:164
    #1 0x559543e6f35a in main l08-doublefree.cpp:9
    ...

previously allocated by thread T0 here:
    #0 0x7f92c0cfe548 in operator new(unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:95
    #1 0x559543e6f2c0 in main l08-doublefree.cpp:7
    ...
```

(Each `...` stands for the three startup-library frames that end every trace. The process id and addresses change on every run.)

Exit status 1, and three line numbers: the second `delete` (line 11), the first one (line 9), and where the block came from (line 7). The region is 32 bytes because a `Frame` holds four 8-byte doubles: $4 \times 8 = 32$.

Here is a twist worth remembering. The same ASan build at `-O1` printed all three lines and exited 0, exactly like build 2. The optimizer had already deleted the allocation, so there was nothing left for the sanitizer to check. A sanitizer checks the program the compiler produced, not the source you wrote.

Three builds of one source: an abort, a clean run, and a precise diagnosis. Anyone who concludes from build 2 that "double-freeing a small object is harmless" has learned something false from a real experiment. That is the trap this module is written to help you avoid.
:::

## Dangling pointers and use-after-free

A **dangling pointer** holds the address of an object whose **lifetime** — the stretch of time the object exists — has ended. Using it is undefined. The two main ways to make one are freeing heap storage (then using it is a use-after-free) and a scope or function ending while someone still holds a local's address, which lessons 04 and 05 showed.

The version that surprises people coming from Python is the one where nothing looks like a free at all.

::: example A reference into a vector, and one push_back too many
```cpp
#include <cstdio>
#include <vector>

int main() {
    std::setvbuf(stdout, nullptr, _IONBF, 0);
    std::vector<double> az;
    az.push_back(-9.81);
    double& first = az[0];              // a reference into the vector's buffer
    std::printf("before: %.2f, capacity %zu\n", first, az.capacity());

    for (int i = 0; i < 8; ++i) az.push_back(-9.80);   // forces reallocation
    std::printf("after push_back: capacity %zu\n", az.capacity());
    first = -9.79;                      // undefined behavior
    std::printf("%.2f\n", az[0]);
    return 0;
}
```

Built with `-O1 -g -fno-omit-frame-pointer -fsanitize=address`:

```text
before: -9.81, capacity 1
after push_back: capacity 16
=================================================================
==9210==ERROR: AddressSanitizer: heap-use-after-free on address 0x502000000010 at pc 0x558546060b88 bp 0x7ffdee33ffe0 sp 0x7ffdee33ffd0
WRITE of size 8 at 0x502000000010 thread T0
    #0 0x558546060b87 in main l08-uaf.cpp:13
    ...

0x502000000010 is located 0 bytes inside of 8-byte region [0x502000000010,0x502000000018)
freed by thread T0 here:
    #0 0x7f2b95aff5e8 in operator delete(void*, unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:164
    ...
    #4 0x558546061199 in std::_Vector_base<double, std::allocator<double> >::_M_deallocate(double*, unsigned long) /usr/include/c++/13/bits/stl_vector.h:390
    #5 0x558546061199 in void std::vector<double, std::allocator<double> >::_M_realloc_insert<double>(__gnu_cxx::__normal_iterator<double*, std::vector<double, std::allocator<double> > >, double&&) /usr/include/c++/13/bits/vector.tcc:519
    ...
    #8 0x558546060a8b in main l08-uaf.cpp:11
    ...
```

(Frames 1–3 and 6–7 are more library layers, cut at the `...` lines. The numbers are the report's own, so `#4` really is the fifth frame.)

**Step 1: read the capacities.** The vector's **capacity** — how many elements its current buffer can hold — went from 1 to 16. That is the whole story. Nine elements cannot fit in a buffer sized for one, so the vector **[[allocated a bigger buffer|vector-growth]]**, copied the elements across, and freed the old buffer.

**Step 2: read the error line.** `first` still refers into the old buffer. Line 13 wrote 8 bytes (one `double`) into it.

**Step 3: read the free trace.** Nothing in your source says `delete`. The free happened inside `_M_realloc_insert`, the vector's "grow and insert" routine, and the lowest frame in *your* code is line 11, the `push_back` loop. That is why the deallocation trace is worth reading instead of skipping.

Built at `-O1` with no sanitizer, the same program printed `-9.81` and exited 0. The write went into the freed block, where nobody looked again. The read of `az[0]` came from the *new* buffer, which still held the copied value. A test checking `az[0] == -9.81` would pass.

The rule to carry: **any operation that can change a container's size can invalidate every pointer, reference and iterator into it.** For `std::vector` that is `push_back`, `emplace_back`, `insert`, `resize` and `reserve`. Hold an index instead of a reference, or take the reference after you finish growing. And note that this example took the reference *after* the first `push_back`: on an empty vector, `az[0]` is already out of bounds.
:::

::: key
A dangling reference is a reference to an object whose lifetime has ended. The classic is returning a reference or pointer to a local, or holding a reference into a vector that then reallocates on push_back.
:::

## Buffer overrun

Writing outside an object's bounds is undefined, whether the object is on the heap, on the stack, or static. The classic cause is `<=` where `<` was meant:

```cpp
#include <cstdio>

int main() {
    const int kCapacity = 8;
    double* telemetry = new double[kCapacity];
    for (int i = 0; i <= kCapacity; ++i) {      // <= : one too many
        telemetry[i] = -9.80 - 0.01 * i;
    }
    std::printf("filled\n");
    delete[] telemetry;
    return 0;
}
```

Read `<=` as "less than or equal to". With `kCapacity = 8`, the loop runs for `i` = 0, 1, …, 8. That is nine writes into an array of eight. g++ 13.3.0 compiled this without a single warning under `-Wall -Wextra -Wpedantic` at `-O0`, `-O1` and `-O2`. Every unsanitized build printed `filled` and exited 0. AddressSanitizer:

```text
=================================================================
==9247==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x506000000060 at pc 0x5644a279f2be bp 0x7fff18859e10 sp 0x7fff18859e00
WRITE of size 8 at 0x506000000060 thread T0
    #0 0x5644a279f2bd in main l08-overrun.cpp:7
    ...

0x506000000060 is located 0 bytes after 64-byte region [0x506000000020,0x506000000060)
allocated by thread T0 here:
    #0 0x7fa203cfe6c8 in operator new[](unsigned long) ../../../../src/libsanitizer/asan/asan_new_delete.cpp:98
    #1 0x5644a279f23f in main l08-overrun.cpp:5
    ...

SUMMARY: AddressSanitizer: heap-buffer-overflow l08-overrun.cpp:7 in main
```

"0 bytes after 64-byte region" is the diagnosis. Eight doubles is $8 \times 8 = 64$ bytes, and the write landed on the first byte past the end. The name `heap-buffer-overflow` separates it from `stack-buffer-overflow`, which lesson 03 produced, and `global-buffer-overflow`, which the same mistake on a global array gives.

What makes this dangerous on a vehicle is not the one extra element. It is that those bytes **[[belong to something else|heap-metadata]]**: the allocator's records for the next block, the next member of a struct, or a function's return address. The damage shows up later, somewhere unrelated, and the stack trace at that point names an innocent function.

## Uninitialized reads

A local or heap object with no initializer holds an **indeterminate value** — whatever bytes happened to be in that memory before. Reading it is undefined for every type except `unsigned char` and `std::byte`.

::: example Two gains set, one forgotten
A **PID controller** mixes three terms, each with its own gain: proportional (`kp`), integral (`ki`) and derivative (`kd`). Here the programmer set two and forgot the third:

```cpp
#include <cstdio>

struct Gains { double kp; double ki; double kd; };

double control(double err) {
    Gains g;                       // no initializer: members are indeterminate
    g.kp = 1.5;
    g.kd = 0.05;
    return g.kp * err + g.ki * err + g.kd * err;   // reads g.ki
}

int main() {
    std::printf("control(0.20) = %f\n", control(0.20));
    return 0;
}
```

It printed:

```text
control(0.20) = 0.310000
```

Check that number by hand, assuming `ki` came out as zero:

$$
1.5 \times 0.20 + 0 \times 0.20 + 0.05 \times 0.20 = 0.30 + 0 + 0.01 = 0.31
$$

So the forgotten `ki` happened to be zero in that **[[stack slot|stack-slot-garbage]]**, run after run. The controller produced a plausible number that is right only by accident. That is the worst case for a reviewer: the test passes.

**The compiler caught this one.** g++ 13.3.0 with `-Wall` warned at every optimization level, `-O0` included:

```text
l08-uninit.cpp:9:27: warning: 'g.Gains::ki' is used uninitialized [-Wuninitialized]
    9 |     return g.kp * err + g.ki * err + g.kd * err;   // reads g.ki
      |                         ~~^~
l08-uninit.cpp:6:11: note: 'g' declared here
```

Without `-Wall`, it said nothing. That alone is a reason to always build with warnings on.

**But many warnings of this family need the optimizer.** Here a value is set only on some paths:

```cpp
double sensor();
double scale(int mode, double x) {
    double k;
    if (mode == 1) k = sensor();
    if (mode == 2) k = 2.0 * sensor();
    return k * x;
}
```

At `-O1` and `-O2`, g++ 13.3.0 with `-Wall -Wextra` warned `'k' may be used uninitialized [-Wmaybe-uninitialized]`. At `-O0` it printed nothing. That warning comes from the optimizer's analysis of which paths reach which lines, and at `-O0` that analysis does not run. A project that builds its debug configuration at `-O0` and relies on warnings is not getting this one.

**[[Valgrind|valgrind]]** found the `Gains` bug on the `-O0` build, run with `--track-origins=yes`:

```text
==9294== Conditional jump or move depends on uninitialised value(s)
==9294==    at 0x48C4181: __printf_fp_buffer_1.isra.0 (printf_fp.c:230)
==9294==    by 0x48C635B: __printf_fp_l_buffer (printf_fp.c:1122)
==9294==    by 0x48CD6C4: __printf_fp_spec (vfprintf-internal.c:266)
==9294==    by 0x48CD6C4: __printf_buffer (vfprintf-internal.c:999)
==9294==    by 0x48CE73A: __vfprintf_internal (vfprintf-internal.c:1544)
==9294==    by 0x48C31B2: printf (printf.c:33)
==9294==    by 0x1091D2: main (l08-uninit.cpp:13)
==9294==  Uninitialised value was created by a stack allocation
==9294==    at 0x109149: control(double) (l08-uninit.cpp:5)
```

Read it carefully. The *reported* spot is inside `printf`. Valgrind's checker lets an undefined value flow silently through arithmetic, and complains only where it first changes a decision — here, `printf` deciding which digits to print. The useful line is the last one, added by `--track-origins=yes`: the bad value came from the stack in `control`, line 5, the function that declares `Gains g;` on the next line.

And note what did **not** find it: AddressSanitizer. ASan tracks whether an address is valid, not whether its bytes were ever written. An uninitialized read of valid memory is invisible to it. That is a real gap in the daily tool. Uninitialized values need a different tool — valgrind, or **[[MemorySanitizer|msan]]** — or, best of all, never being created.

The fix is two characters. `Gains g{};` sets every member to zero, and `Gains g{1.5, 0.0, 0.05};` names all three. Brace-initialize every local, always. The previous module gave one reason (it blocks narrowing conversions); this is the second.
:::

::: warning The same line, a bug in one place and fine in another
`double x;` inside a function is indeterminate. But `double x;` at namespace scope, or marked `static`, is zero: objects with static storage are zeroed before anything runs, as lesson 01 said. That is why "it worked when it was a global" is a real, and confusing, bug report.
:::

## Saying what you actually know

When you write about one of these bugs — a commit message, a defect report, a code review — three kinds of statement are available. They are not equally strong.

1. *"This is undefined behavior because the buffer's lifetime ended during the push_back on line 11."* A statement about the language. Always available, always true, and the only kind that survives a compiler upgrade.
2. *"AddressSanitizer reports heap-use-after-free at line 13, freed at line 11."* Evidence that the program really executes the undefined operation, with the tool named.
3. *"On this build it printed -9.81 and exited 0."* A fact about one binary. Worth recording when it explains why nobody noticed; never a description of the bug.

The mistake to avoid is using 3 where 1 belongs. "Writing one past the end is fine for `double` arrays because the allocator rounds up" is a sentence with a real experiment behind it and no truth in it.

## Check yourself

::: check
The `-O1` build of the double free had no call to `operator new` in it. Is that program correct?
:::

::: answer
The question has no answer, and that is the point. A program with undefined behavior has no defined meaning, so "correct" does not apply to it as a whole: the standard does not say what it should do, so nothing it does is a deviation.

What you can say is narrower and more useful. The *source* has a defect, at the second `delete`, and any build of it may do anything. The harmless `-O1` binary is not something you can rely on: adding a print between the two deletes, storing `f` somewhere, or upgrading the compiler can bring the allocation back, and the abort with it. Removing an unobservable allocation is allowed even in correct programs, so the removal is not itself a compiler bug.
:::

::: check
A reviewer suggests replacing `double& first = az[0];` with `double* first = &az[0];`. Does that fix the use-after-free?
:::

::: answer
No. A pointer and a reference into a vector's buffer are both invalidated by reallocation. The only difference is that the pointer could be reassigned afterwards and the reference cannot.

The fix is to stop holding an address across an operation that can move the elements. Either keep an index (`std::size_t i = 0;` and write `az[i]` each time, which stays correct because it is relative to whatever buffer exists now), or finish growing before taking the reference, or call `az.reserve(9)` up front so no reallocation can happen in that stretch. In flight code the usual answer is different again: the buffer has a fixed capacity chosen at compile time, so there is no reallocation at all.
:::

::: check
`-Wmaybe-uninitialized` fired at `-O1` and not at `-O0`. What does that tell you about how to set up a project's builds?
:::

::: answer
That warnings and optimization level are not independent. A project needs at least one configuration that compiles with optimization *and* warnings on, even if nobody runs that binary. Many of g++'s most useful warnings — maybe-uninitialized, some array-bounds checks, some dangling-pointer cases — come from the optimizer's analysis and do not exist at `-O0`.

A common arrangement: a debug build at `-O0 -g` for stepping through code, a release build at `-O2`, and a CI job that compiles at `-O2 -Wall -Wextra -Werror` purely to collect warnings. Warnings are still only a filter. The `Observer` bug in lesson 04 produced no warning at any level, which is why a sanitized test run is the other half.
:::

::: check
Why can AddressSanitizer report a use-after-free precisely, but not an uninitialized read at all?
:::

::: answer
They are questions about different things. ASan keeps a side table recording, for every 8 bytes of memory, whether they are currently **addressable**: inside a live allocation or live stack object, or poisoned as padding or a freed block. A use-after-free is a question about addressability. The block was marked poisoned at `delete`, so the later access is caught with one table lookup. ASan also saved the allocation and free stack traces, so it can show all three locations.

An uninitialized read is a question about *definedness*. The address is perfectly valid and the access is legal; what is wrong is that nothing ever wrote a value there. Tracking that means carrying a "defined" flag through every arithmetic operation, which is what valgrind and MemorySanitizer do, and why they are slower. So ASan in CI does not remove the need to brace-initialize.
:::

::: check
A colleague's code reads one element past a heap array once per control cycle. The system has run for six months without trouble. Write the two-sentence review comment.
:::

::: answer
"Line 88 reads `telemetry[n]` where the array has `n` elements, which is undefined behavior: the compiler may assume it never happens and optimize the loop around that, and the bytes read belong to the allocator's records for the next block. Six months of clean running is evidence about one binary on one processor, not about the code — changing the array size, the optimization level or the compiler changes what those bytes are, so please change the bound to `i < n` and add an AddressSanitizer run to CI."

The comment works because it makes a claim about the language, not about observed behavior, so it cannot be answered with "but it works."
:::

## Summary

| Bug | What it is | What catches it |
| --- | --- | --- |
| dangling pointer | address of an object whose lifetime ended | ASan `heap-use-after-free`, `stack-use-after-scope`, `stack-use-after-return` |
| use-after-free | access to a freed heap block | ASan `heap-use-after-free`, with free and allocation traces |
| double free | freeing the same block twice | ASan `attempting double-free`; glibc may abort; the optimizer may erase it |
| buffer overrun | access outside an object's bounds | ASan `heap-`/`stack-`/`global-buffer-overflow` |
| uninitialized read | reading storage never written | `-Wall` warnings (some only with optimization); valgrind; MemorySanitizer; **not** ASan |
| vector invalidation | growth reallocates; every pointer, reference and iterator dies | ASan, with the free inside `_M_realloc_insert` |
| UB's license | the compiler assumes it never happens and deletes code that says otherwise | reading the assembly, as with the deleted null check |
| honest reporting | say what is undefined; cite the sanitizer; label observations as one build | — |

The next lesson takes AddressSanitizer on its own terms: how it works, how to read every field of a report, what it costs, what it misses, and how to wire it into a build so a finding fails a test instead of scrolling past.

::: context ub-name Three kinds of "the standard does not say"
The C++ standard sorts loose ends into three bins. **Implementation-defined** behavior may vary, but each compiler must document its choice — the size of `int`, say. **Unspecified** behavior may vary and need not be documented — the order in which function arguments are evaluated. **Undefined** behavior has no requirements at all.

The third bin exists so compilers can skip checks that would slow every correct program: no bounds check on each array access, no null check on each dereference. Programmers have long joked that undefined behavior could make "demons fly out of your nose". The joke sticks because, as far as the standard is concerned, it is allowed.
:::

::: context reading-assembly Reading two lines of x86-64
Assembly is the list of instructions the processor actually runs. In the style shown here, `mov eax, DWORD PTR [rdi]` means "load 4 bytes (a *double word*) from the address held in register `rdi`, into register `eax`."

On 64-bit Linux the calling rules put a function's first argument in `rdi` and its return value in `eax` (or its 64-bit form, `rax`). So those three `-O2` lines read "load `*p`, return it." `endbr64` is a marker for a hardware security feature and does no work. You can make these listings yourself with `g++ -O2 -S -masm=intel`.
:::

::: context tcache glibc's per-thread cache
Since glibc 2.26 (2017), each thread keeps a small **tcache** — "thread cache" — of recently freed blocks, sorted by size. A `free` drops the block into it, and the next `malloc` of that size takes it straight back, with no lock.

Because the cache is a list of known freed blocks, glibc can check cheaply whether a block being freed is already in it. That is the check that fired in build 1. It is a best-effort safety net, not a guarantee: once a block has moved on from the tcache, this particular check can no longer see it.
:::

::: context exit-134 Why 134
When a Linux program is killed by a signal, the shell reports its exit status as 128 plus the signal's number. glibc stopped the program with `abort()`, which raises signal 6, **SIGABRT**. So $128 + 6 = 134$.

The same rule decodes other statuses you will meet: 139 is $128 + 11$, a segmentation fault (**SIGSEGV**), and 137 is $128 + 9$, **SIGKILL**. An ASan finding, by contrast, exits with a plain 1 by default.
:::

::: context allocation-elision When the compiler may skip new
Since C++14, the standard lets a compiler leave out a call to the allocation function when the program cannot tell the difference — for example, a `new` whose object is never used in a way that needs real heap memory. It can use stack space or registers, or nothing at all.

That is why build 2 had no `operator new` in it. The double free vanished with the allocation, and so did any chance of catching it. Change the code so the pointer escapes — pass it to another file's function, say — and the allocation comes back.
:::

::: context vector-growth Where the old buffer goes
A `std::vector` keeps its elements in one heap buffer. When that buffer is full, `push_back` allocates a bigger one, copies the elements across, and frees the old one. libstdc++ doubles the capacity each time: 1, 2, 4, 8, 16.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="22" font-size="12" fill="#1f2a44">old buffer (capacity 1) — freed</text>
  <rect x="10" y="30" width="40" height="26" fill="#fff" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="30" y="47" font-size="11" text-anchor="middle" fill="#b4232c">-9.81</text>
  <text x="10" y="92" font-size="12" fill="#1f2a44">new buffer (capacity 16)</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="10" y="100" width="20" height="24" fill="#8fb8f0"/><rect x="30" y="100" width="20" height="24" fill="#8fb8f0"/>
    <rect x="50" y="100" width="20" height="24" fill="#8fb8f0"/><rect x="70" y="100" width="20" height="24" fill="#8fb8f0"/>
    <rect x="90" y="100" width="20" height="24" fill="#8fb8f0"/><rect x="110" y="100" width="20" height="24" fill="#8fb8f0"/>
    <rect x="130" y="100" width="20" height="24" fill="#8fb8f0"/><rect x="150" y="100" width="20" height="24" fill="#8fb8f0"/>
    <rect x="170" y="100" width="20" height="24" fill="#8fb8f0"/>
    <rect x="190" y="100" width="140" height="24" fill="#fff"/>
  </g>
  <text x="260" y="116" font-size="11" text-anchor="middle" fill="#6c7a93">7 spare</text>
  <text x="230" y="47" font-size="12" text-anchor="middle" fill="#b4232c">first still points here</text>
  <line x1="150" y1="43" x2="56" y2="43" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="52,43 60,39 60,47" fill="#b4232c"/>
  <text x="10" y="142" font-size="11" fill="#1f2a44">9 elements copied across; az[0] reads the new buffer</text>
</svg>
```

Nine elements need a capacity of at least 9, and the next power of two is 16 — matching the printed capacity.
:::

::: context heap-metadata What lives right past the end of a heap block
glibc stores its bookkeeping for each block in a small header right before the block's bytes. So the bytes right past the end of your block are very often the header of the *next* block.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="40" width="30" height="30" fill="#6c7a93" stroke="#1f2a44"/>
  <rect x="40" y="40" width="140" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="180" y="40" width="30" height="30" fill="#6c7a93" stroke="#1f2a44"/>
  <rect x="210" y="40" width="140" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="25" y="32" font-size="11" text-anchor="middle" fill="#1f2a44">size</text>
  <text x="110" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">your 64 bytes</text>
  <text x="195" y="32" font-size="11" text-anchor="middle" fill="#1f2a44">size</text>
  <text x="280" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">someone else's block</text>
  <rect x="180" y="74" width="30" height="8" fill="#b4232c"/>
  <text x="195" y="100" font-size="11" text-anchor="middle" fill="#b4232c">overrun lands here</text>
</svg>
```

Overwrite that header and the allocator's records are wrong. The crash comes later, inside some unrelated `new` or `delete` — far from the loop that caused it.
:::

::: context stack-slot-garbage Why the garbage was zero
A function's locals live in its **stack frame**, a patch of memory reused by whichever function was called before. `Gains g;` does not clear its patch, so `g.ki` holds whatever an earlier function left there.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">earlier call returns</text>
  <text x="270" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">control() reuses the slots</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="30" y="30" width="120" height="26" fill="#fff"/><rect x="30" y="56" width="120" height="26" fill="#fff"/><rect x="30" y="82" width="120" height="26" fill="#fff"/>
    <rect x="210" y="30" width="120" height="26" fill="#8fb8f0"/><rect x="210" y="56" width="120" height="26" fill="#f2b880"/><rect x="210" y="82" width="120" height="26" fill="#8fb8f0"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#6c7a93">
    <text x="90" y="48">leftover 3.7</text><text x="90" y="74">leftover 0.0</text><text x="90" y="100">leftover 12</text>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="270" y="48">kp = 1.5</text><text x="270" y="74">ki = 0.0 ?</text><text x="270" y="100">kd = 0.05</text>
  </g>
  <line x1="155" y1="69" x2="202" y2="69" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="206,69 198,65 198,73" fill="#b4232c"/>
  <text x="180" y="124" font-size="11" text-anchor="middle" fill="#b4232c">ki keeps whatever was left in its slot</text>
</svg>
```

Early in a short program, much of the stack has never been used, and fresh memory from the operating system always starts as zero. So zero is a common "garbage" value in tests. In a long-running flight program, the same slot holds a leftover from some other calculation — a different number every time.
:::

::: context valgrind A simulated processor that watches every byte
**Valgrind** runs your unmodified program on a simulated processor, instruction by instruction. Its default tool, **memcheck**, keeps a "defined or not" flag for every bit of memory and every register, and reports when an undefined value affects a jump, an address, or a system call.

It needs no recompiling, which is its great strength. The price is speed: programs typically run tens of times slower under memcheck, so it suits targeted runs rather than every test on every commit.
:::

::: context msan MemorySanitizer
**MemorySanitizer** (MSan) is the sanitizer built to catch uninitialized reads. Like ASan, the compiler adds checks to your code, so it runs much faster than valgrind. Unlike ASan, it tracks definedness, not addressability.

It is available in clang, not g++, and every library the program uses must also be built with it, or it reports false alarms. That setup cost is why many teams rely on warnings, valgrind runs and strict brace-initialization instead. It cannot run in the same build as ASan.
:::
