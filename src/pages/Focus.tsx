/* ============================================================================
   ORBIT — Focus
   ----------------------------------------------------------------------------
   The page for the hardest part of studying alone, which is not any of the
   material: it is the minute before you start.

   So the page does exactly three things. It names one thing to do, and says
   why that one. It offers an ending she can see before she begins. And it
   starts, in a single click, with no further decisions in the way.

   The alternatives are below the fold of the eye rather than beside the main
   action, on purpose. A row of equal choices is a menu again, and a menu is
   the thing that stops her.
   ========================================================================== */
import { useMemo, useState } from 'react'
import { IconCheck, IconClock, IconPlay, IconX } from '@/components/icons'
import { Button, Card, CardHead, Empty } from '@/components/ui'
import { dag as buildDag } from '@/curriculum'
import { startFocus, unpark } from '@/engine/apply'
import { blockSummary, BLOCK_MINUTES, DEFAULT_BLOCK, type FocusPick } from '@/engine/focus'
import { blocksToday, dayKey } from '@/engine/state'
import { useLearner } from '@/hooks/useLearner'
import { navigate } from '@/lib/router'
import { nextUp } from '@/lib/nextUp'
import './focus.css'

export function Focus() {
  const { state, setState } = useLearner()
  const dag = useMemo(() => buildDag(), [])
  // Frozen for the life of the page: a pick that changed under her while she
  // was deciding how long to sit down for would be its own small betrayal.
  const [pick] = useState<FocusPick>(() => nextUp(state, dag))
  const [minutes, setMinutes] = useState<number>(DEFAULT_BLOCK)

  const running = !!state.focus
  const today = blocksToday(state)
  const todayMinutes = Math.round(state.days[dayKey()]?.minutes ?? 0)

  const start = () => {
    setState((s) => startFocus(s, pick, minutes))
    navigate(pick.href)
  }

  return (
    <div className="page page--padtop">
      <div className="page-head">
        <div>
          <div className="page-head__kicker">Focus</div>
          <h1 className="page-head__title">One thing, for {minutes} minutes</h1>
          <p className="page-head__sub">
            You do not have to decide what to work on, and you do not have to decide when to stop.
            Both are already answered. All that is left is to start.
          </p>
        </div>
      </div>

      {today > 0 ? (
        <div className="focus-done">
          <IconCheck size={14} />
          <span>{blockSummary(today, todayMinutes)}</span>
        </div>
      ) : null}

      {running ? (
        <Card index={0}>
          <CardHead icon={<IconClock size={15} />} title="A block is already running" divided />
          <div className="sect">
            <p className="focus-why">
              The timer is at the bottom of the window. While it runs it keeps you on its lesson;
              paused, you are free to look around. Finish that block before starting another one.
            </p>
            <Button variant="primary" onClick={() => navigate(state.focus!.pick.href)}>
              Back to it
            </Button>
          </div>
        </Card>
      ) : (
        <Card index={0}>
          <CardHead icon={<IconClock size={15} />} title="Next up" divided />
          <div className="sect focus-pick">
            <h2 className="focus-pick__title">{pick.title}</h2>
            <p className="focus-why">{pick.why}</p>

            <div className="focus-len" role="group" aria-label="Block length">
              {BLOCK_MINUTES.map((m) => (
                <button
                  key={m}
                  className="focus-len__opt"
                  data-on={m === minutes}
                  onClick={() => setMinutes(m)}
                  aria-pressed={m === minutes}
                >
                  {m} min
                </button>
              ))}
            </div>

            <div className="focus-start">
              <Button variant="primary" onClick={start}>
                <IconPlay size={13} /> Start {minutes} minutes
              </Button>
              <span className="focus-start__note">
                The block keeps you on this one thing until it ends. You can pause once five minutes
                have run, and stop whenever you want; the time still counts.
              </span>
            </div>
          </div>
        </Card>
      )}

      <Card index={1}>
        <CardHead title="Or do something else" divided />
        <div className="sect focus-alts">
          <AltRow
            label="Clear the review queue"
            sub="Whatever is scheduled for today"
            onClick={() => navigate('/review')}
          />
          <AltRow
            label="Pick a module yourself"
            sub="The whole path, in order"
            onClick={() => navigate('/learning')}
          />
          <AltRow
            label="Take a workbench task"
            sub="Real practice that counts toward nothing"
            onClick={() => navigate('/bench')}
          />
        </div>
      </Card>

      <Card index={2}>
        <CardHead title="Parked thoughts" divided />
        <div className="sect">
          {state.parked.length === 0 ? (
            <Empty
              title="Nothing parked"
              body="Anything that interrupts you during a block lands here instead of ending it."
            />
          ) : (
            <ul className="focus-parked">
              {state.parked.map((n) => (
                <li key={n.at} className="focus-parked__item">
                  <span className="focus-parked__text">{n.text}</span>
                  <button
                    className="focus-parked__drop"
                    onClick={() => setState((s) => unpark(s, n.at))}
                    title="Dealt with it"
                    aria-label={`Clear: ${n.text}`}
                  >
                    <IconX size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  )
}

function AltRow({ label, sub, onClick }: { label: string; sub: string; onClick: () => void }) {
  return (
    <button className="focus-alt" onClick={onClick}>
      <span className="focus-alt__label">{label}</span>
      <span className="focus-alt__sub">{sub}</span>
    </button>
  )
}
