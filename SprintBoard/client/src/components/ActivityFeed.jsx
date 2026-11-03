export default function ActivityFeed({ activities = [], title = 'Recent activity' }) {
  return (
    <section className="panel">
      <div className="panel-header panel-header-row">
        <h2>{title}</h2>
        {activities.length ? <span className="pill soft">{activities.length} events</span> : null}
      </div>
      {activities.length === 0 ? (
        <p className="muted pad">No activity yet. Create or update an issue to start the trail.</p>
      ) : (
        <ul className="activity-list">
          {activities.map((item, index) => (
            <li key={item._id} style={{ animationDelay: `${index * 45}ms` }} className="activity-item">
              <div className="activity-dot" aria-hidden="true" />
              <div>
                <p>{item.action}</p>
                <time className="muted small" dateTime={item.createdAt}>
                  {new Date(item.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
