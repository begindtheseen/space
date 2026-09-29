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
}
