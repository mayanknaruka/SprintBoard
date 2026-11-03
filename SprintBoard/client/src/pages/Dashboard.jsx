import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import ChartBars from '../components/ChartBars';
import ActivityFeed from '../components/ActivityFeed';

export default function Dashboard() {
  const { user } = useAuth();
  const socket = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pulse, setPulse] = useState(false);

  const load = useCallback(async (silent = false) => {
    try {
      const { data: res } = await api.get('/dashboard');
      setData(res.data);
      setError('');
      if (silent) {
        setPulse(true);
        window.setTimeout(() => setPulse(false), 700);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => load(true);
    socket.on('stats:changed', refresh);
    socket.on('issue:created', refresh);
    socket.on('issue:updated', refresh);
    socket.on('issue:deleted', refresh);
    socket.on('activity:created', refresh);
    return () => {
      socket.off('stats:changed', refresh);
      socket.off('issue:created', refresh);
      socket.off('issue:updated', refresh);
      socket.off('issue:deleted', refresh);
      socket.off('activity:created', refresh);
    };
  }, [socket, load]);

  if (loading) {
    return (
      <div className="stack-lg">
        <div className="skeleton hero-skel" />
        <div className="stat-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton skel-card" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const { stats, charts, recentActivity } = data;

  return (
    <div className={`stack-lg fade-in ${pulse ? 'live-pulse' : ''}`}>
      <section className="hero-strip">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>
            Hey {user?.name?.split(' ')[0] || 'there'},
            <span className="hero-accent"> here’s your board</span>
          </h1>
          <p className="muted">Live snapshot of projects and issue health across your workspace.</p>
        </div>
        <div className="header-actions">
          <Link to="/projects" className="btn btn-secondary">
            View projects
          </Link>
          <Link to="/issues" className="btn btn-primary">
            Browse issues
          </Link>
        </div>
      </section>

      <div className="stat-grid">
        <StatCard label="Total projects" value={stats.totalProjects} tone="forest" delay={0} />
        <StatCard label="Total issues" value={stats.totalIssues} delay={60} />
        <StatCard label="Open issues" value={stats.openIssues} tone="amber" delay={120} />
        <StatCard label="In progress" value={stats.inProgressIssues} tone="sky" delay={180} />
        <StatCard label="Completed" value={stats.completedIssues} tone="success" delay={240} />
        <StatCard label="High priority" value={stats.highPriorityIssues} tone="danger" delay={300} />
      </div>

      <div className="split-grid">
        <ChartBars title="Issues by status" items={charts.byStatus} color="var(--accent)" />
        <ChartBars title="Issues by priority" items={charts.byPriority} color="var(--teal)" />
      </div>

      <ActivityFeed activities={recentActivity} />
    </div>
  );
}
