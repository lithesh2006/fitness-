import { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { showToast } from '../utils/toast';
import Footer from '../components/Footer';
import { WeightProgressChart } from '../components/ProgressChart';
import { FileDown, RefreshCw, Calendar } from 'lucide-react';

function StatRow({ label, consumed, goal, unit, color = '#3b82f6' }) {
  const pct = Math.min(Math.round(((consumed || 0) / (goal || 1)) * 100), 100);
  const exceeded = (consumed || 0) > (goal || 1);
  let barColor = color;
  if (pct >= 100) barColor = '#10b981';
  else if (pct >= 80) barColor = '#f59e0b';
  if (exceeded) barColor = '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontWeight: '600' }}>{typeof consumed === 'number' ? consumed.toFixed(consumed % 1 === 0 ? 0 : 1) : consumed || 0} {unit}</span>
          <span style={{ color: 'var(--text-secondary)' }}>/ {typeof goal === 'number' ? goal.toFixed(goal % 1 === 0 ? 0 : 1) : goal || 0} {unit}</span>
        </div>
      </div>
      <div className="progress-bar-track" style={{ height: '6px' }}>
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, unit, color, icon }) {
  return (
    <div className="stat-card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '24px', marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-display)', color }}>
        {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 1) : value ?? '--'}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{unit && <span>{unit} · </span>}{label}</div>
    </div>
  );
}

export default function Reports() {
  const today = new Date().toISOString().split('T')[0];
  const [tab, setTab] = useState('daily');
  const [date, setDate] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'daily') res = await reportsAPI.getDailyReport(date);
      else if (tab === 'weekly') res = await reportsAPI.getWeeklyReport(date);
      else res = await reportsAPI.getMonthlyReport(date);
      setData(res.data);
    } catch {
      showToast('Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tab, date]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const type = tab.charAt(0).toUpperCase() + tab.slice(1);
      const res = await reportsAPI.downloadPdf(type, date);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tab}_report_${date}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Report downloaded!', 'success');
    } catch {
      showToast('Failed to generate PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const tabStyle = (t) => ({
    padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
    background: tab === t ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))' : 'transparent',
    border: tab === t ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
    color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Reports</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Analyze your fitness progress</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn-primary" onClick={handleDownload} disabled={downloading}>
            {downloading ? <span className="spinner" /> : <><FileDown size={14} /> Download PDF</>}
          </button>
        </div>
      </div>

      {/* Tabs + date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '5px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
          <button style={tabStyle('daily')} onClick={() => setTab('daily')}>Daily</button>
          <button style={tabStyle('weekly')} onClick={() => setTab('weekly')}>Weekly</button>
          <button style={tabStyle('monthly')} onClick={() => setTab('monthly')}>Monthly</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', padding: '7px 14px', borderRadius: '20px', border: '1px solid hsl(var(--border-color))' }}>
          <Calendar size={14} color="var(--text-secondary)" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', colorScheme: 'dark', fontFamily: 'Inter, sans-serif' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px' }}>
          <span className="spinner" style={{ width: '28px', height: '28px' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Generating report...</span>
        </div>
      ) : !data ? null : tab === 'daily' ? (
        <DailyReport data={data} />
      ) : (
        <RangeReport data={data} tab={tab} />
      )}

      <Footer />
    </div>
  );
}

function DailyReport({ data }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Summary cards */}
      <div className="grid-4">
        <SummaryCard label="Calories Consumed" value={data.calories_consumed} unit="kcal" color="#f59e0b" icon="🔥" />
        <SummaryCard label="Calories Goal" value={data.calories_goal} unit="kcal" color="#3b82f6" icon="🎯" />
        <SummaryCard label="Calories Remaining" value={data.calories_remaining} unit="kcal" color="#10b981" icon="✅" />
        <SummaryCard label="Workouts Done" value={data.workout_completed} unit="" color="#8b5cf6" icon="🏋" />
      </div>

      {/* Nutrition breakdown */}
      <div className="stat-card">
        <div className="section-title">📊 Nutrition Breakdown</div>
        <StatRow label="Calories" consumed={data.calories_consumed} goal={data.calories_goal} unit="kcal" color="#3b82f6" />
        <StatRow label="Protein" consumed={data.protein_consumed} goal={data.protein_goal} unit="g" color="#3b82f6" />
        <StatRow label="Carbohydrates" consumed={data.carbs_consumed} goal={data.carbs_goal} unit="g" color="#8b5cf6" />
        <StatRow label="Fat" consumed={data.fat_consumed} goal={data.fat_goal} unit="g" color="#f59e0b" />
        <StatRow label="Fiber" consumed={data.fiber_consumed} goal={data.fiber_goal} unit="g" color="#10b981" />
        <StatRow label="Water" consumed={data.water_consumed} goal={data.water_goal} unit="L" color="#06b6d4" />
      </div>

      {/* Workout list */}
      {data.workouts_list?.length > 0 && (
        <div className="stat-card">
          <div className="section-title">💪 Workouts Completed</div>
          <table className="data-table">
            <thead><tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Weight</th><th>Duration</th></tr></thead>
            <tbody>
              {data.workouts_list.map((w, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: '500' }}>{w.exercise_name}</td>
                  <td>{w.sets}</td>
                  <td>{w.reps}</td>
                  <td style={{ color: '#f59e0b' }}>{w.weight} kg</td>
                  <td>{w.duration} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RangeReport({ data, tab }) {
  const period = tab === 'weekly' ? '7 Days' : '30 Days';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        Period: {data.start_date} → {data.end_date}
      </div>

      {/* Summary */}
      <div className="grid-4">
        <SummaryCard label="Total Calories" value={data.total_calories} unit="kcal" color="#f59e0b" icon="🔥" />
        <SummaryCard label={`Avg Daily Calories`} value={data.avg_calories} unit="kcal" color="#3b82f6" icon="📊" />
        <SummaryCard label="Total Workouts" value={data.total_workouts} unit="" color="#8b5cf6" icon="🏋" />
        <SummaryCard label="Total Duration" value={data.total_duration} unit="min" color="#10b981" icon="⏱" />
      </div>

      {/* Nutrition averages */}
      <div className="stat-card">
        <div className="section-title">🥗 Average Daily Nutrition</div>
        <StatRow label="Avg Calories" consumed={data.avg_calories} goal={data.calories_goal} unit="kcal" color="#3b82f6" />
        <StatRow label="Avg Protein" consumed={data.avg_protein} goal={data.protein_goal} unit="g" color="#3b82f6" />
        <StatRow label="Avg Carbohydrates" consumed={data.avg_carbs} goal={data.carbs_goal} unit="g" color="#8b5cf6" />
        <StatRow label="Avg Fat" consumed={data.avg_fat} goal={data.fat_goal} unit="g" color="#f59e0b" />
        <StatRow label="Avg Fiber" consumed={data.avg_fiber} goal={data.fiber_goal} unit="g" color="#10b981" />
        <StatRow label="Avg Water" consumed={data.avg_water} goal={data.water_goal} unit="L" color="#06b6d4" />
      </div>

      {/* Weight progress */}
      <div className="stat-card">
        <div className="section-title">⚖ Weight Progress</div>
        <div className="grid-4" style={{ marginBottom: '16px' }}>
          <SummaryCard label="Start Weight" value={data.start_weight} unit="kg" color="#3b82f6" icon="📍" />
          <SummaryCard label="End Weight" value={data.end_weight} unit="kg" color="#8b5cf6" icon="🏁" />
          <SummaryCard label="Avg Weight" value={data.avg_weight} unit="kg" color="#f59e0b" icon="📊" />
          <SummaryCard label="Min / Max" value={`${data.min_weight} / ${data.max_weight}`} unit="kg" color="#10b981" icon="📈" />
        </div>
        {data.weight_progress_history?.length > 0 && (
          <WeightProgressChart data={data.weight_progress_history.map(w => ({ day: w.date, date: w.date, weight: w.weight }))} />
        )}
      </div>
    </div>
  );
}
