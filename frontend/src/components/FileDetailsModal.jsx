import React from 'react';
import { X, ShieldCheck, FileText, Key, HardDrive, CheckCircle2, User } from 'lucide-react';

export default function FileDetailsModal({ isOpen, onClose, file }) {
  if (!isOpen || !file) return null;

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.2)',
              padding: '8px',
              borderRadius: '8px',
              color: 'var(--accent-primary)'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="modal-title">Cryptographic File Metadata</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                AES-256-GCM Envelope Encryption Verification
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Technical Specs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          marginBottom: 20
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 4 }}>Original Filename</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', wordBreak: 'break-all' }}>{file.original_filename}</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 4 }}>File Size / MIME</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatSize(file.file_size)} • {file.content_type}</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 4 }}>File Owner</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{file.owner_username} ({file.owner_email})</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 4 }}>Encryption Standard</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>
              {file.encryption_version || 'AES-256-GCM-v1'}
            </div>
          </div>
        </div>

        {/* Security Architecture Audit Box */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: 20
        }}>
          <h4 style={{ fontSize: '0.875rem', color: '#fff', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={16} color="var(--accent-emerald)" />
            Security & Integrity Guarantees
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <CheckCircle2 size={15} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span><strong>Envelope Encryption:</strong> Encrypted with dedicated 256-bit Data Encryption Key (DEK) wrapped by Master Key (KEK).</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <CheckCircle2 size={15} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span><strong>Cryptographic Nonce:</strong> Dedicated 96-bit random IV ensures no two ciphertext outputs are ever identical.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <CheckCircle2 size={15} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span><strong>Tamper Protection:</strong> 128-bit authentication tag must authenticate prior to file returning.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <CheckCircle2 size={15} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span><strong>Persistent Storage:</strong> Disk stores solely binary ciphertext in UUID-named blocks, avoiding path traversal.</span>
            </li>
          </ul>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
