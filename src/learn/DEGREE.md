# The Computer Science degree in Learn to code

## The bar

Someone who finishes this roadmap can program, reason about programs, and build systems as well
as a strong computer science graduate. The coverage follows the ACM/IEEE CS2023 core and a
typical accredited bachelor's program. That rules out tutorial depth: every course goes as far as
a university course does, and every idea is practised until it is automatic.

What ORBIT already carries:

- **The languages:** Python, C++ and SQL from basics to expert, plus projects.
- **The tools:** the command line, git, testing, CI and Docker.
- **The math:** calculus, linear algebra, probability, numerical methods and optimisation, in the
  modules.

The degree courses add what a bachelor's has on top of those:

| # | Course | File | Runs in |
|---|---|---|---|
| 1 | Data Structures & Algorithms I | `cs.01-dsa1.txt` | Python |
| 2 | Data Structures & Algorithms II | `cs.02-dsa2.txt` | Python |
| 3 | Data Structures in C++ | `cs.03-dsa-cpp.txt` | C++ |
| 4 | Discrete Mathematics | `cs.04-discrete.txt` | Python |
| 5 | Computer Organization | `cs.05-organization.txt` | Python (simulators) |
| 6 | Systems Programming | `cs.06-systems.txt` | C++ in C style |
| 7 | Operating Systems | `cs.07-os.txt` | Python and C++ |
| 8 | Computer Networks | `cs.08-networks.txt` | Python |
| 9 | Theory of Computation | `cs.09-theory.txt` | Python |
| 10 | Programming Languages & Compilers | `cs.10-compilers.txt` | Python |
| 11 | Security | `cs.11-security.txt` | Python and C++ |
| 12 | Parallel & Distributed Computing | `cs.12-parallel.txt` | Python and C++ |
| 13 | Capstones | `cs.13-capstones.txt` | Python and C++ |

## What every lesson holds

A degree lesson follows `TEMPLATE.md` (the plain voice, one idea per step, context notes at the
end, no giveaways) and `PRACTICE.md` (5–8 practice problems). On top of those, it carries what a
university lecture would:

1. **The definition.** Say it precisely, and then in everyday words.
2. **Why it is correct.** The invariant, or a proof sketch in plain steps. For example: "after
   each pass of the loop, the first *i* items are sorted, because…". The learner should be able
   to argue correctness, not only run tests.
3. **What it costs.** Time and space in big-O, with the reason: count the loop iterations, write
   the recurrence, or name the amortised argument. When it matters, also say the best, worst and
   expected cases.
4. **Built from scratch first.** When a lesson is about a structure or an algorithm, the learner
   implements it. Library versions (`heapq`, `collections.deque`, `bisect`, `std::priority_queue`)
   come after, in a lesson that says when to use them.
5. **Where it is used**, in real systems, and in ORBIT's world where it fits naturally: telemetry
   streams, scheduling, route planning, sensor data.
6. **The mistakes people make.** A "Watch out" for the classic bug: off by one, forgetting the
   empty case, a broken invariant, integer overflow.

Tasks and practice problems test all of this with checks on many cases, including edge cases.
Where the lesson is about efficiency, a check proves it in one of two ways:

- **by counting:** wrap the comparisons or array accesses and check the count grows like
  n log n, not n²;
- **by size:** run an input large enough that a quadratic answer cannot finish inside the
  30-second limit while the right answer takes about a second.

Prefer counting when it is natural. It is exact, and it keeps the test suite fast.

## The file

```text
@track python
@course cs-dsa1
@subject Computer Science
@level intermediate
@title DSA I
@name Data Structures and Algorithms I: analysis, lists, sorting, hashing, trees and graphs
@blurb One or two sentences on what the course lets you do.
@plainvoice true

=== dsa1-01 | …
…
=== dsa1-gate | Data Structures and Algorithms I: mastery gate
```

Lesson ids are `<prefix>-NN` (for example `dsa1-07`). A lesson split in two gets a letter
(`dsa1-07b`). Never change an id once it has shipped.

## Writing a course in parts

Several writers can draft one course at once. Each writes a whole course file of their own
lessons, with the header above, into the scratchpad. Checking it takes one command:

```sh
LEARN_DRAFT=/path/to/part.txt npx vitest run src/learn/draft.test.ts
```

The checker holds the part to every rule a shipped course meets, and runs every problem's
solution and starter for real. The coordinator joins the parts into the course file, in order,
and adds the gate.

## DSA I: syllabus (`dsa1`)

Python. Assumes the Python courses up to intermediate. Every structure is built from scratch.

1. **What an algorithm is.** Correctness, loop invariants. Prove linear search and running
   maximum correct.
2. **Counting steps.** Operation counts, growth rates, why constants drop out.
3. **Big-O, Big-Omega, Big-Theta.** The formal definitions, the common classes, comparing
   functions.
4. **Analysing loops.** Nested and dependent loops, arithmetic and geometric sums.
5. **Recursion and the call stack.** Base cases, stack depth, writing recurrences.
6. **Solving recurrences.** Substitution, recursion trees, the master theorem.
7. **Arrays and dynamic arrays.** Memory, O(1) indexing, a `DynamicArray` class that doubles.
8. **Amortised analysis.** The aggregate and accounting methods, on the dynamic array.
9. **Singly linked lists.** Insert, delete, search, reverse in place.
10. **Doubly linked lists.** Sentinel nodes, O(1) removal given a node.
11. **Stacks.** Build one; balanced brackets; evaluating postfix expressions.
12. **Queues and deques.** A circular buffer with a fixed capacity, then growable.
13. **Binary search.** The invariant-based version; `lower_bound` and `upper_bound`; the off-by-one
    traps.
14. **Binary search on the answer.** Monotone predicates, and minimising a maximum.
15. **Selection and insertion sort.** Invariants, stability, when insertion sort wins.
16. **Merge sort.** Implementation, correctness, the O(n log n) recurrence, counting inversions.
17. **Quicksort.** Lomuto and Hoare partitions, random pivots, expected O(n log n), the worst case.
18. **Sorting's lower bound.** The decision tree argument; counting sort; radix sort.
19. **Selection.** Quickselect, expected linear time; median of medians as an idea.
20. **Hash tables with chaining.** Hash functions, a `HashMap` class, resizing.
21. **Open addressing.** Linear probing, tombstones, load factor, clustering.
22. **Hashing in practice.** Two-sum, grouping, deduplication, frequency counts; Python's `dict`
    and `set`.
23. **Trees.** The vocabulary; binary tree traversals, recursive and iterative.
24. **Binary search trees.** Search, insert, delete (all three cases); in-order traversal gives
    sorted order.
25. **Balance.** Height, the degenerate case, rotations.
26. **AVL trees.** Insert with rebalancing; the height bound.
27. **Red-black trees.** The left-leaning red-black tree, and its link to 2-3 trees; insert.
28. **Binary heaps.** The array layout, sift up and sift down, O(n) heapify with the proof.
29. **Priority queues.** Heapsort; the k smallest; merging k sorted lists; then `heapq`.
30. **Tries.** Insert, search, prefix counts, autocomplete.
31. **Union-find.** Union by rank, path compression, near-constant time.
32. **Graphs.** Adjacency lists and matrices, reading edge lists, degrees.
33. **Breadth-first search.** Shortest paths in unweighted graphs, levels, parent pointers.
34. **Depth-first search.** Recursive and iterative; discovery and finish times; cycle detection.
35. **Topological sort.** Kahn's algorithm and the DFS version; DAGs; detecting impossible
    orders.
36. **Components.** Connected components; bipartite checking.
37. **Strongly connected components.** Kosaraju's algorithm.
38. **Mastery gate.**

## DSA II: syllabus (`dsa2`)

Python. Assumes DSA I.

1. **Dijkstra's algorithm.** With a heap; the correctness argument; why negative edges break it.
2. **Bellman-Ford.** Negative edges; detecting negative cycles.
3. **Floyd-Warshall.** All-pairs shortest paths; transitive closure.
4. **A\* search.** Admissible heuristics, on grid path finding.
5. **Minimum spanning trees.** The cut property; Kruskal's algorithm with union-find.
6. **Prim's algorithm.** With a heap; dense versus sparse graphs.
7. **Greedy algorithms.** The exchange argument; interval scheduling; when greedy fails.
8. **Huffman coding.** Building the tree, why it is optimal, encoding and decoding.
9. **Divide and conquer.** Karatsuba multiplication; closest pair of points.
10. **Dynamic programming.** Overlapping subproblems; memoisation versus tabulation.
11. **The 0/1 knapsack.** Rebuilding the chosen items; the pseudo-polynomial idea.
12. **Longest common subsequence and edit distance.** With the reconstruction.
13. **Longest increasing subsequence.** O(n²) first, then O(n log n) with patience sorting.
14. **DP on grids.** Path counting with obstacles; the minimum-cost path.
15. **Interval DP.** Matrix-chain order; the optimal cut.
16. **DP on trees.** The maximum independent set on a tree; rerooting.
17. **DP with bitmasks.** The travelling salesperson for small n.
18. **Backtracking.** Subsets, permutations, N-queens, pruning, sudoku.
19. **The KMP algorithm.** The prefix function; linear-time matching.
20. **Rabin-Karp and the Z-algorithm.** Rolling hashes; collisions.
21. **Two pointers and sliding windows.**
22. **Monotonic stacks and queues.** Next greater element; sliding-window maximum.
23. **Prefix sums.** Difference arrays; 2D prefix sums.
24. **Segment trees.** Range queries with point updates; lazy propagation as an idea.
25. **Fenwick trees.** Prefix sums with updates in O(log n).
26. **Sparse tables.** O(1) range-minimum queries on static data.
27. **Maximum flow.** Ford-Fulkerson and Edmonds-Karp; the max-flow min-cut theorem.
28. **Bipartite matching.** Through flow; assignment problems.
29. **Randomised algorithms.** Reservoir sampling; expected-time analysis; skip lists.
30. **Bit manipulation.** Masks, popcount, subsets as integers, XOR tricks.
31. **Number theory algorithms.** Euclid and extended Euclid, fast modular exponentiation, the
    sieve.
32. **Computational geometry.** Orientation tests, segment intersection, convex hull by
    monotone chain.
33. **P, NP and reductions.** What NP-complete means; classic reductions; what to do in practice.
34. **Approximation.** The 2-approximation for vertex cover; greedy set cover; local search.
35. **Choosing a technique.** Mixed problems: recognise which idea a problem needs.
36. **Mastery gate.**
