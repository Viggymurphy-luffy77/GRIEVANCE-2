/**
 * GrievanceTrack - Assignment & Routing Engine
 * Powered by In-Browser Relational SQL Engine (UPDATE complaints, INSERT history, INSERT notifications)
 */

const Assignment = {
  /**
   * Assign or reassign a complaint to department & officer (Admin only) via SQL
   */
  assign(complaintId, departmentId, officerId, customDueDate, remarks, adminUser) {
    if (!adminUser || adminUser.role !== 'admin') {
      Toast.error('Only administrators can assign or route grievances.');
      return false;
    }

    const complaint = Complaints.getById(complaintId);
    if (!complaint) {
      Toast.error('Grievance not found.');
      return false;
    }

    const dept = DB.queryOne("SELECT * FROM departments WHERE dept_id = ?", [departmentId]);
    if (!dept) {
      Toast.error('Please select a valid municipal department.');
      return false;
    }

    const officer = DB.queryOne("SELECT * FROM users WHERE user_id = ? AND role = 'officer'", [officerId]);
    if (!officer) {
      Toast.error('Please select a valid department officer.');
      return false;
    }

    let dueAt = customDueDate;
    if (!dueAt) {
      dueAt = Complaints.calculateDueDate(Math.round(dept.sla_hours / 24) || 2);
    }

    const oldStatus = complaint.status;
    const isReassignment = !!complaint.assignedTo && complaint.assignedTo !== officer.user_id;
    const nowIso = new Date().toISOString();

    // SQL UPDATE complaints table
    DB.execute(`
      UPDATE complaints
      SET dept_id = ?, assigned_officer_id = ?, due_date = ?, status = 'Assigned', updated_at = ?
      WHERE complaint_id = ?
    `, [dept.dept_id, officer.user_id, dueAt, nowIso, complaintId]);

    // SQL INSERT INTO complaint_history
    const actionName = isReassignment ? 'REASSIGNED' : 'ASSIGNED';
    const actionRemarks = remarks || `Assigned to ${dept.dept_name} (${officer.full_name}).`;

    DB.execute(`
      INSERT INTO complaint_history (complaint_id, changed_by, old_status, new_status, remarks, timestamp)
      VALUES (?, ?, ?, 'Assigned', ?, ?)
    `, [complaintId, adminUser.id, oldStatus, actionRemarks, nowIso]);

    // SQL INSERT notification to assigned officer
    DB.execute(`
      INSERT INTO notifications (user_id, complaint_id, type, message, is_read, created_at)
      VALUES (?, ?, 'NEW_ASSIGNMENT', ?, 0, ?)
    `, [officer.user_id, complaintId, `New ${complaint.priority} priority grievance ${complaintId} assigned to your desk. Target SLA: ${dueAt.split('T')[0]}.`, nowIso]);

    // SQL INSERT notification to citizen
    if (complaint.citizenId) {
      DB.execute(`
        INSERT INTO notifications (user_id, complaint_id, type, message, is_read, created_at)
        VALUES (?, ?, 'OFFICER_ASSIGNED', ?, 0, ?)
      `, [complaint.citizenId, complaintId, `Your grievance has been assigned to ${dept.dept_name} (Officer: ${officer.full_name}).`, nowIso]);
    }

    // Audit log
    DB.execute(`
      INSERT INTO audit_logs (user_id, role, action, complaint_id, description, created_at)
      VALUES (?, 'admin', ?, ?, ?, ?)
    `, [adminUser.id, actionName, complaintId, `${adminUser.name} routed ${complaintId} to ${dept.dept_name} (${officer.full_name}). Due: ${dueAt.split('T')[0]}.`, nowIso]);

    Toast.success(`Grievance ${complaintId} successfully assigned to ${officer.full_name}!`);
    Utils.playSound('success');
    return true;
  }
};
