/* Every reference entry, in one chunk the app loads the first time Explain opens. */
import { COMMANDS as CPP_HEADERS } from './cpp-headers'
import { COMMANDS as CPP_KEYWORDS } from './cpp-keywords'
import { COMMANDS as CPP_LIBS } from './cpp-libs'
import { COMMANDS as CPP_STD_1 } from './cpp-std-1'
import { COMMANDS as CPP_STD_2 } from './cpp-std-2'
import { COMMANDS as FILES } from './files'
import { COMMANDS as GITBUILD } from './gitbuild'
import { COMMANDS as PY_KEYWORDS } from './py-keywords-builtins'
import { COMMANDS as PY_METHODS } from './py-methods'
import { COMMANDS as PY_NUMPY_1 } from './py-numpy-1'
import { COMMANDS as PY_NUMPY_2 } from './py-numpy-2'
import { COMMANDS as PY_SCI_1 } from './py-sci-1'
import { COMMANDS as PY_SCI_2 } from './py-sci-2'
import { COMMANDS as PY_STDLIB_1 } from './py-stdlib-1'
import { COMMANDS as PY_STDLIB_2 } from './py-stdlib-2'
import { COMMANDS as SHELL } from './shell'
import { COMMANDS as SQL } from './sql'
import type { CommandRef } from './types'

export const COMMANDS: CommandRef[] = [
  ...FILES,
  ...SHELL,
  ...GITBUILD,
  ...PY_KEYWORDS,
  ...PY_METHODS,
  ...PY_STDLIB_1,
  ...PY_STDLIB_2,
  ...PY_NUMPY_1,
  ...PY_NUMPY_2,
  ...PY_SCI_1,
  ...PY_SCI_2,
  ...CPP_KEYWORDS,
  ...CPP_HEADERS,
  ...CPP_STD_1,
  ...CPP_STD_2,
  ...CPP_LIBS,
  ...SQL,
]
