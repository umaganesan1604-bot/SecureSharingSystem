import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserPlus, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage({ setActivePage }) {
  const { register } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await register(formData);
      showToast('Registration successful! You can now log in.', 'success');
      setActivePage('login');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const hasLength = formData.password.length >= 8;
  const hasNumber = /\d/.test(formData.password);
  const hasLetter = /[a-zA-Z]/.test(formData.password);

  return (
    <div style={{
      maxWidth: 500,
      margin: '40px auto',
      padding: '0 20px'
    }}>
      <div className="glass-panel" style={{ padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
          }}>
            <UserPlus size={24} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: 6 }}>Create an Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Register as a verified organizational employee
          </p>
        </div>

        {/* Mandatory Security Role Policy Banner */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: 24,
          display: 'flex',
          gap: 10,
          fontSize: '0.825rem',
          color: '#c7d2fe',
          lineHeight: 1.5
        }}>
          <ShieldCheck size={20} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>RBAC Security Policy:</strong> Public registration automatically assigns the 
            <span className="badge badge-EMPLOYEE" style={{ margin: '0 4px' }}>EMPLOYEE</span> 
            role. Privileges cannot be selected by the client. Only an authorized Administrator can assign Manager or Admin privileges.
          </div>
        </div>

        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: 20,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            color: '#fca5a5',
            fontSize: '0.875rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. john_doe"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Work Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. john@organization.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +1 555-0199"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              required
            />
          </div>

          {/* Password checklist */}
          <div style={{
            display: 'flex',
            gap: 14,
            marginBottom: 24,
            fontSize: '0.75rem',
            color: 'var(--text-dim)'
          }}>
            <span style={{ color: hasLength ? '#34d399' : 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={12} /> 8+ chars
            </span>
            <span style={{ color: hasLetter ? '#34d399' : 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={12} /> 1+ letter
            </span>
            <span style={{ color: hasNumber ? '#34d399' : 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={12} /> 1+ number
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={loading || !formData.username || !formData.email || !formData.password}
          >
            {loading ? 'Creating Account...' : <><UserPlus size={16} /> Complete Registration</>}
          </button>
        </form>

        <div style={{
          marginTop: 20,
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--text-muted)'
        }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => setActivePage('login')}
            style={{ color: 'var(--accent-cyan)', fontWeight: 600, textDecoration: 'underline' }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
