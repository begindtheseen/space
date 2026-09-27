---
id: l08-talking-and-testing
title: Talking while solving, and testing before you are done
minutes: 21
covers:
  - 'Talking while solving: restate, clarify, state the approach and its complexity, then code'
  - Testing your own solution before saying you are done
---

Think about a driving test again. Two people drive the same route perfectly. The first says nothing. The second says, "Checking my mirror. Slowing down, there is a school zone. Waiting — that cyclist might turn." The examiner can only grade what they can see, and they saw far more of the second driver's thinking. If both made the same small slip, the second driver would still likely pass, because the examiner watched them catch it.

A coding round works the same way. The interviewer is not only collecting your final code. They are watching how you get there: whether you understood the problem, whether you picked a sensible approach on purpose, whether you know how fast it runs, and whether you check your own work. If you work in silence, they see none of that. If you type straight away, they see you guessing.

Lessons 2 to 7 gave you the patterns. This lesson is about the wrapper around them: the few minutes of talking before you type, the running commentary while you type, and the testing you do before you say "done". It ends with a full mock interview, start to finish.

## Why the talking counts

An interview round is short, usually under an hour with a medium problem in the middle. In that time the interviewer has to write down evidence about how you think. What you say out loud *is* that evidence.

Three things follow from that.

- **Silence loses points you earned.** If you considered and rejected a slow approach in your head, say so. It shows judgment, and nobody knows unless you speak.
- **Talking catches mistakes early.** Explaining a plan out loud makes gaps in it obvious, to you as much as to them. This is the idea behind **[[rubber-duck debugging|rubber-duck]]**.
- **Talking lets the interviewer help.** If you are heading into a dead end, an interviewer who can hear you can steer you with a small hint. An interviewer watching you type silently cannot.

Talking is not the same as chattering. The goal is a clear narration of decisions: what you are about to do, and why.

## Before you type: four moves

Here is the sequence to run through at the start of every problem. It usually takes two to four minutes, and it is time well spent.

**1. Restate the problem.** Say it back in your own words, including what goes in and what comes out. "So I get a list of integers and a window size $k$, and I return one number: the biggest total of any $k$ neighbors in a row." If you misunderstood, this is where it surfaces, before you have written anything.

**2. State your assumptions about the input.** Every problem statement leaves things out, often on purpose. Ask, or say what you will assume:

- How big can the input be? Ten items or ten million? That decides whether a slow approach is acceptable.
- Is it sorted? Can there be duplicates? Negative numbers? Zeros?
- Can it be empty? What should I return then: zero, `None`, or an error?
- What exactly should I return: a value, an index, a list? In what order?
- May I change the input in place, or must I leave it alone?

**3. Name the approach and its cost.** Say which pattern you will use and why, then give the time and space complexity, the way lesson 2 taught: "I'll slide a window and keep a running sum. That's $O(n)$ time and $O(1)$ extra space." If you see a slow, obvious approach first, it is fine to say it and its cost, then improve on it: "Brute force would re-add every window, which is $O(nk)$. Sliding the sum avoids that."

**4. Name the edge cases you will handle.** "I'll handle an empty list, $k$ bigger than the list, and all-negative values." Saying them now means you will remember to test them later, and it shows the interviewer you think about the awkward inputs before they bite.

Then, and only then, start writing code.

::: key What to say before writing any code
Restate the problem, state the input assumptions you are making, name the approach and its time and space complexity, and mention the edge cases you intend to handle. That sequence is most of what is being assessed.
:::

::: warning Asking a question and then waiting
Clarifying does not mean handing the problem back. "Can the list be empty?" followed by silence stalls the round. Better: "Can the list be empty? If so, I'll raise a ValueError, unless you'd rather I return zero." You have asked, proposed an answer, and kept moving. Most interviewers will say "that's fine" and you have lost ten seconds, not two minutes.
:::

## While you type

Once you are coding, keep a light running commentary. You do not need to read every character aloud. Narrate the decisions:

- "This loop builds the first window."
- "Now I slide: add the new sample, drop the one that fell out."
- "I'm starting `best` at the first window's sum, not at zero, because the values can be negative."

Two habits help a great deal.

**Name things well.** `best` and `window_sum` are easier to talk about than `a` and `t`. Good names also make your own bugs easier to see.

**When stuck, think out loud anyway.** Say what you are trying and what is not working: "I need the oldest sample in the window — that's at index `i - k`." Getting stuck is normal. Going silent while stuck is what costs you. If the interviewer offers a **[[hint|taking-hints]]**, take it gracefully and say how it changes your plan.

## Testing your own solution

Here is the moment many candidates lose points they had nearly won. The code is written. It looks right. They say "done". The interviewer then asks, "What happens with an empty list?" — and the code crashes, or returns a wrong answer without complaint.

The fix is to test before you say done, without being asked. There are three levels, and in an interview you should do at least the first two.

### Level 1: walk an example by hand

Pick a small, ordinary input — one where you know the right answer — and run your code in your head, line by line, writing down the value of every variable after every step. This is a **[[trace table|desk-check]]**. It is slow, and it is the single best way to find a bug in code you cannot run.

Here is the sliding-window function from the transcript later in this lesson:

```python
# int01_l08_window.py (part 1)
import random

def max_window_sum(x, k):
    """Largest sum of k consecutive samples. O(n) time, O(1) extra space."""
    n = len(x)
    if k < 1 or k > n:
        raise ValueError("need 1 <= k <= len(x)")
    s = sum(x[:k])              # the first window
    best = s
    for i in range(k, n):
        s += x[i] - x[i - k]    # slide: add the newest sample, drop the oldest
        best = max(best, s)
    return best
```

::: example Tracing a window by hand
Trace `max_window_sum([3, -1, 4, 1, -5], 2)`. The windows of 2 neighbors are $3 + (-1) = 2$, $-1 + 4 = 3$, $4 + 1 = 5$ and $1 + (-5) = -4$, so the right answer is 5.

**Setup.** $n = 5$ and $k = 2$, so the guard passes. The first window is `x[:2]` $= [3, -1]$, so $s = 2$ and best $= 2$.

**Slide.** The loop runs for $i = 2, 3, 4$:

| i | add x[i] | drop x[i-k] | s | best |
| --- | --- | --- | --- | --- |
| start | none | none | 2 | 2 |
| 2 | 4 | 3 | 2 + 4 - 3 = 3 | 3 |
| 3 | 1 | -1 | 3 + 1 - (-1) = 5 | 5 |
| 4 | -5 | 4 | 5 + (-5) - 4 = -4 | 5 |

The function returns 5, which matches.

Sanity check: the loop ran 3 times, and together with the first window that is 4 windows. A list of $n$ items has $n - k + 1 = 5 - 2 + 1 = 4$ windows of size $k$, so no window was missed and none was counted twice — the classic **[[fencepost|fencepost]]** mistake would show up right here as 3 or 5 windows.
:::

### Level 2: the edge cases, out loud

An ordinary example checks the main path. Bugs live on the edges. There is a short list of edge cases that are worth raising *every time*, before the interviewer does:

::: key Edge cases to test unprompted
Empty input, single element, all elements equal, the window or k equal to the input size, negative values, and an input that triggers the overwrite or wrap-around branch. Raising them yourself is worth more than the code.
:::

Take them one at a time and say what the code does:

- **Empty input.** Many functions quietly return 0 or crash with an index error. Decide what is right and make the code do it on purpose.
- **Single element.** Loops that compare an item with "the one before it" often break here.
- **All elements equal.** This catches comparisons that should be `<=` but are `<`, and sorting or deduplication that assumes something differs.
- **The window, or $k$, equal to the whole input.** The loop may run zero times after setup. Does the answer still come out?
- **Negative values.** Anything that starts a running "best" at zero is suspect, as the next example shows.
- **The wrap-around branch.** Code with a fixed-size buffer has a moment where the index wraps from the end back to the start, or the oldest item gets overwritten. Force that branch with a test: it is where off-by-one bugs hide. Lesson 11's **[[ring buffer|wrap-branch]]** is the textbook case.

### Level 3: assert-based tests

When you can run code — in a take-home, or in an interview with a live editor — turn the edge cases into `assert` lines. An **[[assert|assert-off]]** is a line that says "this must be true"; if it is false, Python stops with an `AssertionError` and your message. A handful of them take two minutes to write and they run in an instant.

::: example A first draft that the tests catch
Here is a first draft that passes a quick look. It starts `best` at 0 and grows the window one sample at a time:

```python
# int01_l08_window.py (part 2)
def max_window_sum_v1(x, k):
    """First draft: looks right, has a bug."""
    best = 0
    s = 0
    for i, v in enumerate(x):
        s += v
        if i >= k:
            s -= x[i - k]
        if i >= k - 1:
            best = max(best, s)
    return best
```

Now the tests, one per edge case, with a message on each:

```python
# int01_l08_window.py (part 3)
def check(f):
    assert f([3, -1, 4, 1, -5], 2) == 5, "the example traced by hand"
    assert f([7], 1) == 7, "single element"
    assert f([2, 2, 2, 2], 3) == 6, "all equal"
    assert f([1, 2, 3], 3) == 6, "k equals n"
    assert f([-3, -2, -4], 2) == -5, "all negative"
    try:
        f([], 1)
    except ValueError:
        pass
    else:
        raise AssertionError("empty input must raise")

try:
    check(max_window_sum_v1)
except AssertionError as e:
    print("draft fails:", e)

check(max_window_sum)
print("fixed version passes the named tests")
```

```bash
python3 int01_l08_window.py
# draft fails: all negative
# fixed version passes the named tests
```

Why does the draft fail? With $[-3, -2, -4]$ and $k = 2$, the windows sum to $-5$ and $-6$. The best is $-5$. But the draft started `best` at 0, and no window ever beats 0, so it returns 0 — a total that no window has. On the worked example every window that mattered was positive, so the bug hid. Only the negative-values test exposed it. The empty-input test would catch the draft too: it returns 0 for an empty list instead of raising.

The fix is the version traced above: start `best` at the first real window's sum, and reject bad $k$ up front.

Sanity check on the numbers: $-3 + -2 = -5$ and $-2 + -4 = -6$, and $-5 > -6$, so $-5$ is right.
:::

### A bonus: compare against brute force

For a take-home, there is one more strong move. Write the slow, obviously-correct version too, then check your fast version against it on many random small inputs. This is a **[[brute-force oracle|oracle]]**:

```python
# int01_l08_window.py (part 4)
def brute(x, k):
    return max(sum(x[i:i + k]) for i in range(len(x) - k + 1))

random.seed(1)
for _ in range(1000):
    n = random.randint(1, 8)
    k = random.randint(1, n)
    x = [random.randint(-5, 5) for _ in range(n)]
    assert max_window_sum(x, k) == brute(x, k), (x, k)
print("1000 random cases agree with brute force")
```

```bash
# 1000 random cases agree with brute force
```

Small random inputs with values from $-5$ to $5$ hit negatives, zeros, repeats and $k = n$ over and over, so they explore the edges for you. If a case ever disagrees, the assert prints the exact input that broke it.

::: warning Saying "done" too early
"I think that works" with no test is the weakest possible ending. Even with two minutes left, say: "Let me trace one example and check the edges." Then do it out loud. If you find a bug, that is good news, not bad: finding and fixing your own bug in front of the interviewer is strong evidence that you would do the same at work.
:::

## A mock interview, start to finish

Here is a whole short round, written as a transcript. Read it once for the content, then again watching for the four moves and the three levels of testing.

**Interviewer:** We log a component's temperature once a second. Given the list of readings and a limit, I want the longest stretch of consecutive seconds where the temperature was over the limit.

**Candidate:** Let me say it back. I get a list of numbers, the readings in time order, and one number, the limit. I return a single integer: the length of the longest run of consecutive readings above the limit. Is that right?

**Interviewer:** Yes.

**Candidate:** A few assumptions. "Over the limit" means strictly greater, so a reading equal to the limit breaks the run — is that what you want? If the list is empty, or no reading is over, I'll return 0. And I'll assume the readings are ordinary numbers, possibly negative, with no missing values.

**Interviewer:** Strictly greater is right. The rest is fine.

**Candidate:** Approach: one pass with two counters. `run` is the length of the current stretch above the limit; `best` is the longest seen. Each reading either extends the run or resets it to zero. That's $O(n)$ time and $O(1)$ extra space. I don't think I can beat $O(n)$, since I have to look at every reading at least once. Edge cases I'll check: empty, a single reading, a reading exactly at the limit, all readings equal, negative values, and a run that lasts until the very end of the list — that last one catches code that only updates `best` when a run ends.

**Interviewer:** Go ahead.

**Candidate:** I'm updating `best` inside the "above" branch, every step, so a run that reaches the end is counted without any special case after the loop.

```python
# int01_l08_mock.py -- longest run of readings above a limit
def longest_run_above(readings, limit):
    """Length of the longest stretch of consecutive readings > limit.
    O(n) time, O(1) extra space."""
    best = 0
    run = 0
    for r in readings:
        if r > limit:
            run += 1
            best = max(best, run)
        else:
            run = 0
    return best
```

**Candidate:** Let me trace an example before I call it done. Readings 61, 72, 75, 70, 74, 76, 79, 68 with limit 70. 61 is not over: run 0, best 0. 72: run 1, best 1. 75: run 2, best 2. 70 equals the limit, so not over: run resets to 0, best stays 2. 74, 76, 79: run goes 1, 2, 3, and best becomes 3. 68: run resets. It returns 3. By eye, the longest stretch is 74, 76, 79: three seconds. Good.

**Candidate:** Now the edges, as asserts.

```python
# int01_l08_mock.py (part 2)
temps = [61, 72, 75, 70, 74, 76, 79, 68]       # deg C, limit 70
print(longest_run_above(temps, 70))

assert longest_run_above([], 70) == 0              # empty
assert longest_run_above([71], 70) == 1            # single element, above
assert longest_run_above([70], 70) == 0            # equal to the limit is not above
assert longest_run_above([75, 75, 75], 70) == 3    # all equal; run reaches the end
assert longest_run_above([-5, -1, -9], -6) == 2    # negative values
assert longest_run_above(temps, 70) == 3
print("all tests pass")
```

```bash
python3 int01_l08_mock.py
# 3
# all tests pass
```

**Candidate:** All pass. The empty list never enters the loop and returns 0. The all-equal case also checks the run-to-the-end branch. Final answer: $O(n)$ time, $O(1)$ space.

**Interviewer:** What would change if the readings arrived one at a time from a live stream?

**Candidate:** Nothing important. The loop already only needs the current reading, so `run` and `best` become state I keep between calls, and each new reading costs $O(1)$.

Notice what the candidate did *not* do. They did not start typing in the first ten seconds. They did not ask a question and then wait. They did not say "done" before tracing. The code itself is nine lines; almost everything that made the round go well was said, not typed.

## Check yourself

::: check
You are given this prompt: "Return the index of the first reading that repeats." List four clarifying questions or stated assumptions you would raise before coding, and say why each matters.
:::

::: answer
Good choices include: (1) What does "first" mean — the reading whose *second* appearance comes earliest, or the earliest reading that appears twice anywhere? Those give different answers, so the output is undefined until you ask. (2) What should I return if nothing repeats — $-1$, `None`, or raise? That is the empty-answer edge case. (3) How long can the list be? For a few hundred items a double loop is fine; for millions I want a hash set, $O(n)$ time and $O(n)$ space. (4) Are the readings exact integers, or floats where "repeat" would need a tolerance? Comparing floats for equality is fragile. (5) May I change the list, for example by sorting it? Sorting would destroy the indices you need to return.
:::

::: check
A candidate writes `best = 0` before a loop that finds the largest sum of any $k$ consecutive values. Which edge case from the list will expose the bug, and what is the fix?
:::

::: answer
Negative values. If every window sums to less than zero, no window ever beats the starting 0, so the function returns 0 even though no window has that total. For example $[-3, -2, -4]$ with $k = 2$ should give $-5$ but gives 0. The fix is to start `best` at a real candidate — the first window's sum — or at negative infinity, and to reject an empty list or a bad $k$ before the loop.
:::

::: check
A list has $n = 10$ items. How many windows of size $k = 4$ are there? If your trace table shows the loop body running 7 times after the first window is built, is something wrong?
:::

::: answer
There are $n - k + 1 = 10 - 4 + 1 = 7$ windows. The first window is built before the loop, so the loop should run $7 - 1 = 6$ times, for $i = 4, 5, \dots, 9$. Seven iterations means one window too many — probably a loop that starts at $k - 1$ and re-adds the first window, or runs one past the end. That is a fencepost error, and the trace table is exactly where it shows up.
:::

::: check
Why is saying the complexity *before* coding better than working it out at the end?
:::

::: answer
Because it is part of choosing the approach. Stating "$O(n)$ time, $O(1)$ space" up front shows you chose the method on purpose and know it is fast enough for the input size you asked about. If the interviewer wanted something faster, or the input is huge, they can tell you before you spend fifteen minutes on the wrong method. At the end you can confirm it, but by then it is too late to change course cheaply.
:::

::: check
You are testing a fixed-size buffer of capacity 3 that overwrites the oldest item when full. Which test targets the wrap-around branch, and what should it check?
:::

::: answer
Push more items than the capacity — for example 1, 2, 3, then 4 — so the write position wraps from the end of the storage back to the start and the oldest item is overwritten. Then check that the contents, oldest first, are $[2, 3, 4]$ and the size is still 3. Pushing a few more (5, 6, 7) forces a second full wrap. Tests with only 1 or 2 pushes never reach that branch, which is where off-by-one bugs live.
:::

## Summary

| Stage | What you do | Why |
| --- | --- | --- |
| restate | say the problem back, inputs and outputs | catches a misunderstanding before any code exists |
| assumptions | size, sorted, duplicates, negatives, empty, return format | the prompt leaves these out, often on purpose |
| approach | name the pattern, then time and space complexity | shows judgment; lets the interviewer redirect early |
| edge cases | name them before coding | you will remember to test them |
| code | narrate decisions, not keystrokes | keeps the interviewer able to follow and help |
| trace | a small example, variable by variable | finds bugs without running anything |
| edges | empty, single, all equal, k equals n, negatives, wrap-around | where bugs actually live |
| asserts | one line per edge case, with a message | fast, repeatable proof |
| oracle | compare with brute force on random small inputs | explores edges you did not think of |

Next lesson leaves pure puzzles for real engineering data: bytes, hexadecimal, endianness, Python's `struct` module and checksums, the pieces a binary telemetry decoder is built from.

::: context rubber-duck Explaining to a rubber duck
The name comes from *The Pragmatic Programmer* (1999), which tells of a programmer who kept a rubber duck on the desk and explained code to it line by line. Partway through the explanation, the bug usually jumps out. The duck does nothing; the act of putting each step into words forces you to notice the step you had skipped in your head. In an interview, the interviewer is your duck, with the bonus that this duck is also taking notes on how you think.
:::

::: context taking-hints How to take a hint well
A hint is not a failure. Interviewers give them to keep the round moving and to see how you use new information. The good response is short: repeat the hint in your own words, say how it changes your plan, and carry on. "Oh — if the list is sorted I can use two pointers instead of a hash map, which drops the space to $O(1)$." Arguing with a hint, or ignoring it and continuing down the old path, is what costs you.
:::

::: context desk-check Tracing code on paper
Before computers were cheap, programmers routinely "desk checked" their code: they ran it by hand at their desks, writing each variable in a column, because a real run might take a day to come back. The habit survives because it still works. A trace table forces you to execute what you *wrote*, not what you *meant*, and the difference between those two is exactly where bugs hide.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" fill="#ffffff">
    <rect x="30" y="15" width="300" height="24" fill="#8fb8f0"/>
    <rect x="30" y="39" width="300" height="24"/>
    <rect x="30" y="63" width="300" height="24"/>
    <rect x="30" y="87" width="300" height="24"/>
    <rect x="30" y="111" width="300" height="24" fill="#f2b880"/>
    <line x1="105" y1="15" x2="105" y2="135"/>
    <line x1="180" y1="15" x2="180" y2="135"/>
    <line x1="255" y1="15" x2="255" y2="135"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="67" y="32">i</text><text x="142" y="32">add</text><text x="217" y="32">s</text><text x="292" y="32">best</text>
    <text x="67" y="56">start</text><text x="142" y="56">3, -1</text><text x="217" y="56">2</text><text x="292" y="56">2</text>
    <text x="67" y="80">2</text><text x="142" y="80">4</text><text x="217" y="80">3</text><text x="292" y="80">3</text>
    <text x="67" y="104">3</text><text x="142" y="104">1</text><text x="217" y="104">5</text><text x="292" y="104">5</text>
    <text x="67" y="128">4</text><text x="142" y="128">-5</text><text x="217" y="128">-4</text><text x="292" y="128">5</text>
  </g>
</svg>
```

The trace from the lesson: `best` keeps 5 even when the last window falls to $-4$.
:::

::: context fencepost Posts and gaps
A straight fence 10 meters long with a post every meter needs 11 posts, not 10. Counting the gaps when you meant the posts, or the other way round, is called a fencepost error, and it is the most common off-by-one bug in code. Windows are the same: a list of $n$ items has $n - k + 1$ windows of size $k$. With $n = 5$ and $k = 2$, that is 4.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" fill="#8fb8f0">
    <rect x="40" y="20" width="50" height="30"/>
    <rect x="95" y="20" width="50" height="30"/>
    <rect x="150" y="20" width="50" height="30"/>
    <rect x="205" y="20" width="50" height="30"/>
    <rect x="260" y="20" width="50" height="30"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="65" y="40">3</text><text x="120" y="40">-1</text><text x="175" y="40">4</text><text x="230" y="40">1</text><text x="285" y="40">-5</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2" fill="none">
    <line x1="42" y1="62" x2="143" y2="62"/>
    <line x1="97" y1="76" x2="198" y2="76"/>
    <line x1="152" y1="90" x2="253" y2="90"/>
    <line x1="207" y1="104" x2="308" y2="104"/>
  </g>
  <text x="330" y="87" font-size="11" fill="#1f2a44" text-anchor="middle">4</text>
  <text x="175" y="124" font-size="11" fill="#6c7a93" text-anchor="middle">5 items, windows of 2: 5 - 2 + 1 = 4 windows</text>
</svg>
```
:::

::: context wrap-branch The branch most tests miss
A ring buffer stores the newest items in a fixed-size list, writing at a position that wraps back to 0 after the last slot, found with modular arithmetic: $(\text{start} + \text{length}) \bmod \text{capacity}$. For the first few pushes the wrap never happens, so a test that pushes two items into a buffer of three proves nothing about it. The module's ring-buffer exercise hides a test that pushes 10,000 items into a buffer of 1,000 and checks the storage never grew. Lesson 11 builds the buffer itself.
:::

::: context assert-off Asserts are for tests, not for flight
Python skips every `assert` statement when it is run with the `-O` (optimize) flag, so an assert must never be the only thing guarding real input in a program that ships. That is why `max_window_sum` raises a `ValueError` for a bad $k$ instead of asserting: the check has to survive in production. Asserts belong in tests, where their job is to fail loudly. C and C++ have the same split: the `assert` macro disappears when the program is compiled with `NDEBUG` defined, as release builds usually are.
:::

::: context oracle Letting a slow program check a fast one
In testing, an oracle is anything that tells you the right answer for an input. A brute-force function makes a good oracle because it is too simple to get wrong. Running both versions on thousands of random small inputs is a light form of property-based testing; Python's Hypothesis library does it more thoroughly, and even shrinks a failing input to the smallest one that still fails. In a take-home, including a test like this is a quiet signal that you test the way working engineers do.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="45" width="80" height="30" rx="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="50" y="64" font-size="11" fill="#1f2a44" text-anchor="middle">random input</text>
  <rect x="130" y="15" width="90" height="30" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="175" y="34" font-size="11" fill="#1f2a44" text-anchor="middle">fast, O(n)</text>
  <rect x="130" y="75" width="90" height="30" rx="5" fill="#ffffff" stroke="#1f2a44"/>
  <text x="175" y="94" font-size="11" fill="#1f2a44" text-anchor="middle">brute force</text>
  <rect x="260" y="45" width="90" height="30" rx="5" fill="#ffffff" stroke="#1d6fd1"/>
  <text x="305" y="64" font-size="11" fill="#1f2a44" text-anchor="middle">equal?</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="none">
    <line x1="90" y1="60" x2="130" y2="30"/>
    <line x1="90" y1="60" x2="130" y2="90"/>
    <line x1="220" y1="30" x2="260" y2="60"/>
    <line x1="220" y1="90" x2="260" y2="60"/>
  </g>
</svg>
```
:::
