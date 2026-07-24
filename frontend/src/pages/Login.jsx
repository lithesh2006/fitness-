import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Activity, LogIn } from 'lucide-react';
import { authAPI } from '../services/api';
import { showToast } from '../utils/toast';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form,         setForm]         = useState({ email: '', password: '', remember: false });
  const [showPw,       setShowPw]       = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState({});
  const [forgotMode,   setForgotMode]   = useState(false);
  const [forgotEmail,  setForgotEmail]  = useState('');
  const [forgotLoading,setForgotLoading]= useState(false);

  const setField = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key] || errors.form) setErrors({});
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim())                    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = 'Enter a valid email';
    if (!form.password)                        e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setErrors({});
    try {
      const res = await authAPI.login({ email: form.email, password: form.password });
      const { access, refresh, user } = res.data;
      localStorage.setItem('access_token',  access);
      localStorage.setItem('refresh_token', refresh);
      onLogin(user);
      showToast('Welcome back, ' + (user.full_name || 'there') + '!', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Invalid email or password';
      if (data?.detail)            msg = data.detail;
      else if (data?.non_field_errors) msg = data.non_field_errors[0];
      else if (data?.email)        msg = Array.isArray(data.email) ? data.email[0] : data.email;
      setErrors({ form: msg });
      showToast(msg, 'error');
    } finally { setLoading(false); }
  };

  const handleForgot = async (ev) => {
    ev.preventDefault();
    if (!forgotEmail.trim() || !/\S+@\S+\.\S+/.test(forgotEmail)) {
      showToast('Enter a valid email address', 'error'); return;
    }
    setForgotLoading(true);
    try {
      const res = await authAPI.forgotPassword({ email: forgotEmail });
      showToast(res.data.message || 'Reset instructions sent!', 'success');
      setForgotMode(false); setForgotEmail('');
    } catch (err) {
      showToast(err.response?.data?.email?.[0] || err.response?.data?.detail || 'Something went wrong', 'error');
    } finally { setForgotLoading(false); }
  };

  /* ── Forgot Password ── */
  if (forgotMode) {
    return (
      <div className="auth-page">
        <div className="auth-card fade-in" style={{ maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '10px', background: 'var(--accent)', marginBottom: '14px' }}>
              <Activity size={24} color="white" />
            </div>
            <h2 style={{ fontSize: '20px', marginBottom: '6px' }}>Forgot Password</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>We'll send reset instructions to your email</p>
          </div>
          <form onSubmit={handleForgot} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="you@example.com"
                value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} autoFocus />
            </div>
            <button type="submit" className="btn-primary" disabled={forgotLoading} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              {forgotLoading ? <span className="spinner" /> : 'Send Reset Link'}
            </button>
            <button type="button" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { setForgotMode(false); setForgotEmail(''); }}>
              ← Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Login ── */
  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: 'var(--accent)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--accent)', lineHeight: 1 }}>FITNESS</div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Tracker</div>
            </div>
          </div>
          <h1 style={{ fontSize: '22px', marginBottom: '4px' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Sign in to continue</p>
        </div>

        {errors.form && (
          <div style={{ background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.3)', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#ef9a9a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠ {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" placeholder="you@example.com"
              value={form.email} autoComplete="email"
              onChange={e => setField('email', e.target.value)}
              style={errors.email ? { borderColor: 'var(--accent)' } : {}} />
            {errors.email && <span style={{ fontSize: '11px', color: 'var(--accent)' }}>{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} className="form-input"
                placeholder="••••••••" value={form.password} autoComplete="current-password"
                onChange={e => setField('password', e.target.value)}
                style={{ paddingRight: '40px', ...(errors.password ? { borderColor: 'var(--accent)' } : {}) }}
              />
              <button type="button" onClick={() => setShowPw(s => !s)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <span style={{ fontSize: '11px', color: 'var(--accent)' }}>{errors.password}</span>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={form.remember} onChange={e => setForm(f => ({ ...f, remember: e.target.checked }))}
                style={{ accentColor: 'var(--accent)', width: '13px', height: '13px' }} />
              Remember me
            </label>
            <button type="button" onClick={() => setForgotMode(true)}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
              Forgot password?
            </button>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '14px', marginTop: '4px' }}>
            {loading
              ? <><span className="spinner" /><span style={{ marginLeft: '8px' }}>Signing in...</span></>
              : <><LogIn size={15} /> Sign In</>
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
