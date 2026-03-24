import { Link } from 'react-router-dom';
import { Shield, Camera, Clock, TrendingUp, Stethoscope, Pill, AlertTriangle } from 'lucide-react';
import './Landing.css';

export default function Landing() {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="ecg-container">
          <svg viewBox="0 0 1000 100" className="ecg-svg" preserveAspectRatio="none">
            {/* Repeating ECG pattern across the viewBox */}
            <path d="M0,50 L50,50 L70,30 L90,80 L110,10 L130,60 L150,50 
                     L250,50 L270,30 L290,80 L310,10 L330,60 L350,50 
                     L450,50 L470,30 L490,80 L510,10 L530,60 L550,50 
                     L650,50 L670,30 L690,80 L710,10 L730,60 L750,50 
                     L850,50 L870,30 L890,80 L910,10 L930,60 L950,50 
                     L1000,50" />
          </svg>
        </div>

        <div className="container">
          <div className="hero-content slide-up">
            <div className="hero-badge">
              <Shield size={14} />
              <span>AI-Powered First Aid</span>
            </div>
            <h1 className="hero-title">
              Your Personal<br />
              <span className="gradient-text">Wound Treatment</span><br />
              Guide
            </h1>
            <p className="hero-subtitle">
              Upload an image of your wound, get instant AI-powered analysis,
              personalized treatment recommendations, and track your healing journey.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </div>
            <div className="disclaimer">
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>
                <strong>Medical Disclaimer:</strong> QuickAid provides educational first-aid guidance only.
                It is not a substitute for professional medical advice, diagnosis, or treatment.
                Always seek professional help for serious injuries.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <div className="section-header fade-in">
            <h2>How It Works</h2>
            <p>Three simple steps to get the care guidance you need</p>
          </div>

          <div className="features-grid">
            <div className="feature-card card fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="feature-icon icon-blue">
                <Camera size={28} />
              </div>
              <h3>Upload Image</h3>
              <p>Take a clear photo of your wound and upload it along with any relevant details you know about it.</p>
            </div>

            <div className="feature-card card fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="feature-icon icon-purple">
                <Stethoscope size={28} />
              </div>
              <h3>AI Analysis</h3>
              <p>Our AI analyzes wound type, severity, redness, swelling, and more — providing a detailed assessment.</p>
            </div>

            <div className="feature-card card fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="feature-icon icon-green">
                <Pill size={28} />
              </div>
              <h3>Treatment Plan</h3>
              <p>Get step-by-step treatment instructions, medication recommendations with dosage and timing.</p>
            </div>
          </div>

          <div className="features-grid" style={{ marginTop: '24px' }}>
            <div className="feature-card card fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="feature-icon icon-cyan">
                <Clock size={28} />
              </div>
              <h3>Wound History</h3>
              <p>Each wound gets its own profile. Come back days later to upload new images and track changes.</p>
            </div>

            <div className="feature-card card fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="feature-icon icon-orange">
                <TrendingUp size={28} />
              </div>
              <h3>Track Progress</h3>
              <p>AI compares follow-up images with previous ones to determine if the wound is healing or worsening.</p>
            </div>

            <div className="feature-card card fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="feature-icon icon-red">
                <Shield size={28} />
              </div>
              <h3>Personal Profile</h3>
              <p>Your own secure account keeps all wound records organized and private to you.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
