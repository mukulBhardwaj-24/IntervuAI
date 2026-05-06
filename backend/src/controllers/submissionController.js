import Submission from '../models/Submission.js';
import Problem from '../models/Problem.js';

export async function createSubmission(req, res, next) {
  try {
    const { language, source, stdin = '', problemId = '', result = null } = req.body || {};
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    if (!language || !source) {
      return res.status(400).json({
        success: false,
        message: 'language and source are required'
      });
    }

    if (!problemId) {
      return res.status(400).json({
        success: false,
        message: 'problemId is required'
      });
    }

    // Resolve problemId: lookup Problem by 'id' field to get the MongoDB _id
    let resolvedProblemId = problemId;
    try {
      const problem = await Problem.findOne({ id: problemId });
      if (problem) {
        resolvedProblemId = problem._id;
      }
    } catch {
      // If lookup fails, try using problemId as-is (might be an ObjectId already)
    }

    const submission = await Submission.create({
      userId,
      language,
      source,
      stdin,
      problemId: resolvedProblemId,
      result
    });

    return res.status(201).json({
      success: true,
      submission
    });
  } catch (error) {
    return next(error);
  }
}

export async function getUserSubmissions(req, res, next) {
  try {
    const { userId } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const submissions = await Submission.find({ userId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .lean();

    const total = await Submission.countDocuments({ userId });

    return res.json({
      submissions,
      total,
      limit: Number(limit),
      skip: Number(skip)
    });
  } catch (error) {
    return next(error);
  }
}

export async function getSubmissionById(req, res, next) {
  try {
    const { id } = req.params;
    const submission = await Submission.findById(id).lean();

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    return res.json(submission);
  } catch (error) {
    return next(error);
  }
}

export async function getSubmissionStats(req, res, next) {
  try {
    const { userId } = req.params;

    // Ensure userId is treated as ObjectId in aggregation
    let userIdFilter = userId;
    try {
      // Try to parse as ObjectId if it looks like one
      const mongoose = await import('mongoose');
      userIdFilter = new mongoose.Types.ObjectId(userId);
    } catch {
      // Fallback to string if not a valid ObjectId
    }

    const stats = await Submission.aggregate([
      { $match: { userId: userIdFilter } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          accepted: [
            { $match: { 'result.status.id': 3 } },
            { $count: 'count' }
          ],
          byLanguage: [
            {
              $group: {
                _id: '$language',
                count: { $sum: 1 }
              }
            }
          ],
          byProblem: [
            {
              $group: {
                _id: '$problemId',
                count: { $sum: 1 },
                accepted: {
                  $sum: { $cond: [{ $eq: ['$result.status.id', 3] }, 1, 0] }
                }
              }
            }
          ]
        }
      }
    ]);

    const result = {
      totalSubmissions: stats[0]?.total[0]?.count || 0,
      acceptedCount: stats[0]?.accepted[0]?.count || 0,
      byLanguage: stats[0]?.byLanguage || [],
      byProblem: stats[0]?.byProblem || []
    };

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}
