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
    expect(shellCanRun('awk "{print $1}" f')).toBe(false)
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
