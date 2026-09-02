import {
  School,
  Level,
  Account,
  AccountLevelRole,
  Teacher,
  Subject,
  TimetableSlot,
  PeriodSwap,
  LogbookEntry,
  Payslip,
  Award,
  Dispute,
  Notification,
  AttendanceRecord,
  ExpectedTarget,
  PayrollPeriod,
  UserRole,
  EducationLevelType,
  HIGH_SECURITY_ROLES,
} from '../types';

const STORAGE_KEY = 'manager_pro_db_v4';

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface RealtimeDispatchEvent {
  id: string;
  channel: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'DISPATCH' | 'SWAP_APPROVED';
  table: string;
  target: string; // e.g. "teacher:tch_01" or "role:VP"
  payload: Record<string, unknown>;
  timestamp: string;
}

interface DatabaseState {
  schools: School[];
  levels: Level[];
  accounts: Account[];
  account_level_roles: AccountLevelRole[];
  teachers: Teacher[];
  subjects: Subject[];
  timetable_slots: TimetableSlot[];
  period_swaps: PeriodSwap[];
  logbook_entries: LogbookEntry[];
  payslips: Payslip[];
  awards: Award[];
  disputes: Dispute[];
  notifications: Notification[];
  attendance_records: AttendanceRecord[];
  expected_targets: ExpectedTarget[];
  payroll_periods: PayrollPeriod[];
  offline_conflicts: Array<{
    id: string;
    table_name: string;
    record_id: string;
    server_version: number;
    incoming_version: number;
    losing_payload: unknown;
    winning_payload: unknown;
    resolved_at: string;
  }>;
}

// Initial Seed Data for immediate testing & demonstration
const INITIAL_SCHOOL: School = {
  id: 'sch_sbc_001',
  name: 'Saker Baptist College',
  teacher_id_prefix: 'SBC',
  created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
  updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
  version: 1,
};

const INITIAL_LEVELS: Level[] = [
  {
    id: 'lvl_secondary_001',
    school_id: 'sch_sbc_001',
    name: 'Secondary',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },
  {
    id: 'lvl_primary_002',
    school_id: 'sch_sbc_001',
    name: 'Primary',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },
];

const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc_founder_01',
    phone_number: '+237670000001',
    pin_hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', // 123456
    full_name: 'Dr. Enow Tamba',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'acc_principal_02',
    phone_number: '+237670000002',
    pin_hash: 'b11b4028020cf0113f8c5b08c9cd8c2d96677f5a89403d97f2597ffc640e7939', // 654321
    full_name: 'Mrs. Beatrice Lum',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'acc_vp_03',
    phone_number: '+237670000003',
    pin_hash: '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', // 112233
    full_name: 'Mr. Joseph Ngu',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'acc_dm_04',
    phone_number: '+237670000004',
    pin_hash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // 1234
    full_name: 'Mr. Samuel Eto',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'acc_sec_05',
    phone_number: '+237670000005',
    pin_hash: 'd74ff0ee8da3b9806b18c877dbf29bbde50b5bd8e4dad7a3a725000feb82e8f1', // 4321
    full_name: 'Ms. Florence Bi',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'acc_fin_06',
    phone_number: '+237670000006',
    pin_hash: 'd2db62b9a7c88b0a996d997d91cb09c4883bb17b6dc9148d424b9a8cf68019b8', // 889900
    full_name: 'Mr. Patrick Mbarga',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'acc_tch_07',
    phone_number: '+237670000007',
    pin_hash: 'a10b0e50e82cb56314f86d4e12e13203f9050d5ecbbd9ecae6937e2a4bebeaf3', // 7788
    full_name: 'Mr. Christian Tabi',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'acc_tch_08',
    phone_number: '+237670000008',
    pin_hash: 'a10b0e50e82cb56314f86d4e12e13203f9050d5ecbbd9ecae6937e2a4bebeaf3', // 7788
    full_name: 'Mrs. Sarah Eposi',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'acc_tch_09',
    phone_number: '+237670000009',
    pin_hash: 'a10b0e50e82cb56314f86d4e12e13203f9050d5ecbbd9ecae6937e2a4bebeaf3', // 7788
    full_name: 'Mr. Marcus Fon',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'acc_tch_10',
    phone_number: '+237670000010',
    pin_hash: 'a10b0e50e82cb56314f86d4e12e13203f9050d5ecbbd9ecae6937e2a4bebeaf3', // 7788
    full_name: 'Dr. Grace Njie',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'acc_tch_11',
    phone_number: '+237670000011',
    pin_hash: 'a10b0e50e82cb56314f86d4e12e13203f9050d5ecbbd9ecae6937e2a4bebeaf3', // 7788
    full_name: 'Mr. Roland Akum',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'acc_tch_12',
    phone_number: '+237670000012',
    pin_hash: 'a10b0e50e82cb56314f86d4e12e13203f9050d5ecbbd9ecae6937e2a4bebeaf3', // 7788
    full_name: 'Mme. Marie Claire Mengue',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'acc_tch_13',
    phone_number: '+237670000013',
    pin_hash: 'a10b0e50e82cb56314f86d4e12e13203f9050d5ecbbd9ecae6937e2a4bebeaf3', // 7788
    full_name: 'Ms. Paulina Enow',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'acc_tch_14',
    phone_number: '+237670000014',
    pin_hash: 'a10b0e50e82cb56314f86d4e12e13203f9050d5ecbbd9ecae6937e2a4bebeaf3', // 7788
    full_name: 'Rev. David Agbor',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'acc_tch_15',
    phone_number: '+237670000015',
    pin_hash: 'a10b0e50e82cb56314f86d4e12e13203f9050d5ecbbd9ecae6937e2a4bebeaf3', // 7788
    full_name: 'Mr. Daniel Mbella',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
];

const INITIAL_ROLES: AccountLevelRole[] = [
  {
    id: 'alr_01',
    account_id: 'acc_founder_01',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    role: 'Founder',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alr_02',
    account_id: 'acc_principal_02',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    role: 'Principal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alr_03',
    account_id: 'acc_principal_02',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_primary_002',
    role: 'Principal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alr_04',
    account_id: 'acc_vp_03',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    role: 'VP',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alr_05',
    account_id: 'acc_dm_04',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    role: 'DM',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alr_06',
    account_id: 'acc_sec_05',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    role: 'Secretary',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alr_07',
    account_id: 'acc_fin_06',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    role: 'Finance',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alr_08',
    account_id: 'acc_tch_07',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    role: 'Teacher',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alr_09',
    account_id: 'acc_tch_08',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    role: 'Teacher',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alr_10',
    account_id: 'acc_tch_09',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    role: 'Teacher',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alr_11',
    account_id: 'acc_tch_10',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    role: 'Teacher',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alr_12',
    account_id: 'acc_tch_11',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    role: 'Teacher',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alr_13',
    account_id: 'acc_tch_12',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    role: 'Teacher',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alr_14',
    account_id: 'acc_tch_13',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    role: 'Teacher',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alr_15',
    account_id: 'acc_tch_14',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    role: 'Teacher',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alr_16',
    account_id: 'acc_tch_15',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    role: 'Teacher',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'tch_01',
    account_id: 'acc_tch_07',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    teacher_code: 'SBC-T-0001',
    photo_url: null,
    dob: '1988-04-12',
    gender: 'M',
    date_recruited: '2021-09-01',
    qualification: 'DIPES II Mathematics',
    department: 'Mathematics & Science',
    contract_type: 'permanent',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'tch_02',
    account_id: 'acc_tch_08',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    teacher_code: 'SBC-T-0002',
    photo_url: null,
    dob: '1990-08-22',
    gender: 'F',
    date_recruited: '2020-09-01',
    qualification: 'BA English Language & Literature',
    department: 'Languages',
    contract_type: 'permanent',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'tch_03',
    account_id: 'acc_tch_09',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    teacher_code: 'SBC-T-0003',
    photo_url: null,
    dob: '1985-02-14',
    gender: 'M',
    date_recruited: '2019-09-01',
    qualification: 'MSc Organic Chemistry & Biology',
    department: 'Science',
    contract_type: 'permanent',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'tch_04',
    account_id: 'acc_tch_10',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    teacher_code: 'SBC-T-0004',
    photo_url: null,
    dob: '1992-11-03',
    gender: 'F',
    date_recruited: '2022-09-01',
    qualification: 'MEng Software Engineering & Computer Science',
    department: 'Computer Science & ICT',
    contract_type: 'permanent',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'tch_05',
    account_id: 'acc_tch_11',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    teacher_code: 'SBC-T-0005',
    photo_url: null,
    dob: '1989-06-19',
    gender: 'M',
    date_recruited: '2021-01-15',
    qualification: 'MSc Economics & Public Policy',
    department: 'Economics & Commerce',
    contract_type: 'permanent',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'tch_06',
    account_id: 'acc_tch_12',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    teacher_code: 'SBC-T-0006',
    photo_url: null,
    dob: '1987-12-05',
    gender: 'F',
    date_recruited: '2018-09-01',
    qualification: 'DIPES II Lettres Modernes Françaises',
    department: 'French & Littérature',
    contract_type: 'permanent',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'tch_07',
    account_id: 'acc_tch_13',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    teacher_code: 'SBC-T-0007',
    photo_url: null,
    dob: '1991-03-30',
    gender: 'F',
    date_recruited: '2022-01-10',
    qualification: 'BSc Human Biology & Physiology',
    department: 'Science',
    contract_type: 'part_time',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'tch_08',
    account_id: 'acc_tch_14',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    teacher_code: 'SBC-T-0008',
    photo_url: null,
    dob: '1979-07-08',
    gender: 'M',
    date_recruited: '2015-09-01',
    qualification: 'MTh Biblical Studies & Ethics',
    department: 'Religious Studies',
    contract_type: 'permanent',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'tch_09',
    account_id: 'acc_tch_15',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    teacher_code: 'SBC-T-0009',
    photo_url: null,
    dob: '1993-05-18',
    gender: 'M',
    date_recruited: '2023-09-01',
    qualification: 'BA Music & Performing Arts',
    department: 'Arts & Music',
    contract_type: 'part_time',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
];

// Phase 2 Seed: Sensible default subjects for Secondary & Primary
const INITIAL_SUBJECTS: Subject[] = [
  // Secondary level
  {
    id: 'sub_01',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    name: 'Mathematics',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },
  {
    id: 'sub_02',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    name: 'English Language',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },
  {
    id: 'sub_03',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    name: 'Computer Science',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },
  {
    id: 'sub_04',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    name: 'Economics',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },
  {
    id: 'sub_05',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    name: 'French',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },
  {
    id: 'sub_06',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    name: 'Littérature',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },
  {
    id: 'sub_07',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    name: 'Biology',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },
  {
    id: 'sub_08',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    name: 'Chemistry',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },
  {
    id: 'sub_09',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    name: 'Human Biology',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },
  {
    id: 'sub_10',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    name: 'Religious Studies',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },
  {
    id: 'sub_11',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    name: 'Music',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },
  {
    id: 'sub_12',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    name: 'Physics',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },

  // Primary level
  {
    id: 'sub_pri_01',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_primary_002',
    name: 'Mathematics / Calcul',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },
  {
    id: 'sub_pri_02',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_primary_002',
    name: 'English Grammar & Reading',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },
  {
    id: 'sub_pri_03',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_primary_002',
    name: 'French / Expression Orale',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },
  {
    id: 'sub_pri_04',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_primary_002',
    name: 'General Science & Health',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    version: 1,
  },
];

// Color palette for subjects and slots
export const PRESET_COLORS = [
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#0891b2', // Cyan
  '#059669', // Emerald
  '#d97706', // Amber
  '#dc2626', // Red
  '#db2777', // Pink
  '#4f46e5', // Indigo
  '#0d9488', // Teal
  '#ea580c', // Orange
];

const INITIAL_SLOTS: TimetableSlot[] = [
  {
    id: 'slot_01',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    subject_id: 'sub_01', // Mathematics
    class_name: 'Form 5 Science',
    day: 'Monday',
    start_time: '08:00',
    duration: 50,
    teacher_id: 'tch_01', // Christian Tabi
    color: '#2563eb',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'slot_02',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    subject_id: 'sub_02', // English Language
    class_name: 'Form 5 Science',
    day: 'Monday',
    start_time: '08:50',
    duration: 50,
    teacher_id: 'tch_02', // Sarah Eposi
    color: '#7c3aed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'slot_03',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    subject_id: 'sub_03', // Computer Science
    class_name: 'Form 5 Science',
    day: 'Monday',
    start_time: '10:00',
    duration: 50,
    teacher_id: 'tch_04', // Dr. Grace Njie
    color: '#0891b2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'slot_04',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    subject_id: 'sub_08', // Chemistry
    class_name: 'Form 5 Science',
    day: 'Tuesday',
    start_time: '08:00',
    duration: 50,
    teacher_id: 'tch_03', // Marcus Fon
    color: '#059669',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'slot_05',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    subject_id: 'sub_04', // Economics
    class_name: 'Lower Sixth Arts',
    day: 'Tuesday',
    start_time: '08:50',
    duration: 50,
    teacher_id: 'tch_05', // Roland Akum
    color: '#d97706',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'slot_06',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    subject_id: 'sub_05', // French
    class_name: 'Form 4 Bilingual',
    day: 'Wednesday',
    start_time: '08:00',
    duration: 50,
    teacher_id: 'tch_06', // Marie Claire Mengue
    color: '#ea580c',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'slot_07',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    subject_id: 'sub_09', // Human Biology
    class_name: 'Form 5 Science',
    day: 'Wednesday',
    start_time: '10:00',
    duration: 50,
    teacher_id: 'tch_07', // Paulina Enow
    color: '#0d9488',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'slot_08',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    subject_id: 'sub_10', // Religious Studies
    class_name: 'Form 3 General',
    day: 'Thursday',
    start_time: '08:50',
    duration: 50,
    teacher_id: 'tch_08', // Rev. David Agbor
    color: '#4f46e5',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'slot_09',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    subject_id: 'sub_11', // Music
    class_name: 'Form 2 Arts',
    day: 'Friday',
    start_time: '11:00',
    duration: 50,
    teacher_id: 'tch_09', // Daniel Mbella
    color: '#db2777',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
];

const INITIAL_SWAPS: PeriodSwap[] = [
  {
    id: 'swap_01',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    timetable_slot_id: 'slot_01',
    requested_by_teacher_id: 'tch_01', // Christian Tabi
    suggested_replacement_id: 'tch_04', // Dr. Grace Njie (Mathematics/CS qualified)
    assigned_replacement_id: null,
    status: 'pending',
    approved_by: null,
    reason: 'Attending regional mathematics pedagogy colloquium in Douala.',
    log: [
      {
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        account_id: 'acc_tch_07',
        action: 'REQUESTED_UNAVAILABLE',
        note: 'Teacher declared unavailable; suggested Dr. Grace Njie as replacement.',
      },
    ],
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

const INITIAL_LOGBOOK_ENTRIES: LogbookEntry[] = [
  {
    id: 'log_01',
    teacher_id: 'tch_01',
    timetable_slot_id: 'slot_01',
    academic_year: '2025–2026',
    date: '2026-03-02',
    period: 1,
    class_name: 'Form 5 Science',
    subject_id: 'sub_01',
    lesson_title: 'Quadratic Systems & Directrix Properties',
    content_summary: 'Comprehensive geometric derivation of focal parameters and algebraic solutions for second-degree polynomial curves.',
    homework_assigned: 'Exercise set 4B on textbook page 142, problems 1 through 16.',
    absentee_count: 2,
    homework_checked: true,
    homework_note: 'Checked all student notebooks. 2 absent students notified.',
    signature_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60"><path d="M10,40 Q40,8 75,35 T130,22 T170,32" stroke="%232563eb" stroke-width="2.5" fill="none"/></svg>',
    signed_at: new Date('2026-03-02T08:52:00Z').toISOString(),
    pin_confirmed: true,
    created_at: new Date('2026-03-02T08:52:00Z').toISOString(),
    updated_at: new Date('2026-03-02T08:52:00Z').toISOString(),
    version: 1,
  },
  {
    id: 'log_02',
    teacher_id: 'tch_01',
    timetable_slot_id: 'slot_01',
    academic_year: '2025–2026',
    date: '2026-02-23',
    period: 1,
    class_name: 'Form 5 Science',
    subject_id: 'sub_01',
    lesson_title: 'Discriminant Signs and Roots Classification',
    content_summary: 'Proof of real, equal, and complex roots using discriminant delta. Worked through 4 past regional exam questions.',
    homework_assigned: 'Handout #3, problems 7 to 15.',
    absentee_count: 1,
    homework_checked: true,
    homework_note: 'Satisfactory completion across all groups.',
    signature_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60"><path d="M10,40 Q40,8 75,35 T130,22 T170,32" stroke="%232563eb" stroke-width="2.5" fill="none"/></svg>',
    signed_at: new Date('2026-02-23T08:54:00Z').toISOString(),
    pin_confirmed: true,
    created_at: new Date('2026-02-23T08:54:00Z').toISOString(),
    updated_at: new Date('2026-02-23T08:54:00Z').toISOString(),
    version: 1,
  },
  {
    id: 'log_03',
    teacher_id: 'tch_01',
    timetable_slot_id: 'slot_01',
    academic_year: '2025–2026',
    date: '2026-02-16',
    period: 1,
    class_name: 'Form 5 Science',
    subject_id: 'sub_01',
    lesson_title: 'Synthetic Division & Remainder Theorem',
    content_summary: 'Introduction to synthetic polynomial division algorithm and algebraic proof of the Remainder Theorem.',
    homework_assigned: 'Exercises 3A, page 92, #1-10.',
    absentee_count: 0,
    homework_checked: true,
    homework_note: 'Whole class turned in homework successfully.',
    signature_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60"><path d="M10,40 Q40,8 75,35 T130,22 T170,32" stroke="%232563eb" stroke-width="2.5" fill="none"/></svg>',
    signed_at: new Date('2026-02-16T08:51:00Z').toISOString(),
    pin_confirmed: true,
    created_at: new Date('2026-02-16T08:51:00Z').toISOString(),
    updated_at: new Date('2026-02-16T08:51:00Z').toISOString(),
    version: 1,
  },
];

const INITIAL_PAYSLIPS: Payslip[] = [
  {
    id: 'ps_01',
    payroll_period_id: 'pr_2026_02',
    teacher_id: 'tch_01',
    month_label: 'February 2026',
    month_key: '2026-02',
    base_amount: 250000,
    extra_hours_amount: 35000,
    extra_hours_count: 14,
    hourly_rate: 2500,
    contract_type: 'permanent',
    deductions: 0,
    total: 285000,
    status: 'dispatched',
    dispatched_at: '2026-03-01T09:00:00Z',
    payment_method: 'MTN Mobile Money (+237 670 000 007)',
    pdf_url: null,
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-03-01T09:00:00Z',
  },
  {
    id: 'ps_02',
    payroll_period_id: 'pr_2026_01',
    teacher_id: 'tch_01',
    month_label: 'January 2026',
    month_key: '2026-01',
    base_amount: 250000,
    extra_hours_amount: 20000,
    extra_hours_count: 8,
    hourly_rate: 2500,
    contract_type: 'permanent',
    deductions: 0,
    total: 270000,
    status: 'paid',
    dispatched_at: '2026-02-01T10:00:00Z',
    payment_method: 'MTN Mobile Money (+237 670 000 007)',
    pdf_url: null,
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 'ps_03',
    payroll_period_id: 'pr_2025_12',
    teacher_id: 'tch_01',
    month_label: 'December 2025',
    month_key: '2025-12',
    base_amount: 250000,
    extra_hours_amount: 25000,
    extra_hours_count: 10,
    hourly_rate: 2500,
    contract_type: 'permanent',
    deductions: 0,
    total: 275000,
    status: 'paid',
    dispatched_at: '2026-01-02T11:00:00Z',
    payment_method: 'MTN Mobile Money (+237 670 000 007)',
    pdf_url: null,
    created_at: '2026-01-02T11:00:00Z',
    updated_at: '2026-01-02T11:00:00Z',
  },
];

const INITIAL_AWARDS: Award[] = [
  {
    id: 'aw_01',
    teacher_id: 'tch_01',
    title: 'Excellence in Mathematics Pedagogy & Term 1 Punctuality',
    bonus_amount: 50000,
    awarded_by: 'Principal Mrs. Beatrice Lum',
    term: 'Term 1, 2025–2026',
    awarded_at: '2025-12-18T14:30:00Z',
    created_at: '2025-12-18T14:30:00Z',
  },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_01',
    account_id: 'acc_tch_07',
    type: 'salary',
    title: 'Salary Dispatched',
    body: 'Your February 2026 salary of 285,000 FCFA has been dispatched via Mobile Money.',
    read: false,
    link_tab: 'payslip',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'notif_02',
    account_id: 'acc_tch_07',
    type: 'swap',
    title: 'Period Swap Assigned',
    body: 'VP Mr. Joseph Ngu approved cover for Form 5 Science. Substitute confirmed.',
    read: false,
    link_tab: 'timetable',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'notif_03',
    account_id: 'acc_tch_07',
    type: 'reminder',
    title: 'Logbook Reminder',
    body: 'Period 1 Form 5 Science lesson has completed. Please review and submit your logbook.',
    read: true,
    link_tab: 'logbook',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'notif_04',
    account_id: 'acc_tch_07',
    type: 'award',
    title: 'Award Received',
    body: 'Congratulations! You received the Term 1 Punctuality & Pedagogy Award.',
    read: true,
    link_tab: 'awards',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

const INITIAL_DISPUTES: Dispute[] = [
  {
    id: 'disp_02',
    related_record_type: 'attendance',
    related_record_id: 'att_03',
    teacher_id: 'tch_04',
    reason: 'Campus electrical transformer spark blocked main entrance gate. Arrived at gate 10:04, security detained vehicles until 10:20. Lesson was fully delivered with class prefect endorsement.',
    status: 'pending',
    resolved_by: null,
    resolution_note: null,
    created_at: '2026-09-02T10:30:00Z',
    updated_at: '2026-09-02T10:30:00Z',
  },
  {
    id: 'disp_01',
    related_record_type: 'attendance',
    related_record_id: 'att_01',
    teacher_id: 'tch_01',
    reason: 'Lateness flag generated during campus gate network outage; arrived at 07:50 as confirmed by DM.',
    status: 'resolved',
    resolved_by: 'acc_dm_04',
    resolution_note: 'Confirmed with DM Samuel Eto. Lateness record cleared; no deduction applied.',
    created_at: '2026-02-25T11:00:00Z',
    updated_at: '2026-02-25T16:00:00Z',
  },
];

const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: 'att_01',
    teacher_id: 'tch_01',
    timetable_slot_id: 'slot_01', // Math 08:00
    date: '2026-09-02',
    scheduled_start_time: '08:00',
    marked_present_at: '2026-09-02T07:58:00Z',
    secretary_id: 'acc_sec_05',
    late_minutes: 0,
    status: 'on_time',
    created_at: '2026-09-02T07:58:00Z',
    updated_at: '2026-09-02T07:58:00Z',
    version: 1,
  },
  {
    id: 'att_02',
    teacher_id: 'tch_02',
    timetable_slot_id: 'slot_02', // English 08:50
    date: '2026-09-02',
    scheduled_start_time: '08:50',
    marked_present_at: '2026-09-02T08:58:00Z',
    secretary_id: 'acc_sec_05',
    late_minutes: 8,
    status: 'late',
    created_at: '2026-09-02T08:58:00Z',
    updated_at: '2026-09-02T08:58:00Z',
    version: 1,
  },
  {
    id: 'att_03',
    teacher_id: 'tch_04',
    timetable_slot_id: 'slot_03', // CS 10:00
    date: '2026-09-02',
    scheduled_start_time: '10:00',
    marked_present_at: '2026-09-02T10:22:00Z',
    secretary_id: 'acc_sec_05',
    late_minutes: 22,
    status: 'cancelled_unpaid',
    created_at: '2026-09-02T10:22:00Z',
    updated_at: '2026-09-02T10:22:00Z',
    version: 1,
  },
  {
    id: 'att_04',
    teacher_id: 'tch_01',
    timetable_slot_id: 'slot_01',
    date: '2026-09-01',
    scheduled_start_time: '08:00',
    marked_present_at: '2026-09-01T07:55:00Z',
    secretary_id: 'acc_sec_05',
    late_minutes: 0,
    status: 'on_time',
    created_at: '2026-09-01T07:55:00Z',
    updated_at: '2026-09-01T07:55:00Z',
    version: 1,
  },
  {
    id: 'att_05',
    teacher_id: 'tch_01',
    timetable_slot_id: 'slot_05',
    date: '2026-08-31',
    scheduled_start_time: '10:00',
    marked_present_at: '2026-08-31T10:02:00Z',
    secretary_id: 'acc_sec_05',
    late_minutes: 2,
    status: 'late',
    created_at: '2026-08-31T10:02:00Z',
    updated_at: '2026-08-31T10:02:00Z',
    version: 1,
  },
  {
    id: 'att_06',
    teacher_id: 'tch_03',
    timetable_slot_id: 'slot_04',
    date: '2026-09-01',
    scheduled_start_time: '10:50',
    marked_present_at: '2026-09-01T10:48:00Z',
    secretary_id: 'acc_sec_05',
    late_minutes: 0,
    status: 'on_time',
    created_at: '2026-09-01T10:48:00Z',
    updated_at: '2026-09-01T10:48:00Z',
    version: 1,
  },
];

const INITIAL_EXPECTED_TARGETS: ExpectedTarget[] = [
  {
    id: 'tgt_01',
    teacher_id: 'tch_01',
    subject_id: 'sub_01', // Mathematics
    class_name: 'Form 5 Science',
    term: 'Term 2',
    expected_periods: 24,
    expected_topics: 8,
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'tgt_02',
    teacher_id: 'tch_01',
    subject_id: 'sub_01', // Mathematics
    class_name: 'Upper 6 Science',
    term: 'Term 2',
    expected_periods: 20,
    expected_topics: 6,
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'tgt_03',
    teacher_id: 'tch_02',
    subject_id: 'sub_02', // English Language
    class_name: 'Form 5 Science',
    term: 'Term 2',
    expected_periods: 18,
    expected_topics: 6,
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'tgt_04',
    teacher_id: 'tch_03',
    subject_id: 'sub_04', // Biology
    class_name: 'Form 5 Science',
    term: 'Term 2',
    expected_periods: 20,
    expected_topics: 7,
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'tgt_05',
    teacher_id: 'tch_03',
    subject_id: 'sub_05', // Chemistry
    class_name: 'Upper 6 Science',
    term: 'Term 2',
    expected_periods: 24,
    expected_topics: 8,
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'tgt_06',
    teacher_id: 'tch_04',
    subject_id: 'sub_03', // Computer Science
    class_name: 'Form 5 Science',
    term: 'Term 2',
    expected_periods: 16,
    expected_topics: 5,
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
];

const INITIAL_PAYROLL_PERIODS: PayrollPeriod[] = [
  {
    id: 'pp_01',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    month: '2026-02',
    status: 'principal_approved',
    archived_at: '2026-02-28T23:59:59Z',
    created_at: '2026-02-01T08:00:00Z',
    updated_at: '2026-02-28T18:00:00Z',
    version: 1,
  },
  {
    id: 'pp_02',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    month: '2026-03',
    status: 'open',
    archived_at: null,
    created_at: '2026-03-01T08:00:00Z',
    updated_at: '2026-03-01T08:00:00Z',
    version: 1,
  },
  {
    id: 'pp_03',
    school_id: 'sch_sbc_001',
    level_id: 'lvl_secondary_001',
    month: '2026-09',
    status: 'open',
    archived_at: null,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
    version: 1,
  },
];

class DatabaseEngine {
  private state: DatabaseState;
  private realtimeListeners: Set<(event: RealtimeDispatchEvent) => void> = new Set();
  private realtimeHistory: RealtimeDispatchEvent[] = [];

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.logbook_entries) parsed.logbook_entries = INITIAL_LOGBOOK_ENTRIES;
        if (!parsed.payslips) parsed.payslips = INITIAL_PAYSLIPS;
        if (!parsed.awards) parsed.awards = INITIAL_AWARDS;
        if (!parsed.notifications) parsed.notifications = INITIAL_NOTIFICATIONS;
        if (!parsed.disputes) parsed.disputes = INITIAL_DISPUTES;
        if (!parsed.period_swaps) parsed.period_swaps = INITIAL_SWAPS;
        if (!parsed.attendance_records) parsed.attendance_records = INITIAL_ATTENDANCE_RECORDS;
        if (!parsed.expected_targets) parsed.expected_targets = INITIAL_EXPECTED_TARGETS;
        if (!parsed.payroll_periods) parsed.payroll_periods = INITIAL_PAYROLL_PERIODS;
        return parsed;
      }
    } catch {
      // ignore
    }

    const initial: DatabaseState = {
      schools: [INITIAL_SCHOOL],
      levels: INITIAL_LEVELS,
      accounts: INITIAL_ACCOUNTS,
      account_level_roles: INITIAL_ROLES,
      teachers: INITIAL_TEACHERS,
      subjects: INITIAL_SUBJECTS,
      timetable_slots: INITIAL_SLOTS,
      period_swaps: INITIAL_SWAPS,
      logbook_entries: INITIAL_LOGBOOK_ENTRIES,
      payslips: INITIAL_PAYSLIPS,
      awards: INITIAL_AWARDS,
      disputes: INITIAL_DISPUTES,
      notifications: INITIAL_NOTIFICATIONS,
      attendance_records: INITIAL_ATTENDANCE_RECORDS,
      expected_targets: INITIAL_EXPECTED_TARGETS,
      payroll_periods: INITIAL_PAYROLL_PERIODS,
      offline_conflicts: [],
    };
    this.saveState(initial);
    return initial;
  }

  private saveState(state: DatabaseState) {
    this.state = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }

  public resetToDefaults() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadState();
    return this.state;
  }

  // --- Realtime Pub/Sub Engine (Simulating Supabase Realtime) ---
  public subscribeToRealtime(callback: (event: RealtimeDispatchEvent) => void) {
    this.realtimeListeners.add(callback);
    return () => {
      this.realtimeListeners.delete(callback);
    };
  }

  public dispatchRealtimeEvent(event: Omit<RealtimeDispatchEvent, 'id' | 'timestamp'>) {
    const fullEvent: RealtimeDispatchEvent = {
      id: 'rt_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.realtimeHistory.unshift(fullEvent);
    if (this.realtimeHistory.length > 50) {
      this.realtimeHistory.pop();
    }
    this.realtimeListeners.forEach((listener) => {
      try {
        listener(fullEvent);
      } catch (err) {
        console.error('Realtime listener error:', err);
      }
    });
    return fullEvent;
  }

  public getRealtimeHistory(): RealtimeDispatchEvent[] {
    return this.realtimeHistory;
  }

  // --- Schools ---
  public getSchools(): School[] {
    return this.state.schools;
  }

  public getSchoolById(id: string): School | undefined {
    return this.state.schools.find((s) => s.id === id);
  }

  // --- Levels ---
  public getLevelsForSchool(schoolId: string): Level[] {
    return this.state.levels.filter((l) => l.school_id === schoolId);
  }

  public getLevelById(id: string): Level | undefined {
    return this.state.levels.find((l) => l.id === id);
  }

  // --- Accounts & Roles ---
  public getAccounts(): Account[] {
    return this.state.accounts;
  }

  public getAccountById(id: string): Account | undefined {
    return this.state.accounts.find((a) => a.id === id);
  }

  public getAccountByPhone(phone: string): Account | undefined {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    return this.state.accounts.find(
      (a) => a.phone_number.replace(/\s+/g, '') === cleanPhone
    );
  }

  public getAccountGrants(accountId: string): AccountLevelRole[] {
    return this.state.account_level_roles.filter((g) => g.account_id === accountId);
  }

  public getGrantsForSchoolLevel(schoolId: string, levelId: string): AccountLevelRole[] {
    return this.state.account_level_roles.filter(
      (g) => g.school_id === schoolId && g.level_id === levelId
    );
  }

  // --- Authentication ---
  public async authenticate(
    phoneNumber: string,
    pin: string,
    schoolId: string,
    levelId: string,
    role: UserRole
  ): Promise<{
    account: Account;
    activeGrant: AccountLevelRole;
    allGrants: AccountLevelRole[];
    school: School;
    level: Level;
  }> {
    const account = this.getAccountByPhone(phoneNumber);
    if (!account) {
      throw new Error('No account found registered with this phone number.');
    }

    const hashedInput = await hashPin(pin.trim());
    if (account.pin_hash !== hashedInput) {
      throw new Error('Incorrect PIN. Please re-check and try again.');
    }

    const isHighSec = HIGH_SECURITY_ROLES.includes(role);
    if (isHighSec && pin.trim().length !== 6) {
      throw new Error('Security policy requires a 6-digit PIN for financial and executive roles.');
    }
    if (!isHighSec && pin.trim().length !== 4) {
      throw new Error('This role requires a 4-digit PIN.');
    }

    const allGrants = this.getAccountGrants(account.id);
    const activeGrant = allGrants.find(
      (g) => g.school_id === schoolId && g.level_id === levelId && g.role === role
    );

    if (!activeGrant) {
      throw new Error(`This account is not authorized as ${role} for this school and level.`);
    }

    const school = this.getSchoolById(schoolId);
    const level = this.getLevelById(levelId);

    if (!school || !level) {
      throw new Error('School or Level configuration could not be resolved.');
    }

    return {
      account,
      activeGrant,
      allGrants,
      school,
      level,
    };
  }

  // --- Onboarding: Register New School ---
  public async registerSchoolOnboarding(params: {
    schoolName: string;
    teacherPrefix: string;
    levels: EducationLevelType[];
    founderFullName: string;
    founderPhone: string;
    founderPin: string;
    founderLevels: EducationLevelType[];
  }): Promise<{
    school: School;
    levels: Level[];
    founderAccount: Account;
    grants: AccountLevelRole[];
  }> {
    const schoolId = 'sch_' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const newSchool: School = {
      id: schoolId,
      name: params.schoolName.trim(),
      teacher_id_prefix: params.teacherPrefix.trim().toUpperCase(),
      created_at: now,
      updated_at: now,
      version: 1,
    };

    const newLevels: Level[] = params.levels.map((lvlName) => ({
      id: 'lvl_' + Math.random().toString(36).substring(2, 9),
      school_id: schoolId,
      name: lvlName,
      created_at: now,
      updated_at: now,
      version: 1,
    }));

    const founderPinHash = await hashPin(params.founderPin.trim());
    const founderAccountId = 'acc_' + Math.random().toString(36).substring(2, 9);

    const newAccount: Account = {
      id: founderAccountId,
      phone_number: params.founderPhone.trim(),
      pin_hash: founderPinHash,
      full_name: params.founderFullName.trim(),
      created_at: now,
      updated_at: now,
      version: 1,
    };

    const targetLevels = newLevels.filter((lvl) => params.founderLevels.includes(lvl.name));
    const levelsToAssign = targetLevels.length > 0 ? targetLevels : newLevels;

    const newGrants: AccountLevelRole[] = levelsToAssign.map((lvl) => ({
      id: 'alr_' + Math.random().toString(36).substring(2, 9),
      account_id: founderAccountId,
      school_id: schoolId,
      level_id: lvl.id,
      role: 'Founder' as UserRole,
      created_at: now,
      updated_at: now,
    }));

    const updatedState: DatabaseState = {
      ...this.state,
      schools: [...this.state.schools, newSchool],
      levels: [...this.state.levels, ...newLevels],
      accounts: [...this.state.accounts, newAccount],
      account_level_roles: [...this.state.account_level_roles, ...newGrants],
    };

    this.saveState(updatedState);

    return {
      school: newSchool,
      levels: newLevels,
      founderAccount: newAccount,
      grants: newGrants,
    };
  }

  // --- Partitioned Data Access ---
  public getTeachersForPartition(schoolId: string, levelId: string): Array<Teacher & { account: Account }> {
    return this.state.teachers
      .filter((t) => t.school_id === schoolId && t.level_id === levelId)
      .map((teacher) => {
        const account = this.getAccountById(teacher.account_id) || {
          id: teacher.account_id,
          phone_number: 'N/A',
          pin_hash: '',
          full_name: 'Teacher ' + teacher.teacher_code,
          created_at: teacher.created_at,
          updated_at: teacher.updated_at,
          version: 1,
        };
        return { ...teacher, account };
      });
  }

  public getTeacherById(id: string): (Teacher & { account: Account }) | undefined {
    const teacher = this.state.teachers.find((t) => t.id === id);
    if (!teacher) return undefined;
    const account = this.getAccountById(teacher.account_id) || {
      id: teacher.account_id,
      phone_number: 'N/A',
      pin_hash: '',
      full_name: 'Teacher ' + teacher.teacher_code,
      created_at: teacher.created_at,
      updated_at: teacher.updated_at,
      version: 1,
    };
    return { ...teacher, account };
  }

  // --- Subjects (CRUD) ---
  public getSubjectsForPartition(schoolId: string, levelId: string): Subject[] {
    return this.state.subjects.filter(
      (s) => s.school_id === schoolId && s.level_id === levelId
    );
  }

  public getSubjectById(id: string): Subject | undefined {
    return this.state.subjects.find((s) => s.id === id);
  }

  public createSubject(params: {
    schoolId: string;
    levelId: string;
    name: string;
  }): Subject {
    const trimmedName = params.name.trim();
    if (!trimmedName) {
      throw new Error('Subject name cannot be empty.');
    }

    const existing = this.state.subjects.find(
      (s) =>
        s.school_id === params.schoolId &&
        s.level_id === params.levelId &&
        s.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      throw new Error(`Subject "${trimmedName}" already exists in this partition.`);
    }

    const newSubject: Subject = {
      id: 'sub_' + Math.random().toString(36).substring(2, 9),
      school_id: params.schoolId,
      level_id: params.levelId,
      name: trimmedName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
    };

    this.state.subjects.push(newSubject);
    this.saveState(this.state);

    this.dispatchRealtimeEvent({
      channel: `partition:${params.schoolId}:${params.levelId}`,
      eventType: 'INSERT',
      table: 'subjects',
      target: 'all',
      payload: newSubject as unknown as Record<string, unknown>,
    });

    return newSubject;
  }

  public updateSubject(id: string, params: { name: string }): Subject {
    const index = this.state.subjects.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('Subject not found.');
    }

    const trimmedName = params.name.trim();
    if (!trimmedName) {
      throw new Error('Subject name cannot be empty.');
    }

    const current = this.state.subjects[index];
    const duplicate = this.state.subjects.find(
      (s) =>
        s.id !== id &&
        s.school_id === current.school_id &&
        s.level_id === current.level_id &&
        s.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      throw new Error(`Another subject named "${trimmedName}" already exists.`);
    }

    const updated: Subject = {
      ...current,
      name: trimmedName,
      updated_at: new Date().toISOString(),
      version: current.version + 1,
    };

    this.state.subjects[index] = updated;
    this.saveState(this.state);

    this.dispatchRealtimeEvent({
      channel: `partition:${current.school_id}:${current.level_id}`,
      eventType: 'UPDATE',
      table: 'subjects',
      target: 'all',
      payload: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  public deleteSubject(id: string): { success: boolean; message?: string } {
    const subject = this.state.subjects.find((s) => s.id === id);
    if (!subject) {
      throw new Error('Subject not found.');
    }

    // Check if used in timetable
    const slotsUsing = this.state.timetable_slots.filter((ts) => ts.subject_id === id);
    if (slotsUsing.length > 0) {
      throw new Error(
        `Cannot delete "${subject.name}" because it is currently assigned to ${slotsUsing.length} timetable period(s).`
      );
    }

    this.state.subjects = this.state.subjects.filter((s) => s.id !== id);
    this.saveState(this.state);

    this.dispatchRealtimeEvent({
      channel: `partition:${subject.school_id}:${subject.level_id}`,
      eventType: 'DELETE',
      table: 'subjects',
      target: 'all',
      payload: { id },
    });

    return { success: true };
  }

  // --- Timetable Slots (Visual Timetable Builder) ---
  public getTimetableSlotsForPartition(schoolId: string, levelId: string): TimetableSlot[] {
    return this.state.timetable_slots.filter(
      (ts) => ts.school_id === schoolId && ts.level_id === levelId
    );
  }

  public getTimetableSlotById(id: string): TimetableSlot | undefined {
    return this.state.timetable_slots.find((ts) => ts.id === id);
  }

  // Conflict Detection Engine
  public detectTimetableConflicts(
    candidate: {
      school_id: string;
      level_id: string;
      subject_id: string;
      class_name: string;
      day: string;
      start_time: string;
      duration: number;
      teacher_id: string;
    },
    ignoreSlotId?: string
  ): {
    hasConflict: boolean;
    conflicts: Array<{
      type: 'teacher' | 'class';
      messageEn: string;
      messageFr: string;
      conflictingSlot: TimetableSlot;
    }>;
  } {
    const partitionSlots = this.getTimetableSlotsForPartition(
      candidate.school_id,
      candidate.level_id
    ).filter((s) => s.id !== ignoreSlotId);

    const [candHour, candMin] = candidate.start_time.split(':').map(Number);
    const candStart = candHour * 60 + candMin;
    const candEnd = candStart + candidate.duration;

    const conflicts: Array<{
      type: 'teacher' | 'class';
      messageEn: string;
      messageFr: string;
      conflictingSlot: TimetableSlot;
    }> = [];

    for (const slot of partitionSlots) {
      if (slot.day !== candidate.day) continue;

      const [slotHour, slotMin] = slot.start_time.split(':').map(Number);
      const slotStart = slotHour * 60 + slotMin;
      const slotEnd = slotStart + slot.duration;

      // Check overlap: startA < endB && endA > startB
      const isOverlapping = candStart < slotEnd && candEnd > slotStart;
      if (!isOverlapping) continue;

      // 1. Teacher double-booking
      if (slot.teacher_id === candidate.teacher_id) {
        const teacher = this.getTeacherById(slot.teacher_id);
        const teacherName = teacher?.account.full_name || 'Assigned teacher';
        conflicts.push({
          type: 'teacher',
          messageEn: `${teacherName} is already scheduled in ${slot.class_name} at ${slot.start_time} on ${slot.day}.`,
          messageFr: `${teacherName} a déjà un cours avec ${slot.class_name} à ${slot.start_time} le ${slot.day}.`,
          conflictingSlot: slot,
        });
      }

      // 2. Class double-booking
      if (
        slot.class_name.trim().toLowerCase() ===
        candidate.class_name.trim().toLowerCase()
      ) {
        const subject = this.getSubjectById(slot.subject_id);
        const subjectName = subject?.name || 'Another subject';
        conflicts.push({
          type: 'class',
          messageEn: `Class "${slot.class_name}" is already booked for ${subjectName} at ${slot.start_time}.`,
          messageFr: `La classe "${slot.class_name}" est déjà occupée par ${subjectName} à ${slot.start_time}.`,
          conflictingSlot: slot,
        });
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  // Teacher Suggestion Engine
  public getTeacherSuggestionsForSlot(params: {
    schoolId: string;
    levelId: string;
    subjectId: string;
    day: string;
    startTime: string;
    duration: number;
    ignoreSlotId?: string;
  }): Array<{
    teacher: Teacher & { account: Account };
    score: number;
    matchReasonEn: string;
    matchReasonFr: string;
    weeklyLoad: number;
    hasTimeConflict: boolean;
  }> {
    const teachers = this.getTeachersForPartition(params.schoolId, params.levelId);
    const subject = this.getSubjectById(params.subjectId);
    const partitionSlots = this.getTimetableSlotsForPartition(
      params.schoolId,
      params.levelId
    );

    const [candHour, candMin] = params.startTime.split(':').map(Number);
    const candStart = candHour * 60 + candMin;
    const candEnd = candStart + params.duration;

    return teachers.map((teacher) => {
      // Calculate current weekly load
      const teacherSlots = partitionSlots.filter(
        (s) => s.teacher_id === teacher.id && s.id !== params.ignoreSlotId
      );
      const weeklyLoad = teacherSlots.length;

      // Check time conflict
      let hasTimeConflict = false;
      for (const slot of teacherSlots) {
        if (slot.day === params.day) {
          const [sH, sM] = slot.start_time.split(':').map(Number);
          const sStart = sH * 60 + sM;
          const sEnd = sStart + slot.duration;
          if (candStart < sEnd && candEnd > sStart) {
            hasTimeConflict = true;
            break;
          }
        }
      }

      // Compute recommendation score
      let score = 50;
      let matchReasonEn = 'Available general teacher';
      let matchReasonFr = 'Enseignant disponible';

      const qual = (teacher.qualification || '').toLowerCase();
      const dept = (teacher.department || '').toLowerCase();
      const subName = (subject?.name || '').toLowerCase();

      // Check subject/department match
      if (
        (subName.includes('math') && (dept.includes('math') || qual.includes('math'))) ||
        (subName.includes('english') && (dept.includes('language') || qual.includes('english'))) ||
        (subName.includes('french') && (dept.includes('french') || qual.includes('français') || qual.includes('lettres'))) ||
        (subName.includes('science') && (dept.includes('science') || qual.includes('science'))) ||
        (subName.includes('comput') && (dept.includes('comput') || qual.includes('software') || qual.includes('ict'))) ||
        (subName.includes('chem') && (dept.includes('chem') || qual.includes('chem'))) ||
        (subName.includes('bio') && (dept.includes('bio') || qual.includes('bio'))) ||
        (subName.includes('econ') && (dept.includes('econ') || qual.includes('econ'))) ||
        (subName.includes('relig') && (dept.includes('relig') || qual.includes('bibl'))) ||
        (subName.includes('music') && (dept.includes('music') || qual.includes('music')))
      ) {
        score += 40;
        matchReasonEn = `Specialist (${teacher.department || teacher.qualification})`;
        matchReasonFr = `Spécialiste (${teacher.department || teacher.qualification})`;
      }

      // Bonus for balanced weekly load (< 10 periods is good)
      if (weeklyLoad < 8) {
        score += 15;
      } else if (weeklyLoad > 15) {
        score -= 20;
      }

      if (hasTimeConflict) {
        score = -100;
        matchReasonEn = 'Busy / double-booked on this time period';
        matchReasonFr = 'Occupé / double créneau sur cette tranche';
      }

      return {
        teacher,
        score,
        matchReasonEn,
        matchReasonFr,
        weeklyLoad,
        hasTimeConflict,
      };
    }).sort((a, b) => b.score - a.score);
  }

  // Create Timetable Slot with Realtime Dispatch
  public createTimetableSlot(params: {
    school_id: string;
    level_id: string;
    subject_id: string;
    class_name: string;
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
    start_time: string;
    duration: number;
    teacher_id: string;
    color?: string;
  }): TimetableSlot {
    const conflictCheck = this.detectTimetableConflicts(params);
    if (conflictCheck.hasConflict) {
      throw new Error(conflictCheck.conflicts[0].messageEn);
    }

    const slotColor =
      params.color ||
      PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];

    const newSlot: TimetableSlot = {
      id: 'slot_' + Math.random().toString(36).substring(2, 9),
      school_id: params.school_id,
      level_id: params.level_id,
      subject_id: params.subject_id,
      class_name: params.class_name.trim(),
      day: params.day,
      start_time: params.start_time,
      duration: params.duration,
      teacher_id: params.teacher_id,
      color: slotColor,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
    };

    this.state.timetable_slots.push(newSlot);
    this.saveState(this.state);

    // Instant Realtime Dispatch to teacher portal & admin broadcast
    this.dispatchRealtimeEvent({
      channel: `teacher:${params.teacher_id}`,
      eventType: 'DISPATCH',
      table: 'timetable_slots',
      target: `teacher:${params.teacher_id}`,
      payload: newSlot as unknown as Record<string, unknown>,
    });

    this.dispatchRealtimeEvent({
      channel: `partition:${params.school_id}:${params.level_id}`,
      eventType: 'INSERT',
      table: 'timetable_slots',
      target: 'all',
      payload: newSlot as unknown as Record<string, unknown>,
    });

    return newSlot;
  }

  public updateTimetableSlot(
    id: string,
    params: Partial<{
      subject_id: string;
      class_name: string;
      day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
      start_time: string;
      duration: number;
      teacher_id: string;
      color: string;
    }>
  ): TimetableSlot {
    const index = this.state.timetable_slots.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('Timetable slot not found.');
    }

    const current = this.state.timetable_slots[index];
    const merged = {
      ...current,
      ...params,
    };

    const conflictCheck = this.detectTimetableConflicts(merged, id);
    if (conflictCheck.hasConflict) {
      throw new Error(conflictCheck.conflicts[0].messageEn);
    }

    const updated: TimetableSlot = {
      ...merged,
      updated_at: new Date().toISOString(),
      version: current.version + 1,
    };

    this.state.timetable_slots[index] = updated;
    this.saveState(this.state);

    // Instant Realtime Dispatch to teacher portal
    this.dispatchRealtimeEvent({
      channel: `teacher:${updated.teacher_id}`,
      eventType: 'DISPATCH',
      table: 'timetable_slots',
      target: `teacher:${updated.teacher_id}`,
      payload: updated as unknown as Record<string, unknown>,
    });

    this.dispatchRealtimeEvent({
      channel: `partition:${current.school_id}:${current.level_id}`,
      eventType: 'UPDATE',
      table: 'timetable_slots',
      target: 'all',
      payload: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  public deleteTimetableSlot(id: string): { success: boolean } {
    const slot = this.state.timetable_slots.find((s) => s.id === id);
    if (!slot) {
      throw new Error('Timetable slot not found.');
    }

    this.state.timetable_slots = this.state.timetable_slots.filter((s) => s.id !== id);
    this.saveState(this.state);

    this.dispatchRealtimeEvent({
      channel: `teacher:${slot.teacher_id}`,
      eventType: 'DELETE',
      table: 'timetable_slots',
      target: `teacher:${slot.teacher_id}`,
      payload: { id },
    });

    this.dispatchRealtimeEvent({
      channel: `partition:${slot.school_id}:${slot.level_id}`,
      eventType: 'DELETE',
      table: 'timetable_slots',
      target: 'all',
      payload: { id },
    });

    return { success: true };
  }

  // --- Period Swap & Substitute Workflow ---
  public getPeriodSwapsForPartition(schoolId: string, levelId: string): PeriodSwap[] {
    return this.state.period_swaps.filter(
      (ps) => ps.school_id === schoolId && ps.level_id === levelId
    );
  }

  public requestPeriodSwap(params: {
    school_id: string;
    level_id: string;
    timetable_slot_id: string;
    requested_by_teacher_id: string;
    suggested_replacement_id?: string | null;
    reason?: string;
  }): PeriodSwap {
    const slot = this.getTimetableSlotById(params.timetable_slot_id);
    if (!slot) {
      throw new Error('Slot not found.');
    }

    const newSwap: PeriodSwap = {
      id: 'swap_' + Math.random().toString(36).substring(2, 9),
      school_id: params.school_id,
      level_id: params.level_id,
      timetable_slot_id: params.timetable_slot_id,
      requested_by_teacher_id: params.requested_by_teacher_id,
      suggested_replacement_id: params.suggested_replacement_id || null,
      assigned_replacement_id: null,
      status: 'pending',
      approved_by: null,
      reason: params.reason || 'Personal / Academic leave',
      log: [
        {
          timestamp: new Date().toISOString(),
          account_id: params.requested_by_teacher_id,
          action: 'REQUESTED_UNAVAILABLE',
          note: params.reason || 'Teacher requested unavailability',
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.period_swaps.unshift(newSwap);
    this.saveState(this.state);

    // Realtime notification to VP & DM
    this.dispatchRealtimeEvent({
      channel: `partition:${params.school_id}:${params.level_id}`,
      eventType: 'DISPATCH',
      table: 'period_swaps',
      target: 'role:VP_DM',
      payload: newSwap as unknown as Record<string, unknown>,
    });

    return newSwap;
  }

  public approvePeriodSwap(params: {
    swap_id: string;
    assigned_replacement_id: string;
    approved_by_account_id: string;
    note?: string;
  }): PeriodSwap {
    const index = this.state.period_swaps.findIndex((ps) => ps.id === params.swap_id);
    if (index === -1) {
      throw new Error('Period swap request not found.');
    }

    const current = this.state.period_swaps[index];
    const substituteTeacher = this.getTeacherById(params.assigned_replacement_id);
    if (!substituteTeacher) {
      throw new Error('Substitute teacher could not be resolved.');
    }

    const updated: PeriodSwap = {
      ...current,
      status: 'approved',
      assigned_replacement_id: params.assigned_replacement_id,
      approved_by: params.approved_by_account_id,
      updated_at: new Date().toISOString(),
      log: [
        ...current.log,
        {
          timestamp: new Date().toISOString(),
          account_id: params.approved_by_account_id,
          action: 'APPROVED_AND_ASSIGNED',
          note:
            params.note ||
            `Approved by VP/DM. Assigned ${substituteTeacher.account.full_name} (${substituteTeacher.teacher_code}) as replacement.`,
        },
      ],
    };

    this.state.period_swaps[index] = updated;
    this.saveState(this.state);

    // Realtime dispatch to substitute teacher's portal
    this.dispatchRealtimeEvent({
      channel: `teacher:${params.assigned_replacement_id}`,
      eventType: 'SWAP_APPROVED',
      table: 'period_swaps',
      target: `teacher:${params.assigned_replacement_id}`,
      payload: {
        swap: updated,
        message: 'You have been assigned as cover teacher for this period slot.',
      },
    });

    this.dispatchRealtimeEvent({
      channel: `partition:${current.school_id}:${current.level_id}`,
      eventType: 'UPDATE',
      table: 'period_swaps',
      target: 'all',
      payload: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  public rejectPeriodSwap(params: {
    swap_id: string;
    rejected_by_account_id: string;
    note?: string;
  }): PeriodSwap {
    const index = this.state.period_swaps.findIndex((ps) => ps.id === params.swap_id);
    if (index === -1) {
      throw new Error('Period swap request not found.');
    }

    const current = this.state.period_swaps[index];
    const updated: PeriodSwap = {
      ...current,
      status: 'rejected',
      approved_by: params.rejected_by_account_id,
      updated_at: new Date().toISOString(),
      log: [
        ...current.log,
        {
          timestamp: new Date().toISOString(),
          account_id: params.rejected_by_account_id,
          action: 'REJECTED',
          note: params.note || 'Period swap request was declined by VP/DM.',
        },
      ],
    };

    this.state.period_swaps[index] = updated;
    this.saveState(this.state);

    this.dispatchRealtimeEvent({
      channel: `partition:${current.school_id}:${current.level_id}`,
      eventType: 'UPDATE',
      table: 'period_swaps',
      target: 'all',
      payload: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  public getPeriodSwaps(schoolId?: string, levelId?: string): PeriodSwap[] {
    if (schoolId && levelId) {
      return this.getPeriodSwapsForPartition(schoolId, levelId);
    }
    return this.state.period_swaps;
  }

  // Cover analytics / load calculation helper
  public getTeacherWorkloadWithSwaps(
    teacherId: string,
    schoolId: string,
    levelId: string
  ): {
    scheduledPeriods: number;
    swappedOutPeriods: number;
    coverPeriodsAssigned: number;
    effectivePayrollPeriods: number;
  } {
    const slots = this.getTimetableSlotsForPartition(schoolId, levelId);
    const scheduled = slots.filter((s) => s.teacher_id === teacherId).length;

    const swaps = this.getPeriodSwapsForPartition(schoolId, levelId);
    // Swapped out (teacher requested unavailable and was approved) -> not counted against them
    const swappedOut = swaps.filter(
      (sw) =>
        sw.requested_by_teacher_id === teacherId &&
        sw.status === 'approved' &&
        sw.assigned_replacement_id !== null
    ).length;

    // Substitute hours added to their total
    const coverPeriods = swaps.filter(
      (sw) =>
        sw.assigned_replacement_id === teacherId && sw.status === 'approved'
    ).length;

    const effective = scheduled - swappedOut + coverPeriods;

    return {
      scheduledPeriods: scheduled,
      swappedOutPeriods: swappedOut,
      coverPeriodsAssigned: coverPeriods,
      effectivePayrollPeriods: effective,
    };
  }

  // --- Offline Conflict Log ---
  public recordOfflineConflict(entry: {
    table_name: string;
    record_id: string;
    server_version: number;
    incoming_version: number;
    losing_payload: unknown;
    winning_payload: unknown;
  }) {
    const record = {
      id: 'conf_' + Math.random().toString(36).substring(2, 9),
      ...entry,
      resolved_at: new Date().toISOString(),
    };
    this.state.offline_conflicts.push(record);
    this.saveState(this.state);
  }

  public getOfflineConflicts() {
    return this.state.offline_conflicts;
  }

  // --- Phase 3: Teacher Portal Engine Methods ---

  public getTeacherByAccountId(accountId: string): (Teacher & { account: Account }) | undefined {
    const teacher = this.state.teachers.find((t) => t.account_id === accountId);
    if (!teacher) {
      // Fallback: if accountId matches teacher id directly
      const byId = this.state.teachers.find((t) => t.id === accountId);
      if (byId) {
        const foundAcc = this.state.accounts.find((a) => a.id === byId.account_id);
        const acc: Account = foundAcc || {
          id: byId.account_id,
          username: byId.teacher_code.toLowerCase(),
          email: `${byId.teacher_code.toLowerCase()}@saker.edu.cm`,
          full_name: byId.full_name || `Teacher ${byId.teacher_code}`,
          phone_number: byId.phone_number || '+237 670000000',
          is_active: true,
          pin_hash: '1234',
          photo_url: byId.photo_url || null,
          created_at: byId.created_at,
          updated_at: byId.updated_at,
          version: 1,
        };
        return {
          ...byId,
          full_name: byId.full_name || acc.full_name,
          phone_number: byId.phone_number || acc.phone_number,
          account: acc,
        };
      }
      return undefined;
    }
    const foundAcc = this.state.accounts.find((a) => a.id === teacher.account_id);
    const account: Account = foundAcc || {
      id: teacher.account_id,
      username: teacher.teacher_code.toLowerCase(),
      email: `${teacher.teacher_code.toLowerCase()}@saker.edu.cm`,
      full_name: teacher.full_name || `Teacher ${teacher.teacher_code}`,
      phone_number: teacher.phone_number || '+237 670000000',
      is_active: true,
      pin_hash: '1234',
      photo_url: teacher.photo_url || null,
      created_at: teacher.created_at,
      updated_at: teacher.updated_at,
      version: 1,
    };
    return {
      ...teacher,
      full_name: teacher.full_name || account.full_name,
      phone_number: teacher.phone_number || account.phone_number,
      account,
    };
  }

  public getTeacherSlots(
    teacherId: string,
    schoolId?: string,
    levelId?: string
  ): Array<TimetableSlot & { subject: Subject }> {
    return this.state.timetable_slots
      .filter((slot) => {
        if (slot.teacher_id !== teacherId) return false;
        if (schoolId && slot.school_id !== schoolId) return false;
        if (levelId && slot.level_id !== levelId) return false;
        return true;
      })
      .map((slot) => {
        const subject = this.state.subjects.find((s) => s.id === slot.subject_id) || {
          id: slot.subject_id,
          school_id: slot.school_id,
          level_id: slot.level_id,
          name: 'Academic Course',
          department: 'General',
          color_code: '#6366f1',
          created_at: slot.created_at,
          updated_at: slot.updated_at,
          version: 1,
        };
        return { ...slot, subject };
      });
  }

  public getLogbookEntriesForTeacher(teacherId: string): LogbookEntry[] {
    return this.state.logbook_entries
      .filter((entry) => entry.teacher_id === teacherId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public getLogbookEntryById(id: string): LogbookEntry | undefined {
    return this.state.logbook_entries.find((e) => e.id === id);
  }

  public createLogbookEntry(
    params: Omit<LogbookEntry, 'id' | 'created_at' | 'updated_at' | 'version'>
  ): LogbookEntry {
    const newEntry: LogbookEntry = {
      ...params,
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
    };

    this.state.logbook_entries.unshift(newEntry);
    this.saveState(this.state);

    this.dispatchRealtimeEvent({
      channel: `teacher:${params.teacher_id}`,
      eventType: 'INSERT',
      table: 'logbook_entries',
      target: `teacher:${params.teacher_id}`,
      payload: newEntry as unknown as Record<string, unknown>,
    });

    return newEntry;
  }

  public getPayslipsForTeacher(teacherId: string): Payslip[] {
    return this.state.payslips
      .filter((p) => p.teacher_id === teacherId)
      .sort((a, b) => (b.month_key || '').localeCompare(a.month_key || ''));
  }

  public getAwardsForTeacher(teacherId: string): Award[] {
    return this.state.awards
      .filter((a) => a.teacher_id === teacherId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getNotificationsForAccount(accountId: string): Notification[] {
    return this.state.notifications
      .filter((n) => n.account_id === accountId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public markNotificationAsRead(id: string) {
    const notif = this.state.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveState(this.state);
    }
  }

  public markAllNotificationsAsRead(accountId: string) {
    this.state.notifications
      .filter((n) => n.account_id === accountId)
      .forEach((n) => {
        n.read = true;
      });
    this.saveState(this.state);
  }

  public createNotification(params: {
    account_id: string;
    type: string;
    title: string;
    body: string;
    link_tab?: string;
  }): Notification {
    const notif: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      account_id: params.account_id,
      type: params.type as any,
      title: params.title,
      body: params.body,
      link_tab: params.link_tab,
      read: false,
      created_at: new Date().toISOString(),
    };
    if (!this.state.notifications) {
      this.state.notifications = [];
    }
    this.state.notifications.unshift(notif);
    this.saveState(this.state);
    return notif;
  }

  public getTeachersForSchoolLevel(schoolId: string, levelId: string) {
    return this.getTeachersForPartition(schoolId, levelId);
  }

  public getSubjectsForSchoolLevel(schoolId: string, levelId: string) {
    return this.getSubjectsForPartition(schoolId, levelId);
  }

  public getDisputesForTeacher(teacherId: string): Dispute[] {
    return this.state.disputes
      .filter((d) => d.teacher_id === teacherId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createDispute(params: {
    teacher_id: string;
    related_record_type: 'attendance' | 'logbook' | 'payroll';
    related_record_id: string;
    reason: string;
  }): Dispute {
    const newDispute: Dispute = {
      id: 'disp_' + Math.random().toString(36).substring(2, 9),
      teacher_id: params.teacher_id,
      related_record_type: params.related_record_type,
      related_record_id: params.related_record_id,
      reason: params.reason,
      status: 'pending',
      resolved_by: null,
      resolution_note: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.disputes.unshift(newDispute);
    this.saveState(this.state);

    this.dispatchRealtimeEvent({
      channel: `disputes:${params.teacher_id}`,
      eventType: 'INSERT',
      table: 'disputes',
      target: 'role:VP_DM',
      payload: newDispute as unknown as Record<string, unknown>,
    });

    return newDispute;
  }

  public updateTeacherContact(
    teacherId: string,
    updates: { phone_number?: string; photo_url?: string | null }
  ): Teacher & { account: Account } {
    const teacher = this.state.teachers.find((t) => t.id === teacherId);
    if (!teacher) {
      throw new Error('Teacher not found.');
    }
    if (updates.phone_number !== undefined) {
      teacher.phone_number = updates.phone_number;
    }
    if (updates.photo_url !== undefined) {
      teacher.photo_url = updates.photo_url;
    }
    teacher.updated_at = new Date().toISOString();

    const account = this.state.accounts.find((a) => a.id === teacher.account_id);
    if (account) {
      if (updates.phone_number !== undefined) account.phone_number = updates.phone_number;
      if (updates.photo_url !== undefined) account.photo_url = updates.photo_url;
      account.updated_at = new Date().toISOString();
    }

    this.saveState(this.state);
    return { ...teacher, account: account || (teacher as unknown as Account) };
  }

  public getTeacherMonthlySummary(
    teacherId: string,
    monthKey: string = '2026-03'
  ): {
    expectedPeriods: number;
    coveredPeriods: number;
    percentage: number;
    weeklyScheduledPeriods: number;
  } {
    const slots = this.state.timetable_slots.filter((s) => s.teacher_id === teacherId);
    const weeklyScheduled = slots.length;
    // Assume roughly 4 weeks per month for monthly expectation
    const expectedPeriods = Math.max(weeklyScheduled * 4, 16);

    const logEntriesThisMonth = this.state.logbook_entries.filter((entry) => {
      return entry.teacher_id === teacherId && (entry.date.startsWith(monthKey) || entry.signed_at);
    });

    const coveredPeriods = logEntriesThisMonth.length;
    const percentage = Math.min(Math.round((coveredPeriods / expectedPeriods) * 100), 100);

    return {
      expectedPeriods,
      coveredPeriods,
      percentage,
      weeklyScheduledPeriods: weeklyScheduled,
    };
  }

  // --- Phase 4: Secretary Attendance Marking ---
  public getAttendanceRecords(params?: {
    schoolId?: string;
    levelId?: string;
    date?: string;
    teacherId?: string;
  }): AttendanceRecord[] {
    return this.state.attendance_records.filter((rec) => {
      if (params?.date && rec.date !== params.date) return false;
      if (params?.teacherId && rec.teacher_id !== params.teacherId) return false;
      if (params?.schoolId || params?.levelId) {
        const slot = this.state.timetable_slots.find((s) => s.id === rec.timetable_slot_id);
        if (!slot) return false;
        if (params?.schoolId && slot.school_id !== params.schoolId) return false;
        if (params?.levelId && slot.level_id !== params.levelId) return false;
      }
      return true;
    });
  }

  public getTimetableSlotsForDay(schoolId: string, levelId: string, day: string): TimetableSlot[] {
    return this.state.timetable_slots
      .filter((s) => s.school_id === schoolId && s.level_id === levelId && s.day.toLowerCase() === day.toLowerCase())
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  public markTeacherAttendance(params: {
    timetable_slot_id: string;
    teacher_id: string;
    date: string;
    marked_present_at: string;
    secretary_id: string;
    custom_late_minutes?: number;
  }): AttendanceRecord {
    const slot = this.state.timetable_slots.find((s) => s.id === params.timetable_slot_id);
    const scheduledStartTime = slot ? slot.start_time : '08:00';

    let lateMinutes = 0;
    if (params.custom_late_minutes !== undefined) {
      lateMinutes = Math.max(0, params.custom_late_minutes);
    } else {
      try {
        // Parse scheduled time e.g. "08:00"
        const [schedH, schedM] = scheduledStartTime.split(':').map(Number);
        const schedTotalM = (schedH || 0) * 60 + (schedM || 0);

        // Parse marked arrival time (either HH:MM or ISO timestamp)
        let arrH = 0;
        let arrM = 0;
        if (params.marked_present_at.includes('T')) {
          const dateObj = new Date(params.marked_present_at);
          arrH = dateObj.getUTCHours();
          arrM = dateObj.getUTCMinutes();
        } else if (params.marked_present_at.includes(':')) {
          const [h, m] = params.marked_present_at.split(':').map(Number);
          arrH = h || 0;
          arrM = m || 0;
        }
        const arrTotalM = arrH * 60 + arrM;
        lateMinutes = Math.max(0, arrTotalM - schedTotalM);
      } catch {
        lateMinutes = 0;
      }
    }

    // Official business rule: >15 minutes late -> auto-flagged cancelled/unpaid
    let status: 'on_time' | 'late' | 'cancelled_unpaid' = 'on_time';
    if (lateMinutes > 15) {
      status = 'cancelled_unpaid';
    } else if (lateMinutes > 0) {
      status = 'late';
    } else {
      status = 'on_time';
    }

    // Check if record already exists for this slot and date
    let record = this.state.attendance_records.find(
      (r) => r.timetable_slot_id === params.timetable_slot_id && r.date === params.date
    );

    const nowIso = new Date().toISOString();

    if (record) {
      record.marked_present_at = params.marked_present_at;
      record.secretary_id = params.secretary_id;
      record.late_minutes = lateMinutes;
      record.status = status;
      record.updated_at = nowIso;
      record.version += 1;
    } else {
      record = {
        id: 'att_' + Math.random().toString(36).substring(2, 9),
        teacher_id: params.teacher_id,
        timetable_slot_id: params.timetable_slot_id,
        date: params.date,
        scheduled_start_time: scheduledStartTime,
        marked_present_at: params.marked_present_at,
        secretary_id: params.secretary_id,
        late_minutes: lateMinutes,
        status,
        created_at: nowIso,
        updated_at: nowIso,
        version: 1,
      };
      this.state.attendance_records.unshift(record);
    }

    this.saveState(this.state);

    this.dispatchRealtimeEvent({
      channel: `attendance:${params.teacher_id}`,
      eventType: 'INSERT',
      table: 'attendance_records',
      target: 'role:Secretary_DM_Teacher',
      payload: record as unknown as Record<string, unknown>,
    });

    return record;
  }

  public resetTeacherAttendance(recordId: string) {
    this.state.attendance_records = this.state.attendance_records.filter((r) => r.id !== recordId);
    this.saveState(this.state);
  }

  // --- Phase 4: Expected Targets ---
  public getExpectedTargets(params?: {
    schoolId?: string;
    levelId?: string;
    teacherId?: string;
  }): ExpectedTarget[] {
    return this.state.expected_targets.filter((tgt) => {
      if (params?.teacherId && tgt.teacher_id !== params.teacherId) return false;
      if (params?.schoolId || params?.levelId) {
        const subject = this.state.subjects.find((s) => s.id === tgt.subject_id);
        if (!subject) return false;
        if (params?.schoolId && subject.school_id !== params.schoolId) return false;
        if (params?.levelId && subject.level_id !== params.levelId) return false;
      }
      return true;
    });
  }

  public setExpectedTarget(params: {
    id?: string;
    teacher_id: string;
    subject_id: string;
    class_name: string;
    term: string;
    expected_periods: number;
    expected_topics: number;
  }): ExpectedTarget {
    const nowIso = new Date().toISOString();
    let target = params.id
      ? this.state.expected_targets.find((t) => t.id === params.id)
      : this.state.expected_targets.find(
          (t) =>
            t.teacher_id === params.teacher_id &&
            t.subject_id === params.subject_id &&
            t.class_name === params.class_name &&
            t.term === params.term
        );

    if (target) {
      target.expected_periods = params.expected_periods;
      target.expected_topics = params.expected_topics;
      target.updated_at = nowIso;
    } else {
      target = {
        id: 'tgt_' + Math.random().toString(36).substring(2, 9),
        teacher_id: params.teacher_id,
        subject_id: params.subject_id,
        class_name: params.class_name,
        term: params.term,
        expected_periods: params.expected_periods,
        expected_topics: params.expected_topics,
        created_at: nowIso,
        updated_at: nowIso,
      };
      this.state.expected_targets.unshift(target);
    }

    this.saveState(this.state);

    this.dispatchRealtimeEvent({
      channel: `targets:${params.teacher_id}`,
      eventType: 'UPDATE',
      table: 'expected_targets',
      target: 'role:DM',
      payload: target as unknown as Record<string, unknown>,
    });

    return target;
  }

  // --- Phase 4: Dispute Resolution ---
  public getAllDisputes(status?: string): Dispute[] {
    return this.state.disputes
      .filter((d) => !status || d.status === status)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public resolveDispute(params: {
    disputeId: string;
    status: 'resolved' | 'dismissed';
    resolution_note: string;
    resolved_by: string;
    adjustAttendanceStatus?: 'on_time' | 'late' | 'cancelled_unpaid';
  }): Dispute {
    const dispute = this.state.disputes.find((d) => d.id === params.disputeId);
    if (!dispute) {
      throw new Error('Dispute not found.');
    }

    const nowIso = new Date().toISOString();
    dispute.status = params.status;
    dispute.resolution_note = params.resolution_note;
    dispute.resolved_by = params.resolved_by;
    dispute.updated_at = nowIso;

    // If resolving attendance dispute and adjusting attendance status
    if (
      params.status === 'resolved' &&
      params.adjustAttendanceStatus &&
      dispute.related_record_type === 'attendance'
    ) {
      const attRecord = this.state.attendance_records.find(
        (r) => r.id === dispute.related_record_id
      );
      if (attRecord) {
        attRecord.status = params.adjustAttendanceStatus;
        if (params.adjustAttendanceStatus === 'on_time') {
          attRecord.late_minutes = 0;
        }
        attRecord.updated_at = nowIso;
      }
    }

    this.saveState(this.state);

    // Notify teacher
    this.createNotification({
      account_id: dispute.teacher_id.startsWith('acc_')
        ? dispute.teacher_id
        : this.state.teachers.find((t) => t.id === dispute.teacher_id)?.account_id || dispute.teacher_id,
      type: 'dispute_resolved',
      title: params.status === 'resolved' ? 'Dispute Resolved & Pardoned' : 'Dispute Reviewed',
      body: params.resolution_note,
      link_tab: 'payslip',
    });

    this.dispatchRealtimeEvent({
      channel: `disputes:${dispute.teacher_id}`,
      eventType: 'UPDATE',
      table: 'disputes',
      target: `teacher:${dispute.teacher_id}`,
      payload: dispute as unknown as Record<string, unknown>,
    });

    return dispute;
  }

  // --- Phase 4: DM Review & Control / Oversight Analytics ---
  public getTeacherDMOversight(
    schoolId: string,
    levelId: string,
    monthKey: string = '2026-03'
  ): Array<{
    teacher: Teacher & { account: Account };
    targets: Array<{
      target: ExpectedTarget;
      subjectName: string;
      coveredPeriods: number;
      expectedPeriods: number;
      periodsPercentage: number;
      coveredTopics: number;
      expectedTopics: number;
      topicsPercentage: number;
    }>;
    attendanceStats: {
      scheduled: number;
      onTime: number;
      late: number;
      cancelledUnpaid: number;
      validAttended: number;
      punctualityRate: number;
    };
    logbookCount: number;
    runningMonthlyHours: number;
    computedSalary: {
      contractType: 'permanent' | 'part_time';
      baseSalary: number;
      hourlyRate: number;
      extraHours: number;
      grossSalary: number;
    };
  }> {
    const teachers = this.getTeachersForSchoolLevel(schoolId, levelId);

    return teachers.map((teacher) => {
      // 1. Expected Targets with TWO SEPARATE PROGRESS BARS
      const teacherTargets = this.state.expected_targets.filter(
        (tgt) => tgt.teacher_id === teacher.id
      );

      const targetMetrics = teacherTargets.map((tgt) => {
        const subject = this.state.subjects.find((s) => s.id === tgt.subject_id);
        const subjectName = subject ? subject.name : 'Curriculum Subject';

        // Count periods logged for this subject and class
        const relatedLogs = this.state.logbook_entries.filter((entry) => {
          const slot = this.state.timetable_slots.find((s) => s.id === entry.timetable_slot_id);
          const isMatch =
            entry.teacher_id === teacher.id &&
            slot &&
            slot.subject_id === tgt.subject_id &&
            slot.class_name.toLowerCase() === tgt.class_name.toLowerCase();
          return isMatch;
        });

        const coveredPeriods = relatedLogs.length;
        const periodsPercentage = Math.min(
          100,
          Math.round((coveredPeriods / Math.max(1, tgt.expected_periods)) * 100)
        );

        // Count distinct topics covered
        const distinctTopics = new Set(
          relatedLogs
            .map((l) => l.lesson_title.trim().toLowerCase())
            .filter((t) => t.length > 0)
        );
        const coveredTopics = distinctTopics.size;
        const topicsPercentage = Math.min(
          100,
          Math.round((coveredTopics / Math.max(1, tgt.expected_topics)) * 100)
        );

        return {
          target: tgt,
          subjectName,
          coveredPeriods,
          expectedPeriods: tgt.expected_periods,
          periodsPercentage,
          coveredTopics,
          expectedTopics: tgt.expected_topics,
          topicsPercentage,
        };
      });

      // 2. Attendance & Punctuality
      const teacherAttendance = this.state.attendance_records.filter(
        (att) => att.teacher_id === teacher.id && att.date.startsWith(monthKey)
      );

      const onTime = teacherAttendance.filter((a) => a.status === 'on_time').length;
      const late = teacherAttendance.filter((a) => a.status === 'late').length;
      const cancelledUnpaid = teacherAttendance.filter(
        (a) => a.status === 'cancelled_unpaid'
      ).length;
      const validAttended = onTime + late; // only on_time + late are paid; cancelled_unpaid is excluded
      const totalAttended = onTime + late + cancelledUnpaid;
      const punctualityRate =
        totalAttended > 0 ? Math.round((onTime / totalAttended) * 100) : 100;

      // Scheduled slots in timetable
      const scheduledSlots = this.state.timetable_slots.filter(
        (s) => s.teacher_id === teacher.id && s.school_id === schoolId && s.level_id === levelId
      );
      const weeklyScheduled = scheduledSlots.length;
      const estimatedMonthScheduled = Math.max(weeklyScheduled * 4, 16);

      // Logbook entries
      const teacherLogs = this.state.logbook_entries.filter(
        (l) => l.teacher_id === teacher.id && (l.date.startsWith(monthKey) || l.signed_at)
      );

      // Running monthly hours
      const runningMonthlyHours = Math.max(validAttended, teacherLogs.length);

      // 3. Computed Salary (base + extra hours for permanent; straight hourly for part-time)
      const isPermanent = teacher.contract_type === 'permanent';
      const baseSalary = teacher.base_salary || (isPermanent ? 180000 : 0);
      const hourlyRate = teacher.hourly_rate || (isPermanent ? 3500 : 4500);

      let extraHours = 0;
      let grossSalary = 0;

      if (isPermanent) {
        // Assume 16 regular periods included in base; extra hours beyond 16 are overtime
        extraHours = Math.max(0, runningMonthlyHours - 16);
        grossSalary = baseSalary + extraHours * hourlyRate;
      } else {
        extraHours = runningMonthlyHours;
        grossSalary = runningMonthlyHours * hourlyRate;
      }

      return {
        teacher,
        targets: targetMetrics,
        attendanceStats: {
          scheduled: estimatedMonthScheduled,
          onTime,
          late,
          cancelledUnpaid,
          validAttended,
          punctualityRate,
        },
        logbookCount: teacherLogs.length,
        runningMonthlyHours,
        computedSalary: {
          contractType: teacher.contract_type,
          baseSalary,
          hourlyRate,
          extraHours,
          grossSalary,
        },
      };
    });
  }

  // --- Phase 4: DM Monthly Approval & Forward to Principal/VP ---
  public getPayrollPeriodForMonth(
    schoolId: string,
    levelId: string,
    month: string
  ): PayrollPeriod | undefined {
    return this.state.payroll_periods.find(
      (p) => p.school_id === schoolId && p.level_id === levelId && p.month === month
    );
  }

  public dmApproveAndForwardMonth(params: {
    schoolId: string;
    levelId: string;
    month: string;
    approvedBy: string;
    notes?: string;
  }): PayrollPeriod {
    const nowIso = new Date().toISOString();
    let period = this.state.payroll_periods.find(
      (p) =>
        p.school_id === params.schoolId &&
        p.level_id === params.levelId &&
        p.month === params.month
    );

    if (period) {
      period.status = 'dm_approved';
      period.updated_at = nowIso;
      period.version += 1;
    } else {
      period = {
        id: 'pp_' + Math.random().toString(36).substring(2, 9),
        school_id: params.schoolId,
        level_id: params.levelId,
        month: params.month,
        status: 'dm_approved',
        archived_at: null,
        created_at: nowIso,
        updated_at: nowIso,
        version: 1,
      };
      this.state.payroll_periods.unshift(period);
    }

    this.saveState(this.state);

    // Notify Principal and VP
    const leadershipRoles = this.state.account_level_roles.filter(
      (r) =>
        r.school_id === params.schoolId &&
        r.level_id === params.levelId &&
        (r.role === 'Principal' || r.role === 'VP')
    );

    leadershipRoles.forEach((grant) => {
      this.createNotification({
        account_id: grant.account_id,
        type: 'salary_dispatched',
        title: `DM Approved Month: ${params.month}`,
        body: `Discipline Master has approved teacher hours and pedagogical targets for ${params.month}. Ready for final authorization.`,
        link_tab: 'overview',
      });
    });

    this.dispatchRealtimeEvent({
      channel: `payroll:${params.month}`,
      eventType: 'UPDATE',
      table: 'payroll_periods',
      target: 'role:Principal_VP',
      payload: period as unknown as Record<string, unknown>,
    });

    return period;
  }
}

export const db = new DatabaseEngine();
