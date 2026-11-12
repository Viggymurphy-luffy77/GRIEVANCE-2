/**
 * GrievanceTrack - Utilities & Helper Functions
 * Includes Toast notifications, Audio effects, Modal manager,
 * Kannada-English language translation & detection, SVG icons, and SLA/Follow-up calculators.
 */

const Utils = {
  // Web Audio synthesizer for offline micro-interactions
  playSound(type = 'click') {
    try {
      const settings = GTStorage.get(STORAGE_KEYS.SETTINGS) || {};
      if (settings.soundEnabled === false) return;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'click') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'alert' || type === 'reminder') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'error') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(180, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      // Audio autoplay policy may suppress without user gesture
    }
  },

  // Format date: "10 Nov 2026"
  formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  },

  // Format date & time: "10 Nov 2026, 08:30 PM"
  formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  },

  // Relative time: "2 hours ago", "Just now"
  getRelativeTime(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    return this.formatDate(dateStr);
  },

  /**
   * Detect Language (Kannada vs English)
   * Automatic Unicode range inspection for language identification
   */
  detectLanguage(text) {
    if (!text) return 'en';
    const knRegex = /[\u0C80-\u0CFF]/;
    return knRegex.test(text) ? 'kn' : 'en';
  },

  /**
   * Kannada-English Translation Engine
   * Provides bidirectional translation between Kannada and English for grievance terms & phrases
   */
  translateText(text, targetLang = 'en') {
    if (!text) return '';
    const isSourceKn = this.detectLanguage(text) === 'kn';

    if (targetLang === 'en' && !isSourceKn) return text;
    if (targetLang === 'kn' && isSourceKn) return text;

    // Translation lexicon mapping for civic & police grievance patterns
    const dictionary = [
      // Police Pilot Domain Terms
      { kn: 'ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಕಳೆದುಹೋದ ಮೊಬೈಲ್ ಮತ್ತು ದಾಖಲೆಗಳು', en: 'Lost Mobile Phone and Documents in Market' },
      { kn: 'ಬಸ್ ನಿಲ್ದಾಣದಲ್ಲಿ ಕಳೆದುಹೋದ ಲ್ಯಾಪ್‌ಟಾಪ್ ಬ್ಯಾಗ್', en: 'Laptop Bag Lost at Central Bus Stand' },
      { kn: 'ಆನ್‌ಲೈನ್ ಪಾವತಿ ವಂಚನೆ: ಖಾತೆಯಿಂದ ಹಣ ಅಕ್ರಮ ವರ್ಗಾವಣೆ', en: 'Online Payment Fraud: Illegal Money Transfer from Bank Account' },
      { kn: 'ಕೆವೈಸಿ ಅಪ್‌ಡೇಟ್ ಹೆಸರಿನಲ್ಲಿ ಬ್ಯಾಂಕ್ ಖಾತೆಯಿಂದ ₹45,000 ಅಕ್ರಮ ವರ್ಗಾವಣೆ', en: 'Illegal transfer of ₹45,000 from bank account under pretext of KYC update' },
      { kn: 'ವಾಟ್ಸಾಪ್ ಪ್ರೊಫೈಲ್ ದುರುಪಯೋಗ ಮತ್ತು ಆನ್‌ಲೈನ್ ಬೆದರಿಕೆ', en: 'WhatsApp Profile Impersonation and Online Extortion Threat' },
      { kn: 'ರಾತ್ರಿ ಸಮಯದಲ್ಲಿ ಅಕ್ರಮ ಧ್ವನಿವರ್ಧಕ ಗದ್ದಲ ಮತ್ತು ಕಿರುಕುಳ', en: 'Unauthorized Late-Night Loudspeaker Noise and Public Nuisance' },
      { kn: 'ಅಪಾಯಕಾರಿ ಬೈಕ್ ರೇಸಿಂಗ್ ಮತ್ತು ಶಾಲಾ ವಲಯದ ಸಂಚಾರ ನಿಯಮ ಉಲ್ಲಂಘನೆ', en: 'Dangerous Bike Racing and Traffic Violations in School Zone' },
      { kn: 'ಕಳೆದುಹೋದ ಮೊಬೈಲ್ ಫೋನ್', en: 'Lost Mobile Phone (CEIR Tracking)' },
      { kn: 'ಆನ್‌ಲೈನ್ ಹಣಕಾಸು ವಂಚನೆ', en: 'Online Financial Fraud' },
      { kn: 'ಸೈಬರ್ ಅಪರಾಧ ಮತ್ತು ಆನ್‌ಲೈನ್ ವಂಚನೆ', en: 'Cybercrime and online fraud' },
      { kn: 'ಹಣಕಾಸು ವಂಚನೆ', en: 'Financial fraud' },
      { kn: 'ಕಳೆದುಹೋದ ಆಸ್ತಿ', en: 'Lost property' },
      { kn: 'ಸಾರ್ವಜನಿಕ ಸುರಕ್ಷತೆ ಮತ್ತು ಸಂಚಾರ ದೂರುಗಳು', en: 'Public safety and traffic-related complaints' },
      { kn: 'ವ್ಯಕ್ತಿಗಳ ನಡುವಿನ ದೂರುಗಳು', en: 'Complaints involving individuals' },

      // Civic Domain Terms
      { kn: 'ಬೀದಿ ದೀಪ ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ', en: 'Streetlight outage / not working' },
      { kn: 'ಕುಡಿಯುವ ನೀರಿನ ಪೈಪ್‌ಲೈನ್ ಸೋರಿಕೆ', en: 'Drinking water pipeline rupture / leak' },
      { kn: 'ರಸ್ತೆಯಲ್ಲಿ ಅಪಾಯಕಾರಿ ಗುಂಡಿ', en: 'Deep hazardous potholes on road' },
      { kn: 'ಕಸ ಸಂಗ್ರಹಣೆ ಮಾಡಲಾಗಿಲ್ಲ', en: 'Garbage dump overflow / waste not collected' },
      { kn: 'ಒಳಚರಂಡಿ ಬ್ಲಾಕ್ ಆಗಿದೆ', en: 'Drainage blockage and sewage overflow' },
      { kn: 'ವಿದ್ಯುತ್ ತಂತಿ ಜೋತುಬಿದ್ದಿದೆ', en: 'Dangerous loose hanging electric wire' },

      // Statuses & Actions
      { kn: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ', en: 'In Progress' },
      { kn: 'ಪರಿಹರಿಸಲಾಗಿದೆ', en: 'Resolved' },
      { kn: 'ಮರುಪರಿಶೀಲನೆ', en: 'Under Review' },
      { kn: 'ನಿಯೋಜಿಸಲಾಗಿದೆ', en: 'Assigned' },
      { kn: 'ನಾಗರಿಕರ ಮಾಹಿತಿಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ', en: 'Waiting for Citizen' },
      { kn: 'ಮುಕ್ತಾಯಗೊಂಡಿದೆ', en: 'Closed' },
      { kn: 'ಮರುತೆರೆಯಲಾಗಿದೆ', en: 'Reopened' },
      { kn: 'ವಿಳಂಬವಾಗಿದೆ', en: 'Overdue' }
    ];

    if (targetLang === 'en') {
      // Kannada -> English
      for (const item of dictionary) {
        if (text.includes(item.kn)) {
          text = text.replaceAll(item.kn, item.en);
        }
      }
      // Contextual translation substitutions
      return text
        .replace(/ಕಳೆದುಹೋಗಿದೆ/g, 'is lost')
        .replace(/ವಂಚನೆ/g, 'fraud')
        .replace(/ದೂರು/g, 'complaint')
        .replace(/ಅಪಾಯಕಾರಿ/g, 'hazardous')
        .replace(/ಪರಿಶೀಲಿಸಲಾಗಿದೆ/g, 'inspected');
    } else {
      // English -> Kannada
      for (const item of dictionary) {
        if (text.toLowerCase().includes(item.en.toLowerCase())) {
          text = text.replaceAll(new RegExp(item.en, 'gi'), item.kn);
        }
      }
      return text
        .replace(/lost/gi, 'ಕಳೆದುಹೋಗಿದೆ')
        .replace(/fraud/gi, 'ವಂಚನೆ')
        .replace(/complaint/gi, 'ದೂರು')
        .replace(/resolved/gi, 'ಪರಿಹರಿಸಲಾಗಿದೆ');
    }
  },

  // Calculate SLA countdown status
  calculateSlaStatus(dueAtStr, status) {
    if (!dueAtStr || status === 'Resolved' || status === 'Closed') {
      return { isOverdue: false, text: status === 'Resolved' ? 'Resolved' : 'No Deadline', badgeClass: 'badge-neutral', hoursLeft: 999 };
    }

    const now = new Date();
    const due = new Date(dueAtStr);
    const diffMs = due - now;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHrs < 0) {
      const overdueHrs = Math.abs(diffHrs);
      const overdueDays = Math.floor(overdueHrs / 24);
      const text = overdueDays > 0 ? `Overdue by ${overdueDays}d ${overdueHrs % 24}h` : `Overdue by ${overdueHrs}h`;
      return {
        isOverdue: true,
        text,
        badgeClass: 'badge-danger pulse',
        hoursLeft: diffHrs
      };
    } else if (diffHrs <= 24) {
      return {
        isOverdue: false,
        text: `${diffHrs}h remaining (Due soon)`,
        badgeClass: 'badge-warning',
        hoursLeft: diffHrs
      };
    } else {
      const days = Math.floor(diffHrs / 24);
      return {
        isOverdue: false,
        text: `${days}d ${diffHrs % 24}h remaining`,
        badgeClass: 'badge-info',
        hoursLeft: diffHrs
      };
    }
  },

  // Calculate Follow-up countdown & radar status
  calculateFollowUpStatus(arg1, arg2) {
    let followUpDateStr = arg1;
    let status = arg2;
    let complaint = null;

    if (arg1 && typeof arg1 === 'object') {
      complaint = arg1;
      followUpDateStr = complaint.followUpDate || complaint.dueAt;
      status = complaint.status;
    }

    if (!followUpDateStr || status === 'Resolved' || status === 'Closed') {
      return { 
        isOverdue: false, 
        text: 'Follow-up Closed', 
        badgeClass: 'badge-neutral',
        statusClass: 'closed',
        badgeHtml: '<span class="badge badge-neutral font-10">✓ Follow-up Closed</span>' 
      };
    }

    const now = new Date();
    const fDate = new Date(followUpDateStr);

    if (isNaN(fDate.getTime())) {
      return {
        isOverdue: false,
        text: 'Follow-up Scheduled',
        badgeClass: 'badge-purple',
        statusClass: 'normal',
        badgeHtml: '<span class="badge badge-purple font-10">Follow-up Active</span>'
      };
    }

    const diffMs = fDate.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

    if (complaint && complaint.isUnattended) {
      return {
        isOverdue: true,
        text: 'Unattended (>48h)',
        badgeClass: 'badge-danger pulse',
        statusClass: 'overdue',
        badgeHtml: '<span class="badge badge-danger pulse font-10">⚠️ Unattended (>48h)</span>'
      };
    }

    if (diffHrs < 0) {
      const overdueHrs = Math.abs(diffHrs);
      const overdueDays = Math.floor(overdueHrs / 24);
      const txt = overdueDays > 0 ? `Follow-up ${overdueDays}d overdue` : `Follow-up ${overdueHrs}h overdue`;
      return {
        isOverdue: true,
        text: txt,
        badgeClass: 'badge-danger pulse',
        statusClass: 'overdue',
        badgeHtml: `<span class="badge badge-danger pulse font-10">${txt}</span>`
      };
    } else if (diffHrs <= 24) {
      const txt = `Follow-up due (${Math.max(1, diffHrs)}h)`;
      return {
        isOverdue: false,
        text: txt,
        badgeClass: 'badge-warning',
        statusClass: 'due-soon',
        badgeHtml: `<span class="badge badge-warning font-10">${txt}</span>`
      };
    } else {
      const days = Math.floor(diffHrs / 24);
      const txt = days > 0 ? `Next follow-up in ${days}d` : `Follow-up in ${diffHrs}h`;
      return {
        isOverdue: false,
        text: txt,
        badgeClass: 'badge-purple',
        statusClass: 'on-track',
        badgeHtml: `<span class="badge badge-purple font-10">${txt}</span>`
      };
    }
  },

  // Returns badge styling and color for complaint statuses
  getStatusBadge(status) {
    const map = {
      'Submitted': { class: 'status-submitted', label: 'Submitted', color: '#38bdf8' },
      'Under Review': { class: 'status-review', label: 'Under Review', color: '#0284c7' },
      'Assigned': { class: 'status-assigned', label: 'Assigned', color: '#818cf8' },
      'In Progress': { class: 'status-inprogress', label: 'In Progress', color: '#f59e0b' },
      'Waiting for Citizen': { class: 'status-waiting', label: 'Waiting for Citizen', color: '#ec4899' },
      'Resolved': { class: 'status-resolved', label: 'Resolved', color: '#10b981' },
      'Closed': { class: 'status-closed', label: 'Closed', color: '#64748b' },
      'Reopened': { class: 'status-reopened', label: 'Reopened', color: '#ef4444' }
    };
    const s = map[status] || { class: 'status-unknown', label: status, color: '#94a3b8' };
    return `<span class="badge ${s.class}"><span class="badge-dot"></span>${s.label}</span>`;
  },

  // Returns badge styling for priority
  getPriorityBadge(priority) {
    const map = {
      'Urgent': { class: 'priority-urgent', label: 'Urgent 🔥' },
      'High': { class: 'priority-high', label: 'High ⚡' },
      'Medium': { class: 'priority-medium', label: 'Medium' },
      'Low': { class: 'priority-low', label: 'Low' }
    };
    const p = map[priority] || { class: 'priority-medium', label: priority };
    return `<span class="badge ${p.class}">${p.label}</span>`;
  },

  // Returns badge for intake channel
  getChannelBadge(channel) {
    const map = {
      'Online Portal': { icon: '💻', class: 'badge-info', label: 'Online Portal' },
      'Document / Letter Upload': { icon: '📄', class: 'badge-purple', label: 'Physical Document' },
      'Helpline 112': { icon: '📞', class: 'badge-warning', label: 'Dial 112 Helpline' },
      'Email Desk': { icon: '✉️', class: 'badge-neutral', label: 'Email Desk' }
    };
    const c = map[channel] || { icon: '📋', class: 'badge-neutral', label: channel || 'Portal' };
    return `<span class="badge ${c.class} font-10">${c.icon} ${c.label}</span>`;
  },

  // Escape HTML to prevent accidental injection
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // SVG Icon repository (Lightweight & 100% offline)
  getIcon(name, size = 18, extraClass = '') {
    const icons = {
      dashboard: `<path d="M3 3h7v9H3V3zm11 0h7v5h-7V3zm0 9h7v9h-7v-9zM3 16h7v5H3v-5z"/>`,
      fileText: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>`,
      plusCircle: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>`,
      search: `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
      bell: `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,
      user: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
      users: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
      settings: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,
      logOut: `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`,
      alertCircle: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
      alertTriangle: `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
      checkCircle: `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`,
      clock: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
      star: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
      barChart: `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
      refresh: `<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>`,
      building: `<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="2"/><line x1="15" y1="22" x2="15" y2="2"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="17" x2="20" y2="17"/>`,
      download: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>`,
      printer: `<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>`,
      shield: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
      mapPin: `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>`,
      eye: `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
      edit: `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`,
      trash: `<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`,
      arrowRight: `<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>`,
      filter: `<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>`,
      help: `<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
      share: `<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>`,
      x: `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
      zap: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
      check: `<polyline points="20 6 9 17 4 12"/>`,
      badgePolice: `<path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 4.5l5 2.78v4.72c0 3.7-2.3 7.16-5 8.35-2.7-1.19-5-4.65-5-8.35V9.28l5-2.78z"/>`,
      translate: `<path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>`,
      calendar: `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`,
      checklist: `<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>`
    };

    const path = icons[name] || icons.alertCircle;
    return `<svg class="gt-icon ${extraClass}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  }
};

/**
 * Toast Notification System
 */
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show({ title, message, type = 'info', duration = 4000 }) {
    this.init();
    Utils.playSound(type === 'error' ? 'error' : (type === 'success' ? 'success' : 'click'));

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-in`;

    const iconMap = {
      success: 'checkCircle',
      error: 'alertCircle',
      warning: 'alertTriangle',
      info: 'bell'
    };

    toast.innerHTML = `
      <div class="toast-icon">
        ${Utils.getIcon(iconMap[type] || 'bell', 20)}
      </div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${Utils.escapeHtml(title)}</div>` : ''}
        <div class="toast-message">${Utils.escapeHtml(message)}</div>
      </div>
      <button class="toast-close" aria-label="Close">
        ${Utils.getIcon('x', 14)}
      </button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      toast.classList.add('animate-slide-out');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    };

    closeBtn.addEventListener('click', dismiss);
    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  },

  success(message, title = 'Success') {
    this.show({ title, message, type: 'success' });
  },

  error(message, title = 'Error') {
    this.show({ title, message, type: 'error' });
  },

  warning(message, title = 'Notice') {
    this.show({ title, message, type: 'warning' });
  },

  info(message, title = 'Information') {
    this.show({ title, message, type: 'info' });
  }
};

/**
 * Modal Dialog Controller
 */
const Modal = {
  open(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    Utils.playSound('click');

    // Auto-focus first input if exists
    const input = modal.querySelector('input, select, textarea');
    if (input) input.focus();
  },

  close(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('active');
    if (!document.querySelector('.modal-overlay.active')) {
      document.body.classList.remove('modal-open');
    }
    Utils.playSound('click');
  },

  closeAll() {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.classList.remove('modal-open');
  }
};

// Global escape key listener to close modals
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    Modal.closeAll();
  }
});

/**
 * Kannada & English Language Dictionary
 * Comprehensive Civic & Police Dictionary
 */
const I18N = {
  kn: {
    appName: 'ಗ್ರೀವೆನ್ಸ್ ಟ್ರ್ಯಾಕ್',
    appTagline: 'ಫಾಲೋ-ಅಪ್ ಮತ್ತು ಜ್ಞಾಪನೆ ವ್ಯವಸ್ಥೆ',
    motto: 'ಪ್ರತಿ ಫಾಲೋ-ಅಪ್‌ನಲ್ಲೂ ಹೊಣೆಗಾರಿಕೆ ನಿರ್ಮಾಣ - ಯಾವುದೇ ದೂರು ಗಮನಿಸದೆ ಉಳಿಯಬಾರದು',
    loginTitle: 'ಖಾತೆಗೆ ಲಾಗಿನ್ ಮಾಡಿ',
    roleCitizen: 'ನಾಗರಿಕ (Citizen)',
    roleOfficer: 'ಇಲಾಖಾ ಅಧಿಕಾರಿ (Officer)',
    roleAdmin: 'ಮೇಲ್ವಿಚಾರಕ / ಆಡಳಿತಾಧಿಕಾರಿ (Supervisor)',
    emailLabel: 'ಇಮೇಲ್ ವಿಳಾಸ',
    passwordLabel: 'ಗುಪ್ತಪದ (Password)',
    loginBtn: 'ಪ್ರವೇಶಿಸಿ',
    overview: 'ಅವಲೋಕನ (Overview)',
    submitGrievance: 'ದೂರು ನೋಂದಣಿ',
    myComplaints: 'ನನ್ನ ದೂರುಗಳು',
    trackComplaint: 'ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    notifications: 'ಸೂಚನೆಗಳು ಮತ್ತು ಜ್ಞಾಪನೆಗಳು',
    feedback: 'ಅಭಿಪ್ರಾಯ ಮತ್ತು ರೇಟಿಂಗ್',
    myProfile: 'ನನ್ನ ಪ್ರೊಫೈಲ್',
    logout: 'ಲಾಗ್ ಔಟ್',
    totalComplaints: 'ಒಟ್ಟು ದೂರುಗಳು',
    inProgress: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    resolved: 'ಪರಿಹರಿಸಲಾಗಿದೆ',
    actionNeeded: 'ಕ್ರಮ ಅಗತ್ಯವಿದೆ',
    assignedTo: 'ನಿಯೋಜಿತ ಅಧಿಕಾರಿ',
    priority: 'ಆದ್ಯತೆ',
    urgent: 'ತುರ್ತು',
    status: 'ಸ್ಥಿತಿ',
    followUpDue: 'ಮುಂದಿನ ಫಾಲೋ-ಅಪ್ ದಿನಾಂಕ',
    nextStep: 'ಮುಂದಿನ ಕ್ರಮ',
    reminders: 'ಜ್ಞಾಪನೆಗಳು',
    policePilot: 'ಪೊಲೀಸ್ ಇಲಾಖೆ ಸೇವೆಗಳು',
    civicServices: 'ನಾಗರಿಕ ಸೇವೆಗಳು',
    cybercrime: 'ಸೈಬರ್ ಅಪರಾಧ ಮತ್ತು ಆನ್‌ಲೈನ್ ವಂಚನೆ',
    financialFraud: 'ಹಣಕಾಸು ವಂಚನೆ',
    lostProperty: 'ಕಳೆದುಹೋದ ಆಸ್ತಿ / ಮೊಬೈಲ್',
    trafficSafety: 'ಸಾರ್ವಜನಿಕ ಸುರಕ್ಷತೆ ಮತ್ತು ಸಂಚಾರ ದೂರುಗಳು',
    individualDisputes: 'ವ್ಯಕ್ತಿಗಳ ನಡುವಿನ ದೂರುಗಳು',
    translateBtn: '🌐 ಇಂಗ್ಲಿಷ್‌ಗೆ ಅನುವಾದಿಸಿ',
    unattendedCases: '೪೮ ಗಂಟೆಗೂ ಹೆಚ್ಚು ಗಮನಿಸದ ದೂರುಗಳು',
    escalatedToAdmin: 'ಮೇಲ್ವಿಚಾರಕರಿಗೆ ರವಾನಿಸಲಾಗಿದೆ'
  },
  en: {
    appName: 'GrievanceTrack',
    appTagline: 'Follow-up and Reminder System for Grievance Tracking',
    motto: 'Build accountability into every follow-up — Ensuring no pending grievance goes unnoticed',
    loginTitle: 'Sign In to Your Account',
    roleCitizen: 'Citizen',
    roleOfficer: 'Department Officer',
    roleAdmin: 'Supervisor / Administrator',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    loginBtn: 'Sign In',
    overview: 'Overview',
    submitGrievance: 'Register Grievance',
    myComplaints: 'My Complaints',
    trackComplaint: 'Track Complaint',
    notifications: 'Notifications & Reminders',
    feedback: 'Feedback & Rating',
    myProfile: 'My Profile',
    logout: 'Logout',
    totalComplaints: 'Total Complaints',
    inProgress: 'In Progress',
    resolved: 'Resolved',
    actionNeeded: 'Action Needed',
    assignedTo: 'Assigned Officer',
    priority: 'Priority',
    urgent: 'Urgent',
    status: 'Status',
    followUpDue: 'Next Follow-up Due',
    nextStep: 'Next Action Step',
    reminders: 'Reminders',
    policePilot: 'Police Department Services',
    civicServices: 'Civic Municipal Services',
    cybercrime: 'Cybercrime and online fraud',
    financialFraud: 'Financial fraud',
    lostProperty: 'Lost property',
    trafficSafety: 'Public safety and traffic-related complaints',
    individualDisputes: 'Complaints involving individuals',
    translateBtn: '🌐 Translate to Kannada',
    unattendedCases: 'Unattended Cases (>48h Without Action)',
    escalatedToAdmin: 'Escalated to Supervisor'
  },

  getCurrentLang() {
    const settings = GTStorage.get(STORAGE_KEYS.SETTINGS) || {};
    return settings.language || 'en';
  },

  setLang(lang) {
    const settings = GTStorage.get(STORAGE_KEYS.SETTINGS) || {};
    settings.language = lang;
    GTStorage.set(STORAGE_KEYS.SETTINGS, settings);
    this.applyTranslations();
  },

  t(key) {
    const lang = this.getCurrentLang();
    return (this[lang] && this[lang][key]) || (this.en && this.en[key]) || key;
  },

  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });
  }
};
