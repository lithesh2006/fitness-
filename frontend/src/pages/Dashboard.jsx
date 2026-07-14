import { useState, useEffect } from 'react';
import { dashboardAPI, reportsAPI } from '../services/api';
import { showToast } from '../utils/toast';
import NutritionCard from '../components/NutritionCard';
import { WeeklyCaloriesChart, NutritionPieChart, WorkoutProgressChart, WeightProgressChart } from '../components/ProgressChart';
import Footer from '../components/Footer';
import { Scale, Activity, Droplets, Dumbbell, TrendingUp, RefreshCw } from 'lucide-react';

function MacroStat({ label, icon, consumed, goal, unit, color }) {
  const pct = Math.min(Math.round((consumed / (goal || 1)) * 100), 100);
  const exceeded = consumed > goal;
  let barColor = color;
  if (pct >= 100) barColor = '#10b981';
  else if (pct >= 80) barColor = '#f59e0b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
        <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{icon}</span>{label}
        </span>
        <span style={{ fontWeight: '600', color: exceeded ? '#ef4444' : 'var(--text-primary)' }}>
          {typeof consumed === 'number' ? consumed.toFixed(consumed % 1 === 0 ? 0 : 1) : consumed}
          <span style={{ color: 'var(--text-secondary)', fontWeight: '400', fontSize: '11px' }}>
            /{typeof goal === 'number' ? goal.toFixed(goal % 1 === 0 ? 0 : 1) : goal} {unit}
          </span>
        </span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="stat-card">
      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '14px' }}>{title}</div>
      {children}
    </div>
  );
}

export default function Dashboard({ date }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState('');
  const [water, setWater] = useState('');
  const [saving, setSaving] = useState(false);

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
      const msg = err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Failed to save progress';
      // Update instead if already exists
      if (err.response?.status === 400) {
        try {
          const logs = await reportsAPI.getProgress();
          const today = logs.data.find(p => p.date === date);
          if (today) {
            await reportsAPI.logProgress({ ...payload });
          }
        } catch {}
        showToast('Progress updated!', 'success');
        load();
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '12px' }}>
        <span className="spinner" style={{ width: '28px', height: '28px' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</span>
      </div>
    );
  }

  const cards = data?.cards || {};
  const charts = data?.charts || {};
  const recent = data?.recent_activity || {};

  const bmiCategory = (bmi) => {
    if (bmi < 18.5) return { label: 'Underweight', color: '#f59e0b' };
    if (bmi < 25) return { label: 'Normal', color: '#10b981' };
    if (bmi < 30) return { label: 'Overweight', color: '#f59e0b' };
    return { label: 'Obese', color: '#ef4444' };
  };
  const bmiInfo = bmiCategory(cards.bmi || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="btn-secondary" onClick={load} style={{ gap: '6px' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Top stat cards */}
      <div className="grid-4">
        {/* Calories */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))', border: '1px solid rgba(59,130,246,0.25)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            🔥 Daily Calories
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
            {cards.calories_consumed ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            / {cards.calories_goal ?? 0} kcal &nbsp;·&nbsp;
            <span style={{ color: '#10b981' }}>{cards.calories_remaining ?? 0} left</span>
          </div>
          <div className="progress-bar-track" style={{ marginTop: '10px' }}>
            <div className="progress-bar-fill" style={{
              width: `${Math.min((cards.calories_consumed / (cards.calories_goal || 1)) * 100, 100)}%`,
              background: '#3b82f6'
            }} />
          </div>
        </div>

        {/* BMI */}
        <div className="stat-card">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <TrendingUp size={12} /> BMI
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', fontFamily: 'var(--font-display)', marginBottom: '4px', color: bmiInfo.color }}>
            {cards.bmi ?? '--'}
          </div>
          <span className="badge" style={{ background: `${bmiInfo.color}22`, color: bmiInfo.color, border: `1px solid ${bmiInfo.color}44` }}>
            {bmiInfo.label}
          </span>
        </div>

        {/* Weight */}
        <div className="stat-card">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Scale size={12} /> Current Weight
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', fontFamily: 'var(--font-display)' }}>
            {cards.current_weight ?? '--'}
            <span style={{ fontSize: '16px', color: 'var(--text-secondary)', fontWeight: '400' }}> kg</span>
          </div>
        </div>

        {/* Workouts */}
        <div className="stat-card">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Dumbbell size={12} /> Workouts Done
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', fontFamily: 'var(--font-display)' }}>
            {cards.workout_completed ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>exercises today</div>
        </div>
      </div>

      {/* Macros section */}
      <div className="stat-card">
        <div className="section-title">
          <span>💪</span> Daily Nutrition
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          <MacroStat label="Protein" icon="💪" consumed={cards.protein_consumed ?? 0} goal={cards.protein_goal ?? 1} unit="g" color="#3b82f6" />
          <MacroStat label="Carbohydrates" icon="🍚" consumed={cards.carbs_consumed ?? 0} goal={cards.carbs_goal ?? 1} unit="g" color="#8b5cf6" />
          <MacroStat label="Fat" icon="🥑" consumed={cards.fat_consumed ?? 0} goal={cards.fat_goal ?? 1} unit="g" color="#f59e0b" />
          <MacroStat label="Fiber" icon="🌾" consumed={cards.fiber_consumed ?? 0} goal={cards.fiber_goal ?? 1} unit="g" color="#10b981" />
          <MacroStat label="Water" icon="💧" consumed={cards.water_consumed ?? 0} goal={cards.water_goal ?? 1} unit="L" color="#06b6d4" />
        </div>
      </div>

      {/* Log progress */}
      <div className="stat-card">
        <div className="section-title"><Activity size={16} /> Log Today's Progress</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '140px' }}>
            <label className="form-label"><Scale size={12} style={{ display: 'inline', marginRight: '4px' }} />Weight (kg)</label>
            <input type="number" className="form-input" placeholder={cards.current_weight ?? '70'}
              value={weight} onChange={e => setWeight(e.target.value)} step="0.1" min="20" max="500" />
          </div>
          <div className="form-group" style={{ flex: '1', minWidth: '140px' }}>
            <label className="form-label"><Droplets size={12} style={{ display: 'inline', marginRight: '4px' }} />Water (Litres)</label>
            <input type="number" className="form-input" placeholder={cards.water_consumed ?? '0'}
              value={water} onChange={e => setWater(e.target.value)} step="0.1" min="0" max="20" />
          </div>
          <button className="btn-primary" onClick={handleLogProgress} disabled={saving}
            style={{ flexShrink: 0 }}>
            {saving ? <span className="spinner" /> : 'Log Progress'}
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2">
        <ChartCard title="📊 Weekly Calories">
          <WeeklyCaloriesChart data={charts.weekly_calories || []} />
        </ChartCard>
        <ChartCard title="🥗 Nutrition Distribution">
          <NutritionPieChart data={charts.nutrition_distribution || []} />
        </ChartCard>
        <ChartCard title="🏋 Workout Activity">
          <WorkoutProgressChart data={charts.workout_progress || []} />
        </ChartCard>
        <ChartCard title="⚖ Weight Progress">
          <WeightProgressChart data={charts.weight_progress || []} />
        </ChartCard>
      </div>

      {/* Recent Activity */}
      <div className="grid-2">
        {/* Today's Meals */}
        <div className="stat-card">
          <div className="section-title">🍽 Today's Meals</div>
          {!recent.meals?.length ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No meals logged yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recent.meals.slice(0, 6).map(m => (
                <div key={m.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)',
                }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{m.food_name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '8px' }}>{m.meal_type}</span>
                  </div>
                  <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: '600' }}>{m.calories} kcal</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Workouts */}
        <div className="stat-card">
          <div className="section-title">💪 Today's Workouts</div>
          {!recent.workouts?.length ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No workouts logged yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recent.workouts.slice(0, 6).map(w => (
                <div key={w.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)',
                }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{w.exercise_name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '8px' }}>{w.category}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#8b5cf6' }}>{w.sets}×{w.reps} @ {w.weight}kg</span>
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
