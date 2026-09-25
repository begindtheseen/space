/* ============================================================================
   The practice terminal
   ----------------------------------------------------------------------------
   A shell that runs in the page: a small in-memory filesystem, the commands a
   beginner meets first (pwd, ls, cd, mkdir, touch, echo, cat, cp, mv, rm, …),
   `&&`, `>` and `>>`, and enough of git — init, status, add, commit, log,
   branch, checkout — to practise the loop every project runs on.

   It is a simulation and says so: nothing here touches the real machine, and
   the terminal work the curriculum asks for (M1) still belongs in a real
   terminal. What it is for is the first hour — learning what the commands
   mean somewhere that nothing can break.

   Pure: `run(state, line)` returns the output and a new state. The UI and the
   Learn-mode checks read the same state.
   ========================================================================== */

export const HOME = '/home/you'
export const START = '/home/you/project'

export type Node = { kind: 'dir'; children: Record<string, Node> } | { kind: 'file'; content: string }

interface Commit {
  id: string
  message: string
  /** The commit this one was made on top of. */
  parent: string | null
  /** Every tracked file's content at this commit, by path relative to the repo. */
  tree: Record<string, string>
}

interface Repo {
  branch: string
  branches: Record<string, string | null>
  staged: Record<string, string>
  commits: Commit[]
}

export interface ShellState {
  cwd: string
  prev: string
  root: Node & { kind: 'dir' }
  history: string[]
  /** Everything the terminal has printed, one entry per command. */
  transcript: { cmd: string; out: string }[]
  repos: Record<string, Repo>
}

export function newShell(): ShellState {
  const root: ShellState['root'] = { kind: 'dir', children: {} }
  const s: ShellState = { cwd: START, prev: START, root, history: [], transcript: [], repos: {} }
  mkdirp(s, START)
  return s
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

function mkdirp(s: ShellState, path: string): void {
  let node: Node = s.root
  for (const part of path.split('/').filter(Boolean)) {
    if (node.kind !== 'dir') throw new Error('not a directory')
    node.children[part] ??= { kind: 'dir', children: {} }
    node = node.children[part]!
  }
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

/* ── Parsing ─────────────────────────────────────────────────────────────── */

type Token = { text: string; op?: '&&' | '>' | '>>' | '|' }

/** Splits a command line on spaces, keeping quoted text together. */
export function tokenize(line: string): Token[] {
  const out: Token[] = []
  let cur = ''
  let has = false
  let quote: string | null = null
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!
    if (quote) {
      if (c === quote) quote = null
      else cur += c
      continue
    }
    if (c === '"' || c === "'") {
      quote = c
      has = true
      continue
    }
    const two = line.slice(i, i + 2)
    if (two === '&&' || two === '>>') {
      if (has) out.push({ text: cur })
      out.push({ text: two, op: two })
      cur = ''
      has = false
      i++
      continue
    }
    if (c === '>' || c === '|') {
      if (has) out.push({ text: cur })
      out.push({ text: c, op: c })
      cur = ''
      has = false
      continue
    }
    if (/\s/.test(c)) {
      if (has) out.push({ text: cur })
      cur = ''
      has = false
      continue
    }
    cur += c
    has = true
  }
  if (quote) throw new Error('unterminated quote')
  if (has) out.push({ text: cur })
  return out
}

/* ── Running ─────────────────────────────────────────────────────────────── */

export interface RunResult {
  state: ShellState
  out: string
  /** `clear` empties the screen, not the history. */
  clear?: boolean
}

/** Runs one line. Never throws: mistakes come back as output, like a shell. */
export function run(prev: ShellState, line: string): RunResult {
  const s = clone(prev)
  const trimmed = line.trim()
  if (!trimmed) return { state: s, out: '' }
  s.history.push(trimmed)

  let tokens: Token[]
  try {
    tokens = tokenize(trimmed)
  } catch (err) {
    const out = `bash: ${(err as Error).message}`
    s.transcript.push({ cmd: trimmed, out })
    return { state: s, out }
  }

  // Split on && and run each part while the previous one succeeded.
  const parts: Token[][] = [[]]
  for (const t of tokens) {
    if (t.op === '&&') parts.push([])
    else parts[parts.length - 1]!.push(t)
  }

  let out = ''
  let clear = false
  for (const part of parts) {
    const r = runOne(s, part)
    if (r.clear) {
      clear = true
      out = ''
    }
    if (r.out) out += (out && !out.endsWith('\n') ? '\n' : '') + r.out
    if (!r.ok) break
  }
  s.transcript.push({ cmd: trimmed, out })
  return { state: s, out: out.replace(/\n$/, ''), ...(clear ? { clear } : {}) }
}

interface Step {
  ok: boolean
  out: string
  clear?: boolean
}

function runOne(s: ShellState, tokens: Token[]): Step {
  if (!tokens.length) return { ok: false, out: 'bash: syntax error near `&&`' }
  if (tokens.some((t) => t.op === '|')) return { ok: false, out: 'Pipes (|) are not part of this practice terminal yet.' }

  // Redirection: `cmd args > file` or `>> file`.
  let redirect: { path: string; append: boolean } | null = null
  const ri = tokens.findIndex((t) => t.op === '>' || t.op === '>>')
  if (ri >= 0) {
    const target = tokens[ri + 1]
    if (!target || target.op) return { ok: false, out: 'bash: syntax error: expected a file after >' }
    redirect = { path: resolve(s.cwd, target.text), append: tokens[ri]!.op === '>>' }
    tokens = tokens.slice(0, ri)
  }

  const [cmd, ...args] = tokens.map((t) => t.text)
  const r = command(s, cmd!, args)
  if (redirect && r.ok) {
    const err = writeFile(s, redirect.path, r.out ? `${r.out}\n` : '', redirect.append)
    return err ? { ok: false, out: err } : { ok: true, out: '' }
  }
  return r
}

function writeFile(s: ShellState, path: string, text: string, append: boolean): string | null {
  const [dir, name] = parentOf(path)
  const parent = lookup(s, dir)
  if (!parent || parent.kind !== 'dir') return `bash: ${pretty(path)}: No such file or directory`
  const existing = parent.children[name]
  if (existing?.kind === 'dir') return `bash: ${pretty(path)}: Is a directory`
  parent.children[name] = { kind: 'file', content: append && existing?.kind === 'file' ? existing.content + text : text }
  return null
}

const ok = (out = ''): Step => ({ ok: true, out })
const bad = (out: string): Step => ({ ok: false, out })

function flags(args: string[]): { flags: Set<string>; rest: string[] } {
  const f = new Set<string>()
  const rest: string[] = []
  for (const a of args) {
    if (/^-[a-zA-Z]+$/.test(a)) for (const c of a.slice(1)) f.add(c)
    else rest.push(a)
  }
  return { flags: f, rest }
}

function command(s: ShellState, cmd: string, args: string[]): Step {
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
      return { ok: true, out: '', clear: true }
    case 'history':
      return ok(s.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n'))
    case 'echo':
      return ok(args.join(' '))
    case 'node':
      return args[0] === '--version' || args[0] === '-v' ? ok('v22.12.0 (practice terminal)') : bad('node: only --version works in the practice terminal. Run real programs in Code mode.')
    case 'python':
    case 'python3':
      return args[0] === '--version' || args[0] === '-V' ? ok('Python 3.13.0 (practice terminal)') : bad(`${cmd}: only --version works here. Run Python in Code mode.`)
    case 'cd': {
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
      const blocks: string[] = []
      for (const t of targets) {
        const node = lookup(s, resolve(s.cwd, t))
        if (!node) return bad(`ls: cannot access '${t}': No such file or directory`)
        if (node.kind === 'file') {
          blocks.push(t)
          continue
        }
        let names = Object.keys(node.children).sort()
        if (!f.has('a')) names = names.filter((n) => !n.startsWith('.'))
        else names = ['.', '..', ...names]
        const shown = f.has('l')
          ? names.map((n) => {
              const c = n === '.' || n === '..' ? { kind: 'dir' as const } : node.children[n]!
              const size = c.kind === 'file' ? (c as { content: string }).content.length : 4096
              return `${c.kind === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--'}  you  ${String(size).padStart(5)}  ${n}${c.kind === 'dir' ? '/' : ''}`
            })
          : names.map((n) => (n !== '.' && n !== '..' && node.children[n]?.kind === 'dir' ? `${n}/` : n))
        blocks.push((targets.length > 1 ? `${t}:\n` : '') + (f.has('l') ? shown.join('\n') : shown.join('  ')))
      }
      return ok(blocks.join('\n\n'))
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
        mkdirp(s, path)
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
      if (!args.length) return bad('cat: missing file operand')
      let out = ''
      for (const a of args) {
        const node = lookup(s, resolve(s.cwd, a))
        if (!node) return bad(`cat: ${a}: No such file or directory`)
        if (node.kind === 'dir') return bad(`cat: ${a}: Is a directory`)
        out += node.content
      }
      return ok(out.replace(/\n$/, ''))
    }
    case 'head':
    case 'tail': {
      let n = 10
      const rest: string[] = []
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-n') n = Number(args[++i])
        else if (/^-\d+$/.test(args[i]!)) n = Number(args[i]!.slice(1))
        else rest.push(args[i]!)
      }
      const node = rest[0] ? lookup(s, resolve(s.cwd, rest[0])) : undefined
      if (!node || node.kind !== 'file') return bad(`${cmd}: cannot open '${rest[0] ?? ''}' for reading: No such file`)
      const lines = node.content.replace(/\n$/, '').split('\n')
      return ok((cmd === 'head' ? lines.slice(0, n) : lines.slice(-n)).join('\n'))
    }
    case 'wc': {
      const { flags: f, rest } = flags(args)
      const node = rest[0] ? lookup(s, resolve(s.cwd, rest[0])) : undefined
      if (!node || node.kind !== 'file') return bad(`wc: ${rest[0] ?? ''}: No such file or directory`)
      const lines = node.content === '' ? 0 : node.content.split('\n').length - (node.content.endsWith('\n') ? 1 : 0)
      const words = node.content.split(/\s+/).filter(Boolean).length
      if (f.has('l')) return ok(`${lines} ${rest[0]}`)
      if (f.has('w')) return ok(`${words} ${rest[0]}`)
      return ok(`${lines} ${words} ${node.content.length} ${rest[0]}`)
    }
    case 'grep': {
      const { flags: f, rest } = flags(args)
      const [pattern, file] = rest
      if (!pattern || !file) return bad('usage: grep [-i] [-n] PATTERN FILE')
      const node = lookup(s, resolve(s.cwd, file))
      if (!node || node.kind !== 'file') return bad(`grep: ${file}: No such file or directory`)
      const needle = f.has('i') ? pattern.toLowerCase() : pattern
      const hits = node.content
        .replace(/\n$/, '')
        .split('\n')
        .map((l, i) => ({ l, i }))
        .filter(({ l }) => (f.has('i') ? l.toLowerCase() : l).includes(needle))
      if (!hits.length) return bad('')
      return ok(hits.map(({ l, i }) => (f.has('n') ? `${i + 1}:${l}` : l)).join('\n'))
    }
    case 'rm':
    case 'rmdir': {
      const { flags: f, rest } = flags(args)
      if (!rest.length) return bad(`${cmd}: missing operand`)
      for (const a of rest) {
        const path = resolve(s.cwd, a)
        if (path === '/') return bad(`${cmd}: it is dangerous to operate recursively on '/' — refusing`)
        const node = lookup(s, path)
        if (!node) {
          if (f.has('f')) continue
          return bad(`${cmd}: cannot remove '${a}': No such file or directory`)
        }
        if (node.kind === 'dir') {
          if (cmd === 'rmdir' && Object.keys(node.children).length) return bad(`rmdir: failed to remove '${a}': Directory not empty`)
          if (cmd === 'rm' && !f.has('r')) return bad(`rm: cannot remove '${a}': Is a directory (use rm -r)`)
        } else if (cmd === 'rmdir') return bad(`rmdir: failed to remove '${a}': Not a directory`)
        if (s.cwd === path || s.cwd.startsWith(`${path}/`)) return bad(`${cmd}: refusing to remove '${a}': you are inside it`)
        const [dir, name] = parentOf(path)
        delete (lookup(s, dir) as { children: Record<string, Node> }).children[name]
      }
      return ok()
    }
    case 'cp':
    case 'mv': {
      const { flags: f, rest } = flags(args)
      if (rest.length !== 2) return bad(`${cmd}: expected a source and a destination`)
      const src = resolve(s.cwd, rest[0]!)
      const node = lookup(s, src)
      if (!node) return bad(`${cmd}: cannot stat '${rest[0]}': No such file or directory`)
      if (cmd === 'cp' && node.kind === 'dir' && !f.has('r')) return bad(`cp: -r not specified; omitting directory '${rest[0]}'`)
      let dest = resolve(s.cwd, rest[1]!)
      if (lookup(s, dest)?.kind === 'dir') dest = `${dest}/${parentOf(src)[1]}`
      const [ddir, dname] = parentOf(dest)
      const parent = lookup(s, ddir)
      if (!parent || parent.kind !== 'dir') return bad(`${cmd}: cannot create '${rest[1]}': No such file or directory`)
      if (dest === src || dest.startsWith(`${src}/`)) return bad(`${cmd}: cannot ${cmd === 'mv' ? 'move' : 'copy'} '${rest[0]}' into itself`)
      parent.children[dname] = clone(node)
      if (cmd === 'mv') {
        const [sdir, sname] = parentOf(src)
        delete (lookup(s, sdir) as { children: Record<string, Node> }).children[sname]
        if (s.cwd === src || s.cwd.startsWith(`${src}/`)) s.cwd = dest + s.cwd.slice(src.length)
      }
      return ok()
    }
    case 'git':
      return git(s, args)
    default:
      return bad(`${cmd}: command not found. Type help to see what this practice terminal knows.`)
  }
}

/* ── git, enough to practise the loop ───────────────────────────────────── */

function repoFor(s: ShellState): { root: string; repo: Repo } | null {
  let dir = s.cwd
  for (;;) {
    const repo = s.repos[dir]
    if (repo && lookup(s, `${dir}/.git`)) return { root: dir, repo }
    if (dir === '/') return null
    dir = parentOf(dir)[0]
  }
}

/** Every file under the repo, path → content, skipping .git. */
function workingTree(s: ShellState, root: string): Record<string, string> {
  const out: Record<string, string> = {}
  const walk = (node: Node, rel: string) => {
    if (node.kind === 'file') out[rel] = node.content
    else for (const [name, child] of Object.entries(node.children)) if (name !== '.git') walk(child, rel ? `${rel}/${name}` : name)
  }
  walk(lookup(s, root)!, '')
  return out
}

function headTree(repo: Repo): Record<string, string> {
  const id = repo.branches[repo.branch]
  return repo.commits.find((c) => c.id === id)?.tree ?? {}
}

function git(s: ShellState, args: string[]): Step {
  const [sub, ...rest] = args
  if (!sub) return ok('usage: git <init | status | add | commit | log | branch | checkout | switch>')
  if (sub === '--version') return ok('git version 2.47.0 (practice terminal)')

  if (sub === 'init') {
    if (s.repos[s.cwd] && lookup(s, `${s.cwd}/.git`)) return ok(`Reinitialized existing Git repository in ${s.cwd}/.git/`)
    mkdirp(s, `${s.cwd}/.git`)
    s.repos[s.cwd] = { branch: 'main', branches: { main: null }, staged: {}, commits: [] }
    return ok(`Initialized empty Git repository in ${s.cwd}/.git/`)
  }

  const found = repoFor(s)
  if (!found) return bad('fatal: not a git repository (or any of the parent directories): .git')
  const { root, repo } = found
  const rel = (p: string) => resolve(s.cwd, p).slice(root.length + 1)

  switch (sub) {
    case 'status': {
      const work = workingTree(s, root)
      const head = headTree(repo)
      const staged = Object.keys(repo.staged).sort()
      const modified = Object.keys(work).filter((f) => f in head && head[f] !== work[f] && repo.staged[f] !== work[f])
      const untracked = Object.keys(work).filter((f) => !(f in head) && !(f in repo.staged))
      const lines = [`On branch ${repo.branch}`]
      if (!repo.commits.length) lines.push('', 'No commits yet')
      if (staged.length) lines.push('', 'Changes to be committed:', ...staged.map((f) => `        ${f in head ? 'modified' : 'new file'}:   ${f}`))
      if (modified.length) lines.push('', 'Changes not staged for commit:', ...modified.map((f) => `        modified:   ${f}`))
      if (untracked.length) lines.push('', 'Untracked files:', ...untracked.map((f) => `        ${f}`))
      if (!staged.length && !modified.length && !untracked.length) lines.push('', 'nothing to commit, working tree clean')
      return ok(lines.join('\n'))
    }
    case 'add': {
      if (!rest.length) return bad('Nothing specified, nothing added.')
      const work = workingTree(s, root)
      for (const a of rest) {
        const prefix = a === '.' || a === '-A' ? rel('.') : rel(a)
        const hits = Object.keys(work).filter((f) => !prefix || f === prefix || f.startsWith(`${prefix}/`))
        if (!hits.length) return bad(`fatal: pathspec '${a}' did not match any files`)
        for (const f of hits) repo.staged[f] = work[f]!
      }
      return ok()
    }
    case 'commit': {
      const mi = rest.indexOf('-m')
      const message = mi >= 0 ? rest[mi + 1] : undefined
      if (!message) return bad('Aborting commit: write the message with -m "what changed"')
      if (!Object.keys(repo.staged).length) return bad(`On branch ${repo.branch}\nnothing to commit (use "git add" to stage files)`)
      const tree = { ...headTree(repo), ...repo.staged }
      const id = hash(`${repo.commits.length}:${message}:${JSON.stringify(tree)}`)
      repo.commits.push({ id, message, parent: repo.branches[repo.branch] ?? null, tree })
      const n = Object.keys(repo.staged).length
      repo.staged = {}
      repo.branches[repo.branch] = id
      return ok(`[${repo.branch} ${id}] ${message}\n ${n} file${n === 1 ? '' : 's'} changed`)
    }
    case 'log': {
      const chain = history(repo)
      if (!chain.length) return bad(`fatal: your current branch '${repo.branch}' does not have any commits yet`)
      return ok(
        rest.includes('--oneline')
          ? chain.map((c) => `${c.id} ${c.message}`).join('\n')
          : chain.map((c) => `commit ${c.id}\n\n    ${c.message}`).join('\n\n'),
      )
    }
    case 'branch': {
      if (!rest.length) return ok(Object.keys(repo.branches).sort().map((b) => `${b === repo.branch ? '*' : ' '} ${b}`).join('\n'))
      if (rest[0]! in repo.branches) return bad(`fatal: a branch named '${rest[0]}' already exists`)
      repo.branches[rest[0]!] = repo.branches[repo.branch] ?? null
      return ok()
    }
    case 'checkout':
    case 'switch': {
      const create = rest[0] === '-b' || rest[0] === '-c'
      const name = create ? rest[1] : rest[0]
      if (!name) return bad(`usage: git ${sub} ${sub === 'switch' ? '[-c]' : '[-b]'} <branch>`)
      if (create) {
        if (name in repo.branches) return bad(`fatal: a branch named '${name}' already exists`)
        repo.branches[name] = repo.branches[repo.branch] ?? null
      } else if (!(name in repo.branches)) return bad(`error: pathspec '${name}' did not match any branch`)
      repo.branch = name
      return ok(`Switched to ${create ? 'a new ' : ''}branch '${name}'`)
    }
    default:
      return bad(`git: '${sub}' is not part of the practice terminal. Try: init, status, add, commit, log, branch, checkout.`)
  }
}

/** The commits reachable from the current branch, newest first. */
function history(repo: Repo): Commit[] {
  const byId = new Map(repo.commits.map((c) => [c.id, c]))
  const out: Commit[] = []
  let id = repo.branches[repo.branch] ?? null
  while (id) {
    const c = byId.get(id)
    if (!c) break
    out.push(c)
    id = c.parent
  }
  return out
}

function hash(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0
  return h.toString(16).padStart(7, '0').slice(0, 7)
}

/** The git facts Learn-mode checks read. */
export function gitInfo(s: ShellState, path: string): { commits: number; branch: string; staged: string[]; branches: string[] } | null {
  const repo = s.repos[path]
  if (!repo || !lookup(s, `${path}/.git`)) return null
  return {
    commits: history(repo).length,
    branch: repo.branch,
    staged: Object.keys(repo.staged),
    branches: Object.keys(repo.branches),
  }
}

export const HELP = `This is a practice terminal: a pretend computer that lives in this page, so
nothing you type here can touch your real files.

  pwd                  where am I?
  ls [-a] [-l] [dir]   what is here?
  cd <dir>             go somewhere (cd .. goes up, cd ~ goes home)
  mkdir [-p] <dir>     make a folder
  touch <file>         make an empty file
  echo <text>          print text   (echo hi > f.txt writes a file, >> adds to it)
  cat <file>           show a file
  head / tail -n N     the first / last lines of a file
  wc -l <file>         count lines
  grep [-i] <text> <f> find lines containing text
  cp [-r] <a> <b>      copy          mv <a> <b>   move or rename
  rm [-r] <path>       delete        rmdir <dir>  delete an empty folder
  git init | status | add | commit -m "msg" | log --oneline | branch | checkout -b
  history, clear, whoami

Join commands with && to run the next only if the first worked.`
