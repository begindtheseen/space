---
id: l01-the-honest-calibration
title: The honest calibration
minutes: 18
covers:
  - 'The honest calibration: medium level, not the main event, with real-world framing preferred'
  - Preparing in C++ if targeting flight software; Python for the take-home
  - Roughly 120 to 150 problems is sufficient, grouped by pattern and timed
---

Think about getting ready for a driving test. You could spend a year learning to drift a race car around a track. It would be impressive, and it would not help much. The examiner wants to see you check your mirrors, merge safely, park, and explain what you are doing. The smart way to prepare is to find out what the test really asks, practice exactly that until it is smooth, and stop there.

Coding interviews are the same. There is a huge world of puzzle problems out there, and some people grind through five hundred of them. This module starts by asking the driving-test question: what does the coding part of a SpaceX-style interview really ask, how hard is it, and how many hours should you put in? Getting that answer right is worth more than any single trick, because it decides where your next forty hours go.

This lesson sets the bar honestly, picks your language, and turns "practice a lot" into a plan with numbers in it.

## What "medium" means

Practice websites label their problems **easy**, **medium** or **hard**. These are rough labels, not laws, but they are useful:

- An **easy** problem needs one loop and a clear head. Reverse a list. Count the vowels.
- A **medium** problem needs you to spot one known **[[pattern|what-is-a-pattern]]** — a standard trick that a whole family of problems share — and then write 15 to 40 careful lines. Find the longest stretch of a string with no repeated letter. Merge overlapping time intervals.
- A **hard** problem often needs two patterns combined, or a clever idea you would be unlikely to invent in 40 minutes unless you had seen it before.

The bar for the SpaceX coding rounds is **[[reported|what-reported-means]]** — meaning that is what many candidates' accounts say, not an official rulebook — as medium level. The problems lean toward real-world situations rather than exotic puzzles. You may be asked to reason from things you have built yourself.

::: key The reported bar
Reported as medium-level, with explicit emphasis on real-world problem solving and drawing on your own experience rather than exotic algorithms. Around 120 to 150 pattern-grouped problems is sufficient; 500 is not a better use of the hours.
:::

"Medium" does not mean "easy". The goal this module sets is to solve a medium problem in **25 minutes while explaining your reasoning aloud**. That is harder than solving it silently in an hour. Most of this module is about making that 25 minutes feel calm.

::: warning Two opposite mistakes
The first mistake is preparing for the wrong test: weeks on hard competitive-programming problems, fancy data structures, and puzzles nobody asks. The second is the reverse: deciding "medium" means you can wing it. Both fail in the room. The fix is the same for both — practice mediums, timed, out loud, until the common patterns are automatic.
:::

## Not the main event

The coding round matters, but it is **[[one gate among several|one-gate]]**. A typical process also includes a practical take-home problem, deeper technical rounds, a presentation, and behavioral questions about how you work. The next module covers those in detail.

So the coding round is not where you win the offer. It is where you avoid losing it. Passing it cleanly, with good communication, gets you to the rounds where your real engineering shows.

### Real-world framing

"Real-world framing" means the problem arrives dressed as engineering rather than as a riddle. Instead of "find two numbers in an array", you might hear something like:

- Here is a spec for a binary telemetry packet. Pull the fields out of a stream of bytes, and skip damaged frames.
- A sensor's data has gaps. Find the gaps and report statistics on what is left.
- Two sensors report at different rates. Line up their samples in time.
- Build a fixed-size buffer that keeps the most recent readings.
- Write a controller that does not misbehave when the motor it drives is maxed out.
- Keep the median of a stream of numbers up to date as each one arrives.

These are called the **[[engineering variants|engineering-variants]]**, and lessons 9 to 12 of this module teach all six. Under the costume, each one is built from the same patterns as the puzzle problems. A ring buffer is array indexing with wrap-around. Lining up two time series is two pointers. A running median is two heaps. That is the real reason to learn the patterns: they are the parts the engineering problems are built from.

## Choosing your language

You will do most practice in one language, so pick it on purpose.

**[[Flight software|flight-software]]** is the code that runs on the vehicle itself — the computers that fly the rocket, point the spacecraft and talk to the ground. It is mostly written in C++ (and C) because it must run fast, predictably, and within fixed memory. If that is the job you want, prepare in C++. The interviewer will not only check your algorithm. They will also poke at the language underneath it: pointers, memory ownership, what happens when two threads touch the same data.

The **[[take-home|the-take-home]]** is different. It is a practical problem you solve on your own time, often something like parsing a data file or a binary protocol and reporting results. Python is fine there, and usually preferred, because it is quick to write and has the right tools built in — for example the `struct` module for reading packed binary fields, which lesson 9 teaches.

::: key Which language to prepare in
C++ if you are targeting flight software, because the round will also probe pointers, memory and concurrency. Python is fine, and usually preferred, for the take-home data or protocol problem.
:::

In practice that means one **primary** language for the live problems and a second one for data work. The prerequisites of this module gave you both: the **[[STL|the-stl]]** containers in C++, and NumPy-flavored Python. This module shows its code in Python, because it is short to read, and in C++ where the C++ details are the point. The exercises use both.

::: warning Do not switch languages in the room
Pick your live-coding language weeks ahead and do every timed problem in it. Changing language halfway through a prep campaign, or on interview day, costs you the small things that save minutes: remembering that `std::deque` has `pop_front` but Python's `deque` calls it `popleft`, or that `v.size() - 1` wraps around to a huge number when `v` is empty in C++. Those details only become automatic through repetition in one language.
:::

## How many problems, and how to do them

Around **120 to 150 problems** is enough, *if* two conditions hold.

**Grouped by pattern.** Do problems in families. Ten two-pointer problems in a row teach you what two-pointer problems *look like*, which is the skill you need in the room: this module's objective is to recognize which pattern a new problem belongs to within two minutes. Random problems in random order teach much less, because each one feels like a brand-new puzzle.

**Timed.** Set a 25-minute timer and talk out loud as if an interviewer were listening. A problem solved in 70 silent minutes has taught you the solution. It has not taught you to produce a solution under the conditions of the test.

A free list that does exactly this grouping is **[[NeetCode 150|neetcode]]**. Its problems are arranged by pattern, and the free list is enough. Here are the patterns that cover most medium problems:

::: key The high-yield patterns
Two pointers, sliding window, hash map counting, binary search (including on the answer), sorting plus intervals, stack/queue, tree and graph traversal, heap, prefix sums, and light dynamic programming.
:::

Lessons 3 to 7 teach each one. Just as important is what to leave out. Exotic dynamic programming, advanced graph theory and segment trees are real subjects, but they are not what a medium, real-world-flavored bar tests. Lesson 7 comes back to that list.

### A routine for one problem

1. **Start the timer.** Read the problem and say it back in your own words.
2. **Name the pattern** you think it is, the approach, and how fast it runs. Lesson 2 teaches how to say that last part.
3. **Code it** while talking.
4. **Test it** yourself, with the empty input and a one-element input first.
5. **At 25 minutes, stop**, solved or not. If you did not solve it, study a good solution until you could explain it, then write it once from memory.
6. **Log it**: the date, the pattern, the time you took, and one line on what tripped you.
7. **Redo** anything you failed, from a blank page, a few days later. That delay is **[[spaced repetition|spaced-repetition]]**: practicing just as you are about to forget is what makes it stick.

::: example Why not 500 problems?
Say one timed problem costs 25 minutes of solving plus 10 minutes of review and logging, so $35$ minutes in all.

**At 135 problems** (the middle of the range): $135 \times 35 = 4725$ minutes, and $4725 \div 60 \approx 79$ hours.

**At 500 problems:** $500 \times 35 = 17\,500$ minutes, and $17\,500 \div 60 \approx 292$ hours.

The difference is about $292 - 79 = 213$ hours. At 8 hours a week that is roughly $213 \div 8 \approx 27$ extra weeks — half a year. Those hours are better spent on the take-home skills, on C++ memory questions, and on the domain and behavioral rounds. Past about 150 problems grouped by pattern, each new one mostly repeats a pattern you already have.

Sanity check: 79 hours for 135 problems is a bit over half an hour each, which matches the 35 minutes we assumed.
:::

## A weekly plan with the hours in it

This module is budgeted at **40 hours**. Where do they go? Here is the arithmetic, done in Python so you can change the assumptions and rerun it:

```python
# int01_l01_hours.py -- how far do 40 hours go?
module_hours = 40
lesson_hours = 12 * 25 / 60      # twelve lessons, about 25 minutes each
exercise_hours = 3 + 2 + 2       # the module's three coding exercises
problem_hours = module_hours - lesson_hours - exercise_hours
minutes_per_problem = 25 + 10    # 25 timed, 10 to review and log
problems = problem_hours * 60 / minutes_per_problem
print(f"lessons {lesson_hours:.0f} h, exercises {exercise_hours} h, problems {problem_hours:.0f} h")
print(f"timed problems inside the module: about {problems:.0f}")
for target in (120, 150):
    print(f"{target} problems need about {target * minutes_per_problem / 60:.0f} h")
```

```bash
python3 int01_l01_hours.py
# lessons 5 h, exercises 7 h, problems 28 h
# timed problems inside the module: about 48
# 120 problems need about 70 h
# 150 problems need about 88 h
```

That output is the honest part. The module's 40 hours pay for the teaching, the three exercises and about 48 timed problems — roughly a third of the full set. The whole set of 120 to 150 needs about 70 to 88 hours of problem time on its own. So the problem set runs *alongside* the rest of your preparation, not only inside this module.

::: example Five weeks at 8 hours a week
Forty hours at 8 hours a week is $40 \div 8 = 5$ weeks. Give 1 hour a week to reading lessons. Spread the three exercises over weeks 3 to 5, each one after the lesson it needs. Spend the rest on timed problems at 35 minutes each, rounding down to whole problems.

| Week | Lessons | Exercise | Problem time | Timed problems |
| --- | --- | --- | --- | --- |
| 1 | 1 to 3 | none | 7 h | 12 two pointers and sliding window |
| 2 | 4 to 5 | none | 7 h | 12 hash maps, binary search, intervals |
| 3 | 6 to 7 | sliding-window max, 2 h | 5 h | 8 trees, graphs, heaps |
| 4 | 8 to 10 | decommutator, 3 h | 4 h | 6 mixed review |
| 5 | 11 to 12 | ring buffer, 2 h | 5 h | 8 mixed review |

**Check the problem counts.** 7 hours is $420$ minutes, and $420 \div 35 = 12$. 5 hours is $300 \div 35 \approx 8.6$, so 8. 4 hours is $240 \div 35 \approx 6.9$, so 6. Total: $12 + 12 + 8 + 6 + 8 = 46$ problems — a little under the 48 from the script, because we rounded down each week.

**Check the hours.** Lessons $5 \times 1 = 5$, exercises $2 + 3 + 2 = 7$, problems $7 + 7 + 5 + 4 + 5 = 28$. And $5 + 7 + 28 = 40$. It adds up.

**The rest of the set.** To reach 135 problems you need about $135 - 46 = 89$ more. At 35 minutes each that is $89 \times 35 = 3115$ minutes, about 52 hours, or roughly 6 to 7 more weeks at 8 hours a week, done alongside the next modules.
:::

::: warning Counting problems instead of patterns
A log that says "63 problems done" can hide the fact that 40 of them were arrays and none were graphs. Check your log by pattern every week. The goal is roughly even coverage of the high-yield list, with extra reps on whichever pattern still makes you freeze.
:::

## Check yourself

::: check
A friend says: "The coding bar is medium, so I'll skip practice and focus on the onsite." Another says: "I'm doing 400 hard problems to be safe." What would you tell each of them?
:::

::: answer
To the first: medium is not trivial. The target is solving a medium problem in about 25 minutes *while explaining your reasoning aloud*, and that only becomes smooth with timed practice. Failing the coding gate means never reaching the onsite.

To the second: the bar is reported as medium with real-world framing, not competitive programming. At about 35 minutes per problem, 400 problems is about $400 \times 35 \div 60 \approx 233$ hours, much of it on material that is not tested. Around 120 to 150 pattern-grouped, timed problems is enough, and the spare hours are better spent on the take-home, C++ depth and the other rounds.
:::

::: check
You want to work on the flight computer's guidance code. Which language should you prepare the live coding in, and why? What else might the interviewer probe beyond the algorithm?
:::

::: answer
C++. Flight software is mostly written in C++ (and C) because it must be fast, predictable and live within fixed memory. The round will also probe the language underneath the algorithm: pointers, memory ownership, and concurrency — what happens when two threads share data. Python is still worth keeping sharp for a take-home data or protocol problem, where it is usually preferred.
:::

::: check
Why does grouping problems by pattern teach more than doing the same number in random order?
:::

::: answer
In the interview the first hard step is recognizing *which* pattern a new problem is. Doing a family of similar problems in a row shows you the family resemblance — the clues in the wording, the shape of the input — so you learn to spot it within a couple of minutes. In random order every problem feels new, and you practice solving but not recognizing.
:::

::: check
You can give 6 hours a week to problems at 35 minutes each. How many problems a week is that, rounding down? How many weeks to reach 120?
:::

::: answer
6 hours is $360$ minutes, and $360 \div 35 \approx 10.3$, so 10 problems a week. Reaching 120 takes $120 \div 10 = 12$ weeks. (Check: $120 \times 35 = 4200$ minutes $= 70$ hours, and $70 \div 6 \approx 11.7$ weeks of time, which rounds up to the same 12.)
:::

::: check
Name three of the engineering variants and say which ordinary pattern hides inside each.
:::

::: answer
Any three of these: a ring buffer is array indexing with wrap-around (modular arithmetic); lining up two time series at different rates is two pointers walking two sorted lists; a running median over a stream is two heaps; finding dropouts in telemetry is a single pass comparing each timestamp with the one before; decommutating a binary packet stream is a scan with a pointer that resynchronizes after bad frames. The PID with anti-windup is a small state machine rather than a textbook pattern.
:::

## Summary

| Idea | In one line |
| --- | --- |
| The reported bar | medium level, real-world framing, your own experience; not exotic algorithms |
| Medium | one known pattern plus 15 to 40 careful lines |
| The target | a medium in 25 minutes, reasoning out loud |
| Not the main event | coding is one gate; take-home, technical, presentation and behavioral rounds follow |
| Language | C++ for flight software (also probes pointers, memory, concurrency); Python for the take-home |
| How many | about 120 to 150 problems, grouped by pattern, timed; NeetCode 150 is a free list |
| Cost of one problem | about 35 minutes: 25 timed plus 10 to review and log |
| The 40 hours | about 5 h lessons, 7 h exercises, 28 h problems, which is about 48 problems |

Next lesson: every time you name an approach you should also say how fast it runs and how much memory it needs. Lesson 2 teaches you to work that out and say it out loud.

::: context what-is-a-pattern A pattern is a reusable move
In chess, players do not calculate every game from scratch. They know openings and standard tactics, like a fork, and they spot them on the board. Algorithm patterns work the same way. "Two pointers" is a move: walk one index from each end of a sorted list toward the middle. Once you know it, dozens of problems that look different on the surface turn out to be that same move. Interviewers are not testing whether you invent the move on the spot. They are testing whether you recognize it, apply it cleanly and explain it.
:::

::: context what-reported-means Why the lesson keeps saying "reported"
Companies do not publish the difficulty of their interview questions. What we know comes from many candidates' own accounts, gathered on interview-review sites and forums, and those accounts broadly agree on medium-level problems with a practical flavor. That is good evidence, but it is not a rulebook: a particular team or interviewer can differ. "Reported" is the honest word for that kind of knowledge, and it is the right habit for an engineer too — say where a number came from and how sure you are of it.
:::

::: context one-gate A process with several gates
Think of a hiring process as a row of gates. Each one can end your run; none of them alone gets you the job. The coding screen is an early gate. Later ones test engineering depth, how you present and defend your own work, and how you behave on a team. Because the gates are in series, a weak early gate stops everything after it, which is why this module still deserves its 40 hours even though coding is not the main event.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="30" width="72" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="44" y="52" font-size="11" fill="#1f2a44" text-anchor="middle">screen</text>
  <rect x="98" y="30" width="72" height="36" rx="6" fill="#fff" stroke="#1f2a44"/>
  <text x="134" y="52" font-size="11" fill="#1f2a44" text-anchor="middle">take-home</text>
  <rect x="188" y="30" width="72" height="36" rx="6" fill="#fff" stroke="#1f2a44"/>
  <text x="224" y="52" font-size="11" fill="#1f2a44" text-anchor="middle">technical</text>
  <rect x="278" y="30" width="74" height="36" rx="6" fill="#fff" stroke="#1f2a44"/>
  <text x="315" y="52" font-size="11" fill="#1f2a44" text-anchor="middle">onsite</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="80" y1="48" x2="96" y2="48"/><line x1="170" y1="48" x2="186" y2="48"/><line x1="260" y1="48" x2="276" y2="48"/>
  </g>
  <text x="44" y="86" font-size="11" fill="#1d6fd1" text-anchor="middle">coding lives here</text>
  <text x="250" y="86" font-size="11" fill="#6c7a93" text-anchor="middle">behavioral questions run throughout</text>
</svg>
```
:::

::: context engineering-variants Where the six variants are taught
The engineering variants are the problems this module most wants you to be able to write from memory, because they are what the job is actually like. Lesson 9 covers bytes, endianness and checksums; lesson 10 uses them to decommutate a packet stream and detect dropouts; lesson 11 builds the ring buffer and lines up two time series; lesson 12 writes the PID with anti-windup and the running median. Two of the module's exercises are variants: the decommutator and the ring buffer.
:::

::: context flight-software Why flight code is C++ and C
Code on a rocket has jobs a phone app does not. It must finish each control step in a fixed time, every time, often many times a second. It usually cannot ask for new memory while flying, because running out would be fatal. And it talks directly to hardware. C and C++ give the programmer that level of control over timing and memory, which is why they dominate flight computers across the industry. Python is used heavily too, but on the ground: for analysis, test automation and simulation tooling.
:::

::: context the-take-home What a take-home looks like
A take-home is a problem you are sent to solve on your own computer, usually over a few hours or with a time limit, and then send back. In this field it is often practical: read a file of sensor data and compute statistics, or parse a stream of bytes that follows a made-up protocol. Because it is judged on correctness, clarity and testing rather than on speed of typing, clean Python with a few tests is a strong answer. The next module describes where it sits in the process.
:::

::: context the-stl The STL
The STL is the Standard Template Library: the ready-made containers and algorithms that ship with every C++ compiler. The ones interview problems lean on are `std::vector` (a growable array), `std::deque` (a double-ended queue), `std::unordered_map` and `std::unordered_set` (hash tables), `std::priority_queue` (a heap), and `std::sort`. The prerequisite module on the STL covered them. In the interview, reaching for the right one quickly is part of looking fluent.
:::

::: context neetcode Why a free list is enough
NeetCode 150 is a free, public list of 150 practice problems arranged by pattern, with a video explanation for each. The module lists it as the recommended problem set because its grouping matches the high-yield patterns almost one for one. Paying for a bigger bank does not help much: the bar is medium, and past about 150 pattern-grouped problems, new problems mostly repeat patterns you already have. What matters is doing them timed and out loud.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">Hours of problem time at 35 min each</text>
  <line x1="80" y1="28" x2="80" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="72" y="48" font-size="11" fill="#1f2a44" text-anchor="end">120</text>
  <rect x="80" y="36" width="64" height="18" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="150" y="49" font-size="11" fill="#1f2a44">70 h</text>
  <text x="72" y="78" font-size="11" fill="#1f2a44" text-anchor="end">150</text>
  <rect x="80" y="66" width="81" height="18" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="167" y="79" font-size="11" fill="#1f2a44">88 h</text>
  <text x="72" y="108" font-size="11" fill="#1f2a44" text-anchor="end">500</text>
  <rect x="80" y="96" width="269" height="18" fill="#f2b880" stroke="#1f2a44"/>
  <text x="215" y="109" font-size="11" fill="#1f2a44" text-anchor="middle">292 h</text>
  <text x="80" y="145" font-size="11" fill="#6c7a93">problems (left) and hours (bar length to scale)</text>
</svg>
```
:::

::: context spaced-repetition Practice just before you forget
Memory fades in a curve: fast at first, then slower. If you review something right after learning it, it is still fresh and the review does little. If you wait months, you have to relearn it from scratch. The sweet spot is in between — a few days later, when it is just starting to slip. Each review at that point makes the next forgetting slower. That is why the routine says to redo a failed problem from a blank page a few days later, and why this app also shows you flashcards on a schedule.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="350" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="20" x2="30" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">days</text>
  <text x="14" y="70" font-size="11" fill="#1f2a44" transform="rotate(-90 14 70)" text-anchor="middle">recall</text>
  <path d="M30,25 Q60,95 90,100" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M90,25 Q140,80 190,88" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M190,25 Q270,60 350,70" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="90" y1="25" x2="90" y2="100" stroke="#6c7a93" stroke-dasharray="3,3"/>
  <line x1="190" y1="25" x2="190" y2="88" stroke="#6c7a93" stroke-dasharray="3,3"/>
  <text x="90" y="16" font-size="11" fill="#1f2a44" text-anchor="middle">review</text>
  <text x="190" y="16" font-size="11" fill="#1f2a44" text-anchor="middle">review</text>
</svg>
```

Each review resets recall to the top, and the curve after it falls more slowly.
:::
