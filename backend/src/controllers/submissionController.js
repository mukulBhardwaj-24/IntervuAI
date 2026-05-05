import Submission from '../models/Submission.js';

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

    const stats = await Submission.aggregate([
      { $match: { userId } },
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
