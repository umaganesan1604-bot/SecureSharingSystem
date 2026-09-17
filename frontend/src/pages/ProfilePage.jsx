import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Shield, Calendar, LogOut, CheckCircle2 } from 'lucide-react';

export default function ProfilePage({ setActivePage }) {
  const { user, role, logout } = useAuth();

  if (!user) return null;

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 24px' }}>
      <div className="glass-panel" style={{ padding: 36 }}>
        {/* Profile Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.75rem',
            fontWeight: 800
          }}>
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: '1.6rem' }}>{user.username}</h2>
              <span className={`badge badge-${role}`}>
                {role}
              </span>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginTop: 2 }}>
              Verified Organizational Account
            </p>
          </div>
        </div>

        {/* User Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 32 }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <Mail size={18} color="var(--accent-cyan)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Email Address</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.email || 'None registered'}</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <Phone size={18} color="var(--accent-emerald)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Phone Number</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.phone || 'None registered'}</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <Shield size={18} color="var(--accent-primary)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Account Role</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{role}</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <Calendar size={18} color="var(--accent-amber)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Member Since</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
              </div>
            </div>
          </div>
        </div>

        {/* Role Privileges Overview */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 20,
          marginBottom: 32
        }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: 12, color: '#fff' }}>
            Active Role Entitlements ({role})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {role === 'ADMIN' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" />
                  Full organizational user administration and role adjustment.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" />
                  Unrestricted access to security audit log stream.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" />
                  Administrative oversight on all organizational encrypted files.
                </div>
              </>
            )}
            {role === 'MANAGER' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" />
                  Upload sensitive documents with AES-256-GCM encryption.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" />
                  Share authorized files with team members with VIEW or DOWNLOAD rights.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" />
                  Download files owned by you or explicitly shared with your account.
                </div>
              </>
            )}
            {role === 'EMPLOYEE' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" />
                  Upload documents to your personal encrypted depository.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" />
                  Access and download documents explicitly shared with you by managers.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" />
                  Share your own uploaded files with colleagues.
                </div>
              </>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={logout}
          >
            <LogOut size={16} /> Sign Out of Account
          </button>
        </div>
      </div>
    </div>
  );
}
