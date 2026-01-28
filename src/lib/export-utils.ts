// MIS Export Utilities

export interface ExportData {
  headers: string[];
  rows: (string | number | boolean | null)[][];
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: ExportData, filename: string): void {
  const csvContent = [
    data.headers.join(','),
    ...data.rows.map(row => 
      row.map(cell => {
        if (cell === null || cell === undefined) return '';
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return String(cell);
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data to Excel format (simplified XLSX)
 */
export function exportToExcel(data: ExportData, filename: string): void {
  // Create a simple HTML table that Excel can open
  const tableContent = `
    <html xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head>
      <meta charset="UTF-8">
      <style>
        table { border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 8px; }
        th { background-color: #3B82F6; color: white; font-weight: bold; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>${data.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.rows.map(row => 
            `<tr>${row.map(cell => `<td>${escapeHtml(String(cell ?? ''))}</td>`).join('')}</tr>`
          ).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  
  const blob = new Blob([tableContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  downloadBlob(blob, `${filename}.xls`);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format lead data for export
 */
export function formatLeadsForExport(leads: Array<{
  lead_number: string;
  customer_name: string;
  customer_phone: string;
  product_type: string;
  requested_amount: number;
  status: string;
  created_at: string;
  business_name?: string | null;
  business_type?: string | null;
}>): ExportData {
  return {
    headers: [
      'Lead Number',
      'Customer Name',
      'Phone',
      'Product Type',
      'Requested Amount',
      'Status',
      'Business Name',
      'Business Type',
      'Created Date',
    ],
    rows: leads.map(lead => [
      lead.lead_number,
      lead.customer_name,
      lead.customer_phone,
      lead.product_type.replace('_', ' '),
      lead.requested_amount,
      lead.status.replace('_', ' '),
      lead.business_name || '',
      lead.business_type || '',
      new Date(lead.created_at).toLocaleDateString(),
    ]),
  };
}

/**
 * Format application data for export
 */
export function formatApplicationsForExport(applications: Array<{
  application_number: string;
  status: string;
  final_amount?: number | null;
  final_interest_rate?: number | null;
  final_tenure_months?: number | null;
  final_emi?: number | null;
  bre_score?: number | null;
  bre_decision?: string | null;
  created_at: string;
  approved_at?: string | null;
  disbursed_at?: string | null;
}>): ExportData {
  return {
    headers: [
      'Application Number',
      'Status',
      'Final Amount',
      'Interest Rate (%)',
      'Tenure (months)',
      'EMI',
      'BRE Score',
      'BRE Decision',
      'Created Date',
      'Approved Date',
      'Disbursed Date',
    ],
    rows: applications.map(app => [
      app.application_number,
      app.status.replace('_', ' '),
      app.final_amount || '',
      app.final_interest_rate || '',
      app.final_tenure_months || '',
      app.final_emi || '',
      app.bre_score || '',
      app.bre_decision?.replace('_', ' ') || '',
      new Date(app.created_at).toLocaleDateString(),
      app.approved_at ? new Date(app.approved_at).toLocaleDateString() : '',
      app.disbursed_at ? new Date(app.disbursed_at).toLocaleDateString() : '',
    ]),
  };
}

/**
 * Format analytics summary for export
 */
export function formatAnalyticsSummary(data: {
  totalLeads: number;
  totalApplications: number;
  approvedCount: number;
  rejectedCount: number;
  disbursedAmount: number;
  avgProcessingDays: number;
  conversionRate: number;
  stpRate: number;
}): ExportData {
  return {
    headers: ['Metric', 'Value'],
    rows: [
      ['Total Leads', data.totalLeads],
      ['Total Applications', data.totalApplications],
      ['Approved Applications', data.approvedCount],
      ['Rejected Applications', data.rejectedCount],
      ['Total Disbursed Amount', data.disbursedAmount],
      ['Average Processing Days', data.avgProcessingDays],
      ['Conversion Rate (%)', (data.conversionRate * 100).toFixed(2)],
      ['STP Rate (%)', (data.stpRate * 100).toFixed(2)],
    ],
  };
}
