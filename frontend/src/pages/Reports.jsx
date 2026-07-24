import { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { showToast } from '../utils/toast';
import Footer from '../components/Footer';
import { WeightProgressChart } from '../components/ProgressChart';
import { RefreshCw, Calendar, FileDown } from 'lucide-react';

function StatRow({ label, consumed, goal, unit, color = 'var(--accent)' }) {
  const pct      = Math.min(Math.round(((consumed || 0) / (goal || 1)) * 100), 100);
  const exceeded = (consumed || 0) > (goal || 1);
  const barColor = exceeded ? '#e53935' : (pct >= 100 ? '#4caf50' : pct >= 80 ? '#ff9800' : color);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ fontWeight: '600', color: '#fff' }}>
            {typeof consumed === 'number' ? consumed.toFixed(consumed % 1 === 0 ? 0 : 1) : consumed || 0} {unit}
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>/ {typeof goal === 'number' ? goal.toFixed(goal % 1 === 0 ? 0 : 1) : goal || 0} {unit}</span>
        </div>
      </div>
      <div className="progress-bar-track" style={{ height: '5px' }}>
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, unit, color, icon }) {
  return (
    <div className="stat-card" style={{ textAlign: 'center', padding: '16px', borderBottom: '3px solid ' + color }}>
      <div style={{ fontSize: '22px', marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-display)', color }}>
        {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 1) : value ?? '--'}
      </div>
      {unit && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{unit}</div>}
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
}

export default function Reports() {
  const today = new Date().toISOString().split('T')[0];
  const [tab,         setTab]         = useState('daily');
  const [date,        setDate]        = useState(today);
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'daily')        res = await reportsAPI.getDailyReport(date);
      else if (tab === 'weekly')  res = await reportsAPI.getWeeklyReport(date);
      else                        res = await reportsAPI.getMonthlyReport(date);
      setData(res.data);
    } catch { showToast('Failed to load report', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab, date]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const type = tab.charAt(0).toUpperCase() + tab.slice(1);
      const res  = await reportsAPI.downloadPdf(type, date);
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `${tab}_report_${date}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Report downloaded!', 'success');
    } catch { showToast('Failed to generate PDF', 'error'); }
    finally { setDownloading(false); }
  };

  const tabBtn = (t, label) => (
    <button
      onClick={() => setTab(t)}
      style={{
        padding: '7px 18px', borderRadius: '5px', cursor: 'pointer',
        fontSize: '13px', fontWeight: '600', fontFamily: 'Inter, sans-serif',
        background:   tab === t ? 'var(--accent)' : 'transparent',
        border:       '1px solid ' + (tab === t ? 'transparent' : 'hsl(var(--border-color))'),
        color:        tab === t ? '#fff' : 'var(--text-secondary)',
        transition:   'all 0.15s',
      }}
    >{label}</button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Analyze your fitness progress</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={load} style={{ fontSize: '13px', padding: '7px 14px' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="btn-primary" onClick={handleDownload} disabled={downloading} style={{ fontSize: '13px', padding: '7px 14px' }}>
            {downloading ? <span className="spinner" /> : <><FileDown size={13} /> Download PDF</>}
          </button>
        </div>
      </div>

      {/* Tabs + date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-card)', padding: '5px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
          {tabBtn('daily', 'Daily')}
          {tabBtn('weekly', 'Weekly')}
          {tabBtn('monthly', 'Monthly')}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', padding: '7px 12px', borderRadius: '6px', border: '1px solid hsl(var(--border-color))' }}>
          <Calendar size={13} color="var(--text-secondary)" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '500', cursor: 'pointer', colorScheme: 'dark', fontFamily: 'Inter, sans-serif' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px' }}>
          <span className="spinner" />
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Generating report...</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="grid-4">
        <SummaryCard label="Calories Consumed" value={data.calories_consumed} unit="kcal" color="var(--accent)" icon="🔥" />
        <SummaryCard label="Calories Goal"      value={data.calories_goal}     unit="kcal" color="#2196f3"       icon="🎯" />
        <SummaryCard label="Remaining"          value={data.calories_remaining} unit="kcal" color="#4caf50"     icon="✅" />
        <SummaryCard label="Workouts Done"      value={data.workout_completed}  unit=""    color="#9c27b0"       icon="🏋" />
      </div>

      <div className="stat-card">
        <div className="section-title" style={{ fontSize: '14px' }}>Nutrition Breakdown</div>
        <StatRow label="Calories"      consumed={data.calories_consumed} goal={data.calories_goal} unit="kcal" color="var(--accent)" />
        <StatRow label="Protein"       consumed={data.protein_consumed}  goal={data.protein_goal}  unit="g"    color="#e53935"       />
        <StatRow label="Carbohydrates" consumed={data.carbs_consumed}    goal={data.carbs_goal}    unit="g"    color="#ff9800"       />
        <StatRow label="Fat"           consumed={data.fat_consumed}      goal={data.fat_goal}      unit="g"    color="#ffeb3b"       />
        <StatRow label="Fiber"         consumed={data.fiber_consumed}    goal={data.fiber_goal}    unit="g"    color="#4caf50"       />
        <StatRow label="Water"         consumed={data.water_consumed}    goal={data.water_goal}    unit="L"    color="#00bcd4"       />
      </div>

      {data.workouts_list?.length > 0 && (
        <div className="stat-card">
          <div className="section-title" style={{ fontSize: '14px' }}>Workouts Completed</div>
          <table className="data-table">
            <thead><tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Weight</th><th>Duration</th></tr></thead>
            <tbody>
              {data.workouts_list.map((w, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: '500', color: '#fff' }}>{w.exercise_name}</td>
                  <td>{w.sets}</td>
                  <td>{w.reps}</td>
                  <td style={{ color: '#ff9800' }}>{w.weight} kg</td>
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
        Period: {data.start_date} → {data.end_date}
      </div>

      <div className="grid-4">
        <SummaryCard label="Total Calories"     value={data.total_calories}  unit="kcal" color="var(--accent)" icon="🔥" />
        <SummaryCard label="Avg Daily Calories" value={data.avg_calories}    unit="kcal" color="#2196f3"       icon="📊" />
        <SummaryCard label="Total Workouts"     value={data.total_workouts}  unit=""     color="#9c27b0"       icon="🏋" />
        <SummaryCard label="Total Duration"     value={data.total_duration}  unit="min"  color="#4caf50"       icon="⏱" />
      </div>

      <div className="stat-card">
        <div className="section-title" style={{ fontSize: '14px' }}>Average Daily Nutrition</div>
        <StatRow label="Avg Calories"      consumed={data.avg_calories} goal={data.calories_goal} unit="kcal" color="var(--accent)" />
        <StatRow label="Avg Protein"       consumed={data.avg_protein}  goal={data.protein_goal}  unit="g"    color="#e53935"       />
        <StatRow label="Avg Carbohydrates" consumed={data.avg_carbs}    goal={data.carbs_goal}    unit="g"    color="#ff9800"       />
        <StatRow label="Avg Fat"           consumed={data.avg_fat}      goal={data.fat_goal}      unit="g"    color="#ffeb3b"       />
        <StatRow label="Avg Fiber"         consumed={data.avg_fiber}    goal={data.fiber_goal}    unit="g"    color="#4caf50"       />
        <StatRow label="Avg Water"         consumed={data.avg_water}    goal={data.water_goal}    unit="L"    color="#00bcd4"       />
      </div>

      <div className="stat-card">
        <div className="section-title" style={{ fontSize: '14px' }}>Weight Progress</div>
        <div className="grid-4" style={{ marginBottom: '16px' }}>
          <SummaryCard label="Start Weight" value={data.start_weight} unit="kg" color="#2196f3"  icon="📍" />
          <SummaryCard label="End Weight"   value={data.end_weight}   unit="kg" color="#9c27b0"  icon="🏁" />
          <SummaryCard label="Avg Weight"   value={data.avg_weight}   unit="kg" color="#ff9800"  icon="📊" />
          <SummaryCard label="Min / Max"    value={`${data.min_weight} / ${data.max_weight}`} unit="kg" color="#4caf50" icon="📈" />
        </div>
        {data.weight_progress_history?.length > 0 && (
          <WeightProgressChart data={data.weight_progress_history.map(w => ({ day: w.date, date: w.date, weight: w.weight }))} />
        )}
      </div>
    </div>
  );
}
