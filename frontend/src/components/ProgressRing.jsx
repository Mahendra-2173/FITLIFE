export default function ProgressRing({ value = 0, max = 100, size = 120, strokeWidth = 10, color = 'var(--accent-purple)', label, sublabel }) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} className="timer-ring">
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '0.1rem'
      }}>
        {label && <div style={{ fontSize: size > 100 ? '1.3rem' : '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{label}</div>}
        {sublabel && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{sublabel}</div>}
      </div>
    </div>
  );
}
