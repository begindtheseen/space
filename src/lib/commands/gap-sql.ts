import type { CommandRef } from './types'

export const COMMANDS: CommandRef[] = [
  {
    name: 'ANY',
    aliases: ['= ANY'],
    lang: 'sql',
    kind: 'keyword',
    official:
      'The right-hand side is a parenthesized expression, which must yield an array value. The left-hand expression is evaluated and compared to each element of the array using the given operator, which must yield a Boolean result.',
    source: 'PostgreSQL documentation (functions-comparisons.html)',
    when: 'PostgreSQL, not SQLite. You meet it when PostgreSQL shows you a schema or a query plan: it turns `x IN (1, 2, 3)` into `x = ANY (ARRAY[1, 2, 3])`, which means "x equals at least one of these". If the array holds a NULL and nothing matches, the answer is NULL, not false.',
    flags: [['ARRAY[...]', 'the list of values to compare against']],
    example: {
      command: 'SELECT * FROM telemetry WHERE quality = ANY (ARRAY[1, 2]);',
      says: 'Shows the readings whose quality is 1 or 2, the same as quality IN (1, 2) (PostgreSQL).',
    },
    seeAlso: ['IN', 'CHECK'],
  },
  {
    name: 'AUTOINCREMENT',
    lang: 'sql',
    kind: 'keyword',
    official:
      'If a column has the type INTEGER PRIMARY KEY AUTOINCREMENT then a slightly different ROWID selection algorithm is used. The ROWID chosen for the new row is at least one larger than the largest ROWID that has ever before existed in that same table.',
    source: 'SQLite documentation (autoinc.html)',
    when: 'You need ids that are never reused, even after the newest row is deleted. Plain INTEGER PRIMARY KEY already fills in ids for you, but it may hand out a deleted top id again. AUTOINCREMENT costs a little speed, so use it only when reuse would really cause trouble.',
    example: {
      command: 'CREATE TABLE launches (id INTEGER PRIMARY KEY AUTOINCREMENT, vehicle TEXT);',
      says: 'Makes a table whose id goes up by one for each new launch and never repeats an id, even one that was deleted.',
    },
    seeAlso: ['PRIMARY KEY', 'INTEGER', 'CREATE TABLE'],
  },
  {
    name: 'CUME_DIST',
    aliases: ['CUME_DIST()', 'cume_dist'],
    lang: 'sql',
    kind: 'function',
    official:
      'The cumulative distribution. Calculated as row-number/partition-rows, where row-number is the value returned by row_number() for the last peer in the group and partition-rows the number of rows in the partition.',
    source: 'SQLite documentation (windowfunctions.html)',
    when: 'You want each row\'s place as a fraction: how much of the group is at or below this value, from just above 0 up to 1. Ties all get the same, higher answer, because it counts every row equal to this one.',
    flags: [['OVER (ORDER BY x)', 'the order that decides which rows count as at or below']],
    example: {
      command: 'SELECT sat_id, dv, CUME_DIST() OVER (ORDER BY dv) FROM burns;',
      says: 'Shows each burn with the fraction of burns whose delta-v is the same or smaller, such as 0.583 when 7 of 12 are.',
    },
    seeAlso: ['PERCENT_RANK', 'RANK', 'OVER'],
  },
  {
    name: 'INSTEAD',
    aliases: ['INSTEAD OF'],
    lang: 'sql',
    kind: 'keyword',
    official:
      'INSTEAD OF triggers work only on views. If an INSTEAD OF INSERT trigger exists on a view, then it is possible to execute an INSERT statement against that view. No actual insert occurs. Instead, the statements contained within the trigger are run.',
    source: 'SQLite documentation (lang_createtrigger.html)',
    when: 'You want INSERT, UPDATE or DELETE to work on a view. A view has no rows of its own, so you write a trigger that says what to change in the real tables instead. Without one, SQLite refuses with "cannot modify ... because it is a view".',
    example: {
      command: 'CREATE TRIGGER eng_raise INSTEAD OF UPDATE ON eng_team BEGIN UPDATE staff SET salary = NEW.salary WHERE id = OLD.id; END;',
      says: 'Lets UPDATE eng_team work: each change is written to the matching row of the real staff table.',
    },
    seeAlso: ['CREATE TRIGGER', 'CREATE VIEW'],
  },
  {
    name: 'LEAST',
    aliases: ['least'],
    lang: 'sql',
    kind: 'function',
    official: 'The GREATEST and LEAST functions select the largest or smallest value from a list of any number of expressions.',
    source: 'PostgreSQL documentation (functions-conditional.html)',
    when: 'PostgreSQL and MySQL, not SQLite. You want the smaller of a few values in the same row, such as a charge capped at a limit. In SQLite write MIN with two or more values instead; MIN with one value adds up rows, a different job. PostgreSQL\'s LEAST skips NULLs.',
    example: {
      command: 'SELECT LEAST(days * 25, 1000) AS fee FROM loans;',
      says: 'Shows each fee as 25 per day, but never more than 1000 (PostgreSQL).',
    },
    seeAlso: ['MIN', 'MAX'],
  },
  {
    name: 'PERCENTILE_DISC',
    aliases: ['percentile_disc'],
    lang: 'sql',
    kind: 'function',
    official:
      'Computes the discrete percentile, the first value within the ordered set of aggregated argument values whose position in the ordering equals or exceeds the specified fraction.',
    source: 'PostgreSQL documentation (functions-aggregate.html)',
    when: 'PostgreSQL, not SQLite. You want a median or other percentile that is always one of the real values, never a blend of two. PERCENTILE_CONT may give a value between two readings; this one never does.',
    flags: [['WITHIN GROUP (ORDER BY x)', 'the values to take the percentile of']],
    example: {
      command: 'SELECT PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY value) FROM telemetry;',
      says: 'Shows the middle reading, an actual value from the table (PostgreSQL).',
    },
    seeAlso: ['PERCENTILE_CONT'],
  },
  {
    name: 'STRICT',
    lang: 'sql',
    kind: 'keyword',
    official:
      'In a CREATE TABLE statement, if the "STRICT" table-option keyword is added to the end, after the closing ")", then strict typing rules apply to that table.',
    source: 'SQLite documentation (stricttables.html)',
    when: 'You want SQLite to refuse a value of the wrong type, the way other databases do. In an ordinary table SQLite stores \'abc\' in an INTEGER column without complaint. A STRICT table allows only the types INT, INTEGER, REAL, TEXT, BLOB and ANY, and needs SQLite 3.37 or newer.',
    example: {
      command: 'CREATE TABLE readings (id INTEGER PRIMARY KEY, volts REAL) STRICT;',
      says: 'Makes a table where inserting the text \'n/a\' into volts fails with an error instead of being stored.',
    },
    seeAlso: ['CREATE TABLE', 'TYPEOF', 'REAL'],
  },
  {
    name: 'TOTAL',
    aliases: ['total'],
    lang: 'sql',
    kind: 'function',
    official:
      'The sum() and total() aggregate functions return the sum of all non-NULL values in the group. If there are no non-NULL input rows then sum() returns NULL but total() returns 0.0.',
    source: 'SQLite documentation (lang_aggfunc.html)',
    when: 'SQLite only. You want a sum that says 0.0 instead of NULL when there is nothing to add. The answer is always a decimal number, even for whole numbers. Other databases do not have it, so COALESCE(SUM(x), 0) is the habit that works everywhere.',
    example: {
      command: "SELECT TOTAL(cost) FROM requests WHERE model = 'none';",
      says: 'Shows 0.0 when no rows match, where SUM would show NULL.',
    },
    seeAlso: ['SUM', 'COALESCE'],
  },
  {
    name: 'VARCHAR',
    aliases: ['VARCHAR(n)', 'varchar', 'CHARACTER VARYING'],
    lang: 'sql',
    kind: 'type',
    official:
      'SQL defines two primary character types: character varying(n) and character(n), where n is a positive integer. Both of these types can store strings up to n characters (not bytes) in length.',
    source: 'PostgreSQL documentation (datatype-character.html)',
    when: 'You want a text column with a length limit, such as a call sign of at most 8 characters. PostgreSQL refuses anything longer. SQLite accepts VARCHAR(n) but ignores the number and stores text of any length, as if you had written TEXT.',
    flags: [['(n)', 'the most characters a value may have']],
    example: {
      command: 'CREATE TABLE crew (id INTEGER PRIMARY KEY, call_sign VARCHAR(8));',
      says: 'Makes a crew table whose call signs PostgreSQL limits to 8 characters. SQLite would accept longer ones.',
    },
    seeAlso: ['TEXT', 'CREATE TABLE'],
  },
  {
    name: 'WITHOUT',
    aliases: ['WITHOUT TIME ZONE', 'TIMESTAMP WITHOUT TIME ZONE'],
    lang: 'sql',
    kind: 'keyword',
    official:
      'The SQL standard requires that writing just timestamp be equivalent to timestamp without time zone, and PostgreSQL honors that behavior.',
    source: 'PostgreSQL documentation (datatype-datetime.html)',
    when: 'PostgreSQL. TIMESTAMP WITHOUT TIME ZONE, or plain TIMESTAMP, stores a clock reading, a date and a time, with no idea which time zone it was in. For moments that happen at one instant everywhere, like a launch, TIMESTAMP WITH TIME ZONE is usually safer. (In SQLite, WITHOUT appears only in WITHOUT ROWID, a different thing.)',
    example: {
      command: 'CREATE TABLE passes (sat_id INTEGER, starts TIMESTAMP WITHOUT TIME ZONE);',
      says: 'Makes a table whose starts column holds a date and time with no time zone attached (PostgreSQL).',
    },
    seeAlso: ['CREATE TABLE', 'DATE'],
  },
]
