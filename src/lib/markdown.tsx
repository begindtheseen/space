/* ============================================================================
   ORBIT — minimal markdown renderer
   ----------------------------------------------------------------------------
   Renders to React nodes rather than to an HTML string, so there is no
   `dangerouslySetInnerHTML` anywhere in the app and no path by which authored
   or imported content could inject markup. The supported subset is exactly
   what the curriculum uses: headings, bold, italic, inline code, fenced code,
   lists, blockquotes, links and rules.
   ========================================================================== */
import type { ReactNode } from 'react'
import './markdown.css'

export function Markdown({ children, className = '' }: { children: string; className?: string }) {
  return <div className={`md ${className}`}>{renderBlocks(children)}</div>
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

    // unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^\s*[-*+]\s+/, ''))
        i++
      }
      out.push(
        <ul className="md__ul" key={key++}>
          {items.map((it, n) => (
            <li key={n}>{inline(it)}</li>
          ))}
        </ul>,
      )
      continue
    }

    // ordered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^\s*\d+[.)]\s+/, ''))
        i++
      }
      out.push(
        <ol className="md__ol" key={key++}>
          {items.map((it, n) => (
            <li key={n}>{inline(it)}</li>
          ))}
        </ol>,
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
    while (
      i < lines.length &&
      lines[i]!.trim() !== '' &&
      !/^\s*(#{1,4}\s|[-*+]\s|\d+[.)]\s|>|```|-{3,}$)/.test(lines[i]!)
    ) {
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

/**
 * Inline spans. Tokenised in one pass with a single alternation so that, for
 * example, a `**bold**` marker inside a `` `code` `` span is left alone.
 */
function inline(src: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0

  while ((m = re.exec(src)) !== null) {
    if (m.index > last) out.push(src.slice(last, m.index))
    const tok = m[0]

    if (tok.startsWith('`')) {
      out.push(
        <code className="md__code" key={key++}>
          {tok.slice(1, -1)}
        </code>,
      )
    } else if (tok.startsWith('**')) {
      out.push(<strong key={key++}>{tok.slice(2, -2)}</strong>)
    } else if (tok.startsWith('*')) {
      out.push(<em key={key++}>{tok.slice(1, -1)}</em>)
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
