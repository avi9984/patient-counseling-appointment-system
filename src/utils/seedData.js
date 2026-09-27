const db = require('../config/dbStore');
const { v4: uuidv4 } = require('uuid');

const SEED_USERS = [
  {
    id: 'user-sonu-singh',
    name: 'Sonu Singh',
    role: 'AGENT',
    department: 'Patient Counseling',
    email: 'sonu.singh@zenonco.io',
    avatar: 'S',
    activeAppointments: 392
  },
  {
    id: 'user-dr-sharma',
    name: 'Dr. S. Sharma',
    role: 'COACH',
    department: 'Onco-Nutrition & Care',
    email: 'dr.sharma@zenonco.io',
    avatar: 'D',
    activeAppointments: 45
  },
  {
    id: 'user-asif-khan',
    name: 'Asif Khan',
    role: 'AGENT',
    department: 'Patient Counseling',
    email: 'asif.khan@zenonco.io',
    avatar: 'A',
    activeAppointments: 62
  },
  {
    id: 'user-priyanka-joshi',
    name: 'Priyanka Joshi',
    role: 'PC_OPS',
    department: 'Operations',
    email: 'priyanka.j@zenonco.io',
    avatar: 'P',
    activeAppointments: 28
  },
  {
    id: 'user-neha-verma',
    name: 'Neha Verma',
    role: 'COACH',
    department: 'Patient Counseling',
    email: 'neha.v@zenonco.io',
    avatar: 'N',
    activeAppointments: 50
  }
];

const SAMPLE_PATIENTS = [
  { patient: 'prabha devi', contact: 'binod kumar Dwivedi', phone: '8976543278', orderId: '39462', patientId: '273324', type: 'Supplements' },
  { patient: 'Kashyap Pandya', contact: 'KASHYAP PANDYA', phone: '9820194821', orderId: '39450', patientId: '337820', type: 'Consultation' },
  { patient: 'Kuldeep Agarwal', contact: 'Kuldeep Agarwal', phone: '9415029381', orderId: '39441', patientId: '337095', type: 'Consultation' },
  { patient: 'Naveen Agarwal', contact: 'Neelam Agarwal', phone: '9811092834', orderId: '39434', patientId: '285303', type: 'Delivery' },
  { patient: 'Syeda Mushahida', contact: 'Syeda Mushahida', phone: '8750192831', orderId: '39414', patientId: '335785', type: 'Consultation' },
  { patient: 'Jay Prakash Trivedi', contact: 'Jay Prakash Trivedi', phone: '9320184711', orderId: '39413', patientId: '337696', type: 'Delivery' },
  { patient: 'kailash devi', contact: 'kailash devi', phone: '7829104820', orderId: '39389', patientId: '309954', type: 'Consultation' },
  { patient: 'Maitry', contact: 'Maitry', phone: '9820491823', orderId: '39388', patientId: '325566', type: 'Supplements' },
  { patient: 'Mohinder kaur', contact: 'kunal', phone: '9167291830', orderId: '39256', patientId: '178755', type: 'Delivery' },
  { patient: 'Rajendra Prasad', contact: 'Amit Prasad', phone: '9833019284', orderId: '39240', patientId: '184920', type: 'Consultation' },
  { patient: 'Sunita Devi', contact: 'Ramesh Kumar', phone: '9920193820', orderId: '39235', patientId: '190483', type: 'Supplements' },
  { patient: 'Anita Sharma', contact: 'Vikas Sharma', phone: '9711093847', orderId: '39210', patientId: '194820', type: 'Delivery' }
];

const SEED_DOCTORS = [
  {
    id: 'doc-1',
    name: 'Dr. RP Singh',
    code: 'ZH102934',
    mobile: '9876543210',
    email: 'dr.rpsingh@zenonco.io',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    specialization: 'Surgical Oncology',
    hospital: 'Heritage Hospital & Cancer Center',
    experience: '14 years',
    status: 'active',
    rating: 4.9,
    patientsReferred: 50,
    activePatients: 18,
    totalConsultations: 142,
    referralCode: 'RPS50',
    verificationStatus: 'VERIFIED',
    createdAt: '2026-01-15T10:00:00Z'
  },
  {
    id: 'doc-2',
    name: 'Dr. Rishi Keshari',
    code: 'ZH294810',
    mobile: '9823456789',
    email: 'rishi.keshari@zenonco.io',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    specialization: 'Medical Oncology',
    hospital: 'Galaxy Super Speciality Hospital',
    experience: '9 years',
    status: 'active',
    rating: 4.8,
    patientsReferred: 32,
    activePatients: 12,
    totalConsultations: 88,
    referralCode: 'RISHI32',
    verificationStatus: 'VERIFIED',
    createdAt: '2026-02-10T11:30:00Z'
  },
  {
    id: 'doc-3',
    name: 'Dr. Wasim Akhtar',
    code: 'ZH339481',
    mobile: '9456781234',
    email: 'dr.wasim@zenonco.io',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    specialization: 'Radiation Oncology',
    hospital: 'Era Lucknow Medical College',
    experience: '11 years',
    status: 'active',
    rating: 4.7,
    patientsReferred: 24,
    activePatients: 9,
    totalConsultations: 64,
    referralCode: 'WASIM24',
    verificationStatus: 'VERIFIED',
    createdAt: '2026-03-01T09:00:00Z'
  },
  {
    id: 'doc-4',
    name: 'Dr. Arpit Maurya',
    code: 'ZH492810',
    mobile: '9123456780',
    email: 'arpit.m@zenonco.io',
    city: 'Purani bazar jaunpur',
    state: 'Uttar Pradesh',
    specialization: 'Integrative Oncology & Nutrition',
    hospital: 'Maurya Cancer & Health Clinic',
    experience: '7 years',
    status: 'active',
    rating: 4.6,
    patientsReferred: 19,
    activePatients: 6,
    totalConsultations: 45,
    referralCode: 'ARPIT19',
    verificationStatus: 'VERIFIED',
    createdAt: '2026-04-12T14:20:00Z'
  },
  {
    id: 'doc-5',
    name: 'Dr. Pawan Kumar Maurya',
    code: 'ZH582910',
    mobile: '9834567890',
    email: 'dr.pawan@zenonco.io',
    city: 'Begumganj chungi jaunpur',
    state: 'Uttar Pradesh',
    specialization: 'Palliative Care & Pain Management',
    hospital: 'District Multi-Care Hospital',
    experience: '12 years',
    status: 'active',
    rating: 4.9,
    patientsReferred: 41,
    activePatients: 15,
    totalConsultations: 110,
    referralCode: 'PAWAN41',
    verificationStatus: 'VERIFIED',
    createdAt: '2026-02-28T16:00:00Z'
  },
  {
    id: 'doc-6',
    name: 'Dr. Saurabh Singh',
    code: 'ZH682914',
    mobile: '9812345678',
    email: 'saurabh.singh@zenonco.io',
    city: 'Bhira market Azamgarh',
    state: 'Uttar Pradesh',
    specialization: 'Onco-Nutrition & Surgery',
    hospital: 'Singh Medical Center & Clinic',
    experience: '8 years',
    status: 'active',
    rating: 4.8,
    patientsReferred: 28,
    activePatients: 10,
    totalConsultations: 72,
    referralCode: 'SAURABH28',
    verificationStatus: 'VERIFIED',
    createdAt: '2026-05-18T10:15:00Z'
  },
  {
    id: 'doc-7',
    name: 'Dr. Priya Goyal',
    code: 'ZH042957',
    mobile: '9922334455',
    email: 'priya.goyal@zenonco.io',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    specialization: 'Ayurvedic Oncology & Integrative Care',
    hospital: 'ZenOnco Wellness Pavilion',
    experience: '10 years',
    status: 'active',
    rating: 5.0,
    patientsReferred: 65,
    activePatients: 26,
    totalConsultations: 195,
    referralCode: 'PRIYA65',
    verificationStatus: 'VERIFIED',
    createdAt: '2026-01-05T08:30:00Z'
  }
];

const SEED_TOP_REFERRERS = [
  { id: 'ref-1', name: 'Priya Goyal', code: 'ZH042957', city: 'Varanasi', doctorsReferred: 2, rank: 1, avatar: 'PG' },
  { id: 'ref-2', name: 'Dr S Sharma', code: 'ZH149069', city: 'Varanasi', doctorsReferred: 1, rank: 2, avatar: 'SS' },
  { id: 'ref-3', name: 'Subhamay Panday', code: 'ZH234617', city: 'Varanasi', doctorsReferred: 1, rank: 3, avatar: 'SP' },
  { id: 'ref-4', name: 'Dr. Wasim Akhtar', code: 'ZH336942', city: 'Lucknow', doctorsReferred: 1, rank: 4, avatar: 'WA' },
  { id: 'ref-5', name: 'Dr. Pawan Maurya', code: 'ZH336941', city: 'Jaunpur', doctorsReferred: 1, rank: 5, avatar: 'PM' }
];

async function seed() {
  await db.init();
  
  console.log('[Seed] Seeding database with initial records...');
  db.data.users = SEED_USERS;
  db.data.appointments = [];
  db.data.bulkJobs = [];
  db.data.auditLogs = [];
  db.data.doctors = SEED_DOCTORS;
  db.data.topReferrers = SEED_TOP_REFERRERS;

  const totalToGenerate = 392;
  const now = new Date('2026-09-16T15:53:00Z');

  for (let i = 0; i < totalToGenerate; i++) {
    const template = SAMPLE_PATIENTS[i % SAMPLE_PATIENTS.length];
    const orderNum = 39462 - i;
    const patientNum = 273324 + (i * 123) % 100000;
    
    const createdOffset = Math.floor(i / 15);
    const createdDate = new Date(now.getTime() - createdOffset * 86400000 - (i % 15) * 3600000);
    const dueDate = new Date(createdDate.getTime() + 86400000 * 2);

    const isFirstRow = (i === 0);
    const appointment = {
      id: uuidv4(),
      orderId: isFirstRow ? '39462' : `${orderNum}`,
      patientId: isFirstRow ? '273324' : `${patientNum}`,
      patientName: template.patient,
      contactName: template.contact,
      contactPhone: template.phone,
      pocPhone: '9096350273',
      pocName: 'ZenOnco.io Suppl Cancer Care',
      assigneeId: 'user-sonu-singh',
      assigneeName: 'Sonu Singh',
      coachId: (i % 3 === 0) ? 'user-sonu-singh' : 'user-dr-sharma',
      coachName: (i % 3 === 0) ? 'Sonu Singh' : 'Dr. S. Sharma',
      pcOpsId: 'user-sonu-singh',
      pcOpsName: 'Sonu Singh',
      createdById: 'user-sonu-singh',
      createdByName: 'Sonu Singh',
      priority: (i % 5 === 0) ? 'high' : 'medium',
      status: (i % 10 === 0) ? 'COMPLETED' : (i % 25 === 0) ? 'CANCELLED' : 'CONFIRMED',
      type: template.type,
      bookingStatus: isFirstRow ? 'Order confirmed from partner' : 'Consultation Scheduled',
      nextStep: isFirstRow ? 'Upload tracking number' : 'Follow-up Call',
      revenue: (i % 2 === 0) ? 1499 : 2999,
      isNew: (i < 8),
      isReferralOnly: (i % 7 === 0),
      callStatus: (i === 4) ? 'IN_PROGRESS' : 'IDLE',
      version: 1,
      createdAt: createdDate.toISOString(),
      dueDate: dueDate.toISOString(),
      updatedAt: createdDate.toISOString()
    };
    db.data.appointments.push(appointment);
  }

  await db.persist();
  console.log(`[Seed] Seeded ${db.data.users.length} users, ${db.data.appointments.length} appointments, and ${db.data.doctors.length} doctors!`);
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seed;
