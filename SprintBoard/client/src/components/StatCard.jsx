import { useEffect, useState } from 'react';

const ICONS = {
  forest: '▣',
  default: '◉',
  amber: '◌',
  sky: '◎',
  success: '✓',
  danger: '!',
};

export default function StatCard({ label, value, tone = 'default', delay = 0 }) {
  const [display, setDisplay] = useState(0);
  const numeric = Number(value) || 0;

  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 650;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(numeric * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [numeric]);

  return (
    <article className={`stat-card tone-${tone}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-top">
        <span className="stat-icon" aria-hidden="true">
          {ICONS[tone] || ICONS.default}
        </span>
        <p className="stat-label">{label}</p>
      </div>
      <p className="stat-value">{display}</p>
      <div className="stat-glow" aria-hidden="true" />
    </article>
  );
}
