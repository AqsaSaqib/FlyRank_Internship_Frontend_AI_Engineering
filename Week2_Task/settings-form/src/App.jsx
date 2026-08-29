import React, { useState, useEffect } from 'react';
import { Settings, User, Bell, Palette, CheckCircle2, RotateCcw, Save, Shield } from 'lucide-react';

const DEFAULT_SETTINGS = {
  name: 'Alex Sterling',
  email: 'alex.sterling@flyrank.ai',
  jobTitle: 'Frontend AI Engineer',
  notificationPreference: 'realtime',
  emailAlerts: true,
  pushAlerts: true,
  theme: 'dark',
  bio: 'Building frontier AI interfaces and scalable web applications.'
};

export default function App() {
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('flyrank_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', formData.theme);
  }, [formData.theme]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSavedSuccess(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('flyrank_settings', JSON.stringify(formData));
    } catch (err) {
      console.warn('Storage error:', err);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleReset = () => {
    setFormData(DEFAULT_SETTINGS);
    try {
      localStorage.setItem('flyrank_settings', JSON.stringify(DEFAULT_SETTINGS));
    } catch (err) {
      console.warn('Storage error:', err);
    }
    setSavedSuccess(false);
  };

  return (
    <div className="app-container">
      {/* Top Navigation Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon">
            <Settings size={20} />
          </div>
          <div>
            <span className="brand-title">FlyRank</span>
            <span className="brand-badge" style={{ marginLeft: 8 }}>Settings</span>
          </div>
        </div>
      </header>

      {/* Main Settings Content */}
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Application Settings</h1>
          <p className="page-subtitle">Manage your account details, notification preferences, and workspace theme.</p>
        </div>

        {savedSuccess && (
          <div className="alert-banner alert-success" role="alert">
            <CheckCircle2 size={18} />
            <span>Settings successfully saved and updated!</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* User Profile Card */}
          <div className="settings-card">
            <div className="card-header">
              <div className="card-icon-wrap">
                <User size={18} />
              </div>
              <div>
                <div className="card-title">User Profile</div>
                <div className="card-desc">Personal details and identification.</div>
              </div>
            </div>

            <div className="card-body">
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Alex Sterling"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="e.g. alex.sterling@flyrank.ai"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="jobTitle">Job Title / Role</label>
                <input
                  id="jobTitle"
                  type="text"
                  className="form-input"
                  value={formData.jobTitle}
                  onChange={(e) => handleChange('jobTitle', e.target.value)}
                  placeholder="e.g. Frontend AI Engineer"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  className="form-textarea"
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Brief description..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="settings-card">
            <div className="card-header">
              <div className="card-icon-wrap">
                <Bell size={18} />
              </div>
              <div>
                <div className="card-title">Notification Settings</div>
                <div className="card-desc">Delivery frequency and communication channels.</div>
              </div>
            </div>

            <div className="card-body">
              <div className="form-group">
                <label className="form-label" htmlFor="notificationPreference">Notification Delivery Cadence</label>
                <select
                  id="notificationPreference"
                  className="form-select"
                  value={formData.notificationPreference}
                  onChange={(e) => handleChange('notificationPreference', e.target.value)}
                >
                  <option value="realtime">Real-time (Instant push & email)</option>
                  <option value="daily">Daily Digest (Summary at 9:00 AM)</option>
                  <option value="weekly">Weekly Summary (Every Monday)</option>
                  <option value="never">Never (Mute non-critical alerts)</option>
                </select>
              </div>

              <label className="switch-group">
                <div className="switch-info">
                  <span className="switch-label">Email Notifications</span>
                  <span className="switch-sub">Receive activity updates and system digests via email.</span>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.emailAlerts}
                    onChange={(e) => handleChange('emailAlerts', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>

              <label className="switch-group">
                <div className="switch-info">
                  <span className="switch-label">In-App Push Alerts</span>
                  <span className="switch-sub">Show desktop and browser toast notifications.</span>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.pushAlerts}
                    onChange={(e) => handleChange('pushAlerts', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>
          </div>

          {/* Appearance Card */}
          <div className="settings-card">
            <div className="card-header">
              <div className="card-icon-wrap">
                <Palette size={18} />
              </div>
              <div>
                <div className="card-title">Appearance & Theme</div>
                <div className="card-desc">Select your preferred visual interface mode.</div>
              </div>
            </div>

            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Theme Mode</label>
                <div className="radio-pill-group">
                  <div
                    className={`radio-pill ${formData.theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleChange('theme', 'dark')}
                  >
                    <span>🌙 Dark</span>
                  </div>
                  <div
                    className={`radio-pill ${formData.theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleChange('theme', 'light')}
                  >
                    <span>☀️ Light</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-footer">
              <button type="button" className="btn btn-secondary" onClick={handleReset}>
                <RotateCcw size={15} />
                Reset Defaults
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={15} />
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
