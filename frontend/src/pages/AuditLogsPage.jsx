import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { useToast } from '../context/ToastContext';
import { 
  History, 
  Search, 
  Filter, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Clock
} from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const { showToast } = useToast();

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAuditLogs({
        action: actionFilter,
        status: statusFilter,
        username: usernameFilter
      });
      setLogs(data);
    } catch (err) {
      showToast(err.message || 'Failed to retrieve audit log stream.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadLogs();
  };

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
            <History size={28} color="var(--accent-primary)" />
            Security Audit Trail
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Immutable security event logs capturing authentication, authorization denials, file operations, and role modifications.
          </p>
        </div>

        <button 
          className="btn btn-secondary btn-sm"
          onClick={loadLogs}
        >
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <form onSubmit={handleSearch} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 100px',
          gap: 12,
          alignItems: 'center'
        }}>
          {/* Action Filter */}
          <select
            className="form-select"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="">All Actions</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="FILE_UPLOAD">FILE_UPLOAD</option>
            <option value="FILE_DOWNLOAD">FILE_DOWNLOAD</option>
            <option value="FILE_SHARE">FILE_SHARE</option>
            <option value="FILE_ACCESS_DENIED">FILE_ACCESS_DENIED</option>
            <option value="ROLE_CHANGED">ROLE_CHANGED</option>
            <option value="USER_CREATED">USER_CREATED</option>
            <option value="USER_DELETED">USER_DELETED</option>
            <option value="SHARE_REVOKED">SHARE_REVOKED</option>
          </select>

          {/* Status Filter */}
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
            <option value="DENIED">DENIED</option>
          </select>

          {/* Username Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search user..."
              value={usernameFilter}
              onChange={(e) => setUsernameFilter(e.target.value)}
              style={{ padding: '8px 12px 8px 32px', fontSize: '0.85rem' }}
            />
            <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: 10, top: 11 }} />
          </div>

          <button type="submit" className="btn btn-primary btn-sm" style={{ height: 38 }}>
            Filter
          </button>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Status</th>
                <th>Target Resource</th>
                <th>Client IP</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                    Loading audit stream...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 36, color: 'var(--text-dim)' }}>
                    No audit events recorded under this filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {log.username}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${log.status}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: log.status === 'SUCCESS' ? '#34d399' : '#f87171'
                      }}>
                        {log.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        {log.file_name || log.file_id || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {log.ip_address || '127.0.0.1'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-main)' }}>
                        {log.description}
                      </span>
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
