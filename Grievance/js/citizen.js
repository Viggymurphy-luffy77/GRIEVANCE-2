/**
 * GrievanceTrack - Citizen Portal Controller
 * Manages citizen overview, grievance submission with file attachment,
 * interactive step timeline tracker, feedback submission, and profile.
 */

const Citizen = {
  currentFilter: 'all',
  currentSearch: '',
  translatedCards: {},
  trackingTranslationState: {},

  toggleCardTranslation(complaintId) {
    this.translatedCards[complaintId] = !this.translatedCards[complaintId];
    this.renderComplaintsList();
  },

  toggleTrackingTranslation(complaintId) {
    this.trackingTranslationState[complaintId] = !this.trackingTranslationState[complaintId];
    const c = Complaints.getById(complaintId);
    if (c) this.renderTrackingDetails(c);
  },

  /**
   * Render Citizen Dashboard Overview
   */
  renderOverview() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const myComplaints = Complaints.getByCitizen(user.id);
    const total = myComplaints.length;
    const inProgress = myComplaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
    const resolved = myComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
    const actionNeeded = myComplaints.filter(c => c.status === 'Waiting for Citizen' || (c.status === 'Resolved' && !c.feedback)).length;

    // Update KPI counters
    const elTotal = document.getElementById('citizen-stat-total');
    const elProg = document.getElementById('citizen-stat-progress');
    const elRes = document.getElementById('citizen-stat-resolved');
    const elAction = document.getElementById('citizen-stat-action');

    if (elTotal) elTotal.textContent = total;
    if (elProg) elProg.textContent = inProgress;
    if (elRes) elRes.textContent = resolved;
    if (elAction) elAction.textContent = actionNeeded;

    // Update welcome banner
    const elGreeting = document.getElementById('citizen-greeting-name');
    if (elGreeting) elGreeting.textContent = user.name;

    const elLocality = document.getElementById('citizen-locality-pill');
    if (elLocality) elLocality.textContent = `${user.ward || 'Ward 04'} • ${user.locality || 'Bidar'}`;

    // Render Recent Complaints table
    this.renderRecentTable(myComplaints.slice(0, 5));

    // Render Citizen Mini Donut Chart
    this.renderMiniStatusChart(myComplaints);
  },

  renderRecentTable(complaints) {
    const tbody = document.getElementById('citizen-recent-tbody');
    if (!tbody) return;

    if (complaints.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-4">
            No grievances submitted yet. Click "Submit Grievance" to register your first civic issue.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = complaints.map(c => `
      <tr>
        <td>
          <a href="javascript:void(0)" onclick="Citizen.trackComplaint('${c.id}')" class="text-link font-semibold">
            ${c.id}
          </a>
        </td>
        <td>
          <div class="table-title">${Utils.escapeHtml(c.title)}</div>
          <div class="table-subtitle">${c.category} • ${c.ward}</div>
        </td>
        <td>${Utils.formatDate(c.submittedAt)}</td>
        <td>${Utils.getStatusBadge(c.status)}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="Citizen.trackComplaint('${c.id}')">
            ${Utils.getIcon('eye', 14)} Track
          </button>
        </td>
      </tr>
    `).join('');
  },

  renderMiniStatusChart(complaints) {
    const canvas = document.getElementById('citizen-mini-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = (rect.width || 220) * dpr;
    canvas.height = (rect.height || 180) * dpr;
    ctx.scale(dpr, dpr);

    const counts = {
      submitted: complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review').length,
      inProgress: complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length,
      resolved: complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
      other: complaints.filter(c => c.status === 'Waiting for Citizen' || c.status === 'Reopened').length
    };

    const total = complaints.length || 1;
    const data = [
      { count: counts.resolved, color: '#10b981', label: 'Resolved' },
      { count: counts.inProgress, color: '#f59e0b', label: 'In Progress' },
      { count: counts.submitted, color: '#06b6d4', label: 'Submitted' },
      { count: counts.other, color: '#ec4899', label: 'Attention' }
    ].filter(d => d.count > 0);

    const centerX = (rect.width || 220) / 2;
    const centerY = (rect.height || 180) / 2;
    const outerR = Math.min(centerX, centerY) - 16;
    const innerR = outerR * 0.65;

    ctx.clearRect(0, 0, rect.width, rect.height);
    let startA = -Math.PI / 2;

    data.forEach(item => {
      const sliceA = (item.count / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerR, startA, startA + sliceA);
      ctx.arc(centerX, centerY, innerR, startA + sliceA, startA, true);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();
      startA += sliceA;
    });

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(complaints.length, centerX, centerY + 3);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px system-ui';
    ctx.fillText('TOTAL', centerX, centerY + 16);
  },

  /**
   * Render My Complaints Page
   */
  renderComplaintsList() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    let list = Complaints.getByCitizen(user.id);

    // Apply Filter
    if (this.currentFilter !== 'all') {
      if (this.currentFilter === 'active') {
        list = list.filter(c => c.status !== 'Resolved' && c.status !== 'Closed');
      } else if (this.currentFilter === 'overdue') {
        list = list.filter(c => c.isOverdue);
      } else {
        list = list.filter(c => c.status.toLowerCase() === this.currentFilter.toLowerCase());
      }
    }

    // Apply Search
    if (this.currentSearch.trim()) {
      const q = this.currentSearch.trim().toLowerCase();
      list = list.filter(c => 
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.locality.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }

    const container = document.getElementById('citizen-complaints-cards');
    const countBadge = document.getElementById('citizen-complaints-count');
    if (countBadge) countBadge.textContent = `${list.length} Records`;

    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon">${Utils.getIcon('fileText', 48)}</div>
          <h3>No Grievances Found</h3>
          <p class="text-muted">No complaints match your current search or filter criteria.</p>
          <button class="btn btn-primary btn-sm mt-3" onclick="Citizen.resetFilters()">Reset Filters</button>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(c => {
      const sla = Utils.calculateSlaStatus(c.dueAt, c.status);
      const followUp = Utils.calculateFollowUpStatus(c);
      const isTranslated = !!this.translatedCards[c.id];
      const displayTitle = isTranslated && c.translatedTitle ? c.translatedTitle : c.title;
      const displayDesc = isTranslated && c.translatedDescription ? c.translatedDescription : c.description;
      const isKn = c.language === 'kn';

      return `
        <div class="complaint-card glass-panel">
          <div class="complaint-card-header">
            <div class="flex-align-center gap-2 flex-wrap">
              <span class="complaint-token">${c.id}</span>
              ${Utils.getStatusBadge(c.status)}
              ${Utils.getChannelBadge(c.channel || 'Online Portal')}
              ${followUp.badgeHtml}
            </div>
            <div class="flex-align-center gap-2">
              <span class="badge ${isKn ? 'badge-purple' : 'badge-neutral'} font-10">
                ${isKn ? 'ಕನ್ನಡ (KN)' : 'English (EN)'}
              </span>
              ${Utils.getPriorityBadge(c.priority)}
            </div>
          </div>

          <div class="complaint-card-body">
            <div class="flex-between align-start gap-2">
              <h3 class="complaint-card-title">${Utils.escapeHtml(displayTitle)}</h3>
              <button class="btn btn-outline btn-sm font-10 py-1 px-2" onclick="Citizen.toggleCardTranslation('${c.id}')" title="Toggle Kannada / English translation">
                ${isTranslated ? '🌐 Show Original' : '🌐 Translate / ಅನುವಾದಿಸಿ'}
              </button>
            </div>
            <p class="complaint-card-desc">${Utils.escapeHtml(displayDesc.substring(0, 140))}${displayDesc.length > 140 ? '...' : ''}</p>
            
            <div class="complaint-meta-grid">
              <div><span class="meta-label">Category:</span> <span class="meta-val">${c.category}</span></div>
              <div><span class="meta-label">Locality:</span> <span class="meta-val">${c.locality} (${c.ward})</span></div>
              <div><span class="meta-label">Submitted:</span> <span class="meta-val">${Utils.formatDate(c.submittedAt)}</span></div>
              <div><span class="meta-label">Assigned:</span> <span class="meta-val">${c.assignedOfficerName || 'Under Allocation'}</span></div>
            </div>

            <!-- Follow-up Milestone Box -->
            <div class="follow-up-card-banner mt-3 p-2 glass-card">
              <div class="flex-between font-11 mb-1">
                <span class="font-semibold text-cyan">⚡ Next Action:</span>
                <span class="text-slate-300">${Utils.escapeHtml(c.nextStep || 'Field verification')}</span>
              </div>
              <div class="flex-between font-11">
                <span class="text-muted">Target Follow-up:</span>
                <span class="${followUp.statusClass === 'overdue' ? 'text-danger font-bold' : 'text-slate-200'}">
                  ${Utils.formatDate(c.followUpDate || c.dueAt)}
                </span>
              </div>
            </div>

            <div class="sla-progress-box mt-2">
              <div class="flex-between font-11 mb-1">
                <span class="text-muted">Resolution Timeline</span>
                <span class="${sla.badgeClass}">${sla.text}</span>
              </div>
            </div>
          </div>

          <div class="complaint-card-footer">
            <div class="flex gap-2">
              <button class="btn btn-sm btn-primary" onclick="Citizen.trackComplaint('${c.id}')">
                ${Utils.getIcon('eye', 14)} Track Timeline
              </button>
              <button class="btn btn-sm btn-outline" onclick="Reports.printComplaintSlip('${c.id}')">
                ${Utils.getIcon('printer', 14)} Slip
              </button>
            </div>

            ${(c.status === 'Resolved' && !c.feedback) ? `
              <button class="btn btn-sm btn-success" onclick="Citizen.openFeedbackModal('${c.id}')">
                ${Utils.getIcon('star', 14)} Rate Resolution
              </button>
            ` : ''}

            ${(c.status === 'Resolved') ? `
              <button class="btn btn-sm btn-danger-outline" onclick="Citizen.openReopenModal('${c.id}')">
                ${Utils.getIcon('refresh', 14)} Reopen
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  resetFilters() {
    this.currentFilter = 'all';
    this.currentSearch = '';
    const searchInput = document.getElementById('citizen-complaint-search');
    const filterSelect = document.getElementById('citizen-complaint-filter');
    if (searchInput) searchInput.value = '';
    if (filterSelect) filterSelect.value = 'all';
    this.renderComplaintsList();
  },

  /**
   * Handle File Upload & Base64 preview
   */
  handleImageUpload(input) {
    const previewContainer = document.getElementById('complaint-image-preview-box');
    const previewImg = document.getElementById('complaint-preview-img');
    const hiddenUrlInput = document.getElementById('complaint-attachment-url');

    if (!input.files || !input.files[0]) return;
    const file = input.files[0];

    // File validation: Images only, max 5MB
    if (!file.type.startsWith('image/')) {
      Toast.error('Please upload an image file (PNG, JPG, JPEG).');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Toast.error('Image size must be less than 5 MB.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      if (previewImg && previewContainer && hiddenUrlInput) {
        previewImg.src = e.target.result;
        hiddenUrlInput.value = e.target.result;
        previewContainer.style.display = 'flex';
        Toast.success('Photo attachment loaded successfully.');
      }
    };
    reader.readAsDataURL(file);
  },

  /**
   * Physical Document / PDF / Scanned Petition Upload
   */
  handleDocumentUpload(input) {
    const docInfoBox = document.getElementById('complaint-doc-preview-box');
    const docNameSpan = document.getElementById('complaint-doc-name');
    const hiddenDocName = document.getElementById('complaint-document-name');

    if (!input.files || !input.files[0]) return;
    const file = input.files[0];

    if (file.size > 10 * 1024 * 1024) {
      Toast.error('Document file size must be less than 10 MB.');
      input.value = '';
      return;
    }

    if (docInfoBox && docNameSpan && hiddenDocName) {
      docNameSpan.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
      hiddenDocName.value = file.name;
      docInfoBox.style.display = 'flex';
      Toast.success(`Document attached: ${file.name}`);
    }
  },

  removeDocument() {
    const input = document.getElementById('complaint-doc-input');
    const docInfoBox = document.getElementById('complaint-doc-preview-box');
    const hiddenDocName = document.getElementById('complaint-document-name');

    if (input) input.value = '';
    if (hiddenDocName) hiddenDocName.value = '';
    if (docInfoBox) docInfoBox.style.display = 'none';
  },

  /**
   * Real-time Bilingual Language Detection in Submit Form
   */
  onGrievanceInputChange() {
    const title = document.getElementById('complaint-title')?.value || '';
    const desc = document.getElementById('complaint-desc')?.value || '';
    const badge = document.getElementById('complaint-detected-lang-badge');
    const combined = `${title} ${desc}`.trim();

    if (!badge) return;

    if (!combined) {
      badge.textContent = 'Auto-Detect (EN / KN)';
      badge.className = 'badge badge-neutral font-11';
      return;
    }

    const lang = Utils.detectLanguage(combined);
    if (lang === 'kn') {
      badge.textContent = '✓ ಕನ್ನಡ (Kannada Detected)';
      badge.className = 'badge badge-purple font-11 pulse';
    } else {
      badge.textContent = '✓ English Detected';
      badge.className = 'badge badge-info font-11';
    }
  },

  /**
   * 1-Click Translation Preview
   */
  previewTranslation() {
    const title = document.getElementById('complaint-title')?.value || '';
    const desc = document.getElementById('complaint-desc')?.value || '';
    const previewBox = document.getElementById('complaint-translation-preview');

    if (!title && !desc) {
      Toast.info('Please enter title or description first to preview translation.');
      return;
    }

    const lang = Utils.detectLanguage(`${title} ${desc}`);
    const targetLang = lang === 'kn' ? 'en' : 'kn';
    const transTitle = Utils.translateText(title, targetLang);
    const transDesc = Utils.translateText(desc, targetLang);

    if (previewBox) {
      previewBox.style.display = 'block';
      previewBox.innerHTML = `
        <div class="alert alert-purple p-3">
          <div class="flex-between mb-2">
            <strong>🌐 Bilingual Translation Preview (${targetLang === 'kn' ? 'Kannada / ಕನ್ನಡ' : 'English'})</strong>
            <button type="button" class="btn btn-outline btn-sm py-0 font-10" onclick="document.getElementById('complaint-translation-preview').style.display='none'">✕ Close</button>
          </div>
          <div class="font-12 mb-1"><strong>Title:</strong> ${Utils.escapeHtml(transTitle)}</div>
          <div class="font-12"><strong>Description:</strong> ${Utils.escapeHtml(transDesc)}</div>
        </div>
      `;
    }
  },

  removeAttachment() {
    const input = document.getElementById('complaint-file-input');
    const previewContainer = document.getElementById('complaint-image-preview-box');
    const hiddenUrlInput = document.getElementById('complaint-attachment-url');

    if (input) input.value = '';
    if (hiddenUrlInput) hiddenUrlInput.value = '';
    if (previewContainer) previewContainer.style.display = 'none';
  },

  /**
   * Handle category selection to show department SLA preview
   */
  onCategoryChange(category) {
    const deptInfoBox = document.getElementById('category-dept-hint');
    if (!deptInfoBox) return;

    if (!category) {
      deptInfoBox.innerHTML = '';
      return;
    }

    const dept = Complaints.suggestDepartment(category);
    if (dept) {
      deptInfoBox.innerHTML = `
        <div class="alert alert-info py-2 font-12">
          <strong>Routing Preview:</strong> Grievances under <em>"${category}"</em> are routed to the <strong>${dept.name}</strong> with a standard resolution commitment of <strong>${dept.serviceDays} business days</strong>.
        </div>
      `;
    }
  },

  /**
   * Open Complaint Tracking Dossier
   */
  trackComplaint(complaintId) {
    const complaint = Complaints.getById(complaintId);
    if (!complaint) {
      Toast.error(`No complaint found with ID: ${complaintId}`);
      return;
    }

    // Switch view to track page
    App.navigateTo('citizen-track');
    this.renderTrackingDetails(complaint);
  },

  renderTrackingDetails(c) {
    const container = document.getElementById('tracking-detail-container');
    if (!container) return;

    const sla = Utils.calculateSlaStatus(c.dueAt, c.status);
    const followUp = Utils.calculateFollowUpStatus(c);
    const isPolicePilot = ['DEP-CYB', 'DEP-ECO', 'DEP-LST', 'DEP-TRA', 'DEP-IND'].includes(c.departmentId);

    const isTranslated = !!this.trackingTranslationState[c.id];
    const displayTitle = isTranslated && c.translatedTitle ? c.translatedTitle : c.title;
    const displayDesc = isTranslated && c.translatedDescription ? c.translatedDescription : c.description;
    const isKn = c.language === 'kn';

    const steps = [
      { key: 'Submitted', label: 'Submitted' },
      { key: 'Under Review', label: 'Under Review' },
      { key: 'Assigned', label: 'Assigned' },
      { key: 'In Progress', label: 'In Progress' },
      { key: 'Waiting for Citizen', label: 'Waiting Info' },
      { key: 'Resolved', label: 'Resolved' },
      { key: 'Closed', label: 'Closed' }
    ];

    const currentStatusIdx = steps.findIndex(s => s.key === c.status);

    let timelineStepsHtml = steps.map((s, idx) => {
      let stepClass = 'pending';
      if (idx < currentStatusIdx) stepClass = 'completed';
      else if (idx === currentStatusIdx) stepClass = 'active';

      return `
        <div class="timeline-step ${stepClass}">
          <div class="step-circle">
            ${stepClass === 'completed' ? Utils.getIcon('check', 12) : idx + 1}
          </div>
          <div class="step-label">${s.label}</div>
        </div>
      `;
    }).join('');

    // Reopened banner if applicable
    let reopenedBanner = '';
    if (c.status === 'Reopened') {
      reopenedBanner = `
        <div class="alert alert-danger mb-4">
          <div class="flex-align-center gap-2">
            ${Utils.getIcon('alertTriangle', 20)}
            <div>
              <strong>Grievance Reopened:</strong> This complaint was flagged as unresolved by the citizen and escalated back to municipal supervisory officers.
            </div>
          </div>
        </div>
      `;
    }

    // Chronological history events
    let historyHtml = (c.history || []).map(h => `
      <div class="history-item">
        <div class="history-dot"></div>
        <div class="history-content">
          <div class="flex-between">
            <span class="history-actor font-semibold">${Utils.escapeHtml(h.actor)} (${h.role.toUpperCase()})</span>
            <span class="history-time text-muted font-11">${Utils.formatDateTime(h.timestamp)}</span>
          </div>
          <div class="history-action-pill mt-1">${h.action}</div>
          <div class="history-remarks mt-1">${Utils.escapeHtml(h.remarks || 'No remarks provided.')}</div>
        </div>
      </div>
    `).reverse().join('');

    container.innerHTML = `
      ${reopenedBanner}

      <!-- Follow-up & Reminder System Dossier Banner -->
      <div class="dossier-followup-banner mb-3 p-3 glass-panel">
        <div class="flex-between flex-wrap gap-2">
          <div class="flex-align-center gap-2">
            <span class="font-semibold text-cyan">Follow-up & Reminder System Tracker</span>
            ${isPolicePilot ? `<span class="badge badge-info font-11">🚨 Police Department Case</span>` : `<span class="badge badge-neutral font-11">🏛️ Civic Services</span>`}
          </div>
          <div class="flex-align-center gap-2">
            ${Utils.getChannelBadge(c.channel || 'Online Portal')}
            ${followUp.badgeHtml}
          </div>
        </div>
      </div>

      <div class="tracking-summary-card glass-panel mb-4">
        <div class="flex-between flex-wrap gap-3 pb-3 border-bottom">
          <div>
            <div class="flex-align-center gap-2 flex-wrap">
              <span class="tracking-id">${c.id}</span>
              ${Utils.getStatusBadge(c.status)}
              ${Utils.getPriorityBadge(c.priority)}
              <span class="badge ${isKn ? 'badge-purple' : 'badge-neutral'} font-11">
                ${isKn ? 'ಕನ್ನಡ (KN)' : 'English (EN)'}
              </span>
            </div>
            <div class="flex-align-center gap-2 mt-2">
              <h2 class="tracking-title m-0">${Utils.escapeHtml(displayTitle)}</h2>
              <button class="btn btn-outline btn-sm font-11 py-1 px-2" onclick="Citizen.toggleTrackingTranslation('${c.id}')">
                ${isTranslated ? '🌐 Show Original' : '🌐 Translate / ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ'}
              </button>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-outline btn-sm" onclick="Reports.printComplaintSlip('${c.id}')">
              ${Utils.getIcon('printer', 14)} Print Slip
            </button>
            ${c.status === 'Resolved' && !c.feedback ? `
              <button class="btn btn-success btn-sm" onclick="Citizen.openFeedbackModal('${c.id}')">
                ${Utils.getIcon('star', 14)} Rate Service
              </button>
            ` : ''}
            ${c.status === 'Resolved' ? `
              <button class="btn btn-danger-outline btn-sm" onclick="Citizen.openReopenModal('${c.id}')">
                ${Utils.getIcon('refresh', 14)} Reopen
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Visual Multi-Step Timeline -->
        <div class="timeline-stepper-container mt-4 mb-4">
          ${timelineStepsHtml}
        </div>

        <!-- Follow-up Accountability Radar Box -->
        <div class="p-3 mb-4 glass-card border-info">
          <div class="flex-between flex-wrap gap-2 border-bottom pb-2 mb-2">
            <span class="font-semibold text-cyan font-13">⚡ Active Follow-up & Reminder Status</span>
            <div>
              ${c.reminderAcknowledged 
                ? '<span class="badge badge-success">✓ Acknowledged by Desk</span>' 
                : '<span class="badge badge-warning">⏳ Pending Desk Acknowledgment</span>'}
              ${c.isUnattended 
                ? '<span class="badge badge-danger ml-1">⚠️ Unattended (>48h)</span>' 
                : ''}
            </div>
          </div>
          <div class="grid-2 gap-3 font-12">
            <div>
              <span class="text-muted d-block">Scheduled Next Operational Action:</span>
              <strong class="text-slate-100 font-13">${Utils.escapeHtml(c.nextStep || 'Preliminary assessment')}</strong>
            </div>
            <div>
              <span class="text-muted d-block">Follow-up Target Due:</span>
              <strong class="${followUp.statusClass === 'overdue' ? 'text-danger font-13' : 'text-slate-100 font-13'}">
                ${Utils.formatDateTime(c.followUpDate || c.dueAt)}
              </strong>
            </div>
          </div>
        </div>

        <!-- Detail Metrics Grid -->
        <div class="dossier-grid">
          <div class="dossier-item">
            <span class="dossier-label">Department</span>
            <span class="dossier-val font-semibold">${c.departmentId || 'Verification in progress'}</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-label">Assigned Officer</span>
            <span class="dossier-val font-semibold">${c.assignedOfficerName || 'Pending Allocation'}</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-label">Intake Channel</span>
            <span class="dossier-val font-semibold">${c.channel || 'Online Portal'}</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-label">Location & Ward</span>
            <span class="dossier-val">${c.locality}, ${c.ward}</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-label">Landmark</span>
            <span class="dossier-val">${c.landmark || 'None'}</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-label">Submitted On</span>
            <span class="dossier-val">${Utils.formatDateTime(c.submittedAt)}</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-label">SLA Target Due</span>
            <span class="dossier-val ${sla.isOverdue ? 'text-danger font-bold' : ''}">${Utils.formatDate(c.dueAt)} (${sla.text})</span>
          </div>
        </div>

        <div class="mt-3">
          <div class="flex-between">
            <span class="dossier-label">Full Problem Description</span>
            ${isTranslated ? '<span class="font-10 text-cyan">Translated View Active</span>' : ''}
          </div>
          <p class="mt-1 font-13 text-slate-200">${Utils.escapeHtml(displayDesc)}</p>
        </div>

        ${c.documentName ? `
          <div class="mt-3 p-2 glass-card font-12 flex-align-center gap-2">
            ${Utils.getIcon('fileText', 16)}
            <span>Attached Document / Physical Petition: <strong>${Utils.escapeHtml(c.documentName)}</strong></span>
          </div>
        ` : ''}

        ${c.attachmentUrl ? `
          <div class="mt-4 pt-3 border-top">
            <span class="dossier-label mb-2 d-block">Geo-Tagged Photo Evidence</span>
            <div class="tracking-image-box">
              <img src="${c.attachmentUrl}" alt="Evidence" class="evidence-thumb" onclick="Citizen.enlargeImage('${c.attachmentUrl}')"/>
              <span class="evidence-hint">Click image to enlarge</span>
            </div>
          </div>
        ` : ''}

        ${c.feedback ? `
          <div class="mt-4 p-3 glass-card border-success">
            <div class="flex-between">
              <span class="font-semibold text-emerald">Citizen Feedback Provided</span>
              <span class="text-warning font-14">${'★'.repeat(c.feedback.rating)}${'☆'.repeat(5 - c.feedback.rating)} (${c.feedback.rating}/5)</span>
            </div>
            <p class="font-12 text-slate-300 mt-1">"${Utils.escapeHtml(c.feedback.comment)}"</p>
            <span class="text-muted font-10">Recorded: ${Utils.formatDateTime(c.feedback.submittedAt)}</span>
          </div>
        ` : ''}
      </div>

      <!-- Chronological History Ledger -->
      <div class="glass-panel p-4">
        <h3 class="section-title mb-3">
          ${Utils.getIcon('clock', 18)} Chronological Redressal History
        </h3>
        <div class="history-timeline">
          ${historyHtml}
        </div>
      </div>
    `;
  },

  enlargeImage(url) {
    const modal = document.getElementById('modal-image-viewer');
    const img = document.getElementById('image-viewer-full');
    if (modal && img) {
      img.src = url;
      Modal.open('modal-image-viewer');
    }
  },

  /**
   * Modals for Feedback and Reopening
   */
  openFeedbackModal(complaintId) {
    const c = Complaints.getById(complaintId);
    if (!c) return;

    const inputId = document.getElementById('feedback-complaint-id');
    const labelId = document.getElementById('feedback-complaint-label');
    if (inputId) inputId.value = c.id;
    if (labelId) labelId.textContent = `${c.id}: ${c.title}`;

    // Reset stars
    Citizen.selectedRating = 5;
    Citizen.updateStarDisplay(5);

    Modal.open('modal-feedback');
  },

  selectedRating: 5,

  updateStarDisplay(rating) {
    this.selectedRating = rating;
    document.querySelectorAll('.star-rating-btn').forEach(btn => {
      const val = parseInt(btn.dataset.rating, 10);
      btn.classList.toggle('selected', val <= rating);
    });
  },

  openReopenModal(complaintId) {
    const c = Complaints.getById(complaintId);
    if (!c) return;

    const inputId = document.getElementById('reopen-complaint-id');
    const labelId = document.getElementById('reopen-complaint-label');
    if (inputId) inputId.value = c.id;
    if (labelId) labelId.textContent = `${c.id}: ${c.title}`;

    Modal.open('modal-reopen');
  },

  /**
   * Render Citizen Feedback queue & given reviews
   */
  renderFeedbackQueue() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const myComplaints = Complaints.getByCitizen(user.id);
    const resolvedOrClosed = myComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed');
    const container = document.getElementById('citizen-feedback-queue');
    if (!container) return;

    if (resolvedOrClosed.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon font-24">⭐</div>
          <p class="text-muted">No resolved grievances yet. Once an officer resolves your complaint, you can rate their service quality here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="flex-column gap-3">
        ${resolvedOrClosed.map(c => `
          <div class="p-3 glass-card flex-between flex-wrap gap-2">
            <div>
              <div class="flex-align-center gap-2">
                <strong class="text-cyan">${c.id}</strong>
                <span class="font-semibold">${Utils.escapeHtml(c.title)}</span>
                ${Utils.getStatusBadge(c.status)}
              </div>
              <div class="font-11 text-muted mt-1">
                Resolved by: <strong>${c.assignedOfficerName || 'Municipal Team'}</strong> • ${Utils.formatDate(c.resolvedAt || c.submittedAt)}
              </div>
              ${c.feedback ? `
                <div class="mt-2 text-warning font-13">
                  ${'★'.repeat(c.feedback.rating)}${'☆'.repeat(5 - c.feedback.rating)}
                  <span class="text-slate-300 font-12 italic ml-2">"${Utils.escapeHtml(c.feedback.comment)}"</span>
                </div>
              ` : ''}
            </div>

            <div>
              ${!c.feedback ? `
                <button class="btn btn-sm btn-success" onclick="Citizen.openFeedbackModal('${c.id}')">
                  ${Utils.getIcon('star', 14)} Submit 5-Star Rating
                </button>
              ` : `
                <button class="btn btn-sm btn-outline" onclick="Citizen.openFeedbackModal('${c.id}')">
                  Edit Rating
                </button>
              `}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Load Citizen Profile inputs
   */
  loadProfile() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const elName = document.getElementById('prof-cit-name');
    const elPhone = document.getElementById('prof-cit-phone');
    const elWard = document.getElementById('prof-cit-ward');
    const elLocality = document.getElementById('prof-cit-locality');

    if (elName) elName.value = user.name || '';
    if (elPhone) elPhone.value = user.phone || '';
    if (elWard) elWard.value = user.ward || 'Ward 04';
    if (elLocality) elLocality.value = user.locality || '';
  }
};

