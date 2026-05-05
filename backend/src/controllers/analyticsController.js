import Submission from '../models/Submission.js';

export async function getPlatformAnalytics(req, res, next) {
  try {
    const lastNDays = 7;
    const since = new Date(Date.now() - lastNDays * 24 * 60 * 60 * 1000);

    const agg = await Submission.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          accepted: [
            { $match: { 'result.status.id': 3 } },
            { $count: 'count' }
          ],
          users: [
            { $group: { _id: '$userId' } },
            { $count: 'count' }
          ],
          topProblems: [
            { $group: { _id: '$problemId', count: { $sum: 1 }, accepted: { $sum: { $cond: [{ $eq: ['$result.status.id', 3] }, 1, 0] } } } },
            { $sort: { count: -1 } },
            { $limit: 8 }
          ],
          recentByDay: [
            { $match: { createdAt: { $gte: since } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    const result = {
      totalSubmissions: agg[0]?.total[0]?.count || 0,
      acceptedCount: agg[0]?.accepted[0]?.count || 0,
      uniqueUsers: agg[0]?.users[0]?.count || 0,
      topProblems: agg[0]?.topProblems || [],
      recentByDay: agg[0]?.recentByDay || []
    };

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}
