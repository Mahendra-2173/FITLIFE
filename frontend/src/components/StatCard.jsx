export default function StatCard({ icon: Icon, label, value, sub, color = 'var(--accent-purple)', trend }) {
  return (
    <div className="stat-card animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div className="stat-icon" style={{ background: `${color}18` }}>
          {Icon && <Icon size={20} color={color} />}
        </div>
        {trend !== undefined && (
          <span style={{
            fontSize: '0.72rem', fontWeight: 600,
            color: trend >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            padding: '0.2rem 0.5rem', borderRadius: 999
          }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{sub}</div>}
      </div>
    </div>
  );
}
