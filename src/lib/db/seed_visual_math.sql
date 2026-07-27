-- ============================================================================
-- Seed: visual_math_questions
-- Quant Foundations — Visual Thinking Practice Module
-- 24 questions across 4 subsections: Percentages, Ratios & Proportions,
-- Fractions & Decimals, Data Basics
--
-- Each question has a visual-thinking passage that asks the user to imagine
-- a mental model before solving. Difficulty is 'easy' or 'medium' only.
-- ============================================================================

INSERT INTO visual_math_questions (id, subsection, topic, question_text, passage, options, correct_option, explanation, difficulty, visual_type, source, tags, created_at)
VALUES

-- ===========================================================================
-- SUBSECTION: Percentages (6 questions)
-- ===========================================================================

(
  gen_random_uuid(),
  'Percentages',
  'Percentage of a Whole',
  'What percentage of the grid is shaded?',
  'Imagine a 10×10 grid — 100 equal cells in total. Picture 43 of those cells shaded in a solid color, and the remaining cells left blank. Visualize the shaded region forming a block in the top-left area of the grid, covering 4 full rows plus 3 cells in the fifth row.',
  '{"A": "4.3%", "B": "43%", "C": "57%", "D": "0.43%"}',
  'B',
  'Since there are 100 cells total in a 10×10 grid, each cell represents 1%. If 43 cells are shaded, that is exactly 43 out of 100, or 43%. Visual tip: in a 10×10 grid, count the shaded cells directly — every cell equals 1%.',
  'easy',
  'grid',
  'Quant Foundations — Visual Math',
  ARRAY['percentages', 'grid', 'visualization', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Percentages',
  'Percentage of a Whole',
  'What percentage of the pie chart is represented by the unshaded portion?',
  'Picture a pie chart (circle) divided into 4 equal quarters. Three quarters are shaded in blue, and one quarter is left unshaded. Each quarter slice has a 90° angle at the center. The unshaded slice sits at the top-right position.',
  '{"A": "75%", "B": "50%", "C": "25%", "D": "33%"}',
  'C',
  'The circle is divided into 4 equal parts. One unshaded part out of 4 total parts is 1/4 = 25%. Visual tip: each quarter of a pie chart represents 25%. Three shaded quarters = 75%, so the remaining unshaded is 25%.',
  'easy',
  'pie_chart',
  'Quant Foundations — Visual Math',
  ARRAY['percentages', 'pie_chart', 'visualization', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Percentages',
  'Percentage Increase',
  'After a 20% increase, what is the final value if the original was 50?',
  'Imagine a tape diagram representing the original value 50 as a bar split into 5 equal segments. Each segment represents 10. Now picture extending the bar by adding one more segment of the same size (another 10) to represent a 20% increase. The extended bar now has 6 equal segments.',
  '{"A": "55", "B": "60", "C": "70", "D": "100"}',
  'B',
  '20% of 50 is (20/100) × 50 = 10. Adding this to the original 50 gives 60. Visual tip: if the original bar has 5 segments of 10 each (total 50), a 20% increase adds 1 more segment of 10, making 6 segments × 10 = 60.',
  'easy',
  'tape_diagram',
  'Quant Foundations — Visual Math',
  ARRAY['percentages', 'increase', 'tape_diagram', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Percentages',
  'Percentage Decrease',
  'A shirt costs ₹800. During a sale, the price is reduced by 15%. What is the sale price?',
  'Visualize a bar diagram representing ₹800 divided into 20 equal parts. Each part represents ₹40. A 15% discount means removing 3 of those 20 parts (since 15% = 3/20). Mentally cross out the 3 parts at the right end of the bar — 17 equal parts remain.',
  '{"A": "₹680", "B": "₹720", "C": "₹760", "D": "₹640"}',
  'A',
  '15% of 800 = (15/100) × 800 = ₹120. Sale price = 800 − 120 = ₹680. Visual tip: 15% = 3/20. With 20 parts of ₹40 each, remove 3 parts (₹120) and 17 parts remain: 17 × ₹40 = ₹680.',
  'medium',
  'bar_diagram',
  'Quant Foundations — Visual Math',
  ARRAY['percentages', 'decrease', 'discount', 'bar_diagram', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Percentages',
  'Finding the Whole',
  'If 30% of a number is 90, what is the number?',
  'Picture a tape diagram split into 10 equal parts. The 30% portion is shaded and labeled as 90 — this covers the first 3 segments. Each segment therefore represents 30. Now visualize the full bar of 10 segments — 10 × 30 = the whole quantity.',
  '{"A": "270", "B": "120", "C": "300", "D": "200"}',
  'C',
  'If 30% = 90, then 1% = 90 ÷ 30 = 3. Therefore 100% = 3 × 100 = 300. Visual tip: with the bar split into 10 parts, 30% = 3 parts = 90, so 1 part = 30, and 10 parts (the whole) = 300.',
  'medium',
  'tape_diagram',
  'Quant Foundations — Visual Math',
  ARRAY['percentages', 'finding_whole', 'tape_diagram', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Percentages',
  'Converting Ratio to Percentage',
  'In a basket, the ratio of apples to oranges is 3 : 2. What percentage of the fruits are apples?',
  'Imagine a strip divided into 5 equal sections. Color 3 sections to represent apples and leave 2 sections for oranges. The whole strip represents all fruits. Count the apple sections against the total to find the percentage.',
  '{"A": "40%", "B": "60%", "C": "66.67%", "D": "50%"}',
  'B',
  'Total parts = 3 + 2 = 5. Apples = 3 parts out of 5 = 3/5 = 0.60 = 60%. Visual tip: in a 5-segment bar, 3 apple segments out of 5 total = 60%. Each segment = 20%.',
  'easy',
  'tape_diagram',
  'Quant Foundations — Visual Math',
  ARRAY['percentages', 'ratio_to_percent', 'tape_diagram', 'foundational'],
  NOW()
),

-- ===========================================================================
-- SUBSECTION: Ratios & Proportions (6 questions)
-- ===========================================================================

(
  gen_random_uuid(),
  'Ratios & Proportions',
  'Understanding Ratios',
  'The ratio of boys to girls in a class is 4 : 3. If there are 28 boys, how many students are in the class?',
  'Imagine two tape diagrams side by side. Tape A (boys) is split into 4 equal parts. Tape B (girls) is split into 3 equal parts. Each part across both tapes is the same size. Tape A has 4 parts totaling 28, so each part = 7. Now count all parts together.',
  '{"A": "42", "B": "49", "C": "56", "D": "35"}',
  'B',
  'Each part = 28 ÷ 4 = 7 students. Total parts = 4 + 3 = 7. Total students = 7 × 7 = 49. Visual tip: all 7 segments (4 boy + 3 girl) are equal. Find one segment value, then multiply by total segments.',
  'easy',
  'tape_diagram',
  'Quant Foundations — Visual Math',
  ARRAY['ratios', 'tape_diagram', 'part_whole', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Ratios & Proportions',
  'Dividing in a Ratio',
  '₹240 is to be divided between A and B in the ratio of 5 : 3. How much does A get?',
  'Picture a single bar representing ₹240 divided into 8 equal parts (5 + 3). Shade the first 5 parts in one color for A and the remaining 3 parts in another color for B. Each part is the same size. Find the value of one part, then count A''s portions.',
  '{"A": "₹90", "B": "₹120", "C": "₹150", "D": "₹180"}',
  'C',
  'Total parts = 5 + 3 = 8. Value per part = 240 ÷ 8 = ₹30. A gets 5 parts = 5 × 30 = ₹150. Visual tip: the bar has 8 equal segments of ₹30 each. A gets 5 segments = ₹150.',
  'easy',
  'tape_diagram',
  'Quant Foundations — Visual Math',
  ARRAY['ratios', 'division', 'tape_diagram', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Ratios & Proportions',
  'Equivalent Ratios',
  'Which of the following ratios is equivalent to 2 : 5?',
  'Visualize two sets of tape diagrams. The first pair shows Tape A with 2 parts and Tape B with 5 parts. Now imagine scaling both tapes up proportionally — if you double the segments, A becomes 4 and B becomes 10. Think about which option maintains the same visual relationship between the two tapes.',
  '{"A": "4 : 7", "B": "4 : 10", "C": "3 : 6", "D": "10 : 4"}',
  'B',
  '2 : 5 can be scaled by multiplying both terms by 2 to get 4 : 10. Visual tip: imagine Tape A growing from 2 to 4 segments and Tape B from 5 to 10 — both doubled, so the relationship stays the same.',
  'easy',
  'tape_diagram',
  'Quant Foundations — Visual Math',
  ARRAY['ratios', 'equivalent', 'tape_diagram', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Ratios & Proportions',
  'Three-Part Ratio',
  'Concrete is made by mixing cement, sand, and gravel in the ratio 1 : 2 : 3. If 12 buckets of sand are used, how many buckets of cement are needed?',
  'Picture a bar divided into 6 equal segments (1 + 2 + 3). The first segment is cement, the next two are sand, and the last three are gravel. The sand portion covers 2 segments and represents 12 buckets. Visualize each segment being the same size, so each segment = 6 buckets.',
  '{"A": "4", "B": "6", "C": "8", "D": "3"}',
  'B',
  'Sand = 2 parts = 12 buckets, so 1 part = 12 ÷ 2 = 6 buckets. Cement = 1 part = 6 buckets. Visual tip: the 2 sand segments total 12, so each segment = 6. Cement gets 1 segment = 6.',
  'medium',
  'tape_diagram',
  'Quant Foundations — Visual Math',
  ARRAY['ratios', 'three_part', 'tape_diagram', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Ratios & Proportions',
  'Proportion Word Problem',
  'A recipe calls for 3 cups of flour for every 2 cups of sugar. If you use 9 cups of flour, how many cups of sugar do you need?',
  'Imagine two side-by-side tape diagrams. The flour tape (3 parts) aligns with the sugar tape (2 parts). Now picture scaling both: the flour tape triples to 9 parts. Visualize the sugar tape scaling the same way — each of its 2 parts also triples to 6 parts. The proportion between them stays constant.',
  '{"A": "6", "B": "4", "C": "5", "D": "7"}',
  'A',
  'The ratio flour : sugar = 3 : 2. With 9 cups flour (×3), sugar = 2 × 3 = 6 cups. Visual tip: both tapes scale by the same factor. Since flour went from 3 to 9 (×3), sugar goes from 2 to 6 (×3).',
  'easy',
  'tape_diagram',
  'Quant Foundations — Visual Math',
  ARRAY['ratios', 'proportion', 'scaling', 'tape_diagram', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Ratios & Proportions',
  'Cross Multiplication',
  'If 5 notebooks cost ₹175, how much do 8 notebooks cost?',
  'Visualize a double number line. The top line shows number of notebooks: 0 — 5 — 8. The bottom line shows cost in ₹: 0 — 175 — ?. Picture the equal jumps between 0 and 5 on the top line matching the jump to 175 on the bottom. Scale from 5 to 8 by finding the unit price first.',
  '{"A": "₹260", "B": "₹280", "C": "₹300", "D": "₹240"}',
  'B',
  'Cost per notebook = 175 ÷ 5 = ₹35. 8 notebooks = 8 × 35 = ₹280. Visual tip: on the number line, the distance from 5 to 175 means each notebook adds ₹35. From 5 to 8 is 3 more notebooks = ₹105 more, so 175 + 105 = 280.',
  'medium',
  'number_line',
  'Quant Foundations — Visual Math',
  ARRAY['ratios', 'proportion', 'unit_price', 'number_line', 'foundational'],
  NOW()
),

-- ===========================================================================
-- SUBSECTION: Fractions & Decimals (6 questions)
-- ===========================================================================

(
  gen_random_uuid(),
  'Fractions & Decimals',
  'Fraction of a Whole',
  'What fraction of the pizza has been eaten if 3 out of 8 slices are gone?',
  'Picture a pizza (circle) divided into 8 equal slices. Three slices have been removed, leaving a gap in the circle. The removed slices form a group at one side. Visualize the 8 equal slices — each represents 1/8 of the whole pizza.',
  '{"A": "3/5", "B": "3/8", "C": "5/8", "D": "1/8"}',
  'B',
  '3 slices eaten out of 8 total slices = 3/8. Visual tip: the pizza is cut into 8 equal wedges. Counting the missing wedges gives the eaten fraction directly.',
  'easy',
  'pie_chart',
  'Quant Foundations — Visual Math',
  ARRAY['fractions', 'pie_chart', 'visualization', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Fractions & Decimals',
  'Equivalent Fractions',
  'Which fraction is equivalent to 2/3?',
  'Imagine a rectangular bar divided into 3 equal sections, with 2 of them shaded. Now picture dividing each of those 3 sections into 2 smaller parts. The bar now has 6 smaller equal parts, and the shaded area covers 4 of them. Visualize how the shaded portion looks the same but is counted differently.',
  '{"A": "3/4", "B": "4/6", "C": "5/8", "D": "2/6"}',
  'B',
  '2/3 = (2×2)/(3×2) = 4/6. Visual tip: if you split each of the 3 sections into 2, you get 6 total parts. The 2 shaded sections become 4 smaller shaded parts — same area, different count.',
  'easy',
  'bar_diagram',
  'Quant Foundations — Visual Math',
  ARRAY['fractions', 'equivalent', 'bar_diagram', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Fractions & Decimals',
  'Adding Fractions',
  'What is 2/7 + 3/7?',
  'Picture a bar split into 7 equal parts. Shade the first 2 parts in blue. Now shade the next 3 parts in red. Count the total number of shaded parts out of 7. The entire bar represents the whole (7/7).',
  '{"A": "5/14", "B": "6/7", "C": "5/7", "D": "1/7"}',
  'C',
  'When denominators are the same, add the numerators: 2/7 + 3/7 = (2+3)/7 = 5/7. Visual tip: in a 7-part bar, 2 blue parts plus 3 red parts = 5 shaded parts out of 7 = 5/7.',
  'easy',
  'bar_diagram',
  'Quant Foundations — Visual Math',
  ARRAY['fractions', 'addition', 'bar_diagram', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Fractions & Decimals',
  'Fractions on a Number Line',
  'Where does the fraction 3/4 lie on a number line from 0 to 1?',
  'Picture a horizontal number line starting at 0 on the left and ending at 1 on the right. Visualize the space between 0 and 1 divided into 4 equal segments by tick marks at 1/4, 2/4 (which is 1/2), and 3/4. Picture a dot placed at the third tick mark.',
  '{"A": "Midway between 0 and 1", "B": "Three-quarters of the way from 0 to 1", "C": "One-quarter of the way from 0 to 1", "D": "At the halfway point"}',
  'B',
  '3/4 = 0.75, which is three-quarters of the distance from 0 to 1. Visual tip: split the 0-to-1 segment into 4 equal parts. The 3rd tick mark is at 3/4 — three parts from 0, one part from 1.',
  'easy',
  'number_line',
  'Quant Foundations — Visual Math',
  ARRAY['fractions', 'number_line', 'visualization', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Fractions & Decimals',
  'Converting Decimal to Fraction',
  'What is 0.6 expressed as a fraction in simplest form?',
  'Visualize a 10×10 grid with 60 cells shaded out of 100. Now mentally group those 60 shaded cells into columns of 10. You have 6 full columns of 10 shaded. Think about what fraction of the grid is shaded, and reduce it to its simplest form.',
  '{"A": "6/10", "B": "3/5", "C": "60/100", "D": "2/3"}',
  'B',
  '0.6 = 6/10 = 3/5 (dividing numerator and denominator by 2). Visual tip: 60 shaded cells out of 100 = 60/100 = 6/10 = 3/5. Each column of 10 is 1/10 of the grid.',
  'medium',
  'grid',
  'Quant Foundations — Visual Math',
  ARRAY['decimals', 'fractions', 'conversion', 'grid', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Fractions & Decimals',
  'Ordering Decimals',
  'Which decimal is the largest: 0.45, 0.4, 0.405, or 0.5?',
  'Imagine a number line from 0 to 1. Picture tick marks at 0.4, 0.405, 0.45, and 0.5. Visualize 0.4 as 4/10 = 0.400, 0.405 slightly to its right, 0.45 = 0.450 further right, and 0.5 = 0.500 at the far right. Arrange them in your mind by position on the line.',
  '{"A": "0.45", "B": "0.4", "C": "0.405", "D": "0.5"}',
  'D',
  '0.5 = 0.500 is the largest. Comparing: 0.400 < 0.405 < 0.450 < 0.500. Visual tip: on a 0-to-1 number line, 0.5 (the midpoint) is farthest to the right among these values.',
  'easy',
  'number_line',
  'Quant Foundations — Visual Math',
  ARRAY['decimals', 'ordering', 'number_line', 'foundational'],
  NOW()
),

-- ===========================================================================
-- SUBSECTION: Data Basics (6 questions)
-- ===========================================================================

(
  gen_random_uuid(),
  'Data Basics',
  'Reading Bar Charts',
  'In a bar chart showing favorite fruits, the bars for Apple, Banana, and Cherry have heights of 40, 25, and 35 respectively. How many more people chose Apple than Banana?',
  'Picture a bar chart with three vertical bars. The Apple bar reaches the 40 mark on the vertical axis. The Banana bar reaches only 25. The Cherry bar is between them at 35. Visualize the difference in height between the Apple bar and the Banana bar — the gap represents the extra people who chose Apple.',
  '{"A": "5", "B": "10", "C": "15", "D": "25"}',
  'C',
  'Apple = 40, Banana = 25. Difference = 40 − 25 = 15. Visual tip: the Apple bar is taller than the Banana bar by 15 units. Imagine the Banana bar sitting on top of a 15-unit block to match the Apple bar.',
  'easy',
  'bar_diagram',
  'Quant Foundations — Visual Math',
  ARRAY['data', 'bar_chart', 'comparison', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Data Basics',
  'Interpreting Pie Charts',
  'A pie chart shows 4 expenditure categories: Rent (50%), Food (25%), Transport (15%), and Savings (10%). What is the angle of the Rent sector?',
  'Picture a full circle (360°) representing the entire pie chart. The Rent category takes up half of the circle — imagine a vertical line splitting the circle into left and right halves, with the left half entirely shaded for Rent. Visualize that half of 360° equals the angle at the center.',
  '{"A": "90°", "B": "180°", "C": "150°", "D": "200°"}',
  'B',
  'Rent = 50% of the whole. A full circle = 360°. 50% of 360° = 0.5 × 360 = 180°. Visual tip: 50% means half the pie. Half a circle is 180° — a straight line through the center.',
  'easy',
  'pie_chart',
  'Quant Foundations — Visual Math',
  ARRAY['data', 'pie_chart', 'angles', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Data Basics',
  'Averages from Data',
  'The heights of 5 students are 150 cm, 155 cm, 160 cm, 165 cm, and 170 cm. What is the mean height?',
  'Imagine a bar diagram with 5 bars of increasing height: 150, 155, 160, 165, and 170. Visualize the bars forming a staircase. Now picture leveling out the total height evenly across all 5 bars — the peaks of the taller bars fill in the gaps of the shorter ones. The leveled height is the mean.',
  '{"A": "155 cm", "B": "160 cm", "C": "162 cm", "D": "158 cm"}',
  'B',
  'Sum = 150 + 155 + 160 + 165 + 170 = 800. Mean = 800 ÷ 5 = 160 cm. Visual tip: the heights are symmetric around 160 (150+170=320, 155+165=320, and 160 is the middle). The balancing point of the data is 160 cm.',
  'easy',
  'bar_diagram',
  'Quant Foundations — Visual Math',
  ARRAY['data', 'average', 'mean', 'bar_diagram', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Data Basics',
  'Range and Spread',
  'In the dataset {12, 15, 18, 22, 28, 35}, what is the range?',
  'Visualize a number line covering from 0 to 40. Plot dots at 12, 15, 18, 22, 28, and 35. Picture a bracket spanning from the leftmost dot (12) to the rightmost dot (35). The length of that bracket — the distance between the smallest and largest values — is the range.',
  '{"A": "20", "B": "23", "C": "28", "D": "35"}',
  'B',
  'Range = Largest − Smallest = 35 − 12 = 23. Visual tip: on the number line, the data spreads from 12 to 35. The span between them is 23 units.',
  'easy',
  'number_line',
  'Quant Foundations — Visual Math',
  ARRAY['data', 'range', 'spread', 'number_line', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Data Basics',
  'Finding the Median',
  'Find the median of: 7, 12, 5, 9, 15, 8, 10.',
  'Picture the numbers as dots scattered on a number line from 0 to 20. Now mentally arrange them in order from smallest to largest, like beads on a wire: 5, 7, 8, 9, 10, 12, 15. Visualize pinching the middle bead — that is the median.',
  '{"A": "8", "B": "9", "C": "10", "D": "7"}',
  'B',
  'Ordered: 5, 7, 8, 9, 10, 12, 15 (7 numbers). The 4th value is the median = 9. Visual tip: on the ordered number line, 9 is the middle value with 3 numbers on each side.',
  'medium',
  'number_line',
  'Quant Foundations — Visual Math',
  ARRAY['data', 'median', 'number_line', 'foundational'],
  NOW()
),

(
  gen_random_uuid(),
  'Data Basics',
  'Simple Probability',
  'A bag contains 4 red marbles, 3 blue marbles, and 5 green marbles. What is the probability of randomly picking a blue marble?',
  'Picture a bar split into 12 equal segments (4 + 3 + 5). Shade 4 segments red, 3 segments blue, and 5 segments green. Visualize reaching into the bag and grabbing one segment at random. The chance of landing on a blue segment is the number of blue segments divided by the total.',
  '{"A": "1/4", "B": "1/3", "C": "1/6", "D": "3/5"}',
  'A',
  'Total marbles = 4 + 3 + 5 = 12. Blue = 3. Probability = 3/12 = 1/4. Visual tip: with 12 equal segments in the bar, 3 are blue. That''s 3 out of 12 = 1/4 of the bar.',
  'easy',
  'bar_diagram',
  'Quant Foundations — Visual Math',
  ARRAY['data', 'probability', 'bar_diagram', 'foundational'],
  NOW()
)

ON CONFLICT DO NOTHING;

-- ============================================================================
-- Verify the seed data
-- ============================================================================
-- SELECT subsection, COUNT(*) AS question_count
-- FROM visual_math_questions
-- GROUP BY subsection
-- ORDER BY subsection;
