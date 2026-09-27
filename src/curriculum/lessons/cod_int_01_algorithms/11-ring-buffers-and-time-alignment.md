---
id: l11-ring-buffers-and-time-alignment
title: Ring buffers and time alignment
minutes: 20
covers:
  - 'The engineering variants: binary protocol decommutation, telemetry dropout detection, two-rate time alignment, ring buffer, PID with anti-windup, running median over a stream'
---

A car's dashboard camera records all the time, but its memory card is small. It never fills up and stops. When the card is full, the camera records over the oldest footage. So at any moment the card holds the last few minutes of driving — which is exactly what you want after a fender bender. You never needed last Tuesday. You need the thirty seconds before the bump.

A spacecraft does the same thing with its sensor data. It keeps the most recent readings in a fixed block of memory, writing over the oldest ones as new ones arrive. When something goes wrong, it freezes that block and sends it down, so engineers can see the moments before the fault. The structure that does this is a **ring buffer**: a fixed-size list used as if its end joined back round to its start.

This lesson builds one, then solves a second everyday telemetry problem: two sensors that report at different rates, and the need to know what both said at the same instant. Last lesson turned a byte stream into readings. This lesson stores them and lines them up.

## The ring buffer idea

Picture the memory as a circle of numbered slots, like the hours on a clock. A **write position** moves round the circle. Each new item goes into the slot at the write position, and the position moves one step on. After the last slot, it wraps back to slot 0.

To make that precise, keep three things:

- an array `buf` of fixed **capacity** $N$ — the most items it can ever hold;
- `start`, the index of the **oldest** item;
- `len`, how many items are stored right now, from 0 up to $N$.

Every other position follows from those. The item that is $i$ places after the oldest lives at index

$$
(\text{start} + i) \bmod N .
$$

Read "mod" as the remainder after dividing by $N$. It is what makes the wrap happen: with $N = 4$, index $5 \bmod 4 = 1$, so "slot 5" is really slot 1. This is **[[clock arithmetic|modulo-clock]]**: 3 hours after 11 o'clock is 2 o'clock, not 14.

The three operations are then:

1. **Push** a new item. Write it at $(\text{start} + \text{len}) \bmod N$, the slot just past the newest item. If the buffer was not full, add 1 to `len`. If it was full, that slot held the oldest item, which is now gone, so move `start` on by one instead.
2. **Pop the oldest.** If `len` is 0, report "empty". Otherwise read `buf[start]`, move `start` on by one (mod $N$), and subtract 1 from `len`.
3. **Read in order.** For $i$ from 0 to $\text{len} - 1$, read `buf[(start + i) % N]`. That lists the items oldest first.

Push and pop each do a fixed handful of steps, whatever $N$ is, so each is $O(1)$ time. Reading all items is $O(\text{len})$. The memory is $N$ slots, allocated once when the buffer is made, and it never grows or shrinks.

::: example Tracing a ring of four
Capacity $N = 4$. Push 1, 2, 3, 4, 5, 6, then pop once.

**Push 1 to 4.** Start is 0. Each push writes at $(0 + \text{len}) \bmod 4$: slots 0, 1, 2, 3. After four pushes, `buf` is `[1, 2, 3, 4]`, start is 0 and len is 4. The buffer is full.

**Push 5.** Write at $(0 + 4) \bmod 4 = 0$. That overwrites the 1. The buffer was full, so start moves to 1 and len stays 4. `buf` is `[5, 2, 3, 4]`.

**Push 6.** Write at $(1 + 4) \bmod 4 = 1$, overwriting the 2. Start moves to 2. `buf` is `[5, 6, 3, 4]`.

**Read in order.** Slots $(2 + i) \bmod 4$ for $i = 0, 1, 2, 3$ are 2, 3, 0, 1, holding 3, 4, 5, 6. Oldest first, that is `[3, 4, 5, 6]`.

**Pop.** Read `buf[2]`, which is 3. Start becomes 3, len becomes 3. Remaining, oldest first: `[4, 5, 6]`.

Sanity check: six items went in and the buffer keeps only four, so the two oldest, 1 and 2, should be gone. They are. The pop removed the oldest survivor, 3, as it should.
:::

::: warning Full and empty can look the same
Some ring buffers keep a `head` and a `tail` index instead of a start and a length. Then an empty buffer and a full one both have `head == tail`, and the code cannot tell them apart. Either keep a separate count, as above, or leave one slot always unused so "full" means `tail` is one step behind `head`. Say which you chose. Mixing the two ideas is the classic off-by-one.
:::

### Overwrite or refuse?

When the buffer is full and a new item arrives, something has to give. This choice is the **overwrite policy**, and it depends on what the data is for.

- **Overwrite the oldest.** Right for telemetry and fault logs, where the newest data matters most. The dashcam does this.
- **Refuse the newest.** Right for a queue of commands waiting to be sent to a thruster. Silently dropping an old command could be dangerous, so the push reports failure and the caller decides what to do.

In an interview, ask which policy is wanted, or state the one you are assuming. That one question shows you are thinking about the system, not only the code.

### Why flight software loves it

Many flight programs forbid **[[dynamic memory allocation|no-malloc]]** once the software is running. Asking for new memory in the middle of a control loop can take an unpredictable time, or fail. A ring buffer never asks. It is sized once, at startup, and after that every push and pop is a few arithmetic steps. It also keeps exactly the recent window you want for a **[[post-fault snapshot|black-box]]**: when a fault is detected, the buffer already holds the last few seconds leading up to it.

The sizing is simple arithmetic. To keep the last 60 seconds of a 100 Hz sensor, you need $100 \times 60 = 6000$ slots. If each sample is 16 bytes, that is $6000 \times 16 = 96{,}000$ bytes, about 96 kB, reserved once.

::: key Why the ring buffer comes up so often
It is the flight-software telemetry structure: fixed memory, O(1) push, never allocates, and naturally retains the most recent window for a post-fault snapshot. It also exercises modular arithmetic and off-by-one care in ten lines.
:::

That is also why interviewers like it. It is small enough to write in ten minutes. It maps directly onto code that really flies. And it opens a conversation: what happens when full, what happens when empty, what capacity 1 does, and whether anything ever allocates. That conversation is most of what is being graded.

## A fixed-capacity ring in C++

In C++, `std::array<T, N>` is a fixed-size array whose size $N$ is part of its type. It lives inside the object, not on the heap, so a `Ring` made this way never allocates at all. Here is a version. It returns **[[std::optional|std-optional]]** from `pop_oldest`, so "empty" is an answer rather than a crash.

```cpp
// int01_l11_ring.cpp -- fixed-capacity ring buffer, no heap allocation
#include <array>
#include <cstddef>
#include <cstdio>
#include <optional>

template <typename T, std::size_t N>
class Ring {
    static_assert(N >= 1, "capacity must be at least 1");
    std::array<T, N> buf_{};   // storage lives inside the object
    std::size_t start_ = 0;    // index of the oldest item
    std::size_t len_ = 0;      // how many items are stored

public:
    // O(1). When full, the oldest item is overwritten.
    void push(const T& x) {
        buf_[(start_ + len_) % N] = x;
        if (len_ == N) start_ = (start_ + 1) % N;   // drop the oldest
        else ++len_;
    }
    // O(1). Empty buffer gives std::nullopt instead of crashing.
    std::optional<T> pop_oldest() {
        if (len_ == 0) return std::nullopt;
        T x = buf_[start_];
        start_ = (start_ + 1) % N;
        --len_;
        return x;
    }
    // O(1). Item i counted from the oldest (i = 0).
    const T& at(std::size_t i) const { return buf_[(start_ + i) % N]; }
    std::size_t size() const { return len_; }
    static constexpr std::size_t capacity() { return N; }
};

template <typename T, std::size_t N>
void show(const char* label, const Ring<T, N>& r) {
    std::printf("%-12s[", label);
    for (std::size_t i = 0; i < r.size(); ++i) std::printf(i ? " %d" : "%d", r.at(i));
    std::printf("]  size %zu of %zu\n", r.size(), r.capacity());
}

int main() {
    Ring<int, 4> r;
    show("empty", r);
    for (int v = 1; v <= 4; ++v) r.push(v);
    show("full", r);
    r.push(5);
    r.push(6);
    show("after 5, 6", r);
    auto a = r.pop_oldest();
    std::printf("popped %d\n", *a);
    show("after pop", r);
    while (r.pop_oldest()) {}
    std::printf("empty pop has value? %s\n", r.pop_oldest() ? "yes" : "no");
    std::printf("sizeof(Ring<int, 4>) = %zu bytes\n", sizeof(Ring<int, 4>));
    return 0;
}
```

```bash
g++ -std=c++17 -Wall -o int01_l11_ring int01_l11_ring.cpp && ./int01_l11_ring
# empty       []  size 0 of 4
# full        [1 2 3 4]  size 4 of 4
# after 5, 6  [3 4 5 6]  size 4 of 4
# popped 3
# after pop   [4 5 6]  size 3 of 4
# empty pop has value? no
# sizeof(Ring<int, 4>) = 32 bytes
```

The output matches the hand trace. The last line shows the whole buffer is 32 bytes: four 4-byte `int` slots plus two 8-byte counters, on a typical 64-bit machine. Nothing was ever requested from the heap. The `static_assert` stops a capacity of 0 at compile time, so the `% N` can never divide by zero.

**Complexity:** push, pop and `at` are $O(1)$ time; memory is $O(N)$, fixed at compile time.

::: note A faster wrap when N is a power of two
The `%` operator is a division, which is slower than most arithmetic on small processors. If $N$ is a power of two, $x \bmod N$ equals `x & (N - 1)`: keeping the low bits is the same as taking the remainder. That is the bit trick from lesson 7. Many flight and driver ring buffers pick capacities like 256 or 1024 for this reason. Mention it as an option; do not force it into an interview answer unless asked.
:::

### Your turn: the Python version

The module's second exercise asks you to write the same thing in Python. Here is what it wants, so you can plan it before you open the editor.

- `RingBuffer(capacity)` makes one list of `capacity` slots, once. A capacity below 1 raises `ValueError`.
- `push(item)` adds an item, overwriting the oldest when full.
- `pop_oldest()` removes and returns the oldest item, or returns `None` when empty.
- `to_list()` returns the items oldest first.
- `len(rb)` gives the count, through a `__len__` method, and `capacity()` gives $N$.

Every operation except `to_list` must be $O(1)$, and the backing list must never change length. That rules out `append` and `pop(0)`. Use the start-and-length design above. Before you call it finished, test it yourself: an empty pop, capacity 1, pushing far past capacity, and popping everything then pushing again.

::: warning Do not reach for deque in the room
Python's `collections.deque(maxlen=N)` already behaves like an overwriting ring buffer, and in real code it is the right tool. But when the question is "implement a ring buffer", using it skips everything being tested. Say that you know it exists, then write the index arithmetic yourself.
:::

## Two sensors, two rates

Now the second problem. A runner's watch measures heart rate every second but gets a GPS position only every ten seconds. To ask "how hard was I working on that hill?", you need both numbers at the same moments. One of them has to be estimated between its samples.

A spacecraft or rocket has the same problem all the time. An **[[IMU|imu-gps]]** (inertial measurement unit: accelerometers and gyros) might report at 100 Hz, while a GPS receiver reports at 10 Hz. Worse, their clocks rarely tick together: the GPS fixes might land 7.5 ms after the IMU samples. Before you can compare or combine them, you have to **align** them: estimate one signal at the other's timestamps. This is **two-rate time alignment**.

Take the fast IMU samples, with times $t_0 < t_1 < \dots$ and values $v_0, v_1, \dots$, and one query time $t$ from the slow sensor. First find the **bracketing pair**: the IMU samples at $t_j$ and $t_{j+1}$ with $t_j \le t < t_{j+1}$. Then choose how to estimate.

**Nearest sample.** Use whichever of $v_j$ and $v_{j+1}$ is closer in time. Simple, and it never invents a value that was not measured. But the answer jumps in steps, and its error can be up to half a sample period's worth of change.

**[[Linear interpolation|lerp-picture]].** Draw a straight line between the two samples and read it at $t$. The fraction of the way from $t_j$ to $t_{j+1}$ is

$$
\alpha = \frac{t - t_j}{t_{j+1} - t_j},
$$

read "alpha", a number from 0 to 1. The estimate is

$$
v(t) \approx v_j + \alpha \,(v_{j+1} - v_j).
$$

At $\alpha = 0$ this gives $v_j$, at $\alpha = 1$ it gives $v_{j+1}$, and in between it slides along the line.

::: example One GPS time between two IMU samples
The IMU reads $9.70\,\mathrm{m/s^2}$ at $t = 120\,\mathrm{ms}$ and $9.90\,\mathrm{m/s^2}$ at $t = 130\,\mathrm{ms}$. A GPS fix is stamped $127.5\,\mathrm{ms}$. What was the IMU reading then?

**Find the fraction.** $\alpha = (127.5 - 120) / (130 - 120) = 7.5 / 10 = 0.75$. The fix is three quarters of the way from the first sample to the second.

**Interpolate.** The change between samples is $9.90 - 9.70 = 0.20$. Three quarters of it is $0.75 \times 0.20 = 0.15$. So $v \approx 9.70 + 0.15 = 9.85\,\mathrm{m/s^2}$.

**Nearest instead.** 127.5 ms is 7.5 ms from the first sample and 2.5 ms from the second, so nearest-sample gives $9.90\,\mathrm{m/s^2}$.

Sanity check: the interpolated 9.85 sits between 9.70 and 9.90, and closer to 9.90, because the fix is closer to the later sample. Both estimates agree to within 0.05, the size of a quarter of the step between samples.
:::

::: warning Do not extrapolate off the ends
If the query time is before the first fast sample or after the last one, there is no bracketing pair. Extending the line past the data is **extrapolation**, and it can produce confident nonsense. Return NaN or "no value" and let the caller decide. Also make sure both series use the same clock and the same units before you align anything; an unnoticed offset between clocks is a far bigger error than the choice of method.
:::

## The two-pointer merge

The slow way to find each bracketing pair is to scan the fast list from the start for every query. With $n$ fast samples and $m$ queries, that is $O(n \cdot m)$. A binary search per query, from lesson 4, brings it down to $O(m \log n)$.

But both lists are already sorted by time, and the queries arrive in order. So the bracketing index $j$ for the next query can only be the same as for this one, or later. It never goes back. That is the **[[two-pointer|two-pointer-bridge]]** pattern from lesson 3: one pointer walks the slow list, the other walks the fast list, and neither ever moves backwards.

```python
# int01_l11_align.py -- put a 100 Hz signal onto 10 Hz timestamps
import math

def align(fast_t, fast_v, slow_t, mode="linear"):
    """For each slow time, the fast signal's value there.
    Both time lists sorted. O(n + m) time, O(m) extra space."""
    out = []
    j = 0
    n = len(fast_t)
    for t in slow_t:
        # advance j until fast_t[j] <= t < fast_t[j + 1]
        while j + 1 < n and fast_t[j + 1] <= t:
            j += 1
        if n == 0 or t < fast_t[0] or t > fast_t[-1]:
            out.append(float("nan"))          # outside the data: do not guess
        elif j + 1 == n or fast_t[j] == t:
            out.append(fast_v[j])             # exactly on a sample
        elif mode == "nearest":
            nearer = j if t - fast_t[j] <= fast_t[j + 1] - t else j + 1
            out.append(fast_v[nearer])
        else:
            frac = (t - fast_t[j]) / (fast_t[j + 1] - fast_t[j])
            out.append(fast_v[j] + frac * (fast_v[j + 1] - fast_v[j]))
    return out

# IMU: 100 Hz, times in ms; a smooth made-up signal
imu_t = [10 * i for i in range(51)]                      # 0 .. 500 ms
imu_v = [round(9.81 + 0.5 * math.sin(i / 8), 4) for i in range(51)]
# GPS: 10 Hz, but its clock is offset by 7.5 ms
gps_t = [7.5 + 100 * k for k in range(6)]                # 7.5 .. 507.5 ms

lin = align(imu_t, imu_v, gps_t)
near = align(imu_t, imu_v, gps_t, mode="nearest")
for t, a, b in zip(gps_t, near, lin):
    print(f"t={t:6.1f} ms  nearest={a:.4f}  linear={b:.4f}")

# a tiny hand-checkable case
print(align([120, 130], [9.70, 9.90], [127.5]),
      align([120, 130], [9.70, 9.90], [127.5], mode="nearest"))

truth = [9.81 + 0.5 * math.sin(t / 80) for t in gps_t[:-1]]
err_n = max(abs(a - b) for a, b in zip(near, truth))
err_l = max(abs(a - b) for a, b in zip(lin, truth))
print(f"worst error: nearest {err_n:.4f}, linear {err_l:.4f}")
```

```bash
python3 int01_l11_align.py
# t=   7.5 ms  nearest=9.8723  linear=9.8567
# t= 107.5 ms  nearest=10.3004  linear=10.2964
# t= 207.5 ms  nearest=10.0570  linear=10.0701
# t= 307.5 ms  nearest=9.4753  linear=9.4875
# t= 407.5 ms  nearest=9.3520  linear=9.3466
# t= 507.5 ms  nearest=nan  linear=nan
# [9.85] [9.9]
# worst error: nearest 0.0155, linear 0.0007
```

Read the output from the top. Each GPS time gets an IMU estimate both ways. The last GPS time, 507.5 ms, is past the last IMU sample at 500 ms, so both methods refuse and return NaN. The hand example comes out at 9.85 and 9.9, as worked above. And because this test signal is a known smooth curve, we can compare against the truth: linear interpolation is about twenty times more accurate here than nearest-sample.

**Complexity.** The inner `while` looks like a loop inside a loop, but `j` only ever increases, and it can increase at most $n - 1$ times over the whole run. The outer loop runs $m$ times. So the total work is $O(n + m)$ time. The output list is $O(m)$ space, and nothing else grows. This is the same "each index moves forward at most $n$ times" argument as the monotonic deque in lesson 3.

::: note Which way to align
Here the fast signal was estimated at the slow sensor's times, which throws away most of the fast samples. That is **downsampling**, and it is safe. The reverse, estimating the slow GPS at every IMU time, is **upsampling**: it produces ten interpolated GPS values for every real one, and those in-between values contain no new information. Both are legitimate; say which you are doing and why. Real navigation filters go further and use each measurement at its own time, which is a topic for the estimation modules.
:::

## Check yourself

::: check
A ring buffer has capacity 5. Starting empty, you push the letters A through H in order, then pop twice. Give `start`, `len` and the contents oldest first, and say which slot the next push will use.
:::

::: answer
Pushes A to E fill slots 0 to 4 with start 0 and len 5. F goes to $(0 + 5) \bmod 5 = 0$, overwriting A; start becomes 1. G goes to $(1 + 5) \bmod 5 = 1$, overwriting B; start becomes 2. H goes to $(2 + 5) \bmod 5 = 2$, overwriting C; start becomes 3. Now the slots hold F, G, H, D, E, and oldest first the contents are D, E, F, G, H. Popping twice returns D then E; start becomes $3 + 2 = 5$, which wraps to 0, and len becomes 3. Contents: F, G, H. The next push goes to $(0 + 3) \bmod 5 = 3$, the slot after H.
:::

::: check
What does a ring buffer of capacity 1 do, and which line of the push code handles it?
:::

::: answer
It holds only the newest item. The first push writes slot 0 and len becomes 1. Every later push writes slot $(0 + 1) \bmod 1 = 0$ again, and because len equals the capacity, start moves to $(0 + 1) \bmod 1 = 0$. So start stays 0, len stays 1, and each push replaces the old value. The "if full, move start on" branch handles it with no special case, which is a good test that the wrap logic is right.
:::

::: check
You need to keep the last 10 seconds of 400 Hz gyro data, each sample three 4-byte floats plus an 8-byte timestamp. How many slots, and how many bytes does the buffer reserve?
:::

::: answer
Slots: $400 \times 10 = 4000$. Each sample is $3 \times 4 + 8 = 20$ bytes. Memory: $4000 \times 20 = 80{,}000$ bytes, about 80 kB, reserved once at startup. Push and pop stay $O(1)$ no matter how big the buffer is, so a larger window costs memory, not time.
:::

::: check
A star tracker reports at 4 Hz and you want its angle at the times of 20 Hz IMU samples. The tracker read $10.0^\circ$ at $t = 0.50$ s and $12.0^\circ$ at $t = 0.75$ s. Estimate the angle at $t = 0.60$ s by linear interpolation and by nearest sample.
:::

::: answer
$\alpha = (0.60 - 0.50) / (0.75 - 0.50) = 0.10 / 0.25 = 0.4$. Linear: $10.0 + 0.4 \times (12.0 - 10.0) = 10.0 + 0.8 = 10.8^\circ$. Nearest: 0.60 s is 0.10 s from the first sample and 0.15 s from the second, so nearest gives $10.0^\circ$. This is upsampling — estimating the slow signal at the fast times — so remember that the in-between values carry no new measurement.
:::

::: check
The alignment loop has a `while` inside a `for`. A classmate says that makes it $O(n \cdot m)$. How do you answer?
:::

::: answer
Count how many times the inner body can run in total, not per outer step. Its only action is `j += 1`, `j` starts at 0 and never decreases, and it stops before $n - 1$. So across the whole run the inner body runs at most $n - 1$ times. The outer loop runs $m$ times with constant extra work each. Total: $O(n + m)$. The nested shape only means $O(n \cdot m)$ when the inner loop restarts from the beginning each time, and this one never does.
:::

## Summary

| Idea | What it means | Cost or formula |
| --- | --- | --- |
| ring buffer | fixed array used as a circle | push and pop $O(1)$, memory $O(N)$ fixed |
| slot of item $i$ | wrap with the remainder | $(\text{start} + i) \bmod N$ |
| overwrite policy | what a full buffer does | overwrite oldest for telemetry; refuse for commands |
| no allocation | memory reserved once | no pauses or failures mid-loop |
| full vs empty | ambiguous with two indices alone | keep a count, or leave one slot spare |
| nearest sample | take the closer reading | never invents a value; steps |
| linear interpolation | read a straight line between samples | $v_j + \alpha(v_{j+1} - v_j)$ |
| two-pointer alignment | both lists sorted, pointers only advance | $O(n + m)$ time, $O(m)$ space |
| extrapolation | guessing past the data | return NaN instead |

Next lesson closes the module with the last two engineering variants: a PID controller that does not wind itself up when its motor is maxed out, and a median that stays up to date as readings stream in.

::: context modulo-clock Counting on a circle
The mod operation is how a clock face counts. Eleven o'clock plus three hours is fourteen, and fourteen mod twelve is 2, so the hand points at 2. A ring buffer with $N$ slots is a clock with $N$ hours. The picture shows capacity 4 after pushing 1 to 6 in the lesson's trace: start points at slot 2, the oldest surviving item, and the next write goes to slot $(2 + 4) \bmod 4 = 2$, on top of it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="90" r="60" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <g stroke="#1f2a44">
    <rect x="92" y="12" width="36" height="30" fill="#8fb8f0"/>
    <rect x="152" y="75" width="36" height="30" fill="#8fb8f0"/>
    <rect x="92" y="138" width="36" height="30" fill="#1d6fd1"/>
    <rect x="32" y="75" width="36" height="30" fill="#8fb8f0"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="110" y="32">5</text>
    <text x="170" y="95">6</text>
    <text x="110" y="158" fill="#ffffff">3</text>
    <text x="50" y="95">4</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="146" y="30">slot 0</text>
    <text x="170" y="120">slot 1</text>
    <text x="146" y="172">slot 2</text>
    <text x="50" y="68">slot 3</text>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="215" y="60">start = 2 (oldest: 3)</text>
    <text x="215" y="82">len = 4 (full)</text>
    <text x="215" y="104">oldest first:</text>
    <text x="215" y="124">3, 4, 5, 6</text>
  </g>
</svg>
```
:::

::: context no-malloc Why flight code avoids new memory
Asking the operating system for memory while running — `malloc`, `new`, or a Python list that grows — takes a time that is hard to bound and can fail when memory is fragmented. A control loop that must finish every 10 ms cannot afford either surprise. So widely used safety-critical coding rules, such as Gerard Holzmann's "Power of Ten" rules written at NASA's Jet Propulsion Laboratory, say not to allocate memory dynamically after initialization. Everything is sized at startup, and structures like the ring buffer are how you live within that rule.
:::

::: context black-box The same idea as a flight recorder
An airliner's flight data recorder, the "black box", keeps a rolling record and overwrites the oldest data once its storage is full, so after an accident investigators have the final hours of flight. Spacecraft software does a smaller version in memory: a fault-protection routine that detects, say, a reaction wheel over-speed can freeze the ring buffer and mark it for downlink. The engineers on the ground then see the seconds leading up to the fault, which is usually where the cause is.
:::

::: context std-optional A box that may be empty
`std::optional<T>`, added in C++17, holds either a `T` or nothing. `pop_oldest` on an empty buffer returns `std::nullopt`, the "nothing" value. The caller tests it like a yes-or-no, as in `while (r.pop_oldest())`, and reads the value with `*`. This is the C++ counterpart of Python returning `None`. The alternatives are worse: throwing an exception in flight code is often forbidden, and returning a made-up value like 0 cannot be told apart from a real reading of 0.
:::

::: context imu-gps Fast and slow navigation sensors
An IMU measures acceleration and rotation rate directly and quickly, often hundreds of times a second, but small errors pile up when you integrate its readings into a position. GPS gives position with errors that do not pile up, but only a few to a few tens of times a second, and each fix arrives a little late. Navigation software uses both: the IMU for fast, smooth motion and GPS to pull the drift back. Lining up their timestamps is the first step of any such blend.
:::

::: context lerp-picture A straight line between two dots
The picture shows the lesson's example. The two blue dots are the IMU samples at 120 ms and 130 ms. The GPS fix at 127.5 ms is three quarters of the way across, so the linear estimate (orange) sits three quarters of the way up the line, at 9.85. Nearest-sample (red) would jump to the later dot's 9.90. Programmers call linear interpolation "lerp".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="20" x2="50" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="90" y1="120" x2="290" y2="40" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="240" y1="140" x2="240" y2="30" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <circle cx="90" cy="120" r="6" fill="#1d6fd1"/>
  <circle cx="290" cy="40" r="6" fill="#1d6fd1"/>
  <circle cx="240" cy="60" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="240" cy="40" r="5" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44">
    <text x="78" y="156">120</text>
    <text x="228" y="156">127.5</text>
    <text x="278" y="156">130 ms</text>
    <text x="98" y="116">9.70</text>
    <text x="298" y="44">9.90</text>
    <text x="178" y="64">9.85</text>
    <text x="196" y="30" fill="#b4232c">nearest 9.90</text>
  </g>
</svg>
```

Horizontal and vertical positions are to scale: 7.5 of 10 ms is 150 of 200 units, and 0.15 of 0.20 is 60 of 80 units.
:::

::: context two-pointer-bridge Same trick, new clothes
In lesson 3, two pointers walked one sorted array from both ends, or a slow and a fast pointer walked it in the same direction. Here the two pointers walk two different sorted lists, but the reason it is fast is identical: neither pointer ever goes backwards, so the total number of moves is bounded by the lengths of the lists. Merging two sorted lists, as in merge sort, is the same pattern again. When you see two sorted inputs, ask whether a pair of forward-only pointers will do.
:::
