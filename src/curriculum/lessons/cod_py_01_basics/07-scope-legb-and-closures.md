---
id: l07-scope-legb-and-closures
title: Scope, the LEGB rule and closures
minutes: 17
covers:
  - Scope and LEGB; closures at a first-pass level
---

When you write `count` in a function body, Python has to decide which `count` you mean: one defined in this function, one in a function that encloses it, one at the top of the file, or one built into the language. The rule it uses is fixed, short, and the source of two errors that stop beginners cold — a counter that raises `UnboundLocalError` the first time it is called, and a variable that "does not exist" immediately after the function that created it returned.

Scope is also the reason your programs can grow. Because the names inside a function are private to it, you can write a hundred functions that all use `total` and `i` without any of them interfering. A language where every name were global would make a 200-line program an exercise in not colliding with yourself.

This lesson covers the four scopes and the order they are searched, the two statements that override the rule, and *closures*: what happens when a function defined inside another function outlives it and keeps a value alive. Closures are a first-pass topic here — enough to read them, to write a simple factory, and to recognise the one trap that catches everybody.

## Local names exist only while the function runs

Assignment inside a function creates a *local* name. It comes into existence when the line runs and disappears when the function returns:

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

The first line of output is the returned value; the second is the proof that `total` never existed outside. The only way anything leaves a function is through its `return` value — or by mutating an object the caller already had, which lesson 6 showed and lesson 8 will make an issue of.

## The LEGB rule

To resolve a name, Python searches four scopes in a fixed order and stops at the first one that has it:

| | Scope | What it holds |
| --- | --- | --- |
| **L** | Local | Names assigned in this function |
| **E** | Enclosing | Names local to a function that contains this one |
| **G** | Global | Names at the top level of this module (the file) |
| **B** | Built-in | Names the language provides: `len`, `print`, `sum`, `range`, … |

Remember it as LEGB, innermost outwards. A function can therefore *read* a constant defined at the top of the file without any ceremony:

```python
# legb_read.py
G0 = 9.80665   # m/s^2, standard gravity


def weight(mass_kg):
    """Weight in newtons at standard gravity."""
    return mass_kg * G0


print(weight(549054.0))   # 5384380.4091
```

`G0` is not local, not enclosing, and is found at the global level. `mass_kg` is local. `print` is found at the built-in level, which is why you can use it without importing anything. That mass is a Falcon 9 at lift-off, about 549 t, and its weight is about $5.38 \times 10^{6}$ N — worth carrying in your head next to the vehicle's roughly $7.6 \times 10^{6}$ N of sea-level thrust.

Shadowing works by the same rule and is occasionally a disaster. A local name hides a global one, and a global name hides a built-in:

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

The name `list` now refers to your list, so the call `list(...)` tries to call a list. The message `'list' object is not callable` is the signature of exactly this mistake. Never name a variable `list`, `dict`, `set`, `str`, `type`, `id`, `sum`, `min`, `max`, `input` or `file` — your editor will usually colour them differently, which is the hint.

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

`inner` returns its own local. `outer` returns its own, unaffected by what `inner` did — assignment inside `inner` created a *new local there*, it did not reach out. The module-level `value` is untouched by either, and `len` was found at the built-in level because nothing above it defines that name.

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

The accumulation worked perfectly and printed 19.6. The *next* use of the built-in `sum`, anywhere in the file, fails — and the traceback points at that line, not at the assignment three screens earlier that caused it. The name to use is `total`.
:::

::: key
Name lookup is **L**ocal, then **E**nclosing function, then **G**lobal (module), then **B**uilt-in; the first match wins. Assignment inside a function creates a local name unless declared `global` or `nonlocal`. Local names vanish when the function returns.
:::

## Why the counter raises UnboundLocalError

Here is the error that the rule causes, and it is worth understanding rather than memorising:

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

Reading it: the bottom frame is where the error happened, the frame above is the call that got there. And the cause is the rule in its exact form — **if a name is assigned anywhere in a function's body, it is local for the whole body**, from the first line, not from the assignment onwards. `count += 1` is an assignment to `count`, so `count` is local throughout `record`; the right-hand side then tries to read a local that has never been given a value. The global `count = 0` is not consulted at all, because the decision is made from the shape of the function, before it runs.

That the module-level `count` exists makes no difference, which is what makes the error so confusing the first time: the name is plainly there on the screen, two lines up.

::: note
The wording of this message changed in Python 3.11. Older interpreters say `local variable 'count' referenced before assignment` for the same error. Both name the same rule; 3.11 onwards is the phrasing shown here.
:::

Three fixes, in order of preference.

**Return the new value.** The function takes the old count and gives back the new one, and nothing is hidden:

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

**Declare it global.** `global count` tells Python that assignments to `count` in this body refer to the module-level name:

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

This works and it is what `global` is for, but use it sparingly. A function that changes module state can be called from anywhere, in any order, and its result depends on history — which is precisely what makes a bug hard to reproduce. In a test harness, global state is the reason test 7 passes alone and fails when test 3 ran first.

**Use a closure**, which is the next section, and is the version that gives each counter its own private state.

## Closures: a function that remembers

A function can be defined inside another function. The inner one can read the outer one's local names — that is the E in LEGB — and, remarkably, it keeps working after the outer function has returned. The inner function plus the captured names is called a *closure*.

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

`make_limit_checker` has returned long before `ax_check(12.71)` is called, and yet `limit` is still 12.5 inside `ax_check`. The value is held in the function object itself, and you can look at it:

```python
# closure_cell.py
def make_limit_checker(limit):
    def exceeds(value):
        return value > limit
    return exceeds


ax_check = make_limit_checker(12.5)
print(ax_check.__closure__[0].cell_contents)   # 12.5
```

Two checkers made from the same factory are independent, each with its own captured value. That is the advantage over a global: no shared state, nothing to reset between runs, and a checker you can pass around like any other value.

`nonlocal` is to enclosing scope what `global` is to module scope — it lets an inner function *assign* to a name in the function that encloses it:

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

Without `nonlocal`, `n += 1` would make `n` local to `record` and raise the same `UnboundLocalError` as before. With it, each counter owns a private `n` that no other code can reach or corrupt.

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

The first checker was supposed to test against 12.5, and 5.0 is not above 12.5, so the first line should print `False`. Both print `True` because a closure captures the *variable*, not its value at the moment of definition. Both functions closed over the same loop variable `limit`, and by the time either was called the loop had finished and left `limit` at 3.0. Both checkers test against 3.0.

The factory function fixes it, because each call to the factory creates a fresh local `limit` to be captured:

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

This is worth the space it takes because the bug is silent. Nothing raised, nothing was slow, and the limit check simply used the wrong limit for every channel but the last. The same shape appears in event handlers, retry wrappers and anything else that builds functions in a loop.
:::

::: warning
A loop variable is one variable, reused. Any function defined in the loop body that mentions it sees whatever value it holds *when the function is called*, which is normally the last one. Build such functions with a factory that takes the value as a parameter, so each gets its own binding.
:::

## Scope is decided by the text, not by the call

One last point that heads off a whole class of confusion. Which scope a name belongs to is decided by where the function is *written*, not by where it is *called from*. A function defined in module A and called from module B still reads module A's globals. Python is lexically scoped, and that is why you can read a function and know where each of its names comes from, using nothing but the file in front of you.

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

## Check yourself

::: check
A function body contains `total = total + x` where `total` is also defined at the top of the file. What happens, and what are two ways to fix it?
:::

::: answer
It raises `UnboundLocalError: cannot access local variable 'total' where it is not associated with a value`. The assignment makes `total` local for the entire body, so the read on the right-hand side finds an unbound local rather than the global. The fixes: take `total` as a parameter and return the new value — `def add(total, x): return total + x` — which is the version that can be tested; or declare `global total` at the top of the body, which works but ties the function to module state. Note that a function which only *reads* `total` needs neither, because reading falls through to the global scope.
:::

::: check
Why does `print(list(range(3)))` fail after a line `list = [9.79, 9.80]`, and what does the error message say?
:::

::: answer
The global name `list` now refers to your list object, and a global shadows the built-in of the same name — the G in LEGB is searched before the B. The call `list(...)` therefore tries to call a list object, and Python raises `TypeError: 'list' object is not callable`. The fix is to rename the variable, `samples` rather than `list`; the shadowing lasts for the rest of the program, so the error can appear a hundred lines away from its cause.
:::

::: check
`make_limit_checker(12.5)` returns and its local `limit` should be gone. Why does the returned function still see 12.5?
:::

::: answer
Because the inner function captured the name, and Python keeps the binding alive for as long as any function refers to it. The inner function object holds a reference to a *cell* containing `limit`, so the value cannot be collected while the checker exists — `ax_check.__closure__[0].cell_contents` shows 12.5 directly. This is what "closure" means: the function plus the enclosing names it closed over. Each call of the factory makes a new cell, which is why two checkers do not interfere.
:::

::: check
Predict the output, then say which line you would change to get the intended behaviour.

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
It prints `30.0 30.0`. Both functions closed over the same loop variable, which holds 10.0 after the loop ends, so both multiply by 10. The intended output is `6.0 30.0`. Change the loop to call a factory — `def make_scale(factor): def scale(v): return v * factor; return scale` — and append `make_scale(factor)`, so each function captures a fresh local. Giving `scale` a default parameter, `def scale(v, factor=factor)`, also works because defaults are evaluated at definition time, but the factory says what it means.
:::

::: check
Two functions in the same file both use a local variable named `i`. Is there any way one can affect the other?
:::

::: answer
No. Each call gets its own local namespace, created when the function starts and discarded when it returns, so the two `i` names are unrelated — and even two simultaneous calls of the *same* function have separate locals. The only ways one function can affect another are through a shared global name, through an object that both have a reference to, or through something outside the program such as a file. That isolation is what makes it safe to write many small functions, and it is the reason the first fix for a global-counter bug is to pass the value in and return it.
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

The next lesson takes the two ideas you now have — that assignment binds rather than copies, and that a default argument is evaluated once at definition time — and shows what happens when they meet: the mutable default argument, the most famous bug in the language.
