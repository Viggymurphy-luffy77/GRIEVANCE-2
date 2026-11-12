# GrievanceTrack – Smart Complaint Management & Follow-up Reminder System
### Follow-up and Reminder System for Public Grievance Tracking
> *"Build accountability into every follow-up — Ensuring no pending grievance goes unnoticed."*

A fully functional, colorful, interactive web application built strictly using **HTML5, CSS3, and Vanilla JavaScript**. Operates 100% offline with zero dependencies by double-clicking **`index.html`** in any modern web browser.

---

## 🏆 Core Architecture & Key Capabilities

This implementation is specifically engineered with comprehensive grievance tracking and accountability features:

1. **Follow-up & Reminder Engine as Core Focus:** Prioritizes post-submission accountability over mere registration. Every grievance tracks explicit `nextStep` operational milestones, scheduled `followUpDate` targets, reminder acknowledgment status, and unattended case radar.
2. **Police Department as Primary Pilot Use Case (Section 5):** Features dedicated police cells and real-world pilot classifications:
   - *Cybercrime and online fraud* (DEP-CYB: Phishing, UPI fraud, extortion)
   - *Financial fraud* (DEP-ECO: Banking fraud, account liens, cheating)
   - *Lost property* (DEP-LST: CEIR IMEI blocking, missing phones, important documents)
   - *Public safety and traffic-related complaints* (DEP-TRA: Blackspots, road rage, reckless driving)
   - *Complaints involving individuals* (DEP-IND: Civilian disputes, public nuisance, neighborhood disputes)
   Integrated alongside municipal civic utility desks (Water Supply, Drainage, Road Repair, Streetlighting, Sanitation).
3. **Bilingual Kannada & English Support (Sections 3 & 4):**
   - Live Unicode language detector (`Utils.detectLanguage`) distinguishing Kannada (`\u0C80-\u0CFF`) and English in real time.
   - Offline bidirectional contextual translation engine (`Utils.translateText`) for grievances and field updates.
   - 1-click bilingual translation toggle buttons across Citizen Cards, Live Tracking Dossiers, Officer Workspaces, and the Administrator Master Ledger.
4. **Multi-Channel Intake Registration:**
   - *Online Web Portal* (Self-service citizen submission)
   - *Physical Document / Station Written Petition* (with document upload & attachment preview)
   - *Emergency Helpline 112 Desk* (Call center inward)
   - *Email / Written Office Petition*
5. **Accountability & Anti-Delay Enforcement:**
   - Detects unattended complaints with no officer activity for **>48 hours**.
   - Multi-tier automated escalations to District Central Command HQ.
   - Mandatory official reminder acknowledgment by assigned desk officers.

---

## 🚀 Quick Start (Zero Setup Required)

1. **No Node.js, No npm install, No backend server, No database setup required.**
2. Simply double-click **`index.html`** or open with **Google Chrome**, **Microsoft Edge**, or **Mozilla Firefox**.
3. Use the one-click demo role cards on the login screen to sign in instantly!

---

## 🔑 Demo Login Credentials (1-Click Auto-Fill)

| Role | Demo Email | Password | Primary Unit & Scope | Accent Color |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@grievancetrack.demo` | `Citizen@123` | Rahul Sharma (Citizen Portal, tracking, bilingual submit, 5-star rating) | **Cyan & Electric Blue** |
| **Police Officer (Pilot)** | `officer@grievancetrack.demo` | `Officer@123` | SI Suresh Biradar (Station House Officer – Law & Order) | **Royal Purple & Indigo** |
| **Cybercrime Inspector** | `officer.cyber@grievancetrack.demo` | `Officer@123` | Insp. Sneha Patil (Cybercrime & Financial Fraud Cell) | **Royal Purple & Indigo** |
| **Traffic Safety Inspector** | `officer.traffic@grievancetrack.demo` | `Officer@123` | Insp. Mohammed Farhan (Traffic & Road Safety Division) | **Royal Purple & Indigo** |
| **Civic Engineer** | `officer.water@grievancetrack.demo` | `Officer@123` | Anand Kulkarni (Executive Engineer – Water Supply & Drainage) | **Royal Purple & Indigo** |
| **Administrator / Command** | `admin@grievancetrack.demo` | `Admin@123` | Dr. Rajeshwar Patil (Supervisory Authority & Commissioner) | **Cyber Emerald & Pink** |

---

## 🌟 Architecture & Key Modules

```
GrievanceTrack/
│
├── index.html                  # Single-entry web portal & modal dialogs
│
├── css/
│   ├── style.css               # Theme variables, glows, gradients, typography
│   ├── dashboard.css           # App layout, sidebars, KPI cards, timeline stepper
│   ├── components.css          # Badges, modals, toasts, role cards & print media
│   └── responsive.css          # Mobile drawer navigation & responsive breakpoints
│
├── js/
│   ├── storage.js              # GTStorage - LocalStorage persistent database manager
│   ├── data.js                 # Seed data (Police pilot units, civic depts, officers, Kannada complaints)
│   ├── utilities.js            # Bilingual I18N, language detection, audio, SVG icons
│   ├── auth.js                 # Session manager & 1-click role switcher
│   ├── complaints.js           # Grievance workflow engine (intake, follow-up SLA, reopening)
│   ├── assignment.js           # Desk allocation, department routing & officer assignment
│   ├── reminders.js            # Smart follow-up engine, unattended radar & multi-tier escalation
│   ├── notifications.js        # Notification dispatcher with real-time badges
│   ├── analytics.js            # 100% Native HTML5 Canvas charts & Ward heatmap
│   ├── reports.js              # CSV export generators & printable verification slips
│   ├── citizen.js              # Citizen portal, multi-channel submit, tracker, bilingual toggle
│   ├── officer.js              # Officer workspace, schedule follow-up modal, reminder ack
│   ├── admin.js                # Administrator master desk, multi-filters, audit trail logs
│   └── app.js                  # Application orchestrator, router & live clock
```

---

## 🧪 Automated Testing & Verification

The project includes an automated test script (`scratch/test_browser_workflow.js`) executed with Google Chrome and the Chrome DevTools Protocol (CDP) to verify:
- Storage initialization and police pilot unit seeding.
- 1-click demo role switching on the login screen.
- Bilingual Kannada grievance submission via physical document intake channel.
- Automatic Kannada language detection and English lexical translation.
- Admin allocation and department routing to Police Cybercrime desk.
- Officer reminder acknowledgment and follow-up action scheduling modal.
- Status transitions (`Submitted` → `Assigned` → `In Progress` → `Resolved` → `Closed`).
- Citizen post-resolution 5-star feedback and satisfaction rating.
- Reminder engine automated scan, overdue detection, and multi-tier escalation.
- Native HTML5 Canvas charts rendering and CSV report downloads.

---

## 📜 Compliance Note
This project was designed for college demonstration and viva evaluation. All data is saved locally in the browser's `localStorage` and operates completely offline without backend servers, Node.js, or external database infrastructure.
