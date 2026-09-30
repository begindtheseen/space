# Practice and tests for the coding modules

ORBIT's coding modules (`cod_*`: Linux, Git, Python, C++, SQL, Rust, MATLAB, Simulink, CAD,
Docker and CI, debugging, interviews) get the same treatment as Learn to code:

- **A practice set under every lesson:** 6 graded items (5 at the least, 8 at the most). They are
  runnable problems where the language runs in ORBIT, and questions where it does not.
- **A module test at the end.** Every module that builds on this one stays locked until the test
  is passed.

Read `PRACTICE.md` first. Everything in it applies here: the climb, the checks, the rules, the
gate and its questions. This file only adds what is different for modules.

## The file

There is one file per module: `src/learn/modules/<module id>.txt`.

````text
@track python
@course mod-cod_py_01_basics
@module cod_py_01_basics
@title Python basics: practice and test

=== py01-l01 | Practice: Hello, Python
--- for
l01-hello-python

+++ practice | …
--- task
…
+++ question | …
--- ask
…

=== py01-l02 | Practice: …
--- for
l02-…

=== py01-test | Python basics: module test
--- teach
What the test covers, in two to four sentences.
--- gate
pass 7
questions 9
minutes 130

+++ problem | …
+++ question | …
````

- `--- for` names the module lesson the set belongs to: the `id:` in that lesson's frontmatter
  (`src/curriculum/lessons/<module>/<nn>-<slug>.md`). Every lesson of the module gets one set,
  in lesson order.
- Set ids are `<short>-lNN`, and the test is `<short>-test`. The short name is the module's
  language and number: `py01`, `cpp04`, `lnx02`, `sql03`, `rs02`, `mat01`, `slk03`, `cad02`,
  `ops01`, `dbg01`, `int01`, `git02`.
- A set has no teach and no task of its own. The lesson in the module is the explanation.

## Which language runs

| Modules | `@track` | Practice and test |
|---|---|---|
| `cod_py_*`, `cod_int_*` | `python` | Problems, plus a few questions per set |
| `cod_cpp_*` (not `cpp_10_cmake`) | `cpp` | Problems (`-std=c++20`, no exceptions; no GoogleTest, Eigen or threads beyond what `<thread>` compiles), plus questions |
| `cod_sql_*` | `sql` | Problems on a `--- schema`, plus questions |
| `cod_lnx_*` | `bash` | Practice-shell problems, plus questions |
| `cod_git_*` | `git` | Practice-shell git problems, plus questions |
| `cod_cpp_10_cmake`, `cod_rs_*`, `cod_mat_*`, `cod_slk_*`, `cod_cad_*`, `cod_ops_*`, `cod_dbg_01` | `python` (a label only) | Questions only |

For a problem, read what the practice shell and the runtimes can do before you rely on it:
`src/lib/shell` for the terminal, and `PRACTICE.md` for the rest. When a skill cannot run in
ORBIT, test it with questions instead. The code goes in the question, and the learner predicts
what it does, finds the bug, or picks the right line.

A questions-only test has no problems. It has **at least 12 questions**, no `pass` line, and
`questions N` at about 80%.

## What a set holds

- **6 items**, climbing as `PRACTICE.md` describes: warm-up, variation, combine, edge cases,
  debug, stretch.
  - Runnable modules: 4 to 6 problems, plus 0 to 2 questions on the why.
  - Questions-only modules: 6 questions of the kinds `PRACTICE.md` lists.
- **Only what the module has taught up to that lesson, and its prerequisite modules.** Read the
  lesson and the ones before it. Use the lesson's own names, data and ORBIT setting where they
  fit, but never copy one of its examples or its `::: check` answers.
- **Questions teach.** Every `--- why` explains the point. Wrong choices are real misconceptions.

## The test

- **Runnable modules:** 8 to 10 problems (pass about 70%) and 10 to 12 questions (about 80%),
  about 10 minutes a problem plus 1 minute a question.
- **Questions-only modules:** 12 to 16 questions (about 80%), about 1.5 minutes a question.
- Unseen: never reuse a practice item.
- It covers the whole module, and most items combine lessons. A learner who passes it is ready
  for the modules that build on this one.

## Checking your work

```sh
LEARN_ONLY=mod-cod_py_01_basics npx vitest run src/learn/solutions.test.ts   # every problem, run for real
npx vitest run src/learn/modules.test.ts                                     # the file's rules
```
