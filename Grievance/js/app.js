/**
 * GrievanceTrack - Main Application Orchestrator & Router
 * Manages view routing, live clock, themes, i18n Kannada toggle,
 * global search modal, demo scenario simulations, and bootstrap.
 */

const App = {
  currentView: 'login',

  async init() {
    // 1. Initialize Relational SQL Database & IndexedDB
    if (typeof DB !== 'undefined' && DB.init) {
      await DB.init();
    }

    // 2. Initialize local data
    SeedData.init();

    // 2. Apply theme & appearance settings
    this.applySettings();

    // 3. Start Live Topbar Clock
    this.startLiveClock();

    // 4. Set up global event listeners
    this.setupEventListeners();

    // 5. Initial notification counts
    Notifications.updateDomBadges();

    // 6. Automatic reminder check in background
    Reminders.runCheck(false);

    // 7. Render appropriate view
    this.renderCurrentView();

    console.log('GrievanceTrack Portal initialized successfully.');
  },

  /**
   * Apply Theme, Accent, Language & Density from storage
   */
  applySettings() {
    const settings = GTStorage.get(STORAGE_KEYS.SETTINGS) || SeedData.getInitialSettings();
    const body = document.body;

    // Theme: dark / light
    body.classList.toggle('light-theme', settings.theme === 'light');

    // Accent: cyan, purple, emerald, sunset
    body.classList.remove('accent-cyan', 'accent-purple', 'accent-emerald', 'accent-sunset');
    body.classList.add(`accent-${settings.accentColor || 'cyan'}`);

    // Table density: compact / comfortable
    body.classList.toggle('density-comfortable', settings.tableDensity === 'comfortable');

    // Apply translations
    I18N.applyTranslations();

    // Update form controls in settings page if visible
    const themeSelect = document.getElementById('setting-theme');
    const accentSelect = document.getElementById('setting-accent');
    const langSelect = document.getElementById('setting-lang');
    const densitySelect = document.getElementById('setting-density');
    const soundToggle = document.getElementById('setting-sound');

    if (themeSelect) themeSelect.value = settings.theme || 'dark';
    if (accentSelect) accentSelect.value = settings.accentColor || 'cyan';
    if (langSelect) langSelect.value = settings.language || 'en';
    if (densitySelect) densitySelect.value = settings.tableDensity || 'compact';
    if (soundToggle) soundToggle.checked = settings.soundEnabled !== false;
  },

  /**
   * Change Theme
   */
  setTheme(theme) {
    const settings = GTStorage.get(STORAGE_KEYS.SETTINGS) || {};
    settings.theme = theme;
    GTStorage.set(STORAGE_KEYS.SETTINGS, settings);
    this.applySettings();
    Toast.info(`Theme changed to ${theme} mode.`);
  },

  setAccentColor(color) {
    const settings = GTStorage.get(STORAGE_KEYS.SETTINGS) || {};
    settings.accentColor = color;
    GTStorage.set(STORAGE_KEYS.SETTINGS, settings);
    this.applySettings();
    Toast.info(`Accent color updated to ${color}.`);
  },

  toggleLanguage() {
    const current = I18N.getCurrentLang();
    const next = current === 'en' ? 'kn' : 'en';
    I18N.setLang(next);
    Toast.success(next === 'kn' ? 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ' : 'Language switched to English');
    this.updateLanguageButtonLabel();
  },

  updateLanguageButtonLabel() {
    const lang = I18N.getCurrentLang();
    document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
      btn.innerHTML = lang === 'en' ? '🌐 ಕನ್ನಡ' : '🌐 English';
    });
  },

  /**
   * Live Digital Clock
   */
  startLiveClock() {
    const clockEl = document.getElementById('live-clock-display');
    const update = () => {
      if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) + ' • ' + now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      }
    };
    update();
    setInterval(update, 1000);
  },

  /**
   * Render Main View based on login status and role
   */
  renderCurrentView() {
    const user = Auth.getCurrentUser();
    const loginSection = document.getElementById('section-login');
    const appSection = document.getElementById('section-app');

    if (!user) {
      if (loginSection) loginSection.style.display = 'flex';
      if (appSection) appSection.style.display = 'none';
      // Default to citizen demo role card
      Auth.selectDemoRole(Auth.selectedRole || 'citizen');
      return;
    }

    if (loginSection) loginSection.style.display = 'none';
    if (appSection) appSection.style.display = 'flex';

    // Update User Info in Topbar & Sidebar
    this.updateUserHeader(user);

    // Render Sidebars according to role
    this.renderSidebarForRole(user.role);

    // Route to default page for this role
    if (user.role === 'citizen') {
      this.navigateTo('citizen-overview');
    } else if (user.role === 'officer') {
      this.navigateTo('officer-overview');
    } else if (user.role === 'admin') {
      this.navigateTo('admin-overview');
    }
  },

  updateUserHeader(user) {
    const nameEl = document.getElementById('topbar-user-name');
    const roleBadge = document.getElementById('topbar-role-badge');
    const avatarEl = document.getElementById('topbar-user-avatar');

    if (nameEl) nameEl.textContent = user.name;
    if (avatarEl) avatarEl.textContent = user.avatar || '👤';

    if (roleBadge) {
      const roleMap = {
        citizen: { text: 'Citizen', class: 'role-citizen' },
        officer: { text: 'Officer', class: 'role-officer' },
        admin: { text: 'Administrator', class: 'role-admin' }
      };
      const r = roleMap[user.role] || { text: user.role, class: 'badge-info' };
      roleBadge.textContent = r.text;
      roleBadge.className = `badge font-11 ${r.class}`;
    }

    Notifications.updateDomBadges();
  },

  renderSidebarForRole(role) {
    document.querySelectorAll('.role-sidebar-menu').forEach(menu => {
      menu.style.display = 'none';
    });
    const activeMenu = document.getElementById(`sidebar-menu-${role}`);
    if (activeMenu) activeMenu.style.display = 'block';

    // Set accent class on sidebar
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) {
      sidebar.className = `sidebar role-${role}`;
    }

    if (role === 'officer') {
      Officer.updateSidebarBadges();
    }
  },

  /**
   * Navigate to a sub-panel/page
   */
  navigateTo(pageId) {
    if (pageId === 'login' || !Auth.getCurrentUser()) {
      this.renderCurrentView();
      return;
    }
    this.currentView = pageId;
    Utils.playSound('click');

    // Hide all view panels
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.style.display = 'none';
      panel.classList.remove('active');
    });

    // Show target panel
    const target = document.getElementById(`view-${pageId}`);
    if (target) {
      target.style.display = 'block';
      target.classList.add('active');
    }

    // Highlight sidebar active item
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === pageId);
    });

    // Trigger page-specific initializers
    this.onPageOpen(pageId);
  },

  onPageOpen(pageId) {
    if (pageId === 'citizen-overview') {
      Citizen.renderOverview();
    } else if (pageId === 'citizen-submit') {
      const dateEl = document.getElementById('complaint-date');
      if (dateEl && !dateEl.value) {
        dateEl.value = new Date().toISOString().split('T')[0];
      }
    } else if (pageId === 'citizen-complaints') {
      Citizen.renderComplaintsList();
    } else if (pageId === 'citizen-feedback') {
      Citizen.renderFeedbackQueue();
    } else if (pageId === 'citizen-profile') {
      Citizen.loadProfile();
    } else if (pageId === 'citizen-notifications' || pageId === 'officer-notifications' || pageId === 'admin-notifications') {
      this.renderNotificationsPage(pageId);
    } else if (pageId === 'officer-overview') {
      Officer.renderOverview();
    } else if (pageId === 'officer-assigned') {
      Officer.renderComplaintsList();
    } else if (pageId === 'officer-profile') {
      Officer.loadProfile();
    } else if (pageId === 'admin-overview') {
      Admin.renderOverview();
    } else if (pageId === 'admin-all-complaints') {
      Admin.renderAllComplaintsLedger();
    } else if (pageId === 'admin-unassigned') {
      Admin.renderUnassignedQueue();
    } else if (pageId === 'admin-escalations') {
      Admin.renderEscalationsDesk();
    } else if (pageId === 'admin-officers') {
      Admin.renderOfficersList();
    } else if (pageId === 'admin-citizens') {
      Admin.renderCitizensList();
    } else if (pageId === 'admin-departments') {
      Admin.renderDepartmentsList();
    } else if (pageId === 'admin-audit') {
      Admin.renderAuditLogs();
    } else if (pageId === 'admin-database') {
      Admin.renderDatabaseExplorer();
    } else if (pageId === 'admin-analytics') {
      Analytics.renderDashboard('all');
    }
  },

  renderNotificationsPage(pageId) {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const list = Notifications.getForUser(user);
    const container = document.getElementById(`${pageId}-list`);
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon">${Utils.getIcon('bell', 48)}</div>
          <h3>Inbox is Empty</h3>
          <p class="text-muted">You have no system notifications at this time.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(n => `
      <div class="notification-item-card glass-panel ${n.isRead ? 'read' : 'unread'}" onclick="App.handleNotificationClick('${n.id}', '${n.complaintId || ''}')">
        <div class="notif-indicator"></div>
        <div class="notif-body flex-1">
          <div class="flex-between">
            <h4 class="notif-card-title">${Utils.escapeHtml(n.title)}</h4>
            <span class="font-11 text-muted">${Utils.getRelativeTime(n.createdAt)}</span>
          </div>
          <p class="notif-card-msg font-12 text-slate-300 mt-1">${Utils.escapeHtml(n.message)}</p>
          ${n.complaintId ? `<div class="mt-2 font-11 text-cyan">Related Grievance: <strong>${n.complaintId}</strong> (Click to view)</div>` : ''}
        </div>
        <button class="btn-icon-subtle" onclick="event.stopPropagation(); Notifications.delete('${n.id}'); App.renderNotificationsPage('${pageId}');">
          ${Utils.getIcon('trash', 14)}
        </button>
      </div>
    `).join('');
  },

  handleNotificationClick(notifId, complaintId) {
    Notifications.markAsRead(notifId);
    if (complaintId) {
      const user = Auth.getCurrentUser();
      if (user.role === 'citizen') {
        Citizen.trackComplaint(complaintId);
      } else if (user.role === 'officer') {
        Officer.viewDossierModal(complaintId);
      } else {
        Admin.viewComplaintDetails(complaintId);
      }
    }
  },

  /**
   * Global Search (Ctrl + K)
   */
  openSearchModal() {
    const input = document.getElementById('global-search-input');
    if (input) input.value = '';
    this.renderSearchResults('');
    Modal.open('modal-global-search');
  },

  renderSearchResults(query) {
    const container = document.getElementById('global-search-results');
    if (!container) return;

    const q = (query || '').trim().toLowerCase();
    if (!q) {
      container.innerHTML = `
        <div class="p-4 text-center text-muted font-12">
          Type a Grievance ID (e.g. <em>GRV-26001</em>), title, category, officer, or locality to search...
        </div>
      `;
      return;
    }

    const complaints = Complaints.getAll();
    const matches = complaints.filter(c =>
      c.id.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.ward.toLowerCase().includes(q) ||
      (c.assignedOfficerName || '').toLowerCase().includes(q)
    ).slice(0, 8);

    if (matches.length === 0) {
      container.innerHTML = `<div class="p-3 text-center text-muted font-12">No grievances found matching "${Utils.escapeHtml(query)}"</div>`;
      return;
    }

    container.innerHTML = matches.map(c => `
      <div class="search-result-item" onclick="App.jumpToSearchResult('${c.id}')">
        <div class="flex-between">
          <strong class="text-cyan">${c.id}: ${Utils.escapeHtml(c.title)}</strong>
          ${Utils.getStatusBadge(c.status)}
        </div>
        <div class="font-11 text-muted mt-1">
          ${c.category} • ${c.ward} • Assigned: ${c.assignedOfficerName || 'None'}
        </div>
      </div>
    `).join('');
  },

  jumpToSearchResult(complaintId) {
    Modal.close('modal-global-search');
    const user = Auth.getCurrentUser();
    if (user.role === 'citizen') {
      Citizen.trackComplaint(complaintId);
    } else if (user.role === 'officer') {
      Officer.viewDossierModal(complaintId);
    } else {
      Admin.viewComplaintDetails(complaintId);
    }
  },

  /**
   * Demo Viva Simulations
   */
  simulateTimeJump(days = 3) {
    if (typeof DB !== 'undefined' && DB.execute) {
      const activeRows = DB.query("SELECT complaint_id, due_date FROM complaints WHERE status NOT IN ('Resolved', 'Closed') AND due_date IS NOT NULL");
      activeRows.forEach(r => {
        const d = new Date(r.due_date);
        d.setDate(d.getDate() - days);
        const newDue = d.toISOString().replace('T', ' ').substring(0, 19);
        DB.execute("UPDATE complaints SET due_date = ? WHERE complaint_id = ?", [newDue, r.complaint_id]);
      });
    }

    // Run reminder check
    const report = Reminders.runCheck(true);
    Toast.warning(`Simulated passage of ${days} days! Overdue check executed.`, 'Demo Time Jump');
  },

  simulateNewP1Case() {
    const p1 = {
      title: 'High-Voltage Transformer Sparking & Gas Leakage',
      category: 'Electricity',
      description: 'Public utility transformer #14 emitted a loud explosion and is actively billowing dense smoke near kindergarten school.',
      locality: 'Mailoor Cross Extension',
      ward: 'Ward 07',
      landmark: 'Near Govt Kannada Primary School',
      priority: 'Urgent',
      incidentDate: new Date().toISOString().split('T')[0]
    };

    const citizenRow = typeof DB !== 'undefined' ? DB.queryOne("SELECT * FROM users WHERE role = 'citizen'") : null;
    const citizen = citizenRow ? DB.mapUser(citizenRow) : null;
    const created = Complaints.submit(p1, citizen);

    if (created) {
      Toast.success(`Generated Urgent Complaint ${created.id}! Check Unassigned queue.`, 'Demo Scenario');
      if (this.currentView.startsWith('admin')) {
        Admin.renderOverview();
      }
    }
  },

  /**
   * Reset All Demo Data
   */
  async resetDemoDataConfirm() {
    if (confirm('Are you sure you want to restore the initial GrievanceTrack demo dataset? All newly added complaints and accounts will be reset.')) {
      if (typeof DB !== 'undefined') {
        await DB.reset();
      }
      SeedData.init(true);
      Toast.success('Demo data restored to pristine state.', 'Database Reset');
      setTimeout(() => {
        location.reload();
      }, 500);
    }
  },

  setupEventListeners() {
    // Keyboard shortcut Ctrl + K
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        App.openSearchModal();
      }
    });

    // Global Search typing
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        App.renderSearchResults(e.target.value);
      });
    }

    // Language toggle buttons
    this.updateLanguageButtonLabel();

    // Enhanced horizontal scroll handling for wide tables and content containers
    // Allows Shift+Wheel or mouse wheel over scrollable table containers to scroll smoothly left/right
    document.addEventListener('wheel', (e) => {
      const scrollable = e.target.closest('.table-responsive, .page-content');
      if (scrollable && scrollable.scrollWidth > scrollable.clientWidth) {
        if (e.shiftKey) {
          scrollable.scrollLeft += e.deltaY;
          e.preventDefault();
        }
      }
    }, { passive: false });
  }
};

// Window launch
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});

