"""Names ORBIT's lessons teach, found by reading them: every code block and every
inline `code` span, in the lesson's language. Prints {lang: [name, ...]}; the
reference test (commands.test.ts) requires an entry for each.

A name counts only when it can be shown to belong to its language, not to the
lesson: a Python keyword, built-in or importable library name; a command the
shell can find; a C++ keyword, header or std:: name; a SQL keyword or function;
a Rust keyword, macro, std path or imported crate; a MATLAB keyword; a CMake
command or CMAKE_ variable; a Dockerfile instruction; a GitHub Action. MATLAB
functions and YAML/TOML keys need judgment and are curated in the batch files.
"""
import builtins, collections, datetime, glob, importlib, io, json, keyword, re, subprocess, sys

THIRD = {'numpy', 'scipy', 'matplotlib', 'pandas', 'pytest', 'numba', 'hypothesis', 'joblib', 'pyarrow', 'casadi', 'cvxpy'}
ALIAS = {'np': 'numpy', 'plt': 'matplotlib.pyplot', 'pd': 'pandas'}
STD = set(sys.stdlib_module_names)
B = {b for b in dir(builtins) if not b.startswith('_')}
TYPES = [str, list, dict, set, tuple, int, float, bytes, type(re.compile('x')), type(re.match('x', 'x')),
         collections.deque, collections.Counter, datetime.date, io.StringIO]
METHODS = set().union(*[{m for m in dir(t) if not m.startswith('_')} for t in TYPES])
CPP_KEYWORDS = set('alignas alignof and asm auto bool break case catch char char8_t char16_t char32_t class concept const consteval constexpr constinit const_cast continue co_await co_return co_yield decltype default delete do double dynamic_cast else enum explicit export extern false float for friend goto if inline int long mutable namespace new noexcept not nullptr operator or private protected public register reinterpret_cast requires return short signed sizeof static static_assert static_cast struct switch template this thread_local throw true try typedef typeid typename union unsigned using virtual void volatile wchar_t while override final'.split())
SQL_KEYWORDS = set('SELECT FROM WHERE AND OR NOT IN IS NULL LIKE BETWEEN ORDER BY GROUP HAVING LIMIT OFFSET AS DISTINCT ALL JOIN INNER LEFT RIGHT FULL OUTER CROSS NATURAL ON USING UNION INTERSECT EXCEPT INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE VIEW INDEX UNIQUE PRIMARY KEY FOREIGN REFERENCES DROP ALTER ADD COLUMN RENAME TO IF EXISTS DEFAULT CHECK CONSTRAINT CASE WHEN THEN ELSE END WITH RECURSIVE OVER PARTITION ROWS RANGE UNBOUNDED PRECEDING FOLLOWING CURRENT ROW WINDOW FILTER RETURNING BEGIN COMMIT ROLLBACK EXPLAIN QUERY PLAN ANALYZE VACUUM PRAGMA TRIGGER AFTER BEFORE OF FOR CONFLICT IGNORE ABORT DO NOTHING ASC DESC COLLATE NOCASE INTEGER TEXT REAL NUMERIC TEMP CAST MATERIALIZED GENERATED ALWAYS NULLS GROUPS EXCLUDE STRICT WITHOUT AUTOINCREMENT INSTEAD'.split())
SQL_FUNCS = set('count sum avg min max coalesce round length upper lower substr trim date strftime julianday ifnull nullif abs replace instr printf group_concat total random typeof iif lag lead rank dense_rank row_number ntile first_value last_value nth_value percent_rank cume_dist'.split())
RUST_KEYWORDS = set('as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while'.split())
RUST_PRELUDE = set('Vec String Option Some None Result Ok Err Box'.split())
MATLAB_KEYWORDS = set('function end if elseif else for while switch case otherwise try catch return break continue global persistent parfor'.split())
DIRECTIVES = set('include define undef if ifdef ifndef elif elifdef elifndef else endif error warning pragma line embed'.split())
PROJECT_HEADER = re.compile(r'^(nav|gnc|flight|sim|orbit|app|core|telemetry)/|\.hpp$')
LANG_OF_FENCE = {'bash': 'shell', 'sh': 'shell', 'shell': 'shell', 'console': 'shell', 'python': 'python', 'py': 'python',
                 'cpp': 'cpp', 'c++': 'cpp', 'c': 'cpp', 'sql': 'sql', 'rust': 'rust', 'matlab': 'matlab',
                 'cmake': 'cmake', 'dockerfile': 'dockerfile', 'yaml': 'yaml', 'yml': 'yaml', 'toml': 'toml'}
TRACK_LANG = {'bash': 'shell', 'git': 'shell', 'python': 'python', 'cpp': 'cpp', 'sql': 'sql'}

def module_lang(path):
    m = re.search(r'lessons/([^/]+)/', path)
    mid = m.group(1) if m else ''
    for pat, lang in [(r'^cod_py', 'python'), (r'^cod_cpp|_cpp$', 'cpp'), (r'^cod_sql', 'sql'), (r'^cod_(lnx|git|ops)', 'shell'),
                      (r'^cod_rs', 'rust'), (r'^cod_(mat|slk)', 'matlab')]:
        if re.search(pat, mid): return lang
    return None

need = collections.defaultdict(set)
_found = {}

# Tools the lessons teach that a given machine may not have installed. Listed so the check asks for the
# same names everywhere, not only for what happens to be on the computer running it.
KNOWN_TOOLS = set('''apk apport ash conda-lock cowsay cron dnf docker-compose dos2unix ed gawk gcovr gh git-lfs
git-subtree gsed ifconfig logrotate netstat pyenv rpm sftp spack sshd svn ufw yum zstd zstdcat ssh scp rsync
kubectl podman conda crontab htop screen ip ss shellcheck nix-shell ssh-add ssh-agent ssh-keygen ssh-copy-id'''.split())

def is_command(word):
    if word in KNOWN_TOOLS: return True
    if word not in _found:
        _found[word] = subprocess.run(['bash', '-c', 'type -t -- "$1"', '_', word], capture_output=True, text=True).stdout.strip() in ('file', 'builtin', 'keyword')
    return _found[word]

def resolves(path):
    parts = path.split('.')
    for i in range(len(parts), 0, -1):
        try:
            obj = importlib.import_module('.'.join(parts[:i]))
            break
        except Exception:
            continue
    else:
        return False
    for p in parts[i:]:
        if not hasattr(obj, p): return False
        obj = getattr(obj, p)
    return True

def python(text, block):
    for w in re.findall(r'\b[A-Za-z_]+\b', text):
        if keyword.iskeyword(w): need['python'].add(w)
    for nm, after in re.findall(r'(?<![\w.])([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\s*(\(|$|\s|\)|,)', text):
        if nm.startswith('builtins.'): nm = nm[len('builtins.'):]  # `builtins.len` is `len`
        if '.__' in nm: continue  # `numpy.__file__`: a module's own attributes, not something it teaches
        head = nm.split('.')[0]
        full = ALIAS[head] + nm[len(head):] if head in ALIAS else nm
        if '.' not in nm:
            if nm in B and (after == '(' or not block): need['python'].add(nm)
        elif full.split('.')[0] in STD or full.split('.')[0] in THIRD:
            if resolves(full): need['python'].add(full)
        elif after == '(' and nm.split('.')[-1] in METHODS:
            need['python'].add(nm.split('.')[-1])

# Words that exist as commands but that the lessons only ever use as something else: the `w` permission bit and
# vim/sed/tmux keys, `init` for `git init`, jq's `select()`, `systemctl enable`, `free` memory, tmux's `watch`
# window, getopts' `opt` variable, ssh -G's `hostname` line, a `script.sh`, C++'s `sum +=`, Nix's `let … in`,
# a Kubernetes `kind:`, shellcheck's `code` field, `at` and `ab` as sample text, git's working `tree`, a `wip asdf` commit. (Some of these are installed on
# CI's runners but not here, so they must be named or the check would differ between machines.)
NOT_COMMANDS = {'w', 'init', 'select', 'enable', 'free', 'watch', 'opt', 'hostname', 'script', 'sum', 'let', 'kind', 'code', 'at', 'ab', 'tree', 'asdf'}

def shell(text):
    s = re.sub(r'^[~\w/.-]*\s*\$\s+', '', text.strip()).replace('sudo ', '')
    for seg in re.split(r'\|\||&&|\||;|\$\(', s):
        w = seg.strip().split()
        if not w or not re.match(r'^[a-z][\w.+-]*$', w[0]) or '=' in w[0]: continue
        if w[0] == 'git' and len(w) > 1 and re.match(r'^[a-z][a-z-]*$', w[1]) and w[1] not in ('pushf',):
            need['shell'].add('git ' + w[1])
        elif is_command(w[0]) and w[0] not in NOT_COMMANDS and not (len(w) > 1 and w[1] == '='):
            need['shell'].add(w[0])

def cpp(text, any_lang=False):
    t = re.sub(r'"(?:\\.|[^"\\])*"', '""', text)
    if not any_lang:
        for w in re.findall(r'\b[a-z_0-9]+\b', t):
            if w in CPP_KEYWORDS: need['cpp'].add(w)
        for d in re.findall(r'^\s*#\s*(\w+)', t, re.M):
            if d in DIRECTIVES: need['cpp'].add('#' + d)  # not gdb's `#0` frames or a `#use` note
    for h in re.findall(r'#\s*include\s*<([\w./-]+)>', t):
        if not PROJECT_HEADER.search(h) and re.search(r'[a-z]', h): need['cpp'].add(f'<{h}>')
    for n in re.findall(r'\b(?:std|Eigen|testing|py)::(?:\w+::)*\w+', t):
        if not re.match(r'^std::(mem|vec|collections|fmt|error|ops|cell|cmp|fs|hint|marker|net|panic|slice|sync::atomic|f64|Vec)\b', n) and not re.search(r'::(X|X_t|X_v|operator|_\w+)$', n):
            need['cpp'].add(n)

def sql(text):
    t = re.sub(r"'(?:''|[^'])*'", "''", text)
    for w in re.findall(r'\b[A-Z_]{2,}\b', t):
        if w in SQL_KEYWORDS: need['sql'].add(w)
    for f in re.findall(r'\b([A-Za-z_]+)\s*\(', t):
        if (f.isupper() and f not in SQL_KEYWORDS) or f.lower() in SQL_FUNCS: need['sql'].add(f.upper())

rust_block_paths, rust_inline_std = set(), set()

def rust(text, block=True):
    if not block and re.search(r'std::\w+\s*<|&$|;|\bconst\s', text):
        return cpp(text)  # a Rust lesson comparing with C++: `const std::string&`, `std::array<double, 4>`
    t = re.sub(r'"(?:\\.|[^"\\])*"', '""', text)
    for w in re.findall(r'\b[A-Za-z_]\w*\b', t):
        if w in RUST_KEYWORDS or w in RUST_PRELUDE: need['rust'].add(w)
    for p in re.findall(r'\b(?:std|core|alloc)::(?:\w+::)*\w+', t):
        if block: rust_block_paths.add(p); need['rust'].add(p)
        elif p.count('::') == 1 and p.startswith('std::'): rust_inline_std.add(p)  # decided once every block is read
        else: need['rust'].add(p)
    for m in re.findall(r'\b([a-z_]\w*)!', t): need['rust'].add(m + '!')
    for c in re.findall(r'^\s*use\s+([a-z_]\w*)::', t, re.M):
        if c not in ('std', 'core', 'alloc', 'crate', 'super', 'self'): need['rust'].add(c)

def other(lang, text):
    if lang == 'matlab':
        t = re.sub(r"'(?:''|[^'\n])*'", "''", re.sub(r'%[^\n]*', '', text))
        for w in re.findall(r'\b[a-z]+\b', t):
            if w in MATLAB_KEYWORDS: need['matlab'].add(w)
    elif lang == 'cmake':
        for c in re.findall(r'^\s*([A-Za-z_]\w*)\s*\(', text, re.M): need['cmake'].add(c.lower())
        for v in re.findall(r'\b(CMAKE_\w+)', text): need['cmake'].add(v)
    elif lang == 'dockerfile':
        for i in re.findall(r'^\s*([A-Z]{2,})\s', text, re.M):
            if i in ('FROM', 'RUN', 'COPY', 'ADD', 'WORKDIR', 'CMD', 'ENTRYPOINT', 'ENV', 'ARG', 'EXPOSE', 'USER', 'VOLUME', 'LABEL', 'HEALTHCHECK', 'SHELL', 'STOPSIGNAL', 'ONBUILD'):
                need['dockerfile'].add(i)
    elif lang == 'yaml':
        for a in re.findall(r'uses:\s*([\w.-]+/[\w./-]+?)@', text):
            if not a.startswith('orbit-gnc/'): need['yaml'].add(a)
    elif lang == 'toml':
        for tb in re.findall(r'^\s*(\[+[\w.-]+\]+)', text, re.M): need['toml'].add(tb)

def scan(lang, text, block):
    if lang == 'python': python(text, block)
    elif lang == 'shell': shell(text) if not block else [shell(l) for l in text.split('\n') if l.strip() and not l.strip().startswith('#')]
    elif lang == 'cpp': cpp(text)
    elif lang == 'sql': sql(text)
    elif lang == 'rust': rust(text, block)
    elif lang: other(lang, text)

files = [(f, TRACK_LANG.get(f.split('/')[-1].split('.')[0])) for f in glob.glob('src/learn/tracks/*.txt')]
files += [(f, module_lang(f)) for f in glob.glob('src/curriculum/lessons/**/*.md', recursive=True)]
for path, lesson_lang in files:
    t = open(path).read()
    for m in re.finditer(r'```([^\s`]*)[^\n]*\n([\s\S]*?)```', t):
        lang = LANG_OF_FENCE.get(m.group(1).lower())
        if lang == 'shell' and not lesson_lang == 'shell':
            continue  # terminal transcripts in other courses are checked by the terminal courses' own test
        if lang: scan(lang, m.group(2), True)
    prose = re.sub(r'```[\s\S]*?```', '', t)
    prose = re.sub(r'--- (?:solution|starter|tests?|check)\n[\s\S]*?(?=\n--- |\n=== |\Z)', '', prose)
    for m in re.finditer(r'(?<!`)(`+)(?!`)([^\n]{1,80}?)(?<!`)\1(?!`)', prose):
        span = m.group(2).strip()
        if lesson_lang: scan(lesson_lang, span, False)
        else:
            python(span, False) if re.match(r'^(np|numpy|scipy|plt|math|pd)\.', span) else None
            cpp(span, any_lang=True)
# Crates the lessons make themselves (`cargo new tlm`, `name = "tlm"`, `path = "../tlm"`) are the lesson's, not Rust's.
local = {'errs', 'tlm', 'nav', 'a'}  # packages the Rust lessons build in prose, and the `use a::b` syntax placeholder
for path, _ in files:
    t = open(path).read()
    local |= set(re.findall(r'cargo new(?: --lib)? ([\w-]+)', t)) | set(re.findall(r'^\s*name\s*=\s*"([\w-]+)"', t, re.M))
    local |= set(re.findall(r'path\s*=\s*"(?:\.\./)*([\w-]+)"', t))
need['rust'] -= {c.replace('-', '_') for c in local}
# A bare `std::vector` in a Rust lesson's text is the C++ one unless the Rust code itself uses that path.
for p in rust_inline_std:
    if p in rust_block_paths: need['rust'].add(p)
    else: cpp(p)
print(json.dumps({k: sorted(v) for k, v in need.items()}))
