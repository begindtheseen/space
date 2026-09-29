---
id: l06-trees-and-graphs
title: Trees, graphs, BFS, DFS and topological sort
minutes: 24
covers:
  - Trees and BFS/DFS; graphs including topological sort; heaps; prefix sums; light dynamic programming; bit manipulation
---

Think about the folders on a computer. There is one top folder. Inside it are a few folders, inside each of those are more, and at the bottom are files with nothing inside. Every folder has exactly one parent folder. That shape — one top, branching down, no loops — is a **tree**.

Now think about a subway map. Stations connect to other stations in any pattern. You can go around in circles. There is no "top". That looser shape is a **graph**. And think about getting dressed: socks before shoes, shirt before jacket. Some things must happen before others. Finding an order that respects every "before" rule is called **topological sort**.

All three are everywhere in aerospace software. A spacecraft's parts list is a tree of assemblies. A planner's map of reachable terrain is a graph. The flight computer must start its software tasks in an order where each task's inputs are already running, and a build system must compile libraries before the programs that use them. Last lesson's linked list had one arrow out of each node. Here each node can have many.

## Trees

A **tree** is a set of **nodes** joined by links, with one **[[root|tree-words]]** node at the top. Every other node has exactly one **parent** above it and any number of **children** below it. A node with no children is a **leaf**. Computer scientists draw trees upside down: root at the top, leaves at the bottom.

In a **binary tree**, each node has at most two children, called **left** and **right**. The **depth** (or height) of a tree is the number of nodes on the longest path from the root down to a leaf.

### Walking every node: traversals

Most tree problems start by visiting every node. The natural way is **recursion** — a function that calls itself on a smaller piece. A tree is a node plus two smaller trees, so "do it to the tree" becomes "do it to this node, then do it to the left tree and the right tree". The empty tree (`None`) is where it stops.

The three depth-first orders differ only in *when* you record the node:

- **Preorder**: the node, then its left subtree, then its right subtree.
- **Inorder**: left subtree, then the node, then right subtree.
- **Postorder**: left subtree, then right subtree, then the node.

```python
class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def preorder(node, out):
    if node is None:
        return
    out.append(node.val)          # visit the node first
    preorder(node.left, out)
    preorder(node.right, out)


def inorder(node, out):
    if node is None:
        return
    inorder(node.left, out)
    out.append(node.val)          # visit the node between its subtrees
    inorder(node.right, out)


def depth(node):
    if node is None:
        return 0
    return 1 + max(depth(node.left), depth(node.right))


#        50
#      /    \
#    30      70
#   /  \       \
#  20   40      80
root = TreeNode(50, TreeNode(30, TreeNode(20), TreeNode(40)),
                TreeNode(70, None, TreeNode(80)))
p, i = [], []
preorder(root, p)
inorder(root, i)
print(p)
print(i)
print(depth(root), depth(None))
# [50, 30, 20, 40, 70, 80]
# [20, 30, 40, 50, 70, 80]
# 3 0
```

Read `depth` aloud: "an empty tree has depth zero; otherwise it is one for this node, plus the deeper of my two subtrees". The tree above has depth 3: the path 50 → 30 → 20 has three nodes. Every traversal and `depth` touch each node once, so they take $O(n)$ time. The space is $O(h)$, where $h$ is the depth, because each unfinished call waits on the **[[call stack|call-stack]]** until its children finish.

The fourth order visits the tree **level by level**: 50, then 30 and 70, then 20, 40 and 80. That is breadth-first search on a tree, and it needs a queue. It comes up again below.

### The binary search tree

Look at the inorder output: it came out sorted. That is no accident. This tree is a **binary search tree** (BST): for every node, everything in its left subtree is smaller and everything in its right subtree is bigger.

That rule makes searching fast. Looking for 40? Start at 50: smaller, go left. At 30: bigger, go right. Found it. Each step goes down one level, so a search costs $O(h)$. If the tree is **balanced** — levels roughly full — then $h$ is about $\log_2 n$, and search is $O(\log n)$, like binary search on a sorted array.

::: warning A BST is only fast when it is balanced
Insert $10, 20, 30, 40, 50$ in that order into an empty BST and each goes to the right of the last. The "tree" is a straight line of depth 5, and search is $O(n)$. When you state BST costs, say "$O(h)$, which is $O(\log n)$ if balanced and $O(n)$ in the worst case." Library containers such as C++'s `std::map` use **[[self-balancing trees|balanced-trees]]** so that never happens.
:::

## Graphs and adjacency lists

A **graph** is a set of **vertices** (points; also called nodes) joined by **edges** (links). We write $V$ for the number of vertices and $E$ for the number of edges. In an **undirected** graph an edge works both ways, like a two-way road. In a **directed** graph each edge is an arrow, like a one-way street or a rule "A must start before B".

The standard way to store a graph in an interview is an **adjacency list**: a dict that maps each vertex to the list of its neighbors.

```python
links = {
    "Madrid":    ["Canberra", "Goldstone"],
    "Canberra":  ["Madrid"],
    "Goldstone": ["Madrid"],
}
print(links["Madrid"])
# ['Canberra', 'Goldstone']
```

It takes $O(V + E)$ space: one entry per vertex, plus one list item per edge (two per edge if undirected). Finding a vertex's neighbors takes $O(1)$ to look them up, plus the time to read them. The alternative, an **[[adjacency matrix|adjacency-matrix]]**, uses a $V \times V$ table.

A **grid** is a graph in disguise. Each cell is a vertex, and its up, down, left and right cells are its neighbors. Grid problems rarely build the adjacency list at all; they compute the neighbors on the fly.

## Breadth-first search: ripples in a pond

Drop a stone into a pond. The ripple reaches everything 1 meter away, then everything 2 meters away, then 3. **Breadth-first search** (BFS) explores a graph the same way: first the start, then every vertex one edge away, then every vertex two edges away, and so on.

The tool that keeps that order is a **queue** (first in, first out). Put the start in. Then repeatedly take the vertex at the front, and add each unvisited neighbor to the back. Keep a **visited** set so no vertex is added twice, or loops in the graph would trap you forever.

Because BFS reaches everything at distance 1 before anything at distance 2, the first time it reaches a vertex is by the **fewest possible edges**. So BFS finds shortest paths when every edge counts the same, such as moves on a grid.

::: key BFS and DFS
BFS uses a queue and visits in rings of increasing distance; it finds fewest-edge paths in an unweighted graph. DFS uses a stack (or recursion) and follows one path as deep as it goes before backing up. Both take $O(V + E)$ time and $O(V)$ space for the visited set; on a grid with $R$ rows and $C$ columns that is $O(RC)$.
:::

::: example A rover crossing a rocky field
A terrain map marks safe cells with `.` and rocks with `#`. The rover moves one cell up, down, left or right per move. What is the fewest number of moves from the top-left corner $(0, 0)$ to other cells? Coordinates are (row, column), counting from 0.

```python
from collections import deque


def fewest_moves(grid, start, goal):
    rows, cols = len(grid), len(grid[0])
    dist = {start: 0}                 # also serves as the visited set
    q = deque([start])
    while q:
        r, c = q.popleft()
        if (r, c) == goal:
            return dist[(r, c)]
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if (0 <= nr < rows and 0 <= nc < cols
                    and grid[nr][nc] == "." and (nr, nc) not in dist):
                dist[(nr, nc)] = dist[(r, c)] + 1
                q.append((nr, nc))
    return -1                         # the goal cannot be reached


terrain = ["..#..",
           ".##.#",
           "...#.",
           "#....",
           "..#.."]
print(fewest_moves(terrain, (0, 0), (0, 4)))
print(fewest_moves(terrain, (0, 0), (4, 4)))
print(fewest_moves(terrain, (0, 0), (0, 0)))
# -1
# 8
# 0
```

**To $(4, 4)$, the bottom-right corner: 8 moves.** One shortest route goes down to $(2, 0)$, right along row 2 to $(2, 2)$, down to $(3, 2)$, right along row 3 to $(3, 4)$, then down to $(4, 4)$: $2 + 2 + 1 + 2 + 1 = 8$ moves. Sanity check: the corner is 4 rows down and 4 columns across, and every move changes only one of those by one, so no route can be shorter than $4 + 4 = 8$. BFS found a route that meets that floor.

**To $(0, 4)$, the top-right corner: $-1$.** The cells $(0, 3)$, $(0, 4)$ and $(1, 3)$ form a pocket walled off by rocks at $(0, 2)$, $(1, 2)$, $(1, 4)$ and $(2, 3)$. The queue empties without reaching it. **Start equals goal: 0 moves**, returned on the first step.

The grid has $R = C = 5$. Each cell enters the queue at most once and checks 4 neighbors, so time is $O(RC)$ and space is $O(RC)$ for `dist` and the queue.
:::

::: warning Mark visited when you add, not when you remove
Put a vertex in the visited set (here, `dist`) at the moment you add it to the queue. If you wait until you pop it, the same cell can be added several times by different neighbors first. The answer is still right, but the queue can grow far larger than $V$.
:::

## Depth-first search: follow one hallway to the end

Exploring a maze with a ball of string, you walk down one hallway as far as it goes. At a dead end you back up to the last junction and try the next hallway. That is **depth-first search** (DFS). It uses a **stack** instead of a queue — or recursion, which is a stack the language keeps for you.

DFS does not find shortest paths. It shines when you need to reach everything connected to a place, detect loops, or explore all the options. A common medium: count the separate groups in a grid.

::: example Hot-pixel clusters on a detector
A star tracker's image sensor is tested in the dark. Pixels that read bright anyway are "hot" (marked 1). Touching hot pixels (up, down, left, right) form one cluster. How many clusters are there?

```python
def count_clusters(img):
    rows, cols = len(img), len(img[0])
    seen = set()
    clusters = 0
    for r in range(rows):
        for c in range(cols):
            if img[r][c] == 1 and (r, c) not in seen:
                clusters += 1             # a new cluster: flood all of it
                stack = [(r, c)]
                seen.add((r, c))
                while stack:
                    cr, cc = stack.pop()  # pop from the top: depth-first
                    for nr, nc in ((cr + 1, cc), (cr - 1, cc), (cr, cc + 1), (cr, cc - 1)):
                        if (0 <= nr < rows and 0 <= nc < cols
                                and img[nr][nc] == 1 and (nr, nc) not in seen):
                            seen.add((nr, nc))
                            stack.append((nr, nc))
    return clusters


detector = [[1, 1, 0, 0, 0, 1],
            [0, 1, 0, 0, 1, 1],
            [0, 0, 0, 1, 0, 0],
            [1, 0, 0, 1, 1, 0]]
print(count_clusters(detector))
# 4
```

Scan the rows. At $(0, 0)$ we meet an unseen hot pixel: cluster 1. The DFS floods $(0, 0)$, $(0, 1)$ and $(1, 1)$. At $(0, 5)$: cluster 2, which floods $(0, 5)$, $(1, 5)$ and $(1, 4)$. At $(2, 3)$: cluster 3, flooding $(2, 3)$, $(3, 3)$ and $(3, 4)$. At $(3, 0)$: cluster 4, a lone pixel. Every other hot pixel is already in `seen` when the scan reaches it. Total: 4.

Sanity check: there are 10 hot pixels, and $3 + 3 + 3 + 1 = 10$, so every one belongs to exactly one cluster. Time $O(RC)$ — each pixel is pushed at most once — and space $O(RC)$ for `seen` and the stack.
:::

Swap `stack.pop()` for a deque's `popleft()` and the same code becomes BFS. It still counts 4 clusters: for "what is connected?" either order works.

::: warning Deep recursion in Python
A recursive DFS on a $1000 \times 1000$ grid can go a million calls deep. Python stops at about 1000 by default and raises `RecursionError`. For grids and long chains, use an explicit stack as above, and say why.
:::

## Topological sort: what starts first

When a flight computer boots, its software tasks cannot all start at once. The clock driver needs power. The IMU (the inertial measurement unit, which senses rotation and acceleration) needs the clock and the data bus. Navigation needs the IMU and GPS. These "must start before" rules form a directed graph with an arrow from each task to the tasks that need it. A **topological order** lists every task so that every arrow points forward in the list.

Such an order exists only if the graph has no cycle. A directed graph with no cycle is a **[[DAG|dag]]**, short for directed acyclic graph.

### Kahn's algorithm

Here is the everyday version. Look at the task list and start everything that waits on nothing. Once those are running, some other tasks no longer wait on anything, so start those. Repeat.

To make that precise, give each vertex an **in-degree**: the number of arrows pointing into it, meaning the number of tasks it still waits for.

1. Compute every vertex's in-degree.
2. Put every vertex with in-degree 0 into a queue. These are ready now.
3. Take a vertex from the queue and add it to the order. For each arrow leaving it, lower the target's in-degree by 1. If that reaches 0, the target is ready: add it to the queue.
4. When the queue is empty, stop. If the order holds every vertex, it is a valid topological order. If some are missing, they wait on each other in a **cycle**.

This is **[[Kahn's algorithm|kahn]]**.

::: key Topological sort
Kahn's algorithm: repeatedly take a vertex with in-degree 0, add it to the order, and lower its neighbors' in-degrees. It runs in $O(V + E)$ time and $O(V + E)$ space. If the order ends up shorter than $V$, the leftover vertices sit on a cycle, so no valid order exists.
:::

::: example A flight computer's startup order
Each task lists the tasks that must be running before it.

```python
from collections import deque


def startup_order(deps):
    """deps maps each task to the tasks that must be running before it."""
    tasks = set(deps)
    for before in deps.values():
        tasks.update(before)
    needed_by = {t: [] for t in tasks}   # edge: before -> after
    indegree = {t: 0 for t in tasks}     # how many tasks each one waits for
    for after, befores in deps.items():
        for b in befores:
            needed_by[b].append(after)
            indegree[after] += 1

    ready = deque(sorted(t for t in tasks if indegree[t] == 0))
    order = []
    while ready:
        t = ready.popleft()
        order.append(t)
        for nxt in sorted(needed_by[t]):
            indegree[nxt] -= 1           # one fewer thing to wait for
            if indegree[nxt] == 0:
                ready.append(nxt)
    if len(order) < len(tasks):
        return None                      # some tasks wait on each other: a cycle
    return order


deps = {
    "clock":     ["power"],
    "bus":       ["power"],
    "imu":       ["clock", "bus"],
    "gps":       ["clock", "bus"],
    "radio":     ["bus"],
    "nav":       ["imu", "gps"],
    "telemetry": ["radio", "nav"],
}
print(startup_order(deps))
deps["power"] = ["telemetry"]            # a bad edit: power now waits on telemetry
print(startup_order(deps))
# ['power', 'bus', 'clock', 'radio', 'gps', 'imu', 'nav', 'telemetry']
# None
```

There are $V = 8$ tasks and $E = 11$ arrows. The starting in-degrees are: power 0; clock, bus and radio 1; imu, gps, nav and telemetry 2. (The `sorted` calls only make the output the same every run; any ready task may go next.)

- Only power has in-degree 0. Start it. Clock and bus drop to 0: both ready.
- Start bus. Gps and imu drop to 1; radio drops to 0: ready.
- Start clock. Gps and imu drop to 0: both ready.
- Start radio. Telemetry drops to 1.
- Start gps (nav drops to 1), then imu (nav drops to 0: ready).
- Start nav. Telemetry drops to 0. Start telemetry.

All 8 tasks are in the order. Check a few arrows: power is first; imu comes after both clock and bus; telemetry is last, after radio and nav. Every rule points forward.

Then someone edits the file so power waits on telemetry. Now every task waits on something, no in-degree is 0, the queue starts empty, and the order holds 0 of 8 tasks. The function returns `None`: there is a cycle, power → bus → radio → telemetry → power, and no startup order can satisfy it.

Time $O(V + E)$: each task enters the queue once and each arrow is followed once. (The `sorted` calls add a small $O(E \log E)$ that you would drop when order does not matter.) Space $O(V + E)$ for the adjacency list and in-degrees.
:::

::: warning Get the arrow direction right
Decide out loud what an arrow means: "an arrow from A to B means A must start before B." Then in-degree counts what a task *waits for*. If you flip the arrows by accident, Kahn's algorithm happily returns the order exactly backwards — telemetry first, power last. Check the first item: it should be something that depends on nothing.
:::

## Detecting cycles

A cycle in a dependency graph is a real defect: a **[[circular dependency|circular-dependency]]**. Nothing on the loop can ever go first. There are three standard ways to find one, and you should be able to name the one that fits.

**Directed graph, method 1: Kahn.** Run Kahn's algorithm. If the order is shorter than $V$, there is a cycle. You already have the code.

**Directed graph, method 2: DFS with three colors.** Give every vertex a color. **White** means not visited yet. **Gray** means "on the path I am exploring right now". **Black** means "finished, and everything below it too". If DFS ever follows an arrow to a *gray* vertex, it has walked back into its own path: a cycle.

```python
WHITE, GREY, BLACK = 0, 1, 2   # not visited, on the current path, finished


def has_cycle(graph):
    color = {v: WHITE for v in graph}

    def visit(v):
        color[v] = GREY                    # v is on the path we are exploring
        for w in graph[v]:
            if color[w] == GREY:
                return True                # an edge back into our own path
            if color[w] == WHITE and visit(w):
                return True
        color[v] = BLACK                   # everything below v is done
        return False

    return any(color[v] == WHITE and visit(v) for v in graph)


build = {"msg": ["io"], "io": ["util"], "util": [], "app": ["msg", "util"]}
print(has_cycle(build))
build["util"] = ["msg"]                    # util now needs msg: msg -> io -> util -> msg
print(has_cycle(build))
# False
# True
```

Here each software module lists the modules it needs to be built first. At first, `app` needs `msg` and `util`, and `util` is reached twice — once through `msg` and `io`, once directly. Reaching a *black* vertex again is fine: it is a shared dependency, not a loop. After the edit, following `msg` → `io` → `util` leads back to `msg`, which is still gray, so it reports a cycle. Time $O(V + E)$; space $O(V)$ for the colors and the recursion.

**Undirected graph: DFS with a parent.** In an undirected graph every edge goes both ways, so stepping back to the vertex you just came from is not a loop. Run DFS remembering each vertex's parent. Meeting an already-visited vertex that is *not* your parent means a cycle.

::: warning Visited is not the same as on the path
In a directed graph, "I have seen this vertex before" does not mean a cycle. In the build example, `util` is seen twice and there is no loop. Only an arrow back to a gray vertex — one still on the current path — proves a cycle. Using a plain visited set here gives false alarms.
:::

## Check yourself

::: check
Write out the preorder, inorder and postorder of this tree: root 8 with left child 3 and right child 10; 3 has children 1 (left) and 6 (right); 10 has one child, 14, on the right. What is its depth, and why is the inorder sorted?
:::

::: answer
Preorder (node, left, right): $8, 3, 1, 6, 10, 14$. Inorder (left, node, right): $1, 3, 6, 8, 10, 14$. Postorder (left, right, node): $1, 6, 3, 14, 10, 8$.

Depth: the longest root-to-leaf paths, $8 \to 3 \to 1$, $8 \to 3 \to 6$ and $8 \to 10 \to 14$, each have 3 nodes, so the depth is 3.

It is a binary search tree: at every node, the left subtree is smaller and the right subtree bigger. Inorder visits the whole left subtree, then the node, then the right subtree, so it lists smaller values before the node and larger ones after — sorted. Each traversal is $O(n)$ time and $O(h)$ space.
:::

::: check
You need the fewest hops between two ground stations in a network where every link counts the same. Which search do you use, what structure drives it, and what does it cost?
:::

::: answer
Breadth-first search, driven by a queue (a `deque` in Python). BFS reaches vertices in order of distance, so the first time it reaches the destination is along a fewest-hop path. Time $O(V + E)$, space $O(V)$ for the visited set and queue. DFS would find *a* path, but not necessarily the shortest.
:::

::: check
Run BFS by hand on the grid below from the top-left $(0, 0)$ to the bottom-left $(2, 0)$, moving up, down, left or right through `.` cells. How many moves? The grid, row by row, is `["...", "##.", "..."]`.
:::

::: answer
Row 1 is blocked at $(1, 0)$ and $(1, 1)$, so the rover must go around through $(1, 2)$. Distance 1: $(0, 1)$. Distance 2: $(0, 2)$. Distance 3: $(1, 2)$. Distance 4: $(2, 2)$. Distance 5: $(2, 1)$. Distance 6: $(2, 0)$. So 6 moves. Sanity check: the straight-line floor would be 2 moves, but the wall forces a detour across the width and back, $2 + 2 + 2 = 6$. Time and space $O(RC)$ with $R = C = 3$.
:::

::: check
Five build steps have these rules: A before B, A before C, B before D, C before D, D before E. Run Kahn's algorithm and give an order. Then add "E before A". What happens, and how does the algorithm tell you?
:::

::: answer
In-degrees: A 0, B 1, C 1, D 2, E 1. Queue: A. Take A; B and C drop to 0. Take B; D drops to 1. Take C; D drops to 0. Take D; E drops to 0. Take E. Order: A, B, C, D, E (A, C, B, D, E is also valid).

With "E before A", A's in-degree becomes 1 and no step has in-degree 0. The queue starts empty, the order has 0 of 5 steps, and since $0 < 5$ the algorithm reports a cycle: A → B → D → E → A. Time and space $O(V + E)$.
:::

::: check
In a directed graph, a DFS reaches a vertex that it has already visited. Is that a cycle? Explain using the three colors.
:::

::: answer
Not necessarily. If the vertex is **black**, it was fully finished earlier by another route — a shared dependency, like `util` being needed by both `io` and `app`. That is not a loop. Only if the vertex is **gray**, meaning it is still on the path currently being explored, has DFS followed an arrow back into its own path, which is a cycle. The check costs $O(V + E)$ time and $O(V)$ space.
:::

## Summary

| Idea | How it works | Cost |
|---|---|---|
| Tree traversals | pre-, in-, postorder by recursion | $O(n)$ time, $O(h)$ space |
| Depth | $1 + \max$ of the two subtrees' depths; empty is 0 | $O(n)$ time, $O(h)$ space |
| Binary search tree | left smaller, right bigger; inorder is sorted | search $O(h)$: $O(\log n)$ balanced, $O(n)$ worst |
| Adjacency list | dict from vertex to neighbors | $O(V + E)$ space |
| BFS | queue, visited set, rings of distance | $O(V + E)$ time; fewest-edge paths |
| DFS | stack or recursion, go deep then back up | $O(V + E)$ time; connectivity, cycles |
| Kahn's topological sort | take in-degree 0, lower neighbors | $O(V + E)$; short order means a cycle |
| Directed cycle by DFS | an arrow to a gray vertex | $O(V + E)$ time, $O(V)$ space |

Next lesson finishes the high-yield list: heaps for "the $k$ largest" and the running median, prefix sums for fast range totals, light dynamic programming, and bit manipulation.

::: context tree-words Why a tree grows downward
The words come from family trees and real trees, mixed together: root, branch and leaf from the plant; parent, child and sibling from the family. Computer scientists draw the root at the top only because we read top to bottom.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="180" y1="30" x2="110" y2="80"/><line x1="180" y1="30" x2="250" y2="80"/>
    <line x1="110" y1="80" x2="70" y2="130"/><line x1="110" y1="80" x2="150" y2="130"/>
    <line x1="250" y1="80" x2="290" y2="130"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <circle cx="180" cy="30" r="15" fill="#1d6fd1"/>
    <circle cx="110" cy="80" r="15" fill="#8fb8f0"/><circle cx="250" cy="80" r="15" fill="#8fb8f0"/>
    <circle cx="70" cy="130" r="15" fill="#f2b880"/><circle cx="150" cy="130" r="15" fill="#f2b880"/>
    <circle cx="290" cy="130" r="15" fill="#f2b880"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="180" y="34" fill="#fff">50</text><text x="110" y="84">30</text><text x="250" y="84">70</text>
    <text x="70" y="134">20</text><text x="150" y="134">40</text><text x="290" y="134">80</text>
  </g>
  <g font-size="11" fill="#6c7a93">
    <text x="205" y="34">root</text><text x="275" y="84">parent of 80</text><text x="190" y="162">leaves (no children)</text>
  </g>
</svg>
```

This is the lesson's tree: depth 3, with three leaves.
:::

::: context call-stack Where the waiting calls live
Every time a function calls another, the computer saves its place on the call stack, then picks it up again when the inner call returns. A recursive traversal on a tree of depth $h$ has at most $h$ calls waiting at once, which is why its space is $O(h)$. A balanced tree of a million nodes has depth about 20; a tree shaped like a straight line has depth a million, and that is when recursion runs out of room.
:::

::: context balanced-trees Trees that fix their own shape
A self-balancing tree does a little extra work on each insert — rotating a few nodes — to keep its depth near $\log_2 n$. Red-black trees and AVL trees are the famous kinds. Most C++ standard libraries build `std::map` and `std::set` on a red-black tree, which is why their operations are $O(\log n)$ in the worst case. You will not be asked to code one; you should know they exist and why.
:::

::: context adjacency-matrix The other way to store a graph
An adjacency matrix is a $V \times V$ grid of true/false: row A, column B says whether there is an edge from A to B. Checking one edge is $O(1)$, but the space is $O(V^2)$ even if there are few edges, and listing a vertex's neighbors costs $O(V)$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="40" y1="40" x2="100" y2="100"/><line x1="40" y1="40" x2="100" y2="30"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <circle cx="40" cy="40" r="13"/><circle cx="100" cy="30" r="13"/><circle cx="100" cy="100" r="13"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="40" y="44">M</text><text x="100" y="34">C</text><text x="100" y="104">G</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#6c7a93">
    <text x="215" y="22">M</text><text x="255" y="22">C</text><text x="295" y="22">G</text>
    <text x="180" y="50">M</text><text x="180" y="80">C</text><text x="180" y="110">G</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1" fill="#fff">
    <rect x="195" y="30" width="40" height="30"/><rect x="235" y="30" width="40" height="30" fill="#1d6fd1"/><rect x="275" y="30" width="40" height="30" fill="#1d6fd1"/>
    <rect x="195" y="60" width="40" height="30" fill="#1d6fd1"/><rect x="235" y="60" width="40" height="30"/><rect x="275" y="60" width="40" height="30"/>
    <rect x="195" y="90" width="40" height="30" fill="#1d6fd1"/><rect x="235" y="90" width="40" height="30"/><rect x="275" y="90" width="40" height="30"/>
  </g>
  <text x="255" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">blue: an edge (9 cells for 2 edges)</text>
</svg>
```

The three-station graph from the lesson: Madrid (M) links to Canberra (C) and Goldstone (G).
:::

::: context dag Graphs with no way back
DAGs are everywhere in engineering. A build system such as `make` or Bazel reads which files depend on which and compiles them in a topological order. Spreadsheet programs recompute cells in a topological order of their formulas. Schedulers for test campaigns and launch countdown checklists have the same shape: tasks with "must finish before" arrows and no loops.
:::

::: context kahn A 1962 algorithm still in daily use
The method is named after Arthur B. Kahn, who published it in 1962 in a paper on sorting large networks of tasks. Its appeal is that it matches how people already plan: do what is ready, then see what that unlocks. It also gives cycle detection for free, which a build tool needs so it can report "circular dependency" instead of hanging.
:::

::: context circular-dependency A loop nothing can start
If A waits for B and B waits for A, both wait forever. In software builds this shows up as a circular include or import. In running systems the same shape, with tasks each holding something the next one needs, is called a deadlock.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#b4232c" stroke-width="2" fill="none">
    <path d="M150,40 L202,40"/><path d="M240,55 L240,87"/><path d="M210,110 L158,110"/><path d="M120,95 L120,63"/>
  </g>
  <g fill="#b4232c">
    <polygon points="210,40 200,35 200,45"/><polygon points="240,95 235,85 245,85"/>
    <polygon points="150,110 160,105 160,115"/><polygon points="120,55 115,65 125,65"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#fff">
    <rect x="90" y="25" width="60" height="30" rx="4"/><rect x="210" y="25" width="60" height="30" rx="4"/>
    <rect x="210" y="95" width="60" height="30" rx="4"/><rect x="90" y="95" width="60" height="30" rx="4"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="120" y="44">power</text><text x="240" y="44">bus</text>
    <text x="240" y="114">radio</text><text x="120" y="114">telemetry</text>
  </g>
  <text x="180" y="144" font-size="11" text-anchor="middle" fill="#6c7a93">each arrow: must start before</text>
</svg>
```

This is the cycle the bad edit created in the startup example. Every task on it waits on the one before it.
:::
