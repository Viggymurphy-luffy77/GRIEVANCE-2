/**
 * GrievanceTrack - Initial Seed Data & Demo Profiles
 * "Follow-up and Reminder System for Grievance Tracking"
 * Features Police Department Pilot + Civic Public Works + Bilingual Kannada-English support.
 */

const SeedData = {
  // Sample SVG Attachment generator for realistic offline image/document preview
  createSampleSvg(label, color = '#3b82f6', isDocument = false) {
    const icon = isDocument
      ? `<rect x="180" y="70" width="40" height="55" rx="4" fill="none" stroke="${color}" stroke-width="2"/>
         <line x1="188" y1="85" x2="212" y2="85" stroke="${color}" stroke-width="2"/>
         <line x1="188" y1="95" x2="212" y2="95" stroke="${color}" stroke-width="2"/>
         <line x1="188" y1="105" x2="204" y2="105" stroke="${color}" stroke-width="2"/>`
      : `<circle cx="200" cy="95" r="35" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="2"/>
         <path d="M188 95 L196 103 L212 87" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" rx="10" fill="url(#g)" stroke="${color}" stroke-width="2" stroke-dasharray="6,4"/>
      ${icon}
      <text x="200" y="160" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle">${label}</text>
      <text x="200" y="185" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">GrievanceTrack Verified Attachment</text>
      <text x="200" y="206" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">Digital Chain of Custody Verified</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  },

  getInitialDepartments() {
    return [
      // 1. Police Department Units
      {
        id: 'DEP-CYB',
        name: 'Cybercrime & Online Fraud Cell',
        code: 'CYB',
        serviceDays: 2,
        domain: 'police',
        head: 'Insp. Sneha Patil',
        categories: ['Cybercrime and online fraud', 'Online Financial Fraud', 'Identity Theft & Phishing', 'Social Media Harassment'],
        active: true,
        description: 'Investigation of online financial scams, phishing URLs, UPI fraud, and cyber extortion.'
      },
      {
        id: 'DEP-ECO',
        name: 'Economic Offences & Financial Fraud',
        code: 'ECO',
        serviceDays: 3,
        domain: 'police',
        head: 'DSP Ramesh Hegde',
        categories: ['Financial fraud', 'Banking & OTP Scams', 'Investment Fraud', 'Cheating & Forgery'],
        active: true,
        description: 'Bank liaison, account freeze coordination, forged instruments, and non-cyber economic fraud.'
      },
      {
        id: 'DEP-LST',
        name: 'Lost Property & Missing Article Bureau',
        code: 'LST',
        serviceDays: 1,
        domain: 'police',
        head: 'SI Mahesh K.',
        categories: ['Lost property', 'Missing Mobile Phone (CEIR Tracking)', 'Lost Wallet / Important ID Documents', 'Lost Vehicle Key / Valuables'],
        active: true,
        description: 'Digital e-lost report generation, CEIR IMEI blocking assistance, and lost article verification.'
      },
      {
        id: 'DEP-TRA',
        name: 'Public Safety & Traffic Division',
        code: 'TRA',
        serviceDays: 2,
        domain: 'police',
        head: 'Insp. Mohammed Farhan',
        categories: ['Public safety and traffic-related complaints', 'Dangerous Driving & Road Rage', 'Traffic Signal Blackspots', 'Unauthorized Parking Obstruction'],
        active: true,
        description: 'Traffic violation reviews, blackspot safety interventions, traffic calming, and pedestrian safety.'
      },
      {
        id: 'DEP-IND',
        name: 'Law & Order / Individual Disputes',
        code: 'IND',
        serviceDays: 3,
        domain: 'police',
        head: 'SI Suresh Biradar',
        categories: ['Complaints involving individuals', 'Public Nuisance & Neighborhood Disputes', 'Verbal Threat & Intimidation', 'Noise Pollution / Night Disturbance'],
        active: true,
        description: 'Civilian dispute mediation, non-cognizable inquiry tracking, and neighborhood peace keeping.'
      },

      // 2. Civic & Municipal Divisions (Public Utilities)
      {
        id: 'DEP-ELE',
        name: 'Electrical & Streetlighting',
        code: 'ELE',
        serviceDays: 2,
        domain: 'civic',
        head: 'Eng. S. Biradar',
        categories: ['Streetlights', 'Electricity', 'Transformer Sparking'],
        active: true,
        description: 'Streetlight maintenance, faulty poles, cable faults, low voltage issues.'
      },
      {
        id: 'DEP-WAT',
        name: 'Water Supply & Drainage',
        code: 'WAT',
        serviceDays: 3,
        domain: 'civic',
        head: 'Anand Kulkarni',
        categories: ['Water Supply', 'Drainage', 'Pipe Leakage'],
        active: true,
        description: 'Potable water supply irregularities, pipeline bursts, underground drainage clogging.'
      },
      {
        id: 'DEP-ROA',
        name: 'Roads & Infrastructure',
        code: 'ROA',
        serviceDays: 5,
        domain: 'civic',
        head: 'Mohammed Farhan',
        categories: ['Road Repair', 'Potholes', 'Footpath Repair', 'Bridges'],
        active: true,
        description: 'Asphalt paving, pothole filling, pedestrian footpath restoration, road cave-ins.'
      },
      {
        id: 'DEP-SAN',
        name: 'Public Health & Sanitation',
        code: 'SAN',
        serviceDays: 1,
        domain: 'civic',
        head: 'Pooja Shinde',
        categories: ['Garbage Collection', 'Sanitation', 'Public Toilet Maintenance'],
        active: true,
        description: 'Daily waste collection, open dump clearing, vector control, and public hygiene.'
      }
    ];
  },

  getInitialUsers() {
    return [
      // 1 Administrator / Supervisory Authority
      {
        id: 'USR-ADM-001',
        name: 'Dr. Rajeshwar Patil',
        email: 'admin@grievancetrack.demo',
        password: 'Admin@123',
        role: 'admin',
        title: 'Supervisory Officer & Commissioner',
        departmentId: null,
        phone: '+91 98765 43210',
        ward: 'District Central Command HQ',
        active: true,
        avatar: '👨‍💼',
        createdAt: '2026-01-10T09:00:00Z'
      },

      // Department Officers (Police Pilot & Civic Wings)
      {
        id: 'USR-OFF-001',
        name: 'SI Suresh Biradar',
        email: 'officer@grievancetrack.demo',
        password: 'Officer@123',
        role: 'officer',
        title: 'Station House Officer (Law & Order)',
        departmentId: 'DEP-IND',
        phone: '+91 94481 23456',
        ward: 'Division 1 (North Police Station)',
        active: true,
        avatar: '👮‍♂️',
        createdAt: '2026-01-12T10:30:00Z'
      },
      {
        id: 'USR-OFF-002',
        name: 'Insp. Sneha Patil',
        email: 'officer.cyber@grievancetrack.demo',
        password: 'Officer@123',
        role: 'officer',
        title: 'Inspector (Cybercrime & Financial Fraud)',
        departmentId: 'DEP-CYB',
        phone: '+91 94482 44556',
        ward: 'Central Cyber Cell',
        active: true,
        avatar: '💻',
        createdAt: '2026-01-13T09:15:00Z'
      },
      {
        id: 'USR-OFF-003',
        name: 'Insp. Mohammed Farhan',
        email: 'officer.traffic@grievancetrack.demo',
        password: 'Officer@123',
        role: 'officer',
        title: 'Traffic & Road Safety Inspector',
        departmentId: 'DEP-TRA',
        phone: '+91 94483 55667',
        ward: 'City Traffic Wing',
        active: true,
        avatar: '🚦',
        createdAt: '2026-01-14T11:20:00Z'
      },
      {
        id: 'USR-OFF-004',
        name: 'Anand Kulkarni',
        email: 'officer.water@grievancetrack.demo',
        password: 'Officer@123',
        role: 'officer',
        title: 'Executive Engineer (Water Supply & Drainage)',
        departmentId: 'DEP-WAT',
        phone: '+91 94484 34567',
        ward: 'Division 2 (Civic Works)',
        active: true,
        avatar: '💧',
        createdAt: '2026-01-15T08:45:00Z'
      },
      {
        id: 'USR-OFF-005',
        name: 'Pooja Shinde',
        email: 'officer.sanitation@grievancetrack.demo',
        password: 'Officer@123',
        role: 'officer',
        title: 'Chief Health & Sanitation Inspector',
        departmentId: 'DEP-SAN',
        phone: '+91 94485 45678',
        ward: 'City-wide Sanitation Squad',
        active: true,
        avatar: '🧹',
        createdAt: '2026-01-16T14:20:00Z'
      },

      // Registered Citizens
      {
        id: 'USR-CIT-001',
        name: 'Rahul Sharma',
        email: 'citizen@grievancetrack.demo',
        password: 'Citizen@123',
        role: 'citizen',
        title: 'Resident Citizen',
        departmentId: null,
        phone: '+91 91234 56789',
        ward: 'Ward 04',
        locality: 'Gandhi Gunj Main Market',
        active: true,
        avatar: '🧑‍💻',
        createdAt: '2026-02-01T10:00:00Z'
      },
      {
        id: 'USR-CIT-002',
        name: 'Priya Kamble',
        email: 'priya.k@grievancetrack.demo',
        password: 'Citizen@123',
        role: 'citizen',
        title: 'Resident Citizen',
        departmentId: null,
        phone: '+91 98450 11223',
        ward: 'Ward 08',
        locality: 'Mohan Market Complex',
        active: true,
        avatar: '👩‍💼',
        createdAt: '2026-02-03T11:15:00Z'
      },
      {
        id: 'USR-CIT-003',
        name: 'Basavaraj Malipatil',
        email: 'basavaraj.m@grievancetrack.demo',
        password: 'Citizen@123',
        role: 'citizen',
        title: 'Resident Citizen (ಕನ್ನಡ ದೂರುದಾರ)',
        departmentId: null,
        phone: '+91 94480 33445',
        ward: 'Ward 02',
        locality: 'Shivnagar Colony',
        active: true,
        avatar: '👨‍🌾',
        createdAt: '2026-02-04T12:00:00Z'
      },
      {
        id: 'USR-CIT-004',
        name: 'Fatima Zahra',
        email: 'fatima.z@grievancetrack.demo',
        password: 'Citizen@123',
        role: 'citizen',
        title: 'Resident Citizen',
        departmentId: null,
        phone: '+91 97410 55667',
        ward: 'Ward 11',
        locality: 'Naubad Industrial Area',
        active: true,
        avatar: '👩‍🔬',
        createdAt: '2026-02-06T15:30:00Z'
      },
      {
        id: 'USR-CIT-005',
        name: 'Deepa Nayak',
        email: 'deepa.n@grievancetrack.demo',
        password: 'Citizen@123',
        role: 'citizen',
        title: 'Resident Citizen (ಕನ್ನಡ ದೂರುದಾರ)',
        departmentId: null,
        phone: '+91 96112 88990',
        ward: 'Ward 03',
        locality: 'Pratap Nagar Layout',
        active: true,
        avatar: '👩‍🎨',
        createdAt: '2026-02-10T14:10:00Z'
      }
    ];
  },

  getInitialComplaints() {
    const now = new Date('2026-11-10T18:00:00Z');

    const daysAgo = (days, hours = 0) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      d.setHours(d.getHours() - hours);
      return d.toISOString();
    };

    const daysFromNow = (days, hours = 0) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      d.setHours(d.getHours() + hours);
      return d.toISOString();
    };

    return [
      // 1. Police Pilot: Cybercrime & Online Fraud (In Progress, Next Step Defined)
      {
        id: 'GRV-26001',
        title: 'Fake Electricity Bill Payment Link - ₹18,500 Phishing Fraud',
        category: 'Cybercrime and online fraud',
        description: 'Received SMS claiming electricity will be disconnected tonight. Clicked the APK link, and ₹18,500 was unauthorizedly debited to a merchant account.',
        language: 'en',
        translatedTitle: 'ನಕಲಿ ವಿದ್ಯುತ್ ಬಿಲ್ ಪಾವತಿ ಲಿಂಕ್ - ₹18,500 ಫಿಶಿಂಗ್ ವಂಚನೆ',
        translatedDescription: 'ವಿದ್ಯುತ್ ಕಡಿತಗೊಳ್ಳಲಿದೆ ಎಂದು SMS ಬಂದಿದೆ. APK ಲಿಂಕ್ ಕ್ಲಿಕ್ ಮಾಡಿದಾಗ ₹18,500 ಅನಧಿಕೃತವಾಗಿ ವರ್ಗಾವಣೆಯಾಗಿದೆ.',
        channel: 'Online Portal',
        locality: 'Gandhi Gunj Main Road',
        ward: 'Ward 04',
        landmark: 'Near Syndicate Bank Branch',
        priority: 'Urgent',
        incidentDate: '2026-11-08',
        status: 'In Progress',
        citizenId: 'USR-CIT-001',
        citizenName: 'Rahul Sharma',
        citizenPhone: '+91 91234 56789',
        departmentId: 'DEP-CYB',
        assignedTo: 'USR-OFF-002',
        assignedOfficerName: 'Insp. Sneha Patil',
        submittedAt: daysAgo(2, 4),
        assignedAt: daysAgo(2, 1),
        dueAt: daysFromNow(1, 0),
        followUpDate: daysFromNow(0, 8), // Today evening
        nextStep: 'Liaise with Nodal Cyber Cell to freeze beneficiary mule account',
        daysPendingWithoutAction: 0,
        unattendedAlert: false,
        isOverdue: false,
        remindersCount: 0,
        lastReminderSentAt: null,
        attachmentUrl: this.createSampleSvg('Bank SMS & Debited UTR Proof', '#06b6d4', true),
        history: [
          {
            id: 'HIST-001',
            timestamp: daysAgo(2, 4),
            actor: 'Rahul Sharma',
            role: 'citizen',
            action: 'SUBMITTED',
            fromStatus: null,
            toStatus: 'Submitted',
            remarks: 'Grievance lodged online with transaction screenshot attachment.'
          },
          {
            id: 'HIST-002',
            timestamp: daysAgo(2, 1),
            actor: 'Dr. Rajeshwar Patil',
            role: 'admin',
            action: 'ASSIGNED',
            fromStatus: 'Submitted',
            toStatus: 'Assigned',
            remarks: 'Assigned to Cybercrime Inspector Sneha Patil. Priority set to Urgent.'
          },
          {
            id: 'HIST-003',
            timestamp: daysAgo(1, 0),
            actor: 'Insp. Sneha Patil',
            role: 'officer',
            action: 'IN_PROGRESS',
            fromStatus: 'Assigned',
            toStatus: 'In Progress',
            remarks: 'Formal requisition sent to Payment Gateway nodal officer for transaction trace.'
          }
        ],
        feedback: null
      },

      // 2. Police Pilot: Lost Property in Kannada (Resolved with e-Lost Slip & CEIR coordination)
      {
        id: 'GRV-26002',
        title: 'ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಕಳೆದುಹೋದ ಮೊಬೈಲ್ ಮತ್ತು ದಾಖಲೆಗಳು',
        category: 'Lost property',
        description: 'ಗಾಂಧಿ ಗಂಜ್ ಸಂತೆ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ನನ್ನ ಸ್ಯಾಮ್‌ಸಂಗ್ ಮೊಬೈಲ್ ಫೋನ್ (IMEI: 864201048291024) ಮತ್ತು ಆಧಾರ್ ಕಾರ್ಡ್ ಒಳಗೊಂಡ ಪರ್ಸ್ ಕಳೆದುಹೋಗಿದೆ.',
        language: 'kn',
        translatedTitle: 'Lost Mobile Phone and Documents in Market',
        translatedDescription: 'Lost my Samsung mobile phone (IMEI: 864201048291024) and purse containing Aadhaar card at Gandhi Gunj weekly market.',
        channel: 'Document / Letter Upload',
        locality: 'Gandhi Gunj Market',
        ward: 'Ward 04',
        landmark: 'Near Vegetable Shed #2',
        priority: 'High',
        incidentDate: '2026-11-06',
        status: 'Resolved',
        citizenId: 'USR-CIT-003',
        citizenName: 'Basavaraj Malipatil',
        citizenPhone: '+91 94480 33445',
        departmentId: 'DEP-LST',
        assignedTo: 'USR-OFF-001',
        assignedOfficerName: 'SI Suresh Biradar',
        submittedAt: daysAgo(4, 2),
        assignedAt: daysAgo(4, 0),
        dueAt: daysAgo(2, 0),
        resolvedAt: daysAgo(1, 3),
        followUpDate: null,
        nextStep: 'Case closed - Official Digitally Signed e-Lost Certificate issued to citizen for SIM reissue',
        daysPendingWithoutAction: 0,
        unattendedAlert: false,
        isOverdue: false,
        remindersCount: 0,
        lastReminderSentAt: null,
        attachmentUrl: this.createSampleSvg('Mobile IMEI Bill Copy', '#10b981', true),
        history: [
          {
            id: 'HIST-004',
            timestamp: daysAgo(4, 2),
            actor: 'Basavaraj Malipatil',
            role: 'citizen',
            action: 'SUBMITTED',
            fromStatus: null,
            toStatus: 'Submitted',
            remarks: 'ದೂರು ದಾಖಲಿಸಲಾಗಿದೆ (Complaint submitted in Kannada).'
          },
          {
            id: 'HIST-005',
            timestamp: daysAgo(4, 0),
            actor: 'Dr. Rajeshwar Patil',
            role: 'admin',
            action: 'ASSIGNED',
            fromStatus: 'Submitted',
            toStatus: 'Assigned',
            remarks: 'Assigned to Lost Property Desk.'
          },
          {
            id: 'HIST-006',
            timestamp: daysAgo(1, 3),
            actor: 'SI Suresh Biradar',
            role: 'officer',
            action: 'RESOLVED',
            fromStatus: 'In Progress',
            toStatus: 'Resolved',
            remarks: 'CEIR portal IMEI blocking initiated. Digitally signed e-Lost acknowledgement issued.'
          }
        ],
        feedback: {
          rating: 5,
          comment: 'ತ್ವರಿತವಾಗಿ ಇ-ಲಾಸ್ಟ್ ಸರ್ಟಿಫಿಕೇಟ್ ನೀಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ಹೊಸ ಸಿಮ್ ಪಡೆಯಲು ಸುಲಭವಾಯಿತು.',
          submittedAt: daysAgo(0, 18)
        }
      },

      // 3. Police Pilot: Financial Fraud in Kannada (Unattended > 48h -> Overdue Follow-up Notice!)
      {
        id: 'GRV-26003',
        title: 'ಕೆವೈಸಿ ಅಪ್‌ಡೇಟ್ ಹೆಸರಿನಲ್ಲಿ ಬ್ಯಾಂಕ್ ಖಾತೆಯಿಂದ ₹45,000 ಅಕ್ರಮ ವರ್ಗಾವಣೆ',
        category: 'Financial fraud',
        description: 'ಬ್ಯಾಂಕ್ ಮ್ಯಾನೇಜರ್ ಎಂದು ಹೇಳಿ ಕರೆ ಮಾಡಿದ ವ್ಯಕ್ತಿಗೆ OTP ನೀಡಿದ ನಂತರ ₹45,000 ಹಣ ಕಡಿತಗೊಂಡಿದೆ. ದಯವಿಟ್ಟು ಹಣ ತಡೆಹಿಡಿಯಲು ಸಹಾಯ ಮಾಡಿ.',
        language: 'kn',
        translatedTitle: 'Illegal transfer of ₹45,000 from bank account under pretext of KYC update',
        translatedDescription: 'Received call claiming to be bank manager. After sharing OTP, ₹45,000 was debited. Please freeze the recipient account.',
        channel: 'Helpline 112',
        locality: 'Pratap Nagar Layout',
        ward: 'Ward 03',
        landmark: 'Near Water Booster Station',
        priority: 'Urgent',
        incidentDate: '2026-11-05',
        status: 'In Progress',
        citizenId: 'USR-CIT-005',
        citizenName: 'Deepa Nayak',
        citizenPhone: '+91 96112 88990',
        departmentId: 'DEP-CYB',
        assignedTo: 'USR-OFF-002',
        assignedOfficerName: 'Insp. Sneha Patil',
        submittedAt: daysAgo(5, 4),
        assignedAt: daysAgo(5, 0),
        dueAt: daysAgo(2, 0), // Breached target SLA!
        followUpDate: daysAgo(1, 0), // Follow-up was due yesterday!
        nextStep: 'Urgent: Issue Section 91 notice to intermediary payment aggregator',
        daysPendingWithoutAction: 3,
        unattendedAlert: true,
        isOverdue: true,
        remindersCount: 2,
        lastReminderSentAt: daysAgo(0, 10),
        attachmentUrl: this.createSampleSvg('Passbook Bank Statement', '#ef4444', true),
        history: [
          {
            id: 'HIST-007',
            timestamp: daysAgo(5, 4),
            actor: 'Deepa Nayak',
            role: 'citizen',
            action: 'SUBMITTED',
            fromStatus: null,
            toStatus: 'Submitted',
            remarks: 'Helpline 112 referral logged.'
          },
          {
            id: 'HIST-008',
            timestamp: daysAgo(5, 0),
            actor: 'Dr. Rajeshwar Patil',
            role: 'admin',
            action: 'ASSIGNED',
            fromStatus: 'Submitted',
            toStatus: 'Assigned',
            remarks: 'Assigned to Cybercell. Target SLA: 48h.'
          },
          {
            id: 'HIST-009',
            timestamp: daysAgo(2, 0),
            actor: 'Reminder Engine',
            role: 'system',
            action: 'REMINDER_TRIGGERED',
            fromStatus: 'In Progress',
            toStatus: 'In Progress',
            remarks: 'Level 1 Overdue Notice dispatched to Insp. Sneha Patil: Follow-up deadline passed.'
          },
          {
            id: 'HIST-010',
            timestamp: daysAgo(0, 10),
            actor: 'Reminder Engine',
            role: 'system',
            action: 'ESCALATION_TRIGGERED',
            fromStatus: 'In Progress',
            toStatus: 'In Progress',
            remarks: 'Level 2 Escalation Alert: Grievance unattended for >48 hours. Escalated to Commissioner.'
          }
        ],
        feedback: null
      },

      // 4. Police Pilot: Public Safety & Traffic (School Zone Hazard)
      {
        id: 'GRV-26004',
        title: 'Dangerous Rash Driving & Lack of Zebra Crossings near School Gate',
        category: 'Public safety and traffic-related complaints',
        description: 'Heavy lorries and rash two-wheelers exceeding 60 km/h in school zone without speed breakers. Two students narrowly escaped accident yesterday.',
        language: 'en',
        translatedTitle: 'ಶಾಲಾ ಗೇಟ್ ಬಳಿ ಅಪಾಯಕಾರಿ ವಾಹನ ಚಾಲನೆ ಮತ್ತು ಝೀಬ್ರಾ ಕ್ರಾಸಿಂಗ್ ಕೊರತೆ',
        translatedDescription: 'ಶಾಲಾ ವಲಯದಲ್ಲಿ ಲಾರಿಗಳು ಅತಿ ವೇಗವಾಗಿ ಚಲಿಸುತ್ತಿವೆ. ಸ್ಪೀಡ್ ಬ್ರೇಕರ್ ಮತ್ತು ಸಿಗ್ನಲ್ ಅಳವಡಿಕೆ ಅಗತ್ಯವಿದೆ.',
        channel: 'Physical Document / Letter',
        locality: 'Mohan Market Complex',
        ward: 'Ward 08',
        landmark: 'Opposite Govt Boys High School',
        priority: 'High',
        incidentDate: '2026-11-07',
        status: 'In Progress',
        citizenId: 'USR-CIT-002',
        citizenName: 'Priya Kamble',
        citizenPhone: '+91 98450 11223',
        departmentId: 'DEP-TRA',
        assignedTo: 'USR-OFF-003',
        assignedOfficerName: 'Insp. Mohammed Farhan',
        submittedAt: daysAgo(3, 1),
        assignedAt: daysAgo(2, 5),
        dueAt: daysFromNow(1, 4),
        followUpDate: daysFromNow(1, 0),
        nextStep: 'Install temporary rubber speed humps and deploy traffic warden during school hours',
        daysPendingWithoutAction: 0,
        unattendedAlert: false,
        isOverdue: false,
        remindersCount: 0,
        lastReminderSentAt: null,
        attachmentUrl: this.createSampleSvg('School Gate Road Safety Inspection', '#f59e0b'),
        history: [
          {
            id: 'HIST-011',
            timestamp: daysAgo(3, 1),
            actor: 'Priya Kamble',
            role: 'citizen',
            action: 'SUBMITTED',
            fromStatus: null,
            toStatus: 'Submitted',
            remarks: 'Petition from Parent-Teacher Association submitted with photo evidence.'
          },
          {
            id: 'HIST-012',
            timestamp: daysAgo(2, 5),
            actor: 'Dr. Rajeshwar Patil',
            role: 'admin',
            action: 'ASSIGNED',
            fromStatus: 'Submitted',
            toStatus: 'Assigned',
            remarks: 'Assigned to Traffic Inspector Mohammed Farhan.'
          },
          {
            id: 'HIST-013',
            timestamp: daysAgo(1, 2),
            actor: 'Insp. Mohammed Farhan',
            role: 'officer',
            action: 'IN_PROGRESS',
            fromStatus: 'Assigned',
            toStatus: 'In Progress',
            remarks: 'On-site survey conducted. Notice issued to Municipal Civil Works for asphalt thermoplastic markings.'
          }
        ],
        feedback: null
      },

      // 5. Police Pilot: Complaints Involving Individuals
      {
        id: 'GRV-26005',
        title: 'Repeated Midnight Loudspeaker & Public Nuisance in Residential Alley',
        category: 'Complaints involving individuals',
        description: 'Commercial shop operators playing high-decibel sound boxes until 2:00 AM every night despite polite neighborhood requests, causing extreme sleep disturbance to elderly patients.',
        language: 'en',
        translatedTitle: 'ವಸತಿ ಬಡಾವಣೆಯಲ್ಲಿ ತಡರಾತ್ರಿ ಧ್ವನಿವರ್ಧಕ ಗದ್ದಲ ಮತ್ತು ಸಾರ್ವಜನಿಕ ಕಿರುಕುಳ',
        translatedDescription: 'ಪ್ರತಿದಿನ ತಡರಾತ್ರಿ 2 ಗಂಟೆಯವರೆಗೆ ಧ್ವನಿವರ್ಧಕ ಬಳಸಿ ಸಾರ್ವಜನಿಕರಿಗೆ ತೊಂದರೆ ನೀಡಲಾಗುತ್ತಿದೆ.',
        channel: 'Online Portal',
        locality: 'Naubad Industrial Area Ring Road',
        ward: 'Ward 11',
        landmark: 'Behind Plot #14 Godown',
        priority: 'Medium',
        incidentDate: '2026-11-06',
        status: 'Resolved',
        citizenId: 'USR-CIT-004',
        citizenName: 'Fatima Zahra',
        citizenPhone: '+91 97410 55667',
        departmentId: 'DEP-IND',
        assignedTo: 'USR-OFF-001',
        assignedOfficerName: 'SI Suresh Biradar',
        submittedAt: daysAgo(4, 3),
        assignedAt: daysAgo(3, 8),
        dueAt: daysAgo(1, 0),
        resolvedAt: daysAgo(0, 14),
        followUpDate: null,
        nextStep: 'Night patrol beat assigned to monitor compliance after 10:00 PM',
        daysPendingWithoutAction: 0,
        unattendedAlert: false,
        isOverdue: false,
        remindersCount: 0,
        lastReminderSentAt: null,
        attachmentUrl: this.createSampleSvg('Patrol Beat Log Receipt', '#10b981', true),
        history: [
          {
            id: 'HIST-014',
            timestamp: daysAgo(4, 3),
            actor: 'Fatima Zahra',
            role: 'citizen',
            action: 'SUBMITTED',
            fromStatus: null,
            toStatus: 'Submitted',
            remarks: 'Registered via citizen portal.'
          },
          {
            id: 'HIST-015',
            timestamp: daysAgo(0, 14),
            actor: 'SI Suresh Biradar',
            role: 'officer',
            action: 'RESOLVED',
            fromStatus: 'In Progress',
            toStatus: 'Resolved',
            remarks: 'Both parties summoned to station. Written undertaking signed under Noise Pollution Regulation Rules.'
          }
        ],
        feedback: {
          rating: 4,
          comment: 'Prompt response by SI Suresh. The noise has stopped completely. Thank you.',
          submittedAt: daysAgo(0, 6)
        }
      },

      // 6. Police Pilot: Lost Property in Kannada (Unassigned Queue for Demo)
      {
        id: 'GRV-26006',
        title: 'ಬಸ್ ನಿಲ್ದಾಣದಲ್ಲಿ ಕಳೆದುಹೋದ ಲ್ಯಾಪ್‌ಟಾಪ್ ಬ್ಯಾಗ್ ಮತ್ತು ಪ್ರಮಾಣಪತ್ರಗಳು',
        category: 'Lost property',
        description: 'ಕೇಂದ್ರ ಬಸ್ ನಿಲ್ದಾಣದ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ 3 ರಲ್ಲಿ ಡೆಲ್ ಲ್ಯಾಪ್‌ಟಾಪ್ ಮತ್ತು ಮೂಲ ಇಂಜಿನಿಯರಿಂಗ್ ಪ್ರಮಾಣಪತ್ರಗಳಿದ್ದ ಕಪ್ಪು ಬ್ಯಾಗ್ ಮರೆತುಹೋಗಿದೆ.',
        language: 'kn',
        translatedTitle: 'Laptop Bag and Certificates Lost at Central Bus Stand',
        translatedDescription: 'Forgotten black bag containing Dell laptop and original engineering degree certificates at Platform 3 of Central Bus Stand.',
        channel: 'Online Portal',
        locality: 'Central Bus Stand Area',
        ward: 'Ward 01',
        landmark: 'Platform #3 Waiting Hall',
        priority: 'High',
        incidentDate: '2026-11-10',
        status: 'Submitted',
        citizenId: 'USR-CIT-001',
        citizenName: 'Rahul Sharma',
        citizenPhone: '+91 91234 56789',
        departmentId: 'DEP-LST',
        assignedTo: null,
        assignedOfficerName: null,
        submittedAt: daysAgo(0, 3),
        assignedAt: null,
        dueAt: daysFromNow(1, 0),
        followUpDate: daysFromNow(0, 6),
        nextStep: 'Review KSRTC station CCTV footage & broadcast lost property alert',
        daysPendingWithoutAction: 0,
        unattendedAlert: false,
        isOverdue: false,
        remindersCount: 0,
        lastReminderSentAt: null,
        attachmentUrl: this.createSampleSvg('Bus Ticket & Purchase Invoice', '#8b5cf6', true),
        history: [
          {
            id: 'HIST-016',
            timestamp: daysAgo(0, 3),
            actor: 'Rahul Sharma',
            role: 'citizen',
            action: 'SUBMITTED',
            fromStatus: null,
            toStatus: 'Submitted',
            remarks: 'ದೂರು ದಾಖಲಿಸಲಾಗಿದೆ (Submitted freshly today). Requires immediate department assignment.'
          }
        ],
        feedback: null
      },

      // 7. Civic Domain: Water Supply & Pipeline Maintenance (In Progress)
      {
        id: 'GRV-26007',
        title: 'Underground Drinking Water Feeder Pipe Leakage',
        category: 'Water Supply',
        description: 'High-pressure potable water is gushing out of the underground municipal feeder pipe, flooding road and creating a deep water sinkhole.',
        language: 'en',
        translatedTitle: 'ಕುಡಿಯುವ ನೀರಿನ ಪೈಪ್‌ಲೈನ್ ಸೋರಿಕೆ ಮತ್ತು ರಸ್ತೆ ಜಲಾವೃತ',
        translatedDescription: 'ಮುಖ್ಯ ಪೈಪ್‌ಲೈನ್ ಒಡೆದು ಶುದ್ಧ ನೀರು ವ್ಯರ್ಥವಾಗುತ್ತಿದೆ ಮತ್ತು ರಸ್ತೆ ಹಾಳಾಗುತ್ತಿದೆ.',
        channel: 'Online Portal',
        locality: 'Mohan Market 3rd Cross',
        ward: 'Ward 08',
        landmark: 'Near Govt High School Gate',
        priority: 'High',
        incidentDate: '2026-11-08',
        status: 'In Progress',
        citizenId: 'USR-CIT-002',
        citizenName: 'Priya Kamble',
        citizenPhone: '+91 98450 11223',
        departmentId: 'DEP-WAT',
        assignedTo: 'USR-OFF-004',
        assignedOfficerName: 'Anand Kulkarni',
        submittedAt: daysAgo(2, 6),
        assignedAt: daysAgo(2, 1),
        dueAt: daysFromNow(1, 0),
        followUpDate: daysFromNow(0, 10),
        nextStep: 'Excavate 1.5m trench and weld heavy-duty replacement collar clamp',
        daysPendingWithoutAction: 0,
        unattendedAlert: false,
        isOverdue: false,
        remindersCount: 0,
        lastReminderSentAt: null,
        attachmentUrl: this.createSampleSvg('Water Main Leakage Joint', '#06b6d4'),
        history: [
          {
            id: 'HIST-017',
            timestamp: daysAgo(2, 6),
            actor: 'Priya Kamble',
            role: 'citizen',
            action: 'SUBMITTED',
            fromStatus: null,
            toStatus: 'Submitted',
            remarks: 'Complaint lodged with photo evidence.'
          },
          {
            id: 'HIST-018',
            timestamp: daysAgo(2, 1),
            actor: 'Dr. Rajeshwar Patil',
            role: 'admin',
            action: 'ASSIGNED',
            fromStatus: 'Submitted',
            toStatus: 'Assigned',
            remarks: 'Assigned to Anand Kulkarni (DEP-WAT).'
          },
          {
            id: 'HIST-019',
            timestamp: daysAgo(1, 2),
            actor: 'Anand Kulkarni',
            role: 'officer',
            action: 'IN_PROGRESS',
            fromStatus: 'Assigned',
            toStatus: 'In Progress',
            remarks: 'Sluice valve shut to relieve pipeline pressure. Excavation team dispatched.'
          }
        ],
        feedback: null
      },

      // 8. Civic Domain: Streetlights in Kannada (Resolved with Feedback)
      {
        id: 'GRV-26008',
        title: 'ಶಿವನಗರ ಕಾಲೋನಿಯಲ್ಲಿ 4 ಬೀದಿ ದೀಪಗಳು ಕೆಟ್ಟುಹೋಗಿವೆ',
        category: 'Streetlights',
        description: 'ಮುಖ್ಯ ರಸ್ತೆಯ 4 ಎಲ್‌ಇಡಿ ದೀಪಗಳು ಕಳೆದ 5 ದಿನಗಳಿಂದ ಬೆಳಗುತ್ತಿಲ್ಲ. ರಾತ್ರಿ ಸಮಯದಲ್ಲಿ ಮಹಿಳೆಯರು ಮತ್ತು ಮಕ್ಕಳಿಗೆ ಸಂಚಾರಕ್ಕೆ ಕತ್ತಲೆಯಿಂದ ಭಯವಾಗುತ್ತಿದೆ.',
        language: 'kn',
        translatedTitle: 'Four Streetlights Broken in Shivnagar Colony',
        translatedDescription: 'Four LED streetlights have not turned on for the past 5 days, leaving the main residential street pitch dark.',
        channel: 'Document / Letter Upload',
        locality: 'Shivnagar Colony Main Road',
        ward: 'Ward 02',
        landmark: 'Near Basaveshwara Temple',
        priority: 'Medium',
        incidentDate: '2026-11-04',
        status: 'Resolved',
        citizenId: 'USR-CIT-003',
        citizenName: 'Basavaraj Malipatil',
        citizenPhone: '+91 94480 33445',
        departmentId: 'DEP-ELE',
        assignedTo: 'USR-OFF-001',
        assignedOfficerName: 'SI Suresh Biradar',
        submittedAt: daysAgo(6, 2),
        assignedAt: daysAgo(5, 8),
        dueAt: daysAgo(3, 0),
        resolvedAt: daysAgo(1, 5),
        followUpDate: null,
        nextStep: 'Case closed - Repaired and tested under warranty',
        daysPendingWithoutAction: 0,
        unattendedAlert: false,
        isOverdue: false,
        remindersCount: 0,
        lastReminderSentAt: null,
        attachmentUrl: this.createSampleSvg('Repaired 90W LED Lamps', '#10b981'),
        history: [
          {
            id: 'HIST-020',
            timestamp: daysAgo(6, 2),
            actor: 'Basavaraj Malipatil',
            role: 'citizen',
            action: 'SUBMITTED',
            fromStatus: null,
            toStatus: 'Submitted',
            remarks: 'ದೂರು ದಾಖಲಿಸಲಾಗಿದೆ (Complaint submitted in Kannada).'
          },
          {
            id: 'HIST-021',
            timestamp: daysAgo(1, 5),
            actor: 'SI Suresh Biradar',
            role: 'officer',
            action: 'RESOLVED',
            fromStatus: 'In Progress',
            toStatus: 'Resolved',
            remarks: 'ಹೊಸ LED ಚಾಲಕಗಳು ಮತ್ತು ವೈರಿಂಗ್ ಸಂಪರ್ಕವನ್ನು ದುರಸ್ತಿ ಮಾಡಲಾಗಿದೆ (LED drivers replaced).'
          }
        ],
        feedback: {
          rating: 5,
          comment: 'ಅತ್ಯುತ್ತಮ ಕೆಲಸ, ರಾತ್ರಿಯಿಡೀ ದೀಪಗಳು ಸರಿಯಾಗಿ ಬೆಳಗುತ್ತಿವೆ.',
          submittedAt: daysAgo(1, 0)
        }
      },

      // 9. Civic Domain: Sanitation Overdue & Repeated Follow-up Alerts
      {
        id: 'GRV-26009',
        title: 'Garbage Dump Overflow and Stray Animal Health Hazard',
        category: 'Garbage Collection',
        description: 'Community waste container overflowed onto main road. Waste tractor has missed scheduled pickups for 4 days.',
        language: 'en',
        translatedTitle: 'ಕಸದ ತೊಟ್ಟಿ ತುಂಬಿ ರಸ್ತೆಗೆ ಚೆಲ್ಲಾಪಿಲ್ಲಿ - ಸಾಂಕ್ರಾಮಿಕ ರೋಗದ ಭೀತಿ',
        translatedDescription: 'ಕಳೆದ 4 ದಿನಗಳಿಂದ ಕಸದ ವಾಹನ ಬಂದಿಲ್ಲ. ದುರ್ವಾಸನೆ ಬೀರುತ್ತಿದೆ.',
        channel: 'Online Portal',
        locality: 'Mailoor Cross Extension',
        ward: 'Ward 07',
        landmark: 'Beside Community Community Center Hall',
        priority: 'High',
        incidentDate: '2026-11-03',
        status: 'In Progress',
        citizenId: 'USR-CIT-001',
        citizenName: 'Rahul Sharma',
        citizenPhone: '+91 91234 56789',
        departmentId: 'DEP-SAN',
        assignedTo: 'USR-OFF-005',
        assignedOfficerName: 'Pooja Shinde',
        submittedAt: daysAgo(7, 2),
        assignedAt: daysAgo(6, 0),
        dueAt: daysAgo(3, 0), // Overdue!
        followUpDate: daysAgo(1, 4), // Follow-up overdue!
        nextStep: 'Deploy JCB loader and 2 tippers for complete spot clearance and bleaching powder spray',
        daysPendingWithoutAction: 2,
        unattendedAlert: true,
        isOverdue: true,
        remindersCount: 2,
        lastReminderSentAt: daysAgo(0, 14),
        attachmentUrl: this.createSampleSvg('Overflowing Community Bin', '#ef4444'),
        history: [
          {
            id: 'HIST-022',
            timestamp: daysAgo(7, 2),
            actor: 'Rahul Sharma',
            role: 'citizen',
            action: 'SUBMITTED',
            fromStatus: null,
            toStatus: 'Submitted',
            remarks: 'Submitted with location photo.'
          },
          {
            id: 'HIST-023',
            timestamp: daysAgo(3, 0),
            actor: 'Reminder Engine',
            role: 'system',
            action: 'REMINDER_TRIGGERED',
            fromStatus: 'In Progress',
            toStatus: 'In Progress',
            remarks: 'Automated Follow-up Alert sent to Officer Pooja Shinde (Overdue by 48h).'
          },
          {
            id: 'HIST-024',
            timestamp: daysAgo(0, 14),
            actor: 'Reminder Engine',
            role: 'system',
            action: 'ESCALATION_TRIGGERED',
            fromStatus: 'In Progress',
            toStatus: 'In Progress',
            remarks: 'ESCALATED: Overdue SLA exceeded 72h. Flagged for Municipal Commissioner intervention.'
          }
        ],
        feedback: null
      },

      // 10. Reopened Grievance (Testing Reopen follow-up loop)
      {
        id: 'GRV-26010',
        title: 'Recurring Sewage Backflow in Residential Alley',
        category: 'Drainage',
        description: 'Sewage continues to back up into residential courtyards during morning supply hours. Previous patch work failed after 48 hours.',
        language: 'en',
        translatedTitle: 'ಮನೆಗಳ ಮುಂದೆ ಒಳಚರಂಡಿ ನೀರು ನಿಲ್ಲುವ ಸಮಸ್ಯೆ ಮರುಕಳಿಸಿದೆ',
        translatedDescription: 'ಹಿಂದೆ ಮಾಡಿದ ದುರಸ್ತಿ ವಿಫಲವಾಗಿದ್ದು, ಮತ್ತೆ ಚರಂಡಿ ನೀರು ಉಕ್ಕಿ ಹರಿಯುತ್ತಿದೆ.',
        channel: 'Online Portal',
        locality: 'Gandhi Gunj Main Market',
        ward: 'Ward 04',
        landmark: 'Behind Bank of Baroda ATM',
        priority: 'High',
        incidentDate: '2026-11-06',
        status: 'Reopened',
        citizenId: 'USR-CIT-001',
        citizenName: 'Rahul Sharma',
        citizenPhone: '+91 91234 56789',
        departmentId: 'DEP-WAT',
        assignedTo: 'USR-OFF-004',
        assignedOfficerName: 'Anand Kulkarni',
        submittedAt: daysAgo(4, 5),
        assignedAt: daysAgo(3, 8),
        dueAt: daysFromNow(2, 0),
        followUpDate: daysFromNow(0, 12),
        nextStep: 'Deploy high-pressure super-sucker jetting machine to clear underground grease blockage',
        daysPendingWithoutAction: 0,
        unattendedAlert: false,
        isOverdue: false,
        remindersCount: 0,
        lastReminderSentAt: null,
        attachmentUrl: this.createSampleSvg('Choked Sewage Chamber', '#ef4444'),
        history: [
          {
            id: 'HIST-025',
            timestamp: daysAgo(4, 5),
            actor: 'Rahul Sharma',
            role: 'citizen',
            action: 'SUBMITTED',
            fromStatus: null,
            toStatus: 'Submitted',
            remarks: 'Original complaint registered.'
          },
          {
            id: 'HIST-026',
            timestamp: daysAgo(2, 0),
            actor: 'Anand Kulkarni',
            role: 'officer',
            action: 'RESOLVED',
            fromStatus: 'In Progress',
            toStatus: 'Resolved',
            remarks: 'Rods inserted and partial blockage cleared.'
          },
          {
            id: 'HIST-027',
            timestamp: daysAgo(0, 8),
            actor: 'Rahul Sharma',
            role: 'citizen',
            action: 'REOPENED',
            fromStatus: 'Resolved',
            toStatus: 'Reopened',
            remarks: 'REOPENED BY CITIZEN: Water started leaking back again today. Heavy grease blockage under the road requires high-pressure jetting machine.'
          }
        ],
        feedback: null
      },

      // 11. Police Pilot: Law & Order (NEW ASSIGNMENT for SI Suresh Biradar USR-OFF-001)
      {
        id: 'GRV-26011',
        title: 'Armed Brawl Threat & Public Intimidation at Gunj Market Yard',
        category: 'Complaints involving individuals',
        description: 'Two commercial transport factions involved in heated altercation with weapons threat at loading dock. Shopkeepers requesting immediate police intervention and security deployment.',
        language: 'en',
        translatedTitle: 'ಗುಂಜ್ ಮಾರ್ಕೆಟ್ ಯಾರ್ಡ್‌ನಲ್ಲಿ ಸಾರ್ವಜನಿಕ ಬೆದರಿಕೆ ಮತ್ತು ಗಲಾಟೆ',
        translatedDescription: 'ಲೋಡಿಂಗ್ ಡಾಕ್ ಬಳಿ ವ್ಯಾಪಾರಿಗಳ ನಡುವೆ ಗಲಾಟೆ ನಡೆದಿದ್ದು, ಸಾರ್ವಜನಿಕರಿಗೆ ಬೆದರಿಕೆ ಹಾಕಲಾಗುತ್ತಿದೆ. ತಕ್ಷಣ ಪೊಲೀಸ್ ಭದ್ರತೆ ಬೇಕಿದೆ.',
        channel: 'Online Portal',
        locality: 'Gandhi Gunj Wholesale Yard',
        ward: 'Ward 04',
        landmark: 'Near Wholesale Grain Shed #2',
        priority: 'Urgent',
        incidentDate: '2026-11-10',
        status: 'Assigned',
        citizenId: 'USR-CIT-001',
        citizenName: 'Rahul Sharma',
        citizenPhone: '+91 91234 56789',
        departmentId: 'DEP-IND',
        assignedTo: 'USR-OFF-001',
        assignedOfficerName: 'SI Suresh Biradar',
        submittedAt: daysAgo(0, 5),
        assignedAt: daysAgo(0, 2),
        dueAt: daysFromNow(2, 0),
        followUpDate: daysFromNow(0, 10),
        nextStep: 'Summon both merchant factions to police station for peace inquiry and execute security bond',
        daysPendingWithoutAction: 0,
        unattendedAlert: false,
        isOverdue: false,
        remindersCount: 0,
        lastReminderSentAt: null,
        attachmentUrl: this.createSampleSvg('Police Station Dispatch Advisory', '#06b6d4', true),
        history: [
          {
            id: 'HIST-028',
            timestamp: daysAgo(0, 5),
            actor: 'Rahul Sharma',
            role: 'citizen',
            action: 'SUBMITTED',
            fromStatus: null,
            toStatus: 'Submitted',
            remarks: 'Urgent grievance submitted by Traders Welfare Committee.'
          },
          {
            id: 'HIST-029',
            timestamp: daysAgo(0, 2),
            actor: 'Dr. Rajeshwar Patil',
            role: 'admin',
            action: 'ASSIGNED',
            fromStatus: 'Submitted',
            toStatus: 'Assigned',
            remarks: 'Assigned to SI Suresh Biradar (Station House Officer - North Division). Priority Urgent.'
          }
        ],
        feedback: null
      },

      // 12. Police Pilot: Traffic & Obstruction (NEW ASSIGNMENT for SI Suresh Biradar USR-OFF-001)
      {
        id: 'GRV-26012',
        title: 'Unauthorized Road Encroachment & Night Truck Parking Obstructing Emergency Ambulances',
        category: 'Public safety and traffic-related complaints',
        description: 'Multi-axle container trucks parked haphazardly across both lanes of the ring road every night, blocking entry to the District Hospital trauma center.',
        language: 'en',
        translatedTitle: 'ಅನಧಿಕೃತ ರಸ್ತೆ ಒತ್ತುವರಿ ಮತ್ತು ಆಸ್ಪತ್ರೆ ಮಾರ್ಗದಲ್ಲಿ ಲಾರಿಗಳ ಪಾರ್ಕಿಂಗ್ ತೊಂದರೆ',
        translatedDescription: 'ರಾತ್ರಿ ವೇಳೆ ರಸ್ತೆಯ ಇಕ್ಕೆಲಗಳಲ್ಲಿ ಲಾರಿಗಳನ್ನು ನಿಲ್ಲಿಸಿ ಅಂಬ್ಯುಲೆನ್ಸ್ ಸಂಚಾರಕ್ಕೆ ಅಡ್ಡಿಪಡಿಸಲಾಗುತ್ತಿದೆ.',
        channel: 'Physical Document / Letter',
        locality: 'Naubad Industrial Area Ring Road',
        ward: 'Ward 11',
        landmark: 'Opposite District Hospital South Gate',
        priority: 'High',
        incidentDate: '2026-11-09',
        status: 'Assigned',
        citizenId: 'USR-CIT-002',
        citizenName: 'Priya Kamble',
        citizenPhone: '+91 98450 11223',
        departmentId: 'DEP-TRA',
        assignedTo: 'USR-OFF-001',
        assignedOfficerName: 'SI Suresh Biradar',
        submittedAt: daysAgo(0, 12),
        assignedAt: daysAgo(0, 4),
        dueAt: daysFromNow(1, 12),
        followUpDate: daysFromNow(1, 0),
        nextStep: 'Conduct joint night enforcement patrol with traffic wardens; issue towing notice to fleet operators',
        daysPendingWithoutAction: 0,
        unattendedAlert: false,
        isOverdue: false,
        remindersCount: 0,
        lastReminderSentAt: null,
        attachmentUrl: this.createSampleSvg('Traffic Obstruction Survey Report', '#3b82f6'),
        history: [
          {
            id: 'HIST-030',
            timestamp: daysAgo(0, 12),
            actor: 'Priya Kamble',
            role: 'citizen',
            action: 'SUBMITTED',
            fromStatus: null,
            toStatus: 'Submitted',
            remarks: 'Letter petition received from Hospital Resident Doctors Association.'
          },
          {
            id: 'HIST-031',
            timestamp: daysAgo(0, 4),
            actor: 'Dr. Rajeshwar Patil',
            role: 'admin',
            action: 'ASSIGNED',
            fromStatus: 'Submitted',
            toStatus: 'Assigned',
            remarks: 'Assigned to SI Suresh Biradar for immediate traffic clearance.'
          }
        ],
        feedback: null
      },

      // 13. Police Pilot: Individual Dispute (IN PROGRESS for SI Suresh Biradar USR-OFF-001)
      {
        id: 'GRV-26013',
        title: 'Illegal Night Gambling & Loudspeaker Clashes in Residential Alleyway',
        category: 'Complaints involving individuals',
        description: 'Unlicensed gambling racket operating behind vacant mill premises with loud verbal clashes and rowdy behavior disturbing families past midnight.',
        language: 'en',
        translatedTitle: 'ವಸತಿ ಬಡಾವಣೆಯಲ್ಲಿ ಅಕ್ರಮ ಜೂಜಾಟ ಮತ್ತು ರಾತ್ರಿ ಗಲಾಟೆ',
        translatedDescription: 'ಖಾಲಿ ಜಾಗದಲ್ಲಿ ಅಕ್ರಮ ಜೂಜಾಟ ನಡೆಯುತ್ತಿದ್ದು, ಸಾರ್ವಜನಿಕರಿಗೆ ತೀವ್ರ ಕಿರುಕುಳವಾಗುತ್ತಿದೆ.',
        channel: 'Online Portal',
        locality: 'Shiva Nagar Colony',
        ward: 'Ward 07',
        landmark: 'Near Old Cotton Mill Compound',
        priority: 'High',
        incidentDate: '2026-11-07',
        status: 'In Progress',
        citizenId: 'USR-CIT-004',
        citizenName: 'Fatima Zahra',
        citizenPhone: '+91 97410 55667',
        departmentId: 'DEP-IND',
        assignedTo: 'USR-OFF-001',
        assignedOfficerName: 'SI Suresh Biradar',
        submittedAt: daysAgo(2, 6),
        assignedAt: daysAgo(2, 2),
        dueAt: daysFromNow(1, 4),
        followUpDate: daysFromNow(0, 6),
        nextStep: 'Deploy stationary beat patrol vehicle from 22:00 to 02:00; summon compound caretaker',
        daysPendingWithoutAction: 0,
        unattendedAlert: false,
        isOverdue: false,
        remindersCount: 0,
        lastReminderSentAt: null,
        attachmentUrl: this.createSampleSvg('Police Night Patrol Beat Log', '#8b5cf6'),
        history: [
          {
            id: 'HIST-032',
            timestamp: daysAgo(2, 6),
            actor: 'Fatima Zahra',
            role: 'citizen',
            action: 'SUBMITTED',
            fromStatus: null,
            toStatus: 'Submitted',
            remarks: 'Citizen grievance submitted.'
          },
          {
            id: 'HIST-033',
            timestamp: daysAgo(2, 2),
            actor: 'Dr. Rajeshwar Patil',
            role: 'admin',
            action: 'ASSIGNED',
            fromStatus: 'Submitted',
            toStatus: 'Assigned',
            remarks: 'Routed to Law & Order Station House Officer.'
          },
          {
            id: 'HIST-034',
            timestamp: daysAgo(1, 4),
            actor: 'SI Suresh Biradar',
            role: 'officer',
            action: 'IN_PROGRESS',
            fromStatus: 'Assigned',
            toStatus: 'In Progress',
            remarks: 'Surprise raid conducted yesterday night; two persons detained for questioning. Follow-up scheduled.'
          }
        ],
        feedback: null
      },

      // 14. Civic & Public Safety: Structural Hazard (IN PROGRESS for SI Suresh Biradar USR-OFF-001)
      {
        id: 'GRV-26014',
        title: 'Dangerous Dilapidated Commercial Wall Leaning over Pedestrian Walkway',
        category: 'Public safety and traffic-related complaints',
        description: 'Brick boundary wall of abandoned godown has developed major 4-inch vertical cracks and is bulging outward directly above the pedestrian pavement.',
        language: 'en',
        translatedTitle: 'ಪಾದಚಾರಿ ಮಾರ್ಗದಲ್ಲಿ ಅಪಾಯಕಾರಿಯಾಗಿ ವಾಲಿದ ಹಳೆಯ ಗೋಡೆ',
        translatedDescription: 'ಹಳೆಯ ಗೋಡೆ ಬಿರುಕು ಬಿಟ್ಟಿದ್ದು, ರಸ್ತೆಯಲ್ಲಿ ಹೋಗುವ ಸಾರ್ವಜನಿಕರ ಮೇಲೆ ಬೀಳುವ ಸಾಧ್ಯತೆಯಿದೆ.',
        channel: 'Online Portal',
        locality: 'Mohan Market Complex',
        ward: 'Ward 08',
        landmark: 'Adjacent to Janata Supermarket',
        priority: 'Medium',
        incidentDate: '2026-11-06',
        status: 'In Progress',
        citizenId: 'USR-CIT-001',
        citizenName: 'Rahul Sharma',
        citizenPhone: '+91 91234 56789',
        departmentId: 'DEP-ROA',
        assignedTo: 'USR-OFF-001',
        assignedOfficerName: 'SI Suresh Biradar',
        submittedAt: daysAgo(3, 4),
        assignedAt: daysAgo(3, 0),
        dueAt: daysFromNow(2, 8),
        followUpDate: daysFromNow(1, 4),
        nextStep: 'Joint on-site safety inspection with CMC Municipal Engineer to issue emergency demolition notice',
        daysPendingWithoutAction: 0,
        unattendedAlert: false,
        isOverdue: false,
        remindersCount: 0,
        lastReminderSentAt: null,
        attachmentUrl: this.createSampleSvg('Structural Wall Crack Inspection', '#f59e0b'),
        history: [
          {
            id: 'HIST-035',
            timestamp: daysAgo(3, 4),
            actor: 'Rahul Sharma',
            role: 'citizen',
            action: 'SUBMITTED',
            fromStatus: null,
            toStatus: 'Submitted',
            remarks: 'Complaint lodged with photo proof.'
          },
          {
            id: 'HIST-036',
            timestamp: daysAgo(3, 0),
            actor: 'Dr. Rajeshwar Patil',
            role: 'admin',
            action: 'ASSIGNED',
            fromStatus: 'Submitted',
            toStatus: 'Assigned',
            remarks: 'Assigned for public safety evaluation.'
          },
          {
            id: 'HIST-037',
            timestamp: daysAgo(1, 8),
            actor: 'SI Suresh Biradar',
            role: 'officer',
            action: 'IN_PROGRESS',
            fromStatus: 'Assigned',
            toStatus: 'In Progress',
            remarks: 'Warning caution barricade tape installed along footpath. Notice drafted to building owner.'
          }
        ],
        feedback: null
      },

      // 15. Police Pilot: Public Safety & Harassment (OVERDUE for SI Suresh Biradar USR-OFF-001)
      {
        id: 'GRV-26015',
        title: 'Repeated Eve-Teasing and Intimidation of Female Students at Main Bus Stand',
        category: 'Complaints involving individuals',
        description: 'Group of habitual miscreants gathering at city bus shelter harassing college students daily between 17:00 and 19:00. Previous petition unaddressed for 4 days.',
        language: 'en',
        translatedTitle: 'ಮುಖ್ಯ ಬಸ್ ನಿಲ್ದಾಣದಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿನಿಯರಿಗೆ ಕಿರುಕುಳ ಮತ್ತು ಅಸಭ್ಯ ವರ್ತನೆ',
        translatedDescription: 'ಪ್ರತಿದಿನ ಸಂಜೆ ವೇಳೆ ಬಸ್ ನಿಲ್ದಾಣದಲ್ಲಿ ಯುವಕರು ಕಿರುಕುಳ ನೀಡುತ್ತಿದ್ದು, ರಕ್ಷಣೆ ಕೋರಲಾಗಿದೆ.',
        channel: 'Physical Document / Letter',
        locality: 'Central Bus Stand Circle',
        ward: 'Ward 02',
        landmark: 'Platform 3 City Bus Shelter',
        priority: 'Urgent',
        incidentDate: '2026-11-05',
        status: 'Assigned',
        citizenId: 'USR-CIT-002',
        citizenName: 'Priya Kamble',
        citizenPhone: '+91 98450 11223',
        departmentId: 'DEP-IND',
        assignedTo: 'USR-OFF-001',
        assignedOfficerName: 'SI Suresh Biradar',
        submittedAt: daysAgo(4, 8),
        assignedAt: daysAgo(4, 2),
        dueAt: daysAgo(2, 0), // BREACHED
        followUpDate: daysAgo(1, 8), // OVERDUE
        nextStep: 'Deploy Women Police Help Desk (Pink Patrol) & retrieve CCTV footage from KSRTC control room',
        daysPendingWithoutAction: 3,
        unattendedAlert: true,
        isOverdue: true,
        remindersCount: 2,
        lastReminderSentAt: daysAgo(0, 14),
        attachmentUrl: this.createSampleSvg('College Petition & Incident Map', '#ef4444', true),
        history: [
          {
            id: 'HIST-038',
            timestamp: daysAgo(4, 8),
            actor: 'Priya Kamble',
            role: 'citizen',
            action: 'SUBMITTED',
            fromStatus: null,
            toStatus: 'Submitted',
            remarks: 'Urgent written petition submitted.'
          },
          {
            id: 'HIST-039',
            timestamp: daysAgo(4, 2),
            actor: 'Dr. Rajeshwar Patil',
            role: 'admin',
            action: 'ASSIGNED',
            fromStatus: 'Submitted',
            toStatus: 'Assigned',
            remarks: 'Assigned to SI Suresh Biradar with Urgent priority SLA.'
          },
          {
            id: 'HIST-040',
            timestamp: daysAgo(1, 14),
            actor: 'GrievanceTrack Automation',
            role: 'system',
            action: 'REMINDER_SENT',
            fromStatus: 'Assigned',
            toStatus: 'Assigned',
            remarks: 'AUTOMATED REMINDER #1: Resolution deadline expired. Officer response mandatory within 24 hours.'
          },
          {
            id: 'HIST-041',
            timestamp: daysAgo(0, 14),
            actor: 'GrievanceTrack Automation',
            role: 'system',
            action: 'OVERDUE_ALERT',
            fromStatus: 'Assigned',
            toStatus: 'Assigned',
            remarks: 'ESCALATION ALERT: SLA breached by >48h without action. Case flagged on Municipal Commissioner Dashboard.'
          }
        ],
        feedback: null
      },

      // 16. Police Pilot: Dispute & Threat (OVERDUE for SI Suresh Biradar USR-OFF-001)
      {
        id: 'GRV-26016',
        title: 'Severe Boundary Dispute & Threat of Physical Violence between Adjacent Landholders',
        category: 'Complaints involving individuals',
        description: 'Ongoing violent dispute over common drainage boundary. Heavy stone throwing reported; complainant threatened with grievous hurt if municipal work proceeds.',
        language: 'en',
        translatedTitle: 'ಜಮೀನು ಗಡಿ ವಿವಾದ ಮತ್ತು ದೈಹಿಕ ಹಲ್ಲೆ ಬೆದರಿಕೆ ಪ್ರಕರಣ',
        translatedDescription: 'ಚರಂಡಿ ನಿರ್ಮಾಣ ವಿಚಾರದಲ್ಲಿ ಗಲಾಟೆ ನಡೆದಿದ್ದು, ಕೊಲೆ ಬೆದರಿಕೆ ಹಾಕಲಾಗಿದೆ. ತಕ್ಷಣ ರಕ್ಷಣೆ ಬೇಕು.',
        channel: 'Online Portal',
        locality: 'Pragathi Colony Extn',
        ward: 'Ward 06',
        landmark: 'Near Water Overhead Tank #3',
        priority: 'High',
        incidentDate: '2026-11-04',
        status: 'In Progress',
        citizenId: 'USR-CIT-004',
        citizenName: 'Fatima Zahra',
        citizenPhone: '+91 97410 55667',
        departmentId: 'DEP-IND',
        assignedTo: 'USR-OFF-001',
        assignedOfficerName: 'SI Suresh Biradar',
        submittedAt: daysAgo(5, 0),
        assignedAt: daysAgo(4, 12),
        dueAt: daysAgo(1, 4), // BREACHED
        followUpDate: daysAgo(0, 20), // MISSED
        nextStep: 'Execute Section 107 CrPC preventive peace-bond summons through Executive Magistrate',
        daysPendingWithoutAction: 2,
        unattendedAlert: true,
        isOverdue: true,
        remindersCount: 1,
        lastReminderSentAt: daysAgo(0, 18),
        attachmentUrl: this.createSampleSvg('Boundary Dispute Police NC Extract', '#ef4444', true),
        history: [
          {
            id: 'HIST-042',
            timestamp: daysAgo(5, 0),
            actor: 'Fatima Zahra',
            role: 'citizen',
            action: 'SUBMITTED',
            fromStatus: null,
            toStatus: 'Submitted',
            remarks: 'Urgent complaint registered.'
          },
          {
            id: 'HIST-043',
            timestamp: daysAgo(4, 12),
            actor: 'Dr. Rajeshwar Patil',
            role: 'admin',
            action: 'ASSIGNED',
            fromStatus: 'Submitted',
            toStatus: 'Assigned',
            remarks: 'Assigned to SI Suresh Biradar.'
          },
          {
            id: 'HIST-044',
            timestamp: daysAgo(3, 2),
            actor: 'SI Suresh Biradar',
            role: 'officer',
            action: 'IN_PROGRESS',
            fromStatus: 'Assigned',
            toStatus: 'In Progress',
            remarks: 'First round mediation conducted at station. Both parties directed not to breach peace.'
          },
          {
            id: 'HIST-045',
            timestamp: daysAgo(0, 18),
            actor: 'GrievanceTrack Automation',
            role: 'system',
            action: 'REMINDER_SENT',
            fromStatus: 'In Progress',
            toStatus: 'In Progress',
            remarks: 'AUTOMATED REMINDER: Follow-up milestone date overdue. Executive Magistrate bond submission pending.'
          }
        ],
        feedback: null
      }
    ];
  },

  getInitialNotifications() {
    const now = new Date('2026-11-10T18:00:00Z');
    const timeAgo = (h) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

    return [
      // Notifications for Officer SI Suresh Biradar (USR-OFF-001)
      {
        id: 'NOTIF-010',
        recipientId: 'USR-OFF-001',
        recipientRole: 'officer',
        complaintId: 'GRV-26011',
        type: 'NEW_ASSIGNMENT',
        title: 'New Urgent Grievance Assigned',
        message: 'Armed Brawl Threat case GRV-26011 at Gandhi Gunj assigned to your desk. Target SLA: 48 hours.',
        isRead: false,
        createdAt: timeAgo(2)
      },
      {
        id: 'NOTIF-011',
        recipientId: 'USR-OFF-001',
        recipientRole: 'officer',
        complaintId: 'GRV-26015',
        type: 'OVERDUE_ALERT',
        title: '⚠️ SLA Breached: Eve-Teasing Case Overdue',
        message: 'Case GRV-26015 at Bus Stand Circle is 48 hours past its target deadline. Follow-up action mandatory.',
        isRead: false,
        createdAt: timeAgo(14)
      },
      {
        id: 'NOTIF-012',
        recipientId: 'USR-OFF-001',
        recipientRole: 'officer',
        complaintId: 'GRV-26012',
        type: 'NEW_ASSIGNMENT',
        title: 'New Traffic Obstruction Assigned',
        message: 'Ambulance route obstruction grievance GRV-26012 assigned for night enforcement.',
        isRead: false,
        createdAt: timeAgo(4)
      },
      // Notifications for Citizen (Rahul Sharma: USR-CIT-001)
      {
        id: 'NOTIF-001',
        recipientId: 'USR-CIT-001',
        recipientRole: 'citizen',
        complaintId: 'GRV-26001',
        type: 'STATUS_UPDATE',
        title: 'Follow-up Progress Update',
        message: 'Your cybercrime grievance GRV-26001 is under investigation by Insp. Sneha Patil. Action: Bank UTR traced.',
        isRead: false,
        createdAt: timeAgo(12)
      },
      {
        id: 'NOTIF-002',
        recipientId: 'USR-CIT-001',
        recipientRole: 'citizen',
        complaintId: 'GRV-26010',
        type: 'REOPENED',
        title: 'Grievance Reopened & Follow-up Scheduled',
        message: 'Your grievance GRV-26010 has been successfully reopened. Next step: Super-sucker jetting scheduled.',
        isRead: false,
        createdAt: timeAgo(8)
      },

      // Notifications for Officer (Insp. Sneha Patil: USR-OFF-002)
      {
        id: 'NOTIF-003',
        recipientId: 'USR-OFF-002',
        recipientRole: 'officer',
        complaintId: 'GRV-26003',
        type: 'OVERDUE_ALERT',
        title: '⚠️ Follow-up Overdue: KYC Fraud Case',
        message: 'Case GRV-26003 has been pending without follow-up action for >48h. Please record next investigative step.',
        isRead: false,
        createdAt: timeAgo(10)
      },
      {
        id: 'NOTIF-004',
        recipientId: 'USR-OFF-002',
        recipientRole: 'officer',
        complaintId: 'GRV-26001',
        type: 'NEW_ASSIGNMENT',
        title: 'New Cybercrime Case Assigned',
        message: 'Urgent: Phishing fraud complaint GRV-26001 assigned to your desk. Target SLA: 48 hours.',
        isRead: true,
        createdAt: timeAgo(48)
      },

      // Notifications for Administrator (Dr. Rajeshwar Patil: USR-ADM-001)
      {
        id: 'NOTIF-005',
        recipientId: 'USR-ADM-001',
        recipientRole: 'admin',
        complaintId: 'GRV-26003',
        type: 'ESCALATION',
        title: '🚨 Supervisor Escalation: Financial Fraud Case',
        message: 'Case GRV-26003 in Ward 03 has exceeded resolution timeline by >48h without action. Officer: Insp. Sneha Patil.',
        isRead: false,
        createdAt: timeAgo(10)
      },
      {
        id: 'NOTIF-006',
        recipientId: 'USR-ADM-001',
        recipientRole: 'admin',
        complaintId: 'GRV-26006',
        type: 'NEW_SUBMISSION',
        title: 'New Grievance in Unassigned Queue',
        message: 'Citizen Rahul Sharma registered lost property complaint GRV-26006 (Kannada). Ready for routing.',
        isRead: false,
        createdAt: timeAgo(3)
      }
    ];
  },

  getInitialAuditLogs() {
    const now = new Date('2026-11-10T18:00:00Z');
    const timeAgo = (h) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

    return [
      {
        id: 'LOG-1001',
        timestamp: timeAgo(120),
        actor: 'Dr. Rajeshwar Patil',
        role: 'admin',
        action: 'SYSTEM_INITIALIZED',
        complaintId: null,
        description: 'GrievanceTrack portal database seeded with Police and Civic divisions.'
      },
      {
        id: 'LOG-1002',
        timestamp: timeAgo(48),
        actor: 'Rahul Sharma',
        role: 'citizen',
        action: 'SUBMIT_COMPLAINT',
        complaintId: 'GRV-26001',
        description: 'Submitted cybercrime grievance regarding fake bill phishing with transaction evidence.'
      },
      {
        id: 'LOG-1003',
        timestamp: timeAgo(45),
        actor: 'Dr. Rajeshwar Patil',
        role: 'admin',
        action: 'ASSIGN_COMPLAINT',
        complaintId: 'GRV-26001',
        description: 'Assigned complaint GRV-26001 to Insp. Sneha Patil (DEP-CYB).'
      },
      {
        id: 'LOG-1004',
        timestamp: timeAgo(10),
        actor: 'Reminder Engine',
        role: 'system',
        action: 'ESCALATION_TRIGGERED',
        complaintId: 'GRV-26003',
        description: 'Escalation triggered for long-pending financial fraud grievance GRV-26003.'
      },
      {
        id: 'LOG-1005',
        timestamp: timeAgo(8),
        actor: 'Rahul Sharma',
        role: 'citizen',
        action: 'REOPEN_COMPLAINT',
        complaintId: 'GRV-26010',
        description: 'Reopened grievance GRV-26010 due to recurring sewage backflow.'
      }
    ];
  },

  getInitialSettings() {
    return {
      theme: 'dark',
      accentColor: 'cyan',
      language: 'en',
      tableDensity: 'compact',
      soundEnabled: true,
      autoReminderCheckMinutes: 60,
      reminderWindowHours: 24,
      escalationWindowHours: 48,
      lastReminderRun: '2026-11-10T17:30:00Z',
      appName: 'GrievanceTrack',
      jurisdiction: 'District Grievance & Public Safety Administration (Police & Civic Services)',
      academicMode: false
    };
  },

  CURRENT_DATA_VERSION: 'gt_seed_v2_4_expanded',

  /**
   * Seed all initial data into LocalStorage if not already present or if version upgraded
   */
  init(force = false) {
    const storedVersion = localStorage.getItem('gt_seed_version');
    if (force || !GTStorage.isInitialized() || storedVersion !== this.CURRENT_DATA_VERSION) {
      GTStorage.set(STORAGE_KEYS.USERS, this.getInitialUsers());
      GTStorage.set(STORAGE_KEYS.DEPARTMENTS, this.getInitialDepartments());
      GTStorage.set(STORAGE_KEYS.COMPLAINTS, this.getInitialComplaints());
      GTStorage.set(STORAGE_KEYS.NOTIFICATIONS, this.getInitialNotifications());
      GTStorage.set(STORAGE_KEYS.AUDIT_LOGS, this.getInitialAuditLogs());
      GTStorage.set(STORAGE_KEYS.SETTINGS, this.getInitialSettings());
      GTStorage.set(STORAGE_KEYS.REMINDERS, []);
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      localStorage.setItem('gt_seed_version', this.CURRENT_DATA_VERSION);
      console.log('GrievanceTrack LocalStorage initialized with expanded dataset v2.4 (New, In-Progress & Overdue cases loaded).');
    }
  }
};
