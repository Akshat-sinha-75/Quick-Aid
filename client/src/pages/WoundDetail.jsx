import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Plus, Activity, CheckCircle, TrendingUp, TrendingDown,
  Minus, Camera, Clock, AlertTriangle, Pill, Stethoscope, Shield,
  X, Upload, Loader, ChevronDown, ChevronUp
} from 'lucide-react';
import './WoundDetail.css';

const API_URL = 'https://quick-aid-1aod.onrender.com/api';

function SeverityColor(level) {
  if (!level) return 'var(--text-muted)';
  const l = level.toLowerCase();
  if (['none', 'superficial', 'minimal'].includes(l)) return 'var(--success)';
  if (['mild', 'shallow', 'possible'].includes(l)) return 'var(--warning)';
  if (['moderate'].includes(l)) return '#f97316';
  return 'var(--danger)';
}

function ProgressIcon({ status }) {
  if (status === 'improving') return <TrendingUp size={16} />;
  if (status === 'worsening') return <TrendingDown size={16} />;
  return <Minus size={16} />;
}

function ProgressBadge({ status }) {
  const cls = status === 'improving' ? 'badge-success' :
    status === 'worsening' ? 'badge-danger' : 'badge-warning';
  return (
    <span className={`badge ${cls}`}>
      <ProgressIcon status={status} />
      {status || 'initial'}
    </span>
  );
}

export default function WoundDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wound, setWound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpImage, setFollowUpImage] = useState(null);
  const [followUpPreview, setFollowUpPreview] = useState(null);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [expandedEntry, setExpandedEntry] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    fetchWound();
  }, [id]);

  useEffect(() => {
    if (wound?.entries?.length) {
      setExpandedEntry(wound.entries.length - 1);
    }
  }, [wound]);

  const fetchWound = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/wounds/${id}`);
      setWound(data);
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpImage) return;
    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', followUpImage);
      formData.append('notes', followUpNotes);

      const { data } = await axios.post(`${API_URL}/wounds/${id}/entries`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setWound(data);
      setShowFollowUp(false);
      setFollowUpImage(null);
      setFollowUpPreview(null);
      setFollowUpNotes('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add follow-up entry');
    } finally {
      setSubmitting(false);
    }
  };

  const markAsHealed = async () => {
    try {
      const { data } = await axios.patch(`${API_URL}/wounds/${id}`, { status: 'healed' });
      setWound(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="page"><div className="container">
        <div className="loading-overlay"><div className="spinner" /><p>Loading wound details...</p></div>
      </div></div>
    );
  }

  if (!wound) {
    return (
      <div className="page"><div className="container">
        <div className="empty-state card">
          <h3>Wound not found</h3>
          {fetchError && <p style={{color: 'red'}}>Error: {fetchError}</p>}
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div></div>
    );
  }

  return (
    <div className="page wound-detail-page">
      <div className="container">
        <button className="btn btn-secondary btn-sm back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="wound-detail-header">
          <div className="wound-detail-info">
            <h1>{wound.title}</h1>
            <div className="wound-detail-meta">
              {wound.bodyLocation && <span className="meta-item">📍 {wound.bodyLocation}</span>}
              <span className="meta-item"><Clock size={14} /> Created {new Date(wound.createdAt).toLocaleDateString()}</span>
              <span className={`badge ${wound.status === 'active' ? 'badge-warning' : 'badge-success'}`}>
                {wound.status === 'active' ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                {wound.status}
              </span>
            </div>
            {wound.description && <p className="wound-description">{wound.description}</p>}
          </div>
          <div className="wound-detail-actions">
            {wound.status === 'active' && (
              <>
                <button className="btn btn-primary" onClick={() => setShowFollowUp(!showFollowUp)}>
                  <Plus size={16} /> Add Follow-up
                </button>
                <button className="btn btn-success btn-sm" onClick={markAsHealed}>
                  <CheckCircle size={14} /> Mark as Healed
                </button>
              </>
            )}
          </div>
        </div>

        {/* Follow-up Form */}
        {showFollowUp && (
          <div className="followup-panel card slide-up">
            <div className="followup-header">
              <h3><Camera size={18} /> Add Follow-up Entry</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowFollowUp(false)}><X size={14} /></button>
            </div>
            {error && <div className="alert alert-error"><AlertTriangle size={16} /> {error}</div>}
            <form onSubmit={handleFollowUp} className="followup-form">
              <div className="followup-upload" onClick={() => fileRef.current?.click()}>
                {followUpPreview ? (
                  <img src={followUpPreview} alt="Preview" className="followup-preview-img" />
                ) : (
                  <div className="followup-upload-placeholder">
                    <Camera size={24} /><span>Upload new wound image</span>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files[0];
                    if (f) {
                      setFollowUpImage(f);
                      const reader = new FileReader();
                      reader.onloadend = () => setFollowUpPreview(reader.result);
                      reader.readAsDataURL(f);
                    }
                  }}
                />
              </div>
              <textarea
                className="form-input"
                placeholder="Any notes about current wound condition..."
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                rows={3}
              />
              <button type="submit" className="btn btn-primary" disabled={submitting || !followUpImage}>
                {submitting ? (
                  <><Loader size={16} className="spin-icon" /> Analyzing...</>
                ) : (
                  <><Upload size={16} /> Submit Follow-up</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Timeline */}
        <div className="timeline-section">
          <h2 className="section-title"><Activity size={18} /> Wound Timeline ({wound.entries?.length || 0} entries)</h2>

          <div className="timeline">
            {wound.entries?.map((entry, idx) => {
              const isExpanded = expandedEntry === idx;
              return (
                <div key={idx} className={`timeline-entry ${isExpanded ? 'expanded' : ''}`}>
                  <div className="timeline-dot-wrapper">
                    <div className={`timeline-dot ${idx === 0 ? 'dot-first' : ''}`} />
                    {idx < wound.entries.length - 1 && <div className="timeline-line" />}
                  </div>

                  <div className="timeline-content card" onClick={() => setExpandedEntry(isExpanded ? null : idx)}>
                    <div className="timeline-entry-header">
                      <div className="timeline-entry-left">
                        <div className="timeline-entry-img">
                          <img src={`https://quick-aid-1aod.onrender.com${entry.imageUrl}`} alt={`Entry ${idx + 1}`} />
                        </div>
                        <div>
                          <div className="timeline-entry-title">
                            Entry #{idx + 1}
                            {idx === 0 && <span className="badge badge-info" style={{ marginLeft: '8px' }}>Initial</span>}
                          </div>
                          <div className="timeline-entry-date">{new Date(entry.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="timeline-entry-right">
                        <ProgressBadge status={entry.progress?.status} />
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="timeline-entry-details fade-in">
                        {/* Large Wound Image */}
                        <div className="detail-wound-image">
                          <img src={`https://quick-aid-1aod.onrender.com${entry.imageUrl}`} alt={`Wound Entry ${idx + 1}`} />
                        </div>

                        {/* Two Column Layout */}
                        <div className="detail-columns">
                          {/* LEFT: Analysis */}
                          <div>
                            <div className="detail-block">
                              <h4><Stethoscope size={16} /> Wound Analysis</h4>
                              <div className="analysis-grid">
                                <div className="analysis-item">
                                  <span className="analysis-label">Type</span>
                                  <span className="analysis-value">{entry.analysis?.type || entry.analysis?.woundType || 'N/A'}</span>
                                </div>
                                <div className="analysis-item">
                                  <span className="analysis-label">Severity</span>
                                  <span className="analysis-value" style={{ color: SeverityColor(entry.analysis?.severity) }}>
                                    {entry.analysis?.severity || 'N/A'}
                                  </span>
                                </div>
                              </div>

                              {entry.analysis?.attributes && (
                                <div className="attributes-grid">
                                  {Object.entries(entry.analysis.attributes).map(([key, val]) => {
                                    const displayValue = typeof val === 'object' ? (val?.level || JSON.stringify(val)) : String(val);
                                    return (
                                      <div key={key} className="attribute-card">
                                        <div className="attribute-name">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                        <div className="attribute-level" style={{ color: SeverityColor(displayValue) }}>
                                          {displayValue || 'N/A'}
                                        </div>
                                        {typeof val === 'object' && val?.description && (
                                          <div className="attribute-desc">{val.description}</div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {(entry.analysis?.generalObservations || entry.analysis?.overallAssessment) && (
                                <div className="overall-assessment">
                                  <p>{entry.analysis.generalObservations || entry.analysis.overallAssessment}</p>
                                </div>
                              )}
                            </div>

                            {/* Progress */}
                            {entry.progress?.comparedToPrevious && entry.progress.status !== 'initial' && (
                              <div className="detail-block">
                                <h4><TrendingUp size={16} /> Progress</h4>
                                <div className="progress-block">
                                  <div className="progress-bar-wrapper">
                                    <div className="progress-bar-track">
                                      <div
                                        className="progress-bar-fill"
                                        style={{ width: `${entry.progress.percentageHealed || 0}%` }}
                                      />
                                    </div>
                                    <span className="progress-percent">{entry.progress.percentageHealed || 0}% healed</span>
                                  </div>
                                  <p className="progress-comparison">{entry.progress.comparedToPrevious}</p>
                                </div>
                              </div>
                            )}

                            {entry.notes && (
                              <div className="detail-block">
                                <h4>📝 Notes</h4>
                                <p className="entry-notes">{entry.notes}</p>
                              </div>
                            )}
                          </div>

                          {/* RIGHT: Treatment */}
                          <div>
                            {entry.treatment && (
                              <div className="detail-block">
                                <h4><Pill size={16} /> Treatment Plan</h4>

                                {entry.treatment.immediateSteps?.length > 0 && (
                                  <div className="treatment-section">
                                    <h5>Immediate Steps</h5>
                                    <ol className="treatment-list">
                                      {entry.treatment.immediateSteps.map((step, i) => (
                                        <li key={i}>{step}</li>
                                      ))}
                                    </ol>
                                  </div>
                                )}

                                {entry.treatment.medications?.length > 0 && (
                                  <div className="treatment-section">
                                    <h5>Medications</h5>
                                    <div className="medications-grid">
                                      {entry.treatment.medications.map((med, i) => (
                                        <div key={i} className="medication-card">
                                          <div className="med-name">{med.name}</div>
                                          <div className="med-details">
                                            {med.composition && <div><strong>Composition:</strong> {med.composition}</div>}
                                            {med.dosage && <div><strong>Dosage:</strong> {med.dosage}</div>}
                                            {med.timing && <div><strong>Timing:</strong> {med.timing}</div>}
                                            {med.duration && <div><strong>Duration:</strong> {med.duration}</div>}
                                            {med.notes && <div className="med-notes">{med.notes}</div>}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {(entry.treatment?.doNots?.length > 0 || entry.treatment?.doNot?.length > 0) && (
                              <div className="detail-block">
                                <h5><Shield size={14} /> Things to Avoid</h5>
                                <ul className="dont-list">
                                  {(entry.treatment.doNots || entry.treatment.doNot).map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {entry.treatment?.whenToSeeDoctor?.length > 0 && (
                              <div className="detail-block warning-section">
                                <h5><AlertTriangle size={14} /> When to See a Doctor</h5>
                                <ul className="doctor-list">
                                  {entry.treatment.whenToSeeDoctor.map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
