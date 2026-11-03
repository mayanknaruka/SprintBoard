export default function ChartBars({ title, items = [], color = 'var(--accent)' }) {
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <section className="panel chart-panel">
      <div className="panel-header">
        <h2>{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className="muted pad">No data yet</p>
      ) : (
        <div className="chart-bars">
          {items.map((item, index) => (
            <div key={item.label} className="chart-row" style={{ animationDelay: `${index * 80}ms` }}>
              <span className="chart-label">{item.label}</span>
              <div className="chart-track" title={`${item.label}: ${item.count}`}>
                <div
                  className="chart-fill"
                  style={{
                    '--target-width': `${(item.count / max) * 100}%`,
                    background: color,
                    animationDelay: `${120 + index * 90}ms`,
                  }}
                />
              </div>
              <span className="chart-count">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
