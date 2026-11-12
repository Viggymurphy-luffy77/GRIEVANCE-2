/**
 * GrievanceTrack - Smart Reminder & Escalation Engine
 * Powered by In-Browser Relational SQL Engine (SELECT, INSERT, UPDATE)
 */

const Reminders = {
  runCheck(isManual = false) {
    const nowIso = new Date().toISOString();
    // Query active non-closed complaints
    const complaints = DB.query(`
      SELECT c.*, o.user_id AS officer_id, o.full_name AS officer_name
      FROM complaints c
      LEFT JOIN users o ON c.assigned_officer_id = o.user_id
      WHERE c.status NOT IN ('Resolved', 'Closed')
    `);

    let checkedCount = 0;
    let overdueFound = 0;
    let remindersSent = 0;
    let escalationsTriggered = 0;

    complaints.forEach(c => {
      checkedCount++;
      const isPastDue = c.due_date && c.due_date < nowIso;

      if (isPastDue) {
        overdueFound++;

        // Check if reminder was already sent recently
        const recentRem = DB.queryOne(
          "SELECT * FROM reminders WHERE complaint_id = ? ORDER BY sent_at DESC LIMIT 1",
          [c.complaint_id]
        );

        if (!recentRem || isManual) {
          const nextLevel = recentRem ? (recentRem.reminder_level + 1) : 1;

          if (c.officer_id) {
            // SQL INSERT into reminders table
            DB.execute(`
              INSERT INTO reminders (complaint_id, recipient_id, reminder_level, sent_at)
              VALUES (?, ?, ?, ?)
            `, [c.complaint_id, c.officer_id, nextLevel, nowIso]);

            // SQL INSERT notification to officer
            DB.execute(`
              INSERT INTO notifications (user_id, complaint_id, type, message, is_read, created_at)
              VALUES (?, ?, 'OVERDUE_ALERT', ?, 0, ?)
            `, [c.officer_id, c.complaint_id, `⚠️ Follow-up Alert (Level ${nextLevel}): Grievance ${c.complaint_id} is overdue. Action required.`, nowIso]);

            remindersSent++;
          }

          // If Level 2+, escalate to Administrator
          if (nextLevel >= 2) {
            escalationsTriggered++;
            DB.execute(`
              INSERT INTO notifications (user_id, complaint_id, type, message, is_read, created_at)
              VALUES ('USR-ADM-001', ?, 'ESCALATION', ?, 0, ?)
            `, [c.complaint_id, `🚨 Escalation Level ${nextLevel}: Case ${c.complaint_id} breached SLA. Assigned Officer: ${c.officer_name || 'Unassigned'}.`, nowIso]);
          }
        }
      }
    });

    const msg = `Checked ${checkedCount} active grievances: ${overdueFound} overdue, ${remindersSent} reminders dispatched, ${escalationsTriggered} supervisor escalations logged.`;
    if (isManual) Toast.info(msg, 'Reminder Radar Run');
    return { checkedCount, overdueFound, remindersSent, escalationsTriggered };
  },

  getAll() {
    return DB.query(`
      SELECT r.*, c.title AS complaint_title, c.priority, u.full_name AS officer_name
      FROM reminders r
      LEFT JOIN complaints c ON r.complaint_id = c.complaint_id
      LEFT JOIN users u ON r.recipient_id = u.user_id
      ORDER BY r.sent_at DESC
    `);
  },

  getStats() {
    const total = DB.queryOne("SELECT COUNT(*) AS total FROM reminders");
    const level1 = DB.queryOne("SELECT COUNT(*) AS l1 FROM reminders WHERE reminder_level = 1");
    const escalated = DB.queryOne("SELECT COUNT(*) AS esc FROM reminders WHERE reminder_level >= 2");

    return {
      total: total ? Number(total.total) : 0,
      level1: level1 ? Number(level1.l1) : 0,
      escalated: escalated ? Number(escalated.esc) : 0
    };
  },

  acknowledge(complaintId, user, remarks) {
    user = user || (typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null) || { id: 'USR-OFF-001', name: 'Officer', role: 'officer' };
    const nowIso = new Date().toISOString();
    const c = Complaints.getById(complaintId);
    if (!c) return false;

    // Update complaints table reminder_acknowledged flag
    DB.execute(`
      UPDATE complaints 
      SET reminder_acknowledged = 1, updated_at = ?
      WHERE complaint_id = ?
    `, [nowIso, complaintId]);

    // Insert history
    DB.execute(`
      INSERT INTO complaint_history (complaint_id, changed_by, old_status, new_status, remarks, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [complaintId, user.id, c.status, c.status, remarks || 'Officer acknowledged follow-up reminder and confirmed case triage is underway.', nowIso]);

    // Insert notification to Admin
    DB.execute(`
      INSERT INTO notifications (user_id, complaint_id, type, message, is_read, created_at)
      VALUES ('USR-ADM-001', ?, 'REMINDER_ACK', ?, 0, ?)
    `, [complaintId, `Desk Officer ${user.name || user.id} acknowledged reminder for complaint ${complaintId}.`, nowIso]);

    if (typeof Toast !== 'undefined') Toast.success(`Reminder acknowledged for case ${complaintId}.`);
    return true;
  },

  recordFollowUpAction(complaintId, actionType, notes, targetDate, milestone, user) {
    user = user || (typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null) || { id: 'USR-OFF-001', name: 'Officer', role: 'officer' };
    const nowIso = new Date().toISOString();
    const c = Complaints.getById(complaintId);
    if (!c) return false;

    const nextStep = milestone || notes || actionType || 'Investigate and follow up';
    const followUpDate = targetDate || new Date(Date.now() + 48 * 3600000).toISOString();

    // Update complaints table
    DB.execute(`
      UPDATE complaints 
      SET next_step = ?, follow_up_date = ?, updated_at = ?
      WHERE complaint_id = ?
    `, [nextStep, followUpDate, nowIso, complaintId]);

    // Insert history
    DB.execute(`
      INSERT INTO complaint_history (complaint_id, changed_by, old_status, new_status, remarks, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [complaintId, user.id, c.status, c.status, `Action [${actionType || 'Follow-up'}]: ${notes || nextStep}`, nowIso]);

    // Insert notification
    DB.execute(`
      INSERT INTO notifications (user_id, complaint_id, type, message, is_read, created_at)
      VALUES ('USR-ADM-001', ?, 'FOLLOWUP_SCHEDULED', ?, 0, ?)
    `, [complaintId, `Officer ${user.name || user.id} scheduled action for ${complaintId}: "${nextStep}" target: ${followUpDate.split('T')[0]}.`, nowIso]);

    if (typeof Toast !== 'undefined') Toast.success(`Next follow-up action scheduled for ${complaintId}.`);
    return true;
  },

  getFollowUpRadarData() {
    const activeComplaints = DB.query(`
      SELECT c.*, d.dept_name, u.full_name AS citizen_name, o.full_name AS assigned_officer_name
      FROM complaints c
      LEFT JOIN departments d ON c.dept_id = d.dept_id
      LEFT JOIN users u ON c.citizen_id = u.user_id
      LEFT JOIN users o ON c.assigned_officer_id = o.user_id
      WHERE c.status NOT IN ('Resolved', 'Closed')
    `);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let totalActive = activeComplaints.length;
    let dueToday = 0;
    let overdueFollowUps = 0;
    let unattended = 0;
    const byCategory = {};

    activeComplaints.forEach(r => {
      const c = DB.mapComplaint(r);
      const cat = c.category || 'General';
      byCategory[cat] = (byCategory[cat] || 0) + 1;

      // Check due today
      if (c.dueAt && c.dueAt.startsWith(todayStr)) {
        dueToday++;
      }
      // Check overdue
      if (c.dueAt && new Date(c.dueAt) < now) {
        overdueFollowUps++;
      }
      // Check unattended (> 48h since creation without assigned officer or with unassigned status)
      const hoursSinceCreated = (now - new Date(c.submittedAt || c.created_at)) / (1000 * 3600);
      if (!c.assignedTo || hoursSinceCreated > 48) {
        unattended++;
      }
    });

    return {
      totalActive,
      dueToday,
      overdueFollowUps,
      unattended,
      byCategory,
      unattendedCount: unattended,
      activeComplaints
    };
  }
};
