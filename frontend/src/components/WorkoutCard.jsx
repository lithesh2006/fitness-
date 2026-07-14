import { Trash2, Edit2, Dumbbell, Clock, RotateCcw } from 'lucide-react';

const categoryColors = {
  Chest: '#ef4444', Back: '#3b82f6', Shoulders: '#f59e0b',
  Arms: '#8b5cf6', Legs: '#10b981', Core: '#06b6d4', Cardio: '#ec4899',
};

export default function WorkoutCard({ workout, onEdit, onDelete }) {
  // Normalize field names — API returns exercise_category, exercise_name
  const category = workout.exercise_category || workout.category || 'Other';
  const exerciseName = workout.exercise_name || workout.name || 'Exercise';
  const color = categoryColors[category] || '#3b82f6';

  return (
    <div className="glass-panel-2" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="badge"
            style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
          >
            {category}
          </span>
          <span style={{ fontWeight: '700', fontSize: '15px' }}>{exerciseName}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {onEdit && (
            <button
              onClick={() => onEdit(workout)}
              style={{
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                color: '#3b82f6', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}
            >
              <Edit2 size={13} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(workout.id)}
              style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#ef4444', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <StatPill icon={<Dumbbell size={12} />} label={`${workout.sets} × ${workout.reps} reps`} color={color} />
        <StatPill icon={<span style={{ fontSize: '12px' }}>⚖</span>} label={`${workout.weight} kg`} color={color} />
        <StatPill icon={<Clock size={12} />} label={`${workout.duration} min`} color={color} />
        <StatPill icon={<RotateCcw size={12} />} label={`Rest ${workout.rest_time}s`} color={color} />
      </div>
    </div>
  );
}

function StatPill({ icon, label, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      background: `${color}12`, border: `1px solid ${color}25`,
      padding: '3px 8px', borderRadius: '99px',
      fontSize: '12px', color: 'var(--text-secondary)',
    }}>
      <span style={{ color }}>{icon}</span>
      {label}
    </div>
  );
}
