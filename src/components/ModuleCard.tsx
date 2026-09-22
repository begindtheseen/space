/* ============================================================================
   ORBIT — module card
   ----------------------------------------------------------------------------
   The repeated unit on every track and browse page. It has to answer four
   questions at a glance: what is this, can I start it, how far in am I, and
   what does finishing it open up.

   Locked modules are shown rather than hidden. Seeing that powered-descent
   guidance exists and needs four things first is motivating; discovering it
   only once it unlocks is not.

   The same honesty applies to how much of a module is actually written. The
   corpus is still being filled in, and a browse page that shows a hundred
   identical cards hides which of them she can sit down and study tonight. The
   card says so here, so she can plan around a gap without opening every one
   to find it.
   ========================================================================== */
import type { CSSProperties } from 'react'
import type { Module } from '@/curriculum/types'
import { moduleStats } from '@/curriculum/types'
import { lessonCoverage, lessonsFor } from '@/curriculum/lessons'
import { Bar, Chip, Tile } from '@/components/ui'
import { IconCheck, IconLock, IconRecall, IconRoute, IconClock } from '@/components/icons'
import { navigate } from '@/lib/router'
import './module-card.css'

export interface ModuleCardProps {
  module: Module
  mastery: number
  /** Prereq module titles that are not yet at threshold. Empty means unlocked. */
  blockers: string[]
  /** How many modules this one gates. */
  unlocks: number
  accent: string
  /** Items due inside this module right now. */
  due?: number
  index?: number
}

export function ModuleCard({
  module,
  mastery,
  blockers,
  unlocks,
  accent,
  due = 0,
  index,
}: ModuleCardProps) {
  const locked = blockers.length > 0
  const done = mastery >= 0.9
  const stats = moduleStats(module)
  const pct = Math.round(mastery * 100)
  const lessons = lessonsFor(module.id).length
  const coverage = lessonCoverage(module.id)

  return (
    <button
      className="mcard"
      data-locked={locked}
      data-done={done}
      onClick={() => navigate(`/module/${module.id}`)}
      style={
        {
          '--accent-local': accent,
          ...(index != null ? { '--i': index } : {}),
        } as CSSProperties
      }
      type="button"
    >
      <div className="mcard__head">
        <Tile size={36} radius={9} color={accent} lit={mastery > 0.05}>
          {done ? <IconCheck size={17} /> : locked ? <IconLock size={16} /> : <IconRoute size={17} />}
        </Tile>

        <div className="grow">
          <div className="mcard__title">{module.title}</div>
          <div className="mcard__tier">
            Tier {module.tier} · {module.hours}h
          </div>
        </div>

        {due > 0 ? (
          <span className="mcard__due" title={`${due} items due`}>
            <IconRecall size={12} />
            {due}
          </span>
        ) : null}
      </div>

      <p className="mcard__summary">{module.summary}</p>

      <div className="mcard__stats">
        {stats.cards > 0 ? <span>{stats.cards} cards</span> : null}
        {stats.quiz > 0 ? <span>{stats.quiz} questions</span> : null}
        {stats.exercises > 0 ? <span>{stats.exercises} exercises</span> : null}
        {lessons > 0 ? <span>{lessons} lessons</span> : null}
      </div>

      {locked ? (
        <div className="mcard__locked">
          <IconLock size={12} />
          <span className="truncate">
            Needs {blockers.slice(0, 2).join(', ')}
            {blockers.length > 2 ? ` +${blockers.length - 2}` : ''}
          </span>
        </div>
      ) : (
        <div className="mcard__foot">
          <Bar value={mastery} height={4} fill={`linear-gradient(90deg, ${accent}55, ${accent})`} />
          <span className="mcard__pct">{pct}%</span>
        </div>
      )}

      <div className="mcard__badges">
        {/* Taught end to end, partly written, or not started. The last of these
            is the one that matters most: it is the difference between a module
            she can begin now and a title with the teaching still to come. */}
        {coverage?.complete ? (
          <Chip tone="ok">taught</Chip>
        ) : coverage && coverage.covered > 0 ? (
          <Chip ghost>
            {coverage.covered}/{coverage.total} taught
          </Chip>
        ) : coverage ? (
          <Chip ghost>lessons coming</Chip>
        ) : null}
        {unlocks > 0 ? (
          <Chip ghost>
            <IconRoute size={10} />
            unlocks {unlocks}
          </Chip>
        ) : null}
        {module.tags?.includes('spacex-core') ? <Chip tone="blue">core</Chip> : null}
        {module.tags?.includes('interview') ? <Chip tone="warn">interview</Chip> : null}
        {module.hours >= 60 ? (
          <Chip ghost>
            <IconClock size={10} />
            long
          </Chip>
        ) : null}
      </div>
    </button>
  )
}
