/* Seed script for problems collection
   Usage: node seed.js
*/
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Problem from './src/models/Problem.js';

async function run() {
  const mongo = process.env.MONGODB_URI || 'mongodb://localhost:27017/interview_prep_system';
  await mongoose.connect(mongo, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB for seeding');

  // Clear collection
  await Problem.deleteMany({});
  console.log('Cleared Problem collection');

  const problems = [
    {
      id: 'g001',
      title: 'Two Sum',
      difficulty: 'Easy',
      tags: ['Array', 'Hash Table'],
      statement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. Return the indices in any order. Constraints: 2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9.',
      sampleInput: '[2,7,11,15], target = 9',
      sampleOutput: '[0,1]'
    },
    {
      id: 'g002',
      title: 'Merge Intervals',
      difficulty: 'Medium',
      tags: ['Array', 'Sorting'],
      statement: 'Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input. Constraints: 1 <= intervals.length <= 10^4, intervals[i].length == 2.',
      sampleInput: '[[1,3],[2,6],[8,10],[15,18]]',
      sampleOutput: '[[1,6],[8,10],[15,18]]'
    },
    {
      id: 'g003',
      title: 'Valid Parentheses',
      difficulty: 'Easy',
      tags: ['Stack', 'String'],
      statement: 'Given a string s containing just the characters "()[]{}", determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets; Open brackets must be closed in the correct order. Constraints: 1 <= s.length <= 10^4.',
      sampleInput: '"()[]{}"',
      sampleOutput: 'true'
    },
    {
      id: 'g004',
      title: 'Trapping Rain Water',
      difficulty: 'Hard',
      tags: ['Array', 'Two Pointers', 'Dynamic Programming'],
      statement: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining. Constraints: n == height.length, 1 <= n <= 2 * 10^4, 0 <= height[i] <= 10^5.',
      sampleInput: '[0,1,0,2,1,0,1,3,2,1,2,1]',
      sampleOutput: '6'
    },
    {
      id: 'g005',
      title: 'Longest Increasing Subsequence',
      difficulty: 'Medium',
      tags: ['Dynamic Programming', 'Binary Search'],
      statement: 'Given an integer array nums, return the length of the longest strictly increasing subsequence. Constraints: 1 <= nums.length <= 2500, -10^4 <= nums[i] <= 10^4.',
      sampleInput: '[10,9,2,5,3,7,101,18]',
      sampleOutput: '4'
    },
    {
      id: 'g006',
      title: 'Binary Tree Inorder Traversal',
      difficulty: 'Easy',
      tags: ['Tree', 'Stack'],
      statement: 'Given the root of a binary tree, return the inorder traversal of its nodes values. Constraints: The number of nodes in the tree is in the range [0, 100].',
      sampleInput: '[1,null,2,3]',
      sampleOutput: '[1,3,2]'
    },
    {
      id: 'g007',
      title: 'Lowest Common Ancestor of a Binary Search Tree',
      difficulty: 'Easy',
      tags: ['Tree', 'Binary Search Tree'],
      statement: 'Given a binary search tree (BST), find the lowest common ancestor (LCA) of two given nodes in the BST. The definition of LCA: The lowest node that has both nodes as descendants. Constraints: The number of nodes is in the range [2, 10^5].',
      sampleInput: 'root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8',
      sampleOutput: '6'
    },
    {
      id: 'g008',
      title: 'Kth Largest Element in an Array',
      difficulty: 'Medium',
      tags: ['Array', 'Divide and Conquer', 'Heap'],
      statement: 'Find the kth largest element in an unsorted array. Note that it is the kth largest element in the sorted order, not the kth distinct element. Constraints: 1 <= k <= nums.length <= 10^5.',
      sampleInput: '[3,2,1,5,6,4], k = 2',
      sampleOutput: '5'
    },
    {
      id: 'g009',
      title: 'Longest Palindromic Substring',
      difficulty: 'Medium',
      tags: ['String', 'Dynamic Programming'],
      statement: 'Given a string s, return the longest palindromic substring in s. Constraints: 1 <= s.length <= 1000.',
      sampleInput: '"babad"',
      sampleOutput: '"bab"'
    },
    {
      id: 'g010',
      title: 'Container With Most Water',
      difficulty: 'Medium',
      tags: ['Array', 'Two Pointers'],
      statement: 'Given n non-negative integers a1, a2, ..., an , where each represents a point at coordinate (i, ai). n vertical lines are drawn such that the two endpoints of line i are at (i, ai) and (i, 0). Find two lines, which together with the x-axis forms a container, such that the container contains the most water. Constraints: n == height.length, 2 <= n <= 10^5.',
      sampleInput: '[1,8,6,2,5,4,8,3,7]',
      sampleOutput: '49'
    }
  ];

  await Problem.insertMany(problems);
  console.log('Inserted', problems.length, 'problems');

  await mongoose.disconnect();
  console.log('Disconnected');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
