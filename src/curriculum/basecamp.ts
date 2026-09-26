/* ============================================================================
   ORBIT — Basecamp
   ----------------------------------------------------------------------------
   The mathematics underneath the first real module. Algebra & Precalculus
   assumes someone can already work with decimals, factors, formulas, graphs,
   areas and the metric system; plenty of people arriving here learned those
   years ago and lost them, or never quite had them. Basecamp is where they get
   them back, in the same plain voice as the rest of the course.

   Nothing here is general-interest arithmetic. Every lesson teaches a skill
   the later lessons actually lean on, and says where — the cylinder volume is
   there because tanks are cylinders, the circle area because nozzle throats
   are circles. The placement test (src/engine/placement.ts) decides which of
   these lessons she needs; the ones she already knows she can skip.

   It is a root of the graph with no prerequisites, and nothing requires it:
   someone who tests out of it goes straight to Algebra & Precalculus.
   ========================================================================== */
import type { Module } from './types'

export const BASECAMP: Module = {
  id: 't0_m00_basecamp',
  track: 'foundations',
  tier: 0,
  title: 'Basecamp: The Math Under Everything',
  summary:
    'The arithmetic, geometry and measuring the rest of the course takes for granted — decimals, factors, formulas, graphs, areas and volumes, square roots and the metric system — each taught from scratch and tied to where you will use it.',
  prereqs: [],
  hours: 24,
  topics: [
    'place value, big numbers and estimating',
    'decimals and rounding',
    'multiplication, division, factors and primes',
    'fractions from the ground up',
    'variables, expressions and formulas',
    'solving simple equations',
    'the coordinate plane and reading graphs',
    'angles and shapes',
    'perimeter, area and volume',
    'squares, square roots and the Pythagorean theorem',
    'the metric system and measurement',
    'speed, rates and averages',
  ],
  objectives: [
    'Read, write, round and estimate with whole numbers and decimals confidently, without a calculator',
    'Work with factors, fractions and simple formulas, and solve one- and two-step equations',
    'Read and draw graphs, and find the perimeter, area and volume of the shapes rockets are made of',
    'Measure and convert in metric units, and reason about speed, rates and averages',
  ],
  resources: [
    {
      title: 'Pre-algebra',
      author: 'Khan Academy',
      kind: 'course',
      url: 'https://www.khanacademy.org/math/pre-algebra',
      free: true,
      note: 'Short videos and practice for every Basecamp topic, with mastery tracking.',
    },
    {
      title: 'Prealgebra 2e',
      author: 'OpenStax',
      kind: 'book',
      url: 'https://openstax.org/details/books/prealgebra-2e',
      free: true,
      note: 'A free textbook that covers the same ground slowly, with many worked examples.',
    },
    {
      title: 'Math is Fun',
      author: 'Rod Pierce',
      kind: 'site',
      url: 'https://www.mathsisfun.com',
      free: true,
      note: 'Friendly one-page explanations with pictures, good for a quick second look.',
    },
  ],
  cards: [
    { id: 'bc_place_value', front: 'In 7,670, what is each digit worth?', back: '7 thousands, 6 hundreds, 7 tens, 0 ones. Each place is worth ten times the place to its right.' },
    { id: 'bc_round', front: 'How do you round a number to a given place?', back: 'Look at the next digit to the right: 5 or more rounds up, 4 or less leaves it. 7,670 to the nearest thousand is 8,000; 3.1416 to two decimal places is 3.14.' },
    { id: 'bc_decimal_times10', front: 'What happens to a decimal when you multiply or divide by 10, 100 or 1000?', back: 'The digits move one place per zero: left (bigger) when multiplying, right (smaller) when dividing. 0.917 × 100 = 91.7; 411 ÷ 1000 = 0.411.' },
    { id: 'bc_prime', front: 'What is a prime number?', back: 'A whole number greater than 1 whose only factors are 1 and itself: 2, 3, 5, 7, 11, 13, … Every whole number above 1 is a product of primes in exactly one way (24 = 2 × 2 × 2 × 3).' },
    { id: 'bc_fraction_decimal_percent', front: 'Write one quarter as a fraction, a decimal and a percent.', back: '1/4 = 0.25 = 25%. A percent is "out of a hundred"; a decimal is the division done.' },
    { id: 'bc_substitute', front: 'What does it mean to substitute into a formula?', back: 'Replace each letter with its value, then work it out in the right order. For d = v·t with v = 12 m/s and t = 5 s: d = 12 × 5 = 60 m.' },
    { id: 'bc_balance', front: 'What is the one rule for solving an equation?', back: 'Do the same thing to both sides, so they stay equal, until the unknown is alone. Then check by putting the answer back in.' },
    { id: 'bc_coordinates', front: 'What does the point (3, −2) mean?', back: 'Start at the origin, go 3 along the x-axis (right), then 2 down the y-axis. The first number is always x, the second y.' },
    { id: 'bc_triangle_angles', front: 'What do the angles of any triangle add up to?', back: '180°. A right angle is 90°, a full turn 360°.', formula: true },
    { id: 'bc_circle', front: 'Circumference and area of a circle of radius r?', back: 'C = 2πr and A = πr², with π ≈ 3.14159. The diameter is d = 2r.', formula: true },
    { id: 'bc_cylinder', front: 'Volume of a cylinder of radius r and height h?', back: 'V = πr²h — the area of the circular end times the height. Rocket tanks are cylinders.', formula: true },
    { id: 'bc_pythagoras', front: 'State the Pythagorean theorem.', back: 'In a right triangle with legs a and b and longest side (hypotenuse) c: a² + b² = c². So c = √(a² + b²); a 3–4–5 triangle is the classic example.', formula: true },
    { id: 'bc_metric', front: 'What do kilo-, centi- and milli- mean?', back: 'kilo- = 1000 ×, centi- = 1/100, milli- = 1/1000. 1 km = 1000 m, 1 cm = 0.01 m, 1 kg = 1000 g, 1 L = 1000 mL.' },
    { id: 'bc_speed', front: 'How are distance, speed and time related?', back: 'distance = speed × time (d = v·t), so v = d/t and t = d/v. Keep the units matched: m and s give m/s.', formula: true },
    { id: 'bc_mean', front: 'How do you find the mean (average) of a list of numbers?', back: 'Add them all up and divide by how many there are. The mean of 4, 8 and 9 is 21 ÷ 3 = 7.' },
  ],
  quiz: [
    {
      id: 'bc_q_round',
      q: 'A rocket stage burns 411,000 kg of propellant. Rounded to the nearest hundred thousand kilograms, that is:',
      choices: ['400,000 kg', '410,000 kg', '500,000 kg', '411,000 kg'],
      answer: 0,
      explain: 'The hundred-thousands digit is 4 and the next digit is 1, which is less than 5, so it stays 400,000 kg. 410,000 is rounding to the nearest ten thousand.',
      b: -1.5,
    },
    {
      id: 'bc_q_decimal',
      q: 'What is 0.6 × 0.5?',
      choices: ['0.3', '3.0', '0.03', '1.1'],
      answer: 0,
      explain: '6 × 5 = 30, and there are two decimal places in total (one in each factor), so 0.30 = 0.3. A number times something less than 1 gets smaller, which rules out 3.0 and 1.1.',
      b: -0.8,
    },
    {
      id: 'bc_q_lcm',
      q: 'What is the smallest number that both 6 and 8 divide into exactly?',
      choices: ['24', '48', '14', '12'],
      answer: 0,
      explain: '6 = 2 × 3 and 8 = 2 × 2 × 2, so the smallest shared multiple is 2 × 2 × 2 × 3 = 24. 48 works too, but it is not the smallest; 12 is not a multiple of 8.',
      b: -0.3,
    },
    {
      id: 'bc_q_fraction',
      q: 'Which is larger, 3/5 or 5/8?',
      choices: ['5/8', '3/5', 'They are equal', 'You cannot tell without a calculator'],
      answer: 0,
      explain: 'With a common denominator of 40: 3/5 = 24/40 and 5/8 = 25/40, so 5/8 is larger by 1/40. As decimals, 0.6 against 0.625.',
      b: 0,
    },
    {
      id: 'bc_q_substitute',
      q: 'The formula for a rectangle\'s area is A = l × w. What is the area when l = 3.5 m and w = 2 m?',
      choices: ['7 m²', '5.5 m²', '7 m', '11 m²'],
      answer: 0,
      explain: '3.5 × 2 = 7, and metres times metres is square metres. 5.5 is the sum, not the product; 11 m would be the perimeter, 2 × (3.5 + 2).',
      b: -1,
    },
    {
      id: 'bc_q_equation',
      q: 'Solve 3x + 7 = 25.',
      choices: ['x = 6', 'x = 18', 'x = 32/3', 'x = 8'],
      answer: 0,
      explain: 'Take 7 from both sides: 3x = 18. Divide both sides by 3: x = 6. Check: 3 × 6 + 7 = 25.',
      b: -0.5,
    },
    {
      id: 'bc_q_graph',
      q: 'A straight-line graph passes through (0, 2) and (4, 10). How much does y go up for each step of 1 in x?',
      choices: ['2', '8', '4', '0.5'],
      answer: 0,
      explain: 'From x = 0 to x = 4, y rises from 2 to 10: a rise of 8 over a run of 4, so 8 ÷ 4 = 2 per step. That rise per step is the line\'s slope.',
      b: 0.3,
    },
    {
      id: 'bc_q_cylinder',
      q: 'A cylindrical tank has radius 1.85 m and height 10 m. Its volume is closest to:',
      choices: ['108 m³', '58 m³', '34 m³', '215 m³'],
      answer: 0,
      explain: 'V = πr²h = 3.14159 × 1.85² × 10 = 3.14159 × 3.4225 × 10 ≈ 107.5 m³. 58 m³ forgets to square the radius (3.14159 × 1.85 × 10); 215 m³ is twice the right answer.',
      b: 0.8,
    },
    {
      id: 'bc_q_pythagoras',
      q: 'A ladder leans against a wall. Its foot is 6 m from the wall and its top is 8 m up. How long is the ladder?',
      choices: ['10 m', '14 m', '48 m', '7 m'],
      answer: 0,
      explain: 'The wall, the ground and the ladder make a right triangle, so the ladder is √(6² + 8²) = √(36 + 64) = √100 = 10 m. Adding the sides (14 m) forgets the square roots.',
      b: 0.2,
    },
    {
      id: 'bc_q_metric',
      q: 'How many metres is 7.67 km?',
      choices: ['7,670 m', '767 m', '0.00767 m', '76,700 m'],
      answer: 0,
      explain: 'Kilo- means 1000, so 7.67 km = 7.67 × 1000 m = 7,670 m: move the decimal point three places to the right.',
      b: -0.7,
    },
    {
      id: 'bc_q_speed',
      q: 'The International Space Station travels about 7.7 km every second. Roughly how far does it go in a minute?',
      choices: ['460 km', '77 km', '7.7 km', '4,600 km'],
      answer: 0,
      explain: 'distance = speed × time = 7.7 km/s × 60 s = 462 km, about 460 km. Check the units: kilometres per second times seconds leaves kilometres.',
      b: 0.4,
    },
    {
      id: 'bc_q_mean',
      q: 'Four test burns lasted 160 s, 165 s, 158 s and 161 s. What is the mean burn time?',
      choices: ['161 s', '160 s', '644 s', '162.5 s'],
      answer: 0,
      explain: 'Add them: 160 + 165 + 158 + 161 = 644 s. Divide by the four burns: 644 ÷ 4 = 161 s. 644 s is the total, not the average.',
      b: -0.2,
    },
  ],
  tags: ['math', 'basecamp'],
  importance: 1,
}
