import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ maxWidth: '430px', margin: '2rem auto' }}>
      <form className="card fade-up" onSubmit={handleSubmit} style={{ padding: '1.2rem' }}>
        <h1 style={{ marginTop: 0, fontSize: '1.6rem' }}>Welcome Back</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Login with email/password. Session is handled via cookies.
        </p>

        <label className="muted" htmlFor="login-email">
          Email
        </label>
        <input
          className="input"
          id="login-email"
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          placeholder="you@example.com"
          required
          type="email"
          value={form.email}
        />

        <label className="muted" htmlFor="login-password" style={{ marginTop: '0.8rem', display: 'block' }}>
          Password
        </label>
        <input
          className="input"
          id="login-password"
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          placeholder="Min 8 chars"
          required
          type="password"
          value={form.password}
        />

        {error && (
          <p style={{ color: 'var(--danger)', marginBottom: 0, marginTop: '0.8rem' }}>
            {error}
          </p>
        )}

        <button className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }} type="submit">
          {loading ? 'Signing in...' : 'Login'}
        </button>

        <p className="muted" style={{ marginBottom: 0 }}>
          New user? <Link style={{ color: 'var(--accent)' }} to="/register">Create account</Link>
        </p>
      </form>
    </section>
  );
}
