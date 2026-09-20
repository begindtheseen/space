/* ============================================================================
   ORBIT — code editor
   ----------------------------------------------------------------------------
   CodeMirror 6, bundled through Vite rather than pulled from a CDN.

   That last part matters: CodeMirror keys its facets and state fields by object
   identity, so if two copies of `@codemirror/state` end up in the page the
   editor dies with "Unrecognized extension value". Letting the bundler resolve
   one copy of each package makes that class of failure impossible.

   Monaco was the alternative and loses on three counts here: it is roughly ten
   times the bundle on top of an already heavy Python runtime, it instantiates
   expensively (a notebook wants many editors), and it ships no MATLAB or
   Octave grammar at all — CodeMirror has Octave in its legacy modes, which is
   a near-superset of MATLAB for teaching purposes.
   ========================================================================== */
import { useEffect, useMemo, useRef } from 'react'
import { autocompletion, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands'
import { cpp } from '@codemirror/lang-cpp'
import { python as pythonLang } from '@codemirror/lang-python'
import { rust } from '@codemirror/lang-rust'
import { SQLite, sql } from '@codemirror/lang-sql'
import {
  HighlightStyle,
  StreamLanguage,
  bracketMatching,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import { octave } from '@codemirror/legacy-modes/mode/octave'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { EditorState, type Extension } from '@codemirror/state'
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  placeholder as placeholderExt,
} from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import type { Lang } from '@/curriculum/types'
import './editor.css'

/* ── Theme ───────────────────────────────────────────────────────────────────
   Built from the app's own tokens rather than adapted from One Dark, so the
   editor reads as part of the product rather than as an embedded IDE. */

const theme = EditorView.theme(
  {
    '&': {
      color: '#c8d6ea',
      backgroundColor: '#06090f',
      fontSize: '13px',
      height: '100%',
    },
    '.cm-content': {
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      padding: '14px 0',
      caretColor: '#7dd3fc',
      lineHeight: '1.65',
    },
    '.cm-scroller': { fontFamily: 'inherit', overflow: 'auto' },
    '&.cm-focused': { outline: 'none' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#7dd3fc', borderLeftWidth: '2px' },
    '&.cm-focused .cm-selectionBackgroundMultiple, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(77,155,255,0.24)',
    },
    '.cm-gutters': {
      backgroundColor: '#070b12',
      color: '#39455c',
      border: 'none',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      paddingRight: '4px',
      minWidth: '38px',
    },
    '.cm-activeLineGutter': { backgroundColor: 'rgba(77,155,255,0.07)', color: '#7b8798' },
    '.cm-activeLine': { backgroundColor: 'rgba(77,155,255,0.045)' },
    '.cm-matchingBracket, .cm-nonmatchingBracket': {
      backgroundColor: 'rgba(77,155,255,0.2)',
      outline: '1px solid rgba(77,155,255,0.45)',
    },
    '.cm-placeholder': { color: '#39455c', fontStyle: 'italic' },
    '.cm-tooltip': {
      backgroundColor: '#0d1220',
      border: '1px solid rgba(255,255,255,0.11)',
      borderRadius: '8px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
    },
    '.cm-tooltip-autocomplete ul li[aria-selected]': {
      backgroundColor: 'rgba(77,155,255,0.18)',
      color: '#e9eef7',
    },
  },
  { dark: true },
)

const highlight = HighlightStyle.define([
  { tag: t.keyword, color: '#a78bfa' },
  { tag: [t.controlKeyword, t.moduleKeyword], color: '#c4a7fc' },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: '#c8d6ea' },
  { tag: [t.function(t.variableName), t.labelName], color: '#7dd3fc' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#f0a848' },
  { tag: [t.definition(t.name), t.separator], color: '#c8d6ea' },
  { tag: [t.typeName, t.className, t.namespace], color: '#4d9bff' },
  { tag: [t.number, t.changed, t.annotation, t.self], color: '#f0a848' },
  { tag: [t.operator, t.operatorKeyword], color: '#8fa3bd' },
  { tag: [t.string, t.processingInstruction, t.inserted], color: '#34d399' },
  { tag: [t.regexp, t.escape, t.special(t.string)], color: '#6fd6ff' },
  { tag: t.meta, color: '#6b7688' },
  { tag: t.comment, color: '#4e5768', fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.link, color: '#4d9bff', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#e9eef7' },
  { tag: t.invalid, color: '#f4614e' },
])

function languageFor(lang: Lang): Extension[] {
  switch (lang) {
    case 'python':
      return [pythonLang()]
    case 'sql':
      return [sql({ dialect: SQLite, upperCaseKeywords: true })]
    case 'cpp':
      return [cpp()]
    case 'rust':
      return [rust()]
    case 'matlab':
    case 'simulink':
      // Octave's grammar covers MATLAB closely enough for highlighting, and is
      // the reason CodeMirror won this decision over Monaco.
      return [StreamLanguage.define(octave)]
    case 'bash':
      return [StreamLanguage.define(shell)]
    default:
      return []
  }
}

export function Editor({
  value,
  onChange,
  lang,
  readOnly = false,
  placeholder,
  minHeight = 240,
  onRun,
}: {
  value: string
  onChange: (next: string) => void
  lang: Lang
  readOnly?: boolean
  placeholder?: string
  minHeight?: number
  /** Ctrl/Cmd+Enter. */
  onRun?: () => void
}) {
  const host = useRef<HTMLDivElement | null>(null)
  const view = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onRunRef = useRef(onRun)
  onChangeRef.current = onChange
  onRunRef.current = onRun

  const extensions = useMemo(
    () => [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      syntaxHighlighting(highlight),
      theme,
      EditorView.lineWrapping,
      ...languageFor(lang),
      ...(placeholder ? [placeholderExt(placeholder)] : []),
      keymap.of([
        {
          key: 'Mod-Enter',
          run: () => {
            onRunRef.current?.()
            return true
          },
        },
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        indentWithTab,
      ]),
      EditorState.readOnly.of(readOnly),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) onChangeRef.current(u.state.doc.toString())
      }),
    ],
    [lang, readOnly, placeholder],
  )

  // Create once per language; the document is synced separately below so that
  // typing does not tear down and rebuild the view on every keystroke.
  useEffect(() => {
    if (!host.current) return
    const v = new EditorView({
      state: EditorState.create({ doc: value, extensions }),
      parent: host.current,
    })
    view.current = v
    return () => {
      v.destroy()
      view.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extensions])

  // Push external changes in (reset to starter, load a saved buffer) without
  // clobbering what the learner is currently typing.
  useEffect(() => {
    const v = view.current
    if (!v) return
    const current = v.state.doc.toString()
    if (current === value) return
    v.dispatch({ changes: { from: 0, to: current.length, insert: value } })
  }, [value])

  return <div className="editor" ref={host} style={{ minHeight }} />
}
