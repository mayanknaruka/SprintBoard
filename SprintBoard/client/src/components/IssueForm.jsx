import { useState } from 'react';

const STATUSES = ['To Do', 'In Progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];

export default function IssueForm({
  initial = {},
  projects = [],
  lockProject = false,
  submitLabel = 'Save issue',
  onSubmit,
}) {
  const [form, setForm] = useState({
    title: initial.title || '',
    description: initial.description || '',
    status: initial.status || 'To Do',
    priority: initial.priority || 'Medium',
    projectId: initial.projectId || projects[0]?._id || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.projectId) {
      setError('Select a project');
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save issue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      {error ? <div className="alert alert-error">{error}</div> : null}

      <label className="field">
        <span>Title</span>
        <input name="title" value={form.title} onChange={handleChange} placeholder="Short, actionable title" required />
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          placeholder="What needs to happen?"
        />
      </label>

      <div className="form-row">
        <label className="field">
          <span>Status</span>
          <select name="status" value={form.status} onChange={handleChange}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Priority</span>
          <select name="priority" value={form.priority} onChange={handleChange}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!lockProject ? (
        <label className="field">
          <span>Project</span>
          <select name="projectId" value={form.projectId} onChange={handleChange} required>
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
