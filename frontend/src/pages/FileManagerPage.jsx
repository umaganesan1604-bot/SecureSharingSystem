import React, { useState, useEffect } from 'react';
import { fileService } from '../services/fileService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Files, 
  Search, 
  Upload, 
  Download, 
  Share2, 
  Trash2, 
  Eye, 
  FileText, 
  Lock,
  Filter
} from 'lucide-react';

export default function FileManagerPage({ onOpenUpload, setSelectedFileForDetails, onOpenFileShare }) {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fileToDelete, setFileToDelete] = useState(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await fileService.getFiles(scope, searchQuery);
      setFiles(data);
    } catch (err) {
      showToast(err.message || 'Failed to retrieve file list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [scope]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadFiles();
  };

  const handleDownload = async (file) => {
    try {
      showToast(`Verifying RBAC permissions & decrypting '${file.original_filename}'...`, 'info');
      await fileService.downloadFile(file.id, file.original_filename);
      showToast('File decrypted and downloaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Unauthorized download attempt blocked by server.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      await fileService.deleteFile(fileToDelete.id);
      showToast(`File '${fileToDelete.original_filename}' deleted securely.`, 'success');
      setFileToDelete(null);
      loadFiles();
    } catch (err) {
      showToast(err.message || 'Failed to delete file.', 'error');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isAdmin = role === 'ADMIN';

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Files size={28} color="var(--accent-primary)" />
            Enterprise File Manager
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            AES-256-GCM encrypted document vault. Plaintext is never written to disk.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={onOpenUpload}
        >
          <Upload size={16} /> Upload New File
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-sm ${scope === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setScope('all')}
            >
              {isAdmin ? 'All Organization Files' : 'All Accessible Files'}
            </button>
            <button
              className={`btn btn-sm ${scope === 'my_files' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setScope('my_files')}
            >
              My Uploads
            </button>
            <button
              className={`btn btn-sm ${scope === 'shared_with_me' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setScope('shared_with_me')}
            >
              Shared with Me
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search filenames..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 14px 8px 36px', fontSize: '0.85rem', width: 220 }}
              />
              <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 11 }} />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Owner</th>
                <th>Size</th>
                <th>Type</th>
                <th>Encryption</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                    Loading encrypted file repository...
                  </td>
                </tr>
              ) : files.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 36, color: 'var(--text-dim)' }}>
                    No files found matching current filter or search.
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={18} color="var(--accent-primary)" />
                        <div>
                          <div style={{ fontWeight: 600 }}>{file.original_filename}</div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            ID: {file.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {file.is_owner ? 'You (Owner)' : file.owner_username}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        {formatSize(file.file_size)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {file.content_type.split('/')[1] || file.content_type}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-SUCCESS" style={{ fontSize: '0.7rem' }}>
                        {file.encryption_version}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {new Date(file.uploaded_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedFileForDetails(file)}
                          title="Inspect Cryptographic Metadata"
                        >
                          <Eye size={14} />
                        </button>

                        {(file.is_owner || isAdmin) && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onOpenFileShare(file)}
                            title="Manage Sharing"
                          >
                            <Share2 size={14} /> Share
                          </button>
                        )}

                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleDownload(file)}
                          title="Authorize, Decrypt & Download"
                        >
                          <Download size={14} /> Download
                        </button>

                        {(file.is_owner || isAdmin) && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setFileToDelete(file)}
                            title="Delete File"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Encrypted File"
        message={`Are you sure you want to permanently delete '${fileToDelete?.original_filename}'? The persistent encrypted ciphertext and all active share records will be purged from the server.`}
        confirmText="Delete File"
        isDanger={true}
      />
    </div>
  );
}
