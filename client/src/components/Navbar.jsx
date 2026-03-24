import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to={user ? '/dashboard' : '/'} className="navbar-brand">
          <div className="navbar-logo">
            <Activity size={24} />
          </div>
          <span className="navbar-title">Quick<span className="text-accent">Aid</span></span>
        </Link>

        <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className={`navbar-links ${mobileOpen ? 'active' : ''}`}>
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <Link to="/new-wound" className="nav-link" onClick={() => setMobileOpen(false)}>New Analysis</Link>
              <div className="nav-divider" />
              <Link to="/profile" className="nav-user" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                <User size={16} />
                <span style={{ fontWeight: 600 }}>{user.name}</span>
              </Link>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMobileOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
