---
id: l07-scope-legb-and-closures
title: Scope, the LEGB rule and closures
minutes: 19
covers:
  - Scope and LEGB; closures at a first-pass level
---

Think of a big school. Two classrooms both have a student called Sam. When the teacher in room 12 calls "Sam!", everybody knows which Sam she means: the one in her room. Only if there is no Sam in the room does anyone look down the hall. Python does the same thing with names. When you write `count` inside a function, Python has to decide which `count` you mean — one made in this function, one in a function wrapped around it, one at the top of the file, or one built into the language.

The rule it uses is short and fixed. It is also behind two errors that stop beginners cold: a counter that crashes with `UnboundLocalError` the first time you call it, and a variable that "does not exist" right after the function that made it has finished.

The same rule is why your programs can grow. The names inside a function are private to it. So you can write a hundred functions that all use `total` and `i`, and none of them trips over the others. On a real test stand, the analysis tools around the flight software run to thousands of lines. Without private names, every one of those lines would have to avoid every other.

This lesson covers the four places Python looks for a name and the order it looks in, the two statements that change the rule, and **closures** — functions that remember values from the place they were made. Closures are a first pass here: enough to read them, to write a small "function factory", and to spot the one trap that catches everybody.

## Local names exist only while the function runs

A **scope** is a region of the program where a set of names lives — like one classroom's list of students. Assigning to a name inside a function creates a **local** name, one that belongs to that function alone. It comes into existence when the line runs and disappears when the function returns:

```python
# local_gone.py
def stats():
    total = 9.79
    return total


print(stats())
print(total)
```

```bash
python3 local_gone.py
# 9.79
# Traceback (most recent call last):
#   File ".../local_gone.py", line 8, in <module>
#     print(total)
#           ^^^^^
# NameError: name 'total' is not defined
```

The first line of output is the returned value. The second is the proof that `total` never existed outside the function. A function's names live in its own private **[[namespace|namespace-table]]** — a table from names to objects — and that table is thrown away when the call ends.

So how does anything get out of a function? Two ways only. It is handed back as the `return` value, or the function changes an object the caller already had. Lesson 6 showed the second way, and lesson 8 makes a big deal of it.

## The LEGB rule

To find a name, Python searches four scopes in a fixed order and stops at the first one that has it. Read the rule aloud as "L-E-G-B":

| | Scope | What it holds |
| --- | --- | --- |
| **L** | Local | Names assigned in this function |
| **E** | Enclosing | Names local to a function that contains this one |
| **G** | Global | Names at the top level of this module (the file) |
| **B** | Built-in | Names the language provides: `len`, `print`, `sum`, `range`, … |

The order is **[[innermost outwards|legb-rings]]**: your own room first, then the room around it, then the whole school, then the town. That means a function can *read* a constant defined at the top of the file with no ceremony at all:

```python
# legb_read.py
G0 = 9.80665   # m/s^2, standard gravity


def weight(mass_kg):
    """Weight in newtons at standard gravity."""
    return mass_kg * G0


print(weight(549054.0))   # 5384380.4091
```

Walk through the three names. `mass_kg` is a parameter, so it is local. `G0` is not local and there is no enclosing function, so Python finds it at the global level. `print` is found at the **[[built-in level|builtins-module]]**, which is why you can use it without importing anything.

That mass is a Falcon 9 at lift-off, about 549 t. Its weight is about $5.38 \times 10^{6}$ N. That number is worth carrying in your head next to the vehicle's roughly $7.6 \times 10^{6}$ N of sea-level thrust: thrust beats weight, so it climbs.

### Shadowing

Because the first match wins, an inner name hides an outer one with the same spelling. This is called **shadowing**. A local name hides a global one, and a global name hides a built-in. Usually that is harmless. Sometimes it is a disaster:

```python
# shadow.py
list = [9.79, 9.80]
print(len(list))
print(list(range(3)))
```

```bash
python3 shadow.py
# 2
# Traceback (most recent call last):
#   File ".../shadow.py", line 4, in <module>
#     print(list(range(3)))
#           ^^^^^^^^^^^^^^
# TypeError: 'list' object is not callable
```

The global name `list` now points at your list. So `list(...)` tries to *call* a list, which makes no sense, and Python says so. The message `'list' object is not callable` is the fingerprint of exactly this mistake.

Never name a variable `list`, `dict`, `set`, `str`, `type`, `id`, `sum`, `min`, `max` or `input`. Most editors color built-in names differently, and that color is your hint.

::: example One name, four scopes
The rule is easiest to believe when you watch it choose. Here one name exists at three levels at once:

```python
# legb_demo.py
"""Where does a name come from? One name, three scopes."""

value = "global"


def outer():
    value = "enclosing"

    def inner():
        value = "local"
        return value

    return inner(), value


print(outer())          # ('local', 'enclosing')
print(value)            # global
print(len([1.0, 2.0]))  # 2
```

Step by step:

1. `outer()` runs and makes its own local `value = "enclosing"`.
2. It calls `inner()`, which makes *its* own local `value = "local"` and returns it.
3. Back in `outer`, its `value` is still `"enclosing"`. The assignment inside `inner` created a new local there. It did not reach out and change `outer`'s name.
4. At the top of the file, `value` is still `"global"`. Neither function touched it.
5. `len` was found at the built-in level, because nothing above defines that name.

Now the version that costs an afternoon. A running total is called `sum`, which is also a built-in:

```python
# legb_shadow.py
sum = 0.0

for s in [9.79, 9.81]:
    sum += s

print(sum)
print(sum([9.79, 9.81]))
```

```bash
python3 legb_shadow.py
# 19.6
# Traceback (most recent call last):
#   File ".../legb_shadow.py", line 8, in <module>
#     print(sum([9.79, 9.81]))
#           ^^^^^^^^^^^^^^^^^
# TypeError: 'float' object is not callable
```

(`+=`, read "plus-equals", means "add to what is already there": `sum += s` is `sum = sum + s`.)

The adding-up worked perfectly and printed 19.6. Sanity check: $9.79 + 9.81 = 19.60$. The *next* use of the built-in `sum`, anywhere in the file, fails. And the traceback points at that line, not at the assignment three screens earlier that caused it. The name to use is `total`.
:::

::: key
Name lookup is **L**ocal, then **E**nclosing function, then **G**lobal (module), then **B**uilt-in; the first match wins. Assignment inside a function creates a local name unless declared `global` or `nonlocal`. Local names vanish when the function returns.
:::

## Why the counter raises UnboundLocalError

Here is the error this rule causes. It is worth understanding rather than memorizing:

```python
# counter_bug.py
count = 0


def record():
    count += 1
    return count


print(record())
```

```bash
python3 counter_bug.py
# Traceback (most recent call last):
#   File ".../counter_bug.py", line 10, in <module>
#     print(record())
#           ^^^^^^^^
#   File ".../counter_bug.py", line 6, in record
#     count += 1
#     ^^^^^
# UnboundLocalError: cannot access local variable 'count' where it is not associated with a value
```

First, read the traceback. The bottom frame is where the error happened: line 6, inside `record`. The frame above it is the call that got there: line 10.

Now the cause. Here is the rule in its exact form: **if a name is assigned anywhere in a function's body, it is local for the whole body** — from the first line, not from the assignment onward. `count += 1` is an assignment to `count`. So `count` is local everywhere in `record`. The right-hand side then tries to read that local `count`, which has never been given a value. **Unbound** means exactly that: a name with no object tied to it yet.

The global `count = 0` is never consulted. Python made its decision from the **[[shape of the function|decided-before-running]]**, before the function ever ran.

That is what makes the error so confusing the first time. The name is right there on the screen, two lines up. It makes no difference.

::: note
The wording of this message changed in Python 3.11. Older interpreters say `local variable 'count' referenced before assignment` for the same error. Both name the same rule; 3.11 onward is the phrasing shown here.
:::

There are three fixes. Here they are in order of preference.

**Fix 1: return the new value.** The function takes the old count and hands back the new one. Nothing is hidden:

```python
# counter_return.py
def record(count):
    """Return the count, incremented."""
    return count + 1


count = 0
count = record(count)
count = record(count)
print(count)   # 2
```

**Fix 2: declare it global.** The statement `global count` tells Python that, in this body, `count` means the module-level name:

```python
# counter_global.py
count = 0


def record():
    """Increment the module-level counter. Returns the new value."""
    global count
    count += 1
    return count


print(record())   # 1
print(record())   # 2
print(count)      # 2
```

This works, and it is what `global` is for. But use it sparingly. A function that changes module state can be called from anywhere, in any order, and its result depends on what happened before. That is exactly what makes a bug hard to reproduce. In a **[[test harness|shared-state-tests]]**, global state is the reason test 7 passes alone and fails when test 3 ran first.

**Fix 3: use a closure.** That is the next section. It gives each counter its own private state.

## Closures: a function that remembers

A function can be defined inside another function. The inner one can read the outer one's local names — that is the E in LEGB. And here is the surprising part: it keeps working after the outer function has returned. The inner function, together with the outer names it uses, is called a **[[closure|closure-word]]**.

Picture a factory that stamps out limit checkers. You tell the factory the limit. It builds a checker with that limit sealed inside and hands it to you:

```python
# limit_checker.py
def make_limit_checker(limit):
    """Return a function that reports whether a value exceeds `limit`."""
    def exceeds(value):
        return value > limit
    return exceeds


ax_check = make_limit_checker(12.5)
ay_check = make_limit_checker(3.0)

print(ax_check(12.71))   # True
print(ax_check(9.81))    # False
print(ay_check(12.71))   # True
print(ay_check(0.41))    # False
```

(`>` reads "is greater than". `value > limit` is `True` or `False`.)

`make_limit_checker` has returned long before `ax_check(12.71)` is called. Its local `limit` should be gone. Yet inside `ax_check`, `limit` is still 12.5. The value is held in the **[[function object itself|closure-cell]]**, and you can look at it:

```python
# closure_cell.py
def make_limit_checker(limit):
    def exceeds(value):
        return value > limit
    return exceeds


ax_check = make_limit_checker(12.5)
print(ax_check.__closure__[0].cell_contents)   # 12.5
```

`__closure__` is read "dunder closure" — "dunder" is short for the double underscores. Python uses names like that for its own behind-the-scenes machinery.

Two checkers made by the same factory are independent. Each has its own sealed-in value. That is the big advantage over a global: no shared state, nothing to reset between runs, and a checker you can pass around like any other value.

### `nonlocal`

`nonlocal` does for an enclosing function what `global` does for the module. It lets an inner function *assign* to a name in the function around it:

```python
# counter_closure.py
def make_counter():
    """Return a function that counts its own calls."""
    n = 0

    def record():
        nonlocal n
        n += 1
        return n

    return record


c1 = make_counter()
c2 = make_counter()
print(c1(), c1(), c1())   # 1 2 3
print(c2())               # 1
```

Without `nonlocal`, `n += 1` would make `n` local to `record`, and you would get the same `UnboundLocalError` as before. With it, each counter owns a private `n` that no other code can reach or spoil. `c1` has counted to 3 while `c2` is still at 1.

::: example One checker per channel, and the trap on the way there
You want a limit checker for each channel, built in a loop. The obvious code is wrong:

```python
# checkers_bug.py
checkers = []
for limit in (12.5, 3.0):
    def exceeds(value):
        return value > limit
    checkers.append(exceeds)

print(checkers[0](5.0))   # True
print(checkers[1](5.0))   # True
```

Check the first line by hand. The first checker was meant to test against 12.5. Is 5.0 above 12.5? No. So it should print `False`, and it printed `True`.

Here is why. A closure captures the *variable*, not the value it held at the moment the function was defined. Both functions closed over the same loop variable `limit`. Follow the timeline:

1. First pass: `limit` is 12.5. The first `exceeds` is made. It remembers "the variable `limit`", not "12.5".
2. Second pass: `limit` becomes 3.0. The second `exceeds` is made, remembering the same variable.
3. The loop ends. `limit` is left holding 3.0.
4. Now you call either checker. Each looks up `limit` and finds 3.0.

This is called **[[late binding|late-binding]]**: the value is looked up when the function *runs*, not when it is *made*.

The factory function fixes it, because each call to the factory creates a fresh local `limit` to capture:

```python
# checkers_fixed.py
def make_limit_checker(limit):
    def exceeds(value):
        return value > limit
    return exceeds


checkers = []
for limit in (12.5, 3.0):
    checkers.append(make_limit_checker(limit))

print(checkers[0](5.0))   # False
print(checkers[1](5.0))   # True
```

Now 5.0 is not above 12.5 (`False`) and is above 3.0 (`True`). Both correct.

This is worth the space because the bug is silent. Nothing crashed, nothing was slow, and the limit check quietly used the wrong limit for every channel but the last. The same shape turns up in event handlers, retry wrappers and anything else that builds functions in a loop.
:::

::: warning
A loop variable is one variable, reused. Any function defined in the loop body that mentions it sees whatever value it holds *when the function is called*, which is normally the last one. Build such functions with a factory that takes the value as a parameter, so each gets its own binding.
:::

## Scope is decided by the text, not by the call

One last point heads off a whole family of confusion. Which scope a name belongs to is decided by where the function is *written*, not by where it is *called from*. A function defined in module A and called from module B still reads module A's globals.

The name for this is **[[lexical scoping|lexical-vs-dynamic]]** — "lexical" means "about the text". It is why you can read a function and know where each of its names comes from, using nothing but the file in front of you:

```python
# lexical.py
x = "global"


def outer():
    x = "enclosing"

    def inner():
        return x          # enclosing, from where inner is written

    return inner()


print(outer())   # enclosing
```

`inner` is written inside `outer`, so its enclosing scope is `outer`, and it finds `"enclosing"`. Where the call happens does not matter.

## Check yourself

::: check
A function body contains `total = total + x` where `total` is also defined at the top of the file. What happens, and what are two ways to fix it?
:::

::: answer
It raises `UnboundLocalError: cannot access local variable 'total' where it is not associated with a value`. The assignment makes `total` local for the entire body, so the read on the right-hand side finds a local with no value yet instead of the global.

Fix 1: take `total` as a parameter and return the new value — `def add(total, x): return total + x`. This is the version you can test.

Fix 2: declare `global total` at the top of the body. It works, but it ties the function to module state.

Note that a function which only *reads* `total` needs neither, because reading falls through to the global scope.
:::

::: check
Why does `print(list(range(3)))` fail after a line `list = [9.79, 9.80]`, and what does the error message say?
:::

::: answer
The global name `list` now refers to your list object, and a global shadows the built-in with the same name — the G in LEGB is searched before the B. So the call `list(...)` tries to call a list object, and Python raises `TypeError: 'list' object is not callable`.

The fix is to rename the variable — `samples` rather than `list`. The shadowing lasts for the rest of the program, so the error can appear a hundred lines away from its cause.
:::

::: check
`make_limit_checker(12.5)` returns and its local `limit` should be gone. Why does the returned function still see 12.5?
:::

::: answer
Because the inner function captured the name, and Python keeps that binding alive for as long as any function refers to it. The inner function object holds a reference to a **cell** containing `limit`, so the value cannot be thrown away while the checker exists. `ax_check.__closure__[0].cell_contents` shows 12.5 directly.

That is what "closure" means: the function plus the enclosing names it closed over. Each call of the factory makes a new cell, which is why two checkers do not interfere.
:::

::: check
Predict the output, then say which line you would change to get the intended behavior.

```python
scales = []
for factor in (2.0, 10.0):
    def scale(v):
        return v * factor
    scales.append(scale)

print(scales[0](3.0), scales[1](3.0))
```
:::

::: answer
It prints `30.0 30.0`. Both functions closed over the same loop variable, which holds 10.0 after the loop ends, so both compute $3.0 \times 10.0 = 30.0$. The intended output is `6.0 30.0`.

Change the loop to call a factory — `def make_scale(factor): def scale(v): return v * factor; return scale` — and append `make_scale(factor)`, so each function captures a fresh local.

Giving `scale` a default parameter, `def scale(v, factor=factor)`, also works, because defaults are evaluated once, at definition time. But the factory says what it means.
:::

::: check
Two functions in the same file both use a local variable named `i`. Is there any way one can affect the other?
:::

::: answer
No. Each call gets its own local namespace, created when the function starts and thrown away when it returns. So the two `i` names are unrelated — and even two calls of the *same* function running at once have separate locals.

The only ways one function can affect another are through a shared global name, through an object both have a reference to, or through something outside the program such as a file. That isolation is what makes it safe to write many small functions. It is also why the first fix for a global-counter bug is to pass the value in and return it.
:::

## Summary

| Item | Statement |
| --- | --- |
| LEGB | Local, Enclosing, Global, Built-in; first match wins |
| Local name | Created by assignment in the body; gone when the function returns |
| Reading a global | Works with no declaration; a function can read a module-level constant |
| Assigning a global | Any assignment makes the name local for the whole body unless declared `global` |
| `UnboundLocalError` | `cannot access local variable 'x' where it is not associated with a value` (3.11 wording) |
| Shadowing a built-in | `list = [...]` then `list(...)` gives `TypeError: 'list' object is not callable` |
| `global` / `nonlocal` | Assign to a module-level name / to a name in the enclosing function |
| Closure | Inner function plus the enclosing names it captured; outlives the outer call |
| Factory | A function returning a closure; each call captures its own binding |
| Loop capture trap | Functions defined in a loop share the loop variable and see its final value |
| Lexical scoping | Scope is fixed by where code is written, not by where it is called |

The next lesson takes two ideas you now have — that assignment ties a name to an object rather than copying it, and that a default argument is evaluated once, at definition time — and shows what happens when they meet: the mutable default argument, the most famous bug in the language. Closures come back there too, as the clean way to keep state that must last between calls.

::: context namespace-table A table of names
Under the hood, a namespace really is a lookup table from names to objects — for the module level, an actual Python dictionary. You can see it: at the top level of a file, `globals()` returns that dictionary, and `globals()["G0"]` gives `9.80665`. Every function call gets a fresh table for its locals, and the table is dropped when the call returns. "Where does this name come from?" always means "which table did Python find it in?"
:::

::: context legb-rings Four rooms, searched from the inside
Each scope sits inside the next one out. A lookup starts in the innermost box and moves outward until it finds the name. It never searches inward, which is why the module level cannot see a function's locals.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="180" rx="8" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="22" y="30" font-size="12" fill="#6c7a93">B  built-in: len, print, sum</text>
  <rect x="30" y="40" width="300" height="140" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="42" y="60" font-size="12" fill="#1f2a44">G  global (module): G0, value</text>
  <rect x="50" y="70" width="260" height="100" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="62" y="90" font-size="12" fill="#1f2a44">E  enclosing: outer's locals</text>
  <rect x="70" y="100" width="130" height="60" rx="8" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="82" y="122" font-size="12" fill="#1f2a44">L  local:</text>
  <text x="82" y="140" font-size="12" fill="#1f2a44">inner's names</text>
  <line x1="200" y1="112" x2="330" y2="24" stroke="#b4232c" stroke-width="2"/>
  <polygon points="337,19 325,21 331,30" fill="#b4232c"/>
  <text x="258" y="150" font-size="11" fill="#b4232c" text-anchor="middle">search outward</text>
</svg>
```
:::

::: context builtins-module Where the built-ins live
The built-in names are not magic. They sit in an ordinary module called `builtins`, which Python searches last. `import builtins` and then `builtins.len is len` gives `True`. That is also your way out if you have shadowed one: after `list = [9.79, 9.80]` at module level, `del list` removes your global name, and the lookup falls through to the built-in `list` again.
:::

::: context decided-before-running Decided before the first line runs
When Python turns a function's text into runnable code, it scans the whole body and makes a list of every name that is assigned there. Those names are local, full stop. You can see the list: for the buggy counter, `record.__code__.co_varnames` is `('count',)`. A function that only reads `count` has an empty list, and `count` goes into a different list of names to look up outside. So the choice between local and global is fixed before any line of the body runs — not by which line comes first.
:::

::: context shared-state-tests Why test order starts to matter
Test runners such as pytest run many tests in one Python process. If a function keeps a global counter, the first test that calls it leaves the counter changed, and every later test starts from that leftover value. The result is a "flaky" test: it passes when run alone and fails in the full suite, or the other way round. Teams that write analysis and ground software spend real hours chasing these. The cure is state that each test creates fresh — a value passed in and returned, or a new object per test.
:::

::: context closure-word Why it is called a closure
The name comes from the idea of "closing over" the surroundings: the inner function wraps up the free names it uses — names that are neither its parameters nor its own locals — together with where they live. Computer scientist Peter Landin used the word this way in the 1960s, for a function packaged with the environment it was defined in. Python's version is exactly that: code plus a small set of captured variables.
:::

::: context closure-cell What the checker carries
The function object `ax_check` has an attribute `__closure__`, a tuple of **cells**. Each cell is a small box holding one captured variable. The code inside `exceeds` reads `limit` through its cell, so the value lives on after `make_limit_checker` has returned.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="12" y="30" width="110" height="60" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="67" y="55" font-size="12" text-anchor="middle" fill="#1f2a44">ax_check</text>
  <text x="67" y="74" font-size="11" text-anchor="middle" fill="#1f2a44">code: value &gt; limit</text>
  <line x1="122" y1="60" x2="160" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="168,60 158,55 158,65" fill="#1f2a44"/>
  <rect x="170" y="36" width="80" height="48" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="210" y="56" font-size="11" text-anchor="middle" fill="#1f2a44">__closure__</text>
  <text x="210" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">(cell,)</text>
  <line x1="250" y1="60" x2="272" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="280,60 270,55 270,65" fill="#1f2a44"/>
  <rect x="282" y="36" width="66" height="48" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="315" y="56" font-size="11" text-anchor="middle" fill="#1f2a44">limit</text>
  <text x="315" y="73" font-size="12" text-anchor="middle" fill="#1f2a44">12.5</text>
  <text x="180" y="108" font-size="11" text-anchor="middle" fill="#6c7a93">each factory call makes a new cell</text>
</svg>
```
:::

::: context late-binding Two functions, one box
In the buggy loop there is only one variable `limit`, and both functions point at it. They look inside the box when they are called, and by then the loop has left 3.0 there.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="14" y="20" width="120" height="30" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="74" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">checkers[0]</text>
  <rect x="14" y="90" width="120" height="30" rx="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="74" y="110" font-size="12" text-anchor="middle" fill="#1f2a44">checkers[1]</text>
  <line x1="134" y1="35" x2="222" y2="62" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="230,65 219,57 217,66" fill="#1f2a44"/>
  <line x1="134" y1="105" x2="222" y2="78" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="230,75 217,74 219,83" fill="#1f2a44"/>
  <rect x="232" y="50" width="114" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="289" y="67" font-size="11" text-anchor="middle" fill="#1f2a44">limit</text>
  <text x="289" y="83" font-size="12" text-anchor="middle" fill="#b4232c">3.0 (was 12.5)</text>
  <text x="289" y="112" font-size="11" text-anchor="middle" fill="#6c7a93">one variable, last value</text>
</svg>
```
:::

::: context lexical-vs-dynamic The shell does it the other way
Not every language scopes by the text. Bash, from the shell modules, uses **dynamic** scoping for `local` variables: a function sees the locals of whichever function *called* it. In bash, if `caller` sets `local x=inner` and then calls `show`, `show` prints `inner`; called from the top level, the same `show` prints the global. Python never does that. Where a function is written decides everything, which is what lets you reason about a Python function from its own file.
:::
