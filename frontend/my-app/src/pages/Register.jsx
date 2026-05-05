import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ maxWidth: '460px', margin: '2rem auto' }}>
      <form className="card fade-up" onSubmit={handleSubmit} style={{ padding: '1.2rem' }}>
        <h1 style={{ marginTop: 0, fontSize: '1.6rem' }}>Create Account</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Create your account to save progress and join interview rooms.
        </p>

        <label className="muted" htmlFor="register-name">
          Full Name
        </label>
        <input
          className="input"
          id="register-name"
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Enter your name here"
          required
          type="text"
          value={form.name}
        />

        <label className="muted" htmlFor="register-email" style={{ marginTop: '0.8rem', display: 'block' }}>
          Email
        </label>
        <input
          className="input"
          id="register-email"
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          placeholder="you@example.com"
          required
          type="email"
          value={form.email}
        />

        <label className="muted" htmlFor="register-password" style={{ marginTop: '0.8rem', display: 'block' }}>
          Password
        </label>
        <input
          className="input"
          id="register-password"
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
          {loading ? 'Creating...' : 'Register'}
        </button>

        <p className="muted" style={{ marginBottom: 0 }}>
          Already have an account? <Link style={{ color: 'var(--accent)' }} to="/login">Login</Link>
        </p>
      </form>
    </section>
  );
}
