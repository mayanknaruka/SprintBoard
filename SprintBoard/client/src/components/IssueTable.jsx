function Badge({ children, tone }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function priorityTone(priority) {
  if (priority === 'High') return 'danger';
  if (priority === 'Medium') return 'warn';
  return 'neutral';
}

function statusTone(status) {
  if (status === 'Done') return 'success';
  if (status === 'In Progress') return 'warn';
  return 'neutral';
}

const STATUSES = ['To Do', 'In Progress', 'Done'];

function StatusStepper({ issue, onStatusChange }) {
  return (
    <div className="status-stepper" role="group" aria-label={`Status for ${issue.title}`}>
      {STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          className={`status-chip ${issue.status === status ? 'active' : ''} tone-${statusTone(status)}`}
          onClick={() => {
            if (issue.status !== status) onStatusChange?.(issue, status);
          }}
        >
          {status}
        </button>
      ))}
    </div>
  );
}

export default function IssueTable({
  issues,
  onEdit,
  onDelete,
  onStatusChange,
  showProject = false,
}) {
  if (!issues.length) {
    return null;
  }

  return (
    <>
      <div className="table-wrap desktop-only">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              {showProject ? <th>Project</th> : null}
              <th>Status</th>
              <th>Priority</th>
              <th>Created</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {issues.map((issue, index) => (
              <tr key={issue._id} style={{ animationDelay: `${index * 40}ms` }} className="issue-row">
                <td>
                  <div className="issue-title">{issue.title}</div>
                  {issue.description ? <div className="muted small clamp">{issue.description}</div> : null}
                </td>
                {showProject ? <td>{issue.projectId?.name || '—'}</td> : null}
                <td>
                  <StatusStepper issue={issue} onStatusChange={onStatusChange} />
                </td>
                <td>
                  <Badge tone={priorityTone(issue.priority)}>{issue.priority}</Badge>
                </td>
                <td className="muted small">
                  {new Date(issue.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="row-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit?.(issue)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger-ghost btn-sm"
                    onClick={() => onDelete?.(issue)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="issue-card-list mobile-only">
        {issues.map((issue, index) => (
          <article
            key={issue._id}
            className="issue-card"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="issue-card-top">
              <div>
                <h3>{issue.title}</h3>
                {showProject ? <p className="muted small">{issue.projectId?.name || '—'}</p> : null}
              </div>
              <Badge tone={priorityTone(issue.priority)}>{issue.priority}</Badge>
            </div>
            {issue.description ? <p className="muted small clamp-2">{issue.description}</p> : null}
            <StatusStepper issue={issue} onStatusChange={onStatusChange} />
            <div className="issue-card-footer">
              <span className="muted small">
                {new Date(issue.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <div className="row-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit?.(issue)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-danger-ghost btn-sm"
                  onClick={() => onDelete?.(issue)}
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
