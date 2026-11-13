export default function PageHeader({ title, subtitle, action, badge }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          {badge && (
            <div className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>{badge}</div>
          )}
          <h1 className="page-title">{title}</h1>
          {subtitle && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.3rem' }}>{subtitle}</p>
          )}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
    </div>
  );
}
