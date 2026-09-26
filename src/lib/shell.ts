/* ============================================================================
   The practice terminal
   ----------------------------------------------------------------------------
   A shell that runs in the page: a small in-memory filesystem, a real (if
   small) shell language, the everyday Unix tools and enough of git to
   practise how teams really work. It is a simulation and says so: nothing
   here touches the real machine, and the terminal work the curriculum asks
   for (M1) still belongs in a real terminal. What it is for is learning what
   the commands mean somewhere nothing can break.

   The shell language, one line (or one script) at a time:
     - quoting ('…' literal, "…" expands), \ escapes, # comments
     - $VAR, ${VAR}, ${VAR:-default}, ${#VAR}, $?, $#, $1…$9, "$@", $(…),
       `…`, $((arithmetic)), ~, and wildcards * ? [abc] (sorted, like bash)
     - word splitting of unquoted expansions (the classic quoting bugs are real)
     - pipes |, lists ; && ||, ! negation, redirection > >> < 2> 2>> 2>&1 >&2
       &>, /dev/null — and > empties its file before the command runs, as in
       bash, so `sort f > f` really loses f
     - NAME=value, export, unset, set -x / -e / -u / -o pipefail
     - for … in …; do …; done, while/until, if/elif/else/fi, test / [ ]
     - scripts: bash [-x] [-n] file args, ./file (after chmod +x), source
       file; a script runs in a child shell that sees only exported
       variables, and its cd does not move you
     - exit codes everywhere: 0 is success, 1 failure, 2 misuse, 127 not found

   Tools: pwd ls cd mkdir touch echo printf cat head tail wc grep sort uniq
   cut tr tee find sed xargs basename dirname seq rm rmdir cp mv chmod env
   read type which history clear, and git.

   git: init (--bare), clone, status (-s), add, rm, commit (-a, --amend),
   log (--oneline --graph --all, ranges, -n), show (rev, rev:path), diff
   (working/staged/revisions), restore, reset (--soft/--mixed/--hard),
   revert, branch (-d -D -m -a -vv -u), switch/checkout (detached HEAD
   included), merge (fast-forward, merge commits, --no-ff, conflicts with
   markers that you resolve with add + commit, --abort), stash, tag, reflog,
   cherry-pick, rebase (--continue/--skip/--abort), bisect (start/good/bad/
   skip/reset/run/log), blame, .gitignore and check-ignore, ls-files, config,
   and a remote that is a folder on this pretend computer: remote, fetch,
   pull (--rebase/--no-rebase/--ff-only), push (-u, --force, tags,
   rejection when the remote has work you do not).

   Pure: `run(state, line)` returns the output and a new state, and never
   throws. The UI and the Learn-mode checks read the same state.
   ========================================================================== */

export const HOME = '/home/you'
export const START = '/home/you/project'

export type Node = { kind: 'dir'; children: Record<string, Node> } | { kind: 'file'; content: string; exec?: boolean }

interface Commit {
  id: string
  message: string
  /** The commit this one was made on top of. */
  parent: string | null
  /** A merge commit's second parent: the branch that was merged in. */
  parent2?: string | null
  /** Every tracked file's content at this commit, by path relative to the repo. */
  tree: Record<string, string>
  author?: string
}

interface Stash {
  message: string
  base: string | null
  /** Tracked (and, with -u, untracked) files as they were: null means deleted. */
  work: Record<string, string | null>
  /** Files that were new and staged. */
  added: string[]
}

/** A merge, cherry-pick, revert or rebase that stopped on a conflict. */
interface Pending {
  kind: 'merge' | 'cherry-pick' | 'revert' | 'rebase'
  message: string
  conflicts: string[]
  /** merge: the commit being merged in. */
  theirs?: string | null
  /** The commit being replayed (cherry-pick, revert, rebase). */
  current?: string | null
  author?: string
  /** Commits still to replay, oldest first. */
  todo: string[]
  /** rebase: the branch being rebased, and where it was. */
  branch?: string
  origHead?: string | null
}

interface Bisect {
  origBranch: string | null
  origId: string | null
  bad: string | null
  good: string[]
  skip: string[]
  found: string | null
  log: string[]
}

interface Remote {
  url: string
  branches: Record<string, string>
}

interface Repo {
  branch: string
  branches: Record<string, string | null>
  staged: Record<string, string>
  /** Deletions staged for the next commit. */
  removed: string[]
  commits: Commit[]
  /** The commit HEAD points at when it is not on a branch. */
  detached: string | null
  tags: Record<string, string>
  tagNotes: Record<string, string>
  stash: Stash[]
  /** Where HEAD has been, oldest first. */
  reflog: { id: string; msg: string }[]
  pending: Pending | null
  bisect: Bisect | null
  bare: boolean
  remotes: Record<string, Remote>
  /** branch → 'origin/branch' */
  upstream: Record<string, string>
  origHead: string | null
  prevBranch: string | null
  config: Record<string, string>
}

export interface ShellState {
  cwd: string
  prev: string
  root: Node & { kind: 'dir' }
  history: string[]
  /** Everything the terminal has printed, one entry per command. */
  transcript: { cmd: string; out: string }[]
  repos: Record<string, Repo>
  /** Shell variables, and which of them are exported to scripts. */
  vars: Record<string, string>
  exported: string[]
  /** The exit status of the last command line ($?). */
  status: number
  opts: { x?: boolean; e?: boolean; u?: boolean; pipefail?: boolean }
  /** git config --global */
  gitConfig: Record<string, string>
}

const DEFAULT_VARS: Record<string, string> = { HOME, USER: 'you', SHELL: '/bin/bash', PATH: '/usr/local/bin:/usr/bin:/bin' }

export function newShell(): ShellState {
  const root: ShellState['root'] = { kind: 'dir', children: {} }
  const s: ShellState = {
    cwd: START,
    prev: START,
    root,
    history: [],
    transcript: [],
    repos: {},
    vars: { ...DEFAULT_VARS },
    exported: Object.keys(DEFAULT_VARS),
    status: 0,
    opts: {},
    gitConfig: {},
  }
  mkdirp(s, START)
  return s
}

function newRepo(bare = false): Repo {
  return {
    branch: 'main',
    branches: { main: null },
    staged: {},
    removed: [],
    commits: [],
    detached: null,
    tags: {},
    tagNotes: {},
    stash: [],
    reflog: [],
    pending: null,
    bisect: null,
    bare,
    remotes: {},
    upstream: {},
    origHead: null,
    prevBranch: null,
    config: {},
  }
}

/** States saved by an older version of this file lack the newer fields. */
function normalizeRepo(r: Partial<Repo>): Repo {
  return { ...newRepo(), ...r } as Repo
}

function ensure(s: ShellState): void {
  s.vars ??= { ...DEFAULT_VARS }
  s.exported ??= Object.keys(DEFAULT_VARS)
  s.status ??= 0
  s.opts ??= {}
  s.gitConfig ??= {}
  for (const k of Object.keys(s.repos)) s.repos[k] = normalizeRepo(s.repos[k]!)
}

/* ── Paths ───────────────────────────────────────────────────────────────── */

export function resolve(cwd: string, p: string): string {
  let path = p
  if (path === '~' || path.startsWith('~/')) path = HOME + path.slice(1)
  const parts = (path.startsWith('/') ? path : `${cwd}/${path}`).split('/')
  const out: string[] = []
  for (const part of parts) {
    if (!part || part === '.') continue
    if (part === '..') out.pop()
    else out.push(part)
  }
  return `/${out.join('/')}`
}

/** How the prompt shows a directory: `~/project`. */
export function pretty(path: string): string {
  return path === HOME ? '~' : path.startsWith(`${HOME}/`) ? `~${path.slice(HOME.length)}` : path
}

export function lookup(s: ShellState, path: string): Node | undefined {
  let node: Node = s.root
  for (const part of path.split('/').filter(Boolean)) {
    if (node.kind !== 'dir') return undefined
    const next: Node | undefined = node.children[part]
    if (!next) return undefined
    node = next
  }
  return node
}

function parentOf(path: string): [string, string] {
  const i = path.lastIndexOf('/')
  return [path.slice(0, i) || '/', path.slice(i + 1)]
}

function baseName(path: string): string {
  const p = path.replace(/\/+$/, '')
  return p.slice(p.lastIndexOf('/') + 1) || '/'
}

function mkdirp(s: ShellState, path: string): boolean {
  let node: Node = s.root
  for (const part of path.split('/').filter(Boolean)) {
    if (node.kind !== 'dir') return false
    node.children[part] ??= { kind: 'dir', children: {} }
    node = node.children[part]!
  }
  return node.kind === 'dir'
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function writeFile(s: ShellState, path: string, text: string, append: boolean): string | null {
  if (path === '/dev/null') return null
  const [dir, name] = parentOf(path)
  const parent = lookup(s, dir)
  if (!parent || parent.kind !== 'dir') return `bash: ${pretty(path)}: No such file or directory`
  const existing = parent.children[name]
  if (existing?.kind === 'dir') return `bash: ${pretty(path)}: Is a directory`
  const content = append && existing?.kind === 'file' ? existing.content + text : text
  parent.children[name] = existing?.kind === 'file' && existing.exec ? { kind: 'file', content, exec: true } : { kind: 'file', content }
  return null
}

function removePath(s: ShellState, path: string): void {
  const [dir, name] = parentOf(path)
  const parent = lookup(s, dir)
  if (parent?.kind === 'dir') delete parent.children[name]
}

/** Text as lines, without the final newline's empty line. */
function toLines(text: string): string[] {
  return text === '' ? [] : text.replace(/\n$/, '').split('\n')
}

function fromLines(lines: string[]): string {
  return lines.length ? `${lines.join('\n')}\n` : ''
}

/* ── Tokens ──────────────────────────────────────────────────────────────── */

type Part =
  | { t: 'lit'; s: string; q: boolean }
  | { t: 'var'; name: string; q: boolean; def?: string; len?: boolean; op?: string; arg?: string }
  | { t: 'sub'; cmd: string; q: boolean }
  | { t: 'arith'; expr: string; q: boolean }

type Op = '&&' | '||' | '|' | ';' | '\n' | '&' | '>' | '>>' | '2>' | '2>>' | '2>&1' | '>&2' | '&>' | '<'

/** A word (with its quoted and expandable parts) or an operator. */
export interface Token {
  text: string
  op?: Op
  parts?: Part[]
  line?: number
}

const REDIR_OPS: Op[] = ['>', '>>', '2>', '2>>', '2>&1', '>&2', '&>', '<']

function dollar(src: string, i: number, q: boolean): { part: Part; raw: string; end: number } | null {
  if (src[i] === '`') {
    const close = src.indexOf('`', i + 1)
    if (close < 0) throw new Error('unterminated `')
    return { part: { t: 'sub', cmd: src.slice(i + 1, close), q }, raw: src.slice(i, close + 1), end: close + 1 }
  }
  const n = src[i + 1]
  if (src.startsWith('$((', i)) {
    let depth = 0
    for (let j = i + 3; j < src.length; j++) {
      if (src[j] === '(') depth++
      else if (src[j] === ')') {
        if (depth === 0) {
          if (src[j + 1] === ')') return { part: { t: 'arith', expr: src.slice(i + 3, j), q }, raw: src.slice(i, j + 2), end: j + 2 }
          break
        }
        depth--
      }
    }
    throw new Error('unterminated $((')
  }
  if (n === '(') {
    let depth = 1
    for (let j = i + 2; j < src.length; j++) {
      const d = src[j]
      if (d === '\\') {
        j++
        continue
      }
      if (d === "'") {
        const c = src.indexOf("'", j + 1)
        if (c < 0) break
        j = c
        continue
      }
      if (d === '"') {
        let k = j + 1
        while (k < src.length && src[k] !== '"') k += src[k] === '\\' ? 2 : 1
        j = k
        continue
      }
      if (d === '(') depth++
      else if (d === ')' && --depth === 0) return { part: { t: 'sub', cmd: src.slice(i + 2, j), q }, raw: src.slice(i, j + 1), end: j + 1 }
    }
    throw new Error('unterminated $(')
  }
  if (n === '{') {
    const close = src.indexOf('}', i + 2)
    if (close < 0) throw new Error('unterminated ${')
    const inner = src.slice(i + 2, close)
    const raw = src.slice(i, close + 1)
    let m = /^#([A-Za-z_]\w*)$/.exec(inner)
    if (m) return { part: { t: 'var', name: m[1]!, q, len: true }, raw, end: close + 1 }
    m = /^([A-Za-z_]\w*|[0-9?#@*])(?:(:-|##|#|%%|%|\/\/|\/)(.*))?$/.exec(inner)
    if (!m) throw new Error(`${raw}: bad substitution`)
    const [, name = '', op, arg = ''] = m
    if (op === ':-') return { part: { t: 'var', name, q, def: arg }, raw, end: close + 1 }
    return { part: { t: 'var', name, q, ...(op ? { op, arg } : {}) }, raw, end: close + 1 }
  }
  if (n && /[A-Za-z_]/.test(n)) {
    let j = i + 1
    while (j < src.length && /\w/.test(src[j]!)) j++
    return { part: { t: 'var', name: src.slice(i + 1, j), q }, raw: src.slice(i, j), end: j }
  }
  if (n && /[0-9?#@*$!]/.test(n)) return { part: { t: 'var', name: n, q }, raw: `$${n}`, end: i + 2 }
  return null
}

/** Splits a command line into words and operators, keeping quoted text together. */
export function tokenize(src: string): Token[] {
  const out: Token[] = []
  let parts: Part[] = []
  let text = ''
  let has = false
  let line = 1
  const lit = (str: string, q: boolean) => {
    const last = parts[parts.length - 1]
    if (last && last.t === 'lit' && last.q === q) last.s += str
    else parts.push({ t: 'lit', s: str, q })
    text += str
    has = true
  }
  const end = () => {
    if (has) out.push({ text, parts, line })
    parts = []
    text = ''
    has = false
  }
  const op = (o: Op) => {
    end()
    out.push({ text: o, op: o, line })
  }
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!
    if (c === '\n') {
      op('\n')
      line++
      continue
    }
    if (c === ' ' || c === '\t' || c === '\r') {
      end()
      continue
    }
    if (c === '#' && !has) {
      while (i + 1 < src.length && src[i + 1] !== '\n') i++
      continue
    }
    if (c === '\\') {
      const n = src[i + 1]
      if (n === undefined) continue
      i++
      if (n === '\n') line++
      else lit(n, true)
      continue
    }
    if (c === "'") {
      const close = src.indexOf("'", i + 1)
      if (close < 0) throw new Error('unterminated quote')
      const inner = src.slice(i + 1, close)
      lit(inner, true)
      line += inner.split('\n').length - 1
      i = close
      continue
    }
    if (c === '"') {
      lit('', true)
      let j = i + 1
      let closed = false
      for (; j < src.length; j++) {
        const d = src[j]!
        if (d === '"') {
          closed = true
          break
        }
        if (d === '\\' && j + 1 < src.length && '$`"\\\n'.includes(src[j + 1]!)) {
          if (src[j + 1] !== '\n') lit(src[j + 1]!, true)
          j++
          continue
        }
        if (d === '$' || d === '`') {
          const x = dollar(src, j, true)
          if (x) {
            parts.push(x.part)
            text += x.raw
            j = x.end - 1
            continue
          }
        }
        if (d === '\n') line++
        lit(d, true)
      }
      if (!closed) throw new Error('unterminated quote')
      i = j
      continue
    }
    if (c === '$' || c === '`') {
      const x = dollar(src, i, false)
      if (x) {
        parts.push(x.part)
        text += x.raw
        has = true
        i = x.end - 1
        continue
      }
    }
    const ahead = src.slice(i, i + 4)
    if (!has) {
      if (ahead.startsWith('2>&1')) {
        op('2>&1')
        i += 3
        continue
      }
      if (ahead.startsWith('2>>')) {
        op('2>>')
        i += 2
        continue
      }
      if (ahead.startsWith('2>')) {
        op('2>')
        i += 1
        continue
      }
      if (ahead.startsWith('1>&2')) {
        op('>&2')
        i += 3
        continue
      }
      if (ahead.startsWith('1>>')) {
        op('>>')
        i += 2
        continue
      }
      if (ahead.startsWith('1>')) {
        op('>')
        i += 1
        continue
      }
    }
    const two = src.slice(i, i + 2)
    if (ahead.startsWith('>&2')) {
      op('>&2')
      i += 2
      continue
    }
    if (two === '&>' || two === '&&' || two === '||' || two === '>>') {
      op(two)
      i += 1
      continue
    }
    if (c === '>' || c === '<' || c === '|' || c === ';' || c === '&') {
      op(c)
      continue
    }
    lit(c, false)
  }
  end()
  return out
}

/* ── Parsing ─────────────────────────────────────────────────────────────── */

interface Redir {
  op: Op
  target?: Token
}
interface SimpleCmd {
  type: 'simple'
  words: Token[]
  redirs: Redir[]
  line: number
}
interface ForCmd {
  type: 'for'
  name: string
  items: Token[] | null
  body: List
  redirs: Redir[]
  line: number
}
interface IfCmd {
  type: 'if'
  arms: { cond: List; body: List }[]
  otherwise: List | null
  redirs: Redir[]
  line: number
}
interface WhileCmd {
  type: 'while'
  until: boolean
  cond: List
  body: List
  redirs: Redir[]
  line: number
}
type Cmd = SimpleCmd | ForCmd | IfCmd | WhileCmd
interface Pipeline {
  cmds: Cmd[]
  negate: boolean
}
interface AndOr {
  first: Pipeline
  rest: { op: '&&' | '||'; pipe: Pipeline }[]
}
type List = AndOr[]

class ParseError extends Error {
  line: number
  constructor(message: string, line: number) {
    super(message)
    this.line = line
  }
}

function parse(tokens: Token[]): List {
  let i = 0
  const peek = (): Token | undefined => tokens[i]
  const lineAt = () => peek()?.line ?? tokens[tokens.length - 1]?.line ?? 1
  const fail = (msg: string): never => {
    throw new ParseError(msg, lineAt())
  }
  const near = (t: Token | undefined) => fail(`syntax error near unexpected token \`${t ? (t.op === '\n' ? 'newline' : t.text) : 'newline'}'`)
  const kw = (t: Token | undefined, ...words: string[]): boolean =>
    !!t && !t.op && t.parts?.length === 1 && t.parts[0]!.t === 'lit' && !t.parts[0]!.q && words.includes(t.parts[0]!.s)
  const isSep = (t: Token | undefined) => t?.op === ';' || t?.op === '\n'
  const skipSeps = () => {
    while (isSep(peek())) i++
  }
  const skipNewlines = () => {
    while (peek()?.op === '\n') i++
  }
  const expect = (word: string, hint: string) => {
    if (!kw(peek(), word)) {
      if (peek()) near(peek())
      fail(`syntax error: expected '${word}' — ${hint}`)
    }
    i++
  }

  function list(stops: string[]): List {
    const items: AndOr[] = []
    for (;;) {
      skipSeps()
      const t = peek()
      if (!t || kw(t, ...stops)) break
      if (t.op && !REDIR_OPS.includes(t.op)) near(t)
      items.push(andOr())
      const n = peek()
      if (!n) break
      if (isSep(n) || n.op === '&') {
        i++
        continue
      }
      if (kw(n, ...stops)) break
      near(n)
    }
    return items
  }

  function andOr(): AndOr {
    const first = pipeline()
    const rest: AndOr['rest'] = []
    while (peek()?.op === '&&' || peek()?.op === '||') {
      const op = tokens[i++]!.op as '&&' | '||'
      skipNewlines()
      const t = peek()
      if (!t || (t.op && !REDIR_OPS.includes(t.op))) near(t)
      rest.push({ op, pipe: pipeline() })
    }
    return { first, rest }
  }

  function pipeline(): Pipeline {
    let negate = false
    if (kw(peek(), '!')) {
      negate = true
      i++
    }
    const cmds = [command()]
    while (peek()?.op === '|') {
      i++
      skipNewlines()
      const t = peek()
      if (!t || (t.op && !REDIR_OPS.includes(t.op))) near(t)
      cmds.push(command())
    }
    return { cmds, negate }
  }

  function redirsHere(into: Redir[]): boolean {
    const t = peek()
    if (!t?.op || !REDIR_OPS.includes(t.op)) return false
    i++
    if (t.op === '2>&1' || t.op === '>&2') {
      into.push({ op: t.op })
      return true
    }
    const target = peek()
    if (!target || target.op) near(target)
    i++
    into.push({ op: t.op, target })
    return true
  }

  function trailingRedirs(): Redir[] {
    const r: Redir[] = []
    while (redirsHere(r));
    return r
  }

  function command(): Cmd {
    const t = peek()
    const line = lineAt()
    if (kw(t, 'for')) {
      i++
      const name = peek()
      if (!name || name.op || !/^[A-Za-z_]\w*$/.test(name.text)) fail('syntax error: for needs a variable name, as in: for f in *.txt; do …; done')
      i++
      let items: Token[] | null = null
      if (kw(peek(), 'in')) {
        i++
        items = []
        while (peek() && !peek()!.op) items.push(tokens[i++]!)
      }
      skipSeps()
      expect('do', 'write it as: for x in a b c; do …; done')
      const body = list(['done'])
      expect('done', 'every for loop ends with done')
      return { type: 'for', name: name!.text, items, body, redirs: trailingRedirs(), line }
    }
    if (kw(t, 'while', 'until')) {
      const until = kw(t, 'until')
      i++
      const cond = list(['do'])
      expect('do', 'write it as: while …; do …; done')
      const body = list(['done'])
      expect('done', 'every while loop ends with done')
      return { type: 'while', until, cond, body, redirs: trailingRedirs(), line }
    }
    if (kw(t, 'if')) {
      i++
      const arms: IfCmd['arms'] = []
      let otherwise: List | null = null
      const cond = list(['then'])
      expect('then', 'write it as: if …; then …; fi (with a ; or a new line before then)')
      arms.push({ cond, body: list(['elif', 'else', 'fi']) })
      for (;;) {
        if (kw(peek(), 'elif')) {
          i++
          const c = list(['then'])
          expect('then', 'elif needs its own then')
          arms.push({ cond: c, body: list(['elif', 'else', 'fi']) })
          continue
        }
        if (kw(peek(), 'else')) {
          i++
          otherwise = list(['fi'])
        }
        break
      }
      expect('fi', 'every if ends with fi')
      return { type: 'if', arms, otherwise, redirs: trailingRedirs(), line }
    }
    if (kw(t, 'do', 'done', 'then', 'elif', 'else', 'fi')) near(t)
    const words: Token[] = []
    const redirs: Redir[] = []
    for (;;) {
      if (redirsHere(redirs)) continue
      const w = peek()
      if (!w || w.op) break
      words.push(w)
      i++
    }
    if (!words.length && !redirs.length) near(peek())
    return { type: 'simple', words, redirs, line }
  }

  const out = list([])
  if (i < tokens.length) near(peek())
  return out
}

/* ── Running ─────────────────────────────────────────────────────────────── */

export interface RunResult {
  state: ShellState
  out: string
  /** `clear` empties the screen, not the history. */
  clear?: boolean
}

/** What a command wrote: [1, text] to stdout, [2, text] to stderr, [0] clears the screen. */
type Chunk = [0 | 1 | 2, string]

interface Res {
  code: number
  chunks: Chunk[]
  /** `exit` was run: stop the script (or subshell) here. */
  exit?: boolean
}

interface Scope {
  vars: Record<string, string>
  exported: string[]
  /** $0, $1, … */
  args: string[]
  opts: ShellState['opts']
  /** The script's name, for error messages; null at the prompt. */
  name: string | null
  top: boolean
}

interface Ctx {
  s: ShellState
  scope: Scope
  depth: number
  budget: { left: number; blown: boolean }
  status: number
}

/** Text piped into a command; commands that read it take what they need. */
type Stdin = { buf: string } | null

const MAX_COMMANDS = 5000
const MAX_LOOP = 1000

const out = (text: string, code = 0): Res => ({ code, chunks: text ? [[1, text]] : [] })
/** One line (or several) of output, without the final newline. */
const ok = (text = ''): Res => out(text ? `${text}\n` : '')
const bad = (msg: string, code = 1): Res => ({ code, chunks: msg ? [[2, `${msg}\n`]] : [] })
const stdoutOf = (r: Res) => r.chunks.filter((c) => c[0] === 1).map((c) => c[1]).join('')

/** Runs one line. Never throws: mistakes come back as output, like a shell. */
export function run(prev: ShellState, line: string): RunResult {
  const s = clone(prev)
  ensure(s)
  const trimmed = line.trim()
  if (!trimmed) return { state: s, out: '' }
  s.history.push(trimmed)

  let res: Res
  try {
    const ast = parse(tokenize(trimmed))
    const ctx: Ctx = {
      s,
      scope: { vars: s.vars, exported: s.exported, args: ['bash'], opts: s.opts, name: null, top: true },
      depth: 0,
      budget: { left: MAX_COMMANDS, blown: false },
      status: s.status,
    }
    res = execList(ctx, ast, null, true)
    if (res.exit) res.chunks.push([2, 'exit: this practice terminal stays open (a real one would close now).\n'])
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res = err instanceof ParseError || /^unterminated|bad substitution/.test(msg) ? bad(`bash: ${msg}`, 2) : bad(`practice terminal: something went wrong running that (${msg}).`, 1)
  }

  let text = ''
  let clear = false
  for (const [fd, t] of res.chunks) {
    if (fd === 0) {
      clear = true
      text = ''
      continue
    }
    if (!t) continue
    text += (text && !text.endsWith('\n') ? '\n' : '') + t
  }
  const shown = text.replace(/\n$/, '')
  s.status = res.code
  s.transcript.push({ cmd: trimmed, out: shown })
  return { state: s, out: shown, ...(clear ? { clear } : {}) }
}

function execList(ctx: Ctx, list: List, stdin: Stdin, quiet = false): Res {
  const chunks: Chunk[] = []
  let code = ctx.status
  for (const ao of list) {
    if (ctx.budget.blown) break
    const r = execAndOr(ctx, ao, stdin, quiet)
    chunks.push(...r.chunks)
    code = r.code
    ctx.status = code
    if (r.exit) return { code, chunks, exit: true }
    if (r.errexit) return { code, chunks, exit: true }
  }
  return { code, chunks }
}

/** `a && b || c`. With set -e, a failure that is not being tested stops a script. */
function execAndOr(ctx: Ctx, ao: AndOr, stdin: Stdin, quiet: boolean): Res & { errexit?: boolean } {
  let r = execPipeline(ctx, ao.first, stdin)
  const chunks = [...r.chunks]
  let last = ao.rest.length === 0 && !ao.first.negate
  ctx.status = r.code
  for (let k = 0; k < ao.rest.length && !r.exit; k++) {
    const { op, pipe } = ao.rest[k]!
    if ((op === '&&') === (r.code === 0)) {
      r = execPipeline(ctx, pipe, stdin)
      chunks.push(...r.chunks)
      ctx.status = r.code
      last = k === ao.rest.length - 1 && !pipe.negate
    } else last = false
  }
  const errexit = !quiet && !!ctx.scope.opts.e && !ctx.scope.top && last && r.code !== 0
  return { code: r.code, chunks, ...(r.exit ? { exit: true } : {}), ...(errexit ? { errexit } : {}) }
}

function subshell(ctx: Ctx): Ctx {
  const sc = ctx.scope
  return { ...ctx, scope: { ...sc, vars: { ...sc.vars }, exported: [...sc.exported], args: [...sc.args], opts: { ...sc.opts }, top: false } }
}

function execPipeline(ctx: Ctx, p: Pipeline, stdin: Stdin): Res {
  let r: Res
  if (p.cmds.length === 1) r = execCmd(ctx, p.cmds[0]!, stdin, true)
  else {
    // Every part of a pipeline runs in a subshell: variables set there (and
    // cd) do not come back, exactly as in bash.
    const chunks: Chunk[] = []
    const codes: number[] = []
    let input: Stdin = stdin
    for (let k = 0; k < p.cmds.length; k++) {
      const lastOne = k === p.cmds.length - 1
      const sub = subshell(ctx)
      const [cwd, prev] = [ctx.s.cwd, ctx.s.prev]
      const part = execCmd(sub, p.cmds[k]!, input, lastOne)
      ctx.s.cwd = cwd
      ctx.s.prev = prev
      codes.push(part.code)
      if (lastOne) chunks.push(...part.chunks)
      else {
        chunks.push(...part.chunks.filter((c) => c[0] !== 1))
        input = { buf: stdoutOf(part) }
      }
    }
    const failed = [...codes].reverse().find((c) => c !== 0)
    r = { code: ctx.scope.opts.pipefail && failed !== undefined ? failed : codes[codes.length - 1]!, chunks }
  }
  return p.negate ? { ...r, code: r.code === 0 ? 1 : 0 } : r
}

type Dest = { k: 'pass'; fd: 1 | 2 } | { k: 'file'; path: string } | { k: 'null' }

function execCmd(ctx: Ctx, cmd: Cmd, stdin: Stdin, tty: boolean): Res {
  const s = ctx.s
  const table: Record<1 | 2, Dest> = { 1: { k: 'pass', fd: 1 }, 2: { k: 'pass', fd: 2 } }
  let input = stdin
  const pre: Chunk[] = []
  for (const r of cmd.redirs) {
    if (r.op === '2>&1') {
      table[2] = table[1]
      continue
    }
    if (r.op === '>&2') {
      table[1] = table[2]
      continue
    }
    let target: string
    try {
      const words = expander(ctx, pre).expand(r.target!, { glob: false })
      if (words.length !== 1) return { code: 1, chunks: [...pre, [2, `${where(ctx, cmd.line)}${r.target!.text}: ambiguous redirect\n`]] }
      target = words[0]!
    } catch (e) {
      return { code: 1, chunks: [...pre, [2, `${where(ctx, cmd.line)}${(e as Error).message}\n`]] }
    }
    const abs = resolve(s.cwd, target)
    if (r.op === '<') {
      if (abs === '/dev/null') {
        input = { buf: '' }
        continue
      }
      const node = lookup(s, abs)
      if (!node) return { code: 1, chunks: [...pre, [2, `${where(ctx, cmd.line)}${target}: No such file or directory\n`]] }
      if (node.kind === 'dir') return { code: 1, chunks: [...pre, [2, `${where(ctx, cmd.line)}${target}: Is a directory\n`]] }
      input = { buf: node.content }
      continue
    }
    let dest: Dest = { k: 'null' }
    if (abs !== '/dev/null') {
      const append = r.op === '>>' || r.op === '2>>'
      // > empties the file before the command even starts.
      const node = lookup(s, abs)
      const err = append && node?.kind === 'file' ? null : writeFile(s, abs, '', false)
      if (err) return { code: 1, chunks: [...pre, [2, `${err.replace(/^bash: /, where(ctx, cmd.line))}\n`]] }
      dest = { k: 'file', path: abs }
    }
    if (r.op === '>' || r.op === '>>') table[1] = dest
    else if (r.op === '&>') table[1] = table[2] = dest
    else table[2] = dest
  }

  const innerTty = tty && table[1].k === 'pass' && table[1].fd === 1
  let r: Res
  switch (cmd.type) {
    case 'simple':
      r = execSimple(ctx, cmd, input, innerTty)
      break
    case 'for':
      r = execFor(ctx, cmd, input, innerTty)
      break
    case 'while':
      r = execWhile(ctx, cmd, input, innerTty)
      break
    case 'if':
      r = execIf(ctx, cmd, input, innerTty)
      break
  }

  const routed: Chunk[] = [...pre]
  for (const [fd, text] of r.chunks) {
    if (fd === 0) {
      routed.push([0, ''])
      continue
    }
    const d = table[fd]
    if (d.k === 'pass') routed.push([d.fd, text])
    else if (d.k === 'file') writeFile(s, d.path, text, true)
  }
  return { ...r, chunks: routed }
}

function where(ctx: Ctx, line: number): string {
  return ctx.scope.name ? `${ctx.scope.name}: line ${line}: ` : 'bash: '
}

function execFor(ctx: Ctx, cmd: ForCmd, stdin: Stdin, _tty: boolean): Res {
  const pre: Chunk[] = []
  let items: string[]
  try {
    const x = expander(ctx, pre)
    items = cmd.items ? cmd.items.flatMap((t) => x.expand(t)) : ctx.scope.args.slice(1)
  } catch (e) {
    return { code: 1, chunks: [...pre, [2, `${where(ctx, cmd.line)}${(e as Error).message}\n`]] }
  }
  const chunks: Chunk[] = [...pre]
  let code = 0
  for (const item of items) {
    if (ctx.budget.blown) break
    ctx.scope.vars[cmd.name] = item
    const r = execList(ctx, cmd.body, stdin)
    chunks.push(...r.chunks)
    code = r.code
    if (r.exit) return { code, chunks, exit: true }
  }
  return { code, chunks }
}

function execWhile(ctx: Ctx, cmd: WhileCmd, stdin: Stdin, _tty: boolean): Res {
  const chunks: Chunk[] = []
  let code = 0
  for (let n = 0; ; n++) {
    if (ctx.budget.blown) break
    if (n >= MAX_LOOP) {
      chunks.push([2, `${where(ctx, cmd.line)}stopped the loop after ${MAX_LOOP} rounds — the practice terminal guards against loops that never end\n`])
      return { code: 1, chunks }
    }
    const c = execList(ctx, cmd.cond, stdin, true)
    chunks.push(...c.chunks)
    if (c.exit) return { code: c.code, chunks, exit: true }
    if ((c.code === 0) === cmd.until) break
    const r = execList(ctx, cmd.body, stdin)
    chunks.push(...r.chunks)
    code = r.code
    if (r.exit) return { code, chunks, exit: true }
  }
  return { code, chunks }
}

function execIf(ctx: Ctx, cmd: IfCmd, stdin: Stdin, _tty: boolean): Res {
  const chunks: Chunk[] = []
  for (const arm of cmd.arms) {
    const c = execList(ctx, arm.cond, stdin, true)
    chunks.push(...c.chunks)
    if (c.exit) return { code: c.code, chunks, exit: true }
    if (c.code === 0) {
      const r = execList(ctx, arm.body, stdin)
      return { ...r, chunks: [...chunks, ...r.chunks] }
    }
  }
  if (cmd.otherwise) {
    const r = execList(ctx, cmd.otherwise, stdin)
    return { ...r, chunks: [...chunks, ...r.chunks] }
  }
  return { code: 0, chunks }
}

const ASSIGN = /^[A-Za-z_][A-Za-z0-9_]*=/

function isAssignment(t: Token): boolean {
  const p = t.parts?.[0]
  return !!p && p.t === 'lit' && !p.q && ASSIGN.test(p.s)
}

/** NAME=value: the name, and the value's parts. */
function splitAssignment(t: Token): [string, Part[]] {
  const first = t.parts![0] as { t: 'lit'; s: string; q: boolean }
  const eq = first.s.indexOf('=')
  return [first.s.slice(0, eq), [{ t: 'lit', s: first.s.slice(eq + 1), q: false }, ...t.parts!.slice(1)]]
}

/** A word as bash would show it in a trace: quoted when it has spaces. */
function shq(w: string): string {
  return w === '' ? "''" : /[^\w@%+=:,./~-]/.test(w) ? `'${w.replace(/'/g, `'\\''`)}'` : w
}

function execSimple(ctx: Ctx, cmd: SimpleCmd, stdin: Stdin, tty: boolean): Res {
  if (--ctx.budget.left < 0) {
    ctx.budget.blown = true
    return bad(`bash: stopped after ${MAX_COMMANDS} commands in one go — the practice terminal guards against runaway loops`, 1)
  }
  const pre: Chunk[] = []
  const x = expander(ctx, pre)
  const assigns: [string, string][] = []
  let argv: string[]
  try {
    let k = 0
    while (k < cmd.words.length && isAssignment(cmd.words[k]!)) {
      const [name, parts] = splitAssignment(cmd.words[k]!)
      assigns.push([name, x.expandParts(parts, { split: false, glob: false }).join('')])
      k++
    }
    const rest = cmd.words.slice(k)
    const declares = rest[0] && ['export', 'local', 'readonly', 'declare'].includes(rest[0].text)
    argv = rest.flatMap((w, j) => (declares && j > 0 && isAssignment(w) ? x.expand(w, { split: false, glob: false }) : x.expand(w)))
  } catch (e) {
    return { code: 1, chunks: [...pre, [2, `${where(ctx, cmd.line)}${(e as Error).message}\n`]] }
  }
  if (ctx.scope.opts.x) {
    const shown = [...assigns.map(([n, v]) => `${n}=${shq(v)}`), ...argv.map(shq)].join(' ')
    if (shown) pre.push([2, `+ ${shown}\n`])
  }
  if (!argv.length) {
    for (const [n, v] of assigns) ctx.scope.vars[n] = v
    return { code: x.subStatus ?? 0, chunks: pre }
  }
  // NAME=value cmd: the variable exists (exported) for that one command.
  const saved = assigns.map(([n]) => [n, ctx.scope.vars[n], ctx.scope.exported.includes(n)] as const)
  for (const [n, v] of assigns) {
    ctx.scope.vars[n] = v
    if (!ctx.scope.exported.includes(n)) ctx.scope.exported.push(n)
  }
  const r = dispatch(ctx, argv, stdin, tty, cmd.line)
  for (const [n, v, was] of saved) {
    if (v === undefined) delete ctx.scope.vars[n]
    else ctx.scope.vars[n] = v
    if (!was) ctx.scope.exported.splice(ctx.scope.exported.indexOf(n), 1)
  }
  return { ...r, chunks: [...pre, ...r.chunks] }
}

/* ── Expansion: variables, $(…), $((…)), ~, splitting, wildcards ─────────── */

interface Field {
  s: string
  /** Per character: may it act as a wildcard? (Quoted characters may not.) */
  g: boolean[]
  quoted: boolean
}

function expander(ctx: Ctx, pre: Chunk[]) {
  const self = {
    subStatus: undefined as number | undefined,
    value(p: Extract<Part, { t: 'var' }>): string {
      const sc = ctx.scope
      let v: string | undefined
      if (p.name === '?') v = String(ctx.status)
      else if (p.name === '#') v = String(sc.args.length - 1)
      else if (p.name === '@' || p.name === '*') v = sc.args.slice(1).join(' ')
      else if (/^\d$/.test(p.name)) v = sc.args[Number(p.name)]
      else if (p.name === '$') v = '4242'
      else if (p.name === '!') v = ''
      else if (p.name === 'PWD') v = ctx.s.cwd
      else if (p.name === 'OLDPWD') v = ctx.s.prev
      else v = sc.vars[p.name]
      if (p.def !== undefined && !v) return p.def
      if (v === undefined) {
        if (sc.opts.u && !/^[@*#?$!]$/.test(p.name)) throw new Error(`${p.name}: unbound variable`)
        v = ''
      }
      if (p.len) return String(v.length)
      return p.op ? trimValue(v, p.op, p.arg ?? '') : v
    },
    sub(cmdText: string): string {
      const sub = subshell(ctx)
      const [cwd, prev] = [ctx.s.cwd, ctx.s.prev]
      let r: Res
      try {
        r = execList(sub, parse(tokenize(cmdText)), null, true)
      } catch (e) {
        throw new Error(`command substitution: ${(e as Error).message}`)
      }
      ctx.s.cwd = cwd
      ctx.s.prev = prev
      pre.push(...r.chunks.filter((c) => c[0] === 2))
      self.subStatus = r.code
      ctx.status = r.code
      return stdoutOf(r).replace(/\n+$/, '')
    },
    expandParts(parts: Part[], opt: { split?: boolean; glob?: boolean } = {}): string[] {
      const split = opt.split ?? true
      const glob = opt.glob ?? true
      const fields: Field[] = []
      let cur: Field = { s: '', g: [], quoted: false }
      const add = (text: string, wild: boolean) => {
        cur.s += text
        for (let k = 0; k < text.length; k++) cur.g.push(wild)
      }
      const flush = () => {
        if (cur.s || cur.quoted) fields.push(cur)
        cur = { s: '', g: [], quoted: false }
      }
      parts.forEach((p, idx) => {
        if (p.t === 'lit') {
          let text = p.s
          if (idx === 0 && !p.q && (text === '~' || text.startsWith('~/'))) {
            add(HOME, false)
            text = text.slice(1)
          }
          if (p.q) cur.quoted = true
          add(text, !p.q)
          return
        }
        if (p.t === 'var' && p.q && p.name === '@' && !p.len) {
          // "$@": every argument stays its own word.
          const args = ctx.scope.args.slice(1)
          cur.quoted = true
          args.forEach((a, k) => {
            if (k > 0) {
              flush()
              cur.quoted = true
            }
            add(a, false)
          })
          if (!args.length && parts.length === 1) cur.quoted = false
          return
        }
        const v = p.t === 'var' ? self.value(p) : p.t === 'sub' ? self.sub(p.cmd) : String(arith(p.expr, ctx))
        if (p.q || !split) {
          if (p.q) cur.quoted = true
          add(v, false)
          return
        }
        const segs = v.split(/[ \t\n]+/)
        segs.forEach((seg, k) => {
          if (k > 0) flush()
          add(seg, true)
        })
      })
      flush()
      if (!glob) return fields.map((f) => f.s)
      return fields.flatMap((f) => {
        const wild = [...f.s].some((c, k) => f.g[k] && (c === '*' || c === '?' || c === '['))
        if (!wild) return [f.s]
        const hits = globPaths(ctx.s, f)
        return hits.length ? hits : [f.s]
      })
    },
    expand(t: Token, opt: { split?: boolean; glob?: boolean } = {}): string[] {
      return self.expandParts(t.parts ?? [{ t: 'lit', s: t.text, q: true }], opt)
    },
  }
  return self
}

/** ${v#pat} ${v##pat} ${v%pat} ${v%%pat} ${v/pat/rep} ${v//pat/rep}: trim or replace by wildcard. */
function trimValue(v: string, op: string, arg: string): string {
  const m = (p: string, t: string) => wildMatch(p, t)
  if (op === '#' || op === '##') {
    const lens = [...Array(v.length + 1).keys()]
    for (const i of op === '#' ? lens : lens.reverse()) if (m(arg, v.slice(0, i))) return v.slice(i)
    return v
  }
  if (op === '%' || op === '%%') {
    const starts = [...Array(v.length + 1).keys()]
    for (const i of op === '%' ? starts.reverse() : starts) if (m(arg, v.slice(i))) return v.slice(0, i)
    return v
  }
  const slash = arg.indexOf('/')
  const pat = slash < 0 ? arg : arg.slice(0, slash)
  const rep = slash < 0 ? '' : arg.slice(slash + 1)
  if (!pat) return v
  let res = ''
  for (let i = 0; i < v.length; ) {
    let hit = -1
    for (let j = v.length; j > i; j--)
      if (m(pat, v.slice(i, j))) {
        hit = j
        break
      }
    if (hit < 0) {
      res += v[i++]
      continue
    }
    res += rep
    i = hit
    if (op === '/') return res + v.slice(i)
  }
  return res
}

/** A wildcard pattern (one path segment) as a regular expression. */
function segmentRegex(s: string, g: boolean[]): RegExp {
  let re = ''
  for (let k = 0; k < s.length; k++) {
    const c = s[k]!
    if (g[k] && c === '*') re += '.*'
    else if (g[k] && c === '?') re += '.'
    else if (g[k] && c === '[') {
      const close = s.indexOf(']', k + 2)
      if (close < 0) {
        re += '\\['
        continue
      }
      let body = s.slice(k + 1, close)
      if (body.startsWith('!')) body = `^${body.slice(1)}`
      re += `[${body.replace(/\\/g, '\\\\')}]`
      k = close
    } else re += c.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
  }
  return new RegExp(`^${re}$`)
}

/** Every path matching a wildcard word, sorted; relative words give relative paths. */
function globPaths(s: ShellState, f: Field): string[] {
  const abs = f.s.startsWith('/')
  const segs: { s: string; g: boolean[] }[] = []
  let start = 0
  for (let k = 0; k <= f.s.length; k++) {
    if (k === f.s.length || f.s[k] === '/') {
      segs.push({ s: f.s.slice(start, k), g: f.g.slice(start, k) })
      start = k + 1
    }
  }
  const dirOnly = f.s.endsWith('/')
  let cur: { disp: string; path: string }[] = [{ disp: abs ? '/' : '', path: abs ? '/' : s.cwd }]
  const join = (d: string, n: string) => (d === '' ? n : d.endsWith('/') ? d + n : `${d}/${n}`)
  for (const seg of segs) {
    if (!seg.s) continue
    const wild = [...seg.s].some((c, k) => seg.g[k] && '*?['.includes(c))
    const next: typeof cur = []
    for (const c of cur) {
      if (!wild) {
        const p = resolve(c.path, seg.s)
        if (lookup(s, p)) next.push({ disp: join(c.disp, seg.s), path: p })
        continue
      }
      const node = lookup(s, c.path)
      if (node?.kind !== 'dir') continue
      const re = segmentRegex(seg.s, seg.g)
      for (const name of Object.keys(node.children).sort()) {
        if (name.startsWith('.') && !seg.s.startsWith('.')) continue
        if (re.test(name)) next.push({ disp: join(c.disp, name), path: `${c.path === '/' ? '' : c.path}/${name}` })
      }
    }
    cur = next
  }
  return cur
    .filter((c) => !dirOnly || lookup(s, c.path)?.kind === 'dir')
    .map((c) => (dirOnly ? `${c.disp}/` : c.disp))
    .sort()
}

/** Does a name match a wildcard pattern (find -name, case, .gitignore)? */
function wildMatch(pattern: string, name: string, fold = false): boolean {
  const re = segmentRegex(fold ? pattern.toLowerCase() : pattern, [...pattern].map(() => true))
  return re.test(fold ? name.toLowerCase() : name)
}

/* ── $((arithmetic)) ─────────────────────────────────────────────────────── */

function arith(expr: string, ctx: Ctx): number {
  const toks = expr.replace(/\$\{?(\w+)\}?/g, '$1').match(/\d+|[A-Za-z_]\w*|\*\*|<=|>=|==|!=|&&|\|\||[-+*/%()<>!]/g) ?? []
  let i = 0
  const num = (name: string) => {
    const v = ctx.scope.vars[name] ?? ''
    const n = Number(v.trim() || 0)
    if (!Number.isFinite(n)) throw new Error(`${v}: syntax error in expression`)
    return Math.trunc(n)
  }
  const primary = (): number => {
    const t = toks[i++]
    if (t === undefined) throw new Error(`${expr}: syntax error: operand expected`)
    if (t === '(') {
      const v = or()
      if (toks[i++] !== ')') throw new Error(`${expr}: missing )`)
      return v
    }
    if (t === '-') return -primary()
    if (t === '+') return primary()
    if (t === '!') return primary() ? 0 : 1
    if (/^\d+$/.test(t)) return Number(t)
    if (/^[A-Za-z_]/.test(t)) return num(t)
    throw new Error(`${expr}: syntax error`)
  }
  const pow = (): number => {
    const b = primary()
    if (toks[i] === '**') {
      i++
      return b ** pow()
    }
    return b
  }
  const mul = (): number => {
    let v = pow()
    while (toks[i] === '*' || toks[i] === '/' || toks[i] === '%') {
      const op = toks[i++]
      const r = pow()
      if ((op === '/' || op === '%') && r === 0) throw new Error(`${expr}: division by 0`)
      v = op === '*' ? v * r : op === '/' ? Math.trunc(v / r) : v % r
    }
    return v
  }
  const add = (): number => {
    let v = mul()
    while (toks[i] === '+' || toks[i] === '-') v = toks[i++] === '+' ? v + mul() : v - mul()
    return v
  }
  const cmp = (): number => {
    let v = add()
    while (['<', '>', '<=', '>=', '==', '!='].includes(toks[i] ?? '')) {
      const op = toks[i++]
      const r = add()
      v = Number(op === '<' ? v < r : op === '>' ? v > r : op === '<=' ? v <= r : op === '>=' ? v >= r : op === '==' ? v === r : v !== r)
    }
    return v
  }
  const and = (): number => {
    let v = cmp()
    while (toks[i] === '&&') {
      i++
      const r = cmp()
      v = Number(!!v && !!r)
    }
    return v
  }
  const or = (): number => {
    let v = and()
    while (toks[i] === '||') {
      i++
      const r = and()
      v = Number(!!v || !!r)
    }
    return v
  }
  if (!toks.length) return 0
  const v = or()
  if (i < toks.length) throw new Error(`${expr}: syntax error in expression`)
  return v
}

/* ── test / [ ] ──────────────────────────────────────────────────────────── */

const UNARY = ['-e', '-f', '-d', '-s', '-r', '-w', '-x', '-z', '-n', '-L', '-h']
const BINARY = ['=', '==', '!=', '<', '>', '-eq', '-ne', '-lt', '-le', '-gt', '-ge']

function testCmd(ctx: Ctx, name: string, argv: string[], line: number): Res {
  let args = argv
  if (name === '[' || name === '[[') {
    const close = name === '[' ? ']' : ']]'
    if (args[args.length - 1] !== close) return bad(`${where(ctx, line)}${name}: missing \`${close}'`, 2)
    args = args.slice(0, -1)
  }
  const s = ctx.s
  const int = (v: string) => {
    if (!/^\s*-?\d+\s*$/.test(v)) throw new Error(`${name}: ${v}: integer expression expected`)
    return Number(v)
  }
  const unary = (op: string, v: string): boolean => {
    const node = v === '' ? undefined : lookup(s, resolve(s.cwd, v))
    switch (op) {
      case '-e':
        return !!node
      case '-f':
        return node?.kind === 'file'
      case '-d':
        return node?.kind === 'dir'
      case '-s':
        return node?.kind === 'file' ? node.content.length > 0 : !!node
      case '-r':
      case '-w':
        return !!node
      case '-x':
        return node?.kind === 'dir' || (node?.kind === 'file' && !!node.exec)
      case '-L':
      case '-h':
        return false
      case '-z':
        return v === ''
      default:
        return v !== ''
    }
  }
  const binary = (a: string, op: string, b: string): boolean => {
    switch (op) {
      case '=':
      case '==':
        return name === '[[' ? wildMatch(b, a) : a === b
      case '!=':
        return name === '[[' ? !wildMatch(b, a) : a !== b
      case '<':
        return a < b
      case '>':
        return a > b
      case '-eq':
        return int(a) === int(b)
      case '-ne':
        return int(a) !== int(b)
      case '-lt':
        return int(a) < int(b)
      case '-le':
        return int(a) <= int(b)
      case '-gt':
        return int(a) > int(b)
      default:
        return int(a) >= int(b)
    }
  }
  const evalN = (a: string[]): boolean => {
    switch (a.length) {
      case 0:
        return false
      case 1:
        return a[0] !== ''
      case 2:
        if (a[0] === '!') return !evalN(a.slice(1))
        if (UNARY.includes(a[0]!)) return unary(a[0]!, a[1]!)
        throw new Error(`${name}: ${a[0]}: unary operator expected`)
      case 3:
        if (BINARY.includes(a[1]!)) return binary(a[0]!, a[1]!, a[2]!)
        if (a[0] === '!') return !evalN(a.slice(1))
        if (a[0] === '(' && a[2] === ')') return evalN([a[1]!])
        if (a[1] === '-a' || a[1] === '&&') return evalN([a[0]!]) && evalN([a[2]!])
        if (a[1] === '-o' || a[1] === '||') return evalN([a[0]!]) || evalN([a[2]!])
        throw new Error(`${name}: ${a[1]}: binary operator expected`)
      default: {
        const o = a.indexOf('-o')
        if (o > 0) return evalN(a.slice(0, o)) || evalN(a.slice(o + 1))
        const n = a.indexOf('-a')
        if (n > 0) return evalN(a.slice(0, n)) && evalN(a.slice(n + 1))
        if (a[0] === '!') return !evalN(a.slice(1))
        if (a[0] === '(' && a[a.length - 1] === ')') return evalN(a.slice(1, -1))
        throw new Error(`${name}: too many arguments`)
      }
    }
  }
  try {
    return { code: evalN(args) ? 0 : 1, chunks: [] }
  } catch (e) {
    return bad(`${where(ctx, line)}${(e as Error).message}`, 2)
  }
}

/* ── Scripts ─────────────────────────────────────────────────────────────── */

/** Runs a file of commands: in a child shell (bash, ./file) or this one (source). */
function runScript(ctx: Ctx, file: string, args: string[], how: { child: boolean; trace?: boolean; check?: boolean }, stdin: Stdin, line = 0): Res {
  const s = ctx.s
  const path = resolve(s.cwd, file)
  const node = lookup(s, path)
  if (!node) return bad(`${how.child ? 'bash' : where(ctx, line).replace(/: $/, '')}: ${file}: No such file or directory`, 127)
  if (node.kind === 'dir') return bad(`bash: ${file}: Is a directory`, 126)
  if (ctx.depth >= 16) return bad(`bash: ${file}: scripts calling scripts went more than 16 deep — stopped`, 1)
  let ast: List
  try {
    ast = parse(tokenize(node.content))
  } catch (e) {
    return bad(`${file}: line ${e instanceof ParseError ? e.line : 1}: ${(e as Error).message}`, 2)
  }
  if (how.check) return { code: 0, chunks: [] }
  if (how.child) {
    const sc = ctx.scope
    const vars: Record<string, string> = {}
    for (const n of sc.exported) if (sc.vars[n] !== undefined) vars[n] = sc.vars[n]!
    const scope: Scope = { vars, exported: [...sc.exported], args: [file, ...args], opts: how.trace ? { x: true } : {}, name: file, top: false }
    const [cwd, prev] = [s.cwd, s.prev]
    const r = execList({ ...ctx, scope, depth: ctx.depth + 1, status: 0 }, ast, stdin)
    s.cwd = cwd
    s.prev = prev
    return { code: r.code, chunks: r.chunks }
  }
  const saved = ctx.scope.args
  const savedName = ctx.scope.name
  if (args.length) ctx.scope.args = [saved[0]!, ...args]
  ctx.scope.name = file
  const wasTop = ctx.scope.top
  ctx.scope.top = false
  const r = execList({ ...ctx, depth: ctx.depth + 1 }, ast, stdin)
  ctx.scope.args = saved
  ctx.scope.name = savedName
  ctx.scope.top = wasTop
  return { code: r.code, chunks: r.chunks }
}

/* ── Commands ────────────────────────────────────────────────────────────── */

function flags(args: string[]): { flags: Set<string>; rest: string[] } {
  const f = new Set<string>()
  const rest: string[] = []
  for (const a of args) {
    if (/^-[a-zA-Z0-9]+$/.test(a)) for (const c of a.slice(1)) f.add(c)
    else rest.push(a)
  }
  return { flags: f, rest }
}

interface Src {
  name: string
  text: string
  std?: boolean
}

/** A command's input: the files it was given, or what was piped in. */
function inputs(ctx: Ctx, cmd: string, files: string[], stdin: Stdin): { srcs: Src[]; errs: string[] } | Res {
  if (!files.length) {
    if (!stdin) return bad(`${cmd}: give it a file name, or pipe something into it (… | ${cmd})`, 1)
    const text = stdin.buf
    stdin.buf = ''
    return { srcs: [{ name: '(standard input)', text, std: true }], errs: [] }
  }
  const srcs: Src[] = []
  const errs: string[] = []
  for (const f of files) {
    if (f === '-') {
      srcs.push({ name: '(standard input)', text: stdin?.buf ?? '', std: true })
      if (stdin) stdin.buf = ''
      continue
    }
    const abs = resolve(ctx.s.cwd, f)
    if (abs === '/dev/null') {
      srcs.push({ name: f, text: '' })
      continue
    }
    const node = lookup(ctx.s, abs)
    if (!node) errs.push(`${cmd}: ${f}: No such file or directory`)
    else if (node.kind === 'dir') errs.push(`${cmd}: ${f}: Is a directory`)
    else srcs.push({ name: f, text: node.content })
  }
  return { srcs, errs }
}

const isRes = (x: unknown): x is Res => typeof x === 'object' && x !== null && 'chunks' in x

/** Output lines plus error lines, with an exit code. */
function result(text: string, errs: string[], code: number): Res {
  return { code, chunks: [...errs.map((e): Chunk => [2, `${e}\n`]), ...(text ? [[1, text] as Chunk] : [])] }
}

/** POSIX character classes, which JavaScript regular expressions lack. */
function posixClasses(p: string): string {
  const map: Record<string, string> = { digit: '0-9', alpha: 'a-zA-Z', alnum: 'a-zA-Z0-9', upper: 'A-Z', lower: 'a-z', space: ' \\t\\n\\r\\f\\v', blank: ' \\t', punct: '!-\\/:-@\\[-`{-~', xdigit: '0-9A-Fa-f' }
  return p.replace(/\[:(\w+):\]/g, (m, n: string) => map[n] ?? m)
}

/** A basic regular expression (grep, sed) in JavaScript's syntax. */
function breToJs(p: string): string {
  let out = ''
  for (let k = 0; k < p.length; k++) {
    const c = p[k]!
    if (c === '\\' && k + 1 < p.length) {
      const n = p[++k]!
      if ('(){}|+?'.includes(n)) out += n
      else if (n === '<' || n === '>') out += '\\b'
      else out += `\\${n}`
    } else if ('(){}|+?'.includes(c)) out += `\\${c}`
    else if (c === '[') {
      let j = k + 1
      if (p[j] === '^') j++
      if (p[j] === ']') j++
      while (j < p.length && p[j] !== ']') j++
      out += p.slice(k, j + 1).replace(/\\/g, '\\\\')
      k = j
    } else out += c
  }
  return out
}

function makeRegex(pattern: string, kind: 'basic' | 'extended' | 'fixed', flagsText: string): RegExp {
  const src = kind === 'fixed' ? pattern.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') : kind === 'extended' ? posixClasses(pattern) : breToJs(posixClasses(pattern))
  return new RegExp(src, flagsText)
}

const unescapeEcho = (t: string) =>
  t.replace(/\\(n|t|\\|a|r|e|0)/g, (_, c: string) => ({ n: '\n', t: '\t', '\\': '\\', a: '', r: '\r', e: '', '0': '' })[c]!)

function printfFormat(fmt: string, args: string[]): string {
  const f = fmt.replace(/\\(n|t|\\|"|'|r)/g, (_, c: string) => ({ n: '\n', t: '\t', '\\': '\\', '"': '"', "'": "'", r: '\r' })[c]!)
  let text = ''
  let k = 0
  for (;;) {
    let used = false
    text += f.replace(/%(-?)(\d*)(?:\.(\d+))?([sdifxb%])/g, (_, left: string, width: string, prec: string | undefined, conv: string) => {
      if (conv === '%') return '%'
      used = true
      const a = args[k++] ?? ''
      let v: string
      if (conv === 's') v = prec ? a.slice(0, Number(prec)) : a
      else if (conv === 'b') v = unescapeEcho(a)
      else if (conv === 'f') v = (Number(a) || 0).toFixed(prec ? Number(prec) : 6)
      else if (conv === 'x') v = Math.trunc(Number(a) || 0).toString(16)
      else v = String(Math.trunc(Number(a) || 0))
      const w = Number(width || 0)
      return left ? v.padEnd(w) : v.padStart(w)
    })
    if (!used || k >= args.length) break
  }
  return text
}

/** Words the way xargs reads them: split on space, quotes kept together. */
function splitWords(text: string): string[] {
  const words: string[] = []
  let cur = ''
  let has = false
  let q: string | null = null
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!
    if (q) {
      if (c === q) q = null
      else cur += c
      continue
    }
    if (c === '"' || c === "'") {
      q = c
      has = true
    } else if (c === '\\' && i + 1 < text.length) {
      cur += text[++i]
      has = true
    } else if (/\s/.test(c)) {
      if (has) words.push(cur)
      cur = ''
      has = false
    } else {
      cur += c
      has = true
    }
  }
  if (has) words.push(cur)
  return words
}

/** Commands only a shell can run: xargs and find -exec cannot start them. */
const BUILTIN_ONLY = new Set(['cd', 'export', 'unset', 'set', 'read', 'exit', 'source', '.', 'history', 'type', 'local', 'readonly', 'declare', 'alias', 'clear'])
const KEYWORDS = ['for', 'in', 'do', 'done', 'if', 'then', 'elif', 'else', 'fi', 'while', 'until', '!']
const BUILTINS = ['cd', 'pwd', 'echo', 'printf', 'export', 'unset', 'set', 'read', 'exit', 'source', '.', 'test', '[', 'true', 'false', 'history', 'type', 'help', ':']
const EDITORS = ['nano', 'vim', 'vi', 'nvim', 'emacs', 'code', 'pico']

function dispatch(ctx: Ctx, argv: string[], stdin: Stdin, tty: boolean, line: number, via?: string): Res {
  const s = ctx.s
  const [cmd, ...args] = argv as [string, ...string[]]
  if (via && BUILTIN_ONLY.has(cmd)) return bad(`${via}: ${cmd}: No such file or directory`, 127)
  switch (cmd) {
    case 'help':
      return ok(HELP)
    case 'pwd':
      return ok(s.cwd)
    case 'whoami':
      return ok('you')
    case 'date':
      return ok(new Date().toString())
    case 'clear':
      return { code: 0, chunks: [[0, '']] }
    case 'history':
      return ok(s.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n'))
    case 'true':
    case ':':
      return { code: 0, chunks: [] }
    case 'false':
      return { code: 1, chunks: [] }
    case 'echo': {
      let k = 0
      let nl = true
      let esc = false
      while (k < args.length && /^-[neE]+$/.test(args[k]!)) {
        for (const c of args[k]!.slice(1)) {
          if (c === 'n') nl = false
          else if (c === 'e') esc = true
          else esc = false
        }
        k++
      }
      const text = args.slice(k).join(' ')
      return out((esc ? unescapeEcho(text) : text) + (nl ? '\n' : ''))
    }
    case 'printf':
      if (!args.length) return bad('printf: usage: printf FORMAT [ARGUMENTS…]', 2)
      return out(printfFormat(args[0]!, args.slice(1)))
    case 'node':
      return args[0] === '--version' || args[0] === '-v' ? ok('v22.12.0 (practice terminal)') : bad('node: only --version works in the practice terminal. Run real programs in Code mode.')
    case 'python':
    case 'python3':
      return args[0] === '--version' || args[0] === '-V' ? ok('Python 3.13.0 (practice terminal)') : bad(`${cmd}: only --version works here. Run Python in Code mode.`)
    case 'cd': {
      if (args.length > 1) return bad('cd: too many arguments')
      const target = args[0] === undefined ? HOME : args[0] === '-' ? s.prev : resolve(s.cwd, args[0])
      const node = lookup(s, target)
      if (!node) return bad(`cd: ${args[0]}: No such file or directory`)
      if (node.kind !== 'dir') return bad(`cd: ${args[0]}: Not a directory`)
      s.prev = s.cwd
      s.cwd = target
      return ok(args[0] === '-' ? pretty(target) : '')
    }
    case 'ls': {
      const { flags: f, rest } = flags(args)
      const targets = rest.length ? rest : ['.']
      const errs: string[] = []
      const fileT: string[] = []
      const dirT: [string, Node & { kind: 'dir' }][] = []
      for (const t of targets) {
        const node = lookup(s, resolve(s.cwd, t))
        if (!node) errs.push(`ls: cannot access '${t}': No such file or directory`)
        else if (node.kind === 'file' || f.has('d')) fileT.push(t)
        else dirT.push([t, node])
      }
      const one = f.has('1') || !tty
      const long = f.has('l')
      const longLine = (label: string, n: Node) => {
        const size = n.kind === 'file' ? n.content.length : 4096
        const perm = n.kind === 'dir' ? 'drwxr-xr-x' : n.exec ? '-rwxr-xr-x' : '-rw-r--r--'
        return `${perm}  you  ${String(size).padStart(5)}  ${label}${n.kind === 'dir' ? '/' : ''}`
      }
      const blocks: string[] = []
      if (fileT.length) {
        const items = fileT.sort().map((t) => (long ? longLine(t, lookup(s, resolve(s.cwd, t))!) : t))
        blocks.push(long || one ? items.join('\n') : items.join('  '))
      }
      for (const [t, node] of dirT) {
        let names = Object.keys(node.children).sort()
        if (!f.has('a')) names = names.filter((n) => !n.startsWith('.'))
        else names = ['.', '..', ...names]
        const items = names.map((n) => {
          const c: Node = n === '.' || n === '..' ? { kind: 'dir', children: {} } : node.children[n]!
          if (long) return longLine(n, c)
          return n !== '.' && n !== '..' && c.kind === 'dir' && !one ? `${n}/` : n
        })
        const body = long || one ? items.join('\n') : items.join('  ')
        blocks.push((targets.length > 1 ? `${t}:\n` : '') + body)
      }
      const text = blocks.filter((b) => b !== '').join(targets.length > 1 ? '\n\n' : '\n')
      return result(text ? `${text}\n` : '', errs, errs.length ? 2 : 0)
    }
    case 'mkdir': {
      const { flags: f, rest } = flags(args)
      if (!rest.length) return bad('mkdir: missing operand')
      for (const a of rest) {
        const path = resolve(s.cwd, a)
        if (lookup(s, path)) {
          if (f.has('p')) continue
          return bad(`mkdir: cannot create directory '${a}': File exists`)
        }
        const [dir] = parentOf(path)
        if (!f.has('p') && lookup(s, dir)?.kind !== 'dir') return bad(`mkdir: cannot create directory '${a}': No such file or directory`)
        if (!mkdirp(s, path)) return bad(`mkdir: cannot create directory '${a}': Not a directory`)
      }
      return ok()
    }
    case 'touch': {
      if (!args.length) return bad('touch: missing file operand')
      for (const a of args) {
        const path = resolve(s.cwd, a)
        if (lookup(s, path)) continue
        const err = writeFile(s, path, '', false)
        if (err) return bad(err.replace('bash', 'touch'))
      }
      return ok()
    }
    case 'cat': {
      const { flags: f, rest } = flags(args)
      const got = inputs(ctx, 'cat', rest, stdin)
      if (isRes(got)) return got
      let text = got.srcs.map((x) => x.text).join('')
      if (f.has('n')) text = fromLines(toLines(text).map((l, i) => `${String(i + 1).padStart(6)}\t${l}`))
      return result(text, got.errs, got.errs.length ? 1 : 0)
    }
    case 'head':
    case 'tail': {
      let n = 10
      let fromStart = false
      const files: string[] = []
      for (let i = 0; i < args.length; i++) {
        const a = args[i]!
        let v: string | undefined
        if (a === '-n') v = args[++i]
        else if (/^-n.+/.test(a)) v = a.slice(2)
        else if (/^-\d+$/.test(a)) v = a.slice(1)
        else {
          files.push(a)
          continue
        }
        if (v === undefined || !/^\+?\d+$/.test(v)) return bad(`${cmd}: invalid number of lines: '${v ?? ''}'`)
        fromStart = v.startsWith('+')
        n = Number(v.replace('+', ''))
      }
      const got = inputs(ctx, cmd, files, stdin)
      if (isRes(got)) return got
      const errs = got.errs.map((e) => e.replace(`${cmd}: `, `${cmd}: cannot open '`).replace(/: No such file or directory$/, "' for reading: No such file or directory"))
      const blocks = got.srcs.map((src) => {
        const lines = toLines(src.text)
        const picked = cmd === 'head' ? lines.slice(0, n) : fromStart ? lines.slice(Math.max(n - 1, 0)) : n === 0 ? [] : lines.slice(-n)
        return (got.srcs.length > 1 ? `==> ${src.name} <==\n` : '') + fromLines(picked)
      })
      return result(blocks.join(got.srcs.length > 1 ? '\n' : ''), errs, errs.length ? 1 : 0)
    }
    case 'wc': {
      const { flags: f, rest } = flags(args)
      const got = inputs(ctx, 'wc', rest, stdin)
      if (isRes(got)) return got
      const want = ['l', 'w', 'c'].filter((k) => f.has(k) || (k === 'c' && f.has('m')))
      const cols = want.length ? want : ['l', 'w', 'c']
      const count = (t: string) => ({
        l: t === '' ? 0 : t.split('\n').length - (t.endsWith('\n') ? 1 : 0),
        w: t.split(/\s+/).filter(Boolean).length,
        c: t.length,
      })
      const total = { l: 0, w: 0, c: 0 }
      const lines = got.srcs.map((src) => {
        const c = count(src.text)
        total.l += c.l
        total.w += c.w
        total.c += c.c
        return [...cols.map((k) => c[k as 'l']), ...(src.std ? [] : [src.name])].join(' ')
      })
      if (got.srcs.length > 1) lines.push([...cols.map((k) => total[k as 'l']), 'total'].join(' '))
      return result(fromLines(lines), got.errs, got.errs.length ? 1 : 0)
    }
    case 'grep':
      return grep(ctx, args, stdin)
    case 'sort':
      return sortCmd(ctx, args, stdin)
    case 'uniq': {
      const { flags: f, rest } = flags(args)
      const got = inputs(ctx, 'uniq', rest.slice(0, 1), stdin)
      if (isRes(got)) return got
      const lines = toLines(got.srcs.map((x) => x.text).join(''))
      const groups: { line: string; n: number }[] = []
      for (const l of lines) {
        const last = groups[groups.length - 1]
        if (last && (f.has('i') ? last.line.toLowerCase() === l.toLowerCase() : last.line === l)) last.n++
        else groups.push({ line: l, n: 1 })
      }
      const kept = groups.filter((g) => (f.has('d') ? g.n > 1 : f.has('u') ? g.n === 1 : true))
      return result(fromLines(kept.map((g) => (f.has('c') ? `${String(g.n).padStart(7)} ${g.line}` : g.line))), got.errs, got.errs.length ? 1 : 0)
    }
    case 'cut':
      return cutCmd(ctx, args, stdin)
    case 'tr':
      return trCmd(args, stdin)
    case 'tee': {
      const { flags: f, rest } = flags(args)
      const text = stdin?.buf ?? ''
      if (stdin) stdin.buf = ''
      const errs: string[] = []
      for (const file of rest) {
        const err = writeFile(s, resolve(s.cwd, file), text, f.has('a'))
        if (err) errs.push(err.replace('bash', 'tee'))
      }
      return result(text, errs, errs.length ? 1 : 0)
    }
    case 'find':
      return findCmd(ctx, args, tty, line)
    case 'sed':
      return sedCmd(ctx, args, stdin)
    case 'xargs':
      return xargsCmd(ctx, args, stdin, tty, line)
    case 'basename': {
      if (!args.length) return bad('basename: missing operand')
      let b = baseName(args[0]!)
      if (args[1] && b.endsWith(args[1]) && b !== args[1]) b = b.slice(0, -args[1].length)
      return ok(b)
    }
    case 'dirname': {
      if (!args.length) return bad('dirname: missing operand')
      const p = args[0]!.replace(/\/+$/, '')
      const i = p.lastIndexOf('/')
      return ok(i < 0 ? '.' : i === 0 ? '/' : p.slice(0, i))
    }
    case 'seq': {
      const nums = args.map(Number)
      if (!nums.length || nums.length > 3 || nums.some((n) => !Number.isFinite(n))) return bad('seq: usage: seq [FIRST [STEP]] LAST')
      const [first, step, last] = nums.length === 1 ? [1, 1, nums[0]!] : nums.length === 2 ? [nums[0]!, 1, nums[1]!] : [nums[0]!, nums[1]!, nums[2]!]
      if (step === 0) return bad('seq: the step cannot be 0')
      const outL: string[] = []
      for (let v = first; step > 0 ? v <= last : v >= last; v += step) {
        outL.push(String(v))
        if (outL.length >= 10000) break
      }
      return out(fromLines(outL))
    }
    case 'chmod': {
      const [mode, ...files] = args
      if (!mode || !files.length) return bad('chmod: usage: chmod +x FILE')
      let exec: boolean | null = null
      if (/^[0-7]{3,4}$/.test(mode)) exec = (Number(mode[mode.length - 3]) & 1) === 1
      else {
        const m = /^[ugoa]*([+=-])([rwxX]+)$/.exec(mode)
        if (!m) return bad(`chmod: invalid mode: '${mode}'`)
        if (m[2]!.includes('x')) exec = m[1] !== '-'
        else if (m[1] === '=') exec = false
      }
      const errs: string[] = []
      for (const f of files) {
        const node = lookup(s, resolve(s.cwd, f))
        if (!node) errs.push(`chmod: cannot access '${f}': No such file or directory`)
        else if (node.kind === 'file' && exec !== null) {
          if (exec) node.exec = true
          else delete node.exec
        }
      }
      return result('', errs, errs.length ? 1 : 0)
    }
    case 'rm':
    case 'rmdir': {
      const { flags: f, rest } = flags(args)
      if (!rest.length) return bad(`${cmd}: missing operand`)
      const errs: string[] = []
      for (const a of rest) {
        const path = resolve(s.cwd, a)
        if (path === '/') {
          errs.push(`${cmd}: it is dangerous to operate recursively on '/' — refusing`)
          continue
        }
        const node = lookup(s, path)
        if (!node) {
          if (!f.has('f')) errs.push(`${cmd}: cannot remove '${a}': No such file or directory`)
          continue
        }
        if (node.kind === 'dir') {
          if (cmd === 'rmdir' && Object.keys(node.children).length) {
            errs.push(`rmdir: failed to remove '${a}': Directory not empty`)
            continue
          }
          if (cmd === 'rm' && !f.has('r') && !f.has('R')) {
            errs.push(`rm: cannot remove '${a}': Is a directory (use rm -r)`)
            continue
          }
        } else if (cmd === 'rmdir') {
          errs.push(`rmdir: failed to remove '${a}': Not a directory`)
          continue
        }
        if (s.cwd === path || s.cwd.startsWith(`${path}/`)) {
          errs.push(`${cmd}: refusing to remove '${a}': you are inside it`)
          continue
        }
        removePath(s, path)
      }
      return result('', errs, errs.length ? 1 : 0)
    }
    case 'cp':
    case 'mv': {
      const { flags: f, rest } = flags(args)
      if (rest.length < 2) return bad(`${cmd}: expected a source and a destination`)
      const destArg = rest[rest.length - 1]!
      const sources = rest.slice(0, -1)
      const destAbs = resolve(s.cwd, destArg)
      const intoDir = lookup(s, destAbs)?.kind === 'dir'
      if (sources.length > 1 && !intoDir) return bad(`${cmd}: target '${destArg}' is not a directory`)
      if (destArg.endsWith('/') && !intoDir)
        return bad(cmd === 'mv' ? `mv: cannot move '${sources[0]}' to '${destArg}': Not a directory` : `cp: cannot create regular file '${destArg}': Not a directory`)
      const errs: string[] = []
      const said: string[] = []
      for (const srcArg of sources) {
        const src = resolve(s.cwd, srcArg)
        const node = lookup(s, src)
        if (!node) {
          errs.push(`${cmd}: cannot stat '${srcArg}': No such file or directory`)
          continue
        }
        if (cmd === 'cp' && node.kind === 'dir' && !f.has('r') && !f.has('R')) {
          errs.push(`cp: -r not specified; omitting directory '${srcArg}'`)
          continue
        }
        const dest = intoDir ? `${destAbs === '/' ? '' : destAbs}/${parentOf(src)[1]}` : destAbs
        const [ddir, dname] = parentOf(dest)
        const parent = lookup(s, ddir)
        if (!parent || parent.kind !== 'dir') {
          errs.push(`${cmd}: cannot create '${destArg}': No such file or directory`)
          continue
        }
        if (dest === src) {
          if (cmd === 'cp') errs.push(`cp: '${srcArg}' and '${destArg}' are the same file`)
          continue
        }
        if (dest.startsWith(`${src}/`)) {
          errs.push(`${cmd}: cannot ${cmd === 'mv' ? 'move' : 'copy'} '${srcArg}' into itself`)
          continue
        }
        if (f.has('n') && parent.children[dname]) continue
        parent.children[dname] = clone(node)
        if (cmd === 'mv') {
          removePath(s, src)
          if (s.cwd === src || s.cwd.startsWith(`${src}/`)) s.cwd = dest + s.cwd.slice(src.length)
        }
        if (f.has('v')) said.push(`${cmd === 'mv' ? 'renamed ' : ''}'${srcArg}' -> '${intoDir ? `${destArg.replace(/\/$/, '')}/${parentOf(src)[1]}` : destArg}'`)
      }
      return result(fromLines(said), errs, errs.length ? 1 : 0)
    }
    case 'env':
    case 'printenv': {
      const sc = ctx.scope
      if (cmd === 'printenv' && args.length) {
        const vals = args.filter((a) => sc.exported.includes(a) && sc.vars[a] !== undefined).map((a) => sc.vars[a]!)
        return { code: vals.length === args.length ? 0 : 1, chunks: vals.length ? [[1, fromLines(vals)]] : [] }
      }
      if (args.length) return bad('env: running a command through env is not part of the practice terminal; set the variable first: NAME=value command')
      return ok(
        sc.exported
          .filter((n) => sc.vars[n] !== undefined)
          .sort()
          .map((n) => `${n}=${sc.vars[n]}`)
          .join('\n'),
      )
    }
    case 'export':
    case 'declare':
    case 'local':
    case 'readonly': {
      const sc = ctx.scope
      const exportIt = cmd === 'export' || args.includes('-x')
      const names = args.filter((a) => !/^-[a-z]+$/.test(a))
      if (!names.length)
        return ok(
          sc.exported
            .filter((n) => sc.vars[n] !== undefined)
            .sort()
            .map((n) => `declare -x ${n}="${sc.vars[n]}"`)
            .join('\n'),
        )
      for (const a of names) {
        const eq = a.indexOf('=')
        const name = eq < 0 ? a : a.slice(0, eq)
        if (!/^[A-Za-z_]\w*$/.test(name)) return bad(`${where(ctx, line)}${cmd}: \`${a}': not a valid identifier`)
        if (eq >= 0) sc.vars[name] = a.slice(eq + 1)
        if (exportIt && args.includes('-n')) sc.exported.splice(sc.exported.indexOf(name) >>> 0, sc.exported.includes(name) ? 1 : 0)
        else if (exportIt && !sc.exported.includes(name)) sc.exported.push(name)
      }
      return ok()
    }
    case 'unset': {
      const sc = ctx.scope
      for (const a of args.filter((x) => !x.startsWith('-'))) {
        delete sc.vars[a]
        const i = sc.exported.indexOf(a)
        if (i >= 0) sc.exported.splice(i, 1)
      }
      return ok()
    }
    case 'set': {
      const o = ctx.scope.opts
      if (!args.length)
        return ok(
          Object.keys(ctx.scope.vars)
            .sort()
            .map((n) => `${n}=${ctx.scope.vars[n]}`)
            .join('\n'),
        )
      for (let i = 0; i < args.length; i++) {
        const a = args[i]!
        const on = a.startsWith('-')
        if (!/^[-+][a-z]+$/.test(a)) return bad(`set: ${a}: invalid option`, 2)
        for (const c of a.slice(1)) {
          if (c === 'x') o.x = on
          else if (c === 'e') o.e = on
          else if (c === 'u') o.u = on
          else if (c === 'o') {
            const name = args[++i]
            if (name === 'pipefail') o.pipefail = on
            else if (name === 'errexit') o.e = on
            else if (name === 'nounset') o.u = on
            else if (name === 'xtrace') o.x = on
            else return bad(`set: ${name ?? ''}: invalid option name`, 2)
          } else return bad(`set: -${c}: invalid option`, 2)
        }
      }
      for (const k of ['x', 'e', 'u', 'pipefail'] as const) if (!o[k]) delete o[k]
      return ok()
    }
    case 'read': {
      const names = args.filter((a) => !a.startsWith('-'))
      const pi = args.indexOf('-p')
      if (pi >= 0) names.splice(names.indexOf(args[pi + 1]!), 1)
      if (!stdin) return bad(`${where(ctx, line)}read: the practice terminal cannot wait for typing — pipe text in: … | while read line; do …; done`)
      if (!stdin.buf) return { code: 1, chunks: [] }
      const nl = stdin.buf.indexOf('\n')
      const got = nl < 0 ? stdin.buf : stdin.buf.slice(0, nl)
      stdin.buf = nl < 0 ? '' : stdin.buf.slice(nl + 1)
      const vars = names.length ? names : ['REPLY']
      let restText = vars.length === 1 ? got.trim() : got.trimStart()
      vars.forEach((v, k) => {
        if (k === vars.length - 1) {
          ctx.scope.vars[v] = restText.trim()
          return
        }
        const m = /^(\S*)\s*(.*)$/.exec(restText)!
        ctx.scope.vars[v] = m[1]!
        restText = m[2]!
      })
      return { code: 0, chunks: [] }
    }
    case 'exit': {
      const n = args[0] === undefined ? ctx.status : Number(args[0])
      return { code: Number.isFinite(n) ? n & 255 : 2, chunks: [], exit: true }
    }
    case 'test':
    case '[':
    case '[[':
      return testCmd(ctx, cmd, args, line)
    case 'source':
    case '.':
      if (!args.length) return bad(`${cmd}: filename argument required`, 2)
      return runScript(ctx, args[0]!, args.slice(1), { child: false }, stdin, line)
    case 'bash':
    case 'sh': {
      let k = 0
      let trace = false
      let check = false
      let command: string | null = null
      while (k < args.length && args[k]!.startsWith('-')) {
        const a = args[k]!
        if (a === '-c') command = args[++k] ?? ''
        else
          for (const c of a.slice(1)) {
            if (c === 'x') trace = true
            else if (c === 'n') check = true
            else if (c !== 'e') return bad(`${cmd}: -${c}: invalid option`, 2)
          }
        k++
      }
      if (command !== null) {
        const sub = subshell(ctx)
        sub.scope.opts = trace ? { x: true } : {}
        sub.scope.args = [cmd, ...args.slice(k)]
        const [cwd, prev] = [s.cwd, s.prev]
        let r: Res
        try {
          r = execList(sub, parse(tokenize(command)), stdin, true)
        } catch (e) {
          r = bad(`${cmd}: -c: ${(e as Error).message}`, 2)
        }
        s.cwd = cwd
        s.prev = prev
        return { code: r.code, chunks: r.chunks }
      }
      if (k >= args.length) return bad(`${cmd}: an interactive shell inside the practice terminal is not supported — run a script instead: bash script.sh`, 2)
      return runScript(ctx, args[k]!, args.slice(k + 1), { child: true, trace, check }, stdin, line)
    }
    case 'type':
    case 'which': {
      const lines: string[] = []
      let code = 0
      for (const a of args) {
        if (cmd === 'type' && KEYWORDS.includes(a)) lines.push(`${a} is a shell keyword`)
        else if (cmd === 'type' && BUILTINS.includes(a)) lines.push(`${a} is a shell builtin`)
        else if (COMMANDS.includes(a) && !BUILTIN_ONLY.has(a)) lines.push(cmd === 'type' ? `${a} is /usr/bin/${a}` : `/usr/bin/${a}`)
        else {
          code = 1
          if (cmd === 'type') lines.push(`bash: type: ${a}: not found`)
        }
      }
      return { code, chunks: lines.length ? [[code && cmd === 'type' && lines.length === 1 ? 2 : 1, fromLines(lines)]] : [] }
    }
    case 'git':
      return git(ctx, args)
  }
  if (cmd.includes('/')) {
    const path = resolve(s.cwd, cmd)
    const node = lookup(s, path)
    if (!node) return bad(`${where(ctx, line)}${cmd}: No such file or directory`, 127)
    if (node.kind === 'dir') return bad(`${where(ctx, line)}${cmd}: Is a directory`, 126)
    if (!node.exec) return bad(`${where(ctx, line)}${cmd}: Permission denied`, 126)
    return runScript(ctx, cmd, args, { child: true }, stdin, line)
  }
  if (EDITORS.includes(cmd)) return bad(`${cmd}: there is no text editor in the practice terminal — write a file with echo "text" > file, and add lines with >>`, 127)
  if (ctx.scope.name) return bad(`${ctx.scope.name}: line ${line}: ${cmd}: command not found`, 127)
  const here = lookup(s, resolve(s.cwd, cmd))
  const tip = here?.kind === 'file' ? ` (to run the script in this folder, type ./${cmd} or bash ${cmd})` : ' Type help to see what this practice terminal knows.'
  return bad(`${via ? `${via}: ` : ''}${cmd}: command not found.${tip}`, 127)
}

function grep(ctx: Ctx, args: string[], stdin: Stdin): Res {
  const o = new Set<string>()
  let pattern: string | undefined
  const files: string[] = []
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!
    if (a === '--') {
      const tail = args.slice(k + 1)
      if (pattern === undefined) pattern = tail.shift()
      files.push(...tail)
      break
    }
    if (a.startsWith('--colo')) continue
    if (/^-[a-zA-Z]+$/.test(a)) {
      for (let j = 1; j < a.length; j++) {
        const c = a[j]!
        if (c === 'e') {
          pattern = a.slice(j + 1) || args[++k]
          break
        }
        if (!'invcrRlLowqEFhHsx'.includes(c)) return bad(`grep: invalid option -- '${c}'`, 2)
        o.add(c === 'R' ? 'r' : c)
      }
      continue
    }
    if (pattern === undefined) pattern = a
    else files.push(a)
  }
  if (pattern === undefined) return bad('usage: grep [-i] [-n] [-v] [-c] [-r] [-E] PATTERN [FILE…]', 2)
  let re: RegExp
  try {
    const base = makeRegex(pattern, o.has('F') ? 'fixed' : o.has('E') ? 'extended' : 'basic', '')
    let src = base.source
    if (o.has('w')) src = `(?<![\\w])(?:${src})(?![\\w])`
    if (o.has('x')) src = `^(?:${src})$`
    re = new RegExp(src, `g${o.has('i') ? 'i' : ''}`)
  } catch {
    return bad('grep: Invalid regular expression', 2)
  }
  const s = ctx.s
  const errs: string[] = []
  let srcs: Src[] = []
  if (o.has('r')) {
    const roots = files.length ? files : ['.']
    for (const r of roots) {
      const abs = resolve(s.cwd, r)
      const node = lookup(s, abs)
      if (!node) {
        errs.push(`grep: ${r}: No such file or directory`)
        continue
      }
      const walk = (n: Node, disp: string) => {
        if (n.kind === 'file') srcs.push({ name: disp, text: n.content })
        else for (const name of Object.keys(n.children).sort()) if (name !== '.git') walk(n.children[name]!, disp ? `${disp.replace(/\/$/, '')}/${name}` : name)
      }
      walk(node, files.length ? r : '')
    }
  } else {
    const got = inputs(ctx, 'grep', files, stdin)
    if (isRes(got)) return got
    srcs = got.srcs
    errs.push(...got.errs)
  }
  const showName = (o.has('H') || srcs.length > 1 || o.has('r')) && !o.has('h')
  const lines: string[] = []
  let matched = false
  for (const src of srcs) {
    const hits = toLines(src.text)
      .map((l, i) => ({ l, i }))
      .filter(({ l }) => {
        re.lastIndex = 0
        return re.test(l) !== o.has('v')
      })
    if (hits.length) matched = true
    if (o.has('q')) {
      if (matched) return { code: 0, chunks: [] }
      continue
    }
    const pre = showName ? `${src.name}:` : ''
    if (o.has('l')) {
      if (hits.length) lines.push(src.name)
    } else if (o.has('L')) {
      if (!hits.length) lines.push(src.name)
    } else if (o.has('c')) lines.push(`${pre}${hits.length}`)
    else
      for (const { l, i } of hits) {
        const at = `${pre}${o.has('n') ? `${i + 1}:` : ''}`
        if (o.has('o') && !o.has('v')) {
          re.lastIndex = 0
          for (const m of l.matchAll(re)) if (m[0]) lines.push(at + m[0])
        } else lines.push(at + l)
      }
  }
  return result(fromLines(lines), o.has('s') ? [] : errs, errs.length ? 2 : matched ? 0 : 1)
}

function sortCmd(ctx: Ctx, args: string[], stdin: Stdin): Res {
  const o = new Set<string>()
  let key: { start: number; end: number | null; n: boolean; r: boolean } | null = null
  let sep: string | null = null
  const files: string[] = []
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!
    let spec: string | undefined
    if (a === '-k') spec = args[++k]
    else if (a.startsWith('-k')) spec = a.slice(2)
    else if (a === '-t') {
      sep = args[++k] ?? null
      continue
    } else if (/^-t.$/.test(a)) {
      sep = a.slice(2)
      continue
    } else if (/^-[a-zA-Z]+$/.test(a)) {
      for (const c of a.slice(1)) {
        if (!'nrufbsVh'.includes(c)) return bad(`sort: invalid option -- '${c}'`, 2)
        o.add(c)
      }
      continue
    } else {
      files.push(a)
      continue
    }
    const m = /^(\d+)(?:\.\d+)?([a-z]*)(?:,(\d+)(?:\.\d+)?([a-z]*))?$/.exec(spec ?? '')
    if (!m) return bad(`sort: invalid key: '${spec ?? ''}'`, 2)
    const kinds = (m[2] ?? '') + (m[4] ?? '')
    key = { start: Number(m[1]), end: m[3] ? Number(m[3]) : null, n: kinds.includes('n'), r: kinds.includes('r') }
  }
  const got = inputs(ctx, 'sort', files, stdin)
  if (isRes(got)) return got
  const lines = toLines(got.srcs.map((x) => x.text).join(''))
  const keyOf = (l: string) => {
    if (!key) return l
    const fields = sep ? l.split(sep) : l.trim().split(/\s+/)
    return fields.slice(key.start - 1, key.end ?? undefined).join(sep ?? ' ')
  }
  const numeric = o.has('n') || o.has('h') || !!key?.n
  const reverse = o.has('r') !== !!key?.r
  const num = (t: string) => {
    const m = /^\s*([-+]?(?:\d+\.?\d*|\.\d+))/.exec(t)
    return m ? Number(m[1]) : 0
  }
  const byte = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
  const keyCmp = (a: string, b: string) => {
    const ka = keyOf(a)
    const kb = keyOf(b)
    if (numeric) return num(ka) - num(kb)
    return o.has('f') ? byte(ka.toLowerCase(), kb.toLowerCase()) : byte(ka, kb)
  }
  const cmp = (a: string, b: string) => {
    const c = keyCmp(a, b) || (o.has('u') || o.has('s') ? 0 : byte(a, b))
    return reverse ? -c : c
  }
  let sorted = [...lines].sort(cmp)
  if (o.has('u')) sorted = sorted.filter((l, i) => i === 0 || keyCmp(sorted[i - 1]!, l) !== 0)
  return result(fromLines(sorted), got.errs, got.errs.length ? 2 : 0)
}

/** `1,3-5,7-` as a test for 1-based positions. */
function rangeList(spec: string): ((n: number) => boolean) | null {
  const parts = spec.split(',')
  const tests: [number, number][] = []
  for (const p of parts) {
    const m = /^(\d*)(-?)(\d*)$/.exec(p)
    if (!m || (!m[1] && !m[3]) || m[1] === '0' || m[3] === '0') return null
    const a = m[1] ? Number(m[1]) : 1
    const b = m[2] ? (m[3] ? Number(m[3]) : Infinity) : a
    tests.push([a, b])
  }
  return (n) => tests.some(([a, b]) => n >= a && n <= b)
}

function cutCmd(ctx: Ctx, args: string[], stdin: Stdin): Res {
  let delim = '\t'
  let fields: string | null = null
  let chars: string | null = null
  let only = false
  const files: string[] = []
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!
    if (a === '-d') delim = args[++k] ?? ''
    else if (a.startsWith('-d')) delim = a.slice(2)
    else if (a === '-f') fields = args[++k] ?? ''
    else if (a.startsWith('-f')) fields = a.slice(2)
    else if (a === '-c' || a === '-b') chars = args[++k] ?? ''
    else if (a.startsWith('-c') || a.startsWith('-b')) chars = a.slice(2)
    else if (a === '-s') only = true
    else if (a.startsWith('-') && a !== '-') return bad(`cut: invalid option -- '${a.slice(1)}'`)
    else files.push(a)
  }
  if (fields === null && chars === null) return bad('cut: you must specify a list of bytes, characters, or fields (for example -d, -f2)')
  if (delim.length !== 1) return bad('cut: the delimiter must be a single character')
  const pick = rangeList((fields ?? chars)!)
  if (!pick) return bad(`cut: invalid field list '${fields ?? chars}' — fields are numbered from 1`)
  const got = inputs(ctx, 'cut', files, stdin)
  if (isRes(got)) return got
  const outL: string[] = []
  for (const l of toLines(got.srcs.map((x) => x.text).join(''))) {
    if (chars !== null) {
      outL.push([...l].filter((_, i) => pick(i + 1)).join(''))
      continue
    }
    if (!l.includes(delim)) {
      if (!only) outL.push(l)
      continue
    }
    outL.push(
      l
        .split(delim)
        .filter((_, i) => pick(i + 1))
        .join(delim),
    )
  }
  return result(fromLines(outL), got.errs, got.errs.length ? 1 : 0)
}

function trSet(spec: string): string[] {
  const classes: Record<string, string> = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digit: '0123456789',
    space: ' \t\n\r',
    blank: ' \t',
    punct: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
  }
  classes.alpha = classes.upper! + classes.lower!
  classes.alnum = classes.alpha + classes.digit!
  const t = spec.replace(/\[:(\w+):\]/g, (m, n: string) => classes[n] ?? m).replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\')
  const chars: string[] = []
  for (let i = 0; i < t.length; i++) {
    if (t[i + 1] === '-' && i + 2 < t.length) {
      for (let c = t.charCodeAt(i); c <= t.charCodeAt(i + 2); c++) chars.push(String.fromCharCode(c))
      i += 2
    } else chars.push(t[i]!)
  }
  return chars
}

function trCmd(args: string[], stdin: Stdin): Res {
  const { flags: f, rest } = flags(args)
  if (!rest.length || rest.length > 2) return bad("tr: usage: tr SET1 SET2 (or tr -d SET1) — tr reads only from a pipe, never from a file")
  if (!stdin) return bad('tr: reads only from a pipe or <: … | tr a-z A-Z')
  const text = stdin.buf
  stdin.buf = ''
  const a = trSet(rest[0]!)
  let res = ''
  if (f.has('d')) res = [...text].filter((c) => !a.includes(c)).join('')
  else if (rest[1] !== undefined) {
    const b = trSet(rest[1])
    res = [...text].map((c) => (a.includes(c) ? (b[a.indexOf(c)] ?? b[b.length - 1] ?? '') : c)).join('')
  } else if (!f.has('s')) return bad('tr: missing operand after the first set')
  else res = text
  if (f.has('s')) {
    const sq = rest[1] !== undefined && !f.has('d') ? trSet(rest[1]) : a
    res = [...res].filter((c, i, all) => !(i > 0 && c === all[i - 1] && sq.includes(c))).join('')
  }
  return out(res)
}

function findCmd(ctx: Ctx, args: string[], tty: boolean, line: number): Res {
  const s = ctx.s
  let k = 0
  const paths: string[] = []
  while (k < args.length && !/^[-!(]/.test(args[k]!)) paths.push(args[k++]!)
  if (!paths.length) paths.push('.')
  type Test = (disp: string, node: Node) => boolean
  const tests: Test[] = []
  let maxd = Infinity
  let mind = 0
  let neg = false
  let exec: { argv: string[]; batch: boolean } | null = null
  let del = false
  let print = false
  for (; k < args.length; k++) {
    const a = args[k]!
    const v = args[k + 1]
    const push = (t: Test) => {
      const not = neg
      neg = false
      tests.push(not ? (d, n) => !t(d, n) : t)
    }
    const need = () => {
      if (v === undefined) throw new Error(`find: missing argument to \`${a}'`)
      k++
      return v
    }
    try {
      switch (a) {
        case '!':
        case '-not':
          neg = true
          break
        case '-name':
        case '-iname': {
          const p = need()
          push((d) => wildMatch(p, baseName(d), a === '-iname'))
          break
        }
        case '-path': {
          const p = need()
          push((d) => wildMatch(p, d))
          break
        }
        case '-type': {
          const t = need()
          if (t !== 'f' && t !== 'd') throw new Error(`find: unknown argument to -type: ${t} (use f for files, d for folders)`)
          push((_, n) => (t === 'f' ? n.kind === 'file' : n.kind === 'dir'))
          break
        }
        case '-maxdepth':
          maxd = Number(need())
          break
        case '-mindepth':
          mind = Number(need())
          break
        case '-empty':
          push((_, n) => (n.kind === 'file' ? n.content === '' : !Object.keys(n.children).length))
          break
        case '-print':
          print = true
          break
        case '-delete':
          del = true
          break
        case '-exec': {
          const end = args.findIndex((x, j) => j > k && (x === ';' || x === '+'))
          if (end < 0) throw new Error("find: missing argument to `-exec' (end it with \\; or +)")
          exec = { argv: args.slice(k + 1, end), batch: args[end] === '+' }
          k = end
          break
        }
        default:
          throw new Error(a.startsWith('-') ? `find: unknown predicate \`${a}'` : `find: paths must precede expression: \`${a}'${/^-(i?name|path)$/.test(args[k - 2] ?? '') ? `\nfind: possible unquoted pattern after predicate \`${args[k - 2]}'?` : ''}`)
      }
    } catch (e) {
      return bad((e as Error).message)
    }
  }
  const hits: { disp: string; abs: string }[] = []
  const errs: string[] = []
  for (const p of paths) {
    const abs = resolve(s.cwd, p)
    const node = lookup(s, abs)
    if (!node) {
      errs.push(`find: '${p}': No such file or directory`)
      continue
    }
    const walk = (disp: string, at: string, n: Node, depth: number) => {
      if (depth >= mind && tests.every((t) => t(disp, n))) hits.push({ disp, abs: at })
      if (n.kind === 'dir' && depth < maxd)
        for (const name of Object.keys(n.children).sort()) walk(disp === '/' ? `/${name}` : `${disp}/${name}`, `${at === '/' ? '' : at}/${name}`, n.children[name]!, depth + 1)
    }
    walk(p.length > 1 ? p.replace(/\/+$/, '') : p, abs, node, 0)
  }
  const chunks: Chunk[] = errs.map((e) => [2, `${e}\n`])
  let code = errs.length ? 1 : 0
  if (!exec && (!del || print)) chunks.push([1, fromLines(hits.map((h) => h.disp))])
  const ex = exec as { argv: string[]; batch: boolean } | null
  if (ex) {
    if (!ex.argv.length) return bad("find: missing argument to `-exec'")
    const runs = ex.batch ? [ex.argv.flatMap((w) => (w === '{}' ? hits.map((h) => h.disp) : [w]))] : hits.map((h) => ex.argv.map((w) => w.split('{}').join(h.disp)))
    if (ex.batch && !hits.length) runs.length = 0
    for (const argv of runs) {
      const r = dispatch(ctx, argv, { buf: '' }, tty, line, 'find')
      chunks.push(...r.chunks)
      if (r.code) code = 1
    }
  }
  if (del)
    for (const h of [...hits].reverse()) {
      const n = lookup(s, h.abs)
      if (!n || h.abs === '/' || s.cwd === h.abs || s.cwd.startsWith(`${h.abs}/`)) continue
      if (n.kind === 'dir' && Object.keys(n.children).length) {
        chunks.push([2, `find: cannot delete '${h.disp}': Directory not empty\n`])
        code = 1
        continue
      }
      removePath(s, h.abs)
    }
  return { code, chunks }
}

type SedAddr = { k: 'n'; n: number } | { k: '$' } | { k: 're'; re: RegExp }
interface SedCmd {
  a1?: SedAddr
  a2?: SedAddr
  neg: boolean
  op: string
  re?: RegExp
  rep?: string
  g?: boolean
  p?: boolean
  nth?: number
}

function parseSed(script: string, extended: boolean): SedCmd[] {
  const cmds: SedCmd[] = []
  let i = 0
  const fail = (m: string): never => {
    throw new Error(`sed: -e expression #1, char ${i}: ${m}`)
  }
  const kind = extended ? 'extended' : 'basic'
  const readTo = (d: string): string | null => {
    let r = ''
    while (i < script.length) {
      const c = script[i]!
      if (c === '\\' && script[i + 1] === d) {
        r += d
        i += 2
        continue
      }
      if (c === '\\') {
        r += c + (script[i + 1] ?? '')
        i += 2
        continue
      }
      if (c === d) {
        i++
        return r
      }
      r += c
      i++
    }
    return null
  }
  const regex = (p: string, f = '') => {
    try {
      return makeRegex(p, kind, f)
    } catch {
      return fail('invalid regular expression')
    }
  }
  const addr = (): SedAddr | undefined => {
    if (/\d/.test(script[i] ?? '')) {
      let j = i
      while (/\d/.test(script[j] ?? '')) j++
      const n = Number(script.slice(i, j))
      i = j
      return { k: 'n', n }
    }
    if (script[i] === '$') {
      i++
      return { k: '$' }
    }
    if (script[i] === '/') {
      i++
      const r = readTo('/')
      if (r === null) fail('unterminated address regex')
      return { k: 're', re: regex(r!) }
    }
    return undefined
  }
  while (i < script.length) {
    while (i < script.length && /[\s;]/.test(script[i]!)) i++
    if (i >= script.length) break
    const c: SedCmd = { neg: false, op: '' }
    const a1 = addr()
    if (a1) c.a1 = a1
    if (a1 && script[i] === ',') {
      i++
      const a2 = addr()
      if (!a2) fail("unexpected `,'")
      c.a2 = a2
    }
    while (script[i] === ' ') i++
    if (script[i] === '!') {
      c.neg = true
      i++
    }
    while (script[i] === ' ') i++
    const op = script[i++]
    if (op === undefined) fail('missing command')
    c.op = op!
    if (op === 's') {
      const d = script[i++]
      if (!d || d === '\\' || d === '\n' || d === ' ') fail("unterminated `s' command")
      const re = readTo(d!)
      if (re === null) fail("unterminated `s' command")
      const rep = readTo(d!)
      if (rep === null) fail("unterminated `s' command")
      let f = ''
      while (i < script.length && /[gpiI0-9]/.test(script[i]!)) {
        const ch = script[i++]!
        if (ch === 'g') c.g = true
        else if (ch === 'p') c.p = true
        else if (ch === 'i' || ch === 'I') f = 'i'
        else c.nth = Number(`${c.nth ?? ''}${ch}`)
      }
      if (i < script.length && !/[\s;}]/.test(script[i]!)) fail("unknown option to `s'")
      c.re = regex(re!, f)
      c.rep = rep!
    } else if (!'dpq='.includes(op!)) fail(`unknown command: \`${op}'`)
    cmds.push(c)
  }
  return cmds
}

function sedReplacement(rep: string, groups: string[]): string {
  let r = ''
  for (let k = 0; k < rep.length; k++) {
    const c = rep[k]!
    if (c === '\\' && k + 1 < rep.length) {
      const n = rep[++k]!
      if (/\d/.test(n)) r += groups[Number(n)] ?? ''
      else r += n === 'n' ? '\n' : n === 't' ? '\t' : n
    } else if (c === '&') r += groups[0] ?? ''
    else r += c
  }
  return r
}

function runSed(cmds: SedCmd[], lines: string[], quiet: boolean): string[] {
  const outL: string[] = []
  const inRange = cmds.map(() => false)
  for (let idx = 0; idx < lines.length; idx++) {
    const lineNo = idx + 1
    const last = idx === lines.length - 1
    let ps = lines[idx]!
    let deleted = false
    let quit = false
    const test = (a: SedAddr) => (a.k === 'n' ? lineNo === a.n : a.k === '$' ? last : a.re.test(ps))
    for (let ci = 0; ci < cmds.length; ci++) {
      const c = cmds[ci]!
      let m: boolean
      if (!c.a1) m = true
      else if (!c.a2) m = test(c.a1)
      else if (!inRange[ci]) {
        m = test(c.a1)
        if (m) inRange[ci] = !(c.a2.k === 'n' && c.a2.n <= lineNo)
      } else {
        m = true
        if (c.a2.k === 'n' ? lineNo >= c.a2.n : test(c.a2)) inRange[ci] = false
      }
      if (c.neg) m = !m
      if (!m) continue
      if (c.op === 's') {
        let count = 0
        let did = false
        const want = c.nth ?? 1
        ps = ps.replace(new RegExp(c.re!.source, `${c.re!.flags.replace('g', '')}g`), (...m2: unknown[]) => {
          count++
          const groups = m2.slice(0, -2) as string[]
          if (c.g ? count >= want : count === want) {
            did = true
            return sedReplacement(c.rep!, groups)
          }
          return groups[0]!
        })
        if (did && c.p) outL.push(ps)
      } else if (c.op === 'd') {
        deleted = true
        break
      } else if (c.op === 'p') outL.push(ps)
      else if (c.op === '=') outL.push(String(lineNo))
      else if (c.op === 'q') {
        quit = true
        break
      }
    }
    if (!deleted && !quiet) outL.push(ps)
    if (quit) break
  }
  return outL
}

function sedCmd(ctx: Ctx, args: string[], stdin: Stdin): Res {
  let quiet = false
  let extended = false
  let inPlace = false
  const scripts: string[] = []
  const files: string[] = []
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!
    if (a === '--quiet') quiet = true
    else if (/^-[nErie]+$/.test(a) || /^-i\S*$/.test(a)) {
      if (a.startsWith('-i') && !/^-i[nEre]*$/.test(a)) {
        inPlace = true
        continue
      }
      for (const c of a.slice(1)) {
        if (c === 'n') quiet = true
        else if (c === 'E' || c === 'r') extended = true
        else if (c === 'i') inPlace = true
        else if (c === 'e') scripts.push(args[++k] ?? '')
      }
    } else if (!scripts.length) scripts.push(a)
    else files.push(a)
  }
  if (!scripts.length) return bad('Usage: sed [-n] [-E] [-i] SCRIPT [FILE…]   e.g. sed \'s/old/new/g\' file.txt')
  let cmds: SedCmd[]
  try {
    cmds = parseSed(scripts.join('\n'), extended)
  } catch (e) {
    return bad((e as Error).message)
  }
  if (inPlace) {
    if (!files.length) return bad('sed: no input files (sed -i changes files in place, so it needs a file name)')
    const errs: string[] = []
    for (const f of files) {
      const path = resolve(ctx.s.cwd, f)
      const node = lookup(ctx.s, path)
      if (!node || node.kind !== 'file') {
        errs.push(`sed: can't read ${f}: No such file or directory`)
        continue
      }
      writeFile(ctx.s, path, fromLines(runSed(cmds, toLines(node.content), quiet)), false)
    }
    return result('', errs, errs.length ? 2 : 0)
  }
  const got = inputs(ctx, 'sed', files, stdin)
  if (isRes(got)) return got
  return result(fromLines(runSed(cmds, toLines(got.srcs.map((x) => x.text).join('')), quiet)), got.errs.map((e) => e.replace(/^sed: (.*): No such/, "sed: can't read $1: No such")), got.errs.length ? 2 : 0)
}

function xargsCmd(ctx: Ctx, args: string[], stdin: Stdin, tty: boolean, line: number): Res {
  let k = 0
  let perN = 0
  let repl: string | null = null
  let trace = false
  let noEmpty = false
  while (k < args.length && args[k]!.startsWith('-') && args[k] !== '-') {
    const a = args[k]!
    if (a === '-n') perN = Number(args[++k])
    else if (/^-n\d+$/.test(a)) perN = Number(a.slice(2))
    else if (a === '-I') repl = args[++k] ?? '{}'
    else if (a.startsWith('-I')) repl = a.slice(2)
    else if (a === '-t') trace = true
    else if (a === '-r' || a === '--no-run-if-empty') noEmpty = true
    else return bad(`xargs: invalid option -- '${a.replace(/^-+/, '')}'`)
    k++
  }
  const cmd = args.slice(k).length ? args.slice(k) : ['echo']
  if (!stdin) return bad('xargs: reads its list from a pipe: … | xargs command')
  const text = stdin.buf
  stdin.buf = ''
  let runs: string[][]
  if (repl !== null) {
    const r = repl
    runs = toLines(text)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((item) => cmd.map((w) => w.split(r).join(item)))
  } else {
    const items = splitWords(text)
    if (!items.length && noEmpty) return { code: 0, chunks: [] }
    const groups: string[][] = []
    if (perN > 0) for (let i = 0; i < items.length; i += perN) groups.push(items.slice(i, i + perN))
    else groups.push(items)
    runs = groups.map((g) => [...cmd, ...g])
  }
  const chunks: Chunk[] = []
  let code = 0
  for (const argv of runs) {
    if (trace) chunks.push([2, `${argv.join(' ')}\n`])
    const r = dispatch(ctx, argv, { buf: '' }, tty, line, 'xargs')
    chunks.push(...r.chunks)
    if (r.code === 127) return { code: 127, chunks }
    if (r.code) code = 123
  }
  return { code, chunks }
}

/* ── git ─────────────────────────────────────────────────────────────────── */

interface G {
  s: ShellState
  ctx: Ctx
  root: string
  repo: Repo
  /** A path as the repository names it: relative to its root. */
  rel: (p: string) => string
}

const WORKTREE_SUBS = ['status', 'add', 'rm', 'commit', 'diff', 'restore', 'reset', 'switch', 'checkout', 'merge', 'stash', 'revert', 'cherry-pick', 'rebase', 'bisect', 'pull', 'blame', 'check-ignore']

function repoAt(s: ShellState, dir: string): Repo | null {
  const repo = s.repos[dir]
  if (!repo) return null
  return (repo.bare ? lookup(s, dir)?.kind === 'dir' : lookup(s, `${dir}/.git`)) ? repo : null
}

function repoFor(s: ShellState): { root: string; repo: Repo } | null {
  let dir = s.cwd
  for (;;) {
    const repo = repoAt(s, dir)
    if (repo) return { root: dir, repo }
    if (dir === '/') return null
    dir = parentOf(dir)[0]
  }
}

function git(ctx: Ctx, args: string[]): Res {
  const s = ctx.s
  const [sub, ...rest] = args
  if (!sub || sub === 'help' || sub === '--help') return ok(GIT_USAGE)
  if (sub === '--version' || sub === 'version') return ok('git version 2.47.0 (practice terminal)')
  if (sub === 'init') return gitInit(s, rest)
  if (sub === 'clone') return gitClone(s, rest)
  const found = repoFor(s)
  if (sub === 'config') return gitConfig(s, found && !rest.includes('--global') ? found.repo : null, rest)
  if (!found) return bad('fatal: not a git repository (or any of the parent directories): .git', 128)
  const { root, repo } = found
  const g: G = {
    s,
    ctx,
    root,
    repo,
    rel: (p) => {
      const abs = resolve(s.cwd, p)
      return abs === root ? '' : abs.slice(root.length + 1)
    },
  }
  if (repo.bare && WORKTREE_SUBS.includes(sub)) return bad('fatal: this operation must be run in a work tree', 128)
  const fn = GIT[sub]
  if (!fn) return bad(`git: '${sub}' is not a git command in this practice terminal. Type git help to see the ones it knows.`)
  return fn(g, rest)
}

/* ── Commits, trees and references ── */

function headId(repo: Repo): string | null {
  return repo.detached ?? repo.branches[repo.branch] ?? null
}

function commitById(repo: Repo, id: string | null | undefined): Commit | undefined {
  return id ? repo.commits.find((c) => c.id === id) : undefined
}

function treeOf(repo: Repo, id: string | null | undefined): Record<string, string> {
  return commitById(repo, id)?.tree ?? {}
}

function headTree(repo: Repo): Record<string, string> {
  return treeOf(repo, headId(repo))
}

/** What the next commit would contain: HEAD plus what is staged. */
function indexTree(repo: Repo): Record<string, string> {
  const t = { ...headTree(repo), ...repo.staged }
  for (const f of repo.removed) delete t[f]
  return t
}

const firstLine = (m: string) => m.split('\n')[0]!
const subjectOf = (repo: Repo, id: string | null) => firstLine(commitById(repo, id)?.message ?? '')
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function moveHead(repo: Repo, id: string | null, msg: string): void {
  if (repo.detached !== null) repo.detached = id
  else repo.branches[repo.branch] = id
  if (id) repo.reflog.push({ id, msg })
}

function authorName(g: G, override?: string): string {
  return override ?? g.repo.config['user.name'] ?? g.s.gitConfig['user.name'] ?? 'you'
}

function makeCommit(repo: Repo, c: Omit<Commit, 'id'>): Commit {
  let salt = 0
  let id: string
  do id = hash(`${repo.commits.length}:${salt++}:${c.parent}:${c.parent2 ?? ''}:${c.author ?? ''}:${c.message}:${JSON.stringify(c.tree)}`)
  while (repo.commits.some((x) => x.id === id))
  const commit: Commit = { id, message: c.message, parent: c.parent, tree: c.tree, ...(c.parent2 ? { parent2: c.parent2 } : {}), ...(c.author ? { author: c.author } : {}) }
  repo.commits.push(commit)
  return commit
}

/** Every commit reachable from `id`, through both parents of a merge. */
function ancestors(repo: Repo, id: string | null): Set<string> {
  return reachable(repo, [id])
}

function reachable(repo: Repo, ids: (string | null | undefined)[]): Set<string> {
  const byId = new Map(repo.commits.map((c) => [c.id, c]))
  const seen = new Set<string>()
  const todo = ids.filter((x): x is string => !!x)
  while (todo.length) {
    const c = byId.get(todo.pop()!)
    if (!c || seen.has(c.id)) continue
    seen.add(c.id)
    if (c.parent) todo.push(c.parent)
    if (c.parent2) todo.push(c.parent2)
  }
  return seen
}

/** Commits in the set, newest first (children always come after parents in `commits`). */
function logOrder(repo: Repo, set: Set<string>): Commit[] {
  return repo.commits.filter((c) => set.has(c.id)).reverse()
}

/** The newest commit both have: where they split. */
function mergeBase(repo: Repo, a: string | null, b: string | null): string | null {
  const mine = ancestors(repo, a)
  const byId = new Map(repo.commits.map((c) => [c.id, c]))
  const queue = b ? [b] : []
  const seen = new Set<string>()
  while (queue.length) {
    const id = queue.shift()!
    if (mine.has(id)) return id
    if (seen.has(id)) continue
    seen.add(id)
    const c = byId.get(id)
    if (c?.parent) queue.push(c.parent)
    if (c?.parent2) queue.push(c.parent2)
  }
  return null
}

/** HEAD, main, v1.0, origin/main, abc1234, HEAD~2, main^, HEAD@{1}, ORIG_HEAD. */
function resolveRev(repo: Repo, text: string): string | null {
  const m = /^(.*?)((?:[~^]\d*)*)$/.exec(text)
  if (!m) return null
  const [, base = '', suffix = ''] = m
  let id: string | null = null
  const reflogAt = /^(?:HEAD|@)@\{(\d+)\}$/.exec(base)
  if (base === 'HEAD' || base === '@') id = headId(repo)
  else if (base === 'ORIG_HEAD') id = repo.origHead
  else if (reflogAt) id = [...repo.reflog].reverse()[Number(reflogAt[1])]?.id ?? null
  else if (base in repo.branches) id = repo.branches[base] ?? null
  else if (base in repo.tags) id = repo.tags[base]!
  else if (base === 'refs/bisect/bad' || base === 'bisect/bad') id = repo.bisect?.bad ?? null
  else if (base.includes('/')) {
    const [r, ...b] = base.replace(/^remotes\//, '').split('/')
    id = repo.remotes[r!]?.branches[b.join('/')] ?? null
    if (!id && r === 'refs') {
      const [kind, ...name] = b
      id = kind === 'heads' ? (repo.branches[name.join('/')] ?? null) : kind === 'tags' ? (repo.tags[name.join('/')] ?? null) : null
    }
  } else if (/^[0-9a-f]{4,40}$/.test(base)) {
    const hits = repo.commits.filter((c) => c.id.startsWith(base.slice(0, 7)) && (base.length <= 7 || c.id === base.slice(0, 7)))
    if (hits.length === 1) id = hits[0]!.id
  }
  if (!id) return null
  for (const step of suffix.match(/[~^]\d*/g) ?? []) {
    const n = step.length > 1 ? Number(step.slice(1)) : 1
    if (step[0] === '~') {
      for (let k = 0; k < n && id; k++) id = commitById(repo, id)?.parent ?? null
    } else if (n === 0) continue
    else {
      const c: Commit | undefined = commitById(repo, id)
      id = n === 1 ? (c?.parent ?? null) : n === 2 ? (c?.parent2 ?? null) : null
    }
    if (!id) return null
  }
  return id
}

/** Branch and tag names pointing at each commit, as git log shows them. */
function decorations(repo: Repo): Map<string, string[]> {
  const d = new Map<string, string[]>()
  const add = (id: string | null | undefined, label: string) => {
    if (!id) return
    d.set(id, [...(d.get(id) ?? []), label])
  }
  if (repo.detached !== null) add(repo.detached, 'HEAD')
  else add(repo.branches[repo.branch], `HEAD -> ${repo.branch}`)
  for (const [t, id] of Object.entries(repo.tags).sort()) add(id, `tag: ${t}`)
  for (const [r, rem] of Object.entries(repo.remotes)) for (const [b, id] of Object.entries(rem.branches).sort()) add(id, `${r}/${b}`)
  for (const [b, id] of Object.entries(repo.branches).sort()) if (b !== repo.branch || repo.detached !== null) add(id, b)
  return d
}

/** Every file under the repo, path → content, skipping .git and repositories inside it. */
function workingTree(s: ShellState, root: string): Record<string, string> {
  const outT: Record<string, string> = {}
  const walk = (node: Node, rel: string, abs: string) => {
    if (node.kind === 'file') outT[rel] = node.content
    else
      for (const [name, child] of Object.entries(node.children)) {
        if (name === '.git') continue
        const at = `${abs}/${name}`
        if (child.kind === 'dir' && repoAt(s, at)) continue
        walk(child, rel ? `${rel}/${name}` : name, at)
      }
  }
  const node = lookup(s, root)
  if (node) walk(node, '', root === '/' ? '' : root)
  return outT
}

function changedFiles(a: Record<string, string>, b: Record<string, string>): string[] {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((f) => a[f] !== b[f]).sort()
}

/** Staged work, or a tracked file changed or deleted since the last commit. */
function dirty(s: ShellState, root: string, repo: Repo): boolean {
  if (Object.keys(repo.staged).length || repo.removed.length) return true
  const work = workingTree(s, root)
  const head = headTree(repo)
  return Object.keys(head).some((f) => work[f] !== head[f])
}

function dirtyFiles(g: G): string[] {
  const work = workingTree(g.s, g.root)
  const head = headTree(g.repo)
  const index = indexTree(g.repo)
  return [...new Set([...Object.keys(head), ...Object.keys(index)])].filter((f) => work[f] !== head[f] || index[f] !== head[f]).sort()
}

/** Moves the folder from one set of files to another; untracked files stay. */
function applyTree(s: ShellState, root: string, from: Record<string, string>, to: Record<string, string>): void {
  for (const f of Object.keys(from)) if (!(f in to)) removePath(s, `${root}/${f}`)
  for (const [f, content] of Object.entries(to)) {
    const cur = lookup(s, `${root}/${f}`)
    if (cur?.kind === 'file' && cur.content === content) continue
    if (!mkdirp(s, parentOf(`${root}/${f}`)[0])) continue
    writeFile(s, `${root}/${f}`, content, false)
  }
}

/** Puts the folder and the staging area back to exactly a commit's files. */
function hardReset(g: G, id: string | null): void {
  const { s, root, repo } = g
  const from = { ...headTree(repo), ...repo.staged }
  for (const f of repo.pending?.conflicts ?? []) from[f] = ''
  applyTree(s, root, from, treeOf(repo, id))
  repo.staged = {}
  repo.removed = []
}

/** A line-by-line diff: ` ` kept, `-` removed, `+` added. */
function lineDiff(a: string, b: string): string[] {
  const x = toLines(a)
  const y = toLines(b)
  const lcs: number[][] = Array.from({ length: x.length + 1 }, () => new Array<number>(y.length + 1).fill(0))
  for (let i = x.length - 1; i >= 0; i--)
    for (let j = y.length - 1; j >= 0; j--) lcs[i]![j] = x[i] === y[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!)
  const outL: string[] = []
  let i = 0
  let j = 0
  while (i < x.length || j < y.length) {
    if (i < x.length && j < y.length && x[i] === y[j]) {
      outL.push(` ${x[i]}`)
      i++
      j++
    } else if (i < x.length && (j >= y.length || lcs[i + 1]![j]! >= lcs[i]![j + 1]!)) outL.push(`-${x[i++]}`)
    else outL.push(`+${y[j++]}`)
  }
  return outL
}

/** For each line of x, the index of the same line in y (a longest common subsequence), or -1. */
function matchLines(x: string[], y: string[]): number[] {
  const n = x.length
  const m = y.length
  const L: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i]![j] = x[i] === y[j] ? L[i + 1]![j + 1]! + 1 : Math.max(L[i + 1]![j]!, L[i]![j + 1]!)
  const res = new Array<number>(n).fill(-1)
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (x[i] === y[j]) {
      res[i] = j
      i++
      j++
    } else if (L[i + 1]![j]! >= L[i]![j + 1]!) i++
    else j++
  }
  return res
}

function fileDiff(f: string, a: string | undefined, b: string | undefined): string[] {
  return [`diff --git a/${f} b/${f}`, a === undefined ? '--- /dev/null' : `--- a/${f}`, b === undefined ? '+++ /dev/null' : `+++ b/${f}`, ...lineDiff(a ?? '', b ?? '')]
}

function statLines(from: Record<string, string>, to: Record<string, string>): string[] {
  const files = changedFiles(from, to)
  if (!files.length) return []
  let ins = 0
  let del = 0
  const w = Math.max(...files.map((f) => f.length))
  const lines = files.map((f) => {
    const d = lineDiff(from[f] ?? '', to[f] ?? '')
    const a = d.filter((l) => l.startsWith('+')).length
    const r = d.filter((l) => l.startsWith('-')).length
    ins += a
    del += r
    return ` ${f.padEnd(w)} | ${a + r} ${'+'.repeat(a)}${'-'.repeat(r)}`
  })
  const parts = [plural(files.length, 'file') + ' changed']
  if (ins) parts.push(`${ins} insertion${ins === 1 ? '' : 's'}(+)`)
  if (del) parts.push(`${del} deletion${del === 1 ? '' : 's'}(-)`)
  return [...lines, ` ${parts.join(', ')}`]
}

/* ── Merging: three-way, line by line ── */

interface MergeResult {
  /** Cleanly merged files (conflicted files keep our version here). */
  tree: Record<string, string>
  /** Conflicted files as the folder shows them: with markers. */
  files: Record<string, string>
  conflicts: string[]
  kinds: Record<string, string>
}

function merge3(b: string[], o: string[], t: string[], labels: { ours: string; theirs: string }): { clean: boolean; text: string } {
  const mo = matchLines(b, o)
  const mt = matchLines(b, t)
  const outL: string[] = []
  let clean = true
  let ib = 0
  let io = 0
  let it = 0
  const same = (x: string[], y: string[]) => x.length === y.length && x.every((v, k) => v === y[k])
  const chunk = (bEnd: number, oEnd: number, tEnd: number) => {
    const bc = b.slice(ib, bEnd)
    const oc = o.slice(io, oEnd)
    const tc = t.slice(it, tEnd)
    if (same(oc, tc)) outL.push(...oc)
    else if (same(oc, bc)) outL.push(...tc)
    else if (same(tc, bc)) outL.push(...oc)
    else {
      clean = false
      outL.push(`<<<<<<< ${labels.ours}`, ...oc, '=======', ...tc, `>>>>>>> ${labels.theirs}`)
    }
  }
  for (let i = 0; i < b.length; i++) {
    const jo = mo[i]!
    const jt = mt[i]!
    if (jo < io || jt < it) continue
    chunk(i, jo, jt)
    outL.push(b[i]!)
    ib = i + 1
    io = jo + 1
    it = jt + 1
  }
  chunk(b.length, o.length, t.length)
  return { clean, text: fromLines(outL) }
}

function mergeTrees(base: Record<string, string>, ours: Record<string, string>, theirs: Record<string, string>, labels: { ours: string; theirs: string }): MergeResult {
  const r: MergeResult = { tree: {}, files: {}, conflicts: [], kinds: {} }
  for (const f of [...new Set([...Object.keys(base), ...Object.keys(ours), ...Object.keys(theirs)])].sort()) {
    const [b, o, t] = [base[f], ours[f], theirs[f]]
    const keep = (v: string | undefined) => {
      if (v !== undefined) r.tree[f] = v
    }
    if (o === t) keep(o)
    else if (o === b) keep(t)
    else if (t === b) keep(o)
    else if (o !== undefined && t !== undefined) {
      const m = merge3(toLines(b ?? ''), toLines(o), toLines(t), labels)
      if (m.clean) r.tree[f] = m.text
      else {
        r.conflicts.push(f)
        r.files[f] = m.text
        r.tree[f] = o
        r.kinds[f] = b === undefined ? 'add/add' : 'content'
      }
    } else {
      r.conflicts.push(f)
      r.files[f] = (o ?? t)!
      keep(o)
      r.kinds[f] = 'modify/delete'
    }
  }
  return r
}

function conflictLines(m: MergeResult): string[] {
  return m.conflicts.map((f) =>
    m.kinds[f] === 'modify/delete' ? `CONFLICT (modify/delete): ${f} was deleted on one side and changed on the other.` : `CONFLICT (${m.kinds[f]}): Merge conflict in ${f}`,
  )
}

/** Writes a merge that stopped: clean changes staged, conflicted files marked up in the folder. */
function writeMergeResult(g: G, ours: Record<string, string>, m: MergeResult): void {
  const { s, root, repo } = g
  applyTree(s, root, ours, { ...m.tree, ...m.files })
  repo.staged = {}
  repo.removed = []
  for (const [f, v] of Object.entries(m.tree)) if (ours[f] !== v) repo.staged[f] = v
  for (const f of Object.keys(ours)) if (!(f in m.tree) && !(f in m.files)) repo.removed.push(f)
}

/**
 * Replays one commit on top of HEAD (cherry-pick, rebase) or undoes it
 * (revert). Stops with markers in the folder when it conflicts.
 */
function replay(g: G, c: Commit, mode: 'pick' | 'revert'): { done: Commit | null; empty?: boolean; conflict?: MergeResult } {
  const { s, root, repo } = g
  const parentTree = treeOf(repo, c.parent)
  const ours = headTree(repo)
  const label = `${c.id} (${firstLine(c.message)})`
  const m = mode === 'pick' ? mergeTrees(parentTree, ours, c.tree, { ours: 'HEAD', theirs: label }) : mergeTrees(c.tree, ours, parentTree, { ours: 'HEAD', theirs: `parent of ${label}` })
  if (m.conflicts.length) {
    writeMergeResult(g, ours, m)
    return { done: null, conflict: m }
  }
  if (!changedFiles(ours, m.tree).length) return { done: null, empty: true }
  const message = mode === 'pick' ? c.message : `Revert "${firstLine(c.message)}"\n\nThis reverts commit ${c.id}.`
  const commit = makeCommit(repo, { message, parent: headId(repo), tree: m.tree, author: mode === 'pick' ? (c.author ?? authorName(g)) : authorName(g) })
  applyTree(s, root, ours, m.tree)
  repo.staged = {}
  repo.removed = []
  moveHead(repo, commit.id, `${mode === 'pick' ? (repo.pending?.kind === 'rebase' ? 'rebase (pick)' : 'cherry-pick') : 'revert'}: ${firstLine(message)}`)
  return { done: commit }
}

/* ── .gitignore ── */

interface IgnoreRule {
  pattern: string
  neg: boolean
  dirOnly: boolean
  anchored: boolean
  re: RegExp
  line: number
}

function ignoreRules(s: ShellState, root: string): IgnoreRule[] {
  const node = lookup(s, `${root}/.gitignore`)
  if (node?.kind !== 'file') return []
  const rules: IgnoreRule[] = []
  toLines(node.content).forEach((raw, i) => {
    const t = raw.trim()
    if (!t || t.startsWith('#')) return
    const neg = t.startsWith('!')
    let p = neg ? t.slice(1) : t
    const dirOnly = p.endsWith('/')
    p = p.replace(/\/+$/, '')
    const anchored = p.includes('/')
    p = p.replace(/^\//, '')
    let re = ''
    for (let k = 0; k < p.length; k++) {
      if (p.startsWith('**/', k)) {
        re += '(?:.*/)?'
        k += 2
      } else if (p.startsWith('/**', k) && k + 3 === p.length) {
        re += '(?:/.*)?'
        k += 2
      } else if (p[k] === '*') re += p[k + 1] === '*' ? '.*' : '[^/]*'
      else if (p[k] === '?') re += '[^/]'
      else re += p[k]!.replace(/[.+^${}()|[\]\\]/g, '\\$&')
      if (p[k] === '*' && p[k + 1] === '*') k++
    }
    rules.push({ pattern: t, neg, dirOnly, anchored, re: new RegExp(`^${re}$`), line: i + 1 })
  })
  return rules
}

/** The rule that ignores a path, if one does. A file inside an ignored folder is ignored. */
function ignoredBy(rules: IgnoreRule[], rel: string, isDir: boolean): IgnoreRule | null {
  if (!rules.length) return null
  const segs = rel.split('/')
  for (let k = 1; k <= segs.length; k++) {
    const path = segs.slice(0, k).join('/')
    const dir = k < segs.length || isDir
    let hit: IgnoreRule | null = null
    for (const r of rules) {
      if (r.dirOnly && !dir) continue
      if (r.re.test(r.anchored ? path : segs[k - 1]!)) hit = r.neg ? null : r
    }
    if (hit && k < segs.length) return hit
    if (k === segs.length) return hit
  }
  return null
}

/* ── Status ── */

interface StatusInfo {
  staged: { f: string; kind: 'new file' | 'modified' | 'deleted' }[]
  unmerged: string[]
  changed: { f: string; kind: 'modified' | 'deleted' }[]
  untracked: string[]
  ignored: string[]
}

function statusOf(g: G): StatusInfo {
  const { s, root, repo } = g
  const work = workingTree(s, root)
  const head = headTree(repo)
  const index = indexTree(repo)
  const conflicts = new Set(repo.pending?.conflicts ?? [])
  const rules = ignoreRules(s, root)
  const staged: StatusInfo['staged'] = [
    ...Object.keys(repo.staged)
      .filter((f) => !conflicts.has(f))
      .map((f) => ({ f, kind: f in head ? ('modified' as const) : ('new file' as const) })),
    ...repo.removed.filter((f) => !conflicts.has(f)).map((f) => ({ f, kind: 'deleted' as const })),
  ].sort((a, b) => (a.f < b.f ? -1 : 1))
  const changed = Object.keys(index)
    .filter((f) => !conflicts.has(f) && work[f] !== index[f])
    .sort()
    .map((f) => ({ f, kind: f in work ? ('modified' as const) : ('deleted' as const) }))
  const loose = Object.keys(work)
    .filter((f) => !(f in index) && !conflicts.has(f))
    .sort()
  return {
    staged,
    unmerged: [...conflicts].sort(),
    changed,
    untracked: loose.filter((f) => !ignoredBy(rules, f, false)),
    ignored: loose.filter((f) => ignoredBy(rules, f, false)),
  }
}

function trackingLines(repo: Repo): string[] {
  if (repo.detached !== null) return []
  const up = repo.upstream[repo.branch]
  if (!up) return []
  const upId = resolveRev(repo, up)
  if (!upId) return [`Your branch is based on '${up}', but the upstream is gone.`]
  const me = headId(repo)
  const a = ancestors(repo, me)
  const b = ancestors(repo, upId)
  const ahead = [...a].filter((x) => !b.has(x)).length
  const behind = [...b].filter((x) => !a.has(x)).length
  if (!ahead && !behind) return [`Your branch is up to date with '${up}'.`]
  if (ahead && !behind) return [`Your branch is ahead of '${up}' by ${plural(ahead, 'commit')}.`, '  (use "git push" to publish your local commits)']
  if (!ahead) return [`Your branch is behind '${up}' by ${plural(behind, 'commit')}, and can be fast-forwarded.`, '  (use "git pull" to update your local branch)']
  return [`Your branch and '${up}' have diverged,`, `and have ${ahead} and ${behind} different commits each, respectively.`, '  (use "git pull" if you want to integrate the remote branch with yours)']
}

function statusText(g: G, showIgnored: boolean): string {
  const { repo } = g
  const st = statusOf(g)
  const lines = [repo.detached !== null ? `HEAD detached at ${repo.detached}` : `On branch ${repo.branch}`, ...trackingLines(repo)]
  const p = repo.pending
  if (p?.kind === 'merge')
    lines.push(
      ...(st.unmerged.length
        ? ['You have unmerged paths.', '  (fix conflicts and run "git commit")', '  (use "git merge --abort" to abort the merge)']
        : ['All conflicts fixed but you are still merging.', '  (use "git commit" to conclude merge)']),
    )
  else if (p?.kind === 'rebase')
    lines.push(
      `You are currently rebasing branch '${p.branch}' on '${headId(repo)}'.`,
      st.unmerged.length ? '  (fix conflicts and then run "git rebase --continue")' : '  (all conflicts fixed: run "git rebase --continue")',
      '  (use "git rebase --abort" to check out the original branch)',
    )
  else if (p)
    lines.push(
      `You are currently ${p.kind === 'revert' ? 'reverting' : 'cherry-picking'} commit ${p.current ?? ''}.`,
      st.unmerged.length ? `  (fix conflicts and run "git ${p.kind} --continue")` : `  (all conflicts fixed: run "git ${p.kind} --continue")`,
      `  (use "git ${p.kind} --abort" to cancel the ${p.kind} operation)`,
    )
  if (repo.bisect) lines.push(`You are currently bisecting, started from branch '${repo.bisect.origBranch ?? repo.bisect.origId}'.`, '  (use "git bisect reset" to get back to the original branch)')
  if (!repo.commits.length) lines.push('', 'No commits yet')
  if (st.staged.length) lines.push('', 'Changes to be committed:', ...st.staged.map(({ f, kind }) => `        ${`${kind}:`.padEnd(12)}${f}`))
  if (st.unmerged.length) lines.push('', 'Unmerged paths:', '  (use "git add <file>..." to mark resolution)', ...st.unmerged.map((f) => `        both modified:   ${f}`))
  if (st.changed.length) lines.push('', 'Changes not staged for commit:', ...st.changed.map(({ f, kind }) => `        ${`${kind}:`.padEnd(12)}${f}`))
  if (st.untracked.length) lines.push('', 'Untracked files:', ...st.untracked.map((f) => `        ${f}`))
  if (showIgnored && st.ignored.length) lines.push('', 'Ignored files:', ...st.ignored.map((f) => `        ${f}`))
  if (!st.staged.length && !st.unmerged.length && !st.changed.length && !st.untracked.length) lines.push('', 'nothing to commit, working tree clean')
  return lines.join('\n')
}

/* ── Subcommands ── */

type GitFn = (g: G, args: string[]) => Res

function gitInit(s: ShellState, args: string[]): Res {
  const bare = args.includes('--bare')
  const name = args.find((a) => !a.startsWith('-'))
  const dir = name ? resolve(s.cwd, name) : s.cwd
  if (!mkdirp(s, dir)) return bad(`fatal: cannot mkdir ${name}: Not a directory`, 128)
  if (bare) {
    if (s.repos[dir]?.bare) return ok(`Reinitialized existing Git repository in ${dir}/`)
    s.repos[dir] = newRepo(true)
    return ok(`Initialized empty Git repository in ${dir}/`)
  }
  if (s.repos[dir] && lookup(s, `${dir}/.git`)) return ok(`Reinitialized existing Git repository in ${dir}/.git/`)
  mkdirp(s, `${dir}/.git`)
  s.repos[dir] = newRepo()
  return ok(`Initialized empty Git repository in ${dir}/.git/`)
}

const isNetworkUrl = (u: string) => /^[a-z]+:\/\//.test(u) || /^[\w.-]+@[\w.-]+:/.test(u)
const noNetwork = (u: string) =>
  bad(`fatal: unable to access '${u}': the practice terminal has no network — use a folder on this pretend computer as the remote (for example ~/server/app.git)`, 128)

function remoteRepo(s: ShellState, url: string): Repo | Res {
  if (isNetworkUrl(url)) return noNetwork(url)
  const r = repoAt(s, url)
  if (!r) return bad(`fatal: '${pretty(url)}' does not appear to be a git repository\nfatal: Could not read from remote repository.`, 128)
  return r
}

/** Copies every commit reachable from `tips` that `to` does not have yet, parents first. */
function copyCommits(from: Repo, to: Repo, tips: (string | null | undefined)[]): void {
  const want = reachable(from, tips)
  const have = new Set(to.commits.map((c) => c.id))
  for (const c of from.commits) if (want.has(c.id) && !have.has(c.id)) to.commits.push(clone(c))
}

function gitClone(s: ShellState, args: string[]): Res {
  const pos = args.filter((a) => !a.startsWith('-'))
  const [src, dirArg] = pos
  if (!src) return bad('fatal: You must specify a repository to clone.', 128)
  if (isNetworkUrl(src)) return noNetwork(src)
  const srcAbs = resolve(s.cwd, src)
  const from = repoAt(s, srcAbs)
  if (!from) return bad(`fatal: repository '${src}' does not exist`, 128)
  const name = dirArg ?? baseName(srcAbs).replace(/\.git$/, '')
  const dest = resolve(s.cwd, name)
  const existing = lookup(s, dest)
  if (existing && (existing.kind === 'file' || Object.keys(existing.children).length)) return bad(`fatal: destination path '${name}' already exists and is not an empty directory.`, 128)
  mkdirp(s, `${dest}/.git`)
  const repo = newRepo()
  repo.commits = clone(from.commits)
  const branches: Record<string, string> = {}
  for (const [b, id] of Object.entries(from.branches)) if (id) branches[b] = id
  repo.remotes = { origin: { url: srcAbs, branches } }
  repo.tags = { ...from.tags }
  repo.tagNotes = { ...from.tagNotes }
  const head = branches[from.branch] ? from.branch : (Object.keys(branches)[0] ?? 'main')
  repo.branch = head
  repo.branches = { [head]: branches[head] ?? null }
  repo.upstream[head] = `origin/${head}`
  s.repos[dest] = repo
  applyTree(s, dest, {}, treeOf(repo, branches[head]))
  if (branches[head]) repo.reflog.push({ id: branches[head]!, msg: `clone: from ${srcAbs}` })
  return ok(`Cloning into '${name}'...${Object.keys(branches).length ? '\ndone.' : '\nwarning: You appear to have cloned an empty repository.'}`)
}

function gitConfig(s: ShellState, repo: Repo | null, args: string[]): Res {
  const rest = args.filter((a) => a !== '--global' && a !== '--local')
  if (rest[0] === '--list' || rest[0] === '-l')
    return ok(
      Object.entries({ ...s.gitConfig, ...(repo?.config ?? {}) })
        .map(([k, v]) => `${k}=${v}`)
        .join('\n'),
    )
  const store = repo ? repo.config : s.gitConfig
  if (rest[0] === '--unset') {
    delete store[(rest[1] ?? '').toLowerCase()]
    return ok()
  }
  const [rawKey, value] = rest
  if (!rawKey || !rawKey.includes('.')) return bad('usage: git config [--global] <section.key> [<value>]   e.g. git config user.name "Ada"', 129)
  const key = rawKey.toLowerCase()
  if (value === undefined) {
    const v = repo?.config[key] ?? s.gitConfig[key]
    return v === undefined ? { code: 1, chunks: [] } : ok(v)
  }
  store[key] = value
  return ok()
}

const gitStatus: GitFn = (g, args) => {
  if (args.includes('-s') || args.includes('--short')) {
    const st = statusOf(g)
    const codes = new Map<string, [string, string]>()
    const set = (f: string, x: string | null, y: string | null) => {
      const cur = codes.get(f) ?? [' ', ' ']
      codes.set(f, [x ?? cur[0], y ?? cur[1]])
    }
    for (const { f, kind } of st.staged) set(f, kind === 'new file' ? 'A' : kind === 'deleted' ? 'D' : 'M', null)
    for (const { f, kind } of st.changed) set(f, null, kind === 'deleted' ? 'D' : 'M')
    for (const f of st.unmerged) set(f, 'U', 'U')
    for (const f of st.untracked) set(f, '?', '?')
    return ok(
      [...codes.entries()]
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([f, [x, y]]) => `${x}${y} ${f}`)
        .join('\n'),
    )
  }
  return ok(statusText(g, args.includes('--ignored')))
}

const gitAdd: GitFn = (g, args) => {
  const { s, root, repo } = g
  const force = args.includes('-f') || args.includes('--force')
  const onlyTracked = args.includes('-u') || args.includes('--update')
  const paths = args.filter((a) => !['-f', '--force', '-u', '--update', '-v'].includes(a))
  if (!paths.length && !onlyTracked) return bad('Nothing specified, nothing added.\nhint: Maybe you wanted to say \'git add .\'?')
  const work = workingTree(s, root)
  const head = headTree(repo)
  const index = indexTree(repo)
  const rules = ignoreRules(s, root)
  const ignoredHits: string[] = []
  for (const a of paths.length ? paths : ['.']) {
    const all = a === '.' || a === '-A' || a === '--all'
    const prefix = all ? g.rel('.') : g.rel(a)
    const under = (f: string) => !prefix || f === prefix || f.startsWith(`${prefix}/`)
    const explicit = !all && prefix in work
    let hits = Object.keys(work).filter(under)
    hits = hits.filter((f) => {
      if (f in index) return true
      if (onlyTracked) return false
      if (ignoredBy(rules, f, false) && !force) {
        if (explicit || f === prefix) ignoredHits.push(a)
        return false
      }
      return true
    })
    const gone = Object.keys(index).filter((f) => under(f) && !(f in work))
    if (!hits.length && !gone.length) {
      if (ignoredHits.length) continue
      if (!(all || Object.keys(index).some(under))) return bad(`fatal: pathspec '${a}' did not match any files`, 128)
    }
    for (const f of hits) {
      if (head[f] === work[f]) delete repo.staged[f]
      else repo.staged[f] = work[f]!
      repo.removed = repo.removed.filter((x) => x !== f)
    }
    for (const f of gone) {
      delete repo.staged[f]
      if (f in head && !repo.removed.includes(f)) repo.removed.push(f)
    }
  }
  if (repo.pending) repo.pending.conflicts = repo.pending.conflicts.filter((f) => !paths.some((a) => a === '.' || a === '-A' || a === '--all' || g.rel(a) === f || f.startsWith(`${g.rel(a)}/`)))
  if (ignoredHits.length) return bad(`The following paths are ignored by one of your .gitignore files:\n${ignoredHits.join('\n')}\nhint: Use -f if you really want to add them.`)
  return ok()
}

const gitRm: GitFn = (g, args) => {
  const { s, root, repo } = g
  const cached = args.includes('--cached')
  const recursive = args.includes('-r')
  const paths = args.filter((a) => !a.startsWith('-'))
  if (!paths.length) return bad('usage: git rm [--cached] [-r] <file>…', 129)
  const index = indexTree(repo)
  const head = headTree(repo)
  const said: string[] = []
  for (const a of paths) {
    const p = g.rel(a)
    const hits = Object.keys(index).filter((f) => f === p || f.startsWith(`${p}/`))
    if (!hits.length) return bad(`fatal: pathspec '${a}' did not match any files`, 128)
    if (!recursive && !(p in index)) return bad(`fatal: not removing '${a}' recursively without -r`, 128)
    for (const f of hits) {
      delete repo.staged[f]
      if (f in head && !repo.removed.includes(f)) repo.removed.push(f)
      if (!cached) removePath(s, `${root}/${f}`)
      said.push(`rm '${f}'`)
    }
  }
  return ok(said.join('\n'))
}

function nothingToCommit(g: G): Res {
  const st = statusOf(g)
  const head = `On branch ${g.repo.branch}`
  if (st.changed.length) return bad(`${head}\nno changes added to commit (use "git add" and/or "git commit -a")`)
  if (st.untracked.length) return bad(`${head}\nnothing added to commit but untracked files present (use "git add" to track)`)
  return bad(g.repo.commits.length ? `${head}\nnothing to commit, working tree clean` : `${head}\nnothing to commit (create/copy files and use "git add" to track)`)
}

const gitCommit: GitFn = (g, args) => {
  const { s, root, repo } = g
  const messages: string[] = []
  let all = false
  let amend = false
  let allowEmpty = false
  let author: string | undefined
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!
    if (a === '-m' || a === '--message' || a === '-am' || a === '-ma') {
      if (a !== '-m' && a !== '--message') all = true
      const m = args[++k]
      if (m === undefined) return bad("error: switch `m' requires a value", 129)
      messages.push(m)
    } else if (/^-m.+/.test(a)) messages.push(a.slice(2))
    else if (a.startsWith('--message=')) messages.push(a.slice(10))
    else if (a === '-a' || a === '--all') all = true
    else if (a === '--amend') amend = true
    else if (a === '--no-edit' || a === '-q' || a === '-v') continue
    else if (a === '--allow-empty') allowEmpty = true
    else if (a.startsWith('--author=')) author = a.slice(9).replace(/\s*<.*$/, '')
    else if (a === '--author') author = (args[++k] ?? '').replace(/\s*<.*$/, '')
    else if (a.startsWith('-')) return bad(`error: unknown option \`${a.replace(/^-+/, '')}'`, 129)
    else return bad(`error: the practice terminal commits what you have staged — run git add ${a} first, then git commit -m "…"`)
  }
  if (all) {
    const work = workingTree(s, root)
    const head = headTree(repo)
    for (const f of Object.keys(indexTree(repo))) {
      if (!(f in work)) {
        delete repo.staged[f]
        if (f in head && !repo.removed.includes(f)) repo.removed.push(f)
      } else if (work[f] !== head[f]) repo.staged[f] = work[f]!
      else delete repo.staged[f]
    }
  }
  const pending = repo.pending
  if (pending?.conflicts.length)
    return bad(
      "error: Committing is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use 'git add <file>'\nhint: as appropriate to mark resolution and make a commit.\nfatal: Exiting because of an unresolved conflict.",
      128,
    )
  let message: string | null = messages.length ? messages.join('\n\n') : null
  const label = () => (repo.detached !== null ? 'detached HEAD' : repo.branch)
  if (amend) {
    const head = commitById(repo, headId(repo))
    if (!head) return bad('fatal: You have nothing to amend.', 128)
    message ??= head.message
    const tree = indexTree(repo)
    const c = makeCommit(repo, { message, parent: head.parent, parent2: head.parent2 ?? null, tree, author: author ?? head.author ?? authorName(g) })
    moveHead(repo, c.id, `commit (amend): ${firstLine(message)}`)
    repo.staged = {}
    repo.removed = []
    const n = changedFiles(treeOf(repo, head.parent), tree).length
    return ok(`[${label()} ${c.id}] ${firstLine(message)}\n ${plural(n, 'file')} changed`)
  }
  if (!message) {
    if (pending?.kind === 'merge' || pending?.current) message = pending.message
    else return bad('Aborting commit: write the message with -m "what changed"')
  }
  const nothing = !Object.keys(repo.staged).length && !repo.removed.length
  if (nothing && !pending && !allowEmpty) return nothingToCommit(g)
  if (nothing && pending && pending.kind !== 'merge') {
    // Resolved to exactly what HEAD already had: nothing to record.
    pending.current = null
    if (pending.kind !== 'rebase' && !pending.todo.length) repo.pending = null
    return bad('The previous change is now empty (the resolution kept HEAD as it was), so there is nothing to commit.')
  }
  const parent = headId(repo)
  const tree = indexTree(repo)
  const merging = pending?.kind === 'merge'
  const c = makeCommit(repo, {
    message,
    parent,
    parent2: merging ? (pending.theirs ?? null) : null,
    tree,
    author: author ?? (pending && !merging ? pending.author : undefined) ?? authorName(g),
  })
  moveHead(repo, c.id, `${parent === null ? 'commit (initial)' : merging ? 'commit (merge)' : 'commit'}: ${firstLine(message)}`)
  repo.staged = {}
  repo.removed = []
  if (pending) {
    if (merging) repo.pending = null
    else {
      pending.current = null
      if (pending.kind !== 'rebase' && !pending.todo.length) repo.pending = null
    }
  }
  const n = changedFiles(treeOf(repo, parent), tree).length
  return ok(`[${label()} ${c.id}] ${firstLine(message)}\n ${plural(n, 'file')} changed`)
}

/** Draws the history as git log --graph does: one column per line of work. */
function graphRows(commits: Commit[], render: (c: Commit) => string[]): string[] {
  const shown = new Set(commits.map((c) => c.id))
  const rows: string[] = []
  let cols: string[] = []
  for (const c of commits) {
    let i = cols.indexOf(c.id)
    if (i < 0) {
      cols.push(c.id)
      i = cols.length - 1
    }
    const parents = [c.parent, c.parent2].filter((p): p is string => !!p && shown.has(p))
    const next = [...cols]
    let opened = false
    if (!parents.length) next.splice(i, 1)
    else {
      next[i] = parents[0]!
      if (parents[1] && !next.includes(parents[1])) {
        next.splice(i + 1, 0, parents[1])
        opened = true
      }
    }
    const width = Math.max(cols.length, next.length) * 2
    const lines = render(c)
    rows.push(cols.map((_, j) => (j === i ? '*' : '|')).join(' ').padEnd(width) + lines[0])
    const cont = next.length ? next.map(() => '|').join(' ') : ''
    for (const l of lines.slice(1)) rows.push(`${cont.padEnd(width)}${l}`.trimEnd())
    if (opened) {
      const chars = new Array<string>(next.length * 2).fill(' ')
      for (let j = 0; j <= i; j++) chars[2 * j] = '|'
      chars[2 * i + 1] = '\\'
      for (let j = i + 1; j < cols.length; j++) chars[2 * j + 1] = '\\'
      rows.push(chars.join('').trimEnd())
    } else if (!parents.length && i < cols.length - 1) {
      const chars = new Array<string>(cols.length * 2).fill(' ')
      for (let j = 0; j < i; j++) chars[2 * j] = '|'
      for (let j = i + 1; j < cols.length; j++) chars[2 * j - 1] = '/'
      rows.push(chars.join('').trimEnd())
    }
    for (;;) {
      const k = next.findIndex((id, j) => next.indexOf(id) < j)
      if (k < 0) break
      const chars = new Array<string>(next.length * 2).fill(' ')
      for (let j = 0; j < k; j++) chars[2 * j] = '|'
      for (let j = k; j < next.length; j++) chars[2 * j - 1] = '/'
      rows.push(chars.join('').trimEnd())
      next.splice(k, 1)
    }
    cols = next
  }
  return rows
}

function logEntry(_repo: Repo, c: Commit, oneline: boolean, deco: Map<string, string[]>): string[] {
  const d = deco.get(c.id)
  const tag = d ? ` (${d.join(', ')})` : ''
  if (oneline) return [`${c.id}${tag} ${firstLine(c.message)}`]
  return [
    `commit ${c.id}${tag}`,
    ...(c.parent2 ? [`Merge: ${c.parent} ${c.parent2}`] : []),
    `Author: ${c.author ?? 'you'}`,
    '',
    ...c.message.split('\n').map((l) => (l ? `    ${l}` : '')),
    '',
  ]
}

/** Revisions, A..B ranges and paths, as log and friends take them. */
function revArgs(g: G, args: string[]): { include: string[]; exclude: string[]; paths: string[] } | Res {
  const { repo } = g
  const include: string[] = []
  const exclude: string[] = []
  const paths: string[] = []
  let dashdash = false
  for (const a of args) {
    if (a === '--') {
      dashdash = true
      continue
    }
    if (dashdash) {
      paths.push(g.rel(a))
      continue
    }
    const range = /^(.*?)\.\.(.*)$/.exec(a)
    if (range) {
      const x = resolveRev(repo, range[1] || 'HEAD')
      const y = resolveRev(repo, range[2] || 'HEAD')
      if (!x || !y) return bad(`fatal: ambiguous argument '${a}': unknown revision or path not in the working tree.`, 128)
      exclude.push(x)
      include.push(y)
      continue
    }
    const id = resolveRev(repo, a)
    if (id) include.push(id)
    else if (lookup(g.s, resolve(g.s.cwd, a)) || Object.keys(indexTree(repo)).some((f) => f === g.rel(a) || f.startsWith(`${g.rel(a)}/`))) paths.push(g.rel(a))
    else return bad(`fatal: ambiguous argument '${a}': unknown revision or path not in the working tree.`, 128)
  }
  return { include, exclude, paths }
}

const gitLog: GitFn = (g, args) => {
  const { repo } = g
  let oneline = false
  let graph = false
  let all = false
  let limit = Infinity
  const rest: string[] = []
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!
    if (a === '--oneline') oneline = true
    else if (a === '--graph') graph = true
    else if (a === '--all') all = true
    else if (a === '--decorate' || a === '--no-decorate' || a === '--abbrev-commit') continue
    else if (a === '-n' || a === '--max-count') limit = Number(args[++k])
    else if (/^-\d+$/.test(a)) limit = Number(a.slice(1))
    else if (a.startsWith('--max-count=')) limit = Number(a.slice(12))
    else if (a.startsWith('-') && a !== '--') return bad(`fatal: unrecognized argument: ${a}`, 128)
    else rest.push(a)
  }
  const r = revArgs(g, rest)
  if (isRes(r)) return r
  const starts = [...r.include]
  if (all) starts.push(headId(repo)!, ...Object.values(repo.branches).map(String), ...Object.values(repo.tags), ...Object.values(repo.remotes).flatMap((x) => Object.values(x.branches)))
  if (!starts.length) {
    if (!headId(repo)) return bad(`fatal: your current branch '${repo.branch}' does not have any commits yet`, 128)
    starts.push(headId(repo)!)
  }
  const drop = reachable(repo, r.exclude)
  const set = new Set([...reachable(repo, starts)].filter((id) => !drop.has(id)))
  let commits = logOrder(repo, set)
  if (r.paths.length) {
    const hit = (f: string) => r.paths.some((p) => !p || f === p || f.startsWith(`${p}/`))
    commits = commits.filter((c) => changedFiles(treeOf(repo, c.parent), c.tree).some(hit))
  }
  if (Number.isFinite(limit)) commits = commits.slice(0, limit)
  const deco = decorations(repo)
  const lines = graph ? graphRows(commits, (c) => logEntry(repo, c, oneline, deco)) : commits.flatMap((c) => logEntry(repo, c, oneline, deco))
  return ok(lines.join('\n').replace(/\n+$/, ''))
}

const gitShow: GitFn = (g, args) => {
  const { repo } = g
  const nameOnly = args.includes('--name-only')
  const stat = args.includes('--stat')
  const what = args.find((a) => !a.startsWith('-')) ?? 'HEAD'
  const colon = what.indexOf(':')
  if (colon >= 0) {
    const rev = what.slice(0, colon) || 'HEAD'
    let path = what.slice(colon + 1)
    if (path.startsWith('./')) path = g.rel(path)
    const id = resolveRev(repo, rev)
    if (!id) return bad(`fatal: invalid object name '${rev}'.`, 128)
    const content = treeOf(repo, id)[path]
    if (content === undefined) return bad(`fatal: path '${path}' does not exist in '${rev}'`, 128)
    return out(content)
  }
  const id = resolveRev(repo, what)
  const c = commitById(repo, id)
  if (!c) return bad(`fatal: ambiguous argument '${what}': unknown revision or path not in the working tree.`, 128)
  const lines: string[] = []
  if (what in repo.tagNotes) lines.push(`tag ${what}`, `Tagger: ${authorName(g)}`, '', repo.tagNotes[what]!, '')
  lines.push(...logEntry(repo, c, false, decorations(repo)))
  const before = treeOf(repo, c.parent)
  if (c.parent2) return ok(lines.join('\n').replace(/\n+$/, ''))
  if (nameOnly) lines.push(...changedFiles(before, c.tree))
  else if (stat) lines.push(...statLines(before, c.tree))
  else for (const f of changedFiles(before, c.tree)) lines.push(...fileDiff(f, before[f], c.tree[f]))
  return ok(lines.join('\n').replace(/\n+$/, ''))
}

const gitDiff: GitFn = (g, args) => {
  const { s, root, repo } = g
  const staged = args.includes('--staged') || args.includes('--cached')
  const nameOnly = args.includes('--name-only')
  const stat = args.includes('--stat')
  const r = revArgs(
    g,
    args.filter((a) => !a.startsWith('--') || a === '--'),
  )
  if (isRes(r)) return r
  const revs = [...r.exclude, ...r.include]
  const index = indexTree(repo)
  let from: Record<string, string>
  let to: Record<string, string>
  if (revs.length >= 2) {
    from = treeOf(repo, revs[0])
    to = treeOf(repo, revs[1])
  } else if (revs.length === 1) {
    from = treeOf(repo, revs[0])
    if (staged) to = index
    else {
      const work = workingTree(s, root)
      to = {}
      for (const f of new Set([...Object.keys(from), ...Object.keys(index)])) if (f in work) to[f] = work[f]!
    }
  } else if (staged) {
    from = headTree(repo)
    to = index
  } else {
    from = index
    const work = workingTree(s, root)
    to = {}
    for (const f of Object.keys(index)) if (f in work) to[f] = work[f]!
    for (const f of repo.pending?.conflicts ?? []) if (f in work) to[f] = work[f]!
  }
  const hit = (f: string) => !r.paths.length || r.paths.some((p) => !p || f === p || f.startsWith(`${p}/`))
  const files = changedFiles(from, to).filter(hit)
  if (nameOnly) return ok(files.join('\n'))
  if (stat)
    return ok(
      statLines(
        Object.fromEntries(files.filter((f) => f in from).map((f) => [f, from[f]!])),
        Object.fromEntries(files.filter((f) => f in to).map((f) => [f, to[f]!])),
      ).join('\n'),
    )
  return ok(files.flatMap((f) => fileDiff(f, from[f], to[f])).join('\n'))
}

const gitRestore: GitFn = (g, args) => {
  const { s, root, repo } = g
  let staged = false
  let worktree = false
  let source: string | null = null
  const paths: string[] = []
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!
    if (a === '--staged' || a === '-S') staged = true
    else if (a === '--worktree' || a === '-W') worktree = true
    else if (a === '-s' || a === '--source') source = args[++k] ?? ''
    else if (a.startsWith('--source=')) source = a.slice(9)
    else if (a !== '--') paths.push(a)
  }
  if (!paths.length) return bad('fatal: you must specify path(s) to restore', 128)
  const srcId = source !== null ? resolveRev(repo, source) : null
  if (source !== null && !srcId) return bad(`fatal: could not resolve ${source}`, 128)
  const head = headTree(repo)
  const index = indexTree(repo)
  const from = srcId ? treeOf(repo, srcId) : null
  for (const a of paths) {
    const p = a === '.' ? g.rel('.') : g.rel(a)
    const known = new Set([...Object.keys(head), ...Object.keys(index), ...Object.keys(from ?? {})])
    const files = [...known].filter((f) => !p || f === p || f.startsWith(`${p}/`))
    if (!files.length) return bad(`error: pathspec '${a}' did not match any file(s) known to git`)
    for (const f of files) {
      if (staged) {
        const want = from ? from[f] : head[f]
        if (want === undefined) {
          delete repo.staged[f]
          if (f in head && !repo.removed.includes(f)) repo.removed.push(f)
        } else {
          repo.removed = repo.removed.filter((x) => x !== f)
          if (want === head[f]) delete repo.staged[f]
          else repo.staged[f] = want
        }
      }
      if (!staged || worktree) {
        const want = from ? from[f] : index[f]
        if (want === undefined) {
          if (from) removePath(s, `${root}/${f}`)
          continue
        }
        mkdirp(s, parentOf(`${root}/${f}`)[0])
        const err = writeFile(s, `${root}/${f}`, want, false)
        if (err) return bad(err)
      }
    }
    if (repo.pending) repo.pending.conflicts = repo.pending.conflicts.filter((f) => !files.includes(f))
  }
  return ok()
}

const gitReset: GitFn = (g, args) => {
  const { repo } = g
  let mode: 'soft' | 'mixed' | 'hard' = 'mixed'
  let target: string | null = null
  const paths: string[] = []
  let dashdash = false
  for (const a of args) {
    if (a === '--soft' || a === '--mixed' || a === '--hard') mode = a.slice(2) as 'soft' | 'mixed' | 'hard'
    else if (a === '--') dashdash = true
    else if (a === '-q') continue
    else if (a.startsWith('-')) return bad(`error: unknown option \`${a.replace(/^-+/, '')}'`, 129)
    else if (!dashdash && target === null && resolveRev(repo, a)) target = a
    else paths.push(a)
  }
  if (paths.length) {
    if (mode !== 'mixed') return bad(`fatal: Cannot do ${mode} reset with paths.`, 128)
    const from = target ? treeOf(repo, resolveRev(repo, target)) : headTree(repo)
    const head = headTree(repo)
    for (const a of paths) {
      const p = g.rel(a)
      const files = [...new Set([...Object.keys(repo.staged), ...repo.removed])].filter((f) => f === p || f.startsWith(`${p}/`))
      for (const f of files) {
        repo.removed = repo.removed.filter((x) => x !== f)
        if (from[f] === head[f]) delete repo.staged[f]
        else if (from[f] !== undefined) repo.staged[f] = from[f]!
        else delete repo.staged[f]
      }
      if (repo.pending) repo.pending.conflicts = repo.pending.conflicts.filter((f) => f !== p)
    }
    return ok()
  }
  const id = resolveRev(repo, target ?? 'HEAD')
  if (!id) {
    if (!headId(repo)) return bad("fatal: ambiguous argument 'HEAD': unknown revision — there are no commits yet", 128)
    return bad(`fatal: ambiguous argument '${target}': unknown revision or path not in the working tree.`, 128)
  }
  const before = headId(repo)
  const oldIndex = indexTree(repo)
  const newTree = treeOf(repo, id)
  repo.origHead = before
  if (mode === 'hard') {
    hardReset(g, id)
    repo.pending = null
  } else if (mode === 'mixed') {
    repo.staged = {}
    repo.removed = []
    if (repo.pending) repo.pending = null
  } else {
    repo.staged = {}
    repo.removed = []
    for (const [f, v] of Object.entries(oldIndex)) if (newTree[f] !== v) repo.staged[f] = v
    for (const f of Object.keys(newTree)) if (!(f in oldIndex)) repo.removed.push(f)
  }
  moveHead(repo, id, `reset: moving to ${target ?? 'HEAD'}`)
  if (mode === 'hard') return ok(`HEAD is now at ${id} ${subjectOf(repo, id)}`)
  if (mode === 'mixed') {
    const st = statusOf(g)
    return st.changed.length ? ok(`Unstaged changes after reset:\n${st.changed.map(({ f, kind }) => `${kind === 'deleted' ? 'D' : 'M'}\t${f}`).join('\n')}`) : ok()
  }
  return ok()
}

const gitBranch: GitFn = (g, args) => {
  const { repo } = g
  const flagSet = new Set(args.filter((a) => a.startsWith('-')))
  const names = args.filter((a) => !a.startsWith('-'))
  const up = args.find((a) => a.startsWith('--set-upstream-to='))?.slice(18) ?? (flagSet.has('-u') ? names.shift() : undefined)
  if (up !== undefined) {
    const b = names[0] ?? repo.branch
    if (!resolveRev(repo, up) || !up.includes('/')) return bad(`error: the requested upstream branch '${up}' does not exist`, 128)
    repo.upstream[b] = up
    return ok(`branch '${b}' set up to track '${up}'.`)
  }
  if (flagSet.has('--unset-upstream')) {
    delete repo.upstream[names[0] ?? repo.branch]
    return ok()
  }
  if (flagSet.has('--show-current')) return ok(repo.detached !== null ? '' : repo.branch)
  if (flagSet.has('-d') || flagSet.has('-D') || flagSet.has('--delete')) {
    if (!names.length) return bad('fatal: branch name required', 128)
    const said: string[] = []
    for (const n of names) {
      if (!(n in repo.branches)) return bad(`error: branch '${n}' not found.`)
      if (n === repo.branch && repo.detached === null) return bad(`error: cannot delete branch '${n}' — you are on it. Switch to another branch first.`)
      const id = repo.branches[n] ?? null
      if (!flagSet.has('-D') && id && !ancestors(repo, headId(repo)).has(id))
        return bad(`error: the branch '${n}' is not fully merged.\nIf you are sure you want to delete it, run 'git branch -D ${n}'.`)
      delete repo.branches[n]
      delete repo.upstream[n]
      said.push(`Deleted branch ${n} (was ${id ?? 'nothing'}).`)
    }
    return ok(said.join('\n'))
  }
  if (flagSet.has('-m') || flagSet.has('-M')) {
    const [a, b] = names.length === 1 ? [repo.branch, names[0]!] : [names[0]!, names[1]!]
    if (!b) return bad('fatal: branch name required', 128)
    if (!(a in repo.branches)) return bad(`error: refname refs/heads/${a} not found`, 128)
    if (b in repo.branches && !flagSet.has('-M')) return bad(`fatal: a branch named '${b}' already exists`, 128)
    repo.branches[b] = repo.branches[a] ?? null
    delete repo.branches[a]
    if (repo.upstream[a]) {
      repo.upstream[b] = repo.upstream[a]!
      delete repo.upstream[a]
    }
    if (repo.branch === a) repo.branch = b
    return ok()
  }
  if (names.length && !flagSet.has('--merged') && !flagSet.has('--no-merged')) {
    const [name, start] = names as [string, string | undefined]
    if (name in repo.branches) return bad(`fatal: a branch named '${name}' already exists`, 128)
    if (!/^[\w./-]+$/.test(name) || name.startsWith('-') || name.includes('..')) return bad(`fatal: '${name}' is not a valid branch name`, 128)
    const id = start ? resolveRev(repo, start) : headId(repo)
    if (start && !id) return bad(`fatal: not a valid object name: '${start}'`, 128)
    repo.branches[name] = id
    if (start && /^[^/]+\//.test(start) && resolveRev(repo, start) && !(start in repo.branches) && start.split('/')[0]! in repo.remotes) {
      repo.upstream[name] = start
      return ok(`branch '${name}' set up to track '${start}'.`)
    }
    return ok()
  }
  const me = ancestors(repo, headId(repo))
  let local = Object.keys(repo.branches).sort()
  if (flagSet.has('--merged')) local = local.filter((b) => repo.branches[b] && me.has(repo.branches[b]!))
  if (flagSet.has('--no-merged')) local = local.filter((b) => repo.branches[b] && !me.has(repo.branches[b]!))
  const verbose = flagSet.has('-v') || flagSet.has('-vv')
  const w = Math.max(0, ...local.map((b) => b.length))
  const lines: string[] = []
  if (!flagSet.has('-r')) {
    if (repo.detached !== null) lines.push(`* (HEAD detached at ${repo.detached})`)
    for (const b of local) {
      if (!repo.branches[b]) continue
      const cur = b === repo.branch && repo.detached === null
      let line = `${cur ? '*' : ' '} ${verbose ? b.padEnd(w) : b}`
      const id = repo.branches[b] ?? null
      if (verbose && id) {
        let track = ''
        if (flagSet.has('-vv') && repo.upstream[b]) {
          const upId = resolveRev(repo, repo.upstream[b]!)
          const a = ancestors(repo, id)
          const u = ancestors(repo, upId)
          const ahead = [...a].filter((x) => !u.has(x)).length
          const behind = [...u].filter((x) => !a.has(x)).length
          const bits = [ahead ? `ahead ${ahead}` : '', behind ? `behind ${behind}` : ''].filter(Boolean).join(', ')
          track = `[${repo.upstream[b]}${bits ? `: ${bits}` : ''}] `
        }
        line += ` ${id} ${track}${subjectOf(repo, id)}`
      }
      lines.push(line)
    }
  }
  if (flagSet.has('-a') || flagSet.has('-r'))
    for (const [r, rem] of Object.entries(repo.remotes)) for (const b of Object.keys(rem.branches).sort()) lines.push(`  ${flagSet.has('-a') ? 'remotes/' : ''}${r}/${b}`)
  return ok(lines.join('\n'))
}

/** Commits only the detached HEAD can reach: left behind when you switch away. */
function orphans(repo: Repo): Commit[] {
  if (repo.detached === null) return []
  const kept = reachable(repo, [...Object.values(repo.branches), ...Object.values(repo.tags)])
  return logOrder(repo, ancestors(repo, repo.detached)).filter((c) => !kept.has(c.id))
}

function checkoutTo(g: G, to: { branch: string } | { detach: string }, create: boolean, label?: string): Res {
  const { s, root, repo } = g
  const targetId = 'branch' in to ? (repo.branches[to.branch] ?? null) : to.detach
  const fromName = repo.detached !== null ? repo.detached : repo.branch
  if (dirty(s, root, repo)) {
    const files = dirtyFiles(g)
    return bad(
      `error: Your local changes to the following files would be overwritten by checkout:\n${files.map((f) => `\t${f}`).join('\n')}\nCommit them, or stash them (git stash), before you switch branches.\nAborting`,
    )
  }
  const left = targetId === repo.detached ? [] : orphans(repo)
  applyTree(s, root, headTree(repo), treeOf(repo, targetId))
  const lines: string[] = []
  if (left.length)
    lines.push(
      `Warning: you are leaving ${plural(left.length, 'commit')} behind, not connected to`,
      'any of your branches:',
      '',
      ...left.map((c) => `  ${c.id} ${firstLine(c.message)}`),
      '',
      'If you want to keep them by creating a new branch, this may be a good time',
      'to do so with:',
      '',
      ` git branch <new-branch-name> ${left[0]!.id}`,
      '',
    )
  if (repo.detached === null) repo.prevBranch = repo.branch
  if ('branch' in to) {
    repo.branch = to.branch
    repo.detached = null
    if (targetId) repo.reflog.push({ id: targetId, msg: `checkout: moving from ${fromName} to ${to.branch}` })
    lines.push(create ? `Switched to a new branch '${to.branch}'` : `Switched to branch '${to.branch}'`)
  } else {
    repo.detached = to.detach
    repo.reflog.push({ id: to.detach, msg: `checkout: moving from ${fromName} to ${label ?? to.detach}` })
    lines.push(
      `Note: switching to '${to.detach}'.`,
      '',
      "You are in 'detached HEAD' state: you are looking at a commit, not at a branch.",
      'You can look around and even commit, but those commits belong to no branch:',
      'switch away and they are left behind. To keep work you do here, make a branch:',
      '',
      '  git switch -c <new-branch-name>',
      '',
      `HEAD is now at ${to.detach} ${subjectOf(repo, to.detach)}`,
    )
  }
  return ok(lines.join('\n'))
}

const gitSwitch = (g: G, args: string[], sub: 'switch' | 'checkout'): Res => {
  const { repo } = g
  if (repo.pending) return bad(`error: you need to resolve your current index first (a ${repo.pending.kind} is in progress)`)
  const dd = args.indexOf('--')
  if (sub === 'checkout' && dd >= 0) {
    const rev = dd > 0 ? args[0]! : null
    return gitRestore(g, [...(rev ? [`--source=${rev}`, '--staged', '--worktree'] : []), ...args.slice(dd + 1)])
  }
  const create = args[0] === '-b' || args[0] === '-c' || args[0] === '-B' || args[0] === '-C'
  if (args[0] === '--detach' || args[0] === '-d') {
    const id = resolveRev(repo, args[1] ?? 'HEAD')
    if (!id) return bad(`fatal: invalid reference: ${args[1]}`, 128)
    return checkoutTo(g, { detach: id }, false, args[1] ?? 'HEAD')
  }
  let name = create ? args[1] : args[0]
  if (!name) return bad(`usage: git ${sub} ${sub === 'switch' ? '[-c]' : '[-b]'} <branch>`)
  if (name === '-') {
    if (!repo.prevBranch) return bad('fatal: no previous branch to go back to', 128)
    name = repo.prevBranch
  }
  if (create) {
    const force = args[0] === '-B' || args[0] === '-C'
    if (name in repo.branches && !force) return bad(`fatal: a branch named '${name}' already exists`, 128)
    const start = args[2]
    const id = start ? resolveRev(repo, start) : headId(repo)
    if (start && !id) return bad(`fatal: '${start}' is not a commit and a branch '${name}' cannot be created from it`, 128)
    const leaving = repo.detached
    const existed = name in repo.branches ? repo.branches[name] : undefined
    repo.branches[name] = id
    let note = ''
    if (start && start.includes('/') && start.split('/')[0]! in repo.remotes && !(start in repo.branches)) {
      repo.upstream[name] = start
      note = `branch '${name}' set up to track '${start}'.\n`
    }
    if (id === headId(repo)) {
      const from = leaving ?? repo.branch
      if (repo.detached === null) repo.prevBranch = repo.branch
      repo.branch = name
      repo.detached = null
      if (id) repo.reflog.push({ id, msg: `checkout: moving from ${from} to ${name}` })
      return ok(`${note}Switched to a new branch '${name}'`)
    }
    const r = checkoutTo(g, { branch: name }, true)
    if (r.code) {
      if (existed === undefined) delete repo.branches[name]
      else repo.branches[name] = existed
      delete repo.upstream[name]
      return r
    }
    return note ? { ...r, chunks: [[1, note], ...r.chunks] } : r
  }
  if (name in repo.branches) {
    if (name === repo.branch && repo.detached === null) return ok(`Already on '${name}'`)
    return checkoutTo(g, { branch: name }, false)
  }
  const remote = Object.entries(repo.remotes).find(([, r]) => name! in r.branches)
  if (remote) {
    repo.branches[name] = remote[1].branches[name]!
    repo.upstream[name] = `${remote[0]}/${name}`
    const r = checkoutTo(g, { branch: name }, true)
    if (r.code) {
      delete repo.branches[name]
      delete repo.upstream[name]
      return r
    }
    return { ...r, chunks: [[1, `branch '${name}' set up to track '${remote[0]}/${name}'.\n`], ...r.chunks] }
  }
  const id = resolveRev(repo, name)
  if (id) {
    if (sub === 'switch') return bad(`fatal: a branch is expected, got '${name}'\nhint: to look at a commit without a branch, use: git switch --detach ${name}`, 128)
    return checkoutTo(g, { detach: id }, false, name)
  }
  if (sub === 'checkout' && Object.keys(indexTree(repo)).some((f) => f === g.rel(name!) || f.startsWith(`${g.rel(name!)}/`))) return gitRestore(g, args)
  return bad(`error: pathspec '${name}' did not match any branch`)
}

function mergeMessage(repo: Repo, name: string): string {
  if (name in repo.branches) return `Merge branch '${name}'`
  if (name in repo.tags) return `Merge tag '${name}'`
  if (name.includes('/') && resolveRev(repo, name)) return `Merge remote-tracking branch '${name}'`
  return `Merge commit '${name}'`
}

function doMerge(g: G, name: string, opts: { noff?: boolean; ffOnly?: boolean; message?: string; label?: string }): Res {
  const { s, root, repo } = g
  const theirs = resolveRev(repo, name)
  if (!theirs) return bad(`merge: ${name} - not something we can merge`)
  const ours = headId(repo)
  if (theirs === ours || ancestors(repo, ours).has(theirs)) return ok('Already up to date.')
  if (dirty(s, root, repo)) return bad('error: commit (or git restore) your changes before merging.')
  repo.origHead = ours
  const label = opts.label ?? name
  if ((!ours || ancestors(repo, theirs).has(ours)) && !opts.noff) {
    const before = headTree(repo)
    moveHead(repo, theirs, `merge ${label}: Fast-forward`)
    applyTree(s, root, before, treeOf(repo, theirs))
    const n = changedFiles(before, treeOf(repo, theirs)).length
    return ok(`Updating ${ours ?? '0000000'}..${theirs}\nFast-forward\n ${plural(n, 'file')} changed`)
  }
  if (opts.ffOnly) return bad('fatal: Not possible to fast-forward, aborting.', 128)
  const mine = treeOf(repo, ours)
  const other = treeOf(repo, theirs)
  const base = treeOf(repo, mergeBase(repo, ours, theirs))
  const m = mergeTrees(base, mine, other, { ours: 'HEAD', theirs: label })
  const message = opts.message ?? mergeMessage(repo, name)
  const auto = Object.keys(mine)
    .filter((f) => f in other && base[f] !== mine[f] && base[f] !== other[f] && mine[f] !== other[f])
    .sort()
    .map((f) => `Auto-merging ${f}`)
  if (m.conflicts.length) {
    writeMergeResult(g, mine, m)
    repo.pending = { kind: 'merge', message, conflicts: [...m.conflicts], theirs, todo: [] }
    return { code: 1, chunks: [[1, fromLines([...auto, ...conflictLines(m), 'Automatic merge failed; fix conflicts and then commit the result.'])]] }
  }
  const c = makeCommit(repo, { message, parent: ours, parent2: theirs, tree: m.tree, author: authorName(g) })
  moveHead(repo, c.id, `merge ${label}: Merge made by the 'ort' strategy.`)
  applyTree(s, root, mine, m.tree)
  return ok([...auto, "Merge made by the 'ort' strategy."].join('\n'))
}

const gitMerge: GitFn = (g, args) => {
  const { repo } = g
  if (args.includes('--abort')) {
    if (repo.pending?.kind !== 'merge') return bad('fatal: There is no merge to abort (MERGE_HEAD missing).', 128)
    hardReset(g, headId(repo))
    repo.pending = null
    return ok()
  }
  if (args.includes('--continue')) {
    if (repo.pending?.kind !== 'merge') return bad('fatal: There is no merge in progress (MERGE_HEAD missing).', 128)
    return gitCommit(g, [])
  }
  if (repo.pending)
    return bad(
      repo.pending.kind === 'merge'
        ? 'fatal: You have not concluded your merge (MERGE_HEAD exists).\nPlease, commit your changes before you merge.'
        : `error: a ${repo.pending.kind} is in progress — finish it (--continue) or --abort it first`,
      128,
    )
  let message: string | undefined
  const names: string[] = []
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!
    if (a === '-m') message = args[++k]
    else if (a === '--no-ff' || a === '--ff-only' || a === '--ff' || a === '--no-edit') continue
    else if (a.startsWith('-')) return bad(`error: unknown option \`${a.replace(/^-+/, '')}'`, 129)
    else names.push(a)
  }
  if (!names.length) {
    const up = repo.detached === null ? repo.upstream[repo.branch] : undefined
    if (!up) return bad('usage: git merge <branch>')
    names.push(up)
  }
  return doMerge(g, names[0]!, { noff: args.includes('--no-ff'), ffOnly: args.includes('--ff-only'), ...(message ? { message } : {}) })
}

const gitStash: GitFn = (g, args) => {
  const { s, root, repo } = g
  const [sub = 'push', ...rest] = args[0] && !args[0].startsWith('-') ? args : ['push', ...args]
  const pick = (a: string | undefined) => {
    const m = /^stash@\{(\d+)\}$/.exec(a ?? 'stash@{0}') ?? /^(\d+)$/.exec(a ?? '')
    return m ? Number(m[1]) : -1
  }
  switch (sub) {
    case 'push':
    case 'save': {
      if (repo.pending) return bad('error: you have unmerged files — finish or abort the current operation first')
      const withUntracked = rest.includes('-u') || rest.includes('--include-untracked')
      const mi = rest.indexOf('-m')
      const note = mi >= 0 ? rest[mi + 1] : sub === 'save' ? rest.filter((a) => !a.startsWith('-')).join(' ') || undefined : undefined
      const head = headTree(repo)
      const index = indexTree(repo)
      const work = workingTree(s, root)
      const saved: Record<string, string | null> = {}
      for (const f of new Set([...Object.keys(head), ...Object.keys(index)])) if (work[f] !== head[f] || index[f] !== head[f]) saved[f] = work[f] ?? null
      const st = statusOf(g)
      if (withUntracked) for (const f of st.untracked) saved[f] = work[f]!
      if (!Object.keys(saved).length) return ok('No local changes to save')
      const id = headId(repo)
      const message = note ? `On ${repo.branch}: ${note}` : `WIP on ${repo.branch}: ${id ?? '(no commit)'} ${subjectOf(repo, id)}`
      repo.stash.unshift({ message, base: id, work: saved, added: Object.keys(repo.staged).filter((f) => !(f in head)) })
      for (const f of Object.keys(saved)) {
        if (f in head) {
          mkdirp(s, parentOf(`${root}/${f}`)[0])
          writeFile(s, `${root}/${f}`, head[f]!, false)
        } else removePath(s, `${root}/${f}`)
      }
      repo.staged = {}
      repo.removed = []
      return ok(`Saved working directory and index state ${message}`)
    }
    case 'list':
      return ok(repo.stash.map((x, i) => `stash@{${i}}: ${x.message}`).join('\n'))
    case 'show': {
      const i = pick(rest.find((a) => !a.startsWith('-')))
      const st = repo.stash[i]
      if (!st) return bad(`error: stash@{${i}} is not a valid reference`)
      const base = treeOf(repo, st.base)
      const after: Record<string, string> = { ...base }
      for (const [f, v] of Object.entries(st.work)) {
        if (v === null) delete after[f]
        else after[f] = v
      }
      return ok((rest.includes('-p') ? changedFiles(base, after).flatMap((f) => fileDiff(f, base[f], after[f])) : statLines(base, after)).join('\n'))
    }
    case 'drop': {
      const i = pick(rest[0])
      if (!repo.stash[i]) return bad(`error: stash@{${i}} is not a valid reference`)
      repo.stash.splice(i, 1)
      return ok(`Dropped stash@{${i}}`)
    }
    case 'clear':
      repo.stash = []
      return ok()
    case 'pop':
    case 'apply': {
      if (!repo.stash.length) return bad('error: No stash entries found.')
      const i = pick(rest[0])
      const st = repo.stash[i]
      if (!st) return bad(`error: stash@{${i}} is not a valid reference`)
      const head = headTree(repo)
      const work = workingTree(s, root)
      const base = treeOf(repo, st.base)
      const blocked = Object.keys(st.work).filter((f) => work[f] !== head[f] && work[f] !== (st.work[f] ?? undefined))
      if (blocked.length)
        return bad(`error: Your local changes to the following files would be overwritten by merge:\n${blocked.map((f) => `\t${f}`).join('\n')}\nPlease commit your changes or stash them before you merge.\nAborting`)
      const conflicts: string[] = []
      for (const [f, v] of Object.entries(st.work)) {
        const b = base[f]
        const o = head[f]
        const t = v ?? undefined
        let result: string | undefined
        if (o === b || o === t) result = t
        else if (t === b) result = o
        else if (o !== undefined && t !== undefined) {
          const m = merge3(toLines(b ?? ''), toLines(o), toLines(t), { ours: 'Updated upstream', theirs: 'Stashed changes' })
          result = m.text
          if (!m.clean) conflicts.push(f)
        } else {
          result = t ?? o
          conflicts.push(f)
        }
        if (result === undefined) removePath(s, `${root}/${f}`)
        else {
          mkdirp(s, parentOf(`${root}/${f}`)[0])
          writeFile(s, `${root}/${f}`, result, false)
        }
      }
      for (const f of st.added) if (!conflicts.includes(f) && st.work[f] !== null && st.work[f] !== undefined) repo.staged[f] = st.work[f]!
      const lines = conflicts.map((f) => `CONFLICT (content): Merge conflict in ${f}`)
      if (conflicts.length) return { code: 1, chunks: [[1, fromLines([...lines, 'The stash entry is kept in case you need it again.'])]] }
      const status = statusText(g, false)
      if (sub === 'pop') repo.stash.splice(i, 1)
      return ok(`${status}${sub === 'pop' ? `\nDropped stash@{${i}}` : ''}`)
    }
    default:
      return bad(`error: unknown subcommand: ${sub} (try: git stash, git stash list, git stash pop)`, 129)
  }
}

const gitTag: GitFn = (g, args) => {
  const { repo } = g
  if (args.includes('-d') || args.includes('--delete')) {
    const said: string[] = []
    for (const n of args.filter((a) => !a.startsWith('-'))) {
      if (!(n in repo.tags)) return bad(`error: tag '${n}' not found.`)
      said.push(`Deleted tag '${n}' (was ${repo.tags[n]})`)
      delete repo.tags[n]
      delete repo.tagNotes[n]
    }
    return ok(said.join('\n'))
  }
  let message: string | undefined
  let annotated = false
  let pattern: string | undefined
  const names: string[] = []
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!
    if (a === '-m') {
      message = args[++k]
      annotated = true
    } else if (a === '-a') annotated = true
    else if (a === '-l' || a === '--list') pattern = args[k + 1]?.startsWith('-') ? undefined : args[++k]
    else if (a === '-f') continue
    else if (a.startsWith('-')) return bad(`error: unknown option \`${a.replace(/^-+/, '')}'`, 129)
    else names.push(a)
  }
  if (!names.length || pattern !== undefined) {
    const list = Object.keys(repo.tags)
      .sort()
      .filter((t) => !pattern || wildMatch(pattern, t))
    return ok(list.join('\n'))
  }
  const [name, target] = names as [string, string | undefined]
  if (name in repo.tags && !args.includes('-f')) return bad(`fatal: tag '${name}' already exists`, 128)
  if (!/^[\w./-]+$/.test(name)) return bad(`fatal: '${name}' is not a valid tag name.`, 128)
  if (annotated && message === undefined) return bad('fatal: an annotated tag needs a message: git tag -a v1.0 -m "First release"', 128)
  const id = resolveRev(repo, target ?? 'HEAD')
  if (!id) return bad(`fatal: Failed to resolve '${target ?? 'HEAD'}' as a valid ref.`, 128)
  repo.tags[name] = id
  if (message !== undefined) repo.tagNotes[name] = message
  else delete repo.tagNotes[name]
  return ok()
}

const gitReflog: GitFn = (g) => {
  const { repo } = g
  const deco = decorations(repo)
  return ok(
    [...repo.reflog]
      .reverse()
      .map((e, i) => {
        const d = i === 0 ? deco.get(e.id) : undefined
        return `${e.id}${d ? ` (${d.join(', ')})` : ''} HEAD@{${i}}: ${e.msg}`
      })
      .join('\n'),
  )
}

/** Carries on replaying pending commits (cherry-pick, rebase) until done or stuck. */
function runSequence(g: G, lines: string[]): Res {
  const { repo } = g
  const p = repo.pending!
  while (p.todo.length) {
    const id = p.todo.shift()!
    const c = commitById(repo, id)!
    p.current = id
    p.message = c.message
    p.author = c.author ?? 'you'
    const r = replay(g, c, 'pick')
    if (r.conflict) {
      p.conflicts = [...r.conflict.conflicts]
      lines.push(
        ...conflictLines(r.conflict),
        `error: could not apply ${c.id}... ${firstLine(c.message)}`,
        'hint: Resolve the conflicts in the file(s), mark each resolved with',
        `hint: "git add <file>", then run "git ${p.kind} --continue".`,
        ...(p.kind === 'rebase' ? ['hint: You can instead skip this commit with "git rebase --skip".'] : []),
        `hint: To give up and go back to how things were, run "git ${p.kind} --abort".`,
      )
      return { code: 1, chunks: [[1, fromLines(lines)]] }
    }
    if (r.empty) lines.push(p.kind === 'rebase' ? `dropping ${c.id} ${firstLine(c.message)} -- its changes are already there` : `The cherry-pick of ${c.id} is empty: its changes are already here — skipped.`)
    else if (p.kind === 'cherry-pick') lines.push(`[${repo.detached !== null ? 'detached HEAD' : repo.branch} ${r.done!.id}] ${firstLine(c.message)}`, ` ${plural(changedFiles(treeOf(repo, r.done!.parent), r.done!.tree).length, 'file')} changed`)
    p.current = null
  }
  if (p.kind === 'rebase') {
    const tip = headId(repo)
    repo.branch = p.branch!
    repo.branches[p.branch!] = tip
    repo.detached = null
    if (tip) repo.reflog.push({ id: tip, msg: `rebase (finish): returning to refs/heads/${p.branch}` })
    lines.push(`Successfully rebased and updated refs/heads/${p.branch}.`)
  }
  repo.pending = null
  return ok(lines.join('\n'))
}

function continueCmd(g: G, kind: Pending['kind']): Res {
  const { repo } = g
  const p = repo.pending
  if (!p || p.kind !== kind) return bad(`error: no ${kind} in progress`, 128)
  if (p.conflicts.length) return bad(`error: you must edit all merge conflicts and then\nmark them as resolved using git add\n(still in conflict: ${p.conflicts.join(', ')})`, 1)
  const lines: string[] = []
  if (p.current) {
    if (Object.keys(repo.staged).length || repo.removed.length) {
      const c = makeCommit(repo, { message: p.message, parent: headId(repo), tree: indexTree(repo), author: p.author ?? 'you' })
      moveHead(repo, c.id, `${kind === 'rebase' ? 'rebase (continue)' : kind}: ${firstLine(p.message)}`)
      repo.staged = {}
      repo.removed = []
      lines.push(`[${repo.detached !== null ? 'detached HEAD' : repo.branch} ${c.id}] ${firstLine(p.message)}`)
    }
    p.current = null
  }
  return runSequence(g, lines)
}

function abortCmd(g: G, kind: Pending['kind']): Res {
  const { repo } = g
  const p = repo.pending
  if (!p || p.kind !== kind) return bad(`error: no ${kind} in progress`, 128)
  const back = p.origHead ?? headId(repo)
  hardReset(g, headId(repo))
  if (kind === 'rebase') {
    const before = headTree(repo)
    repo.detached = null
    repo.branch = p.branch!
    repo.branches[p.branch!] = back
    applyTree(g.s, g.root, before, treeOf(repo, back))
    if (back) repo.reflog.push({ id: back, msg: `rebase (abort): returning to refs/heads/${p.branch}` })
  } else if (back !== headId(repo)) {
    const before = headTree(repo)
    moveHead(repo, back, `${kind}: abort`)
    applyTree(g.s, g.root, before, treeOf(repo, back))
  }
  repo.pending = null
  return ok()
}

/** Revisions for cherry-pick: single commits and A..B ranges, oldest first. */
function pickList(g: G, args: string[]): string[] | Res {
  const { repo } = g
  const ids: string[] = []
  for (const a of args) {
    const range = /^(.*?)\.\.(.*)$/.exec(a)
    if (range) {
      const x = resolveRev(repo, range[1] || 'HEAD')
      const y = resolveRev(repo, range[2] || 'HEAD')
      if (!x || !y) return bad(`fatal: bad revision '${a}'`, 128)
      const drop = ancestors(repo, x)
      ids.push(
        ...logOrder(repo, ancestors(repo, y))
          .filter((c) => !drop.has(c.id))
          .reverse()
          .map((c) => c.id),
      )
      continue
    }
    const id = resolveRev(repo, a)
    if (!id) return bad(`fatal: bad revision '${a}'`, 128)
    ids.push(id)
  }
  return ids
}

const gitCherryPick: GitFn = (g, args) => {
  const { s, root, repo } = g
  if (args.includes('--continue')) return continueCmd(g, 'cherry-pick')
  if (args.includes('--abort')) return abortCmd(g, 'cherry-pick')
  if (args.includes('--skip')) {
    if (repo.pending?.kind !== 'cherry-pick') return bad('error: no cherry-pick in progress', 128)
    hardReset(g, headId(repo))
    repo.pending.conflicts = []
    repo.pending.current = null
    return runSequence(g, [])
  }
  if (repo.pending) return bad(`error: a ${repo.pending.kind} is in progress — finish it (--continue) or --abort it first`, 128)
  const revs = args.filter((a) => !a.startsWith('-'))
  if (!revs.length) return bad('usage: git cherry-pick <commit>…', 129)
  if (dirty(s, root, repo)) return bad('error: your local changes would be overwritten by cherry-pick.\nhint: commit your changes or stash them to proceed.\nfatal: cherry-pick failed', 128)
  const ids = pickList(g, revs)
  if (isRes(ids)) return ids
  for (const id of ids)
    if (commitById(repo, id)?.parent2) return bad(`error: commit ${id} is a merge — cherry-pick copies single commits, not merges.\nfatal: cherry-pick failed`, 128)
  repo.pending = { kind: 'cherry-pick', message: '', conflicts: [], todo: ids, origHead: headId(repo) }
  return runSequence(g, [])
}

const gitRevert: GitFn = (g, args) => {
  const { s, root, repo } = g
  if (args.includes('--continue')) {
    const p = repo.pending
    if (p?.kind !== 'revert') return bad('error: no revert in progress', 128)
    if (p.conflicts.length) return bad('error: you must edit all merge conflicts and then\nmark them as resolved using git add', 1)
    return gitCommit(g, ['-m', p.message])
  }
  if (args.includes('--abort')) return abortCmd(g, 'revert')
  if (repo.pending) return bad(`error: a ${repo.pending.kind} is in progress — finish it (--continue) or --abort it first`, 128)
  const revs = args.filter((a) => !a.startsWith('-'))
  if (!revs.length) return bad('usage: git revert <commit>', 129)
  if (dirty(s, root, repo)) return bad('error: your local changes would be overwritten by revert.\nhint: commit your changes or stash them to proceed.\nfatal: revert failed', 128)
  const lines: string[] = []
  for (const rev of revs) {
    const id = resolveRev(repo, rev)
    const c = commitById(repo, id)
    if (!c) return bad(`fatal: bad revision '${rev}'`, 128)
    if (c.parent2) return bad(`error: commit ${c.id} is a merge but no -m option was given.\nfatal: revert failed`, 128)
    const r = replay(g, c, 'revert')
    if (r.conflict) {
      repo.pending = { kind: 'revert', message: `Revert "${firstLine(c.message)}"\n\nThis reverts commit ${c.id}.`, conflicts: [...r.conflict.conflicts], current: c.id, todo: [], origHead: headId(repo), author: authorName(g) }
      lines.push(
        ...conflictLines(r.conflict),
        `error: could not revert ${c.id}... ${firstLine(c.message)}`,
        'hint: After resolving the conflicts, mark the corrected paths',
        "hint: with 'git add <paths>' and run 'git revert --continue'.",
      )
      return { code: 1, chunks: [[1, fromLines(lines)]] }
    }
    if (r.empty) return bad(`On branch ${repo.branch}\nnothing to commit, working tree clean — the changes in ${c.id} are already undone`)
    lines.push(`[${repo.detached !== null ? 'detached HEAD' : repo.branch} ${r.done!.id}] ${firstLine(r.done!.message)}`, ` ${plural(changedFiles(treeOf(repo, r.done!.parent), r.done!.tree).length, 'file')} changed`)
  }
  return ok(lines.join('\n'))
}

/** The set of file changes a commit makes, to spot a commit already applied upstream. */
function patchId(repo: Repo, c: Commit): string {
  const before = treeOf(repo, c.parent)
  return JSON.stringify(changedFiles(before, c.tree).map((f) => [f, before[f] ?? null, c.tree[f] ?? null]))
}

const gitRebase: GitFn = (g, args) => {
  const { s, root, repo } = g
  if (args.includes('--continue')) return continueCmd(g, 'rebase')
  if (args.includes('--abort')) return abortCmd(g, 'rebase')
  if (args.includes('--skip')) {
    if (repo.pending?.kind !== 'rebase') return bad('error: no rebase in progress', 128)
    hardReset(g, headId(repo))
    repo.pending.conflicts = []
    repo.pending.current = null
    return runSequence(g, [])
  }
  if (args.includes('-i') || args.includes('--interactive'))
    return bad('error: interactive rebase opens an editor, which the practice terminal does not have.\nhint: to squash your last N commits into one: git reset --soft HEAD~N && git commit -m "One message"', 1)
  if (repo.pending) return bad(`error: a ${repo.pending.kind} is in progress — finish it (--continue) or --abort it first`, 128)
  const upName = args.find((a) => !a.startsWith('-')) ?? (repo.detached === null ? repo.upstream[repo.branch] : undefined)
  if (!upName) return bad('usage: git rebase <branch>   (for example: git rebase main)', 129)
  if (repo.detached !== null) return bad('error: rebase a branch, not a detached HEAD — switch to your branch first', 128)
  const up = resolveRev(repo, upName)
  if (!up) return bad(`fatal: invalid upstream '${upName}'`, 128)
  if (dirty(s, root, repo)) return bad('error: cannot rebase: You have unstaged changes.\nerror: Please commit or stash them.', 1)
  const me = headId(repo)
  if (ancestors(repo, me).has(up)) return ok(`Current branch ${repo.branch} is up to date.`)
  repo.origHead = me
  if (!me || ancestors(repo, up).has(me)) {
    const before = headTree(repo)
    moveHead(repo, up, `rebase (finish): ${repo.branch} onto ${up}`)
    applyTree(s, root, before, treeOf(repo, up))
    return ok(`Successfully rebased and updated refs/heads/${repo.branch}.`)
  }
  const upSet = ancestors(repo, up)
  const upstreamPatches = new Set(logOrder(repo, upSet).filter((c) => !ancestors(repo, me).has(c.id)).map((c) => patchId(repo, c)))
  const mine: Commit[] = []
  let cur = commitById(repo, me)
  while (cur && !upSet.has(cur.id)) {
    if (!cur.parent2) mine.push(cur)
    cur = commitById(repo, cur.parent)
  }
  const lines: string[] = []
  const todo = mine
    .reverse()
    .filter((c) => {
      if (!upstreamPatches.has(patchId(repo, c))) return true
      lines.push(`dropping ${c.id} ${firstLine(c.message)} -- patch contents already upstream`)
      return false
    })
    .map((c) => c.id)
  const before = headTree(repo)
  repo.pending = { kind: 'rebase', message: '', conflicts: [], todo, branch: repo.branch, origHead: me }
  repo.detached = up
  applyTree(s, root, before, treeOf(repo, up))
  repo.reflog.push({ id: up, msg: `rebase (start): checkout ${upName}` })
  return runSequence(g, lines)
}

/* bisect */

function bisectNext(g: G, lines: string[]): Res {
  const { s, root, repo } = g
  const b = repo.bisect!
  if (!b.bad || !b.good.length) {
    lines.push(!b.bad && !b.good.length ? 'status: waiting for both good and bad commits' : b.bad ? 'status: waiting for good commit(s), bad commit known' : 'status: waiting for a bad commit, good commit(s) known')
    return ok(lines.join('\n'))
  }
  const goodSet = reachable(repo, b.good)
  const cands = [...ancestors(repo, b.bad)].filter((id) => !goodSet.has(id))
  const testable = cands.filter((id) => id !== b.bad && !b.skip.includes(id))
  if (!cands.filter((id) => id !== b.bad).length) {
    b.found = b.bad
    const c = commitById(repo, b.bad)!
    lines.push(`${c.id} is the first bad commit`, `commit ${c.id}`, `Author: ${c.author ?? 'you'}`, '', ...c.message.split('\n').map((l) => `    ${l}`), '', ...statLines(treeOf(repo, c.parent), c.tree))
    b.log.push(`# first bad commit: [${c.id}] ${firstLine(c.message)}`)
    return ok(lines.join('\n'))
  }
  if (!testable.length) {
    lines.push("There are only 'skip'ped commits left to test.", 'The first bad commit could be any of:', ...cands.map((id) => id), 'We cannot bisect more!')
    return ok(lines.join('\n'))
  }
  const n = cands.length
  let best = testable[0]!
  let bestScore = Infinity
  for (const c of repo.commits) {
    if (!testable.includes(c.id)) continue
    const w = [...ancestors(repo, c.id)].filter((id) => cands.includes(id)).length
    const score = Math.abs(2 * w - n)
    if (score < bestScore) {
      best = c.id
      bestScore = score
    }
  }
  const left = Math.max(0, Math.floor((n - 1) / 2))
  const steps = Math.max(0, Math.ceil(Math.log2(left + 1)))
  applyTree(s, root, headTree(repo), treeOf(repo, best))
  repo.detached = best
  repo.reflog.push({ id: best, msg: `checkout: moving to ${best} (bisect)` })
  lines.push(`Bisecting: ${plural(left, 'revision')} left to test after this (roughly ${plural(steps, 'step')})`, `[${best}] ${subjectOf(repo, best)}`)
  return ok(lines.join('\n'))
}

function bisectReset(g: G): Res {
  const { s, root, repo } = g
  const b = repo.bisect
  if (!b) return ok('We are not bisecting.')
  const before = headTree(repo)
  const prevId = headId(repo)
  if (b.origBranch && b.origBranch in repo.branches) {
    repo.detached = null
    repo.branch = b.origBranch
  } else repo.detached = b.origId
  applyTree(s, root, before, headTree(repo))
  repo.bisect = null
  const now = headId(repo)
  if (now) repo.reflog.push({ id: now, msg: `checkout: moving from ${prevId} to ${b.origBranch ?? now}` })
  return ok(`Previous HEAD position was ${prevId} ${subjectOf(repo, prevId)}\n${b.origBranch ? `Switched to branch '${b.origBranch}'` : `HEAD is now at ${now}`}`)
}

const gitBisect: GitFn = (g, args) => {
  const { s, root, repo } = g
  const [sub, ...rest] = args
  if (sub === 'start') {
    if (repo.pending) return bad(`error: a ${repo.pending.kind} is in progress — finish it first`, 1)
    if (dirty(s, root, repo)) return bad('error: commit or stash your changes before you start bisecting', 1)
    if (repo.bisect) bisectReset(g)
    repo.bisect = { origBranch: repo.detached === null ? repo.branch : null, origId: headId(repo), bad: null, good: [], skip: [], found: null, log: ['git bisect start'] }
    const [badRev, ...goodRevs] = rest.filter((a) => a !== '--')
    if (badRev) {
      const id = resolveRev(repo, badRev)
      if (!id) return bad(`fatal: '${badRev}' does not appear to be a valid revision`, 128)
      repo.bisect.bad = id
    }
    for (const gr of goodRevs) {
      const id = resolveRev(repo, gr)
      if (!id) return bad(`fatal: '${gr}' does not appear to be a valid revision`, 128)
      repo.bisect.good.push(id)
    }
    return bisectNext(g, [])
  }
  if (sub === 'reset') return bisectReset(g)
  const b = repo.bisect
  if (!b) return bad('You need to start by "git bisect start"', 1)
  if (sub === 'log') return ok(b.log.join('\n'))
  if (sub === 'bad' || sub === 'new' || sub === 'good' || sub === 'old' || sub === 'skip') {
    if (b.found) return ok(`${b.found} was already found to be the first bad commit — run git bisect reset to finish.`)
    const revs = rest.length ? rest : ['HEAD']
    for (const r of revs) {
      const id = resolveRev(repo, r)
      if (!id) return bad(`fatal: '${r}' does not appear to be a valid revision`, 128)
      if (sub === 'bad' || sub === 'new') b.bad = id
      else if (sub === 'skip') b.skip.push(id)
      else b.good.push(id)
      b.log.push(`# ${sub === 'new' ? 'bad' : sub === 'old' ? 'good' : sub}: [${id}] ${subjectOf(repo, id)}`, `git bisect ${sub} ${id}`)
    }
    return bisectNext(g, [])
  }
  if (sub === 'run') {
    if (!rest.length) return bad('usage: git bisect run <command> [args…]', 1)
    if (!b.bad || !b.good.length) return bad('error: git bisect run needs a good and a bad commit first (git bisect good …, git bisect bad …)', 1)
    const chunks: Chunk[] = []
    for (let round = 0; round < 64 && !repo.bisect?.found; round++) {
      chunks.push([1, `running  ${rest.join(' ')}\n`])
      const r = dispatch(g.ctx, rest, { buf: '' }, false, 0, 'git bisect run')
      chunks.push(...r.chunks)
      if (r.code >= 128 || r.code === 127) {
        chunks.push([2, `bisect run failed: the command exited with ${r.code}\n`])
        return { code: 1, chunks }
      }
      const verdict = r.code === 0 ? 'good' : r.code === 125 ? 'skip' : 'bad'
      const step = gitBisect(g, [verdict])
      chunks.push(...step.chunks)
      if (repo.bisect?.found || /cannot bisect more/.test(stdoutOf(step))) break
    }
    if (repo.bisect?.found) chunks.push([1, 'bisect found first bad commit\n'])
    return { code: 0, chunks }
  }
  return bad(`error: unknown bisect command '${sub ?? ''}' (use start, good, bad, skip, run, log, reset)`, 1)
}

const gitBlame: GitFn = (g, args) => {
  const { repo } = g
  const files = args.filter((a) => !a.startsWith('-'))
  const revAndFile = files.length === 2 ? files : [null, files[0]]
  const [rev, file] = revAndFile as [string | null, string | undefined]
  if (!file) return bad('usage: git blame <file>', 129)
  const start = resolveRev(repo, rev ?? 'HEAD')
  const f = g.rel(file)
  const content = treeOf(repo, start)[f]
  if (content === undefined) return bad(`fatal: no such path '${f}' in ${rev ?? 'HEAD'}`, 128)
  const lines = toLines(content)
  const owner: Commit[] = new Array(lines.length)
  const blameAt = (id: string, map: [number, number][]) => {
    const c = commitById(repo, id)!
    const cur = toLines(c.tree[f] ?? '')
    let remaining = map
    for (const pid of [c.parent, c.parent2]) {
      const p = commitById(repo, pid)
      if (!p || p.tree[f] === undefined || !remaining.length) continue
      const m = matchLines(cur, toLines(p.tree[f]))
      const pass: [number, number][] = []
      const keep: [number, number][] = []
      for (const [li, fi] of remaining) (m[li]! >= 0 ? pass : keep).push(m[li]! >= 0 ? [m[li]!, fi] : [li, fi])
      if (pass.length) blameAt(p.id, pass)
      remaining = keep
    }
    for (const [, fi] of remaining) owner[fi] = c
  }
  blameAt(start!, lines.map((_, i) => [i, i]))
  const w = Math.max(...owner.map((c) => (c.author ?? 'you').length))
  const nw = String(lines.length).length
  return ok(lines.map((l, i) => `${owner[i]!.id} (${(owner[i]!.author ?? 'you').padEnd(w)} ${String(i + 1).padStart(nw)}) ${l}`).join('\n'))
}

const gitLsFiles: GitFn = (g) =>
  ok(
    Object.keys(indexTree(g.repo))
      .sort()
      .join('\n'),
  )

const gitCheckIgnore: GitFn = (g, args) => {
  const { s, root, repo } = g
  const verbose = args.includes('-v') || args.includes('--verbose')
  const rules = ignoreRules(s, root)
  const index = indexTree(repo)
  const lines: string[] = []
  for (const a of args.filter((x) => !x.startsWith('-'))) {
    const rel = g.rel(a)
    if (rel in index) continue
    const rule = ignoredBy(rules, rel, lookup(s, resolve(s.cwd, a))?.kind === 'dir')
    if (rule) lines.push(verbose ? `.gitignore:${rule.line}:${rule.pattern}\t${a}` : a)
  }
  return { code: lines.length ? 0 : 1, chunks: lines.length ? [[1, fromLines(lines)]] : [] }
}

const gitRemote: GitFn = (g, args) => {
  const { s, repo } = g
  const [sub, ...rest] = args
  if (!sub || sub === '-v' || sub === '--verbose') {
    const names = Object.keys(repo.remotes).sort()
    return ok(names.map((n) => (sub ? `${n}\t${repo.remotes[n]!.url} (fetch)\n${n}\t${repo.remotes[n]!.url} (push)` : n)).join('\n'))
  }
  const absUrl = (u: string) => (isNetworkUrl(u) ? u : resolve(s.cwd, u))
  switch (sub) {
    case 'add': {
      const [name, url] = rest
      if (!name || !url) return bad('usage: git remote add <name> <url>', 129)
      if (name in repo.remotes) return bad(`error: remote ${name} already exists.`, 3)
      repo.remotes[name] = { url: absUrl(url), branches: {} }
      return ok()
    }
    case 'remove':
    case 'rm': {
      const name = rest[0] ?? ''
      if (!(name in repo.remotes)) return bad(`error: No such remote: '${name}'`, 2)
      delete repo.remotes[name]
      for (const [b, u] of Object.entries(repo.upstream)) if (u.startsWith(`${name}/`)) delete repo.upstream[b]
      return ok()
    }
    case 'get-url':
      return repo.remotes[rest[0] ?? ''] ? ok(repo.remotes[rest[0]!]!.url) : bad(`error: No such remote '${rest[0] ?? ''}'`, 2)
    case 'set-url': {
      const [name, url] = rest
      if (!name || !url || !repo.remotes[name]) return bad(`error: No such remote '${name ?? ''}'`, 2)
      repo.remotes[name]!.url = absUrl(url)
      return ok()
    }
    default:
      return bad(`error: unknown subcommand: ${sub}`, 129)
  }
}

function fetchRemote(g: G, name: string): { lines: string[] } | Res {
  const { s, repo } = g
  const rem = repo.remotes[name]
  if (!rem) return bad(`fatal: '${name}' does not appear to be a git repository\nfatal: Could not read from remote repository.`, 128)
  const from = remoteRepo(s, rem.url)
  if (isRes(from)) return from
  copyCommits(from, repo, [...Object.values(from.branches), ...Object.values(from.tags)])
  const lines: string[] = []
  for (const [b, id] of Object.entries(from.branches)) {
    if (!id) continue
    const was = rem.branches[b]
    if (was === id) continue
    lines.push(was ? `   ${was}..${id}  ${b.padEnd(10)} -> ${name}/${b}` : ` * [new branch]      ${b.padEnd(10)} -> ${name}/${b}`)
    rem.branches[b] = id
  }
  for (const b of Object.keys(rem.branches)) if (!from.branches[b]) delete rem.branches[b]
  for (const [t, id] of Object.entries(from.tags))
    if (!(t in repo.tags)) {
      repo.tags[t] = id
      if (from.tagNotes[t]) repo.tagNotes[t] = from.tagNotes[t]!
      lines.push(` * [new tag]         ${t.padEnd(10)} -> ${t}`)
    }
  return { lines: lines.length ? [`From ${rem.url}`, ...lines] : [] }
}

const gitFetch: GitFn = (g, args) => {
  const names = args.includes('--all') ? Object.keys(g.repo.remotes) : [args.find((a) => !a.startsWith('-')) ?? 'origin']
  const lines: string[] = []
  for (const n of names) {
    const r = fetchRemote(g, n)
    if (isRes(r)) return r
    lines.push(...r.lines)
  }
  return lines.length ? { code: 0, chunks: [[2, fromLines(lines)]] } : ok()
}

const gitPull: GitFn = (g, args) => {
  const { s, root, repo } = g
  if (repo.pending) return bad('error: Pulling is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use git add, then commit.', 128)
  if (repo.detached !== null) return bad('You are not currently on a branch.\nPlease specify which branch you want to merge with.', 1)
  const pos = args.filter((a) => !a.startsWith('-'))
  let remote = pos[0]
  let branch = pos[1]
  const up = repo.upstream[repo.branch]
  if (!remote) {
    if (!up) {
      return bad(
        `There is no tracking information for the current branch.\nPlease specify which branch you want to merge with.\n\n    git pull <remote> <branch>\n\nIf you wish to set tracking information for this branch you can do so with:\n\n    git branch --set-upstream-to=origin/${repo.branch} ${repo.branch}`,
        1,
      )
    }
    remote = up.split('/')[0]!
    branch = up.split('/').slice(1).join('/')
  }
  branch ??= up && up.startsWith(`${remote}/`) ? up.slice(remote.length + 1) : repo.branch
  if (dirty(s, root, repo)) return bad('error: cannot pull with uncommitted changes.\nPlease commit or stash them.', 128)
  const f = fetchRemote(g, remote)
  if (isRes(f)) return f
  const target = `${remote}/${branch}`
  const theirs = repo.remotes[remote]?.branches[branch]
  if (!theirs) return bad(`fatal: couldn't find remote ref ${branch}`, 128)
  const fetched: Chunk[] = f.lines.length ? [[2, fromLines(f.lines)]] : []
  const me = headId(repo)
  const diverged = me && !ancestors(repo, theirs).has(me) && !ancestors(repo, me).has(theirs)
  const cfg = repo.config['pull.rebase'] ?? s.gitConfig['pull.rebase']
  const ffCfg = repo.config['pull.ff'] ?? s.gitConfig['pull.ff']
  const rebase = args.includes('--rebase') || (!args.includes('--no-rebase') && cfg === 'true')
  const mergeIt = args.includes('--no-rebase') || cfg === 'false'
  const ffOnly = args.includes('--ff-only') || (!rebase && !mergeIt && ffCfg === 'only')
  if (diverged && !rebase && !mergeIt && !ffOnly)
    return {
      code: 128,
      chunks: [
        ...fetched,
        [
          2,
          'hint: You have divergent branches and need to specify how to reconcile them.\nhint: You can do so by running one of the following commands sometime before\nhint: your next pull:\nhint:\nhint:   git config pull.rebase false  # merge\nhint:   git config pull.rebase true   # rebase\nhint:   git config pull.ff only       # fast-forward only\nhint:\nhint: You can also pass --rebase, --no-rebase, or --ff-only on the command line.\nfatal: Need to specify how to reconcile divergent branches.\n',
        ],
      ],
    }
  const r = rebase ? gitRebase(g, [target]) : doMerge(g, target, { ffOnly, message: `Merge branch '${branch}' of ${repo.remotes[remote]!.url}`, label: target })
  return { ...r, chunks: [...fetched, ...r.chunks] }
}

const gitPush: GitFn = (g, args) => {
  const { s, repo } = g
  const setUp = args.includes('-u') || args.includes('--set-upstream')
  const force = args.includes('-f') || args.includes('--force')
  const lease = args.includes('--force-with-lease')
  const tags = args.includes('--tags')
  const del = args.includes('--delete') || args.includes('-d')
  const pos = args.filter((a) => !a.startsWith('-'))
  const up = repo.detached === null ? repo.upstream[repo.branch] : undefined
  let remote = pos[0]
  let refs = pos.slice(1)
  if (!remote) {
    if (!up) {
      if (repo.detached !== null) return bad('fatal: You are not currently on a branch.\nTo push the history leading to the current (detached HEAD)\nstate now, use\n\n    git push origin HEAD:<name-of-remote-branch>', 128)
      if (!Object.keys(repo.remotes).length) return bad("fatal: No configured push destination.\nEither specify the URL from the command-line or configure a remote repository using\n\n    git remote add <name> <url>\n\nand then push using the remote name\n\n    git push <name>", 128)
      return bad(`fatal: The current branch ${repo.branch} has no upstream branch.\nTo push the current branch and set the remote as upstream, use\n\n    git push --set-upstream origin ${repo.branch}\n`, 128)
    }
    remote = up.split('/')[0]!
    refs = [`${repo.branch}:${up.split('/').slice(1).join('/')}`]
  }
  const rem = repo.remotes[remote]
  if (!rem) return bad(`fatal: '${remote}' does not appear to be a git repository\nfatal: Could not read from remote repository.`, 128)
  const target = remoteRepo(s, rem.url)
  if (isRes(target)) return target
  if (!refs.length && !tags) {
    if (repo.detached !== null) return bad('fatal: You are not currently on a branch.', 128)
    if (!up && !setUp) return bad(`fatal: The current branch ${repo.branch} has no upstream branch.\nTo push the current branch and set the remote as upstream, use\n\n    git push --set-upstream ${remote} ${repo.branch}\n`, 128)
    refs = [repo.branch]
  }
  const lines = [`To ${rem.url}`]
  const errs: string[] = []
  for (const ref of refs) {
    const [src, dst = src] = ref.split(':') as [string, string | undefined]
    if (del) {
      if (!target.branches[src]) {
        errs.push(`error: unable to delete '${src}': remote ref does not exist`)
        continue
      }
      delete target.branches[src]
      delete rem.branches[src]
      lines.push(` - [deleted]         ${src}`)
      continue
    }
    if (src in repo.tags && !(src in repo.branches)) {
      copyCommits(repo, target, [repo.tags[src]])
      if (target.tags[src] === repo.tags[src]) {
        lines.push('Everything up-to-date')
        continue
      }
      target.tags[src] = repo.tags[src]!
      if (repo.tagNotes[src]) target.tagNotes[src] = repo.tagNotes[src]!
      lines.push(` * [new tag]         ${src} -> ${src}`)
      continue
    }
    const id = resolveRev(repo, src === 'HEAD' ? 'HEAD' : src)
    if (!id) {
      errs.push(`error: src refspec ${src} does not match any`)
      continue
    }
    const name = dst === 'HEAD' ? repo.branch : dst
    const theirs = target.branches[name] ?? null
    if (theirs === id) {
      lines.push('Everything up-to-date')
      if (setUp) repo.upstream[src === 'HEAD' ? repo.branch : src] = `${remote}/${name}`
      rem.branches[name] = id
      continue
    }
    const known = !!commitById(repo, theirs)
    const ff = !theirs || ancestors(repo, id).has(theirs)
    if (!ff && !force && !(lease && rem.branches[name] === theirs)) {
      lines.push(` ! [rejected]        ${src} -> ${name} (${known ? 'non-fast-forward' : 'fetch first'})`)
      errs.push(
        `error: failed to push some refs to '${rem.url}'`,
        known
          ? 'hint: Updates were rejected because the tip of your current branch is behind\nhint: its remote counterpart. Integrate the remote changes (e.g.\nhint: \'git pull ...\') before pushing again.'
          : "hint: Updates were rejected because the remote contains work that you do not\nhint: have locally. This is usually caused by another person pushing to\nhint: the same branch. Integrate the remote changes (e.g. 'git pull ...')\nhint: before pushing again.",
      )
      continue
    }
    if (lease && rem.branches[name] !== theirs && !force) {
      lines.push(` ! [rejected]        ${src} -> ${name} (stale info)`)
      errs.push(`error: failed to push some refs to '${rem.url}'`)
      continue
    }
    if (!target.bare && target.branch === name && target.detached === null) {
      lines.push(` ! [remote rejected] ${src} -> ${name} (branch is currently checked out)`)
      errs.push(`error: failed to push some refs to '${rem.url}' — push to a bare repository (git init --bare), which has no files checked out`)
      continue
    }
    copyCommits(repo, target, [id])
    target.branches[name] = id
    if (!target.branches[target.branch]) target.branch = name
    rem.branches[name] = id
    lines.push(theirs ? `${ff ? '  ' : ' +'} ${theirs}${ff ? '..' : '...'}${id}  ${src} -> ${name}${ff ? '' : ' (forced update)'}` : ` * [new branch]      ${src} -> ${name}`)
    if (setUp) {
      const b = src === 'HEAD' ? repo.branch : src
      repo.upstream[b] = `${remote}/${name}`
      lines.push(`branch '${b}' set up to track '${remote}/${name}'.`)
    }
  }
  if (tags)
    for (const [t, id] of Object.entries(repo.tags)) {
      if (target.tags[t] === id) continue
      copyCommits(repo, target, [id])
      target.tags[t] = id
      if (repo.tagNotes[t]) target.tagNotes[t] = repo.tagNotes[t]!
      lines.push(` * [new tag]         ${t} -> ${t}`)
    }
  return { code: errs.length ? 1 : 0, chunks: [[2, fromLines([...lines, ...errs])]] }
}

const GIT: Record<string, GitFn> = {
  status: gitStatus,
  add: gitAdd,
  rm: gitRm,
  commit: gitCommit,
  log: gitLog,
  show: gitShow,
  diff: gitDiff,
  restore: gitRestore,
  reset: gitReset,
  branch: gitBranch,
  switch: (g, a) => gitSwitch(g, a, 'switch'),
  checkout: (g, a) => gitSwitch(g, a, 'checkout'),
  merge: gitMerge,
  stash: gitStash,
  tag: gitTag,
  reflog: gitReflog,
  'cherry-pick': gitCherryPick,
  revert: gitRevert,
  rebase: gitRebase,
  bisect: gitBisect,
  blame: gitBlame,
  'ls-files': gitLsFiles,
  'check-ignore': gitCheckIgnore,
  remote: gitRemote,
  fetch: gitFetch,
  pull: gitPull,
  push: gitPush,
}

function hash(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0
  return h.toString(16).padStart(7, '0').slice(0, 7)
}

/* ── What Learn-mode checks read ─────────────────────────────────────────── */

/** The git facts Learn-mode checks read. */
export function gitInfo(
  s: ShellState,
  path: string,
): {
  commits: number
  branch: string
  detached: boolean
  head: string | null
  staged: string[]
  branches: string[]
  branchCommits: Record<string, number>
  branchMessages: Record<string, string[]>
  untracked: string[]
  modified: string[]
  merges: number
  messages: string[]
  tags: string[]
  stashes: number
  pending: Pending['kind'] | null
  conflicts: string[]
  bisecting: boolean
  upstream: Record<string, string>
  remotes: string[]
  tracked: string[]
  ignored: string[]
} | null {
  const raw = s.repos[path]
  if (!raw) return null
  const repo = normalizeRepo(raw)
  if (!(repo.bare ? lookup(s, path)?.kind === 'dir' : lookup(s, `${path}/.git`))) return null
  const work = repo.bare ? {} : workingTree(s, path)
  const index = indexTree(repo)
  const chain = logOrder(repo, ancestors(repo, headId(repo)))
  const rules = ignoreRules(s, path)
  const loose = Object.keys(work).filter((f) => !(f in index))
  return {
    commits: chain.length,
    branch: repo.branch,
    detached: repo.detached !== null,
    head: headId(repo),
    staged: [...Object.keys(repo.staged), ...repo.removed],
    branches: Object.keys(repo.branches),
    branchCommits: Object.fromEntries(Object.keys(repo.branches).map((b) => [b, ancestors(repo, repo.branches[b] ?? null).size])),
    branchMessages: Object.fromEntries(Object.keys(repo.branches).map((b) => [b, logOrder(repo, ancestors(repo, repo.branches[b] ?? null)).map((c) => c.message)])),
    untracked: loose.filter((f) => !ignoredBy(rules, f, false)).sort(),
    modified: Object.keys(index)
      .filter((f) => f in work && work[f] !== index[f])
      .sort(),
    merges: chain.filter((c) => c.parent2).length,
    messages: chain.map((c) => c.message),
    tags: Object.keys(repo.tags),
    stashes: repo.stash.length,
    pending: repo.pending?.kind ?? null,
    conflicts: [...(repo.pending?.conflicts ?? [])],
    bisecting: !!repo.bisect,
    upstream: { ...repo.upstream },
    remotes: Object.keys(repo.remotes),
    tracked: Object.keys(index).sort(),
    ignored: loose.filter((f) => !!ignoredBy(rules, f, false)).sort(),
  }
}

/** One commit, named any way git can name it (HEAD~1, main, v1.0, origin/main, an id). */
export function gitAt(
  s: ShellState,
  path: string,
  rev: string,
): { id: string; message: string; author: string; parents: string[]; tree: Record<string, string> } | null {
  const raw = s.repos[path]
  if (!raw) return null
  const repo = normalizeRepo(raw)
  const c = commitById(repo, resolveRev(repo, rev))
  if (!c) return null
  return { id: c.id, message: c.message, author: c.author ?? 'you', parents: [c.parent, c.parent2].filter((p): p is string => !!p), tree: { ...c.tree } }
}

/** Is `ancestor` in the history of `rev`? */
export function gitIsAncestor(s: ShellState, path: string, ancestor: string, rev: string): boolean {
  const raw = s.repos[path]
  if (!raw) return false
  const repo = normalizeRepo(raw)
  const a = resolveRev(repo, ancestor)
  return !!a && ancestors(repo, resolveRev(repo, rev)).has(a)
}

/** Paths matching a wildcard, relative to `cwd` — how `count` checks count files. */
export function globCount(s: ShellState, cwd: string, pattern: string): number {
  const st = { ...s, cwd }
  const hits = globPaths(st, { s: pattern, g: [...pattern].map(() => true), quoted: false })
  return hits.length
}

/** The commands this shell knows: an embed only offers to run lines made of these. */
export const COMMANDS = [
  'help', 'pwd', 'whoami', 'date', 'clear', 'history', 'echo', 'printf', 'cd', 'ls', 'mkdir', 'touch', 'cat', 'head', 'tail', 'wc',
  'grep', 'sort', 'uniq', 'cut', 'tr', 'tee', 'find', 'sed', 'xargs', 'basename', 'dirname', 'seq', 'rm', 'rmdir', 'cp', 'mv', 'chmod',
  'env', 'printenv', 'export', 'unset', 'set', 'read', 'exit', 'source', '.', 'bash', 'sh', 'test', '[', '[[', 'true', 'false', 'type',
  'which', 'git',
]
const GIT_SUBS = [
  'init', 'clone', 'config', 'status', 'add', 'rm', 'commit', 'log', 'show', 'diff', 'restore', 'reset', 'branch', 'checkout', 'switch',
  'merge', 'stash', 'tag', 'reflog', 'cherry-pick', 'revert', 'rebase', 'bisect', 'blame', 'ls-files', 'check-ignore', 'remote', 'fetch',
  'pull', 'push', '--version',
]

/**
 * Whether a line from a lesson could run here as written: every command in
 * it (pipes, loops and all) is one this shell knows, and for git a
 * subcommand it knows. A `$ ` prompt at the start is ignored; comments and
 * blank lines are fine. Each line must stand on its own.
 */
export function shellCanRun(text: string): boolean {
  const lines = commandLines(text)
  if (!lines.length) return false
  return lines.every((line) => {
    let ast: List
    try {
      ast = parse(tokenize(line))
    } catch {
      return false
    }
    const listOk = (list: List): boolean => list.every((ao) => [ao.first, ...ao.rest.map((r) => r.pipe)].every((p) => p.cmds.every(cmdOk)))
    const cmdOk = (c: Cmd): boolean => {
      if (c.type === 'for') return listOk(c.body)
      if (c.type === 'while') return listOk(c.cond) && listOk(c.body)
      if (c.type === 'if') return c.arms.every((a) => listOk(a.cond) && listOk(a.body)) && (!c.otherwise || listOk(c.otherwise))
      const words = c.words.filter((w) => !isAssignment(w)).map((w) => w.text)
      if (!words.length) return true
      const [name = '', sub = ''] = words
      if (!COMMANDS.includes(name) && !name.startsWith('./')) return false
      return name !== 'git' || GIT_SUBS.includes(sub)
    }
    return listOk(ast)
  })
}

/** A lesson's command lines, as they would be typed: prompts and comments dropped. */
export function commandLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.replace(/^\s*\$\s+/, '').trim())
    .filter((l) => l && !l.startsWith('#'))
}

const GIT_USAGE = `git, in the practice terminal (a real git has more, but these behave like it):

  start      init [--bare]   clone <folder> [dir]   config [--global] user.name "…"
  look       status [-s]   log [--oneline --graph --all] [A..B] [-n N]   show [rev | rev:file]
             diff [--staged] [rev [rev]]   blame <file>   reflog   ls-files   check-ignore -v <file>
  save       add <file | .>   rm [--cached] <file>   commit -m "…" [-a] [--amend]
  undo       restore [--staged] [--source=rev] <file>   reset [--soft|--mixed|--hard] <rev>
             revert <rev>   stash [push -m "…" | list | pop | apply | drop]
  branches   branch [-d|-D|-m|-a|-vv] [name]   switch [-c] <branch>   checkout <branch|rev|-- file>
             merge [--no-ff] <branch>   merge --abort   rebase <branch> (--continue|--skip|--abort)
             cherry-pick <rev> (--continue|--abort)   tag [-a name -m "…"] [rev]
  hunt       bisect start | good | bad | skip | run <cmd> | log | reset
  share      remote -v | add <name> <folder>   fetch   pull [--rebase|--no-rebase]   push [-u] [origin] [branch]

A remote here is a folder on this pretend computer (make one with git init --bare).`

export const HELP = `This is a practice terminal: a pretend computer that lives in this page, so
nothing you type here can touch your real files.

  pwd  ls [-a -l -1]  cd <dir>  mkdir [-p]  touch  cp [-r]  mv  rm [-r]  rmdir  chmod +x
  echo  printf  cat  head/tail -n N  wc [-l -w -c]  tee [-a]
  grep [-i -n -v -c -r -l -o -w -E] <pattern> [files]   find <dir> -name '*.txt' [-type f|d]
  sort [-n -r -u -k N -t ,]  uniq [-c -d]  cut -d , -f 2  tr a-z A-Z  sed 's/old/new/g'
  xargs <cmd>  basename  dirname  seq  history  clear  help  git (type git help)

The shell: pipes  a | b,  lists  a && b,  a || b,  a ; b,  redirection  > >> < 2> 2>&1
&> /dev/null,  variables  NAME=value  $NAME  "\${NAME}"  export NAME  $?,  $(command),
$((1 + 2)),  wildcards  * ? [abc],  quotes '…' (as typed) and "…" (with $ expanded),
for f in *.txt; do …; done   if [ -f x ]; then …; else …; fi   while …; do …; done
Scripts: bash [-x] script.sh args, or chmod +x script.sh then ./script.sh; source file.
set -x traces each command, set -e stops a script at the first failure.`
