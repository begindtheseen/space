---
id: l11-binary-files-and-locking
title: Binary files, Simulink models and locking
minutes: 22
covers:
  - "Binary-file pain: model locking for Simulink and CAD assets"
---

Every tool in this module so far has leaned on one quiet assumption: that a file is made of lines, and that two people's changes to different lines can be combined. Rebase, cherry-pick, the three-way merge and code review all work on lines.

Some of the most important files on a GNC team break that assumption. The attitude controller may live in a **Simulink model** — a block diagram of gains, integrators and saturation limits that engineers edit by dragging boxes and wires. The star-tracker bracket lives in a **CAD part**. Neither is a list of lines, so none of the tools above can combine two people's edits to one.

In the basics module (lesson 08) you set up the defences on the Git side: mark such files `binary` in `.gitattributes`, store the big ones with Git LFS, and remember that a model conflict can only be settled by choosing one whole file. This lesson, the last in the module, is about the *team* side: why "prevent, don't resolve" is the only workable rule, how **file locking** enforces it, how to review a model change you cannot read as text, and how to arrange a project so that fewer people ever need the same binary file at once.

## Why a model cannot be merged like code

Picture two people editing the same printed photograph. One darkens the sky; the other crops out a lamppost. There is no way to lay the two prints on top of each other and get "both changes" — each print is a single whole thing. Text is different: it is more like a shopping list, where one person crossing out "milk" and another adding "eggs" combine without trouble.

A Simulink model saved as **`.slx`** — the default format since release R2012b — is a **[[compressed package|slx-inside]]**: a ZIP archive holding XML files (XML is a text format of nested, named tags, like `<Block Name="Kp">…</Block>`) and other parts that together describe the diagram. Change one gain from 0.80 to 0.70, and after compression most bytes after that point come out different. Git sees two unrelated blobs of noise.

Simulink can also save models in the older **`.mdl`** format, which is plain text. That makes `git diff` readable, but it does not make merging safe. A model file is not a list of independent lines. Blocks refer to each other by internal identifiers, wires refer to block ports, and graphical positions are stored alongside. A line-by-line merge can produce a file that is perfectly valid *text* and still describes a broken or subtly different *model* — a wire connected to the wrong port, two blocks with the same identifier. That is worse than a conflict, because nobody is told.

CAD is the same story. Native part and assembly files are binary. Even neutral text formats such as STEP describe geometry as long lists of numbered entities that refer to each other, and no text merge understands them.

::: key Why concurrent model edits cannot be merged
A Simulink `.slx` is a compressed package, and even text formats like `.mdl` are not line-oriented in meaning, so a three-way text merge produces a corrupt or meaningless model. The same holds for CAD parts. Teams therefore prevent concurrent edits (locking, one owner per file) and compare versions with the modeling tool, rather than resolving model conflicts in a text editor.
:::

So a conflict on a model always ends the way the basics module showed: one side is kept whole, and the other person's work is redone by hand in the modeling tool — sometimes a day lost. The real fix is to make sure two people never edit the same model in parallel. That is what locks are for.

## Locks: one editor at a time

A **lock** is a note, kept on a shared server, that says "this file is being edited by this person; nobody else may change it until they release it". It is the library's "checked out" stamp. Git itself has no locks — its whole design is that everyone may change everything and sort it out at merge time. Git LFS adds them.

You met the setup briefly in the basics module. Marking a pattern **lockable** adds an attribute to `.gitattributes`:

```bash
git lfs track --lockable "*.slx"
cat .gitattributes
```

```text
Tracking "*.slx"
*.slx filter=lfs diff=lfs merge=lfs -text lockable
```

Two things follow from that one word `lockable`.

1. **Lockable files are checked out read-only.** Git LFS clears the file's write permission on checkout, so your editor or modeling tool cannot save it by accident. The file is a reminder: "take the lock before you touch me."
2. **The server keeps the lock list,** and the Git LFS commands read and change it: `git lfs lock <path>`, `git lfs locks`, and `git lfs unlock <path>`.

The whole lock workflow below was run for real, with Git LFS 3.4 and a small test LFS server standing in for a hosting service. (The words a server prints after an error, such as "already created lock", are the server's own and differ between hosting services.)

::: example Maya and Ravi share the attitude model
**Ravi clones.** The model arrives [[read-only|read-only-bit]] — `r--`, read but no write, for everyone (`stat -c '%A %n'` prints a file's permissions and name):

```bash
stat -c '%A %n' models/attitude.slx
```

```text
-r--r--r-- models/attitude.slx
```

**Maya takes the lock.** She needs to retune the proportional gain `Kp`:

```bash
git lfs lock models/attitude.slx
stat -c '%A %n' models/attitude.slx
git lfs locks
```

```text
Locked models/attitude.slx
-rw-r--r-- models/attitude.slx
models/attitude.slx	Maya Chen	ID:1
```

Her copy became writable (`rw-`), and the server now lists the lock with her name and an ID.

**Ravi tries to take it too.** He wanted to change `Kp` for a different reason:

```bash
git lfs locks
git lfs lock models/attitude.slx
```

```text
models/attitude.slx	Maya Chen	ID:1
Locking models/attitude.slx failed: already created lock
```

Refused. He can see who has it, and he walks over to talk to her — which is the real point of a lock.

**Suppose he edits anyway.** He makes his copy writable by hand, changes the gain to 0.95, commits, and pushes:

```bash
chmod u+w models/attitude.slx
git commit -am "Raise Kp to 0.95"
git push origin main
```

```text
Unable to push locked files:
* models/attitude.slx - Maya Chen (refs: main)
Cannot update locked files.
error: failed to push some refs to '.../orbit-sim.git'
```

The push is stopped: Git LFS's [[pre-push check|pre-push-hook]] asked the server about locks, found that he changed a file Maya holds, and refused. He throws his local commit away (`git reset --hard origin/main`) and waits.

**Maya finishes.** She saves the model with `Kp` = 0.70 (to leave more [[margin against flexible modes|flex-mode]]), commits, pushes, and releases the lock:

```bash
git commit -am "Lower attitude Kp to 0.70 for flex-mode margin"
git push origin main
git lfs unlock models/attitude.slx
```

```text
Consider unlocking your own locked files: (`git lfs unlock <path>`)
* models/attitude.slx
Uploading LFS objects: 100% (1/1), 255 B | 0 B/s, done.
To ../orbit-sim.git
   43d90e9..9afb24e  main -> main
Unlocked models/attitude.slx
```

The first two lines are Git LFS reminding her, during the push, that she still holds a lock. After `unlock`, `git lfs locks` prints nothing, and her copy is read-only again.

**Ravi's turn.** He pulls first, then locks:

```bash
git pull
git lfs lock models/attitude.slx
```

```text
Locked models/attitude.slx
```

**Check.** Reading the gain out of Ravi's file now gives `0.70` — Maya's value. He starts from her version, not from the stale one he had; his change will be made *on top of* hers, in the modeling tool, and no merge will ever be needed. At every moment, exactly one person could push a change to the model.
:::

### Two rules the example hides

**Lock, then pull.** Ravi pulled and then locked, which worked because Maya had already pushed and unlocked. The watertight order is the other way round: take the lock first, *then* pull. Once you hold the lock nobody else can push the file, so what you pull is guaranteed to be the latest. Pull-then-lock leaves a gap in which someone else can push a newer version you never see ([[timeline|lock-timeline]]).

**Unlock only what you have pushed.** Git LFS refuses to release a lock on a file with uncommitted changes:

```bash
git lfs unlock models/attitude.slx
```

```text
Cannot unlock file with uncommitted changes
```

That protects you from releasing a model while your edits are still only on your laptop. Commit and push, *then* unlock. If you decide to throw your edits away, restore the file first (`git checkout -- models/attitude.slx`), and the unlock goes through.

::: warning A lock is a strong convention, not a vault
The refusal Ravi saw came from Git LFS's pre-push hook on *his* machine, which asks the server about locks. The read-only flag is an ordinary file permission anyone can change. Someone without Git LFS installed, or with its hooks switched off, is not stopped by either. Some hosting services also enforce locks on the server; check what yours does. Either way, locks work because the team agrees to use them, and the tooling makes breaking the agreement noisy.
:::

### Stale locks

The commonest lock problem is a lock nobody is using: someone locks the guidance model and goes on vacation. `git lfs locks` shows every owner, so the first step is to ask. If that fails, **`git lfs unlock --force <path>`** breaks another person's lock — whether you are allowed to is up to the server's permission rules, and on most teams it is reserved for leads. Breaking a lock does not delete the owner's local edits; it only means they can no longer push them without a conversation. Good team rules: lock only when you are about to edit, push and unlock the same day, and never lock "just in case".

::: key Lock workflow for binary models
Mark the pattern lockable (`git lfs track --lockable "*.slx"`) so files check out read-only. To edit: `git lfs lock <path>`, then `git pull`, then edit, commit, push, and `git lfs unlock <path>`. `git lfs locks` lists who holds what; `git lfs unlock --force` breaks a stale lock where the server allows it.
:::

## Reviewing a change you cannot read

Lesson 07 said a reviewer should check correctness, tests, interfaces, units and frames. How do you do that for a change to a model, when `git diff` on an LFS file shows only this?

```diff
diff --git a/models/attitude.slx b/models/attitude.slx
index 2284a71..28f86e0 100644
--- a/models/attitude.slx
+++ b/models/attitude.slx
@@ -1,3 +1,3 @@
 version https://git-lfs.github.com/spec/v1
-oid sha256:275f8cad8c7837d7a4d75639545460bf82d0ddb4eba71159a75815e4bdc78da5
+oid sha256:d1aac72672f923928742647ecff2097f6183be7363c4dd2e0bd24c224eb1f8a6
 size 255
```

That is the LFS pointer changing: *something* in the model changed, and the reviewer learns nothing about what.

The real answer is the modeling tool's own comparison. MathWorks ships a **[[comparison tool|model-compare]]** that opens two versions of a model and shows the differences as a diagram and a tree of changed blocks and parameters. Simulink's project and source-control integration can launch it on two revisions from the repository. Many teams attach its report, or a screenshot of the changed blocks, to the pull request, so the reviewer can see "Gain `Kp`: 0.80 → 0.70" without opening MATLAB.

For a first look from the command line, Git itself can help a little. A **textconv** diff driver is a program that turns a file into readable text *only for display*; Git diffs the text and never changes what is stored.

::: example A readable diff for a zipped model
In a practice repository without LFS, the model is marked `binary` but given a diff driver named `slx`:

```text
*.slx binary diff=slx
```

Later attributes on a line win, so `binary` turns off text diffing, merging and line-ending changes, and then `diff=slx` turns diffing back on, through the named driver. The driver is a three-line shell script, `tools/slx2txt`, that prints the XML inside the ZIP with one tag per line:

```bash
#!/bin/sh
# Print the XML inside a zipped model, one tag per line, for reading diffs.
unzip -p "$1" | sed 's/></>\n</g'
```

It is registered in the repository's configuration:

```bash
git config diff.slx.textconv tools/slx2txt
git check-attr diff merge text -- models/attitude.slx
```

```text
models/attitude.slx: diff: slx
models/attitude.slx: merge: unset
models/attitude.slx: text: unset
```

Merging stays off — the driver is for *reading* only. Maya changes the gain from 0.80 to 0.70 and compares the two views. `git diff --no-textconv` shows what Git sees by default:

```text
Binary files a/models/attitude.slx and b/models/attitude.slx differ
```

`git diff` with the driver shows:

```diff
@@ -2,7 +2,7 @@
 <ModelInformation>
 <Model Name="attitude">
 <Block BlockType="Gain" Name="Kp">
-<P Name="Gain">0.80</P>
+<P Name="Gain">0.70</P>
 </Block>
 </Model>
 </ModelInformation>
```

**Check.** One parameter line changed, with the block type and name as context — a reviewer can now ask "why 0.70, and where is the stability margin analysis?". But notice the limits. The practice model has one block; a real `.slx` holds thousands of lines of XML, much of it layout, and a moved block shows up as a wall of changed coordinates. The `git config` line lives in each clone's own configuration, not in the repository, so every reviewer must set it up. And a readable diff still is not a mergeable file. Use this for a quick look; use the modeling tool's comparison to review.
:::

## Arranging the work so fewer people collide

Locks stop two edits from colliding, but they also make people wait. The better the project is arranged, the less anyone waits. Four habits help most.

**Split big models.** One enormous model of the whole GNC system means one lock for the whole team. Simulink can split a design across separate files — **referenced models** and **referenced subsystems**, each saved in its own file and used as a block by the model above it. Give the attitude controller, the navigation filter and the guidance law their own files, and three engineers can hold three different locks at once ([[picture|model-split]]).

**Take the numbers out of the diagram.** Much of the churn on a controller model is not structure but tuning: gains, limits, filter constants. Keep those values in a **text** file that the model reads — a MATLAB script, a data file, a table — and a retune becomes a one-line text change that Git diffs, merges and reviews like any code. The model file changes only when the *structure* changes, which is rarer.

**One owner per model.** Name an owner for each model file in CODEOWNERS (lesson 06), so every change to it is reviewed by the person who knows it best, and so everyone knows whom to ask about a lock.

**Keep some things out of Git.** Git is not the only version-control system on an aerospace program. Mechanical teams usually manage CAD in a **[[PDM or PLM system|pdm-plm]]**, which was built around check-out/check-in locking, part numbers and release approval from the start; the software repository then holds only exported artifacts it needs, such as a mass-properties table, as text. Large generated or recorded files — simulation outputs, flight logs — often belong in an artifact store or data archive, with only a small text reference in Git. The test is the one from the basics module: commit what a person wrote and must merge; keep elsewhere what a machine made or a specialist tool manages better.

::: warning Do not "fix" a model conflict in a text editor
If a merge stops on a model file, never open it in a text editor and try to stitch the halves together — even an `.mdl` that looks readable. Choose one whole side with `git checkout --ours` or `--theirs`, commit, and then redo the other person's change in the modeling tool, using the comparison tool to see exactly what it was. Then ask why the file was not locked.
:::

## Check yourself

::: check Merge the model?
Ravi says: "We saved our Simulink models as `.mdl` text files, so now Git can merge them like code." Give two reasons that is not safe.
:::

::: answer
First, a model's meaning is not line-by-line: blocks and wires refer to each other through internal identifiers and port numbers, so combining lines from two versions can produce text that parses but describes a broken or different model — a wire to the wrong port, a duplicated identifier — and Git reports no conflict at all. Second, even when the merge "works", nobody reviewed the combined model as a model; the result was never opened, simulated or compared in the tool. Text format helps reading diffs, not merging. The team still needs locks or single ownership.
:::

::: check Read the listing
`git lfs locks` prints `cad/tracker_bracket.SLDPRT	Leo Park	ID:14` and `models/nav_filter.slx	Maya Chen	ID:9`. You need to change the navigation filter. What do you do, in order, and what do you avoid?
:::

::: answer
Maya holds the lock on `models/nav_filter.slx`, so you talk to her first — perhaps she is almost done, or your change can go into hers. Do not make the file writable and edit anyway: your push would be refused by the lock check, or worse, you would do work that has to be redone by hand. When she has pushed and unlocked, run `git lfs lock models/nav_filter.slx`, then `git pull` so you have her latest version, then edit, commit, push and unlock. Leo's lock on the CAD bracket does not affect you.
:::

::: check Pull, then lock?
Explain with a timeline how "pull, then lock" can go wrong, while "lock, then pull" cannot.
:::

::: answer
Pull-then-lock: at 10:00 you pull and have version A. At 10:01 Leo, who held the lock, pushes version B and unlocks. At 10:02 you lock successfully — but your copy is still A. You edit on top of A, and your push either fails (Git sees your branch is behind) or, after you pull, the two versions of one binary file conflict, and one person's work must be redone. Lock-then-pull: you can only take the lock after Leo has released it, and while you hold it nobody can push the file. So the pull right after locking gives you the newest version, and nothing can change under you.
:::

::: check Why only "Binary files differ"?
A reviewer complains that pull requests changing `models/*.slx` show nothing useful in the diff. Name two things the team can do so the reviewer can check the change, and say what each cannot do.
:::

::: answer
(1) Attach a report or screenshot from the modeling tool's model comparison to the pull request, showing changed blocks and parameter values; that is the real review view, but it relies on the author producing it, and it is not generated by Git. (2) Configure a textconv diff driver that unpacks the model and prints its XML, so `git diff` shows changed parameter lines; that gives a quick look, but it is noisy for real models, must be set up in each clone's configuration, and does nothing to make the file mergeable. A third option is to move tunable values into a text parameter file, so most changes are ordinary text diffs.
:::

::: check Split the work
Four engineers must change the same `gnc_top.slx` model this week: one retunes attitude gains, one replaces the navigation filter, one edits the guidance law, one fixes a wiring label on the top-level diagram. With one lockable file, how does the week go, and what two changes to the project would let them work in parallel?
:::

::: answer
With one lock, they queue: each waits for the previous person to push and unlock, so four changes that could take a day each take four days in a row, and a forgotten lock blocks everyone. Two fixes: split the model into referenced models or referenced subsystems — attitude, navigation, guidance, each in its own file with its own owner and lock — so three of them work at once; and move the attitude gains into a text parameter file, so the retune is an ordinary text change that needs no model lock at all. Only the wiring-label fix still needs the top-level model.
:::

## Summary

| Command or idea | Meaning |
| --- | --- |
| `.slx` | Simulink's default model format: a compressed package of XML and other parts |
| `.mdl` | older text model format; readable diffs, still not safely mergeable |
| prevent, don't resolve | binary models and CAD cannot be three-way merged, so stop concurrent edits |
| lock | server-side note: one person may change this file until they release it |
| `git lfs track --lockable "*.slx"` | adds `lockable`; such files check out read-only |
| `git lfs lock <path>` / `unlock <path>` | take or release a lock; unlock refuses with uncommitted changes |
| `git lfs locks` | list locks, owners and IDs |
| `git lfs unlock --force <path>` | break someone else's lock, where the server allows it |
| lock, then pull | the order that guarantees you edit the newest version |
| pre-push lock check | Git LFS refuses to push changes to files another person has locked |
| textconv driver | `diff.<name>.textconv`: shows a binary file as text for diffs only |
| model comparison tool | the modeling tool's own diff; the real way to review a model change |
| referenced models, parameter files, owners | split files so fewer people need the same lock |
| PDM/PLM | the CAD world's own version control, built around check-out and release |

That completes the module. You can now keep your own history clean with rebase, share it safely with merges and `--force-with-lease`, run a team workflow with small reviewed pull requests, ship and patch releases, bring in other people's code on purpose — and keep Git from mangling the files it was never built to merge. Later modules on Docker and continuous integration put this toolkit to work: CI is the machine that runs the required checks on every pull request.

::: context slx-inside What is inside an .slx file
MathWorks describes the SLX format as a compressed package following the Open Packaging Conventions, the same kind of container that Microsoft Office uses for `.docx` files. Rename a copy to `.zip` and you can open it: inside are XML files describing the block diagram, plus files of package metadata. That is why a tiny edit changes most of the saved bytes — the XML is compressed, and compression reshuffles everything after the change.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="120" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="22" y="30" font-size="12" font-weight="bold" fill="#1f2a44">attitude.slx  (a ZIP package)</text>
  <rect x="24" y="44" width="150" height="34" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="99" y="65" font-size="11" text-anchor="middle" fill="#1f2a44">block diagram XML</text>
  <rect x="186" y="44" width="150" height="34" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="261" y="65" font-size="11" text-anchor="middle" fill="#1f2a44">other XML parts</text>
  <rect x="24" y="86" width="312" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="105" font-size="11" text-anchor="middle" fill="#1f2a44">package metadata: content types, relationships</text>
</svg>
```
:::

::: context read-only-bit The permission letters
On Linux and macOS every file carries permission bits, shown by `ls -l` or `stat` as ten characters. The first says the kind of entry (`-` for a plain file). Then come three groups of three — for the file's owner, its group, and everyone else — each reading `r` (may read), `w` (may write) and `x` (may run), with `-` for "no". So `-r--r--r--` is "everyone may read, nobody may write", and `-rw-r--r--` adds write permission for the owner. Windows has a similar "read-only" flag, which Git LFS sets there instead.
:::

::: context pre-push-hook Hooks: scripts Git runs for you
A **hook** is a script in `.git/hooks/` that Git runs at a certain moment: before a commit, after a checkout, before a push. `git lfs install` adds several, including `pre-push`, which uploads LFS payloads and — when lock checking is on — asks the server whether any file you changed is locked by someone else. If a hook exits with an error, Git stops the operation. Hooks live in each clone and are not shared through the repository, which is why a lock check is only as good as everyone's setup.
:::

::: context flex-mode Why a lower gain can be safer
A spacecraft is not perfectly rigid. Solar arrays and antennas bend and wobble at their own natural frequencies, called **flexible modes**. An attitude controller with too high a gain can push energy into a wobble and make it grow. Lowering the proportional gain `Kp` makes the controller gentler, leaving more **margin** — room for error before the loop becomes unstable — at the cost of slower pointing. A change like 0.80 to 0.70 is exactly the kind a reviewer should see justified with an analysis, not only a diff.
:::

::: context lock-timeline Why the lock must come first
Two orders of the same two commands, and the gap one of them leaves. In the top row, Leo pushes version B after your pull but before your lock, so you edit an old copy. In the bottom row, taking the lock first closes the gap: nobody can push the file while you hold it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" font-weight="bold" fill="#b4232c">pull, then lock</text>
  <line x1="20" y1="50" x2="340" y2="50" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="70" cy="50" r="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="70" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">you pull A</text>
  <circle cx="170" cy="50" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="170" y="36" font-size="11" text-anchor="middle" fill="#1f2a44">Leo pushes B</text>
  <circle cx="270" cy="50" r="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="270" y="72" font-size="11" text-anchor="middle" fill="#b4232c">you lock, edit A</text>
  <text x="10" y="102" font-size="12" font-weight="bold" fill="#1d6fd1">lock, then pull</text>
  <line x1="20" y1="132" x2="340" y2="132" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="70" cy="132" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="70" y="154" font-size="11" text-anchor="middle" fill="#1f2a44">Leo pushes B</text>
  <circle cx="170" cy="132" r="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="170" y="118" font-size="11" text-anchor="middle" fill="#1f2a44">you lock</text>
  <circle cx="270" cy="132" r="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="270" y="154" font-size="11" text-anchor="middle" fill="#1d6fd1">you pull B, edit B</text>
</svg>
```
:::

::: context model-compare Comparing models in the tool
MathWorks' comparison tool takes two versions of a model — two files, or two revisions from source control through a Simulink project — and shows them side by side, highlighting added, deleted and changed blocks, lines and parameter values, and it can produce a report of the differences. Recent releases also offer tools for resolving conflicts in models inside projects under source control. Which features you have depends on your MATLAB release and licenses, so check your own installation's documentation.
:::

::: context model-split One big model, or several small ones
With one top-level file, every change needs the same lock. Split the design into referenced models, each in its own file, and each part has its own lock and its own owner. The top-level model only wires the parts together, so it changes rarely.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="110" y="10" width="140" height="34" rx="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="31" font-size="11" text-anchor="middle" fill="#1f2a44">gnc_top.slx</text>
  <rect x="10" y="94" width="104" height="34" rx="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="62" y="115" font-size="11" text-anchor="middle" fill="#1f2a44">attitude.slx</text>
  <rect x="128" y="94" width="104" height="34" rx="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="115" font-size="11" text-anchor="middle" fill="#1f2a44">nav_filter.slx</text>
  <rect x="246" y="94" width="104" height="34" rx="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="298" y="115" font-size="11" text-anchor="middle" fill="#1f2a44">guidance.slx</text>
  <line x1="150" y1="44" x2="70" y2="92" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="44" x2="180" y2="92" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="210" y1="44" x2="290" y2="92" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="62" y="144" font-size="11" text-anchor="middle" fill="#6c7a93">Maya's lock</text>
  <text x="180" y="144" font-size="11" text-anchor="middle" fill="#6c7a93">Ravi's lock</text>
  <text x="298" y="144" font-size="11" text-anchor="middle" fill="#6c7a93">Leo's lock</text>
</svg>
```
:::

::: context pdm-plm Version control for parts, not code
**PDM** (product data management) and **PLM** (product lifecycle management) systems are the version control of the mechanical world. Engineers check a part or assembly *out*, which locks it, and check it back *in*; the system tracks part numbers, which assemblies use which revision of a part, and formal release approvals. Examples include SOLIDWORKS PDM, Siemens Teamcenter and PTC Windchill. Aerospace programs typically run one of these for hardware and Git for software, with agreed hand-off points between them.
:::
