# claude/learn-python-b: Python expert and Python projects

Both courses are rewritten in the plain voice with context notes, carry `@plainvoice true`, and
`npx vitest run src/learn` passes (65 tests). Every Python solution was also run through the real grader
(`buildProgram` + python3 + `gradeRun`): each passes all its checks and no starter passes.

## Python · Expert (`python.expert.txt`)

15 lessons: 14 rewritten, 1 added. 101 context notes, 20 with svg pictures.

| Lesson | Notes | Pictures | What changed besides the voice |
| --- | --- | --- | --- |
| py4-01 Closures and late binding | 6 | 1 | Opens the course with a map; links the fix to "defaults are evaluated once" (py2-07). |
| py4-02 Descriptors | 7 | 2 | Teaches `__dict__`, `vars()` and class attributes first (the checks rely on them); `isinstance` with a tuple; why `True` is an `int`. |
| py4-03 Class hooks | 5 | 1 | A class statement runs as code; inherited `name = None`; `NotImplementedError`; `type(name, bases, ns)` (used by the checks). |
| py4-04 send and yield from | 7 | 2 | Traces `send` step by step; the error when `next()` is skipped; `StopIteration.value`. |
| py4-05 asyncio | 7 | 1 | Timeline picture of sequential waits against `gather`. |
| py4-06 heapq and bisect | 7 | 1 | Heap drawn as a tree with list indexes; running median worked as a table. |
| py4-07 Protocols and generics | 7 | 1 | Type hints, `Iterable` and `Sequence` taught step by step (never taught before). |
| py4-08 Testing | 7 | 1 | `is True` and why; a boundary example. |
| py4-09 Pure logic, thin I/O | 8 | 2 | `sys`, `input()` against `sys.stdin.read()`, `__name__`, functions as values. |
| py4-10 Floating point | 6 | 1 | `divmod`, `sum`'s start value, `rel_tol=` / `abs_tol=`. |
| py4-11 Edit distance | 6 | 1 | Worked kitten → sitting table, one cell step by step. |
| py4-12 Dijkstra | 7 | 1 | Heap order walked through, including the stale entry. |
| py4-13 A tokenizer | 6 | 2 | |
| **py4-13b A parser for + - * / (new)** | 6 | 2 | Split out of py4-14: grammar notation, the Parser class with `peek()`/`take()`, and `expr`/`term`/`atom` for `+ - * /` and brackets. Starter is the tokenizer plus a stub; 7 checks (precedence, brackets, left-to-right, decimals, agreement with Python, 20,001 terms, no `eval`). |
| py4-14 Recursive-descent calculator | 7 | 1 | Now builds on py4-13b: adds `unary`, `power` and the error checks. |

## Python · Projects (`python.projects.txt`)

16 lessons rewritten, none added. 110 context notes, 26 with svg pictures.

| Lesson | Notes | Pictures | Notes |
| --- | --- | --- | --- |
| pyp-01 | 7 | 2 | Walks through `partition` and `ljust`; usage-line notation. |
| pyp-02 | 7 | 2 | Adds the sorted set comprehension step `categories()` needs; `//`, `%`, `:,`, `:02d` in words. |
| pyp-03 | 6 | 2 | Tuple sort key in words. |
| pyp-04 | 7 | 1 | `run` in four steps; `extend` against `append`. |
| pyp-05 | 8 | 2 | Regular expressions and HTML from scratch (no earlier course teaches `re`); seven small steps. |
| pyp-06 | 5 | 1 | |
| pyp-07 | 4 | 1 | |
| pyp-08 | 6 | 1 | "Well under a hundred lines" corrected to "about a hundred" (the solution is 100). |
| pyp-09 | 8 | 2 | |
| pyp-10 | 7 | 1 | |
| pyp-11 | 9 | 1 | `json`, `isoformat`, `@classmethod`, `raise ... from`, `Book(**d)` explained; kept as one lesson because its checks need both directions. |
| pyp-12 | 5 | 2 | `timedelta` date arithmetic. |
| pyp-13 | 8 | 2 | Undo stack; shallow against deep copy. |
| pyp-14 | 9 | 2 | Name tokens, `let`, its own error class, "Python's `^` is not power". |
| pyp-15 | 7 | 2 | `{1,2}`, `fullmatch`, `:04d`. |
| pyp-16 | 7 | 2 | Ends the Python ladder with a bridge note to the C++ courses. |

## Problems in the module definitions

- **pyp-14 solution (fixed).** `Interpreter().execute("0 ^ -1")` raised `ZeroDivisionError`
  ("0.0 cannot be raised to a negative power") although the spec says errors never raise. Fix applied:
  `except (OverflowError, ValueError, TypeError) as err:` → `except (OverflowError, ValueError, TypeError, ZeroDivisionError) as err:`.
  It now replies `error: 0.0 cannot be raised to a negative power`; all checks still pass. No check covers
  this case; a `--- check case` for `Interpreter().execute("0 ^ -1")` starting with `error:` would be worth adding.
- **Markdown the renderer cannot show (fixed in the prose).** `src/lib/markdown.tsx` handles only
  single-backtick code spans and ends a fence at any line starting with three backticks. pyp-05 (a table cell
  and hint 1) used double backticks, and pyp-08 had backticks inside inline code and a four-backtick fence.
  Reworded; neither course now has a double-backtick span or a four-backtick fence. Other courses may have the same.
- **py4-02 (no change needed).** The solution rejects `bool` but no check tests it; the lesson now explains why.
- **py4-05 (tooling note).** The task uses top-level `await`, which the app allows (Pyodide `runPythonAsync`)
  but plain `python3` rejects; any offline runner must compile with `ast.PyCF_ALLOW_TOP_LEVEL_AWAIT`.
- **py4-14's closing note** described the capstone as `x = 3`; corrected to `let x = 3`, the syntax pyp-14 uses.

No other starter, solution or check was changed; lesson ids are unchanged.
