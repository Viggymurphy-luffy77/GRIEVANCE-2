/**
 * GrievanceTrack - In-App Notification Center
 * Powered by In-Browser Relational SQL Engine (SELECT, INSERT, UPDATE, DELETE)
 */

const Notifications = {
  getAll() {
    return DB.query("SELECT * FROM notifications ORDER BY created_at DESC");
  },

  getForUser(user) {
    if (!user) return [];
    const rows = DB.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [user.id]
    );
    return rows.map(r => ({
      id: r.notif_id,
      recipientId: r.user_id,
      complaintId: r.complaint_id,
      type: r.type,
      message: r.message,
      isRead: !!r.is_read,
      createdAt: r.created_at
    }));
  },

  getUnreadCount(user) {
    if (!user) return 0;
    const res = DB.queryOne(
      "SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0",
      [user.id]
    );
    return res ? Number(res.unread_count) : 0;
  },

  create({ recipientId, complaintId = null, type = 'INFO', message }) {
    if (!recipientId) return false;
    const nowIso = new Date().toISOString();

    const res = DB.execute(`
      INSERT INTO notifications (user_id, complaint_id, type, message, is_read, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `, [recipientId, complaintId, type, message, nowIso]);

    this.updateDomBadges();
    return res;
  },

  markAsRead(id) {
    DB.execute("UPDATE notifications SET is_read = 1 WHERE notif_id = ?", [id]);
    this.updateDomBadges();
  },

  markAllAsRead(user) {
    if (!user) return;
    DB.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [user.id]);
    this.updateDomBadges();
    Toast.info('All notifications marked as read.');
  },

  clearAll(user) {
    if (!user) return;
    DB.execute("DELETE FROM notifications WHERE user_id = ?", [user.id]);
    this.updateDomBadges();
    Toast.info('Notification inbox cleared.');
  },

  updateDomBadges() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const unread = this.getUnreadCount(user);
    const badges = document.querySelectorAll('.unread-count-badge');
    badges.forEach(b => {
      b.textContent = unread;
      b.style.display = unread > 0 ? 'inline-block' : 'none';
    });
  }
};
