-- ========================================================
-- GrievanceTrack Relational Database Schema (3NF Normalized)
-- Engine: In-Browser SQLite-compatible Relational Engine
-- Persistence: IndexedDB (GrievanceTrackDB)
-- ========================================================

-- 1. Municipal & Police Departments
CREATE TABLE IF NOT EXISTS departments (
    dept_id TEXT PRIMARY KEY,
    dept_name TEXT NOT NULL UNIQUE,
    description TEXT,
    sla_hours INTEGER DEFAULT 48,
    head_officer_name TEXT,
    created_at TEXT NOT NULL
);

-- 2. System Users (Citizens, Officers, Administrators)
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('citizen', 'officer', 'admin')) NOT NULL,
    dept_id TEXT REFERENCES departments(dept_id) ON DELETE SET NULL,
    phone TEXT,
    ward_no TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL
);

-- 3. Public Complaints & Grievance Dossiers
CREATE TABLE IF NOT EXISTS complaints (
    complaint_id TEXT PRIMARY KEY,
    citizen_id TEXT NOT NULL REFERENCES users(user_id),
    dept_id TEXT REFERENCES departments(dept_id),
    assigned_officer_id TEXT REFERENCES users(user_id),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    ward_no TEXT,
    landmark TEXT,
    priority TEXT CHECK(priority IN ('Low', 'Medium', 'High', 'Critical', 'Urgent')) DEFAULT 'Medium',
    status TEXT CHECK(status IN ('Submitted', 'Under Review', 'Assigned', 'In Progress', 'Waiting for Citizen', 'Resolved', 'Closed', 'Reopened')) DEFAULT 'Submitted',
    incident_date TEXT,
    due_date TEXT,
    attachment_data TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 4. Audit Trail & Status Lifecycle History
CREATE TABLE IF NOT EXISTS complaint_history (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id TEXT NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    changed_by TEXT NOT NULL REFERENCES users(user_id),
    old_status TEXT,
    new_status TEXT NOT NULL,
    remarks TEXT,
    timestamp TEXT NOT NULL
);

-- 5. Notifications Dispatch Queue
CREATE TABLE IF NOT EXISTS notifications (
    notif_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    complaint_id TEXT REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
);

-- 6. Citizen Post-Resolution Feedback & Ratings
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id TEXT UNIQUE NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    citizen_id TEXT NOT NULL REFERENCES users(user_id),
    rating INTEGER CHECK(rating BETWEEN 1 AND 5) NOT NULL,
    comments TEXT,
    created_at TEXT NOT NULL
);

-- 7. Accountable Follow-up Reminders & Escalations
CREATE TABLE IF NOT EXISTS reminders (
    reminder_id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id TEXT NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    recipient_id TEXT NOT NULL REFERENCES users(user_id),
    reminder_level INTEGER NOT NULL,
    sent_at TEXT NOT NULL
);

-- 8. Governance & Security Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    role TEXT,
    action TEXT NOT NULL,
    complaint_id TEXT,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL
);
