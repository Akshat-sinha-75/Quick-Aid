import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, Camera, MapPin, FileText, AlertTriangle, Loader, ArrowLeft, X } from 'lucide-react';
import './NewWound.css';

const API_URL = 'http://localhost:5000/api';

export default function NewWound() {
  const [title, setTitle] = useState('');
  const [bodyLocation, setBodyLocation] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const navigate = useNavigate();

  const handleImageChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleImageChange(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setError('Please upload a wound image');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('title', title);
      formData.append('bodyLocation', bodyLocation);
      formData.append('description', description);
      formData.append('notes', notes);

      const { data } = await axios.post(`${API_URL}/wounds`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate(`/wounds/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze wound. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container new-wound-container">
        <button className="btn btn-secondary btn-sm back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="page-header">
          <h1>New Wound Analysis</h1>
          <p>Upload an image and provide details for AI-powered analysis</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="new-wound-form">
          <div className="form-layout">
            {/* Left - Image Upload */}
            <div className="upload-section">
              <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''} ${preview ? 'has-preview' : ''}`}
                onClick={() => !preview && fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                {preview ? (
                  <div className="preview-container">
                    <img src={preview} alt="Wound preview" className="preview-image" />
                    <button
                      type="button"
                      className="remove-preview"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImage(null);
                        setPreview(null);
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon-wrapper">
                      <Camera size={32} />
                    </div>
                    <p className="upload-text">Drag & drop your wound image here</p>
                    <p className="upload-hint">or click to browse files</p>
                    <span className="upload-formats">PNG, JPG, WEBP (max 10MB)</span>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files[0])}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Right - Details */}
            <div className="details-section">
              <div className="form-group">
                <label htmlFor="title">
                  <FileText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  Wound Title
                </label>
                <input
                  id="title"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Right knee scrape, Left arm cut"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="bodyLocation">
                  <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  Body Location
                </label>
                <input
                  id="bodyLocation"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Right knee, Left forearm"
                  value={bodyLocation}
                  onChange={(e) => setBodyLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="form-input"
                  placeholder="How did the wound occur? Any relevant context..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Additional Notes</label>
                <textarea
                  id="notes"
                  className="form-input"
                  placeholder="Any allergies, current medications, or other health info..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="disclaimer" style={{ marginBottom: '20px' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>AI analysis provides educational guidance only. For serious injuries, seek professional medical help immediately.</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={loading || !image}
              >
                {loading ? (
                  <>
                    <Loader size={18} className="spin-icon" />
                    Analyzing Wound... This may take a moment
                  </>
                ) : (
                  <>
                    <Upload size={18} /> Analyze Wound
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
