import React, { useState } from 'react';
import { Teacher, Account, School, Level, Payslip } from '../../types';
import { db } from '../../lib/db';
import { useLanguage } from '../../lib/i18n';
import { InfoTooltip } from '../common/InfoTooltip';
import { TeacherDisputeModal } from './TeacherDisputeModal';
import {
  FileText,
  Download,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  X,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

interface TeacherPayslipProps {
  teacher: Teacher & { account: Account };
  school: School;
  level: Level;
}

export const TeacherPayslip: React.FC<TeacherPayslipProps> = ({
  teacher,
  school,
  level,
}) => {
  const { t, lang } = useLanguage();
  const [payslips, setPayslips] = useState<Payslip[]>(() =>
    db.getPayslipsForTeacher(teacher.id)
  );
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(
    payslips[0] || null
  );
  const [disputePayslip, setDisputePayslip] = useState<Payslip | null>(null);
  const [printing, setPrinting] = useState(false);

  const handlePrint = (payslip: Payslip) => {
    // Printable PDF view
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert(lang === 'fr' ? 'Veuillez autoriser les fenêtres contextuelles pour imprimer.' : 'Please allow popups to print payslip.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip - ${teacher.full_name} - ${payslip.month_label}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
            .school-name { font-size: 20px; font-weight: 900; }
            .badge { display: inline-block; padding: 4px 10px; background: #e0f2fe; color: #0369a1; border-radius: 999px; font-size: 11px; font-weight: bold; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
            .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
            .value { font-size: 14px; font-weight: 700; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 12px; background: #f1f5f9; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .total-row td { font-size: 16px; font-weight: 900; background: #f8fafc; border-top: 2px solid #0f172a; color: #0f172a; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature-box { border-top: 1px solid #94a3b8; width: 200px; text-align: center; padding-top: 8px; font-size: 12px; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="school-name">${school.name}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Partition: ${level.name} • Academic Year 2025–2026</div>
              <div style="font-size: 12px; color: #64748b;">Teacher: ${teacher.full_name} (${teacher.teacher_code})</div>
            </div>
            <div style="text-align: right;">
              <div class="badge">OFFICIAL BULLETIN / PAYSLIP</div>
              <div style="font-size: 13px; font-weight: bold; margin-top: 6px;">${payslip.month_label}</div>
              <div style="font-size: 11px; color: #64748b; font-family: monospace;">Ref: ${payslip.payment_reference || 'SBC-PAY-2026'}</div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="label">Teacher Information</div>
              <div class="value">${teacher.full_name}</div>
              <div style="font-size: 12px; color: #64748b;">${teacher.department} • ${teacher.qualification || 'DIPES II'}</div>
              <div style="font-size: 12px; color: #64748b; font-family: monospace;">${teacher.phone_number}</div>
            </div>
            <div class="card">
              <div class="label">Payment Status & Channel</div>
              <div class="value" style="color: #059669; text-transform: uppercase;">${payslip.status}</div>
              <div style="font-size: 12px; color: #64748b;">Dispatched via ${payslip.payment_method?.toUpperCase()}</div>
              <div style="font-size: 12px; color: #64748b;">Dispatched on ${payslip.dispatched_at?.split('T')[0]}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Rate / Units</th>
                <th style="text-align: right;">Amount (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Base Salary (Contract DIPES II)</strong></td>
                <td style="text-align: right;">Monthly Base</td>
                <td style="text-align: right;">${payslip.base_salary.toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Cover Lessons & Extra Periods</strong></td>
                <td style="text-align: right;">${payslip.extra_hours} periods @ 2,500 FCFA</td>
                <td style="text-align: right;">${payslip.extra_hours_amount.toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Statutory Deductions & Social Insurance</strong></td>
                <td style="text-align: right;">—</td>
                <td style="text-align: right;">-${payslip.deductions.toLocaleString()}</td>
              </tr>
              <tr class="total-row">
                <td>TOTAL NET DISPATCHED</td>
                <td style="text-align: right;">XAF</td>
                <td style="text-align: right;">${payslip.total.toLocaleString()} FCFA</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <div class="signature-box">
              School Bursar / Finance
            </div>
            <div class="signature-box">
              Principal Signature & School Seal
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-xl shadow-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            <span>{t('payslip_title')}</span>
            <InfoTooltip text={t('info_locked_payroll')} />
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {school.name} • {level.name} • Verified Academic Payroll
          </p>
        </div>

        {selectedPayslip && (
          <button
            type="button"
            id="export-pdf-payslip-btn"
            onClick={() => handlePrint(selectedPayslip)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-purple-900/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('download_pdf')}</span>
          </button>
        )}
      </div>

      {/* Main Grid: Payslip History List + Detailed Breakdown Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: History list */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider px-1">
            {t('payslip_history')}
          </span>

          {payslips.map((slip) => {
            const isSelected = selectedPayslip?.id === slip.id;
            return (
              <div
                key={slip.id}
                onClick={() => setSelectedPayslip(slip)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border-purple-500/80 shadow-md shadow-purple-950/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{slip.month_label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      slip.status === 'dispatched'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {slip.status.toUpperCase()}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-cyan-400">
                    {slip.total.toLocaleString()} FCFA
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {slip.dispatched_at ? slip.dispatched_at.split('T')[0] : 'Pending'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Payslip Detailed Breakdown */}
        <div className="lg:col-span-2">
          {selectedPayslip ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-xl space-y-6">
              {/* Top Banner of Selected Slip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                    Electronic Salary Certificate
                  </span>
                  <h2 className="text-xl font-black text-white mt-0.5">
                    {selectedPayslip.month_label}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Ref: {selectedPayslip.payment_reference || 'SBC-PAY-2026'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrint(selectedPayslip)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisputePayslip(selectedPayslip)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 transition-colors cursor-pointer"
                  >
                    {t('dispute_payslip')}
                  </button>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                  Itemized Earnings & Deductions
                </span>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">{t('base_salary')} (Contract Base)</span>
                    <span className="font-mono font-bold text-white">
                      {selectedPayslip.base_salary.toLocaleString()} FCFA
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                    <div>
                      <span className="text-slate-300">{t('extra_hours')}</span>
                      <span className="text-[11px] text-slate-500 block">
                        {selectedPayslip.extra_hours} substitution periods @ 2,500 FCFA
                      </span>
                    </div>
                    <span className="font-mono font-bold text-cyan-400">
                      +{selectedPayslip.extra_hours_amount.toLocaleString()} FCFA
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">{t('deductions')}</span>
                    <span className="font-mono font-bold text-slate-400">
                      -{selectedPayslip.deductions.toLocaleString()} FCFA
                    </span>
                  </div>

                  {/* Gross & Net Row */}
                  <div className="flex items-center justify-between text-sm pt-2 font-bold">
                    <span className="text-white">{t('net_salary')}</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      {selectedPayslip.total.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </div>

              {/* Dispatched Details */}
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Dispatched Channel:</span>
                  <span className="font-bold text-slate-200 uppercase mt-0.5 block">
                    {selectedPayslip.payment_method} Transfer
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Transaction Reference:</span>
                  <span className="font-mono text-cyan-400 mt-0.5 block">
                    {selectedPayslip.payment_reference || 'Pending'}
                  </span>
                </div>
              </div>

              {/* Readonly info notice */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Salary dispatches are locked and verified by the Bursar.</span>
                </span>
                <InfoTooltip text={t('info_locked_payroll')} />
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
              No payslip selected.
            </div>
          )}
        </div>
      </div>

      {/* Dispute Modal */}
      {disputePayslip && (
        <TeacherDisputeModal
          isOpen={!!disputePayslip}
          onClose={() => setDisputePayslip(null)}
          teacherId={teacher.id}
          recordType="payroll"
          recordId={disputePayslip.id}
          recordTitle={`Payslip ${disputePayslip.month_label}`}
        />
      )}
    </div>
  );
};
