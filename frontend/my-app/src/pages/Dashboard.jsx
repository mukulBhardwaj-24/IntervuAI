import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSubmissionStats, getUserSubmissions } from '../services/submissionService';
import { getAnalytics } from '../services/analyticsService';

const fallbackStats = [
  { label: 'Problems Solved', value: '42' },
  { label: 'Interview Sessions', value: '11' },
  { label: 'Accuracy', value: '78%' },
  { label: 'Current Streak', value: '7 days' }
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getBadgeColor(statusId) {
  if (statusId === 3) return '#4ade80';
  if (statusId === 4) return '#ef4444';
  return '#fbbf24';
}

export default function Dashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);

  const userId = useMemo(() => {
    if (typeof window === 'undefined') return 'guest';
    return window.localStorage.getItem('ips-account-user-id') || 'guest';
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');

        const [history, stats, platform] = await Promise.all([
          getUserSubmissions(userId, 6, 0),
          getSubmissionStats(userId),
          getAnalytics()
        ]);

        if (!mounted) return;

        setSubmissions(history.submissions || []);
        setSummary(stats || null);
        setAnalytics(platform || null);
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Could not load dashboard data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const liveStats = summary
    ? [
        { label: 'Problems Solved', value: String(summary.acceptedCount || 0) },
        { label: 'Total Submissions', value: String(summary.totalSubmissions || 0) },
        { label: 'Accepted Rate', value: summary.totalSubmissions ? `${Math.round((summary.acceptedCount / summary.totalSubmissions) * 100)}%` : '0%' },
        { label: 'Current Streak', value: '7 days' }
      ]
    : fallbackStats;

  return (
    <section className="fade-up" style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
      <header className="card" style={{ padding: '1rem', display: 'grid', gap: '0.45rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0 }}>Dashboard</h1>
            <p className="muted" style={{ margin: '0.35rem 0 0' }}>
              Your recent submission history and performance snapshot.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link className="btn" to="/practice">Open Practice</Link>
            <Link className="btn btn-primary" to="/interview">Start Interview</Link>
          </div>
        </div>
        <p className="mono muted" style={{ margin: 0, fontSize: '0.76rem' }}>
          History is tied to local user ID: {userId}
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.65rem' }}>
        {analytics ? (
          [
            { label: 'Platform Submissions', value: String(analytics.totalSubmissions || 0) },
            { label: 'Platform Accepted', value: String(analytics.acceptedCount || 0) },
            { label: 'Active Users', value: String(analytics.uniqueUsers || 0) },
            { label: 'Your Accepted', value: String(summary?.acceptedCount || 0) }
          ].map((item) => (
            <article className="card" key={item.label} style={{ padding: '0.8rem' }}>
              <p className="muted" style={{ margin: 0 }}>{item.label}</p>
              <h2 className="mono" style={{ margin: '0.35rem 0 0', fontSize: '1.45rem' }}>{item.value}</h2>
            </article>
          ))
        ) : (
          liveStats.map((item) => (
            <article className="card" key={item.label} style={{ padding: '0.8rem' }}>
              <p className="muted" style={{ margin: 0 }}>{item.label}</p>
              <h2 className="mono" style={{ margin: '0.35rem 0 0', fontSize: '1.45rem' }}>{item.value}</h2>
            </article>
          ))
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.65rem' }}>
        <article className="card" style={{ padding: '0.9rem' }}>
          <h3 style={{ marginTop: 0 }}>Readiness Notes</h3>
          <ul className="muted" style={{ margin: 0, paddingLeft: '1rem', lineHeight: 1.8 }}>
            <li>Strong in arrays and binary search</li>
            <li>Need faster explanation for dynamic programming</li>
            <li>Book 2 practice interview sessions this week</li>
          </ul>
        </article>

        <article className="card" style={{ padding: '0.9rem' }}>
          <h3 style={{ marginTop: 0 }}>Recent Submissions</h3>
          {error ? (
            <p className="mono" style={{ color: '#ef4444', margin: 0 }}>{error}</p>
          ) : loading ? (
            <p className="muted" style={{ margin: 0 }}>Loading submission history...</p>
          ) : submissions.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>No submissions yet. Run a problem to build history.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.55rem' }}>
              {submissions.map((submission) => {
                const status = submission?.result?.status;
                return (
                  <div
                    key={submission._id}
                    className="card"
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      borderLeft: `4px solid ${getBadgeColor(status?.id)}`,
                      display: 'grid',
                      gap: '0.35rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <strong>{submission.problemId || 'Practice Run'}</strong>
                      <span className="mono" style={{ color: getBadgeColor(status?.id), fontSize: '0.75rem', fontWeight: 700 }}>
                        {status?.description || 'Completed'}
                      </span>
                    </div>
                    <p className="mono muted" style={{ margin: 0, fontSize: '0.77rem' }}>
                      {submission.language} · {formatDate(submission.createdAt)}
                    </p>
                    <p className="mono" style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {submission.result?.stdout || submission.result?.stderr || 'No console output'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
