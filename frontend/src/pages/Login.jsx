import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Flame, LogIn } from 'lucide-react';
import { authAPI } from '../services/api';
import { showToast } from '../utils/toast';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const setField = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    // Clear that specific field error on change
    if (errors[key] || errors.form) setErrors({});
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const res = await authAPI.login({ email: form.email, password: form.password });
      const { access, refresh, user } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      // Call onLogin first — React will re-render and switch to authenticated routes
      onLogin(user);
      showToast('Welcome back, ' + (user.full_name || 'there') + '!', 'success');
      // navigate after state update is queued
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Invalid email or password';
      if (data?.detail) msg = data.detail;
      else if (data?.non_field_errors) msg = data.non_field_errors[0];
      else if (data?.email) msg = Array.isArray(data.email) ? data.email[0] : data.email;
      setErrors({ form: msg });
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (ev) => {
    ev.preventDefault();
    if (!forgotEmail.trim()) {
      showToast('Please enter your email address', 'error');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(forgotEmail)) {
      showToast('Enter a valid email address', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await authAPI.forgotPassword({ email: forgotEmail });
      showToast(res.data.message || 'Reset instructions sent to your email', 'success');
      setForgotMode(false);
      setForgotEmail('');
    } catch (err) {
      const msg = err.response?.data?.email?.[0] || err.response?.data?.detail || 'Something went wrong';
      showToast(msg, 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  /* ─── Forgot Password view ─────────────────────────── */
  if (forgotMode) {
    return (
      <div className="auth-page">
        <div className="auth-card fade-in" style={{ maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', marginBottom: '14px',
            }}>
              <Flame size={24} color="white" />
            </div>
            <h2 style={{ fontSize: '22px', marginBottom: '6px' }}>Forgot Password</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Enter your email and we'll send reset instructions
            </p>
          </div>

          <form onSubmit={handleForgot} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email" className="form-input" placeholder="you@example.com"
                value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                autoFocus
              />
            </div>

            <button type="submit" className="btn-primary" disabled={forgotLoading}
              style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              {forgotLoading ? <span className="spinner" /> : 'Send Reset Link'}
            </button>

            <button type="button" className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { setForgotMode(false); setForgotEmail(''); }}>
              ← Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ─── Login view ───────────────────────────────────── */
  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            marginBottom: '14px', boxShadow: '0 0 24px rgba(59,130,246,0.35)',
          }}>
            <Flame size={26} color="white" />
          </div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Sign in to continue to AuraFit</p>
        </div>

        {/* API-level error banner */}
        {errors.form && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px', padding: '10px 14px', fontSize: '13px',
            color: '#f87171', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '16px' }}>⚠</span>
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email" className="form-input" placeholder="you@example.com"
              value={form.email} autoComplete="email"
              onChange={e => setField('email', e.target.value)}
              style={errors.email ? { borderColor: '#ef4444' } : {}}
            />
            {errors.email && (
              <span style={{ fontSize: '12px', color: '#f87171', marginTop: '2px' }}>
                {errors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} className="form-input"
                placeholder="••••••••" value={form.password}
                autoComplete="current-password"
                onChange={e => setField('password', e.target.value)}
                style={{ paddingRight: '42px', ...(errors.password ? { borderColor: '#ef4444' } : {}) }}
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span style={{ fontSize: '12px', color: '#f87171', marginTop: '2px' }}>
                {errors.password}
              </span>
            )}
          </div>

          {/* Remember + Forgot */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)',
            }}>
              <input
                type="checkbox" checked={form.remember}
                onChange={e => setForm(f => ({ ...f, remember: e.target.checked }))}
                style={{ accentColor: '#3b82f6', width: '14px', height: '14px' }}
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => setForgotMode(true)}
              style={{
                background: 'none', border: 'none', color: '#3b82f6',
                cursor: 'pointer', fontSize: '13px', fontFamily: 'Inter, sans-serif',
              }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px' }}
          >
            {loading
              ? <><span className="spinner" /><span style={{ marginLeft: '8px' }}>Signing in...</span></>
              : <><LogIn size={16} /> Sign In</>
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
