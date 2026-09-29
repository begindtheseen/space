/* ============================================================================
   ORBIT — the commands she is taught, for Explain
   ----------------------------------------------------------------------------
   Highlight a command (`cp`, `grep -n`, `git commit -m "…"`, `docker run`) and
   Explain opens on a card for it: the command's own one-line description,
   word for word from its manual page or built-in help, when you reach for it,
   the flags the lessons use, and an example. The descriptions live in the
   three batch files next to this one; the coverage test keeps every command
   the Terminal and Git courses teach in here.
   ========================================================================== */
import { COMMANDS as FILES } from './files'
import { COMMANDS as GITBUILD } from './gitbuild'
import { COMMANDS as SHELL } from './shell'
import type { CommandRef } from './types'

export type { CommandRef } from './types'

export const COMMANDS: CommandRef[] = [...FILES, ...SHELL, ...GITBUILD]

const BY_NAME = new Map<string, CommandRef>()
for (const c of COMMANDS) for (const n of [c.name, ...(c.aliases ?? [])]) if (!BY_NAME.has(n)) BY_NAME.set(n, c)

export function commandByName(name: string): CommandRef | undefined {
  return BY_NAME.get(name)
}

/**
 * Command names that are also ordinary English words. Highlighted in a
 * sentence ("sort the list", "find the file") they are just words, so they
 * only count as commands when she highlights them in code.
 */
const ENGLISH = new Set(
  (
    'file find sort head tail cut join paste date time type set read test true false less man patch stat wait ' +
    'kill sleep select case if for while until function command history alias exit export local hash source ' +
    'shift trap make which env id tee seq column du df ln od dd tr wc cat echo touch diff tar awk sed ps ' +
    'ip ss sh pip'
  ).split(' '),
)

export interface CommandMatch {
  ref: CommandRef
  /** The taught flags that appear in the highlight, in the order the reference lists them. */
  flags: [string, string][]
}

/**
 * The command a highlight names, if it names one: the longest known command
 * at its start (`git commit` before `git`), after a prompt (`~/project $`),
 * `sudo` and backticks are set aside. `inCode` says the highlight came from
 * code or terminal text, where an English-looking name is still a command.
 */
export function matchCommand(selection: string, inCode = false): CommandMatch | null {
  const text = selection
    .replace(/[`“”]/g, '')
    .replace(/^\s*[~\w/.-]*\s*[$#]\s+/, '')
    .replace(/^\s*sudo\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text || text.length > 200) return null
  const words = text.split(' ')
  let ref: CommandRef | undefined
  let used = 0
  for (let n = Math.min(3, words.length); n >= 1 && !ref; n--) {
    ref = BY_NAME.get(words.slice(0, n).join(' '))
    if (ref) used = n
  }
  if (!ref) return null
  const rest = words.slice(used)
  // Outside code, a highlight is a command only when it reads like one: a
  // name that is not also an English word, followed by nothing or by things
  // that look typed (flags, paths, file names), not by the rest of a sentence.
  if (!inCode) {
    if (ENGLISH.has(words[0]!)) return null
    if (!rest.every((w) => /^-|[./_=*"'~\d]/.test(w))) return null
  }
  const flags = (ref.flags ?? []).filter(([flag]) => {
    const f = flag.split(/[\s=]/)[0]!
    return rest.some((w) => w === f || w.startsWith(`${f}=`) || (/^-[a-zA-Z]$/.test(f) && /^-[a-zA-Z]{2,}$/.test(w) && w.includes(f[1]!)))
  })
  return { ref, flags }
}
