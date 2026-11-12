/**
 * GrievanceTrack - Authentication & Role-Based Access Control
 * Powered by In-Browser Relational SQL Engine (SQL SELECT & INSERT)
 */

const DEMO_CREDENTIALS = {
  citizen: {
    email: 'citizen@grievancetrack.demo',
    password: 'Citizen@123',
    role: 'citizen',
    label: 'Citizen Portal',
    themeClass: 'theme-citizen'
  },
  officer: {
    email: 'officer@grievancetrack.demo',
    password: 'Officer@123',
    role: 'officer',
    label: 'Department Officer',
    themeClass: 'theme-officer'
  },
  admin: {
    email: 'admin@grievancetrack.demo',
    password: 'Admin@123',
    role: 'admin',
    label: 'Administrator Desk',
    themeClass: 'theme-admin'
  }
};

const Auth = {
  selectedRole: 'citizen',

  getCurrentUser() {
    return GTStorage.get(STORAGE_KEYS.CURRENT_USER);
  },

  setCurrentUser(user) {
    if (!user) {
      GTStorage.remove(STORAGE_KEYS.CURRENT_USER);
    } else {
      GTStorage.set(STORAGE_KEYS.CURRENT_USER, user);
    }
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  hasRole(allowedRoles) {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(user.role);
    }
    return user.role === allowedRoles;
  },

  /**
   * Auto-fill demo credentials when a role card is clicked
   */
  selectDemoRole(roleKey) {
    const cred = DEMO_CREDENTIALS[roleKey];
    if (!cred) return;
    this.selectedRole = roleKey;

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const submitBtn = document.getElementById('login-submit-btn');

    if (emailInput && passwordInput) {
      emailInput.value = cred.email;
      passwordInput.value = cred.password;

      // Visual flash animation
      emailInput.classList.add('flash-highlight');
      passwordInput.classList.add('flash-highlight');
      setTimeout(() => {
        emailInput.classList.remove('flash-highlight');
        passwordInput.classList.remove('flash-highlight');
      }, 500);
    }

    // Highlight selected demo card
    document.querySelectorAll('.demo-role-card').forEach(card => {
      card.classList.toggle('active', card.dataset.role === roleKey);
    });

    if (submitBtn) {
      submitBtn.innerHTML = `<span>Login as ${cred.label}</span> ${Utils.getIcon('arrowRight', 18)}`;
    }

    Utils.playSound('click');
  },

  /**
   * Validate credentials using genuine SQL SELECT query
   */
  login(email, password, remember = false) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      Toast.error('Please enter both email and password.');
      return false;
    }

    // Real SQL Query
    const userRow = DB.queryOne(
      "SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND password_hash = ? AND status = 'active'",
      [cleanEmail, cleanPassword]
    );

    if (!userRow) {
      // Check whether user exists or is deactivated
      const checkExists = DB.queryOne("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", [cleanEmail]);
      if (!checkExists) {
        Toast.error('No account found with this email. Please register or click a demo role card.');
      } else if (checkExists.status !== 'active') {
        Toast.error('This account has been deactivated by the municipal administrator.');
      } else {
        Toast.error('Invalid password. For demo accounts, click the role cards below.');
      }
      return false;
    }

    const user = {
      id: userRow.user_id,
      name: userRow.full_name,
      email: userRow.email,
      role: userRow.role,
      departmentId: userRow.dept_id,
      phone: userRow.phone,
      ward: userRow.ward_no,
      title: userRow.role === 'admin' ? 'Municipal Commissioner' : (userRow.role === 'officer' ? 'Station House Officer' : 'Citizen Resident'),
      avatar: userRow.role === 'citizen' ? '👤' : (userRow.role === 'officer' ? '👮‍♂️' : '🏛️')
    };

    // Save session
    this.setCurrentUser(user);

    // Record Audit Log via SQL INSERT
    DB.execute(
      "INSERT INTO audit_logs (user_id, role, action, description, created_at) VALUES (?, ?, 'USER_LOGIN', ?, ?)",
      [user.id, user.role, `Signed in successfully as ${user.role} (${user.email}).`, new Date().toISOString()]
    );

    Toast.success(`Welcome back, ${user.name}!`, 'Signed In');
    Utils.playSound('success');

    // Route to proper portal
    App.renderCurrentView();
    return true;
  },

  /**
   * End current session
   */
  logout() {
    const user = this.getCurrentUser();
    if (user) {
      try {
        DB.execute(
          "INSERT INTO audit_logs (user_id, role, action, description, created_at) VALUES (?, ?, 'USER_LOGOUT', ?, ?)",
          [user.id, user.role, `Logged out from portal session.`, new Date().toISOString()]
        );
      } catch (e) {
        console.warn('Audit log insert failed on logout:', e);
      }
    }

    if (typeof Modal !== 'undefined' && Modal.closeAll) {
      Modal.closeAll();
    }

    this.setCurrentUser(null);
    Toast.info('You have been logged out successfully.');
    Utils.playSound('click');
    App.renderCurrentView();
  },

  /**
   * Register a new citizen demo account via SQL INSERT
   */
  registerCitizen(formData) {
    const { name, email, password, phone, ward, locality } = formData || {};

    if (!name || !name.trim() || !email || !email.trim() || !password || !password.trim()) {
      Toast.error('Name, email, and password are required fields.');
      return false;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email using SQL SELECT
    const existing = DB.queryOne("SELECT user_id FROM users WHERE LOWER(email) = LOWER(?)", [cleanEmail]);
    if (existing) {
      Toast.error('An account with this email already exists. Please log in.');
      return false;
    }

    // Generate unique citizen ID
    const newId = `USR-CIT-${String(Date.now()).slice(-4)}`;
    const nowIso = new Date().toISOString();
    const wardValue = ward || 'Ward 01';

    // SQL INSERT INTO users table
    DB.execute(`
      INSERT INTO users (user_id, full_name, email, password_hash, role, phone, ward_no, status, created_at)
      VALUES (?, ?, ?, ?, 'citizen', ?, ?, 'active', ?)
    `, [newId, name.trim(), cleanEmail, password.trim(), phone ? phone.trim() : '+91 90000 00000', wardValue, nowIso]);

    DB.execute(`
      INSERT INTO audit_logs (user_id, role, action, description, created_at)
      VALUES (?, 'citizen', 'CITIZEN_REGISTER', ?, ?)
    `, [newId, `Registered new citizen profile for ${name.trim()}.`, nowIso]);

    // Close registration modal and reset inputs
    if (typeof Modal !== 'undefined') {
      Modal.close('modal-register');
    }
    const regName = document.getElementById('reg-name');
    const regEmail = document.getElementById('reg-email');
    const regPass = document.getElementById('reg-password');
    const regPhone = document.getElementById('reg-phone');
    const regLoc = document.getElementById('reg-locality');
    if (regName) regName.value = '';
    if (regEmail) regEmail.value = '';
    if (regPass) regPass.value = '';
    if (regPhone) regPhone.value = '';
    if (regLoc) regLoc.value = '';

    Toast.success('Registration successful! Logging into your citizen portal...');

    // Auto login
    this.login(cleanEmail, password.trim());
    return true;
  },

  /**
   * Password Recovery Simulation
   */
  simulateForgotPassword(email) {
    if (!email || !email.trim()) {
      Toast.error('Please enter your email address.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const user = DB.queryOne("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", [cleanEmail]);
    if (!user) {
      Toast.error('No account registered with this email address.');
      return;
    }
    if (typeof Modal !== 'undefined') {
      Modal.close('modal-forgot-password');
    }
    Toast.success(`Verification link & password reset guidance sent to ${cleanEmail}.`);
  },

  /**
   * Update User Profile via SQL UPDATE
   */
  updateProfile(userId, { name, phone, ward, password }) {
    const user = this.getCurrentUser();
    if (!user || user.id !== userId) return false;

    if (password && password.trim()) {
      DB.execute("UPDATE users SET full_name = ?, phone = ?, ward_no = ?, password_hash = ? WHERE user_id = ?",
        [name, phone, ward, password.trim(), userId]);
    } else {
      DB.execute("UPDATE users SET full_name = ?, phone = ?, ward_no = ? WHERE user_id = ?",
        [name, phone, ward, userId]);
    }

    user.name = name;
    user.phone = phone;
    user.ward = ward;
    this.setCurrentUser(user);
    Toast.success('Profile details successfully updated.');
    return true;
  }
};
