/**
 * GrievanceTrack - Administrator Control Desk Controller
 * Manages macro analytics, all-complaint ledger, complaint assignment,
 * officer & citizen CRUD, department SLAs, escalation desk, and audit logs.
 */

const Admin = {
  complaintFilters: {
    search: '',
    category: 'all',
    status: 'all',
    priority: 'all',
    ward: 'all',
    officer: 'all',
    channel: 'all',
    domain: 'all',
    sort: 'newest'
  },
  translatedComplaints: {},

  toggleComplaintTranslation(id) {
    this.translatedComplaints[id] = !this.translatedComplaints[id];
    this.renderAllComplaintsLedger();
  },

  filterByStatusAndNavigate(status) {
    App.navigateTo('admin-all-complaints');
    const statusSelect = document.getElementById('filter-complaint-status');
    if (statusSelect) {
      statusSelect.value = status;
      this.complaintFilters.status = status;
    }
    this.renderAllComplaintsLedger();
  },

  /**
   * Render Administrator Dashboard Overview
   */
  renderOverview() {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== 'admin') return;

    const complaints = Complaints.getAll();
    const users = DB.getUsers();
    const depts = DB.getDepartments();

    const citizens = users.filter(u => u.role === 'citizen');
    const officers = users.filter(u => u.role === 'officer');

    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review').length;
    const inProgress = complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
    const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
    const overdue = complaints.filter(c => c.isOverdue).length;
    const escalated = complaints.filter(c => c.isEscalated).length;

    // Update KPI Numbers
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('admin-stat-total', total);
    setVal('admin-stat-citizens', citizens.length);
    setVal('admin-stat-officers', officers.length);
    setVal('admin-stat-depts', depts.length);
    setVal('admin-stat-pending', pending);
    setVal('admin-stat-inprogress', inProgress);
    setVal('admin-stat-resolved', resolved);
    setVal('admin-stat-overdue', overdue);
    setVal('admin-stat-escalated', escalated);

    // Render Urgent / Escalated Attention Queue
    this.renderAdminEscalationsQueue(complaints.filter(c => c.isOverdue || c.isEscalated || c.priority === 'Urgent').slice(0, 5));

    // Render Unassigned Queue preview
    this.renderAdminUnassignedPreview(complaints.filter(c => !c.assignedTo && c.status !== 'Resolved' && c.status !== 'Closed').slice(0, 4));

    // Redraw overview charts
    setTimeout(() => {
      Analytics.renderDashboard('all');
    }, 50);
  },

  renderAdminEscalationsQueue(items) {
    const tbody = document.getElementById('admin-escalations-tbody');
    if (!tbody) return;

    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted py-3">
            No critical or escalated complaints right now. All SLA commitments on track.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = items.map(c => `
      <tr>
        <td><strong class="text-cyan">${c.id}</strong></td>
        <td>
          <div class="font-semibold">${Utils.escapeHtml(c.title)}</div>
          <div class="text-muted font-11">${c.category} • ${c.ward}</div>
        </td>
        <td>${c.assignedOfficerName ? `<span class="badge badge-purple">${c.assignedOfficerName}</span>` : '<span class="badge badge-danger">Unassigned</span>'}</td>
        <td>${Utils.getStatusBadge(c.status)}</td>
        <td>${c.isOverdue ? `<span class="badge badge-danger pulse">Overdue (${c.remindersCount || 1} reminders)</span>` : Utils.getPriorityBadge(c.priority)}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="Admin.openAssignModal('${c.id}')">
            ${Utils.getIcon('tool', 14)} Assign / Route
          </button>
        </td>
      </tr>
    `).join('');
  },

  renderAdminUnassignedPreview(items) {
    const tbody = document.getElementById('admin-unassigned-tbody');
    if (!tbody) return;

    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-3">
            All complaints are assigned! No unallocated complaints in queue.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = items.map(c => `
      <tr>
        <td><strong>${c.id}</strong></td>
        <td>${Utils.escapeHtml(c.title)}</td>
        <td>${c.category}</td>
        <td>${Utils.getPriorityBadge(c.priority)}</td>
        <td>
          <button class="btn btn-sm btn-cyan" onclick="Admin.openAssignModal('${c.id}')">
            ${Utils.getIcon('zap', 14)} Assign Officer
          </button>
        </td>
      </tr>
    `).join('');
  },

  /**
   * Render All Complaints Ledger with Multi-Filters
   */
  renderAllComplaintsLedger() {
    let list = Complaints.getAll();

    // Filters
    const f = this.complaintFilters;

    if (f.search.trim()) {
      const q = f.search.trim().toLowerCase();
      list = list.filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.citizenName.toLowerCase().includes(q) ||
        c.locality.toLowerCase().includes(q) ||
        c.ward.toLowerCase().includes(q)
      );
    }

    if (f.category !== 'all') {
      list = list.filter(c => c.category === f.category);
    }

    if (f.status !== 'all') {
      if (f.status === 'overdue') {
        list = list.filter(c => c.isOverdue);
      } else {
        list = list.filter(c => c.status === f.status);
      }
    }

    if (f.priority !== 'all') {
      list = list.filter(c => c.priority === f.priority);
    }

    if (f.ward !== 'all') {
      list = list.filter(c => (c.ward || '').includes(f.ward));
    }

    if (f.channel && f.channel !== 'all') {
      list = list.filter(c => (c.channel || 'Online Portal') === f.channel);
    }

    if (f.domain && f.domain !== 'all') {
      const isPolice = ['DEP-CYB', 'DEP-ECO', 'DEP-LST', 'DEP-TRA', 'DEP-IND'].includes(c.departmentId);
      list = list.filter(c => f.domain === 'police' ? isPolice : !isPolice);
    }

    if (f.officer !== 'all') {
      if (f.officer === 'unassigned') {
        list = list.filter(c => !c.assignedTo);
      } else {
        list = list.filter(c => c.assignedTo === f.officer);
      }
    }

    // Sort
    if (f.sort === 'newest') {
      list.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    } else if (f.sort === 'oldest') {
      list.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
    } else if (f.sort === 'due') {
      list.sort((a, b) => new Date(a.dueAt || 0) - new Date(b.dueAt || 0));
    }

    const tbody = document.getElementById('admin-complaints-tbody');
    const countEl = document.getElementById('admin-complaints-count');
    if (countEl) countEl.textContent = `${list.length} Complaints`;

    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center text-muted py-4">
            No complaints found matching the selected filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(c => {
      const sla = Utils.calculateSlaStatus(c.dueAt, c.status);
      const followUp = Utils.calculateFollowUpStatus(c);
      const isTranslated = !!this.translatedComplaints[c.id];
      const displayTitle = isTranslated && c.translatedTitle ? c.translatedTitle : c.title;

      return `
        <tr>
          <td>
            <strong class="text-cyan">${c.id}</strong>
            <div class="mt-1">${Utils.getChannelBadge(c.channel || 'Online Portal')}</div>
          </td>
          <td>
            <div class="font-semibold flex-between">
              <span>${Utils.escapeHtml(displayTitle)}</span>
              <button class="btn btn-outline btn-sm font-10 py-0 px-1 ml-2" onclick="Admin.toggleComplaintTranslation('${c.id}')" title="Toggle bilingual translation">
                ${isTranslated ? '🌐 Orig' : '🌐 KN/EN'}
              </button>
            </div>
            <div class="font-11 text-muted">Citizen: ${Utils.escapeHtml(c.citizenName)} • ${c.ward}</div>
            <div class="font-11 text-slate-300 mt-1"><strong>Action:</strong> ${Utils.escapeHtml(c.nextStep || 'Triage')}</div>
          </td>
          <td>
            <span class="badge badge-purple">${c.category}</span>
          </td>
          <td>${Utils.getPriorityBadge(c.priority)}</td>
          <td>${Utils.getStatusBadge(c.status)}</td>
          <td>${c.assignedOfficerName ? `<span class="badge badge-purple">${c.assignedOfficerName}</span>` : '<span class="badge badge-neutral">Unassigned</span>'}</td>
          <td>${followUp.badgeHtml}</td>
          <td><span class="${sla.badgeClass}">${sla.text}</span></td>
          <td>
            <div class="flex gap-1 flex-wrap">
              <button class="btn btn-sm btn-outline" onclick="Admin.viewComplaintDetails('${c.id}')" title="Inspect details">
                ${Utils.getIcon('eye', 14)}
              </button>
              <button class="btn btn-sm btn-primary" onclick="Admin.openAssignModal('${c.id}')" title="Assign or Reassign">
                ${Utils.getIcon('edit', 14)}
              </button>
              <button class="btn btn-sm btn-outline" onclick="Officer.openScheduleFollowUpModal('${c.id}')" title="Schedule Follow-up Action">
                📅
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  applyComplaintFilters() {
    const search = document.getElementById('filter-complaint-search')?.value || '';
    const category = document.getElementById('filter-complaint-cat')?.value || 'all';
    const status = document.getElementById('filter-complaint-status')?.value || 'all';
    const priority = document.getElementById('filter-complaint-priority')?.value || 'all';
    const ward = document.getElementById('filter-complaint-ward')?.value || 'all';
    const officer = document.getElementById('filter-complaint-officer')?.value || 'all';
    const channel = document.getElementById('filter-complaint-channel')?.value || 'all';
    const domain = document.getElementById('filter-complaint-domain')?.value || 'all';
    const sort = document.getElementById('filter-complaint-sort')?.value || 'newest';

    this.complaintFilters = { search, category, status, priority, ward, officer, channel, domain, sort };
    this.renderAllComplaintsLedger();
  },

  resetComplaintFilters() {
    this.complaintFilters = {
      search: '',
      category: 'all',
      status: 'all',
      priority: 'all',
      ward: 'all',
      officer: 'all',
      channel: 'all',
      domain: 'all',
      sort: 'newest'
    };
    ['filter-complaint-search', 'filter-complaint-cat', 'filter-complaint-status', 
     'filter-complaint-priority', 'filter-complaint-ward', 'filter-complaint-officer',
     'filter-complaint-channel', 'filter-complaint-domain'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = el.tagName === 'INPUT' ? '' : 'all';
    });
    this.renderAllComplaintsLedger();
  },

  /**
   * Open Complaint Assignment Modal
   */
  openAssignModal(complaintId) {
    const c = Complaints.getById(complaintId);
    if (!c) return;

    const modal = document.getElementById('modal-admin-assign');
    if (!modal) return;

    document.getElementById('assign-complaint-id').value = c.id;
    document.getElementById('assign-complaint-heading').textContent = `Assign: ${c.id} - ${c.title}`;
    document.getElementById('assign-citizen-info').textContent = `${c.citizenName} • ${c.ward} • ${c.locality}`;

    // Populate Department dropdown
    const deptSelect = document.getElementById('assign-dept-select');
    const depts = GTStorage.get(STORAGE_KEYS.DEPARTMENTS, []);
    deptSelect.innerHTML = depts.map(d => `
      <option value="${d.id}" ${c.departmentId === d.id ? 'selected' : ''}>${d.name} (${d.serviceDays}d SLA)</option>
    `).join('');

    // Trigger officer filtering based on department
    this.onAssignDeptChange();

    // Default due date calculation
    const dueInput = document.getElementById('assign-due-date');
    if (dueInput) {
      const d = c.dueAt ? new Date(c.dueAt) : new Date(Date.now() + 3 * 86400000);
      dueInput.value = d.toISOString().split('T')[0];
    }

    Modal.open('modal-admin-assign');
  },

  onAssignDeptChange() {
    const deptId = document.getElementById('assign-dept-select')?.value;
    const officerSelect = document.getElementById('assign-officer-select');
    const users = DB.query("SELECT * FROM users WHERE role = 'officer'").map(DB.mapUser);

    // Officers in this department, or fallback to all available officers
    let deptOfficers = users.filter(u => u.role === 'officer' && (u.departmentId === deptId || !u.departmentId));
    if (deptOfficers.length === 0) {
      deptOfficers = users.filter(u => u.role === 'officer');
    }
    
    if (officerSelect) {
      if (deptOfficers.length === 0) {
        officerSelect.innerHTML = `<option value="">No officers in system</option>`;
      } else {
        officerSelect.innerHTML = deptOfficers.map(o => `
          <option value="${o.id}">${o.name} - ${o.title} (${o.departmentId || 'General'})</option>
        `).join('');
      }
    }
  },

  submitAssignment() {
    const adminUser = Auth.getCurrentUser();
    const complaintId = document.getElementById('assign-complaint-id')?.value;
    const deptId = document.getElementById('assign-dept-select')?.value;
    const officerId = document.getElementById('assign-officer-select')?.value;
    const dueVal = document.getElementById('assign-due-date')?.value;
    const remarks = document.getElementById('assign-remarks')?.value;

    if (!officerId) {
      Toast.error('Please select an officer to assign.');
      return;
    }

    const dueDateIso = dueVal ? new Date(dueVal).toISOString() : null;
    const success = Assignment.assign(complaintId, deptId, officerId, dueDateIso, remarks, adminUser);

    if (success) {
      Modal.close('modal-admin-assign');
      this.renderOverview();
      this.renderAllComplaintsLedger();
    }
  },

  /**
   * View Complaint Details (Modal)
   */
  viewComplaintDetails(complaintId) {
    const c = Complaints.getById(complaintId);
    if (!c) return;

    Officer.viewDossierModal(complaintId);
  },

  /**
   * Officer Management (CRUD)
   */
  renderOfficersList() {
    const officers = DB.query("SELECT * FROM users WHERE role = 'officer'").map(DB.mapUser);
    const complaints = Complaints.getAll();

    const tbody = document.getElementById('admin-officers-tbody');
    if (!tbody) return;

    tbody.innerHTML = officers.map(o => {
      const assignedCases = complaints.filter(c => c.assignedTo === o.id);
      const active = assignedCases.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length;
      const resolved = assignedCases.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
      const overdue = assignedCases.filter(c => c.isOverdue).length;

      return `
        <tr>
          <td>
            <div class="flex-align-center gap-2">
              <span class="user-avatar-mini">${o.avatar || '👷'}</span>
              <div>
                <strong class="font-semibold">${Utils.escapeHtml(o.name)}</strong>
                <div class="font-11 text-muted">${o.email}</div>
              </div>
            </div>
          </td>
          <td><span class="badge badge-purple">${o.departmentId || 'General'}</span></td>
          <td>${Utils.escapeHtml(o.title)}</td>
          <td>${o.phone}</td>
          <td>
            <div class="flex-align-center gap-1 font-12">
              <span class="badge badge-info">${active} active</span>
              <span class="badge badge-success">${resolved} res</span>
              ${overdue > 0 ? `<span class="badge badge-danger">${overdue} overdue</span>` : ''}
            </div>
          </td>
          <td>
            <span class="badge ${o.active !== false ? 'badge-success' : 'badge-danger'}">
              ${o.active !== false ? 'Active' : 'Disabled'}
            </span>
          </td>
          <td>
            <div class="flex gap-1">
              <button class="btn btn-sm btn-outline" onclick="Admin.openEditOfficerModal('${o.id}')" title="Edit officer details">
                ${Utils.getIcon('edit', 14)}
              </button>
              <button class="btn btn-sm ${o.active !== false ? 'btn-danger-outline' : 'btn-success-outline'}" 
                      onclick="Admin.toggleUserActive('${o.id}')" title="Toggle active status">
                ${o.active !== false ? Utils.getIcon('x', 14) : Utils.getIcon('check', 14)}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  openAddOfficerModal() {
    const depts = DB.getDepartments();
    const select = document.getElementById('new-officer-dept');
    if (select) {
      select.innerHTML = depts.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    }
    const nameEl = document.getElementById('new-officer-name');
    const emailEl = document.getElementById('new-officer-email');
    const passEl = document.getElementById('new-officer-password');
    const titleEl = document.getElementById('new-officer-title');
    const phoneEl = document.getElementById('new-officer-phone');
    if (nameEl) nameEl.value = '';
    if (emailEl) emailEl.value = '';
    if (passEl) passEl.value = '';
    if (titleEl) titleEl.value = '';
    if (phoneEl) phoneEl.value = '';

    Modal.open('modal-add-officer');
  },

  saveNewOfficer() {
    const name = document.getElementById('new-officer-name')?.value;
    const email = document.getElementById('new-officer-email')?.value;
    const password = document.getElementById('new-officer-password')?.value;
    const dept = document.getElementById('new-officer-dept')?.value;
    const title = document.getElementById('new-officer-title')?.value;
    const phone = document.getElementById('new-officer-phone')?.value;

    if (!name || !name.trim() || !email || !email.trim()) {
      Toast.error('Please enter officer name and email.');
      return;
    }

    if (!password || !password.trim()) {
      Toast.error('Please enter an initial password for the officer.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = DB.queryOne("SELECT user_id FROM users WHERE LOWER(email) = LOWER(?)", [cleanEmail]);
    if (existing) {
      Toast.error('An account with this email already exists.');
      return;
    }

    const newOfficerId = `USR-OFF-${String(Date.now()).slice(-4)}`;
    DB.execute(`
      INSERT INTO users (user_id, full_name, email, password_hash, role, dept_id, phone, ward_no, status, created_at)
      VALUES (?, ?, ?, ?, 'officer', ?, ?, ?, 'active', ?)
    `, [
      newOfficerId,
      name.trim(),
      cleanEmail,
      password.trim(),
      dept || null,
      phone ? phone.trim() : '+91 94480 00000',
      title ? title.trim() : 'Department Inspector',
      new Date().toISOString()
    ]);

    const adminUser = Auth.getCurrentUser();
    Audit.log({
      actor: adminUser ? adminUser.name : 'Administrator',
      role: 'admin',
      action: 'ADD_OFFICER',
      description: `Added new officer: ${name.trim()} [${dept || 'General'}].`
    });

    Toast.success(`Officer ${name.trim()} created successfully.`);
    Modal.close('modal-add-officer');
    this.renderOfficersList();
    this.renderOverview();
  },

  openEditOfficerModal(officerId) {
    const officerRow = DB.queryOne("SELECT * FROM users WHERE user_id = ?", [officerId]);
    if (!officerRow) return;
    const officer = DB.mapUser(officerRow);

    document.getElementById('edit-officer-id').value = officer.id;
    document.getElementById('edit-officer-name').value = officer.name;
    document.getElementById('edit-officer-title').value = officer.title || '';
    document.getElementById('edit-officer-phone').value = officer.phone || '';

    const depts = DB.getDepartments();
    const select = document.getElementById('edit-officer-dept');
    if (select) {
      select.innerHTML = depts.map(d => `
        <option value="${d.id}" ${officer.departmentId === d.id ? 'selected' : ''}>${d.name}</option>
      `).join('');
    }

    Modal.open('modal-edit-officer');
  },

  saveEditedOfficer() {
    const id = document.getElementById('edit-officer-id')?.value;
    const name = document.getElementById('edit-officer-name')?.value;
    const title = document.getElementById('edit-officer-title')?.value;
    const dept = document.getElementById('edit-officer-dept')?.value;
    const phone = document.getElementById('edit-officer-phone')?.value;

    DB.execute(`
      UPDATE users 
      SET full_name = ?, dept_id = ?, phone = ?, ward_no = ?
      WHERE user_id = ?
    `, [name.trim(), dept, phone.trim(), title ? title.trim() : 'Department Inspector', id]);

    Toast.success('Officer details updated in relational database.');
    Modal.close('modal-edit-officer');
    this.renderOfficersList();
    this.renderOverview();
  },

  toggleUserActive(userId) {
    const user = DB.queryOne("SELECT * FROM users WHERE user_id = ?", [userId]);
    if (!user) return;

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    DB.execute("UPDATE users SET status = ? WHERE user_id = ?", [newStatus, userId]);

    Toast.info(`Account status updated to ${newStatus} for ${user.full_name}.`);
    this.renderOfficersList();
    this.renderCitizensList();
  },

  /**
   * Citizen Management
   */
  renderCitizensList() {
    const citizens = DB.query("SELECT * FROM users WHERE role = 'citizen'").map(DB.mapUser);
    const complaints = Complaints.getAll();

    const tbody = document.getElementById('admin-citizens-tbody');
    if (!tbody) return;

    tbody.innerHTML = citizens.map(c => {
      const citizenComplaints = complaints.filter(comp => comp.citizenId === c.id);

      return `
        <tr>
          <td>
            <div class="flex-align-center gap-2">
              <span class="user-avatar-mini">${c.avatar || '👤'}</span>
              <div>
                <strong>${Utils.escapeHtml(c.name)}</strong>
                <div class="font-11 text-muted">${c.email}</div>
              </div>
            </div>
          </td>
          <td>${c.phone || 'N/A'}</td>
          <td><span class="badge badge-info">${c.ward || 'Ward 01'}</span></td>
          <td>${citizenComplaints.length} Submitted</td>
          <td>${Utils.formatDate(c.createdAt)}</td>
          <td>
            <span class="badge ${c.active !== false ? 'badge-success' : 'badge-danger'}">
              ${c.active !== false ? 'Active' : 'Suspended'}
            </span>
          </td>
          <td>
            <button class="btn btn-sm ${c.active !== false ? 'btn-danger-outline' : 'btn-success-outline'}" 
                    onclick="Admin.toggleUserActive('${c.id}')">
              ${c.active !== false ? 'Deactivate' : 'Activate'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  /**
   * Department Management
   */
  renderDepartmentsList() {
    const depts = DB.getDepartments();
    const complaints = Complaints.getAll();
    const tbody = document.getElementById('admin-departments-tbody');
    if (!tbody) return;

    tbody.innerHTML = depts.map(d => {
      const totalDept = complaints.filter(c => c.departmentId === d.id).length;
      return `
        <tr>
          <td><strong class="text-cyan">${d.id}</strong></td>
          <td>
            <div class="font-semibold">${d.name}</div>
            <div class="font-11 text-muted">${d.description || ''}</div>
          </td>
          <td><span class="badge badge-purple">${d.serviceDays} Days</span></td>
          <td>${d.head || 'Officer in-charge'}</td>
          <td>${d.categories ? d.categories.map(c => `<span class="badge badge-neutral">${c}</span>`).join(' ') : 'All'}</td>
          <td><strong>${totalDept}</strong> cases</td>
        </tr>
      `;
    }).join('');
  },

  /**
   * Audit Logs View
   */
  renderAuditLogs() {
    const logs = Audit.getAll();
    const tbody = document.getElementById('admin-audit-tbody');
    if (!tbody) return;

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td class="font-11 text-muted">${Utils.formatDateTime(l.timestamp)}</td>
        <td>
          <span class="font-semibold">${Utils.escapeHtml(l.actor)}</span>
          <span class="badge badge-role font-10">${l.role}</span>
        </td>
        <td><span class="audit-action-pill">${l.action}</span></td>
        <td>${l.complaintId ? `<strong class="text-cyan">${l.complaintId}</strong>` : '-'}</td>
        <td class="font-12 text-slate-300">${Utils.escapeHtml(l.description)}</td>
      </tr>
    `).join('');
  },

  /**
   * Render Dedicated Unassigned Queue Page
   */
  renderUnassignedQueue() {
    const unassigned = Complaints.getUnassigned();
    const tbody = document.getElementById('admin-unassigned-queue-tbody');
    if (!tbody) return;

    if (unassigned.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted py-4">
            Zero unassigned complaints! All registered grievances have been routed to responsible department officers.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = unassigned.map(c => `
      <tr>
        <td><strong class="text-cyan">${c.id}</strong></td>
        <td>
          <div class="font-semibold">${Utils.escapeHtml(c.title)}</div>
          <div class="font-11 text-muted">Citizen: ${Utils.escapeHtml(c.citizenName)} (${c.citizenPhone})</div>
        </td>
        <td><span class="badge badge-purple">${c.category}</span></td>
        <td>${c.locality}, ${c.ward}</td>
        <td>${Utils.getPriorityBadge(c.priority)}</td>
        <td>${Utils.formatDate(c.submittedAt)}</td>
        <td>
          <button class="btn btn-sm btn-cyan" onclick="Admin.openAssignModal('${c.id}')">
            ⚡ Assign Officer
          </button>
        </td>
      </tr>
    `).join('');
  },

  /**
   * Render Dedicated Escalations Desk Page
   */
  renderEscalationsDesk() {
    const complaints = Complaints.getAll();
    const overdueOrEscalated = complaints.filter(c => (c.isOverdue || c.isEscalated || c.isUnattended) && c.status !== 'Resolved' && c.status !== 'Closed');
    const tbody = document.getElementById('admin-escalations-desk-tbody');
    if (!tbody) return;

    if (overdueOrEscalated.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted py-4">
            All complaints are progressing within their configured SLA limits. No pending escalations.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = overdueOrEscalated.map(c => {
      const sla = Utils.calculateSlaStatus(c.dueAt, c.status);
      const followUp = Utils.calculateFollowUpStatus(c);
      return `
        <tr>
          <td>
            <strong class="text-danger">${c.id}</strong>
            <div class="mt-1">${Utils.getChannelBadge(c.channel || 'Online Portal')}</div>
          </td>
          <td>
            <div class="font-semibold">${Utils.escapeHtml(c.title)}</div>
            <div class="font-11 text-muted">${c.category} • ${c.ward} • Due: ${Utils.formatDate(c.dueAt)}</div>
            <div class="font-11 text-slate-300 mt-1"><strong>Next Action:</strong> ${Utils.escapeHtml(c.nextStep || 'Field inquiry')}</div>
          </td>
          <td>
            ${c.assignedOfficerName 
              ? `<span class="badge badge-purple">${c.assignedOfficerName}</span>` 
              : `<span class="badge badge-danger">Unassigned</span>`}
          </td>
          <td>${Utils.getStatusBadge(c.status)}</td>
          <td>
            <span class="badge ${c.isEscalated ? 'badge-danger pulse' : (c.isUnattended ? 'badge-warning' : 'badge-danger')} font-11">
              ${c.isEscalated ? '🚨 Escalated to Admin' : (c.isUnattended ? '⚠️ Unattended (>48h)' : `${c.remindersCount || 1} Follow-up Alert(s)`)}
            </span>
            <div class="mt-1">${followUp.badgeHtml}</div>
          </td>
          <td>
            <div class="flex gap-1 flex-wrap">
              <button class="btn btn-sm btn-primary" onclick="Admin.openAssignModal('${c.id}')" title="Reassign to another officer">
                Reassign
              </button>
              <button class="btn btn-sm btn-outline" onclick="Officer.openScheduleFollowUpModal('${c.id}')" title="Schedule Follow-up Action">
                📅 Follow-up
              </button>
              <button class="btn btn-sm btn-outline" onclick="Assignment.updatePriority('${c.id}', 'Urgent', Auth.getCurrentUser()); Admin.renderEscalationsDesk();" title="Escalate priority to Urgent">
                🔥 Bump P1
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  /**
   * SQL Database Explorer & Interactive Query Console
   */
  renderDatabaseExplorer(resetEditor = true) {
    if (typeof DB === 'undefined' || !DB.engine) return;

    const tables = DB.getAllTables();
    const grid = document.getElementById('admin-db-tables-grid');
    if (grid) {
      const tableIcons = {
        departments: '🏢',
        users: '👥',
        complaints: '📑',
        complaint_history: '📜',
        notifications: '🔔',
        feedback: '⭐',
        reminders: '⏰',
        audit_logs: '🛡️'
      };

      grid.innerHTML = tables.map(t => {
        const icon = tableIcons[t.name.toLowerCase()] || '📁';
        return `
          <div class="glass-panel p-3 database-table-card pointer" onclick="Admin.prefillSql('SELECT * FROM ${t.name} LIMIT 25;')">
            <div class="flex-between mb-2">
              <div class="flex-align-center gap-2">
                <span class="font-18">${icon}</span>
                <strong class="font-14 text-cyan">${t.name}</strong>
              </div>
              <span class="badge badge-purple font-11">${t.rowCount} rows</span>
            </div>
            <div class="db-columns-list font-11 text-muted">
              ${t.columns.map(c => `
                <div class="flex-between py-1 border-bottom-subtle">
                  <span>${c.name} <span class="text-slate-400 font-10">(${c.type})</span></span>
                  <div class="flex gap-1">
                    ${c.isPk ? '<span class="badge badge-xs badge-cyan">PK</span>' : ''}
                    ${c.notNull ? '<span class="badge badge-xs badge-neutral">NN</span>' : ''}
                    ${c.unique ? '<span class="badge badge-xs badge-emerald">UQ</span>' : ''}
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="mt-2 text-right">
              <span class="text-xs text-cyan hover-underline">Click to Query &rarr;</span>
            </div>
          </div>
        `;
      }).join('');
    }

    if (resetEditor) {
      const editor = document.getElementById('sql-query-input');
      if (editor && !editor.value.trim()) {
        editor.value = `SELECT c.complaint_id, c.title, c.category, c.status, c.priority, d.dept_name, u.full_name AS citizen_name\nFROM complaints c\nLEFT JOIN departments d ON c.dept_id = d.dept_id\nLEFT JOIN users u ON c.citizen_id = u.user_id\nLIMIT 10;`;
        this.executeSqlConsole();
      }
    }
  },

  prefillSql(sql) {
    const editor = document.getElementById('sql-query-input');
    if (editor) {
      editor.value = sql.trim();
      this.executeSqlConsole();
      document.getElementById('sql-console-panel')?.scrollIntoView({ behavior: 'smooth' });
    }
  },

  clearSqlConsole() {
    const editor = document.getElementById('sql-query-input');
    if (editor) editor.value = '';
    const status = document.getElementById('sql-query-status');
    if (status) status.innerHTML = `<span class="text-muted font-12">Enter a SQL statement and click "Run SQL Query ⚡"</span>`;
    const container = document.getElementById('sql-results-container');
    if (container) container.innerHTML = `<div class="p-4 text-center text-muted">No query executed yet.</div>`;
  },

  executeSqlConsole() {
    const editor = document.getElementById('sql-query-input');
    const statusEl = document.getElementById('sql-query-status');
    const container = document.getElementById('sql-results-container');
    if (!editor || !editor.value.trim()) {
      Toast.warning('Please enter a SQL statement.');
      return;
    }

    const sql = editor.value.trim();
    const t0 = performance.now();

    try {
      const isSelect = /^\s*SELECT/i.test(sql) || /^\s*EXPLAIN/i.test(sql);
      if (isSelect) {
        const rows = DB.query(sql);
        const elapsed = (performance.now() - t0).toFixed(2);

        if (statusEl) {
          statusEl.innerHTML = `<span class="badge badge-emerald">✅ Query executed in ${elapsed} ms</span> <span class="font-12 text-slate-300 ml-2">(${rows.length} row${rows.length === 1 ? '' : 's'} returned)</span>`;
        }

        if (!rows || rows.length === 0) {
          if (container) {
            container.innerHTML = `<div class="p-4 text-center text-muted font-13">Query executed successfully, but returned 0 rows.</div>`;
          }
          return;
        }

        const cols = Object.keys(rows[0]);
        let html = `
          <div class="table-responsive" style="max-height: 480px; overflow: auto;">
            <table class="table data-table font-12" id="sql-results-table">
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  ${cols.map(c => `<th>${c}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
        `;

        rows.forEach((r, idx) => {
          html += `<tr><td class="text-muted font-11">${idx + 1}</td>`;
          cols.forEach(c => {
            const val = r[c];
            if (val === null || val === undefined) {
              html += `<td class="text-muted font-italic font-11">NULL</td>`;
            } else if (typeof val === 'string' && val.length > 80) {
              html += `<td title="${Utils.escapeHtml(val)}">${Utils.escapeHtml(val.slice(0, 77))}...</td>`;
            } else {
              html += `<td>${Utils.escapeHtml(String(val))}</td>`;
            }
          });
          html += `</tr>`;
        });

        html += `
              </tbody>
            </table>
          </div>
        `;
        if (container) container.innerHTML = html;

      } else {
        // DML or DDL statement
        const res = DB.execute(sql);
        const elapsed = (performance.now() - t0).toFixed(2);

        if (statusEl) {
          statusEl.innerHTML = `<span class="badge badge-cyan">⚡ Statement executed in ${elapsed} ms</span> <span class="font-12 text-slate-300 ml-2">(Rows affected: ${res.affectedRows || 0}. Persisted to IndexedDB)</span>`;
        }

        if (container) {
          container.innerHTML = `
            <div class="p-4 text-center text-success">
              <div class="font-18 font-semibold mb-2">💾 Statement Executed Successfully</div>
              <p class="font-12 text-muted">Relational engine and IndexedDB persistence updated immediately.</p>
            </div>
          `;
        }

        // Re-render table metadata
        this.renderDatabaseExplorer(false);
      }
    } catch (err) {
      const elapsed = (performance.now() - t0).toFixed(2);
      if (statusEl) {
        statusEl.innerHTML = `<span class="badge badge-danger">❌ SQL Error (${elapsed} ms)</span>`;
      }
      if (container) {
        container.innerHTML = `
          <div class="p-4 bg-danger-subtle rounded border-danger">
            <h4 class="font-14 text-danger font-semibold mb-1">SQL Execution Failure</h4>
            <pre class="font-12 text-danger font-mono" style="white-space: pre-wrap; margin: 0;">${Utils.escapeHtml(err.message || String(err))}</pre>
          </div>
        `;
      }
    }
  },

  async resetDatabaseWithConfirm() {
    if (confirm('Are you sure you want to completely reset the in-browser relational database? All custom rows will be re-seeded from database/seed.sql.')) {
      await DB.reset();
      this.renderDatabaseExplorer();
      this.renderOverview();
      Toast.success('Database reset and re-seeded successfully.');
    }
  }
};

/**
 * Audit Logging Service (SQL-backed)
 */
const Audit = {
  getAll() {
    if (typeof DB !== 'undefined' && DB.query) {
      try {
        const rows = DB.query(`
          SELECT log_id, user_id, role, action, complaint_id, description, created_at
          FROM audit_logs
          ORDER BY log_id DESC
          LIMIT 100
        `);
        return rows.map(r => ({
          id: `LOG-${r.log_id}`,
          timestamp: r.created_at,
          actor: r.user_id || 'System',
          role: r.role || 'system',
          action: r.action,
          complaintId: r.complaint_id,
          description: r.description
        }));
      } catch (e) {
        console.warn('Audit query error:', e);
      }
    }
    return [];
  },

  log({ actor, role, action, complaintId = null, description }) {
    if (typeof DB !== 'undefined' && DB.execute) {
      try {
        DB.execute(`
          INSERT INTO audit_logs (user_id, role, action, complaint_id, description, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          actor || 'System',
          role || 'system',
          action || 'ACTION',
          complaintId || null,
          description || '',
          new Date().toISOString()
        ]);
        return;
      } catch (e) {
        console.warn('Audit log error:', e);
      }
    }
  }
};

