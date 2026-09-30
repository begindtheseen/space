# Changelog

What changed in each version, in the words of someone using the app rather
than someone who wrote it. The app reads this file: the entry for a version
you are about to install is what the update panel shows you beforehand, and
the entry for the one you are running is what Settings shows you afterwards.

Newest first. Each heading is exactly `## <version>` so both readers can find
it.

## 1.2.3

- A voice that helps you through your code. In Learn to code, when you run your code and it doesn't
  pass, a small card rises at the bottom of the screen and the voice tells you what it sees in that
  run. That might be the error and the line it's on, the line of your output that's off, or the call your
  function got wrong. For example: "Nice try, but line 3 is missing the colon at the end," or "Your
  function prints the answer, but it doesn't give it back." Each time you try again, it guides you a
  little further: first where the problem is, then what should be there, then the lesson's own hints.
  After several tries it suggests reading the solution. It notices when you've fixed the error or when
  more checks pass, and when you run the same code again. When your code passes, it says nothing and
  the card goes away. It stays quiet in course exams and re-tests. You can turn it off in Settings.
- Read aloud is one quiet button at the top of each lesson, with the speed beside it. While it reads,
  the same capsule shows pause, back, a thin progress line, forward and stop.
- Choosing the voice has moved to Settings, next to the reading speed, with a Preview button to hear
  it first.
- Pronunciation, fixed across every lesson. Every word the voice reads was checked, and it no longer
  reads maths commands aloud by their code names. It used to say things like "mathbb", "leftarrow",
  "otimes" and "lceil" hundreds of times. They now come out as "the expected value of", "gets",
  "times" and "the ceiling of". Code words are said the way programmers say them: `str` is "string"
  (not "S T R"), `succ` is "successor", `sizeof` is "size of", `enum` is "ee-num", `Eigen` is
  "eye-gen", and `async` is "ay-sink". Terminal flags are read as flags ("ls dash L A"), `HEAD~1` is
  "HEAD tilde one", 1e-9 keeps its minus sign, and names like `ii` and `xx` are no longer read as
  Roman numerals.
- Fixed an equation in the ZEM/ZEV guidance lesson that was broken on screen and read aloud as raw
  code.

## 1.2.2

- Read aloud follows along properly now. The highlight stays on the word being read instead of jumping
  ahead to random words. It used to lose its place after a code block, a number read out, or an
  equation, and then stay lost. Now it lines each sentence up with the lesson as a whole, and finds its
  place again if it slips. Code written in the middle of a sentence is highlighted too, since it is read
  out.
- The lesson scrolls with the reading, in every lesson and with every voice. When the word being read
  moves below the screen, the page scrolls to keep it in view. If you scroll somewhere else yourself,
  it leaves you there and shows "Back to the word being read", which also turns the scrolling back on.
- This device's own voice now follows along too. It highlights each word as it says it and scrolls the
  page with it. A voice that doesn't say which word it is on still scrolls the page, one sentence at a
  time.
- The highlight no longer goes out when part of the lesson changes while it is being read, such as a
  code window running or a note opening. It finds the words again and carries on.

## 1.2.1

- Read aloud now works in every Learn to code lesson, and it reads the lesson the way a tutor would:
  it reads the explanation, and when it reaches an example with code already in the window it runs the
  code itself, lets you see what it printed, and reads on. At "Your turn" it waits: the reading goes on
  only once your code passes. Then it reads each practice problem and question in turn, waiting at each
  one until you have passed it. The button above the lesson says what it is waiting for, and Stop or the
  skip buttons still work at any time.

## 1.2.0

- A computer science degree in Learn to code. Twelve new courses teach what a bachelor's in computer
  science teaches, to mastery: Data Structures & Algorithms I and II, Data Structures in C++, Discrete
  Mathematics, Computer Organization, Systems Programming, Operating Systems, Computer Networks, Theory of
  Computation, Programming Languages & Compilers, Security, and Parallel & Distributed Computing. They sit on
  the "Computer Science degree" roadmap after the Python, terminal, git, C++ and SQL courses they build on.
- Five capstone projects finish the degree, each over 2,000 lines, built milestone by milestone with the
  whole project re-tested at every step: an interpreter for a small language, a key-value store with crash
  recovery, flight software in C++ with fixed memory and fault handling, an HTTP server with load testing,
  and an analytics database tuned by its query plans.
- Every lesson now has a practice set after it, climbing from a warm-up to a stretch problem, and every
  course ends in a timed gate. A course opens only when the courses it builds on have their gates passed;
  the lock screen says which, and you can sit a gate whenever you are ready.
- Every coding module has the same: practice under each lesson and a module test that opens the next
  module. What you prove once counts everywhere: mastering the Learn to code lessons that teach a module
  lesson marks it read, mastering the courses that cover a whole module passes its test, and passing the
  module tests that cover a course passes its gate. Credit is earned only by passing, never by time spent.
- Answer choices are shuffled each time a question is shown, so you recognise the right answer rather
  than remember where it sat. A question with a choice like "all of the above" keeps its order.
- Courses load when you open them instead of all at once, so ORBIT starts with about a tenth of the
  download it had (3 MB instead of 30 MB).
- Python in the browser: the first run that uses NumPy or another package no longer prints "Loading
  numpy" into your program's output, and a program that crashes Python (for example by freeing a linked
  list of many thousands of nodes at once) says so straight away instead of waiting 30 seconds, and the
  next run starts Python again.
- Examples that need something the browser's C++ leaves out (exceptions, threads, signals) are marked
  "build this on a laptop" instead of offering a Run button that cannot work.
- Many corrections to the coding modules' lessons: numbers, sizes on ORBIT's 32-bit C++ as well as a
  64-bit laptop, and behaviour that differs between the browser and a laptop.

## 1.1.14

- Explain now covers every name the coding lessons teach, in sentences as well as in code: 2,959
  entries, up from 1,764. A test reads every lesson and fails if any name is missing.
- New languages: Rust (keywords, macros, standard library paths, the methods the lessons call, and the
  crates they use), MATLAB and Simulink functions, CMake commands and variables, Dockerfile instructions,
  GitHub Actions, Compose, Kubernetes and GitLab YAML keys, and Cargo and pyproject TOML keys and tables.
- The names written in a lesson's text but never in its code are covered too, such as Python's exception
  classes, more C++ standard library names, and terminal tools like `psql`, `base64`, `zstd`, `gh` and
  `git-lfs`.
- In the Rust lessons, C++ names such as `std::vector` and `std::map` open the C++ card, not a Rust one.

## 1.1.13

- Explain now opens a card for commands that look like ordinary words, such as `echo`, `cat`,
  `sort` and `touch`, wherever the Terminal course uses them, in a sentence as well as in code.
  They were being skipped as if they were plain English.
- A terminal command written as code in another language's lesson (`echo` in the Python lesson that
  compares it to `print`, `python3 main.py`) now opens the command's card.

## 1.1.12

- Explain now knows every keyword, built-in and library name the Python, C++ and SQL lessons use,
  not just terminal commands: `print`, `len`, `for`, `def`, `np.linalg.norm`, `std::vector`,
  `#include <cmath>`, `SELECT`, `GROUP BY`, `COUNT` and about 1,500 more. Highlight one and the card
  shows its description word for word from the official documentation, when you would use it, the
  parts the lessons use, and an example.
- It reads the word in the language of the lesson you are in, so `for` in a Python lesson is
  Python's `for` and in a C++ lesson it is C++'s.

## 1.1.11

- Explain knows every command ORBIT teaches, from `pwd` and `cp` to `git bisect`, `awk`, `docker
  run` and `cmake`. Highlight one and press Explain: it shows what the command's own manual says it
  does, word for word, when you would use it, the flags the lessons use (the ones you highlighted
  are lit up), and an example. "See also" jumps to related commands.

## 1.1.10

- Read aloud now says "versus" for "vs", and "for example" and "that is" for
  "e.g." and "i.e.".
- Units are spoken as words everywhere, in sentences and inside equations:
  "370 meters", "9.8 meters per second squared", "4.4 per second", "84 minutes",
  "85 percent", instead of letters like "m" and "s".
- Code names are read the way a programmer says them: "standard vector push
  back" instead of "std colon colon vector", "C plus plus", "num pie", "Jason".
- Symbols such as ~, ≈, ±, → and number ranges like 5–10 are read as words,
  and bars around a value are read as "the absolute value of".

## 1.1.9

**Start here: your mission briefing.** A new, five-minute briefing explains what ORBIT is for
before you begin: the three questions every rocket's code answers, how the coding you do in Learn
to code turns into the code that flies, the route from Basecamp to a capstone where you fly a rocket
of your own, what a lesson feels like (with a real note to tap and Explain to try), how flashcards
and reviews make it stick, and the two ways to begin. You can pick a pace for your first week on
the way. The dashboard and Learn to code point to it until you read your first lesson, and it is
always a click away from the Guide.

## 1.1.8

**Run only appears on code that can run.** A lesson that builds a program up line by line used to
put a Run button on a piece like `int main() {`, which could only fail to compile. Pieces of a
program are now shown as plain code, and every code block that does have a Run button is compiled
when the app is built, so none of them can fail on you. Where a lesson shows a compiler error on
purpose, Run is still there so you can see it.

**American spelling throughout.** Lessons, flashcards and coding courses now use American spelling
(behavior, center, meter, optimize) to match everything else in the app.

**Exercises that were broken are rebuilt.** The rocket-ascent guidance exercise now has a rocket
that can actually lift off and a target it can reach; the MATLAB control exercise starts from a
loop you first find to be unstable and then fix; a new exercise decodes a real two-line element set
and draws its ground track; and a dozen SQL lessons now check that your query is really right, not
just that it runs. About forty more cards and questions are clarified.

## 1.1.7

**Every coding course and nearly every module is now in plain words.** The last courses, C++
expert and C++ projects, are rewritten one idea at a time with notes in every lesson, and their
examples never hand you the answer. The career modules (recruiter screens, the project
presentation, the domain round, first-principles questions and behavioral stories), the rest of
guidance and trajectory optimization, the capstone, interview prep and the Simulink modules are
rewritten too, with context notes throughout. Four lessons on proportional navigation keep their
original text for now.

**More fixes to flashcards and quizzes.** About forty-five cards, questions and exercises are
corrected, from which way the primer vector points to what "three sigma" covers, when a
bi-elliptic transfer beats a Hohmann, and how Simulink solvers and Stateflow states really run.

## 1.1.6

**Fixes from a careful check of the lessons.** A C++ lesson that could not compile now does (it was
missing a line every solution needs), an SQL check that was meant to refuse a zero quantity now
really tests one, and about thirty flashcards and quiz questions that were slightly wrong are
corrected, from which poles make a system unstable to what counts as a US person for export rules.
Each one was checked by running the code or redoing the maths.

## 1.1.5

**Stuck on a coding lesson? It notices.** After two tries that do not pass, the lesson shows
which check is still failing and offers help beyond the next hint: an Explain of what that check
needs, a link back to the earlier lesson that taught it, and the next hint. If it is still not
passing after a few more tries, it suggests opening the solution, reading it line by line, and
then typing it yourself.

**Examples no longer hand you the answer.** In 59 coding lessons, mostly Terminal and Git, the
example in the explanation was the task's answer word for word, or the answer with the names
changed. Those examples now show the idea on different files, names and data, and show the steps
one at a time, so the task asks you to put them together yourself.

## 1.1.4

**Almost every lesson is now in plain words.** 95 of the 108 modules are rewritten so each step
comes one idea at a time, every new word is explained the first time it appears, and every
lesson has context notes: tap an underlined phrase for what it means, why it matters and where
it comes back. The same maths and code sit underneath. The last few modules (career, advanced
guidance, the capstone and Simulink) still have their original text and follow in an update.

**Learn to code is rewritten too.** Nineteen of the twenty-one courses (every Terminal, Git,
Python and SQL course, and C++ up to advanced) now go one idea at a time, say what every symbol
and flag means, and have notes in every lesson. Long lessons that crammed in several new things
are split into shorter ones. Your progress is kept exactly as it was.

**Fixes to flashcards and quizzes.** About fifty cards, quiz questions and exercises that said
something slightly wrong are corrected, from how a failing shell pipeline reports its error to
which way the Coriolis force pushes. Each one was checked by running the code or redoing the maths.

## 1.1.3

**Highlight anything and press Explain.** Select a word, a formula or a sentence in a lesson and
an Explain button appears. It opens the panel beside the lesson with what the course already says
about those words: the note that explains them, which lesson it comes from and whether you have
read it, a flashcard if one defines it, and the places in lessons you have read where you met the
words before, one tap away. It is instant, works offline and sends nothing anywhere. When nothing
you have read covers it yet, it says so and shows you which lesson does. Every context note also
has a "Still fuzzy?" button that shows where else the same idea comes up.

**Learn to code gets the same help.** Coding lessons now have context notes and Explain too:
highlight a word in a lesson, or an error in the terminal, and the panel shows what the course says
about it. The Terminal, Git, Python, SQL and C++ courses are being rewritten in plain words, one
idea at a time, with notes in every lesson, starting with Terminal.

**Tap the underlined words for the story behind them.** Lessons now have context notes, like the
explanations on a lyrics site: tap an underlined phrase and a panel opens beside the lesson with
what it means, why it matters and, often, a picture. The lesson slides over so the panel never
covers what you are reading.

**Find your starting point.** A placement test, offered on the dashboard, asks short
questions from counting and decimals up to logarithms. "I don't know" is a good answer. At the end
you get a plan — the lessons you need, in order, and the ones you can skip — and Next up follows it.

**Basecamp: the maths under everything.** A new first module of twelve lessons: place value,
decimals, factors, fractions from the ground up, formulas, equations, graphs, angles, area and
volume, square roots and Pythagoras, the metric system, and speed and averages. Each one is
written for someone meeting the idea for the first time, and each teaches only what the later
lessons actually use.

**The first modules are rewritten in plain words.** Algebra and Trigonometry now explain every
step and every new word, with the same maths underneath. More modules follow in updates.

**Learn to code has its own focus blocks.** Start a focus block on a coding lesson and the block
keeps you in that course, the same way a study block keeps you in a module.

**Your Mac stays awake while you use ORBIT.** The screen no longer dims and sleeps in the
middle of a long read. It stays on while a focus block is running, while a lesson is being read
aloud, and for fifteen minutes after you last scroll, click or type — then it is allowed to sleep
as normal.

**This is the last app update you install by hand.** Keeping the screen awake needs the app
itself to be newer, so Settings will offer "Update to 1.1.3" once: two taps, and ORBIT replaces
itself and reopens. After that, updates happen on their own.

**ORBIT updates itself, like any other app.** When a new version comes out it downloads in the
background while you work: no Settings trip and no Download button. Most updates are small
(about 11 MB) and slot into the app you already have, and the new version is simply there the
next time you open ORBIT — or restart when the bell says so to get it straight away. The rare
update that needs a whole new app downloads quietly too, and goes in when you quit.

**Read aloud says equations properly.** A centred dot is read as "times" (it stays "dot" between
two vectors, where it is the dot product). Powers are "to the power of" — "10 to the power of
minus 3" — and one half, three halves, transpose, inverse, star and prime are named rather than
read as numbers. Degrees are read as degrees everywhere: "65 degrees", "1 degree", "12.3 degrees
per second", "20 degrees Celsius", where before the voice said "circ" or "degrees slash s".
Matrices are read row by row, cases as "this, if that", integrals and sums with their limits
("the integral from 0 to T of"), sets as "the set of x such that", and 3 × 10⁸, 10^6 and m² in
ordinary text come out as words.

## 1.1.2

**Focus mode changes how the app looks.** While a block runs, the rail, the top bar and the
search box are gone, the edges of the screen fall into shadow, and one quiet line at the top says
what you are doing. There is the lesson and nothing else until you pause or finish.

**Read aloud follows along, word by word.** The word being read is lit up in the lesson as it is
spoken, and the sentence around it faintly, so your eye can keep your place. Scroll away and
**Back to the word being read** appears; one tap brings you back to it. The timing is exact: it
comes from the voice model's own durations for every sound it makes, not a guess.

**Read aloud no longer runs out of memory or stops halfway.** On a fast Mac the voice makes the
lesson well ahead of where you are, so it never has to stop and load more, and it hands its memory
back every thirty sentences, so a long lesson no longer ends with the app out of memory. Pieces
given to the model at once are a little shorter, which keeps each one's memory down.

**Focus blocks keep you on the lesson.** While a block is running, the app will not take you
anywhere else: a sidebar link, the search box, the back button or a typed address puts you back on
the lesson, and the strip at the bottom says why and how to leave. Moving between the lessons of
the same module is fine. To go somewhere else, pause the block or end it.

- **Pause** becomes available once five minutes of the block have run, and again five minutes
  after each resume; until then the button shows how long is left. While paused you can go
  anywhere, and **Resume** takes you straight back to the lesson.
- **I'm done** ends the block at any moment, and every minute it ran still counts.

## 1.1.1

**ORBIT updates itself, all the way to the latest.** When a release needs a
newer app than the one you have — however many versions behind it is —
Settings → Updates (and the bell) now offers **Update to** the latest version.
ORBIT downloads the new app, checks it is exactly the one GitHub published (its
size, its SHA-256 and its code signature), then **Install and reopen** quits,
puts the new app where the old one was and opens it, straight onto the latest
version and everything in it. If anything goes wrong while swapping, the old
app is put back as it was. Your progress lives outside the app, so it comes
along unchanged.

It needs ORBIT in a folder it may write to, such as Applications. Opened
straight from the download, macOS runs it from a temporary read-only copy;
Settings then says so and offers the download instead.

**One last manual install.** The app you have now cannot do this yet, so it
will ask you to download 1.1.1 once. From 1.1.1 on, it updates itself.

**Every merge is released.** Updates reach the app as soon as they are made,
instead of waiting on someone to publish a release.

## 1.1.0

**Learn to code.** A new guided mode, in the sidebar and on Home. It opens on
roadmaps: pick a goal — GNC Engineer, Flight Software, Test & Data or Software
Engineer — and its courses are laid out in the order a mentor would teach
them, as a numbered path of course tiles ending at a certificate, lit up as you
go; View every step walks it course by course. Your code, your progress and a
daily streak are saved on this device. It is practice: nothing here changes
mastery, readiness or your reviews.

**From your first line to expert.** 21 courses, 291 lessons: Linux and the
command line, Git, Python, SQL and C++, each from the basics through
intermediate and advanced (Python, SQL and C++ on to expert), then a projects
course. Past the basics every course mixes four kinds of lesson: new ideas;
**debugging** real broken code from a bug report — reproduce it, read the
error, narrow it down, fix the cause; **problem solving**, where you design the
algorithm and a big input only an efficient answer finishes in time; and
**design**, refactoring working code into a better shape or shaping an API to a
spec. Projects courses build real programs step by step — an expense tracker,
a Markdown converter, a matrix library, an analytics database — and end in
capstones: a specification, an empty file, and tests that only check what
your program does, so the design is yours. Each language has a mastery roadmap
that walks its whole ladder, and each course offers the next when you finish.
Each lesson
is a short explanation with examples you can run where they stand, then a
challenge in the same IDE window; Run Code really runs your code and shows
every check as a test case — the input, what was expected, and what your code
produced. Hints come one at a time and the solution is there when you ask.
Every lesson is checked in the real runtimes before it ships: its starter
needs work, and its solution passes. C++ lessons always use the in-app
compiler, the one they were checked with.

**Read aloud sounds like a person, and reads fluently.** Lessons are read by
a natural neural voice (Kokoro) instead of the system synthesiser, which on
many devices still sounds like a robot. It runs on your machine — on the GPU
where there is one, many times faster than it speaks, otherwise on the
processor — the same voice everywhere: six voices, American and British. It
reads whole sentences (only a very long one is cut, at a clause), with a
reader's pause between sentences and a longer one between paragraphs, and it
waits just long enough before the first word, if it needs to, that it never
has to stop mid-lesson. On a phone it runs in one worker with short pieces,
so it stays within the phone's memory; a worker that fails or is taken by the
system is replaced and its sentence made again, and audio the system stopped
is started again, so the reading never freezes.
The first time, it downloads once (about 92 MB, with progress shown) and then
works offline, and what it has read is kept, so a lesson heard again plays at
once. Your machine's own voices stay in the picker, and are used
automatically if the natural voice cannot load.

**C++ works on iPhone and iPad.** An iPhone or iPad cannot run the 105 MB C++
compiler inside a browser, so C++ never compiled there in the web app. Now it
is compiled and run on Compiler Explorer (godbolt.org) instead — the code is
sent there, and the playground and the output say so. In the desktop app and
in other browsers nothing changes.

**The playground comes to the lesson.** The code in ORBIT's lessons runs where it stands: a
Python or C++ snippet is the playground's own window, embedded in the text — edit it, run it, see
what it prints — and a `>>>` transcript opens as the code you would type, printing what the
transcript shows. Shell snippets the practice terminal knows run there. Each lesson ends with
**Try it here** in its module's language. Code exercises are done on the module page, under their
brief, and graded against their tests as test cases. And every Workbench scenario — a day on the
job — is now one flow: how the job arrives, what done looks like, your code in the same window, and
the margin report as test cases (the requirement, and what your code achieved), then the next job.
The playground is still its own page for anything else.

**A new playground.** Three modes along the top — Code, SQL and Terminal —
and one IDE window: the file's name in a pill (in Code mode it picks Python,
C++, Rust, MATLAB or a shell script), a floating Run Code button, and a panel
under the editor with Test cases, Console, Input, Results and Tables. Terminal
is a practice shell that lives in the page, and a small real one: quoting,
variables, `$(…)`, wildcards, pipes, redirection (standard error too), `for`,
`while` and `if`, scripts you save and run, and `grep`, `sort`, `uniq`, `cut`,
`find`, `sed` and `xargs`. Its git merges line by line and writes real conflict
markers for you to resolve, and has stash, reset, revert, rebase, cherry-pick,
tags, bisect, blame and a pretend remote that rejects a push the way a real one
does. It says plainly that it is a simulation; real shell scripts still run on
the Mac in Code mode.

**C++ always really runs now.** In the desktop app with a compiler installed,
nothing changes — the Mac's own compiler builds it. Everywhere else — in a
browser, or on a Mac without Apple's command line tools — ORBIT now compiles
it with clang++ built for WebAssembly, right in the app, instead of comparing
your output as text. The Input tab is what your program reads. One limit,
stated under the editor: that in-app compiler has no exception support, so
`throw` and `try` need the Mac's compiler. It is a one-time download of about
105 MB, which the app keeps.

## 1.0.10

**The app notices an update while you are using it.** It used to ask GitHub
once, a few seconds after launch, and then never again — so a release that
went up while ORBIT was already open stayed invisible, and Settings kept
saying you were up to date, because the last time it asked, you were. It now
asks again every half hour, and when you come back to the window after being
away. Nothing else changes: the bell lights the same way it always did.

## 1.0.9

**The search box looks like part of the app now.** Every result carries its
track's own colour — the one GNC or Coding already has in the sidebar — so a
lesson is findable by hue before you have finished reading the line. Pages and
settings get their own. The first result is tinted and marked with ↵, because
that is the one Enter takes.

## 1.0.8

**A bell beside the profile button.** Everything waiting on you in one place:
reviews that have come due, a lesson you stopped halfway through, and an
update ready to install. Each line goes straight to the thing itself. A dot
appears when there is something, red when it is overdue or blocking.

**You get told when a new temporary role goes up at Hawthorne.** They do not
stay posted long, so a new one sits at the top of the bell. It clears once you
have looked at the Jobs page.

## 1.0.7

**A search box.** It sits at the top of every page. Type two letters and it
finds lessons, modules, tracks, pages and the settings that are easy to lose —
reading speed, backups, the update check. Enter takes the first result.

It matches plainly: names that contain what you typed, with names that start
with it first. Nothing clever, so nothing surprising.

## 1.0.6

**Reading speed now has a setting.** It sits in Settings under Scheduling, and
matches the picker above a lesson — whichever you set last is the one you
keep, between sessions.

**The read-aloud player stopped losing track of itself.** Three separate
faults: two voices could end up reading at once and fight over the position,
a speed you chose mid-lesson never actually reached the voice, and a missed
internal resume could leave a lesson silent while the controls still showed
it playing.

**Formulas are read correctly.** Range rate was being spoken as range, and
line-of-sight rate as the angle itself — a rate read as the quantity, right
through a guidance derivation. A division was silent, so a quotient sounded
like a product. A minus opening a term went missing, so negative values were
read as positive.

**Sentences finish.** A displayed equation stays in the sentence that
introduces it instead of leaving the voice stopped halfway, and every phrase
now ends on something the synthesiser can hear — a full stop where the
thought is complete, a comma where a long sentence was split and there is
more coming.

**Changing speed or voice mid-lesson is smooth.** The change settles, then the
current sentence is re-read with it, so stepping through the speeds no longer
stutters at every step.

## 1.0.5

**The playground says why a language did not run.** It used to blame the
browser whatever the real reason was, which was the wrong answer inside the
desktop app and hid the line naming the compiler and how to install it.

## 1.0.4

**C++, Rust, MATLAB and shell reach a compiler again.** A Mac app started from
the Dock does not inherit your Terminal's PATH, so Homebrew, rustup and
MacPorts were invisible to it. Toolchains are now looked for where they
actually install themselves, including inside `Octave.app` and `MATLAB.app`.

**A compiler that is not really there is no longer announced as ready.** A Mac
without the Xcode command line tools still has a `clang++` that only prints an
error; it was being read as a working compiler.

**A cold compiler gets time to start.** The first build on a cold machine was
being cut off at thirty seconds and reported as a failure.

## 1.0.3

**The GNC and career tracks, taught end to end.** Every module of Foundations
& Math, GNC Preparation and Career Readiness has its lessons written — 100% of
the topics on each syllabus.
