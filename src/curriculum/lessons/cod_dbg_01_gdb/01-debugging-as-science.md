---
id: l01-debugging-as-science
title: Debugging as an experiment
minutes: 28
covers:
  - The scientific method of debugging; minimal reproducers
---

Your bike makes a clicking noise. You take it to a good mechanic, and the first thing she does is not grab a wrench. She asks questions: when does it click, only when you pedal hard? Then she rides it around the parking lot until the click happens in front of her. Only when she can make the click happen on purpose does she start taking things apart, one at a time: swap the pedal, ride again; tighten the chain, ride again.

That mechanic is doing science. She watches, guesses a cause, predicts what a test will show if the guess is right, runs the test, and keeps or throws away the guess. **Debugging** is the same job for a program: finding out why it does something different from what you expected, and proving it with evidence. A **[[bug|bug-word]]** is the mistake in the code. What you see (a crash, a wrong number, a frozen screen) is only the symptom, and the symptom is often far away from the mistake.

This module is about tools: the debugger gdb, sanitizers, profilers, logs. But tools do not find bugs by themselves, so this first lesson is the method. On a guidance, navigation and control (GNC) team, it is the difference between "the filter diverged once in simulation, we don't know why" and "line 15 divides by zero when two samples share a time stamp; here is the two-line input that shows it, and the test that will catch it forever".

## Symptom, cause, and the gap between them

Three words keep the thinking straight.

- The **defect** (or bug) is the wrong line of code.
- The **infection** is the bad value the defect creates in memory.
- The **failure** is what you finally see from outside.

Picture a leaky pipe inside a wall. The leak is the defect. The wet insulation is the infection. The stain on the ceiling downstairs is the failure. You notice the stain, but fixing the ceiling does nothing. You have to follow the water back to the pipe.

Programs are the same. A pointer gets overwritten in one function, and the program crashes in another a thousand lines later. Debugging is walking backwards from the failure to the defect, and the method below is how you walk without guessing.

## The first question: can you make it happen on purpose?

Before you form a single theory, ask this.

::: key
**First question of any debugging session:** can I reproduce it deterministically? Everything else, including a minimal test case, bisecting and instrumenting, is cheaper once the answer is yes. If it is no, the work is to make it reproducible.
:::

**Deterministic** means "the same inputs give the same result every time". A bug you can trigger with one command is half solved: you can run an experiment in seconds and tell for certain whether a change fixed it. With a bug that happens "sometimes", when it does not show up you cannot tell whether you fixed it or were lucky.

When a bug is not deterministic, something is changing between runs. Common suspects:

- **Input data**: a different log file, a different sensor stream. Save the exact input that failed.
- **Randomness**: a Monte Carlo simulation with a new random seed each run. Print the seed and allow it to be set.
- **Time**: code that reads the clock, or depends on how fast something ran.
- **Threads**: two threads whose order changes from run to run.
- **Uninitialized memory** and other undefined behavior: the program reads whatever was left in memory, which changes with build flags and what ran before.
- **Environment**: compiler version, `-O0` versus `-O2`, library versions, environment variables.

Pin down each suspect one at a time. If you cannot remove the randomness, measure it: run the program in a loop and count failures.

::: example How many runs to see a rare failure?
A simulation fails about once in 300 runs. You want to be 95% sure of seeing at least one failure before you conclude a change fixed it. How many runs is that?

Each run misses the failure with probability $1 - \tfrac{1}{300}$. For $n$ independent runs, all of them miss with probability $\left(1 - \tfrac{1}{300}\right)^n$. You want that to be at most $0.05$:

$$\left(1 - \tfrac{1}{300}\right)^n \le 0.05$$

Take the natural log of both sides. The log of a number below 1 is negative, so dividing by it flips the inequality:

$$n \ge \frac{\ln 0.05}{\ln\left(1 - \tfrac{1}{300}\right)} = \frac{-2.996}{-0.003339} \approx 897$$

So about 900 runs. Check: $1 - (1 - 1/300)^{900} \approx 0.950$. After 300 runs you would only be at about 63%, which is why "I ran it 300 times and it didn't fail" proves much less than it sounds.

Sanity check: rarer failures need more runs, and the answer is about three times the "one in 300". That is a handy rule of thumb: for 95% confidence, run about $3N$ trials for a one-in-$N$ failure.
:::

Counting is the slow road. The fast road is a tool that turns a "sometimes" into an "every time". AddressSanitizer, from the memory module, reports a bad memory access the moment it happens, even on a run where the program seemed fine. Lesson 08 adds its cousins for undefined behavior and threads.

::: warning "It went away" is not a fix
The bug vanishes when you add a `printf`, or when you build with `-O0`, or when you run it in the debugger. That does not mean anything is fixed. It means the change moved memory or timing around so the defect no longer shows. Engineers even have a name for this, a **[[heisenbug|heisenbug]]**: a bug that changes when you look at it. Treat a disappearing bug as a strong clue (probably undefined behavior or a race), never as a result.
:::

## The loop: observe, guess, predict, test

Once you can reproduce the failure, run the scientific method on it. Each lap has four steps.

1. **Observe.** Write down exactly what happens. Not "it breaks", but "it prints `final v_est=inf m/s` and exits with status 1 on `flight.log`".
2. **Hypothesize.** Guess a cause. A **hypothesis** is a guess that could be wrong, stated clearly enough that you can find out.
3. **Predict.** Say what you would see if the hypothesis were true, and what you would see if it were false. A hypothesis that predicts nothing is useless.
4. **Test.** Run the experiment that tells the two apart. Then keep the hypothesis or cross it out.

Two habits make the loop work. First, **write it down**: keep a plain text file, a [[debugging log|debugging-log]], with each hypothesis, test and result, so you never test the same idea twice. Second, **change one thing at a time**. If you change three things and the bug goes away, you do not know which change mattered.

Here is the program this lesson follows. It reads barometer altitudes, one `time altitude` pair per line, and estimates vertical speed. It takes a **[[finite difference|finite-difference]]**, the change in altitude divided by the change in time, and smooths it with a simple **[[low-pass filter|low-pass-filter]]**, which keeps 90% of the old estimate and mixes in 10% of the new measurement.

```cpp
// alt_filter.cpp: estimate vertical speed from a log of barometer altitudes.
// Input: one "time_s altitude_m" pair per line on stdin.
#include <cmath>
#include <cstdio>

int main() {
    double t_prev = 0.0, h_prev = 0.0, v_est = 0.0;
    double t, h;
    bool first = true;
    long line = 0;
    while (std::scanf("%lf %lf", &t, &h) == 2) {
        ++line;
        if (!first) {
            double dt = t - t_prev;
            double v_meas = (h - h_prev) / dt;       // finite difference
            v_est = 0.9 * v_est + 0.1 * v_meas;       // low-pass filter
        }
        first = false;
        t_prev = t;
        h_prev = h;
    }
    std::printf("lines=%ld  final v_est=%.3f m/s\n", line, v_est);
    return std::isfinite(v_est) ? 0 : 1;
}
```

Build it and run it on a 10,000-line flight log sampled every 0.02 s (50 samples per second, 200 s of climb):

```text
$ g++ -g -O0 -Wall -o alt_filter alt_filter.cpp
$ ./alt_filter < flight.log; echo "exit=$?"
lines=10000  final v_est=inf m/s
exit=1
```

The speed is `inf`, **[[infinity|inf-and-nan]]**. Something blew up. Run it again: same answer. Deterministic. Good.

Now the loop. Hypothesis A: the filter is unstable and the estimate grows slowly until it overflows. Hypothesis B: one bad sample makes it jump to infinity in a single step. These predict different things. If A is true, the estimate should creep up over thousands of lines. If B is true, it should look normal right up to one line and then be `inf`. The test: run the program on the first $n$ lines for several $n$ and watch.

```text
$ for n in 1000 2000 3000 4000 5000 6000; do head -n $n flight.log | ./alt_filter; done
lines=1000  final v_est=40.261 m/s
lines=2000  final v_est=49.628 m/s
lines=3000  final v_est=62.566 m/s
lines=4000  final v_est=65.570 m/s
lines=5000  final v_est=79.067 m/s
lines=6000  final v_est=93.320 m/s
```

These are sensible climb speeds, with no creeping growth. Hypothesis A is crossed out. Hypothesis B survives, and it asks a sharper question: which line?

## Divide and conquer: bisection

You could check lines one at a time. That is up to 10,000 runs. There is a far faster way, and you already know it from finding a word in a dictionary: open to the middle, see which half the word is in, and repeat.

**Bisection** means cutting the search space in half with every test. You need two facts to start: a size that is known good (it passes) and a size that is known bad (it fails). Test the middle. If the middle fails, it becomes the new bad end. If it passes, it becomes the new good end. Stop when good and bad are next to each other.

Each test halves the range, so the number of tests grows only with the **logarithm** of the size. Read $\log_2 N$ as "log base two of N": how many times you can halve $N$ before you get down to 1.

::: key
Bisection finds one change among $N$ candidates in at most $\lceil \log_2 N \rceil$ tests: about 14 tests for 10,000 lines, about 20 for a million.
:::

The brackets $\lceil\ \rceil$ mean "round up to a whole number". For $N = 10{,}000$, $\log_2 10{,}000 \approx 13.3$, which rounds up to 14. Bisection only works when the question has one switch point: every prefix shorter than some length passes, and every longer one fails. That holds here, because once the estimate is infinite it stays infinite ($0.9 \times \infty$ is still $\infty$).

Here is the search as a short bash script, in the style of the scripting module:

```bash
#!/usr/bin/env bash
# Find the shortest prefix of flight.log that makes alt_filter fail.
set -euo pipefail
good=0                        # a prefix this long is known to pass (empty input)
bad=$(wc -l < flight.log)     # a prefix this long is known to fail
step=0
while (( bad - good > 1 )); do
    mid=$(( (good + bad) / 2 ))
    step=$(( step + 1 ))
    if head -n "$mid" flight.log | ./alt_filter > /dev/null; then
        echo "step $step: first $mid lines -> pass"
        good=$mid
    else
        echo "step $step: first $mid lines -> FAIL"
        bad=$mid
    fi
done
echo "shortest failing prefix: $bad lines"
```

The program's exit status is the whole interface: `0` means pass, anything else means fail. That is why `alt_filter` ends with `return std::isfinite(v_est) ? 0 : 1;`.

::: example Bisecting a 10,000-line log
Running the script gives:

```text
step 1: first 5000 lines -> pass
step 2: first 7500 lines -> FAIL
step 3: first 6250 lines -> FAIL
step 4: first 5625 lines -> pass
step 5: first 5937 lines -> pass
step 6: first 6093 lines -> pass
step 7: first 6171 lines -> pass
step 8: first 6210 lines -> FAIL
step 9: first 6190 lines -> FAIL
step 10: first 6180 lines -> FAIL
step 11: first 6175 lines -> FAIL
step 12: first 6173 lines -> FAIL
step 13: first 6172 lines -> pass
shortest failing prefix: 6173 lines
```

Follow the range. It starts as good $= 0$, bad $= 10{,}000$. Step 1 tests the middle, 5,000: pass, so good becomes 5,000. Step 2 tests $(5000 + 10000)/2 = 7500$: fail, so bad becomes 7,500. Each step halves the gap: 10,000, 5,000, 2,500, 1,250, and so on, until step 13 leaves good $= 6172$ and bad $= 6173$, next to each other.

So line 6,173 is the one that breaks it. Look at it and its neighbor:

```text
$ sed -n '6171,6174p' flight.log
123.40 7509.47
123.42 7510.66
123.42 7513.04
123.46 7514.79
```

Lines 6,172 and 6,173 have the **same time stamp**, 123.42 s. The time step `dt` is zero, and `(h - h_prev) / dt` divides a positive number by zero, which in floating point gives $+\infty$.

Sanity check: 13 tests, and the formula promised at most $\lceil 13.3 \rceil = 14$. Thirteen runs instead of thousands.
:::

Hypothesis B is now specific and confirmed: a [[repeated time stamp|repeated-timestamp]] makes `dt` zero.

## Shrinking to a minimal reproducer

You know where the bug is triggered, but the test case is still 6,173 lines long. Shrink it.

A **minimal reproducer** is the smallest input (and smallest program) that still shows the failure. Keep removing anything you can; after each removal, check that it still fails. If it stops failing, put that piece back, because it mattered. What survives is exactly what the bug needs.

A minimal reproducer earns its keep four ways. It is **fast**, so you can run it thousands of times. It **points at the cause**: with two lines, the cause is on the screen. It is **shareable** with someone who does not have your project. And it **becomes a test**: checked into the suite, it guards against the bug coming back. That is called a **[[regression test|regression-test]]**.

::: example From 6,173 lines to two
Start with only the two lines that share a time stamp:

```text
$ sed -n '6172,6173p' flight.log | ./alt_filter; echo "exit=$?"
lines=2  final v_est=inf m/s
exit=1
```

Still fails, so the other 6,171 lines were not needed. Now make the numbers as plain as possible. The only thing that should matter is that the two times are equal:

```text
$ printf '0 0\n0 1\n' | ./alt_filter; echo "exit=$?"
lines=2  final v_est=inf m/s
exit=1
$ printf '0 0\n0 0\n' | ./alt_filter; echo "exit=$?"
lines=2  final v_est=-nan m/s
exit=1
$ printf '0 0\n0.02 1\n' | ./alt_filter; echo "exit=$?"
lines=2  final v_est=5.000 m/s
exit=0
```

Read the three results as an experiment:

1. Same time, altitude goes up by 1: $1/0 = +\infty$. Fail.
2. Same time, altitude unchanged: $0/0$ is **not a number**, printed `-nan`. Fail.
3. Time goes up by 0.02 s: $1/0.02 = 50$ m/s measured, and $0.9 \times 0 + 0.1 \times 50 = 5$ m/s. Pass.

The only difference between the failing and passing inputs is whether the time changed. The minimal reproducer is two lines, `0 0` and `0 1`.
:::

When you record results like these in your log, paste the real output. It is very easy to type what you expected to see instead of what happened.

Now the fix. Samples that do not move forward in time carry no speed information, so skip them, and count how many were skipped so the problem stays visible:

```cpp
        if (!first) {
            double dt = t - t_prev;
            if (dt <= 0.0) {            // repeated or backwards time stamp
                ++skipped;
                continue;               // keep the earlier sample
            }
            double v_meas = (h - h_prev) / dt;       // finite difference
            v_est = 0.9 * v_est + 0.1 * v_meas;       // low-pass filter
        }
```

(The full fixed file also declares `long skipped = 0;` and prints it.) And the reproducer becomes a regression test:

```bash
#!/usr/bin/env bash
# Regression test: two samples with the same time stamp must not break the filter.
set -euo pipefail
printf '0 0\n0 1\n' | ./alt_filter
```

::: warning Shrink the input, then stop
Shrink one thing at a time, re-run after every cut, and stop when every remaining piece is needed. If a cut makes the failure change shape (a different error, a different line), undo it: you may have found a second bug, and you do not want to chase two at once.
:::

Shrinking by hand works for small cases. For big ones, it can be automated with **[[delta debugging|delta-debugging]]**, which is bisection applied to "which parts of the input matter".

## Bisecting history: which change broke it?

Sometimes the question is not which input, but which change. Last month's build handled this log; today's does not. A project's history is a list of commits, and bisection works on lists.

`git bisect` does exactly this. You tell it one bad commit and one good commit, and it checks out the middle commit for you to test. Better, `git bisect run` takes a script and runs it at every step by itself. The script's exit status is the verdict: 0 means good, most non-zero codes mean bad, and the special code **125** means "this commit cannot be tested, skip it" (for example, it does not compile).

The two-line reproducer makes a perfect script:

```bash
#!/usr/bin/env bash
# repro.sh: exit 0 if this commit is good, 1 if the duplicate-time-stamp bug is present.
g++ -g -O0 -o /tmp/af_bisect alt_filter.cpp || exit 125   # cannot build: skip
printf '0 0\n0 1\n' | /tmp/af_bisect > /dev/null
```

::: example 120 commits, 7 tests
A history of 120 commits: the first is known good (it had a `dt` check), the newest is bad. Mark them and let git drive:

```text
$ git bisect start HEAD <first-commit>
$ git bisect run ../repro.sh
Bisecting: 59 revisions left to test after this (roughly 6 steps)
[3beeb7e...] build 60: tidy
running '../repro.sh'
Bisecting: 29 revisions left to test after this (roughly 5 steps)
[ab3274e...] build 90: tidy
running '../repro.sh'
Bisecting: 14 revisions left to test after this (roughly 4 steps)
[e445da3...] build 75: tidy
...
[91307d6...] build 73: simplify sample loop
running '../repro.sh'
Bisecting: 0 revisions left to test after this (roughly 0 steps)
[1a1b751...] build 72: tidy
running '../repro.sh'
91307d6920f8fe6cc6609ba2f5535f34dfd49c58 is the first bad commit
    build 73: simplify sample loop
 alt_filter.cpp | 3 +--
$ git bisect reset
```

Git tested builds 60, 90, 75, 67, 71, 73 and 72: seven tests, and $\lceil \log_2 120 \rceil = \lceil 6.91 \rceil = 7$. The guilty commit, "simplify sample loop", deleted the `dt` check, a very common story. `git bisect reset` puts you back where you started.
:::

## Verify: did you fix it, and for the right reason?

A fix is a hypothesis too: "this change removes the failure". Test it like one.

1. Run the minimal reproducer and the original failing case. Both should now pass.
2. Remove the fix and run the reproducer again. It should **fail** again. This proves the test really detects the bug, and that your change, not luck, made the difference.
3. Run the whole test suite, to check the fix broke nothing else.

::: example Checking the fix
With the fixed program built as `alt_fixed`:

```text
$ printf '0 0\n0 1\n' | ./alt_fixed; echo "exit=$?"
lines=2  skipped=1  final v_est=0.000 m/s
exit=0
$ ./alt_fixed < flight.log; echo "exit=$?"
lines=10000  skipped=1  final v_est=130.407 m/s
exit=0
```

Both pass, and `skipped=1` says exactly one sample was dropped: the one at line 6,173. The regression test run against the old, buggy binary still exits with status 1, so the test does detect the bug.

Sanity check on the number: the log was made from a climb speed of $30 + 0.5\,t$ m/s. At $t = 200$ s that is $30 + 100 = 130$ m/s, and the filter says 130.4 m/s. The fix did not only stop the crash; the answer is physically right.
:::

::: key
The debugging loop: reproduce, minimize, hypothesize, bisect, verify. Every step produces evidence: a command that fails, a smaller command that fails, a line that is guilty, and a test that passes only with the fix.
:::

## Check yourself

::: check
A teammate says, "The attitude filter sometimes outputs NaN in the Monte Carlo runs. I added logging and now it doesn't happen, so I think it's fixed." What do you tell them, and what would you do first?
:::

::: answer
It is not fixed; it is hidden. A bug that disappears when logging is added is a sign of something timing-dependent or of undefined behavior (such as reading uninitialized memory), which the extra code happened to mask. The first job is to make it reproducible: record the random seed of each Monte Carlo run so a failing run can be replayed exactly, and run the suite under a sanitizer that reports bad memory reads the moment they happen. Then, with one command that fails every time, start the hypothesis loop.
:::

::: check
A failure happens about once in every 50 runs. Roughly how many runs do you need to be 95% sure of seeing it at least once? Show the calculation.
:::

::: answer
Each run misses with probability $1 - 1/50 = 0.98$. Solve $0.98^n \le 0.05$: $n \ge \ln 0.05 / \ln 0.98 = -2.996 / -0.0202 \approx 148$. So about 150 runs, which is about three times 50, matching the rule of thumb.
:::

::: check
You bisect a 3,000-line input file. What is the most tests bisection can take? And what property must the failure have for prefix bisection to work at all?
:::

::: answer
$\log_2 3000 \approx 11.55$, so at most $\lceil 11.55 \rceil = 12$ tests. The property: there must be a single switch point, so every prefix shorter than some length passes and every longer one fails. If a later line could "undo" the failure (for example, the program resets its estimate periodically), a longer prefix might pass again and bisection could point at the wrong place.
:::

::: check
Why is `printf '0 0\n0 1\n' | ./alt_filter` a better thing to put in the test suite than the full `flight.log` run?
:::

::: answer
It runs in about a millisecond instead of processing 10,000 lines. It shows the cause directly: two samples with the same time. It depends on nothing else in the log, so it cannot start passing by accident if the log changes. And it fits in a bug report.
:::

::: check
`git bisect run` reports a commit as the first bad one, but that commit only renamed a variable in an unrelated file. Give two ways this could happen.
:::

::: answer
First, the failure might not be deterministic, so one "good" verdict along the way was really luck, and bisection trusts every verdict. Second, the script might fail for the wrong reason, for example because that commit broke the build and the script returned 1 instead of 125 (skip). Make the script deterministic, and return 125 for any commit it cannot really test.
:::

## Summary

| Idea | Meaning | Rule or tool |
| --- | --- | --- |
| Defect, infection, failure | wrong code, bad value, visible symptom | walk backwards from failure to defect |
| Deterministic reproduction | same input, same result, every time | first question of every session |
| Rare failure | fails about 1 in $N$ runs | about $3N$ runs for 95% confidence |
| Hypothesis loop | observe, hypothesize, predict, test | write it down; change one thing at a time |
| Bisection | halve the search space each test | at most $\lceil \log_2 N \rceil$ tests |
| Minimal reproducer | smallest input that still fails | becomes the regression test |
| `git bisect run` | bisect commits with a script | exit 0 good, 125 skip, other non-zero bad |
| Verify | reproducer passes with the fix, fails without | then run the whole suite |

The method works with nothing but a shell. Lesson 02 adds the first real instrument, the debugger gdb: stopping a program at a chosen line, reading the call stack after a crash, and setting a trap that fires the moment a variable is corrupted.

::: context bug-word Why a mistake is called a bug
Engineers were calling faults in machines "bugs" by the 1870s; Thomas Edison used the word in letters about his inventions. The famous computer version came in 1947, when operators of the Harvard Mark II computer found a moth stuck in a relay and taped it into their logbook with the note "First actual case of bug being found". Grace Hopper, who worked on that machine, liked to tell the story. The logbook page is now held by the Smithsonian. So the moth did not invent the word; it made a joke out of a word everyone already used.
:::

::: context heisenbug A bug that hides when watched
The name is a pun on Werner Heisenberg, the physicist behind the uncertainty principle, often loosely described as "measuring something disturbs it". A heisenbug disappears or changes when you try to observe it: adding a print, attaching a debugger, or turning off optimization changes memory layout and timing enough to hide it. The usual culprits are uninitialized variables, reading past the end of an array, and races between threads. Its opposite, a bug that fails the same way every time, is sometimes jokingly called a "Bohr bug", after Niels Bohr's solid, predictable model of the atom.
:::

::: context debugging-log Keep a lab notebook
Scientists write every experiment in a lab notebook, including the ones that failed. A debugging log is the same idea in a text file: time, hypothesis, command run, result, conclusion. It costs a minute per entry. It saves hours when you come back after lunch, when you hand the problem to a teammate, and when you write the final report. Aerospace organizations formalize this: problems found in testing are written up and tracked until the root cause and the corrective action are recorded and reviewed. Your log is the raw material for that report.
:::

::: context finite-difference Speed from two snapshots
Speed is how fast altitude changes. If you know altitude at two moments, you can estimate the speed between them by dividing the change in altitude by the change in time: $v \approx \frac{h_2 - h_1}{t_2 - t_1}$. That is a finite difference. It is simple and it has two famous weaknesses. It amplifies noise: a 0.3 m wobble over 0.02 s looks like 15 m/s. And it has no answer when $t_2 = t_1$, because you would be dividing by zero. This lesson's bug is the second weakness.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44"/>
  <line x1="40" y1="140" x2="40" y2="15" stroke="#1f2a44"/>
  <text x="330" y="158" font-size="11" fill="#1f2a44" text-anchor="end">time t</text>
  <text x="46" y="24" font-size="11" fill="#1f2a44">altitude h</text>
  <circle cx="110" cy="110" r="5" fill="#1d6fd1"/>
  <circle cx="260" cy="50" r="5" fill="#1d6fd1"/>
  <line x1="110" y1="110" x2="260" y2="50" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="110" y1="110" x2="260" y2="110" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="260" y1="110" x2="260" y2="50" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="185" y="126" font-size="11" fill="#6c7a93" text-anchor="middle">t2 - t1</text>
  <text x="268" y="84" font-size="11" fill="#6c7a93">h2 - h1</text>
  <text x="150" y="70" font-size="11" fill="#1d6fd1">slope = speed</text>
</svg>
```
:::

::: context low-pass-filter Smoothing a noisy number
The line `v_est = 0.9 * v_est + 0.1 * v_meas` keeps most of the old estimate and nudges it a little toward each new measurement. Random noise that jumps up and down averages out, while a real, steady change still gets through over a few dozen samples. That is what "low-pass" means: slow changes pass, fast wiggles are blocked. The Kalman filter you will meet in the GNC modules does something similar, but it works out the best mixing weight at each step instead of fixing it at 0.1.
:::

::: context inf-and-nan What a computer does when you divide by zero
C++ `double` numbers follow a standard called IEEE 754. Instead of crashing on division by zero, it defines special values. A positive number divided by zero gives $+\infty$ (printed `inf`), a negative one gives $-\infty$, and $0/0$ gives NaN, "not a number" (printed `nan`, sometimes with a sign). They spread: $0.9 \times \infty$ is still $\infty$, and anything combined with NaN is NaN. That is why one bad sample poisoned the final answer, and why the program checks `std::isfinite` before reporting success. Integer division by zero is different: it is undefined behavior in C++ and usually crashes.
:::

::: context repeated-timestamp Why real logs repeat time stamps
Real sensor logs are messier than a textbook. A sensor may be read twice within one tick of a coarse clock, so both samples get the same stamp. Two messages can be buffered and stamped when they are unpacked instead of when they were measured. Time can even jump backwards when a clock is corrected by GPS. Robust flight code never assumes time strictly increases; it checks, and it counts the samples it had to reject so the problem shows up in telemetry.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44"/>
  <line x1="60" y1="52" x2="60" y2="68" stroke="#1f2a44"/>
  <line x1="160" y1="52" x2="160" y2="68" stroke="#1f2a44"/>
  <line x1="260" y1="52" x2="260" y2="68" stroke="#1f2a44"/>
  <text x="60" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">123.40</text>
  <text x="160" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">123.42</text>
  <text x="260" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">123.44</text>
  <circle cx="60" cy="40" r="6" fill="#1d6fd1"/>
  <circle cx="160" cy="40" r="6" fill="#1d6fd1"/>
  <circle cx="160" cy="22" r="6" fill="#b4232c"/>
  <text x="172" y="26" font-size="11" fill="#b4232c">second sample, same stamp: dt = 0</text>
  <text x="260" y="44" font-size="11" fill="#6c7a93" text-anchor="middle">(missing)</text>
  <text x="20" y="104" font-size="11" fill="#6c7a93">clock ticks every 0.02 s</text>
</svg>
```
:::

::: context regression-test Why "regression"
To regress means to go backwards. A regression is a bug that was fixed and then came back, or a feature that used to work and broke. A regression test is a test written for one specific bug, kept in the suite forever, so that if anyone reintroduces the bug the build fails. Many teams have a simple rule: no bug fix is merged without a test that fails before the fix and passes after it. That rule is exactly step 3 of "verify" in this lesson.
:::

::: context delta-debugging Letting the computer shrink the input
Andreas Zeller, a German computer scientist, described delta debugging around 2000: an algorithm that automatically cuts a failing input into pieces, tries removing pieces, and keeps any removal that still fails, until nothing more can go. Tools built on the same idea are widely used. C-Reduce shrinks C and C++ programs that crash a compiler, which is why compiler bug reports are often a dozen strange-looking lines. Property-based testing libraries such as Hypothesis for Python shrink failing random test cases the same way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="15" width="320" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="30" font-size="11" fill="#1f2a44" text-anchor="middle">6,173 lines: fails</text>
  <rect x="100" y="52" width="160" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="67" font-size="11" fill="#1f2a44" text-anchor="middle">fewer lines: still fails</text>
  <rect x="160" y="89" width="40" height="22" fill="#b4232c" stroke="#1f2a44"/>
  <text x="180" y="104" font-size="11" fill="#ffffff" text-anchor="middle">2</text>
  <text x="212" y="104" font-size="11" fill="#1f2a44">lines: minimal reproducer</text>
</svg>
```
:::
