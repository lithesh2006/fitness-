import { Flame, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      padding: '16px 24px',
      borderTop: '1px solid hsl(var(--border-color))',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: '12px', color: 'var(--text-secondary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Flame size={14} color="var(--accent-blue)" />
        <span>AuraFit © {new Date().getFullYear()}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        Built with <Heart size={12} color="#ef4444" style={{ margin: '0 2px' }} /> for a healthier you
      </div>
    </footer>
  );
}
