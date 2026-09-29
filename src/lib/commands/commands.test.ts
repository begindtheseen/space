/* Everything the lessons have her type is in the reference Explain draws on,
   language by language, found by reading the lessons' own code; and every
   entry is complete. */
import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync, globSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { COMMANDS } from './all'
import { buildReference, entryByName, langOf, matchCommand, type CommandLang } from './index'

const REF = buildReference(COMMANDS)
const has = (lang: CommandLang, name: string) => !!REF.byLang.get(lang)?.get(lang === 'sql' ? name.toUpperCase() : name)
const read = (glob: string) => globSync(glob).map((f) => ({ f, t: readFileSync(f, 'utf8') }))
const TRACKS = (lang: string) => read(`src/learn/tracks/${lang}*.txt`)
const LESSONS = read('src/curriculum/lessons/**/*.md')
function fenced(files: { t: string }[], tags: RegExp, sections: boolean): string[] {
  const out: string[] = []
  for (const { t } of files) {
    for (const m of t.matchAll(/```(\S*)[^\n]*\n([\s\S]*?)```/g)) if (tags.test(m[1]!)) out.push(m[2]!)
    if (sections) for (const m of t.matchAll(/--- (?:solution|starter)\n([\s\S]*?)(?=\n--- |\n=== |$)/g)) out.push(m[1]!)
  }
  return out
}

/* ── Terminal and Git ─────────────────────────────────────────────────────── */

const SYNTAX = new Set(['do', 'done', 'then', 'fi', 'else', 'elif', 'esac', 'in', '{', '}', '(', ')'])

function taughtCommands(): Map<string, string> {
  const found = new Map<string, string>()
  for (const { f, t } of read('src/learn/tracks/{bash,git}*.txt')) {
    const lines: string[] = []
    for (const m of t.matchAll(/--- solution\n([\s\S]*?)(?=\n--- |\n=== |$)/g)) lines.push(...m[1]!.split('\n'))
    for (const m of t.matchAll(/^\s*~[\w/.-]*\s*\$ (.+)$/gm)) lines.push(m[1]!)
    const defined = new Set([...t.matchAll(/^\s*([a-z_][\w-]*)\s*\(\)\s*\{/gm)].map((m) => m[1]!))
    for (const line of lines) {
      if (/^\s*#/.test(line)) continue
      for (const seg of line.split(/\|\||&&|\||;|\$\(|`/)) {
        const words = seg.trim().replace(/^(?:sudo|!)\s+/, '').split(/\s+/)
        let w = words[0] ?? ''
        if (!/^[a-z[][\w.+-]*$/.test(w) || /=/.test(w) || SYNTAX.has(w) || defined.has(w)) continue
        // A script run by name (`hi.sh`) and `name = value` (the spacing mistake a lesson shows on purpose) are not commands.
        if ((w.includes('.') && !has('shell', w)) || words[1] === '=') continue
        if (w === 'git' && /^[a-z][a-z-]*$/.test(words[1] ?? '')) w = `git ${words[1]}`
        if (!found.has(w)) found.set(w, f.replace(/^.*\//, ''))
      }
    }
  }
  return found
}

/* ── Python: read by Python's own parser ──────────────────────────────────── */

const PY_SCAN = String.raw`
import ast, builtins, io, json, keyword, re, sys, tokenize, collections, datetime
THIRD = {'numpy','scipy','matplotlib','pandas','pytest','numba','hypothesis','joblib','pyarrow','casadi','cvxpy'}
STD = set(sys.stdlib_module_names)
B = set(dir(builtins))
TYPES = [str, list, dict, set, tuple, int, float, bytes, type(re.compile('x')), type(re.match('x','x')), collections.deque, collections.Counter, datetime.date, io.StringIO]
KNOWN = set().union(*[set(dir(t)) for t in TYPES])
found = {'keyword': set(), 'builtin': set(), 'module': set(), 'method': set()}
for code in json.load(sys.stdin):
    if '>>>' in code:
        code = '\n'.join(l[4:] for l in code.split('\n') if l.startswith(('>>> ', '... ')))
    try:
        for tok in tokenize.generate_tokens(io.StringIO(code).readline):
            if tok.type == tokenize.NAME and keyword.iskeyword(tok.string): found['keyword'].add(tok.string)
    except Exception:
        pass
    try:
        tree = ast.parse(code)
    except Exception:
        continue
    aliases = {}
    for n in ast.walk(tree):
        if isinstance(n, ast.Import):
            for a in n.names:
                aliases[a.asname or a.name.split('.')[0]] = a.name if a.asname else a.name.split('.')[0]
                found['module'].add(a.name)
        elif isinstance(n, ast.ImportFrom) and n.module:
            found['module'].add(n.module)
            for a in n.names: aliases[a.asname or a.name] = n.module + '.' + a.name
    own = {n.name for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.ClassDef, ast.AsyncFunctionDef))}
    stored = {n.id for n in ast.walk(tree) if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Store)}
    for n in ast.walk(tree):
        if isinstance(n, ast.Name) and n.id in B and n.id not in own and n.id not in stored and not n.id.startswith('_'):
            found['builtin'].add(n.id)
        if isinstance(n, ast.Attribute):
            chain, x = [], n
            while isinstance(x, ast.Attribute): chain.append(x.attr); x = x.value
            if isinstance(x, ast.Name) and x.id in aliases:
                found['module'].add(aliases[x.id] + '.' + '.'.join(reversed(chain)))
        if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Load) and n.id in aliases and '.' in aliases[n.id]:
            found['module'].add(aliases[n.id])
        if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute):
            base = n.func.value
            while isinstance(base, ast.Attribute): base = base.value
            if not (isinstance(base, ast.Name) and base.id in aliases) and n.func.attr in KNOWN and not n.func.attr.startswith('_'):
                found['method'].add(n.func.attr)
real = lambda name: name.split('.')[0] in STD or name.split('.')[0] in THIRD
found['module'] = {m for m in found['module'] if real(m)}
print(json.dumps({k: sorted(v) for k, v in found.items()}))
`

function pythonTaught(): Record<string, string[]> {
  const code = [...fenced(TRACKS('python'), /^(python|py)$/, true), ...fenced(LESSONS, /^(python|py)$/, false)]
  return JSON.parse(execFileSync('python3', ['-c', PY_SCAN], { input: JSON.stringify(code), encoding: 'utf8', maxBuffer: 1 << 26 }))
}

/* ── C++ and SQL: read by pattern ─────────────────────────────────────────── */

const CPP_KEYWORDS = new Set(
  'alignas alignof and asm auto bool break case catch char char8_t char16_t char32_t class concept const consteval constexpr constinit const_cast continue co_await co_return co_yield decltype default delete do double dynamic_cast else enum explicit export extern false float for friend goto if inline int long mutable namespace new noexcept not nullptr operator or private protected public register reinterpret_cast requires return short signed sizeof static static_assert static_cast struct switch template this thread_local throw true try typedef typeid typename union unsigned using virtual void volatile wchar_t while override final'.split(' '),
)
const PROJECT_HEADER = /^(nav|gnc|flight|sim|orbit|app|core|telemetry)\/|\.hpp$/

function cppTaught(): string[] {
  const out = new Set<string>()
  for (const raw of [...fenced(TRACKS('cpp'), /^(cpp|c\+\+|cc|cxx|c)$/, true), ...fenced(LESSONS, /^(cpp|c\+\+|cc|cxx|c)$/, false)]) {
    const c = raw.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '').replace(/"(?:\\.|[^"\\])*"/g, '""')
    for (const m of c.matchAll(/#\s*include\s*<([\w./]+)>/g)) if (!PROJECT_HEADER.test(m[1]!)) out.add(`<${m[1]}>`)
    for (const m of c.matchAll(/^\s*#\s*(\w+)/gm)) out.add(`#${m[1]}`)
    for (const m of c.matchAll(/\b[a-z_0-9]+\b/g)) if (CPP_KEYWORDS.has(m[0])) out.add(m[0])
    for (const m of c.matchAll(/\b(?:std|Eigen|testing|py)::(?:\w+::)*\w+/g)) out.add(m[0])
    for (const m of c.matchAll(/\b((?:EXPECT|ASSERT)_[A-Z_]+|TEST_F|TEST_P|TEST|MOCK_METHOD|EXPECT_CALL|INSTANTIATE_TEST_SUITE_P|PYBIND11_MODULE)\s*\(/g)) out.add(m[1]!)
  }
  return [...out]
}

const SQL_KEYWORDS = new Set(
  'SELECT FROM WHERE AND OR NOT IN IS NULL LIKE BETWEEN ORDER BY GROUP HAVING LIMIT OFFSET AS DISTINCT ALL JOIN INNER LEFT RIGHT FULL OUTER CROSS NATURAL ON USING UNION INTERSECT EXCEPT INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE VIEW INDEX UNIQUE PRIMARY KEY FOREIGN REFERENCES DROP ALTER ADD COLUMN RENAME TO IF EXISTS DEFAULT CHECK CONSTRAINT CASE WHEN THEN ELSE END WITH RECURSIVE OVER PARTITION ROWS RANGE UNBOUNDED PRECEDING FOLLOWING CURRENT ROW WINDOW FILTER RETURNING BEGIN COMMIT ROLLBACK EXPLAIN QUERY PLAN ANALYZE VACUUM PRAGMA TRIGGER AFTER BEFORE OF FOR CONFLICT IGNORE ABORT DO NOTHING ASC DESC COLLATE NOCASE INTEGER TEXT REAL NUMERIC TEMP CAST MATERIALIZED GENERATED ALWAYS NULLS GROUPS EXCLUDE'.split(' '),
)

function sqlTaught(): { words: Set<string>; functions: Set<string> } {
  const words = new Set<string>()
  const functions = new Set<string>()
  for (const raw of [...fenced(TRACKS('sql'), /^(sql|sqlite)$/i, true), ...fenced(LESSONS, /^(sql|sqlite)$/i, false)]) {
    const c = raw.replace(/--[^\n]*/g, '').replace(/'(?:''|[^'])*'/g, "''")
    for (const m of c.matchAll(/\b[A-Z_]+\b/g)) if (SQL_KEYWORDS.has(m[0])) words.add(m[0])
    for (const m of c.matchAll(/\b([A-Z][A-Z_0-9]*)\s*\(/g)) if (!SQL_KEYWORDS.has(m[1]!)) functions.add(m[1]!)
  }
  return { words, functions }
}

/* ── The tests ────────────────────────────────────────────────────────────── */

describe('the reference covers what the lessons teach', () => {
  it('every command the Terminal and Git courses have her run', () => {
    const missing = [...taughtCommands()].filter(([name]) => !has('shell', name)).map(([n, f]) => `${n} (${f})`)
    expect(missing, 'add these to src/lib/commands').toEqual([])
  })

  it.skipIf(spawnSync('python3', ['--version']).status !== 0)('every Python keyword, built-in, library name and method', () => {
    const taught = pythonTaught()
    const missing = [
      ...taught.keyword!.filter((k) => !has('python', k)),
      ...taught.builtin!.filter((k) => !has('python', k)),
      ...taught.module!.filter((k) => !has('python', k)),
      ...taught.method!.filter((k) => !has('python', k)).map((k) => `.${k}()`),
    ]
    expect(missing, 'add these to the python batches in src/lib/commands').toEqual([])
  }, 120_000)

  it('every C++ keyword, directive, header and library name', () => {
    const missing = cppTaught().filter((n) => !has('cpp', n))
    expect(missing, 'add these to the cpp batches in src/lib/commands').toEqual([])
  })

  it('every SQL keyword and function', () => {
    const { words, functions } = sqlTaught()
    const named = new Set(
      [...REF.byLang.get('sql')!.keys()].flatMap((k) => k.split(/[^A-Z_]+/)),
    )
    const missing = [...[...words].filter((w) => !named.has(w)), ...[...functions].filter((f) => !has('sql', f) && !named.has(f)).map((f) => `${f}()`)]
    expect(missing, 'add these to src/lib/commands/sql.ts').toEqual([])
  })
})

describe('every entry is complete', () => {
  it('has one entry per name in each language, each filled in', () => {
    const seen = new Map<string, string>()
    const dupes: string[] = []
    for (const c of COMMANDS) {
      const key = `${langOf(c)}:${langOf(c) === 'sql' ? c.name.toUpperCase() : c.name}`
      if (seen.has(key)) dupes.push(key)
      seen.set(key, c.name)
    }
    expect(dupes, 'names listed twice').toEqual([])
    for (const c of COMMANDS) {
      expect(c.official?.trim().length, `${c.name}: official`).toBeGreaterThan(3)
      expect(c.source.trim().length, `${c.name}: source`).toBeGreaterThan(3)
      expect(c.when.trim().length, `${c.name}: when`).toBeGreaterThan(20)
      expect(c.example.command.trim().length, `${c.name}: example`).toBeGreaterThan(0)
      expect(c.example.says.trim().length, `${c.name}: example says`).toBeGreaterThan(5)
    }
  })

  it('points "see also" only at entries that exist', () => {
    const broken = COMMANDS.flatMap((c) => (c.seeAlso ?? []).filter((n) => !entryByName(REF, n, langOf(c))).map((n) => `${c.name} → ${n}`))
    expect(broken).toEqual([])
  })
})

describe('finding the entry in a highlight', () => {
  const m = (s: string, ctx: Parameters<typeof matchCommand>[2] = {}) => matchCommand(REF, s, ctx)?.ref.name

  it('reads terminal commands, with their flags', () => {
    const cp = matchCommand(REF, 'cp -r notes backup', { inCode: true, lang: 'shell' })
    expect(cp?.ref.name).toBe('cp')
    expect(cp?.flags.map(([f]) => f)).toContain('-r')
    expect(m('git commit -m "first"', { inCode: true })).toBe('git commit')
    expect(m('~/project $ ls', { inCode: true })).toBe('ls')
  })

  it('reads Python in a Python lesson', () => {
    expect(m('print', { lang: 'python' })).toBe('print')
    expect(m('print("Launch")', { inCode: true, lang: 'python' })).toBe('print')
    expect(m('np.linalg.norm(v)', { inCode: true, lang: 'python' })).toBe('numpy.linalg.norm')
    expect(m('readings.append(x)', { inCode: true, lang: 'python' })).toBe('list.append')
    expect(m('for', { inCode: true, lang: 'python' })).toBe('for')
  })

  it('reads C++ and SQL in their own lessons', () => {
    expect(m('std::vector<double>', { inCode: true, lang: 'cpp' })).toBe('std::vector')
    expect(m('#include <cmath>', { inCode: true, lang: 'cpp' })).toBe('<cmath>')
    expect(m('GROUP BY', { inCode: true, lang: 'sql' })).toMatch(/^GROUP BY/)
    expect(m('COUNT(*)', { inCode: true, lang: 'sql' })).toBe('COUNT')
  })

  it('reads the same word as the lesson\'s language', () => {
    expect(REF.byLang.get(matchCommand(REF, 'for', { inCode: true, lang: 'shell' })!.ref.lang ?? 'shell')).toBe(REF.byLang.get('shell'))
    expect(matchCommand(REF, 'for', { inCode: true, lang: 'cpp' })?.ref.lang).toBe('cpp')
  })

  it('reads a command in its own course even when it looks like a word', () => {
    expect(m('echo', { lang: 'shell' })).toBe('echo')
    expect(m('echo', { inCode: true, lang: 'shell' })).toBe('echo')
    expect(m('echo "Launch at dawn"', { inCode: true, lang: 'shell' })).toBe('echo')
    expect(m('sort the list', { lang: 'shell' })).toBeUndefined()
  })

  it('reads a terminal command named in another language\'s lesson', () => {
    expect(m('echo', { inCode: true, lang: 'python' })).toBe('echo')
    expect(m('python3 main.py', { inCode: true, lang: 'python' })).toBe('python3')
    expect(m('print', { inCode: true, lang: 'cpp' })).toBeUndefined()
  })

  it('finds every entry by its own name, in its own language', () => {
    const missed = COMMANDS.filter((c) => {
      const lang = langOf(c)
      return [true, false].some((inCode) => {
        const hit = matchCommand(REF, c.name, { inCode, lang })
        return !hit || (hit.ref !== c && hit.ref.name !== c.name)
      })
    }).map((c) => `${langOf(c)}:${c.name}`)
    expect(missed, 'these names do not open their own card').toEqual([])
  })

  it('reads English words in a sentence as words', () => {
    expect(m('sort the list')).toBeUndefined()
    expect(m('find')).toBeUndefined()
    expect(m('sort', { inCode: true, lang: 'shell' })).toBe('sort')
    expect(m('mkdir')).toBe('mkdir')
    expect(m('git status')).toBe('git status')
  })
})
