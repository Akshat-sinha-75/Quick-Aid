import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await updateProfile(formData.name, formData.email, formData.password || undefined);
      setSuccess(true);
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container container">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your account details and preferences.</p>
      </div>
      
      <div className="profile-card card">
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            <ShieldCheck size={18} />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-divider">
            <span>Change Password (Optional)</span>
          </div>

          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave blank to keep current password"
                minLength="6"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
                minLength="6"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary profile-btn" disabled={loading}>
            {loading ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
