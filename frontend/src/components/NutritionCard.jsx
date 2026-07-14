/**
 * Displays a single macro stat with goal/consumed/remaining + progress bar.
 * Props: label, icon, consumed, goal, unit, color
 */
export default function NutritionCard({ label, icon, consumed = 0, goal = 1, unit = '', color = '#3b82f6' }) {
  const pct = Math.min((consumed / goal) * 100, 100);
  const remaining = Math.max(goal - consumed, 0);
  const exceeded = consumed > goal;

  // Color coding
  let barColor = color;
  if (pct >= 100) barColor = '#10b981';
  else if (pct >= 80) barColor = '#f59e0b';

  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>{icon}</span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{label}</span>
        </div>
        {exceeded && (
          <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            Over
          </span>
        )}
      </div>

      {/* Big number */}
      <div>
        <span style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)' }}>
          {typeof consumed === 'number' ? consumed.toFixed(consumed % 1 === 0 ? 0 : 1) : consumed}
        </span>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' }}>
          / {typeof goal === 'number' ? goal.toFixed(goal % 1 === 0 ? 0 : 1) : goal} {unit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>

      {/* Remaining */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <span>{pct.toFixed(0)}% of goal</span>
        <span style={{ color: exceeded ? '#ef4444' : 'var(--text-secondary)' }}>
          {exceeded ? `+${(consumed - goal).toFixed(1)} ${unit} over` : `${typeof remaining === 'number' ? remaining.toFixed(remaining % 1 === 0 ? 0 : 1) : remaining} ${unit} left`}
        </span>
      </div>
    </div>
  );
}
