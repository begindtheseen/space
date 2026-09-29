---
id: l11-columnar-storage-and-ingest
title: Columnar storage, Parquet, batch and streaming
minutes: 24
covers:
  - Columnar storage and Parquet; batch versus streaming ingest
---

Think of a class's report cards. Each student has one card, with a grade for every subject. If the principal wants one student's whole record, the cards are perfect: pull one card and read it. But if she wants the class's average math grade, she has to pick up every single card, find the math line on each, and ignore the other seven subjects she is holding. It would be faster to keep one sheet per *subject*, listing that subject's grades for the whole class.

A database table can be stored either way. So far every table in this course has been stored like the report cards. This lesson turns the table sideways: why storing it **column by column** makes telemetry many times smaller and faster to scan, and how **Parquet**, the most common columnar file format, lets readers skip most of a file. Then the other end of the pipe: how data gets *in*, in batches or as a stream, and what can go wrong on the way.

Last lesson's fleet sketch ended with "the archive in Parquet on object storage". This is where that archive is built.

## Row storage: the report cards

PostgreSQL stores a table in **pages** of 8 kB. Each page holds whole rows, one after another: satellite, time, channel, value, then the next row's satellite, time, channel, value. This is **row storage**, also called a **row store**.

A row store is excellent at the jobs an operational database does all day:

- fetching or updating **one row**, or a few, by key — every column of that row sits together, usually in one page;
- inserting a new row — write it into the page with space, done.

It is wasteful for the job analysis does all day: reading **one or two columns of millions of rows**. To average `value` over a month, PostgreSQL must read every page holding those rows, and those pages also hold every row's `sat_id`, `ts`, `channel` and 23-byte row header. On the practice table from lesson 09, one row costs about 68 bytes on disk, of which the `value` you wanted is 8.

## Column storage: one sheet per subject

A **column store** keeps each column's values together: all the `sat_id` values in one run, all the `ts` values in another, all the `value`s in a third. This is **[[columnar storage|row-vs-column]]**. To average `value`, you read only the `value` column. The others stay on disk, untouched.

Two things make this a huge win for telemetry, not a small one.

**Analysis touches few columns.** A telemetry table may have a dozen columns; a typical question reads two or three. Reading 3 columns of 12 is already about a quarter of the bytes.

**Similar values sit next to each other, so they compress.** In a row store, the neighbors of a `channel` value are a timestamp and a float — nothing alike. In a column store, the neighbors of a `channel` value are other channel names, and there are only four of them. Data where the same few things repeat is exactly what compression is good at.

The price is paid on writes: one new row touches every column's run, and changing a row is worse. Column stores prefer data written in large batches and rarely changed — a day of telemetry that has finished arriving.

::: key Row store versus column store
A row store keeps each row's values together: fast point lookups, updates and single-row inserts — the operational workload. A column store keeps each column's values together: reads only the columns a query needs, and compresses well because similar values sit side by side — the analytical workload. Telemetry uses both: rows while data is hot, columns once it is closed.
:::

## Compression, column by column

Columnar formats compress in two layers. First an **encoding**, a trick that uses what the column's values look like. Then a general-purpose **compressor** such as **[[zstd|zstd]]** squeezes whatever is left.

The encodings you should know:

- **Dictionary encoding.** Make a short list (the dictionary) of the distinct values, and store each value as its position in the list. `channel` has four distinct names, so each 9-to-14-character name becomes a number from 0 to 3 — two bits.
- **Run-length encoding** (RLE). Store "this value, repeated this many times" instead of the repeats. If the data is sorted so that equal values are adjacent, a column of 40 identical timestamps in a row becomes one pair: (timestamp, 40).
- **Delta encoding.** Store the first value, then only the differences between neighbors. Timestamps one minute apart become the same small number over and over, which then compresses to almost nothing.

These are a big deal for flight data because telemetry is extremely regular: few satellites, few channels, evenly spaced timestamps, and values that change slowly from one sample to the next.

::: example Shrinking the practice table
Export the 5,184,000-row practice table from lesson 09 to CSV, in time order, and turn it into a Parquet file with the Python library **pyarrow**:

```python
import os
import pyarrow as pa
import pyarrow.csv as pv
import pyarrow.parquet as pq

types = {"sat_id": pa.int32(), "ts": pa.timestamp("us", tz="UTC"),
         "channel": pa.string(), "value": pa.float64()}
table = pv.read_csv("telemetry.csv",
                    convert_options=pv.ConvertOptions(column_types=types))
pq.write_table(table, "telemetry.parquet",
               row_group_size=500_000, compression="zstd")

print(table.num_rows, "rows")
print("csv    ", os.path.getsize("telemetry.csv"), "bytes")
print("parquet", os.path.getsize("telemetry.parquet"), "bytes")

meta = pq.ParquetFile("telemetry.parquet").metadata
print(meta.num_row_groups, "row groups")
for name_i in range(meta.num_columns):
    size = sum(meta.row_group(r).column(name_i).total_compressed_size
               for r in range(meta.num_row_groups))
    print(f"{meta.schema.column(name_i).name:8s} {size:>10,d} bytes"
          f"  {size / table.num_rows:.3f} per row")
```

```text
5184000 rows
csv     220249609 bytes
parquet 18914232 bytes
11 row groups
sat_id       35,789 bytes  0.007 per row
ts          909,021 bytes  0.175 per row
channel      50,509 bytes  0.010 per row
value    17,913,251 bytes  3.455 per row
```

**Step 1: compare whole files.** The same data takes 353,902,592 bytes, about 354 MB, as a PostgreSQL table (68.3 bytes per row, before any index), 220 MB as CSV, and 18.9 MB as Parquet. $354 / 18.9 \approx 18.7$: about 19 times smaller than the table. $220.2 / 18.9 \approx 11.7$: about 12 times smaller than the CSV.

**Step 2: look column by column.** `sat_id`, `channel` and `ts` together cost $0.007 + 0.010 + 0.175 = 0.192$ bytes per row — less than two *bits* for `sat_id` and `channel`. They repeat in a regular pattern, which dictionary encoding, run lengths and zstd crush. The `value` column is 95 percent of the file: $17.9 / 18.9 \approx 0.947$. Measurements are the part of telemetry that carries information, so they are the part that resists compression.

**Step 3: be honest about the data.** These values come from a smooth sine wave rounded to three decimals, so many values repeat, and `value` shrank from 8 bytes to 3.46. Real sensor noise compresses less. The pattern holds — identifiers and times almost vanish, measurements dominate — but measure your own data before promising a ratio.
:::

## How a Parquet file is laid out

**Parquet** is an open file format for columnar data, used by nearly every analytics tool: Spark, DuckDB, ClickHouse, pandas and **[[many more|parquet-origin]]**. A Parquet file is not one long run per column. It is organized in [[three nested levels|parquet-layout]], plus a footer.

- A **row group** is a horizontal slice of the table: a block of consecutive rows. Our file has 11: ten of 500,000 rows and a last one of 184,000 ($10 \times 500\,000 + 184\,000 = 5\,184\,000$).
- Inside each row group, every column has one **column chunk**: that column's values for those rows, stored together and compressed.
- Each column chunk is split into **pages**, the unit that is encoded, compressed and read. There may be a **dictionary page** first, then data pages.
- At the end of the file sits the **footer**: the schema, where every row group and column chunk starts, and **statistics** for each column chunk — its minimum, its maximum and how many values are null.

The footer is the key to speed. A reader first reads the footer, a few kilobytes (5,650 bytes for our file), and from then on knows exactly which bytes it needs.

::: key Parquet's layout
A Parquet file is a sequence of row groups; each row group holds one column chunk per column; each column chunk is made of pages. The footer records the schema, the byte offsets, and min/max statistics per column chunk, so a reader can fetch only the columns and row groups it needs.
:::

## Predicate pushdown: skipping row groups

**Predicate pushdown** means handing the query's `WHERE` condition to the storage layer, so it can refuse to read data that cannot match — instead of reading everything and filtering afterwards. In Parquet, the reader compares the condition with each row group's min/max statistics and skips row groups whose range cannot contain a match. You have met this idea twice already: partition pruning in the last lesson, and the BRIN index's per-block-range summaries in lesson 05.

::: example Reading one day out of ninety
Print the `ts` statistics for each row group, then ask for 2 March:

```python
import datetime as dt
import pyarrow.parquet as pq

meta = pq.ParquetFile("telemetry.parquet").metadata
for r in range(meta.num_row_groups):
    stats = meta.row_group(r).column(1).statistics     # column 1 is ts
    print(r, meta.row_group(r).num_rows, stats.min, stats.max)

start = dt.datetime(2026, 3, 2, tzinfo=dt.timezone.utc)
end = dt.datetime(2026, 3, 3, tzinfo=dt.timezone.utc)
day = pq.read_table("telemetry.parquet", columns=["sat_id", "value"],
                    filters=[("ts", ">=", start), ("ts", "<", end)])
print(day.num_rows, "rows on 2 March")
```

```text
0 500000 2026-01-01 00:00:00+00:00 2026-01-09 16:19:00+00:00
1 500000 2026-01-09 16:20:00+00:00 2026-01-18 08:39:00+00:00
2 500000 2026-01-18 08:40:00+00:00 2026-01-27 00:59:00+00:00
3 500000 2026-01-27 01:00:00+00:00 2026-02-04 17:19:00+00:00
4 500000 2026-02-04 17:20:00+00:00 2026-02-13 09:39:00+00:00
5 500000 2026-02-13 09:40:00+00:00 2026-02-22 01:59:00+00:00
6 500000 2026-02-22 02:00:00+00:00 2026-03-02 18:19:00+00:00
7 500000 2026-03-02 18:20:00+00:00 2026-03-11 10:39:00+00:00
8 500000 2026-03-11 10:40:00+00:00 2026-03-20 02:59:00+00:00
9 500000 2026-03-20 03:00:00+00:00 2026-03-28 19:19:00+00:00
10 184000 2026-03-28 19:20:00+00:00 2026-03-31 23:59:00+00:00
57600 rows on 2 March
```

**Step 1: which row groups can hold 2 March?** A row group can match only if its max is at or after 00:00 on the 2nd and its min is before 00:00 on the 3rd. Group 6 ends at 18:19 on the 2nd, so it overlaps. Group 7 starts at 18:20 on the 2nd, so it overlaps too. Every other group is entirely before or after. So 2 of 11 row groups are read; pyarrow's dataset API, asked the same filter, lists exactly groups 6 and 7.

**Step 2: which columns are read?** `ts` (for the filter), `sat_id` and `value` (asked for). `channel` is never touched.

**Step 3: check the answer.** 57,600 rows: $10 \times 4 \times 1440 = 57\,600$, one day of the whole fleet — the same count PostgreSQL gave in lesson 09.
:::

The skipping only worked because the file was written **in time order**, so each row group covers a narrow slice of time. Sort the same rows by satellite, then channel, then time, and write them again: now every row group spans all ninety days, and the same time filter must read all 11 of 11 row groups. On the other hand, the filter `sat_id == 3` then keeps only 2 of 11, while on the time-sorted file it keeps all 11. The sort order you write decides which questions the file answers quickly — the same lesson as BRIN and correlation, one level up.

::: warning A Parquet file is not a database
A Parquet file is written once and then only read. There is no `UPDATE`; to change a row you rewrite the file. There are no indexes beyond the statistics, no constraints, no transactions across files. Many small files are slow too: each has its own footer to fetch, and tiny row groups have useless statistics. Write files big enough to matter — row groups of tens to hundreds of megabytes are common — and compact small ones. Table formats such as **Delta Lake** and **Apache Iceberg** add a transaction log on top of Parquet files to bring back some database behavior.
:::

## Where the archive lives

In the last lesson's sketch, the hot days live in a row store, partitioned by day. When a day closes, it is exported — sorted to suit the questions people ask — into Parquet files on **[[object storage|object-storage]]**, and its partition is dropped. Query engines such as DuckDB, Spark, Trino or ClickHouse can read those files directly, with the pushdown you saw above.

At the 3.65 bytes per sample measured above, 3.78 trillion samples would be about 13.8 TB instead of about 198 TB of row-store table. Treat that as the most optimistic figure — our values were unusually compressible — but even a few times worse is a large saving.

## Getting data in: batch versus streaming

Now the other end: data arriving. Each ground-station pass delivers a burst of frames; decoded, they become rows. There are two broad ways to move them into storage.

**Batch ingest** collects data for a while and loads it in large chunks: every pass, every hour, every night. **Streaming ingest** handles each record, or each small group, as soon as it arrives.

The trade is between two quantities:

- **Latency**: how long from a sample arriving to it being queryable. Streaming wins: seconds or less.
- **Throughput**: how many samples per second the system can load. Batching wins, because fixed costs — a network round trip, a commit that waits for the disk, the start of a file — are paid once per batch instead of once per row.

::: example Four ways to insert 20,000 rows
Load 20,000 rows into a copy of the telemetry table with one B-tree index, four ways. The times are wall-clock, including starting `psql`, on the same machine as the other measurements in these lessons:

| Method | Time | Rows per second |
| --- | --- | --- |
| one `INSERT` per row, each its own transaction | 4.109 s | 4,867 |
| one `INSERT` per row, all in one transaction | 0.439 s | 45,587 |
| multi-row `INSERT`, 1000 rows per statement | 0.158 s | 126,476 |
| `COPY` from a CSV file | 0.068 s | 294,070 |

**Step 1: read the first line.** $4.109 / 20\,000 \approx 0.000205$ seconds, or 205 microseconds, per row. Most of that is the **commit**: by default, PostgreSQL does not confirm a transaction until its WAL record (its entry in the database's journal, from the last lesson) is safely **[[on the disk|fsync]]**, and that wait is paid 20,000 times.

**Step 2: batch the commits.** One transaction around the same 20,000 statements: $4.109 / 0.439 \approx 9.4$ times faster. Same work, one disk wait.

**Step 3: batch the statements.** Fewer, bigger statements cut the per-statement parsing and round trips, and `COPY` — PostgreSQL's bulk-load command — streams rows with almost no per-row overhead: $4.109 / 0.068 \approx 60$ times faster than the first line.

**Sanity check against the fleet.** The fleet produces 60,000 samples a second per channel. One writer committing every row would manage about 4,900 a second — 12 times too slow. One `COPY` stream managed about 294,000 a second, so batching is not an optimization here; it is the only way the data fits.
:::

Real pipelines land in between, with **micro-batches**: collect rows for a short, fixed window — say one second, or 10,000 rows, whichever comes first — then write them in one transaction with `COPY` or a multi-row insert. Latency is bounded by the window, and throughput is close to a bulk load. Most "streaming" telemetry systems are micro-batching underneath.

::: key Batch versus streaming ingest
Batching trades latency for throughput: fixed costs such as commits and round trips are paid once per batch. Streaming gives low latency at a higher cost per row. Micro-batches — a short time or size window, whichever fills first — get most of both.
:::

## Kafka: a log in the middle

Between the ground stations and the database there is usually a buffer, so that a slow database or a restart downstream does not lose data upstream. At many companies that buffer is **Apache Kafka** — reported to be part of the Starlink telemetry stack, as lesson 13 discusses.

Kafka is best understood as a **[[log|kafka-log]]**: an append-only list of messages, like a ship's logbook. Messages are grouped into **topics** (say, `telemetry.eps`), and each topic is split into **partitions** so that many machines can share the load. Inside a partition, each message gets a number, its **offset**, and order is guaranteed only within a partition. A **consumer** — for example the process that writes to the database — reads a partition in order and records the offset it has reached. Kafka keeps messages for a configured time whether or not anyone has read them, so a consumer that crashes can resume from its last recorded offset, and a new consumer can **replay** last week's data from the start.

## Delivery guarantees

Every link in a pipeline can fail halfway through, and the question is what happens to the message that was in flight. There are three possible promises.

- **At-most-once.** Record "done" *before* processing. If the process crashes in between, the message is never processed: data can be **lost**, but never duplicated.
- **At-least-once.** Process first, record "done" *after*. If the process crashes in between, the message is processed again after restart: nothing is lost, but data can be **duplicated**. This is the usual default, because losing flight data is worse than seeing it twice.
- **Exactly-once.** Every message takes effect once. Kafka offers exactly-once processing *within* Kafka, using idempotent producers and transactions. Across the boundary into a database, it is achieved in practice by at-least-once delivery **plus** a write that does no harm when repeated.

That last idea is the bridge to the next lesson. A downlink retransmission, a Kafka replay and an at-least-once retry all produce the same thing: a sample the database has already stored arriving again. Lesson 12 makes that harmless with a natural key and an upsert, so that ingest is **idempotent** — doing it twice gives the same table as doing it once.

::: warning Exactly-once is a property of the whole pipeline
A tool's documentation saying "exactly-once" usually means exactly-once between its own parts. If your consumer writes rows to PostgreSQL and then crashes before recording its offset, the rows arrive twice anyway. Assume at-least-once at every boundary, and make the write idempotent.
:::

## Check yourself

::: check
A query asks for the mean of `value` for one channel over one month. The table has 12 columns of about 8 bytes each. Roughly what fraction of the bytes does a column store need to read, compared with a row store, before compression and before any row-group skipping?
:::

::: answer
The query needs `value` plus the columns in its filter, `channel` and `ts`: 3 of 12 columns. A row store reads whole rows, all 12 columns. So the column store reads about $3/12 = 1/4$ of the bytes. In practice the gap is wider: `channel` and `ts` compress to almost nothing, so nearly all the bytes read are the `value` column, and statistics let the reader skip row groups outside the month.
:::

::: check
A Parquet file of one day's telemetry was written sorted by `sat_id`, then `ts`. Row group statistics show `sat_id` ranges 1–600, 601–1200, and so on. Which is fast, "every satellite between 14:00 and 14:05" or "satellite 732 all day"? Why?
:::

::: answer
"Satellite 732 all day" is fast: only the row group whose `sat_id` range is 601–1200 can contain it, so the reader skips all the others. "Every satellite between 14:00 and 14:05" cannot skip anything by row group: each row group holds 600 satellites' whole day, so each one's `ts` range covers 00:00 to 23:59 and includes 14:00. (Page-level statistics may still skip pages inside each column chunk, but every row group must be opened.) The sort order decides which questions are cheap.
:::

::: check
Your ingest service inserts each decoded sample as its own transaction and keeps falling behind. List two changes that would raise throughput, and say what each costs.
:::

::: answer
First, commit in batches: wrap many inserts in one transaction, so the disk wait at commit is paid once per batch. The cost is latency (a sample is not visible until its batch commits) and a bigger redo after a crash (a failed batch must be resent in full). Second, write batches with `COPY` or multi-row `INSERT`, which removes per-statement overhead; the cost is buffering rows in memory for the batch window. A micro-batch of, say, one second or 10,000 rows, whichever comes first, gives both with a bounded delay.
:::

::: check
A consumer reads a message from Kafka, writes its rows to the database, and then records its offset. The machine loses power right after the database write. What happens after restart, and which delivery guarantee is this?
:::

::: answer
The offset was never recorded, so after restart the consumer resumes from the previous offset and reads the same message again. It writes the same rows a second time. Nothing was lost, but data was duplicated: this is at-least-once delivery. To make the result correct, the database write must be idempotent — a unique key on `(sat_id, ts, channel)` and an upsert, as in the next lesson.
:::

## Summary

| Idea | What to remember |
| --- | --- |
| Row store | each row's values together; fast point lookups, updates, single-row inserts |
| Column store | each column's values together; reads only needed columns; compresses well |
| Encodings | dictionary (few distinct values), run-length (repeats), delta (evenly spaced) |
| Measured | 5,184,000 rows: 354 MB table, 220 MB CSV, 18.9 MB Parquet; `value` is 95% of it |
| Parquet layout | row groups → column chunks → pages; footer with schema, offsets, min/max |
| Predicate pushdown | skip row groups whose min/max cannot match; depends on the sort order written |
| Batch versus stream | batching buys throughput with latency; micro-batches bound the delay |
| Kafka | append-only log; topics, partitions, offsets; replay from a stored offset |
| Delivery | at-most-once loses, at-least-once duplicates, exactly-once needs an idempotent write |

The next lesson makes ingest safe to repeat: a natural key on satellite, time and channel, `INSERT … ON CONFLICT DO UPDATE`, and the SQL that finds gaps, out-of-order packets, clock skew and duplicate frames.

::: context row-vs-column The same table, laid out two ways
Here are three rows of telemetry as a row store and as a column store would place them on disk, left to right. Same nine values, different neighbors. In the column layout, a query for the mean of `value` reads only the last block.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="10" y="16" font-size="12" fill="#1f2a44">Row store: each row together</text>
  <rect x="10" y="24" width="38" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="48" y="24" width="38" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="86" y="24" width="38" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="126" y="24" width="38" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="164" y="24" width="38" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="202" y="24" width="38" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="242" y="24" width="38" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="280" y="24" width="38" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="318" y="24" width="38" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <text x="29" y="41" font-size="11" fill="#1f2a44" text-anchor="middle">s1</text>
  <text x="67" y="41" font-size="11" fill="#1f2a44" text-anchor="middle">t1</text>
  <text x="105" y="41" font-size="11" fill="#1f2a44" text-anchor="middle">v1</text>
  <text x="145" y="41" font-size="11" fill="#1f2a44" text-anchor="middle">s2</text>
  <text x="183" y="41" font-size="11" fill="#1f2a44" text-anchor="middle">t2</text>
  <text x="221" y="41" font-size="11" fill="#1f2a44" text-anchor="middle">v2</text>
  <text x="261" y="41" font-size="11" fill="#1f2a44" text-anchor="middle">s3</text>
  <text x="299" y="41" font-size="11" fill="#1f2a44" text-anchor="middle">t3</text>
  <text x="337" y="41" font-size="11" fill="#1f2a44" text-anchor="middle">v3</text>
  <text x="10" y="86" font-size="12" fill="#1f2a44">Column store: each column together</text>
  <rect x="10" y="94" width="38" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="48" y="94" width="38" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="86" y="94" width="38" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="126" y="94" width="38" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="164" y="94" width="38" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="202" y="94" width="38" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="242" y="94" width="38" height="26" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
  <rect x="280" y="94" width="38" height="26" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
  <rect x="318" y="94" width="38" height="26" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
  <text x="29" y="111" font-size="11" fill="#1f2a44" text-anchor="middle">s1</text>
  <text x="67" y="111" font-size="11" fill="#1f2a44" text-anchor="middle">s2</text>
  <text x="105" y="111" font-size="11" fill="#1f2a44" text-anchor="middle">s3</text>
  <text x="145" y="111" font-size="11" fill="#1f2a44" text-anchor="middle">t1</text>
  <text x="183" y="111" font-size="11" fill="#1f2a44" text-anchor="middle">t2</text>
  <text x="221" y="111" font-size="11" fill="#1f2a44" text-anchor="middle">t3</text>
  <text x="261" y="111" font-size="11" fill="#1f2a44" text-anchor="middle">v1</text>
  <text x="299" y="111" font-size="11" fill="#1f2a44" text-anchor="middle">v2</text>
  <text x="337" y="111" font-size="11" fill="#1f2a44" text-anchor="middle">v3</text>
  <text x="299" y="140" font-size="11" fill="#b4232c" text-anchor="middle">mean(value) reads only this</text>
  <text x="10" y="162" font-size="11" fill="#6c7a93">s = sat_id, t = ts, v = value</text>
</svg>
```
:::

::: context zstd The squeezer on top
Zstandard, usually written zstd, is a general-purpose compression method released by Facebook in 2016. Like the ZIP files you may know, it finds repeated byte patterns and replaces them with short references. It is fast to decompress, which matters when a query engine unpacks gigabytes a second. Parquet lets you choose it, Snappy, gzip or none, per column. Encodings first, then zstd, is why our `sat_id` column shrank to 35,789 bytes for 5,184,000 values: the encoding turned it into a short repeating pattern, and zstd noticed the pattern repeating.
:::

::: context parquet-origin Where Parquet came from
Parquet was started in 2013 by engineers at Twitter and Cloudera, who based its design on Google's Dremel paper about scanning nested columnar data. It became a top-level Apache Software Foundation project in 2015. Its great strength is that it is an open, documented format that nobody owns: a file written by pyarrow on a laptop can be read by Spark on a cluster, by DuckDB, by ClickHouse, or by a cloud data warehouse, which is why flight-data archives increasingly land in it.

:::

::: context parquet-layout Row groups, column chunks and pages
The three levels exist for three different readers' needs. Row groups let a reader skip whole blocks of rows using statistics. Column chunks let it read only the columns it wants. Pages keep each unit small enough to decompress in memory, and a page index can record statistics per page for even finer skipping.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="10" y="16" font-size="12" fill="#1f2a44">A Parquet file</text>
  <rect x="10" y="24" width="250" height="60" fill="#ffffff" stroke="#1f2a44"/>
  <text x="18" y="40" font-size="11" fill="#1f2a44">row group 0 (rows 0-499,999)</text>
  <rect x="18" y="48" width="56" height="28" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="78" y="48" width="56" height="28" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="138" y="48" width="56" height="28" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="198" y="48" width="56" height="28" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="46" y="66" font-size="11" fill="#1f2a44" text-anchor="middle">sat_id</text>
  <text x="106" y="66" font-size="11" fill="#1f2a44" text-anchor="middle">ts</text>
  <text x="166" y="66" font-size="11" fill="#1f2a44" text-anchor="middle">channel</text>
  <text x="226" y="66" font-size="11" fill="#1f2a44" text-anchor="middle">value</text>
  <rect x="10" y="90" width="250" height="36" fill="#ffffff" stroke="#1f2a44"/>
  <text x="18" y="112" font-size="11" fill="#1f2a44">row groups 1 to 10, same shape</text>
  <rect x="10" y="132" width="250" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="18" y="151" font-size="11" fill="#1f2a44">footer: schema, offsets, min/max</text>
  <text x="270" y="60" font-size="11" fill="#1d6fd1">column chunk,</text>
  <text x="270" y="74" font-size="11" fill="#1d6fd1">made of pages</text>
  <line x1="268" y1="147" x2="258" y2="147" stroke="#1f2a44"/>
  <text x="270" y="151" font-size="11" fill="#1f2a44">read first</text>
  <text x="10" y="186" font-size="11" fill="#6c7a93">Our file: 11 row groups x 4 column chunks; footer 5,650 bytes</text>
</svg>
```

:::

::: context object-storage Cheap, huge and write-once
Object storage — Amazon S3, Google Cloud Storage, or the same software run in a company's own data center — stores whole files ("objects") under names, at a much lower cost per terabyte than database disks. You cannot change part of an object in place; you replace it. That is a perfect fit for closed days of telemetry written once as Parquet. Engines read it over the network, so the footer-first, skip-what-you-can design of Parquet matters even more: every byte not fetched is time saved.
:::

::: context fsync Why a commit waits for the disk
When PostgreSQL says a transaction is committed, it promises the change survives a power cut. To keep that promise it writes the change's record to the write-ahead log and asks the operating system to force it onto the disk — a call named `fsync` — and waits. That wait is typically tens of microseconds to milliseconds, depending on the drive. Paid once per row, it dominates; paid once per batch of 10,000 rows, it vanishes. Settings such as `synchronous_commit = off` trade a small window of possible loss for speed, a choice to make deliberately, not by accident.
:::

::: context kafka-log A log with readers at different places
One partition of a topic is a numbered list that only grows at the end. Each consumer keeps its own bookmark, its offset. A slow consumer falls behind without slowing anyone else, and a new one can start from offset 0 and replay everything Kafka still keeps.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="10" y="16" font-size="12" fill="#1f2a44">topic telemetry.eps, partition 0</text>
  <rect x="10" y="30" width="40" height="30" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="50" y="30" width="40" height="30" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="90" y="30" width="40" height="30" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="130" y="30" width="40" height="30" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="170" y="30" width="40" height="30" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="210" y="30" width="40" height="30" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="250" y="30" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="30" y="50" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="70" y="50" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="110" y="50" font-size="11" fill="#1f2a44" text-anchor="middle">2</text>
  <text x="150" y="50" font-size="11" fill="#1f2a44" text-anchor="middle">3</text>
  <text x="190" y="50" font-size="11" fill="#1f2a44" text-anchor="middle">4</text>
  <text x="230" y="50" font-size="11" fill="#1f2a44" text-anchor="middle">5</text>
  <text x="270" y="50" font-size="11" fill="#1f2a44" text-anchor="middle">6</text>
  <text x="300" y="50" font-size="11" fill="#1d6fd1">new</text>
  <line x1="110" y1="92" x2="110" y2="64" stroke="#b4232c" stroke-width="2"/>
  <text x="110" y="106" font-size="11" fill="#b4232c" text-anchor="middle">db writer at 2</text>
  <line x1="230" y1="92" x2="230" y2="64" stroke="#1d6fd1" stroke-width="2"/>
  <text x="230" y="106" font-size="11" fill="#1d6fd1" text-anchor="middle">alerts at 5</text>
  <text x="10" y="132" font-size="11" fill="#6c7a93">messages are appended at the right and never edited</text>
</svg>
```
:::
