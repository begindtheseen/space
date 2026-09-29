---
id: l13-the-telemetry-lifecycle
title: "From vehicle to report: the telemetry lifecycle"
minutes: 24
covers:
  - "The telemetry lifecycle: vehicle, downlink, decommutation, time-series store, analysis, report"
  - "Time-series stores: InfluxDB, TimescaleDB, ClickHouse; the reported Starlink stack of Kafka, HBase, HDFS on Docker and Kubernetes"
---

Think about a postcard from a friend on a trip. She writes it, puts a stamp and an address on it, and drops it in a box. It rides in trucks and planes, gets sorted by machines that read only the address, and lands in your mailbox. You read it, pin it to the fridge, and maybe tell your family what it said. At every step someone handled it who cared only about their part: the sorter never read the message, and you never saw the truck.

Telemetry takes the same kind of trip. A sensor on a satellite measures a voltage. That number is packed into a packet, the packet into a frame, the frame is radioed to a ground antenna, forwarded over the internet, unpacked, converted into volts, stored, queried, plotted, and finally shows up as one line in a report an engineer signs. This path is the **[[telemetry lifecycle|lifecycle-picture]]**: vehicle, downlink, decommutation, time-series store, analysis, report.

This module's lessons each covered one stretch of that road. This one walks the whole road once, compares three databases built for time series, and looks at the stack Starlink is publicly reported to use.

## Stage 1: the vehicle measures

A sensor turns something physical — temperature, current, pressure — into a voltage. An **analog-to-digital converter** (ADC) turns that voltage into a whole number called a **raw count**. A 12-bit ADC gives counts from 0 to $2^{12} - 1 = 4095$. The count alone means nothing yet: 2800 counts might be 28 volts or 19 degrees, depending on the sensor and its wiring.

The flight computer reads each sensor on a schedule — a battery voltage once a second, a gyro hundreds of times a second. Each measurement stream is a **channel**, named by a short **mnemonic** like `BATT_V`.

## Stage 2: packets and frames

To ship thousands of numbers over one radio link, the flight software packs them in two layers, like letters in envelopes and envelopes in a mailbag.

Many spacecraft follow the standards of the **[[CCSDS|ccsds-name]]**, the Consultative Committee for Space Data Systems, a body run by the world's space agencies. Its smallest envelope is the **space packet**. Every space packet starts with a 6-byte **primary header**, and the header carries exactly these fields, in this order:

| Field | Bits | What it says |
| --- | --- | --- |
| Version | 3 | always 0 today |
| Type | 1 | 0 = telemetry (down), 1 = command (up) |
| Secondary header flag | 1 | 1 if a secondary header (usually a timestamp) follows |
| APID | 11 | which application or data stream this packet belongs to |
| Sequence flags | 2 | 3 means a whole packet, not a piece of a split one |
| Sequence count | 14 | counts packets of this APID, 0 to 16383, then wraps |
| Data length | 16 | number of bytes in the data field, minus one |

Read APID aloud as "ay-pid". It stands for **application process identifier**: one number per kind of packet, such as "power housekeeping" or "attitude data". The **sequence count** is the counter you used in lesson 12 to find lost packets. It counts separately for each APID, and it wraps after 16383.

After the header comes the **data field**: an optional secondary header, often a timestamp from the onboard clock, and then the measurements themselves, laid out in a fixed order the ground knows in advance. Putting many measurements into fixed positions in one stream is called **[[commutation|commutation-origin]]**. Undoing it on the ground is **decommutation**, "decom" for short.

::: example Decode a space packet header
A packet begins with the six bytes `08 64 C4 D2 00 11` (in **hexadecimal**, base 16, where each pair of characters is one byte). Pull the fields out with Python's bit operators: `>>` shifts bits to the right, and `&` keeps only the bits set in a mask.

```python
hdr = bytes.fromhex("0864C4D20011")

w1 = int.from_bytes(hdr[0:2], "big")   # first 16 bits
w2 = int.from_bytes(hdr[2:4], "big")   # second 16 bits
w3 = int.from_bytes(hdr[4:6], "big")   # third 16 bits

version   = w1 >> 13            # top 3 bits
pkt_type  = (w1 >> 12) & 0x1    # next bit: 0 = telemetry, 1 = command
sec_hdr   = (w1 >> 11) & 0x1    # next bit: secondary header present?
apid      = w1 & 0x7FF          # low 11 bits
seq_flags = w2 >> 14            # top 2 bits: 3 = a whole, unsplit packet
seq_count = w2 & 0x3FFF         # low 14 bits
data_len  = w3 + 1              # field stores (bytes in data field) - 1

print(version, pkt_type, sec_hdr, apid, seq_flags, seq_count, data_len)
# 0 0 1 100 3 1234 18
```

Check it by hand. The first two bytes, `0x0864`, are 2148, or in binary `0000 1000 0110 0100`. The top three bits are `000`, version 0. The next bit is `0`, telemetry. The next is `1`, a secondary header follows. The last eleven bits are `000 0110 0100`, which is $64 + 32 + 4 = 100$: APID 100.

The next two bytes, `0xC4D2`, are `1100 0100 1101 0010`. The top two bits `11` are 3, a whole packet. The remaining fourteen bits are $0x04D2 = 4 \times 256 + 13 \times 16 + 2 = 1234$. The last two bytes are 17, so the data field is 18 bytes, and the whole packet is $6 + 18 = 24$ bytes long.
:::

Packets then ride inside **transfer frames**: fixed-length blocks, each marked with a spacecraft ID, a virtual channel number (so one link can carry several separate streams), frame counters, and error-control bits. A fixed pattern of bits, the sync marker, sits in front of each frame so the ground receiver can find where frames start in a continuous stream of bits. Frames are what the radio actually carries; packets are what the software cares about.

::: key The CCSDS space packet
A 6-byte primary header: version (3 bits), type (1), secondary header flag (1), **APID** (11 bits, which data stream), sequence flags (2), **sequence count** (14 bits, per APID, wraps after 16383), data length (16 bits, bytes in the data field minus one). Packets travel inside fixed-length **transfer frames**.
:::

## Stage 3: downlink through ground stations

A satellite in low Earth orbit is in view of any one ground station for only a few minutes per pass. During that **contact**, the station's antenna tracks the satellite, receives the radio signal, finds the frames, and corrects bit errors using the error-correcting code built into them. Then it forwards the frames, or the packets inside them, over ordinary networks to the operations center.

This is where lesson 12's problems are born: two stations make duplicates, unrepairable frames leave gaps, playback arrives out of order. The station also stamps each frame's **arrival time** from a GPS-disciplined clock — your `rx_ts`.

## Stage 4: decommutation and calibration

Decom takes each packet, reads its APID to look up its layout, and cuts the data field into channels: "bytes 0–1 are `BATT_V`, bytes 2–3 are `BUS_T`…". Out come raw counts, each with a satellite, a channel and a vehicle timestamp.

Then **calibration** turns counts into **engineering units** — volts, degrees Celsius, amps — using a **calibration curve** measured on the ground before launch. Often it is a polynomial:

$$
EU = c_0 + c_1 x + c_2 x^2
$$

where $x$ is the raw count and $c_0$, $c_1$, $c_2$ (read "c zero, c one, c two") are the channel's coefficients. A sensor with a curvy response, such as a thermistor, may need more terms or a lookup table.

Coefficients change. A sensor is recalibrated in orbit, or someone finds a mistake in the ground test. So the calibration table is versioned by time, and every raw count must be converted with the curve that was valid *at the moment the sample was taken*.

::: example Apply the right calibration to each sample
Two tables: `raw_sample (sat_id, ts, channel, raw_count)` with a `CHECK (raw_count BETWEEN 0 AND 4095)`, and a versioned `calibration` table, one row per channel per period:

```sql
INSERT INTO calibration (channel, valid_from, valid_to, c0, c1, c2, units) VALUES
  ('BATT_V', '2026-01-01',       '2026-03-01 06:00', 0.05, 0.01000, 0,      'V'),
  ('BATT_V', '2026-03-01 06:00', 'infinity',         0.02, 0.01002, 0,      'V'),
  ('BUS_T',  '2026-01-01',       'infinity',        -40.0, 0.035,   1.2e-6, 'degC');
```

`BATT_V` was recalibrated at 06:00 on 1 March. `'infinity'` is a PostgreSQL timestamp later than every other, meaning "still valid". Each period is half-open, $[\text{valid\_from}, \text{valid\_to})$, so every instant falls in exactly one.

Join each sample to the one calibration row whose period contains its time:

```sql
SELECT r.ts, r.channel, r.raw_count,
       round((c.c0 + c.c1 * r.raw_count + c.c2 * r.raw_count^2)::numeric, 3) AS eu,
       c.units, c.valid_from AS cal_version
FROM raw_sample AS r
JOIN calibration AS c
  ON c.channel = r.channel
 AND r.ts >= c.valid_from AND r.ts < c.valid_to
ORDER BY r.ts, r.channel;
```

```text
           ts           | channel | raw_count |   eu   | units |      cal_version
------------------------+---------+-----------+--------+-------+------------------------
 2026-03-01 05:59:59+00 | BATT_V  |      2800 | 28.050 | V     | 2026-01-01 00:00:00+00
 2026-03-01 06:00:00+00 | BATT_V  |      2800 | 28.076 | V     | 2026-03-01 06:00:00+00
 2026-03-01 06:00:00+00 | BUS_T   |      1600 | 19.072 | degC  | 2026-01-01 00:00:00+00
```

Check the arithmetic. Old curve: $0.05 + 0.01 \times 2800 = 0.05 + 28 = 28.050\,\mathrm{V}$. New curve: $0.02 + 0.01002 \times 2800 = 0.02 + 28.056 = 28.076\,\mathrm{V}$. The same raw count gives voltages 26 millivolts apart, one second apart, only because the curve changed. Temperature: $-40 + 0.035 \times 1600 + 0.0000012 \times 1600^2 = -40 + 56 + 3.072 = 19.072\,^\circ\mathrm{C}$, a comfortable room temperature for electronics, so it looks right.

In SQLite, `^` is not a power operator and there is no `'infinity'`: write `c.c2 * r.raw_count * r.raw_count`, store times as ISO-8601 text, and use a far-future string such as `'9999-12-31T00:00:00Z'` for "still valid". The same query then gives the same three numbers.
:::

::: warning Keep the raw counts
It is tempting to store only engineering units, since that is what everyone plots. Do not throw the counts away. When a calibration is corrected next year, the only way to fix two years of volts is to recompute them from the counts. Store raw counts (cheap, small integers) and derive engineering units in a view, a materialized view, or a second column tagged with the calibration version.
:::

Decom is also where **limit checking** usually happens: each channel has yellow and red limits, and a value outside them raises an alarm for the operators on shift, seconds after the frame arrived.

## Stage 5: the time-series store

Everything so far produces one kind of row, over and over: *which vehicle, which channel, when, what value*. A database designed around rows like that is a **time-series store**. Three are common, and they are built very differently.

**InfluxDB** is a database made only for time series. Its data model has four parts: a **measurement** (like a table name), **tags** (indexed text labels such as satellite and channel), **fields** (the values), and a timestamp. You write a sample as one line of text in its **line protocol**:

```text
telemetry,sat_id=SAT-0417,channel=BATT_V value=28.1 1772338320000000000
```

That reads: measurement `telemetry`, tags `sat_id` and `channel`, field `value` = 28.1, at a time given in nanoseconds since 1 January 1970 (this one is 04:12:00 UTC on 1 March 2026). Its strength is easy ingest and built-in time functions. Its classic weakness was **[[series cardinality|cardinality]]**: every distinct combination of tag values is a separate series, and the older versions slowed down badly when those numbered in the tens of millions. Version 3, released in 2025, rebuilt the storage on columnar Parquet files and accepts SQL.

**TimescaleDB** is an extension to PostgreSQL. You keep ordinary tables, SQL, joins, constraints and `ON CONFLICT`, and turn a table into a **hypertable** that is split automatically into time **chunks** — the range partitioning of lesson 10, managed for you:

```sql
-- TimescaleDB syntax (the extension is not installed on this module's test server)
SELECT create_hypertable('tm_sample', 'ts', chunk_time_interval => INTERVAL '1 day');
```

It adds **continuous aggregates** (lesson 10) and compression that turns older chunks columnar. Its limit: it is one PostgreSQL server at heart.

**ClickHouse** is a column-oriented analytics database, open-sourced by Yandex in 2016. Tables use the **MergeTree** family of engines: data is written in sorted, immutable **parts**, and background merges combine them. The table's sort key does the work an index does in PostgreSQL, so it is chosen by the left-prefix thinking of lesson 6:

```sql
-- ClickHouse syntax (not installed here)
CREATE TABLE tm_sample (
  sat_id  LowCardinality(String),
  channel LowCardinality(String),
  ts      DateTime64(3, 'UTC'),
  value   Float64
) ENGINE = ReplacingMergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (sat_id, channel, ts);
```

Its strength is raw scan speed: aggregating billions of rows in seconds, with strong compression (lesson 11's columnar storage). Its catch is in that engine name. `ReplacingMergeTree` removes rows with the same sort key *when parts merge*, which happens in the background, at no fixed time. Until then a query can see both copies of a duplicated frame unless it asks for merged results with `FINAL`, which costs extra. Lesson 12's instant upsert does not exist there.

::: key Three time-series stores
**InfluxDB**: purpose-built; measurement, tags (indexed labels), fields (values), timestamp; watch tag cardinality. **TimescaleDB**: PostgreSQL extension; hypertables auto-partitioned into time chunks; full SQL, constraints and upserts; continuous aggregates and compression. **ClickHouse**: columnar analytics database; MergeTree tables sorted by an `ORDER BY` key; fastest for huge scans; deduplication happens only at background merge.
:::

::: warning "Which is fastest?" is the wrong first question
Ask first: what are the queries, how many series, how much history, and are transactions and upserts needed? Strict idempotent ingest with many joins favors TimescaleDB; scanning years of fleet-wide data favors ClickHouse.
:::

## The reported Starlink stack

What does a real fleet of thousands of satellites use? SpaceX does not publish its architecture, so everything here is **as reported** — in public job postings and in interviews its engineers have given — and details may have changed since.

A 2021 Stack Overflow blog profile of SpaceX's software teams described a telemetry data store built for Starlink on **.NET**, **Kafka**, **HBase** and **HDFS**, running on **Docker** and **Kubernetes**. Starlink job postings since then ask for experience with Kafka, HBase, HDFS, Spark and Flink, and with Docker and Kubernetes. Related SpaceX data roles have listed PostgreSQL, CockroachDB, Hive and Delta Lake, and tools such as Grafana, Jupyter, Metabase and PowerBI. In 2020 the Starlink software team said in a public online Q&A that the constellation was producing **[[more than 5 TB|five-tb]]** of telemetry a day — when it had only a few hundred satellites.

::: key What is the reported Starlink telemetry stack?
A .NET service layer with Kafka for ingest, HBase and HDFS for storage, running on Docker and Kubernetes. Related SpaceX data roles list PostgreSQL, CockroachDB, Hive and Delta Lake, with Grafana, Jupyter, Metabase and PowerBI for exploration. (As reported in public job postings and talks, not published by SpaceX as a design.)
:::

Here is what each piece does, and where it sits on the road.

- **[[Kafka|kafka-log]]** is a distributed **log**: an append-only list of messages, split into **topics** (for example, one per kind of packet) and each topic into **partitions** spread over many machines. Every message in a partition has a position number, its **offset**. Ground stations *produce* messages; decom and storage services *consume* them, each remembering the offset it reached. Kafka keeps messages for a set time (a week by default), so a crashed consumer restarts from its last saved offset — possibly reprocessing a few messages, which is why consumers must be idempotent (lesson 12).
- **HBase** is a wide-column database modeled on Google's Bigtable. Rows are sorted by a **row key** and split by key range into **regions** served by different machines. Its row key plays the part of a composite index, so its design follows the left-prefix rule: something like satellite, then channel, then time. A key that *starts* with the timestamp sends every new write to the same region — a **[[hotspot|hotspot]]** — while the other machines sit idle.
- **HDFS**, the Hadoop Distributed File System, stores very large files split into big blocks (128 MB by default), each block copied to three machines by default. HBase keeps its data files on HDFS; archives and batch jobs read from it directly.
- **Docker** packs a program and everything it needs into a **container image** that runs the same anywhere. **Kubernetes** runs many containers across a cluster, restarting failed ones and adding copies under load.

::: example How much data flows through the log?
Suppose each of 6000 satellites sends 100 packets per second, averaging 100 bytes each. How much must the ingest log carry, and how much disk does a week of it need?

Per satellite: $100 \times 100 = 10\,000$ bytes per second, 10 kB/s.

Fleet: $6000 \times 10\,000 = 6.0 \times 10^7$ bytes per second, 60 MB/s.

Per day: $6.0 \times 10^7 \times 86\,400 = 5.18 \times 10^{12}$ bytes, about 5.2 TB — the same size as the reported Starlink figure, though with far more satellites than in 2020.

Kafka usually keeps three copies of each partition, so a day takes $3 \times 5.18 \approx 15.6$ TB of disk, and a week of retention $7 \times 15.6 \approx 109$ TB.

**Check:** 60 MB/s is about half a gigabit per second of network traffic — heavy for one server, comfortable for a cluster with the load spread over many partitions. That is exactly why the log is partitioned.
:::

## Stage 6: analysis and report

At the end of the road, engineers ask questions from notebooks (Jupyter), dashboards (Grafana) or SQL clients: "battery voltage for plane 12 across eclipse season". Repeated heavy questions become continuous aggregates (lesson 10); rare huge ones run as batch jobs over columnar archives (lesson 11).

The last stop is a **report**: a plot in an anomaly review, a number behind a decision. Every earlier stage can quietly change that plot — a new calibration, late playback data, a corrected clock offset — which is why the next lesson makes plots reproducible.

::: key The telemetry lifecycle
Vehicle (sensors → raw counts) → packetization (CCSDS space packets in transfer frames) → downlink via ground stations (arrival time stamped; duplicates, gaps, reordering born here) → decommutation (split packets into channels) and calibration (raw counts → engineering units with versioned curves) → time-series store → analysis → report.
:::

## Check yourself

::: check
A packet header starts `08 C9 40 07`. Find the packet type, the APID and the sequence count. Is it a whole packet?
:::

::: answer
First two bytes `0x08C9` = `0000 1000 1100 1001`. Top three bits `000`: version 0. Next bit `0`: telemetry. Next bit `1`: secondary header present. Last eleven bits `000 1100 1001` = $128 + 64 + 8 + 1 = 201$: APID 201.

Next two bytes `0x4007` = `0100 0000 0000 0111`. Top two bits `01` = 1: sequence flags 1, which is *not* 3 — this is the first piece of a packet split into segments, not a whole packet. The remaining fourteen bits are `00 0000 0000 0111` = 7: sequence count 7.
:::

::: check
A thermistor channel's calibration was found to be wrong and corrected with new coefficients from 1 June. The team stored only engineering units since launch. What can they do, and what should the schema have looked like?
:::

::: answer
With only engineering units, they must invert the old curve to get back to counts (possible only if the old curve was invertible and the stored values were not rounded too much), then apply the new one. That is fragile.

The schema should have stored the raw counts, plus a calibration table with half-open validity periods, and derived engineering units in a view or a column tagged with the calibration version. Then the fix is one new calibration row and a recompute.
:::

::: check
Your ingest must never show a duplicated frame to a query, even for a minute, and must join samples to five reference tables. Which of the three stores fits best, and why not the others?
:::

::: answer
TimescaleDB. It is PostgreSQL, so a primary key plus `INSERT … ON CONFLICT` makes each write idempotent at once, and joins to reference tables are ordinary SQL.

ClickHouse's `ReplacingMergeTree` removes duplicates only when parts merge in the background, so a query can briefly see both copies unless it uses `FINAL`. InfluxDB overwrites a point with the same series and timestamp, which handles exact duplicates, but joining to reference tables is not what it is built for.
:::

::: check
An HBase table uses the row key `timestamp|sat_id|channel`. Ingest is slow and one machine is at full load while the rest are idle. Explain, and propose a better key.
:::

::: answer
HBase sorts rows by key and gives each machine a key range. Every new sample has the newest timestamp, so every new row lands at the end of the key space, in the same region on the same machine: a hotspot.

Lead with the satellite: `sat_id|channel|timestamp`. New writes now spread across all satellites' key ranges, and a query for one satellite and channel over a time range reads one contiguous stretch — the left-prefix rule, as for a composite index.
:::

::: check
Why must a Kafka consumer that writes to the database be idempotent, even if every ground station sent each frame exactly once?
:::

::: answer
A consumer records its offset only from time to time. If it crashes after writing some messages but before recording the offset, it restarts from the last recorded offset and processes those messages again. So Kafka delivers "at least once", and the same message can be written twice even with no duplicates upstream. A natural key plus an upsert makes the second write harmless.
:::

## Summary

| Stage or tool | What it does | Where it bites |
| --- | --- | --- |
| Sensor and ADC | voltage → raw count, 0–4095 for 12 bits | counts mean nothing without calibration |
| Space packet | 6-byte header: APID (11 bits), sequence count (14 bits), data length − 1 | count wraps; data length is off by one |
| Transfer frame | fixed-length radio block carrying packets | frames dropped or received twice |
| Ground station | receives, corrects bits, stamps arrival time | duplicates, gaps, out-of-order data |
| Decom and calibration | packets → channels; counts → engineering units | use the curve valid at sample time; keep counts |
| InfluxDB | measurement, tags, fields, timestamp | tag cardinality |
| TimescaleDB | PostgreSQL + hypertables, continuous aggregates | one server at heart |
| ClickHouse | columnar, MergeTree sorted by key | dedup only at merge |
| Kafka | partitioned, replayable log | at-least-once: consumers must be idempotent |
| HBase on HDFS | sorted wide-column store on replicated files | row key hotspots |
| Docker and Kubernetes | package and run services across a cluster | — |

Next lesson closes the module and the SQL track with the rules around the data: who is allowed to see it, how long it is kept, and how to make every published plot reproducible.

::: context lifecycle-picture The whole road on one page
Each box is a stage; each arrow is a hand-off where data can be lost, doubled or delayed. The top row happens in space and at the antenna; the bottom row on the ground, in software.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="20" width="100" height="50" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="58" y="41" font-size="12" fill="#1f2a44" text-anchor="middle">Vehicle</text>
  <text x="58" y="58" font-size="11" fill="#1f2a44" text-anchor="middle">sensors, packets</text>
  <rect x="130" y="20" width="100" height="50" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="41" font-size="12" fill="#1f2a44" text-anchor="middle">Downlink</text>
  <text x="180" y="58" font-size="11" fill="#1f2a44" text-anchor="middle">ground stations</text>
  <rect x="252" y="20" width="100" height="50" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="302" y="41" font-size="12" fill="#1f2a44" text-anchor="middle">Decom</text>
  <text x="302" y="58" font-size="11" fill="#1f2a44" text-anchor="middle">counts to units</text>
  <rect x="252" y="120" width="100" height="50" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="302" y="141" font-size="12" fill="#1f2a44" text-anchor="middle">Store</text>
  <text x="302" y="158" font-size="11" fill="#1f2a44" text-anchor="middle">time series</text>
  <rect x="130" y="120" width="100" height="50" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="180" y="141" font-size="12" fill="#1f2a44" text-anchor="middle">Analysis</text>
  <text x="180" y="158" font-size="11" fill="#1f2a44" text-anchor="middle">queries, notebooks</text>
  <rect x="8" y="120" width="100" height="50" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="58" y="141" font-size="12" fill="#1f2a44" text-anchor="middle">Report</text>
  <text x="58" y="158" font-size="11" fill="#1f2a44" text-anchor="middle">plots, decisions</text>
  <g stroke="#1d6fd1" stroke-width="2" fill="#1d6fd1">
    <line x1="108" y1="45" x2="124" y2="45"/><polygon points="130,45 122,41 122,49"/>
    <line x1="230" y1="45" x2="246" y2="45"/><polygon points="252,45 244,41 244,49"/>
    <line x1="302" y1="70" x2="302" y2="112"/><polygon points="302,120 298,112 306,112"/>
    <line x1="252" y1="145" x2="238" y2="145"/><polygon points="230,145 238,141 238,149"/>
    <line x1="130" y1="145" x2="116" y2="145"/><polygon points="108,145 116,141 116,149"/>
  </g>
  <text x="180" y="192" font-size="11" fill="#6c7a93" text-anchor="middle">space and antenna on top; ground software below</text>
</svg>
```
:::

::: context ccsds-name Who writes the rules for space data
The Consultative Committee for Space Data Systems was founded in 1982 by the world's major space agencies, including NASA and ESA, so that one agency's ground stations could receive another's spacecraft. Its recommendations, called "Blue Books", define packets, frames, time codes and much more. Following them means a satellite can be tracked by commercial ground networks without custom software. Not every company uses CCSDS formats for everything, but the same ideas — a stream identifier, a counter, a length, a timestamp — appear in almost every telemetry format.
:::

::: context commutation-origin A word from rotating switches
Early rocket telemetry had one radio channel and many sensors. A motor-driven rotary switch, the **commutator**, touched each sensor's wire in turn and sent its voltage down the one channel, round and round. On the ground, a matching switch spinning in step sent each slice back to its own dial: decommutation. The spinning switches are long gone, replaced by software that puts values in fixed byte positions, but the words stayed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="80" cy="75" r="45" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="80" cy="30" r="5" fill="#1d6fd1"/><circle cx="125" cy="75" r="5" fill="#1d6fd1"/>
  <circle cx="80" cy="120" r="5" fill="#1d6fd1"/><circle cx="35" cy="75" r="5" fill="#1d6fd1"/>
  <text x="80" y="18" font-size="11" fill="#1f2a44" text-anchor="middle">A</text>
  <text x="138" y="79" font-size="11" fill="#1f2a44">B</text>
  <text x="80" y="143" font-size="11" fill="#1f2a44" text-anchor="middle">C</text>
  <text x="18" y="79" font-size="11" fill="#1f2a44">D</text>
  <line x1="80" y1="75" x2="112" y2="43" stroke="#b4232c" stroke-width="3"/>
  <line x1="150" y1="75" x2="200" y2="75" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="208,75 198,70 198,80" fill="#1f2a44"/>
  <rect x="214" y="60" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="244" y="60" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="274" y="60" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="304" y="60" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="229" y="80" font-size="12" fill="#1f2a44" text-anchor="middle">A</text>
  <text x="259" y="80" font-size="12" fill="#1f2a44" text-anchor="middle">B</text>
  <text x="289" y="80" font-size="12" fill="#1f2a44" text-anchor="middle">C</text>
  <text x="319" y="80" font-size="12" fill="#1f2a44" text-anchor="middle">D</text>
  <text x="274" y="112" font-size="11" fill="#1f2a44" text-anchor="middle">one stream, fixed slots</text>
</svg>
```
:::

::: context cardinality When there are too many labels
In InfluxDB, a series is one measurement plus one exact set of tag values. `sat_id` with 6000 values and `channel` with 500 values already make 3 million series. Add a tag with a unique value per packet — a sequence count, say — and the number of series explodes, and the index that tracks them grows without limit. The rule of thumb: tags for things you filter and group by that have a bounded set of values; fields for measured values and anything close to unique.
:::

::: context five-tb How big is 5 TB a day?
Five terabytes is five million megabytes. Spread over a day it is about 58 megabytes every second, all day, every day. In 2020 Starlink had only a few hundred satellites in orbit, and each of them was reporting its health, its radios' state and its network traffic. A fleet ten times larger, with more channels, grows from there. That scale is why the data goes into a partitioned log and a cluster, not a single database server.
:::

::: context kafka-log A log you can rewind
Picture a notebook where you may only write on the next empty line and never erase. Each line has a number. Anyone can read, and each reader keeps a bookmark. Kafka is that notebook, split into several notebooks (partitions) so many writers and readers can work at once. Order is guaranteed only within one partition, which is why messages for one satellite are usually sent to the same partition.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">topic: housekeeping</text>
  <text x="10" y="50" font-size="11" fill="#1f2a44">partition 0</text>
  <text x="10" y="100" font-size="11" fill="#1f2a44">partition 1</text>
  <g fill="#8fb8f0" stroke="#1f2a44">
    <rect x="90" y="35" width="30" height="24"/><rect x="120" y="35" width="30" height="24"/>
    <rect x="150" y="35" width="30" height="24"/><rect x="180" y="35" width="30" height="24"/>
    <rect x="210" y="35" width="30" height="24"/>
    <rect x="90" y="85" width="30" height="24"/><rect x="120" y="85" width="30" height="24"/>
    <rect x="150" y="85" width="30" height="24"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="105" y="51">0</text><text x="135" y="51">1</text><text x="165" y="51">2</text>
    <text x="195" y="51">3</text><text x="225" y="51">4</text>
    <text x="105" y="101">0</text><text x="135" y="101">1</text><text x="165" y="101">2</text>
  </g>
  <text x="250" y="51" font-size="11" fill="#6c7a93">new writes here</text>
  <line x1="165" y1="70" x2="165" y2="60" stroke="#b4232c" stroke-width="2"/>
  <text x="165" y="80" font-size="11" fill="#b4232c" text-anchor="middle">bookmark</text>
  <text x="180" y="138" font-size="11" fill="#1f2a44" text-anchor="middle">each number is an offset; readers resume from their bookmark</text>
</svg>
```
:::

::: context hotspot Why sorted keys can pile up
A sorted store splits its keys into ranges and gives each range to one machine, like a library that shelves A–F on one floor, G–M on the next. If every new book's title starts with today's date, every new book goes on the same shelf on the same floor, while the other floors wait. Starting the key with the satellite ID spreads new writes across all 6000 key ranges at once. The same idea is why lesson 6's index on `(sat_id, ts)` serves "one satellite over a time range" so well.
:::
