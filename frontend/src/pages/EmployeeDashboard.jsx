import React, { useState, useEffect } from 'react';
import { fileService } from '../services/fileService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/StatCard';
import { 
  Files, 
  Share2, 
  Upload, 
  Download, 
  Eye, 
  FileText, 
  ShieldCheck,
  Lock
} from 'lucide-react';

export default function EmployeeDashboard({ setActivePage, onOpenUpload, setSelectedFileForDetails, onOpenFileShare }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

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
      showToast(`Verifying permissions & decrypting '${file.original_filename}'...`, 'info');
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
            <h1 style={{ fontSize: '1.75rem' }}>Employee Workspace</h1>
            <span className="badge badge-EMPLOYEE">Role: Employee</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Secure document depository. Upload confidential files and access documents shared with your account.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={onOpenUpload}
        >
          <Upload size={16} /> Upload & Encrypt
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
          title="Authorized Files" 
          value={files.length} 
          icon={Files} 
          color="emerald" 
          subtitle="Permitted by RBAC"
        />
        <StatCard 
          title="My Documents" 
          value={myFilesCount} 
          icon={Lock} 
          color="indigo" 
          subtitle="Privately owned"
        />
        <StatCard 
          title="Shared With Me" 
          value={sharedWithMeCount} 
          icon={Share2} 
          color="cyan" 
          subtitle="Granted by team"
        />
      </div>

      {/* Files Table */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('all')}
            >
              All My Documents
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'my_files' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('my_files')}
            >
              My Uploads
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'shared_with_me' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('shared_with_me')}
            >
              Shared with Me
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <ShieldCheck size={14} color="var(--accent-emerald)" />
            Tamper-Resistant AES-256-GCM
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Owner</th>
                <th>Size</th>
                <th>Permission</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 24, color: 'var(--text-dim)' }}>
                    Loading documents...
                  </td>
                </tr>
              ) : files.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                    No files found. Click <strong>Upload & Encrypt</strong> to add a new document.
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={18} color="var(--accent-emerald)" />
                        <div>
                          <div style={{ fontWeight: 600 }}>{file.original_filename}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {file.content_type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {file.is_owner ? 'You' : file.owner_username}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        {formatSize(file.file_size)}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-SUCCESS">
                        {file.is_owner ? 'OWNER' : file.user_permission}
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
                          title="View Encryption Metadata"
                        >
                          <Eye size={13} />
                        </button>
                        {file.is_owner && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onOpenFileShare(file)}
                            title="Share with Team Member"
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
