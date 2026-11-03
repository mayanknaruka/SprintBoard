import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import IssueForm from '../components/IssueForm';
import IssueTable from '../components/IssueTable';
import ActivityFeed from '../components/ActivityFeed';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import emptyIssues from '../assets/empty-issues.svg';

export default function ProjectDetail() {
  const { id } = useParams();
  const socket = useSocket();
  const { push } = useToast();
  const [project, setProject] = useState(null);
  const [issues, setIssues] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data.data.project);
      setIssues(data.data.issues);
      setActivities(data.data.activities);
      setStats(data.data.stats);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket || !id) return undefined;
    socket.emit('project:join', id);

    const onCreated = (issue) => {
      if (String(issue.projectId?._id || issue.projectId) !== String(id)) return;
      setIssues((prev) => [issue, ...prev.filter((i) => i._id !== issue._id)]);
      load();
    };
    const onUpdated = (issue) => {
      if (String(issue.projectId?._id || issue.projectId) !== String(id)) return;
      setIssues((prev) => prev.map((i) => (i._id === issue._id ? issue : i)));
      load();
    };
    const onDeleted = (payload) => {
      if (String(payload.projectId) !== String(id)) return;
      setIssues((prev) => prev.filter((i) => i._id !== payload.id));
      load();
    };
    const onActivity = (activity) => {
      if (String(activity.projectId) !== String(id) && String(activity.projectId?._id) !== String(id)) {
        // activity may not include projectId populated; refresh anyway from room events
      }
      setActivities((prev) => [activity, ...prev].slice(0, 20));
    };

    socket.on('issue:created', onCreated);
    socket.on('issue:updated', onUpdated);
    socket.on('issue:deleted', onDeleted);
    socket.on('activity:created', onActivity);

    return () => {
      socket.emit('project:leave', id);
      socket.off('issue:created', onCreated);
      socket.off('issue:updated', onUpdated);
      socket.off('issue:deleted', onDeleted);
      socket.off('activity:created', onActivity);
    };
  }, [socket, id, load]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (issue) => {
    setEditing({
      ...issue,
      projectId: issue.projectId?._id || issue.projectId || id,
    });
    setModalOpen(true);
  };

  const handleSave = async (form) => {
    if (editing) {
      await api.put(`/issues/${editing._id}`, form);
      push('Issue updated', 'success');
    } else {
      await api.post('/issues', { ...form, projectId: id });
      push('Issue created', 'success');
    }
    setModalOpen(false);
    await load();
  };

  const handleStatusChange = async (issue, status) => {
    try {
      await api.put(`/issues/${issue._id}`, { status });
      push(`Moved to ${status}`, 'success');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (issue) => {
    if (!window.confirm(`Delete issue "${issue.title}"?`)) return;
    try {
      await api.delete(`/issues/${issue._id}`);
      push('Issue deleted', 'info');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete issue');
    }
  };

  if (loading) {
    return (
      <div className="full-center">
        <div className="spinner" />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="stack-lg">
        <div className="alert alert-error">{error}</div>
        <Link to="/projects" className="btn btn-secondary">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="stack-lg fade-in">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            <Link to="/projects" className="crumb">
              Projects
            </Link>{' '}
            / Detail
          </p>
          <h1>{project.name}</h1>
          <p className="muted">{project.description || 'No description provided.'}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          New issue
        </button>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {stats ? (
        <div className="stat-grid compact">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="To Do" value={stats.todo} tone="amber" />
          <StatCard label="In Progress" value={stats.inProgress} tone="sky" />
          <StatCard label="Done" value={stats.done} tone="success" />
          <StatCard label="High priority" value={stats.high} tone="danger" />
        </div>
      ) : null}

      <section className="panel">
        <div className="panel-header">
          <h2>Issues</h2>
        </div>
        {issues.length === 0 ? (
          <EmptyState
            title="No issues in this project"
            description="Add the first issue to kick off the board."
            illustration={emptyIssues}
            action={
              <button type="button" className="btn btn-primary" onClick={openCreate}>
                Add issue
              </button>
            }
          />
        ) : (
          <IssueTable
            issues={issues}
            onEdit={openEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        )}
      </section>

      <ActivityFeed activities={activities} title="Project activity" />

      {modalOpen ? (
        <Modal title={editing ? 'Edit issue' : 'New issue'} onClose={() => setModalOpen(false)}>
          <IssueForm
            initial={editing || { projectId: id }}
            lockProject
            projects={[{ _id: id, name: project.name }]}
            submitLabel={editing ? 'Update issue' : 'Create issue'}
            onSubmit={handleSave}
          />
        </Modal>
      ) : null}
    </div>
  );
}
