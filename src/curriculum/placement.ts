/* ============================================================================
   ORBIT — the placement test's skills and questions
   ----------------------------------------------------------------------------
   One skill per lesson, in the order the course teaches them: Basecamp first,
   then the first seven lessons of Algebra & Precalculus. Two questions a
   skill, the first the plainest form of it and the second a step further, so
   one right answer out of two reads as "has it, a bit shaky".

   Each wrong choice is a real mistake, not filler — the sum where the product
   was asked, the denominators added — so a wrong answer says which mistake.
   The engine that scores this is src/engine/placement.ts.
   ========================================================================== */
import type { PlacementQuestion, PlacementSkill } from '@/engine/placement'

const B = 't0_m00_basecamp'
const A = 't0_m01_algebra_precalc'

export const PLACEMENT_SKILLS: PlacementSkill[] = [
  { id: 'place-value', label: 'Place value and estimating', moduleId: B, lessonId: 'l01-place-value-and-estimating' },
  { id: 'decimals', label: 'Decimals and rounding', moduleId: B, lessonId: 'l02-decimals-and-rounding' },
  { id: 'factors', label: 'Multiplying, dividing, factors and primes', moduleId: B, lessonId: 'l03-factors-and-primes' },
  { id: 'fractions-basics', label: 'Fractions', moduleId: B, lessonId: 'l04-fractions-from-the-ground-up' },
  { id: 'formulas', label: 'Letters, expressions and formulas', moduleId: B, lessonId: 'l05-variables-and-formulas' },
  { id: 'simple-equations', label: 'Solving simple equations', moduleId: B, lessonId: 'l06-solving-simple-equations' },
  { id: 'graphs', label: 'Graphs and the coordinate plane', moduleId: B, lessonId: 'l07-graphs-and-the-coordinate-plane' },
  { id: 'angles', label: 'Angles and shapes', moduleId: B, lessonId: 'l08-angles-and-shapes' },
  { id: 'area-volume', label: 'Perimeter, area and volume', moduleId: B, lessonId: 'l09-perimeter-area-and-volume' },
  { id: 'pythagoras', label: 'Square roots and the Pythagorean theorem', moduleId: B, lessonId: 'l10-square-roots-and-pythagoras' },
  { id: 'metric', label: 'The metric system', moduleId: B, lessonId: 'l11-the-metric-system' },
  { id: 'rates', label: 'Speed, rates and averages', moduleId: B, lessonId: 'l12-speed-rates-and-averages' },
  { id: 'signed-fractions', label: 'Negative numbers and fraction arithmetic', moduleId: A, lessonId: 'l01-signed-numbers-and-fractions' },
  { id: 'exponents', label: 'Exponents and roots', moduleId: A, lessonId: 'l02-exponents-and-radicals' },
  { id: 'polynomials', label: 'Expanding and factoring', moduleId: A, lessonId: 'l03-polynomials-and-factoring' },
  { id: 'equations', label: 'Linear and quadratic equations', moduleId: A, lessonId: 'l04-linear-and-quadratic-equations' },
  { id: 'systems', label: 'Systems of equations', moduleId: A, lessonId: 'l05-systems-of-equations' },
  { id: 'functions', label: 'Functions', moduleId: A, lessonId: 'l06-functions' },
  { id: 'logs', label: 'Exponentials and logarithms', moduleId: A, lessonId: 'l07-exponentials-and-logarithms' },
]

const q = (id: string, skill: string, prompt: string, choices: string[], answer: number, explain: string): PlacementQuestion => ({
  id,
  skill,
  prompt,
  choices,
  answer,
  explain,
})

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  q('pv1', 'place-value', 'Which digit is in the **hundreds** place of 47,820?', ['8', '7', '2', '4'], 0,
    'Reading from the right: 0 ones, 2 tens, 8 hundreds, 7 thousands, 4 ten-thousands.'),
  q('pv2', 'place-value', 'Without a calculator, roughly what is 398 × 51?', ['About 20,000', 'About 2,000', 'About 200,000', 'About 15,000'], 0,
    'Round to 400 × 50 = 20,000. (Exactly, it is 20,298.) Estimating first is how you catch a wrong answer later.'),

  q('dec1', 'decimals', 'What is 0.6 + 0.75?', ['1.35', '0.81', '1.25', '13.5'], 0,
    'Line up the decimal points: 0.60 + 0.75 = 1.35. 0.81 comes from adding 6 and 75 as if the point were not there.'),
  q('dec2', 'decimals', 'Round 3.14159 to two decimal places.', ['3.14', '3.15', '3.1', '3.142'], 0,
    'Keep two digits after the point (3.14); the next digit is 1, which is less than 5, so it stays 3.14.'),

  q('fac1', 'factors', 'Which of these is a **prime** number?', ['17', '21', '27', '51'], 0,
    '17 has no factors except 1 and 17. 21 = 3 × 7, 27 = 3 × 9 and 51 = 3 × 17.'),
  q('fac2', 'factors', 'What is 156 ÷ 12?', ['13', '12', '14', '11'], 0,
    '12 × 13 = 156. Long division: 12 goes into 15 once with 3 left over, and into 36 three times.'),

  q('frb1', 'fractions-basics', 'Which fraction is equal to $\\tfrac{3}{4}$?', ['$\\tfrac{9}{12}$', '$\\tfrac{6}{12}$', '$\\tfrac{3}{8}$', '$\\tfrac{4}{3}$'], 0,
    'Multiply top and bottom by 3: $\\tfrac{3 \\times 3}{4 \\times 3} = \\tfrac{9}{12}$. Same amount, smaller pieces.'),
  q('frb2', 'fractions-basics', 'Write $\\tfrac{2}{5}$ as a decimal.', ['0.4', '0.25', '2.5', '0.52'], 0,
    'Divide: 2 ÷ 5 = 0.4. Or scale to tenths: $\\tfrac{2}{5} = \\tfrac{4}{10} = 0.4$.'),

  q('fo1', 'formulas', 'If $a = 3$ and $b = 4$, what is $2a + b$?', ['10', '24', '9', '14'], 0,
    '$2a$ means 2 times $a$: $2 \\times 3 + 4 = 6 + 4 = 10$.'),
  q('fo2', 'formulas', 'Distance is speed times time, $d = v \\cdot t$. How far does a car going $20\\,\\mathrm{m/s}$ travel in $15\\,\\mathrm{s}$?', ['300 m', '35 m', '1.33 m', '3000 m'], 0,
    '$d = 20 \\times 15 = 300\\,\\mathrm{m}$. Metres per second times seconds leaves metres.'),

  q('eq1', 'simple-equations', 'Solve $x + 9 = 23$.', ['$x = 14$', '$x = 32$', '$x = 9$', '$x = 23$'], 0,
    'Take 9 from both sides: $x = 23 - 9 = 14$. Check: $14 + 9 = 23$.'),
  q('eq2', 'simple-equations', 'Solve $4x - 5 = 27$.', ['$x = 8$', '$x = 5.5$', '$x = 32$', '$x = 7$'], 0,
    'Add 5 to both sides: $4x = 32$. Divide both sides by 4: $x = 8$. Check: $4 \\times 8 - 5 = 27$.'),

  q('gr1', 'graphs', 'Which point is 2 units **left** of the origin and 3 units **up**?', ['$(-2, 3)$', '$(2, -3)$', '$(3, -2)$', '$(-3, 2)$'], 0,
    'The first number is the left–right position ($x$), the second the up–down position ($y$). Left is negative $x$.'),
  q('gr2', 'graphs', 'A straight line passes through $(0, 1)$ and $(2, 7)$. What is its slope?', ['3', '6', '4', '$\\tfrac{1}{3}$'], 0,
    'Slope is rise over run: $y$ goes up by $7 - 1 = 6$ while $x$ goes along by 2, so $6 \\div 2 = 3$.'),

  q('an1', 'angles', 'Two angles of a triangle are $50^\\circ$ and $60^\\circ$. What is the third?', ['$70^\\circ$', '$90^\\circ$', '$110^\\circ$', '$250^\\circ$'], 0,
    'The three angles of a triangle add to $180^\\circ$: $180 - 50 - 60 = 70$.'),
  q('an2', 'angles', 'Two angles sit side by side on a straight line. One is $35^\\circ$. What is the other?', ['$145^\\circ$', '$55^\\circ$', '$325^\\circ$', '$35^\\circ$'], 0,
    'Angles on a straight line add to $180^\\circ$: $180 - 35 = 145$. ($55^\\circ$ would make a right angle, $90^\\circ$.)'),

  q('av1', 'area-volume', 'What is the area of a rectangle $6\\,\\mathrm{m}$ long and $4\\,\\mathrm{m}$ wide?', ['$24\\,\\mathrm{m^2}$', '$20\\,\\mathrm{m}$', '$10\\,\\mathrm{m^2}$', '$24\\,\\mathrm{m}$'], 0,
    'Length times width: $6 \\times 4 = 24$, in square metres. $20\\,\\mathrm{m}$ is the perimeter.'),
  q('av2', 'area-volume', 'What is the area of a circle of radius $2\\,\\mathrm{m}$? (Use $\\pi \\approx 3.14$.)', ['About $12.6\\,\\mathrm{m^2}$', 'About $6.3\\,\\mathrm{m^2}$', '$4\\,\\mathrm{m^2}$', 'About $25.1\\,\\mathrm{m^2}$'], 0,
    '$A = \\pi r^2 = 3.14 \\times 2^2 = 3.14 \\times 4 \\approx 12.6\\,\\mathrm{m^2}$. $6.3$ forgets to square the radius; $25.1$ uses the diameter.'),

  q('py1', 'pythagoras', 'What is $\\sqrt{81}$?', ['9', '40.5', '8', '6561'], 0,
    '$9 \\times 9 = 81$, so the square root of 81 is 9. ($40.5$ is half of 81, a different thing.)'),
  q('py2', 'pythagoras', 'A right triangle has shorter sides 5 and 12. How long is the longest side?', ['13', '17', '60', '7'], 0,
    'Pythagoras: $\\sqrt{5^2 + 12^2} = \\sqrt{25 + 144} = \\sqrt{169} = 13$. Adding the sides (17) skips the squares and roots.'),

  q('me1', 'metric', 'How many grams are in $2.5\\,\\mathrm{kg}$?', ['2,500 g', '250 g', '25 g', '0.0025 g'], 0,
    'Kilo- means 1,000, so $2.5 \\times 1000 = 2500\\,\\mathrm{g}$.'),
  q('me2', 'metric', 'One centimetre is what fraction of a metre?', ['$\\tfrac{1}{100}$', '$\\tfrac{1}{10}$', '$\\tfrac{1}{1000}$', '100'], 0,
    'Centi- means one hundredth: 100 centimetres make a metre. A millimetre is a thousandth.'),

  q('ra1', 'rates', 'A train travels $150\\,\\mathrm{km}$ in 2 hours. What is its average speed?', ['75 km/h', '300 km/h', '152 km/h', '148 km/h'], 0,
    'Speed is distance divided by time: $150 \\div 2 = 75\\,\\mathrm{km/h}$.'),
  q('ra2', 'rates', 'What is the mean of 3, 5 and 10?', ['6', '5', '18', '7'], 0,
    'Add them and divide by how many: $(3 + 5 + 10) \\div 3 = 18 \\div 3 = 6$. 5 is the middle value (the median); 18 is the total.'),

  q('sf1', 'signed-fractions', 'What is $-5 - (-8)$?', ['3', '−13', '−3', '13'], 0,
    'Subtracting a negative adds: $-5 - (-8) = -5 + 8 = 3$.'),
  q('sf2', 'signed-fractions', 'What is $\\tfrac{1}{2} + \\tfrac{1}{3}$?', ['$\\tfrac{5}{6}$', '$\\tfrac{2}{5}$', '$\\tfrac{1}{5}$', '$\\tfrac{2}{6}$'], 0,
    'Same-sized pieces first: $\\tfrac{3}{6} + \\tfrac{2}{6} = \\tfrac{5}{6}$. Adding tops and bottoms separately ($\\tfrac{2}{5}$) is the classic slip.'),

  q('ex1', 'exponents', 'What is $2^3 \\times 2^4$?', ['$2^7$', '$2^{12}$', '$4^7$', '$2^1$'], 0,
    'Same base, so add the exponents: $2^{3+4} = 2^7$. (Three 2s times four 2s is seven 2s multiplied together.)'),
  q('ex2', 'exponents', 'What is $10^{-2}$?', ['0.01', '−100', '−20', '0.2'], 0,
    'A negative exponent means one over: $10^{-2} = \\tfrac{1}{10^2} = \\tfrac{1}{100} = 0.01$. It is never negative.'),

  q('po1', 'polynomials', 'Expand $(x + 3)(x + 2)$.', ['$x^2 + 5x + 6$', '$x^2 + 6$', '$x^2 + 5x + 5$', '$2x + 5$'], 0,
    'Multiply every term by every term: $x^2 + 2x + 3x + 6 = x^2 + 5x + 6$.'),
  q('po2', 'polynomials', 'Factor $x^2 - 9$.', ['$(x - 3)(x + 3)$', '$(x - 3)^2$', '$(x - 9)(x + 1)$', 'It cannot be factored'], 0,
    'A difference of squares: $a^2 - b^2 = (a - b)(a + b)$ with $a = x$, $b = 3$. Check: $(x-3)(x+3) = x^2 + 3x - 3x - 9$.'),

  q('lq1', 'equations', 'Solve $2(x - 1) = 3x + 4$.', ['$x = -6$', '$x = 6$', '$x = -2$', '$x = 2$'], 0,
    '$2x - 2 = 3x + 4$, so $-2 - 4 = 3x - 2x$, giving $x = -6$. Check: $2(-7) = -14$ and $3(-6) + 4 = -14$.'),
  q('lq2', 'equations', 'Solve $x^2 - 5x + 6 = 0$.', ['$x = 2$ or $x = 3$', '$x = -2$ or $x = -3$', '$x = 1$ or $x = 6$', '$x = 5$ or $x = 6$'], 0,
    'Factor: $(x - 2)(x - 3) = 0$, so $x = 2$ or $x = 3$. Check: $4 - 10 + 6 = 0$ and $9 - 15 + 6 = 0$.'),

  q('sy1', 'systems', 'If $x + y = 10$ and $x - y = 4$, what is $x$?', ['7', '3', '6', '14'], 0,
    'Add the two equations: $2x = 14$, so $x = 7$ (and $y = 3$).'),
  q('sy2', 'systems', 'If $2x + y = 7$ and $x + y = 5$, what is $y$?', ['3', '2', '5', '1'], 0,
    'Subtract the second from the first: $x = 2$. Then $2 + y = 5$, so $y = 3$.'),

  q('fn1', 'functions', 'If $f(x) = 3x - 2$, what is $f(4)$?', ['10', '12', '14', '2'], 0,
    'Put 4 in for $x$: $3 \\times 4 - 2 = 12 - 2 = 10$.'),
  q('fn2', 'functions', 'If $f(x) = x + 1$ and $g(x) = 2x$, what is $f(g(3))$?', ['7', '8', '6', '9'], 0,
    'Inside first: $g(3) = 6$. Then $f(6) = 7$. ($g(f(3)) = 8$ does them in the other order.)'),

  q('lg1', 'logs', 'What is $\\log_{10} 1000$?', ['3', '100', '30', '0.001'], 0,
    'The logarithm asks "10 to what power gives 1000?" Since $10^3 = 1000$, the answer is 3.'),
  q('lg2', 'logs', 'Solve $2^x = 32$.', ['$x = 5$', '$x = 16$', '$x = 6$', '$x = 4$'], 0,
    '$2 \\times 2 \\times 2 \\times 2 \\times 2 = 32$ is five 2s, so $x = 5$. ($x = 16$ is $32 \\div 2$.)'),
]
