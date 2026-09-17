import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  UserCheck, 
  Share2, 
  FileText, 
  History, 
  Database, 
  ArrowRight, 
  ExternalLink,
  CheckCircle2,
  Server
} from 'lucide-react';

export default function LandingPage({ setActivePage }) {
  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Hero Section */}
      <section style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '70px 24px 60px',
        textAlign: 'center'
      }}>
        {/* Security Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 9999,
          padding: '6px 16px',
          fontSize: '0.85rem',
          color: '#a5b4fc',
          marginBottom: 24,
          fontWeight: 600
        }}>
          <ShieldCheck size={16} color="var(--accent-primary)" />
          Enterprise Data Privacy Architecture
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          marginBottom: 20,
          background: 'linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Secure Data Sharing with Privacy at the Core
        </h1>

        <p style={{
          maxWidth: 780,
          margin: '0 auto 36px',
          fontSize: '1.2rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6
        }}>
          Protect sensitive organizational files with application-level AES-256-GCM encryption, 
          strictly enforced Role-Based Access Control, PBKDF2 authentication, and continuous security auditing.
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          flexWrap: 'wrap'
        }}>
          <button
            className="btn btn-primary"
            onClick={() => setActivePage('register')}
            style={{ padding: '14px 28px', fontSize: '1.05rem' }}
          >
            Get Started <ArrowRight size={18} />
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setActivePage('login')}
            style={{ padding: '14px 28px', fontSize: '1.05rem' }}
          >
            Sign In to Portal
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setActivePage('security')}
            style={{ padding: '14px 24px', fontSize: '1.05rem' }}
          >
            <ShieldCheck size={18} /> Security Center
          </button>
          <a
            href="/api/docs/"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ padding: '14px 24px', fontSize: '1.05rem' }}
          >
            <ExternalLink size={18} /> Swagger Docs
          </a>
        </div>
      </section>

      {/* 6 Core Features */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '2rem', marginBottom: 12 }}>Engineered for Total Confidentiality</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto' }}>
            Built around strict cryptographic primitives and defense-in-depth authorization models.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 24
        }}>
          {/* Feature 1 */}
          <div className="glass-panel" style={{ padding: 28 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              marginBottom: 16
            }}>
              <Lock size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 10 }}>1. AES-256-GCM Encryption</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              Files are encrypted client-side or server-side before persistent storage using AES in Galois/Counter Mode with 256-bit keys and unique 96-bit nonces.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel" style={{ padding: 28 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              marginBottom: 16
            }}>
              <UserCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 10 }}>2. Role-Based Access Control</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              Three explicit tiers (ADMIN, MANAGER, EMPLOYEE) strictly enforced on the server. Client-side attempts to self-escalate privileges are rejected.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel" style={{ padding: 28 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-emerald)',
              marginBottom: 16
            }}>
              <Key size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 10 }}>3. PBKDF2 Password Hashing</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              Industry-standard key derivation with salt ensures passwords are never stored or logged in plaintext, mitigating dictionary and rainbow table attacks.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-panel" style={{ padding: 28 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)',
              marginBottom: 16
            }}>
              <Share2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 10 }}>4. Controlled File Sharing</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              Owners grant granular VIEW or DOWNLOAD privileges to specific organizational accounts. Access can be revoked instantly at any time.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="glass-panel" style={{ padding: 28 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(168, 85, 247, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc',
              marginBottom: 16
            }}>
              <History size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 10 }}>5. Security Audit Logging</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              Immutable audit logs record authentication attempts, uploads, downloads, sharing grants, and access denials with timestamps and IP records.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="glass-panel" style={{ padding: 28 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-rose)',
              marginBottom: 16
            }}>
              <Database size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 10 }}>6. Secure File Storage</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              Persistent storage never houses plaintext files. Encrypted blobs use non-executable UUID storage paths resistant to directory traversal attacks.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works / Verification Flow */}
      <section style={{ maxWidth: 1200, margin: '60px auto 0', padding: '0 24px' }}>
        <div className="glass-panel" style={{ padding: '40px 36px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: 16, textAlign: 'center' }}>
            Authorization-Before-Decryption Lifecycle
          </h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 700, margin: '0 auto 36px' }}>
            To prevent side-channel leaks and unnecessary decryption overhead, every request undergoes strict checks before cryptography is invoked.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            textAlign: 'center'
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: 6 }}>STEP 01</div>
              <h4 style={{ fontSize: '1rem', marginBottom: 8 }}>Authenticate User</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-dim)' }}>DRF token and session verification with PBKDF2 credentials.</p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: 6 }}>STEP 02</div>
              <h4 style={{ fontSize: '1rem', marginBottom: 8 }}>Evaluate RBAC & ACL</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-dim)' }}>Verify role hierarchy, file ownership, and active share records.</p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: 6 }}>STEP 03</div>
              <h4 style={{ fontSize: '1rem', marginBottom: 8 }}>Retrieve Ciphertext</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-dim)' }}>Read encrypted blob from UUID storage only after permission confirmed.</p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 700, marginBottom: 6 }}>STEP 04</div>
              <h4 style={{ fontSize: '1rem', marginBottom: 8 }}>AES-256-GCM Decrypt</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-dim)' }}>Validate 128-bit authentication tag; streams file to verified client.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cloud Positioning Statement */}
      <section style={{ maxWidth: 1000, margin: '60px auto 0', padding: '0 24px' }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 32px',
          display: 'flex',
          gap: 20,
          alignItems: 'center'
        }}>
          <Server size={36} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ fontSize: '1.05rem', marginBottom: 6 }}>Application-Layer Security Model</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Cloud and infrastructure security protect the underlying infrastructure, while SecureShare adds organization-specific authentication, role-based access control, application-level encryption, controlled file sharing, and comprehensive auditing.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        maxWidth: 1200,
        margin: '80px auto 0',
        padding: '24px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        color: 'var(--text-dim)',
        fontSize: '0.85rem'
      }}>
        <div>
          <strong>SecureShare</strong> • Privacy-Enhancing Secure Data Sharing System
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <button onClick={() => setActivePage('security')} style={{ color: 'inherit' }}>Security Center</button>
          <a href="/api/docs/" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>OpenAPI / Swagger</a>
          <span>AES-256-GCM / PBKDF2</span>
        </div>
      </footer>
    </div>
  );
}
