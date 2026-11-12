-- ========================================================
-- GrievanceTrack Initial Relational Seed Data
-- Core Police & Civic Services Relational Dataset
-- ========================================================

-- 1. Departments
INSERT INTO departments (dept_id, dept_name, description, sla_hours, head_officer_name, created_at) VALUES
('DEP-CYB', 'Cybercrime & Online Fraud Cell', 'Investigation of online scams, UPI fraud, phishing APKs, and digital cyber extortion.', 48, 'Insp. Sneha Patil', '2026-01-10 09:00:00'),
('DEP-ECO', 'Economic Offences & Financial Fraud', 'Banking fraud, forged checks, unauthorized debits, and non-cyber economic cheating.', 72, 'DSP Ramesh Hegde', '2026-01-10 09:00:00'),
('DEP-LST', 'Lost Property & Missing Article Bureau', 'Digital e-lost reports, missing mobiles (CEIR tracking), and lost official identity documents.', 24, 'SI Mahesh K.', '2026-01-10 09:00:00'),
('DEP-TRA', 'Public Safety & Traffic Division', 'Traffic signal blackspots, dangerous driving, and pedestrian safety installations.', 48, 'Insp. Mohammed Farhan', '2026-01-10 09:00:00'),
('DEP-IND', 'Law & Order / Individual Disputes', 'Civilian dispute mediation, non-cognizable reports, public nuisance, and peace-keeping.', 72, 'SI Suresh Biradar', '2026-01-10 09:00:00'),
('DEP-ELE', 'Electrical & Streetlighting', 'Streetlight maintenance, faulty poles, cable faults, low voltage transformers.', 48, 'Eng. Suresh Biradar', '2026-01-10 09:00:00'),
('DEP-WAT', 'Water Supply & Drainage', 'Potable drinking water irregularities, pipeline bursts, and sewage clogging.', 72, 'Anand Kulkarni', '2026-01-10 09:00:00'),
('DEP-ROA', 'Roads & Infrastructure', 'Pothole repairs, asphalt resurfacing, and pedestrian footpath maintenance.', 96, 'Vikram Patil', '2026-01-10 09:00:00'),
('DEP-SAN', 'Solid Waste & Sanitation', 'Garbage collection, open dumping clearance, and vector-borne hygiene spraying.', 24, 'Kavita Deshmukh', '2026-01-10 09:00:00');

-- 2. Users (Admin, Officers, Citizens)
INSERT INTO users (user_id, full_name, email, password_hash, role, dept_id, phone, ward_no, status, created_at) VALUES
-- Administrator
('USR-ADM-001', 'Dr. Rajeshwar Patil', 'admin@grievancetrack.demo', 'Admin@123', 'admin', NULL, '+91 94480 99887', 'Headquarters (Control Desk)', 'active', '2026-01-01 08:00:00'),

-- Department Officers
('USR-OFF-001', 'SI Suresh Biradar', 'officer@grievancetrack.demo', 'Officer@123', 'officer', 'DEP-IND', '+91 94481 23456', 'Division 1 (North Police Station)', 'active', '2026-01-12 10:30:00'),
('USR-OFF-002', 'Insp. Sneha Patil', 'officer.cyber@grievancetrack.demo', 'Officer@123', 'officer', 'DEP-CYB', '+91 98860 12345', 'Bidar Cyber Cell HQ', 'active', '2026-01-14 11:00:00'),
('USR-OFF-003', 'Insp. Mohammed Farhan', 'officer.traffic@grievancetrack.demo', 'Officer@123', 'officer', 'DEP-TRA', '+91 94483 45678', 'Central Traffic Police Station', 'active', '2026-01-15 09:30:00'),
('USR-OFF-004', 'Anand Kulkarni', 'officer.water@grievancetrack.demo', 'Officer@123', 'officer', 'DEP-WAT', '+91 98450 78901', 'CMC Water Works Division', 'active', '2026-01-18 14:00:00'),

-- Citizens
('USR-CIT-001', 'Rahul Sharma', 'citizen@grievancetrack.demo', 'Citizen@123', 'citizen', NULL, '+91 91234 56789', 'Ward 04', 'active', '2026-02-01 10:00:00'),
('USR-CIT-002', 'Priya Kamble', 'priya.kamble@citizen.demo', 'Citizen@123', 'citizen', NULL, '+91 98450 11223', 'Ward 08', 'active', '2026-02-03 11:20:00'),
('USR-CIT-003', 'Basavaraj Patil', 'basavaraj.patil@citizen.demo', 'Citizen@123', 'citizen', NULL, '+91 94480 33445', 'Ward 03', 'active', '2026-02-05 14:15:00'),
('USR-CIT-004', 'Fatima Zahra', 'fatima.zahra@citizen.demo', 'Citizen@123', 'citizen', NULL, '+91 97410 55667', 'Ward 07', 'active', '2026-02-10 16:40:00');

-- 3. Complaints
INSERT INTO complaints (complaint_id, citizen_id, dept_id, assigned_officer_id, title, category, description, location, ward_no, landmark, priority, status, incident_date, due_date, attachment_data, created_at, updated_at) VALUES
('GRV-26001', 'USR-CIT-001', 'DEP-CYB', 'USR-OFF-002', 'Fake Electricity Bill Payment Link - ₹18,500 Phishing Fraud', 'Cybercrime and online fraud', 'Received SMS claiming electricity will be disconnected tonight. Clicked APK link and ₹18,500 was debited.', 'Gandhi Gunj Main Road', 'Ward 04', 'Near Syndicate Bank Branch', 'Urgent', 'In Progress', '2026-11-08', '2026-11-12 18:00:00', NULL, '2026-11-08 14:00:00', '2026-11-09 11:00:00'),
('GRV-26002', 'USR-CIT-001', 'DEP-LST', 'USR-OFF-001', 'Lost Samsung S23 Mobile and National ID Wallet', 'Lost property', 'Lost smartphone and driver license pouch near vegetable mandi. CEIR IMEI blocking assistance needed.', 'Daily Vegetable Market', 'Ward 04', 'Vegetable Mandi Gate 2', 'Medium', 'Resolved', '2026-11-06', '2026-11-07 18:00:00', NULL, '2026-11-06 09:30:00', '2026-11-07 16:30:00'),
('GRV-26003', 'USR-CIT-003', 'DEP-ECO', 'USR-OFF-002', 'Unauthorized Bank Transfer of ₹45,000 via KYC Deception', 'Financial fraud', 'Fraudulent caller posed as bank executive asking for Aadhaar verification. Account emptied in 3 transactions.', 'Bank Colony Ring Road', 'Ward 03', 'Near SBI ATM Kiosk', 'Urgent', 'Assigned', '2026-11-03', '2026-11-05 18:00:00', NULL, '2026-11-03 10:15:00', '2026-11-04 12:00:00'),
('GRV-26004', 'USR-CIT-002', 'DEP-TRA', 'USR-OFF-003', 'Dangerous Rash Driving & Lack of Zebra Crossings near School Gate', 'Public safety and traffic-related complaints', 'Heavy trucks and rash two-wheelers exceeding 60 km/h in school zone without speed humps.', 'Mohan Market Complex', 'Ward 08', 'Opposite Govt Boys High School', 'High', 'In Progress', '2026-11-07', '2026-11-11 18:00:00', NULL, '2026-11-07 15:00:00', '2026-11-08 16:00:00'),
('GRV-26005', 'USR-CIT-004', 'DEP-IND', 'USR-OFF-001', 'Repeated Midnight Loudspeaker & Public Nuisance in Residential Alley', 'Complaints involving individuals', 'Commercial sound boxes operated until 2:00 AM every night despite polite neighborhood requests.', 'Naubad Industrial Area Ring Road', 'Ward 11', 'Behind Plot #14 Godown', 'Medium', 'Resolved', '2026-11-06', '2026-11-09 18:00:00', NULL, '2026-11-06 14:00:00', '2026-11-09 17:00:00'),
('GRV-26006', 'USR-CIT-001', 'DEP-LST', NULL, 'Lost Laptop Backpack Containing Educational Degree Certificates', 'Lost property', 'Left black HP laptop bag on city bus #12 while commuting from central stand. Original degree certificates inside.', 'Central Bus Stand Circle', 'Ward 02', 'Platform 4 City Bus Bay', 'Medium', 'Submitted', '2026-11-10', '2026-11-11 18:00:00', NULL, '2026-11-10 09:00:00', '2026-11-10 09:00:00'),
('GRV-26007', 'USR-CIT-003', 'DEP-WAT', 'USR-OFF-004', 'Underground Drinking Water Feeder Pipe Leakage', 'Water Supply', 'Pressurized drinking water pipeline burst creating large puddle and flooding adjacent houses.', 'Pragathi Colony Extn', 'Ward 06', 'Opposite Community Hall', 'High', 'In Progress', '2026-11-07', '2026-11-10 18:00:00', NULL, '2026-11-07 08:30:00', '2026-11-08 11:00:00'),
('GRV-26008', 'USR-CIT-004', 'DEP-ELE', 'USR-OFF-001', 'Four Non-Functional Streetlights in Shiva Nagar Colony', 'Streetlights', 'Complete dark stretch for 300 meters due to burned ballast fixtures. Severe safety issue for evening pedestrians.', 'Shiva Nagar Colony', 'Ward 07', 'Alleyway Behind Temple', 'Medium', 'Resolved', '2026-11-04', '2026-11-06 18:00:00', NULL, '2026-11-04 16:00:00', '2026-11-06 18:00:00'),
('GRV-26009', 'USR-CIT-002', 'DEP-SAN', 'USR-OFF-001', 'Garbage Dump Overflow and Stray Animal Health Hazard', 'Garbage Collection', 'Secondary waste container has not been cleared for 5 days. Severe stench and public health risk.', 'Old City Fort Road', 'Ward 12', 'Near Gole Khana Gate', 'High', 'Resolved', '2026-11-04', '2026-11-05 18:00:00', NULL, '2026-11-04 11:00:00', '2026-11-05 17:00:00'),
('GRV-26010', 'USR-CIT-001', 'DEP-WAT', 'USR-OFF-004', 'Recurring Sewage Backflow in Residential Courtyard', 'Drainage', 'Underground drainage clogged again after temporary rod clearing. Sewage entering houses.', 'Gandhi Gunj Main Market', 'Ward 04', 'Behind Bank of Baroda ATM', 'High', 'Reopened', '2026-11-06', '2026-11-12 18:00:00', NULL, '2026-11-06 13:00:00', '2026-11-10 10:00:00'),
('GRV-26011', 'USR-CIT-001', 'DEP-IND', 'USR-OFF-001', 'Armed Brawl Threat & Public Intimidation at Gunj Market Yard', 'Complaints involving individuals', 'Two transport factions involved in heated altercation with weapons threat at loading dock.', 'Gandhi Gunj Wholesale Yard', 'Ward 04', 'Near Wholesale Grain Shed #2', 'Urgent', 'Assigned', '2026-11-10', '2026-11-12 18:00:00', NULL, '2026-11-10 13:00:00', '2026-11-10 15:00:00'),
('GRV-26012', 'USR-CIT-002', 'DEP-TRA', 'USR-OFF-001', 'Unauthorized Road Encroachment & Night Truck Parking Obstructing Ambulances', 'Public safety and traffic-related complaints', 'Multi-axle container trucks parked across ring road blocking entry to District Hospital trauma center.', 'Naubad Industrial Area Ring Road', 'Ward 11', 'Opposite District Hospital South Gate', 'High', 'Assigned', '2026-11-09', '2026-11-12 18:00:00', NULL, '2026-11-09 18:00:00', '2026-11-10 10:00:00'),
('GRV-26013', 'USR-CIT-004', 'DEP-IND', 'USR-OFF-001', 'Illegal Night Gambling & Loudspeaker Clashes in Residential Alleyway', 'Complaints involving individuals', 'Unlicensed gambling racket operating behind vacant mill with loud clashes disturbing families.', 'Shiva Nagar Colony', 'Ward 07', 'Near Old Cotton Mill Compound', 'High', 'In Progress', '2026-11-07', '2026-11-11 18:00:00', NULL, '2026-11-07 12:00:00', '2026-11-08 14:00:00'),
('GRV-26014', 'USR-CIT-001', 'DEP-ROA', 'USR-OFF-001', 'Dangerous Dilapidated Commercial Wall Leaning over Pedestrian Walkway', 'Public safety and traffic-related complaints', 'Brick wall of abandoned godown developed 4-inch vertical cracks and is bulging directly over pavement.', 'Mohan Market Complex', 'Ward 08', 'Adjacent to Janata Supermarket', 'Medium', 'In Progress', '2026-11-06', '2026-11-13 18:00:00', NULL, '2026-11-06 15:00:00', '2026-11-07 11:00:00'),
('GRV-26015', 'USR-CIT-002', 'DEP-IND', 'USR-OFF-001', 'Repeated Eve-Teasing and Intimidation of Female Students at Main Bus Stand', 'Complaints involving individuals', 'Habitual miscreants gathering at city bus shelter harassing students. Previous petition unaddressed.', 'Central Bus Stand Circle', 'Ward 02', 'Platform 3 City Bus Shelter', 'Urgent', 'Assigned', '2026-11-05', '2026-11-07 18:00:00', NULL, '2026-11-05 10:00:00', '2026-11-06 12:00:00'),
('GRV-26016', 'USR-CIT-004', 'DEP-IND', 'USR-OFF-001', 'Severe Boundary Dispute & Threat of Physical Violence between Adjacent Landholders', 'Complaints involving individuals', 'Violent dispute over common drainage boundary. Threat of grievous hurt if municipal work proceeds.', 'Pragathi Colony Extn', 'Ward 06', 'Near Water Overhead Tank #3', 'High', 'In Progress', '2026-11-04', '2026-11-08 18:00:00', NULL, '2026-11-04 11:00:00', '2026-11-05 14:00:00');

-- 4. Complaint History
INSERT INTO complaint_history (complaint_id, changed_by, old_status, new_status, remarks, timestamp) VALUES
('GRV-26001', 'USR-CIT-001', NULL, 'Submitted', 'Grievance lodged online with transaction screenshot attachment.', '2026-11-08 14:00:00'),
('GRV-26001', 'USR-ADM-001', 'Submitted', 'Assigned', 'Assigned to Cybercrime Inspector Sneha Patil. Priority Urgent.', '2026-11-08 16:00:00'),
('GRV-26001', 'USR-OFF-002', 'Assigned', 'In Progress', 'Formal requisition sent to Payment Gateway nodal officer for transaction trace.', '2026-11-09 11:00:00'),
('GRV-26002', 'USR-CIT-001', NULL, 'Submitted', 'Lost phone petition submitted.', '2026-11-06 09:30:00'),
('GRV-26002', 'USR-OFF-001', 'Assigned', 'Resolved', 'CEIR request submitted; device blocked on all telecom operators.', '2026-11-07 16:30:00'),
('GRV-26005', 'USR-CIT-004', NULL, 'Submitted', 'Public nuisance complaint lodged.', '2026-11-06 14:00:00'),
('GRV-26005', 'USR-OFF-001', 'In Progress', 'Resolved', 'Station visit conducted. Sound equipment operators signed bond.', '2026-11-09 17:00:00'),
('GRV-26010', 'USR-CIT-001', 'Resolved', 'Reopened', 'REOPENED BY CITIZEN: Water started leaking back again today.', '2026-11-10 10:00:00'),
('GRV-26011', 'USR-CIT-001', NULL, 'Submitted', 'Urgent grievance submitted by Traders Welfare Committee.', '2026-11-10 13:00:00'),
('GRV-26011', 'USR-ADM-001', 'Submitted', 'Assigned', 'Assigned to SI Suresh Biradar for peace-keeping.', '2026-11-10 15:00:00'),
('GRV-26015', 'USR-CIT-002', NULL, 'Submitted', 'Urgent petition submitted regarding evening bus shelter safety.', '2026-11-05 10:00:00'),
('GRV-26015', 'USR-ADM-001', 'Submitted', 'Assigned', 'Assigned to SI Suresh Biradar. SLA Alert.', '2026-11-05 12:00:00');

-- 5. Notifications
INSERT INTO notifications (user_id, complaint_id, type, message, is_read, created_at) VALUES
('USR-CIT-001', 'GRV-26001', 'STATUS_UPDATE', 'Your cybercrime grievance GRV-26001 is under investigation by Insp. Sneha Patil.', 0, '2026-11-09 11:00:00'),
('USR-CIT-001', 'GRV-26010', 'REOPENED', 'Your grievance GRV-26010 has been successfully reopened. Next step: Super-sucker jetting.', 0, '2026-11-10 10:00:00'),
('USR-OFF-001', 'GRV-26011', 'NEW_ASSIGNMENT', 'Armed Brawl Threat case GRV-26011 at Gandhi Gunj assigned to your desk.', 0, '2026-11-10 15:00:00'),
('USR-OFF-001', 'GRV-26015', 'OVERDUE_ALERT', '⚠️ Case GRV-26015 at Bus Stand Circle is 48 hours past deadline. Action mandatory.', 0, '2026-11-08 09:00:00'),
('USR-ADM-001', 'GRV-26003', 'ESCALATION', '🚨 Case GRV-26003 has exceeded resolution timeline by >48h. Officer: Insp. Sneha Patil.', 0, '2026-11-06 09:00:00');

-- 6. Feedback
INSERT INTO feedback (complaint_id, citizen_id, rating, comments, created_at) VALUES
('GRV-26002', 'USR-CIT-001', 5, 'Quick response from Police Lost & Found cell. IMEI blocking done within 2 hours.', '2026-11-07 18:00:00'),
('GRV-26005', 'USR-CIT-004', 4, 'Peace restored in the alley. Very thankful for police intervention.', '2026-11-09 19:30:00');

-- 7. Reminders
INSERT INTO reminders (complaint_id, recipient_id, reminder_level, sent_at) VALUES
('GRV-26003', 'USR-OFF-002', 1, '2026-11-06 09:00:00'),
('GRV-26015', 'USR-OFF-001', 1, '2026-11-08 09:00:00'),
('GRV-26015', 'USR-OFF-001', 2, '2026-11-09 09:00:00');

-- 8. Audit Logs
INSERT INTO audit_logs (user_id, role, action, complaint_id, description, created_at) VALUES
('USR-ADM-001', 'admin', 'SYSTEM_BOOT', NULL, 'GrievanceTrack In-Browser Relational SQL Engine initialized with 3NF Schema.', '2026-11-10 08:00:00'),
('USR-CIT-001', 'citizen', 'SUBMIT_COMPLAINT', 'GRV-26001', 'Submitted cybercrime grievance regarding phishing fraud.', '2026-11-08 14:00:00'),
('USR-ADM-001', 'admin', 'ASSIGN_COMPLAINT', 'GRV-26001', 'Assigned complaint GRV-26001 to Insp. Sneha Patil (DEP-CYB).', '2026-11-08 16:00:00'),
('USR-OFF-002', 'officer', 'UPDATE_STATUS', 'GRV-26001', 'Updated status to In Progress. Formal requisition sent.', '2026-11-09 11:00:00'),
('USR-CIT-001', 'citizen', 'REOPEN_COMPLAINT', 'GRV-26010', 'Reopened grievance GRV-26010 due to recurring sewage backflow.', '2026-11-10 10:00:00');
