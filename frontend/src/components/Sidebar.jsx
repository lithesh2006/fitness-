import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Utensils, Dumbbell, BarChart3,
  User, LogOut, X, Activity
} from 'lucide-react';
import { authAPI } from '../services/api';

const navItems = [
  { path: '/dashboard',  label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/workout',    label: 'Workout',          icon: Dumbbell },
  { path: '/nutrition',  label: 'Nutrition',        icon: Utensils },
  { path: '/reports',    label: 'Reports',          icon: BarChart3 },
  { path: '/profile',    label: 'Profile',          icon: User },
];

export default function Sidebar({ user, onLogout, open, setOpen }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) await authAPI.logout(refresh);
    } catch (_) {}
    onLogout();
    navigate('/login');
  };

  const handleNav = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 49 }}
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`}>

        {/* ── Logo ── */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid hsl(var(--border-color))',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={() => handleNav('/dashboard')}
          >
            <div style={{
              background: 'var(--accent)',
              width: '34px', height: '34px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Activity size={18} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{
                fontSize: '15px', fontWeight: '800',
                fontFamily: 'var(--font-display)',
                color: 'var(--accent)',
                lineHeight: 1.1,
                letterSpacing: '0.5px',
              }}>
                FITNESS
              </div>
              <div style={{
                fontSize: '10px', color: 'var(--text-secondary)',
                fontWeight: '500', letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>
                Tracker
              </div>
            </div>
          </div>

          {/* Mobile close */}
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)',
              cursor: 'pointer', display: 'none', padding: '4px',
            }}
            className="mobile-close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Nav links ── */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => handleNav(path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                  background: active ? 'var(--accent)' : 'transparent',
                  border: '1px solid transparent',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer', width: '100%', textAlign: 'left',
                  fontSize: '13px', fontWeight: active ? '600' : '400',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(229,57,53,0.1)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* ── User + Logout ── */}
        <div style={{ borderTop: '1px solid hsl(var(--border-color))', padding: '12px 8px' }}>
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', marginBottom: '4px',
            }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: '12px', color: 'white', flexShrink: 0,
              }}>
                {user.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{
                  fontSize: '12px', fontWeight: '600',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {user.full_name}
                </div>
                <div style={{
                  fontSize: '10px', color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: '1px solid transparent',
              color: 'var(--text-secondary)', cursor: 'pointer', width: '100%',
              fontSize: '13px', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--accent)';
              e.currentTarget.style.background = 'rgba(229,57,53,0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
