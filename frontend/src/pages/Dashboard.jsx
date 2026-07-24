import { useState, useEffect } from 'react';
import { dashboardAPI, reportsAPI } from '../services/api';
import { showToast } from '../utils/toast';
import { WeeklyCaloriesChart, NutritionPieChart, WorkoutProgressChart, WeightProgressChart } from '../components/ProgressChart';
import Footer from '../components/Footer';
import { Scale, Activity, Droplets, Dumbbell, TrendingUp, RefreshCw, Flame, Target } from 'lucide-react';

function MacroBar({ label, consumed, goal, unit, color }) {
  const pct = Math.min(Math.round((consumed / (goal || 1)) * 100), 100);
  const exceeded = consumed > goal;
  const barColor = exceeded ? '#e53935' : color;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: '600', color: exceeded ? '#e53935' : 'var(--text-primary)' }}>
          {typeof consumed === 'number' ? consumed.toFixed(0) : consumed}
          <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>
            /{typeof goal === 'number' ? goal.toFixed(0) : goal} {unit}
          </span>
        </span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, unit, sub, color = 'var(--accent)' }) {
  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', color, lineHeight: 1 }}>
        {value ?? '--'}
        {unit && <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '400', marginLeft: '4px' }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="stat-card">
      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
      {children}
    </div>
  );
}

export default function Dashboard({ date }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight]   = useState('');
  const [water, setWater]     = useState('');
  const [saving, setSaving]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.getDashboardData(date);
      setData(res.data);
      setWater(res.data.cards.water_consumed || '');
    } catch {
      showToast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date]);

  const handleLogProgress = async () => {
    if (!weight && !water) { showToast('Enter weight or water intake', 'info'); return; }
    setSaving(true);
    try {
      const payload = { date, weight: Number(weight) || data?.cards?.current_weight, water_intake: Number(water) || 0 };
      await reportsAPI.logProgress(payload);
      showToast('Progress logged!', 'success');
      load();
      setWeight('');
    } catch (err) {
      if (err.response?.status === 400) {
        showToast('Progress updated!', 'success');
        load();
      } else {
        showToast(err.response?.data?.detail || 'Failed to save', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px' }}>
        <span className="spinner" />
        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading dashboard...</span>
      </div>
    );
  }

  const cards  = data?.cards  || {};
  const charts = data?.charts || {};
  const recent = data?.recent_activity || {};

  const bmiInfo = (() => {
    const b = cards.bmi || 0;
    if (b < 18.5) return { label: 'Underweight', color: '#ff9800' };
    if (b < 25)   return { label: 'Normal',       color: '#4caf50' };
    if (b < 30)   return { label: 'Overweight',   color: '#ff9800' };
    return              { label: 'Obese',          color: '#e53935' };
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="btn-secondary" onClick={load} style={{ fontSize: '13px', padding: '7px 14px' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Top stat cards */}
      <div className="grid-4">
        <div className="stat-card" style={{ borderLeft: '3px solid var(--accent)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Flame size={12} color="var(--accent)" /> Calories
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--accent)', lineHeight: 1 }}>
            {cards.calories_consumed ?? 0}
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '400', marginLeft: '3px' }}>kcal</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            / {cards.calories_goal ?? 0} goal &nbsp;·&nbsp;
            <span style={{ color: '#4caf50' }}>{cards.calories_remaining ?? 0} left</span>
          </div>
          <div className="progress-bar-track" style={{ marginTop: '10px' }}>
            <div className="progress-bar-fill" style={{
              width: `${Math.min((cards.calories_consumed / (cards.calories_goal || 1)) * 100, 100)}%`,
              background: 'var(--accent)',
            }} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '3px solid ' + bmiInfo.color }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <TrendingUp size={12} color={bmiInfo.color} /> BMI
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', color: bmiInfo.color, lineHeight: 1 }}>
            {cards.bmi ?? '--'}
          </div>
          <span className="badge" style={{ marginTop: '6px', background: bmiInfo.color + '22', color: bmiInfo.color, border: '1px solid ' + bmiInfo.color + '44' }}>
            {bmiInfo.label}
          </span>
        </div>

        <div className="stat-card" style={{ borderLeft: '3px solid #2196f3' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Scale size={12} color="#2196f3" /> Weight
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
            {cards.current_weight ?? '--'}
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '400', marginLeft: '3px' }}>kg</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>current</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '3px solid #9c27b0' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Dumbbell size={12} color="#9c27b0" /> Workouts
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#9c27b0', lineHeight: 1 }}>
            {cards.workout_completed ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>exercises today</div>
        </div>
      </div>

      {/* Nutrition macros */}
      <div className="stat-card">
        <div className="section-title" style={{ fontSize: '14px', marginBottom: '14px' }}>
          <Target size={15} color="var(--accent)" /> Daily Nutrition
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          <MacroBar label="Protein"       consumed={cards.protein_consumed ?? 0} goal={cards.protein_goal ?? 1} unit="g"  color="#e53935" />
          <MacroBar label="Carbohydrates" consumed={cards.carbs_consumed   ?? 0} goal={cards.carbs_goal   ?? 1} unit="g"  color="#ff9800" />
          <MacroBar label="Fat"           consumed={cards.fat_consumed     ?? 0} goal={cards.fat_goal     ?? 1} unit="g"  color="#ffeb3b" />
          <MacroBar label="Fiber"         consumed={cards.fiber_consumed   ?? 0} goal={cards.fiber_goal   ?? 1} unit="g"  color="#4caf50" />
          <MacroBar label="Water"         consumed={cards.water_consumed   ?? 0} goal={cards.water_goal   ?? 1} unit="L"  color="#00bcd4" />
        </div>
      </div>

      {/* Log progress */}
      <div className="stat-card">
        <div className="section-title" style={{ fontSize: '14px', marginBottom: '14px' }}>
          <Activity size={15} color="var(--accent)" /> Log Today's Progress
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '130px' }}>
            <label className="form-label">Weight (kg)</label>
            <input type="number" className="form-input" placeholder={cards.current_weight ?? '70'}
              value={weight} onChange={e => setWeight(e.target.value)} step="0.1" min="20" max="500" />
          </div>
          <div className="form-group" style={{ flex: '1', minWidth: '130px' }}>
            <label className="form-label">Water (Litres)</label>
            <input type="number" className="form-input" placeholder={cards.water_consumed ?? '0'}
              value={water} onChange={e => setWater(e.target.value)} step="0.1" min="0" max="20" />
          </div>
          <button className="btn-primary" onClick={handleLogProgress} disabled={saving} style={{ flexShrink: 0 }}>
            {saving ? <span className="spinner" /> : 'Log Progress'}
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2">
        <ChartCard title="Weekly Calories">
          <WeeklyCaloriesChart data={charts.weekly_calories || []} />
        </ChartCard>
        <ChartCard title="Nutrition Distribution">
          <NutritionPieChart data={charts.nutrition_distribution || []} />
        </ChartCard>
        <ChartCard title="Workout Activity">
          <WorkoutProgressChart data={charts.workout_progress || []} />
        </ChartCard>
        <ChartCard title="Weight Progress">
          <WeightProgressChart data={charts.weight_progress || []} />
        </ChartCard>
      </div>

      {/* Recent activity */}
      <div className="grid-2">
        <div className="stat-card">
          <div className="section-title" style={{ fontSize: '14px' }}>Today's Meals</div>
          {!recent.meals?.length ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No meals logged yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recent.meals.slice(0, 6).map(m => (
                <div key={m.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-card2)',
                }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>{m.food_name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '8px' }}>{m.meal_type}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '600' }}>{m.calories} kcal</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stat-card">
          <div className="section-title" style={{ fontSize: '14px' }}>Today's Workouts</div>
          {!recent.workouts?.length ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No workouts logged yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recent.workouts.slice(0, 6).map(w => (
                <div key={w.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-card2)',
                }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>{w.exercise_name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '8px' }}>{w.category}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#9c27b0' }}>{w.sets}×{w.reps} @ {w.weight}kg</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
