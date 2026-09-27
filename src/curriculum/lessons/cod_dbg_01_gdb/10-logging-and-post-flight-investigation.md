---
id: l10-logging-and-post-flight-investigation
title: Logs, ring buffers and the one dataset
minutes: 25
covers:
  - 'Logging strategy: levels, structured logs, flight-side ring buffers'
  - 'Post-flight anomaly investigation: one dataset, no reruns'
---

Many cars carry a dashcam. Its memory card is small, so it records in a loop: when the card is full, the newest video overwrites the oldest. Then a hard bump trips its shock sensor, and it saves the seconds before the bump, plus a few after, into a protected file. After a crash, that one clip is the whole story. Nobody can drive the crash again to see it better.

Flight software lives in the same situation. A **[[log|log-word]]** is a time-ordered record of what a program did and saw. On a rocket or spacecraft, the log and the **[[telemetry|telemetry-word]]** sent down by radio are often all you will ever have; the vehicle may be at the bottom of the ocean or burned up in the atmosphere. Every lesson so far assumed you could run the program again. After a flight you cannot.

This last lesson of the module has two halves. First, how to log: levels, structured records, rate limits, and the flight-side ring buffer, the dashcam loop in code. Second, how to investigate an anomaly with one dataset and no reruns, using Lesson 01's scientific method with the data as the only experiment you get.

## Logging is designed before flight

::: key
**Why is logging design an engineering decision in flight software?** After a flight you usually get exactly one dataset and cannot rerun the event. What was not logged, at a rate and resolution that captures the event, is simply unknowable. Ring buffers and rate-limited structured logs are designed in, not added later.
:::

Two limits force the design. **Storage** on board is finite. **Bandwidth**, how many bytes per second the radio can send down, is usually far smaller than what the sensors produce. So you choose, before launch, what to keep and at what rate.

The rate matters as much as the choice. A number logged once a second cannot show something that happens in a twentieth of a second. To see a signal that changes $f$ times per second you must sample it at more than $2f$ times per second, a rule named after [[Nyquist|nyquist]], and in practice several times more than that.

::: example A logging budget
A flight computer has 20 sensor channels, each a 4-byte number, and the sensors produce 1,000 samples per second. The radio downlink carries 64 kilobits per second. What can you afford?

Full rate costs $20 \times 4 \times 1000 = 80{,}000$ bytes per second, 80 kB/s.

The downlink carries $64{,}000 / 8 = 8{,}000$ bytes per second, 8 kB/s. That is one tenth of the full rate. So you cannot send everything down.

Storing everything on board for a 10-minute flight takes $80{,}000 \times 600 = 48{,}000{,}000$ bytes, 48 MB: fine for a flash chip, if the chip survives.

A common design: send low-rate summaries down continuously (for example every channel at 50 samples per second is $20 \times 4 \times 50 = 4{,}000$ bytes per second, half the link), and keep a high-rate **ring buffer** of the last 2 seconds at full rate: $80{,}000 \times 2 = 160{,}000$ bytes, 160 kB of memory. When something trips, that buffer is frozen and sent down or saved.

Sanity check: 4 kB/s of summaries leaves 4 kB/s of the link for events, commands and the buffer dump, and the dump would take $160{,}000 / 4{,}000 = 40$ seconds to send. Slow, but it gets there.
:::

## Log levels

Not every message matters equally. A **log level** is a label on each message that says how serious it is. Python's standard `logging` module uses five, each with a number, from least to most serious:

| Level | Number | Use it for |
| --- | --- | --- |
| DEBUG | 10 | detail for developers: every filter update, every packet |
| INFO | 20 | normal milestones: boot, mode changes, commands received |
| WARNING | 30 | something odd that the software handled: a rejected sensor sample |
| ERROR | 40 | something failed: a sensor timed out, a file could not be written |
| CRITICAL | 50 | the component cannot continue |

Each logger has a **threshold**. Messages below it are dropped at once, cheaply; messages at or above it are written. In a lab you turn DEBUG on; in flight you typically run at INFO and rely on the ring buffer for high-rate detail. C++ libraries often add TRACE below DEBUG and say FATAL for CRITICAL, but the ladder is the same.

::: warning Error-only logging hides the story
It is tempting to log only errors, to save space. But an error message says where things ended, not how they got there. The lead-up, the ordinary INFO milestones and the high-rate data before the fault, is what explains it.
:::

## Structured logs

Compare two ways to write the same event:

```text
12.35 WARNING: rejected baro sample, residual 41.8 m is over limit 25.0 m
{"t": 12.35, "lvl": "WARNING", "src": "nav", "event": "baro_reject", "resid_m": 41.8, "limit_m": 25.0}
```

A person can read both; a program can only reliably read the second. A **structured log** writes each record as named fields instead of a sentence. A common format is **[[JSON|json-word]] lines**: one JSON object per line. To find every rejected sample with a residual over 30 m, you load each line and compare a field, instead of writing a fragile pattern match that breaks when someone rewords the sentence.

Good structured records follow a few habits. Every record has a time `t` and a source `src`. The `event` name is short and never changes spelling. Units go in the field name (`resid_m`, `vz_mps`), so nobody guesses. And every record carries a **sequence number** that goes up by one each time, so a missing record shows up as a gap.

::: example A JSON-lines logger in Python
This program sets up a logger whose threshold is INFO and whose formatter turns every record into one line of JSON.

```python
# jsonlog.py: log levels and structured JSON-lines records with Python's logging.
import json
import logging
import sys

class JsonLines(logging.Formatter):
    """Turn each log record into one line of JSON."""
    def format(self, record):
        out = {"t": record.t, "lvl": record.levelname, "src": record.name,
               "event": record.getMessage()}
        out.update(record.fields)            # the structured payload
        return json.dumps(out)

def make_logger(name, level):
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonLines())
    log = logging.getLogger(name)
    log.addHandler(handler)
    log.setLevel(level)                      # the threshold
    return log

nav = make_logger("nav", logging.INFO)

def emit(log, level, t, event, **fields):
    log.log(level, event, extra={"t": t, "fields": fields})

emit(nav, logging.DEBUG, 12.00, "innovation", baro_m=0.4)   # below threshold: dropped
emit(nav, logging.INFO, 12.00, "mode", old="BOOST", new="COAST")
emit(nav, logging.WARNING, 12.35, "baro_reject", resid_m=41.8, limit_m=25.0)
emit(nav, logging.ERROR, 12.40, "baro_timeout", last_ok_s=12.30)
```

Running it with Python 3.11:

```text
$ python3 jsonlog.py
{"t": 12.0, "lvl": "INFO", "src": "nav", "event": "mode", "old": "BOOST", "new": "COAST"}
{"t": 12.35, "lvl": "WARNING", "src": "nav", "event": "baro_reject", "resid_m": 41.8, "limit_m": 25.0}
{"t": 12.4, "lvl": "ERROR", "src": "nav", "event": "baro_timeout", "last_ok_s": 12.3}
```

Four calls, three lines. The DEBUG record had level 10, below the threshold of 20, so it was dropped. The `extra=` argument is how Python's `logging` attaches your own fields to a record; the formatter reads them back as `record.t` and `record.fields`. (`json.dumps` writes 12.00 as `12.0`: same number, different spelling.)
:::

## Rate limits

One misbehaving sensor at 100 Hz can produce 100 identical warnings a second and crowd everything else out of the log. A **rate-limited** log lets one message through per time period and counts the ones it swallowed.

```python
# ratelimit.py: log a repeating warning at most once per second, with a count.
class RateLimited:
    def __init__(self, period_s):
        self.period_s = period_s
        self.last_t = None       # time of the last record we let through
        self.suppressed = 0      # how many we swallowed since then

    def warn(self, t, event, **fields):
        if self.last_t is None or t - self.last_t >= self.period_s:
            print({"t": round(t, 2), "lvl": "WARN", "event": event,
                   "suppressed": self.suppressed, **fields})
            self.last_t, self.suppressed = t, 0
        else:
            self.suppressed += 1

rl = RateLimited(1.0)
for k in range(250):                  # 100 Hz loop for 2.5 s
    t = k * 0.01
    if 0.5 <= t < 2.2:                # the sensor misbehaves for 1.7 s
        rl.warn(t, "baro_reject", resid_m=40.0)
```

```text
$ python3 ratelimit.py
{'t': 0.5, 'lvl': 'WARN', 'event': 'baro_reject', 'suppressed': 0, 'resid_m': 40.0}
{'t': 1.5, 'lvl': 'WARN', 'event': 'baro_reject', 'suppressed': 99, 'resid_m': 40.0}
```

The sensor misbehaved for $1.7 \times 100 = 170$ samples. Two lines came out, and the second says 99 were swallowed between them. That count is the point: the log is short, and it still tells you the problem was continuous, not two isolated blips.

::: warning Flush the count
Add it up: $2 + 99 = 101$ of the 170 events are accounted for. The last 69, between 1.51 s and 2.19 s, were swallowed and never reported, because no message came after them to carry the count. A real rate limiter must also write its pending count when the condition clears or at a regular tick, or the log will say the problem stopped a second before it really did.
:::

## The flight-side ring buffer

Low-rate logs keep the long story. For the seconds around a fault you want every sample. The tool is the **ring buffer**, or circular buffer: a fixed number of slots used in a circle. Each new sample goes into the next slot; after the last slot it wraps to slot 0 and overwrites the oldest. The buffer always holds the newest $N$ samples, and it never grows.

"Never grows" matters in flight. The memory is reserved once, at start-up, so the buffer cannot run out of memory and every push takes the same short time. Many flight coding standards forbid [[allocating memory after start-up|no-heap]] for these reasons.

When an **anomaly trigger** (a check that notices something wrong) fires, the software records a few more samples, then freezes the buffer and writes it out. The dump holds what led up to the trigger and what came right after, like the dashcam clip.

::: example A ring buffer in C++
```cpp
// ring.cpp: a fixed-capacity flight-side ring buffer.
// Keeps the newest N samples; the oldest is overwritten. Dumped on an anomaly.
#include <array>
#include <cstddef>
#include <cstdio>

struct Sample {
    double t;        // time since boot, s
    double alt_m;    // barometric altitude, m
    double vz_mps;   // navigation vertical speed, m/s
};

template <typename T, std::size_t N>
class RingBuffer {
public:
    void push(const T& x) {
        buf_[head_] = x;                  // write into the oldest slot
        head_ = (head_ + 1) % N;          // move on, wrapping at N
        if (count_ < N) ++count_;         // grows until full, then stays N
    }
    std::size_t size() const { return count_; }
    // i = 0 is the oldest sample still held, i = size()-1 the newest.
    const T& at(std::size_t i) const {
        std::size_t oldest = (head_ + N - count_) % N;
        return buf_[(oldest + i) % N];
    }
private:
    std::array<T, N> buf_{};             // all memory reserved up front
    std::size_t head_ = 0;               // where the next push goes
    std::size_t count_ = 0;              // how many slots hold data
};

int main() {
    RingBuffer<Sample, 8> rb;             // 8 samples = 0.16 s at 50 Hz
    int after = -1;                       // samples still to record after a trigger
    for (int k = 0; k < 40; ++k) {
        double t = 0.02 * k;
        double alt = 100.0 + 50.0 * t;    // climbing at 50 m/s
        if (k == 17) alt -= 30.0;         // one glitched barometer sample
        rb.push({t, alt, 50.0});

        std::size_t n = rb.size();
        double jump = n >= 2 ? rb.at(n - 1).alt_m - rb.at(n - 2).alt_m : 0.0;
        if (after < 0 && jump < -20.0) {  // anomaly: a drop no rocket can make
            std::printf("TRIGGER at t=%.2f s (jump %.1f m)\n", t, jump);
            after = 3;                    // keep 3 more samples, then freeze
        } else if (after > 0) {
            --after;
        }
        if (after == 0) {                 // dump oldest to newest, once
            for (std::size_t i = 0; i < rb.size(); ++i) {
                const Sample& s = rb.at(i);
                std::printf("  t=%.2f  alt=%7.2f m  vz=%.1f m/s\n", s.t, s.alt_m, s.vz_mps);
            }
            break;
        }
    }
}
```

```text
$ g++ -std=c++17 -O2 -Wall -Wextra -o ring ring.cpp && ./ring
TRIGGER at t=0.34 s (jump -29.0 m)
  t=0.26  alt= 113.00 m  vz=50.0 m/s
  t=0.28  alt= 114.00 m  vz=50.0 m/s
  t=0.30  alt= 115.00 m  vz=50.0 m/s
  t=0.32  alt= 116.00 m  vz=50.0 m/s
  t=0.34  alt=  87.00 m  vz=50.0 m/s
  t=0.36  alt= 118.00 m  vz=50.0 m/s
  t=0.38  alt= 119.00 m  vz=50.0 m/s
  t=0.40  alt= 120.00 m  vz=50.0 m/s
```

Follow the numbers. At 50 m/s and a sample every 0.02 s, altitude rises $50 \times 0.02 = 1$ m per sample, so 100 m at $t = 0$ becomes 117 m at sample 17 ($t = 0.34$ s). The glitch subtracts 30 m, giving 87 m, a jump of $87 - 116 = -29$ m. That is below the $-20$ m limit, so the trigger fires. Three more samples come in (0.36, 0.38, 0.40 s), and then the buffer is dumped.

By then 21 samples had been pushed ($k = 0$ to $20$) into 8 slots. The dump shows only the newest 8, from $t = 0.26$ to $0.40$ s: the first 13 were overwritten, as designed. The dump has 4 samples before the trigger, the trigger sample, and 3 after, and the samples after show altitude back on its line. One bad sample, not a real fall.
:::

The index arithmetic uses `%`, read "mod", the remainder after division: `(head_ + 1) % N` counts 0, 1, …, 7, 0, 1, … around the [[ring|ring-picture]]. The `at` function finds the oldest slot by stepping back `count_` places from `head_`, adding `N` first so the number never goes negative.

## Post-flight investigation: one dataset, no reruns

Now the other side. A vehicle has flown, something went wrong, and you have its logs. The method is Lesson 01's loop, with one change: you cannot run a new experiment on the vehicle. Every hypothesis is tested against data that already exists, in steps.

1. **Preserve the data.** Copy the raw files, record a checksum of each, and never edit them; analyze copies.
2. **Check that it is complete.** Look for gaps in sequence numbers and for time going backwards. A missing stretch is not a stretch where nothing happened; it is a stretch you know nothing about.
3. **Build the timeline.** Put every event from every source in time order. Sources may use different clocks, such as "seconds since boot" and the ground station's clock; line them up with an event both recorded, such as a command sent and received.
4. **List hypotheses, each with the signature it would leave in the data.** A hypothesis that predicts nothing checkable is not useful here.
5. **Test each against the data.** Cross out the ones the data contradicts; say how strongly the data supports the rest.
6. **Say what cannot be known.** Those questions become next flight's logging requirements.

You can still run *software* after the flight. **Replay** means feeding the recorded sensor data through the flight code, or a fixed version, on the ground. It is an experiment on the software, not the vehicle, and it is how a fix is checked.

::: warning Do not fill the gaps with what you expect
It is tempting to assume that a quantity nobody logged "must have been" normal, or to draw a smooth line across a gap. That is where investigations go wrong. If the data does not show it, the report says it is unknown.
:::

::: example Why did the drogue fire early?
Here is a made-up flight, produced by a simulation. A small rocket should fire its drogue parachute at **apogee**, the top of its climb, when it is barely moving. Its flight computer fired it at 9.04 s, while still climbing fast. The only evidence is the file `flight.jsonl`: INFO records at 1 Hz, every mode change and command, and a 1-second, 100 Hz ring buffer that the drogue firing triggered.

**Step 2, completeness.** A short script reads every line with `json.loads` and checks the sequence numbers:

```text
records: 117  gaps: []
```

No gaps. Everything the computer wrote is here.

**Step 3, timeline.** Sorting the non-routine events by time:

```text
t=  0.00  INFO  sys  boot         {'build': 'a41c9e2', 'config': 'rcv-v3'}
t=  0.00  INFO  cmd  cmd_rx       {'cmd': 'LAUNCH', 'link': 'uplink'}
t=  3.00  INFO  fsm  mode         {'old': 'BOOST', 'new': 'COAST'}
t=  9.04  WARN  fsm  drogue_fire  {'reason': 'apogee_detect', 'falls': 5}
t=  9.04  INFO  fsm  mode         {'old': 'COAST', 'new': 'DROGUE'}
t=  9.54  INFO  rb   dump_begin   {'n': 100}
t=  9.54  INFO  rb   dump_end     {}
```

The apogee detector fired it: `reason` is `apogee_detect`, after `falls: 5`, which means the barometric altitude dropped on five samples in a row. Laid out on a [[timeline|timeline-picture]], the 1 Hz status records around it look innocent:

```text
{"seq": 12, "t": 8.0, ..., "event": "status", "mode": "COAST", "alt_baro": 1047.4, "vz_nav": 131.0}
{"seq": 13, "t": 9.0, ..., "event": "status", "mode": "COAST", "alt_baro": 1161.4, "vz_nav": 121.1}
```

**Step 4, hypotheses and their signatures.**

- H1: a ground command fired the drogue. Signature: a `cmd_rx` record before 9.04 s other than LAUNCH.
- H2: the rocket really was at apogee (say the motor was weak). Signature: navigation vertical speed near 0 m/s at 9.04 s.
- H3: the detector was fed bad barometer data. Signature: barometric altitude falling at a rate the rocket cannot have, while navigation says it is climbing.

**Step 5, test against the data.**

```text
H1 commands received before fire: ['LAUNCH']
H2 vz_nav at fire: 120.4 m/s
H3 baro rate vs nav speed around the fire:
  t=8.98  baro rate=      92 m/s   vz_nav= 121.3 m/s
  t=8.99  baro rate=     154 m/s   vz_nav= 121.3 m/s
  t=9.00  baro rate=   -1084 m/s   vz_nav= 121.1 m/s
  t=9.01  baro rate=   -1083 m/s   vz_nav= 120.9 m/s
  t=9.02  baro rate=    -960 m/s   vz_nav= 121.0 m/s
  t=9.03  baro rate=   -1170 m/s   vz_nav= 121.3 m/s
  t=9.04  baro rate=   -1030 m/s   vz_nav= 120.4 m/s
  t=9.05  baro rate=   -1115 m/s   vz_nav= 120.8 m/s
  t=9.06  baro rate=    7380 m/s   vz_nav= 120.8 m/s
  t=9.07  baro rate=      65 m/s   vz_nav= 120.2 m/s
```

H1 is crossed out: the only command received was LAUNCH. That conclusion is only safe because *every* received command is logged; if commands were not logged, H1 could never be ruled out.

H2 is crossed out: the rocket was climbing at 120.4 m/s, nowhere near apogee.

H3 is supported. The barometer rate is each altitude difference divided by 0.01 s. Before 9.00 s it wobbles around the true climb rate (92 and 154 m/s against 121 m/s; the difference of two noisy readings, divided by a small time step, is noisy). From 9.00 to 9.05 s it says the rocket fell at about 1,000 m/s, six samples in a row, while navigation says it climbed at 121 m/s. Then altitude jumps back up by $7380 \times 0.01 = 73.8$ m in one sample. No rocket does that. The detector saw five falls in a row by 9.04 s and did exactly what it was built to do, with bad input.

Notice that the 1 Hz record at $t = 9.0$ even caught one glitched value, 1161.4 m, but on its own it looked plausible. Only the 100 Hz ring buffer shows the glitch for what it is.
:::

That settles *what* happened, but not *why the barometer glitched*. Was it a pressure disturbance at the sensor's port, electrical noise, or a data-bus error? The file has no raw pressure, no sensor temperature, no supply voltage and no bus error counters, so the question is unknowable from this flight. That goes in the report as an open item, and those fields go into the next flight's logging. The detector fix can be checked by replay: fed the 100 recorded samples, the old rule fires at 9.04 s, and a rule that also requires navigation vertical speed below 20 m/s never fires.

One more trap in that file: the ring buffer was written out *after* the trigger, so its records have later sequence numbers but earlier times. Sequence 16 is at 9.54 s, and sequence 17 is a sample from 8.55 s. Sort a timeline by time; use sequence numbers to spot gaps.

## What to log, decided before launch

Everything the example needed was there because someone decided it should be. A checklist for any flight component:

- **Identity**: the software build (a version hash), the configuration, and the hardware serial numbers, logged at boot. The dataset must say which code produced it.
- **Time**: one [[clock that never jumps backwards|monotonic-clock]] for every record, plus a logged link between it and outside time (UTC).
- **Sequence numbers** on every record, so gaps are visible.
- **Every command received and every mode change**, always, at INFO. They are rare and they explain everything else.
- **The inputs to each decision, not only the decision.** "Drogue fired" is the decision; "five falls in a row, and here is the altitude that fell" is what lets you judge it.
- **Health**: sensor temperatures, voltages, error counters, loop overruns, at a low rate.
- **A ring buffer** at full rate of the signals that matter most, frozen and saved on every anomaly trigger, with samples from before and after it.
- **A budget**: bytes per second for each of these, checked against storage and downlink, with rate limits on anything that can repeat.

Real missions have been saved by this kind of foresight. On NASA's [[Mars Pathfinder|pathfinder]] mission, debugging and tracing features designed into the software made it possible to find and fix a fault while the lander sat on Mars.

## Check yourself

::: check
A teammate proposes logging only ERROR and CRITICAL messages in flight "to save bandwidth". What do you tell them?
:::

::: answer
An error record says where things ended, not how they got there. The explanation is in the lead-up: mode changes, commands, rejected samples and high-rate data before the error. With no rerun, anything not recorded is lost for good. A better design keeps INFO milestones at a low rate, rate-limits repeating warnings, and keeps a high-rate ring buffer that is saved when an anomaly trigger fires. That costs little bandwidth and keeps the story.
:::

::: check
A ring buffer has 500 slots and is fed at 250 Hz. How many seconds of history does it hold? If the trigger should keep 0.5 s of data after the event, how much from before the event is in the dump?
:::

::: answer
$500 / 250 = 2$ seconds of history. Keeping 0.5 s after the trigger uses $0.5 \times 250 = 125$ slots, which leaves $500 - 125 = 375$ slots, $375 / 250 = 1.5$ s, from before the trigger (counting the trigger sample among them).
:::

::: check
After a flight, you find sequence numbers 4101 to 4212 missing from the log, a stretch of about 1.1 s right before a reaction wheel fault. A colleague writes in the report, "No anomalies were logged before the fault." What is wrong with that sentence?
:::

::: answer
It is true only in the narrowest sense and it misleads. Nothing was logged in that stretch because the records were lost, not because nothing happened. The honest statement is that 112 records ($4212 - 4101 + 1$) covering about 1.1 s before the fault are missing, so the vehicle's state in that window is unknown. The next steps are to look for other sources covering that window (ground station telemetry, another processor's logs) and to find out why the records were lost.
:::

::: check
Why is it better to write `{"event": "baro_reject", "resid_m": 41.8}` than `"Rejected baro, residual 41.8"`? Give two reasons.
:::

::: answer
First, a program can read it reliably: you can select every `baro_reject` event and compare `resid_m` without writing a pattern match that breaks when someone rewords the message. Second, the field name carries the unit (`_m`, meters) and a fixed spelling, so there is no guessing whether 41.8 was meters or feet, and counting or plotting the events over a whole flight takes a few lines of code.
:::

::: check
In the drogue example, suppose the file had no `vz_nav` field at all, only barometric altitude. Could you still tell H2 (real apogee) from H3 (bad barometer data)? How well?
:::

::: answer
Partly. The barometer alone still shows a fall of about 1,000 m/s followed by a jump up of 73.8 m in 0.01 s, and a rocket at a real apogee moves slowly, not that fast in either direction. So H3 would still be strongly favored. But you would lose the independent witness: a second source working on a different principle (the navigation speed comes from the accelerometers, not from air pressure), saying the rocket was climbing at 120 m/s the whole time. Two sources that agree are much stronger evidence than one that looks strange, which is why an investigation wants the same quantity measured two different ways.
:::

## Summary

| Idea | Meaning | Rule |
| --- | --- | --- |
| Log levels | DEBUG 10, INFO 20, WARNING 30, ERROR 40, CRITICAL 50 | threshold drops everything below it |
| Structured log | named fields, one JSON object per line | time, source, event, units in field names, sequence number |
| Rate limit | one message per period, with a suppressed count | flush the count when the condition clears |
| Ring buffer | fixed slots used in a circle | memory reserved once; newest overwrites oldest |
| Anomaly trigger | a check that freezes the ring buffer | keep samples before and after, then dump |
| One dataset | no reruns after flight | preserve, check gaps, timeline, hypotheses, test, list unknowns |
| Replay | recorded data through the flight code on the ground | tests the software, not the vehicle |
| Logging budget | bytes per second vs storage and downlink | decided before launch |

This is the end of the debugging module. You can now go from a crash to a root cause with gdb and a core dump, catch memory errors and races with sanitizers, prove a speed-up with a profile, and design a component's logging so that one flight's data is enough to explain what went wrong.

::: context log-word A log that floated
Sailors once measured a ship's speed by throwing a piece of wood, the "chip log", over the stern on a line knotted at regular spacing, and counting how many knots ran out in a set time. That is where the speed unit "knot" comes from. The results went into a book, the logbook, along with the weather, the course and anything unusual. Computing kept the word: a log is still the running record you read afterwards to learn what happened.
:::

::: context telemetry-word Measuring from far away
Telemetry comes from two Greek roots: *tele*, "far", and *metron*, "measure". It is data measured on the vehicle and sent to the ground by radio while the vehicle flies. Because the radio link has limited bandwidth, telemetry is usually a chosen subset of what the vehicle knows, at chosen rates. Some vehicles also store more detailed data on board, to be read out later if the hardware is recovered.
:::

::: context nyquist Why twice the rate
Harry Nyquist, an engineer at Bell Labs, worked out in the 1920s how fast a signal must be sampled; Claude Shannon later made it part of information theory. The rule: to capture a signal that wiggles $f$ times per second, you must sample more than $2f$ times per second. Sample slower and the wiggle is not only lost, it can appear as a slow, fake wiggle, called aliasing. For a 10 Hz vibration you need more than 20 samples per second, and engineers usually take five to ten times the signal rate to see its shape, not only its presence.
:::

::: context json-word A format from the web
JSON stands for JavaScript Object Notation. It grew out of the way the JavaScript language writes objects, and Douglas Crockford popularized it in the early 2000s as a simple way to pass data between programs. It has only a few types: numbers, strings, true and false, null, lists in square brackets, and objects in curly braces. Almost every language can read it with its standard library, which is why it is a common choice for logs meant to be read by tools. Flight links often use more compact binary formats, but the idea of named, typed fields is the same.
:::

::: context no-heap Why flight code avoids growing memory
Asking for new memory while running (`new`, `malloc`, a `std::vector` that grows) can fail when memory runs out, can take a different amount of time on each call, and over hours can leave memory chopped into unusable pieces, called fragmentation. None of that is acceptable in a control loop that must finish on time, every time, for the whole mission. The widely cited "Power of Ten" rules for safety-critical code, written by Gerard Holzmann at NASA's Jet Propulsion Laboratory, include a rule against dynamic memory allocation after initialization. A ring buffer built on `std::array` follows it naturally.
:::

::: context ring-picture Slots in a circle
Eight slots drawn as a ring. The head is where the next sample will go. When the buffer is full, the head is also sitting on the oldest sample, which is the one about to be overwritten. The newest sample is always one step behind the head.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="100" r="70" fill="none" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <rect x="104.0" y="18.0" width="32" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="120.0" y="34.0" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <rect x="153.5" y="38.5" width="32" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="169.5" y="54.5" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <rect x="174.0" y="88.0" width="32" height="24" fill="#b4232c" stroke="#1f2a44"/>
  <text x="190.0" y="104.0" font-size="11" fill="#ffffff" text-anchor="middle">2</text>
  <rect x="153.5" y="137.5" width="32" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <text x="169.5" y="153.5" font-size="11" fill="#1f2a44" text-anchor="middle">3</text>
  <rect x="104.0" y="158.0" width="32" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="120.0" y="174.0" font-size="11" fill="#1f2a44" text-anchor="middle">4</text>
  <rect x="54.5" y="137.5" width="32" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="70.5" y="153.5" font-size="11" fill="#1f2a44" text-anchor="middle">5</text>
  <rect x="34.0" y="88.0" width="32" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="50.0" y="104.0" font-size="11" fill="#1f2a44" text-anchor="middle">6</text>
  <rect x="54.5" y="38.5" width="32" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="70.5" y="54.5" font-size="11" fill="#1f2a44" text-anchor="middle">7</text>
  <rect x="240" y="60" width="14" height="14" fill="#b4232c" stroke="#1f2a44"/>
  <text x="260" y="71" font-size="11" fill="#1f2a44">newest sample</text>
  <rect x="240" y="86" width="14" height="14" fill="#f2b880" stroke="#1f2a44"/>
  <text x="260" y="97" font-size="11" fill="#1f2a44">head: oldest,</text>
  <text x="260" y="112" font-size="11" fill="#1f2a44">overwritten next</text>
  <text x="240" y="140" font-size="11" fill="#6c7a93">next slot = (head + 1) % 8</text>
</svg>
```
:::

::: context timeline-picture The made-up flight on one line
The whole flight in time order. The shaded band is what the ring buffer holds: the last second, 8.55 s to 9.54 s at 100 Hz. The 1 Hz status records fall at whole seconds, so only one of them, at 9.0 s, lands inside the six-sample glitch, and on its own it looked believable.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="293.6" y="70" width="31.7" height="40" fill="#8fb8f0"/>
  <line x1="20" y1="90" x2="340" y2="90" stroke="#1f2a44"/>
  <line x1="20" y1="84" x2="20" y2="96" stroke="#1f2a44"/>
  <text x="20" y="124" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <line x1="116.0" y1="84" x2="116.0" y2="96" stroke="#1f2a44"/>
  <text x="116.0" y="124" font-size="11" fill="#1f2a44" text-anchor="middle">3</text>
  <line x1="325.3" y1="84" x2="325.3" y2="96" stroke="#1f2a44"/>
  <text x="325.3" y="124" font-size="11" fill="#1f2a44" text-anchor="middle">9.54</text>
  <text x="20" y="62" font-size="11" fill="#1f2a44">launch</text>
  <text x="116.0" y="62" font-size="11" fill="#1f2a44" text-anchor="middle">burnout</text>
  <line x1="309.3" y1="44" x2="309.3" y2="110" stroke="#b4232c" stroke-width="2"/>
  <text x="303.3" y="40" font-size="11" fill="#b4232c" text-anchor="end">drogue fires, 9.04 s</text>
  <text x="289.6" y="124" font-size="11" fill="#1f2a44" text-anchor="end">8.55</text>
  <text x="20" y="144" font-size="11" fill="#6c7a93">time, s; shaded: ring buffer, 8.55 s to 9.54 s</text>
</svg>
```
:::

::: context monotonic-clock Two kinds of clock
A wall clock tells the time of day, and it can jump: a computer's clock is corrected by network time or GPS, and may step backwards by a fraction of a second or more. A **monotonic clock** only counts forward from some starting point, such as boot, and is never corrected by jumping. Durations and orderings on board should use the monotonic clock. To connect it to the outside world, log the pair (monotonic time, UTC) whenever a good outside time fix arrives; the investigation can then convert every record. In Lesson 01, repeated time stamps broke a filter; a monotonic clock with enough resolution is part of the cure.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44"/>
  <line x1="40" y1="140" x2="40" y2="15" stroke="#1f2a44"/>
  <text x="340" y="158" font-size="11" fill="#1f2a44" text-anchor="end">real time passing</text>
  <text x="46" y="24" font-size="11" fill="#1f2a44">clock reading</text>
  <line x1="40" y1="130" x2="320" y2="30" stroke="#1d6fd1" stroke-width="2"/>
  <text x="250" y="44" font-size="11" fill="#1d6fd1" text-anchor="end">monotonic</text>
  <polyline points="40,115 180,65 180,85 320,35" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="186" y="102" font-size="11" fill="#b4232c">wall clock stepped back</text>
  <text x="186" y="116" font-size="11" fill="#b4232c">by a correction</text>
</svg>
```
:::

::: context pathfinder A bug found on Mars
Mars Pathfinder landed on Mars on 4 July 1997. Days later its computer began resetting itself. The software ran on the VxWorks real-time operating system, which can record a trace of system events. Engineers at NASA's Jet Propulsion Laboratory reproduced the resets on an identical copy of the spacecraft on the ground with tracing turned on, and the trace showed the cause: a priority inversion, in which a low-priority task held a shared lock that a high-priority task needed, while medium-priority tasks kept the low one from running. A timing check noticed the high-priority task had not finished in time and reset the computer. The fix, turning on priority inheritance for that lock, was uploaded to the lander. Glenn Reeves of the Pathfinder flight software team later wrote a well-known account of it.
:::
