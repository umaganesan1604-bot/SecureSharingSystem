import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  ShieldCheck, 
  Files, 
  Users, 
  History, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Upload, 
  ExternalLink,
  Lock
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage, onOpenUpload }) {
  const { user, role, isAuthenticated, logout } = useAuth();

  return (
    <nav style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
        {/* Brand */}
        <div 
          onClick={() => setActivePage(isAuthenticated ? 'dashboard' : 'landing')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
          }}>
            <Lock size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
                SecureShare
              </span>
              <span style={{ 
                fontSize: '0.65rem', 
                background: 'rgba(99, 102, 241, 0.2)', 
                color: '#818cf8', 
                padding: '2px 6px', 
                borderRadius: 4, 
                fontWeight: 700 
              }}>
                AES-256
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isAuthenticated ? (
            <>
              <button 
                className={`btn btn-sm ${activePage === 'landing' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActivePage('landing')}
              >
                Overview
              </button>
              <button 
                className={`btn btn-sm ${activePage === 'security' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActivePage('security')}
              >
                <ShieldCheck size={15} /> Security Center
              </button>
              <a 
                href="/api/docs/" 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-sm btn-secondary"
                title="OpenAPI / Swagger UI"
              >
                <ExternalLink size={14} /> Swagger API
              </a>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => setActivePage('login')}
              >
                <LogIn size={15} /> Sign In
              </button>
              <button 
                className="btn btn-sm btn-primary"
                onClick={() => setActivePage('register')}
              >
                <UserPlus size={15} /> Register
              </button>
            </>
          ) : (
            <>
              {/* Authenticated Links */}
              <button 
                className={`btn btn-sm ${activePage === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActivePage('dashboard')}
              >
                Dashboard
              </button>

              {role === 'ADMIN' && (
                <button 
                  className={`btn btn-sm ${activePage === 'users' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActivePage('users')}
                >
                  <Users size={15} /> Users
                </button>
              )}

              <button 
                className={`btn btn-sm ${activePage === 'files' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActivePage('files')}
              >
                <Files size={15} /> Files
              </button>

              {role === 'ADMIN' && (
                <button 
                  className={`btn btn-sm ${activePage === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActivePage('audit')}
                >
                  <History size={15} /> Audit Logs
                </button>
              )}

              <button 
                className={`btn btn-sm ${activePage === 'security' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActivePage('security')}
              >
                <ShieldCheck size={15} /> Security Center
              </button>

              {/* Upload Button */}
              {onOpenUpload && (
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={onOpenUpload}
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  <Upload size={14} /> Upload
                </button>
              )}

              {/* User role & Logout */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 12, borderLeft: '1px solid var(--border-subtle)', paddingLeft: 14 }}>
                <div 
                  onClick={() => setActivePage('profile')}
                  style={{ cursor: 'pointer', textAlign: 'right' }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                    {user?.username}
                  </div>
                  <span className={`badge badge-${role}`}>
                    {role}
                  </span>
                </div>

                <button 
                  className="btn btn-sm btn-secondary" 
                  onClick={logout}
                  title="Log Out"
                  style={{ padding: '8px' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
