import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Menu, Bell, Activity } from 'lucide-react';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/workout':   'Strength Training',
  '/nutrition': 'Nutrition Management',
  '/reports':   'Reports',
  '/profile':   'Profile',
};

export default function Navbar({ date, setDate, user, setSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Dashboard';

  return (
    <nav style={{
      padding: '0 24px',
      height: '56px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid hsl(var(--border-color))',
      background: 'var(--bg-card)',
      position: 'sticky', top: 0, zIndex: 40,
      flexShrink: 0,
    }}>

      {/* Left: hamburger + page title */}
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

        {/* Mobile brand */}
        <div
          style={{ display: 'none', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          className="mobile-brand"
          onClick={() => navigate('/dashboard')}
        >
          <div style={{
            background: 'var(--accent)', width: '28px', height: '28px',
            borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={15} color="white" />
          </div>
        </div>

        <h2 style={{
          fontSize: '18px', fontWeight: '700',
          fontFamily: 'var(--font-display)',
          color: 'var(--accent)',
          margin: 0,
        }}>
          {title}
        </h2>
      </div>

      {/* Right: date picker + bell + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        {date && setDate && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--bg-input)',
            border: '1px solid hsl(var(--border-color))',
            padding: '6px 12px', borderRadius: '6px',
          }}>
            <Calendar size={13} color="var(--text-secondary)" />
            <input
              type="date" value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                background: 'transparent', border: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px', fontWeight: '500',
                cursor: 'pointer', colorScheme: 'dark',
                fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>
        )}

        <button style={{
          background: 'none', border: 'none',
          color: 'var(--text-secondary)', cursor: 'pointer',
          padding: '6px', borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <Bell size={17} />
        </button>

        {user && (
          <div
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--accent)',
              fontWeight: '700', fontSize: '13px', color: 'white',
              cursor: 'pointer', flexShrink: 0,
            }}
            title={user.full_name}
          >
            {user.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
      </div>
    </nav>
  );
}
