/**
 * GrievanceTrack - Storage Layer
 * LocalStorage manager for lightweight UI preferences (theme, language, active session)
 * Relational data is managed by the In-Browser SQLite/Relational Engine (js/database.js).
 */

const STORAGE_KEYS = {
  CURRENT_USER: 'GT_CURRENT_USER_v3',
  SETTINGS: 'GT_SETTINGS_v3',
  THEME: 'GT_THEME_v3',
  LANGUAGE: 'GT_LANG_v3',
  INITIALIZED: 'GT_INITIALIZED_v3',
  USERS: 'GT_USERS_v3',
  DEPARTMENTS: 'GT_DEPARTMENTS_v3',
  COMPLAINTS: 'GT_COMPLAINTS_v3',
  AUDIT_LOGS: 'GT_AUDIT_LOGS_v3',
  NOTIFICATIONS: 'GT_NOTIFICATIONS_v3',
  FEEDBACK: 'GT_FEEDBACK_v3',
  REMINDERS: 'GT_REMINDERS_v3'
};

const GTStorage = {
  /**
   * Get parsed preference data from LocalStorage or delegate relational entities to DB
   */
  get(key, defaultValue = null) {
    try {
      // Delegate relational queries to DB layer when available
      if (key === STORAGE_KEYS.USERS && typeof DB !== 'undefined' && DB.getUsers) {
        return DB.getUsers();
      }
      if (key === STORAGE_KEYS.DEPARTMENTS && typeof DB !== 'undefined' && DB.getDepartments) {
        return DB.getDepartments();
      }
      if (key === STORAGE_KEYS.COMPLAINTS && typeof Complaints !== 'undefined' && Complaints.getAll) {
        return Complaints.getAll();
      }
      if (key === STORAGE_KEYS.AUDIT_LOGS && typeof Audit !== 'undefined' && Audit.getAll) {
        return Audit.getAll();
      }

      const item = localStorage.getItem(key);
      if (item === null || item === undefined) return defaultValue;
      return JSON.parse(item);
    } catch (e) {
      console.error(`Storage error reading ${key}:`, e);
      return defaultValue;
    }
  },

  /**
   * Save JSON serializable preference data to LocalStorage
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Storage error writing ${key}:`, e);
      return false;
    }
  },

  /**
   * Remove key from LocalStorage
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Storage error removing ${key}:`, e);
    }
  },

  isInitialized() {
    return !!localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  },

  /**
   * Reset database and session preferences
   */
  async resetToDefault() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      if (typeof DB !== 'undefined' && DB.reset) {
        await DB.reset();
      }
      return true;
    } catch (e) {
      console.error('Failed to reset database:', e);
      return false;
    }
  }
};
