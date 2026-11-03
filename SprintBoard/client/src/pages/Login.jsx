import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authHero from '../assets/auth-hero.jpg';

export default function Login() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-bg" aria-hidden="true">
        <img src={authHero} alt="" />
        <div className="auth-bg-scrim" />
      </div>

      <div className="auth-masthead">
        <p className="auth-masthead-brand">SprintBoard</p>
        <h1>Ship clearer sprints with a shared source of truth.</h1>
        <p>Track projects, priorities, and live status changes across your team.</p>
      </div>

      <div className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <p className="auth-brand">Sign in</p>
            <h2>Welcome back</h2>
            <p className="muted">Continue managing your issues.</p>
          </div>

          {error ? <div className="alert alert-error">{error}</div> : null}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="auth-switch">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
