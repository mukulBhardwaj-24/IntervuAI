import { Link } from 'react-router-dom';

const stats = [
  { label: 'Problems Solved', value: '42' },
  { label: 'Interview Sessions', value: '11' },
  { label: 'Accuracy', value: '78%' },
  { label: 'Current Streak', value: '7 days' }
];

export default function Dashboard() {
  return (
    <section className="fade-up" style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
      <header className="card" style={{ padding: '1rem' }}>
        <h1 style={{ marginTop: 0 }}>Dashboard</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Mid-eval MVP status view. Analytics are mocked and ready for backend wiring later.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.65rem' }}>
        {stats.map((item) => (
          <article className="card" key={item.label} style={{ padding: '0.8rem' }}>
            <p className="muted" style={{ margin: 0 }}>{item.label}</p>
            <h2 className="mono" style={{ margin: '0.35rem 0 0', fontSize: '1.45rem' }}>{item.value}</h2>
          </article>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.65rem' }}>
        <article className="card" style={{ padding: '0.9rem' }}>
          <h3 style={{ marginTop: 0 }}>Readiness Notes</h3>
          <ul className="muted" style={{ margin: 0, paddingLeft: '1rem', lineHeight: 1.8 }}>
            <li>Strong in arrays and binary search</li>
            <li>Need faster explanation for dynamic programming</li>
            <li>Schedule 2 mock interviews this week</li>
          </ul>
        </article>

        <article className="card" style={{ padding: '0.9rem' }}>
          <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link className="btn" to="/practice">Open Practice</Link>
            <Link className="btn btn-primary" to="/interview">Start Interview</Link>
          </div>
        </article>
      </div>
    </section>
  );
}
