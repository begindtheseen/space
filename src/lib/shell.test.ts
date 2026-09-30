import { describe, expect, it } from 'vitest'
import { START, gitAt, gitInfo, gitIsAncestor, lookup, newShell, pretty, resolve, run, shellCanRun, tokenize, type ShellState } from './shell'

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

    it('refuses to switch when uncommitted changes would be overwritten, and says what to do', () => {
      const st = typed(...base, 'git switch -c other', 'echo "v9" > app.txt', 'git commit -am "other"', 'git switch main', 'echo "v2" > app.txt')
      const r = run(st, 'git switch other')
      expect(r.out).toBe('error: Your local changes to the following files would be overwritten by checkout:\n\tapp.txt\nCommit them, or stash them (git stash), before you switch branches.\nAborting')
      expect(gitInfo(r.state, START)!.branch).toBe('main')
    })

    it('carries uncommitted changes across a switch when both branches have the same file, as git does', () => {
      const st = typed(...base, 'git branch other', 'echo "v2" > app.txt', 'echo n > new.txt', 'git add new.txt')
      const r = run(st, 'git switch other')
      expect(r.out).toBe("M\tapp.txt\nA\tnew.txt\nSwitched to branch 'other'")
      expect(gitInfo(r.state, START)).toMatchObject({ branch: 'other', staged: ['new.txt'], modified: ['app.txt'] })
      expect(text(r.state, 'app.txt')).toBe('v2\n')
    })

    it('will not overwrite an untracked file in the way of a switch', () => {
      const st = typed(...base, 'git switch -c side', 'echo s > only.txt', 'git add .', 'git commit -m "only"', 'git switch main', 'echo mine > only.txt')
      const r = run(st, 'git switch side')
      expect(r.out).toBe('error: The following untracked working tree files would be overwritten by checkout:\n\tonly.txt\nPlease move or remove them before you switch branches.\nAborting')
      expect(text(r.state, 'only.txt')).toBe('mine\n')
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

    it('stops on a conflict with markers in the file, and finishes with add + commit', () => {
      const st = typed(...base, 'git switch -c feature', 'echo "theirs" > app.txt', 'git add .', 'git commit -m "t"', 'git switch main', 'echo "ours" > app.txt', 'git add .', 'git commit -m "o"')
      let r = run(st, 'git merge feature')
      expect(r.out).toMatch(/CONFLICT \(content\): Merge conflict in app.txt/)
      expect((lookup(r.state, `${START}/app.txt`) as { content: string }).content).toBe('<<<<<<< HEAD\nours\n=======\ntheirs\n>>>>>>> feature\n')
      expect(gitInfo(r.state, START)).toMatchObject({ pending: 'merge', conflicts: ['app.txt'] })
      expect(run(r.state, 'git status').out).toMatch(/Unmerged paths:[\s\S]*both modified:   app.txt/)
      expect(run(r.state, 'git commit -m "too soon"').out).toMatch(/unmerged files/)
      r = run(run(run(r.state, 'echo "both" > app.txt').state, 'git add app.txt').state, 'git commit')
      expect(r.out).toMatch(/Merge branch 'feature'/)
      expect(gitInfo(r.state, START)).toMatchObject({ pending: null, merges: 1 })
    })

    it('merge --abort puts everything back', () => {
      const st = typed(...base, 'git switch -c feature', 'echo "theirs" > app.txt', 'git commit -am "t"', 'git switch main', 'echo "ours" > app.txt', 'git commit -am "o"', 'git merge feature')
      const r = run(st, 'git merge --abort')
      expect((lookup(r.state, `${START}/app.txt`) as { content: string }).content).toBe('ours\n')
      expect(gitInfo(r.state, START)!.pending).toBeNull()
    })

    it('merges changes to different lines of the same file without a conflict', () => {
      const st = typed('git init', 'printf "a\\nb\\nc\\nd\\n" > f.txt', 'git add .', 'git commit -m "base"', 'git switch -c x', 'sed -i "s/a/A/" f.txt', 'git commit -am "A"', 'git switch main', 'sed -i "s/d/D/" f.txt', 'git commit -am "D"')
      const r = run(st, 'git merge x')
      expect(r.out).toMatch(/Merge made/)
      expect((lookup(r.state, `${START}/f.txt`) as { content: string }).content).toBe('A\nb\nc\nD\n')
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

const text = (s: ShellState, p: string) => (lookup(s, `${START}/${p}`) as { content: string } | undefined)?.content

describe('the shell language', () => {
  it('pipes one command into the next', () => {
    const { out } = sh('printf "b\\na\\nc\\na\\nb\\na\\n" > f.txt', 'cat f.txt | sort | uniq -c | sort -rn | head -n 2', 'grep a f.txt | wc -l', 'ls | wc -l')
    expect(out[1]).toBe('      3 a\n      2 b')
    expect(out[2]).toBe('3')
    expect(out[3]).toBe('1')
  })

  it('uniq only merges neighbours, so it needs sort first', () => {
    const { out } = sh('printf "x\\ny\\nx\\n" > f', 'uniq f', 'sort f | uniq', 'sort -u f')
    expect(out[1]).toBe('x\ny\nx')
    expect(out[2]).toBe('x\ny')
    expect(out[3]).toBe('x\ny')
  })

  it('sorts numbers, backwards, by a column', () => {
    const { out } = sh('printf "10 b\\n9 a\\n100 c\\n" > n', 'sort n', 'sort -n n', 'sort -rn n', 'sort -k 2 n', 'printf "x,3\\ny,1\\n" | sort -t , -k 2 -n')
    expect(out[1]).toBe('10 b\n100 c\n9 a')
    expect(out[2]).toBe('9 a\n10 b\n100 c')
    expect(out[3]).toBe('100 c\n10 b\n9 a')
    expect(out[4]).toBe('9 a\n10 b\n100 c')
    expect(out[5]).toBe('y,1\nx,3')
  })

  it('cuts columns, translates characters, tees', () => {
    const { s, out } = sh('echo "ada,36,london" | cut -d , -f 1,3', 'echo "ada,36" | cut -d, -f2', 'echo hello | tr a-z A-Z', 'echo hi | tee t.txt | tr h H')
    expect(out[0]).toBe('ada,london')
    expect(out[1]).toBe('36')
    expect(out[2]).toBe('HELLO')
    expect(out[3]).toBe('Hi')
    expect(text(s, 't.txt')).toBe('hi\n')
  })

  it('greps recursively, counts, inverts, and matches regular expressions', () => {
    const { out } = sh('mkdir -p src/lib', 'echo "TODO: a" > src/a.js', 'echo "done" > src/lib/b.js', 'echo "TODO: c" > src/lib/c.js', 'grep -r TODO src', 'grep -rl TODO .', 'grep -c TODO src/a.js', 'grep -v TODO src/lib/b.js', 'grep -E "^(TODO|done)" -r src', 'grep -o "[a-c]$" -r src')
    expect(out[4]).toBe('src/a.js:TODO: a\nsrc/lib/c.js:TODO: c')
    expect(out[5]).toBe('./src/a.js\n./src/lib/c.js')
    expect(out[6]).toBe('1')
    expect(out[7]).toBe('done')
    expect(out[8].split('\n')).toHaveLength(3)
    expect(out[9]).toBe('src/a.js:a\nsrc/lib/c.js:c')
  })

  it('expands wildcards, sorted, and leaves a pattern that matches nothing alone', () => {
    const { out } = sh('touch b.txt a.txt c.md .hidden.txt', 'echo *.txt', 'echo ?.md', 'echo [ab].txt', 'ls *.log', 'echo "*.txt"')
    expect(out[1]).toBe('a.txt b.txt')
    expect(out[2]).toBe('c.md')
    expect(out[3]).toBe('a.txt b.txt')
    expect(out[4]).toMatch(/cannot access '\*\.log'/)
    expect(out[5]).toBe('*.txt')
  })

  it('finds files by name and type, and runs a command on each', () => {
    const { s, out } = sh('mkdir -p a/b', 'touch a/x.txt a/b/y.txt a/z.md', 'find . -name "*.txt"', 'find a -type d', 'find . -name "*.md" -delete', 'find a -name "*.txt" -exec echo found {} \\;')
    expect(out[2]).toBe('./a/b/y.txt\n./a/x.txt')
    expect(out[3]).toBe('a\na/b')
    expect(lookup(s, `${START}/a/z.md`)).toBeUndefined()
    expect(out[5]).toBe('found a/b/y.txt\nfound a/x.txt')
  })

  it('redirects errors with 2>, combines them with 2>&1, and throws them away with /dev/null', () => {
    const { s, out } = sh('ls nope 2> err.txt', 'cat err.txt', 'ls nope > all.txt 2>&1', 'ls nope 2> /dev/null', 'echo hi > /dev/null', 'cat nope &> both.txt')
    expect(out[0]).toBe('')
    expect(out[1]).toMatch(/cannot access 'nope'/)
    expect(text(s, 'all.txt')).toMatch(/cannot access/)
    expect(out[3]).toBe('')
    expect(out[4]).toBe('')
    expect(text(s, 'both.txt')).toMatch(/No such file/)
  })

  it('empties a file with > before the command runs, as bash does', () => {
    const { s } = sh('printf "b\\na\\n" > f.txt', 'sort f.txt > f.txt')
    expect(text(s, 'f.txt')).toBe('')
  })

  it('reads a file on standard input with <', () => {
    expect(sh('printf "1\\n2\\n" > n', 'wc -l < n').out[1]).toBe('2')
  })

  it('keeps variables, expands them, and exports them to scripts', () => {
    const { s, out } = sh('name=Ada', 'echo "hi $name" \'$name\' ${name}s', 'echo "echo [$""GREETING]" > s.sh', 'GREETING=yo', 'bash s.sh', 'export GREETING', 'bash s.sh', 'env')
    expect(out[1]).toBe('hi Ada $name Adas')
    expect(out[4]).toBe('[]')
    expect(out[6]).toBe('[yo]')
    expect(out[7]).toMatch(/GREETING=yo/)
    expect(s.vars.name).toBe('Ada')
  })

  it('substitutes command output with $(…) and does arithmetic with $((…))', () => {
    const { out } = sh('touch a b c', 'echo "$(ls | wc -l) files"', 'n=4', 'echo $((n * 3 + 1))', 'echo `echo old style`')
    expect(out[1]).toBe('3 files')
    expect(out[3]).toBe('13')
    expect(out[4]).toBe('old style')
  })

  it('splits unquoted variables into words — the classic quoting bug', () => {
    const { out } = sh('echo x > "my notes.txt"', 'f="my notes.txt"', 'cat $f', 'cat "$f"')
    expect(out[2]).toMatch(/cat: my: No such file or directory/)
    expect(out[3]).toBe('x')
  })

  it('trims and replaces inside ${…}', () => {
    expect(sh('f=IMG_7.jpg', 'echo ${f#IMG_} ${f%.jpg}.png ${f/IMG/photo} ${#f}').out[1]).toBe('7.jpg IMG_7.png photo_7.jpg 9')
  })

  it('sets exit codes, and && || ; follow them', () => {
    const { s, out } = sh('false', 'echo $?', 'cat nope || echo "could not"', 'true && echo yes; echo always', 'grep zzz /dev/null')
    expect(out[1]).toBe('1')
    expect(out[2]).toMatch(/could not$/)
    expect(out[3]).toBe('yes\nalways')
    expect(s.status).toBe(1)
  })

  it('loops with for and while, and branches with if and test', () => {
    const { s, out } = sh(
      'touch a.txt b.txt',
      'for f in *.txt; do mv "$f" "old-$f"; done',
      'for w in one two; do echo "<$w>"; done',
      'if [ -f old-a.txt ]; then echo there; else echo gone; fi',
      'if [ -d old-a.txt ]; then echo dir; elif [ "a" = "a" ]; then echo same; fi',
      'printf "x\\ny\\n" | while read line; do echo "got $line"; done',
      '[ 3 -gt 10 ] || echo smaller',
    )
    expect(lookup(s, `${START}/old-a.txt`)).toBeDefined()
    expect(lookup(s, `${START}/a.txt`)).toBeUndefined()
    expect(out[2]).toBe('<one>\n<two>')
    expect(out[3]).toBe('there')
    expect(out[4]).toBe('same')
    expect(out[5]).toBe('got x\ngot y')
    expect(out[6]).toBe('smaller')
  })

  it('reports test mistakes the way bash does', () => {
    const { out } = sh('[ $nothing = x ]', '[ 1 -eq one ]', 'f="a b"', '[ -f $f ]', '[ -f x')
    expect(out[0]).toMatch(/unary operator expected/)
    expect(out[1]).toMatch(/integer expression expected/)
    expect(out[3]).toMatch(/binary operator expected/)
    expect(out[4]).toMatch(/missing `]'/)
  })

  it('runs scripts: bash, ./ after chmod +x, arguments, a child shell for cd, source for this one', () => {
    const { s, out } = sh(
      'echo "echo \\"$""1 and $""2\\"; cd /" > s.sh',
      'bash s.sh one two',
      './s.sh',
      'chmod +x s.sh',
      './s.sh a b',
      'pwd',
      's.sh',
      'echo "where=here" > vars.sh',
      'bash vars.sh; echo "[$where]"',
      'source vars.sh; echo "[$where]"',
    )
    expect(out[1]).toBe('one and two')
    expect(out[2]).toMatch(/Permission denied/)
    expect(out[4]).toBe('a and b')
    expect(out[5]).toBe(START)
    expect(out[6]).toMatch(/command not found[\s\S]*\.\/s\.sh/)
    expect(out[8]).toBe('[]')
    expect(out[9]).toBe('[here]')
    expect(s.cwd).toBe(START)
  })

  it('traces with bash -x, stops with set -e, and names the line of a script error', () => {
    const { out } = sh('echo "x=1" > t.sh', 'echo "echo \\$x" >> t.sh', 'echo "ecoh bye" >> t.sh', 'bash -x t.sh', 'echo "set -e" > e.sh', 'echo "cat nope" >> e.sh', 'echo "echo after" >> e.sh', 'bash e.sh', 'echo "for x in 1 2; do" > bad.sh', 'bash bad.sh', 'bash -n t.sh')
    expect(out[3]).toBe('+ x=1\n+ echo 1\n1\n+ ecoh bye\nt.sh: line 3: ecoh: command not found')
    expect(out[7]).not.toMatch(/after/)
    expect(out[9]).toMatch(/bad\.sh: line 1: syntax error/)
    expect(out[10]).toBe('')
  })

  it('edits text with sed: s///, g, groups, addresses, -i', () => {
    const { s, out } = sh('printf "cat cat\\ndog\\n" > p.txt', 'sed "s/cat/dog/" p.txt', 'sed "s/cat/dog/g" p.txt', 'sed -n "2p" p.txt', 'sed "/dog/d" p.txt', 'echo "ada lovelace" | sed -E "s/(\\w+) (\\w+)/\\2, \\1/"', 'sed -i "s/dog/fox/" p.txt', 'sed "s/a/b" p.txt')
    expect(out[1]).toBe('dog cat\ndog')
    expect(out[2]).toBe('dog dog\ndog')
    expect(out[3]).toBe('dog')
    expect(out[4]).toBe('cat cat')
    expect(out[5]).toBe('lovelace, ada')
    expect(text(s, 'p.txt')).toBe('cat cat\nfox\n')
    expect(out[7]).toMatch(/unterminated `s' command/)
  })

  it('builds commands from input with xargs', () => {
    const { s, out } = sh('touch a.log b.log keep.txt', 'ls *.log | xargs rm', 'printf "x\\ny\\n" | xargs -I {} echo "item {}"', 'echo 1 2 3 | xargs -n 1 echo n')
    expect(lookup(s, `${START}/a.log`)).toBeUndefined()
    expect(lookup(s, `${START}/keep.txt`)).toBeDefined()
    expect(out[2]).toBe('item x\nitem y')
    expect(out[3]).toBe('n 1\nn 2\nn 3')
  })

  it('never throws, even on nonsense, and stops runaway loops', () => {
    for (const l of ['for', 'if true; then', 'echo $(', 'echo ${', '| x', 'done', 'echo "a', ')', 'while true; do true; done', 'echo $((1/0))'])
      expect(() => run(newShell(), l)).not.toThrow()
    expect(run(newShell(), 'while true; do true; done').out).toMatch(/stopped/)
  })

  it('lists one name per line when piped, like ls does', () => {
    const { out } = sh('mkdir d', 'touch f', 'ls', 'ls | cat')
    expect(out[2]).toBe('d/  f')
    expect(out[3]).toBe('d\nf')
  })

  it('knows which lines a lesson can run here', () => {
    expect(shellCanRun('cat log.txt | sort | uniq -c')).toBe(true)
    expect(shellCanRun('for f in *.txt; do mv "$f" "old-$f"; done')).toBe(true)
    expect(shellCanRun('git bisect start')).toBe(true)
    expect(shellCanRun('perl -ne "print" f')).toBe(false)
    expect(shellCanRun('for f in *.txt; do')).toBe(false)
  })
})

describe('git, the rest of everyday work', () => {
  const typed = (...lines: string[]) => lines.reduce((st, l) => run(st, l).state, newShell())
  const three = ['git init', 'echo a > a.txt', 'git add .', 'git commit -m "one"', 'echo b >> a.txt', 'git commit -am "two"', 'echo c >> a.txt', 'git commit -am "three"']

  it('draws the graph of a merge', () => {
    const st = typed('git init', 'echo 1 > f', 'git add .', 'git commit -m "start"', 'git switch -c side', 'echo s > s', 'git add .', 'git commit -m "side work"', 'git switch main', 'echo m > m', 'git add .', 'git commit -m "main work"', 'git merge side')
    const lines = run(st, 'git log --oneline --graph').out.split('\n')
    expect(lines[0]).toMatch(/^\*   [0-9a-f]{7} \(HEAD -> main\) Merge branch 'side'$/)
    expect(lines[1]).toBe('|\\')
    expect(lines[2]).toMatch(/^\* \| [0-9a-f]{7} main work$/)
    expect(lines[3]).toMatch(/^\| \* [0-9a-f]{7} \(side\) side work$/)
    expect(lines[4]).toBe('|/')
    expect(lines[5]).toMatch(/^\* [0-9a-f]{7} start$/)
  })

  it('shows a commit, and a file as it was', () => {
    const st = typed(...three)
    expect(run(st, 'git show HEAD~1').out).toMatch(/two[\s\S]*\+b/)
    expect(run(st, 'git show HEAD~2:a.txt').out).toBe('a')
  })

  it('amends the last commit', () => {
    const r = run(typed(...three), 'git commit --amend -m "three, better"')
    expect(gitInfo(r.state, START)).toMatchObject({ commits: 3, messages: ['three, better', 'two', 'one'] })
  })

  it('resets --soft, --mixed and --hard', () => {
    let st = run(typed(...three), 'git reset --soft HEAD~1').state
    expect(gitInfo(st, START)).toMatchObject({ commits: 2, staged: ['a.txt'] })
    st = run(typed(...three), 'git reset HEAD~1').state
    expect(gitInfo(st, START)).toMatchObject({ commits: 2, staged: [], modified: ['a.txt'] })
    st = run(typed(...three), 'git reset --hard HEAD~2').state
    expect(gitInfo(st, START)!.commits).toBe(1)
    expect(text(st, 'a.txt')).toBe('a\n')
  })

  it('squashes with reset --soft and one commit', () => {
    const st = typed(...three, 'git reset --soft HEAD~2', 'git commit -m "two and three"')
    expect(gitInfo(st, START)!.messages).toEqual(['two and three', 'one'])
    expect(text(st, 'a.txt')).toBe('a\nb\nc\n')
  })

  it('recovers a commit after a bad reset, from the reflog', () => {
    let st = typed(...three, 'git reset --hard HEAD~2')
    const log = run(st, 'git reflog').out
    expect(log).toMatch(/HEAD@\{0\}: reset: moving to HEAD~2/)
    expect(log).toMatch(/HEAD@\{1\}: commit: three/)
    st = run(st, 'git reset --hard HEAD@{1}').state
    expect(gitInfo(st, START)!.commits).toBe(3)
  })

  it('reverts a commit with a new commit', () => {
    const st = typed('git init', 'echo a > a.txt', 'git add .', 'git commit -m "one"', 'echo b > b.txt', 'git add .', 'git commit -m "two"', 'echo c >> a.txt', 'git commit -am "three"', 'git revert HEAD~1')
    expect(gitInfo(st, START)!.messages[0]).toMatch(/^Revert "two"/)
    expect(lookup(st, `${START}/b.txt`)).toBeUndefined()
    expect(text(st, 'a.txt')).toBe('a\nc\n')
  })

  it('stops a revert on a conflict and finishes with add and revert --continue', () => {
    let r = run(typed(...three), 'git revert HEAD~1')
    expect(r.out).toMatch(/CONFLICT \(content\): Merge conflict in a.txt/)
    r = run(run(run(r.state, 'printf "a\\nc\\n" > a.txt').state, 'git add a.txt').state, 'git revert --continue')
    expect(gitInfo(r.state, START)).toMatchObject({ pending: null, commits: 4 })
  })

  it('stashes and pops work in progress', () => {
    let st = typed(...three, 'echo wip >> a.txt', 'git stash')
    expect(text(st, 'a.txt')).toBe('a\nb\nc\n')
    expect(gitInfo(st, START)!.stashes).toBe(1)
    expect(run(st, 'git stash list').out).toMatch(/stash@\{0\}: WIP on main/)
    st = run(st, 'git stash pop').state
    expect(text(st, 'a.txt')).toBe('a\nb\nc\nwip\n')
    expect(gitInfo(st, START)!.stashes).toBe(0)
  })

  it('tags releases, lightweight and annotated', () => {
    const st = typed(...three, 'git tag v0.1 HEAD~2', 'git tag -a v1.0 -m "First release"')
    expect(run(st, 'git tag').out).toBe('v0.1\nv1.0')
    expect(run(st, 'git log --oneline -n 1').out).toMatch(/tag: v1\.0/)
    expect(run(st, 'git show v1.0').out).toMatch(/First release/)
    expect(gitAt(st, START, 'v0.1')!.message).toBe('one')
  })

  it('goes into detached HEAD, warns about commits left behind, and rescues them', () => {
    let st = typed(...three, 'git checkout HEAD~2')
    expect(gitInfo(st, START)!.detached).toBe(true)
    expect(run(st, 'git status').out).toMatch(/HEAD detached at/)
    st = typed(...three, 'git checkout HEAD~2', 'echo x > x.txt', 'git add .', 'git commit -m "lost work"')
    const r = run(st, 'git switch main')
    expect(r.out).toMatch(/leaving 1 commit behind[\s\S]*lost work/)
    const id = /git branch <new-branch-name> ([0-9a-f]{7})/.exec(r.out)![1]!
    st = run(r.state, `git branch rescue ${id}`).state
    expect(gitInfo(st, START)!.branchMessages.rescue![0]).toBe('lost work')
  })

  it('cherry-picks a commit from another branch', () => {
    const st = typed('git init', 'echo 1 > f', 'git add .', 'git commit -m "start"', 'git switch -c side', 'echo fix > fix.txt', 'git add .', 'git commit -m "the fix"', 'echo more > more.txt', 'git add .', 'git commit -m "more"', 'git switch main', 'git cherry-pick side~1')
    expect(gitInfo(st, START)!.messages).toEqual(['the fix', 'start'])
    expect(lookup(st, `${START}/fix.txt`)).toBeDefined()
    expect(lookup(st, `${START}/more.txt`)).toBeUndefined()
  })

  it('rebases a branch onto main for a straight line of history', () => {
    const st = typed('git init', 'echo 1 > f', 'git add .', 'git commit -m "start"', 'git switch -c feat', 'echo a > a', 'git add .', 'git commit -m "feat a"', 'git switch main', 'echo m > m', 'git add .', 'git commit -m "main m"', 'git switch feat', 'git rebase main')
    const info = gitInfo(st, START)!
    expect(info.messages).toEqual(['feat a', 'main m', 'start'])
    expect(info.merges).toBe(0)
    expect(gitIsAncestor(st, START, 'main', 'feat')).toBe(true)
  })

  it('stops a rebase on a conflict, then continues after add', () => {
    const st = typed('git init', 'echo base > f', 'git add .', 'git commit -m "start"', 'git switch -c feat', 'echo mine > f', 'git commit -am "mine"', 'git switch main', 'echo theirs > f', 'git commit -am "theirs"', 'git switch feat')
    let r = run(st, 'git rebase main')
    expect(r.out).toMatch(/CONFLICT[\s\S]*could not apply/)
    expect(gitInfo(r.state, START)).toMatchObject({ pending: 'rebase', detached: true, conflicts: ['f'] })
    expect(run(r.state, 'git rebase --continue').out).toMatch(/must edit all merge conflicts/)
    r = run(run(run(r.state, 'echo both > f').state, 'git add f').state, 'git rebase --continue')
    expect(r.out).toMatch(/Successfully rebased/)
    expect(gitInfo(r.state, START)).toMatchObject({ branch: 'feat', detached: false, pending: null, messages: ['mine', 'theirs', 'start'] })
    expect(gitInfo(st, START)!.pending).toBeNull() // run() never changes the state it was given
  })

  it('rebase --abort goes back to where the branch was', () => {
    const st = typed('git init', 'echo base > f', 'git add .', 'git commit -m "start"', 'git switch -c feat', 'echo mine > f', 'git commit -am "mine"', 'git switch main', 'echo theirs > f', 'git commit -am "theirs"', 'git switch feat', 'git rebase main', 'git rebase --abort')
    expect(gitInfo(st, START)).toMatchObject({ branch: 'feat', detached: false, pending: null, messages: ['mine', 'start'] })
    expect(text(st, 'f')).toBe('mine\n')
  })

  it('bisects to the commit that broke things', () => {
    const lines = ['git init', 'echo "good" > status.txt', 'git add .', 'git commit -m "c1"']
    for (let i = 2; i <= 8; i++) lines.push(`echo ${i} > n.txt`, ...(i === 6 ? ['echo "broken" > status.txt'] : []), 'git add .', `git commit -m "c${i}"`)
    let st = typed(...lines, 'git bisect start', 'git bisect bad', 'git bisect good HEAD~7')
    for (let k = 0; k < 5 && !/first bad commit/.test(st.transcript[st.transcript.length - 1]!.out); k++) {
      const broken = text(st, 'status.txt') === 'broken\n'
      st = run(st, `git bisect ${broken ? 'bad' : 'good'}`).state
    }
    expect(st.transcript[st.transcript.length - 1]!.out).toMatch(/is the first bad commit[\s\S]*c6/)
    st = run(st, 'git bisect reset').state
    expect(gitInfo(st, START)).toMatchObject({ bisecting: false, branch: 'main', detached: false })
    const auto = typed(...lines, 'git bisect start HEAD HEAD~7', 'git bisect run grep -q good status.txt')
    expect(auto.transcript[auto.transcript.length - 1]!.out).toMatch(/first bad commit[\s\S]*c6/)
  })

  it('blames each line on the commit that last changed it', () => {
    const st = typed('git init', 'git config user.name Ada', 'printf "one\\ntwo\\n" > f', 'git add .', 'git commit -m "start"', 'git config user.name Sam', 'printf "one\\nTWO\\n" > f', 'git commit -am "shout"')
    const lines = run(st, 'git blame f').out.split('\n')
    expect(lines[0]).toMatch(/\(Ada 1\) one$/)
    expect(lines[1]).toMatch(/\(Sam 2\) TWO$/)
  })

  it('ignores files listed in .gitignore, but not ones already tracked', () => {
    let st = typed('git init', 'echo k > .env', 'echo x > app.js', 'mkdir logs', 'echo l > logs/a.log', 'printf ".env\\nlogs/\\n" > .gitignore')
    expect(gitInfo(st, START)).toMatchObject({ untracked: ['.gitignore', 'app.js'], ignored: ['.env', 'logs/a.log'] })
    expect(run(st, 'git add .env').out).toMatch(/ignored by one of your .gitignore files/)
    expect(run(st, 'git check-ignore -v logs/a.log').out).toBe('.gitignore:2:logs/\tlogs/a.log')
    st = typed('git init', 'echo k > .env', 'git add .', 'git commit -m "oops"', 'echo .env > .gitignore', 'git rm --cached .env', 'git add .gitignore', 'git commit -m "Stop tracking .env"')
    expect(gitInfo(st, START)).toMatchObject({ tracked: ['.gitignore'], ignored: ['.env'] })
    expect(lookup(st, `${START}/.env`)).toBeDefined()
  })

  it('works with a remote: clone, push, a rejected push, pull, and tracking', () => {
    const setup = ['cd ~', 'git init --bare server/app.git', 'git clone server/app.git sam', 'cd sam', 'echo v1 > app.txt', 'git add .', 'git commit -m "Sam starts"', 'git push', 'cd ~']
    let st = typed(...setup, 'git clone server/app.git me', 'cd me')
    expect(run(st, 'git status').out).toMatch(/up to date with 'origin\/main'/)
    st = typed(...setup, 'git clone server/app.git me', 'cd ~/sam', 'echo s > s.txt', 'git add .', 'git commit -m "Sam again"', 'git push', 'cd ~/me', 'echo m > m.txt', 'git add .', 'git commit -m "Mine"')
    let r = run(st, 'git push')
    expect(r.out).toMatch(/\[rejected\][\s\S]*fetch first/)
    expect(run(st, 'git pull').out).toMatch(/divergent branches/)
    r = run(r.state, 'git pull --no-rebase')
    expect(r.out).toMatch(/Merge made/)
    r = run(r.state, 'git push')
    expect(r.out).toMatch(/main -> main/)
    expect(gitInfo(r.state, '/home/you/server/app.git')!.messages).toContain('Mine')
    r = run(run(r.state, 'git switch -c feature').state, 'git push')
    expect(r.out).toMatch(/has no upstream branch[\s\S]*--set-upstream origin feature/)
    r = run(r.state, 'git push -u origin feature')
    expect(gitInfo(r.state, '/home/you/me')!.upstream).toMatchObject({ main: 'origin/main', feature: 'origin/feature' })
  })

  it('refuses git in a bare repository where a working tree is needed', () => {
    expect(run(typed('git init --bare b.git', 'cd b.git'), 'git status').out).toMatch(/must be run in a work tree/)
  })
})

describe('bash scripting in the practice terminal', () => {
  it('reads $1, $# and friends inside $(( )), at the prompt too', () => {
    const { out } = sh('set -- 3 4', 'echo $(( $1 * $2 )) $(( $# + 1 ))', 'echo "$1"')
    expect(out[1]).toBe('12 3')
    expect(out[2]).toBe('3')
  })

  it('stops at an unbound variable under set -u: the rest of the line does not run', () => {
    const { s, out } = sh('set -u', 'echo "$nope"; echo after')
    expect(out[1]).toBe('bash: nope: unbound variable')
    expect(s.status).toBe(1)
  })

  it('keeps functions, arrays and traps from one line to the next', () => {
    const { out } = sh('greet() { echo "hi $1"; }', 'greet Ada', 'a=(x "y z")', 'a+=(w)', 'echo "${#a[@]} ${a[1]}"', "trap 'echo bye' EXIT", 'trap -p EXIT', 'type greet')
    expect(out[1]).toBe('hi Ada')
    expect(out[4]).toBe('3 y z')
    expect(out[6]).toBe("trap -- 'echo bye' EXIT")
    expect(out[7]).toBe('greet is a function\ngreet () \n{ \n    echo "hi $1"\n}')
  })

  it('makes the backup sed -i.bak promises', () => {
    const { s } = sh('printf "hi\\n" > f.txt', 'sed -i.bak s/hi/ho/ f.txt')
    expect(text(s, 'f.txt')).toBe('ho\n')
    expect(text(s, 'f.txt.bak')).toBe('hi\n')
  })

  it('takes -- as the end of the options for cd, touch and friends', () => {
    const { s, out } = sh('mkdir -- -d', 'cd -- -d', 'pwd', 'cd ..', 'touch -- -x', 'ls -- -x', 'cd -d')
    expect(out[2]).toBe(`${START}/-d`)
    expect(lookup(s, `${START}/-x`)?.kind).toBe('file')
    expect(out[5]).toBe('-x')
    expect(out[6]).toBe('bash: cd: -d: invalid option\ncd: usage: cd [-L|[-P [-e]] [-@]] [dir]')
  })

  it('runs ./script by its #! line, and says why when it cannot', () => {
    const { out } = sh(
      'printf "#!/bin/bash\\necho ran \\$#\\n" > ok.sh',
      './ok.sh',
      'chmod +x ok.sh',
      './ok.sh a b',
      'printf "#!/bin/bsh\\necho hi\\n" > bad.sh; chmod +x bad.sh',
      './bad.sh; echo "status $?"',
      'printf "#!/usr/bin/env bash -x\\necho hi\\n" > envx.sh; chmod +x envx.sh',
      './envx.sh',
      'printf "#!/bin/bash -x\\necho traced\\n" > x.sh; chmod +x x.sh',
      './x.sh',
    )
    expect(out[1]).toBe('bash: ./ok.sh: Permission denied')
    expect(out[3]).toBe('ran 2')
    expect(out[5]).toBe('bash: ./bad.sh: cannot execute: required file not found\nstatus 127')
    expect(out[7]).toBe("/usr/bin/env: 'bash -x': No such file or directory\n/usr/bin/env: use -[v]S to pass options in shebang lines")
    expect(out[9]).toBe('+ echo traced\ntraced')
  })

  it('reads here-documents and here-strings typed at the prompt', () => {
    const { out } = sh('name=Ada\ncat <<EOF\nhi $name\nEOF', "cat <<'EOF'\nhi $name\nEOF", 'tr a-z A-Z <<< "$name"', 'while read -r l; do echo "<$l>"; done < <(printf "a\\nb\\n")')
    expect(out[0]).toBe('hi Ada')
    expect(out[1]).toBe('hi $name')
    expect(out[2]).toBe('ADA')
    expect(out[3]).toBe('<a>\n<b>')
  })

  it('lines up a table with column -t, as the jq lesson shows', () => {
    const tsv = 'printf "1\\tOK\\t129.89\\t308.3\\n12\\tFAIL\\t\\t144.5\\n"'
    const { out } = sh(`${tsv} | column -t -N id,status,dv_ms,miss_m`, `${tsv} | column -t -s "$(printf '\\t')" -N id,status,dv_ms,miss_m`)
    expect(out[0]).toBe('id  status  dv_ms   miss_m\n1   OK      129.89  308.3\n12  FAIL    144.5   ')
    expect(out[1]).toBe('id  status  dv_ms   miss_m\n1   OK      129.89  308.3\n12  FAIL            144.5')
  })

  it('knows the new syntax and tools are runnable here', () => {
    expect(shellCanRun('case "$1" in a|b) echo ab ;; *) echo other ;; esac')).toBe(true)
    expect(shellCanRun('greet() { echo "hi $1"; }\ngreet Ada')).toBe(true)
    expect(shellCanRun('for ((i=0; i<3; i++)); do echo $i; done')).toBe(true)
    expect(shellCanRun('[[ $name == *.log ]] && echo log')).toBe(true)
    expect(shellCanRun("awk -F, '{ print $2 }' data.csv | sort | uniq -c")).toBe(true)
    expect(shellCanRun("jq -r '.cases[] | .id' etc/manifest.json")).toBe(true)
    expect(shellCanRun('paste a.tsv b.tsv | column -t')).toBe(true)
    expect(shellCanRun('greet Ada')).toBe(false)
  })

  it('never throws on half-typed scripts', () => {
    for (const l of ['case x in', 'f() {', '[[ -f', '(( 1 +', 'a=(1 2', 'cat <<EOF', 'echo {a,b', 'for ((i=0;', 'function', "awk '{", "jq '.[", 'trap', 'getopts', 'echo $((', 'x=$(( 1 / 0 ))', "awk 'BEGIN { x = }'", "jq 'map(' ", 'f() { f; }; f', 'declare -A m; m=(x)', 'echo ${x:?}', 'shift 9', 'break 2', 'return', 'set -o nosuch'])
      expect(() => run(newShell(), l)).not.toThrow()
    expect(run(newShell(), 'f() { f; }; f').out).toMatch(/maximum function nesting level/)
  })
})

/* ── Against real bash ─────────────────────────────────────────────────────
   Each script below was run by /bin/bash 5.2 (with mawk, jq 1.7 and GNU
   coreutils) in a scratch folder, and `want` is exactly what it printed,
   errors included, then its exit status. The practice terminal must print
   the same for `bash t.sh ARGS 2>&1 | cat`. */

interface BashCase {
  name: string
  files: Record<string, string>
  script: string
  args: string
  want: string
}

const BASH_CASES: BashCase[] = [
  {
    name: "arith-positional",
    files: {},
    script: "echo $(( $1 * 2 )) $(( $# + 1 )) $(( ${2} - $1 ))\ni=5; echo \"$((i+1))  $(( i > 3 ))  $(( i > 9 ))\"\necho \"$((7/2))  $((7%2))  $((2**10))  $(( (3+4)*2 ))\"\necho $(( 010 )) $(( 0x1f )) $(( 2#101 )) $(( -7 / 2 )) $(( -7 % 2 )) $(( 1 << 4 )) $(( 6 & 3 )) $(( 6 | 3 )) $(( 6 ^ 3 )) $(( ~0 ))\nx=3; echo $(( x += 2 )) $x $(( x++ )) $x $(( ++x )) $(( x-- )) $x\necho $(( 1 ? 10 : 20 )) $(( 0 ? 10 : 20 )) $(( 1 && 0 )) $(( 1 || 0 )) $(( !5 )) $(( 3 == 3 )) $(( 3 != 3 ))\ny=\"2+3\"; echo $(( y * 2 ))\n",
    args: "3 4",
    want: "6 3 1\n6  1  0\n3  1  1024  14\n8 31 5 -3 -1 16 2 7 5 -1\n5 5 5 6 7 7 6\n10 20 0 1 0 1 0\n10\n[exit=0]",
  },
  {
    name: "for-empty-args",
    files: {},
    script: "for a in \"$@\"; do echo \"got [$a]\"; done\necho end\nfor a; do echo \"x$a\"; done\nset -- \"one two\" three\nfor a in \"$@\"; do echo \"<$a>\"; done\nfor a in $@; do echo \"[$a]\"; done\nfor a in \"$*\"; do echo \"{$a}\"; done\n",
    args: "",
    want: "end\n<one two>\n<three>\n[one]\n[two]\n[three]\n{one two three}\n[exit=0]",
  },
  {
    name: "set-u-stops",
    files: {},
    script: "set -u\necho start\necho \"$nope\"\necho after\n",
    args: "",
    want: "start\nt.sh: line 3: nope: unbound variable\n[exit=1]",
  },
  {
    name: "set-u-func",
    files: {},
    script: "f() { set -u; echo \"$zz\"; echo in; }\nf\necho after\n",
    args: "",
    want: "t.sh: line 1: zz: unbound variable\n[exit=1]",
  },
  {
    name: "printf-flags",
    files: {},
    script: "printf '%02d|%-5s|%5.2f|%x|%X|%o|%e|%E|%%|%5s|%-5d|%+d|% d\\n' 7 ab 3.14159 255 255 8 1234.5 0.000123 ab 42 5 5\nprintf '%b|%q|%q|%q\\n' 'a\\tb' 'a b' \"it's\" ''\nprintf '%s\\n' a b c\nprintf '%s-%s\\n' a b c\nprintf '%d\\n' abc 12x\nprintf '%.3s|%10.4f|%-10.2e|%g|%g|%g|%#x|%#o\\n' abcdef 3.14159265 12345.678 0.0001 123456789 100 255 8\nprintf 'no newline'\nprintf '\\n%c%c\\n' hello world\nprintf '%5.1f%%\\n' 99.5\nprintf \"%s\\n\" \"$(printf 'x%.0s' 1 2 3)\"\n",
    args: "",
    want: "07|ab   | 3.14|ff|FF|10|1.234500e+03|1.230000E-04|%|   ab|42   |+5| 5\na\tb|a\\ b|it\\'s|''\na\nb\nc\na-b\nc-\nt.sh: line 5: printf: abc: invalid number\n0\nt.sh: line 5: printf: 12x: invalid number\n12\nabc|    3.1416|1.23e+04  |0.0001|1.23457e+08|100|0xff|010\nno newline\nhw\n 99.5%\nxxx\n[exit=0]",
  },
  {
    name: "sed-backup",
    files: {},
    script: "printf 'hi\\nthere\\n' > f.txt\nsed -i.bak 's/hi/ho/' f.txt\ncat f.txt f.txt.bak\nls\n",
    args: "",
    want: "ho\nthere\nhi\nthere\nf.txt\nf.txt.bak\nt.sh\n[exit=0]",
  },
  {
    name: "dashdash",
    files: {},
    script: "mkdir -p -- \"-d\"\ncd -- \"-d\" && pwd | sed 's|.*/||'\ncd ..\ntouch -- -x\nls\nrm -- -x\nls\ncd -d\necho \"st=$?\"\n",
    args: "",
    want: "-d\n-d\n-x\nt.sh\n-d\nt.sh\nt.sh: line 8: cd: -d: invalid option\ncd: usage: cd [-L|[-P [-e]] [-@]] [dir]\nst=2\n[exit=0]",
  },
  {
    name: "ifs-split",
    files: {},
    script: "v=\"a:b c:d\"; IFS=:; for w in $v; do echo \"<$w>\"; done; unset IFS\nv=\"one\ntwo\"; for w in $v; do echo \"[$w]\"; done\nIFS=, read -r a b c <<< \"x,y,z\"; echo \"$a|$b|$c\"\nset -- alpha \"two words\" gamma\nIFS='|'; echo \"$*\"; unset IFS\necho \"$*\"\nIFS=: ; v=\"a::b:\"; for w in $v; do echo \"<$w>\"; done; unset IFS\nIFS=''; v=\"a b\"; for w in $v; do echo \"<$w>\"; done; unset IFS\n",
    args: "",
    want: "<a>\n<b c>\n<d>\n[one]\n[two]\nx|y|z\nalpha|two words|gamma\nalpha two words gamma\n<a>\n<>\n<b>\n<a b>\n[exit=0]",
  },
  {
    name: "functions",
    files: {},
    script: "greet() { echo \"hi $1, you gave $# args: $@\"; }\ngreet ann bob\nfunction shout { echo \"${1^^}\"; }\nshout loud\nf(){ local x=1; }; f; echo \"x after: [${x:-<unset>}]\"\ng(){ y=1; };       g; echo \"y after: [${y:-<unset>}]\"\nf(){ return 300; }; f; echo \"return 300 gives \\$? = $?\"\ncount() { local n=0; for a in \"$@\"; do n=$((n+1)); done; echo $n; }\ncount a \"b c\" d\nouter() { local v=outer; inner; echo \"outer sees $v\"; }\ninner() { echo \"inner sees $v\"; v=changed; }\nv=global; outer; echo \"global is $v\"\nfact() { if (( $1 <= 1 )); then echo 1; else echo $(( $1 * $(fact $(( $1 - 1 ))) )); fi; }\nfact 5\necho \"\\$0 in script is $0\"\nh() { echo \"inside: \\$0=$0 FUNCNAME=${FUNCNAME[0]}\"; }\nh\n",
    args: "",
    want: "hi ann, you gave 2 args: ann bob\nLOUD\nx after: [<unset>]\ny after: [1]\nreturn 300 gives $? = 44\n3\ninner sees outer\nouter sees changed\nglobal is global\n120\n$0 in script is t.sh\ninside: $0=t.sh FUNCNAME=h\n[exit=0]",
  },
  {
    name: "case",
    files: {},
    script: "classify() {\n  case \"$1\" in\n    *.log)          echo \"$1: log\" ;;\n    *.csv|*.tsv)    echo \"$1: table\" ;;\n    case_[0-9][0-9][0-9][0-9]) echo \"$1: case directory\" ;;\n    -*)             echo \"$1: looks like an option\" ;;\n    \"\")             echo \"(empty): nothing to classify\" ;;\n    *)              echo \"$1: unknown\" ;;\n  esac\n}\nfor a in run.log data.csv case_0417 --verbose \"\" mystery; do classify \"$a\"; done\ncase x in (x) echo paren;; esac\ncase abc in a*) echo one;& b*) echo two;; *) echo three;; esac\ncase abc in a*) echo A;;& *c) echo C;;& *) echo any;; esac\ncase \"a*\" in \"a*\") echo literal;; esac\npat=\"*.txt\"; case notes.txt in $pat) echo var-pattern;; esac\ncase Y in [yY]|[yY][eE][sS]) echo yes;; esac\n",
    args: "",
    want: "run.log: log\ndata.csv: table\ncase_0417: case directory\n--verbose: looks like an option\n(empty): nothing to classify\nmystery: unknown\nparen\none\ntwo\nA\nC\nany\nliteral\nvar-pattern\nyes\n[exit=0]",
  },
  {
    name: "dbl-bracket",
    files: {},
    script: "x=\"\"; [[ -n $x ]] || echo \"[[ says empty\"\nx=\"a b\"; if [[ $x = \"a b\" ]]; then echo \"yes (no splitting inside [[ )\"; fi\na=9; b=100\n[[ $a < $b ]] && echo \"string: 9 < 100\" || echo \"string: 9 is NOT < 100\"\n(( a < b )) && echo \"arithmetic: 9 < 100\"\nname=\"case_0417.log\"\n[[ $name == *.log ]] && echo \"glob match\"\n[[ $name == \"*.log\" ]] || echo \"quoted RHS is a literal, so no match\"\n[[ $name =~ ^case_([0-9]{4})\\.log$ ]] && echo \"regex match, id=${BASH_REMATCH[1]}\"\n[[ $name =~ \"^case_\" ]] && echo matched || echo \"quoted regex is a literal: no match\"\nre=\"^case_([0-9]{4})\\.log$\"\n[[ $name =~ $re ]] && echo \"unquoted var RHS works: ${BASH_REMATCH[1]}\"\ntouch f.txt\n[[ -f f.txt && ! -d f.txt ]] && echo \"file\"\n[[ -e nope || -e f.txt ]] && echo \"one exists\"\n[[ ( 1 -eq 2 ) || ( 3 -gt 2 ) ]] && echo grouped\n[[ 5 -eq 2+3 ]] && echo arith-eq\n[[ abc != a* ]] || echo \"abc matches a*\"\n[[ -z \"\" && -n \"x\" ]] && echo zn\n[[ x ]] && echo nonempty\n[[ $undefined ]] || echo \"empty is false\"\n",
    args: "",
    want: "[[ says empty\nyes (no splitting inside [[ )\nstring: 9 is NOT < 100\narithmetic: 9 < 100\nglob match\nquoted RHS is a literal, so no match\nregex match, id=0417\nquoted regex is a literal: no match\nunquoted var RHS works: 0417\nfile\none exists\ngrouped\narith-eq\nabc matches a*\nzn\nnonempty\nempty is false\n[exit=0]",
  },
  {
    name: "arith-cmd",
    files: {},
    script: "i=0; (( i++ )); echo \"i=$i status=$?\"\n(( 5 > 3 )) && echo bigger\n(( 0 )); echo \"zero gives $?\"\nfor ((i=1; i<=3; i++)); do printf \"case_%03d \" \"$i\"; done; echo\nfor ((i=0, j=10; i<j; i+=3, j-=3)); do echo \"$i $j\"; done\nn=3; for ((;;)); do (( n-- )) || break; echo \"n=$n\"; done\ni=0; while (( i < 3 )); do echo \"i=$i\"; i=$((i+1)); done\nlet x=4*5 y=x+1; echo $x $y\n",
    args: "",
    want: "i=1 status=1\nbigger\nzero gives 1\ncase_001 case_002 case_003 \n0 10\n3 7\nn=2\nn=1\nn=0\ni=0\ni=1\ni=2\n20 21\n[exit=0]",
  },
  {
    name: "break-continue",
    files: {},
    script: "for i in 1 2 3 4 5 6; do\n  if (( i % 2 == 0 )); then continue; fi\n  if (( i > 4 )); then break; fi\n  echo \"odd: $i\"\ndone\nfor i in 1 2 3; do for j in a b c; do if [[ $j == b ]]; then continue 2; fi; echo \"$i$j\"; done; done\nfor i in 1 2 3; do for j in a b c; do if [[ $j == b ]]; then break 2; fi; echo \"$i$j\"; done; done\necho \"after\"\nbreak\necho \"status $?\"\n",
    args: "",
    want: "odd: 1\nodd: 3\n1a\n2a\n3a\n1a\nafter\nt.sh: line 9: break: only meaningful in a `for', `while', or `until' loop\nstatus 0\n[exit=0]",
  },
  {
    name: "shift-set",
    files: {},
    script: "set -- a b c d\necho \"$# $1\"\nshift; echo \"$# $1\"\nshift 2; echo \"$# $1\"\nshift 5; echo \"status $? still $#\"\nset --; echo \"empty: $#\"\nset -- \"first arg\" second; for a in \"$@\"; do echo \"<$a>\"; done\n",
    args: "",
    want: "4 a\n3 b\n1 d\nstatus 1 still 1\nempty: 0\n<first arg>\n<second>\n[exit=0]",
  },
  {
    name: "brace",
    files: {},
    script: "echo {a,b,c}\necho x{1..5}y\necho {1..10..3}\necho {5..1}\necho {a..e}\necho {01..10}\necho file.{txt,md,}\necho {a,b}{1,2}\necho \"{a,b}\" '{1..3}'\nn=4; echo {1..$n}\necho {x} {} a{b}c\nmkdir -p src/{lib,bin}; ls src\necho pre{A,{B,C}}post\n",
    args: "",
    want: "a b c\nx1y x2y x3y x4y x5y\n1 4 7 10\n5 4 3 2 1\na b c d e\n01 02 03 04 05 06 07 08 09 10\nfile.txt file.md file.\na1 a2 b1 b2\n{a,b} {1..3}\n{1..4}\n{x} {} a{b}c\nbin\nlib\npreApost preBpost preCpost\n[exit=0]",
  },
  {
    name: "arrays",
    files: {},
    script: "cases=(alpha \"two words\" gamma); declare -p cases\necho \"${cases[0]} | ${cases[1]} | ${cases[2]}\"\necho \"$cases[1]\"\necho \"count=${#cases[@]}  length-of-element-1=${#cases[1]}\"\necho \"indices: ${!cases[@]}\"\ncases+=(delta); declare -p cases\necho \"slice: ${cases[*]:1:2}\"\nunset \"cases[1]\"; declare -p cases; echo \"count=${#cases[@]}\"\nfor c in \"${cases[@]}\"; do echo \"<$c>\"; done\na=(x y z); i=1; echo \"${a[i]} ${a[$i]} ${a[i+1]} ${a[-1]}\"\na[5]=far; echo \"${#a[@]} ${!a[@]}\"\nb=(); echo \"empty ${#b[@]}\"\nc=( $(echo 1 2 3) ); echo \"${c[2]}\"\nd=(\"${a[@]}\"); echo \"${d[@]}\"\ndeclare -A seen; seen[a]=1; echo \"has a? ${seen[a]+yes}\"; echo \"has z? ${seen[z]+yes}\"\ndeclare -A m=([one]=1 [two]=2); echo \"${m[two]} ${#m[@]}\"\nk=one; echo \"${m[$k]}\"\nm[three]=$(( ${m[one]} + ${m[two]} )); echo \"${m[three]}\"\ne=(1 2 3); e[1]+=0; echo \"${e[@]}\"\ns=scalar; s+=(more); declare -p s\necho \"${a[@]:1}\"\n",
    args: "",
    want: "declare -a cases=([0]=\"alpha\" [1]=\"two words\" [2]=\"gamma\")\nalpha | two words | gamma\nalpha[1]\ncount=3  length-of-element-1=9\nindices: 0 1 2\ndeclare -a cases=([0]=\"alpha\" [1]=\"two words\" [2]=\"gamma\" [3]=\"delta\")\nslice: two words gamma\ndeclare -a cases=([0]=\"alpha\" [2]=\"gamma\" [3]=\"delta\")\ncount=3\n<alpha>\n<gamma>\n<delta>\ny y z z\n4 0 1 2 5\nempty 0\n3\nx y z far\nhas a? yes\nhas z? \n2 2\n1\n3\n1 20 3\ndeclare -a s=([0]=\"scalar\" [1]=\"more\")\ny z far\n[exit=0]",
  },
  {
    name: "heredoc",
    files: {},
    script: "dt=0.001; cat <<EOF\ngenerated for dt=$dt\nwith $(echo sub) and $((1+2))\nEOF\ncat <<'EOF'\nliteral $dt and $(date)\nEOF\ncat <<-EOF\n\ttab stripped $dt\n\t\ttwo tabs\n\tEOF\ncat <<EOF | tr a-z A-Z\npiped heredoc\nEOF\ngrep -o \"chan=[A-Z_]*\" <<< \"t=0.5 chan=WHEEL_RPM val=4187.0\"\nread -r t chan val <<< \"a b c d\"; echo \"t=$t chan=$chan val=$val\"\nwhile read -r l; do echo \"L:$l\"; done <<EOF\none\ntwo\nEOF\ncat <<\"END\"\nquoted \"end\" \\$x\nEND\necho after\n",
    args: "",
    want: "generated for dt=0.001\nwith sub and 3\nliteral $dt and $(date)\ntab stripped 0.001\ntwo tabs\nPIPED HEREDOC\nchan=WHEEL_RPM\nt=a chan=b val=c d\nL:one\nL:two\nquoted \"end\" \\$x\nafter\n[exit=0]",
  },
  {
    name: "procsub",
    files: {},
    script: "printf '3\\n1\\n2\\n' > n.txt\nwhile IFS= read -r line; do echo \"line: <$line>\"; done < <(sort n.txt)\ncount=0\nsort n.txt | while IFS= read -r _; do count=$((count+1)); done\necho \"after the pipe:     count=$count\"\nwhile IFS= read -r _; do count=$((count+1)); done < <(sort n.txt)\necho \"after the redirect: count=$count\"\ncat <(echo hello) <(echo world)\ndiffcount=$(wc -l < <(printf 'a\\nb\\n')); echo \"$diffcount\"\n",
    args: "",
    want: "line: <1>\nline: <2>\nline: <3>\nafter the pipe:     count=0\nafter the redirect: count=3\nhello\nworld\n2\n[exit=0]",
  },
  {
    name: "trap-exit",
    files: {},
    script: "trap 'echo \"  [EXIT trap ran, status was $?]\"' EXIT\necho \"normal end\"\n",
    args: "",
    want: "normal end\n  [EXIT trap ran, status was 0]\n[exit=0]",
  },
  {
    name: "trap-exit-fail",
    files: {},
    script: "set -euo pipefail\ntrap 'echo \"  [EXIT trap ran, status was $?]\"' EXIT\necho \"about to fail\"; false\necho not reached\n",
    args: "",
    want: "about to fail\n  [EXIT trap ran, status was 1]\n[exit=1]",
  },
  {
    name: "trap-exit-code",
    files: {},
    script: "trap 'echo bye' EXIT\ntrap -p EXIT\nexit 5\n",
    args: "",
    want: "trap -- 'echo bye' EXIT\nbye\n[exit=5]",
  },
  {
    name: "trap-err",
    files: {},
    script: "set -Eeuo pipefail\ntrap 'echo \"FAILED at line $LINENO running: $BASH_COMMAND\" >&2' ERR\nwork() { cp missing_config.yaml /tmp/x.yaml; }\necho \"starting\"\nwork\necho \"not reached\"\n",
    args: "",
    want: "starting\ncp: cannot stat 'missing_config.yaml': No such file or directory\nFAILED at line 3 running: cp missing_config.yaml /tmp/x.yaml\n[exit=1]",
  },
  {
    name: "trap-cleanup",
    files: {},
    script: "tmp=$(mktemp -d)\ntrap 'rm -rf \"$tmp\"; echo cleaned' EXIT\ntouch \"$tmp/x\"\n[[ -d $tmp ]] && echo \"exists\"\n",
    args: "",
    want: "exists\ncleaned\n[exit=0]",
  },
  {
    name: "getopts",
    files: {},
    script: "channel=\"\"; threshold=\"\"; verbose=0\nwhile getopts \":c:t:v\" opt; do\n  case \"$opt\" in\n    c) channel=\"$OPTARG\" ;;\n    t) threshold=\"$OPTARG\" ;;\n    v) verbose=1 ;;\n    :)  echo \"report.sh: option -$OPTARG requires an argument\" >&2; exit 2 ;;\n    \\?) echo \"report.sh: unknown option -$OPTARG\" >&2; exit 2 ;;\n  esac\ndone\nshift $((OPTIND - 1))\necho \"channel=[$channel] threshold=[$threshold] verbose=$verbose\"\necho \"remaining arguments: $#\"\ni=0; for f in \"$@\"; do i=$((i+1)); printf '  [%d] <%s>\\n' \"$i\" \"$f\"; done\n",
    args: "-v -c WHEEL_RPM -t 5000 logs/run.log logs/driver.log",
    want: "channel=[WHEEL_RPM] threshold=[5000] verbose=1\nremaining arguments: 2\n  [1] <logs/run.log>\n  [2] <logs/driver.log>\n[exit=0]",
  },
  {
    name: "getopts-grouped",
    files: {},
    script: "while getopts \":c:t:v\" opt; do echo \"opt=$opt arg=${OPTARG:-}\"; done\nshift $((OPTIND - 1)); echo \"rest: $*\"\n",
    args: "-vc WHEEL_RPM x",
    want: "opt=v arg=\nopt=c arg=WHEEL_RPM\nrest: x\n[exit=0]",
  },
  {
    name: "getopts-errors",
    files: {},
    script: "while getopts \"t:v\" opt; do echo \"opt=$opt\"; done\necho \"OPTIND=$OPTIND\"\n",
    args: "-z -t",
    want: "t.sh: illegal option -- z\nopt=?\nt.sh: option requires an argument -- t\nopt=?\nOPTIND=3\n[exit=0]",
  },
  {
    name: "getopts-silent-missing",
    files: {},
    script: "while getopts \":t:v\" opt; do echo \"opt=$opt OPTARG=${OPTARG-unset}\"; done\n",
    args: "-v -t",
    want: "opt=v OPTARG=unset\nopt=: OPTARG=t\n[exit=0]",
  },
  {
    name: "getopts-dashdash",
    files: {},
    script: "while getopts \"v\" opt; do echo \"opt=$opt\"; done\nshift $((OPTIND-1)); echo \"$@\"\n",
    args: "-v -- -weird.log",
    want: "opt=v\n-weird.log\n[exit=0]",
  },
  {
    name: "shebang-and-exec",
    files: {},
    script: "printf '#!/bin/bsh\\necho hi\\n' > bad.sh; chmod +x bad.sh; ./bad.sh; echo \"st=$?\"\nprintf '#!/bin/bash\\r\\necho hi\\n' > crlf.sh; chmod +x crlf.sh; ./crlf.sh; echo \"st=$?\"\nprintf '#!/usr/bin/env bash -x\\necho hi\\n' > envx.sh; chmod +x envx.sh; ./envx.sh; echo \"st=$?\"\nprintf '#!/usr/bin/env -S bash -x\\necho hi\\n' > envs.sh; chmod +x envs.sh; ./envs.sh\nprintf 'echo nosb $0\\n' > nosb.sh; chmod +x nosb.sh; ./nosb.sh\nprintf '#!/bin/bash -x\\necho traced\\n' > bx.sh; chmod +x bx.sh; ./bx.sh\nprintf '#!/usr/bin/env bash\\necho ok $#\\n' > ok.sh; ./ok.sh; echo \"st=$?\"; chmod +x ok.sh; ./ok.sh a b\n./nosuch.sh; echo \"st=$?\"\nmkdir -p dd; ./dd; echo \"st=$?\"\n",
    args: "",
    want: "t.sh: line 1: ./bad.sh: cannot execute: required file not found\nst=127\nt.sh: line 2: ./crlf.sh: cannot execute: required file not found\nst=127\n/usr/bin/env: 'bash -x': No such file or directory\n/usr/bin/env: use -[v]S to pass options in shebang lines\nst=127\n+ echo hi\nhi\nnosb ./nosb.sh\n+ echo traced\ntraced\nt.sh: line 7: ./ok.sh: Permission denied\nst=126\nok 2\nt.sh: line 8: ./nosuch.sh: No such file or directory\nst=127\nt.sh: line 9: ./dd: Is a directory\nst=126\n[exit=0]",
  },
  {
    name: "params",
    files: {},
    script: "f=IMG_7.jpg\necho ${f#IMG_} ${f%.jpg}.png ${f/IMG/photo} ${#f} ${f##*.} ${f%%_*} ${f//[0-9]/N} ${f/#IMG/X} ${f/%jpg/png}\necho ${f:4} ${f:4:1} ${f: -3} ${f:(-3):2} ${f^^} ${f,,} ${f^}\nunset u; echo \"[${u:-def}] [${u-def}] [${u:+alt}] [${u+alt}]\"\ne=\"\"; echo \"[${e:-def}] [${e-def}] [${e:+alt}] [${e+alt}]\"\necho \"${OUTDIR:=results} then $OUTDIR\"\npath=/a/b/c.txt; echo \"${path##*/} ${path%/*} ${0##*/}\"\nline=\"t=0.5 chan=WHEEL_RPM val=4187.0\"\nchan=${line#*chan=}; chan=${chan%% *}; echo \"$chan ${line##*val=}\"\nref=f; echo \"${!ref}\"\necho \"${#}\" \"${#@}\"\nv='a*b'; echo \"${v/\\*/STAR}\" \"${v/\"*\"/Q}\"\n: \"${SIM_ROOT:?set SIM_ROOT to the campaign directory}\"\necho \"not reached\"\n",
    args: "",
    want: "7.jpg IMG_7.png photo_7.jpg 9 jpg IMG IMG_N.jpg X_7.jpg IMG_7.png\n7.jpg 7 jpg jp IMG_7.JPG img_7.jpg IMG_7.jpg\n[def] [def] [] []\n[def] [] [] [alt]\nresults then results\nc.txt /a/b t.sh\nWHEEL_RPM 4187.0\nIMG_7.jpg\n0 0\naSTARb aQb\nt.sh: line 13: SIM_ROOT: set SIM_ROOT to the campaign directory\n[exit=1]",
  },
  {
    name: "local-masks",
    files: {},
    script: "set -e\nf(){ local c=$(false); echo \"reached c=$c\"; }; f\ng(){ local n; n=$(false); echo \"not masked\"; }; g\necho \"not here\"\n",
    args: "",
    want: "reached c=\n[exit=1]",
  },
  {
    name: "errexit-contexts",
    files: {},
    script: "set -euo pipefail\necho \"A: inside if\";      if false; then echo unreachable; fi\necho \"B: after &&\";       false && echo unreachable\necho \"C: after ||\";       false || echo \"the || branch ran\"\necho \"D: negated\";        ! false\necho \"E: in a while condition\"; while false; do :; done\necho \"F: inside a command substitution\"; out=\"$(false; echo ok)\"\necho \"G: still alive, out=$out\"\nh() { false; echo \"h continued\"; }\nif h; then echo \"h in if\"; fi\nh\necho \"not reached\"\n",
    args: "",
    want: "A: inside if\nB: after &&\nC: after ||\nthe || branch ran\nD: negated\nE: in a while condition\nF: inside a command substitution\nG: still alive, out=ok\nh continued\nh in if\n[exit=1]",
  },
  {
    name: "subshell-group",
    files: {},
    script: "x=1; (x=2; echo \"in $x\"); echo \"out $x\"\n{ echo a; echo b; } > g.txt; cat g.txt\n(cd /; pwd); pwd | sed 's|.*/||'\n( exit 3 ); echo \"sub exit $?\"\n{ false; } || echo \"group failed\"\nout=$( { echo one; echo two; } | wc -l ); echo $out\n",
    args: "",
    want: "in 2\nout 1\na\nb\n/\nproject\nsub exit 3\ngroup failed\n2\n[exit=0]",
  },
  {
    name: "declare-p",
    files: {},
    script: "v=\"two words\"; declare -p v; w=$v; declare -p w\nexport E=1; declare -p E\nreadonly R=2; declare -p R\nR=3; echo \"st=$?\"\ndeclare -p nope; echo \"st=$?\"\ndeclare -A h=([k]=v); declare -p h\ndeclare -a arr=(1 2); declare -p arr\n",
    args: "",
    want: "declare -- v=\"two words\"\ndeclare -- w=\"two words\"\ndeclare -x E=\"1\"\ndeclare -r R=\"2\"\nt.sh: line 4: R: readonly variable\nt.sh: line 5: declare: nope: not found\nst=1\ndeclare -A h=([k]=\"v\" )\ndeclare -a arr=([0]=\"1\" [1]=\"2\")\n[exit=0]",
  },
  {
    name: "read-variants",
    files: {},
    script: "printf 'a b c\\n' | { read -r x y; echo \"[$x][$y]\"; }\nprintf '  lead  \\n' | { read -r x; echo \"[$x]\"; }\nprintf '  lead  \\n' | { IFS= read -r x; echo \"[$x]\"; }\nprintf 'a\\\\ b c\\n' | { read x y; echo \"[$x][$y]\"; }\nprintf 'a\\\\ b c\\n' | { read -r x y; echo \"[$x][$y]\"; }\nprintf 'no newline' | { read -r x; echo \"st=$? [$x]\"; }\nprintf 'k=v\\n' | { IFS== read -r k v; echo \"$k -> $v\"; }\nread -r -a fields <<< \"t=0.5 chan=WHEEL_RPM val=4187.0\"; declare -p fields\nprintf 'a\\0b\\0' | while IFS= read -r -d '' x; do echo \"<$x>\"; done\nmapfile -t lines <<< \"$(printf 'a\\nb\\n')\"; declare -p lines\nprintf 'x\\ny\\n' | { mapfile -t L; echo \"${#L[@]} ${L[1]}\"; }\nIFS=\"= \" read -r _ t _ chan _ val <<< \"t=0.5 chan=WHEEL_RPM val=4187.0\"; echo \"t=$t chan=$chan val=$val\"\n",
    args: "",
    want: "[a][b c]\n[lead]\n[  lead  ]\n[a b][c]\n[a\\][b c]\nst=1 [no newline]\nk -> v\ndeclare -a fields=([0]=\"t=0.5\" [1]=\"chan=WHEEL_RPM\" [2]=\"val=4187.0\")\n<a>\n<b>\ndeclare -a lines=([0]=\"a\" [1]=\"b\")\n2 y\nt=0.5 chan=WHEEL_RPM val=4187.0\n[exit=0]",
  },
  {
    name: "args-quoting",
    files: {"bin/args.sh": "#!/usr/bin/env bash\nprintf 'argc=%d\\n' \"$#\"\ni=0; for a in \"$@\"; do i=$((i+1)); printf '  [%d] <%s>\\n' \"$i\" \"$a\"; done\n"},
    script: "chmod +x bin/args.sh\ndir=\"entry burn 01\"; ./bin/args.sh $dir\n./bin/args.sh \"$dir\"\ne=\"\"; ./bin/args.sh $e; ./bin/args.sh \"$e\"\nv=\"a:b c:d\"; IFS=:; ./bin/args.sh $v; unset IFS\nv=\"one\ntwo\"; ./bin/args.sh $v\npattern=\"*.log\"; ./bin/args.sh $pattern\ncases=(alpha \"two words\" gamma)\n./bin/args.sh \"${cases[@]}\"\n./bin/args.sh \"${cases[*]}\"\n./bin/args.sh ${cases[@]}\nmkdir -p logs; touch logs/driver.log logs/run.log\ncd logs && pattern=\"*.log\"; ./../bin/args.sh $pattern\n",
    args: "",
    want: "argc=3\n  [1] <entry>\n  [2] <burn>\n  [3] <01>\nargc=1\n  [1] <entry burn 01>\nargc=0\nargc=1\n  [1] <>\nargc=3\n  [1] <a>\n  [2] <b c>\n  [3] <d>\nargc=2\n  [1] <one>\n  [2] <two>\nargc=1\n  [1] <*.log>\nargc=3\n  [1] <alpha>\n  [2] <two words>\n  [3] <gamma>\nargc=1\n  [1] <alpha two words gamma>\nargc=4\n  [1] <alpha>\n  [2] <two>\n  [3] <words>\n  [4] <gamma>\nargc=2\n  [1] <driver.log>\n  [2] <run.log>\n[exit=0]",
  },
  {
    name: "forward",
    files: {},
    script: "show() { printf 'argc=%d\\n' \"$#\"; local i=0; for a in \"$@\"; do i=$((i+1)); printf '  [%d] <%s>\\n' \"$i\" \"$a\"; done; }\necho '--- \"$@\"'; show \"$@\"\necho '--- \"$*\"'; show \"$*\"\necho '--- $@ (unquoted)'; show $@\necho '--- \"$*\" with IFS=|'; (IFS='|'; show \"$*\")\n",
    args: "--out \"entry burn 01\" --seed 42",
    want: "--- \"$@\"\nargc=4\n  [1] <--out>\n  [2] <entry burn 01>\n  [3] <--seed>\n  [4] <42>\n--- \"$*\"\nargc=1\n  [1] <--out entry burn 01 --seed 42>\n--- $@ (unquoted)\nargc=6\n  [1] <--out>\n  [2] <entry>\n  [3] <burn>\n  [4] <01>\n  [5] <--seed>\n  [6] <42>\n--- \"$*\" with IFS=|\nargc=1\n  [1] <--out|entry burn 01|--seed|42>\n[exit=0]",
  },
  {
    name: "shifting",
    files: {},
    script: "echo \"start: \\$#=$# \\$1=$1\"\nwhile (( $# )); do\n  case \"$1\" in\n    --help)  echo \"  saw --help\"; shift ;;\n    --out)   echo \"  saw --out with value <${2:?--out needs a value}>\"; shift 2 ;;\n    --)      shift; break ;;\n    -*)      echo \"  unknown long option $1\" >&2; exit 2 ;;\n    *)       break ;;\n  esac\ndone\necho \"after parsing: \\$#=$#\"\ni=0; for f in \"$@\"; do i=$((i+1)); echo \"  operand [$i] <$f>\"; done\n",
    args: "--help --out \"entry burn 01\" -- logs/run.log",
    want: "start: $#=5 $1=--help\n  saw --help\n  saw --out with value <entry burn 01>\nafter parsing: $#=1\n  operand [1] <logs/run.log>\n[exit=0]",
  },
  {
    name: "shifting-missing",
    files: {},
    script: "echo \"start: \\$#=$# \\$1=$1\"\nwhile (( $# )); do\n  case \"$1\" in\n    --out)   echo \"  saw --out with value <${2:?--out needs a value}>\"; shift 2 ;;\n    *)       break ;;\n  esac\ndone\necho \"not reached\"\n",
    args: "--out",
    want: "start: $#=1 $1=--out\nt.sh: line 4: 2: --out needs a value\n[exit=1]",
  },
  {
    name: "usage-heredoc",
    files: {},
    script: "usage() {\n  cat >&2 <<'USAGE'\nusage: report.sh [-c CHANNEL] [-v] LOGFILE...\n  -c CHANNEL    only this channel\nUSAGE\n  exit 2\n}\n[[ $# -ge 1 ]] || usage\necho \"not here\"\n",
    args: "",
    want: "usage: report.sh [-c CHANNEL] [-v] LOGFILE...\n  -c CHANNEL    only this channel\n[exit=2]",
  },
  {
    name: "sweepdrv",
    files: {"logs/driver.log": "x INFO fine\ny ERROR bad\n", "logs/run.log": "all good\n", "drv.sh": "#!/usr/bin/env bash\nset -euo pipefail\nreadonly EX_OK=0 EX_USAGE=2 EX_NOINPUT=3 EX_CASE_FAILED=4\nusage() { printf 'usage: %s <logfile>\\n' \"$0\" >&2; exit \"$EX_USAGE\"; }\ndie()   { printf '%s: %s\\n' \"${0##*/}\" \"$1\" >&2; exit \"$2\"; }\nmain() {\n  [[ $# -eq 1 ]] || usage\n  local log=\"$1\"\n  [[ -r $log ]] || die \"cannot read $log\" \"$EX_NOINPUT\"\n  if grep -q ERROR \"$log\"; then\n    die \"at least one case failed\" \"$EX_CASE_FAILED\"\n  fi\n  echo \"all cases OK\"\n  exit \"$EX_OK\"\n}\nmain \"$@\"\n"},
    script: "chmod +x drv.sh\n./drv.sh; echo \"exit=$?\"\n./drv.sh nosuch.log; echo \"exit=$?\"\n./drv.sh logs/driver.log; echo \"exit=$?\"\n./drv.sh logs/run.log; echo \"exit=$?\"\n",
    args: "",
    want: "usage: ./drv.sh <logfile>\nexit=2\ndrv.sh: cannot read nosuch.log\nexit=3\ndrv.sh: at least one case failed\nexit=4\nall cases OK\nexit=0\n[exit=0]",
  },
  {
    name: "functions-exit",
    files: {},
    script: "check() { echo \"checking\"; return 1; }\nbail()  { echo \"bailing\";  exit 7; }\nif check; then echo unreachable; else echo \"check returned 1, script continues\"; fi\nout=$(bail); echo \"subshell exit did NOT end the script; out=[$out] status=$?\"\nbail\necho \"not reached\"\n",
    args: "",
    want: "checking\ncheck returned 1, script continues\nsubshell exit did NOT end the script; out=[bailing] status=7\nbailing\n[exit=7]",
  },
  {
    name: "newest-case",
    files: {"logs/a.log": "a\n"},
    script: "mkdir -p emptydir\ncount_errors() {\n  local file=\"$1\" n\n  n=$(grep -c ERROR \"$file\" || true)\n  printf '%s\\n' \"$n\"\n}\nn=$(count_errors logs/a.log); echo \"count=$n\"\nnewest_case() {\n  local dir=\"$1\" f newest=\"\"\n  [[ -d $dir ]] || return 2\n  for f in \"$dir\"/*.log; do\n    [[ -e $f ]] || continue\n    newest=$f\n  done\n  [[ -n $newest ]] || return 1\n  printf '%s\\n' \"$newest\"\n}\nif f=$(newest_case logs);      then echo \"newest: $f\"; else echo \"newest_case failed with $?\"; fi\nif f=$(newest_case nosuchdir); then echo \"newest: $f\"; else echo \"newest_case failed with $?\"; fi\nif f=$(newest_case emptydir);  then echo \"newest: $f\"; else echo \"newest_case failed with $?\"; fi\nfalse; echo \"captured once: $?\"; echo \"and again: $?\"\nfalse; st=$?; echo \"saved: $st\"; echo \"still: $st\"\n",
    args: "",
    want: "count=0\nnewest: logs/a.log\nnewest_case failed with 2\nnewest_case failed with 1\ncaptured once: 1\nand again: 0\nsaved: 1\nstill: 1\n[exit=0]",
  },
  {
    name: "set-e-demos",
    files: {},
    script: "bash -c 'set -e; c=$(grep -c NOPE /dev/null); echo \"reached c=$c\"'; echo \"exit=$?\"\nbash -c 'set -e; f(){ local c=$(grep -c NOPE /dev/null); echo \"reached c=$c\"; }; f'\nbash -c 'set -e; i=0; (( i++ )); echo reached i=$i'; echo \"exit=$?\"\nbash -c 'set -e; f(){ local n=$(false); echo \"masked\"; }; f'; echo $?\nbash -c 'set -e; f(){ local n; n=$(false); echo \"not masked\"; }; f'; echo $?\nbash -c 'trap \"echo bye\" EXIT; trap -p EXIT'\nbash -c 'set -e; trap \"rm /nonexistent; echo \\\"cleanup finished\\\"\" EXIT; true'; echo \"st=$?\"\nbash -c 'echo $0 $1 $#' zero one two\nbash -c 'set -u; echo $x; echo after'; echo \"st=$?\"\nx=5; bash -c 'echo \"x=[$x]\"'; export x; bash -c 'echo \"x=[$x]\"'\n",
    args: "",
    want: "exit=1\nreached c=0\nexit=1\nmasked\n0\n1\ntrap -- 'echo bye' EXIT\nbye\nrm: cannot remove '/nonexistent': No such file or directory\nst=1\nzero one 2\nbash: line 1: x: unbound variable\nst=127\nx=[]\nx=[5]\n[exit=0]",
  },
  {
    name: "trap-status",
    files: {},
    script: "trap 'st=$?; (( st == 0 )) || echo \"failed with $st\" >&2; echo \"cleanup\"' EXIT\ncase \"${1:-bad}\" in\n  normal) echo \"normal end\" ;;\n  bad)    echo \"about to fail\"; false ;;\nesac\nexit 3\n",
    args: "",
    want: "about to fail\nfailed with 3\ncleanup\n[exit=3]",
  },
  {
    name: "trap-quote-now",
    files: {},
    script: "tmp=\"\"; trap \"rm -rf \\\"$tmp\\\"\" EXIT; tmp=$(mktemp -d); trap -p EXIT\ncleanup() { rm -rf \"${tmp:?}\"; echo \"removed\"; }\ntrap cleanup EXIT\ntrap - INT\ntrap\n",
    args: "",
    want: "trap -- 'rm -rf \"\"' EXIT\ntrap -- 'cleanup' EXIT\nremoved\n[exit=0]",
  },
  {
    name: "driver-script",
    files: {"driver.sh": "#!/usr/bin/env bash\nset -Eeuo pipefail\nreadonly EX_USAGE=2\ntmp=\"\"\ncleanup() {\n  local st=$?\n  [[ -n $tmp ]] && rm -rf \"$tmp\"\n  (( st == 0 )) || echo \"${0##*/}: failed with status $st\" >&2\n  return 0\n}\ntrap cleanup EXIT\ntrap 'echo \"${0##*/}: died at line $LINENO: $BASH_COMMAND\" >&2' ERR\nmain() {\n  [[ $# -ge 1 ]] || { echo \"usage: ${0##*/} <logfile>\" >&2; exit \"$EX_USAGE\"; }\n  tmp=\"$(mktemp -d)\"\n  cp -- \"$1\" \"$tmp/\"\n  echo \"copied\"\n}\nmain \"$@\"\n"},
    script: "chmod +x driver.sh\n./driver.sh; echo \"exit=$?\"\n./driver.sh nosuch.log; echo \"exit=$?\"\ntouch real.log; ./driver.sh real.log; echo \"exit=$?\"\n",
    args: "",
    want: "usage: driver.sh <logfile>\ndriver.sh: failed with status 2\nexit=2\ncp: cannot stat 'nosuch.log': No such file or directory\ndriver.sh: died at line 16: cp -- \"$1\" \"$tmp/\"\ndriver.sh: failed with status 1\nexit=1\ncopied\nexit=0\n[exit=0]",
  },
  {
    name: "defaults",
    files: {},
    script: "set -euo pipefail\necho \"cases   = ${CASES:-10}\"\necho \"outdir  = ${OUTDIR:=results}\"\necho \"outdir is now $OUTDIR\"\necho \"verbose = ${VERBOSE:-}\"\necho \"about to require SIM_ROOT\"\n: \"${SIM_ROOT:?set SIM_ROOT to the campaign directory}\"\necho \"not reached\"\n",
    args: "",
    want: "cases   = 10\noutdir  = results\noutdir is now results\nverbose = \nabout to require SIM_ROOT\nt.sh: line 7: SIM_ROOT: set SIM_ROOT to the campaign directory\n[exit=1]",
  },
  {
    name: "pipefail",
    files: {"logs/driver.log": "ok\n"},
    script: "set -e\ngrep DIVERGED logs/driver.log | wc -l\necho \"reached the end, exit status of the pipeline was $?\"\ngrep DIVERGED logs/driver.log | wc -l; echo \"PIPESTATUS = ${PIPESTATUS[*]}\"\nset -o pipefail\ncount=$(grep -c DIVERGED logs/driver.log || true); echo \"count=$count\"\ngrep DIVERGED logs/driver.log | wc -l\necho \"not reached\"\n",
    args: "",
    want: "0\nreached the end, exit status of the pipeline was 0\n0\nPIPESTATUS = 1 0\ncount=0\n0\n[exit=1]",
  },
  {
    name: "subst-arith",
    files: {"logs/run.log": "a\nb\nc\n"},
    script: "n=$(wc -l < logs/run.log); echo \"n=[$n]\"\nn=`wc -l < logs/run.log`; echo \"n=[$n]\"\nout=$(printf \"a\\nb\\n\\n\\n\"); printf '%s' \"$out\" | wc -c\nout=$(printf \"a\\nb\\n\\n\\n\"; echo x); out=${out%x}; printf '%s' \"$out\" | wc -c\nfiles=$(ls logs); echo $files; echo \"---\"; echo \"$files\"\necho \"$((10/3)) is not 3.333\"\ntotal=15; n=4; printf '%d.%02d\\n' $((total*100/n/100)) $((total*100/n%100))\necho \"parent: $(basename \"$(dirname \"logs/run.log\")\")\"\nfor d in $(printf 'baseline\\nentry burn\\n'); do echo \"got <$d>\"; done\n",
    args: "",
    want: "n=[3]\nn=[3]\n3\n6\nrun.log\n---\nrun.log\n3 is not 3.333\n3.75\nparent: logs\ngot <baseline>\ngot <entry>\ngot <burn>\n[exit=0]",
  },
  {
    name: "assoc-demo",
    files: {"run.log": "t=0.5 chan=WHEEL_RPM val=4187.0\nt=1.0 chan=BUS_VOLTS val=27.9\nt=1.5 chan=WHEEL_RPM val=4200.0\n"},
    script: "declare -A count\nwhile IFS= read -r line; do\n  chan=${line#*chan=}; chan=${chan%% *}\n  val=${line##*val=}\n  count[$chan]=$(( ${count[$chan]:-0} + 1 ))\ndone < run.log\nfor chan in \"${!count[@]}\"; do\n  printf '%-12s n=%-4d\\n' \"$chan\" \"${count[$chan]}\"\ndone | sort\ndeclare -A seen\nseen[WHEEL_RPM]=3; seen[TANK_PSI]=7\nfor k in \"${!seen[@]}\"; do echo \"$k -> ${seen[$k]}\"; done | sort\n",
    args: "",
    want: "BUS_VOLTS    n=1   \nWHEEL_RPM    n=2   \nTANK_PSI -> 7\nWHEEL_RPM -> 3\n[exit=0]",
  },
  {
    name: "misc-builtins",
    files: {},
    script: "echo \"IFS is [$IFS]\" | cat -A 2>/dev/null || printf 'IFS len %d\\n' \"${#IFS}\"\ntype [; type [[; type cd; type ls; type nosuchthing; echo \"st=$?\"\nf() { :; }; type -t f; command -v ls; command -v cd; command -v f\nlet \"a = 5 * 3\"; echo $a\neval 'b=$((a + 1))'; echo $b\nx=10; unset x; echo \"[${x-unset}]\"\narr=(1 2 3); unset 'arr[1]'; echo \"${arr[@]} ${#arr[@]}\"\nset -- a b c; echo \"$@\"; set -- ; echo \"count $#\"\nprintf -v msg '%s-%s' a b; echo \"$msg\"\necho \"${#}\"\nreadonly ro=1; ro=2; echo \"after ro\"\necho \"next line runs\"\ndeclare -i num=5; declare -p num 2>/dev/null | cut -c1-12\n",
    args: "",
    want: "IFS is [ ^I$\n]$\n[ is a shell builtin\n[[ is a shell keyword\ncd is a shell builtin\nls is /usr/bin/ls\nt.sh: line 2: type: nosuchthing: not found\nst=1\nfunction\n/usr/bin/ls\ncd\nf\n15\n16\n[unset]\n1 3 2\na b c\ncount 0\na-b\n0\nt.sh: line 11: ro: readonly variable\nnext line runs\ndeclare -i n\n[exit=0]",
  },
  {
    name: "awk-basics",
    files: {"logs/driver.log": "2026-04-02T08:01:00Z INFO  case=001 status=OK dv_ms=128.84\n2026-04-02T08:02:00Z INFO  case=002 status=OK dv_ms=124.27\n2026-04-02T08:03:00Z INFO  case=003 status=OK dv_ms=129.46\n2026-04-02T08:04:00Z INFO  case=004 status=OK dv_ms=138.02\n2026-04-02T08:05:00Z INFO  case=005 status=OK dv_ms=135.92\n2026-04-02T08:12:30Z WARN  case=012 solver retry 1\n2026-04-02T08:12:40Z ERROR case=012 status=FAIL dv_ms=nan\n", "logs/run.log": "t=0.5 chan=WHEEL_RPM val=4187.0\nt=1.0 chan=BUS_VOLTS val=27.9\nt=1.5 chan=GYRO_X_DPS val=-0.1\nt=2.0 chan=TANK_PSI val=314.2\nt=2.5 chan=WHEEL_RPM val=4401.7\nt=3.0 chan=BUS_VOLTS val=28.1\n", "etc/cases.tsv": "id\tseed\tstatus\n1\t100001\tOK\n2\t100002\tOK\n3\t100003\tFAIL\n", "etc/sim.conf": "# sim config\nvehicle = falcon9-s1\ndt      = 0.002\nhorizon = 18.0\n"},
    script: "awk '{print NR, NF, $NF}' logs/driver.log | head -3\nawk '/ERROR/ {print}' logs/driver.log\nawk '$2 == \"WARN\"' logs/driver.log\nawk 'NR>=3 && NR<=5' logs/driver.log\nawk 'BEGIN{print \"start\"} {n++} END{print \"lines:\", n}' logs/run.log\nawk -F'[= ]+' '{print $2, $4, $6}' logs/run.log | head -3\nawk -F'\\t' 'NR>1 {print $1, $3}' etc/cases.tsv\nawk 'BEGIN{OFS=\" | \"} {print $2, $3}' logs/driver.log | head -3\nawk 'BEGIN {print 10/3, 2^10, int(7/2), 7%2}'\nawk 'BEGIN {printf \"%.4f %.2e %5d|%-5d|\\n\", 10/3, 1234.5, 42, 42}'\nawk -F'[= ]+' 'NR<=3 {printf \"%6.1f  %-12s %10.2f\\n\", $2, $4, $6}' logs/run.log\nawk -F'[= ]+' '$4==\"BUS_VOLTS\" {s+=$6; n++} END {printf \"bus mean over %d samples = %.3f\\n\", n, s/n}' logs/run.log\nawk -F'[= ]+' '{ n[$4]++ } END { for (c in n) print c, n[c] }' logs/run.log | sort\nawk -F'[= ]+' '\n  { c=$4; v=$6\n    if (!(c in lo) || v < lo[c]) lo[c]=v\n    if (!(c in hi) || v > hi[c]) hi[c]=v }\n  END { for (c in lo) printf \"%-12s min=%10.2f  max=%10.2f  range=%10.2f\\n\", c, lo[c], hi[c], hi[c]-lo[c] }\n' logs/run.log | sort\nawk -F'[= ]+' -v chan=WHEEL_RPM -v lim=4400 '$4==chan && $6>lim {print NR\": \"$0}' logs/run.log\nawk -F'[= ]+' '{ n[$4]++ } END { for (c in n) printf \"%-12s %d\\n\", c, n[c] | \"sort\" }' logs/run.log\nawk 'BEGIN{exit 3}'; echo \"awk exit=$?\"\nawk '{print FILENAME, FNR, NR}' logs/driver.log etc/sim.conf | sed -n '1p;7p;8p;11p'\nawk '/^#/ {next} {print \"kept:\", $0}' etc/sim.conf\nawk 'BEGIN{ s=\"chan=WHEEL_RPM\"; print length(s), substr(s,6), index(s,\"=\"), toupper(\"ok\") }'\nawk 'BEGIN{ n=split(\"a:b:c\", p, \":\"); print n, p[1], p[3] }'\nawk 'BEGIN{ if (match(\"dv_ms=128.84\", /[0-9]+\\.[0-9]+/)) print RSTART, RLENGTH, substr(\"dv_ms=128.84\", RSTART, RLENGTH) }'\nawk -f /dev/stdin logs/driver.log <<'AWKEOF'\n$2 == \"ERROR\" { bad++ }\nEND { printf \"%d error line(s) in %d\\n\", bad, NR }\nAWKEOF\n",
    args: "",
    want: "1 5 dv_ms=128.84\n2 5 dv_ms=124.27\n3 5 dv_ms=129.46\n2026-04-02T08:12:40Z ERROR case=012 status=FAIL dv_ms=nan\n2026-04-02T08:12:30Z WARN  case=012 solver retry 1\n2026-04-02T08:03:00Z INFO  case=003 status=OK dv_ms=129.46\n2026-04-02T08:04:00Z INFO  case=004 status=OK dv_ms=138.02\n2026-04-02T08:05:00Z INFO  case=005 status=OK dv_ms=135.92\nstart\nlines: 6\n0.5 WHEEL_RPM 4187.0\n1.0 BUS_VOLTS 27.9\n1.5 GYRO_X_DPS -0.1\n1 OK\n2 OK\n3 FAIL\nINFO | case=001\nINFO | case=002\nINFO | case=003\n3.33333 1024 3 1\n3.3333 1.23e+03    42|42   |\n   0.5  WHEEL_RPM       4187.00\n   1.0  BUS_VOLTS         27.90\n   1.5  GYRO_X_DPS        -0.10\nbus mean over 2 samples = 28.000\nBUS_VOLTS 2\nGYRO_X_DPS 1\nTANK_PSI 1\nWHEEL_RPM 2\nBUS_VOLTS    min=     27.90  max=     28.10  range=      0.20\nGYRO_X_DPS   min=     -0.10  max=     -0.10  range=      0.00\nTANK_PSI     min=    314.20  max=    314.20  range=      0.00\nWHEEL_RPM    min=   4187.00  max=   4401.70  range=    214.70\n5: t=2.5 chan=WHEEL_RPM val=4401.7\nBUS_VOLTS    2\nGYRO_X_DPS   1\nTANK_PSI     1\nWHEEL_RPM    2\nawk exit=3\nlogs/driver.log 1 1\nlogs/driver.log 7 7\netc/sim.conf 1 8\netc/sim.conf 4 11\nkept: vehicle = falcon9-s1\nkept: dt      = 0.002\nkept: horizon = 18.0\n14 WHEEL_RPM 5 OK\n3 a c\n7 6 128.84\n1 error line(s) in 7\n[exit=0]",
  },
  {
    name: "awk-more",
    files: {"seeds.tsv": "001\t100001\n002\t100002\n003\t100003\n012\t100012\n", "drv.log": "2026-04-02T08:01:00Z INFO  case=001 status=OK dv_ms=128.84\n2026-04-02T08:02:00Z INFO  case=002 status=OK dv_ms=124.27\n2026-04-02T08:04:00Z INFO  case=004 status=OK dv_ms=138.02\n"},
    script: "awk -F'[= \\t]+' '\n  NR==FNR { seed[$1]=$2; next }\n  $2==\"INFO\" { id=$4; printf \"case %s  seed=%s  dv=%s\\n\", id, (id in seed ? seed[id] : \"?\"), $8 }\n' seeds.tsv drv.log\necho \"a b c\" | awk '{ $2 = \"X\"; print; print NF }'\necho \"a b c\" | awk '{ NF = 2; print }'\necho \"a b c\" | awk '{ $5 = \"e\"; print; print NF }'\necho \"  lead  spaces  \" | awk '{ print \"[\" $1 \"]\", NF }'\necho \"a,b,,d\" | awk -F, '{ print NF, $3 \"|\" $4 }'\nprintf '1\\n2\\n3\\n4\\n5\\n' | awk 'NR==2,NR==4'\nprintf 'x 10\\ny 20\\nx 5\\n' | awk '{ s[$1] += $2 } END { for (k in s) print k, s[k] }' | sort\necho \"hello world\" | awk '{ gsub(/o/, \"0\"); print; n = sub(/l+/, \"L&L\"); print n, $0 }'\necho \"foo.bar\" | awk '{ sub(/\\./, \"\\\\&\"); print }'\nawk 'BEGIN { x[\"a\"]=1; delete x[\"a\"]; print length(x); y[1]; print (1 in y) }'\nawk 'BEGIN { printf \"%s %d %c %c %x %o %e %5.1f%%\\n\", \"s\", 3.9, 65, \"hi\", 255, 8, 12345.678, 99.44 }'\nawk 'BEGIN { print 1e6, 1e-3, 0.1+0.2, 3/2, -3/2 }'\nawk 'BEGIN { x = \"3x\"; y = x + 2; print y, \"10\" < \"9\", 10 < 9, \"abc\" < \"abd\" }'\necho \"10 9\" | awk '{ print ($1 < $2), ($1 < \"9\") }'\nawk 'function add(a, b) { return a + b } BEGIN { print add(2, 3) }'\nawk 'function fill(arr, n,   i) { for (i = 1; i <= n; i++) arr[i] = i * i } BEGIN { fill(sq, 4); print sq[3], length(sq) }'\nawk 'function fact(n) { return n <= 1 ? 1 : n * fact(n - 1) } BEGIN { print fact(6) }'\nawk 'BEGIN { i = 0; while (i < 3) { i++; if (i == 2) continue; print \"i=\" i }; do { print \"do\" } while (0) }'\nawk 'BEGIN { for (i = 0; i < 10; i++) { if (i == 3) break }; print i }'\nprintf 'b\\na\\nc\\n' | awk '{ lines[NR] = $0 } END { for (i = NR; i >= 1; i--) print lines[i] }'\necho \"The Quick Brown\" | awk '{ print tolower($0), toupper($2), length($3), length }'\nawk 'BEGIN { s = sprintf(\"%-5s|%05.1f|%+d\", \"ab\", 3.14159, 7); print s }'\nawk 'BEGIN { a[\"x\",1] = \"v\"; for (k in a) { split(k, p, SUBSEP); print p[1], p[2] } }'\necho \"one two three\" | awk '{ for (i = NF; i > 0; i--) printf \"%s%s\", $i, (i > 1 ? \" \" : \"\\n\") }'\nawk 'BEGIN { \"echo hi there\" | getline line; print \"got:\", line; close(\"echo hi there\") }'\nprintf 'a\\nb\\n' | awk 'NR == 1 { getline; print \"after getline:\", $0 }'\nawk 'BEGIN { printf \"%d items\\n\", \"3 apples\" }'\necho \"x\" | awk '{ print > \"/dev/stderr\" }' 2>&1\necho \"x y\" | awk '{ print $1 > \"out.txt\"; print $2 > \"out.txt\" } END { close(\"out.txt\"); while ((getline l < \"out.txt\") > 0) print \"read\", l }'\nawk 'BEGIN { print length() }' < /dev/null\nawk 'BEGIN { print substr(\"hello\", 2), substr(\"hello\", 2, 3), substr(\"hello\", 4, 10) }'\nawk 'BEGIN { print index(\"abc\", \"c\"), index(\"abc\", \"z\") }'\nawk -v 'msg=a\\tb' 'BEGIN { print msg }'\necho 5 | awk '{ print $1 * 2 } END { print \"end\", $0 }'\nawk 'BEGIN { x; print (x == 0), (x == \"\"), length(x) }'\nprintf 'k1=v1;k2=v2\\n' | awk -F';' '{ for (i = 1; i <= NF; i++) { split($i, kv, \"=\"); print kv[1] \" -> \" kv[2] } }'\nawk 'END { print NR }' /dev/null\nprintf 'a b\\n\\nc d e\\n' | awk '{ print NF \":\" $0 }'\nawk 'BEGIN { printf(\"%s-%s\\n\", \"a\", \"b\") }'\nawk 'BEGIN { print -2^2, 2^3^2, !0, !\"\", !\"a\" }'\necho \"abc\" | awk '$0 ~ \"^a\" { print \"starts with a\" } $0 !~ /z/ { print \"no z\" }'\n",
    args: "",
    want: "case 001  seed=100001  dv=128.84\ncase 002  seed=100002  dv=124.27\ncase 004  seed=?  dv=138.02\na X c\n3\na b\na b c  e\n5\n[lead] 2\n4 |d\n2\n3\n4\nx 15\ny 20\nhell0 w0rld\n1 heLllL0 w0rld\nfoo&bar\n0\n1\ns 3 A h ff 10 1.234568e+04  99.4%\n1000000 0.001 0.3 1.5 -1.5\n5 1 0 1\n0 1\n5\n9 4\n720\ni=1\ni=3\ndo\n3\nc\na\nb\nthe quick brown QUICK 5 15\nab   |003.1|+7\nx 1\nthree two one\ngot: hi there\nafter getline: b\n3 items\nx\nread x\nread y\n0\nello ell lo\n3 0\na\tb\n10\nend 5\n1 1 0\nk1 -> v1\nk2 -> v2\n0\n2:a b\n0:\n3:c d e\na-b\n-4 512 1 1 0\nstarts with a\nno z\n[exit=0]",
  },
  {
    name: "jq-lesson",
    files: {"etc/manifest.json": "{\n  \"campaign\": \"entry-burn-2026-04\",\n  \"vehicle\": \"falcon9-s1\",\n  \"generated\": \"2026-04-02T08:00:00Z\",\n  \"cases\": [\n    {\"id\": 1, \"status\": \"OK\", \"dv_ms\": 129.89, \"miss_m\": 308.3},\n    {\"id\": 2, \"status\": \"OK\", \"dv_ms\": 120.11, \"miss_m\": 519.0},\n    {\"id\": 3, \"status\": \"OK\", \"dv_ms\": 135.02, \"miss_m\": 308.9},\n    {\"id\": 4, \"status\": \"OK\", \"dv_ms\": 128.5, \"miss_m\": 229.3},\n    {\"id\": 12, \"status\": \"FAIL\", \"dv_ms\": null, \"miss_m\": 144.5}\n  ]\n}\n"},
    script: "jq . etc/manifest.json | head -6\njq -r '.campaign, .vehicle' etc/manifest.json\njq '.cases | length' etc/manifest.json\njq -r '.cases[] | .id' etc/manifest.json | head -4\njq -r '.cases[] | select(.status==\"FAIL\") | .id' etc/manifest.json\njq -r '.cases[] | [.id, .status, .miss_m] | @tsv' etc/manifest.json | head -4\njq -r '.cases[] | [.id, .status, .miss_m] | @csv' etc/manifest.json | head -3\njq -r '.cases | sort_by(-.miss_m) | .[0:3] | .[] | \"\\(.id) \\(.miss_m)\"' etc/manifest.json\njq '[.cases[].miss_m] | add / length' etc/manifest.json\njq '[.cases[] | select(.dv_ms != null) | .dv_ms] | {n: length, min: min, max: max}' etc/manifest.json\njq -r '.cases | group_by(.status) | map({status: .[0].status, n: length}) | .[] | \"\\(.status) \\(.n)\"' etc/manifest.json\njq -r '.cases | sort_by(-.miss_m) | .[0] | \"worst: case \\(.id) at \\(.miss_m) m\"' etc/manifest.json\njq '.nosuchkey' etc/manifest.json\njq '.cases[99]' etc/manifest.json\nprintf '{bad' | jq .; echo \"st=$?\"\nprintf '{bad\\n' | jq .; echo \"st=$?\"\njq -r --arg s FAIL '.cases[] | select(.status==$s) | .id' etc/manifest.json\njq -c '.cases[0]' etc/manifest.json\njq -c 'keys' etc/manifest.json\njq '.cases | map(.id)' etc/manifest.json\njq '.cases[0] | to_entries | map(.key)' -c etc/manifest.json\njq '.vehicle | split(\"-\")' -c etc/manifest.json\njq -r '.cases[] | select(.miss_m > 300) | .id' etc/manifest.json\njq '.cases | map(select(.status == \"OK\")) | length' etc/manifest.json\njq '.cases[0].status = \"X\" | .cases[0]' -c etc/manifest.json\njq '.cases[] | .dv_ms // \"none\"' etc/manifest.json\njq 'has(\"campaign\"), has(\"x\")' etc/manifest.json\njq -r '.cases[0] | keys[]' etc/manifest.json\njq '.cases[-1].id, (.cases | first.id), (.cases | last.id)' etc/manifest.json\njq '.vehicle | test(\"falcon\"), ascii_upcase, length' etc/manifest.json\njq -e '.cases[] | select(.id == 99)' etc/manifest.json; echo \"e=$?\"\njq '.campaign.x' etc/manifest.json; echo \"st=$?\"\necho '{\"a\":1,\"b\":[1,2]}' | jq -c '., .b[1], (.a + 1), {x: .a}'\necho '[3,1,2]' | jq -c 'sort, reverse, min, max, add, (map(. * 2)), unique'\necho '\"x\" \"y\"' | jq -r '.'\njq -n '1, 2' | jq -s -c '.'\njq -n -r '[\"a\",\"b\"] | join(\",\")'\njq -n -c '{a:1} | .b += 2 | .a |= . * 10 | del(.b)'\njq -n '[limit(3; range(10))] | length'\n",
    args: "",
    want: "{\n  \"campaign\": \"entry-burn-2026-04\",\n  \"vehicle\": \"falcon9-s1\",\n  \"generated\": \"2026-04-02T08:00:00Z\",\n  \"cases\": [\n    {\nentry-burn-2026-04\nfalcon9-s1\n5\n1\n2\n3\n4\n12\n1\tOK\t308.3\n2\tOK\t519.0\n3\tOK\t308.9\n4\tOK\t229.3\n1,\"OK\",308.3\n2,\"OK\",519.0\n3,\"OK\",308.9\n2 519.0\n3 308.9\n1 308.3\n301.99999999999994\n{\n  \"n\": 4,\n  \"min\": 120.11,\n  \"max\": 135.02\n}\nFAIL 1\nOK 4\nworst: case 2 at 519.0 m\nnull\nnull\njq: parse error: Invalid numeric literal at EOF at line 1, column 4\nst=5\njq: parse error: Invalid numeric literal at line 2, column 0\nst=5\n12\n{\"id\":1,\"status\":\"OK\",\"dv_ms\":129.89,\"miss_m\":308.3}\n[\"campaign\",\"cases\",\"generated\",\"vehicle\"]\n[\n  1,\n  2,\n  3,\n  4,\n  12\n]\n[\"id\",\"status\",\"dv_ms\",\"miss_m\"]\n[\"falcon9\",\"s1\"]\n1\n2\n3\n4\n{\"id\":1,\"status\":\"X\",\"dv_ms\":129.89,\"miss_m\":308.3}\n129.89\n120.11\n135.02\n128.5\n\"none\"\ntrue\nfalse\ndv_ms\nid\nmiss_m\nstatus\n12\n1\n12\ntrue\n\"FALCON9-S1\"\n10\ne=4\njq: error (at etc/manifest.json:12): Cannot index string with string \"x\"\nst=5\n{\"a\":1,\"b\":[1,2]}\n2\n2\n{\"x\":1}\n[1,2,3]\n[2,1,3]\n1\n3\n6\n[6,2,4]\n[1,2,3]\nx\ny\n[1,2]\na,b\n{\"a\":10}\n3\n[exit=0]",
  },
  {
    name: "paste-join",
    files: {"etc/cases.tsv": "id\tseed\tstatus\n1\t100001\tOK\n2\t100002\tOK\n3\t100003\tOK\n", "etc/miss.tsv": "id\tmiss_m\n1\t308.3\n2\t519.0\n3\t308.9\n", "a.txt": "1 a\n3 c\n", "b.txt": "1 x\n2 y\n3 z\n", "u.txt": "3 c\n1 a\n"},
    script: "paste etc/cases.tsv etc/miss.tsv | head -4\npaste -s -d' ' <(cut -f1 etc/cases.tsv | tail -n +2)\npaste -d, a.txt b.txt\npaste -s a.txt b.txt\nprintf 'x\\ny\\nz\\n' | paste - -\njoin a.txt b.txt\njoin <(printf '1 a\\n3 c\\n') <(printf '1 x\\n2 y\\n3 z\\n')\njoin -a1 -a2 -e MISSING -o 0,1.2,2.2 a.txt b.txt\njoin -t \"$(printf '\\t')\" --header etc/cases.tsv etc/miss.tsv | head -4\njoin u.txt b.txt; echo \"st=$?\"\njoin -v2 a.txt b.txt\njoin -v1 b.txt a.txt\njoin -1 2 -2 1 <(printf 'a 1\\nb 3\\n') b.txt\nprintf 'b 2\\na 1\\n' | sort | join - <(printf 'a X\\nb Y\\n')\n",
    args: "",
    want: "id\tseed\tstatus\tid\tmiss_m\n1\t100001\tOK\t1\t308.3\n2\t100002\tOK\t2\t519.0\n3\t100003\tOK\t3\t308.9\n1 2 3\n1 a,1 x\n3 c,2 y\n,3 z\n1 a\t3 c\n1 x\t2 y\t3 z\nx\ty\nz\t\n1 a x\n3 c z\n1 a x\n3 c z\n1 a x\n2 MISSING y\n3 c z\nid\tseed\tstatus\tmiss_m\n1\t100001\tOK\t308.3\n2\t100002\tOK\t519.0\n3\t100003\tOK\t308.9\njoin: u.txt:2: is not sorted: 1 a\n3 c z\njoin: input is not in sorted order\nst=1\n2 y\n2 y\n1 a x\n3 b z\na 1 X\nb 2 Y\n[exit=0]",
  },
  {
    name: "sed-lesson",
    files: {"etc/sim.conf": "# sim config\nvehicle = falcon9-s1\ndt      = 0.002\nhorizon = 18.0\nseed    = 42\nout     = results/2026-04-02\n", "logs/combined.log": "2026-04-02T08:00:00Z sim start case=0416\n2026-04-02T08:00:01Z step 1\n2026-04-02T08:00:02Z sim end\n2026-04-02T08:01:00Z sim start case=0417\n2026-04-02T08:01:01Z step 1\n2026-04-02T08:01:02Z step 2\n2026-04-02T08:01:03Z sim end\n2026-04-02T08:02:00Z sim start case=0418\n"},
    script: "sed 's/0.002/0.001/' etc/sim.conf | head -4\nprintf \"a a a\\n\" | sed 's/a/X/'\nprintf \"a a a\\n\" | sed 's/a/X/g'\nprintf \"a a a\\n\" | sed 's/a/X/2'\nprintf \"a a a\\n\" | sed 's/a/X/2g'\nprintf \"Case OK\\ncase ok\\n\" | sed 's/case/CASE/I'\nsed 's|results/2026-04-02|/srv/out|' etc/sim.conf | tail -1\nprintf \"val=4187.0\\n\" | sed -E 's/[0-9]+\\.[0-9]+/[&]/'\nprintf \"dt=0.002\\n\"   | sed -E 's/dt=([0-9.]+)/timestep is \\1 s/'\nprintf \"a.b\\n\" | sed 's/a.b/X/'\nprintf \"axb\\n\" | sed 's/a\\.b/X/'\nprintf \"<a><b>\\n\" | sed -E 's/<.*>/[&]/'\nprintf \"<a><b>\\n\" | sed -E 's/<[^>]*>/[&]/'\nsed -n '2,4p' etc/sim.conf\nsed -n '/dt/,/seed/p' etc/sim.conf\nsed -n '/sim start case=0417/,/sim end/p' logs/combined.log\nsed -n '/sim start case=0417/,/sim end/{/sim end/q;p}' logs/combined.log\nsed -n '/sim start case=0417/,/sim end/p' logs/combined.log | sed -E 's/^[0-9T:-]+Z +//'\nsed '/^#/d' etc/sim.conf\nsed -n '/^#/!p' etc/sim.conf\nsed '2q' etc/sim.conf\nsed '2a inserted-after-line-2'  etc/sim.conf | head -4\nsed '2i inserted-before-line-2' etc/sim.conf | head -3\nsed '2c replaced-line-2'        etc/sim.conf | head -3\nsed -n '/step/=' logs/combined.log\nsed -n '2,3{=;p}' logs/combined.log\ncp etc/sim.conf run2.conf; sed -i.bak 's/0.002/0.001/' run2.conf; ls run2*; cat run2.conf.bak | head -3\nprintf \"dt = 0.002\\n\" | sed 's/0.002/0.001/w changed.txt'; cat changed.txt\ndt=0.005; sed -E -e \"s|^dt .*|dt      = $dt|\" \\\n  -e 's|^seed .*|seed    = 7|' etc/sim.conf\nsed 's/x/y/' /nosuchfile.conf; echo \"st=$?\"\nprintf \"a\\n\" | sed 's/a/b'; echo \"st=$?\"\nprintf 'a\\nb\\nc\\n' | sed '$d'\nprintf 'a\\nb\\nc\\n' | sed -n '$p'\nprintf 'a\\nb\\nc\\n' | sed '1!G;h;$!d'\nprintf 'hello\\n' | sed 'y/abcdefghij/ABCDEFGHIJ/'\nprintf 'a\\nb\\n' | sed '1d;s/b/B/'\nprintf 'one\\ntwo\\n' | sed -e 's/o/0/g' -e '2s/t/T/'\nprintf 'x\\n' | sed 's/x/a\\\nb/'\nprintf 'k: v\\n' | sed 's/\\(.*\\): \\(.*\\)/\\2=\\1/'\nprintf 'aaa\\n' | sed 's/a*/X/g'\nprintf 'abc\\n' | sed 's/b*/X/g'\n",
    args: "",
    want: "# sim config\nvehicle = falcon9-s1\ndt      = 0.001\nhorizon = 18.0\nX a a\nX X X\na X a\na X X\nCASE OK\nCASE ok\nout     = /srv/out\nval=[4187.0]\ntimestep is 0.002 s\nX\naxb\n[<a><b>]\n[<a>]<b>\nvehicle = falcon9-s1\ndt      = 0.002\nhorizon = 18.0\ndt      = 0.002\nhorizon = 18.0\nseed    = 42\n2026-04-02T08:01:00Z sim start case=0417\n2026-04-02T08:01:01Z step 1\n2026-04-02T08:01:02Z step 2\n2026-04-02T08:01:03Z sim end\n2026-04-02T08:01:00Z sim start case=0417\n2026-04-02T08:01:01Z step 1\n2026-04-02T08:01:02Z step 2\nsim start case=0417\nstep 1\nstep 2\nsim end\nvehicle = falcon9-s1\ndt      = 0.002\nhorizon = 18.0\nseed    = 42\nout     = results/2026-04-02\nvehicle = falcon9-s1\ndt      = 0.002\nhorizon = 18.0\nseed    = 42\nout     = results/2026-04-02\n# sim config\nvehicle = falcon9-s1\n# sim config\nvehicle = falcon9-s1\ninserted-after-line-2\ndt      = 0.002\n# sim config\ninserted-before-line-2\nvehicle = falcon9-s1\n# sim config\nreplaced-line-2\ndt      = 0.002\n2\n5\n6\n2\n2026-04-02T08:00:01Z step 1\n3\n2026-04-02T08:00:02Z sim end\nrun2.conf\nrun2.conf.bak\n# sim config\nvehicle = falcon9-s1\ndt      = 0.002\ndt = 0.001\ndt = 0.001\n# sim config\nvehicle = falcon9-s1\ndt      = 0.005\nhorizon = 18.0\nseed    = 7\nout     = results/2026-04-02\nsed: can't read /nosuchfile.conf: No such file or directory\nst=2\nsed: -e expression #1, char 5: unterminated `s' command\nst=1\na\nb\nc\nc\nb\na\nHEllo\nB\n0ne\nTw0\na\nb\nv=k\nX\nXaXcX\n[exit=0]",
  },
  {
    name: "lesson01-skeleton",
    files: {"bin/skeleton.sh": "#!/usr/bin/env bash\nset -euo pipefail\nhere=\"$(cd \"$(dirname \"${BASH_SOURCE[0]}\")\" && pwd)\"\nreadonly here\nmain() {\n  echo \"script dir : ${here##*/}\"\n  echo \"arguments  : $#\"\n}\nmain \"$@\"\n"},
    script: "chmod +x bin/skeleton.sh\n./bin/skeleton.sh a b c\nbash bin/skeleton.sh one\nprintf '#!/usr/bin/env bash\\nset -x\\nn=3\\necho \"running $n cases\"\\n' > bin/trace.sh\nchmod +x bin/trace.sh; ./bin/trace.sh\nprintf 'echo \"sweep.sh: $# arguments\"\\necho \"\\\\$0 is $0\"\\n' > bin/sweep.sh\nbash bin/sweep.sh a b\nhead -c 2 bin/sweep.sh | od -c\nout=$(printf \"a\\nb\\n\\n\\n\"); printf '%s' \"$out\" | od -c\nprintf 'x\\ty\\0z\\n' | od -c\ntail -c 4 bin/sweep.sh\n",
    args: "a b c",
    want: "script dir : bin\narguments  : 3\nscript dir : bin\narguments  : 1\n+ n=3\n+ echo 'running 3 cases'\nrunning 3 cases\nsweep.sh: 2 arguments\n$0 is bin/sweep.sh\n0000000   e   c\n0000002\n0000000   a  \\n   b\n0000003\n0000000   x  \\t   y  \\0   z  \\n\n0000006\n$0\"\n[exit=0]",
  },
]

/** Runs a case the way the comparison with bash did: files written, then bash t.sh ARGS 2>&1 | cat. */
function asBash(c: BashCase): string {
  let s = newShell()
  const q = (t: string) => `'${t.replace(/'/g, `'\\''`)}'`
  for (const [f, t] of Object.entries(c.files)) {
    if (f.includes('/')) s = run(s, `mkdir -p ${q(f.slice(0, f.lastIndexOf('/')))}`).state
    s = run(s, `printf '%s' ${q(t)} > ${q(f)}`).state
  }
  s = run(s, `printf '%s' ${q(c.script)} > t.sh`).state
  const r = run(s, `bash t.sh ${c.args} 2>&1 | cat`)
  return `${r.out}${r.out ? '\n' : ''}[exit=${r.state.arrays?.PIPESTATUS?.v['0']}]`
}

describe('scripts print exactly what real bash prints', () => {
  for (const c of BASH_CASES) it(c.name, () => expect(asBash(c)).toBe(c.want))
})

describe('git, as the collaboration and internals modules use it', () => {
  const typed = (...lines: string[]) => lines.reduce((st, l) => run(st, l).state, newShell())
  const three = ['git init', 'git config user.name Ada', 'printf "one\\ntwo\\nthree\\n" > a.txt', 'git add .', 'git commit -m "first"', 'echo four >> a.txt', 'git commit -am "add four"', 'git config user.name Sam', 'echo TODO > b.txt', 'git add b.txt', 'git commit -m "add b"']

  it('keeps a reflog for each branch: main@{1}, git reflog show main', () => {
    const st = typed(...three, 'git switch -c feat', 'echo f > f.txt', 'git add .', 'git commit -m "feat"')
    expect(run(st, 'git reflog show feat').out).toMatch(/^[0-9a-f]{7} \(HEAD -> feat\) feat@\{0\}: commit: feat\n[0-9a-f]{7} \(?.*feat@\{1\}: branch: Created from HEAD$/)
    expect(run(st, 'git log -1 --format=x main@{1}').out).toBe('fatal: unrecognized argument: --format=x')
    expect(run(st, 'git log --oneline -1 main@{1}').out).toMatch(/add four$/)
    expect(run(st, 'git log --oneline -1 feat@{1}').out).toMatch(/add b$/)
  })

  it('log --stat, -p, --author and -S; blame -L', () => {
    const st = typed(...three)
    expect(run(st, 'git log --oneline --stat -1').out).toMatch(/^[0-9a-f]{7} \(HEAD -> main\) add b\n b\.txt \| 1 \+\n 1 file changed, 1 insertion\(\+\)$/)
    expect(run(st, 'git log --author=Sam --oneline').out.split('\n')).toHaveLength(1)
    expect(run(st, 'git log -S four --oneline').out).toMatch(/^[0-9a-f]{7} add four$/)
    expect(run(st, 'git log -p -1 HEAD~1').out).toMatch(/add four\n\ndiff --git a\/a\.txt b\/a\.txt[\s\S]*\+four$/)
    expect(run(st, 'git blame -L 2,3 a.txt').out).toMatch(/^[0-9a-f]{7} \(Ada 2\) two\n[0-9a-f]{7} \(Ada 3\) three$/)
    expect(run(st, 'git blame -L 3,+2 a.txt').out.split('\n')).toHaveLength(2)
  })

  it('shows objects with cat-file, names commits with describe, finds lost work with fsck', () => {
    let st = typed(...three)
    expect(run(st, 'git cat-file -t HEAD').out).toBe('commit')
    expect(run(st, 'git cat-file -p HEAD').out).toMatch(/^tree [0-9a-f]{7}\nparent [0-9a-f]{7}\nauthor Sam\ncommitter Sam\n\nadd b$/)
    expect(run(st, 'git cat-file -p HEAD^{tree}').out).toMatch(/^100644 blob [0-9a-f]{7}\ta\.txt\n100644 blob [0-9a-f]{7}\tb\.txt$/)
    expect(run(st, 'git cat-file -t HEAD:b.txt').out).toBe('blob')
    expect(run(st, 'git cat-file -p HEAD:b.txt').out).toBe('TODO')
    expect(run(st, 'git describe').out).toBe('fatal: No names found, cannot describe anything.')
    st = typed(...three, 'git tag -a v1 -m "one" HEAD~1')
    expect(run(st, 'git describe').out).toMatch(/^v1-1-g[0-9a-f]{7}$/)
    expect(run(st, 'git cat-file -t v1').out).toBe('tag')
    st = typed(...three, 'git reset --hard HEAD~1')
    expect(run(st, 'git fsck').out).toBe('')
    expect(run(st, 'git fsck --no-reflogs').out).toMatch(/^dangling commit [0-9a-f]{7}$/)
  })

  it('reverts a merge with -m 1, and cherry-picks with -x and -m', () => {
    const st = typed('git init', 'echo 1 > f', 'git add .', 'git commit -m "start"', 'git switch -c side', 'echo s > s', 'git add .', 'git commit -m "side"', 'git switch main', 'echo m > m', 'git add .', 'git commit -m "main"', 'git merge side')
    expect(run(st, 'git revert HEAD').out).toMatch(/is a merge but no -m option was given/)
    const r = run(st, 'git revert -m 1 HEAD')
    expect(r.out).toMatch(/Revert "Merge branch 'side'"/)
    expect(lookup(r.state, `${START}/s`)).toBeUndefined()
    const p = typed('git init', 'echo 1 > f', 'git add .', 'git commit -m "start"', 'git switch -c side', 'echo s > s', 'git add .', 'git commit -m "side work"', 'git switch main', 'git cherry-pick -x side')
    expect(gitAt(p, START, 'HEAD')!.message).toMatch(/^side work\n\n\(cherry picked from commit [0-9a-f]{7}\)$/)
    const m = run(st, 'git switch -c pick HEAD~1')
    expect(run(m.state, 'git cherry-pick -m 1 main').out).toMatch(/^\[pick [0-9a-f]{7}\] Merge branch 'side'/)
  })

  it('A...B: log shows both sides, diff shows the other side since they parted', () => {
    const st = typed('git init', 'echo 1 > f', 'git add .', 'git commit -m "start"', 'git switch -c feat', 'echo f > g', 'git add .', 'git commit -m "feat"', 'git switch main', 'echo m > m', 'git add .', 'git commit -m "main"')
    expect(run(st, 'git log --oneline main...feat').out).toMatch(/^[0-9a-f]{7} \(HEAD -> main\) main\n[0-9a-f]{7} \(feat\) feat$/)
    expect(run(st, 'git diff --name-only main...feat').out).toBe('g')
  })

  it('init --bare -b names the first branch; @{u} is the upstream; fetch prunes only when asked', () => {
    let st = typed('cd ~', 'git init --bare -b trunk srv.git', 'git clone srv.git me', 'cd me', 'echo a > a', 'git add .', 'git commit -m "a"', 'git push -u origin trunk')
    expect(lookup(st, '/home/you/trunk')).toBeUndefined()
    expect(gitInfo(st, '/home/you/me')!.branch).toBe('trunk')
    expect(run(st, 'git log --oneline @{u}').out).toMatch(/\(HEAD -> trunk, origin\/trunk\) a$/)
    st = typed('cd ~', 'git init --bare srv.git', 'git clone srv.git me', 'git clone srv.git you', 'cd you', 'echo x > x', 'git add .', 'git commit -m "x"', 'git push -u origin main', 'git switch -c feature', 'git push -u origin feature', 'cd ~/me', 'git fetch', 'cd ~/you', 'git push origin --delete feature', 'cd ~/me', 'git fetch')
    expect(run(st, 'git branch -r').out).toMatch(/origin\/feature/)
    const pruned = run(st, 'git fetch --prune')
    expect(pruned.out).toMatch(/- \[deleted\]\s+\(none\)\s+-> origin\/feature/)
    expect(run(pruned.state, 'git branch -r').out).not.toMatch(/feature/)
  })

  it('refuses a push --force-with-lease when the remote moved since the last fetch (stale info)', () => {
    const st = typed('cd ~', 'git init --bare srv.git', 'git clone srv.git me', 'git clone srv.git you', 'cd you', 'echo x > x', 'git add .', 'git commit -m "x"', 'git push -u origin main', 'cd ~/me', 'git pull', 'echo m > m', 'git add .', 'git commit --amend -m "mine"', 'cd ~/you', 'echo y > y', 'git add .', 'git commit -m "y"', 'git push', 'cd ~/me')
    const r = run(st, 'git push --force-with-lease')
    expect(r.out).toMatch(/! \[rejected\]\s+main -> main \(stale info\)/)
    expect(r.state.status).toBe(1)
  })
})
