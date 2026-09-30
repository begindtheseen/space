/* ============================================================================
   ORBIT — the tutor for the Terminal and Git
   ----------------------------------------------------------------------------
   A terminal mistake is rarely "something is missing". It is a file name
   typed with a capital letter, a file made while standing in the wrong
   folder, a commit made before the add, the text written into the wrong
   file, a folder gone into before it was made. To say which, this replays
   what she typed, one command at a time, from the lesson's starting point:
   so it knows the folder she was in for every command, exactly which files
   each one made, changed or removed, and what the terminal said back.
   The lesson's own solution is replayed the same way, which gives the state
   the checks are looking for.

   With both, a failed check is explained by the evidence for it, in order:
     1. an error the terminal printed that she has not got past yet, read
        with the folder she was in and what exists (the name she meant, the
        folder it is really in, the command that should have come first);
     2. the check itself, set against her files, folders and repository and
        the solution's: a near name, the right file in the wrong place, the
        wrong file changed, > where >> was needed, the right commands in the
        wrong order, a commit on the wrong branch;
     3. only then, what the check says in general.
   ========================================================================== */
import { COMMANDS, GIT_SUBS, HOME, START, gitInfo, lookup, pretty, resolve, run as runShell, type Node, type ShellState } from '@/lib/shell'
import { checkFact, lessonShell } from './grade'
import { clip, closestSlip, code, describeSlip, distance, quote, slipOf, type Diagnosis } from './tutorText'
import type { LearnCheck } from './types'

/* ── Replaying ───────────────────────────────────────────────────────────── */

interface Entry {
  dir: boolean
  content?: string
}

export interface Change {
  kind: 'created' | 'deleted' | 'changed'
  path: string
  dir: boolean
}

export interface Step {
  line: string
  out: string
  status: number
  /** The folder she was in when she ran it, and after. */
  cwd: string
  cwdAfter: string
  changes: Change[]
  before: ShellState
  after: ShellState
}

/** Every file and folder in her home, by path. Git's own files are left out: they are not hers to look at. */
const snapshots = new WeakMap<ShellState, Map<string, Entry>>()
function snapshot(s: ShellState): Map<string, Entry> {
  // The same state is looked at many times while one run is explained: walked once.
  const known = snapshots.get(s)
  if (known) return known
  const out = new Map<string, Entry>()
  snapshots.set(s, out)
  const walk = (node: Node, path: string) => {
    if (node.kind === 'file') {
      out.set(path, { dir: false, content: node.content })
      return
    }
    out.set(path, { dir: true })
    for (const [name, child] of Object.entries(node.children)) if (name !== '.git') walk(child, `${path}/${name}`)
  }
  const home = lookup(s, HOME)
  if (home) walk(home, HOME)
  return out
}

function diff(a: Map<string, Entry>, b: Map<string, Entry>): Change[] {
  const out: Change[] = []
  for (const [p, e] of b) {
    const was = a.get(p)
    if (!was) out.push({ kind: 'created', path: p, dir: e.dir })
    else if (!e.dir && was.content !== e.content) out.push({ kind: 'changed', path: p, dir: false })
  }
  for (const [p, e] of a) if (!b.has(p)) out.push({ kind: 'deleted', path: p, dir: e.dir })
  return out
}

export function replay(start: ShellState, lines: readonly string[]): Step[] {
  const steps: Step[] = []
  let s = start
  let snap = snapshot(s)
  for (const line of lines) {
    if (!line.trim()) continue
    const r = runShell(s, line)
    const next = snapshot(r.state)
    steps.push({ line: line.trim(), out: r.out, status: r.state.status, cwd: s.cwd, cwdAfter: r.state.cwd, changes: diff(snap, next), before: s, after: r.state })
    s = r.state
    snap = next
  }
  return steps
}

/* ── Words for places ────────────────────────────────────────────────────── */

const here = (p: string) => code(pretty(p))
const base = (p: string) => p.slice(p.lastIndexOf('/') + 1)
const parent = (p: string) => p.slice(0, p.lastIndexOf('/')) || '/'

/** The shortest way to name `to` from `from`: `logs`, `../logs`, `~/notes`. */
function relative(from: string, to: string): string {
  if (from === to) return '.'
  const a = from.split('/').filter(Boolean)
  const b = to.split('/').filter(Boolean)
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  const ups = a.length - i
  const rel = [...Array(ups).fill('..'), ...b.slice(i)].join('/') || '.'
  return ups > 2 ? pretty(to) : rel
}

/** How one folder sits against another, said plainly. */
function whereAgainst(got: string, want: string): string {
  if (parent(got) === want) return `one folder too deep, inside ${here(got)}`
  if (parent(want) === got) return `one folder too high, in ${here(got)}`
  if (want.startsWith(`${got}/`)) return `too high up, in ${here(got)}`
  if (got.startsWith(`${want}/`)) return `too deep, in ${here(got)}`
  return `in ${here(got)}`
}

/** Words a command line is made of, quotes taken off: enough to find its file names. */
function words(line: string): string[] {
  return (line.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((w) => w.replace(/^["']|["']$/g, ''))
}

/* ── Reading what the terminal said ──────────────────────────────────────── */

const ERROR = /command not found|No such file|not found|cannot|invalid|denied|usage:|unterminated|not a |Not a |already exists|Is a directory|Directory not empty|fatal:|error:|nothing added|no changes added|nothing to commit|not something we can merge|missing operand|give it a file name|no text editor|omitting directory|syntax error|No configured push|no upstream|would be overwritten|merge conflicts|No stash/

/** Errors that mean something went wrong wherever they appear, even mid-pipeline where the line as a whole still succeeds. */
const HARD = /command not found|No such file or directory|not a git command|syntax error|unterminated quote|cannot open/

/** A misspelt command inside a line whose message was thrown away (2> /dev/null) or hidden by a pipe. */
function hiddenSlip(line: string): string | null {
  for (const seg of line.split(/\||&&|\|\||;/)) {
    const w = seg.trim().split(/\s+/)[0] ?? ''
    if (/^[A-Z]{2,}$/.test(w) && COMMANDS.includes(w.toLowerCase())) return w
    if (!/^[a-z]{2,}$/.test(w) || COMMANDS.includes(w) || ['for', 'do', 'done', 'if', 'then', 'fi', 'else', 'while', 'in', 'case', 'esac'].includes(w)) continue
    if (closestSlip(w, COMMANDS)) return w
  }
  return null
}

function isError(step: Step): boolean {
  // 127 is "command not found", even when 2> sent the message away.
  return (step.status !== 0 && ERROR.test(step.out)) || HARD.test(step.out) || step.status === 127 || ((!step.out.trim() || /\|/.test(step.line)) && !!hiddenSlip(step.line))
}

/** The command's name for matching one run against another: `git commit`, `touch`. */
function prog(line: string): string {
  const w = words(line.replace(/^\s*(?:sudo\s+)?/, ''))
  return w[0] === 'git' ? `git ${w[1] ?? ''}` : (w[0] ?? '')
}

/** The words of a line that name things (quoted text left out: an echo with other words is not a retry). */
const namesOf = (line: string) => line.match(/"[^"]*"|'[^']*'|\S+/g) ?? []

/**
 * Whether a later command got past this error: the same command run again on the same things,
 * or with one name, or the command itself, corrected. Another command of the same kind on other
 * files is not a retry: "mv shot2.png images/" does not fix "mv shot1.png images/".
 */
function resolvedLater(steps: Step[], i: number, ref: Step[] = []): boolean {
  const a = namesOf(steps[i]!.line)
  const norm = (l: string) => l.trim().replace(/\s+/g, ' ')
  // Only the next time she runs that command (or the one it was a slip for) can be the retry: in a
  // sequence like `git bisect bad` … `git bisect bad`, the later one is a different step.
  const same = (x: string, y: string) => x === y || x.toLowerCase() === y.toLowerCase() || !!slipOf(y, x) || y === x.slice(1)
  const next = steps.slice(i + 1).find((t) => same(words(steps[i]!.line)[0] ?? '', words(t.line)[0] ?? ''))
  return [next].filter((t): t is Step => !!t).some((t) => {
    if (t.status !== 0) return false
    // A line the solution runs more often than she ran it right is one she still owes, not a retry:
    // `bash hello.sh` before and after fixing the script, each `git bisect bad` of a bisect.
    const owed = ref.filter((r) => norm(r.line) === norm(t.line)).length
    if (owed > steps.filter((x) => x.status === 0 && norm(x.line) === norm(t.line)).length) return false
    const b = namesOf(t.line)
    if (a.join(' ') === b.join(' ')) return true
    if (a.length !== b.length) return false
    const diff = a.map((w, k) => (w === b[k] ? -1 : k)).filter((k) => k >= 0)
    const k = diff[0]!
    return diff.length === 1 && (!!slipOf(b[k]!, a[k]!) || a[k]!.toLowerCase() === b[k]!.toLowerCase() || b[k] === a[k]!.slice(1))
  })
}

interface Ctx {
  steps: Step[]
  i: number
  step: Step
  /** Her files and folders as they were just before the command, and at the end. */
  then: Map<string, Entry>
  now: Map<string, Entry>
  ref: Step[]
  /** The solution's files and folders at the end, and its text: which names are the task's. */
  want: Map<string, Entry>
  solution: string
}

const WINDOWS: Record<string, string> = { dir: 'ls', cls: 'clear', copy: 'cp', move: 'mv', del: 'rm', erase: 'rm', ren: 'mv', rename: 'mv', md: 'mkdir', rd: 'rmdir', type: 'cat', where: 'which', ipconfig: 'ip' }

/** The step, from here on, that first makes `path` exist: for "you did it in the wrong order". */
function madeLater(ctx: Ctx, path: string): Step | null {
  for (const t of ctx.steps.slice(ctx.i + 1)) if (t.changes.some((c) => c.kind === 'created' && c.path === path)) return t
  return null
}

/** Names of the files or folders (as asked) in a folder, at a moment. */
function namesIn(snap: Map<string, Entry>, dir: string, want?: 'dir' | 'file'): string[] {
  const out: string[] = []
  for (const [p, e] of snap) if (parent(p) === dir && p !== dir && (!want || (want === 'dir') === e.dir)) out.push(base(p))
  return out
}

/** Paths with this name anywhere in her home. */
function findByName(snap: Map<string, Entry>, name: string, want?: 'dir' | 'file'): string[] {
  const out: string[] = []
  for (const [p, e] of snap) if (base(p) === name && (!want || (want === 'dir') === e.dir)) out.push(p)
  return out
}

/**
 * A path she named that is not there: the name she meant, the folder it is really in,
 * or that it only came into being later. Null when there is nothing better than "not there".
 */
function missingPath(ctx: Ctx, arg: string, want: 'dir' | 'file' | undefined, verb: string): Diagnosis | null {
  if (!arg || /\$/.test(arg)) return null
  const cwd = ctx.step.cwd
  if (!resolve(cwd, arg).startsWith(HOME) && !arg.startsWith('/')) return null
  const full = resolve(cwd, arg)
  const name = base(full)
  const dir = parent(full)
  const what = want === 'dir' ? 'folder' : want === 'file' ? 'file' : 'file or folder'
  /** Whether a name is the task's own: the solution ends with it, or writes it. */
  const isTasks = (p: string) => ctx.want.has(p) || new RegExp(`(^|[\\s/>'"])${base(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[\\s/'"])`, 'm').test(ctx.solution)
  // A slash at the front: from the top of the computer, not from here.
  if (arg.startsWith('/') && !arg.startsWith(HOME) && (ctx.then.has(resolve(cwd, arg.slice(1))) || ctx.want.has(resolve(cwd, arg.slice(1)))))
    return {
      kind: 'error',
      key: `abs:${arg}`,
      say: `A slash at the very start, as in ${code(arg)}, means "start from the top of the whole computer", so the terminal looked for it there and not in your folder.`,
      more: `Leave the slash off: ${code(`${verb} ${arg.slice(1)}`)}.`,
      now: true,
    }
  // Already inside the folder the path starts with: "cd chapters", then "cat chapters/intro.txt".
  const first = arg.split('/')[0]!
  const plain = /[*?[]/.test(arg) ? arg.slice(0, arg.lastIndexOf('/')) : arg
  if (!ctx.then.has(dir) && arg.includes('/') && base(cwd) === first && ctx.then.has(resolve(parent(cwd), plain)))
    return {
      kind: 'folder',
      key: `inside:${cwd}`,
      say: `You're already inside ${code(first)}, so ${code(arg)} looks for another ${code(first)} folder in there.`,
      more: `From here, leave off the folder: ${code(arg.slice(first.length + 1))}. Or go back up first with ${code('cd ..')}.`,
      now: true,
    }
  // The folder it is meant to be in is not there either.
  if (!ctx.then.has(dir)) {
    const laterDir = madeLater(ctx, dir)
    if (laterDir)
      return { kind: 'order', key: `order-parent:${dir}`, say: `You ran ${code(ctx.step.line)} before the folder ${code(base(dir))} existed. You made the folder afterwards, with ${code(laterDir.line)}.`, more: `The folder has to come first. Now that it's there, run ${code(ctx.step.line)} again.`, now: true }
    const near = closestSlip(base(dir), namesIn(ctx.then, parent(dir), 'dir'))
    if (near)
      return isTasks(dir)
        ? { kind: 'spelling', key: `made-as:${near}`, say: `${code(ctx.step.line)} couldn't find the folder ${code(base(dir))}, because it was made as ${code(near)}: ${describeSlip(base(dir), near)}.`, more: `Rename it with ${code(`mv ${relative(cwd, `${parent(dir)}/${near}`)} ${relative(cwd, dir)}`)}, then run ${code(ctx.step.line)} again.`, now: true }
        : { kind: 'spelling', key: `parent:${base(dir)}`, say: `There's no folder called ${code(base(dir))} in ${here(parent(dir))}: you meant ${code(near)}, and ${describeSlip(near, base(dir))}.`, now: true }
    return { kind: 'error', key: `no-parent:${dir}`, say: `The folder ${here(dir)} doesn't exist yet, so nothing can go inside it.`, more: `Make the folder first with ${code(`mkdir ${relative(cwd, dir)}`)}, or make both at once with ${code('mkdir -p')}.` }
  }
  // It only came into being later: the order is the problem.
  const later = madeLater(ctx, full)
  if (later)
    return { kind: 'order', key: `order:${full}`, say: `You ran ${code(ctx.step.line)} before ${code(name)} existed. It was made afterwards, by ${code(later.line)}.`, more: `The order matters: make it first, then ${verb} it. Run ${code(ctx.step.line)} again now.`, now: true }
  // A near name in the same folder: either she typed this one wrong, or she made that one wrong.
  const near = closestSlip(name, namesIn(ctx.then, dir, want))
  if (near) {
    if (isTasks(full) && !isTasks(`${dir}/${near}`)) {
      const made = [...ctx.steps.slice(0, ctx.i)].reverse().find((t) => t.changes.some((c) => c.kind === 'created' && c.path === `${dir}/${near}`))
      return {
        kind: 'spelling',
        key: `made-as:${near}`,
        say: `${code(ctx.step.line)} couldn't find ${code(name)}, because ${made ? `${code(made.line)} made it as ${code(near)}` : `it's called ${code(near)}`}: ${describeSlip(name, near)}.`,
        more: `Rename it with ${code(`mv ${relative(cwd, `${dir}/${near}`)} ${relative(cwd, full)}`)}, then run ${code(ctx.step.line)} again.`,
        now: true,
      }
    }
    return { kind: 'spelling', key: `near:${name}`, say: `There's no ${what} called ${code(name)} in ${here(dir)}. You meant ${code(near)}: ${describeSlip(near, name)}.`, now: true }
  }
  // The same name, somewhere else.
  const elsewhere = findByName(ctx.then, name, want)
  if (elsewhere.length) {
    const found = elsewhere.sort((a, b) => a.length - b.length)[0]!
    const made = [...ctx.steps.slice(0, ctx.i)].reverse().find((t) => t.changes.some((c) => c.kind === 'created' && c.path === found))
    const why = made && made.cwd !== ctx.steps[0]?.cwd ? ` You made it with ${code(made.line)} while you were in ${here(made.cwd)}, so that's where it went.` : ''
    return {
      kind: 'place',
      key: `elsewhere:${name}`,
      say: `${code(name)} isn't in ${here(dir)}, where you were looking. It's in ${here(parent(found))}.${why}`,
      more: `From ${here(cwd)}, you can name it as ${code(relative(cwd, found))}, or go there first with ${code(`cd ${relative(cwd, parent(found))}`)}.`,
    }
  }
  // It was meant to be made, and what should have gone into it went into another file.
  const wanted = ctx.want.get(full)
  if (wanted && !wanted.dir && wanted.content?.trim()) {
    const text = wanted.content.trim().split('\n')[0]!
    const into = [...ctx.then].find(([p, e]) => p !== full && !e.dir && e.content?.split('\n').includes(text) && ctx.steps.slice(0, ctx.i).some((t) => t.changes.some((c) => c.path === p)))
    if (into)
      return { kind: slipOf(name, base(into[0])) ? 'spelling' : 'wrong-file', key: `into:${into[0]}`, say: `${code(name)} was never made: the text meant for it, ${quote(text)}, went into ${code(relative(cwd, into[0]))}${slipOf(name, base(into[0])) ? `, a near name: ${describeSlip(name, base(into[0]))}` : ''}.`, more: `After the ${code('>')}, write the name of the file it belongs in: ${code(name)}.` }
  }
  return null
}

/** One error the terminal printed, explained with what was there when she ran it. */
function readError(ctx: Ctx): Diagnosis | null {
  const { step } = ctx
  const out = step.out
  const w = words(step.line)
  const cmd = w[0] ?? ''
  const cwd = step.cwd
  let m: RegExpMatchArray | null

  // A command the terminal does not know (127: even when its message went into a file).
  const hidden = !out.trim() || /\|/.test(step.line) ? hiddenSlip(step.line) : null
  if ((m = out.match(/^(?:[\w./-]+: )?(\S+): command not found/m)) || (hidden && (m = ['', hidden] as unknown as RegExpMatchArray)) || (step.status === 127 && !COMMANDS.includes(cmd) && !cmd.includes('/') && (m = ['', cmd] as unknown as RegExpMatchArray))) {
    const name = m[1]!
    if (w[1] === '=' || /^[A-Za-z_]\w*\s+=/.test(step.line) || /^[A-Za-z_]\w*=\s/.test(step.line))
      return { kind: 'error', key: `assign:${name}`, say: 'When you set a variable, there are no spaces around the equals sign. With a space, the terminal thinks the name is a command.', more: `Write it joined up: ${code(step.line.replace(/\s*=\s*/, '='))}.`, now: true }
    if (COMMANDS.includes(name.toLowerCase()))
      return { kind: 'spelling', key: `cmd-case:${name}`, say: `Commands are all small letters: it's ${code(name.toLowerCase())}, not ${code(name)}.`, now: true }
    if (WINDOWS[name.toLowerCase()])
      return { kind: 'error', key: `windows:${name}`, say: `${code(name)} is a Windows command. On this terminal, like on a Mac or Linux, the command is ${code(WINDOWS[name.toLowerCase()]!)}.`, now: true }
    if ((GIT_SUBS as readonly string[]).includes(name))
      return { kind: 'error', key: `no-git:${name}`, say: `${code(name)} is a Git command, so it needs ${code('git')} in front of it.`, more: `Like this: ${code(`git ${step.line}`)}.`, now: true }
    const file = ctx.then.get(resolve(cwd, name))
    if (file && !file.dir)
      return /\.(sh|bash)$/.test(name)
        ? { kind: 'error', key: `script:${name}`, say: `To run a script in this folder, start its name with ${code('./')}. On its own, the terminal looks for a command called ${code(name)}.`, more: `Type ${code(`./${name}`)}, or ${code(`bash ${name}`)}.`, now: true }
        : { kind: 'error', key: `file-as-cmd:${name}`, say: `${code(name)} is a file, not a command, so typing its name doesn't do anything with it.`, more: `To see what's inside, type ${code(`cat ${name}`)}.`, now: true }
    const taskCmds = ctx.ref.map((t) => words(t.line)[0] ?? '').filter(Boolean)
    // The solution's command that is the same line apart from this word settles it (`ca pilot.txt` is
    // `cat pilot.txt`, not `cd`); then one she was part-way through typing.
    const rest = w.slice(1).join(' ')
    const sameLine = ctx.ref.map((t) => words(t.line)).find((r) => r[0] && r[0] !== name && slipOf(r[0], name) && r.slice(1).join(' ') === rest)?.[0]
    const typing = taskCmds.find((c) => c.startsWith(name) && c.length === name.length + 1)
    const near = sameLine ?? typing ?? closestSlip(name, taskCmds) ?? closestSlip(name, COMMANDS.filter((c) => c.startsWith(name))) ?? closestSlip(name, [...COMMANDS, 'clear', 'less', 'more', 'man'])
    if (near) return { kind: 'spelling', key: `cmd:${name}`, say: `There's no command called ${code(name)}. You meant ${code(near)}: ${describeSlip(near, name)}.`, now: true }
    return { kind: 'error', key: `cmd:${name}`, say: `The terminal doesn't know a command called ${code(name)}.`, more: `Check the spelling against the lesson, or type ${code('help')} to see every command this terminal knows.` }
  }
  if (/no text editor in the practice terminal/.test(out))
    return { kind: 'error', key: 'editor', say: `There's no text editor in this terminal, so ${code(cmd)} can't open a file.`, more: `To write into a file, use ${code('echo "text" > file')}. Two arrows, ${code('>>')}, add a line to the end instead of replacing everything.`, now: true }

  // Going into a folder.
  if ((m = out.match(/cd: (.+?): No such file or directory/)))
    return missingPath(ctx, m[1]!, 'dir', 'cd') ?? { kind: 'error', key: `cd:${m[1]}`, say: `There's no folder called ${code(m[1]!)} in ${here(cwd)}, where you are.`, more: `Type ${code('ls')} to see which folders are here.` }
  if ((m = out.match(/cd: (.+?): Not a directory/)))
    return { kind: 'error', key: `cd-file:${m[1]}`, say: `${code(m[1]!)} is a file, not a folder, so you can't go into it.`, more: `To read what's in it, type ${code(`cat ${m[1]}`)}.`, now: true }
  if (/cd: too many arguments/.test(out))
    return { kind: 'error', key: 'cd-args', say: `${code('cd')} takes one folder. If the folder's name has a space in it, put the name in quotes.`, more: `Like ${code('cd "my folder"')}.` }

  // Making files and folders whose folder is not there.
  if ((m = out.match(/touch: (.+?): No such file or directory/)) || (m = out.match(/mkdir: cannot create directory '(.+?)': No such file or directory/))) {
    const arg = m[1]!.replace(/^~\/project\//, '')
    const target = m[1]!.startsWith('~') ? resolve(cwd, m[1]!) : resolve(cwd, arg)
    const d = missingPath({ ...ctx }, relative(cwd, target), cmd === 'mkdir' ? 'dir' : 'file', cmd)
    if (d) return d
  }
  if ((m = out.match(/mkdir: cannot create directory '(.+?)': File exists/))) {
    // Harmless when it is the folder she wanted: say nothing, so the real problem is found.
    const e = ctx.then.get(resolve(cwd, m[1]!))
    if (e?.dir) return null
    const made = [...ctx.steps.slice(0, ctx.i)].reverse().find((t) => t.changes.some((c) => c.kind === 'created' && c.path === resolve(cwd, m![1]!)))
    return {
      kind: made ? 'wrong-file' : 'error',
      key: `mkdir-file:${m[1]}`,
      say: `There's already a file called ${code(m[1]!)} here${made ? `: ${code(made.line)} made it` : ''}, so a folder can't have that name too.`,
      more: `Remove the file first with ${code(`rm ${m[1]}`)}, then make the folder${made && />/.test(made.line) ? `, and send that text into the file it was meant for` : ''}.`,
    }
  }

  // Reading, copying, moving or removing something that is not there.
  if (
    (m = out.match(/cannot open '(.+?)' for reading/)) ||
    (m = out.match(/find: '(.+?)': No such file or directory/)) ||
    (m = out.match(/(?:cat|head|tail|wc|grep|sort|uniq|cut|tr|chmod|ls|source|bash|sh|\.): (?:cannot access ')?(.+?)'?: No such file or directory/)) ||
    (m = out.match(/(?:cp|mv): cannot stat '(.+?)': No such file or directory/)) ||
    (m = out.match(/rm: cannot remove '(.+?)': No such file or directory/))
  ) {
    const arg = m[1]!
    return missingPath(ctx, arg, undefined, cmd) ?? { kind: 'error', key: `nofile:${arg}`, say: `There's no file called ${code(arg)} in ${here(cwd)}, where you ran ${code(cmd)}.`, more: `Type ${code('ls')} to see what's here, and check the name letter by letter.` }
  }
  if ((m = out.match(/(?:cannot move '.+?' to|cannot create regular file|mv: cannot create) '(.+?)': (?:Not a directory|No such file or directory)/))) {
    const dest = m[1]!.replace(/\/$/, '')
    const d = missingPath(ctx, m[1]!.endsWith('/') ? dest : relative(cwd, parent(resolve(cwd, dest))), 'dir', cmd)
    if (d) return d
    return { kind: 'error', key: `dest:${dest}`, say: `There's no folder ${code(dest)} to put it in.`, more: `Make it first with ${code(`mkdir -p ${dest}`)}.` }
  }
  if ((m = out.match(/^(?:bash: )?(.+?): Is a directory/m)) && />/.test(step.line))
    return { kind: 'error', key: `into-dir:${m[1]}`, say: `${code(m[1]!.replace(/^~\/project\//, ''))} is a folder, so text can't be written into it directly.`, more: `Write into a file inside it instead, like ${code(`${m[1]!.replace(/^~\/project\//, '')}/notes.txt`)}.` }
  if ((m = out.match(/^(?:bash: )?(.+?): No such file or directory/m)) && />/.test(step.line) && !cmd.includes('/')) {
    const target = m[1]!.startsWith('~') ? relative(cwd, resolve(cwd, m[1]!)) : m[1]!
    const d = missingPath(ctx, target, 'file', 'write to')
    if (d) return d
  }
  if ((m = out.match(/^(?:bash: )?(?:\.\/)?(.+?): No such file or directory/m)) && cmd.includes('/'))
    return missingPath(ctx, cmd, 'file', 'run') ?? { kind: 'error', key: `noscript:${cmd}`, say: `There's no file ${code(cmd)} to run from ${here(cwd)}.` }

  // The wrong kind of thing.
  if ((m = out.match(/cat: (.+?): Is a directory/)))
    return { kind: 'error', key: `cat-dir:${m[1]}`, say: `${code(m[1]!)} is a folder, and ${code('cat')} only shows what's inside files.`, more: `To see what's in the folder, use ${code(`ls ${m[1]}`)}.`, now: true }
  if ((m = out.match(/rm: cannot remove '(.+?)': Is a directory/)))
    return { kind: 'error', key: `rm-dir:${m[1]}`, say: `${code(m[1]!)} is a folder. ${code('rm')} on its own only removes files.`, more: `To remove a folder and everything inside it, add ${code('-r')}: ${code(`rm -r ${m[1]}`)}. Double-check the name first: there's no undo.`, now: true }
  if ((m = out.match(/rmdir: failed to remove '(.+?)': Directory not empty/)))
    return { kind: 'error', key: `rmdir:${m[1]}`, say: `${code('rmdir')} only removes empty folders, and ${code(m[1]!)} still has something in it.`, more: `Empty it first, or remove it with everything inside using ${code(`rm -r ${m[1]}`)}.` }
  if ((m = out.match(/cp: -r not specified; omitting directory '(.+?)'/)))
    return { kind: 'error', key: `cp-dir:${m[1]}`, say: `${code(m[1]!)} is a folder, and ${code('cp')} only copies folders when you add ${code('-r')}.`, more: `Like this: ${code(step.line.replace(/^cp\s+/, 'cp -r '))}.`, now: true }
  if ((m = out.match(/(mv|cp): target '(.+?)' is not a directory/))) {
    const d = !ctx.then.has(resolve(cwd, m[2]!)) ? missingPath(ctx, m[2]!, 'dir', m[1]!) : null
    if (d) return d
    return { kind: 'error', key: `target:${m[2]}`, say: `When ${code(m[1]!)} gets more than two names, the last one has to be a folder to put them all in, and ${code(m[2]!)} isn't one.`, more: `Check the order: the things to ${m[1] === 'mv' ? 'move' : 'copy'} come first, the folder last.` }
  }
  if ((m = out.match(/(\S+): Permission denied/))) {
    const f = m[1]!.replace(/^bash: /, '')
    const later = ctx.steps.slice(ctx.i + 1).find((t) => /^chmod\b.*\+?x/.test(t.line) && t.status === 0)
    if (later) return { kind: 'order', key: `order-chmod:${f}`, say: `You tried to run ${code(f)} before making it runnable. You ran ${code(later.line)} afterwards.`, more: `Now it's allowed to run: try ${code(step.line)} again.`, now: true }
    return { kind: 'error', key: `perm:${f}`, say: `${code(f)} isn't allowed to run yet: a new file is only for reading and writing.`, more: `Give it permission to run with ${code(`chmod +x ${f.replace(/^\.\//, '')}`)}, then run it again.`, now: true }
  }
  if (/missing operand|give it a file name|usage:|expected a source and a destination|filename argument required/.test(out))
    return { kind: 'error', key: `operand:${cmd}`, say: `${code(cmd)} needs to be told what to work on: a file or folder name after it.`, more: refExample(ctx, cmd) ?? `Put the name after the command, with a space between.` }
  if ((m = out.match(/(\S+): invalid option -- '(.)'/)) || (m = out.match(/(\S+): illegal option -- (.)/)) || (m = out.match(/(\S+): -(.): invalid option/))) {
    const example = refExample(ctx, m[1]!)
    return { kind: 'error', key: `option:${m[1]}-${m[2]}`, say: `${code(m[1]!)} doesn't have a ${code(`-${m[2]}`)} option. Options are case-sensitive, so check the letter and whether it's a capital.`, more: example ?? undefined }
  }
  if (/unterminated quote/.test(out))
    return { kind: 'error', key: 'quote', say: 'A quote mark opens and never closes, so the terminal is still waiting for the end of the text.', more: 'Every quote needs a partner of the same kind: " with ", and \' with \'.', now: true }
  if (/syntax error near unexpected token/.test(out)) {
    const kw = closestSlip(cmd, ['for', 'while', 'until', 'if', 'then', 'else', 'elif', 'fi', 'do', 'done', 'case', 'esac', 'function'])
    if (kw) return { kind: 'spelling', key: `keyword:${cmd}`, say: `${code(cmd)} should be ${code(kw)}: ${describeSlip(kw, cmd)}. Without the right word, the terminal can't tell where the loop or the if begins.`, now: true }
    return { kind: 'error', key: `syntax:${step.line}`, say: `The terminal couldn't read ${code(step.line)}: something in how it's written is out of place.`, more: 'Look for a missing quote, a bracket that does not close, or a symbol like > or | with nothing after it.' }
  }
  if ((m = out.match(/invalid number of (lines|bytes): '(.+?)'/)))
    return { kind: 'error', key: `number:${cmd}`, say: `After ${code('-n')}, ${code(cmd)} needs a number, and ${code(m[2]!)} isn't one.`, more: `Like ${code(`${cmd} -n 5 file`)}.` }

  // Git.
  if ((m = out.match(/git: '(.+?)' is not a git command/))) {
    const near = closestSlip(m[1]!, GIT_SUBS as readonly string[])
    return near
      ? { kind: 'spelling', key: `gitsub:${m[1]}`, say: `Git doesn't have a command called ${code(m[1]!)}. You meant ${code(`git ${near}`)}: ${describeSlip(near, m[1]!)}.`, now: true }
      : { kind: 'error', key: `gitsub:${m[1]}`, say: `Git doesn't have a command called ${code(m[1]!)}.`, more: `Type ${code('git help')} to see the ones this terminal knows.` }
  }
  if (/not a git repository/.test(out)) {
    const repos = Object.keys(ctx.step.before.repos).filter((p) => gitInfo(ctx.step.before, p))
    if (repos.length) {
      const r = repos.sort((a, b) => a.length - b.length)[0]!
      return { kind: 'place', key: `outside:${r}`, say: `You're in ${here(cwd)}, which is outside the repository. The repository is ${here(r)}.`, more: `Go into it first: ${code(`cd ${relative(cwd, r)}`)}.`, now: true }
    }
    const init = ctx.steps.slice(ctx.i + 1).find((t) => /^git init\b/.test(t.line) && t.status === 0)
    if (init) return { kind: 'order', key: 'order-init', say: `You used ${code(prog(step.line))} before ${code('git init')}. Git can only work in a folder once it's a repository.`, more: `You've run ${code('git init')} since, so run ${code(step.line)} again now.`, now: true }
    return { kind: 'error', key: 'no-repo', say: `${here(cwd)} isn't a Git repository yet, so Git has nothing to work with here.`, more: `${code('git init')} turns the folder you're in into one. Make sure you're in the right folder first.` }
  }
  if ((m = out.match(/pathspec '(.+?)' did not match any files/)) || (m = out.match(/pathspec '(.+?)' did not match any file\(s\) known to git/))) {
    const d = missingPath(ctx, m[1]!, 'file', 'git add')
    if (d) return d
    return { kind: 'error', key: `pathspec:${m[1]}`, say: `Git can't find a file called ${code(m[1]!)} in ${here(cwd)}.`, more: `Type ${code('git status')} to see the files Git can see, and their exact names.` }
  }
  if (/nothing added to commit|no changes added to commit/.test(out) && /-m\s/.test(step.line)) {
    const msg = step.line.match(/-m\s+["']([^"']+)["']/)?.[1]
    const madeLaterCommit = msg && ctx.steps.slice(ctx.i + 1).some((t) => /^git commit\b/.test(t.line) && t.status === 0 && t.line.includes(msg))
    const addLater = ctx.steps.slice(ctx.i + 1).find((t) => /^git add\b/.test(t.line) && t.status === 0)
    if (msg && !madeLaterCommit && addLater)
      return { kind: 'order', key: `order-commit:${msg}`, say: `The commit ${quote(msg)} never happened: you ran ${code('git commit')} before adding, and ${code(addLater.line)} came afterwards.`, more: `Add first, then commit. Run ${code(step.line)} again now.`, now: true }
  }
  if (/nothing added to commit|no changes added to commit/.test(out)) {
    const repo = repoOf(ctx.step.before, cwd)
    const tracked = gitInfo(ctx.step.before, repo)?.tracked ?? []
    const stray = ctx.steps.slice(0, ctx.i).flatMap((t) => t.changes.filter((c) => c.kind === 'created' && !c.dir)).map((c) => c.path).find((p) => tracked.some((f) => slipOf(f, relative(repo, p))))
    if (stray) {
      const meant = tracked.find((f) => slipOf(f, relative(repo, stray)))!
      return { kind: 'spelling', key: `stray:${stray}`, say: `Your change went into ${code(relative(repo, stray))}, a near name for ${code(meant)}: ${describeSlip(meant, relative(repo, stray))}. So ${code(meant)} didn't change, and there was nothing new to commit.`, more: `Put the change into ${code(meant)}, add it, and commit again.`, now: true }
    }
    const addLater = ctx.steps.slice(ctx.i + 1).findIndex((t) => /^git add\b/.test(t.line) && t.status === 0)
    const commitAfter = addLater >= 0 && ctx.steps.slice(ctx.i + 1 + addLater + 1).some((t) => /^git commit\b/.test(t.line) && t.status === 0)
    if (addLater >= 0 && !commitAfter)
      return { kind: 'order', key: 'order-add-commit', say: `You committed before adding: Git only commits what's been added with ${code('git add')}, so that commit had nothing in it. You added afterwards.`, more: `Now the change is staged, so run ${code('git commit')} again.`, now: true }
    const info = gitInfo(ctx.step.before, repo)
    const waiting = info ? [...info.modified, ...info.untracked.filter((f) => !info.ignored.includes(f))] : []
    return {
      kind: 'git',
      key: 'nothing-staged',
      say: `Git didn't make a commit, because nothing was added. A commit only takes what you've put in with ${code('git add')}${waiting.length ? `, and ${waiting.slice(0, 2).map(code).join(' and ')} ${waiting.length === 1 ? 'is' : 'are'} still waiting to be added` : ''}.`,
      more: waiting.length ? `Run ${code(`git add ${waiting[0]}`)}, then commit again.` : `First ${code('git add')} the file, then commit. ${code('git status')} shows what's added and what isn't.`,
      now: true,
    }
  }
  if (/nothing to commit, working tree clean/.test(out))
    return { kind: 'git', key: 'clean', say: 'There was nothing new to commit: everything was already saved in the last commit.', more: 'Change or make the file first, add it, and then commit.' }
  if ((m = out.match(/pathspec '(.+?)' did not match any branch/))) {
    const info = gitInfo(ctx.step.before, repoOf(ctx.step.before, cwd))
    const near = info ? closestSlip(m[1]!, info.branches) : null
    if (near) return { kind: 'spelling', key: `branch:${m[1]}`, say: `There's no branch called ${code(m[1]!)}. You meant ${code(near)}: ${describeSlip(near, m[1]!)}.`, now: true }
    return { kind: 'git', key: `nobranch:${m[1]}`, say: `There's no branch called ${code(m[1]!)} yet, so there's nothing to switch to.`, more: `To make it and move onto it in one go: ${code(`git switch -c ${m[1]}`)}.`, now: true }
  }
  if ((m = out.match(/src refspec (\S+) does not match any/))) {
    const info = gitInfo(ctx.step.before, repoOf(ctx.step.before, cwd))
    const near = info ? closestSlip(m[1]!, info.branches) : null
    if (near) return { kind: 'spelling', key: `made-branch:${near}`, say: `There's no branch ${code(m[1]!)} to push, because it was made as ${code(near)}: ${describeSlip(m[1]!, near)}.`, more: `Rename it with ${code(`git branch -m ${near} ${m[1]}`)}, then push again.`, now: true }
    return { kind: 'git', key: `refspec:${m[1]}`, say: `There's no branch called ${code(m[1]!)} here to push.`, more: `${code('git branch')} lists the branches you have.` }
  }
  if ((m = out.match(/a branch named '(.+?)' already exists/)))
    return { kind: 'git', key: `exists:${m[1]}`, say: `The branch ${code(m[1]!)} is already there, so it can't be made again.`, more: `To move onto it, use ${code(`git switch ${m[1]}`)}, without ${code('-c')}.`, now: true }
  if ((m = out.match(/merge: (.+?) - not something we can merge/))) {
    const info = gitInfo(ctx.step.before, repoOf(ctx.step.before, cwd))
    const near = info ? closestSlip(m[1]!, info.branches) : null
    return { kind: near ? 'spelling' : 'git', key: `merge:${m[1]}`, say: `There's no branch called ${code(m[1]!)} to merge.${near ? ` You meant ${code(near)}: ${describeSlip(near, m[1]!)}.` : ''}`, more: near ? undefined : `${code('git branch')} lists the branches there are.` }
  }
  if ((m = out.match(/cannot delete branch '(.+?)'.*you are on it/)))
    return { kind: 'git', key: `delete-current:${m[1]}`, say: `You can't delete ${code(m[1]!)} while you're on it.`, more: `Switch to another branch first, like ${code('git switch main')}, then delete it.`, now: true }
  if ((m = out.match(/the branch '(.+?)' is not fully merged/)))
    return { kind: 'git', key: `unmerged:${m[1]}`, say: `${code(m[1]!)} has commits that aren't in any other branch yet, so Git won't delete it and lose them.`, more: `Merge it first, or if you really want those commits gone, use ${code(`git branch -D ${m[1]}`)}.` }
  if (/No configured push destination|does not appear to be a git repository/.test(out))
    return { kind: 'git', key: 'no-remote', say: "Git doesn't know where to push yet: this repository has no remote.", more: `Add one with ${code('git remote add origin <path>')}, then push to it.` }
  if ((m = out.match(/The current branch (\S+) has no upstream branch/)))
    return { kind: 'git', key: `upstream:${m[1]}`, say: `The first push of ${code(m[1]!)} needs to say where it goes.`, more: `Use ${code(`git push -u origin ${m[1]}`)}. After that, a plain ${code('git push')} works.`, now: true }
  if (/would be overwritten by (?:checkout|merge)/.test(out))
    return { kind: 'git', key: 'overwrite', say: "You have changes that aren't committed, and switching would overwrite them, so Git stopped.", more: `Commit them first, or put them aside with ${code('git stash')}, then try again.` }
  if (/Committing is not possible because you have unmerged files/.test(out)) {
    const addLater = ctx.steps.slice(ctx.i + 1).find((t) => /^git add\b/.test(t.line) && t.status === 0)
    if (addLater) return { kind: 'order', key: 'order-conflict-add', say: `You ran ${code('git commit')} before telling Git the conflict was fixed. ${code(addLater.line)} came afterwards.`, more: `Now that it's added, run ${code('git commit')} again.`, now: true }
    return { kind: 'git', key: 'unmerged', say: "Git won't commit yet, because a file still has an unfixed conflict.", more: `Fix the file, then ${code('git add')} it to mark it done, then commit.` }
  }
  if (/edit all merge conflicts|you need to resolve your current index/.test(out) || /CONFLICT/.test(out))
    return { kind: 'git', key: 'conflict', say: 'There is a merge conflict: the same lines were changed on both branches, and Git needs you to choose.', more: `Open the file, keep the lines you want, delete the ${code('<<<<<<<')}, ${code('=======')} and ${code('>>>>>>>')} marker lines, then ${code('git add')} it and commit.` }
  if (/does not have any commits yet/.test(out))
    return { kind: 'order', key: 'no-commits', say: "This branch doesn't have any commits yet, so there's nothing for that to work on.", more: `Make the first commit before this: ${code('git add')} a file, then ${code('git commit')}.` }
  if ((m = out.match(/ambiguous argument '(.+?)': unknown revision/)))
    return { kind: 'git', key: `rev:${m[1]}`, say: `Git can't find ${code(m[1]!)}. If it counts back with ${code('~')}, there aren't that many commits yet.`, more: `${code('git log --oneline')} shows the commits there are.` }
  if (/No stash entries found/.test(out))
    return { kind: 'git', key: 'no-stash', say: 'There is nothing stashed to bring back.', more: `${code('git stash')} puts changes aside first; ${code('git stash list')} shows what's there.` }
  if ((m = out.match(/fatal: destination path '(.+?)' already exists/)))
    return { kind: 'git', key: `clone-exists:${m[1]}`, say: `There's already a folder called ${code(m[1]!)} here, so Git won't clone into it.`, more: 'Clone into a new name, or from a different folder.' }

  // Anything else it said.
  const first = out.split('\n').find((l) => ERROR.test(l)) ?? out.split('\n')[0] ?? ''
  return first ? { kind: 'error', key: `said:${first.slice(0, 40)}`, say: `When you ran ${code(step.line)}, the terminal said ${quote(first.replace(/^bash: /, ''))}.`, more: 'Read that message slowly: it names the part it could not do.' } : null
}

/** The repository a folder is in, if any. */
function repoOf(s: ShellState, cwd: string): string {
  let p = cwd
  while (p && p !== '/') {
    if (s.repos[p]) return p
    p = parent(p)
  }
  return cwd
}

/** How the solution uses a command, as an example to point at. */
function refExample(ctx: Ctx, cmd: string): string | null {
  const use = ctx.ref.find((t) => words(t.line)[0] === cmd)
  return use ? `The task's version looks like ${code(use.line)}.` : null
}

/* ── Checks, against her state and the solution's ────────────────────────── */

const at = (p: string) => resolve(START, p)

interface FactCtx {
  steps: Step[]
  ref: Step[]
  her: ShellState
  want: ShellState
  herSnap: Map<string, Entry>
  wantSnap: Map<string, Entry>
}

/** The step of hers that made (or last changed) a path. */
function whoMade(fc: FactCtx, path: string, kind: Change['kind'] = 'created'): Step | null {
  for (let i = fc.steps.length - 1; i >= 0; i--) if (fc.steps[i]!.changes.some((c) => c.kind === kind && c.path === path)) return fc.steps[i]!
  return null
}

/** A file or folder that is not where the check wants it: the near name, the other place, the other kind. */
function notThere(fc: FactCtx, path: string, want: 'dir' | 'file'): Diagnosis | null {
  const name = base(path)
  const dir = parent(path)
  const what = want === 'dir' ? 'folder' : 'file'
  const other = fc.herSnap.get(path)
  if (other && other.dir !== (want === 'dir')) {
    const made = whoMade(fc, path)
    return want === 'file'
      ? { kind: 'check', key: `kind:${path}`, say: `${code(name)} is there, but as a folder, not a file${made ? `: ${code(made.line)} made a folder` : ''}.`, more: `${code('mkdir')} makes folders; ${code('touch')} makes an empty file. Remove the folder with ${code(`rmdir ${relative(fc.her.cwd, path)}`)}, then make the file.` }
      : { kind: 'check', key: `kind:${path}`, say: `${code(name)} is there, but as a file, not a folder${made ? `: ${code(made.line)} made a file` : ''}.`, more: `${code('touch')} makes files; ${code('mkdir')} makes folders. Remove the file with ${code(`rm ${relative(fc.her.cwd, path)}`)}, then make the folder.` }
  }
  // The folder it goes in is missing, or misspelt.
  if (!fc.herSnap.has(dir)) {
    const nearDir = closestSlip(base(dir), namesIn(fc.herSnap, parent(dir), 'dir'))
    if (nearDir)
      return { kind: 'spelling', key: `dirname:${dir}`, say: `The folder is meant to be called ${code(base(dir))}, and yours is ${code(nearDir)}: ${describeSlip(base(dir), nearDir)}.`, more: `Rename it with ${code(`mv ${relative(fc.her.cwd, `${parent(dir)}/${nearDir}`)} ${relative(fc.her.cwd, dir)}`)}.` }
  }
  // A near name, where it should be.
  const near = closestSlip(name, namesIn(fc.herSnap, dir, want))
  if (near) {
    const made = whoMade(fc, `${dir}/${near}`)
    return {
      kind: 'spelling',
      key: `name:${name}:${near}`,
      say: `You made ${code(near)}, but the task asks for ${code(name)}: ${describeSlip(name, near)}.`,
      more: `Rename it: ${code(`mv ${relative(fc.her.cwd, `${dir}/${near}`)} ${relative(fc.her.cwd, path)}`)}.${made ? '' : ''}`,
      now: true,
    }
  }
  // The right name, in the wrong place.
  const elsewhere = findByName(fc.herSnap, name, want).filter((p) => p !== path)
  const nearElsewhere = elsewhere.length ? [] : [...fc.herSnap.keys()].filter((p) => (fc.herSnap.get(p)!.dir === (want === 'dir')) && slipOf(name, base(p)) && parent(p) !== dir)
  const found = elsewhere[0] ?? nearElsewhere[0]
  if (found) {
    const made = whoMade(fc, found)
    const why = made && made.cwd !== fc.steps[0]?.cwd && !words(made.line).some((w) => w.includes('/'))
      ? ` You ran ${code(made.line)} while you were in ${here(made.cwd)}, so that's where it went.`
      : made
        ? ` ${code(made.line)} put it there.`
        : ''
    const spelt = base(found) !== name ? `, and the name is off too: ${describeSlip(name, base(found))}` : ''
    return {
      kind: 'place',
      key: `place:${name}:${parent(found)}`,
      say: `You made ${code(base(found))}, but it's in ${here(parent(found))}, and the task wants it in ${here(dir)}${spelt}.${why}`,
      more: `Move it with ${code(`mv ${relative(fc.her.cwd, found)} ${relative(fc.her.cwd, path)}`)}.`,
    }
  }
  // She ran the solution's command for it, but it made nothing, or she never did.
  const refMade = fc.ref.find((t) => t.changes.some((c) => c.kind === 'created' && c.path === path))
  if (refMade)
    return { kind: 'missing', key: `missing:${path}`, say: `There's no ${what} called ${code(name)} in ${here(dir)} yet.`, more: `A ${what} is made with ${code(words(refMade.line)[0]!)}. Make sure you're in ${here(refMade.cwd)} when you run it, or give the path.` }
  return { kind: 'missing', key: `missing:${path}`, say: `There's no ${what} called ${code(name)} in ${here(dir)} yet.` }
}

/** A file whose content is not what the check wants: where the text went instead, and how. */
function wrongContent(fc: FactCtx, path: string, wantText: string | null, mode: string): Diagnosis | null {
  const name = base(path)
  const mine = fc.herSnap.get(path)?.content ?? ''
  const target = wantText ?? fc.wantSnap.get(path)?.content ?? null
  if (target === null) return null
  if (mode !== 'excludes' && mine.replace(/\n$/, '') === target.replace(/\n$/, '')) return null
  const lines = (t: string) => t.replace(/\n$/, '').split('\n')
  const want = lines(target)
  const got = lines(mine)
  const printed = fc.steps.find((t) => want.some((l) => l.trim() && t.out.split('\n').includes(l)) && /^echo|^printf/.test(t.line) && !/>/.test(t.line))
  // The text went into another file.
  const holdsText = (e: Entry) => !e.dir && !!e.content && want.every((l) => !l.trim() || e.content!.includes(l))
  const otherFile = [...fc.herSnap].find(([p, e]) => p !== path && holdsText(e) && (whoMade(fc, p, 'changed') !== null || whoMade(fc, p) !== null))
  if (!mine.trim()) {
    if (otherFile)
      return { kind: 'wrong-file', key: `into:${otherFile[0]}`, say: `The text went into ${code(relative(fc.her.cwd, otherFile[0]))}, not into ${code(name)}, which is still empty.`, more: `After the ${code('>')}, write the name of the file it belongs in: ${code(name)}.` }
    if (printed)
      return { kind: 'content', key: `printed:${name}`, say: `You printed the text on the screen, but it didn't go into ${code(name)}.`, more: `To send it into the file, add ${code(`> ${name}`)} to the end of the command: ${code(`${printed.line} > ${name}`)}.`, now: true }
    return { kind: 'content', key: `empty:${name}`, say: `${code(name)} is there, but it's empty.`, more: `Write into it with ${code(`echo "text" > ${name}`)}.` }
  }
  // A conflict not fixed: its markers are still in the file.
  if (/^(<<<<<<<|=======|>>>>>>>)/m.test(mine) && !/^(<<<<<<<|=======|>>>>>>>)/m.test(target)) {
    const fixed = [...fc.herSnap].find(([p, e]) => p !== path && !e.dir && e.content?.replace(/\n$/, '') === target.replace(/\n$/, '') && (whoMade(fc, p) || whoMade(fc, p, 'changed')))
    if (fixed)
      return { kind: slipOf(name, base(fixed[0])) ? 'spelling' : 'wrong-file', key: `lines-fixed:${fixed[0]}`, say: `Your fixed version went into ${code(base(fixed[0]))}, not ${code(name)}${slipOf(name, base(fixed[0])) ? `: ${describeSlip(name, base(fixed[0]))}` : ''}. So ${code(name)} still has the conflict markers in it.`, more: `Write the fixed text into ${code(name)}, then ${code(`git add ${name}`)}.`, now: true }
    return { kind: 'git', key: `markers:${name}`, say: `${code(name)} still has the conflict markers in it: the ${code('<<<<<<<')}, ${code('=======')} and ${code('>>>>>>>')} lines.`, more: `Keep only the lines you want, delete the three marker lines, then ${code(`git add ${name}`)}.` }
  }
  // Lines that are missing here, found in another file she wrote: a near name, the same name in another folder, or the wrong file.
  const lost = want.filter((l) => l.trim() && !got.includes(l))
  if (lost.length && mode !== 'excludes') {
    const found = [...fc.herSnap].find(([p, e]) => p !== path && !e.dir && lost.every((l) => e.content?.split('\n').includes(l)) && (whoMade(fc, p) || whoMade(fc, p, 'changed')))
    if (found) {
      const [other] = found
      const by = whoMade(fc, other) ?? whoMade(fc, other, 'changed')!
      const line = quote(lost[0]!)
      if (base(other) === name)
        return { kind: 'place', key: `lines-place:${other}`, say: `${line} went into ${code(relative(fc.her.cwd, other))}, a different ${code(name)}: you ran ${code(by.line)} while you were in ${here(by.cwd)}.`, more: `Go back to ${here(parent(path))} and run it again there, or give the path: ${code(relative(by.cwd, path))}.` }
      if (slipOf(name, base(other)))
        return { kind: 'spelling', key: `lines-name:${other}`, say: `${line} went into ${code(base(other))}, not ${code(name)}: ${describeSlip(name, base(other))}.`, more: `Run ${code(by.line.replace(base(other), name))} to put it in the right file, and remove ${code(base(other))}.`, now: true }
      return { kind: 'wrong-file', key: `lines-into:${other}`, say: `${line} went into ${code(relative(fc.her.cwd, other))}, not into ${code(name)}.`, more: `After the ${code('>')} or ${code('>>')}, write the name of the file it belongs in: ${code(name)}.` }
    }
  }
  if (mode === 'excludes') {
    return { kind: 'content', key: `still:${name}`, say: `${code(name)} still has ${quote(wantText ?? '')} in it.` }
  }
  // > where >> was needed: only the last of the lines survived, and one of her later writes used a single >.
  const writes = fc.steps.filter((t) => new RegExp(`>>?\\s*["']?${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?(\\s|$)`).test(t.line))
  const overwrote = writes.slice(1).some((t) => /(^|[^>])>(?!>)/.test(t.line))
  if (overwrote && want.length > 1 && got.length >= 1 && got.length < want.length && got.every((l) => want.includes(l)))
    return { kind: 'content', key: `overwrote:${name}`, say: `${code(name)} only has its last line, ${quote(got[0]!)}. The lines before it were wiped out.`, more: `One arrow, ${code('>')}, replaces everything in the file. Two arrows, ${code('>>')}, add to the end. Start again with ${code('>')} for the first line, and use ${code('>>')} for the rest.`, now: true }
  if (got.length > want.length && want.every((l) => got.includes(l)))
    return { kind: 'content', key: `extra:${name}`, say: `${code(name)} has everything it needs, and some lines more: ${got.length} lines where ${want.length} are wanted.`, more: `Running a ${code('>>')} command twice adds its line twice. Start the file again with ${code('>')} and add each line once.` }
  if (got.length === want.length && [...got].sort().join('\n') === [...want].sort().join('\n'))
    return { kind: 'order', key: `lines-order:${name}`, say: `${code(name)} has the right lines, but in the wrong order.`, more: 'Lines are added in the order you run the commands. Write the first line first.' }
  const i = want.findIndex((l, k) => l !== got[k])
  const w = want[i] ?? ''
  const g = got[i] ?? ''
  if (g && w && g.replace(/^["']|["']$/g, '') === w)
    return { kind: 'content', key: `quotes:${name}`, say: `The quote marks went into ${code(name)} as part of the text: it says ${quote(g)}.`, more: 'Quotes around text on the command line are only there to hold it together; they are not written into the file. Use one pair.' }
  if (g && w && g.toLowerCase() === w.toLowerCase())
    return { kind: 'spelling', key: `content-case:${name}`, say: `Line ${i + 1} of ${code(name)} has different capital letters: ${quote(g)} where it should be ${quote(w)}.` }
  if (g && w && slipOf(w, g))
    return { kind: 'spelling', key: `content-typo:${name}`, say: `Line ${i + 1} of ${code(name)} says ${quote(g)}, and the task wants ${quote(w)}: ${describeSlip(w, g)}.` }
  if (g && w && w.includes(g))
    return { kind: 'content', key: `short:${name}`, say: `Line ${i + 1} of ${code(name)} is only part of what's wanted: ${quote(g)}.`, more: `It should be ${quote(w)}. If the text has spaces, put it in quotes so it all goes in.` }
  return { kind: 'content', key: `content:${name}:${i}`, say: `${code(name)} doesn't say what the task wants${want.length > 1 ? ` on line ${i + 1}` : ''}.`, more: `It should be ${quote(w)}, and yours is ${quote(g || 'empty')}.` }
}

/** Commands that are easy to reach for in place of each other, and the difference that matters. */
const INSTEAD: Record<string, string> = {
  'cp>mv': `${code('cp')} makes a copy and leaves the original where it was; ${code('mv')} moves it, so it's only in the new place`,
  'mv>cp': `${code('mv')} moves it away from where it was; ${code('cp')} leaves the original and makes a copy`,
  'touch>mkdir': `${code('touch')} makes an empty file; ${code('mkdir')} makes a folder`,
  'mkdir>touch': `${code('mkdir')} makes a folder; ${code('touch')} makes an empty file`,
  'rmdir>rm': `${code('rmdir')} only removes empty folders; ${code('rm')} removes files`,
  'rm>rmdir': `${code('rm')} removes files; ${code('rmdir')} removes an empty folder`,
  'cat>ls': `${code('cat')} shows what's inside a file; ${code('ls')} lists what's in a folder`,
  'ls>cat': `${code('ls')} lists a folder; ${code('cat')} shows what's inside a file`,
  'head>tail': `${code('head')} shows the first lines; ${code('tail')} shows the last ones`,
  'tail>head': `${code('tail')} shows the last lines; ${code('head')} shows the first ones`,
  'git switch>git checkout': 'both move between branches here',
  'git branch>git switch': `${code('git branch')} makes a branch but leaves you where you are; ${code('git switch')} moves you onto it`,
}

/** She ran a different command on the same things: the one she reached for instead. */
function insteadOf(fc: FactCtx, wanted: string): Diagnosis | null {
  const ww = words(wanted)
  const wantProg = prog(wanted)
  for (const t of [...fc.steps].reverse()) {
    const hw = words(t.line)
    const hp = prog(t.line)
    if (hp === wantProg) continue
    const argsOf = (w: string[], p: string) => w.slice(p.split(' ').length).filter((x) => !x.startsWith('-')).join(' ')
    const same = argsOf(hw, hp) && argsOf(hw, hp) === argsOf(ww, wantProg)
    if (!same) continue
    const why = INSTEAD[`${hp}>${wantProg}`]
    return { kind: 'check', key: `instead:${hp}>${wantProg}`, say: `You ran ${code(t.line)}, and this needs ${code(wantProg)}${why ? `: ${why}` : ''}.`, more: `Run ${code(wanted)}.`, now: true }
  }
  return null
}

/** The step of hers most like a solution command, and how it differs. */
function nearCommand(fc: FactCtx, wanted: string): { step: Step; slip: string } | null {
  const target = words(wanted)
  let best: { step: Step; d: number } | null = null
  for (const t of fc.steps) {
    const w = words(t.line)
    if (!w.length) continue
    const d = distance(w.join(' '), target.join(' '))
    if (d > 0 && d <= Math.max(2, Math.floor(wanted.length / 3)) && (!best || d < best.d)) best = { step: t, d }
  }
  if (!best) return null
  const w = words(best.step.line)
  for (let k = 0; k < Math.max(w.length, target.length); k++) {
    if (w[k] !== target[k]) {
      if (w[k] && target[k] && slipOf(target[k]!, w[k]!)) return { step: best.step, slip: `${code(w[k]!)} should be ${code(target[k]!)}: ${describeSlip(target[k]!, w[k]!)}` }
      if (!w[k]) return { step: best.step, slip: `it is missing ${code(target[k]!)} at the end` }
      if (!target[k]) return { step: best.step, slip: `it has an extra ${code(w[k]!)}` }
      return { step: best.step, slip: `${code(w[k]!)} should be ${code(target[k]!)}` }
    }
  }
  return null
}

function factDiagnosis(fc: FactCtx, fact: string, failing: string): Diagnosis | null {
  const w = fact.trim().split(/\s+/)
  const [what, arg = ''] = w
  const raw1 = fact.trim().replace(/^\S+\s*/, '')
  const tail = fact.trim().replace(/^\S+\s+\S+\s*/, '')
  switch (what) {
    case 'file':
    case 'dir': {
      const path = at(arg)
      const e = fc.herSnap.get(path)
      if (!e || e.dir !== (what === 'dir')) return notThere(fc, path, what === 'dir' ? 'dir' : 'file')
      if (what === 'file') {
        if (tail === 'exec') return { kind: 'check', key: `exec:${arg}`, say: `${code(base(path))} isn't allowed to run yet.`, more: `Give it permission with ${code(`chmod +x ${relative(fc.her.cwd, path)}`)}.`, now: true }
        const cm = /^(==|~=|contains|excludes)\s?([\s\S]*)$/.exec(tail)
        if (cm) return wrongContent(fc, path, cm[1] === '==' || cm[1] === '~=' ? cm[2]!.replace(/\\n/g, '\n') : cm[1] === 'excludes' ? cm[2]! : null, cm[1]!) ?? wrongContent(fc, path, null, cm[1]!)
        if (/^lines\b/.test(tail) || tail === 'empty') return wrongContent(fc, path, null, 'lines')
      }
      return null
    }
    case 'missing': {
      const path = at(arg)
      const name = base(path)
      const copied = fc.steps.find((t) => /^cp\b/.test(t.line) && words(t.line).some((x) => base(resolve(t.cwd, x)) === name || x.includes('*') || x.includes('[')))
      if (copied && fc.ref.some((t) => /^mv\b/.test(t.line)))
        return { kind: 'check', key: `cp-mv:${name}`, say: `${code(name)} is still here, because ${code('cp')} makes a copy and leaves the original where it was.`, more: `${code('mv')} moves it instead. Remove this one, or use ${code('mv')} next time.` }
      const removed = fc.steps.flatMap((t) => t.changes.filter((c) => c.kind === 'deleted' && !c.path.startsWith(`${path}/`)).map((c) => ({ t, c })))
      const wrong = removed.find(({ c }) => c.path !== path && fc.wantSnap.has(c.path))
      if (wrong)
        return { kind: 'wrong-file', key: `removed:${wrong.c.path}`, say: `${code(name)} is still here. ${code(wrong.t.line)} removed ${code(relative(fc.her.cwd, wrong.c.path))} instead${slipOf(name, base(wrong.c.path)) ? `, which is a near name: ${describeSlip(name, base(wrong.c.path))}` : ''}.`, more: `Remove ${code(relative(fc.her.cwd, path))}.` }
      return { kind: 'check', key: `still:${path}`, say: `${code(name)} is still in ${here(parent(path))}, and the task wants it gone.`, more: fc.herSnap.get(path)?.dir ? `It's a folder: ${code(`rm -r ${relative(fc.her.cwd, path)}`)} removes it with everything inside.` : `${code(`rm ${relative(fc.her.cwd, path)}`)} removes it.` }
    }
    case 'cwd': {
      const want = at(arg)
      const got = fc.her.cwd
      const lastCd = [...fc.steps].reverse().find((t) => /^cd\b/.test(t.line))
      const overshot = lastCd && fc.steps.filter((t) => /^cd\b/.test(t.line)).length > 1 && got.startsWith(`${want}/`)
      return {
        kind: 'folder',
        key: `cwd:${got}`,
        say: `You're ${whereAgainst(got, want)}, and the task wants you in ${here(want)}.${overshot ? ` It looks like you went in one step too many.` : ''}`,
        more: `From where you are, ${code(`cd ${relative(got, want)}`)} gets you there.${got === HOME ? ` (${code('cd')} on its own always goes home.)` : ''}`,
      }
    }
    case 'count': {
      const pattern = arg
      const refN = failing.match(/^(\d+) paths?/)
      return { kind: 'check', key: `count:${pattern}`, say: `The number of ${code(pattern)} matches isn't right: ${refN ? `there ${refN[1] === '1' ? 'is' : 'are'} ${refN[1]}` : failing}.`, more: `The task wants ${w.slice(2).join(' ').replace('==', '').trim()}. ${code(`ls ${pattern}`)} shows the ones there are now.` }
    }
    case 'ran':
    case 'used': {
      const wanted = what === 'ran' ? w.slice(1).join(' ') : raw1
      const swapped = insteadOf(fc, fc.ref.find((t) => t.line.startsWith(wanted))?.line ?? wanted)
      if (swapped) return swapped
      const near = nearCommand(fc, wanted)
      if (near) {
        if (near.step.status !== 0 && isError(near.step)) return null // its error explains it better
        return { kind: 'spelling', key: `near-cmd:${near.step.line}`, say: `You ran ${code(near.step.line)}, and the task needs ${code(wanted)}: ${near.slip}.`, now: true }
      }
      const same = fc.steps.find((t) => prog(t.line) === prog(wanted))
      if (same) return { kind: 'check', key: `args:${wanted}`, say: `You ran ${code(same.line)}, but not quite the command the task asks for.`, more: `It needs ${code(wanted)}.` }
      return { kind: 'missing', key: `notrun:${wanted}`, say: `One of the commands the task asks for hasn't been run yet.`, more: `Run ${code(wanted)}.` }
    }
    case 'printed':
    case 'printed-line':
    case 'printed-exactly':
    case 'last-printed':
    case 'last-printed-exactly': {
      const text = raw1.replace(/\\n/g, '\n')
      const producer = fc.ref.find((t) => t.out.includes(text.split('\n')[0]!))
      if (what.startsWith('last') && fc.steps.some((t) => t.out.includes(text.split('\n')[0]!)))
        return { kind: 'order', key: `last:${text}`, say: 'The right output was there, but the check looks at the last command you ran, and you ran something else after it.', more: producer ? `Run ${code(producer.line)} again, as the last thing you do.` : 'Run that command again, as the last thing you do.', now: true }
      if (producer) {
        const mine = [...fc.steps].reverse().find((t) => prog(t.line) === prog(producer.line))
        if (mine) {
          if (mine.cwd !== producer.cwd && !words(producer.line).some((x) => x.includes('/')))
            return { kind: 'folder', key: `ran-where:${producer.line}`, say: `You ran ${code(mine.line)} in ${here(mine.cwd)}, so it showed that folder. The task wants it run in ${here(producer.cwd)}.`, more: `Go there first: ${code(`cd ${relative(mine.cwd, producer.cwd)}`)}, then run it again.` }
          const pw = words(producer.line)
          const mw = words(mine.line)
          const flag = pw.find((x) => x.startsWith('-') && !mw.includes(x))
          if (flag) return { kind: 'check', key: `flag:${producer.line}:${flag}`, say: `You ran ${code(mine.line)}, and it needs ${code(flag)} to show what the task is after.`, more: `Try ${code(producer.line)}.` }
          if (mine.line !== producer.line) return { kind: 'check', key: `other-args:${producer.line}`, say: `You ran ${code(mine.line)}, but it didn't show ${quote(text)}.`, more: `The task's command is ${code(producer.line)}.` }
          return { kind: 'check', key: `shown:${text}`, say: `${code(mine.line)} ran, but it didn't show ${quote(text)}, because what it reads isn't the same as in the task yet.`, more: 'Check the step before it: the file or folder it looks at.' }
        }
        return { kind: 'missing', key: `notshown:${text}`, say: `Nothing has shown ${quote(text)} yet: the command that does hasn't been run.`, more: `Run ${code(producer.line)}.` }
      }
      return null
    }
    case 'var':
    case 'env': {
      const spaced = fc.steps.find((t) => new RegExp(`^${arg}\\s+=`).test(t.line))
      if (spaced) return { kind: 'error', key: `assign:${arg}`, say: `${code(spaced.line)} has spaces around the equals sign, so the variable was never set.`, more: `Write it joined up: ${code(spaced.line.replace(/\s*=\s*/, '='))}.`, now: true }
      if (what === 'env' && fc.her.vars[arg] !== undefined) return { kind: 'check', key: `export:${arg}`, say: `${code(arg)} is set, but scripts can't see it until it's exported.`, more: `Run ${code(`export ${arg}`)}.`, now: true }
      return null
    }
    case 'git':
      return gitDiagnosis(fc, w, failing)
  }
  return null
}

function gitDiagnosis(fc: FactCtx, w: string[], failing: string): Diagnosis | null {
  const [, arg = '.', prop = '', ...rest] = w
  const path = at(arg)
  const mine = gitInfo(fc.her, path)
  const theirs = gitInfo(fc.want, path)
  if (!mine) {
    const elsewhere = Object.keys(fc.her.repos).filter((p) => gitInfo(fc.her, p) && p !== path)
    if (elsewhere.length) {
      const r = elsewhere[0]!
      const init = fc.steps.find((t) => /^git init\b/.test(t.line) && t.cwd === r)
      return { kind: 'place', key: `repo-place:${r}`, say: `The repository was made in ${here(r)}, not in ${here(path)}${init ? `: you ran ${code('git init')} while you were in ${here(r)}` : ''}.`, more: `Go to ${here(path)} with ${code(`cd ${relative(fc.her.cwd, path)}`)} and run ${code('git init')} there.` }
    }
    return { kind: 'git', key: `norepo:${path}`, say: `${here(path)} isn't a Git repository yet.`, more: `Go into it and run ${code('git init')}.` }
  }
  const name = rest[0] ?? ''
  switch (prop) {
    case 'commits':
    case 'commits-on': {
      const branch = prop === 'commits-on' ? name : mine.branch
      const got = prop === 'commits-on' ? (mine.branchCommits[branch] ?? 0) : mine.commits
      const wantN = prop === 'commits-on' ? (theirs?.branchCommits[branch] ?? null) : (theirs?.commits ?? null)
      if (wantN !== null && got < wantN) {
        // The commit went onto another branch.
        const other = Object.entries(mine.branchCommits).find(([b, n]) => b !== branch && n > (theirs?.branchCommits[b] ?? 0))
        if (other && prop === 'commits-on') {
          const c = fc.steps.find((t) => /^git commit\b/.test(t.line) && t.status === 0 && gitInfo(t.before, path)?.branch === other[0])
          return { kind: 'git', key: `wrong-branch:${other[0]}`, say: `Your commit went onto ${code(other[0])}, not ${code(branch)}${c ? `: you were on ${code(other[0])} when you ran ${code(c.line)}` : ''}.`, more: `Switch first with ${code(`git switch ${branch}`)}, then commit there. A commit always goes onto the branch you're on.` }
        }
        const failedCommit = fc.steps.findIndex((t) => /^git commit\b/.test(t.line) && /nothing added|no changes added/.test(t.out))
        const addAfter = failedCommit >= 0 ? fc.steps.slice(failedCommit + 1).find((t) => /^git add\b/.test(t.line) && t.status === 0) : undefined
        if (addAfter)
          return { kind: 'order', key: 'order-commit-add', say: `${code(fc.steps[failedCommit]!.line)} didn't make a commit, because nothing was added yet: ${code(addAfter.line)} came afterwards.`, more: 'Add first, then commit. Run that commit again now.', now: true }
        if (mine.staged.length)
          return { kind: 'git', key: 'staged-uncommitted', say: `Your change is added, but not committed yet: ${mine.staged.map(code).join(', ')} ${mine.staged.length === 1 ? 'is' : 'are'} staged and waiting.`, more: `Run ${code('git commit -m "…"')} with a message saying what changed.`, now: true }
        if (mine.untracked.filter((f) => !mine.ignored.includes(f)).length || mine.modified.length) {
          const files = [...mine.modified, ...mine.untracked.filter((f) => !mine.ignored.includes(f))]
          return { kind: 'git', key: 'unstaged', say: `Your change hasn't been added yet, so there's nothing to commit: ${files.slice(0, 3).map(code).join(', ')}.`, more: `First ${code(`git add ${files[0]}`)}, then ${code('git commit')}.`, now: true }
        }
        return { kind: 'git', key: `few-commits:${got}`, say: `There ${got === 1 ? 'is' : 'are'} ${got} commit${got === 1 ? '' : 's'}${prop === 'commits-on' ? ` on ${code(branch)}` : ''}, and the task needs ${wantN}.`, more: 'Each commit is a change, added, then committed.' }
      }
      if (wantN !== null && got > wantN)
        return { kind: 'git', key: `many-commits:${got}`, say: `There ${got === 1 ? 'is' : 'are'} ${got} commits, one more than the task wants: something was committed on its own that belonged in another commit.`, more: `${code('git log --oneline')} shows them. ${code('git reset --soft HEAD~1')} undoes the last commit and keeps its changes staged.` }
      return null
    }
    case 'branch': {
      if (mine.detached) return { kind: 'git', key: 'detached', say: `You're not on any branch: HEAD is detached, pointing straight at a commit.`, more: `Get back onto a branch with ${code(`git switch ${name}`)}.` }
      if (mine.branches.includes(name)) return { kind: 'git', key: `on:${mine.branch}`, say: `You're on ${code(mine.branch)}, and the task wants you on ${code(name)}.`, more: `Switch with ${code(`git switch ${name}`)}.`, now: true }
      const near = closestSlip(name, mine.branches)
      if (near) return { kind: 'spelling', key: `branch-name:${near}`, say: `You made a branch called ${code(near)}, and the task wants ${code(name)}: ${describeSlip(name, near)}.`, more: `Rename it with ${code(`git branch -m ${near} ${name}`)}.`, now: true }
      return { kind: 'git', key: `nobranch:${name}`, say: `There's no branch called ${code(name)} yet.`, more: `${code(`git switch -c ${name}`)} makes it and moves you onto it.` }
    }
    case 'has-branch':
    case 'tag':
    case 'remote': {
      const pool = prop === 'tag' ? mine.tags : prop === 'remote' ? mine.remotes : mine.branches
      const what = prop === 'tag' ? 'tag' : prop === 'remote' ? 'remote' : 'branch'
      const near = closestSlip(name, pool)
      if (near) return { kind: 'spelling', key: `${what}-name:${near}`, say: `You made a ${what} called ${code(near)}, and the task wants ${code(name)}: ${describeSlip(name, near)}.`, now: true }
      return { kind: 'git', key: `no-${what}:${name}`, say: `There's no ${what} called ${code(name)} yet.` }
    }
    case 'no-branch':
      return { kind: 'git', key: `still-branch:${name}`, say: `The branch ${code(name)} is still there.`, more: `${code(`git branch -d ${name}`)} deletes it, once you're on a different branch.` }
    case 'staged':
    case 'tracked': {
      const near = closestSlip(name, [...mine.staged, ...mine.untracked, ...mine.modified, ...mine.tracked])
      const addedWrong = fc.steps.find((t) => /^git add\b/.test(t.line) && t.status === 0 && !words(t.line).includes(name))
      if (mine.modified.includes(name) && prop === 'staged')
        return { kind: 'git', key: `changed-after:${name}`, say: `${code(name)} has changes that aren't added: either it was never added, or it changed again after you added it.`, more: `Run ${code(`git add ${name}`)} again.`, now: true }
      if (addedWrong && near && near !== name)
        return { kind: 'wrong-file', key: `added:${near}`, say: `You added ${code(near)}, and the task means ${code(name)}.`, more: `Run ${code(`git add ${name}`)}.` }
      return { kind: 'git', key: `unstaged:${name}`, say: `${code(name)} hasn't been added yet.`, more: `Run ${code(`git add ${name}`)}.` }
    }
    case 'clean':
      return { kind: 'git', key: 'not-clean', say: `There's still something staged: ${mine.staged.map(code).join(', ')}.`, more: `Commit it, or take it out with ${code(`git restore --staged ${mine.staged[0] ?? '<file>'}`)}.` }
    case 'idle':
      for (const f of mine.conflicts) {
        const moved = wrongContent(fc, `${path}/${f}`, null, '==')
        if (moved && /^lines-/.test(moved.key)) return moved
      }
      return { kind: 'git', key: `pending:${mine.pending}`, say: `A ${mine.pending} is still in progress, and Git is waiting for you to finish it.`, more: mine.conflicts.length ? `Fix the conflict in ${mine.conflicts.map(code).join(', ')}, then ${code('git add')} it and ${code('git commit')}.` : `Finish it with ${code(`git ${mine.pending} --continue`)}, or back out with ${code('--abort')}.` }
    case 'conflicts':
      for (const f of mine.conflicts) {
        const moved = wrongContent(fc, `${path}/${f}`, null, '==')
        if (moved && /^lines-/.test(moved.key)) return moved
      }
      return { kind: 'git', key: 'conflicts', say: `${mine.conflicts.map(code).join(', ')} ${mine.conflicts.length === 1 ? 'still has' : 'still have'} an unresolved conflict.`, more: `Keep the lines you want, delete the ${code('<<<<<<<')}, ${code('=======')} and ${code('>>>>>>>')} lines, then ${code('git add')} the file and commit.` }
    case 'tracks':
      return { kind: 'git', key: `upstream:${name}`, say: `${code(name)} isn't linked to ${code(rest[1] ?? '')} yet.`, more: `Push it with ${code(`git push -u ${(rest[1] ?? 'origin/x').split('/')[0]} ${name}`)} to link them.` }
    case 'at':
      if (rest[1] === 'file' || rest[1] === 'missing') {
        const file = rest[2] ?? ''
        const rev = rest[0] ?? 'HEAD'
        const moved = rest[1] === 'file' ? wrongContent(fc, at(file), null, '==') : null
        if (moved && /^(lines-|into:|overwrote|quotes|content-)/.test(moved.key)) return moved
        if (rest[1] === 'file' && (mine.untracked.includes(file) || mine.modified.includes(file) || mine.staged.includes(file))) {
          const lastCommit = fc.steps.map((t, k) => (/^git commit\b/.test(t.line) && t.status === 0 ? k : -1)).reduce((a, b) => Math.max(a, b), -1)
          const addedAfter = fc.steps.slice(lastCommit + 1).some((t) => /^git add\b/.test(t.line) && (t.line.includes(file) || / \.$|-A\b/.test(t.line)))
          if (addedAfter && mine.staged.includes(file))
            return { kind: 'order', key: `added-after:${file}`, say: `${code(file)} was added after the commit, so it's waiting for the next commit instead of being in that one.`, more: `${code('git commit --amend --no-edit')} puts it into that same commit.`, now: true }
          const how = mine.staged.includes(file) ? 'it was added after the commit, so it is waiting for the next one' : mine.untracked.includes(file) ? 'it was never added, so Git left it out' : 'its latest changes were never added'
          return { kind: 'git', key: `left-out:${file}`, say: `${code(file)} isn't in the commit the way the task wants: ${how}.`, more: `${code(`git add ${file}`)}, then ${code('git commit --amend --no-edit')} puts it into that same commit${rev === 'HEAD' ? '' : ', or commit it now'}.`, now: true }
        }
        return { kind: 'git', key: `at:${rev}:${file}`, say: `At ${code(rev)}, ${failing.replace(/^HEAD /, '')}.` }
      }
      if (rest[1] !== 'message') return { kind: 'git', key: `at:${rest.join(' ')}`, say: `In Git, ${failing}.` }
      return messageSlip(mine, w.slice(6).join(' '), null)
    case 'log':
    case 'log-of':
      return messageSlip(mine, w.slice(prop === 'log-of' ? 5 : 4).join(' '), prop === 'log-of' ? name : null)
  }
  return { kind: 'git', key: `git:${prop}:${name}`, say: `In Git, ${failing}.` }
}

/** A commit message near the one the task wants. */
function messageSlip(mine: NonNullable<ReturnType<typeof gitInfo>>, text: string, branch: string | null): Diagnosis | null {
  const messages = branch ? (mine.branchMessages[branch] ?? []) : mine.messages
  const near = text ? messages.find((msg) => msg !== text && (slipOf(text, msg) || msg.toLowerCase().includes(text.toLowerCase().slice(0, 6)))) : undefined
  if (near) return { kind: 'spelling', key: `message:${near}`, say: `Your commit message is ${quote(near)}, and the task wants ${quote(text)}.`, more: `If it's the last commit, fix the message with ${code(`git commit --amend -m "${text}"`)}.` }
  return null
}

/* ── Putting it together ─────────────────────────────────────────────────── */

export interface ShellLesson {
  starter: string
  solution: string
  checks: readonly LearnCheck[]
}

/**
 * What went wrong in a Terminal or Git run, from what she typed: null when it
 * passed, or when nothing better can be said than the check's own words.
 */
// The problem's starting folder and the solution's replay are the same on every run of that problem: made
// once, for the last few problems she worked on. (Shell states are never changed in place.)
const solved = new Map<string, { start: ShellState; ref: Step[] }>()
function solvedFor(lesson: ShellLesson): { start: ShellState; ref: Step[] } {
  const key = `${lesson.starter}\u0000${lesson.solution}`
  let hit = solved.get(key)
  if (!hit) {
    const start = lessonShell(lesson as Parameters<typeof lessonShell>[0])
    hit = { start, ref: replay(start, lesson.solution.split('\n')) }
    solved.set(key, hit)
    if (solved.size > 8) solved.delete(solved.keys().next().value!)
  }
  return hit
}

export function shellDiagnosis(lesson: ShellLesson, typed: readonly string[]): Diagnosis | null {
  const { start, ref } = solvedFor(lesson)
  const steps = replay(start, typed)
  const her = steps.length ? steps[steps.length - 1]!.after : start
  const want = ref.length ? ref[ref.length - 1]!.after : start
  const herSnap = snapshot(her)
  const fc: FactCtx = { steps, ref, her, want, herSnap, wantSnap: snapshot(want) }

  // The first fact that does not hold, in the first check that fails.
  let fact: string | null = null
  let failing = ''
  for (const c of lesson.checks) {
    if (c.kind !== 'shell') continue
    for (const f of c.facts) {
      const why = checkFact(her, f)
      if (why) {
        fact = f
        failing = why
        break
      }
    }
    if (fact) break
  }
  if (!fact) return null

  // 0. A file she made by misspelling one the solution writes to: whatever went wrong after it (a script
  // missing a line, a folder never made, the wrong text somewhere) comes from that one slip.
  const written = new Set(ref.flatMap((t) => t.changes.filter((c) => c.kind !== 'deleted' && !c.dir).map((c) => c.path)))
  for (const t of steps)
    for (const c of t.changes) {
      if (c.kind !== 'created' || c.dir || fc.wantSnap.has(c.path) || written.has(c.path) || !herSnap.has(c.path) || lesson.solution.includes(base(c.path))) continue
      const meant = closestSlip(base(c.path), [...written].filter((p) => parent(p) === parent(c.path)).map(base))
      if (!meant) continue
      const right = herSnap.get(`${parent(c.path)}/${meant}`)
      // A conflict fixed in a near name: the real file still has the markers.
      if (right?.content?.includes('<<<<<<<'))
        return {
          kind: 'spelling',
          key: `stray:${base(c.path)}`,
          say: `The fixed version went into ${code(base(c.path))}, not ${code(meant)}: ${describeSlip(meant, base(c.path))}. So ${code(meant)} still has the conflict markers in it.`,
          more: `Write the fixed version into ${code(meant)} itself, then ${code(`git add ${meant}`)}, and remove the stray file: ${code(`rm ${base(c.path)}`)}.`,
          now: true,
        }
      const into = />/.test(t.line.replace(/2>>?\s*\S+/g, ''))
      if (!right)
        return {
          kind: 'spelling',
          key: `stray:${base(c.path)}`,
          say: `The task wants a file called ${code(meant)}, and you made it as ${code(base(c.path))}: ${describeSlip(meant, base(c.path))}. ${code(clip(t.line, 50))} made it.`,
          more: `Rename it: ${code(`mv ${base(c.path)} ${meant}`)}.`,
          now: true,
        }
      return {
        kind: 'spelling',
        key: `stray:${base(c.path)}`,
        say: `${code(clip(t.line, 50))} made a new file called ${code(base(c.path))}, when the file is ${code(meant)}: ${describeSlip(meant, base(c.path))}.${into ? ` So what it wrote went into ${code(base(c.path))}, and ${code(meant)} never got it.` : ''}`,
        more: `Run that line again with the name spelled ${code(meant)}, and remove the stray file: ${code(`rm ${base(c.path)}`)}.`,
        now: true,
      }
    }

  // 0b. One `>` where the solution's same line has `>>`, into a file that already had lines: they were
  // wiped, and everything after (a script missing its first lines, a merge gone wrong) follows from it.
  const refLines = new Set(ref.map((t) => t.line.trim().replace(/\s+/g, ' ')))
  for (const t of steps) {
    const m = /(?:^|[^>&\d])>\s*(["']?)([^\s"'|;&<>]+)\1\s*$/.exec(t.line)
    if (!m || /\d>/.test(m[0])) continue
    const doubled = `${t.line.slice(0, m.index + m[0].indexOf('>'))}>${t.line.slice(m.index + m[0].indexOf('>'))}`.trim().replace(/\s+/g, ' ')
    const had = snapshot(t.before).get(resolve(t.cwd, m[2]!))
    if (!refLines.has(doubled) || refLines.has(t.line.trim().replace(/\s+/g, ' ')) || !had?.content?.trim()) continue
    const lost = had.content.trim().split('\n')
    return {
      kind: 'content',
      key: `overwrote:${m[2]}`,
      say: `${code(clip(t.line, 50))} has one ${code('>')}, and one arrow empties ${code(m[2]!)} before it writes. So the ${lost.length === 1 ? `line that was already in it, ${quote(lost[0]!)}, was` : `${lost.length} lines already in it were`} wiped out.`,
      more: `Two arrows, ${code('>>')}, add to the end instead: ${code(clip(doubled, 60))}. Then write the lost ${lost.length === 1 ? 'line' : 'lines'} back.`,
      now: true,
    }
  }

  // Which of her steps are errors she never got past (and the solution doesn't make too): worked out once.
  const refErrors = new Set(ref.filter(isError).map((y) => y.line))
  const open = steps.map((x, n) => isError(x) && !resolvedLater(steps, n, ref) && !refErrors.has(x.line))
  const lines = (xs: Step[]) => xs.map((x) => x.line.trim().replace(/\s+/g, ' '))
  const hers = lines(steps)
  const theirs = lines(ref)
  // 0c. Exactly the solution's lines, in another order: the first one out of place, and what it needed first.
  if (hers.length === theirs.length && hers.join('\n') !== theirs.join('\n') && [...hers].sort().join('\n') === [...theirs].sort().join('\n')) {
    // The error it caused may already say why the order matters ("before the folder existed"): that first.
    for (const [n, x] of steps.entries()) {
      if (!isError(x) || resolvedLater(steps, n, ref)) continue
      const own = readError({ steps, i: n, step: x, then: new Map([...snapshot(x.before), ...snapshot(x.after)]), now: herSnap, ref, want: fc.wantSnap, solution: lesson.solution })
      if (own?.kind === 'order' || own?.kind === 'git') return own
      break
    }
    const i = hers.findIndex((l, n) => l !== theirs[n])
    const first = theirs[i]!
    return {
      kind: 'order',
      key: `order:${first}`,
      say: `Every command is right, but two are in the wrong order: ${code(clip(first, 50))} has to come before ${code(clip(hers[i]!, 50))}, and you ran it after.`,
      more: `Run them again in this order: ${code(clip(first, 40))}, then ${code(clip(hers[i]!, 40))}.`,
      now: true,
    }
  }
  // 0d. `cp` where the solution has `mv` on the same line: a copy leaves the original behind.
  for (const l of hers) {
    if (!/^cp\s/.test(l) || theirs.includes(l)) continue
    const mv = l.replace(/^cp(?:\s+-[rR])?\s/, 'mv ')
    if (theirs.includes(mv))
      return { kind: 'check', key: `cp-mv:${l}`, say: `${code(clip(l, 50))} makes a copy and leaves the original where it was, and the task wants it moved.`, more: `${code('cp')} makes a copy and leaves the original; ${code('mv')} moves it. Use ${code(clip(mv, 50))}${/^cp\s+-[rR]/.test(l) ? '' : ', which moves folders too, no -r needed'}, and remove the copy.`, now: true }
  }
  // 0e. A `git add` the solution runs that she never did, when nothing else went wrong first (a commit that
  // then fails for having nothing added is what it caused).
  const beforeCommit = steps.some((x, n) => open[n] && !/^git commit\b/.test(x.line.trim()))
  if (!beforeCommit)
    for (const l of theirs) {
      const m = /^git add\s+(.+)$/.exec(l)
      if (!m) continue
      const covered = (p: string) => hers.some((h) => new RegExp(`^git add\\b.*(?:\\s|^)(?:\\.|-A|--all|${p.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&')})(?:\\s|$)`).test(h) ) || /\s-a/.test(hers.findLast((h) => /^git commit\b/.test(h)) ?? '')
      const missed = m[1]!.split(/\s+/).filter((p) => !p.startsWith('-') && !covered(p))
      if (missed.length && hers.some((h) => /^git commit\b/.test(h)))
        return { kind: 'git', key: `no-add:${missed.join(',')}`, say: `You never ran ${code(`git add ${missed.join(' ')}`)}, so the commit left ${missed.length > 1 ? 'those changes' : `the change to ${code(missed[0]!)}`} out: a commit only takes what's been added.`, more: `Run ${code(`git add ${missed.join(' ')}`)} before ${code('git commit')}.`, now: true }
    }

  // 0f. The solution's own line, run from another folder, or with its output sent into another file.
  const norm = (l: string) => l.trim().replace(/\s+/g, ' ')
  const used = new Set<number>()
  const target = (l: string) => /(?:^|[^>&\d])>>?\s*(["']?)([^\s"'|;&<>]+)\1\s*$/.exec(l)
  for (const [k, t] of steps.entries()) {
    const j = ref.findIndex((r, n) => !used.has(n) && norm(r.line) === norm(t.line))
    if (j >= 0) {
      used.add(j)
      const r = ref[j]!
      const where = (x: Step) => x.changes.filter((c) => c.kind !== 'deleted').map((c) => relative(x.cwd, c.path)).join()
      const went = t.status !== 0 || t.changes.map((c) => c.path).join() !== r.changes.map((c) => c.path).join()
      // Only when nothing before it had already gone wrong: then that is the cause, and it has its own reading.
      const earlier = open.slice(0, k).some(Boolean)
      if (!earlier && t.cwd !== r.cwd && went && (t.status !== r.status || where(t) === where(r))) {
        // When the error itself already says it (already inside, outside the repository, a leading
        // slash), its own reading is the clearer one.
        if (t.status !== 0) {
          const own = readError({ steps, i: k, step: t, then: new Map([...snapshot(t.before), ...snapshot(t.after)]), now: herSnap, ref, want: fc.wantSnap, solution: lesson.solution })
          if (own && /^(?:abs|inside|outside)[:-]/.test(own.key)) return own
        }
        const moved = steps.slice(0, k).findLast((x) => /^cd\b/.test(x.line) && x.status === 0 && x.cwd !== x.cwdAfter && x.cwdAfter === t.cwd)
        return {
          kind: 'folder',
          key: `ran-in:${t.line}`,
          say: `You ran ${code(clip(t.line, 50))} while you were in ${here(t.cwd)}, and the task runs it in ${here(r.cwd)}${t.status !== 0 ? ', which is why it failed' : ', so it worked on the wrong files'}.${moved ? ` The ${code(moved.line)} before it moved you there.` : ''}`,
          more: `Go back with ${code(`cd ${relative(t.cwd, r.cwd) || '~'}`)} first, then run it again.`,
          now: true,
        }
      }
      continue
    }
    // Her line is a solution line with a different file after the arrow.
    const mine = target(t.line)
    if (!mine) continue
    const theirs = ref.find((r) => {
      const m = target(r.line)
      return m && m[2] !== mine[2] && norm(r.line.slice(0, m.index)) === norm(t.line.slice(0, mine.index)) && r.cwd === t.cwd
    })
    if (!theirs) continue
    const meant = target(theirs.line)![2]!
    const text = /^\s*echo\s+(["']?)(.*)\1\s*$/.exec(t.line.slice(0, mine.index))?.[2]
    if (slipOf(meant, mine[2]!))
      return {
        kind: 'spelling',
        key: `into:${mine[2]}`,
        say: `${text ? quote(text) : 'What it wrote'} went into ${code(mine[2]!)}, and the file is ${code(meant)}: ${describeSlip(meant, mine[2]!)}.`,
        more: `Run it again into ${code(meant)}: ${code(clip(theirs.line, 60))}.`,
        now: true,
      }
    return {
      kind: 'wrong-file',
      key: `into:${mine[2]}`,
      say: `${text ? quote(text) : `What ${code(clip(t.line.slice(0, mine.index).trim(), 40))} wrote`} went into ${code(mine[2]!)}, not into ${code(meant)}: ${code(clip(t.line, 50))} names the wrong file after the arrow.`,
      more: `Run it again into ${code(meant)}: ${code(clip(theirs.line, 60))}.${slipOf(meant, mine[2]!) ? '' : ` And check ${code(mine[2]!)}: it got a line it shouldn't have.`}`,
      now: true,
    }
  }

  // 1. The first error she has not got past: later errors are usually what it caused.
  const solutionProgs = new Set(ref.map((t) => prog(t.line)))
  const solution = lesson.solution
  const errors: { i: number; d: Diagnosis }[] = []
  const expected = new Set(ref.filter(isError).map((t) => t.line))
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i]!
    if (!isError(s) || resolvedLater(steps, i, ref) || expected.has(s.line)) continue
    const d = readError({ steps, i, step: s, then: new Map([...snapshot(s.before), ...snapshot(s.after)]), now: herSnap, ref, want: fc.wantSnap, solution })
    if (d) errors.push({ i, d })
  }
  const relevant = errors.filter(({ i }) => {
    const p = prog(steps[i]!.line)
    return solutionProgs.has(p) || [...solutionProgs].some((q) => slipOf(q, p)) || HARD.test(steps[i]!.out) && !/No such file or directory/.test(steps[i]!.out) || /command not found|not a git command/.test(steps[i]!.out)
  })
  const root = relevant[0] ?? null
  if (root) {
    // A later error it caused: one about the same thing (a name both lines share), not any error at all.
    const things = (line: string) => new Set(words(line).filter((x) => x.length >= 3 && !x.startsWith('-') && !COMMANDS.includes(x) && !(GIT_SUBS as readonly string[]).includes(x)))
    const rootThings = things(steps[root.i]!.line)
    const next = errors.find((e) => e.i > root.i && e.d.key !== root.d.key && [...things(steps[e.i]!.line)].some((x) => rootThings.has(x) || [...rootThings].some((r) => slipOf(x, r))))
    const also = next ? ` That's also why ${code(steps[next.i]!.line)} didn't work.` : ''
    return { ...root.d, say: `${root.d.say}${also}` }
  }
  // 2. A file her own commands wrote that lost lines to another file, or was overwritten: that is usually the cause.
  const contentRoot = (): Diagnosis | null => {
    for (const t of steps)
      for (const c of t.changes) {
        if (c.dir || c.kind === 'deleted' || !t.line.includes(base(c.path))) continue
        const w = fc.wantSnap.get(c.path)
        const h = herSnap.get(c.path)
        if (w && h && !w.dir && w.content !== h.content) {
          const d = wrongContent(fc, c.path, null, '==')
          if (d && /^(lines-|overwrote|markers)/.test(d.key)) return d
        }
      }
    return null
  }
  const early = contentRoot()
  if (early) return early
  // 3. The check, against her state and the solution's; a slip on a side command after that.
  const f = factDiagnosis(fc, fact, failing)
  const weak = !f || f.kind === 'missing' || f.kind === 'check' || /^(git:|at:)/.test(f.key)
  if (!weak) return f
  // A file the solution makes that she has not, where she did make it: the wrong folder or a near name.
  for (const t of ref)
    for (const c of t.changes) {
      if (c.kind !== 'created' || herSnap.has(c.path) || !fc.wantSnap.has(c.path)) continue
      const d = notThere(fc, c.path, c.dir ? 'dir' : 'file')
      if (d && (d.kind === 'place' || d.kind === 'spelling')) return d
    }
  // 4. A file she wrote that is not what the solution's is: how it differs says what went wrong.
  for (const t of steps)
    for (const c of t.changes) {
      if (c.dir || c.kind === 'deleted' || !t.line.includes(base(c.path))) continue
      const w = fc.wantSnap.get(c.path)
      const h = herSnap.get(c.path)
      if (w && h && !w.dir && w.content !== h.content) {
        const d = wrongContent(fc, c.path, null, '==')
        if (d && d.kind !== 'content') return d
        if (d && /overwrote|extra|lines-order|quotes/.test(d.key)) return d
      }
    }
  return f ?? errors[0]?.d ?? null
}
