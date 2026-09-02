import React, { useState } from 'react';
import { X, Copy, Check, Database, Shield, FileText } from 'lucide-react';

interface SchemaInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCHEMA_SQL_SNIPPET = `-- Manager Pro Core Relational Entities & RLS Security
-- 22 Isolated Tables scoped by (school_id, level_id)
-- Multi-level partition join table: account_level_roles

CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    teacher_id_prefix VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name education_level_type NOT NULL, -- Nursery, Primary, Secondary, Higher Institution
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT unique_school_level UNIQUE (school_id, name)
);

CREATE TABLE account_level_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    role user_role_type NOT NULL, -- Founder, Principal, VP, DM, Secretary, Finance, Teacher
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Core Entities Scoped by (school_id, level_id):
-- teachers, subjects, teacher_subjects, compensation_rates (history),
-- timetable_slots, period_swaps, logbook_entries, attendance_records,
-- expected_targets, disputes, payroll_periods, payslips, awards,
-- students, admissions, fee_structures, fee_payments, notifications,
-- offline_conflict_history.

-- RLS Partition Check Function:
CREATE OR REPLACE FUNCTION user_has_level_grant(target_school_id UUID, target_level_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM account_level_roles alr
        WHERE alr.account_id = auth.uid()
          AND alr.school_id = target_school_id
          AND alr.level_id = target_level_id
    );
$$ LANGUAGE sql STABLE;

-- Example Strict Partition Isolation Policy:
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_teachers_select ON teachers
    FOR SELECT USING (user_has_level_grant(school_id, level_id));
`;

const TABLES_LIST = [
  { name: 'schools', scope: 'Root Tenant', purpose: 'School institutional identity & teacher code prefix' },
  { name: 'levels', scope: 'school_id', purpose: 'Education levels (Nursery, Primary, Secondary, Higher Institution)' },
  { name: 'accounts', scope: 'Global User', purpose: 'User identity, phone number, and SHA-256 hashed PIN' },
  { name: 'account_level_roles', scope: 'Cross-Partition Join', purpose: 'Multi-level, multi-role access grants' },
  { name: 'teachers', scope: 'school_id + level_id', purpose: 'Teacher profile, code (e.g. SBC-T-0001), qualification' },
  { name: 'subjects', scope: 'school_id + level_id', purpose: 'Academic curriculum subjects per level' },
  { name: 'teacher_subjects', scope: 'Teacher Assignment', purpose: 'Class level and subjects taught per teacher' },
  { name: 'compensation_rates', scope: 'Historical Rate', purpose: 'Hourly/period rate ledger (new row on change, no overwrite)' },
  { name: 'timetable_slots', scope: 'school_id + level_id', purpose: 'Weekly class schedule slots with teacher and color' },
  { name: 'period_swaps', scope: 'Slot Assignment', purpose: 'Teacher period swap requests, approvals and audit log' },
  { name: 'logbook_entries', scope: 'Teacher + Slot', purpose: 'Curriculum logbook with signature and PIN confirmation' },
  { name: 'attendance_records', scope: 'Teacher + Slot', purpose: 'Daily secretary arrival marking, late minutes & status' },
  { name: 'expected_targets', scope: 'Teacher + Subject', purpose: 'Term coverage targets (periods & topics planned)' },
  { name: 'disputes', scope: 'Attendance/Payroll', purpose: 'Teacher dispute logging and administrative resolution' },
  { name: 'payroll_periods', scope: 'school_id + level_id', purpose: 'Monthly payroll lifecycle (open, DM, Principal, paid)' },
  { name: 'payslips', scope: 'Payroll Period', purpose: 'Calculated base, extra hours, total, and PDF reference' },
  { name: 'awards', scope: 'Teacher Incentive', purpose: 'Discretionary bonuses and performance awards' },
  { name: 'students', scope: 'school_id + level_id', purpose: 'Student matricule, class, guardian phone' },
  { name: 'admissions', scope: 'school_id + level_id', purpose: 'Annual student admission records & statuses' },
  { name: 'fee_structures', scope: 'school_id + level_id', purpose: 'Tuition fees, installments & exam surcharges' },
  { name: 'fee_payments', scope: 'Student + Fee', purpose: 'Payment receipts, methods (MoMo, OM, Cash, Bank)' },
  { name: 'notifications', scope: 'account_id', purpose: 'In-app real-time notification queue & SMS dispatch triggers' },
  { name: 'offline_conflict_history', scope: 'Audit Ledger', purpose: 'Preserves losing edits during offline synchronization' },
];

export const SchemaInspectorModal: React.FC<SchemaInspectorModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'tables' | 'sql' | 'rls'>('tables');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SCHEMA_SQL_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-orange-950/20 dark:shadow-black/80 border border-white/50 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-orange-100/60 dark:border-white/10 flex items-center justify-between bg-orange-50/30 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white flex items-center justify-center shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 dark:text-white block">
                PostgreSQL Schema & RLS Auditor
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Supabase / Postgres 15+ Compatible
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-orange-100/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 pt-3 border-b border-orange-100/60 dark:border-white/10 flex items-center gap-4 bg-white/60 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={() => setActiveTab('tables')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tables'
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>22 Relational Tables ({TABLES_LIST.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>DDL & Migration SQL</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rls')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rls'
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>RLS Policies & Partition Logic</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-700 dark:text-slate-300">
          {activeTab === 'tables' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                All entities in Manager Pro strictly carry institutional partition identifiers to enforce isolation between Nursery, Primary, Secondary, and Higher Institution cycles.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                {TABLES_LIST.map((tbl) => (
                  <div
                    key={tbl.name}
                    className="p-3 rounded-xl border border-orange-100/80 dark:border-white/10 bg-white/70 dark:bg-slate-800/60 shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-white font-mono text-xs text-orange-700 dark:text-orange-400">
                        {tbl.name}
                      </span>
                      <span className="text-[10px] bg-lime-50 dark:bg-lime-950/50 text-lime-700 dark:text-lime-400 px-2 py-0.5 rounded-md font-sans font-bold border border-lime-600/30">
                        {tbl.scope}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 font-sans font-medium">
                      {tbl.purpose}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Executable PostgreSQL 15+ Schema
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg border border-orange-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-orange-600 text-xs inline-flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-lime-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy DDL'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
                <code>{SCHEMA_SQL_SNIPPET}</code>
              </pre>
            </div>
          )}

          {activeTab === 'rls' && (
            <div className="space-y-4 font-sans text-xs">
              <div className="p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-800/60 text-slate-800 dark:text-slate-200">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span>Row Level Security (RLS) Architecture</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Row Level Security policies prevent unauthorized access across school and education level boundaries at the PostgreSQL query level. No client can access records where the corresponding grant does not exist in <code className="font-mono text-orange-700 dark:text-orange-400 font-bold">account_level_roles</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-orange-100/80 dark:border-white/10 shadow-2xs space-y-2">
                <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                  Multi-Tenant Partition Check Function
                </h5>
                <pre className="p-3 rounded-lg bg-slate-950 text-lime-400 font-mono text-[11px] overflow-x-auto">
{`CREATE FUNCTION user_has_level_grant(target_school UUID, target_level UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM account_level_roles
    WHERE account_id = auth.uid()
      AND school_id = target_school
      AND level_id = target_level
  );
$$ LANGUAGE sql STABLE;`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-orange-100/60 dark:border-white/10 flex items-center justify-between bg-orange-50/20 dark:bg-slate-800/30">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Manager Pro Relational Database Foundation
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-bold cursor-pointer shadow-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
