/* Which Learn to code lessons and courses teach the same things as which ORBIT module lessons and modules.
   Written by reading both side by side; checked by credit.test.ts (every id real). Conservative on
   purpose: an entry is there only when the Learn side teaches everything the module side does, at the
   same depth. See credit.ts for how it is used.

   The bar used: every section, key box, warning box and "Check yourself" question of the module lesson
   must be answerable from the Learn lessons listed. The module lessons are two to four times deeper than
   the Learn lessons on the same subject, so most of them fail on a section or two (a PostgreSQL-only
   feature, a library tool, an exception-safety or performance point). Near misses left out on purpose:
     cod_py_01_basics::l08   small-integer caching and string interning (is vs ==)
     cod_py_02_idiomatic::l01  comprehension variables are local; dict insertion order
     cod_py_02_idiomatic::l08  np.errstate, contextlib.suppress, single-use @contextmanager
     cod_sql_02_joins::l03   PostgreSQL date_trunc and HAVING-alias rules
     cod_sql_02_joins::l04   average of averages; which aggregates survive fan-out
     cod_sql_02_joins::l08   why NOT IN cannot plan as an anti-join; NULL on the left of NOT IN
     cod_sql_03_windows::l01  windows run before ORDER BY/LIMIT; AVG(AVG(x)) OVER ()
     cod_sql_03_windows::l08  choosing the inactivity threshold; unstable session names
     cod_cpp_03_raii::l04    new throws std::bad_alloc; the strong exception guarantee
     cod_git_01_basics::l10  git bisect skip, exit codes above 127, flaky tests */
import type { CreditMap } from './credit'

export const CREDIT: CreditMap = {
  lessons: {
    // Hash maps (average O(1), worst O(n) on collisions), counting, two-sum, seen-set; lower bound with
    // its invariant, bisect/std::lower_bound, midpoint overflow, and binary search on a monotone answer
    // (the ship-capacity problem is the rover-battery example): all taught in these eight.
    'cod_int_01_algorithms::l04-hash-maps-and-binary-search': ['py2-01', 'py2-04', 'py2-13', 'py3-12', 'py3-14', 'py4-06', 'cpp2-05', 'cpp4-08', 'cpp3-15'],
    // Running totals with and without PARTITION BY, running MIN/MAX, share so far, ROWS frames with n
    // PRECEDING/FOLLOWING, short frames at the start, the WINDOW clause, and "a frame counts rows, not days".
    'cod_sql_03_windows::l04-running-totals-and-moving-averages': ['sql3-05', 'sql3-06', 'sql3-07', 'sql3-08'],
    // Move constructor and assignment (free first is safe), move-only types, valid-but-unspecified,
    // std::move as a cast, const blocks moves, named rvalue references are lvalues, return std::move
    // pessimises, guaranteed elision, and noexcept so vector growth moves instead of copying.
    'cod_cpp_03_raii::l05-move-semantics': ['cpp3-01', 'cpp3-02', 'cpp3-03', 'cpp3-04', 'cpp4-01', 'cpp4-06'],
    // Tree traversals, BST operations, BFS and DFS on grids and graphs, connected components and
    // topological order: DSA I teaches every one with proofs; the lesson only adds interview practice.
    'cod_int_01_algorithms::l06-trees-and-graphs': ['dsa1-23', 'dsa1-24', 'dsa1-32', 'dsa1-33', 'dsa1-34', 'dsa1-35'],
  },
  modules: {
    // No module in these languages is covered whole. What the Learn courses lack, module by module:
    // cod_lnx_01_shell: permissions, processes and signals, ssh, tmux, systemd, tar/rsync, less, tr, vim.
    // cod_lnx_02_scripting: set -euo pipefail, [[ ]], case, $(( )) and arrays, functions, trap, getopts, awk, jq, cron.
    // cod_git_01_basics: the object model and refs, status -s, diff HEAD, .gitattributes and LFS, git describe, bisect skip.
    // cod_git_02_collab: interactive rebase in depth, --force-with-lease, rerere, workflows, pull requests, submodules, locking.
    // cod_py_01_basics: the REPL, loop else, set operators, LEGB, packages and imports, pathlib/csv/json, float internals, venv.
    // cod_py_02_idiomatic: static and class methods, __str__, ABCs, mypy, logging, argparse, package layout.
    // cod_py_03_numpy: NumPy is not taught at all.
    // cod_py_04_scipy: SciPy is not taught at all.
    // cod_py_05_plotting: matplotlib and pandas are not taught at all.
    // cod_py_06_testing: pytest, fixtures, parametrize, Hypothesis, golden files, coverage, linters.
    // cod_py_07_integration: numerical integration and solve_ivp are not taught at all.
    // cod_py_08_performance: profiling, NumPy vectorisation, Numba, Cython, the GIL and multiprocessing.
    // cod_py_09_packaging: pyproject, wheels, editable installs, entry points, version pinning, publishing.
    // cod_cpp_01_basics: the build pipeline and linker, the ODR, fixed-width types, promotions, raw arrays, assert/NDEBUG, std::format.
    // cod_cpp_02_memory: pointer arithmetic, placement new, stack and heap internals, AddressSanitizer, alignment, endianness, aliasing.
    // cod_cpp_03_raii: delegating/converting constructors, initialisation order, generation rules, exception safety, vtables, PIMPL.
    // cod_cpp_04_stl: deque/list trade-offs, span, bitset, iterator categories, nth_element, reduce, execution policies, chrono.
    // cod_cpp_05_templates: specialisation, dependent names, SFINAE, building type traits, expression templates, build cost.
    // cod_cpp_06_modern: initializer_list rules, the C++11 to C++23 surveys, modules, coroutines, the flight subset.
    // cod_cpp_07_concurrency: threads, mutexes, condition variables, atomics and the memory model.
    // cod_cpp_08_realtime: WCET, bounded loops, ISRs, watchdogs, fixed point, linker scripts, coding standards.
    // cod_cpp_09_eigen: Eigen is not taught at all.
    // cod_cpp_10_cmake: CMake is not taught at all.
    // cod_cpp_11_gtest: GoogleTest and GoogleMock are not taught at all.
    // cod_sql_01_select: LIKE's _, NULLS FIRST/LAST, PostgreSQL types and TIMESTAMPTZ, reading a schema (Learn is SQLite only).
    // cod_sql_02_joins: RIGHT JOIN, USING/NATURAL, STRING_AGG and percentiles, ROLLUP/CUBE, row subqueries, generate_series.
    // cod_sql_03_windows: NTILE, PERCENT_RANK, LAST_VALUE/NTH_VALUE, RANGE and GROUPS frames, DISTINCT ON, date_bin, LATERAL.
    // cod_sql_04_schema: normal forms, star schemas, isolation levels, index types, EXPLAIN ANALYZE, partitioning, columnar storage.
    // cod_int_01_algorithms: two pointers, stacks and linked lists, tree traversals, topological sort, bit tricks, struct/CRC, PID.
    // cod_int_02_onsite: the interview process, design rounds and behavioural rounds are not taught at all.
  },
  courses: {
    // init, status, add, commit, diff and diff --staged, restore and restore --staged, branch, switch -c,
    // fast-forward and true merges with their merge commit: lessons 01 to 05 of the module, deeper.
    git: ['cod_git_01_basics'],
    // cherry-pick (and its conflicts), rebase and its conflicts (ours/theirs swap), squashing, bisect and
    // bisect run, blame (also on an older commit), clone/push/fetch/pull, rejected pushes, pull --rebase,
    // push -u, --no-ff, tags pushed, and recovering commits made on a detached HEAD.
    'git-advanced': ['cod_git_01_basics', 'cod_git_02_collab'],
    // Left out, closest first: git-intermediate (commit --amend and branch --merged are never taught),
    // python (the snake_case and CamelCase conventions), bash (rmdir), bash-intermediate (a glob skips
    // dotfiles), bash-advanced (xargs -t; ${f%.txt} trimming only in passing), sql (UPDATE and DELETE only
    // appear in passing). No module teaches std::cin or string streams (cpp, cpp-intermediate), std::tie
    // or std::gcd (cpp-advanced), trim/instr/replace (sql-intermediate), triggers (sql-advanced) or JSON
    // (sql-expert); the Python courses after the basics lean on Counter, math, csv and asyncio.
  },
  /* Partial overlap: the listed Learn lessons teach MOST of the module lesson (its core idea and about
     two thirds of its sections or more), but not all of it, so it earns no credit. The learner is told
     what they already know and what `newHere` names as the part still to learn. Lessons with less
     overlap than that, and lessons already in `lessons` above, have no entry. Written by the same
     side-by-side reading as the rest of this file. */
  overlap: {
    // cod_lnx_01_shell: navigation, copying and deleting, pipes and redirection, grep/sort/uniq/cut/find
    // are in the three bash courses. Out: less, permissions, processes, ssh, tmux, archives, vim, startup files.
    'cod_lnx_01_shell::l01-the-filesystem-and-getting-around': {
      learn: ['term-01', 'term-02', 'term-04', 'term-05', 'term-06', 'term-09', 'term-10'],
      newHere: 'The standard Linux directory tree, hard versus symbolic links and inodes, and the safety flags: rm -f with an empty variable, cp -n and --backup, ls -h/-t/-d/-i.',
    },
    'cod_lnx_01_shell::l05-pipes-redirection-and-xargs': {
      learn: ['term2-02', 'term2-02b', 'term2-08', 'term2-08b', 'term2-09', 'term3-09'],
      newHere: 'That > empties the file before the command runs (and noclobber), a pipeline\'s exit status with PIPESTATUS and pipefail, here-documents and here-strings, xargs -r/-0/-P, and process substitution.',
    },
    'cod_lnx_01_shell::l06-grep-regex-and-the-text-toolkit': {
      learn: ['term2-03', 'term2-05', 'term2-06', 'term2-06b', 'term2-07', 'term2-07b', 'term2-07c', 'term3-04a'],
      newHere: 'Extended regular expressions (grep -E with +, ?, {n} and |) and grep -F/-o/-w/context, sort -t/-k/-g, uniq -d/-u, tr, and find -size/-mtime/-exec {} +/-delete.',
    },
    // cod_lnx_02_scripting: only quoting and expansion is mostly taught. set -euo pipefail, [[ ]], case,
    // functions, arithmetic, arrays, trap, getopts, awk and cron are not; sed is about half taught.
    'cod_lnx_02_scripting::l03-variables-quoting-and-expansion': {
      learn: ['term3-01', 'term3-03', 'term3-05a', 'term2-01', 'term2-01b'],
      newHere: 'The fixed order of expansions and IFS word splitting, an unquoted empty variable vanishing and its value being globbed, nullglob/failglob, the \'\\\'\' trick, and -- before names that start with a dash.',
    },
    // cod_git_01_basics: the everyday commands are in the git courses; the module adds the internals
    // (index, refs, objects), the finer flags, and the history-reading tools in depth.
    'cod_git_01_basics::l02-the-three-areas-and-your-first-commit': {
      learn: ['git-01', 'git-02', 'git-03', 'git-04', 'git-05', 'git-06'],
      newHere: 'The index as a real file (git ls-files -s), git config for your identity, git clone, the two columns of git status -s, git diff HEAD, and that add stages a snapshot (the MM state).',
    },
    'cod_git_01_basics::l03-reading-history-and-writing-messages': {
      learn: ['git-04', 'git2-02', 'git2-03', 'git3-07'],
      newHere: 'Writing a message body that says why (the 50/72 shape), log -n/--stat/-p/--author, blame -L and -w, and how ~ and ^ differ on a merge commit.',
    },
    'cod_git_01_basics::l04-branches-are-pointers': {
      learn: ['git-08', 'git-09', 'git2-02', 'git2-03', 'git3-11'],
      newHere: 'Branches and HEAD as files under .git (refs/heads and HEAD), git switch - to go back, git branch -v, and release branches.',
    },
    'cod_git_01_basics::l05-merging-and-conflicts': {
      learn: ['git-10', 'git-11', 'git2-10', 'git2-10b'],
      newHere: 'The three-way merge table, a merge commit\'s parents HEAD^1 and HEAD^2, the diff3 conflict view, the index stages (git ls-files -u), and why edits on adjacent lines conflict.',
    },
    'cod_git_01_basics::l06-undoing-reset-revert-restore': {
      learn: ['git-07', 'git-07b', 'git2-03', 'git2-07', 'git2-08'],
      newHere: 'ORIG_HEAD for undoing a reset, git reset <file> as the older way to unstage, and reverting a merge with revert -m 1.',
    },
    'cod_git_01_basics::l07-stash-and-the-reflog': {
      learn: ['git2-06', 'git2-12'],
      newHere: 'stash push -m and stash show -p, a conflicting pop keeping the stash, stashes as commits, per-branch reflogs and time-based names, and git fsck --lost-found for commits no reflog holds.',
    },
    'cod_git_01_basics::l09-tags-and-versions': {
      learn: ['git2-09'],
      newHere: 'Annotated tags as objects of their own, git describe, SemVer pre-release and build-metadata suffixes, and sorting tags with --sort=v:refname.',
    },
    'cod_git_01_basics::l10-bisect': {
      learn: ['git3-05', 'git3-06'],
      newHere: 'git bisect skip and a culprit hidden next to a skipped commit, bisect run exit codes above 127, flaky tests, and --term-old/--term-new.',
    },
    // cod_git_02_collab: remotes, rebase and cherry-pick are in git-advanced. Interactive rebase in depth,
    // --force-with-lease, rerere, workflows, pull requests, submodules and LFS are not.
    'cod_git_02_collab::l01-remotes-fetch-and-pull': {
      learn: ['git3-08', 'git3-08b', 'git3-09', 'git3-10'],
      newHere: 'git remote add and the refspec, ahead/behind counts against @{u}, pull --autostash, checking out a teammate\'s branch, and fetch --prune.',
    },
    'cod_git_02_collab::l02-merge-versus-rebase': {
      learn: ['git3-02', 'git3-04'],
      newHere: 'What changes inside a rebased commit (parent, tree, committer), duplicate commits after someone else\'s forced push, rebase --exec, and --first-parent versus --ff-only.',
    },
    'cod_git_02_collab::l09-cherry-pick-and-backports': {
      learn: ['git3-01', 'git3-12'],
      newHere: 'Cherry-picking a merge with -m 1, finding already-applied patches with git cherry and --cherry-mark, and upstream-first versus merge-forward backporting.',
    },
    // cod_py_01_basics: most of the language basics are in the Python courses. Out: the REPL and scripts,
    // LEGB and closures, strings in depth, pathlib and files, floating point internals, venv and pip.
    'cod_py_01_basics::l02-numbers-text-and-f-strings': {
      learn: ['py-02b', 'py-03', 'py-03b', 'py-04', 'py2-03'],
      newHere: 'round() rounding half to even, int() truncating versus // flooring, True counting as 1, raw strings and escapes, and the f-string !r and {x=} forms.',
    },
    'cod_py_01_basics::l03-lists-and-tuples': {
      learn: ['py-06', 'py2-02', 'py3-09'],
      newHere: 'That extend, insert, remove and sort return None, slice steps such as ::2 and ::-1, the one-element tuple (x,), and why tuples can be dict keys when lists cannot.',
    },
    'cod_py_01_basics::l04-dicts-sets-and-truthiness': {
      learn: ['py-09', 'py2-01', 'py2-04'],
      newHere: 'Which values can be keys (hashable tuples, not lists), dict views, the set operators - & | ^, and a zero reading being falsy, so test is None.',
    },
    'cod_py_01_basics::l05-control-flow': {
      learn: ['py-05', 'py-07', 'py-07b', 'py2-02'],
      newHere: 'The else clause on loops, chained comparisons and short-circuiting, range taking no memory, and never changing a list while looping over it.',
    },
    'cod_py_01_basics::l06-functions': {
      learn: ['py-08', 'py-08b', 'py2-02', 'py2-06', 'py2-06b'],
      newHere: 'Docstrings that state units, the three shapes of TypeError from a bad call, guard clauses, and passing by assignment.',
    },
    'cod_py_01_basics::l08-mutable-default-arguments': {
      learn: ['py2-07', 'py3-09'],
      newHere: 'Small-integer caching and string interning, and why `is` is the wrong test for equal numbers; also a default timestamp frozen at definition time.',
    },
    'cod_py_01_basics::l10-exceptions': {
      learn: ['py-11', 'py2-08', 'py2-09'],
      newHere: 'Why a bare except also swallows KeyboardInterrupt and SystemExit (use except Exception), re-raising with a bare raise, and not using exceptions for ordinary decisions.',
    },
    // cod_py_02_idiomatic: comprehensions, generators, dunders, dataclasses, context managers and
    // decorators are in the Python courses. Out: classmethods and staticmethods, mypy, logging, argparse, layout.
    'cod_py_02_idiomatic::l01-comprehensions': {
      learn: ['py-10', 'py2-01', 'py2-01b', 'py3-02'],
      newHere: 'That a comprehension\'s variable stays local to it, dicts keeping insertion order, and measuring a list against a generator\'s memory.',
    },
    'cod_py_02_idiomatic::l02-generators-and-laziness': {
      learn: ['py3-01', 'py3-02', 'py3-03'],
      newHere: 'StopIteration turning into RuntimeError inside a generator (use next(it, None)), measuring memory with tracemalloc, yield from, and a generator holding a file open.',
    },
    'cod_py_02_idiomatic::l03-keys-lambdas-and-sorting': {
      learn: ['py2-05'],
      newHere: 'operator.itemgetter and attrgetter, the key being called once per item, the decorate-sort tuple trap, reverse=True with ties, and when map and filter still fit.',
    },
    'cod_py_02_idiomatic::l05-dunder-methods': {
      learn: ['py2-10', 'py3-07'],
      newHere: 'Keeping __eq__ exact for floats (with a separate isclose method), a __repr__ that must never crash, and returning NotImplemented.',
    },
    'cod_py_02_idiomatic::l06-dataclasses': {
      learn: ['py3-06'],
      newHere: 'dataclasses.replace and asdict, frozen being shallow, __post_init__, field(compare=False), slots=True, and when a plain class or NamedTuple fits better.',
    },
    'cod_py_02_idiomatic::l07-inheritance-composition-protocols': {
      learn: ['py3-10', 'py4-07'],
      newHere: 'Substitutability, the MRO and super(), abstract base classes with @abstractmethod, and what @runtime_checkable actually checks.',
    },
    'cod_py_02_idiomatic::l08-context-managers': {
      learn: ['py3-05'],
      newHere: 'np.errstate and contextlib.suppress, and that a @contextmanager generator is single-use and needs try/finally around its yield.',
    },
    'cod_py_02_idiomatic::l09-decorators': {
      learn: ['py3-04', 'py3-08'],
      newHere: 'What a missing functools.wraps breaks (pytest fixtures, inspect.signature), lru_cache\'s cache_info, maxsize and its traps with mutable results and impure functions, decorator stacking order, and caching methods.',
    },
    // cod_py_08_performance: only the complexity lesson; profiling, NumPy, Numba, Cython, the GIL and
    // multiprocessing are not taught. (py_03 to py_07 and py_09 have no Learn counterpart at all.)
    'cod_py_08_performance::l02-complexity-first': {
      learn: ['py3-12', 'dsa1-02'],
      newHere: 'A sliding-window maximum in O(n) with a monotonic deque, and why its loop inside a loop is still linear.',
    },
    // cod_cpp_01_basics: references, const/constexpr, overloading and enum class/classes are in the C++
    // courses. Out: the build pipeline, ODR, linker errors, fixed-width types, promotions, raw arrays,
    // storage duration, strings and std::format, assert.
    'cod_cpp_01_basics::l06-values-references-and-python-names': {
      learn: ['py3-09', 'cpp-10', 'cpp2-13'],
      newHere: 'Brace initialisation ({} zeroes, refuses narrowing) and the most vexing parse, comparing addresses with &a == &b, and returning a reference to a local.',
    },
    'cod_cpp_01_basics::l07-const-constexpr-consteval-auto': {
      learn: ['cpp-02', 'cpp2-01', 'cpp2-02', 'cpp3-12'],
      newHere: 'const as a promise about one name, not the object; top-level const ignored on by-value parameters; consteval with throw to validate a constant; and auto dropping references and top-level const.',
    },
    'cod_cpp_01_basics::l08-functions-overloading-default-arguments': {
      learn: ['cpp-07', 'cpp2-07'],
      newHere: 'Falling off the end of a non-void function, [[nodiscard]] and trailing return types, T versus const T& overloads being ambiguous, a default plus an overload, and defaults being re-evaluated at every call, unlike Python.',
    },
    'cod_cpp_01_basics::l10-enums-structs-classes-namespaces': {
      learn: ['cpp-11', 'cpp2-01', 'cpp2-06', 'cpp2-08'],
      newHere: 'Namespaces (nested namespaces, using-declarations versus using-directives, never in a header), fixing an enum\'s underlying type with : std::uint8_t, and protected.',
    },
    // cod_cpp_02_memory: the memory bugs, the rules of three/five/zero and smart pointers are taught.
    // Out: pointer arithmetic and decay, value categories, the stack and heap, placement new, ASan, layout.
    'cod_cpp_02_memory::l08-the-five-memory-bugs': {
      learn: ['cpp2-12', 'cpp2-13', 'cpp3-02', 'cpp4-10', 'cpp4-11'],
      newHere: 'One double free run three ways (abort, silent exit, AddressSanitizer report), Valgrind for uninitialised reads that ASan cannot see, and separating language facts from tool evidence in a defect report.',
    },
    'cod_cpp_02_memory::l13-value-semantics-and-the-rules': {
      learn: ['cpp3-01', 'cpp3-02', 'cpp3-03'],
      newHere: 'Value versus reference semantics as a design choice, the table of the six special members and when each is generated, and types with identity that should not be copied at all.',
    },
    'cod_cpp_02_memory::l14-smart-pointers': {
      learn: ['cpp-13', 'cpp3-04'],
      newHere: 'What unique_ptr compiles to, the cost of shared_ptr\'s atomic counting and why it is the wrong default in a 1 kHz loop, and weak_ptr::lock for breaking cycles.',
    },
    // cod_cpp_03_raii: constructors, RAII, copying and moving, operators and virtual functions are taught.
    // Out: initialisation order, the generation rules in detail, vtables and CRTP. (l05 is in `lessons`.)
    'cod_cpp_03_raii::l01-constructors': {
      learn: ['cpp-11', 'cpp2-06', 'cpp3-07'],
      newHere: 'When a default constructor is and is not generated and what it leaves uninitialised, the vexing parse T v();, braces refusing narrowing, and delegating constructors.',
    },
    'cod_cpp_03_raii::l03-destructors-and-raii': {
      learn: ['cpp3-01', 'cpp3-08'],
      newHere: 'Stack unwinding when an exception passes, why a destructor must not throw, member destruction order, the nameless-guard trap, and the protected non-virtual destructor.',
    },
    'cod_cpp_03_raii::l04-copying-deep-and-shallow': {
      learn: ['cpp3-02'],
      newHere: 'That new throws std::bad_alloc, and the strong exception guarantee a copy assignment should give.',
    },
    'cod_cpp_03_raii::l07-rule-of-five-and-zero': {
      learn: ['cpp3-02', 'cpp3-03', 'cpp4-06'],
      newHere: 'Strong versus basic exception guarantees, what copy-and-swap costs against reusing storage, std::is_trivially_copyable, and the std::swap(*this, other) recursion trap.',
    },
    'cod_cpp_03_raii::l08-const-static-and-friend': {
      learn: ['cpp2-01', 'cpp2-06'],
      newHere: 'mutable for caches and mutexes, const being shallow through pointers, avoiding const_cast, static member definitions before C++17, and friends (the hidden-friend operator<<).',
    },
    'cod_cpp_03_raii::l09-operator-overloading': {
      learn: ['cpp3-07'],
      newHere: 'Subscript and call operators with const overloads, a defaulted operator<=>, and compound assignment operators.',
    },
    'cod_cpp_03_raii::l10-inheritance-and-slicing': {
      learn: ['cpp3-08', 'cpp3-09'],
      newHere: 'final on classes and functions, and the ways to make slicing impossible rather than merely avoided.',
    },
    'cod_cpp_03_raii::l12-variant-visit-and-pimpl': {
      learn: ['cpp3-11'],
      newHere: 'The PIMPL idiom: a pointer to a hidden implementation, why its destructor must be defined in the .cpp file, and what it costs.',
    },
    // cod_cpp_04_stl: vectors, lists, iterators, sorting, lambdas and ranges are taught. Out: map/set
    // internals, hash-table memory, span/string_view, bitset/tuple, transform/reduce, erase-remove,
    // std::function internals, chrono and random, and error handling with expected.
    'cod_cpp_04_stl::l01-sequence-containers': {
      learn: ['cpp-08', 'cpp3-06', 'cpp4-06', 'cpp4-10', 'cpp4-12', 'cpp4-14'],
      newHere: 'std::array as the fixed-size default, std::deque\'s chunked layout, and choosing a container for a 1 kHz control task (a fixed table looked up by id).',
    },
    'cod_cpp_04_stl::l06-iterators-and-invalidation': {
      learn: ['cpp2-04', 'cpp4-07', 'cpp4-10'],
      newHere: 'The invalidation rules for containers other than std::vector, and why an algorithm\'s demands follow from the five iterator categories.',
    },
    'cod_cpp_04_stl::l07-sorting-and-searching': {
      learn: ['cpp2-03', 'cpp3-14', 'cpp3-15'],
      newHere: 'std::nth_element for a median or percentile in average O(n), and a table of what each sort and search costs.',
    },
    'cod_cpp_04_stl::l10-lambdas': {
      learn: ['cpp2-10', 'cpp3-10', 'cpp3-11'],
      newHere: 'Moving a move-only owner into a lambda with init-capture (std::move), and where lambdas are and are not allowed in flight code.',
    },
    'cod_cpp_04_stl::l13-ranges-and-views': {
      learn: ['cpp4-09'],
      newHere: 'Which views g++ 13 ships and the flags they need, and whether ranges belong in flight code.',
    },
    // cod_cpp_05_templates: variadic templates, concepts and compile-time work are taught. Out:
    // specialisation, non-type parameters in depth, dependent names, type traits, CRTP, expression templates.
    'cod_cpp_05_templates::l03-variadic-templates': {
      learn: ['cpp4-02', 'cpp4-03'],
      newHere: 'The older peel-one-off recursive style that fold expressions replaced, which you will still meet in existing code.',
    },
    'cod_cpp_05_templates::l06-sfinae-and-concepts': {
      learn: ['cpp4-04'],
      newHere: 'SFINAE and std::enable_if, the pre-C++20 way to put rules on a template, and how to read their error messages.',
    },
    'cod_cpp_05_templates::l07-compile-time-computation': {
      learn: ['cpp3-12', 'cpp4-05'],
      newHere: 'if constexpr: one template choosing a different branch per type, with the discarded branch never compiled.',
    },
    // cod_cpp_06_modern: only copy elision. The release surveys (C++11 to C++23) teach which standard
    // added what and what flight code keeps, which the Learn courses never frame; the rest is not taught.
    'cod_cpp_06_modern::l05-guaranteed-copy-elision': {
      learn: ['cpp4-01'],
      newHere: 'Measuring elision on a Matrix and a 1 MiB state array, and seeing the copies come back with -fno-elide-constructors.',
    },
    // cod_sql_01_select: the SELECT basics, NULL, CASE and the logical order are in the SQL courses.
    // Out: data types, time zones and TIMESTAMPTZ, and reading an unfamiliar schema (Learn is SQLite only).
    'cod_sql_01_select::l01-tables-rows-and-keys': {
      learn: ['sql-01', 'sql-11', 'sql3-09', 'sql3-10', 'sql3-11'],
      newHere: 'The formal vocabulary (relation, tuple, attribute, domain) and what treating a table as a set implies: no order, no repeats, columns found by name.',
    },
    'cod_sql_01_select::l02-select-from-where': {
      learn: ['sql-01', 'sql-02', 'sql-03', 'sql-03b', 'sql2-16'],
      newHere: 'BETWEEN and its inclusive ends for time ranges, why a REAL cannot be tested with =, PostgreSQL\'s case-sensitive LIKE and ILIKE, why a leading wildcard cannot use an index, and saving a query as a view.',
    },
    'cod_sql_01_select::l03-sorting-limiting-and-distinct': {
      learn: ['sql-04', 'sql2-11', 'sql2-12', 'sql2-14'],
      newHere: 'Where NULLs sort in PostgreSQL versus SQLite and NULLS FIRST/LAST, numbers stored as text sorting like words, and LIMIT cutting ties arbitrarily.',
    },
    'cod_sql_01_select::l04-expressions-and-case': {
      learn: ['sql-02', 'sql2-07', 'sql2-08'],
      newHere: 'Where a SELECT alias can and cannot be used (PostgreSQL refuses it in WHERE), and CASE inside ORDER BY and WHERE.',
    },
    'cod_sql_01_select::l05-null-and-three-valued-logic': {
      learn: ['sql-08', 'sql-08b', 'sql2-10', 'sql2-16'],
      newHere: 'Where NULL sorts in PostgreSQL versus SQLite, NULLIF for sentinel values such as -999 and for avoiding division by zero, and never letting COALESCE turn a missing measurement back into a number.',
    },
    'cod_sql_01_select::l08-the-order-a-query-runs-in': {
      learn: ['sql-06', 'sql2-04', 'sql2-04b'],
      newHere: 'Where DISTINCT and LIMIT sit in the logical order, why a SELECT alias works in ORDER BY but not in WHERE (and PostgreSQL\'s alias-inside-an-expression quirk), and not relying on the order inside WHERE.',
    },
    // cod_sql_02_joins: joins, grouping, fan-out, subqueries, EXISTS and recursive CTEs are taught. Out:
    // USING/NATURAL, STRING_AGG and percentiles, ROLLUP/CUBE, testing a CTE rewrite, INTERSECT/EXCEPT.
    'cod_sql_02_joins::l01-joining-tables': {
      learn: ['sql-07', 'sql-08', 'sql2-02', 'sql2-03', 'sql2-17'],
      newHere: 'RIGHT JOIN as the mirror of LEFT JOIN, and pairing each command with its acknowledgement by a self-join on a time condition.',
    },
    'cod_sql_02_joins::l03-group-by-and-aggregates': {
      learn: ['sql-05', 'sql-06', 'sql-08', 'sql-08b', 'sql2-04', 'sql2-04b', 'sql2-09'],
      newHere: 'PostgreSQL enforcing the grouping rule (and grouping by the key, not the label), its HAVING-alias rules, and date_trunc for grouping real timestamps by day.',
    },
    'cod_sql_02_joins::l04-the-fan-out-trap': {
      learn: ['sql2-04', 'sql2-14'],
      newHere: 'Why an average of averages is wrong, and which aggregates survive fan-out (MIN, MAX, COUNT DISTINCT) while SUM, COUNT and AVG do not.',
    },
    'cod_sql_02_joins::l07-subqueries': {
      learn: ['sql-12', 'sql-12b', 'sql2-05', 'sql2-06'],
      newHere: 'Row subqueries comparing several columns at once, PostgreSQL\'s error when a scalar subquery returns two rows (SQLite takes the first), what a correlated subquery costs, and a median in SQLite.',
    },
    'cod_sql_02_joins::l08-exists-in-and-anti-joins': {
      learn: ['sql2-05', 'sql2-06', 'sql2-16'],
      newHere: 'Why NOT IN cannot be planned as an anti-join, a NULL on the left of NOT IN, and a LEFT JOIN with IS NOT NULL being an inner join in disguise.',
    },
    'cod_sql_02_joins::l10-recursive-ctes': {
      learn: ['sql3-01b', 'sql3-02', 'sql3-03'],
      newHere: 'PostgreSQL\'s generate_series for gap-filling time buckets, and guarding recursion with a visited path or the CYCLE clause rather than only a depth limit.',
    },
    // cod_sql_03_windows: ranking, LAG/LEAD, frames, dedup, streaks and sessions are taught. Out:
    // downsampling with date_trunc/date_bin, and windows versus self-joins and LATERAL. (l04 is in `lessons`.)
    'cod_sql_03_windows::l01-windows-versus-groups': {
      learn: ['sql3-05', 'sql3-06', 'sql3-07'],
      newHere: 'That windows run after GROUP BY, so AVG(AVG(x)) OVER () averages the groups, that ORDER BY and LIMIT run after the windows, and the three families of window function.',
    },
    'cod_sql_03_windows::l02-ranking-functions': {
      learn: ['sql3-05', 'sql4-03'],
      newHere: 'NTILE for sharing rows into buckets, PERCENT_RANK for a position from 0 to 1, and ranking whole groups by an aggregate.',
    },
    'cod_sql_03_windows::l03-lag-lead-and-offsets': {
      learn: ['sql3-07', 'sql4-05'],
      newHere: 'A rate of change divided by the real time step between samples, and FIRST_VALUE, LAST_VALUE and NTH_VALUE.',
    },
    'cod_sql_03_windows::l05-frames': {
      learn: ['sql3-06', 'sql3-08', 'sql3-19'],
      newHere: 'Why LAST_VALUE returns the current row under the default frame, and GROUPS frames that count groups of ties.',
    },
    'cod_sql_03_windows::l06-deduplication-and-latest-per-key': {
      learn: ['sql3-05', 'sql4-03', 'sql4-06'],
      newHere: 'PostgreSQL\'s DISTINCT ON as a shorthand for the latest row per key, and the latest N per key after deduplicating first.',
    },
    'cod_sql_03_windows::l07-gaps-and-islands': {
      learn: ['sql4-04', 'sql4-05'],
      newHere: 'What an island\'s duration should mean for sampled data, and finding the gaps between islands as islands of their own.',
    },
    'cod_sql_03_windows::l08-sessionisation': {
      learn: ['sql3-07', 'sql4-05'],
      newHere: 'Choosing the inactivity threshold from the data, and why session names made from row numbers are unstable as new data arrives.',
    },
    // cod_sql_04_schema: constraints, composite and covering indexes and sargability are taught. Out:
    // normal forms, star schemas, isolation levels, index types, EXPLAIN ANALYZE, partitioning, columnar storage.
    'cod_sql_04_schema::l03-constraints': {
      learn: ['sql3-09', 'sql3-10', 'sql4-06'],
      newHere: 'Deferring a foreign-key check until COMMIT, and when NO ACTION behaves differently from RESTRICT.',
    },
    'cod_sql_04_schema::l06-composite-and-covering-indexes': {
      learn: ['sql3-12', 'sql4-02'],
      newHere: 'An index that cannot be seeked can still be scanned, and why a PostgreSQL index-only scan sometimes visits the table anyway (the visibility map).',
    },
    'cod_sql_04_schema::l09-sargability': {
      learn: ['sql3-12b', 'sql4-01'],
      newHere: 'Implicit casts as a function you did not write on the column, and when OR, IN or a UNION can still use an index.',
    },
    // cod_int_01_algorithms: complexity, trees and graphs, heaps, prefix sums and light DP are in Data
    // Structures and Algorithms I and the Python courses. Out: two pointers and sliding windows, intervals
    // and monotonic stacks, bytes and CRCs, decommutation, time alignment, PID. (l04 is in `lessons`.)
    'cod_int_01_algorithms::l02-complexity-out-loud': {
      learn: ['dsa1-02', 'dsa1-03', 'dsa1-08'],
      newHere: 'The space term counted on its own (extra memory, recursion depth included), and saying time and space aloud the way an interviewer expects.',
    },
    'cod_int_01_algorithms::l07-heaps-prefix-sums-dp-and-bits': {
      learn: ['dsa1-28', 'dsa1-29', 'py3-11', 'py3-12'],
      newHere: 'Bit manipulation: masks and shifts, popcount, and the x & (x - 1) trick; also std::priority_queue as C++\'s heap.',
    },
  },
}
