export const problems = [
  {
    id: 'p1',
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Array', 'HashMap'],
    statement:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    sampleInput: 'nums = [2,7,11,15], target = 9',
    sampleOutput: '[0,1]'
  },
  {
    id: 'p2',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    tags: ['String', 'Sliding Window'],
    statement:
      'Given a string s, find the length of the longest substring without repeating characters.',
    sampleInput: 's = "abcabcbb"',
    sampleOutput: '3'
  },
  {
    id: 'p3',
    title: 'Merge K Sorted Lists',
    difficulty: 'Hard',
    tags: ['Heap', 'Linked List'],
    statement:
      'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list.',
    sampleInput: 'lists = [[1,4,5],[1,3,4],[2,6]]',
    sampleOutput: '[1,1,2,3,4,4,5,6]'
  },
  {
    id: 'p4',
    title: 'Binary Search',
    difficulty: 'Easy',
    tags: ['Binary Search'],
    statement:
      'Given an array of integers nums sorted in ascending order, and an integer target, write a function to search target in nums.',
    sampleInput: 'nums = [-1,0,3,5,9,12], target = 9',
    sampleOutput: '4'
  }
];

export const aiChecklist = [
  'Scanning code structure and naming',
  'Estimating time and space complexity',
  'Checking edge case coverage',
  'Reviewing readability and modularity',
  'Preparing final interview feedback'
];
