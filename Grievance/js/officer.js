/**
 * GrievanceTrack - Department Officer Workspace Controller
 * Enforces role isolation, assigned queue triage, status updates (In Progress,
 * Waiting for Citizen, Resolved), resolution evidence, and overdue follow-ups.
 */

const Officer = {
  currentFilter: 'all',
  currentSearch: '',
  translatedCases: {},

  toggleTranslation(complaintId) {
    this.translatedCases[complaintId] = !this.translatedCases[complaintId];
    this.renderComplaintsList();
  },

  /**
   * Render Officer Overview Dashboard
   */
  renderOverview() {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== 'officer') return;

    const myCases = Complaints.getByOfficer(user.id);
    const assignedTotal = myCases.length;
    const newAssigned = myCases.filter(c => c.status === 'Assigned').length;
    const inProgress = myCases.filter(c => c.status === 'In Progress').length;
    const overdue = myCases.filter(c => c.isOverdue).length;
    const resolved = myCases.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
    const waitingCitizen = myCases.filter(c => c.status === 'Waiting for Citizen').length;
    const unattended = myCases.filter(c => c.isUnattended).length;

    // Update KPI counters
    const elAssigned = document.getElementById('officer-stat-assigned');
    const elNew = document.getElementById('officer-stat-new');
    const elProg = document.getElementById('officer-stat-progress');
    const elOverdue = document.getElementById('officer-stat-overdue');
    const elRes = document.getElementById('officer-stat-resolved');
    const elWaiting = document.getElementById('officer-stat-waiting');

    if (elAssigned) elAssigned.textContent = assignedTotal;
    if (elNew) elNew.textContent = newAssigned;
    if (elProg) elProg.textContent = inProgress;
    if (elOverdue) elOverdue.textContent = overdue;
    if (elRes) elRes.textContent = resolved;
    if (elWaiting) elWaiting.textContent = waitingCitizen;

    // Header greeting
    const elName = document.getElementById('officer-greeting-name');
    const elTitle = document.getElementById('officer-role-title');
    if (elName) elName.textContent = user.name;
    if (elTitle) elTitle.textContent = `${user.title} • ${user.departmentId || 'Operations'}`;

    // Overdue Warning Banner
    const warningBox = document.getElementById('officer-overdue-banner');
    if (warningBox) {
      if (overdue > 0 || unattended > 0) {
        warningBox.style.display = 'flex';
        warningBox.innerHTML = `
          <div class="flex-align-center gap-3 w-100 flex-wrap">
            <span class="pulse text-danger">${Utils.getIcon('alertTriangle', 24)}</span>
            <div class="flex-1">
              <strong>Urgent Action Required:</strong> You have <strong>${overdue} overdue grievance(s)</strong> and <strong>${unattended} unattended case(s)</strong> awaiting follow-up action.
            </div>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-danger" onclick="Officer.showOverdueQueue()">View Overdue Cases</button>
              <button class="btn btn-sm btn-outline" onclick="Reminders.runCheck(true)">Run Reminder Check</button>
            </div>
          </div>
        `;
      } else {
        warningBox.style.display = 'none';
      }
    }

    // Render Officer Recent Assigned Table
    this.renderOfficerRecentTable(myCases.slice(0, 6));

    // Update live sidebar counters
    this.updateSidebarBadges();
  },

  renderOfficerRecentTable(cases) {
    const tbody = document.getElementById('officer-recent-tbody');
    if (!tbody) return;

    if (cases.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted py-4">
            No complaints currently assigned to your desk.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = cases.map(c => {
      const sla = Utils.calculateSlaStatus(c.dueAt, c.status);
      const followUp = Utils.calculateFollowUpStatus(c);
      return `
        <tr>
          <td><span class="complaint-token">${c.id}</span></td>
          <td>
            <div class="table-title">${Utils.escapeHtml(c.title)}</div>
            <div class="table-subtitle">${c.category} • ${c.ward} • ${Utils.getChannelBadge(c.channel || 'Online Portal')}</div>
          </td>
          <td>${Utils.getPriorityBadge(c.priority)}</td>
          <td>${Utils.getStatusBadge(c.status)}</td>
          <td>${followUp.badgeHtml}</td>
          <td><span class="${sla.badgeClass}">${sla.text}</span></td>
          <td>
            <div class="flex gap-1">
              <button class="btn btn-sm btn-primary" onclick="Officer.openUpdateModal('${c.id}')">
                ${Utils.getIcon('edit', 14)} Action
              </button>
              <button class="btn btn-sm btn-outline" onclick="Officer.openScheduleFollowUpModal('${c.id}')" title="Schedule next follow-up action">
                📅
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  /**
   * Render My Assigned Complaints Page with Filters & Search
   */
  renderComplaintsList() {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== 'officer') return;

    let list = Complaints.getByOfficer(user.id);

    // Apply filter
    if (this.currentFilter !== 'all') {
      if (this.currentFilter === 'new') {
        list = list.filter(c => c.status === 'Assigned');
      } else if (this.currentFilter === 'inprogress') {
        list = list.filter(c => c.status === 'In Progress');
      } else if (this.currentFilter === 'overdue') {
        list = list.filter(c => c.isOverdue);
      } else if (this.currentFilter === 'unattended') {
        list = list.filter(c => c.isUnattended);
      } else if (this.currentFilter === 'waiting') {
        list = list.filter(c => c.status === 'Waiting for Citizen');
      } else if (this.currentFilter === 'resolved') {
        list = list.filter(c => c.status === 'Resolved' || c.status === 'Closed');
      } else if (this.currentFilter === 'police') {
        list = list.filter(c => ['DEP-CYB', 'DEP-ECO', 'DEP-LST', 'DEP-TRA', 'DEP-IND'].includes(c.departmentId));
      }
    }

    // Apply search
    if (this.currentSearch.trim()) {
      const q = this.currentSearch.trim().toLowerCase();
      list = list.filter(c => 
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.locality.toLowerCase().includes(q) ||
        c.ward.toLowerCase().includes(q)
      );
    }

    const container = document.getElementById('officer-complaints-table-body');
    const countBadge = document.getElementById('officer-assigned-count');
    if (countBadge) countBadge.textContent = `${list.length} Cases`;

    this.updateSidebarBadges();

    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted py-4">
            No complaints found matching this filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = list.map(c => {
      const sla = Utils.calculateSlaStatus(c.dueAt, c.status);
      const followUp = Utils.calculateFollowUpStatus(c);
      const isTranslated = !!this.translatedCases[c.id];
      const displayTitle = isTranslated && c.translatedTitle ? c.translatedTitle : c.title;

      return `
        <tr>
          <td>
            <strong class="text-cyan complaint-token">${c.id}</strong>
            <div class="mt-1">${Utils.getChannelBadge(c.channel || 'Online Portal')}</div>
          </td>
          <td>
            <div class="font-semibold flex-between">
              <span>${Utils.escapeHtml(displayTitle)}</span>
              <button class="btn btn-outline btn-sm font-10 py-0 px-1 ml-2" onclick="Officer.toggleTranslation('${c.id}')" title="Toggle bilingual translation">
                ${isTranslated ? '🌐 Orig' : '🌐 KN/EN'}
              </button>
            </div>
            <div class="font-11 text-muted mt-1">${c.citizenName} (${c.citizenPhone}) • ${c.ward}</div>
            <div class="font-11 text-slate-300 mt-1"><strong>Next:</strong> ${Utils.escapeHtml(c.nextStep || 'Pending review')}</div>
          </td>
          <td>
            <span class="badge badge-purple">${c.category}</span>
          </td>
          <td>${Utils.getPriorityBadge(c.priority)}</td>
          <td>${Utils.getStatusBadge(c.status)}</td>
          <td>${followUp.badgeHtml}</td>
          <td><span class="${sla.badgeClass}">${sla.text}</span></td>
          <td>
            <div class="flex gap-1 flex-wrap">
              <button class="btn btn-sm btn-primary" onclick="Officer.openUpdateModal('${c.id}')" title="Update status or add remarks">
                ${Utils.getIcon('edit', 14)} Action
              </button>
              <button class="btn btn-sm btn-outline" onclick="Officer.openScheduleFollowUpModal('${c.id}')" title="Schedule next follow-up action">
                📅 Follow-up
              </button>
              ${c.isOverdue && !c.reminderAcknowledged ? `
                <button class="btn btn-sm btn-warning" onclick="Officer.acknowledgeReminder('${c.id}')" title="Acknowledge pending reminder">
                  ✓ Ack
                </button>
              ` : ''}
              <button class="btn btn-sm btn-outline" onclick="Officer.viewDossierModal('${c.id}')" title="View details and evidence">
                ${Utils.getIcon('eye', 14)}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  updateSidebarBadges() {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== 'officer') return;

    const myCases = Complaints.getByOfficer(user.id);
    const assignedTotal = myCases.length;
    const newCount = myCases.filter(c => c.status === 'Assigned').length;
    const inProgressCount = myCases.filter(c => c.status === 'In Progress').length;
    const overdueCount = myCases.filter(c => c.isOverdue).length;
    const resolvedCount = myCases.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

    const bAll = document.getElementById('officer-sidebar-badge-all');
    const bNew = document.getElementById('officer-sidebar-badge-new');
    const bProg = document.getElementById('officer-sidebar-badge-inprogress');
    const bOverdue = document.getElementById('officer-sidebar-badge-overdue');
    const bRes = document.getElementById('officer-sidebar-badge-resolved');

    if (bAll) bAll.textContent = assignedTotal;
    if (bNew) bNew.textContent = newCount;
    if (bProg) bProg.textContent = inProgressCount;
    if (bOverdue) {
      bOverdue.textContent = overdueCount;
      bOverdue.classList.toggle('pulse', overdueCount > 0);
    }
    if (bRes) bRes.textContent = resolvedCount;
  },

  showAllAssigned() {
    this.currentFilter = 'all';
    this.syncFilterUi('all', '📋 My Assigned Cases', 'Comprehensive ledger of all active and resolved complaints assigned to your station.');
  },

  showNewAssignments() {
    this.currentFilter = 'new';
    this.syncFilterUi('new', '📥 New Assignments Triage', 'Recently routed grievances requiring initial verification, assessment, and follow-up scheduling.');
  },

  showInProgressQueue() {
    this.currentFilter = 'inprogress';
    this.syncFilterUi('inprogress', '⚙️ In Progress Investigations & Works', 'Active complaints currently undergoing field inspection, civic repairs, or citizen liaison.');
  },

  showOverdueQueue() {
    this.currentFilter = 'overdue';
    this.syncFilterUi('overdue', '⚠️ Overdue & Urgent SLA Breached Queue', 'Urgent complaints that exceeded their SLA deadline or missed their accountable follow-up milestone.');
  },

  showResolvedQueue() {
    this.currentFilter = 'resolved';
    this.syncFilterUi('resolved', '✅ Resolution History', 'Closed and successfully verified cases resolved by your department.');
  },

  syncFilterUi(filterValue, titleText, subtitleText) {
    this.currentFilter = filterValue;
    const sel = document.getElementById('officer-filter-status');
    if (sel) sel.value = filterValue;

    const titleEl = document.getElementById('officer-assigned-title');
    const subEl = document.getElementById('officer-assigned-subtitle');
    if (titleEl) titleEl.textContent = titleText;
    if (subEl) subEl.textContent = subtitleText;

    App.navigateTo('officer-assigned');

    // Update active highlight in sidebar
    document.querySelectorAll('#sidebar-menu-officer .sidebar-nav-item').forEach(item => {
      const page = item.dataset.page;
      item.classList.remove('active');
      if (filterValue === 'all' && page === 'officer-assigned') item.classList.add('active');
      else if (filterValue === 'new' && page === 'officer-new') item.classList.add('active');
      else if (filterValue === 'inprogress' && page === 'officer-inprogress') item.classList.add('active');
      else if (filterValue === 'overdue' && page === 'officer-overdue') item.classList.add('active');
      else if (filterValue === 'resolved' && page === 'officer-resolved') item.classList.add('active');
    });

    this.renderComplaintsList();
  },

  /**
   * Action Modal: Allows Officer to update status, enter resolution notes,
   * or request additional citizen details.
   */
  openUpdateModal(complaintId) {
    const user = Auth.getCurrentUser();
    const c = Complaints.getById(complaintId);
    if (!c) return;

    // Role check: Officer can only update cases assigned to them
    if (c.assignedTo !== user.id) {
      Toast.error('You do not have permission to modify complaints assigned to another officer.');
      return;
    }

    const modal = document.getElementById('modal-officer-action');
    if (!modal) return;

    document.getElementById('officer-action-complaint-id').value = c.id;
    document.getElementById('officer-action-title').textContent = `${c.id} - ${c.title}`;
    document.getElementById('officer-action-current-status').innerHTML = Utils.getStatusBadge(c.status);

    const statusSelect = document.getElementById('officer-new-status-select');
    if (statusSelect) {
      statusSelect.value = c.status === 'Assigned' ? 'In Progress' : c.status;
    }

    const remarksArea = document.getElementById('officer-action-remarks');
    if (remarksArea) remarksArea.value = '';

    Modal.open('modal-officer-action');
  },

  /**
   * Submit Status & Remarks update
   */
  submitAction() {
    const user = Auth.getCurrentUser();
    const complaintId = document.getElementById('officer-action-complaint-id').value;
    const newStatus = document.getElementById('officer-new-status-select').value;
    const remarks = document.getElementById('officer-action-remarks').value;

    if (!remarks || remarks.trim().length < 5) {
      Toast.error('Please enter an action remark (at least 5 characters).');
      return;
    }

    if (newStatus === 'Resolved' && remarks.trim().length < 15) {
      Toast.error('Resolution requires detailed notes explaining the field action taken.');
      return;
    }

    const success = Complaints.updateStatus(complaintId, newStatus, remarks, user);
    if (success) {
      Toast.success(`Grievance ${complaintId} status updated to "${newStatus}".`);
      Modal.close('modal-officer-action');
      this.renderOverview();
      this.renderComplaintsList();
    }
  },

  /**
   * Officer Acknowledges Pending Reminder
   */
  acknowledgeReminder(complaintId) {
    const user = Auth.getCurrentUser();
    if (!user) return;
    Reminders.acknowledge(complaintId, user, 'Officer acknowledged follow-up reminder and confirmed case triage is underway.');
    this.renderOverview();
    this.renderComplaintsList();
  },

  /**
   * Open Schedule Follow-up Action Modal
   */
  openScheduleFollowUpModal(complaintId) {
    const user = Auth.getCurrentUser();
    const c = Complaints.getById(complaintId);
    if (!c) return;

    if (user.role === 'officer' && c.assignedTo !== user.id) {
      Toast.error('You can only schedule actions on cases assigned to your desk.');
      return;
    }

    const modal = document.getElementById('modal-schedule-followup');
    if (!modal) return;

    document.getElementById('followup-complaint-id').value = c.id;
    document.getElementById('followup-heading').textContent = `Schedule Next Action: ${c.id}`;
    document.getElementById('followup-complaint-title').textContent = c.title;

    const actionStepInput = document.getElementById('followup-next-step');
    if (actionStepInput) {
      actionStepInput.value = c.nextStep || Complaints.getDefaultNextStep(c.category);
    }

    const dateInput = document.getElementById('followup-target-date');
    if (dateInput) {
      const target = c.followUpDate ? new Date(c.followUpDate) : new Date(Date.now() + 36 * 3600000);
      dateInput.value = target.toISOString().split('T')[0];
    }

    const notesInput = document.getElementById('followup-remarks');
    if (notesInput) notesInput.value = '';

    Modal.open('modal-schedule-followup');
  },

  submitScheduleFollowUp() {
    const user = Auth.getCurrentUser();
    const complaintId = document.getElementById('followup-complaint-id').value;
    const actionType = document.getElementById('followup-action-type').value;
    const nextStep = document.getElementById('followup-next-step').value;
    const targetDate = document.getElementById('followup-target-date').value;
    const notes = document.getElementById('followup-remarks').value;

    if (!nextStep || nextStep.trim().length < 5) {
      Toast.error('Please specify a detailed next action step (min 5 chars).');
      return;
    }

    const success = Reminders.recordFollowUpAction(
      complaintId,
      actionType,
      notes || `Action scheduled: ${nextStep}`,
      targetDate ? new Date(targetDate).toISOString() : null,
      nextStep,
      user
    );

    if (success) {
      Modal.close('modal-schedule-followup');
      this.renderOverview();
      this.renderComplaintsList();
    }
  },

  /**
   * Full Complaint Dossier modal for Officer inspection
   */
  viewDossierModal(complaintId) {
    const c = Complaints.getById(complaintId);
    if (!c) return;

    const modal = document.getElementById('modal-dossier-view');
    const body = document.getElementById('modal-dossier-body');
    if (!modal || !body) return;

    const sla = Utils.calculateSlaStatus(c.dueAt, c.status);
    const followUp = Utils.calculateFollowUpStatus(c);
    const isPolicePilot = ['DEP-CYB', 'DEP-ECO', 'DEP-LST', 'DEP-TRA', 'DEP-IND'].includes(c.departmentId);

    let historyHtml = (c.history || []).map(h => `
      <div class="history-item">
        <div class="history-dot"></div>
        <div class="history-content font-12">
          <div class="flex-between">
            <strong>${Utils.escapeHtml(h.actor)} (${h.role.toUpperCase()})</strong>
            <span class="text-muted">${Utils.formatDateTime(h.timestamp)}</span>
          </div>
          <div class="text-slate-300 mt-1">${Utils.escapeHtml(h.remarks || h.action)}</div>
        </div>
      </div>
    `).reverse().join('');

    body.innerHTML = `
      <div class="dossier-modal-content">
        <div class="flex-between border-bottom pb-2 mb-3">
          <div>
            <div class="flex-align-center gap-2">
              <h3 class="font-semibold text-cyan m-0">${c.id}: ${Utils.escapeHtml(c.title)}</h3>
              ${isPolicePilot ? '<span class="badge badge-info font-10">🚨 Police Pilot Case</span>' : ''}
            </div>
            <span class="text-muted font-11">${c.category} • ${c.ward} • ${c.locality} • Intake: ${c.channel || 'Online Portal'}</span>
          </div>
          <div class="flex-align-center gap-1">
            ${Utils.getStatusBadge(c.status)} 
            ${Utils.getPriorityBadge(c.priority)}
            ${followUp.badgeHtml}
          </div>
        </div>

        <div class="grid-2 gap-3 mb-3 font-12">
          <div><strong>Citizen:</strong> ${Utils.escapeHtml(c.citizenName)} (${c.citizenPhone})</div>
          <div><strong>Target SLA Due:</strong> ${Utils.formatDate(c.dueAt)} (${sla.text})</div>
          <div><strong>Intake Channel:</strong> ${Utils.getChannelBadge(c.channel || 'Online Portal')}</div>
          <div><strong>Reminders Logged:</strong> ${c.remindersCount || 0}</div>
        </div>

        <!-- Follow-up Accountability Panel -->
        <div class="p-3 mb-3 glass-card border-info font-12">
          <div class="flex-between border-bottom pb-1 mb-2">
            <strong class="text-cyan">⚡ Smart Follow-up Radar</strong>
            <span>${c.reminderAcknowledged ? '<span class="badge badge-success">✓ Acknowledged</span>' : '<span class="badge badge-warning">⏳ Pending Ack</span>'}</span>
          </div>
          <div><strong>Scheduled Next Action:</strong> ${Utils.escapeHtml(c.nextStep || 'Field investigation')}</div>
          <div class="mt-1"><strong>Follow-up Milestone:</strong> ${Utils.formatDateTime(c.followUpDate || c.dueAt)}</div>
        </div>

        <div class="p-3 glass-card mb-3 font-12">
          <div class="flex-between mb-1">
            <strong>Citizen Description:</strong>
            <span class="badge ${c.language === 'kn' ? 'badge-purple' : 'badge-neutral'} font-10">
              ${c.language === 'kn' ? 'ಕನ್ನಡ (KN)' : 'English (EN)'}
            </span>
          </div>
          <p class="mt-1 text-slate-300">${Utils.escapeHtml(c.description)}</p>
          ${c.translatedDescription ? `
            <div class="mt-2 pt-2 border-top font-11 text-slate-400">
              <strong>Bilingual Translation (${c.language === 'kn' ? 'English' : 'Kannada'}):</strong>
              <div class="mt-1 italic">${Utils.escapeHtml(c.translatedDescription)}</div>
            </div>
          ` : ''}
        </div>

        ${c.documentName ? `
          <div class="mb-3 p-2 glass-card font-12 flex-align-center gap-2">
            ${Utils.getIcon('fileText', 16)}
            <span>Attached Document / Petition: <strong>${Utils.escapeHtml(c.documentName)}</strong></span>
          </div>
        ` : ''}

        ${c.attachmentUrl ? `
          <div class="mb-3">
            <strong>Attached Geo-Tagged Verification Photo:</strong>
            <div class="mt-2 text-center">
              <img src="${c.attachmentUrl}" alt="Evidence" style="max-height: 200px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);"/>
            </div>
          </div>
        ` : ''}

        <div class="flex-between align-center mb-2">
          <h4 class="font-semibold font-13 m-0">History & Activity Trail</h4>
          <button class="btn btn-sm btn-outline" onclick="Officer.openScheduleFollowUpModal('${c.id}')">
            📅 Schedule Follow-up
          </button>
        </div>
        <div class="history-timeline" style="max-height: 180px; overflow-y: auto;">
          ${historyHtml}
        </div>
      </div>
    `;

    Modal.open('modal-dossier-view');
  },

  /**
   * Load Officer Profile Details
   */
  loadProfile() {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== 'officer') return;

    const elName = document.getElementById('officer-prof-name');
    const elDept = document.getElementById('officer-prof-dept');
    if (elName) elName.textContent = user.name;
    if (elDept) elDept.textContent = `${user.departmentId || 'Operations'} • ${user.title}`;
  }
};

