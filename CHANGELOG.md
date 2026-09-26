# Changelog

What changed in each version, in the words of someone using the app rather
than someone who wrote it. The app reads this file: the entry for a version
you are about to install is what the update panel shows you beforehand, and
the entry for the one you are running is what Settings shows you afterwards.

Newest first. Each heading is exactly `## <version>` so both readers can find
it.

## 1.1.3

**ORBIT updates itself, like any other app.** When a new version comes out it downloads in the
background while you work: no Settings trip, no Download button, and no new app to install. Most
updates are small (about 11 MB) and slot into the app you already have. When one is ready the bell
says so; restart when it suits you. From the next version of the app on, you do not even need to
do that: the update is simply there the next time you open ORBIT, and the rare update that needs a
whole new app downloads quietly too and goes in when you quit.

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
