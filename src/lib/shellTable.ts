/* ============================================================================
   paste, join and column for the practice terminal
   ----------------------------------------------------------------------------
   paste [-s] [-d LIST] FILE…      lines side by side (or each file on one line)
   join [-t C] [-1 N] [-2 N] [-a 1|2] [-v 1|2] [-e S] [-o LIST] [--header] F1 F2
   column -t [-s SEPS] [-o SEP] [-N NAMES]   a table with aligned columns
   ========================================================================== */

import type { ToolIO, ToolResult } from './shellTools'

const lines = (t: string) => {
  const l = t.split('\n')
  if (l[l.length - 1] === '') l.pop()
  return l
}

/** \t \n \\ \0 in a -d list. */
function delimList(d: string): string[] {
  const out: string[] = []
  for (let i = 0; i < d.length; i++) {
    if (d[i] === '\\' && i + 1 < d.length) {
      const n = d[++i]!
      out.push(n === 't' ? '\t' : n === 'n' ? '\n' : n === '0' ? '' : n)
    } else out.push(d[i]!)
  }
  return out.length ? out : ['']
}

function readAll(cmd: string, files: string[], io: ToolIO): { texts: { name: string; text: string }[]; err: string } | ToolResult {
  const texts: { name: string; text: string }[] = []
  let err = ''
  let stdinUsed = false
  for (const f of files) {
    if (f === '-') {
      texts.push({ name: '-', text: stdinUsed ? '' : io.takeStdin() })
      stdinUsed = true
      continue
    }
    const t = io.readFile(f)
    if (typeof t !== 'string') {
      err += `${cmd}: ${f}: ${t.error}\n`
      if (cmd !== 'column') return { out: '', err, code: 1 }
      continue
    }
    texts.push({ name: f, text: t })
  }
  return { texts, err }
}

function paste(args: string[], io: ToolIO): ToolResult {
  let serial = false
  let delims = ['\t']
  const files: string[] = []
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!
    if (a === '-s' || a === '--serial') serial = true
    else if (a === '-d') delims = delimList(args[++i] ?? '')
    else if (a.startsWith('-d')) delims = delimList(a.slice(2))
    else if (a.startsWith('--delimiters=')) delims = delimList(a.slice(13))
    else if (/^-s?d/.test(a)) {
      serial = true
      delims = delimList(a.slice(a.indexOf('d') + 1) || args[++i] || '')
    } else if (a.startsWith('-') && a !== '-') return { out: '', err: `paste: invalid option -- '${a.slice(1)}'\n`, code: 1 }
    else files.push(a)
  }
  if (!files.length) files.push('-')
  const got = readAll('paste', files, io)
  if ('code' in got) return got
  let cols = got.texts.map((t) => lines(t.text))
  const dashes = files.map((f, i) => (f === '-' ? i : -1)).filter((i) => i >= 0)
  if (!serial && dashes.length > 1) {
    // Each - takes the next line of standard input in turn.
    const all = cols[dashes[0]!]!
    cols = cols.map((c, i) => (dashes.includes(i) ? all.filter((_, k) => k % dashes.length === dashes.indexOf(i)) : c))
  }
  const out: string[] = []
  if (serial) {
    for (const c of cols) out.push(c.reduce((acc, l, i) => (i === 0 ? l : acc + delims[(i - 1) % delims.length] + l), ''))
  } else {
    const n = Math.max(0, ...cols.map((c) => c.length))
    for (let r = 0; r < n; r++) out.push(cols.reduce((acc, c, i) => (i === 0 ? (c[r] ?? '') : acc + delims[(i - 1) % delims.length] + (c[r] ?? '')), ''))
  }
  return { out: out.map((l) => `${l}\n`).join(''), err: got.err, code: 0 }
}

function join(args: string[], io: ToolIO): ToolResult {
  let sep: string | null = null
  let f1 = 1
  let f2 = 1
  const unpaired = new Set<number>()
  let only: number | null = null
  let empty: string | null = null
  let format: string | null = null
  let header = false
  let fold = false
  let check: boolean | null = null
  const files: string[] = []
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!
    const val = (flag: string) => (a.length > flag.length ? a.slice(flag.length) : (args[++i] ?? ''))
    if (a.startsWith('-t')) sep = val('-t')
    else if (a.startsWith('-1')) f1 = Number(val('-1'))
    else if (a.startsWith('-2')) f2 = Number(val('-2'))
    else if (a.startsWith('-j')) f1 = f2 = Number(val('-j'))
    else if (a.startsWith('-a')) unpaired.add(Number(val('-a')))
    else if (a.startsWith('-v')) only = Number(val('-v'))
    else if (a.startsWith('-e')) empty = val('-e')
    else if (a.startsWith('-o')) format = val('-o')
    else if (a === '--header') header = true
    else if (a === '-i' || a === '--ignore-case') fold = true
    else if (a === '--nocheck-order') check = false
    else if (a === '--check-order') check = true
    else if (a.startsWith('-') && a !== '-') return { out: '', err: `join: invalid option -- '${a.slice(1)}'\nTry 'join --help' for more information.\n`, code: 1 }
    else files.push(a)
  }
  if (files.length !== 2) return { out: '', err: `join: ${files.length < 2 ? `missing operand after '${files[0] ?? ''}'` : `extra operand '${files[2]}'`}\nTry 'join --help' for more information.\n`, code: 1 }
  const got = readAll('join', files, io)
  if ('code' in got) return got
  if (got.texts.length < 2) return { out: '', err: got.err, code: 1 }
  const split = (l: string) => (sep !== null && sep !== '' ? l.split(sep) : l.trim() === '' ? [] : l.trim().split(/[ \t]+/))
  const outSep = sep !== null && sep !== '' ? sep : ' '
  const rows = got.texts.map((t) => lines(t.text).map(split))
  const names = got.texts.map((t, k) => (t.name === '-' ? '-' : files[k]!))
  const keyOf = (r: string[], f: number) => {
    const k = r[f - 1] ?? ''
    return fold ? k.toLowerCase() : k
  }
  const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
  let err = got.err
  let disorder = false
  const out: string[] = []
  const seq: [1 | 2, string][] = err ? [[2, err]] : []
  const emit = (r1: string[] | null, r2: string[] | null) => {
    const key = r1 ? r1[f1 - 1] ?? '' : r2![f2 - 1] ?? ''
    if (format !== null && format !== 'auto') {
      const cells = format.split(/[, ]+/).map((spec) => {
        if (spec === '0') return key
        const m = /^([12])\.(\d+)$/.exec(spec)
        if (!m) return ''
        const r = m[1] === '1' ? r1 : r2
        const v = r?.[Number(m[2]) - 1]
        return v === undefined ? (empty ?? '') : v
      })
      out.push(cells.join(outSep))
      seq.push([1, `${cells.join(outSep)}\n`])
      return
    }
    const rest1 = r1 ? r1.filter((_, i) => i !== f1 - 1) : format === 'auto' ? Array(Math.max(0, (rows[0]![0]?.length ?? 1) - 1)).fill(empty ?? '') : []
    const rest2 = r2 ? r2.filter((_, i) => i !== f2 - 1) : format === 'auto' ? Array(Math.max(0, (rows[1]![0]?.length ?? 1) - 1)).fill(empty ?? '') : []
    out.push([key, ...rest1, ...rest2].join(outSep))
    seq.push([1, `${[key, ...rest1, ...rest2].join(outSep)}\n`])
  }
  const [a, b] = rows as [string[][], string[][]]
  let i = 0
  let j = 0
  if (header) {
    if (a.length || b.length) emit(a[0] ?? null, b[0] ?? null)
    i = j = 1
  }
  const checkOrder = (r: string[][], at: number, f: number, which: number) => {
    if (check === false || at === 0 || (header && at === 1) || at >= r.length) return
    if (cmp(keyOf(r[at - 1]!, f), keyOf(r[at]!, f)) > 0) {
      if (!disorder) {
        const msg = `join: ${names[which]}:${at + 1}: is not sorted: ${r[at]!.join(sep !== null && sep !== '' ? sep : ' ')}\n`
        err += msg
        seq.push([2, msg])
      }
      disorder = true
    }
  }
  const printA = (r: string[]) => {
    if (only === 1 || (only === null && unpaired.has(1))) emit(r, null)
  }
  const printB = (r: string[]) => {
    if (only === 2 || (only === null && unpaired.has(2))) emit(null, r)
  }
  while (i < a.length && j < b.length) {
    const ka = keyOf(a[i]!, f1)
    const kb = keyOf(b[j]!, f2)
    const c = cmp(ka, kb)
    if (c < 0) {
      printA(a[i]!)
      i++
      checkOrder(a, i, f1, 0)
      continue
    }
    if (c > 0) {
      printB(b[j]!)
      j++
      checkOrder(b, j, f2, 1)
      continue
    }
    let i2 = i
    while (i2 < a.length && keyOf(a[i2]!, f1) === ka) i2++
    let j2 = j
    while (j2 < b.length && keyOf(b[j2]!, f2) === kb) j2++
    // Reading on to the end of the group is what notices a line out of order.
    checkOrder(a, i2, f1, 0)
    checkOrder(b, j2, f2, 1)
    if (only === null) for (let x = i; x < i2; x++) for (let y = j; y < j2; y++) emit(a[x]!, b[y]!)
    i = i2
    j = j2
  }
  for (; i < a.length; i++) {
    printA(a[i]!)
    checkOrder(a, i + 1, f1, 0)
  }
  for (; j < b.length; j++) {
    printB(b[j]!)
    checkOrder(b, j + 1, f2, 1)
  }
  if (disorder) {
    err += 'join: input is not in sorted order\n'
    seq.push([2, 'join: input is not in sorted order\n'])
  }
  return { out: out.map((l) => `${l}\n`).join(''), err, code: disorder ? 1 : 0, chunks: seq }
}

function column(args: string[], io: ToolIO): ToolResult {
  let table = false
  let seps: string | null = null
  let outSep = '  '
  let names: string[] | null = null
  const files: string[] = []
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!
    if (a === '-t' || a === '--table') table = true
    else if (a === '-s') seps = args[++i] ?? ''
    else if (a.startsWith('-s') && a.length > 2 && !/^-s?t/.test(a)) seps = a.slice(2)
    else if (a === '-o') outSep = args[++i] ?? '  '
    else if (a.startsWith('--output-separator=')) outSep = a.slice(19)
    else if (a === '-N' || a === '--table-columns') names = (args[++i] ?? '').split(',')
    else if (a.startsWith('--table-columns=')) names = a.slice(16).split(',')
    else if (/^-[tsnx]+$/.test(a)) {
      if (a.includes('t')) table = true
      if (a.includes('s')) seps = args[++i] ?? ''
    } else if (a.startsWith('-') && a !== '-') return { out: '', err: `column: invalid option -- '${a.slice(1)}'\n`, code: 1 }
    else files.push(a)
  }
  if (!files.length) files.push('-')
  const got = readAll('column', files, io)
  if ('code' in got) return got
  const text = got.texts.map((t) => t.text).join('')
  const input = lines(text).filter((l) => l.trim() !== '')
  if (!table) {
    // Without -t: the items in columns across an 80-character screen.
    const items = input.map((l) => l.replace(/\t/g, ' '))
    if (!items.length) return { out: '', err: got.err, code: 0 }
    const w = Math.max(...items.map((x) => x.length)) + (8 - (Math.max(...items.map((x) => x.length)) % 8))
    const perRow = Math.max(1, Math.floor(80 / w))
    const rowsN = Math.ceil(items.length / perRow)
    const outL: string[] = []
    for (let r = 0; r < rowsN; r++) {
      let line = ''
      for (let c = 0; c < perRow; c++) {
        const item = items[c * rowsN + r]
        if (item === undefined) continue
        const next = items[(c + 1) * rowsN + r]
        line += next === undefined ? item : item + '\t'.repeat(Math.ceil((w - item.length) / 8))
      }
      outL.push(line)
    }
    return { out: outL.map((l) => `${l}\n`).join(''), err: got.err, code: 0 }
  }
  const splitRow = (l: string) => {
    if (seps === null) return l.trim().split(/[ \t]+/)
    const cls = `[${seps.replace(/[\]\\^-]/g, '\\$&')}]`
    return l.split(new RegExp(cls))
  }
  const rows = input.map(splitRow)
  if (names) rows.unshift(names)
  const ncols = Math.max(0, ...rows.map((r) => r.length))
  const widths = Array.from({ length: ncols }, (_, c) => Math.max(0, ...rows.map((r) => [...(r[c] ?? '')].length)))
  // Short rows are filled with empty cells; every column but the last is padded and followed by the separator.
  const out = rows.map((r) => Array.from({ length: ncols }, (_, c) => r[c] ?? '').map((cell, c) => (c === ncols - 1 ? cell : cell + ' '.repeat(widths[c]! - [...cell].length) + outSep)).join(''))
  return { out: out.map((l) => `${l}\n`).join(''), err: got.err, code: 0 }
}

export function runTable(cmd: string, args: string[], io: ToolIO): ToolResult {
  if (cmd === 'paste') return paste(args, io)
  if (cmd === 'join') return join(args, io)
  return column(args, io)
}
