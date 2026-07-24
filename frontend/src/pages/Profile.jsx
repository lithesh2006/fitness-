import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { showToast } from '../utils/toast';
import Footer from '../components/Footer';
import { Save, Lock, User } from 'lucide-react';

const ACTIVITY_LEVELS = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Athlete'];
const FITNESS_GOALS   = ['Weight Loss', 'Weight Maintenance', 'Weight Gain', 'Muscle Gain'];

export default function Profile() {
  const [profile,  setProfile]  = useState(null);
  const [form,     setForm]     = useState({});
  const [pwForm,   setPwForm]   = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  useEffect(() => {
    authAPI.getProfile()
      .then(res => {
        setProfile(res.data);
        setForm({
          full_name:      res.data.full_name               || '',
          email:          res.data.email                   || '',
          age:            res.data.profile?.age            || '',
          gender:         res.data.profile?.gender         || 'Male',
          height:         res.data.profile?.height         || '',
          weight:         res.data.profile?.weight         || '',
          activity_level: res.data.profile?.activity_level || 'Moderately Active',
          fitness_goal:   res.data.profile?.fitness_goal   || 'Weight Maintenance',
        });
      })
      .catch(() => showToast('Failed to load profile', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSaveProfile = async () => {
    if (!form.full_name.trim())      { showToast('Full name is required', 'error'); return; }
    if (!form.age || form.age < 10)  { showToast('Enter a valid age', 'error'); return; }
    setSaving(true);
    try {
      await authAPI.updateProfile({ ...form, age: Number(form.age), height: Number(form.height), weight: Number(form.weight) });
      showToast('Profile updated!', 'success');
    } catch (err) { showToast(err.response?.data?.detail || 'Failed to update', 'error'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    const e = {};
    if (!pwForm.old_password)                                        e.old_password     = 'Current password required';
    if (!pwForm.new_password)                                        e.new_password     = 'New password required';
    else if (pwForm.new_password.length < 8)                         e.new_password     = 'Min 8 characters';
    if (pwForm.new_password !== pwForm.confirm_password)             e.confirm_password = 'Passwords do not match';
    if (Object.keys(e).length) { setPwErrors(e); return; }
    setSavingPw(true);
    try {
      await authAPI.changePassword(pwForm);
      showToast('Password changed!', 'success');
      setPwForm({ old_password: '', new_password: '', confirm_password: '' });
      setPwErrors({});
    } catch (err) {
      const data = err.response?.data || {};
      setPwErrors(data);
      showToast(data.old_password?.[0] || data.detail || 'Failed to change password', 'error');
    } finally { setSavingPw(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px' }}>
      <span className="spinner" />
      <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading profile...</span>
    </div>
  );

  const bmi = (() => {
    const h = (profile?.profile?.height || 170) / 100;
    return ((profile?.profile?.weight || 70) / (h * h)).toFixed(1);
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Manage your personal information and goals</p>

      {/* Avatar card */}
      <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '800', fontSize: '22px', color: 'white',
        }}>
          {form.full_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '17px' }}>{form.full_name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{form.email}</div>
          <div style={{ marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {form.fitness_goal && (
              <span className="badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                {form.fitness_goal}
              </span>
            )}
            {form.activity_level && (
              <span className="badge" style={{ background: 'rgba(33,150,243,0.12)', color: '#64b5f6', border: '1px solid rgba(33,150,243,0.3)' }}>
                {form.activity_level}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="stat-card">
        <div className="section-title" style={{ fontSize: '14px' }}><User size={14} color="var(--accent)" /> Personal Information</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Age (years)</label>
              <input type="number" className="form-input" value={form.age} onChange={e => set('age', e.target.value)} min="10" max="120" />
            </div>
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input type="number" className="form-input" value={form.height} onChange={e => set('height', e.target.value)} min="50" max="300" />
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input type="number" className="form-input" value={form.weight} onChange={e => set('weight', e.target.value)} min="20" max="500" step="0.1" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Gender</label>
            <select className="form-input" value={form.gender} onChange={e => set('gender', e.target.value)}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>

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

          <button className="btn-primary" onClick={handleSaveProfile} disabled={saving} style={{ alignSelf: 'flex-start' }}>
            {saving ? <span className="spinner" /> : <><Save size={14} /> Save Profile</>}
          </button>
        </div>
      </div>

      {/* Body stats */}
      {profile?.profile && (
        <div className="stat-card">
          <div className="section-title" style={{ fontSize: '14px' }}>Body Stats</div>
          <div className="grid-3">
            {[
              { label: 'BMI',    value: bmi,                     unit: '',   color: 'var(--accent)' },
              { label: 'Height', value: profile.profile.height,  unit: 'cm', color: '#2196f3'       },
              { label: 'Weight', value: profile.profile.weight,  unit: 'kg', color: '#9c27b0'       },
            ].map(({ label, value, unit, color }) => (
              <div key={label} style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-card2)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-display)', color }}>
                  {value}
                  {unit && <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '400', marginLeft: '2px' }}>{unit}</span>}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Change password */}
      <div className="stat-card">
        <div className="section-title" style={{ fontSize: '14px' }}><Lock size={14} color="var(--accent)" /> Change Password</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[['Current Password', 'old_password'], ['New Password', 'new_password'], ['Confirm New Password', 'confirm_password']].map(([label, key]) => (
            <div className="form-group" key={key}>
              <label className="form-label">{label}</label>
              <input type="password" className="form-input" placeholder="••••••••"
                value={pwForm[key]}
                onChange={e => { setPwForm(f => ({ ...f, [key]: e.target.value })); setPwErrors({}); }} />
              {pwErrors[key] && (
                <span style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '2px' }}>
                  {Array.isArray(pwErrors[key]) ? pwErrors[key][0] : pwErrors[key]}
                </span>
              )}
            </div>
          ))}
          <button className="btn-primary" onClick={handleChangePassword} disabled={savingPw} style={{ alignSelf: 'flex-start' }}>
            {savingPw ? <span className="spinner" /> : <><Lock size={14} /> Change Password</>}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
