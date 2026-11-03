import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import brandMark from '../assets/brand-mark.svg';

export default function Layout() {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!socket) {
      setLive(false);
      return undefined;
    }
    setLive(socket.connected);
    const onConnect = () => setLive(true);
    const onDisconnect = () => setLive(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand" onClick={closeMenu}>
            <span className="brand-mark" aria-hidden="true">
              <img src={brandMark} alt="" />
            </span>
            <span className="brand-text">SprintBoard</span>
          </NavLink>

          <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Primary">
            <NavLink to="/" end onClick={closeMenu}>
              Dashboard
            </NavLink>
            <NavLink to="/projects" onClick={closeMenu}>
              Projects
            </NavLink>
            <NavLink to="/issues" onClick={closeMenu}>
              Issues
            </NavLink>
          </nav>

          <div className="topbar-user">
            <span className={`live-pill ${live ? 'on' : 'off'}`} title={live ? 'Realtime connected' : 'Connecting…'}>
              <span className="live-dot" />
              {live ? 'Live' : 'Offline'}
            </span>
            <div className="user-chip">
              <span className="user-avatar" aria-hidden="true">
                {(user?.name || '?').slice(0, 1).toUpperCase()}
              </span>
              <div className="user-meta">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{user?.role}</span>
              </div>
            </div>
            <button type="button" className="btn btn-ghost desktop-only" onClick={handleLogout}>
              Sign out
            </button>
            <button
              type="button"
              className="menu-toggle"
              aria-expanded={menuOpen}
              aria-label="Toggle navigation"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className={`burger ${menuOpen ? 'open' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <nav className="bottom-nav mobile-only" aria-label="Mobile">
        <NavLink to="/" end>
          <span className="bn-icon" aria-hidden="true">
            ◇
          </span>
          Home
        </NavLink>
        <NavLink to="/projects">
          <span className="bn-icon" aria-hidden="true">
            ▤
          </span>
          Projects
        </NavLink>
        <NavLink to="/issues">
          <span className="bn-icon" aria-hidden="true">
            ▸
          </span>
          Issues
        </NavLink>
        <button type="button" className="bn-logout" onClick={handleLogout}>
          <span className="bn-icon" aria-hidden="true">
            ⎋
          </span>
          Out
        </button>
      </nav>
    </div>
  );
}
