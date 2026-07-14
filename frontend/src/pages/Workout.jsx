import { useState, useEffect, useCallback } from 'react';
import { workoutAPI } from '../services/api';
import { showToast } from '../utils/toast';
import WorkoutCard from '../components/WorkoutCard';
import { StrengthHistoryChart } from '../components/ProgressChart';
import Footer from '../components/Footer';
import { Plus, Search, X, Check, TrendingUp } from 'lucide-react';

const CATEGORIES = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio'];
const emptyLog = { exercise_id: '', sets: 3, reps: 10, weight: 0, duration: 20, rest_time: 60 };

export default function Workout({ date }) {
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ ...emptyLog });
  const [category, setCategory] = useState('All');
  const [exSearch, setExSearch] = useState('');
  const [strengthEx, setStrengthEx] = useState(null);
  const [strengthHistory, setStrengthHistory] = useState([]);
  const [showStrength, setShowStrength] = useState(false);

  const loadWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workoutAPI.getWorkouts(date);
      setWorkouts(res.data);
    } catch { showToast('Failed to load workouts', 'error'); }
    finally { setLoading(false); }
  }, [date]);

  const loadExercises = useCallback(async () => {
    try {
      const cat = category === 'All' ? undefined : category;
      const res = await workoutAPI.getExercises(cat, exSearch || undefined);
      setExercises(res.data);
    } catch {}
  }, [category, exSearch]);

  useEffect(() => { loadWorkouts(); }, [loadWorkouts]);
  useEffect(() => { loadExercises(); }, [loadExercises]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...emptyLog });
    setShowModal(true);
  };

  const openEdit = (w) => {
    setEditItem(w);
    setForm({ exercise_id: w.exercise || w.exercise_id, sets: w.sets, reps: w.reps, weight: w.weight, duration: w.duration, rest_time: w.rest_time });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.exercise_id) { showToast('Select an exercise', 'error'); return; }
    if (!form.sets || !form.reps) { showToast('Sets and reps are required', 'error'); return; }
    try {
      const payload = { date, exercise: Number(form.exercise_id), sets: Number(form.sets), reps: Number(form.reps), weight: Number(form.weight), duration: Number(form.duration), rest_time: Number(form.rest_time) };
      if (editItem) {
        await workoutAPI.updateWorkout(editItem.id, payload);
        showToast('Workout updated!', 'success');
      } else {
        await workoutAPI.addWorkout(payload);
        showToast('Workout logged!', 'success');
      }
      setShowModal(false);
      loadWorkouts();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await workoutAPI.deleteWorkout(id);
      showToast('Workout deleted', 'success');
      loadWorkouts();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const loadStrength = async (workout) => {
    try {
      const exId = workout.exercise || workout.exercise_id;
      const res = await workoutAPI.getStrengthHistory(exId);
      setStrengthHistory(res.data);
      setStrengthEx(workout);
      setShowStrength(true);
    } catch { showToast('Could not load strength history', 'error'); }
  };

  const filteredEx = exercises.filter(e =>
    (category === 'All' || e.category === category) &&
    (!exSearch || e.name.toLowerCase().includes(exSearch.toLowerCase()))
  );

  const byCategory = CATEGORIES.slice(1).reduce((acc, cat) => {
    const items = workouts.filter(w => (w.exercise_category || w.category) === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});
  const uncategorized = workouts.filter(w => !CATEGORIES.slice(1).includes(w.exercise_category || w.category));

  const totalSets = workouts.reduce((a, w) => a + (w.sets || 0), 0);
  const totalDuration = workouts.reduce((a, w) => a + (w.duration || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Workout Tracker</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Log and track your exercises</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={14} /> Log Workout
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid-3">
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#8b5cf6' }}>
            {workouts.length}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Exercises Today</div>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#3b82f6' }}>
            {totalSets}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Sets</div>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#10b981' }}>
            {totalDuration}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Minutes</div>
        </div>
      </div>

      {/* Workout list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px' }}>
          <span className="spinner" />
          <span style={{ color: 'var(--text-secondary)' }}>Loading...</span>
        </div>
      ) : workouts.length === 0 ? (
        <div className="stat-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏋</div>
          <h3 style={{ marginBottom: '8px' }}>No workouts logged</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
            Log your first workout for {date}
          </p>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={14} /> Log Workout
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {cat}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map(w => (
                  <div key={w.id}>
                    <WorkoutCard workout={w} onEdit={openEdit} onDelete={handleDelete} />
                    <button
                      onClick={() => loadStrength(w)}
                      style={{
                        background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer',
                        fontSize: '12px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                    >
                      <TrendingUp size={12} /> View Strength History
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {uncategorized.map(w => (
            <WorkoutCard key={w.id} workout={w} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Strength history modal */}
      {showStrength && strengthEx && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowStrength(false)}>
          <div className="modal-box" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px' }}>
                <TrendingUp size={16} style={{ display: 'inline', marginRight: '6px', color: '#f59e0b' }} />
                {strengthEx.exercise_name || strengthEx.name} — Strength History
              </h3>
              <button onClick={() => setShowStrength(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            {strengthHistory.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0' }}>No history yet</p>
            ) : (
              <>
                <StrengthHistoryChart data={strengthHistory} />
                <table className="data-table" style={{ marginTop: '16px' }}>
                  <thead><tr><th>Date</th><th>Weight</th><th>Sets</th><th>Reps</th><th>Est. 1RM</th></tr></thead>
                  <tbody>
                    {strengthHistory.map((h, i) => (
                      <tr key={i}>
                        <td>{h.date}</td>
                        <td style={{ color: '#f59e0b' }}>{h.weight} kg</td>
                        <td>{h.sets}</td>
                        <td>{h.reps}</td>
                        <td style={{ color: '#10b981', fontWeight: '600' }}>{h.estimated_1rm} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px' }}>{editItem ? 'Edit Workout' : 'Log Workout'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Exercise picker */}
              <div className="form-group">
                <label className="form-label">Select Exercise *</label>
                {/* Category filter */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategory(c)} style={{
                      padding: '4px 10px', borderRadius: '99px', fontSize: '12px', cursor: 'pointer',
                      background: category === c ? 'var(--accent-blue)' : 'rgba(255,255,255,0.06)',
                      border: category === c ? '1px solid transparent' : '1px solid hsl(var(--border-color))',
                      color: 'white', fontFamily: 'Inter, sans-serif',
                    }}>{c}</button>
                  ))}
                </div>
                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input className="form-input" placeholder="Search exercises..." value={exSearch}
                    onChange={e => setExSearch(e.target.value)} style={{ paddingLeft: '32px' }} />
                </div>
                {/* Exercise list */}
                <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {filteredEx.length === 0
                    ? <p style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '8px' }}>No exercises found</p>
                    : filteredEx.map(ex => (
                      <button key={ex.id} onClick={() => setForm(f => ({ ...f, exercise_id: ex.id }))} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', background: form.exercise_id === ex.id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                        border: form.exercise_id === ex.id ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                        borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px',
                        fontFamily: 'Inter, sans-serif', textAlign: 'left',
                      }}>
                        <span>{ex.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '2px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px' }}>
                          {ex.category}
                        </span>
                      </button>
                    ))
                  }
                </div>
              </div>

              {/* Stats */}
              <div className="grid-3">
                {[['Sets', 'sets', 1, 20], ['Reps', 'reps', 1, 100], ['Weight (kg)', 'weight', 0, 500]].map(([label, key, min, max]) => (
                  <div className="form-group" key={key}>
                    <label className="form-label">{label}</label>
                    <input type="number" className="form-input" value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      min={min} max={max} step={key === 'weight' ? '0.5' : '1'} />
                  </div>
                ))}
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Duration (min)</label>
                  <input type="number" className="form-input" value={form.duration}
                    onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} min="1" max="300" />
                </div>
                <div className="form-group">
                  <label className="form-label">Rest Time (sec)</label>
                  <input type="number" className="form-input" value={form.rest_time}
                    onChange={e => setForm(f => ({ ...f, rest_time: e.target.value }))} min="0" max="600" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-primary" onClick={handleSave} style={{ flex: 1, justifyContent: 'center' }}>
                  <Check size={15} /> {editItem ? 'Update' : 'Log Workout'}
                </button>
                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
