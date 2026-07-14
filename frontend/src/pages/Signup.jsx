import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Flame, UserPlus } from 'lucide-react';
import { authAPI } from '../services/api';
import { showToast } from '../utils/toast';

const ACTIVITY_LEVELS = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Athlete'];
const FITNESS_GOALS = ['Weight Loss', 'Weight Maintenance', 'Weight Gain', 'Muscle Gain'];

export default function Signup({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '',
    age: '', gender: 'Male', height: '', weight: '',
    activity_level: 'Moderately Active', fitness_goal: 'Weight Maintenance',
  });
  const [showPw, setShowPw] = useState(false);
  const [showCp, setShowCp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; delete n.non_field_errors; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password && form.confirm_password && form.password !== form.confirm_password)
      e.confirm_password = 'Passwords do not match';
    // Use Number() for proper numeric comparison — form values are strings from inputs
    const age = Number(form.age);
    const height = Number(form.height);
    const weight = Number(form.weight);
    if (!form.age || isNaN(age) || age < 10 || age > 120) e.age = 'Enter a valid age (10–120)';
    if (!form.height || isNaN(height) || height < 50 || height > 300) e.height = 'Enter height in cm (50–300)';
    if (!form.weight || isNaN(weight) || weight < 20 || weight > 500) e.weight = 'Enter weight in kg (20–500)';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      // Scroll to first error
      const first = Object.keys(e)[0];
      showToast(e[first], 'error');
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        height: Number(form.height),
        weight: Number(form.weight),
      };
      const res = await authAPI.register(payload);
      const { access, refresh, user } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      onLogin(user);
      showToast('Account created! Welcome to AuraFit 🎉', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data || {};
      const mapped = {};
      let firstMsg = 'Registration failed. Please check the form and try again.';

      // Map DRF validation errors to field names
      Object.entries(data).forEach(([k, v]) => {
        const msg = Array.isArray(v) ? v[0] : (typeof v === 'string' ? v : JSON.stringify(v));
        mapped[k] = msg;
        if (firstMsg === 'Registration failed. Please check the form and try again.') {
          firstMsg = msg;
        }
      });

      setErrors(mapped);
      showToast(firstMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Inline error helper
  const Err = ({ name }) => errors[name]
    ? <span style={{ fontSize: '12px', color: '#f87171', marginTop: '2px', display: 'block' }}>{errors[name]}</span>
    : null;

  return (
    <div className="auth-page" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
      <div className="auth-card fade-in" style={{ maxWidth: '520px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', marginBottom: '12px',
          }}>
            <Flame size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '22px', marginBottom: '4px' }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Start your fitness journey today</p>
        </div>

        {/* Top-level API error */}
        {errors.non_field_errors && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px', padding: '10px 14px', fontSize: '13px',
            color: '#f87171', marginBottom: '14px',
          }}>
            ⚠ {errors.non_field_errors}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* ── Personal Info ────────────────────────────── */}
          <SectionLabel>Personal Info</SectionLabel>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="John Doe" value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              style={errors.full_name ? { borderColor: '#ef4444' } : {}} />
            <Err name="full_name" />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" placeholder="you@example.com" value={form.email}
              autoComplete="email" onChange={e => set('email', e.target.value)}
              style={errors.email ? { borderColor: '#ef4444' } : {}} />
            <Err name="email" />
          </div>

          <div className="grid-2">
            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} className="form-input"
                  placeholder="Min 8 chars" value={form.password}
                  autoComplete="new-password"
                  onChange={e => set('password', e.target.value)}
                  style={{ paddingRight: '38px', ...(errors.password ? { borderColor: '#ef4444' } : {}) }}
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  aria-label="Toggle password visibility"
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <Err name="password" />
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCp ? 'text' : 'password'} className="form-input"
                  placeholder="Repeat password" value={form.confirm_password}
                  autoComplete="new-password"
                  onChange={e => set('confirm_password', e.target.value)}
                  style={{ paddingRight: '38px', ...(errors.confirm_password ? { borderColor: '#ef4444' } : {}) }}
                />
                <button type="button" onClick={() => setShowCp(s => !s)}
                  aria-label="Toggle confirm password visibility"
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  {showCp ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <Err name="confirm_password" />
            </div>
          </div>

          {/* ── Body Measurements ────────────────────────── */}
          <SectionLabel>Body Measurements</SectionLabel>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Age (years)</label>
              <input type="number" className="form-input" placeholder="25" value={form.age}
                onChange={e => set('age', e.target.value)} min="10" max="120"
                style={errors.age ? { borderColor: '#ef4444' } : {}} />
              <Err name="age" />
            </div>
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input type="number" className="form-input" placeholder="175" value={form.height}
                onChange={e => set('height', e.target.value)} min="50" max="300"
                style={errors.height ? { borderColor: '#ef4444' } : {}} />
              <Err name="height" />
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input type="number" className="form-input" placeholder="70" value={form.weight}
                onChange={e => set('weight', e.target.value)} min="20" max="500" step="0.1"
                style={errors.weight ? { borderColor: '#ef4444' } : {}} />
              <Err name="weight" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Gender</label>
            <select className="form-input" value={form.gender} onChange={e => set('gender', e.target.value)}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <Err name="gender" />
          </div>

          {/* ── Fitness Profile ──────────────────────────── */}
          <SectionLabel>Fitness Profile</SectionLabel>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Activity Level</label>
              <select className="form-input" value={form.activity_level} onChange={e => set('activity_level', e.target.value)}>
                {ACTIVITY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <Err name="activity_level" />
            </div>
            <div className="form-group">
              <label className="form-label">Fitness Goal</label>
              <select className="form-input" value={form.fitness_goal} onChange={e => set('fitness_goal', e.target.value)}>
                {FITNESS_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <Err name="fitness_goal" />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px', marginTop: '4px' }}>
            {loading
              ? <><span className="spinner" /><span style={{ marginLeft: '8px' }}>Creating account...</span></>
              : <><UserPlus size={16} /> Create Account</>
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)',
      textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px',
    }}>
      {children}
    </div>
  );
}
