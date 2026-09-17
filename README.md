# SecureShare: Privacy-Enhancing Secure Data Sharing System

> **Using Application-Level AES-256-GCM Envelope Encryption and Role-Based Access Control (RBAC)**

---

## 1. Project Overview

**SecureShare** is an enterprise-grade secure document and file sharing system engineered for organizations handling sensitive, confidential, or regulated data. Traditional cloud storage protects infrastructure at rest, but often exposes data in plaintext to application compromises or insider threats. SecureShare addresses this gap by implementing **Zero Plaintext Storage** through **application-level AES-256-GCM envelope encryption**, strict **server-side Role-Based Access Control (RBAC)**, **PBKDF2 password hashing**, and comprehensive **immutable audit logging**.

### Core Objectives
1. **Confidentiality**: Guarantee that no persistent file on disk or in the database ever contains plaintext sensitive data.
2. **Integrity & Authenticity**: Enforce AES-GCM 128-bit authentication tags to detect any bit-level tampering.
3. **Defense-in-Depth Authorization**: Authorize all access **strictly before decryption**; unauthorized download requests never trigger cryptographic key usage.
4. **Non-Repudiation**: Capture all security-relevant actions in an audit log without exposing passwords or keys.

---

## 2. Implemented Features vs. Future Production Enhancements

### Implemented Features (Working Now)
- [x] **Real Application-Level AES-256-GCM Envelope Encryption**: Unique 256-bit Data Encryption Key (DEK) and unique 96-bit Nonce per file; DEK wrapped with Master Key (KEK).
- [x] **Zero Plaintext Persistence**: Files on disk are solely encrypted ciphertext blobs stored with random UUID identifiers, eliminating path traversal risks.
- [x] **Tamper Detection**: Verification of 128-bit AES-GCM authentication tags rejects corrupted or tampered files.
- [x] **PBKDF2 Password Hashing**: Utilizes Django's PBKDF2 with SHA-256 iterations and unique salts; plaintext passwords are never stored or logged.
- [x] **Strict RBAC Architecture**:
  - `ADMIN`: User lifecycle management, role assignment/demotion, system-wide file access, audit log stream, dashboard analytics.
  - `MANAGER`: Encrypted file uploads, sharing with team members (`VIEW` / `DOWNLOAD`), authorized downloads.
  - `EMPLOYEE`: Secure personal document uploads, access to team-shared files, authorized downloads.
- [x] **Public Registration Safety**: Enforces unconditional assignment of `EMPLOYEE` role; client-supplied role parameters are rejected/ignored.
- [x] **Controlled File Sharing & Revocation**: Granular access delegation with instant share revocation.
- [x] **Authorization Before Decryption**: Download checks permissions first; unpermitted requests receive HTTP 403 Forbidden without touching crypto keys.
- [x] **Comprehensive Security Audit Logging**: Tracks register, login success/failure, file upload, download, share, denial, role change, and deletion.
- [x] **Interactive OpenAPI 3.0 / Swagger UI**: Full documentation available at `/api/docs/`.
- [x] **20 Automated Security Tests**: 100% test pass rate covering all 7 mandatory security scenarios.
- [x] **Modern Responsive Frontend**: React + Vite interface with dark security aesthetic, drag-and-drop upload, role-tailored navigation, and Security Center.

### Future Production Enhancements (Roadmap)
- Hardware Security Module (HSM) / Cloud KMS (AWS KMS, GCP Cloud KMS, HashiCorp Vault) integration for external Master KEK rotation.
- Time-limited, expiring share links.
- Client-side WebCrypto pre-encryption for end-to-end zero-knowledge architectures.
- Multi-Factor Authentication (MFA / TOTP).

---

## 3. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | Python 3.13 / 3.14, Django 5+, Django REST Framework | REST APIs, authentication, serialization, signals |
| **Security & Crypto** | `cryptography` Python package | AES-256-GCM AEAD, secure random nonces (`os.urandom`) |
| **Password Hashing** | Django Built-in PBKDF2 Hasher | NIST SP 800-132 password derivation |
| **Database** | SQLite (Default dev), PostgreSQL / MySQL ready | Metadata, user profiles, shares, audit logs |
| **API Documentation**| OpenAPI 3.0, Swagger UI (`drf-spectacular`) | Live interactive endpoint documentation |
| **Frontend Framework**| React 19 / 18, Vite | High-performance SPA with client-side routing |
| **Styling & Icons** | Vanilla CSS (Design Tokens, Glassmorphism), `lucide-react` | Enterprise dark security UI theme |
| **Containerization** | Docker, Docker Compose | Multi-stage production container build |

---

## 4. Project Folder Structure

```
SecureShareProject/
├── backend/
│   ├── manage.py                     # Django management script with dotenv support
│   ├── requirements.txt              # Backend dependencies
│   ├── .env.example                  # Backend environment template
│   ├── .env                          # Active development secrets (gitignored)
│   ├── config/
│   │   ├── settings.py               # PBKDF2, AES-256-GCM, CORS, REST settings
│   │   ├── urls.py                   # Central routing & Swagger UI endpoints
│   │   ├── wsgi.py                   # Production WSGI application
│   │   └── asgi.py                   # Production ASGI application
│   ├── accounts/
│   │   ├── models.py                 # UserProfile (phone, role: ADMIN, MANAGER, EMPLOYEE)
│   │   ├── serializers.py            # Register (forces EMPLOYEE), Login, Profile, Admin serializers
│   │   ├── permissions.py            # IsAdmin, IsManager, IsEmployee, IsAdminOrManager
│   │   ├── views.py                  # Register, Login, Logout, Profile, Admin User ViewSets
│   │   ├── urls_auth.py              # /api/auth/ routes
│   │   ├── urls_profile.py           # /api/profile/ route
│   │   ├── urls_admin.py             # /api/admin/ routes
│   │   ├── signals.py                # Automatic UserProfile creation
│   │   ├── exceptions.py             # Safe, standardized error handler
│   │   └── management/commands/
│   │       └── seed_demo_data.py     # Populates Admin, Manager, Employee & encrypted files
│   ├── fileshare/
│   │   ├── models.py                 # SecureFile, FileShare models
│   │   ├── serializers.py            # SecureFileSerializer, FileShareSerializer
│   │   ├── views.py                  # FileUpload, FileList, FileDownload, FileShare, Revoke, Delete
│   │   └── urls.py                   # /api/files/ routes
│   ├── encryption/
│   │   ├── services.py               # AES-256-GCM envelope encryption, DEK wrapping, decryption
│   │   └── validators.py             # Anti-path traversal, safe UUID names, upload size limits
│   ├── audit/
│   │   ├── models.py                 # AuditLog model (action, status, user, ip, description)
│   │   ├── services.py               # log_audit_event() service helper
│   │   ├── serializers.py            # AuditLogSerializer
│   │   ├── views.py                  # AuditLogListView (Admin only)
│   │   └── urls.py                   # /api/audit/ route
│   └── tests/
│       ├── test_auth_and_security.py # Test 1, Test 2, PBKDF2 verification, duplicate username
│       ├── test_rbac.py              # Test 3, role restrictions, boundary tests
│       ├── test_encryption.py        # Test 6, Test 7, round-trip crypto, tamper detection, wrong key
│       └── test_files_and_audit.py   # Test 4, Test 5, upload, authorized download, sharing, revocation
├── frontend/
│   ├── package.json                  # React + Vite configuration and dependencies
│   ├── vite.config.js                # Dev server with /api proxy to backend
│   ├── index.html                    # SEO metadata, Google Fonts (Plus Jakarta Sans, JetBrains Mono)
│   └── src/
│       ├── main.jsx                  # React application entry point
│       ├── App.jsx                   # Navigation state, dashboard routing, modal manager
│       ├── index.css                 # Enterprise security design system & CSS tokens
│       ├── context/
│       │   ├── AuthContext.jsx       # Global authentication state, tokens, user role
│       │   └── ToastContext.jsx      # Non-intrusive toast notification system
│       ├── services/
│       │   ├── api.js                # Central fetch client with token header & blob support
│       │   ├── authService.js        # Authentication API interactions
│       │   ├── fileService.js        # Encrypted file upload, download, share, revoke, delete
│       │   └── adminService.js       # User lifecycle, role updates, stats, audit log queries
│       ├── components/
│       │   ├── Navbar.jsx            # Role-aware navigation bar
│       │   ├── StatCard.jsx          # Dashboard KPI metric cards
│       │   ├── FileUploadModal.jsx   # Drag-and-drop file upload with crypto progress
│       │   ├── FileShareModal.jsx    # Recipient access delegation & revocation modal
│       │   ├── FileDetailsModal.jsx  # Cryptographic metadata inspector
│       │   └── ConfirmModal.jsx      # Accessible action confirmation dialog
│       └── pages/
│           ├── LandingPage.jsx       # Public overview, 6 feature cards, architecture lifecycle
│           ├── LoginPage.jsx         # Sign in with role-ready quick credentials
│           ├── RegisterPage.jsx      # Registration with PBKDF2 and Employee policy banner
│           ├── AdminDashboard.jsx    # System metrics, active files oversight, recent audits
│           ├── ManagerDashboard.jsx  # Department file depository, sharing, authorized downloads
│           ├── EmployeeDashboard.jsx # Personal documents, shared with me, upload & download
│           ├── FileManagerPage.jsx   # Searchable file explorer with tabs, filters, and actions
│           ├── UserManagementPage.jsx# Admin user directory, role changer, status toggle, delete
│           ├── AuditLogsPage.jsx     # Filterable forensic security event audit stream
│           ├── SecurityCenterPage.jsx# Technical whitepaper on PBKDF2, AES-GCM, and RBAC
│           └── ProfilePage.jsx       # User identity, privileges summary, and logout
├── .env.example                      # Root environment configuration template
├── .gitignore                        # Professional ignore rules (Python, Django, Node, Media)
├── Dockerfile                        # Multi-stage container definition
├── docker-compose.yml                # Multi-service container orchestration
└── README.md                         # Comprehensive documentation
```

---

## 5. Security Architecture Deep Dive

```
[ Upload Lifecycle ]
User Plaintext File
        ↓
Validate Size (<25 MB) & Strip Path Traversal
        ↓
Generate Unique 256-bit DEK + 96-bit Nonce
        ↓
Encrypt Plaintext with DEK (AES-256-GCM)
        ↓
Encrypt DEK with Master KEK (AES-256-GCM)
        ↓
Save ONLY Ciphertext to Disk (media/encrypted_files/<uuid>.enc)
        ↓
Save Metadata (Non-plaintext DEK, Nonce, UUID, Owner)
        ↓
Audit Event: FILE_UPLOAD
```

```
[ Download Lifecycle - Strict Authorization First ]
Download Request (File ID)
        ↓
1. Verify User Authentication (DRF Token)
        ↓
2. Evaluate RBAC & Permissions (Owner OR Active Share OR Admin)
        ↓
[ UNAUTHORIZED ] ─────────────────────────→ Log FILE_ACCESS_DENIED & Return HTTP 403
        ↓ (ONLY IF AUTHORIZED)
3. Retrieve Ciphertext from Disk
        ↓
4. Decrypt DEK using Master KEK
        ↓
5. Decrypt Ciphertext using DEK & Nonce (AES-256-GCM)
        ↓
[ TAMPER DETECTED / TAG MISMATCH ] ───────→ Return Integrity Error & Halt
        ↓ (TAG VERIFIED)
6. Stream Plaintext File to Authorized Client
        ↓
7. Audit Event: FILE_DOWNLOAD
```

### Key Management & Envelope Encryption
- **Key Encryption Key (KEK)**: 256-bit master key loaded from environment variable `ENCRYPTION_KEY`. In production, this can be mapped directly to AWS KMS, GCP Cloud KMS, or HashiCorp Vault.
- **Data Encryption Key (DEK)**: 256-bit ephemeral key generated using `os.urandom(32)` uniquely for every upload.
- **Nonce (IV)**: 96-bit cryptographically random IV generated via `os.urandom(12)`. Reusing a nonce under the same key is catastrophic in GCM mode; SecureShare avoids this by generating fresh nonces and unique per-file DEKs.

---

## 6. Installation and Setup Guide

### Prerequisites
- Python 3.12+ (Python 3.13 / 3.14 supported)
- Node.js 18+ and npm
- Git

### Step 1: Clone the Repository
```bash
git clone <repository_url> SecureShareProject
cd SecureShareProject
```

### Step 2: Backend Setup
1. **Create and Activate Virtual Environment**:
   ```bash
   # Windows
   py -3.13 -m venv venv
   .\venv\Scripts\activate

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install Python Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example backend/.env
   ```
   *Note: `backend/.env` is pre-configured with development keys for immediate use.*

4. **Run Database Migrations**:
   ```bash
   python backend/manage.py migrate
   ```

5. **Seed Demo Users & Encrypted Files**:
   ```bash
   python backend/manage.py seed_demo_data
   ```

### Step 3: Frontend Setup
1. **Install Node Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

---

## 7. How to Run

### Run Backend Server
From the project root:
```bash
# Windows
.\venv\Scripts\python.exe backend/manage.py runserver 127.0.0.1:8000

# Linux / macOS
python backend/manage.py runserver 127.0.0.1:8000
```
Backend runs at `http://127.0.0.1:8000/`.

### Run Frontend Development Server
In a separate terminal:
```bash
cd frontend
npm run dev
```
Frontend runs at `http://localhost:5173/`.

---

## 8. Demo User Credentials

The `seed_demo_data` command creates three organizational accounts with distinct RBAC privileges:

| Role | Username | Password | Entitlements |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin_user` | `AdminPass123!` | User governance, role promotion/demotion, all files, audit logs, system stats |
| **MANAGER** | `manager_user` | `ManagerPass123!` | Department uploads, file sharing with `VIEW`/`DOWNLOAD`, authorized downloads |
| **EMPLOYEE** | `employee_user` | `EmployeePass123!` | Personal file uploads, shared document access, authorized downloads |

*Tip: The Sign In page features one-click demo credential buttons for instant testing.*

---

## 9. API Documentation (Swagger / OpenAPI)

Interactive OpenAPI 3.0 documentation is fully generated and accessible:
- **Swagger UI**: [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)
- **ReDoc**: [http://127.0.0.1:8000/api/redoc/](http://127.0.0.1:8000/api/redoc/)
- **OpenAPI Schema (JSON/YAML)**: [http://127.0.0.1:8000/api/schema/](http://127.0.0.1:8000/api/schema/)

### Main API Endpoints Summary

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register/` | Public | Register new user (unconditionally gets EMPLOYEE) |
| `POST` | `/api/auth/login/` | Public | Authenticate credentials via PBKDF2; returns DRF token |
| `POST` | `/api/auth/logout/` | Authenticated | Invalidate token and terminate session |
| `GET` | `/api/profile/` | Authenticated | Retrieve current user profile and role |
| `POST` | `/api/files/upload/` | Authenticated | Upload file; applies AES-256-GCM before disk write |
| `GET` | `/api/files/` | Authenticated | List files filtered by RBAC |
| `GET` | `/api/files/<id>/` | Authorized | View file metadata (checks permissions) |
| `GET` | `/api/files/<id>/download/` | Authorized | **Authorizes first**, decrypts AES-GCM, returns file |
| `POST` | `/api/files/<id>/share/` | Owner / Admin | Share file with user (`VIEW` or `DOWNLOAD`) |
| `POST` | `/api/files/<id>/revoke-share/`| Owner / Admin | Revoke sharing access |
| `DELETE` | `/api/files/<id>/` | Owner / Admin | Purge encrypted file from disk and database |
| `GET` | `/api/admin/users/` | Admin Only | List organizational users with role/search filters |
| `POST` | `/api/admin/users/create/` | Admin Only | Create user directly with designated role |
| `PATCH`| `/api/admin/users/<id>/role/`| Admin Only | Update user role (prevents removing last admin) |
| `PATCH`| `/api/admin/users/<id>/status/`| Admin Only | Activate or deactivate user account |
| `DELETE`| `/api/admin/users/<id>/` | Admin Only | Delete user account |
| `GET` | `/api/admin/stats/` | Admin Only | Dashboard counts (users, roles, files, events) |
| `GET` | `/api/audit/` | Admin Only | Filtered audit log stream |

---

## 10. Automated Testing

Run the automated test suite covering authentication, RBAC boundaries, cryptographic integrity, and audit logging:

```bash
# Run all tests
python backend/manage.py test tests
```

### Security Scenarios Verified
1. **TEST 1**: Register normal employee -> unconditionally assigned `EMPLOYEE` role.
2. **TEST 2**: Attempt client role injection `{"role": "ADMIN"}` -> client-supplied role is ignored; account remains `EMPLOYEE`.
3. **TEST 3**: Employee accesses admin user management API -> blocked with `HTTP 403 Forbidden`.
4. **TEST 4**: Employee downloads another user's unshared file -> blocked with `HTTP 403 Forbidden` **before any decryption happens**; `FILE_ACCESS_DENIED` logged.
5. **TEST 5**: Authorized user downloads file -> authorizes first, decrypts AES-256-GCM, returns exact original file bytes.
6. **TEST 6**: Modify 1 byte of encrypted ciphertext on disk -> AES-GCM authentication tag verification fails, raises `DecryptionAuthError`, halts download.
7. **TEST 7**: Inspect physical file on disk -> confirms persistent file content is binary ciphertext, **never plaintext**.

---

## 11. Production Deployment Preparation

The application is fully prepared for containerized or cloud platform deployment (Render, Railway, AWS ECS, Fly.io):

1. **Environment Variables**: Managed via `.env` / environment variables. No secrets committed to git.
2. **Production Database**: Configured to use PostgreSQL or MySQL via `DATABASE_URL` simply by swapping the database driver without code changes.
3. **Static Assets**: Configured with `STATIC_ROOT` for `python manage.py collectstatic`.
4. **Containerization**: Use Docker Compose to launch both backend and frontend services:
   ```bash
   docker-compose up --build
   ```

---

## 12. Cloud Security Positioning Statement

SecureShare adopts an **Application-Layer Defense-in-Depth Model**:
> Cloud providers (such as AWS, Azure, and GCP) protect the physical datacenter, hypervisors, and network perimeter. 
> **SecureShare operates as an application security layer**, adding organization-specific user authentication, role-based access control, application-level AES-256-GCM envelope encryption, recipient-controlled sharing, and independent forensic auditing directly over sensitive document assets.
