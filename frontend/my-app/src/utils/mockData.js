const difficulties = ['Easy', 'Medium', 'Hard'];
const tagPool = [
  'Array', 'String', 'HashMap', 'Two Pointers', 'Sliding Window', 'DP', 'Greedy', 'Graph', 'Tree',
  'Binary Search', 'Heap', 'Linked List', 'Math', 'Backtracking', 'Geometry', 'Sort', 'Search'
];

function pickTags(i) {
  const base = [tagPool[i % tagPool.length]];
  if (i % 3 === 0) base.push('Greedy');
  if (i % 5 === 0) base.push('DP');
  if (i % 7 === 0) base.push('Graph');
  return Array.from(new Set(base)).slice(0, 3);
}

function makeProblem(i) {
  const id = `g${String(i).padStart(3, '0')}`;
  const difficulty = difficulties[i % difficulties.length];
  const tags = pickTags(i);
  return {
    id,
    title: `${difficulty} Problem ${i}: ${tags.join(' & ')}`,
    difficulty,
    tags,
    statement: `This is a generated ${difficulty} problem (#${i}). Implement an efficient solution for ${tags.join(' and ')}.`,
    sampleInput: `example input ${i}`,
    sampleOutput: `example output ${i}`
  };
}

export const problems = Array.from({ length: 60 }, (_v, idx) => makeProblem(idx + 1));

export const aiChecklist = [
  'Scanning code structure and naming',
  'Estimating time and space complexity',
  'Checking edge case coverage',
  'Reviewing readability and modularity',
  'Preparing final interview feedback'
];

export default problems;
