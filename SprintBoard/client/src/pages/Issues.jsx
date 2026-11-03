import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import IssueForm from '../components/IssueForm';
import IssueTable from '../components/IssueTable';
import EmptyState from '../components/EmptyState';
import emptyIssues from '../assets/empty-issues.svg';

export default function Issues() {
  const socket = useSocket();
  const { push } = useToast();
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    project: '',
    search: '',
    page: 1,
  });
  const debouncedSearch = useDebounce(filters.search, 400);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadProjects = useCallback(async () => {
    const { data } = await api.get('/projects');
    setProjects(data.data.projects);
  }, []);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: 10,
      };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.project) params.project = filters.project;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const { data } = await api.get('/issues', { params });
      setIssues(data.data.issues);
      setPagination(data.data.pagination);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.priority, filters.project, filters.page, debouncedSearch]);

  useEffect(() => {
    loadProjects().catch(() => {});
  }, [loadProjects]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => loadIssues();
    socket.on('issue:created', refresh);
    socket.on('issue:updated', refresh);
    socket.on('issue:deleted', refresh);
    return () => {
      socket.off('issue:created', refresh);
      socket.off('issue:updated', refresh);
      socket.off('issue:deleted', refresh);
    };
  }, [socket, loadIssues]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (issue) => {
    setEditing({
      ...issue,
      projectId: issue.projectId?._id || issue.projectId,
    });
    setModalOpen(true);
  };

  const handleSave = async (form) => {
    if (editing) {
      await api.put(`/issues/${editing._id}`, form);
      push('Issue updated', 'success');
    } else {
      await api.post('/issues', form);
      push('Issue created', 'success');
    }
    setModalOpen(false);
    await loadIssues();
  };

  const handleStatusChange = async (issue, status) => {
    try {
      await api.put(`/issues/${issue._id}`, { status });
      push(`Moved to ${status}`, 'success');
      await loadIssues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
      push('Could not update status', 'error');
    }
  };

  const handleDelete = async (issue) => {
    if (!window.confirm(`Delete issue "${issue.title}"?`)) return;
    try {
      await api.delete(`/issues/${issue._id}`);
      push('Issue deleted', 'info');
      await loadIssues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete issue');
    }
  };

  return (
    <div className="stack-lg fade-in">
      <div className="page-header">
        <div>
          <p className="eyebrow">Board</p>
          <h1>Issues</h1>
          <p className="muted">Filter, search, and update issues with live sync.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate} disabled={!projects.length}>
          New issue
        </button>
      </div>

      <section className="filters-bar sticky-filters">
        <label className="field grow">
          <span>Search title</span>
          <div className="search-wrap">
            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              placeholder="Search issues…"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
            {filters.search ? (
              <button
                type="button"
                className="clear-search"
                aria-label="Clear search"
                onClick={() => updateFilter('search', '')}
              >
                ×
              </button>
            ) : null}
          </div>
        </label>
        <label className="field">
          <span>Status</span>
          <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">All</option>
            <option value="to-do">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </label>
        <label className="field">
          <span>Priority</span>
          <select value={filters.priority} onChange={(e) => updateFilter('priority', e.target.value)}>
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="field">
          <span>Project</span>
          <select value={filters.project} onChange={(e) => updateFilter('project', e.target.value)}>
            <option value="">All</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {loading ? (
        <div className="full-center compact">
          <div className="spinner" />
        </div>
      ) : issues.length === 0 ? (
        <EmptyState
          title="No matching issues"
          description={
            projects.length
              ? 'Try clearing filters or create a new issue.'
              : 'Create a project first, then add issues.'
          }
          illustration={emptyIssues}
          action={
            projects.length ? (
              <button type="button" className="btn btn-primary" onClick={openCreate}>
                Create issue
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <IssueTable
            issues={issues}
            showProject
            onEdit={openEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
          <div className="pagination">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => updateFilter('page', pagination.page - 1)}
            >
              Previous
            </button>
            <span className="muted">
              Page {pagination.page} of {pagination.pages} · {pagination.total} issues
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() => updateFilter('page', pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {modalOpen ? (
        <Modal title={editing ? 'Edit issue' : 'New issue'} onClose={() => setModalOpen(false)}>
          <IssueForm
            initial={editing || {}}
            projects={projects}
            submitLabel={editing ? 'Update issue' : 'Create issue'}
            onSubmit={handleSave}
          />
        </Modal>
      ) : null}
    </div>
  );
}
