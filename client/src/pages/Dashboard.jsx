import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Activity, CheckCircle, AlertTriangle, Clock, FileText } from 'lucide-react';
import './Dashboard.css';

const API_URL = 'http://localhost:5000/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [wounds, setWounds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWounds();
  }, []);

  const fetchWounds = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/wounds`);
      setWounds(data);
    } catch (error) {
      console.error('Failed to fetch wounds:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeWounds = wounds.filter(w => w.status === 'active');
  const healedWounds = wounds.filter(w => w.status === 'healed');

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="loading-overlay">
            <div className="spinner" />
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page dashboard">
      <div className="container">
        <div className="page-header">
          <div className="dashboard-header-row">
            <div>
              <h1><span style={{ WebkitTextFillColor: 'initial', color: 'initial' }}>Welcome, {user?.name?.split(' ')[0]} 👋</span></h1>
              <p>Manage and track your wound recovery</p>
            </div>
            <Link to="/new-wound" className="btn btn-primary">
              <Plus size={18} /> New Wound Analysis
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card card slide-up delay-100">
            <div className="stat-icon icon-blue">
              <FileText size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{wounds.length}</span>
              <span className="stat-label">Total Records</span>
            </div>
          </div>
          <div className="stat-card card slide-up delay-200">
            <div className="stat-icon icon-orange">
              <Activity size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{activeWounds.length}</span>
              <span className="stat-label">Active Wounds</span>
            </div>
          </div>
          <div className="stat-card card slide-up delay-300">
            <div className="stat-icon icon-green">
              <CheckCircle size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{healedWounds.length}</span>
              <span className="stat-label">Healed</span>
            </div>
          </div>
        </div>

        {/* Wounds List */}
        {wounds.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">
              <Activity size={48} />
            </div>
            <h3>No wound records yet</h3>
            <p>Start by uploading an image of a wound for AI-powered analysis and treatment recommendations.</p>
            <Link to="/new-wound" className="btn btn-primary">
              <Plus size={18} /> Create First Record
            </Link>
          </div>
        ) : (
          <div className="wounds-section">
            <h2 className="section-title">Your Wound Records</h2>
            <div className="wounds-grid">
              {wounds.map((wound, index) => (
                <Link
                  to={`/wounds/${wound._id}`}
                  key={wound._id}
                  className="wound-card card fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="wound-card-header">
                    <div className="wound-card-img">
                      {wound.entries?.[0]?.imageUrl ? (
                        <img src={`http://localhost:5000${wound.entries[0].imageUrl}`} alt="Wound" />
                      ) : (
                        <div className="wound-card-placeholder"><Activity size={24} /></div>
                      )}
                    </div>
                    <div className="wound-card-meta">
                      <h3>{wound.title}</h3>
                      <span className="wound-card-location">{wound.bodyLocation || 'No location specified'}</span>
                    </div>
                  </div>
                  <div className="wound-card-footer">
                    <span className={`badge ${wound.status === 'active' ? 'badge-warning' : 'badge-success'}`}>
                      {wound.status === 'active' ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                      {wound.status}
                    </span>
                    <span className="wound-card-entries">
                      <Clock size={14} />
                      {wound.entries?.length || 0} {wound.entries?.length === 1 ? 'entry' : 'entries'}
                    </span>
                    <span className="wound-card-date">
                      {new Date(wound.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
