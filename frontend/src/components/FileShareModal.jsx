import React, { useState } from 'react';
import { fileService } from '../services/fileService';
import { useToast } from '../context/ToastContext';
import { Share2, X, UserCheck, ShieldAlert, Trash2, UserPlus } from 'lucide-react';

export default function FileShareModal({ isOpen, onClose, file, onShareUpdated }) {
  const [recipient, setRecipient] = useState('');
  const [permission, setPermission] = useState('DOWNLOAD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  if (!isOpen || !file) return null;

  const handleShare = async (e) => {
    e.preventDefault();
    if (!recipient.trim()) return;

    try {
      setIsSubmitting(true);
      await fileService.shareFile(file.id, recipient.trim(), permission);
      showToast(`Access granted to '${recipient}' with ${permission} permission.`, 'success');
      setRecipient('');
      if (onShareUpdated) onShareUpdated();
    } catch (err) {
      showToast(err.message || 'Failed to share file.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (username) => {
    try {
      await fileService.revokeShare(file.id, username);
      showToast(`Revoked sharing access for '${username}'.`, 'info');
      if (onShareUpdated) onShareUpdated();
    } catch (err) {
      showToast(err.message || 'Failed to revoke share.', 'error');
    }
  };

  const activeShares = file.active_shares || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(6, 182, 212, 0.2)',
              padding: '8px',
              borderRadius: '8px',
              color: 'var(--accent-cyan)'
            }}>
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="modal-title">Share Protected File</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                {file.original_filename}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Grant New Share Form */}
        <form onSubmit={handleShare} style={{ marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Recipient Username or Email</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. employee_user or colleague@org"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Permission</label>
              <select
                className="form-select"
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
              >
                <option value="DOWNLOAD">DOWNLOAD</option>
                <option value="VIEW">VIEW ONLY</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isSubmitting || !recipient.trim()}
            >
              <UserPlus size={14} /> {isSubmitting ? 'Granting Access...' : 'Grant Access'}
            </button>
          </div>
        </form>

        {/* Currently Active Shares List */}
        <div>
          <h4 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserCheck size={16} color="var(--accent-emerald)" />
            Active Collaborators ({activeShares.length})
          </h4>

          {activeShares.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              textAlign: 'center',
              color: 'var(--text-dim)',
              fontSize: '0.85rem'
            }}>
              This file is currently private. Only you and authorized system administrators have access.
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: 200,
              overflowY: 'auto'
            }}>
              {activeShares.map((share) => (
                <div
                  key={share.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {share.shared_with_username}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {share.shared_with_email} • Permission: <span style={{ color: 'var(--accent-cyan)' }}>{share.permission}</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRevoke(share.shared_with_username)}
                    title="Revoke access"
                  >
                    <Trash2 size={13} /> Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
