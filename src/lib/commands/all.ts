/* Every reference entry, in one chunk the app loads the first time Explain opens. */
import { COMMANDS as CMAKE_DOCKER } from './cmake-docker'
import { COMMANDS as CONFIG } from './config-yaml-toml'
import { COMMANDS as CPP_HEADERS } from './cpp-headers'
import { COMMANDS as CPP_KEYWORDS } from './cpp-keywords'
import { COMMANDS as CPP_LIBS } from './cpp-libs'
import { COMMANDS as CPP_STD_1 } from './cpp-std-1'
import { COMMANDS as CPP_STD_2 } from './cpp-std-2'
import { COMMANDS as FILES } from './files'
import { COMMANDS as GAP_CPP } from './gap-cpp'
import { COMMANDS as GAP_FINAL } from './gap-final'
import { COMMANDS as GAP_PYTHON } from './gap-python'
import { COMMANDS as GAP_SHELL } from './gap-shell'
import { COMMANDS as GAP_SQL } from './gap-sql'
import { COMMANDS as GAP_TOOLS } from './gap-tools'
import { COMMANDS as GITBUILD } from './gitbuild'
import { COMMANDS as MATLAB_1 } from './matlab-1'
import { COMMANDS as MATLAB_2 } from './matlab-2'
import { COMMANDS as PY_KEYWORDS } from './py-keywords-builtins'
import { COMMANDS as PY_METHODS } from './py-methods'
import { COMMANDS as PY_NUMPY_1 } from './py-numpy-1'
import { COMMANDS as PY_NUMPY_2 } from './py-numpy-2'
import { COMMANDS as PY_SCI_1 } from './py-sci-1'
import { COMMANDS as PY_SCI_2 } from './py-sci-2'
import { COMMANDS as PY_STDLIB_1 } from './py-stdlib-1'
import { COMMANDS as PY_STDLIB_2 } from './py-stdlib-2'
import { COMMANDS as RUST_CORE } from './rust-core'
import { COMMANDS as RUST_METHODS } from './rust-methods'
import { COMMANDS as RUST_PATHS } from './rust-paths-crates'
import { COMMANDS as SHELL } from './shell'
import { COMMANDS as SQL } from './sql'
import type { CommandRef } from './types'

export const COMMANDS: CommandRef[] = [
  ...FILES,
  ...SHELL,
  ...GITBUILD,
  ...GAP_SHELL,
  ...GAP_TOOLS,
  ...PY_KEYWORDS,
  ...PY_METHODS,
  ...PY_STDLIB_1,
  ...PY_STDLIB_2,
  ...PY_NUMPY_1,
  ...PY_NUMPY_2,
  ...PY_SCI_1,
  ...PY_SCI_2,
  ...GAP_PYTHON,
  ...CPP_KEYWORDS,
  ...CPP_HEADERS,
  ...CPP_STD_1,
  ...CPP_STD_2,
  ...CPP_LIBS,
  ...GAP_CPP,
  ...SQL,
  ...GAP_SQL,
  ...RUST_CORE,
  ...RUST_PATHS,
  ...RUST_METHODS,
  ...MATLAB_1,
  ...MATLAB_2,
  ...CMAKE_DOCKER,
  ...GAP_FINAL,
  ...CONFIG,
]
