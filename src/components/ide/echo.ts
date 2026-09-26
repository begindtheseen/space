/* ============================================================================
   Console-style examples
   ----------------------------------------------------------------------------
   Lessons write examples the way you would type them into a console — one
   expression a line, with what it gives in a comment:

     Math.round(2.6)        // 3
     (0.1 + 0.2)            // 0.30000000000000004

   Run as a program, that prints nothing (or, in JavaScript, joins the lines
   into one call and fails). So an example with no output of its own is run
   the way a console would: each complete expression line at the top level
   shows its value. Line numbers are untouched — every change stays on its
   own line, and JavaScript's helper sits at the end, hoisted.
   ========================================================================== */

const JS_KEYWORD = /^(const|let|var|function|class|if|else|for|while|do|switch|case|default|return|throw|try|catch|finally|import|export|type|interface|enum|declare|async\s+function|break|continue|new\s+Promise)\b/
const PY_KEYWORD = /^(def|class|if|elif|else|for|while|try|except|finally|with|import|from|return|pass|raise|print|assert|del|global|nonlocal|lambda|async|await|yield|break|continue|@)\b/

/** Whether an example prints anything of its own. */
function printsSomething(lang: string, code: string): boolean {
  if (lang === 'python') return /\bprint\s*\(/.test(code)
  return /\bconsole\.(log|info|warn|error|table)\s*\(/.test(code)
}

/** Splits a line into code and its trailing comment, ignoring comment marks inside strings. */
function splitComment(line: string, mark: string): [string, string] {
  let quote: string | null = null
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if (line.startsWith(mark, i)) return [line.slice(0, i), line.slice(i)]
  }
  return [line, '']
}

/** Bracket depth change across a piece of code, strings skipped. */
function depthOf(code: string): number {
  let d = 0
  let quote: string | null = null
  for (let i = 0; i < code.length; i++) {
    const c = code[i]!
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if ('([{'.includes(c)) d++
    else if (')]}'.includes(c)) d--
  }
  return d
}

/** An `=` that assigns, at the top level of the line (not ==, ===, !=, <=, >=, =>). */
function assigns(code: string): boolean {
  let depth = 0
  let quote: string | null = null
  for (let i = 0; i < code.length; i++) {
    const c = code[i]!
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if ('([{'.includes(c)) depth++
    else if (')]}'.includes(c)) depth--
    else if (c === '=' && depth === 0) {
      const prev = code[i - 1] ?? ''
      const next = code[i + 1] ?? ''
      if (next === '=' || next === '>' || '=!<>'.includes(prev)) continue
      return true
    }
  }
  return false
}

/**
 * The example as a console would run it, or unchanged when it prints on its
 * own or is not a language with a console here.
 */
export function echoExpressions(lang: string, code: string, force = false): string {
  if (!['javascript', 'typescript', 'python'].includes(lang) || (!force && printsSomething(lang, code))) return code
  const py = lang === 'python'
  let depth = 0
  let echoed = 0
  const out = code.split('\n').map((line) => {
    const [body, comment] = splitComment(line, py ? '#' : '//')
    const start = depth
    depth += depthOf(body)
    const expr = body.trim()
    const topLevel = start === 0 && depth === 0 && !/^\s/.test(body)
    if (!topLevel || !expr || (py ? PY_KEYWORD : JS_KEYWORD).test(expr) || assigns(expr)) return line
    if (/[{(,:+\-*/=&|?]$|=>$/.test(expr.replace(/;$/, '')) || /^[}\])]/.test(expr)) return line
    if (!py && /^(\/\*|\*)/.test(expr)) return line
    echoed++
    const e = expr.replace(/;$/, '')
    return py ? `if (__v := (${e})) is not None: print(repr(__v))  ${comment}`.trimEnd() : `;__echo(${e})  ${comment}`.trimEnd()
  })
  if (!echoed) return code
  if (py) return out.join('\n')
  const sig = lang === 'typescript' ? '(v: unknown): void' : '(v)'
  return `${out.join('\n')}\nfunction __echo${sig} { if (v !== undefined) console.log(typeof v === 'string' ? JSON.stringify(v) : v) }\n`
}

/**
 * A Python REPL transcript (`>>>` and `...` prompts, output underneath) as the
 * code she would type: prompts stripped, the printed output dropped. Run
 * console-style, it prints the transcript's output again. Anything that is
 * not a transcript comes back unchanged.
 */
export function fromTranscript(code: string): string {
  const lines = code.split('\n')
  if (!lines.some((l) => /^>>>( |$)/.test(l))) return code
  const kept: string[] = []
  for (const l of lines) {
    if (/^>>>( |$)/.test(l)) kept.push(l.slice(4))
    else if (/^\.\.\.( |$)/.test(l)) kept.push(l.slice(4))
  }
  return kept.join('\n').replace(/\n+$/, '') + '\n'
}
