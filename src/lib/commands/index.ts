/* ============================================================================
   ORBIT — everything she is taught to type, for Explain
   ----------------------------------------------------------------------------
   Highlight a command, keyword or library name — `cp`, `git commit -m`,
   `print`, `np.linalg.norm(v)`, `std::vector<int>`, `#include <cmath>`,
   `GROUP BY`, `COUNT(*)` — and Explain opens on a card for it: its own
   description, word for word from the official documentation, when you reach
   for it, the parts the lessons use, and an example.

   The entries live in the batch files next to this one (about 1,500 of them,
   gathered in all.ts) and load the first time Explain opens. The coverage
   tests keep every name the lessons use in here, language by language.
   ========================================================================== */
import type { CommandLang, CommandRef } from './types'

export type { CommandLang, CommandRef } from './types'

export interface Reference {
  all: CommandRef[]
  /** Name or alias → entry, per language. Python and C++ names are case-sensitive; SQL is upper-cased. */
  byLang: Map<CommandLang, Map<string, CommandRef>>
}

export const langOf = (c: CommandRef): CommandLang => c.lang ?? 'shell'

export function buildReference(all: CommandRef[]): Reference {
  const byLang = new Map<CommandLang, Map<string, CommandRef>>()
  for (const c of all) {
    const lang = langOf(c)
    let m = byLang.get(lang)
    if (!m) byLang.set(lang, (m = new Map()))
    const key = (n: string) => (lang === 'sql' ? n.toUpperCase() : n)
    // A name wins over another entry's alias, whichever batch comes first.
    if (!m.has(key(c.name)) || m.get(key(c.name))!.name !== c.name) m.set(key(c.name), c)
  }
  for (const c of all) {
    const m = byLang.get(langOf(c))!
    for (const a of c.aliases ?? []) {
      const k = langOf(c) === 'sql' ? a.toUpperCase() : a
      if (!m.has(k)) m.set(k, c)
    }
  }
  return { all, byLang }
}

let loading: Promise<Reference> | null = null

/** The whole reference: one chunk, fetched the first time Explain is used. */
export function loadReference(): Promise<Reference> {
  loading ??= import('./all').then((m) => buildReference(m.COMMANDS)).catch((err: unknown) => {
    loading = null
    throw err
  })
  return loading
}

export function entryByName(ref: Reference, name: string, lang?: CommandLang): CommandRef | undefined {
  const order: CommandLang[] = lang ? [lang, 'shell', 'python', 'cpp', 'sql'] : ['shell', 'python', 'cpp', 'sql']
  for (const l of order) {
    const hit = ref.byLang.get(l)?.get(l === 'sql' ? name.toUpperCase() : name)
    if (hit) return hit
  }
  return undefined
}

/** A language as lessons name it (a fence tag, a course) → the reference's language. */
export function refLang(tag: string | undefined | null): CommandLang | undefined {
  const t = (tag ?? '').toLowerCase()
  if (/^(bash|sh|shell|zsh|console|terminal|git)$/.test(t)) return 'shell'
  if (/^(python|py|python3|pycon)$/.test(t)) return 'python'
  if (/^(cpp|c\+\+|cc|cxx|c|hpp|h)$/.test(t)) return 'cpp'
  if (/^(sql|sqlite|postgres|postgresql|psql)$/.test(t)) return 'sql'
  return undefined
}

/**
 * Names that are also ordinary English words. Highlighted in a sentence
 * ("sort the list", "find the file") they are just words, so they only count
 * when she highlights them in code, or in a lesson about that language.
 */
const ENGLISH = new Set(
  (
    'file find sort head tail cut join paste date time type set read test true false less man patch stat wait ' +
    'kill sleep select case if for while until function command history alias exit export local hash source ' +
    'shift trap make which env id tee seq column du df ln od dd tr wc cat echo touch diff tar awk sed ps ' +
    'ip ss sh pip in is and or not as with from import return pass break continue class def del try raise ' +
    'yield global print open input list dict round range format map filter next iter sum min max all any ' +
    'given assume delayed parallel memory count order group by union end then else when do new this delete ' +
    'default public private static const auto void int char long short double float bool using template ' +
    'namespace operator virtual explicit inline register goto struct enum friend mutable volatile extern'
  ).split(' '),
)

export interface CommandMatch {
  ref: CommandRef
  /** The parts from the highlight that the entry lists, in the entry's order. */
  flags: [string, string][]
}

interface MatchContext {
  /** The highlight came from code or terminal text. */
  inCode?: boolean
  /** The language of that code, or of the lesson she is in. */
  lang?: CommandLang
}

/** A word that looks typed rather than written: a flag, a path, an argument, a number. */
const codeish = (w: string) => /^-|[./_=*"'~\d<>:[\]{}]/.test(w)

function litParts(ref: CommandRef, words: string[]): [string, string][] {
  return (ref.flags ?? []).filter(([flag]) => {
    const f = flag.split(/[\s=(]/)[0]!
    if (!f) return false
    return words.some(
      (w) =>
        w === f ||
        w.startsWith(`${f}=`) ||
        w.replace(/^[.>-]+|\(.*$/g, '') === f.replace(/^[.>-]+/, '') ||
        (/^-[a-zA-Z]$/.test(f) && /^-[a-zA-Z]{2,}$/.test(w) && w.includes(f[1]!)),
    )
  })
}

function matchShell(ref: Reference, text: string, inCode: boolean, sure: boolean): CommandMatch | null {
  const m = ref.byLang.get('shell')
  if (!m) return null
  const t = text.replace(/^\s*[~\w/.-]*\s*[$#]\s+/, '').replace(/^\s*sudo\s+/, '')
  const words = t.split(' ')
  for (let n = Math.min(3, words.length); n >= 1; n--) {
    const hit = m.get(words.slice(0, n).join(' '))
    if (!hit) continue
    const rest = words.slice(n)
    // In a sentence, a command reads as one only on its own or followed by what looks typed; an
    // English-looking name (`echo`, `sort`) needs the lesson to be about the terminal as well.
    if (!inCode && ((!sure && ENGLISH.has(words[0]!)) || !rest.every((w) => /^-|[./_=*"'~\d]/.test(w)))) return null
    return { ref: hit, flags: litParts(hit, rest) }
  }
  return null
}

const PY_PREFIX: [RegExp, string][] = [
  [/^np\./, 'numpy.'],
  [/^plt\./, 'matplotlib.pyplot.'],
  [/^pd\./, 'pandas.'],
]

function matchPython(ref: Reference, text: string, inCode: boolean, sure: boolean): CommandMatch | null {
  const m = ref.byLang.get('python')
  if (!m) return null
  const t = text.replace(/^>>>\s*|^\.\.\.\s*/, '').replace(/^@/, '')
  const head = /^[A-Za-z_][\w.]*/.exec(t)?.[0]?.replace(/\.$/, '')
  if (!head) return null
  const rest = t.slice(head.length).split(/[\s(),=]+/).filter(Boolean)
  // Outside code and outside a lesson in this language, only something that reads as code counts.
  if (!inCode && !sure && (ENGLISH.has(head) || !rest.every(codeish))) return null
  const tries = [head]
  for (const [re, full] of PY_PREFIX) if (re.test(head)) tries.push(head.replace(re, full))
  // `self.readings.append` → `readings.append` → `append`: the method on whatever it is called on.
  const parts = head.split('.')
  for (let i = 1; i < parts.length; i++) tries.push(parts.slice(i).join('.'))
  for (const name of tries) {
    const hit = m.get(name)
    if (!hit) continue
    const bare = !name.includes('.') && name === head
    if (!inCode && !sure && bare && ENGLISH.has(name)) return null
    return { ref: hit, flags: litParts(hit, rest) }
  }
  return null
}

function matchCpp(ref: Reference, text: string, inCode: boolean, sure: boolean): CommandMatch | null {
  const m = ref.byLang.get('cpp')
  if (!m) return null
  const inc = /^#\s*include\s*([<"][^>"]+[>"])/.exec(text)
  if (inc) {
    const h = m.get(inc[1]!.replace(/^"(.*)"$/, '<$1>'))
    if (h) return { ref: h, flags: [] }
  }
  const dir = /^#\s*(\w+)/.exec(text)
  if (dir) {
    const d = m.get(`#${dir[1]}`)
    if (d) return { ref: d, flags: [] }
  }
  if (/^<[\w./]+>$/.test(text)) {
    const h = m.get(text)
    if (h) return { ref: h, flags: [] }
  }
  // `std::vector<double>` → `std::vector`; `v.push_back(x)` → `push_back`.
  const t = text.replace(/^[.>-]+/, '')
  const head = /^(?:::)?[A-Za-z_]\w*(?:::[A-Za-z_]\w*)*/.exec(t)?.[0]?.replace(/^::/, '')
  if (!head) return null
  const rest = t.slice(head.length).split(/[\s<>(),;]+/).filter(Boolean)
  if (!inCode && !sure && (ENGLISH.has(head) || !rest.every(codeish))) return null
  const tries = [head]
  if (!head.startsWith('std::')) tries.push(`std::${head}`)
  for (const name of tries) {
    const hit = m.get(name)
    if (!hit) continue
    if (!inCode && !sure && name === head && !head.includes('::') && ENGLISH.has(head)) return null
    return { ref: hit, flags: litParts(hit, rest) }
  }
  // A member function: the container or type whose card lists it, with it lit.
  const member = /(?:\.|->)?([A-Za-z_]\w*)\s*\(?/.exec(text.trim())?.[1]
  if (member && (inCode || sure)) {
    for (const c of ref.all) {
      if (langOf(c) !== 'cpp' || !c.flags) continue
      const f = c.flags.find(([p]) => p.replace(/^[.>-]+|\(.*$/g, '').trim() === member)
      if (f) return { ref: c, flags: [f] }
    }
  }
  return null
}

function matchSql(ref: Reference, text: string, inCode: boolean, sure: boolean): CommandMatch | null {
  const m = ref.byLang.get('sql')
  if (!m) return null
  const words = text.replace(/\(.*$/, '').toUpperCase().split(/\s+/).filter(Boolean)
  for (let n = Math.min(5, words.length); n >= 1; n--) {
    const hit = m.get(words.slice(0, n).join(' '))
    if (!hit) continue
    // In a sentence, "group by" or "select" typed in lower case is just English.
    if (!inCode && !sure && text === text.toLowerCase()) return null
    return { ref: hit, flags: litParts(hit, text.split(/\s+/)) }
  }
  return null
}

/**
 * The entry a highlight names, if it names one. The language of the code
 * (or of the lesson) is tried first, then the others, so `for` in a Python
 * lesson is Python's `for` and in a Terminal lesson the shell's.
 */
export function matchCommand(ref: Reference, selection: string, ctx: MatchContext = {}): CommandMatch | null {
  const text = selection.replace(/[`“”]/g, '').replace(/\s+/g, ' ').trim()
  if (!text || text.length > 200) return null
  const inCode = !!ctx.inCode
  const sure = !!ctx.lang
  const order: CommandLang[] = ctx.lang ? [ctx.lang] : ['shell', 'python', 'cpp', 'sql']
  // Outside its own language, a name only counts when it could not be anything else.
  // A lesson in one language mentions terminal commands (`echo`, `python3`, `g++`) but not another
  // language's names, so that is the one fallback: `print` in a C++ lesson is its own function.
  if (ctx.lang && ctx.lang !== 'shell') order.push('shell')
  // Code that is not the lesson's own language is still code: `echo` in a Python lesson that
  // compares print to it is the terminal's echo, once Python has no entry of that name.
  for (const [i, lang] of order.entries()) {
    const own = i === 0 && sure
    const hit =
      lang === 'shell'
        ? matchShell(ref, text, inCode, own)
        : lang === 'python'
          ? matchPython(ref, text, inCode, own)
          : lang === 'cpp'
            ? matchCpp(ref, text, inCode, own)
            : matchSql(ref, text, inCode, own)
    if (hit) return hit
  }
  return null
}

/** What the card calls this entry: "Command", "Python keyword", "NumPy function", "C++ header", "SQL keyword". */
export function kindLabel(c: CommandRef): string {
  const lang = langOf(c)
  if (lang === 'shell') return 'Command'
  if (lang === 'sql') return c.kind === 'function' ? 'SQL function' : 'SQL keyword'
  const lib =
    lang === 'python'
      ? /^(numpy)\./.test(c.name) || c.name === 'numpy'
        ? 'NumPy'
        : /^scipy\b/.test(c.name)
          ? 'SciPy'
          : /^matplotlib\b/.test(c.name)
            ? 'Matplotlib'
            : /^pandas\b/.test(c.name)
              ? 'pandas'
              : /^(pytest|numba|hypothesis|joblib|pyarrow|casadi|cvxpy)\b/.test(c.name)
                ? c.name.split('.')[0]!
                : 'Python'
      : /^Eigen::/.test(c.name) || /Eigen/.test(c.name)
        ? 'Eigen'
        : /^(testing::|EXPECT_|ASSERT_|TEST|MOCK_|INSTANTIATE_)/.test(c.name)
          ? 'GoogleTest'
          : /^py::|PYBIND11/.test(c.name)
            ? 'pybind11'
            : 'C++'
  if (c.kind === 'library') return lib === 'C++' && c.name.startsWith('std::') ? 'C++ standard library' : `${lib} library`
  const kind = c.kind === 'directive' ? 'preprocessor directive' : c.kind
  return `${lib} ${kind}`
}
