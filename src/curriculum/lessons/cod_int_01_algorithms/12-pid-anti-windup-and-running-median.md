---
id: l12-pid-anti-windup-and-running-median
title: PID with anti-windup and the running median
minutes: 22
covers:
  - 'The engineering variants: binary protocol decommutation, telemetry dropout detection, two-rate time alignment, ring buffer, PID with anti-windup, running median over a stream'
---

Think about a car's cruise control climbing a long, steep hill. The car slows below the set speed, so the controller asks for more throttle. The pedal hits the floor, and the car still cannot keep up. A badly built cruise control keeps getting more and more "impatient" the whole way up, remembering every second it was too slow. At the top of the hill the road flattens, the car speeds up — and the controller, still full of stored impatience, keeps the throttle floored well past the set speed. You overshoot, then it has to back off hard.

That stored impatience is called **integrator windup**, and fixing it is the fifth engineering variant in this module. The sixth is a quieter one: keeping the **median** of a stream of readings — the middle value — up to date as each new reading arrives, without re-sorting everything each time. Both are short to write, both run on real vehicles, and both reward saying the complexity out loud.

This is the last lesson of the module. It finishes the six variants that the module wants you to be able to write from memory.

## A PID controller in one page

A **controller** looks at how far a system is from where you want it and decides what command to send. The target is the **setpoint** $r$. The measured value is $y$. The **error** is how far off you are:

$$
e = r - y .
$$

A **[[PID controller|pid-history]]** adds up three reactions to that error:

- **P, proportional:** push in proportion to the error now. Far off, push hard. Close, push gently.
- **I, integral:** push in proportion to the error *accumulated over time*. If a small error lingers, this term keeps growing until it is fixed. It is what removes steady leftover error.
- **D, derivative:** push against how fast things are changing, to damp the motion and reduce overshoot.

In continuous time the command is

$$
u = K_p\, e + K_i \int e \, dt + K_d \frac{de}{dt} .
$$

Read $K_p$ as "K sub p", the proportional **gain** — a tuning number. $K_i$ and $K_d$ are the integral and derivative gains. The long S, $\int$, is read "the integral of", which here means a running total of error times time.

A computer runs the controller in steps, once every $\Delta t$ seconds. The running total becomes a sum that grows a little each step, and the rate of change becomes a difference between two steps:

$$
I \leftarrow I + K_i\, e\, \Delta t, \qquad v = K_p\, e + I + K_d \, \frac{\Delta e}{\Delta t} .
$$

Read the arrow $\leftarrow$ as "becomes". Here $v$ is what the controller *asks for*. Many flight codes take the derivative of the measurement, $-\Delta y / \Delta t$, instead of the error, so that a sudden setpoint change does not cause a spike; this lesson's code does that.

Each step costs a few multiplications and additions and keeps three numbers — the integrator, the last measurement and the time step — so a PID update is $O(1)$ time and $O(1)$ memory.

## Saturation and windup

Every real **actuator** — the part that does the pushing, such as a motor, a valve or a thruster — has limits. A motor cannot spin harder than full voltage. A rocket engine gimbal cannot tilt more than a few degrees. So the command actually applied is the request clipped to the limits:

$$
u = \operatorname{clip}(v, -u_{\max}, u_{\max}) .
$$

When $v$ is outside the limits, the actuator is **[[saturated|saturation-real]]**: it is giving everything it has, and asking for more changes nothing.

Now the problem. While saturated, the error stays large, because the plant cannot catch up. So the integrator keeps adding error, step after step, growing far bigger than anything useful. When the plant finally reaches the setpoint, the error flips sign, but the integrator is so large that $v$ is still above the limit. The actuator stays maxed out *past* the target until enough negative error has been added to unwind it. The result is a large overshoot and a slow settle — the cruise control after the hill.

::: key What anti-windup does
It stops the integral term accumulating while the actuator is saturated, since that integral cannot produce any additional output and will overshoot badly on recovery. Common fixes are clamping the integrator, conditional integration, and back-calculation from the saturated output.
:::

The three fixes, in words:

1. **Clamping the integrator.** Keep $I$ itself inside the actuator's range, for example between $-u_{\max}$ and $u_{\max}$. Simple, and it stops $I$ running off to huge values. But $I$ can still sit at the limit, bigger than needed.
2. **Conditional integration.** Only add to $I$ when doing so could help. If the actuator is saturated high *and* the error is still positive, adding more would only push further into the limit, so skip it. The same goes for saturated low with negative error. Otherwise integrate as normal.
3. **Back-calculation.** Integrate as normal, but also feed back the difference between what was applied and what was asked for:

$$
I \leftarrow I + \big(K_i\, e + K_b\,(u - v)\big)\, \Delta t .
$$

When not saturated, $u = v$ and the extra term is zero. When saturated high, $u - v$ is negative and drains $I$ toward a sensible value. $K_b$, the **back-calculation gain**, sets how fast it drains.

::: warning Anti-windup lives in the integrator, not the output
A common slip is to clip the output and think the job is done. Clipping $v$ to make $u$ is needed — the hardware demands it — but it does nothing to $I$. Windup is the integrator's state growing, so the fix has to touch the line that updates $I$. In an interview, point at that line.
:::

## A simulation with real numbers

Here is a controller running a small electric motor that spins a wheel. The command $u$ is motor voltage as a fraction of full, limited to $\pm 1$. The wheel speed $y$, as a fraction of top speed, follows a **first-order plant**:

$$
\tau \frac{dy}{dt} = u - y ,
$$

read "tau d y d t equals u minus y". Here $\tau = 2\,\mathrm{s}$ is the **[[time constant|time-constant]]**: how sluggish the wheel is. Hold $u$ fixed and $y$ creeps toward it, closing about 63% of the remaining gap every 2 seconds. The goal is $r = 0.7$ from rest, with gains $K_p = 4$, $K_i = 3$, $K_d = 0.2$ and $K_b = 1$, stepping every $\Delta t = 0.01\,\mathrm{s}$.

```python
# int01_l12_pid.py -- discrete PID on a saturated first-order plant

def simulate(mode, kp=4.0, ki=3.0, kd=0.2, kb=1.0,
             r=0.7, u_max=1.0, tau=2.0, dt=0.01, t_end=15.0):
    """Step response. O(t_end/dt) time, O(1) space."""
    y, integ, y_prev = 0.0, 0.0, 0.0
    peak, settle = 0.0, 0.0
    for k in range(round(t_end / dt)):
        e = r - y
        deriv = -(y - y_prev) / dt            # derivative of the measurement
        y_prev = y
        v = kp * e + integ + kd * deriv       # what the PID asks for
        u = max(-u_max, min(u_max, v))        # what the motor can give
        if mode == "none":
            integ += ki * e * dt
        elif mode == "clamp":                 # keep the integrator in range
            integ = max(-u_max, min(u_max, integ + ki * e * dt))
        elif mode == "conditional":           # freeze while pushing on a limit
            pushing = (v > u_max and e > 0) or (v < -u_max and e < 0)
            if not pushing:
                integ += ki * e * dt
        elif mode == "back-calc":             # bleed off the excess
            integ += (ki * e + kb * (u - v)) * dt
        y += dt * (u - y) / tau               # plant: tau * dy/dt = u - y
        peak = max(peak, y)
        if abs(y - r) > 0.02 * r:             # still outside the 2% band
            settle = (k + 1) * dt
    return peak, 100 * (peak - r) / r, settle

print(f"{'mode':12} {'peak':>6} {'overshoot':>10} {'settles':>8}")
for mode in ["none", "clamp", "conditional", "back-calc"]:
    peak, os_pct, ts = simulate(mode)
    print(f"{mode:12} {peak:6.3f} {os_pct:9.1f}% {ts:7.2f} s")
peak, os_pct, ts = simulate("none", u_max=1e9)
print(f"{'no limit':12} {peak:6.3f} {os_pct:9.1f}% {ts:7.2f} s")
```

```bash
python3 int01_l12_pid.py
# mode           peak  overshoot  settles
# none          0.866      23.7%    7.49 s
# clamp         0.744       6.3%    5.22 s
# conditional   0.700       0.0%    3.67 s
# back-calc     0.710       1.4%    2.52 s
# no limit      0.734       4.9%    3.90 s
```

**Overshoot** is how far the peak goes past the setpoint, as a percentage of the setpoint. **Settling time** is when the speed last leaves a band 2% either side of the target and stays inside it from then on.

Read the table row by row.

- **None.** With no anti-windup, the wheel shoots to 0.866, 23.7% past the target, and takes 7.49 s to settle. Tracing the run shows why: when the motor finally comes off its limit, at about 3.9 s, the speed is already 0.858 — well past 0.7 — and the integrator holds about 1.64, more than twice the 0.7 of voltage the wheel needs to hold the target.
- **Clamp.** Keeping $I$ within $\pm 1$ cuts the overshoot to 6.3%, but $I$ still sits at the limit of 1, more than the 0.7 needed, so some overshoot remains.
- **Conditional.** Freezing $I$ while pushing on the limit gives no overshoot at all and settles in 3.67 s.
- **Back-calculation.** Draining $I$ toward what the motor can really give leaves 1.4% overshoot and the fastest settle, 2.52 s.
- **No limit** is a check, not a real option: a motor that could give 2.8 times full voltage. It overshoots 4.9%. So nearly all of the 23.7% in the first row came from windup, not from the gains.

Which fix is best depends on the plant and the tuning; on this one, conditional integration and back-calculation both beat clamping. The honest interview answer names all three, picks one, and says why.

::: example The first control step by hand
At $t = 0$: $y = 0$, $I = 0$, and the previous measurement is 0.

**Error.** $e = 0.7 - 0 = 0.7$.

**Request.** P term: $4 \times 0.7 = 2.8$. I term: 0. D term: the measurement has not changed, so 0. So $v = 2.8$.

**Apply the limit.** The motor gives at most 1, so $u = 1.0$. It is saturated: it was asked for 2.8 times what it can give.

**Integrator, no anti-windup.** $I$ grows by $K_i\, e\, \Delta t = 3 \times 0.7 \times 0.01 = 0.021$.

**Integrator, back-calculation.** The extra term is $K_b(u - v) = 1 \times (1.0 - 2.8) = -1.8$. So $I$ grows by $(2.1 - 1.8) \times 0.01 = 0.003$, seven times less.

**Plant.** $y$ grows by $\Delta t\,(u - y)/\tau = 0.01 \times (1.0 - 0)/2 = 0.005$.

Sanity check: after one hundredth of a second at full voltage, the wheel is at 0.005 of top speed. At that rate it would take more than a second to reach 0.7 even at full power, so the motor will be saturated for a long stretch — plenty of time for an unprotected integrator to pile up, as the "none" row shows.
:::

## The running median

Line up your class by height. The **median** height is the height of the person in the middle. With an even number of people, it is the average of the two in the middle. Now a very tall visitor joins the line. The average height jumps. The median barely moves: it shifts by at most half a place.

That toughness is why telemetry software likes medians. A single corrupt reading — a **[[spike|spike-rejection]]** from a bit error or electrical noise — can drag an average far off, but it cannot move a median much. A **running median** is the median of all readings so far, updated each time a new one arrives.

The obvious ways are slow. Re-sorting everything after each reading costs $O(n \log n)$ per reading. Keeping a sorted list and inserting each new value in place is better at finding the spot — binary search finds it in $O(\log n)$ — but then every larger item has to shift over by one to make room, which is $O(n)$ per reading.

The fast way uses two heaps from lesson 7. Split the readings into two halves:

- **low**, a **max-heap** holding the smaller half, so its top is the largest of the small ones;
- **high**, a **min-heap** holding the larger half, so its top is the smallest of the big ones.

Keep their sizes equal, or let **low** have one extra. Then the median is sitting right at the two tops: it is the top of **low** when the count is odd, and the average of both tops when it is even.

To add a reading $x$:

1. If **low** is empty or $x$ is at most the top of **low**, push $x$ onto **low**. Otherwise push it onto **high**.
2. **Rebalance.** If **low** now has two more than **high**, pop its top and push it onto **high**. If **high** now has more than **low**, pop its top and push it onto **low**.

Each step is a constant number of heap pushes and pops, each $O(\log n)$. Reading the median is looking at one or two tops, $O(1)$.

::: key Running median over a stream
Two heaps, a max-heap of the lower half and a min-heap of the upper half, rebalanced so their sizes differ by at most one. Insert is O(log n) and the median is the top of one heap or the mean of both tops.
:::

::: example Five readings through the two heaps
A range sensor reports 5, 15, 1, 3, 2 meters.

**Add 5.** Low is empty, so 5 goes to low. Low {5}, high {}. Odd count: median is low's top, 5.

**Add 15.** 15 is more than 5, so it goes to high. Low {5}, high {15}. Even: $(5 + 15)/2 = 10$.

**Add 1.** 1 is at most 5, so it goes to low. Low {5, 1}, high {15}. Sizes 2 and 1 are fine. Median: low's top, 5.

**Add 3.** 3 goes to low: {5, 3, 1}. Now low has 3 and high has 1, two more, so move low's top, 5, to high. Low {3, 1}, high {5, 15}. Even: $(3 + 5)/2 = 4$.

**Add 2.** 2 is at most 3, so it goes to low: {3, 2, 1}. Sizes 3 and 2 are fine. Median: 3.

Sanity check: sort the five readings, 1, 2, 3, 5, 15. The middle one is 3. It matches. And the 15, which looks like a spike, never became the answer.
:::

Python's `heapq` only makes min-heaps, so **low** stores negated numbers, exactly as lesson 7 showed. The code checks itself against the slow sorted-list method as it goes:

```python
# int01_l12_median.py -- running median with two heaps
import bisect
import heapq

class RunningMedian:
    """add: O(log n) time. median: O(1). Space O(n)."""

    def __init__(self):
        self.low = []    # max-heap of the lower half, stored as negatives
        self.high = []   # min-heap of the upper half

    def add(self, x):
        if not self.low or x <= -self.low[0]:
            heapq.heappush(self.low, -x)
        else:
            heapq.heappush(self.high, x)
        # rebalance: low may hold one more than high, never fewer
        if len(self.low) > len(self.high) + 1:
            heapq.heappush(self.high, -heapq.heappop(self.low))
        elif len(self.high) > len(self.low):
            heapq.heappush(self.low, -heapq.heappop(self.high))

    def median(self):
        if not self.low:
            return None                                  # nothing seen yet
        if len(self.low) > len(self.high):
            return float(-self.low[0])                   # odd count
        return (-self.low[0] + self.high[0]) / 2         # even count

readings = [5, 15, 1, 3, 2, 8, 7, 9, 10, 6]   # a range sensor, meters
rm = RunningMedian()
seen = []
for x in readings:
    rm.add(x)
    bisect.insort(seen, x)                       # slow check: O(n) per insert
    n = len(seen)
    check = seen[n // 2] if n % 2 else (seen[n // 2 - 1] + seen[n // 2]) / 2
    print(f"add {x:2}: median {rm.median():4}  check {float(check):4}"
          f"  low top {-rm.low[0]:2}  high top {rm.high[0] if rm.high else '-'}")
print("empty stream:", RunningMedian().median())
```

```bash
python3 int01_l12_median.py
# add  5: median  5.0  check  5.0  low top  5  high top -
# add 15: median 10.0  check 10.0  low top  5  high top 15
# add  1: median  5.0  check  5.0  low top  5  high top 15
# add  3: median  4.0  check  4.0  low top  3  high top 5
# add  2: median  3.0  check  3.0  low top  3  high top 5
# add  8: median  4.0  check  4.0  low top  3  high top 5
# add  7: median  5.0  check  5.0  low top  5  high top 7
# add  9: median  6.0  check  6.0  low top  5  high top 7
# add 10: median  7.0  check  7.0  low top  7  high top 8
# add  6: median  6.5  check  6.5  low top  6  high top 7
# empty stream: None
```

Every line agrees with the slow check, including the empty stream, which returns `None` instead of crashing. **Complexity:** `add` is $O(\log n)$ time, `median` is $O(1)$, and the two heaps together hold all $n$ readings, $O(n)$ space.

How big is the gap in practice? For $n = 100{,}000$ readings — under 17 minutes of a 100 Hz sensor — sorted insertion shifts about $n^2/4 = 2.5 \times 10^9$ items in total. The heaps do on the order of $n \log_2 n \approx 1.7 \times 10^6$ steps. That is roughly a thousand times less work.

::: warning Three slips in the two-heap code
First, forgetting to negate on the way out of **low**, so the "largest of the small half" comes back as a negative number. Second, comparing a new value with the wrong top, which puts it in the wrong half; the rebalance fixes the sizes but not a wrong split. Third, forgetting the empty case and the even case. Test an empty stream, one reading, two readings and a run of equal values before you say you are done.
:::

::: note A median over a sliding window
Sometimes the ask is the median of only the last $w$ readings, a **median filter**. Now old readings must leave the heaps too, and a heap cannot cheaply remove an item from its middle. One standard fix is **lazy deletion**: remember which values are due to leave, and throw them away only when they reach a heap's top. Another is a sorted container with $O(\log w)$ insert and delete. For small windows, such as $w = 5$, keeping a sorted list of 5 and shifting is perfectly fine: $O(w)$ with a tiny $w$. Mention these trade-offs; they show you know where the simple version stops.
:::

## Check yourself

::: check
In the discrete PID above, which single line would you change to add anti-windup by clamping, and what would you change it to? Why is clipping the output alone not enough?
:::

::: answer
Change the integrator update, `integ += ki * e * dt`, to `integ = max(-u_max, min(u_max, integ + ki * e * dt))`, so the integrator's value can never leave the actuator's range. Clipping the output only limits what reaches the motor on this step; the integrator's stored value is untouched and can keep growing while saturated. Windup is that stored value growing, so the fix has to act on the integrator's update.
:::

::: check
A controller is saturated high: it asks for $v = 1.6$ but the limit gives $u = 1.0$. The error is $e = 0.2$, with $K_i = 3$, $K_b = 1$ and $\Delta t = 0.01\,\mathrm{s}$. How much does the integrator change this step under no anti-windup, conditional integration and back-calculation?
:::

::: answer
No anti-windup: $K_i e \Delta t = 3 \times 0.2 \times 0.01 = 0.006$, so it grows by 0.006. Conditional integration: the actuator is saturated high and the error is positive, so integrating would only push further into the limit; the change is 0. Back-calculation: $(K_i e + K_b(u - v))\Delta t = (0.6 + 1 \times (1.0 - 1.6)) \times 0.01 = (0.6 - 0.6) \times 0.01 = 0$. Here back-calculation also holds it still, because the drain exactly cancels the growth.
:::

::: check
In the simulation, the "no limit" run overshoots only 4.9% but the saturated run with no anti-windup overshoots 23.7%. The gains are the same. What does that tell you?
:::

::: answer
It shows that almost all of the large overshoot comes from the saturation interacting with the integrator, not from the tuning. With no limit, the motor can deliver the 2.8 the controller asks for at first, the error falls quickly, and the integrator never builds up much. With a limit, the error stays large for about 4 seconds while the integrator keeps growing, and that stored value keeps the motor floored past the target. Retuning the gains would not fix this properly; anti-windup does.
:::

::: check
Continue the example stream: after 5, 15, 1, 3, 2, the next readings are 8 and then 7. Give the contents of both heaps and the median after each.
:::

::: answer
Start: low {3, 2, 1}, high {5, 15}. Add 8: 8 is more than low's top, 3, so it goes to high: {5, 8, 15}. Sizes 3 and 3, fine. Even count: median $(3 + 5)/2 = 4$. Add 7: 7 is more than 3, so it goes to high: {5, 7, 8, 15}. Now high has 4 and low has 3, so move high's top, 5, to low: low {5, 3, 2, 1}, high {7, 8, 15}. Odd count: median is low's top, 5. Check by sorting 1, 2, 3, 5, 7, 8, 15: the middle one is 5.
:::

::: check
A teammate keeps a running median by appending each reading and calling `sorted()` every time. For 10,000 readings, roughly how much work is that compared with two heaps, and what complexities would you quote?
:::

::: answer
Sorting $i$ items costs about $i \log_2 i$ steps, and it is done for $i = 1$ up to 10,000. That is on the order of $n^2 \log n$ in total: roughly $10{,}000^2 / 2 \times 13 \approx 6.5 \times 10^8$ steps. Two heaps cost $O(\log n)$ per reading, about $10{,}000 \times 13 \approx 1.3 \times 10^5$ steps in total. So quote $O(n \log n)$ per reading for re-sorting and $O(\log n)$ per reading for the heaps, with $O(n)$ space for both. The heaps win by a factor of thousands.
:::

## Summary

| Idea | What it means | Fact or cost |
| --- | --- | --- |
| PID | P, I and D reactions to the error $e = r - y$ | one update is $O(1)$ time and memory |
| saturation | the actuator is at its limit | $u = \operatorname{clip}(v, -u_{\max}, u_{\max})$ |
| windup | the integrator grows while saturated | big overshoot and slow settle on recovery |
| clamping | keep $I$ within the actuator range | simple; some overshoot can remain |
| conditional integration | skip integrating while pushing on a limit | 0.0% overshoot in the simulation |
| back-calculation | add $K_b(u - v)$ to the integrator's rate | 1.4% overshoot, fastest settle here |
| running median | max-heap of low half, min-heap of high half | add $O(\log n)$, median $O(1)$, space $O(n)$ |
| slow medians | re-sort, or sorted insert | $O(n \log n)$ or $O(n)$ per reading |

That completes all six engineering variants: the decommutator, the dropout detector, the ring buffer, the time aligner, the anti-windup PID and the running median. Next comes the onsite module, which builds on this one: the systems C++ round, live debugging, system design for simulation and telemetry, and the presentation and behavioral rounds.

::: context pid-history Older than computers
The idea behind PID control is older than digital computers. In 1922 the engineer Nicolas Minorsky published an analysis of automatic ship steering for the US Navy, based on watching how skilled helmsmen reacted to the heading error, how long it had lasted, and how fast it was changing — the three terms of PID. Today the same three terms run everywhere: in thermostats, drones, disk drives, and in the inner loops of rocket and spacecraft attitude control, often as the fast layer underneath a more elaborate guidance law.
:::

::: context saturation-real Limits on real vehicles
Saturation is normal, not a rare failure. A reaction wheel has a maximum torque its motor can give and a maximum speed it can spin to. A rocket engine gimbal can tilt only a few degrees. A throttle cannot go past 100% or below its minimum. A large attitude maneuver commanded all at once will saturate the wheels for many seconds, which is exactly when an unprotected integrator winds up. That is why anti-windup is expected in any flight PID, and why interviewers ask about it.
:::

::: context time-constant What tau means in the picture
For the plant $\tau\, dy/dt = u - y$ with $u$ held fixed, the gap between $y$ and $u$ shrinks by the same fraction every $\tau$ seconds: after one $\tau$, about 63% of it is gone, after two about 86%, after three about 95%. So with $\tau = 2\,\mathrm{s}$ and full voltage, the wheel would need several seconds to get near top speed. The picture shows the simulation's speed against time for the first 12 s, with no anti-windup (red) and with back-calculation (blue); the dashed line is the 0.7 target.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="25" x2="40" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="66" x2="340" y2="66" stroke="#6c7a93" stroke-dasharray="5 3"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40,150 46,136 52,123 59,112 65,103 71,94 78,87 84,80 90,74 96,69 102,64 109,60 115,57 121,54 128,51 134,48 140,46 146,46 152,48 159,49 165,52 171,54 178,56 184,58 190,59 196,60 202,62 209,62 215,63 221,64 228,64 234,65 240,65 246,65 252,65 259,66 265,66 271,66 278,66 284,66 290,66 296,66 302,66 309,66 315,66 321,66 328,66 334,66 340,66"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40,150 46,136 52,123 59,112 65,103 71,94 78,87 84,80 90,74 96,70 102,68 109,66 115,66 121,65 128,65 134,65 140,65 146,65 152,65 159,65 165,65 171,65 178,66 184,66 190,66 196,66 202,66 209,66 215,66 221,66 228,66 234,66 240,66 246,66 252,66 259,66 265,66 271,66 278,66 284,66 290,66 296,66 302,66 309,66 315,66 321,66 328,66 334,66 340,66"/>
  <g font-size="11" fill="#1f2a44">
    <text x="12" y="70">0.7</text>
    <text x="22" y="154">0</text>
    <text x="36" y="166">0</text>
    <text x="160" y="166">5 s</text>
    <text x="285" y="166">10 s</text>
    <text x="150" y="38" fill="#b4232c">no anti-windup: peak 0.866</text>
    <text x="200" y="90" fill="#1d6fd1">back-calculation</text>
  </g>
</svg>
```
:::

::: context spike-rejection Why a median shrugs off glitches
Suppose nine readings are all 20.0 and one bit error turns the tenth into 2,000. The mean jumps to 218, more than ten times the true value. The median is still 20.0, because the glitch only occupies one end of the sorted line. That is why median filters are a standard first step on noisy sensor channels, such as range finders and some star-tracker outputs, before any averaging or estimation. A median of 5 or 7 recent samples removes isolated spikes while barely delaying real changes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44">
    <rect x="20" y="40" width="28" height="28" fill="#8fb8f0"/>
    <rect x="50" y="40" width="28" height="28" fill="#8fb8f0"/>
    <rect x="80" y="40" width="28" height="28" fill="#8fb8f0"/>
    <rect x="110" y="40" width="28" height="28" fill="#8fb8f0"/>
    <rect x="140" y="40" width="28" height="28" fill="#1d6fd1"/>
    <rect x="170" y="40" width="28" height="28" fill="#1d6fd1"/>
    <rect x="200" y="40" width="28" height="28" fill="#8fb8f0"/>
    <rect x="230" y="40" width="28" height="28" fill="#8fb8f0"/>
    <rect x="260" y="40" width="28" height="28" fill="#8fb8f0"/>
    <rect x="300" y="40" width="44" height="28" fill="#b4232c"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="34" y="58">20</text><text x="64" y="58">20</text><text x="94" y="58">20</text>
    <text x="124" y="58">20</text><text x="154" y="58" fill="#ffffff">20</text><text x="184" y="58" fill="#ffffff">20</text>
    <text x="214" y="58">20</text><text x="244" y="58">20</text><text x="274" y="58">20</text>
    <text x="322" y="58" fill="#ffffff">2000</text>
    <text x="169" y="28">middle two: median 20</text>
    <text x="322" y="28" fill="#b4232c">glitch</text>
    <text x="180" y="96">mean 218, median 20</text>
  </g>
</svg>
```
:::
