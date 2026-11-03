import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import emptyProjects from '../assets/empty-projects.svg';

export default function Projects() {
  const { push } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.data.projects);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditing(project);
    setForm({ name: project.name, description: project.description || '' });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/projects/${editing._id}`, form);
        push('Project updated', 'success');
      } else {
        await api.post('/projects', form);
        push('Project created', 'success');
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete project "${project.name}" and all of its issues?`)) return;
    try {
      await api.delete(`/projects/${project._id}`);
      push('Project deleted', 'info');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="full-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="stack-lg fade-in">
      <div className="page-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Projects</h1>
          <p className="muted">Create and manage the projects you own.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          New project
        </button>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Spin up your first project to start tracking issues."
          illustration={emptyProjects}
          action={
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              Create project
            </button>
          }
        />
      ) : (
        <div className="project-grid">
          {projects.map((project, index) => (
            <article key={project._id} className="project-tile" style={{ animationDelay: `${index * 60}ms` }}>
              <div className="project-tile-top">
                <h2>
                  <Link to={`/projects/${project._id}`}>{project.name}</Link>
                </h2>
                <span className="pill">{project.issueCount || 0} issues</span>
              </div>
              <p className="muted">{project.description || 'No description provided.'}</p>
              <div className="project-tile-meta">
                <span className="muted small">
                  by {project.createdBy?.name || 'You'} ·{' '}
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
                <div className="row-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(project)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger-ghost btn-sm"
                    onClick={() => handleDelete(project)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen ? (
        <Modal title={editing ? 'Edit project' : 'New project'} onClose={() => setModalOpen(false)}>
          <form className="form-stack" onSubmit={handleSave}>
            {formError ? <div className="alert alert-error">{formError}</div> : null}
            <label className="field">
              <span>Name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Description</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Update project' : 'Create project'}
            </button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
