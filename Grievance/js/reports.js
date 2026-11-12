/**
 * GrievanceTrack - Reports & Data Export Engine
 * Generates CSV spreadsheets and formal printable PDF slips.
 */

const Reports = {
  /**
   * Helper to trigger a browser file download
   */
  downloadFile(filename, content, mimeType = 'text/csv;charset=utf-8;') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    Toast.success(`Downloaded: ${filename}`, 'Report Exported');
  },

  /**
   * Helper to sanitize CSV field values
   */
  escapeCsv(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  },

  /**
   * 1. Export All Complaints to CSV
   */
  exportComplaintsCsv() {
    const complaints = Complaints.getAll();
    const headers = [
      'Complaint ID', 'Title', 'Category', 'Priority', 'Status',
      'Citizen Name', 'Citizen Phone', 'Ward', 'Locality', 'Landmark',
      'Department', 'Assigned Officer', 'Submitted Date', 'Due Date', 'Resolved Date',
      'Is Overdue', 'Reminders Sent', 'Citizen Rating'
    ];

    const rows = complaints.map(c => [
      c.id,
      c.title,
      c.category,
      c.priority,
      c.status,
      c.citizenName,
      c.citizenPhone,
      c.ward,
      c.locality,
      c.landmark,
      c.departmentId || 'Unassigned',
      c.assignedOfficerName || 'Unassigned',
      Utils.formatDateTime(c.submittedAt),
      Utils.formatDate(c.dueAt),
      Utils.formatDateTime(c.resolvedAt),
      c.isOverdue ? 'YES' : 'NO',
      c.remindersCount || 0,
      c.feedback ? `${c.feedback.rating}/5` : 'None'
    ]);

    const csvContent = [
      headers.map(this.escapeCsv).join(','),
      ...rows.map(row => row.map(this.escapeCsv).join(','))
    ].join('\r\n');

    const dateStamp = new Date().toISOString().split('T')[0];
    this.downloadFile(`GrievanceTrack_Complaints_${dateStamp}.csv`, csvContent);
  },

  /**
   * 2. Export Officer Performance to CSV
   */
  exportOfficerPerformanceCsv() {
    const users = GTStorage.get(STORAGE_KEYS.USERS, []);
    const officers = users.filter(u => u.role === 'officer');
    const complaints = Complaints.getAll();

    const headers = ['Officer Name', 'Department', 'Email', 'Phone', 'Total Assigned', 'In Progress', 'Resolved', 'Overdue Cases', 'Resolution Rate (%)'];

    const rows = officers.map(o => {
      const assigned = complaints.filter(c => c.assignedTo === o.id);
      const inProgress = assigned.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
      const resolved = assigned.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
      const overdue = assigned.filter(c => c.isOverdue).length;
      const rate = assigned.length > 0 ? Math.round((resolved / assigned.length) * 100) : 0;

      return [
        o.name,
        o.departmentId || 'N/A',
        o.email,
        o.phone,
        assigned.length,
        inProgress,
        resolved,
        overdue,
        `${rate}%`
      ];
    });

    const csvContent = [
      headers.map(this.escapeCsv).join(','),
      ...rows.map(row => row.map(this.escapeCsv).join(','))
    ].join('\r\n');

    this.downloadFile(`GrievanceTrack_Officer_Performance.csv`, csvContent);
  },

  /**
   * 3. Export Department Summary to CSV
   */
  exportDepartmentSummaryCsv() {
    const depts = GTStorage.get(STORAGE_KEYS.DEPARTMENTS, []);
    const complaints = Complaints.getAll();

    const headers = ['Department Code', 'Department Name', 'SLA (Days)', 'Lead Officer', 'Total Complaints', 'Resolved', 'Active Pending'];

    const rows = depts.map(d => {
      const deptComplaints = complaints.filter(c => c.departmentId === d.id);
      const resolved = deptComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
      const pending = deptComplaints.length - resolved;

      return [
        d.id,
        d.name,
        d.serviceDays,
        d.head,
        deptComplaints.length,
        resolved,
        pending
      ];
    });

    const csvContent = [
      headers.map(this.escapeCsv).join(','),
      ...rows.map(row => row.map(this.escapeCsv).join(','))
    ].join('\r\n');

    this.downloadFile(`GrievanceTrack_Departments_Report.csv`, csvContent);
  },

  /**
   * 4. Printable Complaint Acknowledgement Slip (PDF preview / browser print)
   */
  printComplaintSlip(complaintId) {
    const complaint = Complaints.getById(complaintId);
    if (!complaint) {
      Toast.error('Complaint not found.');
      return;
    }

    const printArea = document.getElementById('printable-area');
    if (!printArea) return;

    printArea.innerHTML = `
      <div class="print-container">
        <div class="print-header">
          <div class="print-emblem">🏛️</div>
          <h2>CITY MUNICIPAL CORPORATION, BIDAR</h2>
          <h3>Citizen Grievance Redressal & Service Assurance Cell</h3>
          <p class="print-subtext">Official E-Acknowledgement Receipt (Sakalya Seva)</p>
        </div>

        <div class="print-barcode-box">
          <div class="print-token-id">${complaint.id}</div>
          <div class="print-date">Generated: ${Utils.formatDateTime(new Date().toISOString())}</div>
        </div>

        <table class="print-table">
          <tr>
            <th width="30%">Grievance Token ID</th>
            <td><strong>${complaint.id}</strong></td>
          </tr>
          <tr>
            <th>Citizen Name</th>
            <td>${Utils.escapeHtml(complaint.citizenName)} (${Utils.escapeHtml(complaint.citizenPhone)})</td>
          </tr>
          <tr>
            <th>Grievance Subject</th>
            <td><strong>${Utils.escapeHtml(complaint.title)}</strong></td>
          </tr>
          <tr>
            <th>Category & Priority</th>
            <td>${complaint.category} | Priority: <strong>${complaint.priority}</strong></td>
          </tr>
          <tr>
            <th>Locality & Ward</th>
            <td>${Utils.escapeHtml(complaint.locality)}, ${complaint.ward} (Landmark: ${Utils.escapeHtml(complaint.landmark)})</td>
          </tr>
          <tr>
            <th>Registration Date</th>
            <td>${Utils.formatDateTime(complaint.submittedAt)}</td>
          </tr>
          <tr>
            <th>Assigned Department</th>
            <td>${complaint.departmentId || 'Under Verification'}</td>
          </tr>
          <tr>
            <th>Designated Officer</th>
            <td>${complaint.assignedOfficerName || 'Auto-Routing Pending'}</td>
          </tr>
          <tr>
            <th>Target Resolution SLA</th>
            <td><strong>${Utils.formatDate(complaint.dueAt)}</strong></td>
          </tr>
          <tr>
            <th>Current Status</th>
            <td><strong>${complaint.status.toUpperCase()}</strong></td>
          </tr>
        </table>

        <div class="print-note">
          <strong>Instructions for Citizen:</strong> Please retain this token number for future reference and follow-up. You can track live investigation progress on the GrievanceTrack portal anytime using token <strong>${complaint.id}</strong>.
        </div>

        <div class="print-signature-row">
          <div class="sig-box">
            <div class="sig-line"></div>
            <div>Authorized Registrar</div>
            <div>CMC Bidar Portal Desk</div>
          </div>
          <div class="sig-box">
            <div class="sig-stamp">VERIFIED CMC BIDAR</div>
            <div>Digital Compliance Seal</div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      window.print();
    }, 200);
  },

  /**
   * 5. Print Administrator Executive Summary Report
   */
  printExecutiveReport() {
    const printArea = document.getElementById('printable-area');
    if (!printArea) return;

    const complaints = Complaints.getAll();
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
    const inProgress = complaints.filter(c => c.status === 'In Progress').length;
    const overdue = complaints.filter(c => c.isOverdue).length;

    let rowsHtml = '';
    complaints.slice(0, 15).forEach(c => {
      rowsHtml += `
        <tr>
          <td>${c.id}</td>
          <td>${Utils.escapeHtml(c.title.substring(0, 32))}...</td>
          <td>${c.category}</td>
          <td>${c.ward}</td>
          <td>${c.assignedOfficerName || 'Unassigned'}</td>
          <td>${c.status}</td>
          <td>${Utils.formatDate(c.dueAt)}</td>
        </tr>
      `;
    });

    printArea.innerHTML = `
      <div class="print-container">
        <div class="print-header">
          <h2>CITY MUNICIPAL CORPORATION, BIDAR</h2>
          <h3>Executive Grievance Management Summary Report</h3>
          <p>Generated: ${Utils.formatDateTime(new Date().toISOString())}</p>
        </div>

        <div class="print-kpi-summary">
          <div><strong>Total Cases:</strong> ${total}</div>
          <div><strong>Resolved:</strong> ${resolved} (${Math.round((resolved / total) * 100)}%)</div>
          <div><strong>In Progress:</strong> ${inProgress}</div>
          <div><strong>Overdue Cases:</strong> ${overdue}</div>
        </div>

        <table class="print-table mt-3">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Ward</th>
              <th>Officer</th>
              <th>Status</th>
              <th>SLA Due</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>

        <div class="print-note">
          Official audit extract from GrievanceTrack LocalStorage database.
        </div>
      </div>
    `;

    setTimeout(() => {
      window.print();
    }, 200);
  }
};

