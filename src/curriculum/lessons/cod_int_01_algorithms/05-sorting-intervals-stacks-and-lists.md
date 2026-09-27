---
id: l05-sorting-intervals-stacks-and-lists
title: Sorting, intervals, stacks, queues and linked lists
minutes: 21
covers:
  - Sorting and intervals; stacks and queues; linked lists
---

Picture a messy pile of homework sheets. Before you can spot that two of them are the same assignment, it helps to put them in date order. Once they are in order, the duplicates sit right next to each other. That is the big idea behind half of this lesson: **sort first, then walk once**.

Now picture a stack of plates in a cafeteria. You put a clean plate on top, and the next person takes the top one. The last plate on is the first plate off. Compare that with the lunch line, where the first person in line is the first one served. Those two orders — last-in-first-out and first-in-first-out — are the **stack** and the **queue**. And a scavenger hunt, where each clue tells you where the next clue is hidden, is a **linked list**.

These are the plain workhorse structures of real ground and flight software. A mission planner merges a satellite's ground-station passes into one schedule. A command parser checks that every bracket in an uplinked script is closed. A command queue sends instructions in the order they were issued. Last lesson gave you hash maps and binary search. This one gives you the other half of the everyday toolkit.

## Sorting: let the library do it

You will almost never write a sorting algorithm in an interview. You will call the built-in one, and you need to know three facts about it.

**Fact 1: it costs $O(n \log n)$.** Read that as "order n log n". Sorting $n$ items takes about $n \times \log_2 n$ steps. For a million items that is about $10^6 \times 20 = 2 \times 10^7$ steps — a fraction of a second. Comparing every pair would be $10^{12}$ steps. Python's `sorted` and `list.sort` use an algorithm called **[[Timsort|timsort]]**; C++'s `std::sort` uses a mix of quicksort and heapsort. Both are $O(n \log n)$ in the worst case.

**Fact 2: you can sort by a key.** The **key** is a small function that says what to compare. To sort events by priority, you tell `sorted` to look only at the priority. The short throwaway function is written with **[[lambda|lambda]]**: `lambda e: e[1]` means "given `e`, hand back `e[1]`".

**Fact 3: some sorts are stable.** A **stable sort** keeps items with equal keys in the order they arrived. Python's sort is always stable. C++'s `std::sort` is not; if you need stability there, call `std::stable_sort`.

```python
events = [("RCS", 3), ("GPS", 1), ("IMU", 3), ("BAT", 2), ("CAM", 1)]
# (subsystem, priority): priority 1 is most urgent

by_priority = sorted(events, key=lambda e: e[1])
print(by_priority)
# [('GPS', 1), ('CAM', 1), ('BAT', 2), ('RCS', 3), ('IMU', 3)]
```

GPS and CAM both have priority 1. GPS arrived first, so a stable sort keeps GPS first. The same happens for RCS and IMU. If the events were already in time order, stability means "same priority, still in time order" — for free. Time $O(n \log n)$; space $O(n)$ for the new list (`list.sort()` sorts in place instead).

::: key Sorting facts to say aloud
The built-in sort is $O(n \log n)$ time. Python's sort is stable; C++'s `std::sort` is not, and `std::stable_sort` is. Sort by a key to choose what gets compared. "Sort first, then one pass" often turns an $O(n^2)$ idea into $O(n \log n)$.
:::

In flight-software C++ the same sort takes a lambda that answers "should `a` come before `b`?":

```cpp
#include <algorithm>
#include <cstdio>
#include <vector>

struct Pass {
    int start;  // minutes after midnight UTC
    int end;
};

int main() {
    std::vector<Pass> passes = {{610, 622}, {95, 108}, {600, 615}, {100, 112}};
    std::sort(passes.begin(), passes.end(),
              [](const Pass& a, const Pass& b) { return a.start < b.start; });
    for (const Pass& p : passes) std::printf("%d-%d ", p.start, p.end);
    std::printf("\n");
    return 0;
}
// 95-108 100-112 600-615 610-622
```

The `[]` starts a C++ lambda. It takes two passes and returns `true` when `a` should go first. Use `<`, never `<=`: the comparison must say "strictly before", or `std::sort` is allowed to misbehave. Time $O(n \log n)$, and it sorts in place.

## Intervals: merging contact windows

An **interval** is a stretch of time with a start and an end, written $[s, e]$. A satellite in low orbit can talk to a given ground antenna only while it is above the horizon — a **[[contact window|contact-window]]** of a few minutes. With several antennas, the windows overlap. The planner wants the real schedule: when is the satellite reachable at all, and for how long in total?

The trick is sort first, then walk once:

1. Sort the windows by start time.
2. Keep a list of merged windows. Look at each window in order.
3. If it starts before (or exactly when) the last merged window ends, they overlap. Stretch the last window's end to whichever end is later.
4. Otherwise there is a gap, so start a new merged window.

Why does sorting make this work? After sorting, a window can only overlap the one *most recently* merged. Everything earlier ended before that one began.

::: example Merging six passes
Times are minutes after midnight UTC. Six passes: $[610, 622]$, $[95, 108]$, $[600, 615]$, $[100, 112]$, $[340, 351]$, $[112, 118]$.

```python
def merge(windows):
    if not windows:
        return []
    windows = sorted(windows, key=lambda w: w[0])   # sort by start time
    merged = [list(windows[0])]
    for start, end in windows[1:]:
        last = merged[-1]
        if start <= last[1]:           # overlaps (or touches) the last one
            last[1] = max(last[1], end)
        else:
            merged.append([start, end])
    return merged


passes = [(610, 622), (95, 108), (600, 615), (100, 112), (340, 351), (112, 118)]
m = merge(passes)
print(m)
print(sum(e - s for s, e in m), "minutes of contact")
print(merge([]), merge([(5, 9)]))
# [[95, 118], [340, 351], [600, 622]]
# 56 minutes of contact
# [] [[5, 9]]
```

Sorted, the list is $[95,108], [100,112], [112,118], [340,351], [600,615], [610,622]$. Walk it:

- Start with $[95, 108]$.
- $[100, 112]$ starts at $100 \le 108$: overlap. The end becomes $\max(108, 112) = 112$.
- $[112, 118]$ starts at $112 \le 112$: they touch, so merge. The end becomes $118$.
- $[340, 351]$ starts at $340 > 118$: a gap. New window.
- $[600, 615]$ starts after $351$: new window. Then $[610, 622]$ starts at $610 \le 615$: merge, end $622$.

Total contact: $(118 - 95) + (351 - 340) + (622 - 600) = 23 + 11 + 22 = 56$ minutes. Sanity check: adding the six raw passes gives $12 + 13 + 15 + 12 + 11 + 6 = 69$ minutes. The merged total is smaller, as it must be, because overlapping minutes are counted once.

Time $O(n \log n)$ for the sort, plus $O(n)$ for the walk. Space $O(n)$ for the sorted copy and the output. The empty list and a single window are handled before the loop.
:::

::: warning Overlap, touch, or gap?
Decide out loud whether $[100, 112]$ and $[112, 118]$ merge. Here they do (`<=`), because the satellite never drops out. For hotel bookings, where one guest leaves as the next arrives, you would use `<`. And always take the `max` of the two ends: a long window can swallow a short one completely, as $[95, 200]$ would swallow $[100, 112]$.
:::

## Stacks: last in, first out

A **stack** holds items where you can only add to the top (**push**) or take from the top (**pop**). In Python a plain list is a stack: `append` pushes and `pop()` pops, both $O(1)$. In C++ use `std::vector` with `push_back` and `pop_back`, or `std::stack`.

A stack is the right tool whenever the most recent unfinished thing must be finished first. Brackets are the classic case.

### Valid brackets

A command script uses `()`, `[]` and `{}`. Every opener must be closed by its own kind, in the right order: `{ ( ) }` is fine, `{ ( } )` is not. Walk the text. Push every opener. At every closer, the top of the stack must be the matching opener; pop it. At the end, the stack must be empty.

```python
PAIRS = {")": "(", "]": "[", "}": "{"}


def balanced(text):
    stack = []
    for ch in text:
        if ch in "([{":
            stack.append(ch)               # push an opener
        elif ch in PAIRS:
            if not stack or stack.pop() != PAIRS[ch]:
                return False               # closer with no matching opener
    return not stack                       # leftover openers mean unbalanced


print(balanced("seq{ burn(12.5); wait[3] }"))
print(balanced("seq{ burn(12.5]; }"))
print(balanced("(("))
print(balanced(""))
# True
# False
# False
# True
```

The second script closes `(` with `]`, so it fails. The third has openers left over. The empty script is balanced: nothing opened, nothing to close. Time $O(n)$, one pass. Space $O(n)$ in the worst case, when every character is an opener.

### The monotonic stack: next higher reading

Here is a stack trick that shows up often in mediums. For each reading in a list, find the *next* reading that is higher. Think of standing in a line of people of different heights and asking, "who is the first person behind me who is taller than me?"

Checking forward from every position costs $O(n^2)$. The faster way keeps a stack of positions that are **still waiting** for their answer. Their values go down from the bottom of the stack to the top, so it is called a **[[monotonic stack|monotonic-stack]]** ("monotonic" means always going one way). When a new reading arrives, it is the answer for every waiting reading that is lower than it. Pop those, fill in their answers, then push the new one.

::: example Next hotter temperature
A tank wall temperature is logged once a minute: $21, 19, 24, 22, 20, 26, 23\,^\circ\mathrm{C}$ at minutes 0 to 6. For each minute, at which minute is it first warmer? Answer $-1$ if never.

```python
def next_greater(vals):
    ans = [-1] * len(vals)       # -1 means "no later reading is higher"
    stack = []                   # indices still waiting; their values decrease
    for i, v in enumerate(vals):
        while stack and vals[stack[-1]] < v:
            ans[stack.pop()] = i     # v is the first higher reading for that index
        stack.append(i)
    return ans


temps = [21, 19, 24, 22, 20, 26, 23]   # tank wall temperature, deg C, once a minute
print(next_greater(temps))
# [2, 2, 5, 5, 5, -1, -1]
```

Trace the stack (showing values, though it stores minutes):

- Minute 0, $21$: nothing waiting. Push. Stack: $21$.
- Minute 1, $19$: not higher than $21$. Push. Stack: $21, 19$.
- Minute 2, $24$: higher than $19$, so minute 1's answer is 2; pop. Higher than $21$, so minute 0's answer is 2; pop. Push. Stack: $24$.
- Minutes 3 and 4, $22$ and $20$: each lower than the top. Push both. Stack: $24, 22, 20$.
- Minute 5, $26$: higher than all three. Minutes 4, 3 and 2 all get answer 5. Stack: $26$.
- Minute 6, $23$: lower. Push. The loop ends with minutes 5 and 6 still waiting, so they keep $-1$.

Check one by hand: after minute 3 ($22\,^\circ\mathrm{C}$) come $20$ and then $26$, so the first warmer minute is 5. Correct.

Time $O(n)$, even with a loop inside a loop: each minute is pushed once and popped at most once, so the inner loop runs at most $n$ times *in total*. Space $O(n)$ for the stack and the answers.
:::

This is the same argument as lesson 3's monotonic deque for the sliding-window maximum: count the pushes and pops across the whole run, not per step.

## Queues: first in, first out

A **queue** adds at the back and removes from the front, like the lunch line. In Python use `collections.deque` — a **[[deque|deque]]**, read "deck", short for double-ended queue. Both `append` (join at the back) and `popleft` (leave from the front) are $O(1)$. In C++ it is `std::deque` or `std::queue`.

```python
from collections import deque

commands = deque()
commands.append("OPEN_VALVE")      # join at the back
commands.append("IGNITE")
commands.append("CLOSE_VALVE")
print(commands.popleft())          # leave from the front
print(list(commands))
# OPEN_VALVE
# ['IGNITE', 'CLOSE_VALVE']
```

Each operation is $O(1)$ time; the queue holds $O(n)$ items. A queue matters most in the next lesson, where it drives **breadth-first search**: explore everything one step away before anything two steps away.

::: warning Do not use a list as a queue
`list.pop(0)` removes the first item, but then every other item shifts one place to the left. That is $O(n)$ per pop, and $O(n^2)$ to empty the whole queue. Interviewers watch for this. Say "I'll use a deque so popping from the front is $O(1)$."
:::

## Linked lists: the scavenger hunt

An array keeps its items side by side in memory, so item 500 is found in one jump. A **linked list** does not. Each item lives in a **node** that holds a value and a **[[pointer|pointer]]** — a reference saying where the next node is. The last node points to nothing (`None` in Python, `nullptr` in C++). You start at the **head** and follow the arrows.

That makes reaching item $k$ cost $O(k)$, since you must walk there. In exchange, once you are standing at a node, inserting or removing next to it is $O(1)$: change a pointer or two, and nothing shifts. Interviews use linked lists mostly to test whether you can move pointers without losing any.

### Reversing a list in place

To reverse A → B → C → D, turn every arrow around. Walk with two pointers, `prev` (behind) and `cur` (here). At each node, do three things in this order: remember the rest of the list, turn this node's arrow back toward `prev`, and step both pointers forward.

```python
class Node:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next


def reverse(head):
    prev = None
    cur = head
    while cur:
        nxt = cur.next       # 1. remember the rest of the list
        cur.next = prev      # 2. turn this arrow around
        prev = cur           # 3. step both pointers forward
        cur = nxt
    return prev              # the old tail is the new head


def to_list(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out


head = Node("A", Node("B", Node("C", Node("D"))))
print(to_list(reverse(head)))
print(to_list(reverse(None)))
# ['D', 'C', 'B', 'A']
# []
```

Time $O(n)$: each node is visited once. Space $O(1)$: only three pointer variables, however long the list. The empty list comes back empty.

::: warning Save the next pointer first
If you write `cur.next = prev` before saving `cur.next`, you have cut the only link to the rest of the list, and it is gone. Draw the boxes and arrows on paper and move them one line at a time. Interviewers expect you to draw.
:::

### Finding a loop: fast and slow pointers

A bug can make the last node point back into the middle of the list. Then "walk until `None`" never ends. How do you detect the loop with $O(1)$ memory?

Send two runners down the list. The slow one moves one node per step; the fast one moves two. If the list ends, the fast one reaches the end: no loop. If there is a loop, both runners end up going around it, and the fast one gains one node on the slow one every step, so it must eventually land on the same node. This is **[[Floyd's tortoise and hare|tortoise-and-hare]]**.

```python
class Node:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next


def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next          # one step
        fast = fast.next.next     # two steps
        if slow is fast:
            return True           # the fast runner lapped the slow one
    return False                  # the fast runner fell off the end


a, b, c, d, e = (Node(x) for x in "ABCDE")
a.next, b.next, c.next, d.next = b, c, d, e
print(has_cycle(a))
e.next = c                        # E now points back to C: a loop
print(has_cycle(a))
print(has_cycle(None))
# False
# True
# False
```

`slow is fast` asks "are these the very same node?", not "do they hold equal values?". Time $O(n)$; space $O(1)$. A set of visited nodes would also work, in $O(n)$ time but $O(n)$ space — say both, and why you prefer the pointers.

::: note Why the fast runner must land on the slow one
Once both runners are inside a loop of length $L$, measure how far the fast one is *behind* the slow one, going around the loop: call it $g$, a whole number from $1$ to $L - 1$ (if $g = 0$ they have already met). Each step the slow runner moves 1 and the fast runner moves 2, so the gap shrinks by exactly $1$: $g$, then $g - 1$, then $g - 2$. Because it shrinks by one at a time, it cannot jump over zero. After $g$ more steps it is exactly $0$ and they share a node. Since $g < L \le n$, that takes fewer than $n$ steps after both are in the loop.
:::

## Check yourself

::: check
Six events arrive in time order and you sort them by priority in Python. Two have the same priority. Which comes first after the sort, and would C++'s `std::sort` promise the same?
:::

::: answer
Python's sort is stable, so the two equal-priority events keep their arrival order: the earlier one stays first. `std::sort` is not stable, so it may swap them. In C++ you would call `std::stable_sort` to get the promise. Either way the sort is $O(n \log n)$.
:::

::: check
Merge the windows $[30, 40]$, $[5, 12]$, $[10, 35]$ and $[50, 55]$, and give the total covered time. State the time and space complexity.
:::

::: answer
Sort by start: $[5,12], [10,35], [30,40], [50,55]$. Start with $[5, 12]$. $[10, 35]$ starts at $10 \le 12$: merge, end $35$. $[30, 40]$ starts at $30 \le 35$: merge, end $40$. $[50, 55]$ starts after $40$: new window. Result: $[5, 40], [50, 55]$. Total: $35 + 5 = 40$. Time $O(n \log n)$ for the sort plus $O(n)$ for the walk; space $O(n)$.
:::

::: check
Run the bracket checker by hand on `{[()]}(` and on `)(`. What does it return for each, and at which character does it decide?
:::

::: answer
`{[()]}(`: push `{`, `[`, `(`. Then `)` pops `(` — a match. `]` pops `[`, `}` pops `{`. Then `(` is pushed. The text ends with one opener left, so it returns `False` at the very end.

`)(`: the first character is a closer and the stack is empty, so it returns `False` right away, at the first character. Both are $O(n)$ time and $O(n)$ space.
:::

::: check
The next-higher-reading code has a `while` loop inside a `for` loop. A teammate says that makes it $O(n^2)$. Explain why it is $O(n)$.
:::

::: answer
Count the work across the whole run instead of per step. Every index is pushed onto the stack exactly once, and each pop removes one index that is never pushed again, so there are at most $n$ pops in total. All the `while` loops together therefore do at most $n$ pops, plus $n$ pushes from the `for` loop: about $2n$ operations, which is $O(n)$. Space is $O(n)$.
:::

::: check
Why is `list.pop(0)` a poor queue, and what should you use instead? Also, give the time and space cost of reversing a linked list of $n$ nodes in place.
:::

::: answer
`list.pop(0)` shifts every remaining item one place left, so each pop is $O(n)$ and emptying a queue of $n$ items is $O(n^2)$. Use `collections.deque`, whose `popleft` is $O(1)$ (in C++, `std::deque` or `std::queue`). Reversing a linked list in place visits each node once, so it takes $O(n)$ time, and it needs only the pointers `prev`, `cur` and `nxt`, so $O(1)$ extra space.
:::

## Summary

| Idea | How it works | Cost |
|---|---|---|
| Built-in sort | Timsort in Python, `std::sort` in C++ | $O(n \log n)$ time |
| Stable sort | equal keys keep arrival order | Python always; C++ `std::stable_sort` |
| Merge intervals | sort by start, extend or start new | $O(n \log n)$ time, $O(n)$ space |
| Stack | push and pop at the top (LIFO) | $O(1)$ per operation |
| Valid brackets | push openers, match closers | $O(n)$ time, $O(n)$ space |
| Monotonic stack | pop every waiting lower value | $O(n)$ total time, $O(n)$ space |
| Queue | `deque`: `append`, `popleft` (FIFO) | $O(1)$ per operation |
| Reverse linked list | save next, flip arrow, step | $O(n)$ time, $O(1)$ space |
| Fast and slow pointers | fast gains one node per step | $O(n)$ time, $O(1)$ space |

Next lesson follows pointers that branch: trees, then graphs explored with a queue (breadth-first) or a stack (depth-first), and a startup order for flight-software tasks found with topological sort.

::: context timsort The sort inside Python
Timsort was written by Tim Peters for Python in 2002. It looks for stretches of the data that are already in order ("runs") and merges them, like merging sorted piles of cards. Real data — timestamps, log files — is often nearly sorted, and then Timsort runs close to $O(n)$. Its worst case is still $O(n \log n)$, and it is stable. Java uses it to sort objects too.
:::

::: context lambda A function with no name
`lambda e: e[1]` is a tiny function written in one line: it takes `e` and returns `e[1]`. It is the same as writing `def get_priority(e): return e[1]` and passing `get_priority`. The name comes from the Greek letter lambda, used by the logician Alonzo Church in the 1930s for his theory of functions. C++ added its own lambdas in C++11, written with square brackets.
:::

::: context contact-window Why passes are short and overlap
A satellite in low Earth orbit circles in about 90 minutes and moves fast across the sky. A single ground antenna sees it only while it is above the horizon, typically for about ten minutes or less. Operators use networks of antennas around the world, so passes over nearby stations overlap. Merging them tells the planner when the satellite can be reached at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <text x="8" y="32">A</text><text x="8" y="56">B</text><text x="8" y="80">C</text>
    <text x="8" y="124">merged</text>
  </g>
  <rect x="40" y="22" width="80" height="14" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="90" y="46" width="70" height="14" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="220" y="70" width="90" height="14" fill="#8fb8f0" stroke="#1f2a44"/>
  <line x1="30" y1="96" x2="340" y2="96" stroke="#6c7a93" stroke-width="1"/>
  <rect x="40" y="114" width="120" height="14" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="220" y="114" width="90" height="14" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="190" y="140" font-size="11" text-anchor="middle" fill="#b4232c">gap</text>
  <text x="330" y="140" font-size="11" text-anchor="end" fill="#6c7a93">time →</text>
</svg>
```

A and B overlap, so they merge into one window; C stands alone after a gap.
:::

::: context monotonic-stack What the stack looks like
Draw the readings as bars. The stack holds the bars that have not yet seen a taller bar to their right, and from bottom to top they always get shorter. A tall new bar knocks off every shorter bar on top, and becomes their answer.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="30" y="56" width="30" height="84" fill="#8fb8f0"/>
    <rect x="75" y="64" width="30" height="76" fill="#8fb8f0"/>
    <rect x="120" y="44" width="30" height="96" fill="#1d6fd1"/>
    <rect x="165" y="52" width="30" height="88" fill="#8fb8f0"/>
    <rect x="210" y="60" width="30" height="80" fill="#8fb8f0"/>
    <rect x="255" y="36" width="30" height="104" fill="#1d6fd1"/>
    <rect x="300" y="48" width="30" height="92" fill="#8fb8f0"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="45" y="156">21</text><text x="90" y="156">19</text><text x="135" y="156">24</text>
    <text x="180" y="156">22</text><text x="225" y="156">20</text><text x="270" y="156">26</text><text x="315" y="156">23</text>
  </g>
  <g stroke="#b4232c" stroke-width="1.5" fill="none">
    <path d="M45,52 Q90,20 132,40"/>
    <path d="M90,60 Q110,40 128,42"/>
    <path d="M180,48 Q225,14 266,32"/>
    <path d="M225,56 Q245,36 262,34"/>
    <path d="M135,40 Q200,6 272,32"/>
  </g>
  <text x="20" y="175" font-size="11" fill="#b4232c">red arrow: to the first warmer minute</text>
</svg>
```

Each bar is drawn to its height in °C, and each red arrow points from a reading to the first warmer one after it.
:::

::: context deque Both ends open
A deque lets you add and remove at both ends in $O(1)$: `append`, `appendleft`, `pop` and `popleft`. That is why it served as the sliding-window structure two lessons ago and serves as the queue here. `deque(maxlen=100)` even drops the oldest item when full, which is a quick stand-in for the fixed-size ring buffer you will build by hand in lesson 11.
:::

::: context pointer Where the next node lives
In C++ a pointer is a variable that holds a memory address: `Node* next` says "the next node is at this address". Python has no raw addresses, but every variable is a reference to an object, which behaves the same way for a linked list. Setting `cur.next = prev` does not copy any node; it only changes where one arrow points.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#fff">
    <rect x="20" y="20" width="44" height="28"/><rect x="100" y="20" width="44" height="28"/>
    <rect x="180" y="20" width="44" height="28"/><rect x="260" y="20" width="44" height="28"/>
    <rect x="20" y="82" width="44" height="28"/><rect x="100" y="82" width="44" height="28"/>
    <rect x="180" y="82" width="44" height="28"/><rect x="260" y="82" width="44" height="28"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="42" y="39">A</text><text x="122" y="39">B</text><text x="202" y="39">C</text><text x="282" y="39">D</text>
    <text x="42" y="101">A</text><text x="122" y="101">B</text><text x="202" y="101">C</text><text x="282" y="101">D</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="64" y1="34" x2="96" y2="34"/><line x1="144" y1="34" x2="176" y2="34"/><line x1="224" y1="34" x2="256" y2="34"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="100,34 92,30 92,38"/><polygon points="180,34 172,30 172,38"/><polygon points="260,34 252,30 252,38"/>
  </g>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="100" y1="96" x2="68" y2="96"/><line x1="180" y1="96" x2="148" y2="96"/><line x1="260" y1="96" x2="228" y2="96"/>
  </g>
  <g fill="#b4232c">
    <polygon points="64,96 72,92 72,100"/><polygon points="144,96 152,92 152,100"/><polygon points="224,96 232,92 232,100"/>
  </g>
  <text x="312" y="39" font-size="11" fill="#6c7a93">before</text>
  <text x="312" y="101" font-size="11" fill="#6c7a93">after</text>
</svg>
```

Reversing keeps every box where it is and turns each arrow around.
:::

::: context tortoise-and-hare Two runners on a looping track
The method is usually credited to the computer scientist Robert W. Floyd, which is why it carries his name, and the runners are nicknamed after the fable of the tortoise and the hare. On a straight track the hare simply finishes first. On a track that loops, the hare comes around behind the tortoise and, gaining one step at a time, must eventually land on the same spot. The same idea checks for loops in any "follow the next pointer" chain, such as a corrupted linked list of free memory blocks.
:::
