import React, { useState, useRef } from 'react';
import { fileService } from '../services/fileService';
import { useToast } from '../context/ToastContext';
import { UploadCloud, X, Lock, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export default function FileUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    // 25 MB size check
    const maxBytes = 25 * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast('File size exceeds the allowed limit of 25 MB.', 'error');
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadStep('Applying AES-256-GCM Envelope Encryption & Storing Ciphertext...');

      const result = await fileService.uploadFile(selectedFile);
      showToast(`'${selectedFile.name}' encrypted and stored securely!`, 'success');
      setSelectedFile(null);
      onUploadSuccess(result.file);
      onClose();
    } catch (err) {
      showToast(err.message || 'File upload failed. Please try again.', 'error');
    } finally {
      setIsUploading(false);
      setUploadStep('');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.2)',
              padding: '8px',
              borderRadius: '8px',
              color: 'var(--accent-primary)'
            }}>
              <Lock size={20} />
            </div>
            <div>
              <h3 className="modal-title">Secure File Upload</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Application-Level AES-256-GCM Envelope Encryption
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={isUploading}>
            <X size={18} />
          </button>
        </div>

        {/* Security Notice */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: 20,
          display: 'flex',
          gap: 10,
          fontSize: '0.825rem',
          color: '#a7f3d0'
        }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Zero Plaintext Storage:</strong> The file is encrypted using a unique 256-bit DEK and 96-bit nonce before touching the persistent filesystem.
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Dropzone */}
          <div
            className={`dropzone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={isUploading}
            />

            <UploadCloud size={40} color="var(--accent-primary)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 600, marginBottom: 4 }}>
              Click to browse or drag and drop your file here
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Supports documents, spreadsheets, PDFs, archives, images (Up to 25 MB)
            </p>
          </div>

          {/* Selected File Preview */}
          {selectedFile && (
            <div style={{
              marginTop: 16,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                <FileText size={22} color="var(--accent-cyan)" />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {formatSize(selectedFile.size)} • {selectedFile.type || 'Unknown MIME'}
                  </div>
                </div>
              </div>

              {!isUploading && (
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  style={{ color: 'var(--text-dim)', padding: 4 }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <div style={{
                height: 4,
                width: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                overflow: 'hidden',
                marginBottom: 10
              }}>
                <div style={{
                  height: '100%',
                  width: '70%',
                  background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                  animation: 'pulse 1.5s infinite'
                }} />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
                {uploadStep}
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? 'Encrypting & Uploading...' : 'Encrypt & Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
