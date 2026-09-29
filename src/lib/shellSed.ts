/* ============================================================================
   sed for the practice terminal
   ----------------------------------------------------------------------------
   GNU sed's language: addresses (N, $, /re/, first~step, a,b  a,+N  0,/re/,
   !), blocks { }, s///[g p N I w file], y///, d D p P n N q Q = a i c h H g
   G x b t T :label r w l z, -n, -E, and the hold space. Input files run as
   one stream (as GNU sed does without -s or -i).
   ========================================================================== */

export class SedError extends Error {}

type Addr = { k: 'n'; n: number } | { k: 'step'; first: number; step: number } | { k: '$' } | { k: 're'; re: RegExp | null } | { k: 'zero' }
type Addr2 = Addr | { k: 'plus'; n: number } | { k: 'mult'; n: number }

interface Cmd {
  a1?: Addr
  a2?: Addr2
  neg: boolean
  op: string
  /** s: the regex (null reuses the last one), replacement and flags. */
  re?: RegExp | null
  rep?: string
  global?: boolean
  print?: boolean
  nth?: number
  file?: string
  text?: string
  label?: string
  code?: number
  from?: string[]
  to?: string[]
  /** { : where its } is. */
  end?: number
}

/** POSIX classes like [[:digit:]] for JavaScript. */
function posixClasses(p: string): string {
  const map: Record<string, string> = { digit: '0-9', alpha: 'a-zA-Z', alnum: 'a-zA-Z0-9', upper: 'A-Z', lower: 'a-z', space: ' \\t\\n\\r\\f\\v', blank: ' \\t', punct: '!-\\/:-@\\[-`{-~', xdigit: '0-9A-Fa-f', cntrl: '\\x00-\\x1f', print: ' -~', graph: '!-~' }
  return p.replace(/\[:(\w+):\]/g, (m, n: string) => map[n] ?? m)
}

/** A sed regular expression (basic, or extended with -E) in JavaScript's syntax. */
function toJs(p: string, extended: boolean): string {
  let out = ''
  for (let k = 0; k < p.length; k++) {
    const c = p[k]!
    if (c === '\\' && k + 1 < p.length) {
      const n = p[++k]!
      if (n === 'n') out += '\\n'
      else if (n === 't') out += '\\t'
      else if (n === '<' || n === '>') out += '\\b'
      else if (n === '`') out += '^'
      else if (n === "'") out += '$'
      else if (!extended && '(){}|+?'.includes(n)) out += n
      else out += `\\${n}`
      continue
    }
    if (c === '[') {
      let j = k + 1
      if (p[j] === '^') j++
      if (p[j] === ']') j++
      while (j < p.length && p[j] !== ']') j += p[j] === '[' && p[j + 1] === ':' ? Math.max(p.indexOf(':]', j + 2) + 2 - j, 1) : 1
      out += posixClasses(p.slice(k, j + 1)).replace(/\\(?![nt\]\\-])/g, '\\\\').replace(/^\[\^?\]/, (m) => m.replace(']', '\\]'))
      k = j
      continue
    }
    if (!extended && '(){}|+?'.includes(c)) out += `\\${c}`
    else if (c === '*' && (out === '' || out.endsWith('(') || out === '^')) out += '\\*'
    else out += c
  }
  return out
}

export function compileSed(script: string, extended: boolean): Cmd[] {
  const cmds: Cmd[] = []
  const blocks: number[] = []
  let i = 0
  const fail = (m: string): never => {
    throw new SedError(`sed: -e expression #1, char ${i}: ${m}`)
  }
  const regex = (src: string, flags: string): RegExp | null => {
    if (src === '') return null
    try {
      return new RegExp(toJs(src, extended), flags)
    } catch {
      return fail('Invalid preceding regular expression')
    }
  }
  const readTo = (d: string): string | null => {
    let r = ''
    while (i < script.length) {
      const c = script[i]!
      if (c === '\\' && script[i + 1] === d) {
        r += d === '/' || d === '&' ? d : `\\${d}`
        i += 2
        continue
      }
      if (c === '\\' && script[i + 1] === '\n') {
        r += '\n'
        i += 2
        continue
      }
      if (c === '\\') {
        r += c + (script[i + 1] ?? '')
        i += 2
        continue
      }
      if (c === '\n' && d !== '\n') return null
      if (c === d) {
        i++
        return r
      }
      r += c
      i++
    }
    return null
  }
  const num = (): number => {
    let j = i
    while (/\d/.test(script[j] ?? '')) j++
    const n = Number(script.slice(i, j))
    i = j
    return n
  }
  const reAddr = (): Addr => {
    let d = '/'
    if (script[i] === '\\') {
      d = script[i + 1] ?? ''
      i += 2
    } else i++
    const src = readTo(d)
    if (src === null) fail('unterminated address regex')
    let flags = ''
    while (script[i] === 'I' || script[i] === 'M') flags += script[i++] === 'I' ? 'i' : 'm'
    return { k: 're', re: regex(src!, flags) }
  }
  const addr = (): Addr | undefined => {
    if (/\d/.test(script[i] ?? '')) {
      const n = num()
      if (script[i] === '~') {
        i++
        return { k: 'step', first: n, step: num() }
      }
      return n === 0 ? { k: 'zero' } : { k: 'n', n }
    }
    if (script[i] === '$') {
      i++
      return { k: '$' }
    }
    if (script[i] === '/' || script[i] === '\\') return reAddr()
    return undefined
  }
  const restOfLine = (): string => {
    let r = ''
    while (i < script.length && script[i] !== '\n') {
      if (script[i] === '\\' && script[i + 1] === '\n') {
        r += '\n'
        i += 2
        continue
      }
      if (script[i] === '\\' && i + 1 < script.length) {
        r += script[i + 1]
        i += 2
        continue
      }
      r += script[i++]
    }
    return r
  }
  const label = (): string => {
    while (script[i] === ' ' || script[i] === '\t') i++
    let r = ''
    while (i < script.length && script[i] !== '\n' && script[i] !== ';') r += script[i++]
    return r.trim()
  }
  const fileName = (): string => {
    while (script[i] === ' ') i++
    let r = ''
    while (i < script.length && script[i] !== '\n') r += script[i++]
    return r
  }
  while (i < script.length) {
    while (i < script.length && /[\s;]/.test(script[i]!)) i++
    if (i >= script.length) break
    if (script[i] === '#') {
      while (i < script.length && script[i] !== '\n') i++
      continue
    }
    const c: Cmd = { neg: false, op: '' }
    const a1 = addr()
    if (a1) c.a1 = a1
    if (a1 && script[i] === ',') {
      i++
      while (script[i] === ' ') i++
      if (script[i] === '+' || script[i] === '~') {
        const k = script[i++] === '+' ? 'plus' : 'mult'
        c.a2 = { k, n: num() }
      } else {
        const a2 = addr()
        if (!a2) fail("unexpected `,'")
        c.a2 = a2!.k === 'zero' ? { k: 'n', n: 0 } : a2!
      }
    }
    if (a1?.k === 'zero' && (!c.a2 || c.a2.k !== 're')) fail('invalid usage of line address 0')
    while (script[i] === ' ' || script[i] === '\t') i++
    while (script[i] === '!') {
      c.neg = true
      i++
      while (script[i] === ' ') i++
    }
    const op = script[i++]
    if (op === undefined) fail('missing command')
    c.op = op!
    switch (op) {
      case '{':
        blocks.push(cmds.length)
        break
      case '}':
        if (!blocks.length) fail("unexpected `}'")
        if (a1) fail("} doesn't want any addresses")
        cmds[blocks.pop()!]!.end = cmds.length
        break
      case 's': {
        const d = script[i++]
        if (!d || d === '\\' || d === '\n') fail("unterminated `s' command")
        const src = readTo(d!)
        if (src === null) fail("unterminated `s' command")
        const rep = readTo(d!)
        if (rep === null) fail("unterminated `s' command")
        let flags = ''
        for (;;) {
          const ch = script[i]
          if (ch === 'g') c.global = true
          else if (ch === 'p') c.print = true
          else if (ch === 'i' || ch === 'I') flags += 'i'
          else if (ch === 'm' || ch === 'M') flags += 'm'
          else if (ch === 'e') {
            /* not supported: run the pattern space as a command */
          } else if (ch !== undefined && /\d/.test(ch)) {
            c.nth = num()
            continue
          } else if (ch === 'w') {
            i++
            c.file = fileName()
            break
          } else break
          i++
        }
        if (i < script.length && !/[\s;}#]/.test(script[i]!)) fail("unknown option to `s'")
        c.re = regex(src!, flags)
        c.rep = rep!
        break
      }
      case 'y': {
        const d = script[i++]
        const src = d ? readTo(d) : null
        const dst = d && src !== null ? readTo(d) : null
        if (src === null || dst === null) fail("unterminated `y' command")
        const unesc = (t: string) => [...t.replace(/\\n/g, '\n').replace(/\\\\/g, '\\')]
        c.from = unesc(src!)
        c.to = unesc(dst!)
        if (c.from.length !== c.to.length) fail("strings for `y' command are different lengths")
        break
      }
      case 'a':
      case 'i':
      case 'c': {
        while (script[i] === ' ' || script[i] === '\t') i++
        if (script[i] === '\\') {
          i++
          if (script[i] === '\n') i++
        }
        c.text = restOfLine()
        break
      }
      case ':':
        if (a1) fail(": doesn't want any addresses")
        c.label = label()
        if (!c.label) fail('":" lacks a label')
        break
      case 'b':
      case 't':
      case 'T':
        c.label = label()
        break
      case 'r':
      case 'R':
      case 'w':
      case 'W':
        c.file = fileName()
        break
      case 'q':
      case 'Q':
      case 'l':
      case 'L':
        while (script[i] === ' ') i++
        if (/\d/.test(script[i] ?? '')) c.code = num()
        break
      case '=':
      case 'd':
      case 'D':
      case 'p':
      case 'P':
      case 'n':
      case 'N':
      case 'g':
      case 'G':
      case 'h':
      case 'H':
      case 'x':
      case 'z':
      case 'F':
        break
      default:
        fail(`unknown command: \`${op}'`)
    }
    cmds.push(c)
    while (script[i] === ' ' || script[i] === '\t') i++
    if (i < script.length && !/[\n;}#]/.test(script[i]!) && op !== '{' && op !== '}') fail(`extra characters after command`)
  }
  if (blocks.length) {
    i = script.length
    fail("unmatched `{'")
  }
  return cmds
}

export interface SedIO {
  writeFile: (path: string, text: string, append: boolean) => string | null
  readFile: (path: string) => string | { error: string }
}

/** Runs a compiled script over text (all the input, as one stream). */
export function runSedScript(cmds: Cmd[], text: string, quiet: boolean, io: SedIO): { out: string; code: number } {
  const lines = text === '' ? [] : text.split('\n')
  const noFinalNewline = text !== '' && !text.endsWith('\n')
  if (!noFinalNewline && lines.length) lines.pop()
  let out = ''
  let owed = false
  const emit = (t: string, lastLine: boolean) => {
    if (owed) out += '\n'
    out += t
    owed = lastLine && noFinalNewline
    if (!owed) out += '\n'
  }
  const written = new Set<string>()
  const write = (file: string, t: string) => {
    if (file === '/dev/stdout') {
      emit(t, false)
      return
    }
    io.writeFile(file, `${t}\n`, written.has(file))
    written.add(file)
  }
  const labels = new Map<string, number>()
  cmds.forEach((c, k) => {
    if (c.op === ':') labels.set(c.label!, k)
  })
  for (const c of cmds) if ((c.op === 'b' || c.op === 't' || c.op === 'T') && c.label && !labels.has(c.label)) throw new SedError(`sed: -e expression #1, char 0: can't find label for jump to \`${c.label}'`)
  let lastRe: RegExp | null = null
  const reOf = (re: RegExp | null | undefined) => {
    const r = re ?? lastRe
    if (!r) throw new SedError('sed: no previous regular expression')
    lastRe = r
    return r
  }
  const active: (false | { endLine?: number })[] = cmds.map(() => false)
  let idx = 0
  let lineNo = 0
  let hold = ''
  let ps = ''
  let code = 0
  let steps = 0
  const isLast = () => idx >= lines.length
  const readLine = (): boolean => {
    if (idx >= lines.length) return false
    ps = lines[idx++]!
    lineNo++
    return true
  }
  const test = (a: Addr, first = false): boolean => {
    switch (a.k) {
      case 'n':
        return lineNo === a.n
      case 'step':
        return a.step <= 0 ? lineNo === a.first : lineNo >= a.first && (lineNo - a.first) % a.step === 0
      case '$':
        return isLast()
      case 'zero':
        return first
      default:
        return reOf(a.re).test(ps)
    }
  }
  const matches = (c: Cmd, k: number): boolean => {
    let m: boolean
    if (!c.a1) m = true
    else if (!c.a2) m = test(c.a1)
    else {
      const st = active[k]
      if (!st) {
        m = c.a1.k === 'zero' ? true : test(c.a1)
        if (m) {
          const a2 = c.a2
          if (c.a1.k === 'zero' && a2.k === 're' && reOf(a2.re).test(ps)) active[k] = false
          else if (a2.k === 'n') active[k] = a2.n > lineNo ? { endLine: a2.n } : false
          else if (a2.k === 'plus') active[k] = a2.n > 0 ? { endLine: lineNo + a2.n } : false
          else if (a2.k === 'mult') active[k] = a2.n > 0 && lineNo % a2.n !== 0 ? { endLine: Math.ceil(lineNo / a2.n) * a2.n } : false
          else if (a2.k === '$') active[k] = isLast() ? false : {}
          else active[k] = {}
        }
      } else {
        m = true
        const a2 = c.a2
        const done = st.endLine !== undefined ? lineNo >= st.endLine : a2.k === '$' ? isLast() : a2.k === 're' ? reOf(a2.re).test(ps) : false
        if (done) active[k] = false
      }
    }
    return c.neg ? !m : m
  }
  const substitute = (c: Cmd): boolean => {
    const base = reOf(c.re)
    const re = new RegExp(base.source, `${base.flags.replace('g', '')}g`)
    const want = c.nth ?? 1
    let res = ''
    let i = 0
    let n = 0
    let prevEnd = -1
    let did = false
    while (i <= ps.length) {
      re.lastIndex = i
      const m = re.exec(ps)
      if (!m) break
      const start = m.index
      const end = start + m[0].length
      if (start === end && start === prevEnd) {
        if (start >= ps.length) break
        res += ps.slice(i, start + 1)
        i = start + 1
        continue
      }
      n++
      res += ps.slice(i, start)
      if (c.global ? n >= want : n === want) {
        res += replacement(c.rep!, m)
        did = true
      } else res += m[0]
      prevEnd = end
      if (start === end) {
        if (start < ps.length) res += ps[start]
        i = start + 1
      } else i = end
      if (did && !c.global) break
    }
    if (!did) return false
    ps = res + ps.slice(Math.min(i, ps.length))
    return true
  }
  const appendQueue: string[] = []
  const flushAppends = () => {
    for (const a of appendQueue) emit(a, false)
    appendQueue.length = 0
  }
  let quit = false
  cycle: while (!quit && readLine()) {
    let tflag = false
    let pc = 0
    let autoprint = !quiet
    let restart = false
    do {
      restart = false
      while (pc < cmds.length) {
        if (++steps > 200000) throw new SedError('sed: the script ran too long — the practice terminal stops it')
        const c = cmds[pc]!
        if (c.op === '}' || c.op === ':') {
          pc++
          continue
        }
        if (!matches(c, pc)) {
          pc = c.op === '{' ? c.end! + 1 : pc + 1
          continue
        }
        switch (c.op) {
          case '{':
            break
          case 's':
            if (substitute(c)) {
              tflag = true
              if (c.print) emit(ps, isLast())
              if (c.file) write(c.file, ps)
            }
            break
          case 'y':
            ps = [...ps].map((ch) => (c.from!.includes(ch) ? c.to![c.from!.indexOf(ch)]! : ch)).join('')
            break
          case 'p':
            emit(ps, isLast())
            break
          case 'P':
            emit(ps.split('\n')[0]!, isLast())
            break
          case '=':
            emit(String(lineNo), false)
            break
          case 'l':
            emit(`${[...ps].map((ch) => (ch === '\\' ? '\\\\' : ch === '\t' ? '\\t' : ch === '\n' ? '\\n' : ch < ' ' ? `\\${ch.charCodeAt(0).toString(8).padStart(3, '0')}` : ch)).join('')}$`, false)
            break
          case 'a':
            appendQueue.push(c.text!)
            break
          case 'i':
            emit(c.text!, false)
            break
          case 'c':
            // In a range, the text replaces the whole range: it is printed at its end.
            if (!c.a2 || !active[pc]) emit(c.text!, false)
            continue cycle
          case 'r': {
            const t = io.readFile(c.file!)
            if (typeof t === 'string' && t) appendQueue.push(t.replace(/\n$/, ''))
            break
          }
          case 'w':
            write(c.file!, ps)
            break
          case 'd':
            flushAppends()
            continue cycle
          case 'D': {
            const nl = ps.indexOf('\n')
            if (nl < 0) {
              flushAppends()
              continue cycle
            }
            ps = ps.slice(nl + 1)
            flushAppends()
            pc = 0
            restart = true
            break
          }
          case 'n':
            if (isLast()) {
              if (autoprint) emit(ps, true)
              autoprint = false
              quit = true
              break
            }
            if (autoprint) emit(ps, false)
            flushAppends()
            readLine()
            break
          case 'N':
            if (isLast()) {
              quit = true
              break
            }
            lineNo++
            ps += `\n${lines[idx++]}`
            break
          case 'g':
            ps = hold
            break
          case 'G':
            ps += `\n${hold}`
            break
          case 'h':
            hold = ps
            break
          case 'H':
            hold += `\n${ps}`
            break
          case 'x':
            ;[ps, hold] = [hold, ps]
            break
          case 'z':
            ps = ''
            break
          case 'F':
            emit('-', false)
            break
          case 'b':
            pc = c.label ? labels.get(c.label)! : cmds.length
            continue
          case 't':
          case 'T':
            if ((c.op === 't') === tflag) {
              tflag = false
              pc = c.label ? labels.get(c.label)! : cmds.length
              continue
            }
            if (c.op === 't') tflag = false
            break
          case 'q':
          case 'Q':
            code = c.code ?? 0
            quit = true
            if (c.op === 'Q') autoprint = false
            break
        }
        if (restart || quit) break
        pc++
      }
    } while (restart && !quit)
    if (autoprint) emit(ps, isLast())
    flushAppends()
  }
  if (owed && out.endsWith('\n')) out = out.slice(0, -1)
  return { out, code }
}

/** The replacement of s///: & and \1…\9, \n, and GNU's \U \L \E \u \l case changes. */
function replacement(rep: string, m: RegExpExecArray): string {
  let out = ''
  let mode: 'U' | 'L' | null = null
  let once: 'u' | 'l' | null = null
  const put = (t: string) => {
    for (const ch of t) {
      let x = mode === 'U' ? ch.toUpperCase() : mode === 'L' ? ch.toLowerCase() : ch
      if (once) {
        x = once === 'u' ? x.toUpperCase() : x.toLowerCase()
        once = null
      }
      out += x
    }
  }
  for (let k = 0; k < rep.length; k++) {
    const c = rep[k]!
    if (c === '\\' && k + 1 < rep.length) {
      const n = rep[++k]!
      if (/\d/.test(n)) put(m[Number(n)] ?? '')
      else if (n === 'n') put('\n')
      else if (n === 't') put('\t')
      else if (n === 'U' || n === 'L') mode = n
      else if (n === 'E') mode = null
      else if (n === 'u' || n === 'l') once = n
      else put(n)
    } else if (c === '&') put(m[0])
    else put(c)
  }
  return out
}
