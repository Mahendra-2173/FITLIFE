export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'rgba(139,92,246,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={28} color="var(--accent-purple)" />
        </div>
      )}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{title}</h3>
        {description && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{description}</p>}
      </div>
      {action}
    </div>
  );
}
