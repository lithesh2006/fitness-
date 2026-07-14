import { useNavigate } from 'react-router-dom';
import { Calendar, Menu, Flame } from 'lucide-react';

export default function Navbar({ date, setDate, user, setSidebarOpen }) {
  const navigate = useNavigate();

  return (
    <nav style={{
      padding: '12px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid hsl(var(--border-color))',
      background: 'rgba(17,24,39,0.9)', backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 40,
    }}>
      {/* Left: hamburger + brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={() => setSidebarOpen(s => !s)}
          style={{
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', display: 'none', padding: '4px',
          }}
          id="hamburger"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}
        >
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            width: '30px', height: '30px', borderRadius: '7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Flame size={16} color="white" />
          </div>
          <span style={{ fontSize: '17px', fontWeight: '800', fontFamily: 'var(--font-display)' }} className="text-gradient">
            AuraFit
          </span>
        </div>
      </div>

      {/* Center: date picker */}
      {date && setDate && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid hsl(var(--border-color))',
          padding: '7px 14px', borderRadius: '20px',
        }}>
          <Calendar size={14} color="var(--text-secondary)" />
          <input
            type="date" value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-primary)',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer', colorScheme: 'dark',
              fontFamily: 'Inter, sans-serif',
            }}
          />
        </div>
      )}

      {/* Right: user chip */}
      {user && (
        <div
          onClick={() => navigate('/profile')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
            background: 'rgba(255,255,255,0.04)', padding: '6px 12px',
            borderRadius: '20px', border: '1px solid hsl(var(--border-color))',
          }}
        >
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '11px', color: 'white',
          }}>
            {user.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span style={{ fontSize: '13px', fontWeight: '500' }}>{user.full_name}</span>
        </div>
      )}
    </nav>
  );
}
