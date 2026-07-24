import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Activity, UserPlus } from 'lucide-react';
import { authAPI } from '../services/api';
import { showToast } from '../utils/toast';

const ACTIVITY_LEVELS = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Athlete'];
const FITNESS_GOALS   = ['Weight Loss', 'Weight Maintenance', 'Weight Gain', 'Muscle Gain'];

export default function Signup({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '',
    age: '', gender: 'Male', height: '', weight: '',
    activity_level: 'Moderately Active', fitness_goal: 'Weight Maintenance',
  });
  const [showPw,   setShowPw]   = useState(false);
  const [showCp,   setShowCp]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; delete n.non_field_errors; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim())                     e.full_name      = 'Full name is required';
    if (!form.email.trim())                         e.email          = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))      e.email          = 'Enter a valid email';
    if (!form.password)                             e.password       = 'Password is required';
    else if (form.password.length < 8)              e.password       = 'Min 8 characters';
    if (form.password !== form.confirm_password)    e.confirm_password = 'Passwords do not match';
    const age = Number(form.age); const h = Number(form.height); const w = Number(form.weight);
    if (!form.age   || isNaN(age) || age < 10 || age > 120)  e.age    = 'Valid age (10–120)';
    if (!form.height || isNaN(h)  || h < 50   || h > 300)    e.height = 'Valid height cm (50–300)';
    if (!form.weight || isNaN(w)  || w < 20   || w > 500)    e.weight = 'Valid weight kg (20–500)';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); showToast(Object.values(e)[0], 'error'); return; }
    setLoading(true); setErrors({});
    try {
      const payload = { ...form, age: Number(form.age), height: Number(form.height), weight: Number(form.weight) };
      const res = await authAPI.register(payload);
      const { access, refresh, user } = res.data;
      localStorage.setItem('access_token',  access);
      localStorage.setItem('refresh_token', refresh);
      onLogin(user);
      showToast('Account created! Welcome 🎉', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data || {};
      const mapped = {};
      let firstMsg = 'Registration failed. Check the form and try again.';
      Object.entries(data).forEach(([k, v]) => {
        const msg = Array.isArray(v) ? v[0] : (typeof v === 'string' ? v : JSON.stringify(v));
        mapped[k] = msg;
        if (firstMsg === 'Registration failed. Check the form and try again.') firstMsg = msg;
      });
      setErrors(mapped);
      showToast(firstMsg, 'error');
    } finally { setLoading(false); }
  };

  const Err = ({ name }) => errors[name]
    ? <span style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '2px', display: 'block' }}>{errors[name]}</span>
    : null;

  const Label = ({ children }) => (
    <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', paddingTop: '4px', paddingBottom: '2px', borderBottom: '1px solid hsl(var(--border-color))', marginBottom: '4px' }}>
      {children}
    </div>
  );

  return (
    <div className="auth-page" style={{ paddingTop: '28px', paddingBottom: '28px' }}>
      <div className="auth-card fade-in" style={{ maxWidth: '500px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: 'var(--accent)', width: '38px', height: '38px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--accent)', lineHeight: 1 }}>FITNESS</div>
              <div style={{ fontSize: '9px', color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Tracker</div>
            </div>
          </div>
          <h1 style={{ fontSize: '20px', marginBottom: '4px' }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Start your fitness journey today</p>
        </div>

        {errors.non_field_errors && (
          <div style={{ background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.3)', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', color: '#ef9a9a', marginBottom: '14px' }}>
            ⚠ {errors.non_field_errors}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          <Label>Personal Info</Label>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="John Doe" value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              style={errors.full_name ? { borderColor: 'var(--accent)' } : {}} />
            <Err name="full_name" />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" placeholder="you@example.com" value={form.email}
              autoComplete="email" onChange={e => set('email', e.target.value)}
              style={errors.email ? { borderColor: 'var(--accent)' } : {}} />
            <Err name="email" />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} className="form-input"
                  placeholder="Min 8 chars" value={form.password} autoComplete="new-password"
                  onChange={e => set('password', e.target.value)}
                  style={{ paddingRight: '36px', ...(errors.password ? { borderColor: 'var(--accent)' } : {}) }} />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <Err name="password" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showCp ? 'text' : 'password'} className="form-input"
                  placeholder="Repeat password" value={form.confirm_password} autoComplete="new-password"
                  onChange={e => set('confirm_password', e.target.value)}
                  style={{ paddingRight: '36px', ...(errors.confirm_password ? { borderColor: 'var(--accent)' } : {}) }} />
                <button type="button" onClick={() => setShowCp(s => !s)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  {showCp ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <Err name="confirm_password" />
            </div>
          </div>

          <Label>Body Measurements</Label>

          <div className="grid-3">
            {[['Age (years)', 'age', '25', 10, 120], ['Height (cm)', 'height', '175', 50, 300], ['Weight (kg)', 'weight', '70', 20, 500]].map(([label, key, placeholder, min, max]) => (
              <div className="form-group" key={key}>
                <label className="form-label">{label}</label>
                <input type="number" className="form-input" placeholder={placeholder} value={form[key]}
                  onChange={e => set(key, e.target.value)} min={min} max={max}
                  style={errors[key] ? { borderColor: 'var(--accent)' } : {}} />
                <Err name={key} />
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Gender</label>
            <select className="form-input" value={form.gender} onChange={e => set('gender', e.target.value)}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>

          <Label>Fitness Profile</Label>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Activity Level</label>
              <select className="form-input" value={form.activity_level} onChange={e => set('activity_level', e.target.value)}>
                {ACTIVITY_LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fitness Goal</label>
              <select className="form-input" value={form.fitness_goal} onChange={e => set('fitness_goal', e.target.value)}>
                {FITNESS_GOALS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '14px', marginTop: '6px' }}>
            {loading
              ? <><span className="spinner" /><span style={{ marginLeft: '8px' }}>Creating account...</span></>
              : <><UserPlus size={15} /> Create Account</>
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
