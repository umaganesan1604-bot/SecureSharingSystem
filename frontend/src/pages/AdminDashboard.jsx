import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { fileService } from '../services/fileService';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/StatCard';
import { 
  Users, 
  ShieldCheck, 
  Briefcase, 
  FileLock2, 
  AlertTriangle, 
  Upload, 
  Eye, 
  Download, 
  ArrowRight,
  PlusCircle,
  FileText,
  Clock
} from 'lucide-react';

export default function AdminDashboard({ setActivePage, onOpenUpload, setSelectedFileForDetails, onOpenFileShare }) {
  const [stats, setStats] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, filesData] = await Promise.all([
        adminService.getStats(),
        fileService.getFiles('all')
      ]);
      setStats(statsData);
      setFiles(filesData.slice(0, 6)); // Top 6 files
    } catch (err) {
      showToast(err.message || 'Failed to load admin stats.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleDownload = async (file) => {
    try {
      showToast(`Verifying authorization & decrypting '${file.original_filename}'...`, 'info');
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

  if (loading && !stats) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
        Loading administrative oversight metrics...
      </div>
    );
  }

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
            <h1 style={{ fontSize: '1.75rem' }}>Administrator Console</h1>
            <span className="badge badge-ADMIN">Full System Privilege</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            System-wide user governance, cryptographic file oversight, and immutable audit logs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setActivePage('users')}
          >
            <Users size={15} /> Manage Users
          </button>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setActivePage('audit')}
          >
            <Clock size={15} /> Audit Trail
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={onOpenUpload}
          >
            <Upload size={15} /> Upload Encrypted File
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 32
      }}>
        <StatCard 
          title="Total Users" 
          value={stats?.total_users || 0} 
          icon={Users} 
          color="indigo" 
          subtitle="Registered accounts"
        />
        <StatCard 
          title="Administrators" 
          value={stats?.admin_count || 0} 
          icon={ShieldCheck} 
          color="purple" 
          subtitle="Role: ADMIN"
        />
        <StatCard 
          title="Managers" 
          value={stats?.manager_count || 0} 
          icon={Briefcase} 
          color="cyan" 
          subtitle="Role: MANAGER"
        />
        <StatCard 
          title="Employees" 
          value={stats?.employee_count || 0} 
          icon={Users} 
          color="emerald" 
          subtitle="Role: EMPLOYEE"
        />
        <StatCard 
          title="Encrypted Files" 
          value={stats?.total_files || 0} 
          icon={FileLock2} 
          color="amber" 
          subtitle="AES-256-GCM"
        />
        <StatCard 
          title="Security Events" 
          value={stats?.security_events || 0} 
          icon={AlertTriangle} 
          color="rose" 
          subtitle="Audit denials & alerts"
        />
      </div>

      {/* Two Column Layout: Recent Files & Audit Activity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: 24
      }}>
        {/* Recent Files Table */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: '1.1rem' }}>Active Encrypted Files</h3>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActivePage('files')}
            >
              View All Files <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Owner</th>
                  <th>Size</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 24 }}>
                      No encrypted files found. Upload a file to begin.
                    </td>
                  </tr>
                ) : (
                  files.map((file) => (
                    <tr key={file.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileText size={16} color="var(--accent-primary)" />
                          <span style={{ fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.original_filename}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{file.owner_username}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          {formatSize(file.file_size)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedFileForDetails(file)}
                            title="Verify encryption specs"
                            style={{ padding: '4px 8px' }}
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleDownload(file)}
                            title="Authorize & Download"
                            style={{ padding: '4px 8px' }}
                          >
                            <Download size={13} />
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

        {/* Recent Audit Timeline */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: '1.1rem' }}>Recent Security Audit Logs</h3>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActivePage('audit')}
            >
              Full Log Stream <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(!stats?.recent_activity || stats.recent_activity.length === 0) ? (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 24 }}>
                No recent security activity logged.
              </div>
            ) : (
              stats.recent_activity.map((log) => (
                <div 
                  key={log.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className={`badge badge-${log.status}`}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        by <strong>{log.username}</strong>
                      </span>
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {log.description}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', textAlign: 'right' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
