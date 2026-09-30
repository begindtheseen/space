/* ============================================================================
   The practice terminal
   ----------------------------------------------------------------------------
   A shell that runs in the page: a small in-memory filesystem, a real (if
   small) shell language, the everyday Unix tools and enough of git to
   practise how teams really work. It is a simulation and says so: nothing
   here touches the real machine, and the terminal work the curriculum asks
   for (M1) still belongs in a real terminal. What it is for is learning what
   the commands mean somewhere nothing can break.

   The shell language, one line (or one script) at a time, as bash 5 runs it:
     - quoting ('…' literal, "…" expands, $'…' escapes), \ escapes, # comments
     - $VAR, ${VAR}, $?, $#, $1…$N, "$@", "$*", $(…), `…`, $((arithmetic)), ~,
       {a,b} and {1..5}, <(command), and wildcards * ? [abc] (sorted)
     - ${x:-d} ${x:=d} ${x:?msg} ${x:+alt} ${#x} ${x#p} ${x%p} ${x/p/r}
       ${x:1:2} ${x^^} ${!ref}, indexed and associative arrays
     - word splitting of unquoted expansions by IFS (the quoting bugs are real)
     - pipes |, lists ; && ||, ! negation, redirection > >> < 2> 2>> 2>&1 >&2
       &> <<EOF <<-EOF <<'EOF' <<<, /dev/null — and > empties its file before
       the command runs, as in bash, so `sort f > f` really loses f
     - NAME=value, export, local, declare, readonly, unset, set -x -e -u -E
       -o pipefail, set --, shift, shopt, trap (EXIT and ERR), getopts
     - for … in, for ((…)), while/until, if/elif/else, case, [[ ]], (( )),
       break/continue, functions with return, { …; } groups, ( … ) subshells
     - scripts: bash [-x] [-n] file args, bash -c, ./file (after chmod +x,
       through its #! line), source file; a script runs in a child shell
       that sees only exported variables, and its cd does not move you
     - exit codes everywhere: 0 is success, 1 failure, 2 misuse, 126 cannot
       execute, 127 not found

   Tools: pwd ls cd mkdir touch echo printf cat head tail wc grep sort uniq
   cut tr tee find sed awk jq paste join column xargs basename dirname seq
   rm rmdir cp mv chmod env mktemp read mapfile type which history clear,
   and git (awk, jq, sed and the table tools live in shell*.ts beside this).

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

import { runAwk } from './shellAwk'
import { runJq } from './shellJq'
import { fmtFloat, fmtInt, fmtStr, fmtUnsigned, parseCNumber, parseFormat, shellQuote, unescapeC } from './shellPrintf'
import { compileSed, runSedScript, SedError, type SedIO } from './shellSed'
import { runTable } from './shellTable'
import type { ToolIO, ToolResult } from './shellTools'

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
  /** cherry-pick -m N: replay a merge against its Nth parent. */
  mainline?: number
  /** cherry-pick -x: note where each copy came from. */
  recordOrigin?: boolean
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
  /** Where each branch has pointed, oldest first (branch@{n}). */
  branchLog: Record<string, { id: string; msg: string }[]>
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
  opts: { x?: boolean; e?: boolean; u?: boolean; pipefail?: boolean; E?: boolean; f?: boolean; nullglob?: boolean; failglob?: boolean; inherit_errexit?: boolean; extglob?: boolean; nocasematch?: boolean }
  /** git config --global */
  gitConfig: Record<string, string>
  /** The prompt's positional parameters ($0 $1 …, set with set --), arrays, functions, traps and readonly names. */
  args?: string[]
  arrays?: Record<string, { assoc?: true; v: Record<string, string> }>
  funcs?: Record<string, unknown>
  traps?: Record<string, string>
  ro?: string[]
  /** declare -i: assignments to these are arithmetic. */
  ints?: string[]
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
    vars: { ...DEFAULT_VARS, IFS: ' \t\n' },
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
    branchLog: {},
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
  s.args ??= ['bash']
  s.arrays ??= {}
  s.funcs ??= {}
  s.traps ??= {}
  s.ro ??= []
  s.ints ??= []
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
  /** $name, ${name[index]…}: `op`/`arg` for ${x:-y} ${x#y} ${x:1:2} and friends. */
  | { t: 'var'; name: string; q: boolean; index?: string; op?: string; arg?: string; len?: boolean; bang?: boolean }
  | { t: 'sub'; cmd: string; q: boolean }
  | { t: 'arith'; expr: string; q: boolean }
  /** <(command): process substitution, a file holding the command's output. */
  | { t: 'proc'; cmd: string; q: boolean }

type Op =
  | '&&' | '||' | '|' | ';' | '\n' | '&' | '(' | ')' | ';;' | ';&' | ';;&'
  | '>' | '>>' | '2>' | '2>>' | '2>&1' | '>&2' | '&>' | '&>>' | '<' | '<<' | '<<-' | '<<<'

/** A word (with its quoted and expandable parts) or an operator. */
export interface Token {
  text: string
  op?: Op
  parts?: Part[]
  line?: number
  /** The word as it was written, quotes and all. */
  raw?: string
  /** On a here-document's delimiter word: the document's text. */
  heredoc?: { parts: Part[] }
  /** ((…)): the arithmetic inside. */
  arith?: string
  /** name=(…): the words between the parentheses. */
  array?: Token[]
}

const REDIR_OPS: Op[] = ['>', '>>', '2>', '2>>', '2>&1', '>&2', '&>', '&>>', '<', '<<', '<<-', '<<<']

/** Where the `)` closing a `(` is (`from` is just after the `(`), skipping quotes; -1 if none. */
function matchParen(src: string, from: number): number {
  let depth = 1
  for (let j = from; j < src.length; j++) {
    const d = src[j]
    if (d === '\\') {
      j++
      continue
    }
    if (d === "'") {
      const c = src.indexOf("'", j + 1)
      if (c < 0) return -1
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
    else if (d === ')' && --depth === 0) return j
  }
  return -1
}

/** Where the `}` closing `${` is (`from` is just after the `{`); -1 if none. */
function matchBrace(src: string, from: number): number {
  let depth = 1
  for (let j = from; j < src.length; j++) {
    const d = src[j]
    if (d === '\\') {
      j++
      continue
    }
    if (d === "'" && depth > 1) {
      const c = src.indexOf("'", j + 1)
      if (c < 0) return -1
      j = c
      continue
    }
    if (d === '{') depth++
    else if (d === '}' && --depth === 0) return j
  }
  return -1
}

/** The inside of ${…}: ${#x} ${!x} ${x[i]} ${x:-y} ${x#y} ${x/a/b} ${x^^} ${x:1:2}… */
function braceVar(inner: string, raw: string, q: boolean): Part {
  const badSub = () => new Error(`${raw}: bad substitution`)
  if (/^[#!$?@*-]$/.test(inner)) return { t: 'var', name: inner, q }
  let k = 0
  let len = false
  let bang = false
  if (inner[0] === '#') {
    len = true
    k = 1
  } else if (inner[0] === '!') {
    bang = true
    k = 1
  }
  const m = /^(?:[A-Za-z_]\w*|\d+|[@*#?$!-])/.exec(inner.slice(k))
  if (!m) throw badSub()
  const name = m[0]
  k += name.length
  let index: string | undefined
  if (inner[k] === '[' && /^[A-Za-z_]/.test(name)) {
    let depth = 0
    let close = -1
    for (let j = k; j < inner.length; j++) {
      if (inner[j] === '[') depth++
      else if (inner[j] === ']' && --depth === 0) {
        close = j
        break
      }
    }
    if (close < 0) throw badSub()
    index = inner.slice(k + 1, close)
    k = close + 1
  }
  const rest = inner.slice(k)
  const base = { t: 'var' as const, name, q, ...(index !== undefined ? { index } : {}), ...(len ? { len } : {}), ...(bang ? { bang } : {}) }
  if (!rest) return base
  if (bang && (rest === '*' || rest === '@') && index === undefined) return { ...base, op: `!${rest}` }
  if (len) throw badSub()
  const om = /^(?::[-=?+]|[-=?+]|##?|%%?|\/[/#%]?|\^\^?|,,?|:)/.exec(rest)
  if (!om) throw badSub()
  return { ...base, op: om[0], arg: rest.slice(om[0].length) }
}

function dollar(src: string, i: number, q: boolean): { part: Part; raw: string; end: number } | null {
  if (src[i] === '`') {
    const close = src.indexOf('`', i + 1)
    if (close < 0) throw new Error('unterminated `')
    return { part: { t: 'sub', cmd: src.slice(i + 1, close).replace(/\\([`$\\])/g, '$1'), q }, raw: src.slice(i, close + 1), end: close + 1 }
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
    // $( (…) ): a command substitution that starts with a subshell.
    const close = matchParen(src, i + 2)
    if (close < 0) throw new Error('unterminated $((')
    return { part: { t: 'sub', cmd: src.slice(i + 2, close), q }, raw: src.slice(i, close + 1), end: close + 1 }
  }
  if (n === '(') {
    const close = matchParen(src, i + 2)
    if (close < 0) throw new Error('unterminated $(')
    return { part: { t: 'sub', cmd: src.slice(i + 2, close), q }, raw: src.slice(i, close + 1), end: close + 1 }
  }
  if (n === '{') {
    const close = matchBrace(src, i + 2)
    if (close < 0) throw new Error('unterminated ${')
    const raw = src.slice(i, close + 1)
    return { part: braceVar(src.slice(i + 2, close), raw, q), raw, end: close + 1 }
  }
  if (n && /[A-Za-z_]/.test(n)) {
    let j = i + 1
    while (j < src.length && /\w/.test(src[j]!)) j++
    return { part: { t: 'var', name: src.slice(i + 1, j), q }, raw: src.slice(i, j), end: j }
  }
  if (n && /[0-9?#@*$!-]/.test(n)) return { part: { t: 'var', name: n, q }, raw: `$${n}`, end: i + 2 }
  return null
}

/** Text in double quotes (or a here-document): only $, ` and \ are special; every part is quoted. */
function quotedParts(src: string, heredoc: boolean): Part[] {
  const parts: Part[] = []
  const lit = (s: string) => {
    const last = parts[parts.length - 1]
    if (last?.t === 'lit') last.s += s
    else parts.push({ t: 'lit', s, q: true })
  }
  for (let j = 0; j < src.length; j++) {
    const d = src[j]!
    if (d === '\\' && j + 1 < src.length && (heredoc ? '$`\\\n' : '$`"\\\n').includes(src[j + 1]!)) {
      if (src[j + 1] !== '\n') lit(src[j + 1]!)
      j++
      continue
    }
    if (d === '$' || d === '`') {
      const x = dollar(src, j, true)
      if (x) {
        parts.push(x.part)
        j = x.end - 1
        continue
      }
    }
    lit(d)
  }
  return parts
}

/** A word's text (not split on spaces): quotes removed, expansions found. `dq`: it sits inside double quotes. */
function wordParts(src: string, dq: boolean): Part[] {
  if (dq) return quotedParts(src, false)
  const parts: Part[] = []
  const lit = (s: string, q: boolean) => {
    const last = parts[parts.length - 1]
    if (last?.t === 'lit' && last.q === q) last.s += s
    else parts.push({ t: 'lit', s, q })
  }
  for (let j = 0; j < src.length; j++) {
    const d = src[j]!
    if (d === '\\' && j + 1 < src.length) {
      lit(src[++j]!, true)
      continue
    }
    if (d === "'") {
      const c = src.indexOf("'", j + 1)
      if (c < 0) {
        lit(src.slice(j), false)
        break
      }
      lit(src.slice(j + 1, c), true)
      j = c
      continue
    }
    if (d === '"') {
      let k = j + 1
      while (k < src.length && src[k] !== '"') k += src[k] === '\\' ? 2 : 1
      const inner = quotedParts(src.slice(j + 1, k), false)
      if (!inner.length) lit('', true)
      parts.push(...inner)
      j = k
      continue
    }
    if (d === '$' || d === '`') {
      const x = dollar(src, j, false)
      if (x) {
        parts.push(x.part)
        j = x.end - 1
        continue
      }
    }
    lit(d, false)
  }
  return parts
}

/** Splits a command line into words and operators, keeping quoted text together. */
export function tokenize(src: string): Token[] {
  const out: Token[] = []
  let parts: Part[] = []
  let text = ''
  let has = false
  let line = 1
  let start = 0
  let array: Token[] | null = null
  // Here-documents wait for the end of the line; [[ … =~ regex ]] reads its regex specially.
  let wantDelim: '<<' | '<<-' | null = null
  const pending: { tok: Token; strip: boolean }[] = []
  let inCond = false
  let reMode = false
  let reDepth = 0
  const lit = (str: string, q: boolean) => {
    const last = parts[parts.length - 1]
    if (last && last.t === 'lit' && last.q === q) last.s += str
    else parts.push({ t: 'lit', s: str, q })
    text += str
    has = true
  }
  const end = (at: number) => {
    if (has) {
      const tok: Token = { text, parts, line, raw: src.slice(start, at), ...(array ? { array } : {}) }
      out.push(tok)
      if (wantDelim) {
        pending.push({ tok, strip: wantDelim === '<<-' })
        wantDelim = null
      }
      const plain = parts.length === 1 && parts[0]!.t === 'lit' && !parts[0]!.q
      if (reMode) reMode = false
      else if (plain && text === '[[') inCond = true
      else if (plain && text === ']]') inCond = false
      else if (inCond && plain && text === '=~') {
        reMode = true
        reDepth = 0
      }
    }
    parts = []
    text = ''
    has = false
    array = null
  }
  const op = (o: Op, at: number) => {
    end(at)
    out.push({ text: o, op: o, line })
    if (o === '<<' || o === '<<-') wantDelim = o
  }
  /** Reads the bodies of the here-documents started on the line that just ended. */
  const bodies = (from: number): number => {
    let pos = from
    for (const { tok, strip } of pending) {
      const delim = (tok.parts ?? []).map((p) => (p.t === 'lit' ? p.s : '')).join('')
      const quoted = (tok.parts ?? []).some((p) => p.t === 'lit' && p.q)
      let body = ''
      while (pos < src.length) {
        const nl = src.indexOf('\n', pos)
        const rawLine = nl < 0 ? src.slice(pos) : src.slice(pos, nl)
        pos = nl < 0 ? src.length : nl + 1
        line++
        const l = strip ? rawLine.replace(/^\t+/, '') : rawLine
        if (l === delim) break
        body += `${l}\n`
      }
      tok.heredoc = { parts: quoted ? [{ t: 'lit', s: body, q: true }] : quotedParts(body, true) }
    }
    pending.length = 0
    return pos
  }
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!
    if (!has) start = i
    if (c === '\n') {
      op('\n', i)
      line++
      if (pending.length) i = bodies(i + 1) - 1
      continue
    }
    if (reMode && has && reDepth > 0 && (c === ' ' || c === '\t')) {
      lit(c, false)
      continue
    }
    if (c === ' ' || c === '\t' || c === '\r') {
      end(i)
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
    if (c === '$' && src[i + 1] === "'") {
      // $'…': ANSI-C quoting, \n and \t as the characters.
      let j = i + 2
      while (j < src.length && src[j] !== "'") j += src[j] === '\\' ? 2 : 1
      if (j >= src.length) throw new Error('unterminated quote')
      lit(unescapeC(src.slice(i + 2, j), true).text, true)
      i = j
      continue
    }
    if (c === '"' || (c === '$' && src[i + 1] === '"')) {
      if (c === '$') i++
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
        line += x.raw.split('\n').length - 1
        i = x.end - 1
        continue
      }
    }
    if (reMode && '()|<>&'.includes(c)) {
      if (c === '(') reDepth++
      if (c === ')') reDepth--
      lit(c, false)
      continue
    }
    if (c === '(') {
      // name=(a b c): an array.
      if (has && parts.length === 1 && parts[0]!.t === 'lit' && !parts[0]!.q && /^[A-Za-z_]\w*(\[[^\]]*\])?\+?=$/.test(parts[0]!.s)) {
        const close = matchParen(src, i + 1)
        if (close < 0) throw new Error('unterminated (')
        const inner = src.slice(i + 1, close)
        array = tokenize(inner).filter((t) => !t.op)
        text += src.slice(i, close + 1)
        line += inner.split('\n').length - 1
        i = close
        continue
      }
      // ((…)): arithmetic, when it closes with )).
      if (!has && src[i + 1] === '(') {
        let depth = 0
        let close = -1
        for (let j = i + 2; j < src.length; j++) {
          if (src[j] === '(') depth++
          else if (src[j] === ')') {
            if (depth > 0) depth--
            else {
              if (src[j + 1] === ')') close = j
              break
            }
          }
        }
        if (close > 0) {
          end(i)
          out.push({ text: src.slice(i, close + 2), arith: src.slice(i + 2, close), line, raw: src.slice(i, close + 2) })
          i = close + 1
          continue
        }
      }
      op('(', i)
      continue
    }
    if (c === ')') {
      op(')', i)
      continue
    }
    if (c === '<' && src[i + 1] === '(' && !has) {
      const close = matchParen(src, i + 2)
      if (close < 0) throw new Error('unterminated <(')
      parts.push({ t: 'proc', cmd: src.slice(i + 2, close), q: false })
      text += src.slice(i, close + 1)
      has = true
      i = close
      continue
    }
    const ahead = src.slice(i, i + 4)
    if (!has) {
      if (ahead.startsWith('2>&1')) {
        op('2>&1', i)
        i += 3
        continue
      }
      if (ahead.startsWith('2>>')) {
        op('2>>', i)
        i += 2
        continue
      }
      if (ahead.startsWith('2>')) {
        op('2>', i)
        i += 1
        continue
      }
      if (ahead.startsWith('1>&2')) {
        op('>&2', i)
        i += 3
        continue
      }
      if (ahead.startsWith('1>>')) {
        op('>>', i)
        i += 2
        continue
      }
      if (ahead.startsWith('1>')) {
        op('>', i)
        i += 1
        continue
      }
    }
    const two = src.slice(i, i + 2)
    if (ahead.startsWith('>&2')) {
      op('>&2', i)
      i += 2
      continue
    }
    if (ahead.startsWith('&>>')) {
      op('&>>', i)
      i += 2
      continue
    }
    if (ahead.startsWith('<<<')) {
      op('<<<', i)
      i += 2
      continue
    }
    if (ahead.startsWith('<<-')) {
      op('<<-', i)
      i += 2
      continue
    }
    if (ahead.startsWith(';;&')) {
      op(';;&', i)
      i += 2
      continue
    }
    if (two === '&>' || two === '&&' || two === '||' || two === '>>' || two === '<<' || two === ';;' || two === ';&') {
      op(two, i)
      i += 1
      continue
    }
    if (c === '>' || c === '<' || c === '|' || c === ';' || c === '&') {
      op(c, i)
      continue
    }
    lit(c, false)
  }
  end(src.length)
  if (pending.length) for (const p of pending) p.tok.heredoc = { parts: [] }
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
/** for ((init; test; step)) */
interface CForCmd {
  type: 'cfor'
  init: string
  test: string
  step: string
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
interface CaseCmd {
  type: 'case'
  word: Token
  arms: { patterns: Token[]; body: List; end: ';;' | ';&' | ';;&' }[]
  redirs: Redir[]
  line: number
}
/** { …; } runs here; ( … ) in a subshell. */
interface GroupCmd {
  type: 'group' | 'subshell'
  body: List
  redirs: Redir[]
  line: number
}
/** [[ … ]]: the words and operators between the brackets. */
interface CondCmd {
  type: 'cond'
  words: Token[]
  redirs: Redir[]
  line: number
}
/** (( … )) */
interface ArithCmd {
  type: 'arith'
  expr: string
  redirs: Redir[]
  line: number
}
/** name() { …; }: defining a function. */
interface FuncCmd {
  type: 'func'
  name: string
  body: Cmd
  redirs: Redir[]
  line: number
}
type Cmd = SimpleCmd | ForCmd | CForCmd | IfCmd | WhileCmd | CaseCmd | GroupCmd | CondCmd | ArithCmd | FuncCmd
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

const CASE_ENDS: Op[] = [';;', ';&', ';;&']

function parse(tokens: Token[]): List {
  let i = 0
  const peek = (): Token | undefined => tokens[i]
  const lineAt = () => peek()?.line ?? tokens[tokens.length - 1]?.line ?? 1
  const fail = (msg: string): never => {
    throw new ParseError(msg, lineAt())
  }
  const near = (t: Token | undefined) => fail(t ? `syntax error near unexpected token \`${t.op === '\n' ? 'newline' : t.text}'` : 'syntax error: unexpected end of file')
  const kw = (t: Token | undefined, ...words: string[]): boolean =>
    !!t && !t.op && !t.arith && !t.array && t.parts?.length === 1 && t.parts[0]!.t === 'lit' && !t.parts[0]!.q && words.includes(t.parts[0]!.s)
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
  const startsCommand = (t: Token | undefined) => !!t && (!t.op || REDIR_OPS.includes(t.op) || t.op === '(')

  function list(stops: string[], opStops: Op[] = []): List {
    const items: AndOr[] = []
    for (;;) {
      skipSeps()
      const t = peek()
      if (!t || kw(t, ...stops) || (t.op && opStops.includes(t.op))) break
      if (!startsCommand(t)) near(t)
      items.push(andOr())
      const n = peek()
      if (!n) break
      if (isSep(n) || n.op === '&') {
        i++
        continue
      }
      if (kw(n, ...stops) || (n.op && opStops.includes(n.op))) break
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
      if (!startsCommand(peek())) near(peek())
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
      if (!startsCommand(peek())) near(peek())
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

  /** The body of a loop: do … done. */
  function doDone(what: string): List {
    skipSeps()
    expect('do', `write it as: ${what}; do …; done`)
    const body = list(['done'])
    expect('done', 'every loop ends with done')
    return body
  }

  function command(): Cmd {
    const t = peek()
    const line = lineAt()
    if (t?.op === '(') {
      i++
      const body = list([], [')'])
      if (peek()?.op !== ')') near(peek())
      i++
      return { type: 'subshell', body, redirs: trailingRedirs(), line }
    }
    if (t?.arith !== undefined) {
      i++
      return { type: 'arith', expr: t.arith, redirs: trailingRedirs(), line }
    }
    if (kw(t, '{')) {
      i++
      const body = list(['}'])
      expect('}', 'a { group } ends with } (after a ; or a new line)')
      return { type: 'group', body, redirs: trailingRedirs(), line }
    }
    if (kw(t, '[[')) {
      i++
      const words: Token[] = []
      while (peek() && !kw(peek(), ']]')) {
        if (peek()!.op === '\n' || peek()!.op === ';') near(peek())
        words.push(tokens[i++]!)
      }
      expect(']]', '[[ needs a closing ]]')
      return { type: 'cond', words, redirs: trailingRedirs(), line }
    }
    if (kw(t, 'function')) {
      i++
      const name = peek()
      if (!name || name.op) near(name)
      i++
      if (peek()?.op === '(' && tokens[i + 1]?.op === ')') i += 2
      skipNewlines()
      return { type: 'func', name: name!.text, body: command(), redirs: [], line }
    }
    if (t && !t.op && tokens[i + 1]?.op === '(' && tokens[i + 2]?.op === ')' && /^[A-Za-z_][\w.:-]*$/.test(t.text) && t.parts?.every((p) => p.t === 'lit' && !p.q)) {
      i += 3
      skipNewlines()
      const body = command()
      return { type: 'func', name: t.text, body, redirs: [], line }
    }
    if (kw(t, 'for')) {
      i++
      const head = peek()
      if (head?.arith !== undefined) {
        i++
        const parts = head.arith.split(';')
        if (parts.length !== 3) fail('syntax error: for (( … )) needs three parts, as in: for ((i=0; i<3; i++))')
        return { type: 'cfor', init: parts[0]!, test: parts[1]!, step: parts[2]!, body: doDone('for ((…))'), redirs: trailingRedirs(), line }
      }
      const name = head
      if (!name || name.op || !/^[A-Za-z_]\w*$/.test(name.text)) fail('syntax error: for needs a variable name, as in: for f in *.txt; do …; done')
      i++
      let items: Token[] | null = null
      skipNewlines()
      if (kw(peek(), 'in')) {
        i++
        items = []
        while (peek() && !peek()!.op) items.push(tokens[i++]!)
      }
      return { type: 'for', name: name!.text, items, body: doDone('for x in a b c'), redirs: trailingRedirs(), line }
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
    if (kw(t, 'case')) {
      i++
      const word = peek()
      if (!word || word.op) near(word)
      i++
      skipNewlines()
      expect('in', 'write it as: case "$x" in pattern) …;; esac')
      const arms: CaseCmd['arms'] = []
      for (;;) {
        skipSeps()
        if (kw(peek(), 'esac')) break
        if (peek()?.op === '(') i++
        const patterns: Token[] = []
        for (;;) {
          const p = peek()
          if (!p || p.op) near(p)
          patterns.push(p!)
          i++
          if (peek()?.op === '|') {
            i++
            continue
          }
          break
        }
        if (peek()?.op !== ')') near(peek())
        i++
        const body = list(['esac'], CASE_ENDS)
        const e = peek()
        let endOp: CaseCmd['arms'][number]['end'] = ';;'
        if (e?.op && CASE_ENDS.includes(e.op)) {
          endOp = e.op as typeof endOp
          i++
        } else if (!kw(e, 'esac')) near(e)
        arms.push({ patterns, body, end: endOp })
      }
      expect('esac', 'every case ends with esac')
      return { type: 'case', word: word!, arms, redirs: trailingRedirs(), line }
    }
    if (kw(t, 'do', 'done', 'then', 'elif', 'else', 'fi', 'esac', '}', 'in')) near(t)
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
  /** `exit` was run (or set -e fired): stop the script (or subshell) here. */
  exit?: boolean
  /** The exit came from an error the shell cannot go on after (set -u, ${x:?}). */
  fatal?: boolean
  /** break / continue N loops, or return from a function. */
  flow?: { k: 'break' | 'continue'; n: number } | { k: 'return' }
  /** An expansion went wrong (bad arithmetic, say): bash drops the rest of that line. */
  abort?: boolean
}

/** An indexed array (keys 0, 1, …) or, with `assoc`, an associative one. */
interface Arr {
  assoc?: true
  v: Record<string, string>
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
  arrays: Record<string, Arr>
  funcs: Record<string, Cmd>
  traps: Record<string, string>
  /** readonly names */
  ro: string[]
  /** declare -i names */
  ints: string[]
  /** bash -c: set -u and friends end it with 127, as bash does. */
  dashc?: boolean
  /** getopts: the letter it is at inside a group like -vc, and the OPTIND it saw last. */
  optpos?: number
  optind?: number
}

/** A variable as it was before `local` hid it. */
interface Saved {
  v?: string
  a?: Arr
  exp: boolean
}

interface Ctx {
  s: ShellState
  scope: Scope
  depth: number
  budget: { left: number; blown: boolean }
  status: number
  /** Inside an if/while test, before && or ||, or after !: set -e does not apply. */
  cond: boolean
  /** What each function call hid with `local`, restored when it returns. */
  frames: Map<string, Saved>[]
  loops: number
  /** $LINENO and $BASH_COMMAND */
  line: number
  command: string
  /** FUNCNAME, innermost first. */
  funcs: string[]
  /** How many `source`d files deep: return works there too. */
  sourced: number
  inTrap: boolean
  /** Is standard output the screen (ls prints columns) rather than a pipe or file? */
  tty: boolean
}

/** Text piped into a command; commands that read it take what they need. */
type Stdin = { buf: string } | null

const MAX_COMMANDS = 5000
const MAX_LOOP = 1000
const MAX_FUNC_DEPTH = 200

const out = (text: string, code = 0): Res => ({ code, chunks: text ? [[1, text]] : [] })
/** One line (or several) of output, without the final newline. */
const ok = (text = ''): Res => out(text ? `${text}\n` : '')
const bad = (msg: string, code = 1): Res => ({ code, chunks: msg ? [[2, `${msg}\n`]] : [] })
const stdoutOf = (r: Res) => r.chunks.filter((c) => c[0] === 1).map((c) => c[1]).join('')

/** set -u, ${x:?}: an error that ends a script. */
class Fatal extends Error {}
/** Bad arithmetic, a bad substitution: the command does not run and the rest of the line is dropped. */
class Abort extends Error {}

function topScope(s: ShellState): Scope {
  return { vars: s.vars, exported: s.exported, args: s.args!, opts: s.opts, name: null, top: true, arrays: s.arrays!, funcs: s.funcs as Record<string, Cmd>, traps: s.traps!, ro: s.ro!, ints: s.ints! }
}

function newCtx(s: ShellState, scope: Scope, status: number): Ctx {
  return { s, scope, depth: 0, budget: { left: MAX_COMMANDS, blown: false }, status, cond: false, frames: [], loops: 0, line: 0, command: '', funcs: [], sourced: 0, inTrap: false, tty: true }
}

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
    const ctx = newCtx(s, topScope(s), s.status)
    res = execList(ctx, ast, null, false, true)
    if (res.exit && !res.fatal) {
      // A real shell would run its EXIT trap now, then close.
      res = finish(ctx, res)
      res.chunks.push([2, 'exit: this practice terminal stays open (a real one would close now).\n'])
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res = err instanceof ParseError || /^unterminated|bad substitution/.test(msg) ? bad(`bash: ${msg}`, 2) : bad(`practice terminal: something went wrong running that (${msg}).`, 1)
  }

  let text = ''
  let clear = false
  let lastFd = 0
  for (const [fd, t] of res.chunks) {
    if (fd === 0) {
      clear = true
      text = ''
      continue
    }
    if (!t) continue
    // Output runs on as it would in a terminal; an error after unfinished output starts its own line.
    text += (text && !text.endsWith('\n') && fd !== lastFd ? '\n' : '') + t
    lastFd = fd
  }
  const shown = text.replace(/\n$/, '')
  s.status = res.code
  s.transcript.push({ cmd: trimmed, out: shown })
  return { state: s, out: shown, ...(clear ? { clear } : {}) }
}

const lineOfAndOr = (ao: AndOr) => ao.first.cmds[0]?.line ?? 0

/**
 * Runs a list of commands. `quiet`: it is a test (if, while), so set -e does
 * not apply. `top`: the script's (or the line's) own list, where an
 * expansion error drops only the rest of its line.
 */
function execList(ctx: Ctx, list: List, stdin: Stdin, quiet = false, top = false): Res {
  const chunks: Chunk[] = []
  let code = ctx.status
  let dropLine = -1
  const wasCond = ctx.cond
  if (quiet) ctx.cond = true
  try {
    for (const ao of list) {
      if (ctx.budget.blown) break
      if (dropLine >= 0 && lineOfAndOr(ao) === dropLine) continue
      const r = execAndOr(ctx, ao, stdin)
      chunks.push(...r.chunks)
      code = r.code
      ctx.status = code
      if (r.abort && top) {
        dropLine = lineOfAndOr(ao)
        continue
      }
      if (r.exit || r.errexit) return { code, chunks, exit: true, ...(r.fatal ? { fatal: true } : {}) }
      if (r.flow) return { code, chunks, flow: r.flow }
      if (r.abort) return { code, chunks, abort: true }
    }
  } finally {
    ctx.cond = wasCond
  }
  return { code, chunks }
}

/** `a && b || c`. With set -e, a failure that is not being tested stops a script. */
function execAndOr(ctx: Ctx, ao: AndOr, stdin: Stdin): Res & { errexit?: boolean } {
  const wasCond = ctx.cond
  const n = ao.rest.length
  const runPipe = (p: Pipeline, isLast: boolean): Res => {
    ctx.cond = wasCond || !isLast || p.negate
    try {
      return execPipeline(ctx, p, stdin)
    } finally {
      ctx.cond = wasCond
    }
  }
  let r = runPipe(ao.first, n === 0)
  const chunks = [...r.chunks]
  let last = n === 0 && !ao.first.negate
  ctx.status = r.code
  for (let k = 0; k < n && !r.exit && !r.flow && !r.abort; k++) {
    const { op, pipe } = ao.rest[k]!
    if ((op === '&&') === (r.code === 0)) {
      r = runPipe(pipe, k === n - 1)
      chunks.push(...r.chunks)
      ctx.status = r.code
      last = k === n - 1 && !pipe.negate
    } else last = false
  }
  const failed = !ctx.cond && last && r.code !== 0 && !r.exit && !r.flow && !r.abort
  if (failed && !ctx.inTrap && ctx.scope.traps.ERR && (!ctx.funcs.length || ctx.scope.opts.E)) chunks.push(...runTrap(ctx, 'ERR', r.code).chunks)
  const errexit = failed && !!ctx.scope.opts.e && !ctx.scope.top
  return { code: r.code, chunks, ...(r.exit ? { exit: true } : {}), ...(r.fatal ? { fatal: true } : {}), ...(r.flow ? { flow: r.flow } : {}), ...(r.abort ? { abort: true } : {}), ...(errexit ? { errexit } : {}) }
}

/** A trap's commands, run with $? set to `status`. */
function runTrap(ctx: Ctx, sig: string, status: number): Res {
  const text = ctx.scope.traps[sig]
  if (!text) return { code: status, chunks: [] }
  const was = { status: ctx.status, cond: ctx.cond, inTrap: ctx.inTrap }
  ctx.status = status
  ctx.cond = false
  ctx.inTrap = true
  let r: Res
  try {
    r = execList(ctx, parse(tokenize(text)), null, false, true)
  } catch (e) {
    r = bad(`${where(ctx, ctx.line)}${(e as Error).message}`, 2)
  }
  ctx.cond = was.cond
  ctx.inTrap = was.inTrap
  if (!r.exit) ctx.status = was.status
  return r
}

/** The shell is ending (a script, bash -c, a subshell): run its EXIT trap, if it has one. */
function finish(ctx: Ctx, r: Res): Res {
  if (!ctx.scope.traps.EXIT) return r
  const tr = runTrap(ctx, 'EXIT', r.code)
  delete ctx.scope.traps.EXIT
  return { code: tr.exit ? tr.code : r.code, chunks: [...r.chunks, ...tr.chunks] }
}

function subshell(ctx: Ctx): Ctx {
  const sc = ctx.scope
  return {
    ...ctx,
    scope: { ...sc, vars: { ...sc.vars }, exported: [...sc.exported], args: [...sc.args], opts: { ...sc.opts }, top: false, arrays: clone(sc.arrays), funcs: { ...sc.funcs }, traps: {}, ro: [...sc.ro], ints: [...sc.ints] },
    frames: [],
  }
}

function execPipeline(ctx: Ctx, p: Pipeline, stdin: Stdin): Res {
  let r: Res
  let codes: number[]
  if (p.cmds.length === 1) {
    r = execCmd(ctx, p.cmds[0]!, stdin, ctx.tty)
    codes = [r.code]
  } else {
    // Every part of a pipeline runs in a subshell: variables set there (and
    // cd) do not come back, exactly as in bash.
    const chunks: Chunk[] = []
    codes = []
    let input: Stdin = stdin
    for (let k = 0; k < p.cmds.length; k++) {
      const lastOne = k === p.cmds.length - 1
      const sub = subshell(ctx)
      const [cwd, prev] = [ctx.s.cwd, ctx.s.prev]
      const part = execCmd(sub, p.cmds[k]!, input, lastOne && ctx.tty)
      ctx.s.cwd = cwd
      ctx.s.prev = prev
      codes.push(part.code)
      if (lastOne) chunks.push(...part.chunks)
      else {
        chunks.push(...part.chunks.filter((c) => c[0] !== 1))
        input = { buf: stdoutOf(part) }
      }
      if (ctx.budget.blown) break
    }
    const failed = [...codes].reverse().find((c) => c !== 0)
    r = { code: ctx.scope.opts.pipefail && failed !== undefined ? failed : codes[codes.length - 1]!, chunks }
  }
  ctx.scope.arrays.PIPESTATUS = { v: Object.fromEntries(codes.map((c, i) => [String(i), String(c)])) }
  return p.negate ? { ...r, code: r.code === 0 ? 1 : 0 } : r
}

type Dest = { k: 'pass'; fd: 1 | 2 } | { k: 'file'; path: string } | { k: 'null' }

function execCmd(ctx: Ctx, cmd: Cmd, stdin: Stdin, tty: boolean): Res {
  const s = ctx.s
  const table: Record<1 | 2, Dest> = { 1: { k: 'pass', fd: 1 }, 2: { k: 'pass', fd: 2 } }
  let input = stdin
  const pre: Chunk[] = []
  const rx = expander(ctx, pre)
  const fail = (msg: string): Res => {
    rx.cleanup()
    return { code: 1, chunks: [...pre, [2, `${where(ctx, cmd.line)}${msg}\n`]] }
  }
  for (const r of cmd.redirs) {
    if (r.op === '2>&1') {
      table[2] = table[1]
      continue
    }
    if (r.op === '>&2') {
      table[1] = table[2]
      continue
    }
    if (r.op === '<<' || r.op === '<<-') {
      try {
        input = { buf: rx.expandParts(r.target!.heredoc?.parts ?? [], { split: false, glob: false }).join('') }
      } catch (e) {
        return { ...fail((e as Error).message), ...(e instanceof Abort ? { abort: true } : {}) }
      }
      continue
    }
    let target: string
    try {
      if (r.op === '<<<') {
        input = { buf: `${rx.word(r.target!)}\n` }
        continue
      }
      const words = rx.expand(r.target!, { glob: false })
      if (words.length !== 1) return fail(`${r.target!.text}: ambiguous redirect`)
      target = words[0]!
    } catch (e) {
      if (e instanceof Fatal) return { ...fail(e.message), exit: true, fatal: true, code: ctx.scope.dashc ? 127 : 1 }
      return { ...fail((e as Error).message), ...(e instanceof Abort ? { abort: true } : {}) }
    }
    const abs = resolve(s.cwd, target)
    if (r.op === '<') {
      if (abs === '/dev/null') {
        input = { buf: '' }
        continue
      }
      const node = lookup(s, abs)
      if (!node) return fail(`${target}: No such file or directory`)
      if (node.kind === 'dir') return fail(`${target}: Is a directory`)
      input = { buf: node.content }
      continue
    }
    let dest: Dest = { k: 'null' }
    if (abs !== '/dev/null') {
      if (abs === '/dev/stderr' || abs === '/dev/stdout') {
        const d = table[abs === '/dev/stderr' ? 2 : 1]
        if (r.op === '>' || r.op === '>>') table[1] = d
        else if (r.op === '&>' || r.op === '&>>') table[1] = table[2] = d
        else table[2] = d
        continue
      }
      const append = r.op === '>>' || r.op === '2>>' || r.op === '&>>'
      // > empties the file before the command even starts.
      const node = lookup(s, abs)
      const err = append && node?.kind === 'file' ? null : writeFile(s, abs, '', false)
      if (err) return fail(err.replace(/^bash: /, ''))
      dest = { k: 'file', path: abs }
    }
    if (r.op === '>' || r.op === '>>') table[1] = dest
    else if (r.op === '&>' || r.op === '&>>') table[1] = table[2] = dest
    else table[2] = dest
  }

  const innerTty = tty && table[1].k === 'pass' && table[1].fd === 1
  let r: Res
  const wasTty = ctx.tty
  ctx.tty = innerTty
  switch (cmd.type) {
    case 'simple':
      r = execSimple(ctx, cmd, input, innerTty)
      break
    case 'for':
      r = execFor(ctx, cmd, input)
      break
    case 'cfor':
      r = execCFor(ctx, cmd, input)
      break
    case 'while':
      r = execWhile(ctx, cmd, input)
      break
    case 'if':
      r = execIf(ctx, cmd, input)
      break
    case 'case':
      r = execCase(ctx, cmd, input)
      break
    case 'group':
      r = execList(ctx, cmd.body, input)
      break
    case 'subshell': {
      const sub = subshell(ctx)
      const [cwd, prev] = [s.cwd, s.prev]
      const got = finish(sub, execList(sub, cmd.body, input))
      s.cwd = cwd
      s.prev = prev
      r = { code: got.code, chunks: got.chunks }
      break
    }
    case 'cond':
      r = execCond(ctx, cmd)
      break
    case 'arith':
      r = execArith(ctx, cmd.expr, cmd.line)
      break
    case 'func':
      ctx.scope.funcs[cmd.name] = cmd.body
      r = { code: 0, chunks: [] }
      break
  }
  ctx.tty = wasTty
  rx.cleanup()

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

/** What a loop does after one pass of its body: go on, stop, or hand a break/return/exit up. */
function loopStep(r: Res, code: number, chunks: Chunk[]): 'next' | 'stop' | Res {
  if (r.flow?.k === 'break') return r.flow.n > 1 ? { code, chunks, flow: { k: 'break', n: r.flow.n - 1 } } : 'stop'
  if (r.flow?.k === 'continue') return r.flow.n > 1 ? { code, chunks, flow: { k: 'continue', n: r.flow.n - 1 } } : 'next'
  if (r.flow) return { code, chunks, flow: r.flow }
  if (r.exit) return { code, chunks, exit: true, ...(r.fatal ? { fatal: true } : {}) }
  if (r.abort) return { code, chunks, abort: true }
  return 'next'
}

function body(ctx: Ctx, list: List, stdin: Stdin): Res {
  ctx.loops++
  try {
    return execList(ctx, list, stdin)
  } finally {
    ctx.loops--
  }
}

function execFor(ctx: Ctx, cmd: ForCmd, stdin: Stdin): Res {
  const pre: Chunk[] = []
  let items: string[]
  try {
    const x = expander(ctx, pre)
    items = cmd.items ? cmd.items.flatMap((t) => x.expand(t, { brace: true })) : ctx.scope.args.slice(1)
  } catch (e) {
    return expansionFailed(ctx, e, pre, cmd.line)
  }
  const chunks: Chunk[] = [...pre]
  let code = 0
  for (const item of items) {
    if (ctx.budget.blown) break
    const err = setVar(ctx, cmd.name, item)
    if (err) return { code: 1, chunks: [...chunks, [2, `${where(ctx, cmd.line)}${err}\n`]] }
    const r = body(ctx, cmd.body, stdin)
    chunks.push(...r.chunks)
    code = r.code
    const step = loopStep(r, code, chunks)
    if (step === 'stop') break
    if (step !== 'next') return step
  }
  return { code, chunks }
}

function execCFor(ctx: Ctx, cmd: CForCmd, stdin: Stdin): Res {
  const chunks: Chunk[] = []
  let code = 0
  const pre: Chunk[] = []
  const x = expander(ctx, pre)
  try {
    if (cmd.init.trim()) x.arith(cmd.init)
    for (let n = 0; ; n++) {
      if (ctx.budget.blown) break
      if (n >= MAX_LOOP) {
        chunks.push([2, `${where(ctx, cmd.line)}stopped the loop after ${MAX_LOOP} rounds — the practice terminal guards against loops that never end\n`])
        return { code: 1, chunks }
      }
      if (cmd.test.trim() && x.arith(cmd.test) === 0) break
      const r = body(ctx, cmd.body, stdin)
      chunks.push(...r.chunks)
      code = r.code
      const step = loopStep(r, code, chunks)
      if (step === 'stop') break
      if (step !== 'next') return step
      if (cmd.step.trim()) x.arith(cmd.step)
    }
  } catch (e) {
    const r = expansionFailed(ctx, e, pre, cmd.line)
    return { ...r, chunks: [...chunks, ...r.chunks] }
  }
  return { code, chunks: [...pre, ...chunks] }
}

function execWhile(ctx: Ctx, cmd: WhileCmd, stdin: Stdin): Res {
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
    if (c.exit || c.flow || c.abort) {
      const step = loopStep(c, c.code, chunks)
      if (step === 'stop') break
      if (step !== 'next') return step
      continue
    }
    if ((c.code === 0) === cmd.until) break
    const r = body(ctx, cmd.body, stdin)
    chunks.push(...r.chunks)
    code = r.code
    const step = loopStep(r, code, chunks)
    if (step === 'stop') break
    if (step !== 'next') return step
  }
  return { code, chunks }
}

function execIf(ctx: Ctx, cmd: IfCmd, stdin: Stdin): Res {
  const chunks: Chunk[] = []
  for (const arm of cmd.arms) {
    const c = execList(ctx, arm.cond, stdin, true)
    chunks.push(...c.chunks)
    if (c.exit || c.flow || c.abort) return { ...c, chunks }
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

function execCase(ctx: Ctx, cmd: CaseCmd, stdin: Stdin): Res {
  const pre: Chunk[] = []
  const x = expander(ctx, pre)
  let word: string
  try {
    word = x.word(cmd.word)
  } catch (e) {
    return expansionFailed(ctx, e, pre, cmd.line)
  }
  const chunks: Chunk[] = [...pre]
  let code = 0
  let falling = false
  for (let k = 0; k < cmd.arms.length; k++) {
    const arm = cmd.arms[k]!
    let hit = falling
    if (!hit) {
      try {
        hit = arm.patterns.some((p) => patternRegex(x.pattern(p)).test(word))
      } catch (e) {
        return expansionFailed(ctx, e, chunks, cmd.line)
      }
    }
    if (!hit) continue
    const r = execList(ctx, arm.body, stdin)
    chunks.push(...r.chunks)
    code = r.code
    if (r.exit || r.flow || r.abort) return { ...r, chunks }
    if (arm.end === ';;') break
    falling = arm.end === ';&'
  }
  return { code, chunks }
}

/** An expansion error, as the command's result: set -u ends the script, bad arithmetic drops the line. */
function expansionFailed(ctx: Ctx, e: unknown, pre: Chunk[], line: number): Res {
  const msg = (e as Error).message
  const chunks: Chunk[] = [...pre, [2, `${where(ctx, line)}${msg}\n`]]
  if (e instanceof Fatal) return { code: ctx.scope.dashc ? 127 : 1, chunks, exit: true, fatal: true }
  if (e instanceof Abort) return { code: 1, chunks, abort: true }
  return { code: 1, chunks }
}

/* ── [[ … ]] ─────────────────────────────────────────────────────────────── */

const COND_UNARY = ['-e', '-a', '-f', '-d', '-s', '-r', '-w', '-x', '-z', '-n', '-L', '-h', '-v', '-o', '-p', '-b', '-c', '-S', '-t', '-g', '-u', '-k', '-O', '-G', '-N']
const COND_BINARY = ['==', '=', '!=', '=~', '<', '>', '-eq', '-ne', '-lt', '-le', '-gt', '-ge', '-nt', '-ot', '-ef']

function execCond(ctx: Ctx, cmd: CondCmd): Res {
  const pre: Chunk[] = []
  const x = expander(ctx, pre)
  const w = cmd.words
  let k = 0
  const opText = (t: Token | undefined): string | null => {
    if (!t) return null
    if (t.op) return t.op
    const p = t.parts
    return p?.length === 1 && p[0]!.t === 'lit' && !p[0]!.q ? p[0]!.s : null
  }
  type Ev = () => boolean
  const primary = (): Ev => {
    const t = w[k]
    if (!t) throw new Error("syntax error in conditional expression: unexpected token `]]'")
    if (t.op === '(') {
      k++
      const e = orExpr()
      if (w[k]?.op !== ')') throw new Error("syntax error in conditional expression: expected `)'")
      k++
      return e
    }
    const u = opText(t)
    if (u && COND_UNARY.includes(u) && w[k + 1] && !COND_BINARY.includes(opText(w[k + 1]) ?? '')) {
      const arg = w[k + 1]!
      k += 2
      return () => {
        const v = x.word(arg)
        if (u === '-v') return isSet(ctx, v)
        if (u === '-o') return !!(ctx.scope.opts as Record<string, boolean | undefined>)[v]
        return fileTest(ctx, u, v)
      }
    }
    if (t.op) throw new Error(`syntax error in conditional expression: unexpected token \`${t.op}'`)
    const left = t
    k++
    const b = opText(w[k])
    if (b && COND_BINARY.includes(b) && w[k + 1] && !w[k + 1]!.op) {
      const right = w[k + 1]!
      k += 2
      return () => condBinary(ctx, x, x.word(left), b, right)
    }
    return () => x.word(left) !== ''
  }
  const notExpr = (): Ev => {
    if (opText(w[k]) === '!' && !w[k]!.op) {
      k++
      const e = notExpr()
      return () => !e()
    }
    return primary()
  }
  const andExpr = (): Ev => {
    let e = notExpr()
    while (w[k]?.op === '&&') {
      k++
      const l = e
      const r = notExpr()
      e = () => l() && r()
    }
    return e
  }
  const orExpr = (): Ev => {
    let e = andExpr()
    while (w[k]?.op === '||') {
      k++
      const l = e
      const r = andExpr()
      e = () => l() || r()
    }
    return e
  }
  if (ctx.scope.opts.x) pre.push([2, `+ [[ ${w.map((t) => t.raw ?? t.text).join(' ')} ]]\n`])
  try {
    const e = orExpr()
    if (k < w.length) throw new Error(`syntax error in conditional expression: unexpected token \`${w[k]!.text}'`)
    return { code: e() ? 0 : 1, chunks: pre }
  } catch (e) {
    if (e instanceof CondRegexError) return { code: 2, chunks: pre }
    const r = expansionFailed(ctx, e, pre, cmd.line)
    return e instanceof Fatal || e instanceof Abort ? r : { ...r, code: 2 }
  }
}

class CondRegexError extends Error {}

function condBinary(ctx: Ctx, x: Expander, a: string, op: string, right: Token): boolean {
  switch (op) {
    case '==':
    case '=':
      return patternRegex(x.pattern(right)).test(a)
    case '!=':
      return !patternRegex(x.pattern(right)).test(a)
    case '=~': {
      const f = x.pattern(right)
      let src = ''
      for (let i = 0; i < f.s.length; i++) src += f.g[i] ? f.s[i] : f.s[i]!.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
      let re: RegExp
      try {
        re = new RegExp(posixClasses(src))
      } catch {
        throw new CondRegexError('bad regex')
      }
      const m = re.exec(a)
      ctx.scope.arrays.BASH_REMATCH = { v: m ? Object.fromEntries([...m].map((g, i) => [String(i), g ?? ''])) : {} }
      return !!m
    }
    case '<':
      return a < x.word(right)
    case '>':
      return a > x.word(right)
    case '-nt':
    case '-ot':
    case '-ef': {
      const b = x.word(right)
      const na = lookup(ctx.s, resolve(ctx.s.cwd, a))
      const nb = lookup(ctx.s, resolve(ctx.s.cwd, b))
      if (op === '-ef') return !!na && na === nb
      return op === '-nt' ? !!na && !nb : !na && !!nb
    }
    default: {
      const l = evalArith(a, ctx)
      const r = evalArith(x.word(right), ctx)
      return op === '-eq' ? l === r : op === '-ne' ? l !== r : op === '-lt' ? l < r : op === '-le' ? l <= r : op === '-gt' ? l > r : l >= r
    }
  }
}

/** Is a variable (or array element, `a[k]`) set? For [[ -v … ]]. */
function isSet(ctx: Ctx, ref: string): boolean {
  const m = /^([A-Za-z_]\w*)(?:\[(.*)\])?$/.exec(ref)
  if (!m) return /^\d+$/.test(ref) ? ctx.scope.args[Number(ref)] !== undefined : false
  const a = ctx.scope.arrays[m[1]!]
  if (m[2] === undefined) return a ? a.v['0'] !== undefined : ctx.scope.vars[m[1]!] !== undefined
  if (!a) return false
  if (m[2] === '@' || m[2] === '*') return Object.keys(a.v).length > 0
  return a.v[a.assoc ? m[2] : String(evalArith(m[2], ctx))] !== undefined
}

/** (( expr )): true (0) when the value is not zero. */
function execArith(ctx: Ctx, expr: string, line: number): Res {
  const pre: Chunk[] = []
  ctx.line = line
  try {
    const x = expander(ctx, pre)
    if (ctx.scope.opts.x) pre.push([2, `+ (( ${expr.trim()} ))\n`])
    return { code: x.arith(expr) !== 0 ? 0 : 1, chunks: pre }
  } catch (e) {
    const r = expansionFailed(ctx, e, pre, line)
    return { ...r, abort: false }
  }
}

/* ── Simple commands, assignments, functions ─────────────────────────────── */

/** NAME=value, NAME+=value, NAME[i]=value, NAME=(…). */
interface Assign {
  name: string
  index?: Part[]
  append: boolean
  value: Part[]
  array?: Token[]
}

type Atom = { c: string; q: boolean } | { part: Part }

function atomsOf(parts: Part[]): Atom[] {
  return parts.flatMap((p): Atom[] => (p.t === 'lit' ? [...p.s].map((c) => ({ c, q: p.q })) : [{ part: p }]))
}

function partsOfAtoms(atoms: Atom[]): Part[] {
  const out: Part[] = []
  for (const a of atoms) {
    if ('part' in a) {
      out.push(a.part)
      continue
    }
    const last = out[out.length - 1]
    if (last?.t === 'lit' && last.q === a.q) last.s += a.c
    else out.push({ t: 'lit', s: a.c, q: a.q })
  }
  return out
}

const isChar = (a: Atom | undefined, c: string) => !!a && 'c' in a && !a.q && a.c === c

/** The word as an assignment, or null when it is not one. `keyed`: [key]=value inside ( ). */
function asAssignment(t: Token, keyed = false): Assign | null {
  const parts = t.parts
  if (!parts?.length) return null
  const first = parts[0]!
  if (first.t !== 'lit' || first.q) return null
  if (!keyed && !/^[A-Za-z_]/.test(first.s)) return null
  if (keyed && !first.s.startsWith('[')) return null
  const atoms = atomsOf(parts)
  let k = 0
  if (!keyed) while (k < atoms.length && 'c' in atoms[k]! && !(atoms[k] as { q: boolean }).q && /\w/.test((atoms[k] as { c: string }).c)) k++
  const name = atoms
    .slice(0, k)
    .map((a) => (a as { c: string }).c)
    .join('')
  let index: Part[] | undefined
  if (isChar(atoms[k], '[')) {
    let depth = 1
    let j = k + 1
    for (; j < atoms.length; j++) {
      if (isChar(atoms[j], '[')) depth++
      else if (isChar(atoms[j], ']') && --depth === 0) break
    }
    if (j >= atoms.length) return null
    index = partsOfAtoms(atoms.slice(k + 1, j))
    k = j + 1
  } else if (keyed) return null
  let append = false
  if (isChar(atoms[k], '+') && isChar(atoms[k + 1], '=')) {
    append = true
    k++
  }
  if (!isChar(atoms[k], '=')) return null
  return { name, ...(index ? { index } : {}), append, value: partsOfAtoms(atoms.slice(k + 1)), ...(t.array ? { array: t.array } : {}) }
}

function isAssignment(t: Token): boolean {
  return asAssignment(t) !== null
}

/** A word as bash would show it in a trace: quoted when it has spaces. */
function shq(w: string): string {
  return w === '' ? "''" : /[^\w@%+=:,./~-]/.test(w) ? `'${w.replace(/'/g, `'\\''`)}'` : w
}

const readonlyMsg = (name: string) => `${name}: readonly variable`

/** Sets a plain variable (element 0, if it is an array). An error message when it cannot. */
function setVar(ctx: Ctx, name: string, value: string): string | null {
  const sc = ctx.scope
  if (sc.ro.includes(name)) return readonlyMsg(name)
  const a = sc.arrays[name]
  if (a) a.v['0'] = value
  else sc.vars[name] = value
  return null
}

function arrayKeys(a: Arr): string[] {
  return a.assoc ? Object.keys(a.v) : Object.keys(a.v).sort((p, q) => Number(p) - Number(q))
}

/** The key an index names: its text for an associative array, its arithmetic value for an indexed one. */
function keyOf(ctx: Ctx, a: Arr | undefined, index: string): string {
  if (a?.assoc) return index
  let n = evalArith(index, ctx)
  if (n < 0 && a) {
    const keys = arrayKeys(a)
    n += keys.length ? Number(keys[keys.length - 1]) + 1 : 0
    if (n < 0) throw new Abort(`${index}: bad array subscript`)
  }
  return String(n)
}

/** Carries out one assignment (the value is expanded here). */
function assign(ctx: Ctx, x: Expander, a: Assign): string | null {
  const sc = ctx.scope
  if (sc.ro.includes(a.name)) return readonlyMsg(a.name)
  if (a.array) {
    const existing = sc.arrays[a.name]
    const assoc = !!existing?.assoc
    const target: Arr = a.append && existing ? existing : { ...(assoc ? { assoc: true as const } : {}), v: {} }
    if (!existing && a.append && sc.vars[a.name] !== undefined) target.v['0'] = sc.vars[a.name]!
    const keys = arrayKeys(target)
    let next = assoc ? 0 : keys.length ? Number(keys[keys.length - 1]) + 1 : 0
    for (const t of a.array) {
      const kv = asAssignment(t, true)
      if (kv?.index) {
        const key = assoc ? x.expandParts(kv.index, { split: false, glob: false }).join('') : keyOf(ctx, target, x.expandParts(kv.index, { split: false, glob: false }).join(''))
        const value = x.expandParts(kv.value, { split: false, glob: false }).join('')
        target.v[key] = kv.append ? (target.v[key] ?? '') + value : value
        if (!assoc) next = Number(key) + 1
        continue
      }
      if (assoc) return `${a.name}: ${t.text}: must use subscript when assigning associative array`
      for (const v of x.expand(t, { brace: true })) target.v[String(next++)] = v
    }
    sc.arrays[a.name] = target
    delete sc.vars[a.name]
    return null
  }
  let value = x.expandParts(a.value, { split: false, glob: false }).join('')
  if (sc.ints.includes(a.name)) value = String(evalArith(a.append ? `${readVar(ctx, a.name) || 0}+(${value || 0})` : value || '0', ctx))
  if (a.index) {
    let arr = sc.arrays[a.name]
    const idx = x.expandParts(a.index, { split: false, glob: false }).join('')
    if (!arr) {
      arr = { v: {} }
      if (sc.vars[a.name] !== undefined) arr.v['0'] = sc.vars[a.name]!
      sc.arrays[a.name] = arr
      delete sc.vars[a.name]
    }
    const key = keyOf(ctx, arr, idx)
    arr.v[key] = a.append ? (arr.v[key] ?? '') + value : value
    return null
  }
  const arr = sc.arrays[a.name]
  if (arr) arr.v['0'] = a.append ? (arr.v['0'] ?? '') + value : value
  else sc.vars[a.name] = a.append ? (sc.vars[a.name] ?? '') + value : value
  return null
}

/** `local x`: remember x as it is, to put it back when the function returns. */
function makeLocal(ctx: Ctx, name: string): void {
  const frame = ctx.frames[ctx.frames.length - 1]
  if (!frame || frame.has(name)) return
  const sc = ctx.scope
  frame.set(name, { ...(sc.vars[name] !== undefined ? { v: sc.vars[name] } : {}), ...(sc.arrays[name] ? { a: clone(sc.arrays[name]!) } : {}), exp: sc.exported.includes(name) })
}

function restoreFrame(sc: Scope, frame: Map<string, Saved>): void {
  for (const [name, saved] of frame) {
    if (saved.v === undefined) delete sc.vars[name]
    else sc.vars[name] = saved.v
    if (saved.a) sc.arrays[name] = saved.a
    else delete sc.arrays[name]
    const i = sc.exported.indexOf(name)
    if (saved.exp && i < 0) sc.exported.push(name)
    if (!saved.exp && i >= 0) sc.exported.splice(i, 1)
  }
}

const DECLARERS = ['declare', 'typeset', 'local', 'export', 'readonly']

function execSimple(ctx: Ctx, cmd: SimpleCmd, stdin: Stdin, tty: boolean): Res {
  if (--ctx.budget.left < 0) {
    ctx.budget.blown = true
    return bad(`bash: stopped after ${MAX_COMMANDS} commands in one go — the practice terminal guards against runaway loops`, 1)
  }
  if (!ctx.inTrap) {
    ctx.line = cmd.line
    ctx.command = cmd.words.map((w) => w.raw ?? w.text).join(' ')
  }
  const pre: Chunk[] = []
  const x = expander(ctx, pre)
  const assigns: Assign[] = []
  let argv: string[]
  let decl: { name: string; flags: string[]; items: DeclItem[] } | null = null
  try {
    let k = 0
    for (; k < cmd.words.length; k++) {
      const a = asAssignment(cmd.words[k]!)
      if (!a) break
      assigns.push(a)
    }
    const rest = cmd.words.slice(k)
    const head = rest[0]
    if (head && DECLARERS.includes(head.text) && head.parts?.length === 1 && head.parts[0]!.t === 'lit' && !head.parts[0]!.q) {
      decl = { name: head.text, flags: [], items: [] }
      for (const w of rest.slice(1)) {
        const a = asAssignment(w)
        if (a) {
          decl.items.push({ name: a.name, assign: a, raw: w.text })
          continue
        }
        for (const word of x.expand(w, { brace: true })) {
          if (/^[-+][a-zA-Z]+$/.test(word) && !decl.items.length) decl.flags.push(word)
          else decl.items.push({ name: word, assign: null, raw: word })
        }
      }
      argv = [head.text]
    } else argv = rest.flatMap((w) => x.expand(w, { brace: true }))
  } catch (e) {
    x.cleanup()
    return expansionFailed(ctx, e, pre, cmd.line)
  }
  const trace = (shownArgv: string[], values: string[]) => {
    if (!ctx.scope.opts.x) return
    const shown = [...values, ...shownArgv.map(shq)].join(' ')
    if (shown) pre.push([2, `+ ${shown}\n`])
  }
  if (!argv.length) {
    const shown: string[] = []
    for (const a of assigns) {
      let err: string | null
      try {
        err = assign(ctx, x, a)
      } catch (e) {
        x.cleanup()
        return expansionFailed(ctx, e, pre, cmd.line)
      }
      if (err) {
        x.cleanup()
        return { code: 1, chunks: [...pre, [2, `${where(ctx, cmd.line)}${err}\n`]], abort: true }
      }
      if (ctx.scope.opts.x) shown.push(a.array ? `${a.name}=(${a.array.map((t) => t.raw ?? t.text).join(' ')})` : `${a.name}${a.index ? '[…]' : ''}=${shq(a.index ? '' : ctx.scope.vars[a.name] ?? readVar(ctx, a.name) ?? '')}`)
    }
    trace([], shown)
    x.cleanup()
    return { code: x.subStatus ?? 0, chunks: pre }
  }
  // NAME=value cmd: the variable exists (exported) for that one command.
  const sc = ctx.scope
  const saved = assigns.map((a) => [a.name, sc.vars[a.name], sc.exported.includes(a.name)] as const)
  const shownAssigns: string[] = []
  for (const a of assigns) {
    try {
      sc.vars[a.name] = x.expandParts(a.value, { split: false, glob: false }).join('')
    } catch (e) {
      x.cleanup()
      return expansionFailed(ctx, e, pre, cmd.line)
    }
    shownAssigns.push(`${a.name}=${shq(sc.vars[a.name]!)}`)
    if (!sc.exported.includes(a.name)) sc.exported.push(a.name)
  }
  let r: Res
  if (decl) {
    trace([decl.name, ...decl.flags, ...decl.items.map((d) => d.raw)], shownAssigns)
    r = declareCmd(ctx, x, decl.name, decl.flags, decl.items, cmd.line)
  } else {
    trace(argv, shownAssigns)
    const fn = sc.funcs[argv[0]!]
    r = fn ? callFunction(ctx, argv[0]!, fn, argv, stdin, tty) : dispatch(ctx, argv, stdin, tty, cmd.line)
  }
  for (const [n, v, was] of saved) {
    if (v === undefined) delete sc.vars[n]
    else sc.vars[n] = v
    if (!was && sc.exported.includes(n)) sc.exported.splice(sc.exported.indexOf(n), 1)
  }
  x.cleanup()
  return { ...r, chunks: [...pre, ...r.chunks] }
}

function callFunction(ctx: Ctx, name: string, fn: Cmd, argv: string[], stdin: Stdin, tty: boolean): Res {
  if (ctx.funcs.length >= MAX_FUNC_DEPTH) return { ...bad(`${where(ctx, ctx.line)}${name}: maximum function nesting level exceeded (${MAX_FUNC_DEPTH})`), exit: true, fatal: true }
  const sc = ctx.scope
  const savedArgs = sc.args
  sc.args = [savedArgs[0]!, ...argv.slice(1)]
  const frame = new Map<string, Saved>()
  ctx.frames.push(frame)
  ctx.funcs.unshift(name)
  let r: Res
  try {
    r = execCmd(ctx, fn, stdin, tty)
  } finally {
    ctx.funcs.shift()
    ctx.frames.pop()
    restoreFrame(sc, frame)
    sc.args = savedArgs
  }
  if (r.flow?.k === 'return') return { code: r.code, chunks: r.chunks }
  return r
}

/* ── Expansion: variables, $(…), $((…)), ~, {a,b}, splitting, wildcards ──── */

interface Field {
  s: string
  /** Per character: may it act as a wildcard? (Quoted characters may not.) */
  g: boolean[]
  quoted: boolean
  /** A field that stays even when empty ("", or an empty field between two IFS separators like :). */
  keep?: boolean
  /** "$@" with nothing in it: the word disappears. */
  atEmpty?: boolean
}

type VarPart = Extract<Part, { t: 'var' }>
type Expander = ReturnType<typeof expander>

/** A variable's value, arrays and the shell's own variables included (not $1, $? and such). */
function readVar(ctx: Ctx, name: string): string | undefined {
  switch (name) {
    case 'PWD':
      return ctx.s.cwd
    case 'OLDPWD':
      return ctx.s.prev
    case 'LINENO':
      return String(ctx.line)
    case 'BASH_COMMAND':
      return ctx.command
    case 'RANDOM':
      return String(Math.floor(Math.random() * 32768))
    case 'SECONDS':
      return '0'
    case 'BASHPID':
      return '4242'
  }
  const a = arrayOf(ctx, name)
  if (a) return a.v['0']
  return ctx.scope.vars[name]
}

/** The array a name holds, including FUNCNAME and BASH_SOURCE, which the shell keeps itself. */
function arrayOf(ctx: Ctx, name: string): Arr | undefined {
  if (name === 'FUNCNAME') return ctx.funcs.length ? { v: Object.fromEntries([...ctx.funcs, ...(ctx.scope.name ? ['main'] : [])].map((f, i) => [String(i), f])) } : undefined
  if (name === 'BASH_SOURCE') return ctx.scope.name && ctx.scope.name !== 'bash' ? { v: { 0: ctx.scope.name } } : undefined
  return ctx.scope.arrays[name]
}

/** Splits text at IFS characters: whitespace in IFS runs together, other IFS characters each end a field. */
function ifsPieces(v: string, ifs: string): { lead: boolean; pieces: string[]; trail: boolean } {
  const isWs = (c: string) => (c === ' ' || c === '\t' || c === '\n') && ifs.includes(c)
  const isN = (c: string) => ifs.includes(c) && !isWs(c)
  let i = 0
  let lead = false
  while (i < v.length && isWs(v[i]!)) {
    i++
    lead = true
  }
  const pieces: string[] = []
  let cur = ''
  let trail = false
  while (i < v.length) {
    const c = v[i]!
    if (isWs(c) || isN(c)) {
      let j = i
      while (j < v.length && isWs(v[j]!)) j++
      if (j < v.length && isN(v[j]!)) {
        j++
        while (j < v.length && isWs(v[j]!)) j++
      }
      pieces.push(cur)
      cur = ''
      i = j
      if (i >= v.length) trail = true
      continue
    }
    cur += c
    i++
  }
  if (!trail) pieces.push(cur)
  return { lead, pieces, trail }
}

/** {a,b,c} and {1..5}: the alternatives, or null when the braces are not an expansion. */
function braceAlternatives(s: string): { start: number; end: number; alts: string[] } | null {
  for (let st = s.indexOf('{'); st >= 0; st = s.indexOf('{', st + 1)) {
    let depth = 0
    const commas: number[] = []
    let end = -1
    for (let j = st; j < s.length; j++) {
      const c = s[j]
      if (c === '{') depth++
      else if (c === '}' && --depth === 0) {
        end = j
        break
      } else if (c === ',' && depth === 1) commas.push(j)
    }
    if (end < 0) return null
    const inner = s.slice(st + 1, end)
    if (commas.length) {
      const alts: string[] = []
      let from = st + 1
      for (const c of [...commas, end]) {
        alts.push(s.slice(from, c))
        from = c + 1
      }
      return { start: st, end, alts }
    }
    let m = /^(-?\d+)\.\.(-?\d+)(?:\.\.(-?\d+))?$/.exec(inner)
    if (m) {
      const a = Number(m[1])
      const b = Number(m[2])
      let step = Math.abs(Number(m[3] ?? 1)) || 1
      const width = /^-?0\d/.test(m[1]!) || /^-?0\d/.test(m[2]!) ? Math.max(m[1]!.length, m[2]!.length) : 0
      const alts: string[] = []
      if (a > b) step = -step
      for (let v = a; step > 0 ? v <= b : v >= b; v += step) {
        alts.push(width ? (v < 0 ? `-${String(-v).padStart(width - 1, '0')}` : String(v).padStart(width, '0')) : String(v))
        if (alts.length > 10000) break
      }
      return { start: st, end, alts }
    }
    m = /^([A-Za-z])\.\.([A-Za-z])(?:\.\.(-?\d+))?$/.exec(inner)
    if (m) {
      const a = m[1]!.charCodeAt(0)
      const b = m[2]!.charCodeAt(0)
      let step = Math.abs(Number(m[3] ?? 1)) || 1
      if (a > b) step = -step
      const alts: string[] = []
      for (let v = a; step > 0 ? v <= b : v >= b; v += step) alts.push(String.fromCharCode(v))
      return { start: st, end, alts }
    }
  }
  return null
}

/** Brace expansion over a word's parts: only unquoted text takes part. */
function braceExpand(parts: Part[], depth = 0): Part[][] {
  if (depth > 20) return [parts]
  for (let pi = 0; pi < parts.length; pi++) {
    const p = parts[pi]!
    if (p.t !== 'lit' || p.q || !p.s.includes('{')) continue
    const hit = braceAlternatives(p.s)
    if (!hit) continue
    const before = p.s.slice(0, hit.start)
    const after = p.s.slice(hit.end + 1)
    return hit.alts.flatMap((alt) => braceExpand([...parts.slice(0, pi), { t: 'lit', s: before + alt + after, q: false }, ...parts.slice(pi + 1)], depth + 1))
  }
  return [parts]
}

function expander(ctx: Ctx, pre: Chunk[]) {
  const sc = () => ctx.scope
  const self = {
    subStatus: undefined as number | undefined,
    /** Files made for <(…), removed once the command is done. */
    temps: [] as string[],
    ifs(): string {
      const v = sc().vars.IFS
      return v === undefined ? ' \t\n' : v
    },
    /** $1, $?, $x, ${a[2]}: one value, or undefined when it is not set. */
    scalar(name: string, index?: string): string | undefined {
      const s = sc()
      if (index !== undefined) {
        const a = arrayOf(ctx, name)
        if (!a) return keyOf(ctx, undefined, self.indexText(index, false)) === '0' ? self.scalar(name) : undefined
        return a.v[keyOf(ctx, a, self.indexText(index, !!a.assoc))]
      }
      switch (name) {
        case '?':
          return String(ctx.status)
        case '#':
          return String(s.args.length - 1)
        case '@':
        case '*':
          return s.args.slice(1).join(' ')
        case '$':
          return '4242'
        case '!':
          return s.vars['!'] ?? ''
        case '-':
          return `${s.opts.e ? 'e' : ''}h${s.opts.u ? 'u' : ''}${s.opts.x ? 'x' : ''}B`
      }
      if (/^\d+$/.test(name)) return s.args[Number(name)]
      return readVar(ctx, name)
    },
    /** The text inside [ ]: a key (associative arrays) or arithmetic (indexed ones). */
    indexText(index: string, assoc: boolean): string {
      return assoc ? self.expandParts(wordParts(index, false), { split: false, glob: false }).join('') : self.expandParts(quotedParts(index, false), { split: false, glob: false }).join('')
    },
    /** "$@", ${a[@]}, ${!a[@]}: the list, or null when the part is a single value. */
    list(p: VarPart): string[] | null {
      const s = sc()
      if (p.index === undefined && (p.name === '@' || p.name === '*')) return s.args.slice(1)
      if (p.index !== '@' && p.index !== '*') return null
      const a = arrayOf(ctx, p.name)
      if (p.bang) return a ? arrayKeys(a) : s.vars[p.name] !== undefined ? ['0'] : []
      if (a) return arrayKeys(a).map((k) => a.v[k]!)
      const v = s.vars[p.name]
      return v === undefined ? [] : [v]
    },
    /** A ${…} argument (the default in ${x:-default}), expanded. */
    argText(p: VarPart): string {
      return self.expandParts(wordParts(p.arg ?? '', p.q), { split: false, glob: false }).join('')
    },
    /** A variable part's value: a string, or a list for "$@" and "${a[@]}". */
    value(p: VarPart): string | string[] {
      const s = sc()
      if (p.op === '!*' || p.op === '!@') {
        return [...new Set([...Object.keys(s.vars), ...Object.keys(s.arrays)])].filter((n) => n.startsWith(p.name)).sort()
      }
      if (p.bang && p.index !== '@' && p.index !== '*') {
        const target = self.scalar(p.name) ?? ''
        const m = /^([A-Za-z_]\w*|\d+|[@*#?])(?:\[(.*)\])?$/.exec(target)
        if (!m) throw new Abort(`${target || p.name}: invalid indirect expansion`)
        return self.value({ ...p, bang: false, name: m[1]!, ...(m[2] !== undefined ? { index: m[2] } : {}) } as VarPart)
      }
      const lst = self.list(p)
      const ref = p.index !== undefined ? `${p.name}[${p.index}]` : /^\d+$/.test(p.name) ? `$${p.name}` : p.name
      const unbound = () => {
        if (s.opts.u && !lst) throw new Fatal(`${ref}: unbound variable`)
      }
      const v = lst ? undefined : self.scalar(p.name, p.index)
      if (p.len) {
        if (lst) return String(lst.length)
        if (v === undefined) unbound()
        return String([...(v ?? '')].length)
      }
      const isSetV = lst ? lst.length > 0 : v !== undefined
      const nonNull = lst ? lst.length > 0 : !!v
      const op = p.op
      if (!op) {
        if (!isSetV) unbound()
        return lst ?? v ?? ''
      }
      const cur = lst ?? v ?? ''
      switch (op) {
        case ':-':
          return nonNull ? cur : self.argText(p)
        case '-':
          return isSetV ? cur : self.argText(p)
        case ':=':
        case '=': {
          if (op === ':=' ? nonNull : isSetV) return cur
          const val = self.argText(p)
          if (/^\d|^[@*#?$!-]$/.test(p.name)) throw new Abort(`$${p.name}: cannot assign in this way`)
          const err = p.index !== undefined ? assign(ctx, self, { name: p.name, index: [{ t: 'lit', s: p.index, q: true }], append: false, value: [{ t: 'lit', s: val, q: true }] }) : setVar(ctx, p.name, val)
          if (err) throw new Abort(err)
          return val
        }
        case ':?':
        case '?':
          if (op === ':?' ? nonNull : isSetV) return cur
          throw new Fatal(`${p.name}: ${p.arg ? self.argText(p) : op === ':?' ? 'parameter null or not set' : 'parameter not set'}`)
        case ':+':
          return nonNull ? self.argText(p) : ''
        case '+':
          return isSetV ? self.argText(p) : ''
      }
      if (!isSetV) unbound()
      if (op === ':') {
        const arg = p.arg ?? ''
        const colon = arg.search(/:(?![^(]*\))/)
        const offText = colon < 0 ? arg : arg.slice(0, colon)
        const lenText = colon < 0 ? undefined : arg.slice(colon + 1)
        const off = offText.trim() ? self.arith(offText) : 0
        const len = lenText === undefined ? undefined : lenText.trim() ? self.arith(lenText) : 0
        const slice = <T>(items: T[]): T[] => {
          let start = off < 0 ? items.length + off : off
          if (start < 0) return []
          start = Math.min(start, items.length)
          if (len === undefined) return items.slice(start)
          if (len < 0) {
            if (lst) throw new Abort(`${len}: substring expression < 0`)
            return items.slice(start, Math.max(start, items.length + len))
          }
          return items.slice(start, start + len)
        }
        if (lst) return slice(p.index === undefined ? s.args : lst)
        return slice([...(v ?? '')]).join('')
      }
      const each = (f: (x: string) => string) => (lst ? lst.map(f) : f(v ?? ''))
      if (op === '^^' || op === '^' || op === ',,' || op === ',') {
        const up = op[0] === '^'
        const all = op.length === 2
        const conv = (c: string) => (up ? c.toUpperCase() : c.toLowerCase())
        return each((x) => (all ? conv(x) : conv(x.slice(0, 1)) + x.slice(1)))
      }
      if (op[0] === '/') {
        const arg = p.arg ?? ''
        let slash = -1
        for (let i = 0; i < arg.length; i++) {
          if (arg[i] === '\\') i++
          else if (arg[i] === '/') {
            slash = i
            break
          }
        }
        const pat = self.patternText(slash < 0 ? arg : arg.slice(0, slash))
        const rep = slash < 0 ? '' : self.expandParts(wordParts(arg.slice(slash + 1), p.q), { split: false, glob: false }).join('')
        return each((x) => replacePattern(x, op, pat, rep))
      }
      const pat = self.patternText(p.arg ?? '')
      return each((x) => trimValue(x, op, pat))
    },
    /** A pattern written inside ${…}: quoted parts match literally. */
    patternText(text: string): Field {
      return joinFields(self.fieldsOf(wordParts(text, false), { split: false }))
    },
    /** A word used as a pattern (case, [[ == ]]): quoted parts match literally. */
    pattern(t: Token): Field {
      return joinFields(self.fieldsOf(t.parts ?? [{ t: 'lit', s: t.text, q: true }], { split: false }))
    },
    sub(cmdText: string): string {
      const m = /^\s*<\s*(\S+)\s*$/.exec(cmdText)
      if (m) {
        // $(< file): the file's contents, without starting a command.
        const f = self.expandParts(wordParts(m[1]!, false), { split: false, glob: false }).join('')
        const node = lookup(ctx.s, resolve(ctx.s.cwd, f))
        if (node?.kind !== 'file') {
          pre.push([2, `${where(ctx, ctx.line)}${f}: No such file or directory\n`])
          self.subStatus = 1
          return ''
        }
        self.subStatus = 0
        return node.content.replace(/\n+$/, '')
      }
      return self.capture(cmdText).replace(/\n+$/, '')
    },
    /** Runs a command in a subshell and returns everything it printed. */
    capture(cmdText: string): string {
      const sub = subshell(ctx)
      // Command substitution does not inherit set -e (unless shopt -s inherit_errexit).
      if (!sub.scope.opts.inherit_errexit) delete sub.scope.opts.e
      sub.cond = false
      const [cwd, prev] = [ctx.s.cwd, ctx.s.prev]
      let r: Res
      try {
        r = finish(sub, execList(sub, parse(tokenize(cmdText)), null, false, true))
      } catch (e) {
        throw new Abort(`command substitution: ${(e as Error).message}`)
      } finally {
        ctx.s.cwd = cwd
        ctx.s.prev = prev
      }
      pre.push(...r.chunks.filter((c) => c[0] === 2))
      self.subStatus = r.code
      ctx.status = r.code
      return stdoutOf(r)
    },
    /** <(command): its output, in a file under /dev/fd. */
    proc(cmdText: string): string {
      const text = self.capture(cmdText)
      let n = 63
      while (lookup(ctx.s, `/dev/fd/${n}`)) n--
      const path = `/dev/fd/${n}`
      mkdirp(ctx.s, '/dev/fd')
      writeFile(ctx.s, path, text, false)
      self.temps.push(path)
      return path
    },
    cleanup(): void {
      for (const p of self.temps) removePath(ctx.s, p)
      if (self.temps.length) {
        self.temps = []
        const fd = lookup(ctx.s, '/dev/fd')
        if (fd?.kind === 'dir' && !Object.keys(fd.children).length) removePath(ctx.s, '/dev/fd')
        const dev = lookup(ctx.s, '/dev')
        if (dev?.kind === 'dir' && !Object.keys(dev.children).length) removePath(ctx.s, '/dev')
      }
    },
    /** $((…)): expands $ inside, then works it out. */
    arith(expr: string): number {
      return evalArith(self.expandParts(quotedParts(expr, false), { split: false, glob: false }).join(''), ctx)
    },
    /** A word's parts as fields (split at IFS unless told not to), before wildcards. */
    fieldsOf(parts: Part[], opt: { split?: boolean } = {}): Field[] {
      const split = opt.split ?? true
      const fields: Field[] = []
      let cur: Field = { s: '', g: [], quoted: false }
      const add = (text: string, wild: boolean) => {
        cur.s += text
        for (let k = 0; k < text.length; k++) cur.g.push(wild)
      }
      const flush = (keep = false) => {
        if (cur.s || keep || cur.keep || (cur.quoted && !cur.atEmpty)) fields.push(cur)
        cur = { s: '', g: [], quoted: false }
      }
      const ifs = self.ifs()
      const splitAdd = (v: string) => {
        if (ifs === '') {
          add(v, true)
          return
        }
        const { lead, pieces, trail } = ifsPieces(v, ifs)
        if (lead) flush()
        pieces.forEach((pc, k) => {
          if (k > 0) flush(true)
          add(pc, true)
        })
        if (trail) flush(true)
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
        let v: string | string[]
        if (p.t === 'var') v = self.value(p)
        else if (p.t === 'sub') v = self.sub(p.cmd)
        else if (p.t === 'proc') v = self.proc(p.cmd)
        else v = String(self.arith(p.expr))
        if (Array.isArray(v)) {
          const star = p.t === 'var' && (p.index === '*' || (p.index === undefined && p.name === '*')) && !p.bang
          if (p.q && star) v = v.join(ifs.slice(0, 1))
          else if (p.q) {
            cur.quoted = true
            if (!v.length) {
              cur.atEmpty = true
              return
            }
            v.forEach((a, k) => {
              if (k > 0) {
                flush(true)
                cur.quoted = true
              }
              add(a, false)
            })
            return
          } else if (!split) v = v.join(' ')
          else {
            v.forEach((a, k) => {
              if (k > 0) flush()
              splitAdd(a)
            })
            return
          }
        }
        if (p.q || !split) {
          if (p.q) cur.quoted = true
          add(v, !p.q)
          return
        }
        splitAdd(v)
      })
      flush()
      return fields
    },
    expandParts(parts: Part[], opt: { split?: boolean; glob?: boolean } = {}): string[] {
      const fields = self.fieldsOf(parts, opt)
      if (opt.glob === false || sc().opts.f) return fields.map((f) => f.s)
      return fields.flatMap((f) => {
        const wild = [...f.s].some((c, k) => f.g[k] && (c === '*' || c === '?' || c === '['))
        if (!wild) return [f.s]
        const hits = globPaths(ctx.s, f)
        if (hits.length) return hits
        if (sc().opts.nullglob) return []
        if (sc().opts.failglob) throw new Abort(`no match: ${f.s}`)
        return [f.s]
      })
    },
    expand(t: Token, opt: { split?: boolean; glob?: boolean; brace?: boolean } = {}): string[] {
      const parts = t.parts ?? [{ t: 'lit', s: t.text, q: true }]
      if (opt.brace) return braceExpand(parts).flatMap((ps) => self.expandParts(ps, opt))
      return self.expandParts(parts, opt)
    },
    /** A word as one string: no splitting, no wildcards ([[ ]], case, here-strings). */
    word(t: Token): string {
      return self.expandParts(t.parts ?? [{ t: 'lit', s: t.text, q: true }], { split: false, glob: false }).join(' ')
    },
  }
  return self
}

function joinFields(fields: Field[]): Field {
  const f: Field = { s: '', g: [], quoted: false }
  fields.forEach((x, i) => {
    if (i > 0) {
      f.s += ' '
      f.g.push(false)
    }
    f.s += x.s
    f.g.push(...x.g)
  })
  return f
}

/** ${v#pat} ${v##pat} ${v%pat} ${v%%pat}: trim by wildcard. */
function trimValue(v: string, op: string, pat: Field): string {
  const re = patternRegex(pat)
  const m = (t: string) => re.test(t)
  if (op === '#' || op === '##') {
    const lens = [...Array(v.length + 1).keys()]
    for (const i of op === '#' ? lens : lens.reverse()) if (m(v.slice(0, i))) return v.slice(i)
    return v
  }
  if (op === '%' || op === '%%') {
    const starts = [...Array(v.length + 1).keys()]
    for (const i of op === '%' ? starts.reverse() : starts) if (m(v.slice(i))) return v.slice(0, i)
    return v
  }
  return v
}

/** ${v/pat/rep} ${v//pat/rep} ${v/#pat/rep} ${v/%pat/rep}: replace by wildcard, longest match. */
function replacePattern(v: string, op: string, pat: Field, rep: string): string {
  if (!pat.s) return v
  const re = patternRegex(pat)
  const m = (t: string) => re.test(t)
  if (op === '/#') {
    for (let j = v.length; j >= 0; j--) if (m(v.slice(0, j))) return rep + v.slice(j)
    return v
  }
  if (op === '/%') {
    for (let i = 0; i <= v.length; i++) if (m(v.slice(i))) return v.slice(0, i) + rep
    return v
  }
  let res = ''
  for (let i = 0; i < v.length; ) {
    let hit = -1
    for (let j = v.length; j > i; j--)
      if (m(v.slice(i, j))) {
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

/** A wildcard pattern as the body of a regular expression; `g` says which characters are wild. */
function globBody(s: string, g: boolean[]): string {
  let re = ''
  for (let k = 0; k < s.length; k++) {
    const c = s[k]!
    if (g[k] && c === '*') re += '.*'
    else if (g[k] && c === '?') re += '.'
    else if (g[k] && c === '[') {
      let j = k + 1
      if (s[j] === '!' || s[j] === '^') j++
      if (s[j] === ']') j++
      while (j < s.length && s[j] !== ']') j += s[j] === '[' && s[j + 1] === ':' ? Math.max(s.indexOf(':]', j + 2) + 2 - j, 1) : 1
      if (j >= s.length) {
        re += '\\['
        continue
      }
      let inner = s.slice(k + 1, j)
      let neg = ''
      if (inner[0] === '!' || inner[0] === '^') {
        neg = '^'
        inner = inner.slice(1)
      }
      const classes: Record<string, string> = { digit: '0-9', alpha: 'a-zA-Z', alnum: 'a-zA-Z0-9', upper: 'A-Z', lower: 'a-z', space: ' \\t\\n\\r\\f\\v', blank: ' \\t', punct: '!-\\/:-@\\[-`{-~', xdigit: '0-9A-Fa-f', word: '\\w' }
      let body = ''
      for (let i = 0; i < inner.length; i++) {
        const cls = /^\[:(\w+):\]/.exec(inner.slice(i))
        if (cls) {
          body += classes[cls[1]!] ?? ''
          i += cls[0].length - 1
          continue
        }
        const ch = inner[i]!
        body += ch === '\\' || ch === ']' || ch === '[' || (ch === '^' && i === 0) ? `\\${ch}` : ch
      }
      re += `[${neg}${body}]`
      k = j
    } else re += c.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
  }
  return re
}

/** A whole-string pattern (case, [[ == ]], ${v#pat}). */
function patternRegex(f: Field): RegExp {
  return new RegExp(`^${globBody(f.s, f.g)}$`, 's')
}

/** A wildcard pattern (one path segment) as a regular expression. */
function segmentRegex(s: string, g: boolean[]): RegExp {
  return new RegExp(`^${globBody(s, g)}$`, 's')
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

/* ── Arithmetic: $(( )), (( )), let, array indices ───────────────────────── */

/**
 * Works out an arithmetic expression whose $ expansions are already done:
 * C's operators with bash's precedence, assignment (= += ++ …), a ? b : c,
 * variables by name (their values are themselves arithmetic), a[i], and
 * 0x1f, 010 (octal), 2#101 numbers.
 */
function evalArith(src: string, ctx: Ctx, depth = 0): number {
  const re = /\s+|0[xX][0-9a-fA-F]*|\d+#[0-9a-zA-Z@_]+|\d+|[A-Za-z_]\w*|\*\*=|<<=|>>=|\*\*|\+\+|--|<=|>=|==|!=|&&|\|\||<<|>>|[-+*/%&|^]=|[-+*/%<>=!~&|^?:,()[\]]/y
  const toks: { t: string; at: number }[] = []
  for (let i = 0; i < src.length; ) {
    re.lastIndex = i
    const m = re.exec(src)
    if (!m) throw new Abort(`${src.trim()}: syntax error: invalid arithmetic operator (error token is "${src.slice(i)}")`)
    if (!/^\s/.test(m[0])) toks.push({ t: m[0], at: i })
    i = re.lastIndex
  }
  let k = 0
  const peek = () => toks[k]?.t
  const rest = () => src.slice(toks[k]?.at ?? src.length)
  const fail = (msg: string): never => {
    throw new Abort(`${src.trim()}: ${msg} (error token is "${rest()}")`)
  }
  const I = (n: number) => (Number.isFinite(n) ? Math.trunc(n) : 0)
  const big = (f: (a: bigint, b: bigint) => bigint) => (a: number, b: number) => Number(BigInt.asIntN(64, f(BigInt(I(a)), BigInt(I(b)))))
  const literal = (t: string): number => {
    if (/^0[xX]/.test(t)) {
      if (t.length === 2) fail('invalid number')
      return parseInt(t.slice(2), 16)
    }
    const b = /^(\d+)#(.+)$/.exec(t)
    if (b) {
      const base = Number(b[1])
      if (base < 2 || base > 64) fail('invalid arithmetic base')
      let v = 0
      for (const c of b[2]!) {
        const d = /\d/.test(c) ? Number(c) : /[a-z]/.test(c) ? c.charCodeAt(0) - 87 : /[A-Z]/.test(c) ? c.charCodeAt(0) - (base <= 36 ? 55 : 29) : c === '@' ? 62 : 63
        if (d >= base) fail('value too great for base')
        v = v * base + d
      }
      return v
    }
    if (t.length > 1 && t.startsWith('0')) {
      if (/[89]/.test(t)) {
        k--
        fail('value too great for base')
      }
      return parseInt(t, 8)
    }
    return Number(t)
  }
  type LV = { get: () => number; set: (v: number) => void }
  const valueOf = (name: string, index: string | undefined): number => {
    let raw: string | undefined
    if (index !== undefined) {
      const a = ctx.scope.arrays[name]
      raw = a ? a.v[keyOf(ctx, a, index)] : keyOf(ctx, undefined, index) === '0' ? readVar(ctx, name) : undefined
    } else raw = readVar(ctx, name)
    if (raw === undefined && ctx.scope.opts.u) throw new Fatal(`${name}: unbound variable`)
    const t = (raw ?? '').trim()
    if (!t) return 0
    if (/^[-+]?\d+$/.test(t)) return Number(t)
    if (depth > 10) throw new Abort(`${t}: expression recursion level exceeded`)
    return evalArith(t, ctx, depth + 1)
  }
  const lvalue = (): LV | null => {
    const t = peek()
    if (!t || !/^[A-Za-z_]/.test(t)) return null
    k++
    let index: string | undefined
    if (peek() === '[') {
      const open = toks[k]!.at
      let d = 0
      for (; k < toks.length; k++) {
        if (toks[k]!.t === '[') d++
        else if (toks[k]!.t === ']' && --d === 0) break
      }
      if (k >= toks.length) fail("missing `]'")
      index = src.slice(open + 1, toks[k]!.at)
      k++
    }
    return {
      get: () => valueOf(t, index),
      set: (v: number) => {
        const err = index !== undefined ? assignElem(ctx, t, index, String(v)) : setVar(ctx, t, String(v))
        if (err) throw new Abort(err)
      },
    }
  }
  type Ev = () => number
  const primary = (): Ev => {
    const t = peek()
    if (t === undefined) fail('syntax error: operand expected')
    if (t === '(') {
      k++
      const e = comma()
      if (peek() !== ')') fail("missing `)'")
      k++
      return e
    }
    if (/^\d/.test(t!)) {
      k++
      const v = literal(t!)
      return () => v
    }
    const lv = lvalue()
    if (!lv) return fail('syntax error: operand expected')
    const post = peek()
    if (post === '++' || post === '--') {
      k++
      return () => {
        const v = lv.get()
        lv.set(v + (post === '++' ? 1 : -1))
        return v
      }
    }
    return lv.get
  }
  const unary = (): Ev => {
    const t = peek()
    if (t === '++' || t === '--') {
      k++
      const lv = lvalue()
      if (!lv) fail('syntax error: operand expected')
      return () => {
        const v = lv!.get() + (t === '++' ? 1 : -1)
        lv!.set(v)
        return v
      }
    }
    if (t === '-' || t === '+' || t === '!' || t === '~') {
      k++
      const e = unary()
      return t === '-' ? () => -e() : t === '+' ? e : t === '!' ? () => (e() ? 0 : 1) : () => ~I(e())
    }
    return primary()
  }
  const power = (): Ev => {
    const b = unary()
    if (peek() === '**') {
      k++
      const e = power()
      return () => {
        const x = e()
        if (x < 0) throw new Abort(`${src.trim()}: exponent less than 0`)
        return I(b() ** x)
      }
    }
    return b
  }
  const binops: Record<string, (a: number, b: number) => number> = {
    '*': (a, b) => I(a * b),
    '/': (a, b) => {
      if (b === 0) throw new Abort(`${src.trim()}: division by 0 (error token is "${src.slice(src.lastIndexOf('/') + 1)}")`)
      return I(a / b)
    },
    '%': (a, b) => {
      if (b === 0) throw new Abort(`${src.trim()}: division by 0 (error token is "${src.slice(src.lastIndexOf('%') + 1)}")`)
      return I(a % b)
    },
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '<<': big((a, b) => a << b),
    '>>': big((a, b) => a >> b),
    '<': (a, b) => Number(a < b),
    '>': (a, b) => Number(a > b),
    '<=': (a, b) => Number(a <= b),
    '>=': (a, b) => Number(a >= b),
    '==': (a, b) => Number(a === b),
    '!=': (a, b) => Number(a !== b),
    '&': big((a, b) => a & b),
    '^': big((a, b) => a ^ b),
    '|': big((a, b) => a | b),
  }
  const levels = [['*', '/', '%'], ['+', '-'], ['<<', '>>'], ['<', '>', '<=', '>='], ['==', '!='], ['&'], ['^'], ['|']]
  const level = (n: number): Ev => {
    if (n < 0) return power()
    let e = level(n - 1)
    while (levels[n]!.includes(peek() ?? '')) {
      const f = binops[toks[k++]!.t]!
      const l = e
      const r = level(n - 1)
      e = () => f(l(), r())
    }
    return e
  }
  const logic = (op: '&&' | '||', next: () => Ev): Ev => {
    let e = next()
    while (peek() === op) {
      k++
      const l = e
      const r = next()
      e = op === '&&' ? () => Number(!!l() && !!r()) : () => Number(!!l() || !!r())
    }
    return e
  }
  const andE = (): Ev => logic('&&', () => level(levels.length - 1))
  const orE = (): Ev => logic('||', andE)
  const ternary = (): Ev => {
    const c = orE()
    if (peek() !== '?') return c
    k++
    const a = assignE()
    if (peek() !== ':') fail("expected `:'")
    k++
    const b = ternary()
    return () => (c() ? a() : b())
  }
  const ASSIGN_OPS = ['=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '&=', '^=', '|=', '**=']
  const assignE = (): Ev => {
    const save = k
    const lv = lvalue()
    if (lv && ASSIGN_OPS.includes(peek() ?? '')) {
      const op = toks[k++]!.t
      const r = assignE()
      return () => {
        const rv = r()
        const v = op === '=' ? rv : op === '**=' ? I(lv.get() ** rv) : binops[op.slice(0, -1)]!(lv.get(), rv)
        lv.set(v)
        return v
      }
    }
    k = save
    return ternary()
  }
  const comma = (): Ev => {
    let e = assignE()
    while (peek() === ',') {
      k++
      const l = e
      const r = assignE()
      e = () => {
        l()
        return r()
      }
    }
    return e
  }
  if (!toks.length) return 0
  const e = comma()
  if (k < toks.length) fail('syntax error in expression')
  return I(e())
}

/** a[i]=value, from arithmetic or read -a. */
function assignElem(ctx: Ctx, name: string, index: string, value: string): string | null {
  const sc = ctx.scope
  if (sc.ro.includes(name)) return readonlyMsg(name)
  let a = sc.arrays[name]
  if (!a) {
    a = { v: {} }
    if (sc.vars[name] !== undefined) a.v['0'] = sc.vars[name]!
    sc.arrays[name] = a
    delete sc.vars[name]
  }
  a.v[keyOf(ctx, a, index)] = value
  return null
}

/* ── test / [ ] ──────────────────────────────────────────────────────────── */

const UNARY = ['-e', '-a', '-f', '-d', '-s', '-r', '-w', '-x', '-z', '-n', '-L', '-h', '-v', '-p', '-b', '-c', '-S']
const BINARY = ['=', '==', '!=', '<', '>', '-eq', '-ne', '-lt', '-le', '-gt', '-ge', '-nt', '-ot', '-ef']

/** The file tests -e -f -d … (and -z / -n), shared by test, [ ] and [[ ]]. */
function fileTest(ctx: Ctx, op: string, v: string): boolean {
  const s = ctx.s
  const node = v === '' ? undefined : lookup(s, resolve(s.cwd, v))
  switch (op) {
    case '-e':
    case '-a':
      return !!node
    case '-f':
      return node?.kind === 'file'
    case '-d':
      return node?.kind === 'dir'
    case '-s':
      return node?.kind === 'file' ? node.content.length > 0 : !!node
    case '-r':
    case '-w':
    case '-O':
    case '-G':
      return !!node
    case '-x':
      return node?.kind === 'dir' || (node?.kind === 'file' && !!node.exec)
    case '-z':
      return v === ''
    case '-n':
      return v !== ''
    case '-v':
      return isSet(ctx, v)
    default:
      return false
  }
}

function testCmd(ctx: Ctx, name: string, argv: string[], line: number): Res {
  let args = argv
  if (name === '[') {
    if (args[args.length - 1] !== ']') return bad(`${where(ctx, line)}[: missing \`]'`, 2)
    args = args.slice(0, -1)
  }
  const s = ctx.s
  const int = (v: string) => {
    if (!/^\s*-?\d+\s*$/.test(v)) throw new Error(`${name}: ${v}: integer expression expected`)
    return Number(v)
  }
  const binary = (a: string, op: string, b: string): boolean => {
    switch (op) {
      case '=':
      case '==':
        return a === b
      case '!=':
        return a !== b
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
      case '-nt':
      case '-ot':
      case '-ef': {
        const na = lookup(s, resolve(s.cwd, a))
        const nb = lookup(s, resolve(s.cwd, b))
        if (op === '-ef') return !!na && na === nb
        return op === '-nt' ? !!na && !nb : !na && !!nb
      }
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
        if (UNARY.includes(a[0]!)) return fileTest(ctx, a[0]!, a[1]!)
        throw new Error(`${name}: ${a[0]}: unary operator expected`)
      case 3:
        if (BINARY.includes(a[1]!)) return binary(a[0]!, a[1]!, a[2]!)
        if (a[0] === '!') return !evalN(a.slice(1))
        if (a[0] === '(' && a[2] === ')') return evalN([a[1]!])
        if (a[1] === '-a') return evalN([a[0]!]) && evalN([a[2]!])
        if (a[1] === '-o') return evalN([a[0]!]) || evalN([a[2]!])
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

/** A child shell's scope: only exported variables come along; no functions, arrays or traps. */
function childScope(ctx: Ctx, name: string, args: string[], opts: ShellState['opts']): Scope {
  const sc = ctx.scope
  const vars: Record<string, string> = {}
  for (const n of sc.exported) if (sc.vars[n] !== undefined) vars[n] = sc.vars[n]!
  vars.IFS = ' \t\n'
  return { vars, exported: [...sc.exported], args, opts, name, top: false, arrays: {}, funcs: {}, traps: {}, ro: [], ints: [] }
}

/** Runs a list as a separate shell (a script, bash -c): cwd comes back, the EXIT trap runs. */
function runChild(ctx: Ctx, scope: Scope, ast: List, stdin: Stdin): Res {
  const s = ctx.s
  const child: Ctx = { ...ctx, scope, depth: ctx.depth + 1, status: 0, cond: false, frames: [], loops: 0, funcs: [], sourced: 0, inTrap: false }
  const [cwd, prev] = [s.cwd, s.prev]
  const r = finish(child, execList(child, ast, stdin, false, true))
  s.cwd = cwd
  s.prev = prev
  return { code: r.code, chunks: r.chunks }
}

/** Runs a file of commands: in a child shell (bash, ./file) or this one (source). */
function runScript(ctx: Ctx, file: string, args: string[], how: { child: boolean; opts?: ShellState['opts']; check?: boolean }, stdin: Stdin, line = 0): Res {
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
  if (how.child) return runChild(ctx, childScope(ctx, file, [file, ...args], how.opts ?? {}), ast, stdin)
  const sc = ctx.scope
  const saved = sc.args
  const savedName = sc.name
  if (args.length) sc.args = [saved[0]!, ...args]
  sc.name = file
  const wasTop = sc.top
  sc.top = false
  ctx.sourced++
  ctx.depth++
  let r: Res
  try {
    r = execList(ctx, ast, stdin, false, true)
  } finally {
    ctx.sourced--
    ctx.depth--
    if (args.length) sc.args = saved
    sc.name = savedName
    sc.top = wasTop
  }
  if (r.flow?.k === 'return') return { code: r.code, chunks: r.chunks }
  return r
}

/** Interpreters a #! line may name here. */
const INTERPRETERS = ['/bin/bash', '/usr/bin/bash', '/bin/sh', '/usr/bin/sh', '/usr/bin/env', '/bin/env', '/usr/bin/awk', '/bin/awk', '/usr/bin/python3', '/usr/bin/python']

/** ./script: the kernel reads the #! line to find the program that runs it. */
function execFile(ctx: Ctx, cmd: string, node: Node & { kind: 'file' }, args: string[], stdin: Stdin, tty: boolean, line: number): Res {
  const first = node.content.startsWith('#!') ? node.content.slice(2, node.content.indexOf('\n') < 0 ? undefined : node.content.indexOf('\n')) : null
  if (first === null) return runScript(ctx, cmd, args, { child: true }, stdin, line)
  const m = /^[ \t]*([^ \t]*)(?:[ \t]+(.*?))?[ \t]*$/s.exec(first)!
  const interp = m[1]!
  const optArg = m[2]
  const known = INTERPRETERS.includes(interp) || lookup(ctx.s, interp)?.kind === 'file'
  if (!known) return bad(`${where(ctx, line)}${cmd}: cannot execute: required file not found`, 127)
  let prog = interp
  let progArgs: string[] = optArg !== undefined ? [optArg] : []
  if (/\/env$/.test(interp)) {
    if (optArg === undefined) return bad(`${where(ctx, line)}${cmd}: /usr/bin/env: no program named`, 127)
    if (optArg.startsWith('-S')) {
      const words = optArg.slice(2).trim().split(/\s+/).filter(Boolean)
      prog = words[0] ?? ''
      progArgs = words.slice(1)
    } else {
      prog = optArg
      progArgs = []
    }
    if (!['bash', 'sh', 'awk', 'python3', 'python'].includes(prog)) {
      const tip = /\s/.test(prog) ? '\n/usr/bin/env: use -[v]S to pass options in shebang lines' : ''
      return bad(`/usr/bin/env: '${prog}': No such file or directory${tip}`, 127)
    }
  }
  const base = prog.slice(prog.lastIndexOf('/') + 1)
  if (base === 'bash' || base === 'sh') {
    const opts: ShellState['opts'] = {}
    for (const a of progArgs)
      for (const c of a.replace(/^-/, '')) {
        if (c === 'x') opts.x = true
        else if (c === 'e') opts.e = true
        else if (c === 'u') opts.u = true
      }
    return runScript(ctx, cmd, args, { child: true, opts }, stdin, line)
  }
  if (base === 'awk') return dispatch(ctx, ['awk', ...progArgs, cmd, ...args], stdin, tty, line)
  return bad(`${cmd}: ${base} programs do not run in the practice terminal — run them in Code mode`, 126)
}

/* ── Builtins that manage the shell itself ───────────────────────────────── */

/** One name given to declare/local/export/readonly, with its assignment if it had one. */
interface DeclItem {
  name: string
  assign: Assign | null
  raw: string
}

/** A value inside declare -p's double quotes. */
const dq = (v: string) => (/[\x00-\x1f\x7f]/.test(v) ? shellQuote(v) : `"${v.replace(/(["\\$`])/g, '\\$1')}"`)

function declareLine(ctx: Ctx, name: string): string | null {
  const sc = ctx.scope
  const a = sc.arrays[name]
  const v = sc.vars[name]
  if (!a && v === undefined) return null
  let flags = a ? (a.assoc ? 'A' : 'a') : ''
  if (sc.ints.includes(name)) flags += 'i'
  if (sc.ro.includes(name)) flags += 'r'
  if (sc.exported.includes(name)) flags += 'x'
  const f = flags ? `-${flags}` : '--'
  if (a) {
    const items = arrayKeys(a).map((k) => `[${k}]=${dq(a.v[k]!)}`)
    return `declare ${f} ${name}=(${items.join(' ')}${a.assoc && items.length ? ' ' : ''})`
  }
  return `declare ${f} ${name}=${dq(v!)}`
}

function declareCmd(ctx: Ctx, x: Expander, cmd: string, flagWords: string[], items: DeclItem[], line: number): Res {
  const sc = ctx.scope
  const inFunc = ctx.frames.length > 0
  if (cmd === 'local' && !inFunc) return bad(`${where(ctx, line)}local: can only be used in a function`, 1)
  const on = new Set<string>()
  const off = new Set<string>()
  for (const w of flagWords) for (const c of w.slice(1)) (w[0] === '-' ? on : off).add(c)
  if (cmd === 'export') on.add('x')
  if (cmd === 'readonly') on.add('r')
  if (cmd === 'export' && on.has('n')) {
    on.delete('x')
    off.add('x')
  }
  const lines: string[] = []
  const errs: string[] = []
  if (on.has('f') || on.has('F')) {
    const names = items.length ? items.map((i) => i.name) : Object.keys(sc.funcs).sort()
    let code = 0
    for (const n of names) {
      const fn = sc.funcs[n]
      if (!fn) {
        code = 1
        continue
      }
      lines.push(on.has('F') ? `declare -f ${n}` : functionText(n, fn))
    }
    return { code, chunks: lines.length ? [[1, fromLines(lines)]] : [] }
  }
  if (on.has('p') || (!items.length && cmd !== 'local')) {
    let names = items.map((i) => i.name)
    if (!names.length) {
      const all = [...new Set([...Object.keys(sc.vars), ...Object.keys(sc.arrays)])].sort()
      names = cmd === 'export' || on.has('x') ? all.filter((n) => sc.exported.includes(n)) : cmd === 'readonly' || on.has('r') ? all.filter((n) => sc.ro.includes(n)) : all
      if (cmd === 'declare' && !on.has('p') && !flagWords.length) return ok(names.map((n) => (sc.arrays[n] ? declareLine(ctx, n)!.replace(/^declare -\S+ /, '') : `${n}=${shq(sc.vars[n]!)}`)).join('\n'))
    }
    let code = 0
    for (const n of names) {
      const l = declareLine(ctx, n)
      if (l === null) {
        errs.push(`${where(ctx, line)}${cmd}: ${n}: not found`)
        code = 1
      } else lines.push(l)
    }
    return result(fromLines(lines), errs, code)
  }
  let code = 0
  for (const item of items) {
    const name = item.name
    if (!/^[A-Za-z_]\w*$/.test(name)) {
      errs.push(`${where(ctx, line)}${cmd}: \`${item.raw}': not a valid identifier`)
      code = 1
      continue
    }
    const makesLocal = cmd === 'local' || ((cmd === 'declare' || cmd === 'typeset') && inFunc && !on.has('g'))
    if (makesLocal) {
      const fresh = !ctx.frames[ctx.frames.length - 1]!.has(name)
      makeLocal(ctx, name)
      if (fresh && !item.assign) {
        delete sc.vars[name]
        delete sc.arrays[name]
      }
    }
    if (on.has('i') && !sc.ints.includes(name)) sc.ints.push(name)
    if (off.has('i') && sc.ints.includes(name)) sc.ints.splice(sc.ints.indexOf(name), 1)
    if (on.has('A') && !sc.arrays[name]?.assoc) {
      sc.arrays[name] = { assoc: true, v: {} }
      delete sc.vars[name]
    } else if (on.has('a') && !sc.arrays[name]) {
      sc.arrays[name] = { v: sc.vars[name] !== undefined ? { 0: sc.vars[name]! } : {} }
      delete sc.vars[name]
    }
    if (item.assign) {
      if (sc.ro.includes(name)) {
        errs.push(`${where(ctx, line)}${readonlyMsg(name)}`)
        code = 1
        continue
      }
      let err: string | null
      try {
        err = assign(ctx, x, item.assign)
      } catch (e) {
        return expansionFailed(ctx, e, errs.map((m): Chunk => [2, `${m}\n`]), line)
      }
      if (err) {
        errs.push(`${where(ctx, line)}${err}`)
        code = 1
        continue
      }
    }
    if (on.has('x') && !sc.exported.includes(name)) sc.exported.push(name)
    if (off.has('x') && sc.exported.includes(name)) sc.exported.splice(sc.exported.indexOf(name), 1)
    if (on.has('r') && !sc.ro.includes(name)) sc.ro.push(name)
  }
  return result('', errs, code)
}

/** read [-r] [-a arr] [-d delim] [-p prompt] [-n N] name…: one line (or up to delim) from standard input. */
function readCmd(ctx: Ctx, args: string[], stdin: Stdin, line: number): Res {
  let raw = false
  let arr: string | null = null
  let delim = '\n'
  let nchars: number | null = null
  const names: string[] = []
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!
    if (!a.startsWith('-') || a === '-' || names.length) {
      names.push(a)
      continue
    }
    for (let j = 1; j < a.length; j++) {
      const c = a[j]!
      if (c === 'r') raw = true
      else if (c === 's' || c === 'e') continue
      else if ('adpntNu'.includes(c)) {
        const v = a.slice(j + 1) || args[++i] || ''
        if (c === 'a') arr = v
        else if (c === 'd') delim = v.slice(0, 1)
        else if (c === 'n' || c === 'N') nchars = Number(v)
        break
      } else return bad(`${where(ctx, line)}read: -${c}: invalid option\nread: usage: read [-ers] [-a array] [-d delim] [-i text] [-n nchars] [-N nchars] [-p prompt] [-t timeout] [-u fd] [name ...]`, 2)
    }
  }
  if (!stdin) return bad(`${where(ctx, line)}read: the practice terminal cannot wait for typing — pipe text in: … | while read line; do …; done`)
  const buf = stdin.buf
  const end = delim === '' ? '\0' : delim
  let text = ''
  let i = 0
  let found = false
  for (; i < buf.length; i++) {
    if (nchars !== null && text.length >= nchars) break
    const c = buf[i]!
    if (c === end) {
      found = true
      i++
      break
    }
    if (c === '\\' && !raw) {
      const n = buf[i + 1]
      if (n === undefined) break
      i++
      if (n === '\n') continue
      text += `\\${n}`
      continue
    }
    text += c
  }
  if (nchars !== null && text.length >= nchars) found = true
  stdin.buf = buf.slice(i)
  if (!buf.length) found = false
  const ifs = ctx.scope.vars.IFS ?? ' \t\n'
  const unescape = (t: string) => (raw ? t : t.replace(/\\(.)/gs, '$1'))
  const setErr = (n: string, v: string) => {
    const err = setVar(ctx, n, v)
    if (err) throw new Error(err)
  }
  try {
    if (arr !== null) {
      const fields = ifs === '' ? [text] : ifsPieces(text, ifs).pieces.filter((p, k, all) => p !== '' || k < all.length - 1 || !/[ \t\n]/.test(ifs))
      const target: Arr = { v: {} }
      fields.forEach((f, k) => (target.v[String(k)] = unescape(f)))
      if (!text) target.v = {}
      ctx.scope.arrays[arr] = target
      delete ctx.scope.vars[arr]
    } else if (!names.length) setErr('REPLY', unescape(text))
    else {
      const isWs = (c: string) => (c === ' ' || c === '\t' || c === '\n') && ifs.includes(c)
      const isN = (c: string) => ifs.includes(c) && !isWs(c)
      let rest = text
      names.forEach((n, k) => {
        let p = 0
        while (p < rest.length && isWs(rest[p]!)) p++
        rest = rest.slice(p)
        if (k === names.length - 1) {
          let v = rest
          let e = v.length
          while (e > 0 && isWs(v[e - 1]!) && (raw || v[e - 2] !== '\\')) e--
          v = v.slice(0, e)
          if (v.length && isN(v[v.length - 1]!) && ![...v.slice(0, -1)].some((c) => ifs.includes(c))) v = v.slice(0, -1)
          setErr(n, unescape(v))
          return
        }
        let q = 0
        while (q < rest.length && !(ifs.includes(rest[q]!) && (raw || rest[q - 1] !== '\\'))) q++
        setErr(n, unescape(rest.slice(0, q)))
        let r = q
        while (r < rest.length && isWs(rest[r]!)) r++
        if (r < rest.length && isN(rest[r]!)) {
          r++
          while (r < rest.length && isWs(rest[r]!)) r++
        }
        rest = rest.slice(r)
      })
    }
  } catch (e) {
    return bad(`${where(ctx, line)}${(e as Error).message}`, 1)
  }
  return { code: found ? 0 : 1, chunks: [] }
}

/** mapfile [-t] [-n N] [-s N] [-d delim] [array]: every line of standard input into an array. */
function mapfileCmd(ctx: Ctx, cmd: string, args: string[], stdin: Stdin, line: number): Res {
  let strip = false
  let count = 0
  let skip = 0
  let delim = '\n'
  let name = 'MAPFILE'
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!
    if (a === '-t') strip = true
    else if (a === '-n') count = Number(args[++i])
    else if (a === '-s') skip = Number(args[++i])
    else if (a === '-d') delim = (args[++i] ?? '').slice(0, 1) || '\0'
    else if (a.startsWith('-')) return bad(`${where(ctx, line)}${cmd}: ${a}: invalid option`, 2)
    else name = a
  }
  const text = stdin?.buf ?? ''
  if (stdin) stdin.buf = ''
  const pieces: string[] = []
  let from = 0
  while (from < text.length) {
    const at = text.indexOf(delim, from)
    const end = at < 0 ? text.length : at + 1
    const piece = text.slice(from, end)
    pieces.push(strip && piece.endsWith(delim) ? piece.slice(0, -1) : piece)
    from = end
  }
  const kept = pieces.slice(skip, count ? skip + count : undefined)
  if (ctx.scope.ro.includes(name)) return bad(`${where(ctx, line)}${readonlyMsg(name)}`)
  ctx.scope.arrays[name] = { v: Object.fromEntries(kept.map((p, i) => [String(i), p])) }
  delete ctx.scope.vars[name]
  return { code: 0, chunks: [] }
}

/** getopts optstring name [args]: the next option, one call at a time. */
function getoptsCmd(ctx: Ctx, args: string[], line: number): Res {
  const [spec, name, ...given] = args
  if (spec === undefined || name === undefined) return bad(`${where(ctx, line)}getopts: usage: getopts optstring name [arg ...]`, 2)
  const sc = ctx.scope
  const params = given.length ? given : sc.args.slice(1)
  let optind = Number(sc.vars.OPTIND ?? '1') || 1
  if (sc.optind !== optind) sc.optpos = 1
  let pos = sc.optpos ?? 1
  const silent = spec.startsWith(':')
  const letters = silent ? spec.slice(1) : spec
  const set = (n: string, v: string) => setVar(ctx, n, v)
  const done = (o: number, p: number) => {
    sc.optpos = p
    sc.optind = o
    set('OPTIND', String(o))
  }
  const arg = params[optind - 1]
  if (arg === undefined || arg === '-' || !arg.startsWith('-') || arg === '--') {
    if (arg === '--') optind++
    set(name, '?')
    done(optind, 1)
    return { code: 1, chunks: [] }
  }
  const c = arg[pos]!
  const advance = () => {
    pos++
    if (pos >= arg.length) {
      optind++
      pos = 1
    }
  }
  const who = sc.args[0] ?? 'bash'
  const at = letters.indexOf(c)
  if (at < 0 || c === ':') {
    advance()
    set(name, '?')
    done(optind, pos)
    if (silent) {
      set('OPTARG', c)
      return { code: 0, chunks: [] }
    }
    delete sc.vars.OPTARG
    return bad(`${who}: illegal option -- ${c}`, 0)
  }
  if (letters[at + 1] === ':') {
    if (pos + 1 < arg.length) {
      set('OPTARG', arg.slice(pos + 1))
      optind++
    } else if (params[optind] !== undefined) {
      set('OPTARG', params[optind]!)
      optind += 2
    } else {
      optind++
      done(optind, 1)
      if (silent) {
        set(name, ':')
        set('OPTARG', c)
        return { code: 0, chunks: [] }
      }
      set(name, '?')
      delete sc.vars.OPTARG
      return bad(`${who}: option requires an argument -- ${c}`, 0)
    }
    set(name, c)
    done(optind, 1)
    return { code: 0, chunks: [] }
  }
  advance()
  set(name, c)
  delete sc.vars.OPTARG
  done(optind, pos)
  return { code: 0, chunks: [] }
}

const SIGNALS: Record<string, string> = { 0: 'EXIT', 1: 'HUP', 2: 'INT', 3: 'QUIT', 9: 'KILL', 13: 'PIPE', 14: 'ALRM', 15: 'TERM', 17: 'CHLD', 10: 'USR1', 12: 'USR2' }

/** EXIT, 0, SIGINT, int, 2 → the name trap keeps it under. */
function signalName(s: string): string | null {
  const u = s.toUpperCase().replace(/^SIG/, '')
  if (/^\d+$/.test(u)) return SIGNALS[u] ?? null
  return ['EXIT', 'ERR', 'DEBUG', 'RETURN', ...Object.values(SIGNALS)].includes(u) ? u : null
}

function trapCmd(ctx: Ctx, args: string[], line: number): Res {
  const traps = ctx.scope.traps
  const show = (sig: string) => `trap -- ${shellQuoteSingle(traps[sig]!)} ${['EXIT', 'ERR', 'DEBUG', 'RETURN'].includes(sig) ? sig : `SIG${sig}`}`
  let rest = args
  if (rest[0] === '-l') return ok(Object.entries(SIGNALS).filter(([n]) => n !== '0').map(([n, v]) => `${n.padStart(2)}) SIG${v}`).join('\n'))
  if (!rest.length || rest[0] === '-p') {
    const sigs = rest.length > 1 ? rest.slice(1).map(signalName).filter((x): x is string => !!x) : Object.keys(traps)
    return ok(sigs.filter((g) => traps[g] !== undefined).map(show).join('\n'))
  }
  if (rest[0] === '--') rest = rest.slice(1)
  let action: string | null = rest[0]!
  let sigs = rest.slice(1)
  if (!sigs.length) {
    // trap INT: back to the default for that signal.
    sigs = [action]
    action = null
  }
  if (action === '-') action = null
  const errs: string[] = []
  for (const sg of sigs) {
    const n = signalName(sg)
    if (!n) {
      errs.push(`${where(ctx, line)}trap: ${sg}: invalid signal specification`)
      continue
    }
    if (action === null) delete traps[n]
    else traps[n] = action
  }
  return result('', errs, errs.length ? 1 : 0)
}

/** 'text' as trap -p shows it: single quotes, with ' written as '\''. */
const shellQuoteSingle = (t: string) => `'${t.replace(/'/g, `'\\''`)}'`

/** What a name would run: a keyword, a function, a builtin, a program here, or nothing. */
function commandKind(ctx: Ctx, name: string): 'keyword' | 'function' | 'builtin' | 'file' | null {
  if (KEYWORDS.includes(name)) return 'keyword'
  if (ctx.scope.funcs[name]) return 'function'
  if (BUILTINS.includes(name)) return 'builtin'
  if (COMMANDS.includes(name) && !BUILTIN_ONLY.has(name)) return 'file'
  return null
}

function describeCommand(ctx: Ctx, name: string, kind: 'keyword' | 'function' | 'builtin' | 'file'): string {
  if (kind === 'keyword') return `${name} is a shell keyword`
  if (kind === 'builtin') return `${name} is a shell builtin`
  if (kind === 'file') return `${name} is /usr/bin/${name}`
  return `${name} is a function\n${functionText(name, ctx.scope.funcs[name]!)}`
}

/** A function the way bash prints it back (type f, declare -f f). */
function functionText(name: string, fn: Cmd): string {
  return `${name} () \n${cmdText(fn, 0)}`
}

function cmdText(c: Cmd, depth: number): string {
  const pad = '    '.repeat(depth)
  const words = (ts: Token[]) => ts.map((t) => t.raw ?? t.text).join(' ')
  const redirs = (rs: Redir[]) => rs.map((r) => (r.target ? ` ${r.op} ${r.target.raw ?? r.target.text}` : ` ${r.op}`)).join('')
  const listText = (l: List, d: number) =>
    l
      .map((ao) => {
        const pipe = (p: Pipeline) => (p.negate ? '! ' : '') + p.cmds.map((x) => cmdText(x, d).trimStart()).join(' | ')
        return '    '.repeat(d) + [pipe(ao.first), ...ao.rest.map((r) => `${r.op} ${pipe(r.pipe)}`)].join(' ')
      })
      .join(';\n')
  switch (c.type) {
    case 'simple':
      return pad + words(c.words) + redirs(c.redirs)
    case 'group':
      return `${pad}{ \n${listText(c.body, depth + 1)}\n${pad}}${redirs(c.redirs)}`
    case 'subshell':
      return `${pad}( ${listText(c.body, 0).trim()} )${redirs(c.redirs)}`
    case 'if':
      return `${pad}if ${listText(c.arms[0]!.cond, 0).trim()}; then\n${listText(c.arms[0]!.body, depth + 1)};\n${c.arms
        .slice(1)
        .map((a) => `${pad}elif ${listText(a.cond, 0).trim()}; then\n${listText(a.body, depth + 1)};\n`)
        .join('')}${c.otherwise ? `${pad}else\n${listText(c.otherwise, depth + 1)};\n` : ''}${pad}fi`
    case 'for':
      return `${pad}for ${c.name}${c.items ? ` in ${words(c.items)}` : ''};\n${pad}do\n${listText(c.body, depth + 1)};\n${pad}done`
    case 'cfor':
      return `${pad}for ((${c.init}; ${c.test}; ${c.step}))\n${pad}do\n${listText(c.body, depth + 1)};\n${pad}done`
    case 'while':
      return `${pad}${c.until ? 'until' : 'while'} ${listText(c.cond, 0).trim()}; do\n${listText(c.body, depth + 1)};\n${pad}done`
    case 'case':
      return `${pad}case ${c.word.raw ?? c.word.text} in \n${c.arms.map((a) => `${pad}    ${words(a.patterns).replace(/ /g, ' | ')})\n${listText(a.body, depth + 2)}\n${pad}    ${a.end}`).join('\n')}\n${pad}esac`
    case 'cond':
      return `${pad}[[ ${words(c.words)} ]]`
    case 'arith':
      return `${pad}(( ${c.expr.trim()} ))`
    case 'func':
      return `${pad}${functionText(c.name, c.body)}`
  }
}

/* ── awk, jq, paste, join, column (in their own files) ──────────────────── */

/** What awk, jq and the table tools may do with this shell: read files and standard input, write files, run commands. */
function toolIO(ctx: Ctx, stdin: Stdin): ToolIO {
  const s = ctx.s
  return {
    stdin: stdin ? stdin.buf : null,
    takeStdin: () => {
      const t = stdin?.buf ?? ''
      if (stdin) stdin.buf = ''
      return t
    },
    readFile: (p: string) => {
      const abs = resolve(s.cwd, p)
      if (abs === '/dev/null') return ''
      const node = lookup(s, abs)
      if (!node) return { error: 'No such file or directory' }
      if (node.kind === 'dir') return { error: 'Is a directory' }
      return node.content
    },
    writeFile: (p: string, text: string, append: boolean) => {
      const err = writeFile(s, resolve(s.cwd, p), text, append)
      return err ? err.replace(/^bash: /, '') : null
    },
    run: (cmdText: string, input: string) => {
      const sub = subshell(ctx)
      try {
        const r = execList(sub, parse(tokenize(cmdText)), { buf: input }, false, true)
        return { out: stdoutOf(r), err: r.chunks.filter((c) => c[0] === 2).map((c) => c[1]).join(''), code: r.code }
      } catch (e) {
        return { out: '', err: `sh: 1: ${(e as Error).message}\n`, code: 2 }
      }
    },
    env: Object.fromEntries(ctx.scope.exported.filter((n) => ctx.scope.vars[n] !== undefined).map((n) => [n, ctx.scope.vars[n]!])),
  }
}

const toolRes = (r: ToolResult): Res => ({ code: r.code, chunks: r.chunks ?? [...(r.out ? [[1, r.out] as Chunk] : []), ...(r.err ? [[2, r.err] as Chunk] : [])] })

function awkCmd(ctx: Ctx, args: string[], stdin: Stdin): Res {
  return toolRes(runAwk(args, toolIO(ctx, stdin)))
}

function jqCmd(ctx: Ctx, args: string[], stdin: Stdin): Res {
  return toolRes(runJq(args, toolIO(ctx, stdin)))
}

function tableCmd(ctx: Ctx, cmd: string, args: string[], stdin: Stdin): Res {
  return toolRes(runTable(cmd, args, toolIO(ctx, stdin)))
}

/* ── Commands ────────────────────────────────────────────────────────────── */

function flags(args: string[]): { flags: Set<string>; rest: string[] } {
  const f = new Set<string>()
  const rest: string[] = []
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!
    // -- ends the options: everything after it is a name, even -x.
    if (a === '--') {
      rest.push(...args.slice(i + 1))
      break
    }
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

/** bash's printf: the format is used again while arguments are left; bad numbers are reported. */
function bashPrintf(fmt: string, args: string[]): { text: string; errs: string[]; chunks: [1 | 2, string][] } {
  const pieces = parseFormat(fmt)
  let text = ''
  const errs: string[] = []
  // Each error is shown after the output made before it, as bash's unbuffered stderr would.
  const chunks: [1 | 2, string][] = []
  let flushed = 0
  let k = 0
  const next = () => args[k++]
  for (;;) {
    const before = k
    for (const p of pieces) {
      if (typeof p === 'string') {
        text += unescapeC(p).text
        continue
      }
      const spec = { flags: p.flags, conv: p.conv, ...(p.width !== undefined ? { width: p.width } : {}), ...(p.prec !== undefined ? { prec: p.prec } : {}) }
      if (p.starW) {
        const w = Math.trunc(Number(next() ?? 0)) || 0
        spec.width = Math.abs(w)
        if (w < 0) spec.flags += '-'
      }
      if (p.starP) spec.prec = Math.max(0, Math.trunc(Number(next() ?? 0)) || 0)
      const a = next()
      const num = (float: boolean) => {
        const got = parseCNumber(a ?? '', float)
        if (!got.ok) {
          errs.push(`printf: ${a}: invalid number`)
          if (text.length > flushed) chunks.push([1, text.slice(flushed)])
          flushed = text.length
          chunks.push([2, `printf: ${a}: invalid number`])
        }
        return got.n
      }
      switch (p.conv) {
        case 's':
        case 'c':
          text += fmtStr(a ?? '', spec)
          break
        case 'q':
          text += fmtStr(a === undefined ? '' : shellQuote(a), { ...spec, conv: 's' })
          break
        case 'b': {
          const u = unescapeC(a ?? '', true)
          text += fmtStr(u.text, { ...spec, conv: 's' })
          if (u.stop) return { text, errs, chunks: [...chunks, [1, text.slice(flushed)]] }
          break
        }
        case 'd':
        case 'i':
          text += fmtInt(num(false), spec)
          break
        case 'o':
        case 'u':
        case 'x':
        case 'X':
          text += fmtUnsigned(num(false), spec)
          break
        default:
          text += fmtFloat(num(true), spec)
      }
    }
    if (k === before || k >= args.length) break
  }
  if (text.length > flushed) chunks.push([1, text.slice(flushed)])
  return { text, errs, chunks }
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
const BUILTIN_ONLY = new Set([
  'cd', 'export', 'unset', 'set', 'read', 'exit', 'source', '.', 'history', 'type', 'local', 'readonly', 'declare', 'typeset', 'alias', 'clear',
  'return', 'break', 'continue', 'shift', 'getopts', 'trap', 'let', 'eval', 'mapfile', 'readarray', 'shopt', 'command',
])
const KEYWORDS = ['for', 'in', 'do', 'done', 'if', 'then', 'elif', 'else', 'fi', 'while', 'until', '!', 'case', 'esac', 'function', '{', '}', '[[', ']]', 'select', 'time']
const BUILTINS = [
  'cd', 'pwd', 'echo', 'printf', 'export', 'unset', 'set', 'read', 'exit', 'source', '.', 'test', '[', 'true', 'false', 'history', 'type', 'help', ':',
  'local', 'declare', 'typeset', 'readonly', 'return', 'break', 'continue', 'shift', 'getopts', 'trap', 'let', 'eval', 'mapfile', 'readarray', 'shopt', 'command', 'wait',
]
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
      if (!esc) return out(text + (nl ? '\n' : ''))
      const u = unescapeC(text, true)
      return out(u.text + (nl && !u.stop ? '\n' : ''))
    }
    case 'printf': {
      let rest = args
      let into: string | null = null
      if (rest[0] === '-v') {
        into = rest[1] ?? null
        rest = rest.slice(2)
      }
      if (rest[0] === '--') rest = rest.slice(1)
      if (!rest.length) return bad(`${where(ctx, line)}printf: usage: printf [-v var] format [arguments]`, 2)
      const p = bashPrintf(rest[0]!, rest.slice(1))
      const errs = p.errs.map((e) => `${where(ctx, line)}${e}`)
      if (into !== null) {
        const m = /^([A-Za-z_]\w*)(?:\[(.*)\])?$/.exec(into)
        if (!m) return bad(`${where(ctx, line)}printf: \`${into}': not a valid identifier`, 2)
        const err = m[2] !== undefined ? assignElem(ctx, m[1]!, m[2], p.text) : setVar(ctx, m[1]!, p.text)
        if (err) errs.push(`${where(ctx, line)}${err}`)
        return result('', errs, errs.length ? 1 : 0)
      }
      return { code: errs.length ? 1 : 0, chunks: p.chunks.map(([fd, t]): Chunk => (fd === 2 ? [2, `${where(ctx, line)}${t}\n`] : [1, t])) }
    }
    case 'node':
      return args[0] === '--version' || args[0] === '-v' ? ok('v22.12.0 (practice terminal)') : bad('node: only --version works in the practice terminal. Run real programs in Code mode.')
    case 'python':
    case 'python3':
      return args[0] === '--version' || args[0] === '-V' ? ok('Python 3.13.0 (practice terminal)') : bad(`${cmd}: only --version works here. Run Python in Code mode.`)
    case 'cd': {
      let rest = args
      while (rest.length && /^-[LPe@]+$/.test(rest[0]!)) rest = rest.slice(1)
      if (rest[0] === '--') rest = rest.slice(1)
      else if (rest[0] && rest[0] !== '-' && rest[0].startsWith('-')) return bad(`${where(ctx, line)}cd: ${rest[0].slice(0, 2)}: invalid option\ncd: usage: cd [-L|[-P [-e]] [-@]] [dir]`, 2)
      if (rest.length > 1) return bad(`${where(ctx, line)}cd: too many arguments`)
      const arg = rest[0]
      const target = arg === undefined ? HOME : arg === '-' ? s.prev : resolve(s.cwd, arg)
      const node = lookup(s, target)
      if (!node) return bad(`${where(ctx, line)}cd: ${arg}: No such file or directory`)
      if (node.kind !== 'dir') return bad(`${where(ctx, line)}cd: ${arg}: Not a directory`)
      s.prev = s.cwd
      s.cwd = target
      return ok(arg === '-' ? pretty(target) : '')
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
      const { rest } = flags(args)
      if (!rest.length) return bad('touch: missing file operand')
      for (const a of rest) {
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
      if (f.has('A')) ['v', 'E', 'T'].forEach((c) => f.add(c))
      if (f.has('e')) ['v', 'E'].forEach((c) => f.add(c))
      if (f.has('t')) ['v', 'T'].forEach((c) => f.add(c))
      if (f.has('s')) text = text.replace(/\n{3,}/g, '\n\n')
      if (f.has('v') || f.has('T'))
        text = [...text]
          .map((c) => {
            const n = c.charCodeAt(0)
            if (c === '\n') return c
            if (c === '\t') return f.has('T') ? '^I' : c
            if (!f.has('v')) return c
            if (n < 32) return `^${String.fromCharCode(n + 64)}`
            if (n === 127) return '^?'
            return c
          })
          .join('')
      if (f.has('E')) text = text.replace(/\n/g, '$\n')
      if (f.has('n') || f.has('b')) {
        let k = 0
        text = fromLines(toLines(text).map((l) => (f.has('b') && (l === '' || l === '$') ? l : `${String(++k).padStart(6)}\t${l}`)))
      }
      return result(text, got.errs, got.errs.length ? 1 : 0)
    }
    case 'head':
    case 'tail': {
      let n = 10
      let fromStart = false
      let bytes: number | null = null
      const files: string[] = []
      for (let i = 0; i < args.length; i++) {
        const a = args[i]!
        let v: string | undefined
        if (a === '-c' || /^-c\+?\d+$/.test(a)) {
          const c = a === '-c' ? args[++i] : a.slice(2)
          if (c === undefined || !/^\+?\d+$/.test(c)) return bad(`${cmd}: invalid number of bytes: '${c ?? ''}'`)
          fromStart = c.startsWith('+')
          bytes = Number(c.replace('+', ''))
          continue
        }
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
        if (bytes !== null) {
          const b = [...new TextEncoder().encode(src.text)]
          const picked = cmd === 'head' ? b.slice(0, bytes) : fromStart ? b.slice(Math.max(bytes - 1, 0)) : bytes === 0 ? [] : b.slice(-bytes)
          return (got.srcs.length > 1 ? `==> ${src.name} <==\n` : '') + new TextDecoder().decode(Uint8Array.from(picked))
        }
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
    case 'od': {
      const { flags: f, rest } = flags(args)
      const got = inputs(ctx, 'od', rest, stdin)
      if (isRes(got)) return got
      const b = new TextEncoder().encode(got.srcs.map((x) => x.text).join(''))
      const named: Record<number, string> = { 0: '\\0', 7: '\\a', 8: '\\b', 9: '\\t', 10: '\\n', 11: '\\v', 12: '\\f', 13: '\\r' }
      const cell = (x: number) => (f.has('c') ? (named[x] ?? (x >= 32 && x < 127 ? String.fromCharCode(x) : x.toString(8).padStart(3, '0'))).padStart(4) : ` ${x.toString(8).padStart(3, '0')}`)
      const lines: string[] = []
      for (let i = 0; i < b.length; i += 16) lines.push(i.toString(8).padStart(7, '0') + [...b.slice(i, i + 16)].map(cell).join(''))
      lines.push(b.length.toString(8).padStart(7, '0'))
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
    case 'typeset':
    case 'local':
    case 'readonly': {
      const fl: string[] = []
      const items: DeclItem[] = []
      for (const a of args) {
        if (/^[-+][a-zA-Z]+$/.test(a) && !items.length) {
          fl.push(a)
          continue
        }
        const m = /^([A-Za-z_]\w*)(\+?)=(.*)$/s.exec(a)
        items.push(m ? { name: m[1]!, assign: { name: m[1]!, append: m[2] === '+', value: [{ t: 'lit', s: m[3]!, q: true }] }, raw: a } : { name: a, assign: null, raw: a })
      }
      return declareCmd(ctx, expander(ctx, []), cmd, fl, items, line)
    }
    case 'unset': {
      const sc = ctx.scope
      let fnOnly = false
      const errs: string[] = []
      for (const a of args) {
        if (a === '-f') {
          fnOnly = true
          continue
        }
        if (a === '-v' || a === '-n') continue
        if (fnOnly) {
          delete sc.funcs[a]
          continue
        }
        const m = /^([A-Za-z_]\w*)(?:\[(.*)\])?$/s.exec(a)
        if (!m) {
          errs.push(`${where(ctx, line)}unset: \`${a}': not a valid identifier`)
          continue
        }
        if (sc.ro.includes(m[1]!)) {
          errs.push(`${where(ctx, line)}unset: ${m[1]}: cannot unset: readonly variable`)
          continue
        }
        if (m[2] !== undefined) {
          const arr = sc.arrays[m[1]!]
          if (m[2] === '@' || m[2] === '*') delete sc.arrays[m[1]!]
          else if (arr) delete arr.v[keyOf(ctx, arr, m[2])]
          else if (keyOf(ctx, undefined, m[2]) === '0') delete sc.vars[m[1]!]
          continue
        }
        if (sc.vars[a] === undefined && !sc.arrays[a] && sc.funcs[a]) {
          delete sc.funcs[a]
          continue
        }
        delete sc.vars[a]
        delete sc.arrays[a]
        const i = sc.exported.indexOf(a)
        if (i >= 0) sc.exported.splice(i, 1)
      }
      return result('', errs.map((e) => e), errs.length ? 1 : 0)
    }
    case 'set': {
      const sc = ctx.scope
      const o = sc.opts as Record<string, boolean | undefined>
      if (!args.length)
        return ok(
          Object.keys(sc.vars)
            .sort()
            .map((n) => `${n}=${/[\x00-\x1f\x7f]/.test(sc.vars[n]!) ? shellQuote(sc.vars[n]!) : shq(sc.vars[n]!)}`)
            .join('\n'),
        )
      const names: Record<string, string> = { errexit: 'e', nounset: 'u', xtrace: 'x', errtrace: 'E', noglob: 'f', pipefail: 'pipefail', verbose: 'v', noclobber: 'C', hashall: 'h', braceexpand: 'B', monitor: 'm' }
      for (let i = 0; i < args.length; i++) {
        const a = args[i]!
        if (a === '--' || a === '-') {
          sc.args = [sc.args[0]!, ...args.slice(i + 1)]
          if (sc.top) ctx.s.args = sc.args
          break
        }
        if (!/^[-+][a-zA-Z]+$/.test(a)) {
          // set word…: the words become $1 $2 …
          sc.args = [sc.args[0]!, ...args.slice(i)]
          if (sc.top) ctx.s.args = sc.args
          break
        }
        const on = a.startsWith('-')
        for (const c of a.slice(1)) {
          if (c === 'o') {
            const name = args[++i]
            if (name === undefined) return ok(Object.keys(names).sort().map((n) => `${n.padEnd(15)}\t${o[names[n]!] ? 'on' : 'off'}`).join('\n'))
            if (!names[name]) return bad(`${where(ctx, line)}set: ${name}: invalid option name`, 2)
            o[names[name]!] = on
          } else if ('xeuEfvChBm'.includes(c)) o[c] = on
          else return bad(`${where(ctx, line)}set: -${c}: invalid option\nset: usage: set [-abefhkmnptuvxBCEHPT] [-o option-name] [--] [-] [arg ...]`, 2)
        }
      }
      for (const k of Object.keys(o)) if (!o[k]) delete o[k]
      return ok()
    }
    case 'shopt': {
      const o = ctx.scope.opts as Record<string, boolean | undefined>
      const known = ['nullglob', 'failglob', 'inherit_errexit', 'extglob', 'nocasematch', 'dotglob', 'globstar', 'lastpipe', 'expand_aliases']
      let mode: 's' | 'u' | 'q' | null = null
      const lines: string[] = []
      let code = 0
      for (const a of args) {
        if (/^-[suqp]+$/.test(a)) {
          if (a.includes('s')) mode = 's'
          else if (a.includes('u')) mode = 'u'
          else if (a.includes('q')) mode = 'q'
          continue
        }
        if (!known.includes(a)) {
          lines.push(`${where(ctx, line)}shopt: ${a}: invalid shell option name`)
          code = 1
          continue
        }
        if (mode === 's') o[a] = true
        else if (mode === 'u') delete o[a]
        else if (mode === 'q') code = o[a] ? code : 1
        else lines.push(`${a.padEnd(15)}\t${o[a] ? 'on' : 'off'}`)
      }
      return { code, chunks: lines.length ? [[code ? 2 : 1, fromLines(lines)]] : [] }
    }
    case 'read':
      return readCmd(ctx, args, stdin, line)
    case 'mapfile':
    case 'readarray':
      return mapfileCmd(ctx, cmd, args, stdin, line)
    case 'getopts':
      return getoptsCmd(ctx, args, line)
    case 'trap':
      return trapCmd(ctx, args, line)
    case 'shift': {
      const n = args[0] === undefined ? 1 : Number(args[0])
      if (!Number.isInteger(n) || n < 0) return bad(`${where(ctx, line)}shift: ${args[0]}: numeric argument required`, 1)
      const sc = ctx.scope
      if (n > sc.args.length - 1) return { code: 1, chunks: [] }
      sc.args = [sc.args[0]!, ...sc.args.slice(1 + n)]
      if (sc.top && !ctx.funcs.length) ctx.s.args = sc.args
      return { code: 0, chunks: [] }
    }
    case 'break':
    case 'continue': {
      const n = args[0] === undefined ? 1 : Number(args[0])
      if (!ctx.loops) return bad(`${where(ctx, line)}${cmd}: only meaningful in a \`for', \`while', or \`until' loop`, 0)
      if (!Number.isInteger(n) || n < 1) return bad(`${where(ctx, line)}${cmd}: ${args[0]}: loop count out of range`, 1)
      return { code: 0, chunks: [], flow: { k: cmd, n: Math.min(n, ctx.loops) } }
    }
    case 'return': {
      if (!ctx.funcs.length && !ctx.sourced) return bad(`${where(ctx, line)}return: can only \`return' from a function or sourced script`, 1)
      const n = args[0] === undefined ? ctx.status : Number(args[0])
      if (!Number.isInteger(n)) return { ...bad(`${where(ctx, line)}return: ${args[0]}: numeric argument required`, 2), flow: { k: 'return' } }
      return { code: ((n % 256) + 256) % 256, chunks: [], flow: { k: 'return' } }
    }
    case 'exit': {
      const n = args[0] === undefined ? ctx.status : Number(args[0])
      if (args[0] !== undefined && !Number.isInteger(n)) return { ...bad(`${where(ctx, line)}exit: ${args[0]}: numeric argument required`, 2), exit: true }
      return { code: ((n % 256) + 256) % 256, chunks: [], exit: true }
    }
    case 'let': {
      if (!args.length) return bad(`${where(ctx, line)}let: expression expected`, 1)
      let v = 0
      try {
        for (const a of args) v = evalArith(a, ctx)
      } catch (e) {
        return bad(`${where(ctx, line)}let: ${(e as Error).message}`, 1)
      }
      return { code: v ? 0 : 1, chunks: [] }
    }
    case 'eval': {
      const text = args.join(' ')
      if (!text.trim()) return { code: 0, chunks: [] }
      try {
        return execList(ctx, parse(tokenize(text)), stdin)
      } catch (e) {
        return bad(`${where(ctx, line)}eval: ${(e as Error).message}`, 2)
      }
    }
    case 'command': {
      if (args[0] === '-v' || args[0] === '-V') {
        const lines: string[] = []
        let code = 0
        for (const a of args.slice(1)) {
          const kind = commandKind(ctx, a)
          if (!kind) code = 1
          else lines.push(args[0] === '-v' ? (kind === 'file' ? `/usr/bin/${a}` : a) : describeCommand(ctx, a, kind))
        }
        return { code, chunks: lines.length ? [[1, fromLines(lines)]] : [] }
      }
      if (!args.length) return { code: 0, chunks: [] }
      return dispatch(ctx, args, stdin, tty, line)
    }
    case 'test':
    case '[':
      return testCmd(ctx, cmd, args, line)
    case 'source':
    case '.':
      if (!args.length) return bad(`${where(ctx, line)}${cmd}: filename argument required\n${cmd}: usage: ${cmd} filename [arguments]`, 2)
      return runScript(ctx, args[0]!, args.slice(1), { child: false }, stdin, line)
    case 'bash':
    case 'sh': {
      let k = 0
      const opts: ShellState['opts'] = {}
      let check = false
      let command: string | null = null
      while (k < args.length && /^[-+]/.test(args[k]!) && command === null) {
        const a = args[k]!
        if (a === '--') {
          k++
          break
        }
        if (a === '-o' || a === '+o') {
          const name = args[++k]
          if (name === 'pipefail') opts.pipefail = true
          else if (name === 'errexit') opts.e = true
          else if (name === 'nounset') opts.u = true
          else if (name === 'xtrace') opts.x = true
          k++
          continue
        }
        for (const c of a.slice(1)) {
          if (c === 'c') command = ''
          else if (c === 'x') opts.x = true
          else if (c === 'n') check = true
          else if (c === 'e') opts.e = true
          else if (c === 'u') opts.u = true
          else if (c === 'E') opts.E = true
          else if (c !== 'l' && c !== 'i' && c !== 's') return bad(`${cmd}: -${c}: invalid option`, 2)
        }
        k++
        if (command !== null) command = args[k++] ?? ''
      }
      if (command !== null) {
        let ast: List
        try {
          ast = parse(tokenize(command))
        } catch (e) {
          return bad(`${cmd}: -c: line ${e instanceof ParseError ? e.line : 1}: ${(e as Error).message}`, 2)
        }
        if (check) return { code: 0, chunks: [] }
        const scope = childScope(ctx, cmd, [args[k] ?? cmd, ...args.slice(k + 1)], opts)
        scope.dashc = true
        return runChild(ctx, scope, ast, stdin)
      }
      if (k >= args.length) return bad(`${cmd}: an interactive shell inside the practice terminal is not supported — run a script instead: bash script.sh`, 2)
      return runScript(ctx, args[k]!, args.slice(k + 1), { child: true, opts, check }, stdin, line)
    }
    case 'type':
    case 'which': {
      const lines: string[] = []
      const errs: string[] = []
      let code = 0
      const names = args.filter((a) => !/^-[aptfP]+$/.test(a))
      const typeOnly = args.includes('-t')
      for (const a of names) {
        const kind = cmd === 'type' ? commandKind(ctx, a) : COMMANDS.includes(a) && !BUILTIN_ONLY.has(a) && !BUILTINS.includes(a) ? 'file' : null
        if (!kind) {
          code = 1
          if (cmd === 'type' && !typeOnly) errs.push(`${where(ctx, line)}type: ${a}: not found`)
          continue
        }
        if (cmd === 'which') lines.push(`/usr/bin/${a}`)
        else if (typeOnly) lines.push(kind)
        else lines.push(describeCommand(ctx, a, kind))
      }
      return result(fromLines(lines), errs, code)
    }
    case 'mktemp': {
      const { flags: f, rest } = flags(args)
      const tmpl = rest[0] ?? 'tmp.XXXXXXXXXX'
      const dir = f.has('d')
      const m = /X{3,}$/.exec(tmpl)
      if (!m) return bad(`mktemp: too few X's in template '${tmpl}'`)
      const base = rest[0] && (rest[0].includes('/') || !f.has('t')) ? tmpl : `/tmp/${tmpl}`
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let path = ''
      for (let tries = 0; tries < 50; tries++) {
        let seed = Number.parseInt(hash(`${s.history.length}:${tries}:${base}:${s.transcript.length}`), 16)
        let suffix = ''
        for (let i = 0; i < m[0].length; i++) {
          suffix += chars[seed % chars.length]
          seed = Math.floor(seed / chars.length) + (i + 7) * 131
        }
        path = resolve(s.cwd, base.slice(0, base.length - m[0].length) + suffix)
        if (!lookup(s, path)) break
      }
      mkdirp(s, parentOf(path)[0])
      if (dir) mkdirp(s, path)
      else {
        const err = writeFile(s, path, '', false)
        if (err) return bad(err.replace('bash', 'mktemp'))
      }
      const shown = base.startsWith('/') ? path : resolve(s.cwd, base) === path ? base.slice(0, base.length - m[0].length) + path.slice(path.length - m[0].length) : path
      return ok(shown)
    }
    case 'sleep':
    case 'wait':
      return { code: 0, chunks: [] }
    case 'readlink':
    case 'realpath': {
      const { rest } = flags(args)
      if (!rest.length) return bad(`${cmd}: missing operand`)
      const lines: string[] = []
      const errs: string[] = []
      for (const a of rest) {
        const p = resolve(s.cwd, a)
        if (cmd === 'readlink' && !args.some((x) => /^-[a-z]*[fem]/.test(x))) {
          errs.push('')
          continue
        }
        if (!lookup(s, parentOf(p)[0])) errs.push(`${cmd}: ${a}: No such file or directory`)
        else lines.push(p)
      }
      return result(fromLines(lines), errs.filter(Boolean), errs.length ? 1 : 0)
    }
    case 'awk':
      return awkCmd(ctx, args, stdin)
    case 'jq':
      return jqCmd(ctx, args, stdin)
    case 'paste':
    case 'join':
    case 'column':
      return tableCmd(ctx, cmd, args, stdin)
    case 'git':
      return git(ctx, args)
  }
  if (cmd.includes('/')) {
    const path = resolve(s.cwd, cmd)
    const node = lookup(s, path)
    if (!node) return bad(`${where(ctx, line)}${cmd}: No such file or directory`, 127)
    if (node.kind === 'dir') return bad(`${where(ctx, line)}${cmd}: Is a directory`, 126)
    if (!node.exec) return bad(`${where(ctx, line)}${cmd}: Permission denied`, 126)
    return execFile(ctx, cmd, node, args, stdin, tty, line)
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

function sedCmd(ctx: Ctx, args: string[], stdin: Stdin): Res {
  let quiet = false
  let extended = false
  let inPlace = false
  let suffix = ''
  const scripts: string[] = []
  const files: string[] = []
  let explicit = false
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!
    if (a === '--quiet' || a === '--silent') quiet = true
    else if (a === '--') {
      for (const f of args.slice(k + 1)) (!scripts.length && !explicit ? scripts : files).push(f)
      break
    } else if (a.startsWith('--in-place')) {
      inPlace = true
      suffix = a.slice('--in-place='.length)
    } else if (/^-[nEries]/.test(a) && a.length > 1) {
      for (let j = 1; j < a.length; j++) {
        const c = a[j]!
        if (c === 'n') quiet = true
        else if (c === 'E' || c === 'r') extended = true
        else if (c === 's') continue
        else if (c === 'i') {
          // -i.bak: everything after the i is the backup suffix.
          inPlace = true
          suffix = a.slice(j + 1)
          break
        } else if (c === 'e') {
          scripts.push(a.slice(j + 1) || (args[++k] ?? ''))
          explicit = true
          break
        } else return bad(`sed: invalid option -- '${c}'`)
      }
    } else if (!scripts.length && !explicit) scripts.push(a)
    else files.push(a)
  }
  if (!scripts.length) return bad('Usage: sed [-n] [-E] [-i] SCRIPT [FILE…]   e.g. sed \'s/old/new/g\' file.txt')
  let cmds: ReturnType<typeof compileSed>
  try {
    cmds = compileSed(scripts.join('\n'), extended)
  } catch (e) {
    return bad((e as Error).message)
  }
  const io: SedIO = {
    writeFile: (p, t, append) => writeFile(ctx.s, resolve(ctx.s.cwd, p), t, append),
    readFile: (p) => {
      const node = lookup(ctx.s, resolve(ctx.s.cwd, p))
      return node?.kind === 'file' ? node.content : { error: 'No such file or directory' }
    },
  }
  const runIt = (text: string): { out: string; code: number } | Res => {
    try {
      return runSedScript(cmds, text, quiet, io)
    } catch (e) {
      if (e instanceof SedError) return bad(e.message)
      throw e
    }
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
      if (suffix) {
        const [dir, base] = parentOf(path)
        const backup = suffix.includes('*') ? resolve(dir, suffix.replace(/\*/g, base)) : `${path}${suffix}`
        const err = writeFile(ctx.s, backup, node.content, false)
        if (err) {
          errs.push(err.replace(/^bash: /, 'sed: cannot rename '))
          continue
        }
      }
      const r = runIt(node.content)
      if (isRes(r)) return r
      writeFile(ctx.s, path, r.out, false)
    }
    return result('', errs, errs.length ? 2 : 0)
  }
  const got = inputs(ctx, 'sed', files, stdin)
  if (isRes(got)) return got
  const r = runIt(got.srcs.map((x) => x.text).join(''))
  if (isRes(r)) return r
  return result(r.out, got.errs.map((e) => e.replace(/^sed: (.*): No such/, "sed: can't read $1: No such")), got.errs.length ? 2 : r.code)
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
  else {
    repo.branches[repo.branch] = id
    logBranch(repo, repo.branch, id, msg)
  }
  if (id) repo.reflog.push({ id, msg })
}

/** Notes a branch's new position in its reflog (branch@{0}). */
function logBranch(repo: Repo, name: string, id: string | null, msg: string): void {
  if (!id) return
  ;(repo.branchLog[name] ??= []).push({ id, msg })
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
  const at = /^(.*)@\{([^}]*)\}$/.exec(base)
  if (at) {
    const [, who = '', sel = ''] = at
    const current = repo.detached === null ? repo.branch : null
    if (sel === 'u' || sel === 'upstream' || sel === 'push') {
      // @{u}: the branch this one tracks.
      const b = who === '' || who === 'HEAD' ? current : who
      const up = b ? repo.upstream[b] : undefined
      return up ? resolveRev(repo, up + suffix) : null
    }
    if (/^-\d+$/.test(sel) && who === '') return sel === '-1' && repo.prevBranch ? resolveRev(repo, repo.prevBranch + suffix) : null
    if (!/^\d+$/.test(sel)) return null
    const n = Number(sel)
    const log = who === 'HEAD' || (who === '' && !current) ? repo.reflog : repo.branchLog[who || current!]
    id = [...(log ?? [])].reverse()[n]?.id ?? null
  } else if (base === 'HEAD' || base === '@') id = headId(repo)
  else if (base === 'ORIG_HEAD') id = repo.origHead
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
function replay(g: G, c: Commit, mode: 'pick' | 'revert', opts: { mainline?: number; recordOrigin?: boolean } = {}): { done: Commit | null; empty?: boolean; conflict?: MergeResult } {
  const { s, root, repo } = g
  const base = opts.mainline === 2 ? (c.parent2 ?? null) : c.parent
  const parentTree = treeOf(repo, base)
  const ours = headTree(repo)
  const label = `${c.id} (${firstLine(c.message)})`
  const m = mode === 'pick' ? mergeTrees(parentTree, ours, c.tree, { ours: 'HEAD', theirs: label }) : mergeTrees(c.tree, ours, parentTree, { ours: 'HEAD', theirs: `parent of ${label}` })
  if (m.conflicts.length) {
    writeMergeResult(g, ours, m)
    return { done: null, conflict: m }
  }
  if (!changedFiles(ours, m.tree).length) return { done: null, empty: true }
  const message = replayMessage(c, mode, opts)
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
  let initial: string | null = null
  const plain: string[] = []
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!
    if (a === '-b' || a === '--initial-branch') initial = args[++k] ?? null
    else if (a.startsWith('--initial-branch=')) initial = a.slice(17)
    else if (!a.startsWith('-')) plain.push(a)
  }
  const name = plain[0]
  const fresh = (b: boolean) => {
    const r = newRepo(b)
    if (initial) {
      r.branch = initial
      r.branches = { [initial]: null }
    }
    return r
  }
  const dir = name ? resolve(s.cwd, name) : s.cwd
  if (!mkdirp(s, dir)) return bad(`fatal: cannot mkdir ${name}: Not a directory`, 128)
  if (bare) {
    if (s.repos[dir]?.bare) return ok(`Reinitialized existing Git repository in ${dir}/`)
    s.repos[dir] = fresh(true)
    return ok(`Initialized empty Git repository in ${dir}/`)
  }
  if (s.repos[dir] && lookup(s, `${dir}/.git`)) return ok(`Reinitialized existing Git repository in ${dir}/.git/`)
  mkdirp(s, `${dir}/.git`)
  s.repos[dir] = fresh(false)
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
  const head = branches[from.branch] || !Object.keys(branches).length ? from.branch : Object.keys(branches)[0]!
  repo.branch = head
  repo.branches = { [head]: branches[head] ?? null }
  repo.upstream[head] = `origin/${head}`
  s.repos[dest] = repo
  applyTree(s, dest, {}, treeOf(repo, branches[head]))
  if (branches[head]) repo.reflog.push({ id: branches[head]!, msg: `clone: from ${srcAbs}` })
  logBranch(repo, head, branches[head] ?? null, `clone: from ${srcAbs}`)
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
function revArgs(g: G, args: string[]): { include: string[]; exclude: string[]; paths: string[]; triple?: { base: string | null; a: string; b: string } } | Res {
  const { repo } = g
  const include: string[] = []
  const exclude: string[] = []
  const paths: string[] = []
  let triple: { base: string | null; a: string; b: string } | undefined
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
    const sym = /^(.*?)\.\.\.(.*)$/.exec(a)
    if (sym) {
      // A...B: what either has that the other does not (for diff: B against where they parted).
      const x = resolveRev(repo, sym[1] || 'HEAD')
      const y = resolveRev(repo, sym[2] || 'HEAD')
      if (!x || !y) return bad(`fatal: ambiguous argument '${a}': unknown revision or path not in the working tree.`, 128)
      const base = mergeBase(repo, x, y)
      include.push(x, y)
      if (base) exclude.push(base)
      triple = { base, a: x, b: y }
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
  return { include, exclude, paths, ...(triple ? { triple } : {}) }
}

const gitLog: GitFn = (g, args) => {
  const { repo } = g
  let oneline = false
  let graph = false
  let all = false
  let limit = Infinity
  let stat = false
  let patch = false
  let nameOnly = false
  let author: RegExp | null = null
  let grep: RegExp | null = null
  let pickaxe: string | null = null
  const rest: string[] = []
  const val = (a: string, flag: string, k: number): [string, number] => (a.length > flag.length ? [a.slice(flag.length).replace(/^=/, ''), k] : [args[k + 1] ?? '', k + 1])
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!
    if (a === '--oneline') oneline = true
    else if (a === '--graph') graph = true
    else if (a === '--all') all = true
    else if (a === '--stat') stat = true
    else if (a === '-p' || a === '-u' || a === '--patch') patch = true
    else if (a === '--name-only') nameOnly = true
    else if (a === '--author' || a.startsWith('--author=')) {
      const [v, nk] = val(a, '--author', k)
      k = nk
      try {
        author = new RegExp(v)
      } catch {
        author = new RegExp(v.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'))
      }
    } else if (a === '--grep' || a.startsWith('--grep=')) {
      const [v, nk] = val(a, '--grep', k)
      k = nk
      grep = new RegExp(v)
    } else if (a === '-S' || (a.startsWith('-S') && a.length > 2)) {
      const [v, nk] = val(a, '-S', k)
      k = nk
      pickaxe = v
    } else if (a === '--decorate' || a === '--no-decorate' || a === '--abbrev-commit' || a === '--no-merges' || a === '--first-parent') continue
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
  const hit = (f: string) => !r.paths.length || r.paths.some((p) => !p || f === p || f.startsWith(`${p}/`))
  if (r.paths.length) commits = commits.filter((c) => changedFiles(treeOf(repo, c.parent), c.tree).some(hit))
  if (author) commits = commits.filter((c) => author!.test(c.author ?? 'you'))
  if (grep) commits = commits.filter((c) => grep!.test(c.message))
  if (pickaxe !== null) {
    // -S text: commits that change how many times the text appears.
    const count = (t: string | undefined) => (t ?? '').split(pickaxe!).length - 1
    commits = commits.filter((c) => !c.parent2 && changedFiles(treeOf(repo, c.parent), c.tree).some((f) => hit(f) && count(treeOf(repo, c.parent)[f]) !== count(c.tree[f])))
  }
  if (Number.isFinite(limit)) commits = commits.slice(0, limit)
  const deco = decorations(repo)
  const entry = (c: Commit) => {
    const lines = logEntry(repo, c, oneline, deco)
    if (c.parent2 || (!stat && !patch && !nameOnly)) return lines
    const before = treeOf(repo, c.parent)
    const files = changedFiles(before, c.tree).filter(hit)
    const pick = (t: Record<string, string>) => Object.fromEntries(files.filter((f) => f in t).map((f) => [f, t[f]!]))
    const extra = [...(nameOnly ? files : []), ...(stat ? statLines(pick(before), pick(c.tree)) : []), ...(patch ? files.flatMap((f) => fileDiff(f, before[f], c.tree[f])) : [])]
    return [...lines, ...extra, ...(oneline || patch ? [] : [''])]
  }
  const lines = graph ? graphRows(commits, entry) : commits.flatMap(entry)
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
  if (r.triple) {
    from = treeOf(repo, r.triple.base)
    to = treeOf(repo, r.triple.b)
  } else if (revs.length >= 2) {
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
      delete repo.branchLog[n]
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
    repo.branchLog[b] = repo.branchLog[a] ?? []
    delete repo.branchLog[a]
    logBranch(repo, b, repo.branches[b] ?? null, `Branch: renamed refs/heads/${a} to refs/heads/${b}`)
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
    logBranch(repo, name, id, `branch: Created from ${start ?? 'HEAD'}`)
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
  // Like git: a file the two commits agree on keeps whatever you did to it;
  // a file they disagree on must be clean, or switching would lose your work.
  const head = headTree(repo)
  const target = treeOf(repo, targetId)
  const index = indexTree(repo)
  const work = workingTree(s, root)
  const paths = [...new Set([...Object.keys(head), ...Object.keys(target), ...Object.keys(index)])].sort()
  const blocked: string[] = []
  const untracked: string[] = []
  for (const f of paths) {
    if (head[f] === target[f]) continue
    if (index[f] !== head[f] && index[f] !== target[f]) blocked.push(f)
    else if (f in index ? work[f] !== index[f] && work[f] !== target[f] : f in work && f in target) (f in index ? blocked : untracked).push(f)
  }
  if (blocked.length)
    return bad(`error: Your local changes to the following files would be overwritten by checkout:\n${blocked.map((f) => `\t${f}`).join('\n')}\nCommit them, or stash them (git stash), before you switch branches.\nAborting`)
  if (untracked.length) return bad(`error: The following untracked working tree files would be overwritten by checkout:\n${untracked.map((f) => `\t${f}`).join('\n')}\nPlease move or remove them before you switch branches.\nAborting`)
  const left = targetId === repo.detached ? [] : orphans(repo)
  const nextIndex: Record<string, string> = {}
  for (const f of paths) {
    if (head[f] === target[f]) {
      if (f in index) nextIndex[f] = index[f]!
      continue
    }
    if (f in target) {
      nextIndex[f] = target[f]!
      if (work[f] !== target[f] && mkdirp(s, parentOf(`${root}/${f}`)[0])) writeFile(s, `${root}/${f}`, target[f]!, false)
    } else removePath(s, `${root}/${f}`)
  }
  repo.staged = Object.fromEntries(Object.entries(nextIndex).filter(([f, c]) => target[f] !== c))
  repo.removed = Object.keys(target).filter((f) => !(f in nextIndex))
  const after = workingTree(s, root)
  const carried = [...new Set([...Object.keys(target), ...Object.keys(nextIndex)])]
    .sort()
    .flatMap((f) => {
      if (f in target && (!(f in nextIndex) || !(f in after))) return [`D\t${f}`]
      if (!(f in target)) return [`A\t${f}`]
      return nextIndex[f] !== target[f] || after[f] !== nextIndex[f] ? [`M\t${f}`] : []
    })
  const lines: string[] = [...carried]
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

const gitSwitch = (g: G, all: string[], sub: 'switch' | 'checkout'): Res => {
  const quiet = all.includes('-q') || all.includes('--quiet')
  const r = switchTo(g, all.filter((a) => a !== '-q' && a !== '--quiet'), sub)
  return quiet ? { ...r, chunks: r.chunks.filter((c) => c[0] === 2) } : r
}

function switchTo(g: G, args: string[], sub: 'switch' | 'checkout'): Res {
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
    const oldLog = repo.branchLog[name]
    repo.branches[name] = id
    if (existed === undefined) delete repo.branchLog[name]
    logBranch(repo, name, id, `branch: Created from ${start ?? 'HEAD'}`)
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
      if (oldLog) repo.branchLog[name] = oldLog
      else delete repo.branchLog[name]
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
    logBranch(repo, name, repo.branches[name] ?? null, `branch: Created from refs/remotes/${remote[0]}/${name}`)
    const r = checkoutTo(g, { branch: name }, true)
    if (r.code) {
      delete repo.branches[name]
      delete repo.upstream[name]
      delete repo.branchLog[name]
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

const gitReflog: GitFn = (g, args) => {
  const { repo } = g
  const deco = decorations(repo)
  const rest = args.filter((a) => a !== 'show' && !a.startsWith('-'))
  const ref = rest[0] ?? 'HEAD'
  const name = ref === '@' ? 'HEAD' : ref
  const log = name === 'HEAD' ? repo.reflog : repo.branchLog[name]
  if (!log) return bad(`fatal: ambiguous argument '${ref}': unknown revision or path not in the working tree.`, 128)
  return ok(
    [...log]
      .reverse()
      .map((e, i) => {
        const d = i === 0 ? deco.get(e.id) : undefined
        return `${e.id}${d ? ` (${d.join(', ')})` : ''} ${name}@{${i}}: ${e.msg}`
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
    const opts = { ...(p.mainline ? { mainline: p.mainline } : {}), ...(p.recordOrigin ? { recordOrigin: true } : {}) }
    p.message = replayMessage(c, 'pick', opts)
    p.author = c.author ?? 'you'
    const r = replay(g, c, 'pick', opts)
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
    logBranch(repo, p.branch!, tip, `rebase (finish): refs/heads/${p.branch} onto ${commitById(repo, tip)?.parent ?? tip}`)
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
/** The message of a cherry-picked (-x notes the source) or reverted commit. */
function replayMessage(c: Commit, mode: 'pick' | 'revert', opts: { mainline?: number; recordOrigin?: boolean }): string {
  if (mode === 'pick') return opts.recordOrigin ? `${c.message.replace(/\n+$/, '')}\n\n(cherry picked from commit ${c.id})` : c.message
  const parent = opts.mainline === 2 ? c.parent2 : c.parent
  return c.parent2 && opts.mainline ? `Revert "${firstLine(c.message)}"\n\nThis reverts commit ${c.id}, reversing\nchanges made to ${parent}.` : `Revert "${firstLine(c.message)}"\n\nThis reverts commit ${c.id}.`
}

/** -m N / --mainline N, and the other arguments. */
function mainlineArg(args: string[]): { mainline?: number; rest: string[] } | Res {
  const rest: string[] = []
  let mainline: number | undefined
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!
    if (a === '-m' || a === '--mainline') {
      mainline = Number(args[++k])
      if (!Number.isInteger(mainline) || mainline < 1) return bad(`error: switch \`m' expects a numerical value`, 129)
    } else if (a.startsWith('--mainline=')) mainline = Number(a.slice(11))
    else rest.push(a)
  }
  return { ...(mainline !== undefined ? { mainline } : {}), rest }
}

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
  const ml = mainlineArg(args)
  if (isRes(ml)) return ml
  const recordOrigin = ml.rest.includes('-x')
  const revs = ml.rest.filter((a) => !a.startsWith('-'))
  if (!revs.length) return bad('usage: git cherry-pick <commit>…', 129)
  if (dirty(s, root, repo)) return bad('error: your local changes would be overwritten by cherry-pick.\nhint: commit your changes or stash them to proceed.\nfatal: cherry-pick failed', 128)
  const ids = pickList(g, revs)
  if (isRes(ids)) return ids
  for (const id of ids) {
    const merge = !!commitById(repo, id)?.parent2
    if (merge && !ml.mainline) return bad(`error: commit ${id} is a merge but no -m option was given.\nfatal: cherry-pick failed`, 128)
    if (!merge && ml.mainline) return bad(`error: mainline was specified but commit ${id} is not a merge.\nfatal: cherry-pick failed`, 128)
  }
  repo.pending = { kind: 'cherry-pick', message: '', conflicts: [], todo: ids, origHead: headId(repo), ...(ml.mainline ? { mainline: ml.mainline } : {}), ...(recordOrigin ? { recordOrigin } : {}) }
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
  const ml = mainlineArg(args)
  if (isRes(ml)) return ml
  const revs = ml.rest.filter((a) => !a.startsWith('-'))
  if (!revs.length) return bad('usage: git revert <commit>', 129)
  if (dirty(s, root, repo)) return bad('error: your local changes would be overwritten by revert.\nhint: commit your changes or stash them to proceed.\nfatal: revert failed', 128)
  const lines: string[] = []
  for (const rev of revs) {
    const id = resolveRev(repo, rev)
    const c = commitById(repo, id)
    if (!c) return bad(`fatal: bad revision '${rev}'`, 128)
    if (c.parent2 && !ml.mainline) return bad(`error: commit ${c.id} is a merge but no -m option was given.\nfatal: revert failed`, 128)
    if (!c.parent2 && ml.mainline) return bad(`error: mainline was specified but commit ${c.id} is not a merge.\nfatal: revert failed`, 128)
    const opts = ml.mainline ? { mainline: ml.mainline } : {}
    const r = replay(g, c, 'revert', opts)
    if (r.conflict) {
      repo.pending = { kind: 'revert', message: replayMessage(c, 'revert', opts), conflicts: [...r.conflict.conflicts], current: c.id, todo: [], origHead: headId(repo), author: authorName(g) }
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
  let range: string | null = null
  const plain: string[] = []
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!
    if (a === '-L') range = args[++k] ?? ''
    else if (a.startsWith('-L')) range = a.slice(2)
    else plain.push(a)
  }
  const files = plain.filter((a) => !a.startsWith('-'))
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
  let first = 1
  let last = lines.length
  if (range !== null) {
    // -L 3,5  -L 3,+2  -L 3  -L /regex/,+2
    const m = /^(\d+|\/[^/]*\/)?(?:,(\+?\d+|\/[^/]*\/)?)?$/.exec(range)
    const pos = (t: string, from: number) => (t.startsWith('/') ? lines.findIndex((l, i) => i >= from - 1 && new RegExp(t.slice(1, -1)).test(l)) + 1 : Number(t))
    if (!m) return bad(`fatal: invalid -L range: ${range}`, 128)
    first = m[1] ? pos(m[1], 1) : 1
    if (first < 1) return bad(`fatal: -L parameter '${m[1]}' starting at line 1: no match`, 128)
    last = m[2] === undefined ? (range.includes(',') ? lines.length : first) : m[2].startsWith('+') ? first + Number(m[2].slice(1)) - 1 : pos(m[2], first)
    if (first > lines.length) return bad(`fatal: file ${f} has only ${plural(lines.length, 'line')}`, 128)
    last = Math.min(last, lines.length)
  }
  const shown = lines.map((l, i) => [l, i] as const).filter(([, i]) => i + 1 >= first && i + 1 <= last)
  const w = Math.max(...shown.map(([, i]) => (owner[i]!.author ?? 'you').length))
  const nw = String(last).length
  return ok(shown.map(([l, i]) => `${owner[i]!.id} (${(owner[i]!.author ?? 'you').padEnd(w)} ${String(i + 1).padStart(nw)}) ${l}`).join('\n'))
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

function fetchRemote(g: G, name: string, prune = false): { lines: string[] } | Res {
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
  if (prune)
    for (const b of Object.keys(rem.branches))
      if (!from.branches[b]) {
        delete rem.branches[b]
        lines.push(` - [deleted]         (none)     -> ${name}/${b}`)
      }
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
  const prune = args.includes('--prune') || args.includes('-p')
  const lines: string[] = []
  for (const n of names) {
    const r = fetchRemote(g, n, prune)
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
    if (lease && !force && rem.branches[name] !== theirs) {
      // The remote moved since our last fetch: the lease protects that work.
      lines.push(` ! [rejected]        ${src} -> ${name} (stale info)`)
      errs.push(`error: failed to push some refs to '${rem.url}'`)
      continue
    }
    if (!ff && !force && !lease) {
      lines.push(` ! [rejected]        ${src} -> ${name} (${known ? 'non-fast-forward' : 'fetch first'})`)
      errs.push(
        `error: failed to push some refs to '${rem.url}'`,
        known
          ? 'hint: Updates were rejected because the tip of your current branch is behind\nhint: its remote counterpart. Integrate the remote changes (e.g.\nhint: \'git pull ...\') before pushing again.'
          : "hint: Updates were rejected because the remote contains work that you do not\nhint: have locally. This is usually caused by another person pushing to\nhint: the same branch. Integrate the remote changes (e.g. 'git pull ...')\nhint: before pushing again.",
      )
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

/* ── Objects: cat-file, describe, fsck ── */

const blobId = (content: string) => hash(`blob ${content}`)

/** The tree object for the files under `prefix` in a commit's tree: its entries, and its id. */
function treeObject(tree: Record<string, string>, prefix: string): { id: string; entries: { mode: string; type: 'blob' | 'tree'; id: string; name: string }[] } {
  const names = new Map<string, 'blob' | 'tree'>()
  for (const f of Object.keys(tree)) {
    if (prefix && !f.startsWith(`${prefix}/`)) continue
    const rest = prefix ? f.slice(prefix.length + 1) : f
    const [head, ...more] = rest.split('/')
    names.set(head!, more.length ? 'tree' : 'blob')
  }
  const entries = [...names.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([name, type]) => {
      const path = prefix ? `${prefix}/${name}` : name
      return { mode: type === 'tree' ? '040000' : '100644', type, id: type === 'tree' ? treeObject(tree, path).id : blobId(tree[path]!), name }
    })
  return { id: hash(`tree ${entries.map((e) => `${e.mode} ${e.name} ${e.id}`).join('\n')}`), entries }
}

type GitObject = { type: 'commit'; commit: Commit } | { type: 'tree'; tree: Record<string, string>; prefix: string } | { type: 'blob'; content: string } | { type: 'tag'; name: string }

/** What a name points at: a commit, rev:path (a file or a folder), rev^{tree}, a tag, or an object id. */
function findObject(repo: Repo, what: string): GitObject | null {
  const colon = what.indexOf(':')
  if (colon >= 0) {
    const c = commitById(repo, resolveRev(repo, what.slice(0, colon) || 'HEAD'))
    if (!c) return null
    const path = what.slice(colon + 1).replace(/^\.\/|\/$/g, '')
    if (!path) return { type: 'tree', tree: c.tree, prefix: '' }
    if (c.tree[path] !== undefined) return { type: 'blob', content: c.tree[path]! }
    if (Object.keys(c.tree).some((f) => f.startsWith(`${path}/`))) return { type: 'tree', tree: c.tree, prefix: path }
    return null
  }
  const treeOf1 = /^(.*)\^\{tree\}$/.exec(what)
  if (treeOf1) {
    const c = commitById(repo, resolveRev(repo, treeOf1[1]!))
    return c ? { type: 'tree', tree: c.tree, prefix: '' } : null
  }
  if (what in repo.tagNotes) return { type: 'tag', name: what }
  const c = commitById(repo, resolveRev(repo, what))
  if (c) return { type: 'commit', commit: c }
  if (/^[0-9a-f]{4,40}$/.test(what))
    for (const k of repo.commits) {
      const found = (prefix: string): GitObject | null => {
        const t = treeObject(k.tree, prefix)
        if (t.id.startsWith(what)) return { type: 'tree', tree: k.tree, prefix }
        for (const e of t.entries) {
          const path = prefix ? `${prefix}/${e.name}` : e.name
          if (e.type === 'blob' && e.id.startsWith(what)) return { type: 'blob', content: k.tree[path]! }
          if (e.type === 'tree') {
            const inner = found(path)
            if (inner) return inner
          }
        }
        return null
      }
      const hit = found('')
      if (hit) return hit
    }
  return null
}

const gitCatFile: GitFn = (g, args) => {
  const { repo } = g
  const flag = args.find((a) => /^-[tpse]$/.test(a))
  const what = args.find((a) => !a.startsWith('-'))
  if (!flag || !what) return bad('usage: git cat-file (-t | -s | -e | -p) <object>', 129)
  const obj = findObject(repo, what)
  if (!obj) return flag === '-e' ? { code: 1, chunks: [] } : bad(`fatal: Not a valid object name ${what}`, 128)
  if (flag === '-e') return { code: 0, chunks: [] }
  if (flag === '-t') return ok(obj.type)
  let text: string
  if (obj.type === 'blob') text = obj.content
  else if (obj.type === 'tree') text = fromLines(treeObject(obj.tree, obj.prefix).entries.map((e) => `${e.mode} ${e.type} ${e.id}\t${e.name}`))
  else if (obj.type === 'tag') {
    const id = repo.tags[obj.name]!
    text = `object ${id}\ntype commit\ntag ${obj.name}\ntagger ${authorName(g)}\n\n${repo.tagNotes[obj.name]}\n`
  } else {
    const c = obj.commit
    const who = c.author ?? 'you'
    text = `tree ${treeObject(c.tree, '').id}\n${c.parent ? `parent ${c.parent}\n` : ''}${c.parent2 ? `parent ${c.parent2}\n` : ''}author ${who}\ncommitter ${who}\n\n${c.message.replace(/\n*$/, '\n')}`
  }
  if (flag === '-s') return ok(String(new TextEncoder().encode(text).length))
  return out(text)
}

const gitDescribe: GitFn = (g, args) => {
  const { repo } = g
  const tagsToo = args.includes('--tags')
  const always = args.includes('--always')
  const abbrev0 = args.includes('--abbrev=0')
  const rev = args.find((a) => !a.startsWith('-')) ?? 'HEAD'
  const target = resolveRev(repo, rev)
  if (!target) return bad(`fatal: Not a valid object name ${rev}`, 128)
  const mine = ancestors(repo, target)
  const usable = Object.keys(repo.tags).filter((t) => tagsToo || t in repo.tagNotes)
  let best: { name: string; depth: number } | null = null
  for (const t of usable.sort()) {
    const id = repo.tags[t]!
    if (!mine.has(id)) continue
    const theirs = ancestors(repo, id)
    const depth = [...mine].filter((c) => !theirs.has(c)).length
    if (!best || depth < best.depth) best = { name: t, depth }
  }
  if (!best) {
    if (always) return ok(target)
    if (!tagsToo && Object.keys(repo.tags).some((t) => mine.has(repo.tags[t]!))) return bad(`fatal: No annotated tags can describe '${target}'.\nHowever, there were unannotated tags: try --tags.`, 128)
    return bad('fatal: No names found, cannot describe anything.', 128)
  }
  return ok(best.depth === 0 || abbrev0 ? best.name : `${best.name}-${best.depth}-g${target}`)
}

const gitFsck: GitFn = (g, args) => {
  const { repo } = g
  const useReflogs = !args.includes('--no-reflogs')
  const roots: (string | null | undefined)[] = [headId(repo), ...Object.values(repo.branches), ...Object.values(repo.tags), ...Object.values(repo.remotes).flatMap((r) => Object.values(r.branches)), ...repo.stash.map((x) => x.base)]
  if (useReflogs) roots.push(...repo.reflog.map((e) => e.id), ...Object.values(repo.branchLog).flatMap((l) => l.map((e) => e.id)))
  const kept = reachable(repo, roots)
  const lost = repo.commits.filter((c) => !kept.has(c.id))
  if (args.includes('--unreachable')) return ok(lost.map((c) => `unreachable commit ${c.id}`).sort().join('\n'))
  const parents = new Set(lost.flatMap((c) => [c.parent, c.parent2]))
  return ok(
    lost
      .filter((c) => !parents.has(c.id))
      .map((c) => `dangling commit ${c.id}`)
      .sort()
      .join('\n'),
  )
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
  'cat-file': gitCatFile,
  describe: gitDescribe,
  fsck: gitFsck,
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
  'which', 'git', 'awk', 'jq', 'paste', 'join', 'column', 'local', 'declare', 'typeset', 'readonly', 'return', 'break', 'continue', 'shift',
  'getopts', 'trap', 'let', 'eval', 'command', 'mapfile', 'readarray', 'shopt', 'mktemp', 'sleep', 'wait', 'readlink', 'realpath', 'od',
]
export const GIT_SUBS = [
  'init', 'clone', 'config', 'status', 'add', 'rm', 'commit', 'log', 'show', 'diff', 'restore', 'reset', 'branch', 'checkout', 'switch',
  'merge', 'stash', 'tag', 'reflog', 'cherry-pick', 'revert', 'rebase', 'bisect', 'blame', 'ls-files', 'check-ignore', 'remote', 'fetch',
  'pull', 'push', '--version', 'cat-file', 'describe', 'fsck',
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
  const asts: List[] = []
  for (const line of lines) {
    try {
      asts.push(parse(tokenize(line)))
    } catch {
      return false
    }
  }
  // Functions defined on one line may be called on the next.
  const defined = new Set<string>()
  const walk = (list: List, f: (c: Cmd) => void) => list.forEach((ao) => [ao.first, ...ao.rest.map((r) => r.pipe)].forEach((p) => p.cmds.forEach(f)))
  const collect = (c: Cmd): void => {
    if (c.type === 'func') defined.add(c.name)
  }
  asts.forEach((a) => walk(a, collect))
  const listOk = (list: List): boolean => list.every((ao) => [ao.first, ...ao.rest.map((r) => r.pipe)].every((p) => p.cmds.every(cmdOk)))
  const cmdOk = (c: Cmd): boolean => {
    switch (c.type) {
      case 'for':
      case 'cfor':
        return listOk(c.body)
      case 'while':
        return listOk(c.cond) && listOk(c.body)
      case 'if':
        return c.arms.every((a) => listOk(a.cond) && listOk(a.body)) && (!c.otherwise || listOk(c.otherwise))
      case 'case':
        return c.arms.every((a) => listOk(a.body))
      case 'group':
      case 'subshell':
        return listOk(c.body)
      case 'func':
        return cmdOk(c.body)
      case 'cond':
      case 'arith':
        return true
    }
    const words = c.words.filter((w) => !isAssignment(w)).map((w) => w.text)
    if (!words.length) return true
    const [name = '', sub = ''] = words
    if (!COMMANDS.includes(name) && !name.startsWith('./') && !defined.has(name)) return false
    return name !== 'git' || GIT_SUBS.includes(sub)
  }
  return asts.every(listOk)
}

/** A lesson's command lines, as they would be typed: prompts and comments dropped. */
export function commandLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.replace(/^\s*\$\s+/, '').trim())
    .filter((l) => l && !l.startsWith('#'))
}

const GIT_USAGE = `git, in the practice terminal (a real git has more, but these behave like it):

  start      init [--bare] [-b name]   clone <folder> [dir]   config [--global] user.name "…"
  look       status [-s]   log [--oneline --graph --all --stat -p --author=… -S text] [A..B] [A...B] [-n N]
             show [rev | rev:file]   diff [--staged] [rev [rev] | A...B]   blame [-L 3,5] <file>
             reflog [branch]   ls-files   check-ignore -v <file>   cat-file -t|-p <object>
             describe [--tags]   fsck [--no-reflogs]
  save       add <file | .>   rm [--cached] <file>   commit -m "…" [-a] [--amend]
  undo       restore [--staged] [--source=rev] <file>   reset [--soft|--mixed|--hard] <rev>
             revert [-m 1] <rev>   stash [push -m "…" | list | pop | apply | drop]
  branches   branch [-d|-D|-m|-a|-vv] [name]   switch [-c] <branch>   checkout <branch|rev|-- file>
             merge [--no-ff] <branch>   merge --abort   rebase <branch> (--continue|--skip|--abort)
             cherry-pick [-x] [-m 1] <rev> (--continue|--abort)   tag [-a name -m "…"] [rev]
  hunt       bisect start | good | bad | skip | run <cmd> | log | reset
  share      remote -v | add <name> <folder>   fetch [--prune]   pull [--rebase|--no-rebase]
             push [-u] [--force-with-lease] [origin] [branch]   (@{u} is the upstream, main@{1} the reflog)

A remote here is a folder on this pretend computer (make one with git init --bare).`

export const HELP = `This is a practice terminal: a pretend computer that lives in this page, so
nothing you type here can touch your real files.

  pwd  ls [-a -l -1]  cd <dir>  mkdir [-p]  touch  cp [-r]  mv  rm [-r]  rmdir  chmod +x
  echo  printf  cat  head/tail -n N  wc [-l -w -c]  tee [-a]  mktemp [-d]
  grep [-i -n -v -c -r -l -o -w -E] <pattern> [files]   find <dir> -name '*.txt' [-type f|d]
  sort [-n -r -u -k N -t ,]  uniq [-c -d]  cut -d , -f 2  tr a-z A-Z  sed 's/old/new/g'
  awk '{ print $1 }'  jq '.key'  paste  join  column -t
  xargs <cmd>  basename  dirname  seq  history  clear  help  git (type git help)

The shell: pipes  a | b,  lists  a && b,  a || b,  a ; b,  redirection  > >> < 2> 2>&1
&> /dev/null  <<EOF  <<<,  variables  NAME=value  $NAME  "\${NAME}"  export NAME  $?,
arrays  a=(x y)  "\${a[@]}",  $(command),  $((1 + 2)),  {a,b} {1..5},  wildcards  * ? [abc],
quotes '…' (as typed) and "…" (with $ expanded),
for f in *.txt; do …; done   for ((i=0; i<3; i++))   while …; do …; done
if [[ -f x ]]; then …; else …; fi   case $x in a|b) …;; *) …;; esac   name() { …; }
Scripts: bash [-x] script.sh args, or chmod +x script.sh then ./script.sh; source file.
set -x traces each command, set -e stops a script at the first failure, trap … EXIT cleans up.`
