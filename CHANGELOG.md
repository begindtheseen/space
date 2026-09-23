# Changelog

What changed in each version, in the words of someone using the app rather
than someone who wrote it. The app reads this file: the entry for a version
you are about to install is what the update panel shows you beforehand, and
the entry for the one you are running is what Settings shows you afterwards.

Newest first. Each heading is exactly `## <version>` so both readers can find
it.

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
