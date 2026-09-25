/* ============================================================================
   Learn mode — types
   ----------------------------------------------------------------------------
   A guided course through the basics of each language the playground runs.
   Every lesson is a short explanation, one task, and code she writes in the
   playground's own editor; pressing Run & check really runs it and grades it
   against checks that mean something — the exact output, calls into the
   functions she wrote, the rows her query returned — never a text match on
   her source alone.

   Lessons are authored as plain text (see parse.ts) so code full of
   backticks, braces and `${}` needs no escaping, and the same files serve
   both apps that carry this feature.
   ========================================================================== */

export type LearnLang = 'javascript' | 'typescript' | 'python' | 'sql' | 'cpp' | 'html' | 'bash'

export type Cell = string | number | null

interface CheckBase {
  /** What the check proves, shown in the results list. */
  name: string
  /** Shown under a failed check: what to look at, never the answer. */
  hint?: string
}

export type LearnCheck =
  /** Everything the program printed must equal this (trailing space ignored). */
  | (CheckBase & { kind: 'output'; expect: string })
  /** The output must contain each of these lines or fragments. */
  | (CheckBase & { kind: 'includes'; expect: string[] })
  /**
   * An expression in the lesson's language that must be true after her code
   * has run — `add(2, 3) === 5`. In C++ the checker supplies main(), so a
   * lesson with tests asks for functions, not for a program.
   */
  | (CheckBase & { kind: 'test'; expr: string })
  /**
   * A test case: call something she wrote and compare with the expected
   * value — shown the way a judge shows it, INPUT / EXPECTED / YOUR OUTPUT.
   * Equality is the language's own (deep for lists, dicts, vectors, maps).
   */
  | (CheckBase & { kind: 'case'; call: string; expect: string })
  /** Web: steps run inside the rendered page (see lib/web.ts). */
  | (CheckBase & { kind: 'dom'; steps: string[] })
  /** Terminal: facts about the practice shell afterwards (see grade.ts). */
  | (CheckBase & { kind: 'shell'; facts: string[] })
  /** Her source must (or, with `absent`, must not) match this pattern. */
  | (CheckBase & { kind: 'source'; pattern: string; absent: boolean })
  /** SQL: the last result set her statements produced. */
  | (CheckBase & { kind: 'result'; rows: Cell[][]; ordered: boolean })
  /** SQL: a query run after hers, on the same database, and what it returns. */
  | (CheckBase & { kind: 'query'; sql: string; rows: Cell[][] })

export interface LearnLesson {
  /** Stable across releases: progress and saved code are keyed by it. */
  id: string
  lang: LearnLang
  title: string
  /** The explanation, markdown. */
  teach: string
  /** The one thing to do, markdown. */
  task: string
  starter: string
  solution: string
  /** Revealed one at a time. */
  hints: string[]
  checks: LearnCheck[]
  /** Standard input for the program (C++ and Python). */
  stdin?: string
  /** SQL: the tables the lesson starts with. */
  schema?: string
}

export interface LearnTrack {
  lang: LearnLang
  title: string
  blurb: string
  lessons: LearnLesson[]
}

/** A goal, and the courses that reach it in the order a mentor would teach them. */
export interface Roadmap {
  id: string
  title: string
  blurb: string
  steps: LearnLang[]
}

/** What one run produced, in a shape every language can fill. */
export interface LearnRun {
  stdout: string
  stderr: string
  /** A compile error, a type error, an exception, a timeout. */
  error: string | null
  /** SQL result sets, in order. */
  tables?: { columns: string[]; rows: Cell[][] }[]
  /** Web: what each dom check found, in check order. */
  dom?: { pass: boolean; detail?: string }[] | null
  /** Terminal: the practice shell as she left it. */
  shell?: import('@/lib/shell').ShellState
  ms: number
}

export type CheckStatus = 'pass' | 'fail'

export interface CheckResult {
  name: string
  status: CheckStatus
  /** Why it failed, when there is more to say than the name. */
  detail?: string
  hint?: string
  /** The test-case view: what went in, what should come out, what did. */
  input?: string
  expected?: string
  actual?: string
}

export interface LearnGrade {
  passed: boolean
  results: CheckResult[]
  /** What she printed, with the checker's own lines taken out. */
  output: string
  stderr: string
  error: string | null
  /** SQL: her result sets, without the checker's. */
  tables: { columns: string[]; rows: Cell[][] }[]
  ms: number
}
