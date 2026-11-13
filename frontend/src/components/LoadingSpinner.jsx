export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  return (
    <div className="loading-state">
      <div className={`spinner ${size === 'sm' ? 'spinner-sm' : ''}`} />
      {text && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{text}</p>}
    </div>
  );
}

export function InlineSpinner() {
  return <div className="spinner spinner-sm" style={{ display: 'inline-block' }} />;
}
