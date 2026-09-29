---
id: l02-embedded-hal-pacs-and-hals
title: 'Registers, PACs, HALs and embedded-hal: one driver for every chip'
minutes: 20
covers:
  - 'embedded-hal 1.0 as the driver ecosystem contract; PACs from svd2rust; HAL crates'
---

Think about the charging port on a phone. A USB-C charger from one company fits a phone from another, and neither company had to know the other existed. They both agreed on the shape of the plug and what each pin in it means. The agreement is what makes the market work: a charger maker builds one charger, and it fits every phone.

Embedded Rust has the same kind of agreement. On one side are thousands of chips from ST, Nordic, NXP, Raspberry Pi, Microchip and others, each with its own way of switching a pin on or talking to a sensor. On the other side are drivers for sensors: gyroscopes, magnetometers, pressure sensors, GPS receivers. Without an agreement, every sensor driver would have to be rewritten for every chip. With one, a driver is written once and fits every chip. That agreement is the **embedded-hal** crate.

In the last lesson your program started and ran, but it could not touch anything outside the processor. This lesson walks up the ladder from raw hardware to that agreement, one rung at a time: registers, then the **PAC** that names them, then the **HAL** that makes them safe, then the embedded-hal traits a driver is written against. At the top you will read a real sensor, an MPU-6050 accelerometer, through a driver that does not know which chip it is running on. The code was built with Rust 1.94.1, `embedded-hal` 1.0.0, `stm32f4` 0.16.0 and `stm32f4xx-hal` 0.23.0.

## Rung 1: registers are memory you can talk to

Picture a wall of light switches in a big building. Each switch has a label and a position. Flip switch 5 on the third panel and a light comes on in a room you cannot see.

A microcontroller's **peripherals** — the circuits beside the processor that drive pins, count time, and talk over wires — are controlled the same way. Each peripheral has a few **registers**: 32-bit boxes that sit at fixed addresses, like memory. This idea is called **[[memory-mapped I/O|memory-mapped-io]]**. Writing a number to one of those addresses does not store it somewhere. It flips switches in the hardware.

Here are three registers on the STM32F411, taken from its reference manual:

- `RCC_AHB1ENR` at address `0x40023830`. RCC is the "reset and clock control" peripheral. Bit 0 of this register turns on the clock for GPIO port A. A peripheral with no clock is switched off and ignores you.
- `GPIOA_MODER` at `0x40020000`. **GPIO** means "general-purpose input/output": pins you can set high or low, or read. Each pin gets two bits in `MODER` to choose its mode: `00` input, `01` output, `10` alternate function, `11` analog.
- `GPIOA_ODR` at `0x40020014`, the "output data register". Bit 5 sets pin PA5 high (3.3 V) or low (0 V). On a Nucleo-F411RE board, PA5 drives the green user LED.

::: example Working out addresses and bit masks
The reference manual gives each peripheral a **base address** and each register an **offset** from it. The RCC base is `0x40023800` and `AHB1ENR` is at offset `0x30`, so

$$
\mathtt{0x40023800} + \mathtt{0x30} = \mathtt{0x40023830}.
$$

The GPIOA base is `0x40020000`, and `ODR` is at offset `0x14`, so `ODR` is at `0x40020014`.

Pin 5's two mode bits in `MODER` are bits $2 \times 5 = 10$ and $11$. To make pin 5 an output, you must clear both bits and then set the pattern `01`:

- the clearing mask is binary `11` shifted left 10 places, $3 \times 2^{10} = 3072$, which is `0xC00`;
- the pattern is binary `01` shifted left 10 places, $2^{10} = 1024$, which is `0x400`.

To toggle the LED you flip bit 5 of `ODR`, whose mask is $2^5 = 32$, or `0x20`.

Sanity check: `0x400` is inside `0xC00` (it is the lower of the two bits), so setting the pattern after clearing leaves exactly `01` in bits 11 and 10. That is the output mode.
:::

In C you would write `*(volatile uint32_t *)0x40020014 ^= 0x20;` and hope every address and mask is right. One typo lands on a different peripheral, and the compiler cannot notice.

## Rung 2: the PAC, generated from the chip's own description

Chip makers publish a machine-readable description of every register on a chip, in an XML format called **[[SVD|svd-file]]** ("System View Description"). It lists every peripheral, register, offset, bit field and allowed value.

A tool called **svd2rust** reads that file and writes a Rust crate from it. The result is a **Peripheral Access Crate**, or **PAC**: one Rust type per peripheral, one method per register, one method per bit field, and enums for the allowed values. The `stm32f4` crate is the PAC for the STM32F4 family, and you pick the exact chip with a feature, here `stm32f411`.

Here is the LED blink written against the PAC. It builds for `thumbv7em-none-eabihf` with the set-up from lesson 01:

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use panic_halt as _;
use stm32f4::stm32f411;

#[entry]
fn main() -> ! {
    let dp = stm32f411::Peripherals::take().unwrap();

    // 1. Turn on the clock to GPIO port A.
    dp.RCC.ahb1enr().modify(|_, w| w.gpioaen().set_bit());
    // 2. Make pin PA5 a general-purpose output.
    dp.GPIOA.moder().modify(|_, w| w.moder5().output());

    loop {
        // 3. Flip the bit that drives PA5.
        dp.GPIOA.odr().modify(|r, w| w.odr5().bit(!r.odr5().bit()));
        cortex_m::asm::delay(8_000_000);
    }
}
```

Read the three steps against the example above. They are exactly the same three register writes, but every address, offset and mask now comes from the chip maker's file. `moder5().output()` writes the `01` pattern into bits 11 and 10 for you.

`modify` takes a **closure** (a small unnamed function, written between `|` bars) with two arguments: `r`, the value freshly read from the register, and `w`, a writer for the new value. So `modify` does a **read-modify-write**: read the whole register, change only the named field, write it back. The other 30 bits of `MODER` are left as they were.

The first line matters too. `Peripherals::take()` returns `Some` the first time it is called and `None` every time after. There is only one GPIOA on the chip, so the PAC lets only one owner hold it. That is the **[[singleton|singleton]]** pattern, and it is ownership from module 02 applied to hardware: two parts of the program cannot both believe they are in charge of the same pin.

::: warning The link error that says "critical section"
The first build of this program failed at the link step with

```text
rust-lld: error: undefined symbol: _critical_section_1_0_acquire
```

`take()` must be sure that two pieces of code cannot call it at the same instant, so it uses a **critical section**, a short stretch where interrupts are held off. The PAC does not know how to do that on your board, so you choose an implementation. On a single-core Cortex-M, turn on the `cortex-m` crate's feature: `cortex-m = { version = "0.7", features = ["critical-section-single-core"] }`. Lesson 04 explains critical sections properly.
:::

## Rung 3: the HAL makes the chip safe and friendly

A PAC is precise, but it is still a wall of switches. You must know that the clock goes on before the pin works, and nothing stops you from setting a pin's output bit while the pin is still an input.

A **HAL crate** ("hardware abstraction layer") is written by people who have read the reference manual for you. It sits on top of the PAC and offers pins, timers, serial ports, SPI and I2C buses as friendly Rust types. `stm32f4xx-hal` is the HAL for the STM32F4 family. Others include `nrf52840-hal` for Nordic chips, `rp2040-hal` for the Raspberry Pi RP2040, and the HALs of the Embassy project you will meet in the next lesson.

The best HALs use **[[typestate|typestate]]**: the mode of a pin is part of its *type*. A pin fresh out of reset is an input, and an input-mode pin has no `set_high` method. Calling `into_push_pull_output()` consumes the input pin (it is moved, as in module 02) and hands back a new value of an output type, which does have `set_high`. A whole class of wiring mistakes becomes a compile error.

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use embedded_hal::delay::DelayNs;
use embedded_hal::digital::OutputPin;
use panic_halt as _;
use stm32f4xx_hal::{pac, prelude::*};

/// Generic: works with any pin and any delay that implement embedded-hal 1.0.
fn blink<P: OutputPin, D: DelayNs>(led: &mut P, delay: &mut D, times: u32) -> Result<(), P::Error> {
    for _ in 0..times {
        led.set_high()?;
        delay.delay_ms(100);
        led.set_low()?;
        delay.delay_ms(400);
    }
    Ok(())
}

#[entry]
fn main() -> ! {
    let dp = pac::Peripherals::take().unwrap();
    let cp = cortex_m::Peripherals::take().unwrap();

    let mut rcc = dp.RCC.constrain();
    let gpioa = dp.GPIOA.split(&mut rcc);
    let mut led = gpioa.pa5.into_push_pull_output();
    let mut delay = cp.SYST.delay(&rcc.clocks);

    loop {
        blink(&mut led, &mut delay, 3).unwrap();
        delay.delay_ms(1000);
    }
}
```

Look at what disappeared. There is no clock bit: `split` turns on GPIOA's clock itself. There is no `MODER` mask: the type change does it. The delay comes from the core's **SysTick** timer (the system timer every Cortex-M has), and the HAL computes the counts from the real clock speed stored in `rcc.clocks`.

Now look at `blink`. It does not mention STM32 at all. It asks for *any* `P` that implements `OutputPin` and *any* `D` that implements `DelayNs`. Those two traits are the agreement from the opening. They come from embedded-hal.

::: warning HAL APIs change between versions
HAL crates are younger than embedded-hal and still change their method names between minor versions. In `stm32f4xx-hal` 0.23 the GPIO `split` takes `&mut rcc`; older examples on the internet call `split()` with no argument and no longer compile. When an example from a blog fails, check which HAL version it was written for before you doubt yourself, and read the HAL's own `examples/` folder for your version.
:::

## Rung 4: embedded-hal 1.0, the contract

**embedded-hal** is a crate of **traits** — in Rust, a trait is a list of methods that a type promises to provide, like a job description. It says what a digital pin, an I2C bus, an SPI bus or a delay *does*, without saying how any chip does it. After years of 0.2 releases, version 1.0 in January 2024 froze that contract, so driver authors and HAL authors can rely on it not moving.

The main traits in 1.0 are:

| Module | Trait | What it promises |
|---|---|---|
| `digital` | `OutputPin`, `InputPin`, `StatefulOutputPin` | set a pin high or low; read it |
| `i2c` | `I2c` | read, write and write-then-read on a two-wire bus |
| `spi` | `SpiBus`, `SpiDevice` | full-duplex transfers; a device with its own chip-select |
| `delay` | `DelayNs` | wait a number of nanoseconds, microseconds or milliseconds |
| `pwm` | `SetDutyCycle` | set how much of each cycle an output is on |

Every method returns a `Result`, and each implementation names its own `Error` type, so a bus fault on a real board is reported, not ignored. Three companion crates carry the rest: `embedded-hal-async` has `async` versions of the same traits (the next lesson uses them), `embedded-hal-nb` keeps the older polling style for serial ports, and `embedded-hal-bus` lets several drivers share one bus.

::: key What embedded-hal is
A set of traits defining what a digital pin, an SPI bus, an I2C bus or a delay does. Drivers are written against the traits, so one sensor driver works on every microcontroller whose HAL implements them; version 1.0 stabilized that contract.
:::

::: key The layers, bottom to top
SVD file → svd2rust → PAC (typed registers, one owner via `take()`) → HAL crate (safe pins, buses, clocks; implements the embedded-hal traits) → driver (generic over the traits) → your application.
:::

## A driver that does not know which chip it runs on

The **MPU-6050** is a small, cheap sensor chip with a 3-axis accelerometer and a 3-axis gyroscope, the kind of part used on hobby drones and student projects. It talks over **[[I2C|i2c-bus]]**, a two-wire bus where the microcontroller sends a device address, then a register number, then reads bytes back. Its datasheet says:

- its 7-bit I2C address is `0x68` (with its AD0 pin tied low);
- register `0x75`, `WHO_AM_I`, reads back `0x68` on a genuine part;
- registers `0x3B` to `0x40` hold the x, y and z acceleration, each as a 16-bit signed number sent high byte first;
- at the default range of $\pm 2\,g$, $16384$ counts equal $1\,g$.

Here is a driver for it, written only against `embedded_hal::i2c::I2c`. To try it on a laptop, the same file also contains a pretend bus that implements the same trait from an array of register values. Only the driver half would ship.

```rust
use core::convert::Infallible;
use embedded_hal::i2c::{ErrorType, I2c, Operation};

// ---------- the driver: written once, against the trait ----------

const MPU6050_ADDR: u8 = 0x68; // 7-bit I2C address with the AD0 pin low
const WHO_AM_I: u8 = 0x75; // identity register; reads 0x68 on a genuine part
const ACCEL_XOUT_H: u8 = 0x3B; // first of six acceleration bytes
const LSB_PER_G: f32 = 16384.0; // counts per g at the default +/-2 g range

pub struct Mpu6050<I> {
    i2c: I,
}

impl<I: I2c> Mpu6050<I> {
    pub fn new(i2c: I) -> Self {
        Mpu6050 { i2c }
    }

    pub fn who_am_i(&mut self) -> Result<u8, I::Error> {
        let mut buf = [0u8; 1];
        self.i2c.write_read(MPU6050_ADDR, &[WHO_AM_I], &mut buf)?;
        Ok(buf[0])
    }

    /// Acceleration in g along x, y, z.
    pub fn accel_g(&mut self) -> Result<[f32; 3], I::Error> {
        let mut raw = [0u8; 6];
        self.i2c.write_read(MPU6050_ADDR, &[ACCEL_XOUT_H], &mut raw)?;
        let mut out = [0.0f32; 3];
        for axis in 0..3 {
            let counts = i16::from_be_bytes([raw[2 * axis], raw[2 * axis + 1]]);
            out[axis] = counts as f32 / LSB_PER_G;
        }
        Ok(out)
    }
}

// ---------- a fake bus for the desk: it implements the same trait ----------

struct FakeBus {
    regs: [u8; 128],
    pointer: u8,
}

impl ErrorType for FakeBus {
    type Error = Infallible;
}

impl I2c for FakeBus {
    fn transaction(
        &mut self,
        _address: u8,
        operations: &mut [Operation<'_>],
    ) -> Result<(), Self::Error> {
        for op in operations {
            match op {
                Operation::Write(bytes) => self.pointer = bytes[0],
                Operation::Read(buf) => {
                    for b in buf.iter_mut() {
                        *b = self.regs[self.pointer as usize];
                        self.pointer += 1;
                    }
                }
            }
        }
        Ok(())
    }
}

fn main() {
    let mut regs = [0u8; 128];
    regs[0x75] = 0x68;
    // x = +0.5 g, y = -0.25 g, z = +1 g
    regs[0x3B..0x41].copy_from_slice(&[0x20, 0x00, 0xF0, 0x00, 0x40, 0x00]);

    let mut imu = Mpu6050::new(FakeBus { regs, pointer: 0 });
    println!("WHO_AM_I = {:#04x}", imu.who_am_i().unwrap());
    println!("accel (g) = {:?}", imu.accel_g().unwrap());
}
```

```text
WHO_AM_I = 0x68
accel (g) = [0.5, -0.25, 1.0]
```

Three things to notice.

1. `impl<I: I2c> Mpu6050<I>` reads "for any type `I` that implements `I2c`". The driver never names a chip.
2. To implement `I2c`, the fake bus writes one method, `transaction`. The trait provides `write_read` and the other methods on top of it. `ErrorType` says which error type the bus reports; the fake bus cannot fail, so it uses `Infallible`, a type with no values.
3. This file is an ordinary laptop program, so it can use `println!`. The driver half uses nothing from `std`, so it can move into a `#![no_std]` crate unchanged.

::: example Decoding the six acceleration bytes
The bus returned `20 00 F0 00 40 00`. Take them in pairs, high byte first, as the datasheet says (**[[big-endian|twos-complement]]**):

- x: `0x2000` $= 2 \times 16^3 = 8192$ counts. Divide by $16384$: $8192 / 16384 = 0.5\,g$.
- y: `0xF000`. The top bit is set, so as a signed 16-bit number it is negative: $\mathtt{0xF000} - 65536 = 61440 - 65536 = -4096$ counts. Then $-4096 / 16384 = -0.25\,g$.
- z: `0x4000` $= 16384$ counts, exactly $1\,g$.

That matches the program's output. Sanity check: a sensor lying flat and still should read about $1\,g$ on the axis pointing up and near zero on the others. This fake reading is tilted, which is why x and y are not zero, and its total is $\sqrt{0.5^2 + 0.25^2 + 1^2} \approx 1.146\,g$, a little over $1\,g$, so a real sensor showing this would also be accelerating a little.
:::

Now the payoff. Here is the same driver on the real chip, with I2C1 on pins PB8 (clock) and PB9 (data) at 400 kHz. This also builds for `thumbv7em-none-eabihf`:

```rust
#[entry]
fn main() -> ! {
    let dp = pac::Peripherals::take().unwrap();
    let mut rcc = dp.RCC.constrain();
    let gpiob = dp.GPIOB.split(&mut rcc);

    // I2C1 on PB8 (SCL) and PB9 (SDA), 400 kHz "fast mode".
    let i2c = dp.I2C1.i2c((gpiob.pb8, gpiob.pb9), 400.kHz(), &mut rcc);

    let mut imu = Mpu6050::new(i2c);
    let id = imu.who_am_i().unwrap();
    assert_eq!(id, 0x68);
    loop {}
}
```

(This is a fragment: it goes in a `#![no_std]` `#![no_main]` file with the `Mpu6050` driver and the imports from the HAL example.) The only chip-specific lines are the ones that build `i2c`. Move to a Nordic or RP2040 board and you change those lines; the driver is untouched. The same trick lets you test flight drivers on the desk with a fake bus, and the `embedded-hal-mock` crate provides ready-made fakes that also check the exact bytes a driver sends.

::: warning 7-bit and 8-bit addresses
I2C addresses are 7 bits, and on the wire the address is shifted left one place with a read/write bit added. Some datasheets print that shifted byte: `0x68` shifted left is $\mathtt{0x68} \times 2 = \mathtt{0xD0}$. embedded-hal uses the plain 7-bit address. If a sensor "is not answering", check whether you passed `0xD0` where `0x68` belongs.
:::

## Where each rung earns its place

On a real project you use all four rungs. The application and the sensor drivers sit on embedded-hal traits, so they can be unit-tested on a laptop and moved to a new board. The HAL handles clocks, pin modes and bus timing. And when the HAL lacks a feature — an unusual timer mode, a DMA set-up — you reach one rung down to the PAC for that one register, still with names and types from the chip maker's file.

Spacecraft teams choose chips for radiation tolerance and heritage long before they choose a language, and many flight parts are not in the mainstream Rust HALs. The layered design is the reason that is survivable: a team can generate a PAC with svd2rust from the part's SVD file, write the small HAL pieces it needs, and reuse every driver written against embedded-hal.

## Check yourself

::: check
On the STM32F411, the GPIOB base address is `0x40020400`. Using the offsets in this lesson, what is the address of `GPIOB_ODR`, and which bits of `GPIOB_MODER` set the mode of pin PB9?
:::

::: answer
`ODR` is at offset `0x14`, so $\mathtt{0x40020400} + \mathtt{0x14} = \mathtt{0x40020414}$. Each pin gets two bits of `MODER`, starting at bit $2n$, so PB9 uses bits $2 \times 9 = 18$ and $19$. (For I2C those two bits would hold `10`, alternate function, which the HAL's `i2c` constructor sets for you.)
:::

::: check
What does svd2rust take as input and what does it produce? Why is its output safer than writing addresses by hand?
:::

::: answer
It takes the chip maker's SVD file, an XML description of every peripheral, register, offset and bit field, and produces a PAC: a Rust crate with a type per peripheral, a method per register and field, and enums for allowed values. It is safer because the addresses and masks come from the maker's own description instead of being typed by hand, the field methods only touch their own bits in a read-modify-write, and `Peripherals::take()` gives each peripheral exactly one owner.
:::

::: check
With `stm32f4xx-hal`, why can you not call `set_high()` on a pin straight after `gpioa.split(&mut rcc)`?
:::

::: answer
Because of typestate. Right after `split`, the pin is in its reset mode, input, and its type is an input-pin type, which has no `set_high` method. Calling `into_push_pull_output()` consumes that value and returns one of an output type, and only that type implements `OutputPin`. The mistake is caught at compile time rather than on the bench.
:::

::: check
A classmate wrote an MPU-6050 driver whose methods take a `stm32f4xx_hal::i2c::I2c<pac::I2C1>` directly. What goes wrong when the team moves to a Nordic nRF52840 board, and how would you change the driver?
:::

::: answer
The driver names an STM32 type, so it will not compile against the Nordic HAL's I2C type; it has to be rewritten. Make the driver generic instead: `struct Mpu6050<I> { i2c: I }` with `impl<I: embedded_hal::i2c::I2c> Mpu6050<I>`, returning `Result<_, I::Error>`. Any HAL that implements the embedded-hal 1.0 `I2c` trait, Nordic's included, then works unchanged, and so does a fake bus for desk tests.
:::

::: check
An MPU-6050 returns `C0 00` for its x-axis acceleration at the $\pm 2\,g$ range. What is the reading in $g$?
:::

::: answer
`0xC000` is $49152$ unsigned. The top bit is set, so as a signed 16-bit number it is $49152 - 65536 = -16384$ counts. Dividing by $16384$ counts per $g$ gives $-1.0\,g$: the x axis is pointing straight down.
:::

## Summary

| Rung | What it is | Example |
|---|---|---|
| Register | A 32-bit box at a fixed address that controls hardware | `GPIOA_ODR` at `0x40020014` |
| SVD file | The chip maker's XML description of every register | `STM32F411.svd` |
| PAC | Crate generated by svd2rust; typed registers, single owner | `stm32f4`, `dp.GPIOA.odr().modify(...)` |
| HAL crate | Safe pins, clocks and buses on top of a PAC; typestate | `stm32f4xx-hal`, `into_push_pull_output()` |
| embedded-hal 1.0 | Traits: `OutputPin`, `I2c`, `SpiDevice`, `DelayNs`, ... | `fn blink<P: OutputPin, D: DelayNs>` |
| Driver | Generic over the traits, so it runs on any chip | `impl<I: I2c> Mpu6050<I>` |

A real flight board rarely does one thing at a time: it runs a control loop, reads sensors, and talks to the ground all at once. The next lesson shows the two main Rust frameworks for that, Embassy and RTIC, and the two all-Rust microcontroller operating systems, Hubris and Tock.

::: context memory-mapped-io Switches that live at addresses
The processor talks to memory and to peripherals over the same wires. A range of addresses is wired to RAM, another to flash, and others to the registers of each peripheral. So "store 32 at `0x40020014`" and "store 32 in a variable" are the same instruction; only the address decides what happens.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="140" height="28" fill="#fff" stroke="#1f2a44"/><text x="90" y="38" font-size="11" text-anchor="middle" fill="#1f2a44">flash 0x0800_0000</text>
  <rect x="20" y="48" width="140" height="28" fill="#fff" stroke="#1f2a44"/><text x="90" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">RAM 0x2000_0000</text>
  <rect x="20" y="76" width="140" height="28" fill="#8fb8f0" stroke="#1f2a44"/><text x="90" y="94" font-size="11" text-anchor="middle" fill="#1f2a44">GPIOA 0x4002_0000</text>
  <rect x="20" y="104" width="140" height="28" fill="#f2b880" stroke="#1f2a44"/><text x="90" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">RCC 0x4002_3800</text>
  <line x1="160" y1="90" x2="230" y2="90" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="255" cy="90" r="20" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="255" y="94" font-size="11" text-anchor="middle" fill="#1d6fd1">LED</text>
  <text x="195" y="82" font-size="11" text-anchor="middle" fill="#1d6fd1">pin PA5</text>
  <text x="90" y="150" font-size="11" text-anchor="middle" fill="#6c7a93">one address space, lowest at top</text>
</svg>
```

In C you must mark such accesses `volatile` so the compiler does not remove "useless" writes; the PAC does the equivalent inside its register methods.
:::

::: context svd-file Where SVD files come from
SVD is part of Arm's CMSIS standard (Common Microcontroller Software Interface Standard). Chip makers publish an SVD file for each Cortex-M part, usually in their software packs, and debuggers use the same files to show register contents by name. The files are written by people and occasionally contain mistakes, so the Rust PAC projects keep small patch files that fix known errors before running svd2rust.
:::

::: context singleton Only one of each
A singleton is a type of which only one value may ever exist. Real hardware is like that: the chip has exactly one GPIOA. By handing out the peripherals once, through `take()`, and then relying on ownership and borrowing, the PAC lets the compiler check that no two parts of the program drive the same peripheral behind each other's backs. There is an `unsafe fn steal()` for the rare case where you must break the rule, and the word `unsafe` marks exactly where to look during a review.
:::

::: context typestate The type remembers the state
Typestate means encoding the state of a thing in its type, so illegal operations for that state do not exist.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="130" height="44" rx="6" fill="#fff" stroke="#1f2a44"/>
  <text x="75" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">PA5 &lt;Input&gt;</text>
  <text x="75" y="66" font-size="11" text-anchor="middle" fill="#6c7a93">is_high()</text>
  <rect x="220" y="30" width="130" height="44" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="285" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">PA5 &lt;Output&gt;</text>
  <text x="285" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">set_high(), set_low()</text>
  <line x1="140" y1="52" x2="212" y2="52" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="220,52 210,47 210,57" fill="#1d6fd1"/>
  <text x="180" y="22" font-size="11" text-anchor="middle" fill="#1d6fd1">into_push_pull_output()</text>
  <text x="180" y="100" font-size="11" text-anchor="middle" fill="#b4232c">the old value is moved: it cannot be used again</text>
</svg>
```

Because the conversion consumes the old value, there is never an "input" handle and an "output" handle to the same pin at once.
:::

::: context i2c-bus Two wires, many devices
I2C (say "I squared C", from "inter-integrated circuit") uses only two wires: SCL, a clock the microcontroller drives, and SDA, which carries data both ways. Many devices hang on the same two wires, each answering only to its own address. Speeds are commonly 100 kHz ("standard mode") or 400 kHz ("fast mode"). It is slow compared with SPI, but saves pins and wiring, which is why so many small sensors use it. SPI, the other common bus, uses separate wires for each direction plus one chip-select wire per device, and runs at several megahertz.
:::

::: context twos-complement Reading a negative number from two bytes
The sensor sends each reading as a 16-bit **two's-complement** number, the same format as Rust's `i16`: values from `0x0000` to `0x7FFF` are $0$ to $32767$, and values from `0x8000` to `0xFFFF` are negative, found by subtracting $65536$. It sends the high byte first, which is called big-endian. `i16::from_be_bytes([hi, lo])` does both jobs at once, "from big-endian bytes", and returns the signed number. Getting either half wrong gives readings that jump between huge positive and negative values, a classic first-day bug with a new sensor.
:::
