/**
 * GrievanceTrack - Complaints Workflow Engine
 * Powered by In-Browser Relational SQL Engine (SELECT, INSERT, UPDATE, JOINs)
 */

const Complaints = {
  // Query all complaints with relational JOINs
  getAll() {
    const rows = DB.query(`
      SELECT c.*, d.dept_name, u.full_name AS citizen_name, u.phone AS citizen_phone, o.full_name AS assigned_officer_name
      FROM complaints c
      LEFT JOIN departments d ON c.dept_id = d.dept_id
      LEFT JOIN users u ON c.citizen_id = u.user_id
      LEFT JOIN users o ON c.assigned_officer_id = o.user_id
      ORDER BY c.created_at DESC
    `);
    return rows.map(r => this.enrichComplaint(r));
  },

  getById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    const rows = DB.query(`
      SELECT c.*, d.dept_name, u.full_name AS citizen_name, u.phone AS citizen_phone, o.full_name AS assigned_officer_name
      FROM complaints c
      LEFT JOIN departments d ON c.dept_id = d.dept_id
      LEFT JOIN users u ON c.citizen_id = u.user_id
      LEFT JOIN users o ON c.assigned_officer_id = o.user_id
      WHERE LOWER(c.complaint_id) = LOWER(?)
    `, [cleanId]);
    if (!rows || rows.length === 0) return null;
    return this.enrichComplaint(rows[0]);
  },

  getByCitizen(citizenId) {
    const rows = DB.query(`
      SELECT c.*, d.dept_name, u.full_name AS citizen_name, u.phone AS citizen_phone, o.full_name AS assigned_officer_name
      FROM complaints c
      LEFT JOIN departments d ON c.dept_id = d.dept_id
      LEFT JOIN users u ON c.citizen_id = u.user_id
      LEFT JOIN users o ON c.assigned_officer_id = o.user_id
      WHERE c.citizen_id = ?
      ORDER BY c.created_at DESC
    `, [citizenId]);
    return rows.map(r => this.enrichComplaint(r));
  },

  getByOfficer(officerId) {
    const rows = DB.query(`
      SELECT c.*, d.dept_name, u.full_name AS citizen_name, u.phone AS citizen_phone, o.full_name AS assigned_officer_name
      FROM complaints c
      LEFT JOIN departments d ON c.dept_id = d.dept_id
      LEFT JOIN users u ON c.citizen_id = u.user_id
      LEFT JOIN users o ON c.assigned_officer_id = o.user_id
      WHERE c.assigned_officer_id = ?
      ORDER BY c.created_at DESC
    `, [officerId]);
    return rows.map(r => this.enrichComplaint(r));
  },

  getUnassigned() {
    const rows = DB.query(`
      SELECT c.*, d.dept_name, u.full_name AS citizen_name
      FROM complaints c
      LEFT JOIN departments d ON c.dept_id = d.dept_id
      LEFT JOIN users u ON c.citizen_id = u.user_id
      WHERE (c.assigned_officer_id IS NULL OR c.assigned_officer_id = '')
        AND c.status NOT IN ('Resolved', 'Closed')
      ORDER BY c.created_at DESC
    `);
    return rows.map(r => this.enrichComplaint(r));
  },

  getOverdue() {
    const nowIso = new Date().toISOString();
    const rows = DB.query(`
      SELECT c.*, d.dept_name, o.full_name AS assigned_officer_name
      FROM complaints c
      LEFT JOIN departments d ON c.dept_id = d.dept_id
      LEFT JOIN users o ON c.assigned_officer_id = o.user_id
      WHERE c.status NOT IN ('Resolved', 'Closed') AND c.due_date < ?
      ORDER BY c.due_date ASC
    `, [nowIso]);
    return rows.map(r => this.enrichComplaint(r));
  },

  getHistory(complaintId) {
    const rows = DB.query(`
      SELECT h.*, u.full_name AS actor_name, u.role AS actor_role
      FROM complaint_history h
      LEFT JOIN users u ON h.changed_by = u.user_id
      WHERE h.complaint_id = ?
      ORDER BY h.timestamp ASC
    `, [complaintId]);
    return rows.map(h => ({
      id: h.history_id,
      timestamp: h.timestamp,
      actor: h.actor_name || h.changed_by,
      role: h.actor_role,
      action: h.new_status ? h.new_status.toUpperCase() : 'UPDATE',
      fromStatus: h.old_status,
      toStatus: h.new_status,
      remarks: h.remarks
    }));
  },

  getFeedback(complaintId) {
    const row = DB.queryOne(`SELECT * FROM feedback WHERE complaint_id = ?`, [complaintId]);
    if (!row) return null;
    return {
      rating: row.rating,
      comment: row.comments,
      submittedAt: row.created_at
    };
  },

  enrichComplaint(r) {
    const c = DB.mapComplaint(r);
    c.history = this.getHistory(c.id);
    c.feedback = this.getFeedback(c.id);
    return c;
  },

  generateId() {
    const rows = DB.query("SELECT complaint_id FROM complaints");
    let maxNum = 26000;
    rows.forEach(c => {
      const match = (c.complaint_id || '').match(/GRV-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `GRV-${maxNum + 1}`;
  },

  suggestDepartment(category) {
    const depts = DB.query("SELECT * FROM departments");
    const catLower = (category || '').toLowerCase();
    for (const d of depts) {
      const descLower = (d.description || '').toLowerCase();
      const nameLower = (d.dept_name || '').toLowerCase();
      if (nameLower.includes(catLower) || descLower.includes(catLower)) {
        return { id: d.dept_id, name: d.dept_name, serviceDays: Math.round(d.sla_hours / 24) || 2 };
      }
    }
    const def = depts[0] || { dept_id: 'DEP-IND', dept_name: 'Law & Order', sla_hours: 48 };
    return { id: def.dept_id, name: def.dept_name, serviceDays: Math.round(def.sla_hours / 24) || 2 };
  },

  calculateDueDate(serviceDays = 3) {
    const d = new Date();
    d.setDate(d.getDate() + Number(serviceDays));
    return d.toISOString();
  },

  calculateFollowUpDate(priority = 'Medium') {
    const d = new Date();
    const p = (priority || 'Medium').toLowerCase();
    let hoursToAdd = (p === 'urgent' || p === 'high') ? 24 : 48;
    d.setHours(d.getHours() + hoursToAdd);
    return d.toISOString();
  },

  // Submit alias for create
  submit(data, citizen) {
    return this.create({ ...data, citizen: citizen || data.citizen });
  },

  // Submit new grievance via SQL INSERT
  create({ title, category, description, locality, ward, landmark, priority, incidentDate, attachmentUrl, citizen }) {
    if (!title || title.length < 5) {
      Toast.error('Title must be at least 5 characters long.');
      return false;
    }
    if (!description || description.length < 15) {
      Toast.error('Description must be at least 15 characters long.');
      return false;
    }

    const newId = this.generateId();
    const dept = this.suggestDepartment(category);
    const dueAt = this.calculateDueDate(dept ? dept.serviceDays : 3);
    const nowIso = new Date().toISOString();

    // SQL INSERT INTO complaints
    DB.execute(`
      INSERT INTO complaints (
        complaint_id, citizen_id, dept_id, assigned_officer_id, title, category, description,
        location, ward_no, landmark, priority, status, incident_date, due_date,
        attachment_data, created_at, updated_at
      ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?, ?, ?, ?)
    `, [
      newId, citizen.id, dept ? dept.id : null, title.trim(), category, description.trim(),
      locality.trim(), ward || citizen.ward || 'Ward 01', landmark ? landmark.trim() : '',
      priority || 'Medium', incidentDate || nowIso.split('T')[0], dueAt, attachmentUrl || null,
      nowIso, nowIso
    ]);

    // SQL INSERT INTO complaint_history
    DB.execute(`
      INSERT INTO complaint_history (complaint_id, changed_by, old_status, new_status, remarks, timestamp)
      VALUES (?, ?, NULL, 'Submitted', 'Grievance lodged online with verifiable digital token.', ?)
    `, [newId, citizen.id, nowIso]);

    // SQL INSERT INTO notifications (for citizen & admin)
    DB.execute(`
      INSERT INTO notifications (user_id, complaint_id, type, message, is_read, created_at)
      VALUES (?, ?, 'SUBMISSION', ?, 0, ?)
    `, [citizen.id, newId, `Your complaint ${newId} has been registered. Estimated SLA: ${dueAt.split('T')[0]}.`, nowIso]);

    DB.execute(`
      INSERT INTO notifications (user_id, complaint_id, type, message, is_read, created_at)
      VALUES ('USR-ADM-001', ?, 'NEW_GRIEVANCE', ?, 0, ?)
    `, [newId, `New ${priority} priority complaint ${newId} submitted in ${ward}. Needs triage.`, nowIso]);

    // Audit log
    DB.execute(`
      INSERT INTO audit_logs (user_id, role, action, complaint_id, description, created_at)
      VALUES (?, 'citizen', 'COMPLAINT_SUBMITTED', ?, ?, ?)
    `, [citizen.id, newId, `Citizen ${citizen.name} registered grievance ${newId}: "${title.slice(0, 40)}..."`, nowIso]);

    return { id: newId, title, category, dueAt };
  },

  // Update status via SQL UPDATE
  updateStatus(complaintId, newStatus, remarks, actorUser) {
    actorUser = actorUser || Auth.getCurrentUser() || { id: 'USR-ADM-001', name: 'System Officer', role: 'admin' };
    const complaint = this.getById(complaintId);
    if (!complaint) {
      Toast.error('Complaint not found.');
      return false;
    }

    const oldStatus = complaint.status;
    const nowIso = new Date().toISOString();

    // SQL UPDATE complaints
    DB.execute(`
      UPDATE complaints
      SET status = ?, updated_at = ?
      WHERE complaint_id = ?
    `, [newStatus, nowIso, complaintId]);

    // SQL INSERT INTO complaint_history
    DB.execute(`
      INSERT INTO complaint_history (complaint_id, changed_by, old_status, new_status, remarks, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [complaintId, actorUser.id, oldStatus, newStatus, remarks || `Status changed from ${oldStatus} to ${newStatus}.`, nowIso]);

    // SQL INSERT Notification to citizen
    if (complaint.citizenId) {
      DB.execute(`
        INSERT INTO notifications (user_id, complaint_id, type, message, is_read, created_at)
        VALUES (?, ?, 'STATUS_UPDATE', ?, 0, ?)
      `, [complaint.citizenId, complaintId, `Status of ${complaintId} updated to "${newStatus}": ${remarks || 'Field team dispatched.'}`, nowIso]);
    }

    // Audit Log
    DB.execute(`
      INSERT INTO audit_logs (user_id, role, action, complaint_id, description, created_at)
      VALUES (?, ?, 'STATUS_UPDATE', ?, ?, ?)
    `, [actorUser.id, actorUser.role, complaintId, `Updated ${complaintId} to ${newStatus}. Remarks: ${remarks || 'None'}`, nowIso]);

    Toast.success(`Complaint ${complaintId} status updated to "${newStatus}".`);
    return true;
  },

  // Reopen resolved complaint via SQL UPDATE
  reopen(complaintId, reason, citizenUser) {
    citizenUser = citizenUser || Auth.getCurrentUser();
    const complaint = this.getById(complaintId);
    if (!complaint) return false;

    const nowIso = new Date().toISOString();

    DB.execute(`
      UPDATE complaints
      SET status = 'Reopened', updated_at = ?
      WHERE complaint_id = ?
    `, [nowIso, complaintId]);

    DB.execute(`
      INSERT INTO complaint_history (complaint_id, changed_by, old_status, new_status, remarks, timestamp)
      VALUES (?, ?, 'Resolved', 'Reopened', ?, ?)
    `, [complaintId, citizenUser.id, `REOPENED BY CITIZEN: ${reason}`, nowIso]);

    if (complaint.assignedTo) {
      DB.execute(`
        INSERT INTO notifications (user_id, complaint_id, type, message, is_read, created_at)
        VALUES (?, ?, 'REOPENED', ?, 0, ?)
      `, [complaint.assignedTo, complaintId, `Grievance ${complaintId} was reopened by citizen: "${reason.slice(0, 50)}..."`, nowIso]);
    }

    Toast.warning(`Complaint ${complaintId} has been reopened.`);
    return true;
  },

  // Submit feedback via SQL INSERT & close complaint
  submitFeedback(complaintId, rating, comments, citizenUser) {
    citizenUser = citizenUser || Auth.getCurrentUser();
    const nowIso = new Date().toISOString();

    // SQL INSERT feedback
    DB.execute(`
      INSERT INTO feedback (complaint_id, citizen_id, rating, comments, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [complaintId, citizenUser.id, rating, comments || '', nowIso]);

    // SQL UPDATE status to Closed
    DB.execute(`
      UPDATE complaints
      SET status = 'Closed', updated_at = ?
      WHERE complaint_id = ?
    `, [nowIso, complaintId]);

    DB.execute(`
      INSERT INTO complaint_history (complaint_id, changed_by, old_status, new_status, remarks, timestamp)
      VALUES (?, ?, 'Resolved', 'Closed', ?, ?)
    `, [complaintId, citizenUser.id, `Closed with ${rating}-Star satisfaction rating.`, nowIso]);

    Toast.success('Thank you! Your feedback has been recorded in the database.');
    return true;
  }
};
