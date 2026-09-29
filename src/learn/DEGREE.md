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
@requires python-intermediate
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

`@requires` lists the courses whose gates open this one. A degree course builds on particular
courses, not on every course numbered before it, so each names its own:

| Course | Requires |
|---|---|
| `cs-disc`, `cs-dsa1`, `cs-org` | `python-intermediate` |
| `cs-dsa2` | `cs-dsa1` (and `cs-disc` once it ships) |
| `cs-dsacpp` | `cs-dsa1`, `cpp-intermediate` |
| `cs-sys` | `cpp-intermediate`, `cs-org` |
| `cs-os` | `cs-sys` |
| `cs-net`, `cs-theory` | `cs-dsa2`, `cs-disc` |
| `cs-plc` | `cs-theory`, `cs-org` |
| `cs-sec` | `cs-sys`, `cs-net`, `cs-disc` |
| `cs-par` | `cs-os`, `cs-net` |
| capstones | the courses each project draws on |

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

## Data Structures in C++: syllabus (`dsacpp`, `cs.03-dsa-cpp.txt`)

C++. Assumes C++ intermediate and DSA I. The same structures again, where the machine is visible:
memory, ownership, templates, iterators and the standard library's guarantees.

1. **A vector of your own.** Raw storage with `new[]`/`delete[]`, size and capacity, doubling, the
   rule of five.
2. **Growth without leaks.** `std::unique_ptr<T[]>`, moving elements into new storage, which
   operations invalidate iterators.
3. **Templates.** `Vector<T>`, member functions defined in the header, `T` without a default
   constructor.
4. **Iterators.** Begin and end, making `Vector<T>` work with range-for and `<algorithm>`.
5. **A singly linked list with `unique_ptr`.** Ownership down the chain, the recursive-destructor
   stack overflow and the loop that fixes it.
6. **A doubly linked list with raw back pointers.** Owning versus observing pointers, sentinels.
7. **A ring buffer.** A fixed-capacity queue in an array, wrap-around by modulo, full versus empty.
8. **A hash map with chaining.** `std::hash`, buckets as vectors of pairs, rehashing, load factor.
9. **Open addressing.** Linear probing with tombstones, cache behaviour, why it often beats
   chaining.
10. **A binary heap.** `push`, `pop` and heapify on a vector; comparators as template parameters.
11. **A binary search tree.** `unique_ptr` children, insert, find, erase, in-order iteration with a
    stack.
12. **Balanced trees in the library.** `std::map` and `std::set` as red-black trees; `lower_bound`,
    `equal_range`, iterator stability.
13. **`unordered_map` in depth.** Buckets, `reserve`, custom hashes and equality, when reference
    stability holds.
14. **`priority_queue` and adapters.** `std::stack`, `std::queue` and `std::priority_queue` over
    different containers.
15. **Algorithms.** `sort`, `stable_sort`, `nth_element`, `partial_sort`, `partition`; their
    guarantees and costs.
16. **Graphs in C++.** Adjacency lists as `vector<vector<int>>`, BFS with a deque, Dijkstra with
    `priority_queue` and lazy deletion.
17. **Union-find and tries in C++.** Arrays of parents and ranks; a trie over fixed-size child
    arrays.
18. **Measuring.** `std::chrono`, the cost of cache misses (vector against list), big-O versus real
    time.
19. **Mastery gate.**

## Discrete Mathematics: syllabus (`disc`, `cs.04-discrete.txt`)

Python, used as the proof assistant and the calculator. Assumes the Basecamp and precalculus
modules. Proofs are graded three ways:

- by computing the objects the proof talks about;
- by finding counterexamples when a claim is false;
- by questions on each step's justification (which rule, which case, why the induction step
  holds).

1. **Propositions and truth tables.** Connectives; a truth-table builder in Python.
2. **Logical equivalence.** De Morgan, contrapositive and converse; checking equivalence by brute
   force.
3. **Predicates and quantifiers.** Negating ∀ and ∃; checking claims over finite domains.
4. **Direct proof and proof by contrapositive.** Structure, and common mistakes.
5. **Proof by contradiction.** √2 is irrational; there are infinitely many primes.
6. **Proof by cases and counterexamples.** Finding the smallest counterexample by search.
7. **Induction.** Sums, inequalities, divisibility; checking the base case and the step in code.
8. **Strong induction.** Every integer ≥ 2 is a product of primes; making postage with 4s and 5s.
9. **Sets.** Operations, power sets, cartesian products, inclusion-exclusion.
10. **Functions.** Injective, surjective and bijective; composition, inverses, cardinality of
    finite sets.
11. **Countability.** Countable and uncountable; the diagonal argument.
12. **Relations.** Reflexive, symmetric and transitive; equivalence relations and classes;
    partial orders.
13. **Counting.** Sum and product rules, permutations, combinations, arrangements with repetition.
14. **The pigeonhole principle.** The basic and generalised forms, with applications.
15. **Binomial coefficients.** Pascal's triangle, the binomial theorem, combinatorial proofs.
16. **Discrete probability.** Sample spaces, conditional probability, independence, Bayes.
17. **Random variables and expectation.** Linearity of expectation, indicator variables.
18. **Number theory.** Divisibility, gcd by Euclid, the extended Euclidean algorithm.
19. **Modular arithmetic.** Congruences, inverses, fast exponentiation, Fermat's little theorem.
20. **RSA.** Key generation, encryption and decryption from scratch, and why it works.
21. **Recurrences.** Solving linear homogeneous recurrences; characteristic equations.
22. **Generating functions,** as a tool for counting.
23. **Graph theory.** Degrees, handshake lemma, paths, connectivity, trees and their properties.
24. **Euler and Hamilton.** Euler tours, and why Hamilton paths are hard; planarity and Euler's
    formula.
25. **Graph colouring.** Bipartite graphs, greedy colouring, the chromatic number.
26. **Mastery gate.**

## Computer Organization: syllabus (`org`, `cs.05-organization.txt`)

Python, the way nand2tetris does it: the learner builds the machine in software, piece by piece,
and the checks drive it.

1. **Bits and integers.** Binary, hex, unsigned ranges, bit operations in Python.
2. **Two's complement.** Negation, overflow, sign extension, arithmetic versus logical shifts.
3. **Floating point.** IEEE-754 single and double, rounding, the spacing of floats, NaN and
   infinity; decoding bit patterns.
4. **Logic gates.** NAND as universal; building NOT, AND, OR, XOR and MUX from NAND in a gate
   simulator.
5. **Combinational circuits.** Half and full adders, a ripple-carry adder, a 16-bit incrementer.
6. **The ALU.** A 16-bit ALU with flags (zero, negative, carry, overflow).
7. **Sequential logic.** The clock, SR latch, D flip-flop, registers.
8. **Memory.** RAM built from registers, addressing, a program counter.
9. **An instruction set.** RISC-V RV32I: formats, registers, the calling convention.
10. **Assembly.** Arithmetic, branches, loops, arrays; a RISC-V assembler for a subset, in Python.
11. **Functions in assembly.** The stack, `jal`/`jalr`, saving registers, recursion.
12. **A CPU emulator.** Fetch, decode and execute for RV32I; running real assembled programs.
13. **Datapath and control.** The single-cycle datapath; control signals per instruction.
14. **Pipelining.** Five stages, data hazards, forwarding, stalls, branch hazards; timing a
    pipeline.
15. **Performance.** CPI, clock rate, Amdahl's law; measuring the emulator.
16. **The memory hierarchy.** Locality, latency numbers, why caches work.
17. **Caches.** A direct-mapped cache simulator: tag, index, offset, hit rate.
18. **Associativity and replacement.** Set-associative caches, LRU, write-back and write-through.
19. **Cache-aware code.** Loop order and blocking, measured on the simulator.
20. **Virtual memory.** Pages, page tables, address translation, TLBs; a translation simulator.
21. **I/O and interrupts.** Polling, interrupts and DMA, as ideas with simulated devices.
22. **Mastery gate.**

## Systems Programming: syllabus (`sys`, `cs.06-systems.txt`)

C++ written C-style: raw pointers, `malloc` and `free`, arrays and structs. Assumes C++
intermediate and Computer Organization.

1. **C in C++.** Structs, arrays, pointers, `printf`, how C++ differs.
2. **Pointer arithmetic.** Arrays decaying to pointers, strides, one past the end.
3. **Strings in C.** `char` arrays, the terminating NUL, writing `strlen`, `strcpy` and `strcmp`;
   buffer overflows.
4. **The stack and the heap.** Frames, lifetimes, dangling pointers, returning local addresses.
5. **`malloc` and `free`.** Sizes, alignment, leaks and double frees, `realloc`.
6. **Writing an allocator.** A bump allocator, then a free-list allocator with splitting and
   coalescing.
7. **Bit manipulation.** Masks, packing fields, endianness, `memcpy` for type punning.
8. **Structs in memory.** Padding and alignment, `sizeof`, arrays of structs against structs of
   arrays.
9. **Function pointers.** Callbacks, dispatch tables, a hand-built qsort.
10. **Undefined behaviour.** Signed overflow, out-of-bounds, uninitialised reads; what the compiler
    may assume.
11. **Linking.** Translation units, declarations and definitions, `static` and `extern`, headers.
12. **Files and streams.** `fopen`, `fread`, `fwrite`, binary records, buffering.
13. **Error handling without exceptions.** Return codes, `errno`, cleanup paths.
14. **Data structures in C.** A generic dynamic array with `void*`, a hash table of strings.
15. **Mastery gate.**

## Operating Systems: syllabus (`os`, `cs.07-os.txt`)

Python simulators, plus C++ where real code runs. Assumes Systems Programming.

1. **What an OS does.** Kernel and user mode, system calls, the process abstraction.
2. **Processes.** States, the PCB, fork, exec and wait as a simulated model; process trees.
3. **Scheduling I.** FCFS, SJF, round robin; turnaround and waiting time in a scheduler simulator.
4. **Scheduling II.** Priority scheduling, MLFQ, starvation and aging; picking a quantum.
5. **Threads.** Threads against processes, shared memory, race conditions shown with a simulated
   interleaving.
6. **Locks.** Critical sections, Peterson's algorithm, test-and-set; building a spinlock model.
7. **Semaphores and condition variables.** Producer-consumer, bounded buffers.
8. **Classic problems.** Readers-writers, dining philosophers, sleeping barber.
9. **Deadlock.** The four conditions, resource-allocation graphs, the banker's algorithm.
10. **Memory management.** Contiguous allocation, fragmentation, first-fit and best-fit
    simulators.
11. **Paging.** Page tables, multi-level tables, TLBs, effective access time.
12. **Page replacement.** FIFO, LRU, Clock and OPT; Belady's anomaly; a replacement simulator.
13. **File systems.** Inodes, directories, block allocation; a tiny file system in a byte array.
14. **Journaling and crash consistency.** What happens mid-write; logs and fsck as ideas.
15. **I/O and disks.** Disk scheduling, SSDs, buffering.
16. **Virtualisation and containers.** VMs against containers, namespaces and cgroups (linking to
    the Docker module).
17. **Real threads in C++.** `std::thread`, `std::mutex`, `std::condition_variable`: a thread-safe
    queue.
18. **Mastery gate.**

## Computer Networks: syllabus (`net`, `cs.08-networks.txt`)

Python, with simulated links and hosts.

1. **Layers.** The Internet model, encapsulation, what each layer promises.
2. **Links and framing.** Bits on a wire, framing, checksums, CRC implemented.
3. **Ethernet and switching.** MAC addresses, learning switches simulated.
4. **IP.** Addresses, subnets and CIDR, longest-prefix match implemented.
5. **Routing.** Distance-vector (Bellman-Ford) and link-state (Dijkstra) routing simulated.
6. **UDP and ports.** Sockets as endpoints, datagrams, what "unreliable" means.
7. **Reliable transport I.** Stop-and-wait over a lossy simulated link.
8. **Reliable transport II.** Go-Back-N and selective repeat; sequence-number wrap-around.
9. **TCP.** The handshake, flow control, the sliding window.
10. **Congestion control.** AIMD, slow start, fast retransmit; simulating many flows.
11. **DNS.** Names to addresses, recursive and iterative resolution, caching.
12. **HTTP.** Requests and responses, parsing and building messages, status codes, keep-alive.
13. **A client and a server.** Python sockets on localhost: a tiny HTTP server and client.
14. **TLS.** Keys, certificates, the handshake as a protocol; why HTTPS is needed.
15. **Latency and bandwidth.** Bandwidth-delay product, queueing, measuring.
16. **Mastery gate.**

## Theory of Computation: syllabus (`theory`, `cs.09-theory.txt`)

Python: the learner implements the machines and the checks run them.

1. **Alphabets, strings and languages.**
2. **DFAs.** Definition, a DFA simulator, designing DFAs.
3. **NFAs.** Nondeterminism, ε-moves, the subset construction implemented.
4. **Regular expressions.** Thompson's construction; regex to NFA to DFA.
5. **DFA minimisation.** Distinguishable states; the partition-refinement algorithm.
6. **Non-regular languages.** The pumping lemma; proving aⁿbⁿ is not regular.
7. **Context-free grammars.** Derivations, parse trees, ambiguity.
8. **Parsing.** CYK and Chomsky normal form, implemented.
9. **Pushdown automata.** A PDA simulator; the link to CFGs.
10. **Non-context-free languages.** The CFL pumping lemma.
11. **Turing machines.** A TM simulator; programming TMs.
12. **Church-Turing.** Equivalent models; universal machines.
13. **Decidability.** Decidable languages, the halting problem, diagonalisation.
14. **Reductions.** Mapping reductions; Rice's theorem.
15. **Complexity classes.** P and NP, verifiers, polynomial-time reductions.
16. **NP-completeness.** Cook-Levin as an idea; reductions from SAT to 3-SAT, CLIQUE and VERTEX
    COVER.
17. **Beyond NP.** PSPACE, EXPTIME, and what "hard" means in practice.
18. **Mastery gate.**

## Programming Languages & Compilers: syllabus (`plc`, `cs.10-compilers.txt`)

Python. The learner builds a small language end to end.

1. **What a language is.** Syntax and semantics, interpreters and compilers.
2. **Lexing.** Tokens, a hand-written lexer, error positions.
3. **Grammars for parsing.** Precedence and associativity, EBNF.
4. **Recursive-descent parsing.** Expressions to an AST.
5. **Statements and blocks.** Variables, `if`, `while`, the AST for a small imperative language.
6. **A tree-walking interpreter.** Environments, evaluation, runtime errors.
7. **Scope.** Lexical scope, nested environments, shadowing.
8. **Functions and closures.** First-class functions, the call stack, captured environments.
9. **Type checking.** Static types for the language; checking expressions and functions.
10. **Type inference.** Unification; Hindley-Milner in the small.
11. **Functional programming.** Immutability, recursion, map, filter and fold, algebraic data
    types.
12. **Semantic analysis.** Resolving names, catching errors before running.
13. **Intermediate representations.** Three-address code, control-flow graphs.
14. **Optimisation.** Constant folding, dead-code elimination, common subexpressions.
15. **A stack VM.** Designing bytecode, a VM interpreter.
16. **Code generation.** Compiling the AST to the VM's bytecode.
17. **Garbage collection.** Reference counting, mark-and-sweep, copying collectors, simulated.
18. **Register allocation and native code,** as ideas: liveness, graph colouring.
19. **Mastery gate.**

## Security: syllabus (`sec`, `cs.11-security.txt`)

Python and C++.

1. **Thinking like an attacker.** Threat models, assets, trust boundaries.
2. **Memory-safety bugs.** Buffer overflows, use-after-free, format strings, shown in C++ and
   fixed.
3. **Mitigations.** Stack canaries, ASLR, NX, bounds checking, safe APIs.
4. **Injection.** SQL injection demonstrated on SQLite and fixed with parameters; command
   injection.
5. **Web security.** XSS, CSRF, same-origin policy, escaping.
6. **Hashing.** Properties of cryptographic hashes; SHA-256 from the library; integrity checks.
7. **Passwords.** Salting, slow hashes, why MD5 is not enough; verifying without storing.
8. **Symmetric encryption.** Block ciphers and modes; why ECB leaks; authenticated encryption.
9. **Public-key cryptography.** RSA in practice (building on Discrete Math), signatures,
   key exchange.
10. **Protocols.** Replay, nonces, man-in-the-middle; how TLS prevents them.
11. **Authentication and authorisation.** Sessions, tokens, least privilege.
12. **Secure coding in flight software.** Input validation, fault containment, defence in depth.
13. **Mastery gate.**

## Parallel & Distributed Computing: syllabus (`par`, `cs.12-parallel.txt`)

Python and C++.

1. **Why parallel.** Moore's law and its end, Amdahl and Gustafson.
2. **Work and span.** DAG models of parallel computation, speedup limits.
3. **Parallel patterns.** Map, reduce, scan, stencil; the parallel prefix sum.
4. **Threads in C++.** `std::thread`, joining, data races, `std::atomic`.
5. **Synchronisation costs.** Contention, false sharing, lock granularity.
6. **Task parallelism.** Thread pools, futures, work stealing as an idea.
7. **Parallel algorithms.** Parallel merge sort, parallel BFS as ideas; `std::execution`.
8. **Distributed systems.** Failures, partial failure, message passing, clocks.
9. **Time and order.** Lamport clocks, vector clocks.
10. **Replication and consistency.** Primary-backup, quorum reads and writes, CAP.
11. **Consensus.** Why it is hard; Raft leader election and log replication, simulated.
12. **MapReduce and dataflow.** The model, implemented over a simulated cluster.
13. **Mastery gate.**

## Capstones (`cs.13-capstones.txt`)

Each capstone is a multi-lesson project of 2,000–10,000 lines, built milestone by milestone, and
every milestone's tests must pass:

1. **An interpreter** for a small language (from the Compilers course) with a standard library
   and test suite.
2. **A key-value store** with a write-ahead log, crash recovery and a query language.
3. **A network service:** an HTTP server with routing, concurrency and load testing.
4. **A flight-software-style system** in C++: a telemetry pipeline with fixed memory, a scheduler
   and fault handling.
5. **A data system:** an analytics pipeline over SQL with indexes and query-plan tuning.
