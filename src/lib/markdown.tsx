/* ============================================================================
   ORBIT — markdown renderer
   ----------------------------------------------------------------------------
   Renders to React nodes rather than to an HTML string, so there is no
   `dangerouslySetInnerHTML` anywhere in the app and no path by which authored
   or imported content could inject markup. The one exception is mathematics:
   KaTeX writes its own DOM into a span it owns, from TeX source, with `trust`
   off — it never sees author HTML.

   The supported subset is what the curriculum and the lessons use: headings,
   bold, italic, inline code, fenced code, lists (one level of nesting,
   continuation lines), blockquotes, tables, links, rules, inline `$…$` and
   display `$$…$$` math, and `::: kind` callout blocks (example, key, check,
   answer, note, warning). Everything else is plain text.
   ========================================================================== */
import { VideoEmbed } from '@/components/VideoEmbed'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import './markdown.css'

export function Markdown({ children, className = '' }: { children: string; className?: string }) {
  return <div className={`md ${className}`}>{renderBlocks(children)}</div>
}

/* ── Math ────────────────────────────────────────────────────────────────── */

type Katex = typeof import('katex').default

let katexPromise: Promise<Katex> | null = null

/** KaTeX and its stylesheet are fetched the first time any math is rendered. */
function loadKatex(): Promise<Katex> {
  if (!katexPromise) {
    katexPromise = Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(
      ([mod]) => (mod.default ?? mod) as Katex,
    )
  }
  return katexPromise
}

export function Math({ tex, display = false }: { tex: string; display?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [failed, setFailed] = useState(false)

  useLayoutEffect(() => {
    let alive = true
    loadKatex()
      .then((katex) => {
        if (!alive || !ref.current) return
        katex.render(tex, ref.current, {
          displayMode: display,
          throwOnError: false,
          strict: 'ignore',
          trust: false,
          output: 'htmlAndMathml',
        })
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [tex, display])

  if (failed) {
    return <code className="md__code">{tex}</code>
  }
  return <span ref={ref} className={`md__math${display ? ' md__math--display' : ''}`} aria-label={tex} />
}

/* ── Blocks ──────────────────────────────────────────────────────────────── */

const BLOCK_START = /^\s*(#{1,4}\s|[-*+]\s|\d+[.)]\s|>|```|-{3,}\s*$|\$\$|:::|\|)/

const BOX_LABELS: Record<string, string> = {
  example: 'Worked example',
  key: 'Key idea',
  check: 'Check yourself',
  answer: 'Answer',
  note: 'Note',
  warning: 'Watch out',
}

function renderBlocks(src: string): ReactNode[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const out: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]!

    // fenced code
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim()
      const body: string[] = []
      i++
      while (i < lines.length && !lines[i]!.trim().startsWith('```')) {
        body.push(lines[i]!)
        i++
      }
      i++ // closing fence
      out.push(
        <pre className="md__pre" key={key++} data-lang={lang || undefined}>
          {lang ? <span className="md__lang">{lang}</span> : null}
          <code>{body.join('\n')}</code>
        </pre>,
      )
      continue
    }

    // display math: `$$` alone on a line until the closing `$$`, or `$$ … $$` on one line
    if (/^\s*\$\$/.test(line)) {
      const single = /^\s*\$\$(.+?)\$\$\s*$/.exec(line)
      if (single) {
        out.push(<MathBlock tex={single[1]!.trim()} key={key++} />)
        i++
        continue
      }
      const body: string[] = []
      const first = line.replace(/^\s*\$\$/, '')
      if (first.trim()) body.push(first)
      i++
      while (i < lines.length && !/^\s*\$\$\s*$/.test(lines[i]!)) {
        body.push(lines[i]!)
        i++
      }
      i++ // closing $$
      out.push(<MathBlock tex={body.join('\n').trim()} key={key++} />)
      continue
    }

    // callout container: `::: kind Optional title` … `:::` (nestable)
    const box = /^\s*:::\s*([a-z]+)(?:\s+(.*))?$/.exec(line)
    if (box) {
      const kind = box[1]!
      const title = box[2]?.trim()
      const body: string[] = []
      let depth = 1
      i++
      while (i < lines.length) {
        const l = lines[i]!
        if (/^\s*:::\s*[a-z]+/.test(l)) depth++
        else if (/^\s*:::\s*$/.test(l)) {
          depth--
          if (depth === 0) break
        }
        body.push(l)
        i++
      }
      i++ // closing :::

      // `::: video <id>` — the container's body is the caption, not prose to
      // render, so it is handled before the callout shapes below.
      if (kind === 'video') {
        const videoId = (title ?? '').trim().split(/\s+/)[0] ?? ''
        out.push(
          <VideoEmbed
            key={key++}
            videoId={videoId}
            caption={body.join(' ').replace(/\s+/g, ' ').trim() || undefined}
          />,
        )
        continue
      }

      const label = title || BOX_LABELS[kind] || kind
      out.push(
        kind === 'answer' ? (
          <details className="md__box md__box--answer" key={key++}>
            <summary className="md__box__label">{label}</summary>
            <div className="md__box__body">{renderBlocks(body.join('\n'))}</div>
          </details>
        ) : (
          <div className={`md__box md__box--${BOX_LABELS[kind] ? kind : 'note'}`} key={key++}>
            <div className="md__box__label">{label}</div>
            <div className="md__box__body">{renderBlocks(body.join('\n'))}</div>
          </div>
        ),
      )
      continue
    }

    // table: consecutive lines starting with `|`, second line a separator
    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1]!)) {
      const rows: string[] = []
      while (i < lines.length && /^\s*\|/.test(lines[i]!)) {
        rows.push(lines[i]!)
        i++
      }
      out.push(<Table rows={rows} key={key++} />)
      continue
    }

    // heading
    const h = /^(#{1,4})\s+(.*)$/.exec(line)
    if (h) {
      const level = h[1]!.length
      const text = inline(h[2]!)
      const cls = `md__h md__h${level}`
      out.push(
        level === 1 ? (
          <h2 className={cls} key={key++}>
            {text}
          </h2>
        ) : level === 2 ? (
          <h3 className={cls} key={key++}>
            {text}
          </h3>
        ) : (
          <h4 className={cls} key={key++}>
            {text}
          </h4>
        ),
      )
      i++
      continue
    }

    // rule
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push(<hr className="md__hr" key={key++} />)
      i++
      continue
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      const body: string[] = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i]!)) {
        body.push(lines[i]!.replace(/^\s*>\s?/, ''))
        i++
      }
      out.push(
        <blockquote className="md__quote" key={key++}>
          {renderBlocks(body.join('\n'))}
        </blockquote>,
      )
      continue
    }

    // lists (unordered or ordered), with continuation lines and one nested level
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line)
      const items: { text: string[]; sub: string[] }[] = []
      const isItem = (l: string) => /^\s*([-*+]|\d+[.)])\s+/.test(l)
      const indentOf = (l: string) => /^(\s*)/.exec(l)![1]!.length
      const baseIndent = indentOf(line)
      while (i < lines.length) {
        const l = lines[i]!
        if (l.trim() === '') {
          // A blank line ends the list unless the next line is still part of it.
          const next = lines[i + 1]
          if (next !== undefined && (isItem(next) || (indentOf(next) > baseIndent && next.trim() !== ''))) {
            i++
            continue
          }
          break
        }
        if (isItem(l) && indentOf(l) <= baseIndent) {
          items.push({ text: [l.replace(/^\s*([-*+]|\d+[.)])\s+/, '')], sub: [] })
          i++
          continue
        }
        if (items.length === 0) break
        const cur = items[items.length - 1]!
        if (isItem(l)) {
          cur.sub.push(l.replace(/^\s{1,}/, ''))
        } else if (indentOf(l) > baseIndent) {
          if (cur.sub.length > 0) cur.sub.push(l.replace(/^\s{1,}/, ''))
          else cur.text.push(l.trim())
        } else {
          break
        }
        i++
      }
      const children = items.map((it, n) => (
        <li key={n}>
          {inline(it.text.join(' '))}
          {it.sub.length > 0 ? renderBlocks(it.sub.join('\n')) : null}
        </li>
      ))
      out.push(
        ordered ? (
          <ol className="md__ol" key={key++}>
            {children}
          </ol>
        ) : (
          <ul className="md__ul" key={key++}>
            {children}
          </ul>
        ),
      )
      continue
    }

    // blank
    if (line.trim() === '') {
      i++
      continue
    }

    // paragraph — consume until a blank line or the start of another block
    const para: string[] = []
    while (i < lines.length && lines[i]!.trim() !== '' && !(para.length > 0 && BLOCK_START.test(lines[i]!))) {
      para.push(lines[i]!)
      i++
    }
    out.push(
      <p className="md__p" key={key++}>
        {inline(para.join(' '))}
      </p>,
    )
  }

  return out
}

function MathBlock({ tex }: { tex: string }) {
  return (
    <div className="md__mathblock">
      <Math tex={tex} display />
    </div>
  )
}

function Table({ rows }: { rows: string[] }) {
  const split = (row: string) =>
    row
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split(/(?<!\\)\|/)
      .map((c) => c.trim().replace(/\\\|/g, '|'))
  const head = split(rows[0]!)
  const aligns = split(rows[1]!).map((c) =>
    /^:-+:$/.test(c) ? 'center' : /^-+:$/.test(c) ? 'right' : 'left',
  ) as ('left' | 'center' | 'right')[]
  const body = rows.slice(2).map(split)
  return (
    <div className="md__tablewrap">
      <table className="md__table">
        <thead>
          <tr>
            {head.map((c, n) => (
              <th key={n} style={{ textAlign: aligns[n] ?? 'left' }}>
                {inline(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, ri) => (
            <tr key={ri}>
              {head.map((_, n) => (
                <td key={n} style={{ textAlign: aligns[n] ?? 'left' }}>
                  {inline(r[n] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Inline ──────────────────────────────────────────────────────────────── */

/**
 * Inline spans. Tokenised in one pass with a single alternation so that, for
 * example, a `**bold**` marker inside a `` `code` `` span or a `$…$` formula is
 * left alone. `\$` is a literal dollar sign.
 */
function inline(src: string): ReactNode[] {
  const out: ReactNode[] = []
  const re =
    /(\\\$)|(`[^`]+`)|(\$(?!\s)(?:[^$\n\\]|\\.)+?(?<!\s)\$)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0

  while ((m = re.exec(src)) !== null) {
    if (m.index > last) out.push(src.slice(last, m.index))
    const tok = m[0]

    if (tok === '\\$') {
      out.push('$')
    } else if (tok.startsWith('`')) {
      out.push(
        <code className="md__code" key={key++}>
          {tok.slice(1, -1)}
        </code>,
      )
    } else if (tok.startsWith('$')) {
      out.push(<Math tex={tok.slice(1, -1)} key={key++} />)
    } else if (tok.startsWith('**')) {
      out.push(<strong key={key++}>{inline(tok.slice(2, -2))}</strong>)
    } else if (tok.startsWith('*')) {
      out.push(<em key={key++}>{inline(tok.slice(1, -1))}</em>)
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok)
      if (link) {
        const href = link[2]!
        // Only http(s) and in-app hashes get to be links; anything else is
        // rendered as plain text rather than an unexpected scheme.
        const safe = /^(https?:\/\/|#|\/)/i.test(href)
        out.push(
          safe ? (
            <a
              className="md__link"
              href={href}
              key={key++}
              {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
            >
              {link[1]}
            </a>
          ) : (
            <span key={key++}>{link[1]}</span>
          ),
        )
      } else {
        out.push(tok)
      }
    }
    last = m.index + tok.length
  }

  if (last < src.length) out.push(src.slice(last))
  return out
}
