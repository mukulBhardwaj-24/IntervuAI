import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section
      className="fade-up"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1rem',
        marginTop: '1rem'
      }}
    >
      <article className="card" style={{ padding: '1.5rem' }}>
        <p className="mono" style={{ color: 'var(--accent-strong)', marginTop: 0 }}>
          Interview Prep System
        </p>
        <h1 style={{ margin: '0.2rem 0 0.8rem', fontSize: 'clamp(1.7rem, 3vw, 2.5rem)' }}>
          One platform for coding rounds, collaborative interviews, and AI guidance.
        </h1>
        <p className="muted" style={{ lineHeight: 1.7 }}>
          Your MVP includes problem practice, interview lobby, shared room layout, and JWT-cookie auth flow.
          Backend endpoints can be connected later without changing page-level UX.
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" to="/register">
            Create Account
          </Link>
          <Link className="btn" to="/practice">
            Open Practice Arena
          </Link>
          <Link className="btn" to="/interview">
            Start Interview Flow
          </Link>
        </div>
      </article>

      <article className="card" style={{ padding: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>MVP Scope</h2>
        <ul className="muted" style={{ margin: 0, paddingLeft: '1rem', lineHeight: 1.8 }}>
          <li>Cookie-first auth state with protected routes</li>
          <li>Problem bank with filters and code panel</li>
          <li>Interview lobby with create/join flow</li>
          <li>Integrated room layout for video + coding + chat</li>
          <li>Mocked APIs for fast frontend iteration</li>
        </ul>
      </article>
    </section>
  );
}
