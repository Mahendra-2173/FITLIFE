import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message, onRetry, title = 'Something went wrong' }) {
  return (
    <div className="error-state">
      <AlertCircle size={40} />
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{title}</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{message}</p>
      </div>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          <RefreshCw size={16} /> Try Again
        </button>
      )}
    </div>
  );
}
