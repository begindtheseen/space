import { describe, expect, it } from 'vitest'
import { START, gitInfo, lookup, newShell, pretty, resolve, run, tokenize, type ShellState } from './shell'

function sh(...lines: string[]): { s: ShellState; out: string[] } {
  let s = newShell()
  const out: string[] = []
  for (const l of lines) {
    const r = run(s, l)
    s = r.state
    out.push(r.out)
  }
  return { s, out }
}

describe('the practice terminal', () => {
  it('starts in ~/project', () => {
    expect(START).toBe('/home/you/project')
    expect(pretty(START)).toBe('~/project')
    expect(sh('pwd').out[0]).toBe('/home/you/project')
  })

  it('resolves paths like a shell', () => {
    expect(resolve('/home/you/project', '../x/./y')).toBe('/home/you/x/y')
    expect(resolve('/a', '~/notes')).toBe('/home/you/notes')
    expect(resolve('/a/b', '/c')).toBe('/c')
  })

  it('keeps quoted text together and splits operators', () => {
    expect(tokenize('echo "hello world" >> notes.txt && ls').map((t) => t.text)).toEqual([
      'echo',
      'hello world',
      '>>',
      'notes.txt',
      '&&',
      'ls',
    ])
  })

  it('makes folders and files, and moves around', () => {
    const { s, out } = sh('mkdir my-app', 'cd my-app', 'touch index.js', 'ls', 'cd ..', 'ls')
    expect(out[3]).toBe('index.js')
    expect(out[5]).toBe('my-app/')
    expect(s.cwd).toBe('/home/you/project')
    expect(lookup(s, '/home/you/project/my-app/index.js')?.kind).toBe('file')
  })

  it('writes and appends with > and >>, and reads with cat', () => {
    const { out } = sh('echo "Hello World"', 'echo one > a.txt', 'echo two >> a.txt', 'cat a.txt', 'wc -l a.txt')
    expect(out[0]).toBe('Hello World')
    expect(out[3]).toBe('one\ntwo')
    expect(out[4]).toBe('2 a.txt')
  })

  it('stops an && chain at the first failure', () => {
    const { s, out } = sh('cd nowhere && mkdir made')
    expect(out[0]).toMatch(/No such file/)
    expect(lookup(s, '/home/you/project/made')).toBeUndefined()
  })

  it('copies, moves and deletes', () => {
    const { s } = sh('echo x > a.txt', 'cp a.txt b.txt', 'mkdir d', 'mv b.txt d', 'rm a.txt')
    expect(lookup(s, '/home/you/project/a.txt')).toBeUndefined()
    expect(lookup(s, '/home/you/project/d/b.txt')).toEqual({ kind: 'file', content: 'x\n' })
  })

  it('refuses to delete a folder without -r, like rm does', () => {
    const { s, out } = sh('mkdir d', 'rm d', 'rm -r d')
    expect(out[1]).toMatch(/Is a directory/)
    expect(lookup(s, '/home/you/project/d')).toBeUndefined()
  })

  it('finds lines with grep and shows the head of a file', () => {
    const { out } = sh('echo apple > f', 'echo Banana >> f', 'echo cherry >> f', 'grep -i banana f', 'head -n 2 f')
    expect(out[3]).toBe('Banana')
    expect(out[4]).toBe('apple\nBanana')
  })

  it('says what it does not know', () => {
    expect(sh('sudo rm -rf /').out[0]).toMatch(/command not found/)
  })

  it('runs the git loop: init, add, commit, log, branch', () => {
    const { s, out } = sh(
      'git init',
      'echo "# App" > README.md',
      'git status',
      'git add README.md',
      'git commit -m "Add a README"',
      'echo more >> README.md',
      'git add .',
      'git commit -m "Say more"',
      'git log --oneline',
      'git checkout -b feature',
      'git branch',
    )
    expect(out[0]).toMatch(/Initialized empty Git repository/)
    expect(out[2]).toMatch(/Untracked files:[\s\S]*README.md/)
    expect(out[4]).toMatch(/\[main [0-9a-f]{7}\] Add a README/)
    expect(out[8].split('\n')).toHaveLength(2)
    expect(out[8]).toMatch(/Say more[\s\S]*Add a README/)
    expect(out[10]).toBe('* feature\n  main')
    expect(gitInfo(s, START)).toMatchObject({ commits: 2, branch: 'feature', staged: [] })
  })

  it('will not commit nothing, or without a message', () => {
    const { out } = sh('git init', 'git commit -m "x"', 'touch a', 'git add a', 'git commit')
    expect(out[1]).toMatch(/nothing to commit/)
    expect(out[4]).toMatch(/-m/)
  })

  it('outside a repository, git says so', () => {
    expect(sh('git status').out[0]).toMatch(/not a git repository/)
  })

  it('keeps a transcript for checks to read', () => {
    const { s } = sh('pwd', 'ls')
    expect(s.transcript.map((t) => t.cmd)).toEqual(['pwd', 'ls'])
    expect(s.transcript[0]!.out).toBe('/home/you/project')
  })

  it('refuses to remove the root, and says so', () => {
    const r = run(newShell(), 'rm -rf /')
    expect(r.out).toMatch(/refusing/)
    expect(lookup(r.state, START)?.kind).toBe('dir')
  })

  describe('git beyond the first commit', () => {
    const typed = (...lines: string[]) => lines.reduce((st, l) => run(st, l).state, newShell())
    const base = ['git init', 'echo "v1" > app.txt', 'git add .', 'git commit -m "first"']

    it('switching branches swaps the files in the folder', () => {
      let st = typed(...base, 'git switch -c feature', 'echo "x" > extra.txt', 'git add .', 'git commit -m "extra"')
      expect(lookup(st, `${START}/extra.txt`)).toBeDefined()
      st = run(st, 'git switch main').state
      expect(lookup(st, `${START}/extra.txt`)).toBeUndefined()
      st = run(st, 'git checkout feature').state
      expect(lookup(st, `${START}/extra.txt`)).toBeDefined()
    })

    it('refuses to switch with uncommitted changes, and says what to do', () => {
      const st = typed(...base, 'git branch other', 'echo "v2" > app.txt')
      const r = run(st, 'git switch other')
      expect(r.out).toMatch(/Commit them/)
      expect(gitInfo(r.state, START)!.branch).toBe('main')
    })

    it('fast-forwards a merge when main has not moved', () => {
      const st = typed(...base, 'git switch -c feature', 'echo "v2" > app.txt', 'git commit -m "nope"', 'git add .', 'git commit -m "v2"', 'git switch main')
      const r = run(st, 'git merge feature')
      expect(r.out).toMatch(/Fast-forward/)
      expect((lookup(r.state, `${START}/app.txt`) as { content: string }).content).toBe('v2\n')
      expect(gitInfo(r.state, START)!.commits).toBe(2)
    })

    it('makes a merge commit when both branches moved, keeping both changes', () => {
      const st = typed(...base, 'git switch -c feature', 'echo "b" > b.txt', 'git add .', 'git commit -m "b"', 'git switch main', 'echo "a" > a.txt', 'git add .', 'git commit -m "a"')
      const r = run(st, 'git merge feature')
      expect(r.out).toMatch(/Merge made/)
      expect(lookup(r.state, `${START}/a.txt`)).toBeDefined()
      expect(lookup(r.state, `${START}/b.txt`)).toBeDefined()
      expect(gitInfo(r.state, START)!.merges).toBe(1)
    })

    it('stops on a conflict and changes nothing', () => {
      const st = typed(...base, 'git switch -c feature', 'echo "theirs" > app.txt', 'git add .', 'git commit -m "t"', 'git switch main', 'echo "ours" > app.txt', 'git add .', 'git commit -m "o"')
      const r = run(st, 'git merge feature')
      expect(r.out).toMatch(/CONFLICT \(content\): Merge conflict in app.txt/)
      expect((lookup(r.state, `${START}/app.txt`) as { content: string }).content).toBe('ours\n')
    })

    it('diffs the working tree against what was last saved, and restores it', () => {
      let st = typed(...base, 'echo "v2" >> app.txt')
      expect(run(st, 'git diff').out).toBe('diff --git a/app.txt b/app.txt\n--- a/app.txt\n+++ b/app.txt\n v1\n+v2')
      expect(gitInfo(st, START)!.modified).toEqual(['app.txt'])
      st = run(st, 'git restore app.txt').state
      expect((lookup(st, `${START}/app.txt`) as { content: string }).content).toBe('v1\n')
      expect(run(st, 'git diff').out).toBe('')
    })

    it('unstages with restore --staged, and lists untracked files', () => {
      let st = typed(...base, 'touch new.txt', 'echo "v2" > app.txt', 'git add app.txt')
      expect(gitInfo(st, START)!.untracked).toEqual(['new.txt'])
      expect(run(st, 'git diff --staged').out).toMatch(/-v1\n\+v2/)
      st = run(st, 'git restore --staged app.txt').state
      expect(gitInfo(st, START)!.staged).toEqual([])
      expect(gitInfo(st, START)!.modified).toEqual(['app.txt'])
    })
  })
})
