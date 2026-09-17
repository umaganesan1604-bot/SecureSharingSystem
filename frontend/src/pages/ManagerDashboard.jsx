import React, { useState, useEffect } from 'react';
import { fileService } from '../services/fileService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/StatCard';
import { 
  Briefcase, 
  Files, 
  Share2, 
  Upload, 
  Download, 
  Eye, 
  FileText, 
  CheckCircle2,
  Trash2
} from 'lucide-react';

export default function ManagerDashboard({ setActivePage, onOpenUpload, setSelectedFileForDetails, onOpenFileShare }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'my_files', 'shared_with_me'

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await fileService.getFiles(activeTab);
      setFiles(data);
    } catch (err) {
      showToast(err.message || 'Failed to load files.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [activeTab]);

  const handleDownload = async (file) => {
    try {
      showToast(`Authorizing & decrypting '${file.original_filename}'...`, 'info');
      await fileService.downloadFile(file.id, file.original_filename);
      showToast('File decrypted and downloaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Download failed.', 'error');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const myFilesCount = files.filter(f => f.is_owner).length;
  const sharedWithMeCount = files.filter(f => !f.is_owner).length;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: '1.75rem' }}>Manager Portal</h1>
            <span className="badge badge-MANAGER">Role: Manager</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Upload sensitive team documents, grant secure sharing permissions, and access authorized files.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={onOpenUpload}
        >
          <Upload size={16} /> Upload & Encrypt File
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 32
      }}>
        <StatCard 
          title="Accessible Files" 
          value={files.length} 
          icon={Files} 
          color="cyan" 
          subtitle="Permitted by RBAC"
        />
        <StatCard 
          title="My Uploads" 
          value={myFilesCount} 
          icon={Briefcase} 
          color="indigo" 
          subtitle="Owned by you"
        />
        <StatCard 
          title="Shared with Me" 
          value={sharedWithMeCount} 
          icon={Share2} 
          color="emerald" 
          subtitle="Collaborative files"
        />
      </div>

      {/* File Management Table */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('all')}
            >
              All Permitted Files
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'my_files' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('my_files')}
            >
              My Files
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'shared_with_me' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('shared_with_me')}
            >
              Shared with Me
            </button>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            AES-256-GCM Decryption on Download
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Owner</th>
                <th>Size</th>
                <th>Permissions</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 24, color: 'var(--text-dim)' }}>
                    Loading encrypted files...
                  </td>
                </tr>
              ) : files.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                    No files found in this category. Click <strong>Upload & Encrypt File</strong> to add your first document.
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={18} color="var(--accent-cyan)" />
                        <div>
                          <div style={{ fontWeight: 600 }}>{file.original_filename}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                            {file.encryption_version}
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
                      <span className="badge badge-SUCCESS">
                        {file.is_owner ? 'FULL ACCESS' : file.user_permission}
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
                          title="View Encryption Specs"
                        >
                          <Eye size={13} />
                        </button>
                        {file.is_owner && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onOpenFileShare(file)}
                            title="Share with Colleague"
                          >
                            <Share2 size={13} /> Share
                          </button>
                        )}
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleDownload(file)}
                          title="Decrypt & Download"
                        >
                          <Download size={13} /> Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
