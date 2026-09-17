import React from 'react';
import { 
  ShieldCheck, 
  Key, 
  Lock, 
  UserCheck, 
  History, 
  HardDrive, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  FileCheck
} from 'lucide-react';

export default function SecurityCenterPage() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
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
          marginBottom: 16,
          fontWeight: 600
        }}>
          <ShieldCheck size={16} color="var(--accent-primary)" />
          Application Security Whitepaper & Architecture
        </div>
        <h1 style={{ fontSize: '2.4rem', marginBottom: 12 }}>Security Center</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 720, margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Comprehensive breakdown of cryptographic primitives, authorization controls, and tamper-detection safeguards engineered into SecureShare.
        </p>
      </div>

      {/* Cloud & Infrastructure Security Positioning */}
      <div className="glass-panel" style={{ padding: 32, marginBottom: 36, borderColor: 'rgba(6, 182, 212, 0.3)' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{
            background: 'rgba(6, 182, 212, 0.15)',
            padding: 12,
            borderRadius: 12,
            color: 'var(--accent-cyan)'
          }}>
            <Server size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 8, color: '#fff' }}>
              Complementary Security Architecture Positioning
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.95rem' }}>
              Cloud and infrastructure providers provide robust security that safeguards the underlying physical servers, hypervisors, and network perimeter. 
              <strong> SecureShare adds an essential application security layer</strong> on top of that foundation. 
              It enforces organization-specific authentication, granular role-based authorization, application-level AES-256-GCM encryption, recipient-controlled sharing, and independent compliance auditing.
            </p>
          </div>
        </div>
      </div>

      {/* 5 Deep-Dive Pillars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Pillar 1: PBKDF2 */}
        <div className="glass-panel" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.15)',
              padding: 10,
              borderRadius: 10,
              color: 'var(--accent-primary)'
            }}>
              <Key size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>PBKDF2 Password Hashing</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                NIST SP 800-132 Compliant Key Derivation
              </span>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
            User passwords are encrypted using Django’s cryptographic implementation of PBKDF2 (Password-Based Key Derivation Function 2) combined with HMAC-SHA256. 
            Passwords are never stored, transmitted, or logged as plaintext. The computational work factor deliberately slows down brute-force and rainbow-table attacks.
          </p>
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: '#cbd5e1'
          }}>
            Format: pbkdf2_sha256$&lt;iterations&gt;$&lt;salt&gt;$&lt;hash&gt;
          </div>
        </div>

        {/* Pillar 2: AES-256-GCM */}
        <div className="glass-panel" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              background: 'rgba(6, 182, 212, 0.15)',
              padding: 10,
              borderRadius: 10,
              color: 'var(--accent-cyan)'
            }}>
              <Lock size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>AES-256-GCM Envelope Encryption</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                Authenticated Encryption with Associated Data (AEAD)
              </span>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
            Each file upload generates a unique, cryptographically random 256-bit Data Encryption Key (DEK) and a unique 96-bit Nonce.
            The plaintext is encrypted via AES-256-GCM, producing ciphertext concatenated with a 128-bit authentication tag.
            The DEK itself is then wrapped using an application Key Encryption Key (KEK) stored in protected environment variables.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 12
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', marginBottom: 4 }}>Unique Nonce Guarantee</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Every file encryption uses a fresh 12-byte IV preventing known-plaintext attacks.</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', marginBottom: 4 }}>Tamper Detection</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Any 1-bit alteration to stored files triggers an AES-GCM tag mismatch and halts retrieval.</div>
            </div>
          </div>
        </div>

        {/* Pillar 3: RBAC */}
        <div className="glass-panel" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              padding: 10,
              borderRadius: 10,
              color: 'var(--accent-emerald)'
            }}>
              <UserCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Strict Role-Based Access Control (RBAC)</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                Server-Side Enforcement &amp; Zero Frontend Trust
              </span>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
            Role validation is executed on the Django REST Framework backend on every API request. Unauthorized requests receive an immediate HTTP 403 Forbidden.
            Public registrations are restricted to the <code>EMPLOYEE</code> role; client-supplied role escalation attempts are disregarded.
          </p>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Privilege / Action</th>
                  <th>ADMIN</th>
                  <th>MANAGER</th>
                  <th>EMPLOYEE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>User Lifecycle Governance &amp; Role Modification</td>
                  <td><span className="badge badge-SUCCESS">Allowed</span></td>
                  <td><span className="badge badge-DENIED">Denied</span></td>
                  <td><span className="badge badge-DENIED">Denied</span></td>
                </tr>
                <tr>
                  <td>Organization-Wide Audit Log Inspection</td>
                  <td><span className="badge badge-SUCCESS">Allowed</span></td>
                  <td><span className="badge badge-DENIED">Denied</span></td>
                  <td><span className="badge badge-DENIED">Denied</span></td>
                </tr>
                <tr>
                  <td>Encrypted File Upload</td>
                  <td><span className="badge badge-SUCCESS">Allowed</span></td>
                  <td><span className="badge badge-SUCCESS">Allowed</span></td>
                  <td><span className="badge badge-SUCCESS">Allowed</span></td>
                </tr>
                <tr>
                  <td>Granular File Sharing (VIEW / DOWNLOAD)</td>
                  <td><span className="badge badge-SUCCESS">Allowed</span></td>
                  <td><span className="badge badge-SUCCESS">Allowed</span></td>
                  <td><span className="badge badge-SUCCESS">Allowed (Own)</span></td>
                </tr>
                <tr>
                  <td>Download Private Unshared Documents</td>
                  <td><span className="badge badge-SUCCESS">Policy Audit</span></td>
                  <td><span className="badge badge-DENIED">HTTP 403</span></td>
                  <td><span className="badge badge-DENIED">HTTP 403</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pillar 4: Secure File Storage */}
        <div className="glass-panel" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              padding: 10,
              borderRadius: 10,
              color: 'var(--accent-rose)'
            }}>
              <HardDrive size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Secure Storage &amp; Anti-Traversal</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-rose)', fontWeight: 600 }}>
                Zero Plaintext Persistence &amp; Execution Prevention
              </span>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Original plaintext uploads are read in-stream, encrypted into binary ciphertext, and stored at randomized UUID paths: 
            <code>media/encrypted_files/&lt;uuid&gt;.enc</code>. Original filenames are preserved strictly as metadata in the database, preventing directory traversal attacks. 
            Dangerous executable file extensions (.exe, .bat, .sh, etc.) are strictly prohibited.
          </p>
        </div>

        {/* Pillar 5: Audit Trail */}
        <div className="glass-panel" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              background: 'rgba(168, 85, 247, 0.15)',
              padding: 10,
              borderRadius: 10,
              color: '#c084fc'
            }}>
              <History size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Continuous Security Audit Logging</h3>
              <span style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 600 }}>
                Non-Repudiation &amp; Forensics
              </span>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Security events are captured in the immutable AuditLog database table with timestamp, IP address, user identity, action, target file, and success/denial status. 
            Passwords, master keys, and file contents are never exposed in log outputs.
          </p>
        </div>
      </div>
    </div>
  );
}
