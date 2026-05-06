import Problem from '../models/Problem.js';

export async function getProblems(req, res, next) {
  try {
    const { difficulty } = req.query;
    const filter = {};
    if (difficulty) {
      filter.difficulty = difficulty;
    }

    const problems = await Problem.find(filter).sort({ id: 1 }).lean();
    return res.json({ problems });
  } catch (error) {
    return next(error);
  }
}

export async function getProblemById(req, res, next) {
  try {
    const { id } = req.params;
    const problem = await Problem.findOne({ id }).lean();
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    return res.json({ problem });
  } catch (error) {
    return next(error);
  }
}
