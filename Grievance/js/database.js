/**
 * GrievanceTrack - Database & Persistence Layer
 * Integrates SQLEngine with browser IndexedDB for permanent local storage.
 * Ensures 100% offline functionality over file:// protocol with zero setup.
 */

const DB_CONFIG = {
  NAME: 'GrievanceTrackDB',
  VERSION: 1,
  STORE: 'relational_tables'
};

const DB = {
  engine: null,
  isReady: false,
  readyPromise: null,

  init() {
    if (this.readyPromise) return this.readyPromise;

    if (!this.engine) {
      this.engine = new SQLEngine();
      this.seedInitialDatabase();
    }

    this.readyPromise = new Promise(async (resolve) => {
      try {
        await this.loadFromIndexedDB();
        this.isReady = true;
        console.log('GrievanceTrack Relational SQL Engine loaded and ready.');
        resolve(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        this.isReady = true;
        resolve(true);
      }
    });

    return this.readyPromise;
  },

  // Open IndexedDB instance
  openIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not available in this environment. Running in-memory.');
        return resolve(null);
      }
      const req = indexedDB.open(DB_CONFIG.NAME, DB_CONFIG.VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(DB_CONFIG.STORE)) {
          db.createObjectStore(DB_CONFIG.STORE, { keyPath: 'name' });
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  },

  // Load saved tables from IndexedDB or seed if first run
  async loadFromIndexedDB() {
    const idb = await this.openIndexedDB();
    if (!idb) {
      this.seedInitialDatabase();
      return;
    }

    const savedTables = await new Promise((resolve) => {
      const tx = idb.transaction(DB_CONFIG.STORE, 'readonly');
      const store = tx.objectStore(DB_CONFIG.STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    if (savedTables && savedTables.length >= 8) {
      // Reconstruct tables in engine
      savedTables.forEach(t => {
        this.engine.tables[t.name] = {
          name: t.name,
          columns: t.columns,
          primaryKey: t.primaryKey,
          foreignKeys: t.foreignKeys,
          rows: t.rows || []
        };
        // Restore auto-increment counter
        const maxId = t.rows.reduce((max, r) => {
          const pkVal = r[t.primaryKey];
          return typeof pkVal === 'number' && pkVal > max ? pkVal : max;
        }, 0);
        this.engine.tableAutoInc[t.name] = maxId;
      });
      console.log(`Restored ${savedTables.length} relational tables from IndexedDB.`);
    } else {
      console.log('Seeding initial 3NF relational database schema & dataset...');
      this.seedInitialDatabase();
      await this.persistToIndexedDB();
    }
  },

  // Save current engine state to IndexedDB
  async persistToIndexedDB() {
    try {
      const idb = await this.openIndexedDB();
      if (!idb) return;

      const tx = idb.transaction(DB_CONFIG.STORE, 'readwrite');
      const store = tx.objectStore(DB_CONFIG.STORE);

      Object.values(this.engine.tables).forEach(table => {
        store.put({
          name: table.name,
          columns: table.columns,
          primaryKey: table.primaryKey,
          foreignKeys: table.foreignKeys,
          rows: table.rows
        });
      });

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (e) {
      console.warn('Failed to persist to IndexedDB:', e);
    }
  },

  // Seed DDL & DML
  seedInitialDatabase() {
    this.engine = new SQLEngine();
    this.engine.execute(this.SCHEMA_SQL);
    this.engine.execute(this.SEED_SQL);
  },

  // Execute SELECT query
  query(sql, params = []) {
    if (!this.engine) this.engine = new SQLEngine();
    return this.engine.query(sql, params);
  },

  // Execute SELECT returning first matching row
  queryOne(sql, params = []) {
    const rows = this.query(sql, params);
    return rows && rows.length > 0 ? rows[0] : null;
  },

  // Execute DML (INSERT, UPDATE, DELETE, CREATE, DROP) with auto-persistence
  execute(sql, params = []) {
    if (!this.engine) this.engine = new SQLEngine();
    const res = this.engine.execute(sql, params);
    // Debounced or direct persistence
    this.persistToIndexedDB();
    return res;
  },

  // Reset database to initial seed
  async reset() {
    try {
      const idb = await this.openIndexedDB();
      if (idb) {
        const tx = idb.transaction(DB_CONFIG.STORE, 'readwrite');
        tx.objectStore(DB_CONFIG.STORE).clear();
      }
    } catch (e) {}

    this.seedInitialDatabase();
    await this.persistToIndexedDB();
    Toast.success('Relational database successfully reset to clean demonstration state.');
    return true;
  },

  // Metadata inspector for Admin Database Explorer
  getAllTables() {
    return Object.values(this.engine.tables).map(t => ({
      name: t.name,
      rowCount: t.rows.length,
      columns: t.columns.map(c => ({
        name: c.name,
        type: c.type,
        isPk: c.isPk,
        notNull: c.notNull,
        unique: c.unique
      })),
      foreignKeys: t.foreignKeys
    }));
  },

  getTableRows(tableName, limit = 50) {
    tableName = tableName.toLowerCase();
    if (!this.engine.tables[tableName]) return [];
    return this.engine.tables[tableName].rows.slice(0, limit);
  },

  // Generate downloadable .sql dump
  exportSqlDump() {
    return this.engine.exportDump();
  },

  downloadDumpFile() {
    const sql = this.exportSqlDump();
    const blob = new Blob([sql], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grievancetrack_database_${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Toast.success('Downloaded complete .SQL relational database dump.');
  },

  // Helper mapper to keep UI templates 100% compatible
  mapComplaint(r) {
    if (!r) return null;
    return {
      ...r,
      id: r.complaint_id || r.id,
      complaint_id: r.complaint_id || r.id,
      citizenId: r.citizen_id || r.citizenId,
      citizen_id: r.citizen_id || r.citizenId,
      citizenName: r.citizen_name || r.citizenName || r.full_name,
      citizenPhone: r.citizen_phone || r.citizenPhone || r.phone,
      departmentId: r.dept_id || r.departmentId,
      dept_id: r.dept_id || r.departmentId,
      assignedTo: r.assigned_officer_id || r.assignedTo,
      assigned_officer_id: r.assigned_officer_id || r.assignedTo,
      assignedOfficerName: r.assigned_officer_name || r.assignedOfficerName || r.officer_name,
      locality: r.location || r.locality,
      location: r.location || r.locality,
      ward: r.ward_no || r.ward,
      ward_no: r.ward_no || r.ward,
      dueAt: r.due_date || r.dueAt,
      due_date: r.due_date || r.dueAt,
      submittedAt: r.created_at || r.submittedAt,
      created_at: r.created_at || r.submittedAt,
      updatedAt: r.updated_at || r.updatedAt,
      updated_at: r.updated_at || r.updatedAt,
      attachmentUrl: r.attachment_data || r.attachmentUrl,
      attachment_data: r.attachment_data || r.attachmentUrl,
      nextStep: r.next_step || r.nextStep,
      followUpDate: r.follow_up_date || r.followUpDate,
      translatedTitle: r.translated_title || r.translatedTitle,
      translatedDescription: r.translated_description || r.translatedDescription,
      isOverdue: !!(r.is_overdue || r.isOverdue),
      remindersCount: r.reminders_count || r.remindersCount || 0,
      reminderAcknowledged: !!(r.reminder_acknowledged || r.reminderAcknowledged),
      history: r.history || []
    };
  },

  mapUser(u) {
    if (!u) return null;
    return {
      ...u,
      id: u.user_id || u.id,
      user_id: u.user_id || u.id,
      name: u.full_name || u.name,
      full_name: u.full_name || u.name,
      departmentId: u.dept_id || u.departmentId,
      dept_id: u.dept_id || u.departmentId,
      ward: u.ward_no || u.ward,
      ward_no: u.ward_no || u.ward,
      phone: u.phone || '',
      email: u.email || '',
      role: u.role || 'citizen',
      active: u.status ? u.status === 'active' : (u.active !== false),
      status: u.status || (u.active !== false ? 'active' : 'inactive'),
      avatar: u.avatar || (u.role === 'admin' ? '🛡️' : (u.role === 'officer' ? '👷' : '👤')),
      title: u.title || (u.role === 'officer' ? 'Department Inspector' : (u.role === 'admin' ? 'System Administrator' : 'Citizen')),
      createdAt: u.created_at || u.createdAt
    };
  },

  mapDepartment(d) {
    if (!d) return null;
    const slaHours = d.sla_hours || (d.serviceDays ? d.serviceDays * 24 : 48);
    return {
      ...d,
      id: d.dept_id || d.id,
      dept_id: d.dept_id || d.id,
      name: d.dept_name || d.name,
      dept_name: d.dept_name || d.name,
      sla_hours: slaHours,
      serviceDays: Math.max(1, Math.round(slaHours / 24)),
      head: d.head_officer_name || d.head || 'Officer in-charge',
      head_officer_name: d.head_officer_name || d.head || 'Officer in-charge',
      categories: d.categories || [d.dept_name || d.name],
      description: d.description || ''
    };
  },

  getUsers() {
    if (!this.engine) this.engine = new SQLEngine();
    const rows = this.query("SELECT * FROM users");
    return rows.map(r => this.mapUser(r));
  },

  getDepartments() {
    if (!this.engine) this.engine = new SQLEngine();
    const rows = this.query("SELECT * FROM departments");
    return rows.map(r => this.mapDepartment(r));
  },

  // Embedded SQL DDL & DML for offline file:// execution
  SCHEMA_SQL: `
    CREATE TABLE IF NOT EXISTS departments (
      dept_id TEXT PRIMARY KEY,
      dept_name TEXT NOT NULL UNIQUE,
      description TEXT,
      sla_hours INTEGER DEFAULT 48,
      head_officer_name TEXT,
      created_at TEXT NOT NULL
    );

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
      next_step TEXT,
      follow_up_date TEXT,
      reminder_acknowledged INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS complaint_history (
      history_id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id TEXT NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
      changed_by TEXT NOT NULL REFERENCES users(user_id),
      old_status TEXT,
      new_status TEXT NOT NULL,
      remarks TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      notif_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      complaint_id TEXT REFERENCES complaints(complaint_id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feedback (
      feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id TEXT UNIQUE NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
      citizen_id TEXT NOT NULL REFERENCES users(user_id),
      rating INTEGER CHECK(rating BETWEEN 1 AND 5) NOT NULL,
      comments TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminders (
      reminder_id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id TEXT NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
      recipient_id TEXT NOT NULL REFERENCES users(user_id),
      reminder_level INTEGER NOT NULL,
      sent_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      role TEXT,
      action TEXT NOT NULL,
      complaint_id TEXT,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `,

  SEED_SQL: `
    INSERT INTO departments (dept_id, dept_name, description, sla_hours, head_officer_name, created_at) VALUES
    ('DEP-CYB', 'Cybercrime & Online Fraud Cell', 'Investigation of online scams, UPI fraud, phishing APKs, and digital cyber extortion.', 48, 'Insp. Sneha Patil', '2026-01-10 09:00:00'),
    ('DEP-ECO', 'Economic Offences & Financial Fraud', 'Banking fraud, forged checks, unauthorized debits, and non-cyber economic cheating.', 72, 'DSP Ramesh Hegde', '2026-01-10 09:00:00'),
    ('DEP-LST', 'Lost Property & Missing Article Bureau', 'Digital e-lost reports, missing mobiles (CEIR tracking), and lost official identity documents.', 24, 'SI Mahesh K.', '2026-01-10 09:00:00'),
    ('DEP-TRA', 'Public Safety & Traffic Division', 'Traffic signal blackspots, dangerous driving, and pedestrian safety installations.', 48, 'Insp. Mohammed Farhan', '2026-01-10 09:00:00'),
    ('DEP-IND', 'Law & Order / Individual Disputes', 'Civilian dispute mediation, non-cognizable reports, public nuisance, and peace-keeping.', 72, 'SI Suresh Biradar', '2026-01-10 09:00:00'),
    ('DEP-ELE', 'Electrical & Streetlighting', 'Streetlight maintenance, faulty poles, cable faults, low voltage transformers.', 48, 'Eng. Suresh Biradar', '2026-01-10 09:00:00'),
    ('DEP-WAT', 'Water Supply & Drainage', 'Potable drinking water irregularities, pipeline bursts, and sewage clogging.', 72, 'Anand Kulkarni', '2026-01-10 09:00:00'),
    ('DEP-ROA', 'Roads & Infrastructure', 'Pothole repairs, asphalt resurfacing, and pedestrian footpath maintenance.', 96, 'Vikram Patil', '2026-01-10 09:00:00'),
    ('DEP-SAN', 'Solid Waste & Sanitation', 'Garbage collection, open dumping clearance, and vector-borne hygiene spraying.', 24, 'Kavita Deshmukh', '2026-01-10 09:00:00');

    INSERT INTO users (user_id, full_name, email, password_hash, role, dept_id, phone, ward_no, status, created_at) VALUES
    ('USR-ADM-001', 'Dr. Rajeshwar Patil', 'admin@grievancetrack.demo', 'Admin@123', 'admin', NULL, '+91 94480 99887', 'Headquarters (Control Desk)', 'active', '2026-01-01 08:00:00'),
    ('USR-OFF-001', 'SI Suresh Biradar', 'officer@grievancetrack.demo', 'Officer@123', 'officer', 'DEP-IND', '+91 94481 23456', 'Division 1 (North Police Station)', 'active', '2026-01-12 10:30:00'),
    ('USR-OFF-002', 'Insp. Sneha Patil', 'officer.cyber@grievancetrack.demo', 'Officer@123', 'officer', 'DEP-CYB', '+91 98860 12345', 'Bidar Cyber Cell HQ', 'active', '2026-01-14 11:00:00'),
    ('USR-OFF-003', 'Insp. Mohammed Farhan', 'officer.traffic@grievancetrack.demo', 'Officer@123', 'officer', 'DEP-TRA', '+91 94483 45678', 'Central Traffic Police Station', 'active', '2026-01-15 09:30:00'),
    ('USR-OFF-004', 'Anand Kulkarni', 'officer.water@grievancetrack.demo', 'Officer@123', 'officer', 'DEP-WAT', '+91 98450 78901', 'CMC Water Works Division', 'active', '2026-01-18 14:00:00'),
    ('USR-CIT-001', 'Rahul Sharma', 'citizen@grievancetrack.demo', 'Citizen@123', 'citizen', NULL, '+91 91234 56789', 'Ward 04', 'active', '2026-02-01 10:00:00'),
    ('USR-CIT-002', 'Priya Kamble', 'priya.kamble@citizen.demo', 'Citizen@123', 'citizen', NULL, '+91 98450 11223', 'Ward 08', 'active', '2026-02-03 11:20:00'),
    ('USR-CIT-003', 'Basavaraj Patil', 'basavaraj.patil@citizen.demo', 'Citizen@123', 'citizen', NULL, '+91 94480 33445', 'Ward 03', 'active', '2026-02-05 14:15:00'),
    ('USR-CIT-004', 'Fatima Zahra', 'fatima.zahra@citizen.demo', 'Citizen@123', 'citizen', NULL, '+91 97410 55667', 'Ward 07', 'active', '2026-02-10 16:40:00');

    INSERT INTO complaints (complaint_id, citizen_id, dept_id, assigned_officer_id, title, category, description, location, ward_no, landmark, priority, status, incident_date, due_date, attachment_data, created_at, updated_at) VALUES
    ('GRV-26001', 'USR-CIT-001', 'DEP-CYB', 'USR-OFF-002', 'Fake Electricity Bill Payment Link - ₹18,500 Phishing Fraud', 'Cybercrime and online fraud', 'Received SMS claiming electricity will be disconnected tonight. Clicked APK link and ₹18,500 was debited.', 'Gandhi Gunj Main Road', 'Ward 04', 'Near Syndicate Bank Branch', 'Urgent', 'In Progress', '2026-11-08', '2026-11-12 18:00:00', NULL, '2026-11-08 14:00:00', '2026-11-09 11:00:00'),
    ('GRV-26002', 'USR-CIT-001', 'DEP-LST', 'USR-OFF-001', 'Lost Samsung S23 Mobile and National ID Wallet', 'Lost property', 'Lost smartphone and driver license pouch near vegetable mandi. CEIR IMEI blocking assistance needed.', 'Daily Vegetable Market', 'Ward 04', 'Vegetable Mandi Gate 2', 'Medium', 'Resolved', '2026-11-06', '2026-11-07 18:00:00', NULL, '2026-11-06 09:30:00', '2026-11-07 16:30:00'),
    ('GRV-26003', 'USR-CIT-003', 'DEP-ECO', 'USR-OFF-002', 'Unauthorized Bank Transfer of ₹45,000 via KYC Deception', 'Financial fraud', 'Fraudulent caller posed as bank executive asking for Aadhaar verification. Account emptied in 3 transactions.', 'Bank Colony Ring Road', 'Ward 03', 'Near SBI ATM Kiosk', 'Urgent', 'Assigned', '2026-11-03', '2026-11-05 18:00:00', NULL, '2026-11-03 10:15:00', '2026-11-04 12:00:00'),
    ('GRV-26004', 'USR-CIT-002', 'DEP-TRA', 'USR-OFF-003', 'Dangerous Rash Driving & Lack of Zebra Crossings near School Gate', 'Public safety and traffic-related complaints', 'Heavy trucks and rash two-wheelers exceeding 60 km/h in school zone without speed humps.', 'Mohan Market Complex', 'Ward 08', 'Opposite Govt Boys High School', 'High', 'In Progress', '2026-11-07', '2026-11-11 18:00:00', NULL, '2026-11-07 15:00:00', '2026-11-08 16:00:00'),
    ('GRV-26005', 'USR-CIT-004', 'DEP-IND', 'USR-OFF-001', 'Repeated Midnight Loudspeaker & Public Nuisance in Residential Alley', 'Complaints involving individuals', 'Commercial sound boxes operated until 2:00 AM every night despite polite neighborhood requests.', 'Naubad Industrial Area Ring Road', 'Ward 11', 'Behind Plot #14 Godown', 'Medium', 'Resolved', '2026-11-06', '2026-11-09 18:00:00', NULL, '2026-11-06 14:00:00', '2026-11-09 17:00:00'),
    ('GRV-26006', 'USR-CIT-001', 'DEP-LST', NULL, 'Lost Laptop Backpack Containing Educational Degree Certificates', 'Lost property', 'Left black HP laptop bag on city bus #12 while commuting from central stand. Original degree certificates inside.', 'Central Bus Stand Circle', 'Ward 02', 'Platform 4 City Bus Bay', 'Medium', 'Submitted', '2026-11-10', '2026-11-11 18:00:00', NULL, '2026-11-10 09:00:00', '2026-11-10 09:00:00'),
    ('GRV-26007', 'USR-CIT-003', 'DEP-WAT', 'USR-OFF-004', 'Underground Drinking Water Feeder Pipe Leakage', 'Water Supply', 'Pressurized drinking water pipeline burst creating large puddle and flooding adjacent houses.', 'Pragathi Colony Extn', 'Ward 06', 'Opposite Community Hall', 'High', 'In Progress', '2026-11-07', '2026-11-10 18:00:00', NULL, '2026-11-07 08:30:00', '2026-11-08 11:00:00'),
    ('GRV-26008', 'USR-CIT-004', 'DEP-ELE', 'USR-OFF-001', 'Four Non-Functional Streetlights in Shiva Nagar Colony', 'Streetlights', 'Complete dark stretch for 300 meters due to burned ballast fixtures. Severe safety issue for evening pedestrians.', 'Shiva Nagar Colony', 'Ward 07', 'Alleyway Behind Temple', 'Medium', 'Resolved', '2026-11-04', '2026-11-06 18:00:00', NULL, '2026-11-04 16:00:00', '2026-11-06 18:00:00'),
    ('GRV-26009', 'USR-CIT-002', 'DEP-SAN', 'USR-OFF-001', 'Garbage Dump Overflow and Stray Animal Health Hazard', 'Garbage Collection', 'Secondary waste container has not been cleared for 5 days. Severe stench and public health risk.', 'Old City Fort Road', 'Ward 12', 'Near Gole Khana Gate', 'High', 'Resolved', '2026-11-04', '2026-11-05 18:00:00', NULL, '2026-11-04 11:00:00', '2026-11-05 17:00:00'),
    ('GRV-26010', 'USR-CIT-001', 'DEP-WAT', 'USR-OFF-004', 'Recurring Sewage Backflow in Residential Courtyard', 'Drainage', 'Underground drainage clogged again after temporary rod clearing. Sewage entering houses.', 'Gandhi Gunj Main Market', 'Ward 04', 'Behind Bank of Baroda ATM', 'High', 'Reopened', '2026-11-06', '2026-11-12 18:00:00', NULL, '2026-11-06 13:00:00', '2026-11-10 10:00:00'),
    ('GRV-26011', 'USR-CIT-001', 'DEP-IND', 'USR-OFF-001', 'Armed Brawl Threat & Public Intimidation at Gunj Market Yard', 'Complaints involving individuals', 'Two transport factions involved in heated altercation with weapons threat at loading dock.', 'Gandhi Gunj Wholesale Yard', 'Ward 04', 'Near Wholesale Grain Shed #2', 'Urgent', 'Assigned', '2026-11-10', '2026-11-12 18:00:00', NULL, '2026-11-10 13:00:00', '2026-11-10 15:00:00'),
    ('GRV-26012', 'USR-CIT-002', 'DEP-TRA', 'USR-OFF-001', 'Unauthorized Road Encroachment & Night Truck Parking Obstructing Ambulances', 'Public safety and traffic-related complaints', 'Multi-axle container trucks parked across ring road blocking entry to District Hospital trauma center.', 'Naubad Industrial Area Ring Road', 'Ward 11', 'Opposite District Hospital South Gate', 'High', 'Assigned', '2026-11-09', '2026-11-12 18:00:00', NULL, '2026-11-09 18:00:00', '2026-11-10 10:00:00'),
    ('GRV-26013', 'USR-CIT-004', 'DEP-IND', 'USR-OFF-001', 'Illegal Night Gambling & Loudspeaker Clashes in Residential Alleyway', 'Complaints involving individuals', 'Unlicensed gambling racket operating behind vacant mill with loud clashes disturbing families.', 'Shiva Nagar Colony', 'Ward 07', 'Near Old Cotton Mill Compound', 'High', 'In Progress', '2026-11-07', '2026-11-11 18:00:00', NULL, '2026-11-07 12:00:00', '2026-11-08 14:00:00'),
    ('GRV-26014', 'USR-CIT-001', 'DEP-ROA', 'USR-OFF-001', 'Dangerous Dilapidated Commercial Wall Leaning over Pedestrian Walkway', 'Public safety and traffic-related complaints', 'Brick wall of abandoned godown developed 4-inch vertical cracks and is bulging directly over pavement.', 'Mohan Market Complex', 'Ward 08', 'Adjacent to Janata Supermarket', 'Medium', 'In Progress', '2026-11-06', '2026-11-13 18:00:00', NULL, '2026-11-06 15:00:00', '2026-11-07 11:00:00'),
    ('GRV-26015', 'USR-CIT-002', 'DEP-IND', 'USR-OFF-001', 'Repeated Eve-Teasing and Intimidation of Female Students at Main Bus Stand', 'Complaints involving individuals', 'Habitual miscreants gathering at city bus shelter harassing students. Previous petition unaddressed.', 'Central Bus Stand Circle', 'Ward 02', 'Platform 3 City Bus Shelter', 'Urgent', 'Assigned', '2026-11-05', '2026-11-07 18:00:00', NULL, '2026-11-05 10:00:00', '2026-11-06 12:00:00'),
    ('GRV-26016', 'USR-CIT-004', 'DEP-IND', 'USR-OFF-001', 'Severe Boundary Dispute & Threat of Physical Violence between Adjacent Landholders', 'Complaints involving individuals', 'Violent dispute over common drainage boundary. Threat of grievous hurt if municipal work proceeds.', 'Pragathi Colony Extn', 'Ward 06', 'Near Water Overhead Tank #3', 'High', 'In Progress', '2026-11-04', '2026-11-08 18:00:00', NULL, '2026-11-04 11:00:00', '2026-11-05 14:00:00');

    INSERT INTO complaint_history (complaint_id, changed_by, old_status, new_status, remarks, timestamp) VALUES
    ('GRV-26001', 'USR-CIT-001', NULL, 'Submitted', 'Grievance lodged online with transaction screenshot attachment.', '2026-11-08 14:00:00'),
    ('GRV-26001', 'USR-ADM-001', 'Submitted', 'Assigned', 'Assigned to Cybercrime Inspector Sneha Patil. Priority Urgent.', '2026-11-08 16:00:00'),
    ('GRV-26001', 'USR-OFF-002', 'Assigned', 'In Progress', 'Formal requisition sent to Payment Gateway nodal officer for transaction trace.', '2026-11-09 11:00:00'),
    ('GRV-26002', 'USR-CIT-001', NULL, 'Submitted', 'Lost phone petition submitted.', '2026-11-06 09:30:00'),
    ('GRV-26002', 'USR-OFF-001', 'Assigned', 'Resolved', 'CEIR request submitted; device blocked on all telecom operators.', '2026-11-07 16:30:00'),
    ('GRV-26005', 'USR-CIT-004', NULL, 'Submitted', 'Public nuisance complaint lodged.', '2026-11-06 14:00:00'),
    ('GRV-26005', 'USR-OFF-001', 'In Progress', 'Resolved', 'Station visit conducted. Sound equipment operators signed bond.', '2026-11-09 17:00:00'),
    ('GRV-26010', 'USR-CIT-001', 'Resolved', 'Reopened', 'REOPENED BY CITIZEN: Water started leaking back again today.', '2026-11-10 10:00:00'),
    ('GRV-26011', 'USR-CIT-001', NULL, 'Submitted', 'Urgent grievance submitted by Traders Welfare Committee.', '2026-11-10 13:00:00'),
    ('GRV-26011', 'USR-ADM-001', 'Submitted', 'Assigned', 'Assigned to SI Suresh Biradar for peace-keeping.', '2026-11-10 15:00:00'),
    ('GRV-26015', 'USR-CIT-002', NULL, 'Submitted', 'Urgent petition submitted regarding evening bus shelter safety.', '2026-11-05 10:00:00'),
    ('GRV-26015', 'USR-ADM-001', 'Submitted', 'Assigned', 'Assigned to SI Suresh Biradar. SLA Alert.', '2026-11-05 12:00:00');

    INSERT INTO notifications (user_id, complaint_id, type, message, is_read, created_at) VALUES
    ('USR-CIT-001', 'GRV-26001', 'STATUS_UPDATE', 'Your cybercrime grievance GRV-26001 is under investigation by Insp. Sneha Patil.', 0, '2026-11-09 11:00:00'),
    ('USR-CIT-001', 'GRV-26010', 'REOPENED', 'Your grievance GRV-26010 has been successfully reopened. Next step: Super-sucker jetting.', 0, '2026-11-10 10:00:00'),
    ('USR-OFF-001', 'GRV-26011', 'NEW_ASSIGNMENT', 'Armed Brawl Threat case GRV-26011 at Gandhi Gunj assigned to your desk.', 0, '2026-11-10 15:00:00'),
    ('USR-OFF-001', 'GRV-26015', 'OVERDUE_ALERT', '⚠️ Case GRV-26015 at Bus Stand Circle is 48 hours past deadline. Action mandatory.', 0, '2026-11-08 09:00:00'),
    ('USR-ADM-001', 'GRV-26003', 'ESCALATION', '🚨 Case GRV-26003 has exceeded resolution timeline by >48h. Officer: Insp. Sneha Patil.', 0, '2026-11-06 09:00:00');

    INSERT INTO feedback (complaint_id, citizen_id, rating, comments, created_at) VALUES
    ('GRV-26002', 'USR-CIT-001', 5, 'Quick response from Police Lost & Found cell. IMEI blocking done within 2 hours.', '2026-11-07 18:00:00'),
    ('GRV-26005', 'USR-CIT-004', 4, 'Peace restored in the alley. Very thankful for police intervention.', '2026-11-09 19:30:00');

    INSERT INTO reminders (complaint_id, recipient_id, reminder_level, sent_at) VALUES
    ('GRV-26003', 'USR-OFF-002', 1, '2026-11-06 09:00:00'),
    ('GRV-26015', 'USR-OFF-001', 1, '2026-11-08 09:00:00'),
    ('GRV-26015', 'USR-OFF-001', 2, '2026-11-09 09:00:00');

    INSERT INTO audit_logs (user_id, role, action, complaint_id, description, created_at) VALUES
    ('USR-ADM-001', 'admin', 'SYSTEM_BOOT', NULL, 'GrievanceTrack In-Browser Relational SQL Engine initialized with 3NF Schema.', '2026-11-10 08:00:00'),
    ('USR-CIT-001', 'citizen', 'SUBMIT_COMPLAINT', 'GRV-26001', 'Submitted cybercrime grievance regarding phishing fraud.', '2026-11-08 14:00:00'),
    ('USR-ADM-001', 'admin', 'ASSIGN_COMPLAINT', 'GRV-26001', 'Assigned complaint GRV-26001 to Insp. Sneha Patil (DEP-CYB).', '2026-11-08 16:00:00'),
    ('USR-OFF-002', 'officer', 'UPDATE_STATUS', 'GRV-26001', 'Updated status to In Progress. Formal requisition sent.', '2026-11-09 11:00:00'),
    ('USR-CIT-001', 'citizen', 'REOPEN_COMPLAINT', 'GRV-26010', 'Reopened grievance GRV-26010 due to recurring sewage backflow.', '2026-11-10 10:00:00');
  `
};

if (typeof window !== 'undefined') {
  window.DB = DB;
  DB.init();
}
