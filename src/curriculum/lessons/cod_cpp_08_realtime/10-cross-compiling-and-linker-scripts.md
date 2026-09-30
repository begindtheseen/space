---
id: l10-cross-compiling-and-linker-scripts
title: Cross-compiling and linker scripts
minutes: 24
covers:
  - Cross-compiling to an embedded target with a CMake toolchain file
  - Linker scripts and memory regions; why you would move a function into RAM
---

Imagine you bake cakes at home, but the cakes are for a shop in another country. Their ovens run at different temperatures, their cups are a different size, and the cake has to fit their display case. You still mix the batter in your own kitchen. You just follow *their* recipe card, not yours.

Flight software is made the same way. You write and build it on a laptop, but it runs on a small flight computer with a different processor, no operating system and little memory. The machine you build on is the **[[host|host-and-target]]**. The machine the program will run on is the **target**. Building on one for the other is called **cross-compiling**.

This lesson has two parts: telling CMake to cross-compile, and telling the linker where in the target's memory each piece of the program goes. At the end you will see why engineers sometimes copy a function from flash memory into RAM before running it.

## Host and target are different machines

Your laptop has a big processor running Linux, macOS or Windows. A typical flight computer or motor controller has a small **microcontroller** — a whole computer on one chip, with processor, memory and input/output pins together. A very common family is the Arm **Cortex-M**, for example the Cortex-M4 at around 168 MHz with 1 MB of flash and 128 KB of RAM.

The two machines differ in three ways that matter to the compiler:

- **The instruction set.** An x86-64 instruction means nothing to a Cortex-M4.
- **The operating system.** The target usually has none (this is called **bare metal**) or a small real-time one. Nobody calls `main` for you.
- **The memory map.** Every address on the target means something fixed, and the program must be placed exactly.

So you need a different compiler. For Cortex-M the usual one is the GNU Arm toolchain, whose programs are all named with the prefix **[[arm-none-eabi|target-triple]]**: `arm-none-eabi-gcc`, `arm-none-eabi-g++`, `arm-none-eabi-size`, `arm-none-eabi-objdump` and so on. The prefix says: Arm processor, no operating system, and the standard Arm calling convention.

::: warning
You cannot run the output on your laptop. Any build step that tries to *run* or fully link a freshly built test program — which CMake normally does to check the compiler works — fails too, unless you tell CMake not to.
:::

## The CMake toolchain file

In the CMake module, CMake found your host compiler by itself. To cross-compile, you hand CMake a **toolchain file**: a short CMake script that describes the *target*, not your project. You pass it once, when you first configure a build folder, with `-DCMAKE_TOOLCHAIN_FILE=`.

Here is a complete toolchain file for a Cortex-M4 with a hardware floating-point unit:

```cmake
# Toolchain file: describes the TARGET, not the project.
set(CMAKE_SYSTEM_NAME Generic)          # bare metal, no operating system
set(CMAKE_SYSTEM_PROCESSOR arm)

set(CMAKE_C_COMPILER   arm-none-eabi-gcc)
set(CMAKE_CXX_COMPILER arm-none-eabi-g++)
set(CMAKE_ASM_COMPILER arm-none-eabi-gcc)

# There is no OS to run a test program on, so CMake's compiler check
# must build a library instead of an executable.
set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)

set(CPU_FLAGS "-mcpu=cortex-m4 -mthumb -mfloat-abi=hard -mfpu=fpv4-sp-d16")
set(CMAKE_C_FLAGS_INIT   "${CPU_FLAGS}")
set(CMAKE_CXX_FLAGS_INIT "${CPU_FLAGS} -fno-exceptions -fno-rtti")
set(CMAKE_EXE_LINKER_FLAGS_INIT "${CPU_FLAGS} --specs=nano.specs --specs=nosys.specs -nostartfiles")

# Search for programs on the host, but libraries and headers only
# in the target's own directories.
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```

Read it top to bottom:

1. `CMAKE_SYSTEM_NAME Generic` tells CMake the target has no operating system it knows about. Setting this variable at all is what switches CMake into cross-compiling mode.
2. The three `COMPILER` lines name the cross-compilers. CMake will use them instead of the host's `g++`.
3. `CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY` solves the problem from the warning above. CMake checks a new compiler by building a tiny test. Without this line it would build a test *program*, and linking a bare-metal program needs a linker script and startup code the test does not have. Building a library instead skips linking.
4. The CPU flags choose the exact processor. `-mcpu=cortex-m4` picks the instruction set and timing model. `-mthumb` picks the compact **[[Thumb|thumb]]** instruction encoding that Cortex-M uses. `-mfloat-abi=hard -mfpu=fpv4-sp-d16` says there is a floating-point unit and that it handles single precision (`float`) only. A `double` on this chip is computed in software, many times slower.
5. `-fno-exceptions -fno-rtti` turn off exceptions and run-time type information, which cost space and have hard-to-bound timing.
6. `nano.specs` links a small C library, `nosys.specs` stubs out operating-system calls, and `-nostartfiles` says "I supply my own startup code".
7. The `FIND_ROOT_PATH_MODE` lines stop CMake from picking up your *laptop's* libraries, built for the wrong processor.

The `_INIT` flags are starting values that the project's own options add to. The rule of thumb: **the toolchain file says what the chip is; the `CMakeLists.txt` says what the program is.** The same `CMakeLists.txt` can then build for the host (for unit tests) or for the target (for flight), depending only on which toolchain file you pass.

::: key
A CMake toolchain file describes the target: `CMAKE_SYSTEM_NAME` (setting it turns on cross-compiling), the cross-compilers, CPU flags, `CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY` for bare metal, and `CMAKE_FIND_ROOT_PATH_MODE_*` so libraries come from the target, not the host. Pass it with `-DCMAKE_TOOLCHAIN_FILE=` when you first configure a build folder.
:::

::: warning
The compiler is chosen on the *first* configure of a build folder and saved in that folder's cache. Pointing an existing folder at a different toolchain file does not cleanly switch compilers; at best CMake notices, warns and throws the cache away. Use one build folder per target — `build-host` and `build-m4`, say — and delete a folder rather than reusing it for a different target.
:::

Here is the project's own `CMakeLists.txt`. It says nothing about which processor it is for:

```cmake
cmake_minimum_required(VERSION 3.20)
project(fc_firmware CXX)

set(CMAKE_CXX_STANDARD 20)

add_executable(fc.elf startup.cpp main.cpp)
target_compile_options(fc.elf PRIVATE -Os -Wall -Wextra -ffunction-sections -fdata-sections)
target_link_options(fc.elf PRIVATE
    -T${CMAKE_SOURCE_DIR}/stm32f4.ld
    -Wl,--gc-sections
    -Wl,--print-memory-usage
    -Wl,-Map=fc.map)
set_target_properties(fc.elf PROPERTIES LINK_DEPENDS ${CMAKE_SOURCE_DIR}/stm32f4.ld)
```

`-T` hands the linker a script, `stm32f4.ld`, the second half of this lesson. `-ffunction-sections -fdata-sections` with `--gc-sections` let the linker throw away code nothing uses. `--print-memory-usage` reports how full each memory is. `-Map=fc.map` writes a **map file** listing every symbol's final address — the first thing to open when something lands in the wrong place. `LINK_DEPENDS` re-links when the script changes.

## The linker script: a map of the chip

The compiler turns each `.cpp` file into an object file full of **sections** — named chunks of bytes. By convention:

- `.text` holds machine code;
- `.rodata` holds read-only data, such as `const` tables;
- `.data` holds global variables that start with a nonzero value;
- `.bss` holds global variables that start at zero.

The compiler does not decide *where* any of these go. The **linker** does, and on a desktop it uses a built-in default. On a microcontroller you write the rules yourself in a **linker script**, because only you know the chip's **[[memory map|memory-map]]**.

A linker script has two main parts. `MEMORY` lists the regions: their names, what they allow, where they start and how long they are. `SECTIONS` says which input sections go into which region, and in what order.

```text
/* Where the memory is, and how big. */
MEMORY
{
  FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 1024K
  RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 128K
}

ENTRY(Reset_Handler)
_estack = ORIGIN(RAM) + LENGTH(RAM);   /* stack starts at the top of RAM */

SECTIONS
{
  .isr_vector : { KEEP(*(.isr_vector)) } > FLASH

  .text : {
    *(.text*)
    *(.rodata*)
  } > FLASH

  /* Initialised variables: live in RAM, but their starting
     values are stored in flash and copied at boot. */
  .data : {
    _sdata = .;
    *(.data*)
    *(.ramfunc*)          /* functions that must run from RAM */
    _edata = .;
  } > RAM AT > FLASH
  _sidata = LOADADDR(.data);

  /* Zero-initialised variables: RAM only, cleared at boot. */
  .bss (NOLOAD) : {
    _sbss = .;
    *(.bss*)
    *(COMMON)
    _ebss = .;
  } > RAM
}
```

How to read the pieces:

- `(rx)` means read and execute; `(rwx)` adds write. **Flash** is memory that keeps its contents with the power off, like a USB stick, so the program lives there. **RAM** loses everything at power-off but is fast and writable.
- `ORIGIN` is the starting address, written in hexadecimal. `0x08000000` is read "hex oh-eight, six zeros". `1024K` is 1024 kilobytes.
- `*(.text*) ... > FLASH` means "from every input file, take every section whose name starts with `.text`, and put it in FLASH".
- `.` (read "dot") is the **location counter**: the address the linker is currently filling. `_sdata = .;` records that address in a symbol the C++ code can see.
- `KEEP` stops `--gc-sections` from throwing away the vector table, which no code calls by name.

The line to stare at is `> RAM AT > FLASH`. It gives `.data` *two* addresses. The variables must live in RAM, because the program changes them, but RAM is blank at power-on, so their starting values are stored in flash. The address where a section runs is its **[[run address|vma-lma]]**, also called the virtual memory address or VMA. The address where its bytes are stored in the file and in flash is its **load address**, or LMA. For `.data` they differ, and something must copy the bytes from one to the other before `main` starts.

::: key
A linker script's `MEMORY` block names the regions (flash, RAM) with their origin and length; `SECTIONS` assigns input sections to regions. `.text` and `.rodata` go in flash, `.bss` in RAM, and `.data` runs in RAM but is loaded in flash (`> RAM AT > FLASH`), so startup code must copy it before `main`.
:::

## Startup code: what runs before main

On a desktop the operating system prepares memory and calls `main`. On bare metal, the first code to run is yours. When a Cortex-M powers on, the hardware reads two words from the start of flash: the first is the initial stack pointer, the second is the address of the **reset handler**. That table of addresses is the **vector table**. The linker script put it first in flash with `.isr_vector`.

```cpp laptop
#include <cstdint>

// Symbols defined by the linker script.
extern "C" std::uint32_t _sidata[], _sdata[], _edata[], _sbss[], _ebss[], _estack[];

int main();

extern "C" [[noreturn]] void Reset_Handler() {
    // Copy .data (variables AND ram functions) from flash to RAM.
    std::uint32_t* src = _sidata;
    for (std::uint32_t* dst = _sdata; dst < _edata; ++dst, ++src) {
        *dst = *src;
    }
    // Zero .bss.
    for (std::uint32_t* dst = _sbss; dst < _ebss; ++dst) {
        *dst = 0U;
    }
    main();
    for (;;) {}   // main must never return on a flight computer
}

extern "C" void Default_Handler() { for (;;) {} }

// First two entries of the Cortex-M vector table: initial stack pointer, reset.
extern "C" __attribute__((section(".isr_vector"), used))
void (* const vector_table[])() = {
    reinterpret_cast<void (*)()>(_estack),
    Reset_Handler,
};
```

The reset handler does two jobs. It copies every word from `_sdata` to `_edata` out of the flash copy at `_sidata`, then writes zero into every word from `_sbss` to `_ebss`, and only then calls `main`. Those symbols come from the linker script; C++ sees them as arrays whose *address* is what matters. Both loops are bounded: they run exactly $(\text{end} - \text{start})/4$ times, a number fixed at link time. (The zeroed section is called `.bss` for an [[old reason|bss-name]].)

Here is the program that uses it:

```cpp laptop
#include <cstdint>

volatile std::uint32_t tick_count = 0;        // .bss  (starts at zero)
std::uint32_t gain_table[4] = {3, 5, 8, 13};  // .data (starting values in flash)
const std::uint32_t crc_poly = 0x04C11DB7U;   // .rodata (stays in flash)

// Runs from RAM: safe to execute while flash is being erased or written.
__attribute__((section(".ramfunc"), noinline, long_call))
void flash_write_word(volatile std::uint32_t* addr, std::uint32_t value) {
    *addr = value;
}

int main() {
    for (;;) {
        tick_count = tick_count + gain_table[tick_count % 4U];
        if (tick_count > crc_poly) {
            flash_write_word(&tick_count, 0U);
        }
    }
}
```

(A real flash-programming routine would unlock the flash controller and poll its status register; this one keeps only the part that matters here, its placement.)

::: example Configuring, building and reading the memory report
Configure a fresh build folder with the toolchain file, then build:

```text
$ cmake -S . -B build -G Ninja -DCMAKE_TOOLCHAIN_FILE=arm-cortex-m4.cmake
-- The CXX compiler identification is GNU 13.2.1
-- Detecting CXX compiler ABI info
-- Detecting CXX compiler ABI info - done
-- Check for working CXX compiler: /usr/bin/arm-none-eabi-g++ - skipped
-- Detecting CXX compile features
-- Detecting CXX compile features - done
-- Configuring done (0.4s)
-- Generating done (0.0s)
-- Build files have been written to: .../fw/build
$ cmake --build build
[1/3] Building CXX object CMakeFiles/fc.elf.dir/startup.cpp.obj
[2/3] Building CXX object CMakeFiles/fc.elf.dir/main.cpp.obj
[3/3] Linking CXX executable fc.elf
Memory region         Used Size  Region Size  %age Used
           FLASH:         644 B         1 MB      0.06%
             RAM:          24 B       128 KB      0.02%
```

The compiler found is GNU 13.2.1, the Arm cross-compiler (the host's own `g++` here is 13.3.0), so the toolchain file worked.

Now check the memory report by hand. `arm-none-eabi-size -A fc.elf` lists each section:

```text
section           size        addr
.isr_vector          8   134217728
.text              608   134217736
.ARM.exidx           8   134218344
.data               20   536870912
.bss                 4   536870932
```

(Debug sections, never loaded onto the chip, follow.) The addresses are in decimal here: $134\,217\,728$ is `0x08000000` and $536\,870\,912$ is `0x20000000`.

**Flash** holds the vector table, the code, a small unwinding table and the *load copy* of `.data`:

$$
8 + 608 + 8 + 20 = 644 \text{ bytes.}
$$

**RAM** holds the *run copy* of `.data` plus `.bss`:

$$
20 + 4 = 24 \text{ bytes.}
$$

Both match the linker's report. Notice that `.data` is counted *twice*: an initialized global costs flash for its starting values and RAM for its live copy. The `.bss` variable costs RAM only, because zeros need no stored copy.

Sanity check: `.data` is 20 bytes, and it holds `gain_table` (four 4-byte words, 16 bytes) plus `flash_write_word` (4 bytes of Thumb code). $16 + 4 = 20$. It fits.
:::

::: warning
`--print-memory-usage` counts what the linker placed. It does not count the stack, which grows down from `_estack` at the top of RAM into whatever is free. Here that is $131\,072 - 24 = 131\,048$ bytes, but in a real program you must still add your worst-case stack depth from lesson 03 and check it fits. The linker will not warn you.
:::

## Where each symbol ended up

The linker's output is only useful if you can check it. `arm-none-eabi-nm` lists every symbol with its address; `-n` sorts by address and `-C` turns C++ names back into readable ones.

::: example Proving the function runs from RAM
```text
$ arm-none-eabi-nm -C -n build/fc.elf
08000000 R vector_table
08000008 T Reset_Handler
08000058 T main
08000090 T memset
08000134 T memcpy
08000270 A _sidata
20000000 T _sdata
20000000 T gain_table
20000010 T flash_write_word(unsigned long volatile*, unsigned long)
20000014 T _edata
20000014 B _sbss
20000014 B tick_count
20000018 B _ebss
20020000 R _estack
```

Read it in order of address.

- Everything starting `0800` is in flash, vector table first, as the script ordered.
- `flash_write_word` sits at `0x20000010`, inside RAM. The `section(".ramfunc")` attribute put it in an input section called `.ramfunc`, and the script put `.ramfunc` inside `.data`, which runs in RAM.
- `_sidata`, `0x08000270`, is where in flash the load copy of `.data` starts.
- `_estack` is `0x20020000`, which is `0x20000000` plus 128 KB. In hexadecimal, $128 \times 1024 = 131\,072$ is `0x20000`. Correct.
- `memset` and `memcpy` appear although we never called them: the compiler recognized the two loops in `Reset_Handler` and replaced them with the library versions.

Now check how `main` calls the RAM function. From `arm-none-eabi-objdump -d`:

```text
 8000076:	ldr	r3, [pc, #20]	@ (800008c <main+0x34>)
 8000078:	movs	r1, #0
 800007a:	blx	r3
 ...
 800008c:	.word	0x20000011
```

The call loads the full address into a register and branches through it (`blx r3`). That is what the **[[long_call|long-call]]** attribute asked for: an ordinary Thumb branch instruction can only jump about 16 MB from where it is, and RAM is 384 MB away from flash. The stored address is `0x20000011`, one more than `0x20000010`. On a Cortex-M the lowest bit of a branch address is a flag meaning "this is Thumb code", not part of the address. So the call lands exactly on the function.
:::

## Why you would move a function into RAM

Flash is where code normally lives. So why go to this trouble? Two reasons, and a third that follows from them.

**Flash can be slower than the processor.** Flash memory needs a fixed time to read, about 30 nanoseconds on a typical part. A processor at 168 MHz has a clock cycle of $1/168\,000\,000 \approx 5.95\,\mathrm{ns}$. So one flash read spans $30 / 5.95 \approx 5.04$ cycles, which rounds up to 6. The chip inserts extra idle cycles, called **[[wait states|wait-states]]**, into every flash access — 5 of them here. Prefetch buffers and small caches hide most of this, but a jump to code not in the cache pays the full price, so timing varies. Code in RAM has no wait states: it runs faster and, more importantly, more predictably.

**Flash cannot always be read while it is being written.** Erasing or programming flash takes a long time by processor standards — microseconds for each word written, and up to a second or more to erase a large block. On many single-bank chips, any attempt to read the flash while that is happening stalls the processor's bus until it finishes. The processor fetches instructions by reading, so if the code doing the fetching is in flash, the whole processor freezes. Flight computers write flash in flight — a new parameter table, a fault log, a patch — so the writing routine must run from RAM.

**Interrupt handlers may have to run while flash is unavailable.** If a sensor interrupt arrives during an erase and its handler is in flash, the handler cannot start until the erase is done. A handler that must meet its deadline anyway — the 1 kHz IMU read, a motor commutation step — is placed in RAM, together with the vector table if the chip allows the table to move.

The mechanism is always the same two halves: the **linker script** places the function's section in a RAM region with a flash load address, and the **startup code** copies it there before anything calls it.

::: key
Why move a function into RAM via the linker script? Because executing from flash can be slower or can stall while flash is being written, and because an interrupt handler may need to run while flash is unavailable. The linker script places the section and the startup code copies it.
:::

::: example What a flash erase does to a 1 kHz loop
A flight computer runs its control loop at $1\,\mathrm{kHz}$, one frame every $1\,\mathrm{ms}$. It must erase one flash sector to store a new parameter table. Suppose the erase takes $0.8\,\mathrm{s}$ (a realistic figure for a large sector; the data sheet gives the exact typical and maximum).

If the control loop's code is in the flash being erased, the processor stalls on its first instruction fetch and stays stalled for the whole erase. Frames missed:

$$
\frac{0.8\,\mathrm{s}}{0.001\,\mathrm{s/frame}} = 800 \text{ frames.}
$$

Eight hundred missed deadlines in a row is not a glitch — the watchdog from lesson 06 would fire long before the end, and the vehicle would fly open-loop for most of a second.

The fix: put the erase routine, the control loop and its interrupt handlers in RAM (or in a second flash bank, which some chips offer for exactly this reason). Have the erase routine poll the flash controller's "done" flag with a fixed maximum count, so a stuck erase becomes a detected fault rather than a hang. Then the frames keep coming every $1\,\mathrm{ms}$ while the erase runs.

Sanity check: $0.8\,\mathrm{s}$ is nothing to a person, but for a 1 kHz loop it is 800 chances to correct the vehicle, gone.
:::

::: warning
Everything a RAM function calls must also be in RAM. If `flash_write_word` called a helper left in flash, the processor would stall on that call. Check the disassembly: a RAM function should call only RAM functions and read no `const` tables from flash while the erase runs.
:::

## Check yourself

::: check
A teammate's toolchain file sets `CMAKE_CXX_COMPILER` to `arm-none-eabi-g++` but not `CMAKE_TRY_COMPILE_TARGET_TYPE`. Configuring fails while "checking for working CXX compiler". Explain what went wrong and fix it.
:::

::: answer
CMake checks a new compiler by building and linking a tiny test program. Linking a bare-metal program needs a linker script and startup code, which the test lacks, so the link fails. Adding

`set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)`

makes CMake build the test as a static library instead. A library is not linked, so the check succeeds without a linker script. The real program still gets its linker script from `-T` in `CMakeLists.txt`.
:::

::: check
A program has these sections: `.text` 12 000 bytes, `.rodata` 3 000 bytes, `.data` 400 bytes, `.bss` 6 000 bytes. The script puts `.text` and `.rodata` in flash, `.data` in RAM at flash, and `.bss` in RAM. How much flash and how much RAM does it use (ignore the vector table)?
:::

::: answer
Flash holds `.text`, `.rodata` and the load copy of `.data`: $12\,000 + 3\,000 + 400 = 15\,400$ bytes.

RAM holds the run copy of `.data` and `.bss`: $400 + 6\,000 = 6\,400$ bytes.

The 400 bytes of `.data` appear in both totals. `.bss` appears only in RAM, because its starting values are all zero and the startup code writes them.
:::

::: check
In the `nm` output a function in RAM is at `0x20000010`, but the instruction that calls it loads the value `0x20000011`. Is the linker off by one?
:::

::: answer
No. On a Cortex-M, the lowest bit of an address used by a branch-and-exchange instruction like `blx` is a flag, not part of the address. A 1 means "the target is Thumb code". Cortex-M processors only run Thumb code, so every function pointer to them has that bit set. The processor clears it before fetching, so execution starts at `0x20000010`, exactly where the function is.
:::

::: check
Your 1 kHz loop's attitude controller must keep running while the software logs a fault to flash. List what must be in RAM, and say what the linker script and the startup code each contribute.
:::

::: answer
In RAM (or in a second flash bank that is not being written): the flash-programming routine, the control loop, every interrupt handler that must run during the write, everything they call, and any constant tables they read. Any piece left in the busy flash stalls the processor when fetched.

The linker script puts those sections in RAM with a load address in flash (`> RAM AT > FLASH`) and exports start and end symbols. The startup code copies the bytes to RAM before `main` runs, so every call lands on a valid copy.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| Host, target | The machine that builds; the machine that runs | Cross-compiling builds for a target that is not the host |
| `arm-none-eabi-` | GNU Arm cross-toolchain prefix | Arm, no operating system, standard Arm calling convention |
| Toolchain file | CMake script describing the target | Pass once with `-DCMAKE_TOOLCHAIN_FILE=`; one build folder per target |
| `CMAKE_TRY_COMPILE_TARGET_TYPE` | How CMake tests the compiler | `STATIC_LIBRARY` for bare metal |
| `MEMORY` | Regions with origin and length | e.g. FLASH at `0x08000000`, RAM at `0x20000000` |
| `SECTIONS` | Which input sections go where | `.text`/`.rodata` to flash, `.bss` to RAM |
| `> RAM AT > FLASH` | Run address in RAM, load address in flash | Used for `.data` and RAM functions; startup code copies |
| Reset handler | First code after power-on | Copies `.data`, zeroes `.bss`, calls `main` |
| Code in RAM | A function copied from flash at boot | Flash can be slow or stall while written; ISRs may need to run then |

The next lesson, **The Power of Ten rules**, collects the habits you have met across this module — bounded loops, no recursion, no allocation after startup, checked return values — into the ten short rules that NASA/JPL wrote for flight software, and shows how to meet each one in modern C++.

::: context host-and-target Two computers, one program
In embedded work people say "host" for the development machine and "target" for the device. The host is big, fast and friendly: a debugger, gigabytes of memory, a keyboard. The target is small and exact. A flight team usually tests most of the code on the host first — it is faster to build and easier to debug — and then cross-compiles the same source for the target. Some teams also run the target binary in a processor simulator on the host, so the real machine code is tested before any hardware exists.
:::

::: context target-triple Reading a toolchain's name
Compiler names like `arm-none-eabi` are called **target triples**, even when they have more or fewer than three parts. Here they mean: the processor family (`arm`), the operating system (`none` — bare metal), and the **ABI**, the "application binary interface", which fixes how functions pass arguments in registers and how data is laid out. "EABI" is the embedded ABI that Arm published. A Linux program for a Raspberry Pi would instead use a triple like `arm-linux-gnueabihf`, whose `linux` part says the program expects a Linux kernel underneath it.
:::

::: context thumb Two sizes of instruction
Classic Arm processors had 32-bit instructions. Arm later added **Thumb**, a denser set where common instructions are only 16 bits long, so the same program takes less memory. Thumb-2 mixes 16- and 32-bit instructions and can do nearly everything the full set can. Cortex-M processors run *only* Thumb code, which is why the flag `-mthumb` is always there and why every code address you branch to carries a "Thumb" flag in its lowest bit.
:::

::: context memory-map One long street of addresses
A microcontroller has a single numbered address space, like one very long street. Different stretches of the street are different kinds of memory, fixed when the chip was designed. On an STM32F4, flash starts at `0x08000000`, RAM at `0x20000000`, and hardware control registers start at `0x40000000`. Writing to an address in the register stretch does not store a number — it switches on a timer or sends a byte out of a serial port. The chip's reference manual gives the full map.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="320" height="40" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="40" y="20" width="60" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="150" y="20" width="40" height="40" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="240" y="20" width="60" height="40" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="70" y="45">FLASH</text>
    <text x="170" y="45">RAM</text>
    <text x="270" y="45" fill="#ffffff">registers</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="70" y="80">0x08000000</text>
    <text x="70" y="95">1 MB, keeps code</text>
    <text x="170" y="80">0x20000000</text>
    <text x="170" y="95">128 KB, fast</text>
    <text x="270" y="80">0x40000000</text>
    <text x="270" y="95">timers, ports</text>
  </g>
  <line x1="20" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="340,130 330,125 330,135" fill="#1f2a44"/>
  <text x="180" y="152" font-size="11" fill="#6c7a93" text-anchor="middle">addresses grow to the right (not to scale)</text>
</svg>
```
:::

::: context vma-lma Stored in one place, used in another
Think of a school play. The costumes are stored in a box in the basement all year (the load address), but they are worn on stage (the run address). Before the show, someone carries them upstairs. For `.data`, the box is flash and the stage is RAM, and the reset handler does the carrying. Most sections have the same load and run address; only the ones marked `AT >` need the trip.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="130" height="90" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="210" y="30" width="130" height="90" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="85" y="22" font-size="12" fill="#1f2a44" text-anchor="middle">FLASH</text>
  <text x="275" y="22" font-size="12" fill="#1f2a44" text-anchor="middle">RAM</text>
  <rect x="30" y="40" width="110" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="85" y="60" font-size="11" fill="#1f2a44" text-anchor="middle">.text, .rodata</text>
  <rect x="30" y="80" width="110" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="85" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">.data load copy</text>
  <rect x="220" y="40" width="110" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="275" y="60" font-size="11" fill="#1f2a44" text-anchor="middle">.data run copy</text>
  <rect x="220" y="80" width="110" height="30" fill="#ffffff" stroke="#1f2a44" stroke-dasharray="4 3"/>
  <text x="275" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">.bss (zeroed)</text>
  <line x1="140" y1="95" x2="216" y2="58" stroke="#b4232c" stroke-width="2"/>
  <polygon points="220,56 209,56 214,64" fill="#b4232c"/>
  <text x="180" y="140" font-size="11" fill="#b4232c" text-anchor="middle">copied by Reset_Handler</text>
</svg>
```
:::

::: context bss-name A name from the 1950s
"BSS" is usually expanded as "block started by symbol". It comes from an instruction in an assembler for the IBM 704 computer in the 1950s, which reserved a block of memory without storing anything in it. The name outlived the machine by seventy years. The useful idea survived too: a zero-filled variable takes up no space in the program file or in flash, only in RAM.
:::

::: context long-call How far a branch can reach
A normal Thumb call instruction, `bl`, stores the jump distance inside the instruction itself, in a limited number of bits. On Cortex-M4 that allows a jump of about 16 MB forward or backward. Flash at `0x08000000` and RAM at `0x20000000` are `0x18000000` bytes apart, which is 384 MB. So the compiler must load the full 32-bit address into a register and branch through it. `long_call` tells it to. Some linkers instead insert a tiny "veneer" that does the long jump for you; either way, the distance has to be bridged.
:::

::: context wait-states Waiting for slow memory
A wait state is a clock cycle in which the processor does nothing but wait for memory to answer. Flash reads take a fixed time in nanoseconds, while the processor's cycle gets shorter as its clock gets faster. So the faster you run the chip, the more wait states flash needs. Data sheets give a table: at 168 MHz and 3.3 V, an STM32F4 needs 5 wait states, while below about 30 MHz it needs none.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="30" width="50" height="30" fill="#8fb8f0"/>
    <rect x="70" y="30" width="50" height="30" fill="#ffffff"/>
    <rect x="120" y="30" width="50" height="30" fill="#ffffff"/>
    <rect x="170" y="30" width="50" height="30" fill="#ffffff"/>
    <rect x="220" y="30" width="50" height="30" fill="#ffffff"/>
    <rect x="270" y="30" width="50" height="30" fill="#ffffff"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="45" y="50">read</text>
    <text x="95" y="50">wait</text><text x="145" y="50">wait</text><text x="195" y="50">wait</text>
    <text x="245" y="50">wait</text><text x="295" y="50">wait</text>
  </g>
  <text x="170" y="85" font-size="11" fill="#1f2a44" text-anchor="middle">6 cycles of 5.95 ns cover one 30 ns flash read</text>
  <text x="170" y="105" font-size="11" fill="#6c7a93" text-anchor="middle">RAM: 1 cycle, no waiting</text>
</svg>
```
:::
