import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const activeStyle = ({ isActive }) => ({
  color: isActive ? 'var(--accent)' : 'var(--text-muted)'
});

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <header
      className="card"
      style={{
        position: 'sticky',
        top: '0.75rem',
        zIndex: 40,
        margin: '0.75rem auto 0',
        width: 'min(1260px, 96vw)',
        padding: '0.75rem 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <Link className="mono" style={{ fontWeight: 700, letterSpacing: '0.02em' }} to="/">
        InterviewForge
      </Link>

      <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <NavLink style={activeStyle} to="/practice">
          Practice
        </NavLink>
        <NavLink style={activeStyle} to="/interview">
          Interview Room
        </NavLink>
        <NavLink style={activeStyle} to="/dashboard">
          Dashboard
        </NavLink>
      </nav>

      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        {isAuthenticated ? (
          <>
            <span className="muted" style={{ fontSize: '0.9rem' }}>
              {user?.name}
            </span>
            <button className="btn" onClick={handleLogout} type="button">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className="btn" to="/login">
              Login
            </Link>
            <Link className="btn btn-primary" to="/register">
              Start
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
