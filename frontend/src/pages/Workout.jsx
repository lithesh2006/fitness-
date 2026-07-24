import { useState, useEffect, useCallback } from 'react';
import { workoutAPI } from '../services/api';
import { showToast } from '../utils/toast';
import WorkoutCard from '../components/WorkoutCard';
import { StrengthHistoryChart } from '../components/ProgressChart';
import Footer from '../components/Footer';
import { Plus, Search, X, Check, TrendingUp, Dumbbell, FileSpreadsheet, Table2, RefreshCw } from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';

const CATEGORIES = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio'];
const emptyLog = { exercise_id: '', sets: 3, reps: 10, weight: 0, duration: 20, rest_time: 60 };

/* ── Category badge colour map ── */
const CAT_COLORS = {
  Chest: '#e53935', Back: '#e53935', Shoulders: '#ff9800',
  Arms: '#ff9800', Legs: '#9c27b0', Core: '#2196f3', Cardio: '#4caf50',
};

export default function Workout({ date }) {
  const [workouts,        setWorkouts]        = useState([]);
  const [exercises,       setExercises]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [showModal,       setShowModal]       = useState(false);
  const [editItem,        setEditItem]        = useState(null);
  const [form,            setForm]            = useState({ ...emptyLog });
  const [category,        setCategory]        = useState('All');
  const [exSearch,        setExSearch]        = useState('');
  const [strengthEx,      setStrengthEx]      = useState(null);
  const [strengthHistory, setStrengthHistory] = useState([]);
  const [showStrength,    setShowStrength]    = useState(false);

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

  const openAdd  = () => { setEditItem(null); setForm({ ...emptyLog }); setShowModal(true); };
  const openEdit = (w) => {
    setEditItem(w);
    setForm({ exercise_id: w.exercise || w.exercise_id, sets: w.sets, reps: w.reps, weight: w.weight, duration: w.duration, rest_time: w.rest_time });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.exercise_id)       { showToast('Select an exercise', 'error'); return; }
    if (!form.sets || !form.reps) { showToast('Sets and reps are required', 'error'); return; }
    try {
      const payload = {
        date, exercise: Number(form.exercise_id),
        sets: Number(form.sets), reps: Number(form.reps),
        weight: Number(form.weight), duration: Number(form.duration), rest_time: Number(form.rest_time),
      };
      if (editItem) {
        await workoutAPI.updateWorkout(editItem.id, payload);
        showToast('Workout updated!', 'success');
      } else {
        await workoutAPI.addWorkout(payload);
        showToast('Workout logged!', 'success');
      }
      setShowModal(false);
      loadWorkouts();
    } catch (err) { showToast(err.response?.data?.detail || 'Failed to save', 'error'); }
  };

  const handleDelete = async (id) => {
    try { await workoutAPI.deleteWorkout(id); showToast('Workout deleted', 'success'); loadWorkouts(); }
    catch { showToast('Failed to delete', 'error'); }
  };

  const loadStrength = async (workout) => {
    try {
      const exId = workout.exercise || workout.exercise_id;
      const res   = await workoutAPI.getStrengthHistory(exId);
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

  const totalSets     = workouts.reduce((a, w) => a + (w.sets     || 0), 0);
  const totalDuration = workouts.reduce((a, w) => a + (w.duration || 0), 0);

  /* ── Export current workouts state to Excel ── */
  const handleExportExcel = () => {
    if (workouts.length === 0) { showToast('No workouts to export', 'info'); return; }

    const headers = ['Date', 'Muscle Group', 'Exercise', 'Sets', 'Reps', 'Weight (kg)', 'Duration (min)', 'Rest Time (sec)'];
    const rows = workouts.map(w => [
      w.date || date,
      w.exercise_category || w.category || '',
      w.exercise_name || '',
      w.sets,
      w.reps,
      w.weight > 0 ? w.weight : 'Bodyweight',
      w.duration,
      w.rest_time,
    ]);

    // Summary sheet
    const summaryHeaders = ['Metric', 'Value'];
    const summaryRows = [
      ['Date',              date],
      ['Total Exercises',   workouts.length],
      ['Total Sets',        totalSets],
      ['Total Duration (min)', totalDuration],
      ['Avg Weight (kg)',   (workouts.filter(w => w.weight > 0).reduce((a, w) => a + w.weight, 0) / (workouts.filter(w => w.weight > 0).length || 1)).toFixed(1)],
    ];

    exportToExcel(
      [
        { name: 'Workout Log',  headers, rows },
        { name: 'Summary',      headers: summaryHeaders, rows: summaryRows },
      ],
      `workout_${date}.xlsx`
    );
    showToast('Excel exported!', 'success');
  };

  /* ── Live Excel columns definition ── */
  const LIVE_COLS = [
    { key: 'date',              label: 'Date',            width: 100 },
    { key: 'exercise_category', label: 'Muscle Group',    width: 120 },
    { key: 'exercise_name',     label: 'Exercise',        width: 160 },
    { key: 'sets',              label: 'Sets',            width: 60  },
    { key: 'reps',              label: 'Reps',            width: 60  },
    { key: 'weight',            label: 'Weight (kg)',     width: 100 },
    { key: 'duration',          label: 'Duration (min)',  width: 120 },
    { key: 'rest_time',         label: 'Rest (sec)',      width: 90  },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Log and track your exercises</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-secondary"
            onClick={handleExportExcel}
            style={{ fontSize: '13px', padding: '7px 14px', color: '#4caf50', borderColor: 'rgba(76,175,80,0.4)' }}
            title="Export current data to Excel"
          >
            <FileSpreadsheet size={14} /> Export Excel
          </button>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={14} /> Log Workout
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', padding: '4px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))', alignSelf: 'flex-start' }}>
        {[
          { id: 'log',  label: 'Workout Log',   icon: <Dumbbell size={13} /> },
          { id: 'live', label: 'Live Excel View', icon: <Table2 size={13} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
            fontSize: '12px', fontWeight: '600', fontFamily: 'Inter, sans-serif',
            background:  activeTab === t.id ? 'var(--accent)' : 'transparent',
            border:      '1px solid transparent',
            color:       activeTab === t.id ? '#fff' : 'var(--text-secondary)',
            transition:  'all 0.15s',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'log' ? (
        <>
          {/* Today's Progress cards */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Today's Progress
            </div>
            <div className="grid-3">
              {[
                { label: 'Exercises', value: workouts.length,  color: 'var(--accent)' },
                { label: 'Total Sets',    value: totalSets,         color: '#2196f3' },
                { label: 'Minutes',       value: totalDuration,     color: '#4caf50' },
              ].map(({ label, value, color }) => (
                <div key={label} className="stat-card" style={{ textAlign: 'center', padding: '18px' }}>
                  <div style={{ fontSize: '30px', fontWeight: '800', fontFamily: 'var(--font-display)', color }}>{value}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {!loading && workouts.length === 0 ? (
            <div className="stat-card" style={{ textAlign: 'center', padding: '48px' }}>
              <Dumbbell size={36} color="var(--accent)" style={{ marginBottom: '12px' }} />
              <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>No workouts logged</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
                Start logging for {date}
              </p>
              <button className="btn-primary" onClick={openAdd}><Plus size={14} /> Log Workout</button>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '10px' }}>
              <span className="spinner" />
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading...</span>
            </div>
          ) : (
            <div className="stat-card">
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Workout History
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Muscle Group</th>
                    <th>Exercise</th>
                    <th>Sets</th>
                    <th>Reps</th>
                    <th>Weight</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {workouts.map(w => {
                    const cat   = w.exercise_category || w.category || '';
                    const color = CAT_COLORS[cat] || 'var(--accent)';
                    return (
                      <tr key={w.id}>
                        <td style={{ color: 'var(--text-secondary)' }}>{w.date || date}</td>
                        <td>
                          <span className="badge" style={{ background: color + '22', color, border: '1px solid ' + color + '55' }}>
                            {cat}
                          </span>
                        </td>
                        <td style={{ fontWeight: '500', color: '#fff' }}>{w.exercise_name}</td>
                        <td>{w.sets}</td>
                        <td>{w.reps}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {w.weight > 0 ? w.weight + ' kg' : 'Bodyweight'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button onClick={() => openEdit(w)} title="Edit"
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '3px' }}
                              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>✎</button>
                            <button onClick={() => loadStrength(w)} title="Strength history"
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '3px', display: 'flex', alignItems: 'center' }}
                              onMouseEnter={e => e.currentTarget.style.color = '#ff9800'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                              <TrendingUp size={13} />
                            </button>
                            <button onClick={() => handleDelete(w.id)} title="Delete"
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '3px' }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>✕</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {uncategorized.map(w => (
                    <tr key={w.id}>
                      <td style={{ color: 'var(--text-secondary)' }}>{w.date || date}</td>
                      <td><span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#aaa' }}>—</span></td>
                      <td style={{ fontWeight: '500', color: '#fff' }}>{w.exercise_name}</td>
                      <td>{w.sets}</td><td>{w.reps}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{w.weight > 0 ? w.weight + ' kg' : 'Bodyweight'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => openEdit(w)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✎</button>
                          <button onClick={() => handleDelete(w.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* ══════════════ LIVE EXCEL VIEW ══════════════ */
        <div className="stat-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px',
            background: '#1e1e1e',
            borderBottom: '1px solid hsl(var(--border-color))',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Live indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%', background: '#4caf50',
                  boxShadow: '0 0 6px #4caf50',
                  animation: 'pulse 2s infinite',
                }} />
                <span style={{ fontSize: '11px', color: '#4caf50', fontWeight: '700' }}>LIVE</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                workout_{date}.xlsx &nbsp;·&nbsp; {workouts.length} row{workouts.length !== 1 ? 's' : ''}
              </span>
              {lastUpdated && (
                <span style={{ fontSize: '11px', color: '#555' }}>
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={loadWorkouts} style={{ background: 'none', border: '1px solid hsl(var(--border-color))', borderRadius: '4px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={11} /> Refresh
              </button>
              <button onClick={handleExportExcel} style={{ background: '#4caf50', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', padding: '4px 10px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FileSpreadsheet size={11} /> Download .xlsx
              </button>
            </div>
          </div>

          {/* Column headers row (Excel-style) */}
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 'max-content' }}>
              {/* Header row */}
              <div style={{ display: 'flex', background: '#2d2d2d', borderBottom: '2px solid hsl(var(--border-color))' }}>
                {/* Row number column */}
                <div style={{ width: '40px', flexShrink: 0, padding: '7px 8px', fontSize: '11px', color: '#555', borderRight: '1px solid hsl(var(--border-color))', textAlign: 'center', fontWeight: '700' }}>
                  #
                </div>
                {LIVE_COLS.map(col => (
                  <div key={col.key} style={{
                    width: col.width + 'px', flexShrink: 0, padding: '7px 10px',
                    fontSize: '11px', fontWeight: '700', color: '#4caf50',
                    borderRight: '1px solid hsl(var(--border-color))',
                    textTransform: 'uppercase', letterSpacing: '0.4px',
                    background: '#252525',
                  }}>
                    {col.label}
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {loading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <span className="spinner" style={{ marginRight: '8px' }} /> Loading...
                </div>
              ) : workouts.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  No workout data — log a workout to see it here live
                </div>
              ) : workouts.map((w, rowIdx) => {
                const cat   = w.exercise_category || w.category || '';
                const color = CAT_COLORS[cat] || '#aaa';
                const isEven = rowIdx % 2 === 0;
                const cells = {
                  date:              w.date || date,
                  exercise_category: cat,
                  exercise_name:     w.exercise_name || '',
                  sets:              w.sets,
                  reps:              w.reps,
                  weight:            w.weight > 0 ? w.weight + ' kg' : 'Bodyweight',
                  duration:          w.duration,
                  rest_time:         w.rest_time,
                };
                return (
                  <div key={w.id} style={{
                    display: 'flex',
                    background: isEven ? '#181818' : '#1c1c1c',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,57,53,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = isEven ? '#181818' : '#1c1c1c'}
                  >
                    {/* Row number */}
                    <div style={{ width: '40px', flexShrink: 0, padding: '8px', fontSize: '11px', color: '#444', borderRight: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
                      {rowIdx + 1}
                    </div>
                    {LIVE_COLS.map(col => (
                      <div key={col.key} style={{
                        width: col.width + 'px', flexShrink: 0, padding: '8px 10px',
                        fontSize: '12px', borderRight: '1px solid rgba(255,255,255,0.04)',
                        color: col.key === 'exercise_category' ? color :
                               col.key === 'exercise_name'     ? '#fff' :
                               col.key === 'sets' || col.key === 'reps' ? '#e0e0e0' :
                               col.key === 'weight'            ? '#ff9800' :
                               'var(--text-secondary)',
                        fontWeight: col.key === 'exercise_name' ? '500' : '400',
                      }}>
                        {col.key === 'exercise_category' ? (
                          <span style={{ background: color + '22', border: '1px solid ' + color + '55', borderRadius: '3px', padding: '1px 6px', fontSize: '10px', fontWeight: '700' }}>
                            {cells[col.key] || '—'}
                          </span>
                        ) : cells[col.key]}
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Totals row */}
              {workouts.length > 0 && (
                <div style={{ display: 'flex', background: '#252525', borderTop: '2px solid hsl(var(--border-color))' }}>
                  <div style={{ width: '40px', flexShrink: 0, padding: '8px', borderRight: '1px solid hsl(var(--border-color))' }} />
                  {LIVE_COLS.map(col => (
                    <div key={col.key} style={{
                      width: col.width + 'px', flexShrink: 0, padding: '8px 10px',
                      fontSize: '11px', fontWeight: '700', color: '#4caf50',
                      borderRight: '1px solid hsl(var(--border-color))',
                    }}>
                      {col.key === 'date'          ? 'TOTALS' :
                       col.key === 'sets'          ? workouts.reduce((a, w) => a + (w.sets     || 0), 0) :
                       col.key === 'reps'          ? workouts.reduce((a, w) => a + (w.reps     || 0), 0) :
                       col.key === 'duration'      ? workouts.reduce((a, w) => a + (w.duration || 0), 0) + ' min' :
                       col.key === 'exercise_name' ? workouts.length + ' exercises' : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* Strength history modal */}
      {showStrength && strengthEx && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowStrength(false)}>
          <div className="modal-box" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px' }}>
                <TrendingUp size={15} style={{ display: 'inline', marginRight: '6px', color: '#ff9800' }} />
                {strengthEx.exercise_name || strengthEx.name} — Strength History
              </h3>
              <button onClick={() => setShowStrength(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            {strengthHistory.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0', fontSize: '13px' }}>No history yet</p>
            ) : (
              <>
                <StrengthHistoryChart data={strengthHistory} />
                <table className="data-table" style={{ marginTop: '16px' }}>
                  <thead><tr><th>Date</th><th>Weight</th><th>Sets</th><th>Reps</th><th>Est. 1RM</th></tr></thead>
                  <tbody>
                    {strengthHistory.map((h, i) => (
                      <tr key={i}>
                        <td>{h.date}</td>
                        <td style={{ color: '#ff9800' }}>{h.weight} kg</td>
                        <td>{h.sets}</td>
                        <td>{h.reps}</td>
                        <td style={{ color: '#4caf50', fontWeight: '600' }}>{h.estimated_1rm} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px' }}>{editItem ? 'Edit Workout' : 'Log Workout'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Category tabs */}
              <div className="form-group">
                <label className="form-label">Muscle Group</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategory(c)} style={{
                      padding: '4px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer',
                      background: category === c ? 'var(--accent)' : 'var(--bg-input)',
                      border: '1px solid ' + (category === c ? 'transparent' : 'hsl(var(--border-color))'),
                      color: 'white', fontFamily: 'Inter, sans-serif', fontWeight: category === c ? '600' : '400',
                    }}>{c}</button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div className="form-group">
                <label className="form-label">Exercise Selection</label>
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input className="form-input" placeholder="Search exercises..." value={exSearch}
                    onChange={e => setExSearch(e.target.value)} style={{ paddingLeft: '30px' }} />
                </div>
                <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {filteredEx.length === 0
                    ? <p style={{ color: 'var(--text-secondary)', fontSize: '12px', padding: '8px' }}>No exercises found</p>
                    : filteredEx.map(ex => (
                      <button key={ex.id} onClick={() => setForm(f => ({ ...f, exercise_id: ex.id }))} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: form.exercise_id === ex.id ? 'rgba(229,57,53,0.15)' : 'var(--bg-input)',
                        border: '1px solid ' + (form.exercise_id === ex.id ? 'rgba(229,57,53,0.4)' : 'transparent'),
                        borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer',
                        fontSize: '13px', fontFamily: 'Inter, sans-serif', textAlign: 'left',
                      }}>
                        <span>{ex.name}</span>
                        <span style={{
                          fontSize: '10px', color: CAT_COLORS[ex.category] || '#aaa',
                          padding: '2px 6px', background: (CAT_COLORS[ex.category] || '#aaa') + '22',
                          borderRadius: '3px', fontWeight: '600',
                        }}>
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

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button className="btn-primary" onClick={handleSave} style={{ flex: 1, justifyContent: 'center' }}>
                  <Check size={14} /> {editItem ? 'Update' : 'Save Workout'}
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
