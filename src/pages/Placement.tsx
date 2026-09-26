/* ============================================================================
   ORBIT — Placement
   ----------------------------------------------------------------------------
   The "where should I start?" test (logic in src/engine/placement.ts,
   questions in src/curriculum/placement.ts). Three screens: what this is, one
   question at a time, and what it found — which skills she has, which want a
   refresh, where she starts, and every answer explained.

   Answers are not marked while she takes it. A test that says "wrong" after
   every question turns a map into a verdict, and "I don't know" is offered as
   a first-class answer for the same reason: a guess that happens to be right
   hides the gap the test exists to find.
   ========================================================================== */
import { useMemo, useState } from 'react'
import { IconArrowRight, IconCheck } from '@/components/icons'
import { Bar, Button, Card, CardHead, Chip } from '@/components/ui'
import { lessonsFor, moduleById } from '@/curriculum'
import { PLACEMENT_QUESTIONS, PLACEMENT_SKILLS } from '@/curriculum/placement'
import {
  PLACEMENT_VERSION,
  planFor,
  score,
  shouldOfferStop,
  type PlacementAnswers,
  type PlacementQuestion,
  type PlacementResult,
  type SkillLevel,
} from '@/engine/placement'
import { useLearner } from '@/hooks/useLearner'
import { Markdown } from '@/lib/markdown'
import { navigate } from '@/lib/router'
import './placement.css'

/**
 * Every question's right answer is authored first; the order she sees is a
 * shuffle fixed by the question's id, so it is the same on a retake and the
 * position of the right answer tells her nothing.
 */
function orderFor(q: PlacementQuestion): number[] {
  let h = 2166136261
  for (const c of q.id) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const idx = q.choices.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0
    const j = h % (i + 1)
    ;[idx[i], idx[j]] = [idx[j]!, idx[i]!]
  }
  return idx
}

type Screen = 'intro' | 'test' | 'result'

export function Placement() {
  const { state, setState } = useLearner()
  const [screen, setScreen] = useState<Screen>(state.placement ? 'result' : 'intro')
  const [answers, setAnswers] = useState<PlacementAnswers>({})
  const [at, setAt] = useState(0)
  const [offered, setOffered] = useState(false)

  const finish = (a: PlacementAnswers) => {
    const result: PlacementResult = {
      version: PLACEMENT_VERSION,
      takenAt: new Date().toISOString(),
      answers: a,
      levels: score(PLACEMENT_SKILLS, PLACEMENT_QUESTIONS, a),
    }
    setState((s) => ({ ...s, placement: result }))
    setScreen('result')
  }

  const answer = (choice: number | null) => {
    const q = PLACEMENT_QUESTIONS[at]!
    const next = { ...answers, [q.id]: choice }
    setAnswers(next)
    if (at + 1 >= PLACEMENT_QUESTIONS.length) return finish(next)
    setAt(at + 1)
  }

  if (screen === 'intro') {
    return (
      <div className="page page--padtop place">
        <div className="page-head">
          <div>
            <div className="page-head__kicker">Placement</div>
            <h1 className="page-head__title">Find your starting point</h1>
            <p className="page-head__sub">
              {PLACEMENT_QUESTIONS.length} short questions, from counting and decimals up to logarithms, two for each
              skill the course is built on. About fifteen to twenty minutes. At the end you get a plan: the lessons
              you need, in order, and the ones you can skip.
            </p>
          </div>
        </div>
        <Card index={0}>
          <div className="sect place-rules">
            <p>
              <strong>This is a map, not a grade.</strong> Nothing is marked until the end, and nothing is locked by
              the result — every lesson stays open.
            </p>
            <p>
              <strong>"I don't know" is a good answer.</strong> A lucky guess hides exactly the thing this is trying
              to find. If you would be guessing, say so.
            </p>
            <p>
              <strong>It gets harder as it goes.</strong> When it starts to feel like guessing, you can stop and see
              your plan. That point is useful to know, not a failure.
            </p>
            <p>You can take it again whenever you like; the newest result is the one that counts.</p>
            <Button variant="primary" onClick={() => setScreen('test')}>
              Start <IconArrowRight size={14} />
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (screen === 'test') {
    const q = PLACEMENT_QUESTIONS[at]!
    const skill = PLACEMENT_SKILLS.find((s) => s.id === q.skill)
    const offerStop = !offered && shouldOfferStop(PLACEMENT_SKILLS, PLACEMENT_QUESTIONS, answers)
    return (
      <div className="page page--padtop place">
        <div className="place-top">
          <span className="place-top__n">
            Question {at + 1} of {PLACEMENT_QUESTIONS.length}
          </span>
          <Bar value={at / PLACEMENT_QUESTIONS.length} height={6} />
          <button type="button" className="place-top__stop" onClick={() => finish(answers)}>
            Stop here and see my plan
          </button>
        </div>
        {offerStop ? (
          <div className="place-offer" role="status">
            <span>These have been hard for a few skills in a row — that is exactly what the test is for.</span>
            <Button variant="primary" size="sm" onClick={() => finish(answers)}>
              See my plan
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOffered(true)}>
              Keep going
            </Button>
          </div>
        ) : null}
        <Card index={0} key={q.id}>
          <div className="sect place-q">
            <div className="place-q__kicker">{skill?.label}</div>
            <Markdown className="place-q__prompt">{q.prompt}</Markdown>
            <div className="place-q__choices">
              {orderFor(q).map((i) => (
                <button type="button" key={i} className="place-choice" onClick={() => answer(i)}>
                  <Markdown className="place-choice__md">{q.choices[i]!}</Markdown>
                </button>
              ))}
            </div>
            <button type="button" className="place-dunno" onClick={() => answer(null)}>
              I don't know
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return <Result onRetake={() => { setAnswers({}); setAt(0); setOffered(false); setScreen('intro') }} />
}

const LEVEL_TEXT: Record<SkillLevel, { label: string; tone: 'ok' | 'warn' | 'bad' }> = {
  strong: { label: 'Tested out', tone: 'ok' },
  shaky: { label: 'Quick refresh', tone: 'warn' },
  gap: { label: 'Learn this', tone: 'bad' },
}

function Result({ onRetake }: { onRetake: () => void }) {
  const { state } = useLearner()
  const result = state.placement
  const plan = useMemo(() => (result ? planFor(PLACEMENT_SKILLS, result.levels) : null), [result])
  const [reviewing, setReviewing] = useState(false)
  if (!result || !plan) return null

  const first = plan.todo.find((s) => !state.read[`${s.moduleId}::${s.lessonId}`])
  const lessonTitle = (moduleId: string, lessonId: string) => lessonsFor(moduleId).find((l) => l.id === lessonId)?.title
  const firstTitle = first ? lessonTitle(first.moduleId, first.lessonId) ?? first.label : null
  const answered = PLACEMENT_QUESTIONS.filter((q) => q.id in result.answers)

  return (
    <div className="page page--padtop place">
      <div className="page-head">
        <div>
          <div className="page-head__kicker">Placement</div>
          <h1 className="page-head__title">Your starting point</h1>
          <p className="page-head__sub">
            {plan.testedOut.length} of {PLACEMENT_SKILLS.length} skills tested out.{' '}
            {plan.todo.length
              ? `Your path starts with ${plan.todo.length} lesson${plan.todo.length === 1 ? '' : 's'} picked for you, then carries on through the course.`
              : 'You can start at the beginning of the main course.'}
          </p>
        </div>
      </div>

      <Card index={0}>
        <CardHead title="Start here" divided />
        <div className="sect place-start">
          {first ? (
            <>
              <h2 className="place-start__title">{firstTitle}</h2>
              <p className="place-start__why">
                {moduleById(first.moduleId)?.title} · {LEVEL_TEXT[result.levels[first.id] ?? 'gap'].label.toLowerCase()}. Next up on
                your dashboard follows this plan until it is done.
              </p>
              <Button variant="primary" onClick={() => navigate(`/module/${first.moduleId}?lesson=${first.lessonId}`)}>
                Start this lesson <IconArrowRight size={14} />
              </Button>
            </>
          ) : (
            <>
              <h2 className="place-start__title">
                <IconCheck size={16} /> Every lesson in your plan is done
              </h2>
              <Button variant="primary" onClick={() => navigate('/')}>
                Back to the dashboard
              </Button>
            </>
          )}
        </div>
      </Card>

      <Card index={1}>
        <CardHead title="Skill by skill" divided />
        <ol className="place-skills">
          {PLACEMENT_SKILLS.map((s) => {
            const level = result.levels[s.id] ?? 'gap'
            const read = !!state.read[`${s.moduleId}::${s.lessonId}`]
            return (
              <li key={s.id} className="place-skill" data-level={level}>
                <a className="place-skill__name" href={`#/module/${s.moduleId}?lesson=${s.lessonId}`}>
                  {s.label}
                </a>
                <span className="place-skill__where">{moduleById(s.moduleId)?.title.split(':')[0]}</span>
                {read ? <Chip tone="ok">read</Chip> : <Chip tone={LEVEL_TEXT[level].tone}>{LEVEL_TEXT[level].label}</Chip>}
              </li>
            )
          })}
        </ol>
      </Card>

      <Card index={2}>
        <CardHead title="Your answers" divided />
        <div className="sect">
          {reviewing ? (
            <ol className="place-review">
              {answered.map((q) => {
                const got = result.answers[q.id]
                const ok = got === q.answer
                return (
                  <li key={q.id} className="place-review__item" data-ok={ok}>
                    <Markdown className="place-review__q">{q.prompt}</Markdown>
                    <div className="place-review__a">
                      {got === null || got === undefined ? 'You said you did not know.' : ok ? 'Right: ' : 'You chose '}
                      {got !== null && got !== undefined ? <Markdown className="place-inline">{q.choices[got]!}</Markdown> : null}
                      {!ok ? (
                        <>
                          {' '}— the answer is <Markdown className="place-inline">{q.choices[q.answer]!}</Markdown>
                        </>
                      ) : null}
                    </div>
                    <Markdown className="place-review__why">{q.explain}</Markdown>
                  </li>
                )
              })}
            </ol>
          ) : (
            <Button variant="ghost" onClick={() => setReviewing(true)}>
              Show every answer, with explanations
            </Button>
          )}
          <p className="place-retake">
            Taken {new Date(result.takenAt).toLocaleDateString()}.{' '}
            <button type="button" className="place-link" onClick={onRetake}>
              Take it again
            </button>
          </p>
        </div>
      </Card>
    </div>
  )
}
